import type { Register } from 'claude-code'

import { classify, EMPTY_STATS, type Stats } from './classify'

export const register: Register = (on, options) => {
  const light = String(options.lightModel ?? 'haiku')

  on('session.start', async ($, e, next) => {
    await $.command.register({
      name: 'router',
      description: 'Enrutador de modelos: on | off | status',
      argumentHint: '[on|off|status]',
    })
    return next(e)
  })

  on('agent.spawn', async ($, e, next) => {
    const isOn = (await $.store.get('enabled')) !== false
    const stats = ((await $.store.get('stats')) as Stats | undefined) ?? EMPTY_STATS
    // Forks heredan el modelo del padre, y quien ya eligió modelo no se toca.
    if (!isOn || e.fork || e.workflow !== undefined || e.model !== undefined) {
      await $.store.set('stats', { ...stats, kept: stats.kept + 1 })
      return next(e)
    }
    const route = classify(e)
    await $.store.set('stats', { ...stats, [route]: stats[route] + 1 })
    if (route === 'light') {
      $.ui.status(`router: ${e.description} -> ${light}`)
      return next({ ...e, model: light })
    }
    return next(e)
  })

  on('command.run', { command: 'router' }, async ($, e) => {
    const arg = e.args.trim().toLowerCase()
    if (arg === 'on' || arg === 'off') {
      await $.store.set('enabled', arg === 'on')
      return { text: `Enrutador ${arg === 'on' ? 'activado' : 'desactivado'}.` }
    }
    const isOn = (await $.store.get('enabled')) !== false
    const s = ((await $.store.get('stats')) as Stats | undefined) ?? EMPTY_STATS
    return {
      text:
        `Enrutador: ${isOn ? 'activo' : 'apagado'} (modelo barato: ${light})\n` +
        `Ligeras -> ${light}: ${s.light} | Pesadas (modelo principal): ${s.heavy} | Sin tocar: ${s.kept}`,
    }
  })
}
