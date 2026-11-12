# Paquete: cambios-sin-guardar

Cerrar el panel o usar una acción con cambios sin guardar pide confirmación en lugar de perderlos, y el botón Atrás de Android cierra el panel en lugar de salir de la pantalla.

## Specs

- **S1** (§6.2): «**Cerrar** (la **X**, o **Atrás** en Android) con cambios sin guardar pide confirmación en lugar de descartarlos (**Cambios sin guardar**, abajo); sin cambios cierra directo.»
- **S2** (§6.2): «**Hay cambios** cuando **Guardar** cambiaría algo respecto de los valores con que se abrió el panel.»
- **S3** (§6.2): «Única excepción: el texto sin confirmar del campo Etiquetas cuenta como cambio (salvo que sean solo espacios) aunque **Guardar** no cambie nada por él;»
- **S4** (§6.2): «**Se mide contra los valores al abrir el panel**, no contra lo que otro dispositivo escribió después: un cambio remoto no hace aparecer el aviso.»
- **S5** (§6.2): «**Al crear**, "sin cambios" significa que el formulario sigue como se abrió.»
- **S6** (§6.2): «**Aviso de cierre**: cerrar con la **X** (o **Atrás**, ver **Atrás**) con cambios abre el aviso "Tenés cambios sin guardar" con tres botones:»
- **S7** (§6.2): «**Descartar** no quita de **Recientes** un emoji elegido en el panel:»
- **S8** (§6.2): «**Aviso de acción**: **Pausar**, **Reanudar**, **Posponer** (**1 hora**, **3 horas**, **Hasta mañana**) y **Quitar posponer** con cambios abren el aviso "Tenés cambios sin guardar" con tres botones:»
- **S9** (§6.2): «"Ahora" de §5.8 y §5.9 es el momento de tocar el botón del aviso, no el de elegir la acción.»
- **S10** (§6.2): «Entonces el aviso dice "Con estos cambios la tarea ya no se puede <acción>" y ofrece solo **Seguir editando** y **Descartar y <acción>**, sin **Guardar y <acción>**.»
- **S11** (§6.2): «**El aviso de acción se mantiene al día** mientras está abierto, con la tarea y el ahora del momento, como las acciones a la vista:»
- **S12** (§6.2): «**Si Guardar falla** (desde el aviso de cierre o el de una acción) por validación (reglas de arriba y §4.1–§4.2): no se ejecuta nada, ni la acción ni el cierre.»
- **S13** (§6.2): «**Los avisos se abren sobre el panel** con las reglas de **Sobre el panel**:»
- **S14** (§6.2): «**Si otro dispositivo borra la tarea** con un aviso abierto, se cierran el aviso y el panel sin pedir nada (§7, gana el borrado).»
- **S15** (§6.2): «**Borrar tarea** no suma este aviso: mantiene solo su confirmación.»
- **S16** (§6.2): «**Atrás** (botón Atrás de Android, o el gesto equivalente del navegador), con el panel abierto, cierra el panel y no sale de la pantalla donde está»
- **S17** (§6.2): «Un nuevo **Atrás** cierra el panel; si el panel queda con cambios, abre el aviso de cierre, y sin cambios cierra directo.»
- **S18** (§6.2): «Con el teclado en pantalla abierto, el primer **Atrás** lo cierra el sistema y el panel sigue igual; el siguiente aplica estas reglas.»
- **S19** (§6.2): «Con el panel cerrado, **Atrás** hace lo de hoy:»
- **S20** (§6.2): «**Recargar o cerrar la app** con cambios sin guardar muestra la confirmación del navegador.»
- **S21** (§6.2): «y solo **Cerrar** (confirmado con **Descartar**, si hay cambios) o **Descartar y <acción>** descartan los cambios.»
- **S22** (§7): «se cierra, también con un aviso de **Cambios sin guardar** abierto y sin pedir nada (§6.2).»
- **S23** (§6.2): «Al crear una tarea, la opción de **Se repite** que viene elegida es **No se repite**.»

