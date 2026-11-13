# Paquete: primer-paso

Primera feature de la épica E3 de `docs/v3/plan.md` («Primer paso a la vista»): cada tarea puede tener un «primer paso» opcional, una línea con el primer movimiento concreto («Separar la ropa blanca»), que se escribe en el panel y se ve como «Primer paso: …» debajo del título, solo en las filas `pendiente` y `atrasada`. Los pasos múltiples, mostrados de a uno, quedan para una feature aparte de la misma épica.

## Specs

- **S1** (§4.1): «| `primerPaso` | string | no | Una línea con el primer movimiento concreto (ver más abajo). Cualquier tipo de tarea y cualquier esfuerzo. |»
- **S2** (§4.1): «**Primer paso**: una sola línea, sin saltos de línea y sin largo máximo. Al guardar se recortan los espacios del inicio y del final. Vacío o solo espacios significa **sin primer paso** (el campo no se guarda). Un primer paso nunca es inválido: nunca rechaza la creación ni la edición. No tiene estado: completar la tarea, posponerla, pausarla, reanudarla, deshacer y cambiar de tipo o de modo no lo borran ni lo cambian, y una periódica que vuelve muestra el mismo primer paso. No hay forma de marcarlo como hecho ni indicador de avance. Una tarea guardada sin el campo no tiene primer paso (no hay migración). No cambia el estado (§5), el orden de la lista, los filtros ni **Solo rápidas**, y el nombre de la tarea (abajo) sigue siendo emoji y título. No se ve en el Historial, en el aviso de deshacer, en Anotaciones ni en el texto copiado.»
- **S3** (§6.1): «Si la tarea está `pendiente` o `atrasada` y tiene primer paso (§4.1), en su propia línea debajo del título, «Primer paso: » seguido del texto, por ejemplo «Primer paso: Separar la ropa blanca». Se ve completo, en varias líneas si hace falta, sin cortar, en el mismo tamaño y color de texto secundario que el esfuerzo y el horario, sin énfasis ni color propio. No se ve en las filas `en espera` (tampoco las pospuestas ni las completadas) ni en las pausadas. Se decide con el estado de cada momento: la línea desaparece cuando la tarea pasa a `en espera` (al completarla, posponerla o por su horario) o se pausa, y vuelve sola cuando vuelve a `pendiente` o `atrasada`. Una `atrasada` con el checkbox deshabilitado hasta que abra su ventana (§5.5) la muestra. Tocarlo es tocar la fila (abre el panel); no se edita desde la fila.»
- **S4** (§6.2): «**Primer paso**: campo de una línea con la etiqueta «Primer paso», sin texto de ejemplo, justo debajo del título (con su emoji) y antes de la nota. Enter en ese campo guarda, como en todo campo de una línea (**Teclado en pantalla**, abajo). Al crear arranca vacío; al editar, con el valor actual. Vacío deja la tarea sin primer paso, y cuenta para **Cambios sin guardar** como cualquier campo (escribir y volver al valor original no cuenta; vaciar un primer paso existente sí).»
- **S5** (§6.2): «después el título con el emoji al lado (el botón de emoji junto al campo Título, con **Quitar emoji** debajo); el primer paso; la nota;»
- **S6** (§7): «(`emoji`, `nota` y `primerPaso` son campos independientes, como `titulo`;»

## Decisiones

- D1 (2026-11-13, analyst, alcance): esta feature cubre solo el campo opcional «primer paso» que se ve en la fila. Los «pasos opcionales para tareas largas, mostrados de a uno» quedan para una feature aparte de la misma épica (`pasos-de-a-uno`), que decide cómo se relacionan con el primer paso, si un paso se marca hecho y qué pasa con el avance al completar o al repetir una periódica. Porque el plan encarga al analyst partir cada épica en features (como la E2, D1 de `estado-sin-culpa`), el primer paso solo se valida por separado («cuántas tareas tienen primer paso») y los pasos traen decisiones propias de estado que el campo no necesita.
- D2 (2026-11-13, analyst, modelo): la tarea suma el campo opcional `primerPaso` (string), para cualquier tipo de tarea y cualquier esfuerzo. Es una sola línea, sin saltos de línea y sin largo máximo (confirmado por D12); al guardar se recortan los espacios del inicio y del final, y vacío o solo espacios significa **sin primer paso** (el campo no se guarda). Nunca es inválido, así que nunca rechaza un guardado ni marca una pestaña con error. Porque es la regla del texto de una anotación (§4.5) y de la nota (§4.1), y el plan pide no exigirlo ni poner trabas para crear una tarea.
- D3 (2026-11-13, analyst, dónde se edita): en el panel de edición (§6.2), sección **Tarea**, un campo de una línea con la etiqueta «Primer paso», justo debajo del título (con su emoji) y antes de la nota, sin texto de ejemplo. Enter en ese campo guarda, como en todo campo de una línea (§6.2, Teclado en pantalla). Al crear arranca vacío; al editar, con el valor actual. Porque la configuración va en el panel (regla 6 del plan), y el primer paso es lo que concreta el título.
- D4 (2026-11-13, analyst): el primer paso cuenta para **Cambios sin guardar** como cualquier campo: escribir y volver al valor original no cuenta, ni los espacios que **Guardar** recorta; vaciar un primer paso existente sí. Porque es la definición única de «hay cambios» (§6.2).
- D5 (2026-11-13, analyst): no hay forma de marcar el primer paso como hecho ni ningún indicador de avance; completar la tarea no lo borra ni lo cambia, y una periódica que vuelve muestra el mismo primer paso. Posponer, pausar, reanudar, deshacer y cambiar de tipo o de modo no lo tocan. Porque es parte de la definición de la tarea, como la nota, y el plan pide no tratar como fallo una tarea a medio hacer.
- D6 (2026-11-13, analyst; reconciliada con D10–D12): en las filas que lo muestran (D10) se ve en su propia línea, debajo del título, con el prefijo «Primer paso: » (D11), completo y en varias líneas si hace falta, sin cortar (D12), en el tamaño y el color de texto secundario del esfuerzo y el horario, sin énfasis ni color propio. Tocarlo es tocar la fila (abre el panel), como los chips; no se edita desde la fila. Porque lo que se configura va en el panel (regla 6) y la fila no gana otro control.
- D7 (2026-11-13, analyst): el primer paso no se ve en el Historial (§6.3), en el aviso de deshacer (§5.4), en Anotaciones (§6.7) ni en el texto copiado. No cambia el estado (§5), el orden de la lista (§6.1), los filtros ni «Solo rápidas». Porque el plan lo pide «en la fila», y el nombre de la tarea (§4.1) sigue siendo emoji y título.
- D8 (2026-11-13, analyst, sincronización): `primerPaso` es un campo independiente de la §4.1: gana el último cambio, por campo, como `nota` (§7). Una edición escribe solo si cambió. Porque es la regla de conflictos de los campos de texto de la tarea.
- D9 (2026-11-13, analyst, tareas existentes): no hay migración. Una tarea guardada sin el campo no tiene primer paso, y su fila y su panel se ven como hoy. Porque «sin el campo» ya significa «sin valor» para los opcionales de la §4.1 (emoji, nota, esfuerzo) y el plan pide que todo lo nuevo arranque en calma.
- D10 (2026-11-13, usuario, en qué filas se ve): P1 «Solo pendiente y atrasada (Recomendada)». Las filas en espera (también las pospuestas), las pausadas y las completadas no muestran el primer paso.
- D11 (2026-11-13, usuario, cómo se lee): P2 «Con prefijo: «Primer paso: …» (Recomendada)», por ejemplo «Primer paso: Separar la ropa blanca», en su propia línea bajo el título y en texto secundario.
- D12 (2026-11-13, usuario, primer paso largo): P3 «Sin máximo, se muestra entero (Recomendada)». La fila lo muestra completo, en varias líneas si hace falta; no hay máximo ni error al guardar (D2 sigue como está).
- D13 (2026-11-13, analyst, cuándo aparece y desaparece): la regla de D10 se evalúa con el estado de cada momento (§5, §6.1) y no guarda nada: la línea desaparece cuando la tarea pasa a `en espera` (al completarla, posponerla o por su horario) o se pausa, y vuelve sola cuando la tarea vuelve a `pendiente` o `atrasada`. Una `atrasada` con el checkbox deshabilitado hasta que abra su ventana (§5.5) la muestra. Porque es la misma regla de estado que ya decide el texto de atraso y el de regreso de la fila, y no necesita otra.

## Artefactos

- Gherkin: `features/primer-paso.feature` (S1, S2, S6), `features/primer-paso-en-la-fila.feature` (S2, S3), `features/primer-paso-cambios-sin-guardar.feature` (S4; S5 la cubre solo QA)
- QA: `qa/primer-paso.md` (S1, S2, S3, S4, S5, S6; S5, el orden del campo en el panel, y la parte de S2 que dice que no se ve en el Historial, el aviso de deshacer, Anotaciones ni el texto copiado, las cubre solo QA)

## core

- **Puede editar**: `src/lib/core/tarea.ts`, `src/lib/core/creacion.ts`, `src/lib/core/crear-periodica-calendario.ts`, `src/lib/core/datos-de-tarea.ts`, `src/lib/core/documento-de-tarea.ts`, `src/lib/core/edicion.ts`, `src/lib/core/cambios-sin-guardar.ts`, `src/lib/core/campos-de-texto.ts`, `src/lib/core/pendientes.ts`, `src/lib/core/primer-paso*.ts` (archivo nuevo), `src/lib/core/*.test.ts` (todos los tests del core: un cambio de tipo exportado puede tocarlos)
- **Reglas**: S1 (campo opcional `primerPaso` en `Tarea` y en el documento, para todo tipo y esfuerzo), S2 (recortar, vacío o solo espacios es sin campo, nunca inválido, sin largo máximo, no tiene estado: no lo toca ninguna acción ni el cambio de tipo o de modo; no cambia estado ni orden; una edición lo escribe solo si cambió), S3 (cuándo la fila lo muestra: estado `pendiente` o `atrasada`, no `en espera`, no completada, no pausada; el prefijo «Primer paso: » y el texto completo), S4 (qué cuenta como cambio en **Cambios sin guardar**: se compara recortado, vacío igual a sin campo), S6 (campo independiente: cada campo viaja solo en el cambio si cambió, y null lo quita)
- **Reusa**:
  - `crearTarea` y `DatosComunes` (`creacion.ts`): el primer paso es un campo común a todo tipo, como emoji, nota y esfuerzo. `crearPeriodica` de calendario (`crear-periodica-calendario.ts`) es el único creador que no propaga los campos comunes con un spread: hay que pasarle `primerPaso` a mano. `crearSegunDatos` y `datosDeTarea` (`datos-de-tarea.ts`) siguen siendo inversas.
  - `normalizarNota` (`nota.ts`) y `camposDeTexto` (`campos-de-texto.ts`): el primer paso sigue la misma regla de texto que la nota (recortar, vacío es sin campo); un módulo `primer-paso.ts` propio solo si la regla no cabe en el existente sin mezclar trabajos.
  - `editar` (`edicion.ts`): el campo entra en el cambio solo si cambió, y null lo quita (`cambioDeValor`); cambiar el tipo no lo toca.
  - `filasDePendientes` (`pendientes.ts`) y `clasificarEnPendientes` (`completada.ts`): el estado de cada fila ya está decidido ahí; el primer paso se muestra según ese estado, sin guardar nada ni reordenar.
  - `hayCambios` y `claveDeNota` (`cambios-sin-guardar.ts`): la definición única de "hay cambios".
- **Notas**: las firmas exportadas que ya usan `acceptance/` y la UI siguen compatibles (solo campos y parámetros nuevos opcionales). `nombreDeTarea` (`nombre-de-tarea.ts`) no cambia: el nombre sigue siendo emoji y título.
- **Gate**: `node scripts/gate.ts core`

## acceptance

- **Puede editar**: `acceptance/steps/primer-paso.ts` (archivo nuevo), `acceptance/steps/index.ts`, `acceptance/steps/world.ts`, `acceptance/steps/pendientes.ts`, `acceptance/steps/edicion.ts`, `acceptance/steps/cambios-sin-guardar.ts`, `acceptance/oracle*.ts`, `acceptance/equivalence.ts`, `docs/pipeline/pendientes.txt`
- **Features a conectar**: `features/primer-paso.feature`, `features/primer-paso-en-la-fila.feature`, `features/primer-paso-cambios-sin-guardar.feature`
- **Pasos nuevos** (ya existen y se reusan: `una tarea puntual sin fecha límite`, `una tarea puntual con fecha límite <limite>`, los de creada el, horario, completar, pausar, reanudar, posponer, `borro el completado del`, `consulto Pendientes el` y `en cualquier momento`, `consulto el estado el`, `el estado es <estado>`, `Pendientes muestra en orden`, `el checkbox de la tarea está deshabilitado`, `abro el panel para crear/editar`, `escribo ... en el campo`, `vacío el campo`, `toco la X del panel`, `queda abierto`, `otro dispositivo, sin ver ese cambio, edita el título/la nota` y `guarda la tarea sin cambios`):
  - `creo una tarea puntual con título <titulo> y primer paso <primer_paso>`
  - `creo una tarea periódica relativa con título <titulo> cada <cada> <unidad> y primer paso <primer_paso>`
  - `creo una tarea periódica semanal con título <titulo> los <dias> y primer paso <primer_paso>`
  - `creo una tarea puntual con título <titulo> y un primer paso de solo espacios`
  - `el primer paso de la tarea es <primer_paso>` (Given: deja la tarea ya guardada con ese primer paso, sin pasar por "editar"; no marca un cambio "de mi lado")
  - `el primer paso de la tarea <titulo> es <primer_paso>` (Given, para escenarios con dos tareas)
  - `edito el primer paso a <primer_paso>`
  - `edito el primer paso a <primer_paso> con espacios al inicio y al final`
  - `edito el primer paso a uno de solo espacios`
  - `edito el primer paso a uno de <largo> caracteres`
  - `quito el primer paso`
  - `otro dispositivo, sin ver ese cambio, edita el primer paso a <primer_paso>`
  - `otro dispositivo, sin ver ese cambio, quita el primer paso`
  - `la tarea tiene primer paso <primer_paso>`
  - `la tarea no tiene primer paso` (el documento no tiene el campo)
  - `la tarea tiene un primer paso de <largo> caracteres`
  - `la fila de la tarea muestra el primer paso <texto>` (el texto exacto que se ve, con el prefijo «Primer paso: »; la lista consultada tiene una sola fila, como en `la fila de la tarea muestra el esfuerzo`)
  - `la fila de la tarea no muestra primer paso`
  - `abro el panel para editar la tarea <titulo> con primer paso <primer_paso>`
  - el campo `Primer paso` en las tablas de campos de `escribo ... en el campo <campo>`, `escribo <valor> con espacios alrededor en el campo <campo>`, `vacío el campo <campo>` y `escribo solo espacios en el campo <campo>`
- **Notas**:
  - Cambiar el tipo en el panel conserva el primer paso: sumar `primerPaso` a `camposQueConserva` en `acceptance/steps/edicion.ts` (y al `Pick` de su tipo de retorno). También hay que sumarlo a las listas de campos comunes de `conCampos` y `comunesDe` en los steps que arman datos (`emoji-y-nota.ts`, `cambios-sin-guardar.ts`) si no usan un spread.
  - `FilaConsultada` (`world.ts`) gana lo que la fila muestra del primer paso; `filasEn` (`pendientes.ts`) lo toma del core, y el oráculo (`oracle.ts`, `oracle-edicion.ts`, `oracle-panel.ts`) lo reescribe desde S3 (solo `pendiente` y `atrasada`) y S2/S4 sin importar el core ni los step handlers. Cada regla nueva que entra en un Then se agrega al oráculo. No crear un `acceptance/oracle-*.ts` nuevo: choca con la lista manual de `scripts/check-arch.ts`.
  - Las tareas declaradas con título y sin `creada el` se crean en el mismo instante: un empate de urgencia se resuelve por título (`Primer paso 18`).
  - Una `atrasada` lleva al menos 60 s de atraso (los escenarios no escriben bordes menores).
- **Gate**: `node scripts/gate.ts acceptance`

## ui

- **Puede editar**: `src/lib/ui/PanelTarea.svelte`, `src/lib/ui/SeccionTarea.svelte`, `src/lib/ui/FilaTarea.svelte`, `src/lib/ui/Pendientes.svelte`, `src/lib/adapters/repositorio.ts`
- **Comportamiento visible**: `qa/primer-paso.md`
- **Notas**:
  - Campo **Primer paso** en la sección **Tarea** del panel: una línea, etiqueta «Primer paso», sin texto de ejemplo, justo debajo del título (con su emoji y **Quitar emoji**) y antes de la nota; arranca vacío al crear y con el valor actual al editar; Enter guarda como en **Título**.
  - La fila muestra «Primer paso: …» en su propia línea debajo del título cuando el core lo indica (solo `pendiente` y `atrasada`), completo y en varias líneas, con el color y tamaño de texto secundario del esfuerzo y el horario, sin énfasis ni color propio, y sin control propio: tocarla es tocar la fila.
  - `primerPaso` se lee y se escribe en `repositorio.ts` como un campo independiente (como `nota`): una edición lo escribe solo si cambió, y vaciarlo borra el campo.
  - No se ve en el Historial, el aviso de deshacer, Anotaciones ni el texto copiado (no hay que tocar esos componentes).
- **Gate**: `node scripts/gate.ts ui`

## cleaner · architect · hardener · qa

Trabajan sobre todo lo que cambió la feature (`git diff <base de la feature>`, anotada en `tmp/base-de-feature`); no necesitan sección propia salvo que el gherkin-writer anote algo para ellos acá.

- **Notas**: el primer paso repite la regla de texto de la nota (recortar, vacío es sin campo); si el core la duplica, el cleaner la unifica sin cambiar el comportamiento. El hardener corre `--level full` solo en los features con un paso atendido por un handler cambiado (p. ej. `camposQueConserva`, `FilaConsultada`) o con un Then que pasa por una regla nueva del oráculo.

## Log

- L1 (2026-11-13): pedido original del usuario, textual: «Run all remaining features of docs/v3/plan.md through the pipeline in automatic mode», sobre la épica E3 de `docs/v3/plan.md`:

  ### E3. Primer paso a la vista

  - **Problema y persona.** TDAH y TEA. El título de una tarea es abstracto («Ropa»); decidir por dónde empezar es parte del costo de empezar.
  - **Evidencia.** `tdah §1.3A` (moderada e indirecta: ningún ensayo aísla el primer paso); `tea §1` (moderada: no saber cuál es el primer paso paraliza); `tdah §1.2b` (débil: falla formar el plan, no recordarlo); `tdah §2.1` (anecdótica a moderada).
  - **Qué propone.** Un campo opcional «primer paso» que se ve en la fila. Pasos opcionales para tareas largas, mostrados de a uno.
  - **Hipótesis y validación.** Ver el primer movimiento concreto cuesta menos que leer el título. Señal: notas sobre tareas con primer paso, y el campo se sigue llenando después de cuatro semanas. La refuta que escribirlo cueste más de lo que ahorra.
  - **Evitar.** Mostrar la descomposición entera; exigir pasos para crear una tarea; tratar como fallo una tarea con pasos a medio hacer. Demasiadas partes también paralizan (`tea §1`).
  - **Depende de · Tamaño · Riesgos.** Nada · M · La fila gana densidad (la E9 lo compensa).
