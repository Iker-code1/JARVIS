import type { Register } from 'claude-code'

import { BUILDER_PROMPT, builderTask, parseTell, PLANNER_PROMPT } from './prompts'

type Role = 'planner' | 'builder'

export const register: Register = (on, options) => {
  // rol -> tarea que espera ese agente. Se pierde si el modulo se recarga.
  const waiting = new Map<Role, string>()
  const plannerModel = String(options.plannerModel ?? 'inherit')
  const builderModel = String(options.builderModel ?? 'inherit')

  on('session.start', async ($, e, next) => {
    await $.agent.register({
      name: 'planner',
      description: 'Planifica una tarea sin editar nada y devuelve un plan numerado',
      prompt: PLANNER_PROMPT,
      tools: ['Read', 'Grep', 'Glob', 'Bash', 'WebFetch', 'SendMessage'],
      model: plannerModel,
    })
    await $.agent.register({
      name: 'builder',
      description: 'Ejecuta un plan ya hecho y verifica el resultado',
      prompt: BUILDER_PROMPT,
      model: builderModel,
    })
    await $.command.register({
      name: 'plan-build',
      description: 'Un agente planifica y otro construye',
      argumentHint: '<tarea>',
    })
    await $.command.register({
      name: 'tell',
      description: 'Manda un mensaje a otra sesion',
      argumentHint: '<sessionId> <mensaje>',
    })
    await $.command.register({ name: 'whoami', description: 'Muestra el id de esta sesion' })
    return next(e)
  })

  on('command.run', { command: 'plan-build' }, async ($, e) => {
    const task = e.args.trim()
    if (task === '') return { text: 'Uso: /plan-build <tarea>' }
    const started = await $.agent.spawn({
      subagentType: 'plan-build:planner',
      name: 'planner',
      description: `Planificar: ${task.slice(0, 40)}`,
      prompt: task,
    })
    if (started.deny !== undefined) {
      return { text: `No se pudo lanzar al planificador: ${started.deny}` }
    }
    waiting.set('planner', task)
    return { text: 'Planificador trabajando; cuando termine arranca el constructor solo.' }
  })

  // El constructor arranca cuando el planificador entrega, y al terminar el
  // constructor se avisa a la sesion principal.
  on('turn.complete', async ($, e, next) => {
    const done = await next(e)
    if (e.agentId === undefined) return done
    // Solo los agentes que lanzo este mod: se reconocen por su tipo en la lista.
    const roster = await $.agent.list()
    const agent = roster.find(a => a.id === e.agentId && a.spawnedBy === $.plugin.name)
    const role: Role | undefined =
      agent?.type === 'plan-build:planner'
        ? 'planner'
        : agent?.type === 'plan-build:builder'
          ? 'builder'
          : undefined
    const task = role === undefined ? undefined : waiting.get(role)
    if (role === undefined || task === undefined) return done
    waiting.delete(role)

    if (e.reason !== 'answer' || e.answer.trim() === '') {
      $.ui.toast(`plan-build: el ${role} no termino (${e.reason})`)
      return done
    }
    if (role === 'planner') {
      $.ui.toast('plan-build: plan listo, arranca el constructor')
      const built = await $.agent.spawn({
        subagentType: 'plan-build:builder',
        name: 'builder',
        description: `Construir: ${task.slice(0, 40)}`,
        prompt: builderTask(task, e.answer),
      })
      if (built.deny !== undefined) {
        $.ui.toast(`plan-build: no se pudo lanzar al constructor: ${built.deny}`)
      } else {
        waiting.set('builder', task)
      }
      return done
    }
    $.ui.toast('plan-build: el constructor termino')
    await $.prompt.submit({
      text: `[plan-build] El constructor termino la tarea "${task}". Su reporte:\n\n${e.answer}`,
    })
    return done
  })

  on('command.run', { command: 'whoami' }, async $ => {
    const id = await $.session.id()
    return { text: `Esta sesion es ${id}. Desde otra: /tell ${id} <mensaje>` }
  })

  on('command.run', { command: 'tell' }, async ($, e) => {
    const parsed = parseTell(e.args)
    if (parsed === undefined) return { text: 'Uso: /tell <sessionId> <mensaje>' }
    const sent = await $.session.send({ to: { sessionId: parsed.sessionId }, text: parsed.text })
    return { text: sent.isDelivered ? 'Mensaje entregado.' : `No se entrego: ${sent.reason}` }
  })

  on('session.receive', { origin: { kind: 'peer-send-message' } }, ($, e, next) => {
    $.ui.toast(`Mensaje de otra sesion: ${e.text.slice(0, 80)}`)
    return next(e)
  })
}
