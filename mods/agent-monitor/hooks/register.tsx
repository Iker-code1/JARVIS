import { atom, read, update } from 'claude-code'
import type { EngineInterface, Register } from 'claude-code'

import type { Board } from '../types'
import {
  applyComplete,
  applySpawn,
  applyTool,
  clearFinished,
  describeTool,
  elapsed,
  EMPTY,
  runningCount,
} from './board'

const PANE = 'agent-monitor'
const board = atom({ plugin: 'agent-monitor', key: 'board' } as const, EMPTY)
const tick = atom({ plugin: 'agent-monitor', key: 'tick' } as const, 0)

async function refreshStatus($: EngineInterface): Promise<void> {
  const { value = EMPTY } = await $.state.get({ plugin: 'agent-monitor', key: 'board' } as const)
  const n = runningCount(value as Board)
  $.ui.status(n > 0 ? `agentes activos: ${n}` : undefined)
}

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    await $.command.register({
      name: 'avance',
      description: 'Panel con el avance de los agentes (usa "limpiar" para quitar los terminados)',
      argumentHint: '[limpiar]',
    })
    // Refresca el tiempo transcurrido solo mientras haya agentes corriendo.
    $.clock.every(2000, () => {
      void (async () => {
        const { value = EMPTY } = await $.state.get({ plugin: 'agent-monitor', key: 'board' } as const)
        if (runningCount(value as Board) > 0) await update($, tick, n => (n ?? 0) + 1)
      })()
    })
    return next(e)
  })

  on('command.run', { command: 'avance' }, async ($, e) => {
    if (e.args.trim() === 'limpiar') {
      await update($, board, b => clearFinished(b ?? EMPTY))
      await refreshStatus($)
      return { text: 'Agentes terminados quitados del panel.' }
    }
    await $.ui.open({ id: PANE, title: 'Avance de agentes' })
    return { text: 'Panel de avance abierto.' }
  })

  on('tool.call', async ($, e, next) => {
    const now = await $.clock.now()
    const summary = describeTool(String(e.tool), e as unknown as Record<string, unknown>)
    await update($, board, b => applyTool(b ?? EMPTY, { agentId: e.agentId, summary, now }))
    return next(e)
  })

  on('agent.spawn', async ($, e, next) => {
    const started = await next(e)
    if (started.deny === undefined && started.agentId !== undefined) {
      const now = await $.clock.now()
      const id = started.agentId
      await update($, board, b =>
        applySpawn(b ?? EMPTY, {
          id,
          label: e.description,
          type: e.subagentType,
          model: started.model,
          now,
        }),
      )
      await refreshStatus($)
    }
    return started
  })

  on('turn.complete', async ($, e, next) => {
    const done = await next(e)
    if (e.agentId !== undefined) {
      const agentId = e.agentId
      const now = await $.clock.now()
      await update($, board, b =>
        applyComplete(b ?? EMPTY, { agentId, ok: e.reason === 'answer', now }),
      )
      await refreshStatus($)
    }
    return done
  })

  on('ui.render', { component: 'Pane', requestId: PANE }, async ($, e) => {
    const { Box, Text } = $.ui.resolve(e)
    const b = await read($, board)
    await read($, tick)
    const now = await $.clock.now()
    const room = Math.max(1, (e.viewport?.rows ?? 24) - 6)
    const running = runningCount(b)

    return (
      <Box flexDirection="column">
        <Text bold>
          Agentes: {running} activos / {b.agents.length} en total
        </Text>
        <Text dimColor>
          Sesion principal: {b.main.tools} herramientas {b.main.last === '' ? '' : `· ${b.main.last}`}
        </Text>
        {b.agents.length === 0 && <Text dimColor>Todavia no hay agentes.</Text>}
        {b.agents.slice(-room).map(a => (
          <Box flexDirection="column">
            <Text color={a.status === 'failed' ? 'error' : a.status === 'done' ? 'success' : 'warning'}>
              {a.status === 'running' ? '▶' : a.status === 'done' ? '✓' : '✗'} {a.label} ({a.type},{' '}
              {a.model}) {elapsed(a, now)} · {a.tools} herramientas
            </Text>
            {a.last !== '' && <Text dimColor>   {a.last}</Text>}
          </Box>
        ))}
      </Box>
    )
  })
}
