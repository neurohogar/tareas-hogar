# Paquete: esfuerzo

Cada tarea puede tener un esfuerzo estimado (rápida, media o larga), elegido en el panel y mostrado en la fila; el botón "Solo rápidas" de Pendientes deja ver solo las rápidas. Se implementa después de Pausar.

## Specs

- **S1** (§4.1): «| `esfuerzo` | `rapida` \| `media` \| `larga` | no | Esfuerzo estimado: rápida (≤ 5 min), media (≈ 15 min), larga. Sin el campo, sin estimar. |»
- **S2** (§6.1): «**Solo rápidas**: un botón conmutable "Solo rápidas" junto a los chips de etiqueta (se ve aunque no haya etiquetas). Encendido, la lista muestra solo las tareas con `esfuerzo` = `rapida`, en el mismo orden; se combina con el filtro por etiqueta (las dos condiciones a la vez) y aplica también a completadas y pausadas cuando se muestran. Si deja la lista vacía, se ve "No hay tareas rápidas" (con una etiqueta elegida, "No hay tareas con esta etiqueta"). Como el filtro por etiqueta: se mantiene al ir a otra pantalla y volver, y vuelve a apagado al recargar o al abrir la app.»
- **S3** (§6.1): «Si la tarea tiene esfuerzo, su nivel en texto chico: "Rápida", "Media" o "Larga". Sin esfuerzo, nada.»
- **S4** (§6.2): «**Esfuerzo** (opcional, cualquier tipo): un selector con "Sin estimar" (el valor inicial), "Rápida (≤ 5 min)", "Media (≈ 15 min)" y "Larga".»
- **S5** (§7): «La unidad de conflicto es cada campo de la §4.1.»

## Decisiones

- D1 (2026-10-28, usuario, cómo se estima y se usa el esfuerzo): «3 niveles + filtro (Recomendado)»

## Artefactos

- Gherkin: `features/esfuerzo-de-tarea.feature` (S1, S3, S4, S5), `features/solo-rapidas.feature` (S2)
- QA: `qa/esfuerzo.md`

## core

- **Puede editar**: `src/lib/core/tarea.ts`, `src/lib/core/creacion.ts`, `src/lib/core/creacion.test.ts`, `src/lib/core/crear-periodica-calendario.ts`, `src/lib/core/datos-de-tarea.ts`, `src/lib/core/edicion.ts`, `src/lib/core/edicion.test.ts`, `src/lib/core/documento-de-tarea.ts`, `src/lib/core/documento-de-tarea.test.ts`, `src/lib/core/esfuerzo*.ts`, `src/lib/core/solo-rapidas*.ts`, `src/lib/core/*.test.ts`
- **Reglas**: S1, S2 (qué filas quedan y el texto de lista vacía; que el botón se mantenga entre pantallas es de ui), S3 (el texto del nivel), S4 (el valor que guarda cada opción; "Sin estimar" es sin el campo), S5
- **Reusa**:
  - `crearTarea` y `DatosComunes` (`creacion.ts`): el esfuerzo es un campo común a todo tipo, como emoji y nota; `crearSegunDatos` y `datosDeTarea` (`datos-de-tarea.ts`) siguen siendo inversas.
  - `editar` (`edicion.ts`): el esfuerzo entra en el cambio solo si cambió, y null lo quita; cambiar el tipo no lo toca (no es un campo de tipo).
  - `filasDePendientes` (`pendientes.ts`) y `filtrarPorEtiqueta` (`filtro-por-etiqueta.ts`): Solo rápidas filtra esas mismas filas (incluidas las completadas y las pausadas que se muestran) sin cambiar su orden.
- **Notas**: las firmas exportadas que ya usan `acceptance/` y la UI siguen compatibles (solo campos y parámetros nuevos opcionales).
- **Gate**: `node scripts/gate.ts core`

## acceptance

- **Puede editar**: `acceptance/steps/esfuerzo.ts`, `acceptance/steps/index.ts`, `acceptance/steps/world.ts`, `acceptance/steps/pendientes.ts`, `acceptance/steps/edicion.ts`, `acceptance/oracle*.ts`, `acceptance/equivalence.ts`, `docs/pipeline/pendientes.txt`
- **Features a conectar**: `features/esfuerzo-de-tarea.feature`, `features/solo-rapidas.feature`
- **Pasos nuevos** (los de pausar, `Mostrar pausadas está encendido`, `la tarea <titulo> fue pausada` y `Pendientes muestra como pausadas <titulos>`, ya existen):
  - `creo una tarea puntual con título <titulo> y esfuerzo <esfuerzo>`
  - `creo una tarea periódica relativa con título <titulo> cada <cada> <unidad> y esfuerzo <esfuerzo>`
  - `creo una tarea periódica semanal con título <titulo> los <dias> y esfuerzo <esfuerzo>`
  - `una tarea puntual sin fecha límite con esfuerzo <esfuerzo>`
  - `la tarea <titulo> tiene esfuerzo <esfuerzo>`
  - `elijo el esfuerzo <esfuerzo>`
  - `otro dispositivo, sin ver ese cambio, elige el esfuerzo <esfuerzo>`
  - `su esfuerzo es <esfuerzo>`
  - `la fila de la tarea muestra el esfuerzo <texto>` y `la fila de la tarea no muestra esfuerzo`
  - `Solo rápidas está <estado>` (encendido o apagado)
  - `Pendientes muestra el texto <texto>`
- **Notas**: cambiar el tipo en el panel conserva el esfuerzo (`camposQueConserva` en `edicion.ts`).
- **Gate**: `node scripts/gate.ts acceptance`

## ui

- **Puede editar**: `src/lib/ui/PanelTarea.svelte`, `src/lib/ui/FilaTarea.svelte`, `src/lib/ui/Pendientes.svelte`, `src/lib/ui/sesion.ts`, `src/lib/ui/Sesion.svelte`, `src/lib/adapters/repositorio.ts`
- **Comportamiento visible**: `qa/esfuerzo.md`
- **Notas**: Solo rápidas vive en la sesión, como el filtro por etiqueta (se mantiene entre pantallas, vuelve a apagado al recargar); `esfuerzo` se lee y escribe en `repositorio.ts` como un campo independiente.
- **Gate**: `node scripts/gate.ts ui`

## cleaner · architect · hardener · qa

Trabajan sobre todo lo que cambió la feature (`git diff $(git merge-base v2 HEAD)`); no necesitan sección propia salvo que el specifier anote algo para ellos acá.

## Log

- L1 (2026-10-28): el pedido original del usuario no llegó al specifier; el spec (commit `116db17`, «Especificar esfuerzo estimado y el filtro Solo rápidas») y la decisión D1 lo reflejan. Pedido del orquestador para este paquete: «docs/pipeline/paquetes/esfuerzo.md — §4.1 (esfuerzo), §6.1 (Solo rápidas, texto del nivel), §6.2 (selector Esfuerzo). Gherkin: esfuerzo-de-tarea, solo-rapidas. QA: qa/esfuerzo.md.»