## Decisiones

- D1 (2026-11-03, usuario): «Pedir confirmación» al cerrar con la X o con Atrás cuando hay cambios sin guardar. Sin cambios, cierra directo. Esto cambia la regla de §6.2 «Cerrar sin guardar descarta los cambios».
- D2 (2026-11-03, usuario): el aviso de cierre ofrece Seguir editando, Descartar y Guardar («También Guardar»).
- D3 (2026-11-03, usuario): al crear vale lo mismo: «Sí, igual que al editar». Si cargaste algo pide confirmación; si está vacío, cierra directo.
- D4 (2026-11-03, usuario): Posponer, Pausar, Reanudar y Quitar posponer, con cambios sin guardar, muestran un aviso para guardar y actuar, o descartar y actuar. Sin cambios, actúan en el momento.
- D5 (2026-11-03, usuario): Borrar tarea no suma este aviso: mantiene solo su confirmación.
- D6 (2026-11-03, usuario): si el guardado desde un aviso falla por validación, «No se ejecuta»: ni la acción ni el cierre; el panel sigue abierto y salta a la pestaña con el error, con las reglas de §6.2. Vale también para Guardar en el aviso de cierre.
- D7 (2026-11-03, usuario): Atrás cierra el panel, sin salir de la pantalla, y «Solo lo de arriba»: si hay un selector de emoji, una confirmación o un aviso abiertos, cierra solo eso y deja el panel como estaba; otro Atrás cierra el panel.
- D8 (2026-11-03, orquestador): fuera de alcance: orientación vertical, que es la feature siguiente.
- D9 (2026-11-03, analyst): hay cambios cuando **Guardar** cambiaría algo respecto de los valores con que se abrió el panel: escribir y volver al valor original no cuenta, ni los espacios que **Guardar** recorta, ni el orden de ventanas que **Guardar** ordena; un campo vaciado o una fila de horario vacía sí cuentan, aunque sean inválidos. Porque §6.2 ya dice «Guardar sin cambios no cambia nada» y un aviso sin nada que perder es ruido.
- D10 (2026-11-03, analyst): al crear, «si está vacío» significa que el formulario sigue como se abrió; tocar cualquier campo con otro valor (por ejemplo, **Se repite** o el esfuerzo) es «cargar algo», y un título de solo espacios no. Es D9 aplicada a crear.
- D11 (2026-11-03, analyst): los cambios se miden contra los valores al abrir el panel, no contra lo que otro dispositivo escribió después: un cambio remoto no hace aparecer el aviso. Porque el aviso protege lo que hizo esta persona en este panel.
- D12 (2026-11-03, analyst): el aviso de las acciones también ofrece **Seguir editando**, con los botones **Seguir editando**, **Descartar y <acción>** y **Guardar y <acción>** (pausar, reanudar, posponer, quitar posponer). Porque D7 ya permite salir de ese aviso sin actuar, D2 y **Borrar tarea** ofrecen esa salida a la vista, y un toque equivocado en una acción tiene que poder deshacerse también sin Atrás.
- D13 (2026-11-03, analyst): los dos avisos se abren sobre el panel con las reglas de «Sobre el panel»: bloquean lo de abajo y, al cerrarlos, se vuelve a la misma pestaña sin perder nada. Porque son lo mismo que la confirmación de **Borrar tarea**.
- D14 (2026-11-03, analyst): al actuar desde el aviso, «ahora» es el momento de tocar el botón del aviso, no el de elegir la acción. Porque recién ahí se ejecuta, y §5.8 y §5.9 usan ahora.
- D15 (2026-11-03, analyst): si otro dispositivo borra la tarea con un aviso abierto, se cierran el aviso y el panel (§7, «gana el borrado»), sin pedir nada. Si otro dispositivo hace que la acción ya no corresponda (por ejemplo, la pausa), el aviso de esa acción se cierra y queda el panel con lo escrito. Porque §6.2 ya actualiza las acciones a la vista y «Nada se pierde».
- D16 (2026-11-03, analyst): **Descartar** no quita de **Recientes** un emoji elegido en el panel. Porque §6.2 los actualiza al elegir, en ese dispositivo, sin depender de guardar.
- D17 (2026-11-03, analyst): Atrás cierra lo que tenga arriba como si se tocara su salida: el aviso equivale a **Seguir editando**, la confirmación de **Borrar tarea** a cancelar y el selector de emoji a cerrarlo sin elegir. Si queda el panel con cambios, Atrás abre el aviso de cierre (D1). El «aviso» de D7 son los de esta feature: el aviso de deshacer de §5.4 no se abre encima de nada, Atrás lo ignora y sigue sus 5 segundos. Las sugerencias de Etiquetas tampoco cuentan como algo abierto.
- D18 (2026-11-03, analyst): con el teclado en pantalla abierto, el primer Atrás lo cierra el sistema y el panel sigue igual; el siguiente aplica D7. Porque ese toque no le llega a la app.
- D19 (2026-11-03, analyst): Atrás hace lo mismo en cualquier navegador y ancho, y en el panel abierto desde Historial (queda en Historial). Con el panel cerrado, Atrás hace lo de hoy: cerrar el panel con la X, con Guardar o con una acción no deja un Atrás de más que no haga nada, y Adelante no reabre un panel. Fuera del panel, los diálogos de Historial y Etiquetas no cambian con esta feature, porque D7 habla del panel abierto.
- D20 (2026-11-03, usuario): guardar y actuar cuando lo guardado deja la acción sin sentido: «Sin la opción de guardar».
- D21 (2026-11-03, usuario): texto sin confirmar en Etiquetas, si es lo único que cambió y se cierra el panel: «Cuenta, salvo solo espacios».
- D22 (2026-11-03, usuario): recargar o cerrar la app con cambios sin guardar: «Confirmación del navegador».
- D23 (2026-11-03, analyst): D21 es la única excepción a D9: el texto sin confirmar en Etiquetas (salvo solo espacios) cuenta como cambio aunque **Guardar** no cambie nada por él. Hay una sola definición de «hay cambios»: vale igual para cerrar con la X o Atrás, para crear (D3), para las acciones (D4) y para la confirmación del navegador (D22). **Guardar** en un aviso sigue sin crear esa etiqueta, como eligió el usuario en D21; si el texto es un nombre que hace fallar **Guardar**, aplica D6.
- D24 (2026-11-03, analyst): para D20, una acción «queda sin sentido» si no cumple las condiciones con que §5.8, §5.9 y §6.2 la muestran, evaluadas sobre la tarea como quedaría guardada. Las acciones a la vista se siguen decidiendo con la tarea de ahora, no con lo escrito. Incluye **Reanudar** con un cambio a **No se repite** (guardar ya la reanuda, §5.8). El aviso dice "Con estos cambios la tarea ya no se puede <acción>" y ofrece solo **Seguir editando** y **Descartar y <acción>**. Si lo escrito es inválido no hay cómo evaluarlo: se ofrece **Guardar y <acción>** y falla según D6. Es lo que describía la opción elegida.
- D25 (2026-11-03, analyst): el aviso de una acción se evalúa con la tarea y el ahora del momento y se actualiza mientras está abierto, como las acciones a la vista (§6.2): si otro dispositivo cambia la tarea o pasa el tiempo, **Guardar y <acción>** puede aparecer o desaparecer. Al tocarlo, se vuelve a evaluar; si ya no corresponde, no se guarda ni se actúa y el aviso queda actualizado. Complementa D15.
- D26 (2026-11-03, analyst): la confirmación del navegador (D22) aparece solo si hay cambios (D23), con un aviso abierto o sin él, y nunca por Atrás con el panel abierto, que sigue D7. Su texto es el del navegador y, donde el sistema no la ofrece, se pierde lo escrito, como ya aceptó el usuario al elegirla. Al recargar, el panel no se reabre. D19 no cubre el Atrás que siga a una recarga: puede volver a la misma pantalla sin efecto visible.
- D27 (2026-11-03, usuario): al crear una tarea, la opción de **Se repite** que viene elegida: «No se repite». Hoy la app abre en Intervalo y el spec no lo definía; cambia la app.

