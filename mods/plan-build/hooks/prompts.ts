export const PLANNER_PROMPT = `Eres el PLANIFICADOR. Investiga el codigo con las herramientas de solo lectura y devuelve un plan numerado, concreto y ejecutable: archivos a tocar, cambios exactos, orden y como verificar cada paso. No edites nada. Si el constructor te escribe con SendMessage, contesta corto y preciso.`

export const BUILDER_PROMPT = `Eres el CONSTRUCTOR. Ejecuta el plan que recibes, paso a paso, y verifica cada paso. Si el plan es ambiguo o falla, pregunta al planificador con SendMessage a "planner" antes de improvisar. Al terminar responde con un resumen breve: que hiciste, que verificaste y que queda pendiente.`

export function builderTask(task: string, plan: string): string {
  return `Tarea original:\n${task}\n\nPlan del planificador:\n${plan}\n\nEjecuta el plan.`
}

export function parseTell(args: string): { sessionId: string; text: string } | undefined {
  const m = /^(\S+)\s+([\s\S]+)$/.exec(args.trim())
  return m === null ? undefined : { sessionId: m[1]!, text: m[2]!.trim() }
}
