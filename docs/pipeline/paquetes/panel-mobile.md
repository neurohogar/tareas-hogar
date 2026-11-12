# Paquete: panel-mobile

El panel de edición entra en la pantalla del celular: se organiza en pestañas (Tarea, Cuándo y Acciones), ocupa toda la pantalla y mantiene Guardar y Cerrar siempre a la vista. En pantallas anchas muestra las mismas secciones seguidas.

## Specs

- **S1** (§6.2): «Tipo, elegido en **Se repite** con cuatro opciones: **No se repite** (puntual: fecha límite opcional), **Intervalo** (periódica en modo relativo: N + horas/días), **Días de la semana** y **Días del mes** (periódica en modo calendario).»
- **S2** (§6.2): «**Posponer** (solo al editar una tarea `pendiente` o `atrasada` no pausada): las opciones **1 hora**, **3 horas** y **Hasta mañana** se ven directamente en el panel, sin un botón **Posponer** intermedio (§6.2, Presentación); elegir una actúa en el momento y cierra el panel. Si la tarea está pospuesta, el panel muestra "Pospuesta hasta HH:MM" (o "hasta mañana HH:MM") y un botón **Quitar posponer**, que también actúa en el momento.»
- **S3** (§6.2): «**Presentación del panel**: el contenido de los campos y acciones de arriba se organiza en tres secciones, **Tarea**, **Cuándo** y **Acciones**. "Celular" significa una pantalla de hasta **40rem** de ancho (inclusive); por encima, pantallas anchas. Las reglas de cada campo no cambian, solo dónde se ven.»
- **S4** (§6.2): «**Contenido y orden de las secciones** (igual en celular y en pantallas anchas):»
- **S5** (§6.2): «**Tarea**: arriba, "Pausada" (si corresponde), "Pospuesta hasta HH:MM" (o "hasta mañana HH:MM") y **Última vez**; después el título con el emoji al lado (el botón de emoji junto al campo Título, con **Quitar emoji** debajo); la nota; el esfuerzo; las etiquetas.»
- **S6** (§6.2): «**Cuándo**: primero **Se repite**, con sus cuatro opciones en una grilla de 2x2 y los campos de la opción elegida (fecha límite, Cada, días); después **Solo en un horario** con sus ventanas (**Agregar horario**, **Quitar**).»
- **S7** (§6.2): «**Acciones**: **Posponer** (las opciones **1 hora**, **3 horas**, **Hasta mañana** a la vista) o **Quitar posponer**; **Pausar** o **Reanudar**; y al final, separado del resto y en el color de error, **Borrar tarea**. Cada acción aparece con las condiciones de la §5.8, la §5.9 y de este apartado, y se actualiza si otro dispositivo cambia la tarea con el panel abierto.»
- **S8** (§6.2): «El panel ocupa **toda la pantalla**.»
- **S9** (§6.2): «Las secciones son **pestañas** con una barra de pestañas: Tarea, Cuándo y Acciones. Siempre abre en **Tarea**, al crear y al editar. Se cambia de pestaña solo tocándola, sin deslizar.»
- **S10** (§6.2): «El encabezado (con el título del panel y la **X** para cerrar) y la barra de pestañas quedan fijos; solo se desplaza el contenido, y cada pestaña se abre desde arriba.»
- **S11** (§6.2): «**Guardar** está en una barra fija abajo, visible en todas las pestañas. **Cerrar** es la **X** del encabezado.»
- **S12** (§6.2): «Al crear una tarea la pestaña **Acciones** no aparece (no hay acciones disponibles). Al editar aparece siempre, porque **Borrar tarea** está disponible en toda edición.»
- **S13** (§6.2): «**Pantallas anchas** (más de 40rem): el panel tiene el ancho y la ubicación de siempre, sin barra de pestañas; las tres secciones se ven seguidas, cada una con su nombre como título (**Tarea**, **Cuándo**, **Acciones**) y las acciones como una sección más antes del pie, que lleva **Guardar** (barra fija abajo) y la **X** de **Cerrar** en el encabezado fijo.»
- **S14** (§6.2): «**Nada se pierde**: cambiar de pestaña o de ancho no pierde nada de lo escrito, incluido el texto sin confirmar del campo Etiquetas. **Guardar** considera todas las secciones (es un solo formulario) y solo **Cerrar** descarta los cambios; las acciones y **Cerrar** siguen descartando los cambios sin guardar.»
- **S15** (§6.2): «**Errores**: una pestaña se marca mientras alguno de sus campos muestra un error, sea cual sea su origen (al guardar, o el error en vivo de Etiquetas); la marca dura lo que dura el mensaje y se distingue del icono de la pestaña. Los errores de Título y Etiquetas son de **Tarea**; los de fecha límite, Cada, días y horario, de **Cuándo**.»
- **S16** (§6.2): «Si **Guardar** falla, el panel salta a la primera pestaña con error (**Tarea** antes que **Cuándo**) y el contenido se desplaza hasta el primer campo con error. Lo mismo vale en pantallas anchas, donde no hay pestañas: solo se desplaza hasta el primer campo con error.»
- **S17** (§6.2): «**Teclado en pantalla**: abrir el panel no enfoca ningún campo, así el teclado del celular no aparece hasta que se toca uno. La barra de **Guardar** se oculta **solo mientras el teclado en pantalla está abierto** (en cualquier pestaña y ancho) y vuelve al cerrarse, aunque el campo siga enfocado; un campo enfocado sin teclado en pantalla (en la compu, o en los selectores de fecha y hora) no la oculta. El encabezado y las pestañas siguen fijos. El teclado no cambia cómo se envía el formulario: Enter en un campo de una línea guarda, Enter en Nota agrega una línea y Enter en Etiquetas elige la sugerencia; si ese guardado falla, valen las reglas de Errores.»
- **S18** (§6.2): «**Iconos**: llevan icono, siempre junto a su texto, las pestañas **Tarea**, **Cuándo** y **Acciones** y las acciones **1 hora**/**3 horas**/**Hasta mañana** (Posponer), **Quitar posponer**, **Pausar**/**Reanudar** y **Borrar tarea**, en todos los anchos. Solo la **X** de cerrar y el botón de elegir emoji cuando no hay emoji llevan icono sin texto visible, y conservan los nombres accesibles «Cerrar» y «Elegir emoji». **Guardar**, **Agregar horario**, **Quitar**, **Quitar emoji**, los títulos de sección de pantallas anchas y los diálogos quedan solo con texto. Los iconos viajan con la app (§2, §7): funcionan sin conexión.»
- **S19** (§6.2): «**Sobre el panel**: el selector de emoji y la confirmación de **Borrar tarea** se abren sobre el panel, como siempre; al cerrarlos se vuelve a la misma pestaña. En pantalla completa siguen visibles sin tapar el encabezado, las pestañas ni **Guardar** la franja "Sin conexión" (§7) y el aviso de deshacer (§5.4, sobre la barra de **Guardar**; con la barra oculta por el teclado, sobre el teclado). El aviso puede pasar por encima del contenido durante sus 5 segundos.»

## Decisiones

- D1 (2026-11-03, usuario): «Pestañas» (organización del panel en el celular). Tarea, Cuándo y Acciones.
- D2 (2026-11-03, usuario): pestañas solo hasta 40rem; en pantallas más anchas, todas las secciones seguidas sin barra de pestañas.
- D3 (2026-11-03, usuario): Tarea contiene Pausada, Pospuesta hasta y Última vez arriba; emoji al lado del título, con Quitar emoji debajo; nota; esfuerzo; etiquetas. Cuándo contiene Se repite primero, con sus opciones en grilla de 2x2 y sus campos, y después Solo en un horario y sus ventanas. Acciones contiene Posponer, o Quitar posponer; Pausar/Reanudar; y al final, separado y en color de error, Borrar tarea.
- D4 (2026-11-03, usuario): en la pestaña Acciones, las opciones de Posponer (1 hora, 3 horas, Hasta mañana) van «a la vista», sin botón Posponer intermedio. También en pantallas anchas.
- D5 (2026-11-03, usuario): Guardar en una barra fija abajo, visible en todas las pestañas; Cerrar es una X en el encabezado fijo. También en pantallas anchas, con las acciones como una sección más antes del pie.
- D6 (2026-11-03, usuario): en el celular, el panel ocupa toda la pantalla.
- D7 (2026-11-03, usuario): siempre abre en la pestaña Tarea, al crear y al editar.
- D8 (2026-11-03, usuario): si Guardar falla, el panel salta a la primera pestaña con error (Tarea antes que Cuándo) y marca las pestañas con error.
- D9 (2026-11-03, usuario): los iconos van siempre con texto, salvo la X y el botón de elegir emoji cuando no hay emoji.
- D10 (2026-11-03, usuario): sin acciones disponibles, por ejemplo al crear, la pestaña Acciones no aparece.
- D11 (2026-11-03, orquestador): fuera de alcance, son features posteriores ya decididas: avisos de cambios sin guardar, botón Atrás de Android y orientación vertical. Hasta entonces, las acciones y Cerrar siguen descartando los cambios sin guardar como hoy.
- D12 (2026-11-03, analyst): «celular» es el mismo corte de D2: hasta 40rem inclusive hay pestañas y pantalla completa; por encima, secciones seguidas y el panel con el ancho y la ubicación de hoy. Porque D2 y D6 describen el mismo caso y un segundo corte crearía combinaciones que nadie pidió.
- D13 (2026-11-03, analyst): en pantallas anchas cada sección lleva como título el nombre de su pestaña (Tarea, Cuándo, Acciones), con el mismo contenido y orden de D3, incluida la grilla de Se repite. Porque D5 las llama secciones y así las dos presentaciones son el mismo panel.
- D14 (2026-11-03, analyst): el encabezado y la barra de pestañas quedan fijos; solo se desplaza el contenido, y cada pestaña se abre desde arriba. Se cambia de pestaña solo tocándola, sin deslizar. Porque D5 ya fija el encabezado, y deslizar no se pidió y competiría con el desplazamiento del contenido.
- D15 (2026-11-03, analyst): cambiar de pestaña o de ancho no pierde nada de lo escrito, incluido el texto sin confirmar del campo Etiquetas, y Guardar considera todas las pestañas. Porque §6.2 define un solo formulario y solo Cerrar descarta cambios.
- D16 (2026-11-03, analyst): una pestaña se marca mientras alguno de sus campos muestra un error, sea cual sea su origen (al guardar o el error en vivo de Etiquetas); la marca dura lo que dura el mensaje. Los errores de Título y Etiquetas son de Tarea; los de fecha límite, Cada, días y horario, de Cuándo. Porque D3 ubica esos campos y la marca solo señala lo que §6.2 ya muestra.
- D17 (2026-11-03, analyst): si Guardar falla, además de lo que dice D8, el contenido se desplaza hasta el primer campo con error, también en pantallas anchas, donde no hay pestañas. Porque D5 deja Guardar siempre a la vista, así que el error puede quedar fuera de pantalla, y §6.2 pide que el panel lo muestre.
- D18 (2026-11-03, analyst): al editar, la pestaña Acciones aparece siempre, porque Borrar tarea está disponible en toda edición (§6.2); D10 solo la quita al crear. Dentro de ella, cada acción sigue las condiciones de §5.8, §5.9 y §6.2, y se actualiza si otro dispositivo cambia la tarea con el panel abierto.
- D19 (2026-11-03, analyst): el selector de emoji y la confirmación de Borrar tarea siguen abriéndose sobre el panel como hoy; al cerrarlos se vuelve a la misma pestaña. Porque el pedido es sobre el panel y §6.2 ya define esos dos flujos.
- D20 (2026-11-03, analyst): con pantalla completa siguen visibles sin tapar controles la franja "Sin conexión" (§7, mientras no hay red se ve) y el aviso de deshacer (§5.4, se ve hasta que expira, sobre la barra de Guardar). Porque esas reglas no tienen excepción para el panel.
- D21 (2026-11-03, analyst): abrir el panel no enfoca ningún campo, así el teclado del celular no aparece hasta que se toca uno. Es el comportamiento de hoy y D7 no pide cambiarlo.
- D22 (2026-11-03, analyst): la X y el botón de elegir emoji sin texto visible (D9) conservan los nombres accesibles «Cerrar» y «Elegir emoji». Porque §6.2 nombra esos botones así y el cambio es solo visual.
- D23 (2026-11-03, usuario): pregunta del teclado abierto y la barra de Guardar: «Se oculta mientras se escribe».
- D24 (2026-11-03, usuario): pregunta de qué elementos llevan icono además de la X y el botón de elegir emoji: «Pestañas y acciones».
- D25 (2026-11-03, analyst): D23 es la única excepción a «visible» de D5: la barra de Guardar se oculta solo mientras el teclado en pantalla está abierto, en cualquier pestaña y ancho, y vuelve al cerrarse aunque el campo siga enfocado. Depende del teclado y no del foco, porque D23 responde a la falta de lugar: un campo enfocado sin teclado en pantalla, como en la compu o en los selectores de fecha y hora, no oculta la barra. El encabezado y las pestañas siguen fijos (D14).
- D26 (2026-11-03, analyst): el teclado no cambia cómo se envía el formulario: Enter en un campo de una línea sigue guardando como hoy, Enter en Nota agrega una línea (§6.2) y Enter en Etiquetas elige la sugerencia. Si ese Guardar falla, valen D8 y D17. Porque D23 oculta la barra, no el acto de guardar, y nadie pidió cambiar el teclado físico ni el del celular.
- D27 (2026-11-03, analyst): precisa D20 con D23: con la barra oculta, el aviso de deshacer se ve sobre el teclado, porque §5.4 no tiene excepción. «Sin tapar controles» vale para el encabezado, las pestañas y Guardar: el aviso puede pasar por encima del contenido, que se puede desplazar, durante sus 5 segundos, igual que hoy pasa sobre la lista de Pendientes. La franja "Sin conexión" no cambia.
- D28 (2026-11-03, analyst): D24 alcanza exactamente a las pestañas Tarea, Cuándo y Acciones y a las opciones de Posponer, Quitar posponer, Pausar/Reanudar y Borrar tarea, lo enumerado en la pregunta. Guardar, Agregar horario, Quitar, Quitar emoji, los títulos de sección de pantallas anchas (D13) y los diálogos quedan solo con texto. Las acciones llevan icono en todos los anchos, porque D3, D4 y D5 las tratan como los mismos controles. La marca de error de D16 se distingue del icono de la pestaña. Los iconos viajan con la app, porque §2 y §7 exigen que funcione sin conexión.

## Artefactos

- Gherkin: `features/panel-pestanas.feature` (S1, S2, S3, S4, S5, S6, S7, S8, S9, S10, S11, S12, S13, S14, S15, S16, S17, S18, S19)
- QA: `qa/panel-mobile.md`

Solo van a Gherkin las reglas que deciden qué se muestra (corte de 40rem, pestañas de crear y editar, marca de error por sección, destino al fallar Guardar, barra de Guardar con el teclado). Disposición, orden de campos, iconos, barras fijas, pantalla completa, "nada se pierde", S1/S2/S4-S8/S10/S11/S14/S18/S19 y el resto de la presentación se verifican en `qa/panel-mobile.md`; no hay Gherkin posible sin inventar reglas.

## core

- **Puede editar**: `src/lib/core/panel-en-pestanas.ts`, `src/lib/core/panel-en-pestanas*.test.ts`
- **Reglas**: S3, S9, S12, S13, S15, S16, S17
- **Reusa**: ninguna función existente; el campo de cada error ya lo conocen `src/lib/core/nombre-de-tarea.ts`, `etiquetas-escritas.ts` y `horario.ts` (que dicen qué campo falla), pero el core de este feature solo recibe los nombres de campo como dato: `Título`, `Etiquetas`, `fecha límite`, `Cada`, `días`, `horario`.
- **Exporta (sugerido)**: `presentacionDelPanel(anchoRem)` (pestañas hasta 40rem inclusive), `seccionesDelPanel(modo)`, `seccionesMarcadas(camposConError)`, `destinoAlFallarGuardar(camposConError, presentacion)` (pestaña y primer campo, en el orden Título, Etiquetas, fecha límite, Cada, días, horario) y `barraDeGuardarVisible(tecladoAbierto)`.
- **Gate**: `node scripts/gate.ts core`

## acceptance

- **Puede editar**: `acceptance/steps/panel-pestanas.ts`, `acceptance/steps/index.ts`, `acceptance/oracle*.ts`, `acceptance/equivalence.ts`, `docs/pipeline/pendientes.txt`
- **Features a conectar**: `features/panel-pestanas.feature`
- **Pasos nuevos**:
  - `una pantalla de <ancho> rem de ancho`
  - `el panel se presenta <presentacion>`
  - `el panel se abre para <modo>`
  - `el panel ofrece las secciones <secciones>`
  - `la pestaña abierta es <abierta>`
  - `el panel muestra errores en los campos <campos>`
  - `las secciones marcadas son <marcadas>`
  - `el guardado falla con errores en los campos <campos>`
  - `el panel salta a la pestaña <pestana>`
  - `el contenido se desplaza hasta el campo <campo>`
  - `el teclado en pantalla está <teclado>`
  - `el foco está <foco>`
  - `la barra de Guardar está <barra>`
- **Oráculo**: reglas nuevas del spec en Then de clasificación: corte de 40rem, secciones por modo, sección de cada campo, orden de campos para el primer error y barra oculta solo con el teclado abierto.
- **Gate**: `node scripts/gate.ts acceptance`

## ui

- **Puede editar**: `src/lib/ui/PanelTarea.svelte`, `src/lib/ui/CampoEtiquetas.svelte`, `src/lib/ui/SelectorEmoji.svelte`, `src/lib/ui/AvisoDeshacer.svelte`, `src/lib/ui/FranjaSinConexion.svelte`, `src/lib/ui/Pendientes.svelte`, `src/lib/ui/estilos.css`, `src/lib/ui/iconos/*.svelte`, `src/lib/adapters/teclado.ts`, `src/routes/+layout.svelte`, `src/routes/+page.svelte`
- **Comportamiento visible**: `qa/panel-mobile.md`
- **Gate**: `node scripts/gate.ts ui`

## cleaner · architect · hardener · qa

## Log

- L1 (2026-11-03): en algunas tareas el modal no entra en la pantalla del celular, hagamos un rediseño para mobile q permita mostrar mejor todas las opciones, podemos emplear iconos si hace falta
- L2 (2026-11-03, orquestador): evidencia medida a 360x640 en una periódica pendiente: el formulario tiene scrollWidth 502 con clientWidth 360, Guardar termina en x=486 fuera de pantalla y el campo Título se estira hasta x=486. La causa es `.acciones` sin `flex-wrap` en `src/lib/ui/PanelTarea.svelte`.
