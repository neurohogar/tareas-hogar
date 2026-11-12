# Orquestación del pipeline

Lo ejecuta el orquestador: el agente `orchestrator` de `.claude/agents/`, en Sonnet. Los roles están en la misma carpeta; la constitución en `CLAUDE.md`.

Para orquestar, abrir la sesión con `claude --agent orchestrator`: así la conversación entera corre en el modelo del orquestador. Desde una sesión abierta con otro modelo, lanzar al `orchestrator` como subagente; en ese caso no puede hablar con el usuario y devuelve cada pregunta como `STATUS: QUESTION`.

Los roles no cargan el `CLAUDE.md` global ni el del proyecto (`omitClaudeMd`): cada uno lee el del proyecto al empezar. Tienen solo las herramientas que lista su archivo.

## Topología

| Rol | Dónde trabaja | Rama |
|---|---|---|
| analyst, spec-writer, gherkin-writer | checkout principal (`~/Work/tareas-hogar`) | `v3` |
| core, acceptance, ui, cleaner, architect, hardener, qa | worktree compartido `~/Work/tareas-hogar-worktrees/pipeline` | `wt/pipeline` |

Los siete roles de implementación se suceden en el mismo worktree: cada uno empieza donde dejó el commit del anterior, sin merges entre roles. El specifier queda aparte para poder especificar la próxima feature mientras corre la cadena de la actual.

## Preparación (una vez)

1. `git worktree add ~/Work/tareas-hogar-worktrees/pipeline -b wt/pipeline v3`.
2. `gentle-ai codegraph init --cwd ~/Work/tareas-hogar-worktrees/pipeline` (índice propio).

Listo cuando `git worktree list` muestra el worktree `pipeline` en `wt/pipeline`.

## Una feature

1. **analyst** — escribir la ruta del paquete (`docs/pipeline/paquetes/<feature>.md`) en `tmp/paquete-actual` del checkout principal, con el árbol limpio (el gate de los roles de especificación exige commit propio y árbol limpio), y lanzarlo con el pedido del usuario textual. Si reporta `QUESTION`, hacerle al usuario cada pregunta de `NOTES`, **de a una**, con la interfaz de selección y las opciones tal cual; anotar cada respuesta textual en `## Decisiones` del paquete (`Dn (fecha, usuario): «…»`) y relanzar al analyst. Repetir hasta `DONE`.
2. **spec-writer** — lanzarlo con el paquete. Si reporta `QUESTION`, igual que arriba y relanzarlo.
3. **gherkin-writer** — lanzarlo con el paquete. Si reporta `QUESTION`, igual que arriba; si la respuesta cambia una regla, vuelve al spec-writer.
4. **Aprobación** — mostrar al usuario los `.feature` y el procedimiento QA nuevos (rutas + resumen de escenarios). Si pide cambios en reglas, vuelve al spec-writer; si solo en escenarios, al gherkin-writer. Continuar solo con aprobación explícita.

Features distintas pueden especificarse en paralelo si sus spec-writers tocan secciones distintas de `docs/spec.md` (el orquestador lo verifica con las secciones que nombra cada paquete); si se pisan, van en secuencia.

5. **core → acceptance → ui → cleaner → architect → hardener → qa** — el rol siguiente y su prompt los da `node scripts/pipeline.ts` (lanzarlo con ese prompt tal cual, más la sección de aprendizajes de la plantilla y sin otro contexto); antes de lanzar al core, escribir la ruta del paquete en `~/Work/tareas-hogar-worktrees/pipeline/tmp/paquete-actual` (el gate la usa para verificar la superficie de cada rol); `node scripts/pipeline.ts` anota en `tmp/base-de-feature` del worktree el `v3` del que parte la feature (un retrabajo adelanta `v3` sin mover esa base); el core empieza con `git merge --no-edit v3` en el worktree compartido; los demás, sin merge; lanzar cada uno en secuencia con la plantilla y el procedimiento de abajo, esperando su reporte antes del siguiente. Si `node scripts/pipeline.ts` imprime una línea `SALTEAR: <rol>`, correr el comando que trae en lugar de lanzar al rol: si da 0, el rol quedó hecho con un commit vacío `By <rol>.` y se pide el siguiente; si da 1, lanzar al rol como siempre. Solo se saltean `core` y `ui` (cuando su sección del paquete no lista archivos) y `cleaner` y `architect` (cuando la feature no tocó `src/lib/core/` y su gate pasa); `acceptance`, `hardener` y `qa` corren siempre. Avanzar solo con `STATUS: DONE` **verificado**: el commit del reporte es `HEAD` del worktree compartido y `node scripts/gate.ts <rol>` da `OK` (el hook `SubagentStop` ya lo corrió; el orquestador lo vuelve a correr solo si el hook no lo hizo o el reporte no coincide). Un `DONE` cuyo gate falla es un `BLOCKED`.
6. **Sync** — al `DONE` de qa:
   - En el checkout principal: `git merge --ff-only wt/pipeline` (si `v3` avanzó con otros commits, `git merge --no-edit wt/pipeline`).
   - En el worktree compartido: `git merge --ff-only v3`.
7. **Cierre** — reportar al usuario: escenarios cubiertos, gates finales (del reporte de qa y hardener), commits. Preguntar por la próxima feature.

Una feature está terminada cuando `v3` contiene el commit de qa y el worktree compartido está en el mismo commit que `v3`.

## Plantilla de lanzamiento