## Artefactos

- Gherkin: `features/cambios-sin-guardar.feature` (S1, S2, S3, S4, S5, S20, S23), `features/aviso-de-cierre.feature` (S1, S6, S7, S12, S13, S14, S21, S22), `features/aviso-de-accion.feature` (S8, S9, S10, S11, S12, S14, S15, S21), `features/atras-del-panel.feature` (S16, S17, S18, S19)
- QA: `qa/cambios-sin-guardar.md` (todo, y en especial lo que el Gherkin no cubre: S13 qué se ve sobre el panel, S19 el panel cerrado y la pantalla de origen, S20 el diálogo del navegador, S16 no salir de la pantalla). También ajusté los flujos de otros `qa/*.md` donde "Cerrar sin guardar" ahora pasa por el aviso (**Descartar**). S23 (al crear, **Se repite** abre en **No se repite**): `Cambios sin guardar 12` y `20` del feature (elegir Intervalo es cargar algo; volver a No se repite deja el formulario como se abrió) y los pasos 1 y 4 del flujo 3 de `qa/cambios-sin-guardar.md`; corregí los flujos que suponían Intervalo al crear en `qa/panel-mobile.md` (flujos 1 y 2), `qa/puntual.md` (flujos 1 y 7 y el contrato), `qa/periodica-calendario.md` (contrato) y `qa/periodica-relativa.md` (entorno y flujos 2 y 3).

