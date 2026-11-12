# Paquete: posponer

Una tarea pendiente o atrasada se puede posponer desde el panel de edición (1 hora, 3 horas o hasta mañana a las 07:00): mientras dura, queda en espera, sin completarse, y vuelve sola al vencer. Se implementa después de Pausar.

## Specs

- **S1** (§4.1): «| `pospuesta` | `{ desde: timestamp, hasta: timestamp }` | no | Posponer (§5.9). |»
- **S2** (§5.9): «Posponer saca una tarea `pendiente` o `atrasada` de la urgencia por un rato, sin completarla.»
- **S3** (§5.9): «Opciones: **1 hora**, **3 horas** y **Hasta mañana** (07:00 del día local siguiente). Guarda `pospuesta = { desde: ahora, hasta }`.»
- **S4** (§5.9): «Mientras ahora < `pospuesta.hasta`, una tarea que según §5.1–§5.8 estaría `pendiente` o `atrasada` está **`en espera`**, con progreso = (ahora − `desde`) / (`hasta` − `desde`); vuelve en `hasta` (clave de orden de §6.1). Si estaría `en espera` por su propia regla, la posposición no cambia nada.»
- **S5** (§5.9): «Desde `pospuesta.hasta`, el estado vuelve a ser el de §5.1–§5.8 (puede ser `atrasada` en el acto si su atraso ya llegó). La posposición no mueve vencimientos ni fechas límite.»
- **S6** (§5.9): «Una tarea pospuesta no está completada (§6.1): se ve con **Mostrar completadas** apagado.»
- **S7** (§5.9): «Se puede completar mientras está pospuesta (salvo que el horario lo impida, §5.5): el checkbox está habilitado.»
- **S8** (§5.9): «**Quitar posponer** borra `pospuesta`. Completar, deshacer o editar no la borran; vence sola.»
- **S9** (§5.9): «Una tarea pausada (§5.8) no se puede posponer.»
- **S10** (§6.2): «**Posponer** (solo al editar una tarea `pendiente` o `atrasada` no pausada): un botón **Posponer** que ofrece **1 hora**, **3 horas** y **Hasta mañana**; elegir una actúa en el momento y cierra el panel. Si la tarea está pospuesta, el panel muestra "Pospuesta hasta HH:MM" (o "hasta mañana HH:MM") y un botón **Quitar posponer**, que también actúa en el momento.»
- **S12** (§5.9): «Si ahora < `pospuesta.desde` (relojes de dos dispositivos desfasados), la tarea sigue **`en espera`** con progreso 0 (barra vacía) hasta que el reloj alcance `desde`. Ejemplo: `pospuesta = { desde: 2026-07-15T08:05:00, hasta: 2026-07-15T09:05:00 }` y ahora = `2026-07-15T08:00:00`: `en espera`, progreso 0; a las `08:05:00` empieza a avanzar.»
- **S11** (§7): «`pospuesta` es un solo campo»

## Decisiones

- D1 (2026-10-28, usuario, cómo se elige hasta cuándo): «Opciones fijas (Recomendado)» (1 h, 3 h, hasta mañana 07:00).
- D2 (2026-11-02, usuario): «Barra en 0 (Recomendado)» — ante la pregunta: si los relojes de dos dispositivos están desfasados y una tarea queda pospuesta «desde» un momento futuro, ¿cómo se ve su barra de progreso? Opción: «La tarea sigue en espera con la barra vacía hasta que el reloj alcance ese momento.»

## Artefactos

- Gherkin: `features/posponer-tarea.feature` (S1, S2, S3, S8, S9, S10, S11), `features/estado-pospuesta.feature` (S4, S5, S7, S8, S9, S12), `features/orden-pospuesta.feature` (S4, S5, S6)
- QA: `qa/posponer.md`

## core

