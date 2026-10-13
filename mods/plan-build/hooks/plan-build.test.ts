import { describe, expect, test } from 'claude-code/testing'

import { builderTask, parseTell } from './prompts'

describe('prompts', () => {
  test('parseTell separa id y mensaje', () => {
    expect(parseTell('abc hola mundo')).toEqual({ sessionId: 'abc', text: 'hola mundo' })
    expect(parseTell('solo')).toBe(undefined)
  })
  test('el prompt del constructor lleva tarea y plan', () => {
    const p = builderTask('T', 'P')
    expect(p).toContain('T')
    expect(p).toContain('P')
  })
})

const done = (agentId: string, answer: string) => ({
  answer,
  durationMs: 1,
  isAborted: false,
  turnId: 'x',
  agentId,
  reason: 'answer' as const,
})

const info = (id: string, type: string) => ({
  id,
  description: 'x',
  type,
  status: 'completed' as const,
  spawnedBy: 'plan-build',
})

describe('flujo plan -> build', () => {
  test('al terminar el planificador arranca el constructor con el plan', async ($, on) => {
    const spawned: { type: string; prompt: string }[] = []
    on('agent.spawn', (_$, e) => {
      spawned.push({ type: e.subagentType, prompt: e.prompt })
      return { model: 'opus', agentId: spawned.length === 1 ? 'p1' : 'b1' }
    })
    on('agent.list', () => ({
      value: [info('p1', 'plan-build:planner'), info('b1', 'plan-build:builder')],
    }))
    on('turn.complete', (_$, e) => ({ text: e.answer }))
    on('ui.toast', () => ({ value: undefined }))
    const submitted: string[] = []
    on('prompt.submit', (_$, e) => {
      submitted.push(e.text)
      return { ...e }
    })

    const r = await $.command.run({ command: 'plan-build', args: 'agregar login' } as never)
    expect(r.text).toContain('Planificador')
    await $.turn.complete(done('p1', '1. editar auth.ts'))
    expect(spawned.length).toBe(2)
    expect(spawned[1]!.prompt).toContain('1. editar auth.ts')
    expect(spawned[1]!.prompt).toContain('agregar login')

    await $.turn.complete(done('b1', 'listo'))
    expect(submitted.length).toBe(1)
    expect(submitted[0]).toContain('listo')
  })

  test('un turno de otro agente no dispara nada', async ($, on) => {
    let n = 0
    on('agent.spawn', () => {
      n++
      return { model: 'opus', agentId: 'z' }
    })
    on('agent.list', () => ({ value: [info('otro', 'general-purpose')] }))
    on('turn.complete', (_$, e) => ({ text: e.answer }))
    on('ui.toast', () => ({ value: undefined }))
    await $.turn.complete(done('otro', 'hola'))
    expect(n).toBe(0)
  })

  test('/plan-build sin tarea muestra el uso', async $ => {
    const r = await $.command.run({ command: 'plan-build', args: '  ' } as never)
    expect(r.text).toContain('Uso')
  })
})