## core

- **Puede editar**: `src/lib/core/cambios-sin-guardar*.ts`, `src/lib/core/aviso-de-accion*.ts`, `src/lib/core/atras-del-panel*.ts`, `src/lib/core/panel-en-pestanas.ts`, `src/lib/core/datos-de-tarea.ts`, `src/lib/core/horario.ts`, `src/lib/core/pausa.ts`, `src/lib/core/posposicion*.ts`, `src/lib/core/*.test.ts` (todos los tests del core: un cambio de tipo exportado puede tocarlos)
- **Reglas**: S23 (al crear, `Se repite` abre en `No se repite`; ese valor es la referencia de S5), S2, S3, S4, S5 (qué cuenta como "hay cambios", al editar y al crear, medido contra los valores al abrir), S1 y S6 (con cambios la X abre el aviso de cierre con sus tres botones; sin cambios cierra directo), S8, S9, S10, S11 (qué ofrece el aviso de cada acción, con la tarea y el ahora del momento, y el texto "Con estos cambios la tarea ya no se puede <acción>"), S12 (si Guardar falla no se ejecuta nada), S15, S16, S17, S18 (qué cierra Atrás según lo que hay arriba, el teclado en pantalla y el aviso de deshacer), S20 (cuándo la confirmación del navegador)
- **Reusa**:
  - `datosDeTarea` (`datos-de-tarea.ts`) da los valores con que se abre el panel; "hay cambios" es lo que **Guardar** cambiaría respecto de eso, así que se apoya en las mismas normalizaciones de Guardar (`editarConEtiquetas` / `crearConEtiquetas` en `guardar-con-etiquetas.ts`, `camposDeTexto` en `campos-de-texto.ts` para recortar nota y emoji, y el orden de ventanas de `horario.ts`), sin reimplementarlas.
  - `accionDePausa`, `cambioDePausa` (`pausa.ts`) y `OPCIONES_DE_POSPONER`, `posponer`, `quitarPosponer` (`posposicion.ts`, `posposicion-en-panel.ts`) para decidir si una acción corresponde: "queda sin sentido" es no cumplir las condiciones con que §5.8, §5.9 y §6.2 la muestran, evaluadas sobre la tarea como quedaría guardada; las acciones a la vista siguen decidiéndose con la tarea de ahora.
  - `PESTANA_AL_ABRIR` y `destinoAlFallarGuardar` (`panel-en-pestanas.ts`): cuando Guardar falla desde un aviso, el destino es el de siempre.
  - El texto sin confirmar de Etiquetas es un cambio aunque no se guarde (excepción de S3): `etiquetas-escritas.ts` define qué cuenta como texto (solo espacios no).