- **Puede editar**: `src/lib/core/tarea.ts`, `src/lib/core/documento-de-tarea.ts`, `src/lib/core/documento-de-tarea.test.ts`, `src/lib/core/estado-de-tarea.ts`, `src/lib/core/estado-de-tarea.test.ts`, `src/lib/core/completada.ts`, `src/lib/core/completada.test.ts`, `src/lib/core/checkbox.ts`, `src/lib/core/checkbox.test.ts`, `src/lib/core/pendientes.ts`, `src/lib/core/pendientes.test.ts`, `src/lib/core/urgencia.ts`, `src/lib/core/urgencia.test.ts`, `src/lib/core/pospo*.ts`, `src/lib/core/*.test.ts`
- **Reglas**: S1–S9, S11, S12, y de S10 qué botón ofrece el panel (Posponer, Quitar posponer o ninguno) y el texto "Pospuesta hasta HH:MM" / "Pospuesta hasta mañana HH:MM"
- **Reusa**:
  - `estadoDeTarea` (`estado-de-tarea.ts`) sigue siendo el único punto de entrada del estado: la posposición se aplica sobre el estado de §5.1–§5.8 (incluida la pausa de la feature Pausar, que gana: una pausada no tiene estado).
  - Lo que la feature Pausar exportó para saber si una tarea está pausada (S9).
  - `sumarDias`, `enElMinuto` y `dosDigitos` (`dias.ts`) para las 07:00 del día local siguiente y el texto HH:MM: `dias.ts` es el único módulo del core que arma fechas según la zona horaria (`check:arch`).
  - `CambioDeTarea` y `aplicarCambio` (`documento-de-tarea.ts`): posponer y quitar posponer escriben `pospuesta` como un solo campo (S11); `editar` no la toca (S8).
- **Notas**: las firmas exportadas que ya usan `acceptance/` y la UI siguen compatibles (solo parámetros nuevos opcionales).
- **Gate**: `node scripts/gate.ts core`

## acceptance

- **Puede editar**: `acceptance/steps/posponer.ts`, `acceptance/steps/pausar.ts`, `acceptance/steps/checkbox.ts`, `acceptance/steps/puntual.ts`, `acceptance/steps/index.ts`, `acceptance/steps/world.ts`, `acceptance/oracle*.ts`, `acceptance/equivalence.ts`, `docs/pipeline/pendientes.txt`
- **Features a conectar**: `features/posponer-tarea.feature`, `features/estado-pospuesta.feature`, `features/orden-pospuesta.feature`
- **Pasos nuevos** (los de pausar, `pauso la tarea`, `la tarea fue pausada`, `reanudo la tarea el <momento>` y `la tarea no tiene estado`, ya existen):
  - `pospongo la tarea con la opción <opcion> el <momento>`
  - `la tarea fue pospuesta con la opción <opcion> el <momento>` y `la tarea <titulo> fue pospuesta con la opción <opcion> el <momento>`
  - `otro dispositivo, sin ver ese cambio, pospone la tarea con la opción <opcion> el <momento>`
  - `quito la posposición`
  - `la tarea está pospuesta desde <desde> hasta <hasta>` y `la tarea no está pospuesta`
  - `abro la tarea en el panel de edición el <momento>` (la forma con momento de `abro la tarea en el panel de edición`, de pausar)
  - `el botón de posponer del panel es <boton>` (Posponer, Quitar posponer o ninguno)
  - `el panel de edición muestra <texto>` y `el panel de edición no dice que está pospuesta`
- **Gate**: `node scripts/gate.ts acceptance`

## ui

- **Puede editar**: `src/lib/ui/PanelTarea.svelte`, `src/lib/ui/Sesion.svelte`, `src/lib/adapters/repositorio.ts`
- **Comportamiento visible**: `qa/posponer.md`
- **Notas**: `pospuesta` se lee y escribe en `repositorio.ts` como un solo campo (S11); el texto y el botón del panel los da el core.
- **Gate**: `node scripts/gate.ts ui`

## cleaner · architect · hardener · qa

Trabajan sobre todo lo que cambió la feature (`git diff $(git merge-base v2 HEAD)`); no necesitan sección propia salvo que el specifier anote algo para ellos acá.

## Log

- L1 (2026-10-28): el pedido original del usuario no llegó al specifier; el spec (commit `3263a82`, «Especificar posponer una tarea») y la decisión D1 lo reflejan. Pedido del orquestador para este paquete: «docs/pipeline/paquetes/posponer.md — §4.1 (pospuesta), §5.9, §6.2 (Posponer / Quitar posponer), §7. Gherkin: posponer-tarea, estado-pospuesta, orden-pospuesta. QA: qa/posponer.md.»
- L2 (2026-11-02): retrabajo a mitad de la cadena: el rol acceptance encontró 4 sobrevivientes de estado-pospuesta 1 con ahora < desde porque §5.9 no define ese progreso; el usuario respondió D2.
