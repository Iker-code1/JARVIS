export type AgentRow = {
  id: string
  label: string
  type: string
  model: string
  status: 'running' | 'done' | 'failed'
  startedAt: number
  endedAt?: number
  tools: number
  last: string
}

export type Board = {
  main: { tools: number; last: string }
  agents: AgentRow[]
}

declare module 'claude-code' {
  interface PluginState {
    'agent-monitor': { board: Board; tick: number }
  }
}