- **Notas**: "ahora" de §5.8 y §5.9 es el momento de tocar el botón del aviso (S9): las funciones reciben el ahora como parámetro (el core nunca lee el reloj). Los nombres de los botones (`Descartar y posponer 1 hora`, etc.) y los mensajes salen del core, no de la UI.
- **Gate**: `node scripts/gate.ts core`

## acceptance

- **Puede editar**: `acceptance/steps/cambios-sin-guardar.ts`, `acceptance/steps/edicion.ts`, `acceptance/steps/pausar.ts`, `acceptance/steps/posponer.ts`, `acceptance/steps/emojis-recientes.ts`, `acceptance/steps/index.ts`, `acceptance/steps/world.ts`, `acceptance/oracle*.ts`, `acceptance/equivalence.ts`, `docs/pipeline/pendientes.txt`
- **Features a conectar**: `features/cambios-sin-guardar.feature`, `features/aviso-de-cierre.feature`, `features/aviso-de-accion.feature`, `features/atras-del-panel.feature`
- **Pasos que ya existen y se reusan**: `abro la tarea en el panel de edición el <ahora>`, `la tarea tiene título <titulo>`, `la tarea está pausada` / `no está pausada`, `la tarea está pospuesta desde <desde> hasta <hasta>`, `la tarea es periódica`, `no queda ninguna tarea`, `se crea una tarea puntual con título <titulo>`, `no existe la tarea <titulo>`, `una tarea periódica relativa Regar cada <cada> <unidad>`, `una tarea puntual sin fecha límite`, `la tarea Regar fue pausada`, `la tarea fue pospuesta con la opción <opcion> el <momento>`, `otro dispositivo, sin ver ese cambio, edita el título a <t>` / `pausa la tarea` / `borra la tarea`, `que no hay emojis recientes`, `elijo un emoji que no estaba entre los recientes`, `el primero es el que elegí`.
- **Pasos nuevos**:
  - `abro el panel para editar la tarea <titulo> con nota <nota>` (puntual, sin fecha límite, sin esfuerzo, sin etiquetas, sin horario)
  - `abro el panel para editar la tarea <titulo> con los horarios <primero> y <segundo>` (ventanas `HH:MM-HH:MM`)
  - `abro el panel para crear una tarea`
  - `el panel está abierto <cambios>` (con cambios sin guardar | sin cambios)
  - `encima del panel hay <encima>` (nada, el aviso de cierre, el aviso de acción, la confirmación de Borrar tarea, el selector de emoji, las sugerencias de Etiquetas)
  - `el aviso de deshacer está abierto` y `el aviso de deshacer sigue abierto`
  - `el teclado en pantalla está abierto`
  - `escribo <valor> en el campo <campo>` (Título, Nota, Etiquetas sin confirmar)
  - `escribo <valor> con espacios alrededor en el campo <campo>`
  - `escribo solo espacios en el campo <campo>`
  - `vacío el campo <campo>`
  - `elijo <valor> en <selector>` (Se repite, Esfuerzo)
  - `cambio los horarios a <nuevo_primero> y <nuevo_segundo>`
  - `agrego una fila de horario vacía`
  - `agrego la etiqueta <etiqueta>` y `quito la etiqueta <etiqueta>`
  - `toco la X del panel`
  - `toco Atrás`
  - `toco <boton> en el aviso` y `toco <boton> en el aviso el <ahora>`
  - `elijo la acción <accion> el <ahora>` (Pausar, Reanudar, Posponer 1 hora, Posponer 3 horas, Posponer hasta mañana, Quitar posponer, Borrar tarea)
  - `pasa el tiempo hasta <ahora>`
  - `queda abierto <abierto>` (nada, el panel, el panel con el aviso de cierre, el panel con el aviso de acción, el panel con la confirmación de Borrar tarea)
  - `el aviso dice <mensaje>` y `el aviso ofrece <botones>` (lista de botones separada por comas, en orden)
  - `el campo <campo> sigue con <valor>`
  - `al recargar la app el navegador <respuesta>` y `el navegador <respuesta>` (pide confirmación | no pregunta)
