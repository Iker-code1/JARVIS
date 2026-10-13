import type { AgentRow, Board } from '../types'

export const EMPTY: Board = { main: { tools: 0, last: '' }, agents: [] }
const MAX_ROWS = 40

export function describeTool(tool: string, input: Record<string, unknown>): string {
  const detail = input.file_path ?? input.command ?? input.pattern ?? input.description ?? input.url ?? ''
  return `${tool} ${String(detail)}`.trim().slice(0, 60)
}

export function applySpawn(
  b: Board,
  s: { id: string; label: string; type: string; model: string; now: number },
): Board {
  const row: AgentRow = {
    id: s.id,
    label: s.label,
    type: s.type,
    model: s.model,
    status: 'running',
    startedAt: s.now,
    tools: 0,
    last: '',
  }
  return { ...b, agents: [...b.agents.filter(a => a.id !== s.id), row].slice(-MAX_ROWS) }
}

export function applyTool(
  b: Board,
  t: { agentId?: string | undefined; summary: string; now: number },
): Board {
  if (t.agentId === undefined) {
    return { ...b, main: { tools: b.main.tools + 1, last: t.summary } }
  }
  const known = b.agents.some(a => a.id === t.agentId)
  const base: Board = known
    ? b
    : applySpawn(b, { id: t.agentId, label: t.agentId.slice(0, 8), type: '?', model: '?', now: t.now })
  return {
    ...base,
    agents: base.agents.map(a =>
      a.id === t.agentId
        ? { ...a, status: 'running', endedAt: undefined, tools: a.tools + 1, last: t.summary }
        : a,
    ),
  }
}

export function applyComplete(
  b: Board,
  c: { agentId: string; ok: boolean; now: number },
): Board {
  return {
    ...b,
    agents: b.agents.map(a =>
      a.id === c.agentId ? { ...a, status: c.ok ? 'done' : 'failed', endedAt: c.now } : a,
    ),
  }
}

export function clearFinished(b: Board): Board {
  return { ...b, agents: b.agents.filter(a => a.status === 'running') }
}

export function runningCount(b: Board): number {
  return b.agents.filter(a => a.status === 'running').length
}

export function elapsed(a: AgentRow, now: number): string {
  const s = Math.max(0, Math.round(((a.endedAt ?? now) - a.startedAt) / 1000))
  return s < 60 ? `${s}s` : `${Math.floor(s / 60)}m${String(s % 60).padStart(2, '0')}s`
}
