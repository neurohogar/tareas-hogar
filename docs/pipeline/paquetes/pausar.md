# Paquete: pausar

Las tareas periódicas se pueden pausar desde el panel de edición: una pausada no tiene estado, no se atrasa y no se ve en Pendientes salvo con "Mostrar pausadas". Al reanudarla, se evalúa como recién creada en ese momento.

## Specs

- **S1** (§4.1): «| `pausada` | booleano | no | Solo periódicas (§5.8). Sin el campo, no está pausada. |»
- **S2** (§4.1): «| `reanudadaEn` | timestamp | no | Última vez que se reanudó (§5.8). |»
- **S3** (§5.8): «Solo las tareas **periódicas** se pueden pausar.»
- **S4** (§5.8): «**Pausada**: no tiene estado (no es `pendiente`, `atrasada` ni `en espera`), no se atrasa y no está completada (§6.1). No aparece en Pendientes salvo con **Mostrar pausadas** (§6.1). Su checkbox está deshabilitado.»
- **S5** (§5.8): «**Reanudar** guarda `reanudadaEn` = ahora y quita `pausada`. Desde ahí la tarea se evalúa **como recién creada en `reanudadaEn`**: con `creadaEn` = `reanudadaEn` y sin los completados con `completadoEn` anterior a `reanudadaEn` (que siguen en el Historial y en "Última vez"). Así:
  - Relativa: queda `pendiente` al reanudar (nunca completada, §5.2).
  - Calendario: `pendiente` si hoy es día de ocurrencia; si no, `en espera` hasta la próxima (§5.3).
  - Con horario, §5.5–§5.7 con ese `creadaEn`.
  - Lo que pasó durante la pausa no cuenta como atraso.»
- **S6** (§5.8): «`reanudadaEn` solo vale para las periódicas: una puntual lo ignora (una periódica pausada con completados que pasa a puntual queda completada, §6.2). El filtro por `reanudadaEn` es permanente: sigue valiendo después de cambios de tipo o de modo, hasta la próxima reanudación.»
- **S7** (§5.8): «Con horario, una ocurrencia cuya ventana cerró antes de `reanudadaEn` no cuenta como perdida: el día de la reanudación, si la ventana ya cerró, la tarea queda `en espera` hasta la próxima ocurrencia (no `atrasada`).»
- **S8** (§5.8): «`creadaEn` real no cambia: el desempate del orden (§6.1) sigue usando el `creadaEn` real.»
- **S9** (§5.8): «Los completados se siguen pudiendo borrar (Historial, aviso) con la tarea pausada.»
- **S10** (§5.8): «Cambiar una periódica pausada a puntual la reanuda (quita `pausada` y guarda `reanudadaEn`).»
- **S11** (§6.1): «**Mostrar pausadas**: un check junto a "Mostrar completadas", con el texto "Mostrar pausadas". Apagado (el valor inicial), las pausadas (§5.8) no se ven. Encendido, van al final de la lista (después de las completadas, si se muestran), por título en el orden alfabético de arriba; cada fila atenuada, con el texto "Pausada" en lugar del indicador de estado y el checkbox deshabilitado. El filtro por etiqueta aplica también a las pausadas. El valor se guarda en ese dispositivo, como "Mostrar completadas".»
- **S12** (§6.2): «**Pausar / Reanudar** (solo al editar una periódica): un botón **Pausar**; si la tarea está pausada, el panel lo indica ("Pausada") y el botón es **Reanudar**. El botón actúa en el momento (guarda y cierra el panel), sin pasar por **Guardar**.»
- **S13** (§7): «pausar y reanudar escriben `pausada` y `reanudadaEn` juntos»

## Decisiones

- D1 (2026-10-28, usuario, cuánto dura la pausa): «Hasta que la reanude (Recomendado)»
- D2 (2026-10-28, usuario, estado al reanudar): «Pendiente ya (Recomendado)»
- D3 (2026-10-28, orquestador): solo las periódicas se pueden pausar.
- D4 (2026-10-28, orquestador): el check "Mostrar pausadas" se guarda en el dispositivo.
- D5 (2026-10-28, orquestador): `reanudadaEn` solo vale para periódicas (opción A).
- D6 (2026-10-28, orquestador): con horario, una ventana que cerró antes de reanudar no cuenta como perdida.

## Artefactos

- Gherkin: `features/pausar-tarea.feature` (S1, S3, S4, S9, S12, S13), `features/reanudar-tarea.feature` (S2, S5, S6, S7, S8, S10, S13), `features/mostrar-pausadas.feature` (S4, S11)
- QA: `qa/pausar.md`

## core

