import { describe, expect, mock, test } from 'claude-code/testing'

import { classify } from './classify'

describe('classify', () => {
  test('Explore va a barato', () => {
    expect(classify({ subagentType: 'Explore', prompt: 'x', description: 'x' })).toBe('light')
  })
  test('buscar es ligero', () => {
    expect(
      classify({ subagentType: 'general-purpose', prompt: 'Busca donde se define foo', description: 'buscar foo' }),
    ).toBe('light')
  })
  test('implementar es pesado', () => {
    expect(
      classify({ subagentType: 'general-purpose', prompt: 'Implementa el login y busca ejemplos', description: 'login' }),
    ).toBe('heavy')
  })
  test('sin pistas es pesado', () => {
    expect(classify({ subagentType: 'general-purpose', prompt: 'hola', description: 'x' })).toBe('heavy')
  })
})

const spawn = {
  tool_use_id: 't1',
  prompt: 'Busca los archivos que usan fetch',
  description: 'buscar fetch',
  subagentType: 'general-purpose',
  provider: { plugin: 'x', tier: 'user' },
  parentModel: 'opus',
  background: false,
  fork: false,
} as const

describe('hook agent.spawn', () => {
  test('reescribe el modelo de una tarea ligera', async ($, on) => {
    mock.store(on)
    let seen: string | undefined
    on('agent.spawn', ($, e) => {
      seen = e.model
      return { model: e.model ?? 'opus', agentId: 'a1' }
    })
    await $.agent.spawn({ prompt: spawn.prompt, description: spawn.description } as never)
    expect(seen).toBe('haiku')
  })
  test('deja la tarea pesada sin modelo', async ($, on) => {
    mock.store(on)
    let seen: string | undefined = 'x'
    on('agent.spawn', ($, e) => {
      seen = e.model
      return { model: 'opus', agentId: 'a1' }
    })
    await $.agent.spawn({ prompt: 'Implementa el modulo de pagos', description: 'pagos' } as never)
    expect(seen).toBe(undefined)
  })
  test('/router off deja todo igual', async ($, on) => {
    mock.store(on)
    let seen: string | undefined = 'x'
    on('agent.spawn', ($, e) => {
      seen = e.model
      return { model: 'opus', agentId: 'a1' }
    })
    await $.command.run({ command: 'router', args: 'off' } as never)
    await $.agent.spawn({ prompt: spawn.prompt, description: spawn.description } as never)
    expect(seen).toBe(undefined)
  })
})
