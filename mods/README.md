# Mods de JARVIS

Tres mods para Claude Code.

| Mod | Que hace | Comandos |
| --- | --- | --- |
| `model-router` | Manda las tareas ligeras de los subagentes (buscar, leer, listar) a un modelo barato (`haiku` por defecto) y deja las pesadas en el modelo principal. | `/router on`, `/router off`, `/router status` |
| `plan-build` | Un agente planifica (solo lectura) y otro construye con ese plan. El constructor puede preguntarle al planificador. Tambien manda mensajes a otras sesiones. | `/plan-build <tarea>`, `/whoami`, `/tell <sessionId> <mensaje>` |
| `agent-monitor` | Panel en vivo con el avance de la sesion y de cada agente: estado, herramientas usadas, tiempo. | `/avance`, `/avance limpiar` |

## Instalar (en una terminal de Claude Code)

```
/plugin install model-router --marketplace iker-code1/jarvis
/plugin install plan-build --marketplace iker-code1/jarvis
/plugin install agent-monitor --marketplace iker-code1/jarvis
```

Responde `y` para agregar el marketplace y elige el alcance `user`.

## Pruebas

```
claude plugin validate mods/<mod>
claude plugin test mods/<mod>
```