- **Puede editar**: `src/lib/core/tarea.ts`, `src/lib/core/documento-de-tarea.ts`, `src/lib/core/documento-de-tarea.test.ts`, `src/lib/core/estado.ts`, `src/lib/core/estado.test.ts`, `src/lib/core/estado-de-tarea.ts`, `src/lib/core/estado-de-tarea.test.ts`, `src/lib/core/completada.ts`, `src/lib/core/completada.test.ts`, `src/lib/core/completados.ts`, `src/lib/core/completados.test.ts`, `src/lib/core/checkbox.ts`, `src/lib/core/checkbox.test.ts`, `src/lib/core/pendientes.ts`, `src/lib/core/pendientes.test.ts`, `src/lib/core/orden-de-pendientes.ts`, `src/lib/core/urgencia.ts`, `src/lib/core/urgencia.test.ts`, `src/lib/core/plazos-con-horario.ts`, `src/lib/core/ocurrencias-con-horario.ts`, `src/lib/core/ocurrencias-con-horario.test.ts`, `src/lib/core/edicion.ts`, `src/lib/core/edicion.test.ts`, `src/lib/core/guardar-con-etiquetas.ts`, `src/lib/core/guardar-con-etiquetas.test.ts`, `src/lib/core/pausa*.ts`, `src/lib/core/*.test.ts`
- **Reglas**: S1–S11, S13 (S11: qué filas y en qué orden; el guardado en el dispositivo es de ui)
- **Reusa**:
  - `estadoDeTarea` (`estado-de-tarea.ts`) sigue siendo el único punto de entrada del estado: la pausa y el filtro por `reanudadaEn` entran ahí, no en cada regla de §5.2–§5.7.
  - `completadosDeTarea` y `completar` (`completados.ts`): el completado nuevo de una reanudada cubre la ocurrencia según los completados filtrados y `creadaEn` = `reanudadaEn`.
  - `compararTitulos` (`orden-alfabetico.ts`) para el orden de las pausadas; `desempatar` de `orden-de-pendientes.ts` sigue usando el `creadaEn` real (S8).
  - `filtrarPorEtiqueta` (`filtro-por-etiqueta.ts`) tiene que filtrar también las filas pausadas sin cambios en ese módulo.
  - `CambioDeTarea` y `aplicarCambio` (`documento-de-tarea.ts`) para pausar, reanudar y la edición a puntual: un solo cambio con `pausada` y `reanudadaEn` juntos (S13).
- **Notas**: las firmas exportadas que ya usan `acceptance/` y la UI (`estadoDeTarea`, `filasDePendientes`, `checkboxHabilitado`, `accionDelCheckbox`, `editar`, `editarConEtiquetas`, `tareaDesdeDocumento`) siguen compatibles: solo parámetros nuevos opcionales, porque el gate del core corre la aceptación ya implementada.
- **Gate**: `node scripts/gate.ts core`

## acceptance

- **Puede editar**: `acceptance/steps/pausar.ts`, `acceptance/steps/index.ts`, `acceptance/steps/world.ts`, `acceptance/steps/pendientes.ts`, `acceptance/steps/checkbox.ts`, `acceptance/steps/edicion.ts`, `acceptance/oracle*.ts`, `acceptance/equivalence.ts`, `docs/pipeline/pendientes.txt`
- **Features a conectar**: `features/pausar-tarea.feature`, `features/reanudar-tarea.feature`, `features/mostrar-pausadas.feature`
- **Pasos nuevos**:
  - `pauso la tarea` y `pauso la tarea <titulo>`
  - `la tarea fue pausada` y `la tarea <titulo> fue pausada`
  - `otro dispositivo, sin ver ese cambio, pausa la tarea`
  - `reanudo la tarea el <momento>` y `reanudo la tarea <titulo> el <momento>`
  - `la tarea está pausada` y `la tarea no está pausada`
  - `la tarea no tiene estado`
  - `la tarea no está completada`
  - `abro la tarea en el panel de edición`
  - `el panel de edición ofrece <accion>` (Pausar o Reanudar) y `el panel de edición no ofrece pausar`
  - `edito la tarea a puntual sin fecha límite el <momento>` (la edición con momento: el que guarda `reanudadaEn`)
  - `Mostrar pausadas está encendido`
  - `Pendientes muestra como pausadas <titulos>`
- **Gate**: `node scripts/gate.ts acceptance`

## ui

- **Puede editar**: `src/lib/ui/PanelTarea.svelte`, `src/lib/ui/Sesion.svelte`, `src/lib/ui/sesion.ts`, `src/lib/ui/Pendientes.svelte`, `src/lib/ui/FilaTarea.svelte`, `src/lib/adapters/repositorio.ts`, `src/lib/adapters/mostrar-pausadas.ts`
- **Comportamiento visible**: `qa/pausar.md`
- **Notas**: `pausada` y `reanudadaEn` se leen y escriben en `repositorio.ts` (S13: en un solo `update`); el check "Mostrar pausadas" vive en el almacenamiento local, como `mostrar-completadas.ts`.
- **Gate**: `node scripts/gate.ts ui`

## cleaner · architect · hardener · qa

Trabajan sobre todo lo que cambió la feature (`git diff $(git merge-base v2 HEAD)`); no necesitan sección propia salvo que el specifier anote algo para ellos acá.

## Log

- L1 (2026-10-28): el pedido original del usuario no llegó al specifier; el spec (commit `3eb56a5`, «Especificar pausar y reanudar tareas periódicas») y las decisiones D1–D6 lo reflejan. Pedido del orquestador para este paquete: «docs/pipeline/paquetes/pausar.md — docs/spec.md §4.1 (pausada, reanudadaEn), §5.8, §6.1 (Mostrar pausadas), §6.2 (Pausar/Reanudar), §7. Gherkin: features/pausar-tarea.feature, reanudar-tarea.feature, mostrar-pausadas.feature. QA: qa/pausar.md.»
