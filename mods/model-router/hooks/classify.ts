export type Route = 'light' | 'heavy'

// Tipos de subagente que solo leen o buscan: siempre van al modelo barato.
export const LIGHT_TYPES = ['Explore', 'claude-code-guide', 'statusline-setup']

const HEAVY =
  /\b(implement\w*|refactor\w*|debug\w*|architect\w*|design\w*|security|migrat\w*|optimi[sz]\w*|fix\w*|write|build|diseñ\w*|implementa\w*|depura\w*|arquitectura|seguridad|migra\w*|optimiza\w*|arregla\w*|corrige\w*|construy\w*|escribe)\b/i
const LIGHT =
  /\b(search|find|list|read|summari[sz]e|grep|locate|look ?up|explore|inspect|count|busca\w*|encuentra|lista\w*|lee|lectura|resume\w*|localiza\w*|explora\w*|cuenta)\b/i

const MAX_LIGHT_PROMPT = 1500

export type Candidate = { subagentType: string; prompt: string; description: string }

export function classify(c: Candidate): Route {
  if (LIGHT_TYPES.includes(c.subagentType)) return 'light'
  const text = `${c.description}\n${c.prompt}`
  if (HEAVY.test(text)) return 'heavy'
  if (c.prompt.length <= MAX_LIGHT_PROMPT && LIGHT.test(text)) return 'light'
  return 'heavy'
}

export type Stats = { light: number; heavy: number; kept: number }
export const EMPTY_STATS: Stats = { light: 0, heavy: 0, kept: 0 }