```
Rol: <rol>. Feature: <nombre>.
Worktree: ~/Work/tareas-hogar-worktrees/pipeline. Antes de empezar: cd a esa ruta<; solo core: y `git merge --no-edit v3`>.
<Para analyst: el pedido del usuario, textual, y el nombre de la feature (el paquete se llama así).>
<Para los demás: Paquete: docs/pipeline/paquetes/<feature>.md. Nada más: todo lo que el rol necesita está en el paquete.>
<En reintentos: feedback del intento anterior, textual.>

Aprendizajes del rol (leelos antes de empezar):
<la lista completa de la memoria del rol>
```

Los aprendizajes van siempre en el prompt, en todos los roles y reintentos: dejarlos a cargo del rol no funciona, porque varios no los buscan. Para obtenerlos: `mem_search` con `query: "Aprendizajes del rol <rol>"`, `project: "tareas-hogar"`, `type: "learning"`, `limit: 20`; elegir el resultado cuyo `topic_key` es `pipeline/aprendizajes/<rol>` (el primero puede ser de otro rol) y leerlo entero con `mem_get_observation`. Si Engram no responde, lanzar igual y decir en el prompt que no hay aprendizajes.

## Lanzar y seguir un rol

El usuario tiene que ver el progreso sin preguntar. Mientras un rol corre en primer plano, el orquestador no puede escribir en el chat: por eso todo rol se lanza en segundo plano.

1. **Anunciar** en una línea el rol, su número en la cadena y el `ESTIMADO:` de `node scripts/pipeline.ts`.
2. **Seguir**: lanzar un `Monitor` con la línea `SEGUIR:` de `pipeline.ts` y `timeout_ms: 1800000`. Si expira, rearmarlo con la misma línea más `--continuar`, que conserva el tiempo del rol y lo anotado mientras tanto.
3. **Lanzar** el rol con `Agent` y `run_in_background: true` (o `delegate_task` si corre en un provider distinto al del orquestador en T3 Code). El hook `SubagentStop` funciona igual: le devuelve al rol los errores del gate.
4. **Avisar**: por cada evento del `Monitor`, una línea corta al usuario con la fase y el tiempo respecto del estimado. Si un resumen dice que no hay novedades hace 15 minutos o más, investigar (procesos y `tmp/progreso.log`) y decirlo.
5. **Cerrar**: cuando llega la notificación del rol, parar el `Monitor` con `TaskStop`, verificar el `DONE` y decir cuánto tardó contra el estimado.

El analyst no sale de `pipeline.ts`: su `SEGUIR` es `node scripts/progreso.ts analyst`, y su prompt lleva la línea `Progreso:` con `~/Work/tareas-hogar/tmp/progreso.log`.

Mientras tanto, el orquestador termina su turno y no espera con `sleep`: lo despiertan los eventos.

Si el rol se interrumpe antes de que llegue su reporte, leer `tmp/reporte-<rol>.txt` de donde trabaja. Vale solo si su `COMMIT` es el `HEAD`; recién ahí correr el gate.

## Retrabajo de specs a mitad de la cadena

Cuando un rol posterior necesita un cambio en `features/` o `qa/` (son del gherkin-writer; si cambia una regla, del spec-writer):

1. En el checkout principal: `git merge --ff-only wt/pipeline`. Así el gherkin-writer edita sobre los manifests de mutación y los cambios de ese rol, sin conflictos.
2. Lanzar (o continuar) al gherkin-writer (o al spec-writer, si cambia una regla) con el cambio, textual.
3. Si el cambio solo toca `features/`/`qa/` y los step handlers existentes lo cubren, relanzar el rol que lo pidió con `git merge --no-edit v3`. Si exige cambiar step handlers o código, el trabajo vuelve a entrar por el core (o por acceptance, si solo cambian handlers) y recorre la cadena desde ahí.

## Fallas

- `BLOCKED` o gate que no pasa — relanzar el mismo rol con el `NOTES` (o la salida del gate) como feedback. El primer reintento usa el modelo del rol con un nivel más de `effort` en el lanzamiento (`low` → `medium` → `high`); el segundo, `model: opus` en el lanzamiento, aunque el rol sea más barato, con el prompt de `node scripts/pipeline.ts --opus` (firma con Opus). Tras 2 reintentos sin `DONE`, frenar y presentar el bloqueo al usuario.
- Duda de diseño que no es de producto y que ni el paquete ni el spec resuelven — lanzar al agente `consultor` (Fable) con la pregunta cerrada, las opciones y las rutas a leer. Es el único uso de Fable en el pipeline.
- `LEARNINGS` en un reporte — agregar cada línea a la memoria del rol que la pisaría (`mem_save` con `topic_key: pipeline/aprendizajes/<rol>`, reescribiendo la lista completa), si no está ya. Una línea por trampa, sin historia.
- `QUESTION` de un rol de implementación (un hueco del spec) — hacerle al usuario la pregunta de `NOTES`, tal cual, y anotar la respuesta textual en `## Decisiones` del paquete. Si cambia o agrega una regla: spec-writer → gherkin-writer (con sus gates), y después relanzar el rol que preguntó. Si solo aclara, relanzarlo directo.
- qa reporta contradicción entre la suite QA y el Gherkin o los unit tests — siempre al usuario; la respuesta vuelve al spec-writer o al gherkin-writer.
- Falla de entorno (herramienta ausente, dependencia rota) repetida 2 veces — frenar y pedir intervención al usuario; no reparar el sistema operativo.

## Estado en Engram

El orquestador mantiene `pipeline/estado` (proyecto `tareas-hogar`): qué feature está en qué fase, el paquete actual y lo que espera una decisión del usuario. Lo reescribe en cada cambio de fase y al cerrar una feature. Al empezar una sesión, o después de una compactación, lo lee primero (`mem_search` «Estado del pipeline», luego `mem_get_observation`) y lo concilia con `git log` y `git worktree list` antes de seguir.
