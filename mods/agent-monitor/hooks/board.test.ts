import { describe, expect, mock, test } from 'claude-code/testing'

import { applyComplete, applySpawn, applyTool, clearFinished, describeTool, elapsed, EMPTY, runningCount } from './board'

describe('board', () => {
  test('la sesion principal cuenta herramientas', () => {
    const b = applyTool(EMPTY, { summary: 'Read a.ts', now: 0 })
    expect(b.main.tools).toBe(1)
    expect(b.main.last).toBe('Read a.ts')
  })
  test('un agente pasa de corriendo a terminado', () => {
    let b = applySpawn(EMPTY, { id: 'a1', label: 'buscar', type: 'Explore', model: 'haiku', now: 1000 })
    b = applyTool(b, { agentId: 'a1', summary: 'Grep foo', now: 2000 })
    expect(runningCount(b)).toBe(1)
    expect(b.agents[0]!.tools).toBe(1)
    b = applyComplete(b, { agentId: 'a1', ok: true, now: 5000 })
    expect(b.agents[0]!.status).toBe('done')
    expect(elapsed(b.agents[0]!, 99999)).toBe('4s')
    expect(runningCount(b)).toBe(0)
  })
  test('un agente fallido queda marcado y limpiar lo quita', () => {
    let b = applySpawn(EMPTY, { id: 'a1', label: 'x', type: 't', model: 'm', now: 0 })
    b = applyComplete(b, { agentId: 'a1', ok: false, now: 1 })
    expect(b.agents[0]!.status).toBe('failed')
    expect(clearFinished(b).agents.length).toBe(0)
  })
  test('una herramienta de un agente desconocido lo crea', () => {
    const b = applyTool(EMPTY, { agentId: 'zzzzzzzzzz', summary: 'Bash ls', now: 0 })
    expect(b.agents.length).toBe(1)
    expect(b.agents[0]!.status).toBe('running')
  })
  test('describeTool resume la entrada', () => {
    expect(describeTool('Read', { file_path: '/a/b.ts' })).toBe('Read /a/b.ts')
  })
})

const SURFACES = ['terminal', 'desktop'] as const

describe('panel', () => {
  for (const surface of SURFACES) {
    test(`dibuja agentes en ${surface}`, async ($, on) => {
      mock.clock(on, { now: 1000 })
      on('agent.spawn', () => ({ model: 'haiku', agentId: 'a1' }))
      on('tool.call', () => ({ result: 'ok' }))
      on('ui.status', () => ({ value: undefined }))
      await $.agent.spawn({ prompt: 'x', description: 'buscar fetch' } as never)
      const m = await $.ui.mount({
        plugin: 'agent-monitor',
        surface,
        component: 'Pane',
        props: { bodyColumns: 60 } as never,
        requestId: 'agent-monitor',
      })
      expect(await m.find({ text: /buscar fetch/ })).not.toBe(undefined)
    })
  }
})