- **Notas**: los pasos de panel de `edicion.ts`/`pausar.ts`/`posponer.ts` ya declaran una tarea abierta en el panel; los nuevos deben compartir ese modelo y no inventar otro. En `Then queda abierto`, `el aviso dice` y `el aviso ofrece` el oráculo de `acceptance/` se reescribe desde `docs/spec.md` §6.2 (Cambios sin guardar, Atrás), nunca desde el core; cada filtrado de equivalentes se justifica con la regla del spec.
- **Gate**: `node scripts/gate.ts acceptance`

## ui

- **Puede editar**: `src/lib/ui/PanelTarea.svelte`, `src/lib/ui/Sesion.svelte`, `src/lib/ui/SeccionAcciones.svelte`, `src/lib/ui/SeccionTarea.svelte`, `src/lib/ui/SeccionCuando.svelte`, `src/lib/ui/CampoEtiquetas.svelte`, `src/lib/ui/SelectorEmoji.svelte`, `src/lib/ui/Pendientes.svelte`, `src/lib/ui/Historial.svelte`, `src/lib/ui/AvisoDeCambios*.svelte`, `src/lib/adapters/teclado.ts`, `src/lib/adapters/atras*.ts`, `src/lib/adapters/confirmacion-al-salir*.ts`
- **Comportamiento visible**: `qa/cambios-sin-guardar.md` (y los ajustes de los flujos de `qa/editar-borrar.md`, `qa/horario.md`, `qa/puntual.md`, `qa/periodica-relativa.md`, `qa/periodica-calendario.md`, `qa/esfuerzo.md`, `qa/etiquetas.md`, `qa/emoji-y-nota.md` y `qa/panel-mobile.md` donde cerrar con cambios ahora pasa por el aviso; y los flujos de `qa/puntual.md`, `qa/periodica-calendario.md` y `qa/periodica-relativa.md` donde crear abre con **No se repite**)
- **Notas**: **cambia el valor inicial de Se repite al crear**: hoy la UI (`PanelTarea.svelte`, y `SeccionCuando.svelte` si lo decide ahí) abre en Intervalo; pasa a **No se repite** (S23, D27), que es el valor contra el que se mide "hay cambios" al crear. Al editar sigue abriendo con la opción de la tarea. El aviso es un `alertdialog` con nombre accesible "Tenés cambios sin guardar" y los botones del Contrato observable de `qa/cambios-sin-guardar.md`. Atrás se apoya en el historial del navegador (`popstate`); abrir el panel agrega una entrada y cerrarlo con la X, **Guardar** o una acción la consume sin dejar un Atrás de más. La confirmación del navegador es `beforeunload`, solo con cambios (S20). Todo lo que decide el core (hay cambios, qué botones, qué cierra Atrás) lo pregunta al core.
- **Gate**: `node scripts/gate.ts ui`

## cleaner · architect · hardener · qa

Trabajan sobre todo lo que cambió la feature (`git diff <base de la feature>`, anotada en `tmp/base-de-feature`); no necesitan sección propia salvo que el gherkin-writer anote algo para ellos acá.

## Log

- L1 (2026-11-03): al cerrar el panel con la X o con Atrás, con cambios sin guardar, «Pedir confirmación»; y el botón Atrás de Android con el panel abierto: «Cierra el panel».
