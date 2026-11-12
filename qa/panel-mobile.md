# QA: panel de edición en pestañas (celular)

Verifica, solo por la interfaz, el panel **Nueva tarea** / **Editar tarea** en el celular (hasta 40rem de ancho, inclusive) y en pantallas anchas:

- las pestañas **Tarea**, **Cuándo** y **Acciones**, su contenido y su orden; que siempre abre en **Tarea**; que **Acciones** no aparece al crear;
- el panel a pantalla completa, con encabezado (título y **X**), barra de pestañas y barra de **Guardar** fijos, y el contenido que se desplaza desde arriba en cada pestaña;
- que nada se pierde al cambiar de pestaña o de ancho, y que **Guardar** considera todas las secciones;
- las marcas de error en las pestañas, el salto a la primera pestaña con error y el desplazamiento hasta el primer campo con error;
- el teclado en pantalla: no se abre solo, oculta la barra de **Guardar** mientras está abierto y no cambia cómo se envía el formulario;
- los iconos de pestañas y acciones, y los nombres accesibles de la **X** y del botón de elegir emoji;
- lo que se ve sobre el panel: selector de emoji, confirmación de **Borrar tarea**, franja "Sin conexión" y aviso de deshacer;
- el panel en pantallas anchas: secciones seguidas, sin pestañas.

Cubre spec §6.2 (Presentación del panel) y las reglas de campos y acciones de §6.2, §5.8, §5.9, §5.4 y §7 en cuanto a dónde se ven.

Fuera de alcance: las reglas de cada campo y acción (`qa/puntual.md`, `qa/periodica-relativa.md`, `qa/periodica-calendario.md`, `qa/horario.md`, `qa/etiquetas.md`, `qa/emoji-y-nota.md`, `qa/esfuerzo.md`, `qa/posponer.md`, `qa/pausar.md`, `qa/editar-borrar.md`), el aviso de cambios sin guardar y el botón Atrás de Android (`qa/cambios-sin-guardar.md`), y la orientación vertical.

## Entorno

- Firebase Emulator Suite (Auth + Firestore) con datos limpios al inicio de cada flujo.
- Cada flujo parte de un contexto de navegador nuevo, con sesión iniciada con la cuenta `qa@example.com` del Auth Emulator (Flujo 1 de `qa/periodica-relativa.md`).
- Reloj simulado del navegador (`page.clock`) instalado **antes** de abrir la app, detenido (`page.clock.pauseAt`), en la zona `America/Argentina/Buenos_Aires`. "Avanzar el reloj a X" lo adelanta hasta X y espera a que la pantalla se actualice sola.
- **Celular**: viewport de 360x640 px (22.5rem) con emulación táctil. **Ancho**: 1024x768 px (64rem). Los cortes de 40rem son 640 px (celular) y 641 px (ancho); la fuente raíz es de 16 px.
- **Teclado en pantalla abierto**: se emula reduciendo el alto del viewport visual (por ejemplo, a 640x300 px tras tocar un campo de texto en el celular); "cerrarlo" es volver al alto original. Es la única manera de verlo en el navegador de pruebas.
- Crear una tarea: tocar **+**, escribir el título, elegir la opción de **Se repite**, guardar.
- Dos dispositivos (Flujo 8): dos contextos A y B con la misma cuenta y el mismo reloj.
- **Mostrar completadas** y **Mostrar pausadas** quedan apagados.

Semana de referencia: lunes 2026-07-13, martes 14, miércoles 15, jueves 16, viernes 17, sábado 18, domingo 19.

## Contrato observable

- **Panel**: el diálogo con nombre accesible **Nueva tarea** o **Editar tarea**. En el celular ocupa todo el viewport (su caja coincide con el viewport).
- **Encabezado**: contiene el título del panel y un botón con nombre accesible **Cerrar** (la **X**, sin texto visible). Queda fijo: su posición no cambia al desplazar el contenido.
- **Barra de pestañas** (solo en el celular): un `tablist` con una pestaña (`role=tab`) por sección, con nombres **Tarea**, **Cuándo** y **Acciones**, en ese orden; la elegida tiene `aria-selected="true"`. Queda fija bajo el encabezado. Cada pestaña lleva un icono (SVG) junto a su texto.
- **Marca de error de una pestaña**: un indicador distinto del icono, dentro de la pestaña, presente mientras algún campo de esa sección muestra un error y ausente cuando no hay ninguno (nombre accesible: "con errores").
- **Contenido**: lo que hay bajo la barra; en el celular se ve el de la pestaña elegida y se desplaza dentro del panel. Al elegir una pestaña, el contenido empieza arriba (desplazamiento 0).
- **Barra de Guardar**: una barra pegada al borde inferior del panel con el botón **Guardar** (solo texto, sin icono). Visible en todas las pestañas y en pantallas anchas.
- **Sección Tarea**, de arriba abajo: "Pausada" (si corresponde), "Pospuesta hasta HH:MM" o "Pospuesta hasta mañana HH:MM" (si corresponde), "Última vez: …" (solo al editar); el campo **Título** con el botón de emoji a su lado (nombre accesible **Elegir emoji** si no hay emoji, sin texto visible; si hay, el emoji) y **Quitar emoji** debajo; **Nota**; **Esfuerzo**; **Etiquetas**.
- **Sección Cuándo**: **Se repite** con sus cuatro opciones (**No se repite**, **Intervalo**, **Días de la semana**, **Días del mes**) en una grilla de 2 columnas por 2 filas, y los campos de la opción elegida (fecha límite, **Cada**, días); después **Solo en un horario** con sus ventanas, **Agregar horario** y **Quitar**.
- **Sección Acciones** (solo al editar): las opciones de posponer **1 hora**, **3 horas** y **Hasta mañana** visibles, sin botón **Posponer** (o, si está pospuesta, **Quitar posponer**); **Pausar** o **Reanudar** (solo una periódica); y al final, separado del resto y en el color de error, **Borrar tarea**. Cada una lleva un icono junto a su texto.
- **Pantallas anchas**: sin `tablist`; las tres secciones seguidas, cada una con su nombre (**Tarea**, **Cuándo**, **Acciones**) como título sin icono; **Acciones** solo al editar. El panel mide lo de siempre (no ocupa todo el viewport).
- **Sin icono**: **Guardar**, **Agregar horario**, **Quitar**, **Quitar emoji**, los títulos de sección de pantallas anchas y los diálogos.
- **Visible** es dentro del viewport, sin quedar tapado por otro elemento.
- **Aviso** e **Historial**: los de `qa/historial-deshacer.md`. **Franja "Sin conexión"**: la de `qa/pwa-sin-conexion.md`.

## Flujo 1: crear en el celular

Precondición: lista vacía, reloj en `2026-07-15T10:00:00`, viewport de celular.

1. Tocar **+**: el panel **Nueva tarea** ocupa todo el viewport. Ningún campo tiene el foco y el teclado no está abierto.
2. La barra de pestañas tiene **Tarea** y **Cuándo**, en ese orden, y no tiene **Acciones**. La pestaña **Tarea** está elegida y se ve el título, el emoji, la nota, el esfuerzo y las etiquetas; no se ve nada de **Cuándo**. **Guardar** está visible abajo.
3. Tocar **Cuándo**: se ve **Se repite** con las cuatro opciones en 2 filas de 2, **No se repite** elegida (la opción con la que abre el panel al crear), con **Fecha límite** vacía y sin **Cada**, y **Solo en un horario**. **Guardar** sigue visible. Tocar de nuevo **Tarea**.
4. Deslizar horizontalmente el contenido no cambia de pestaña.
5. Escribir `Regar` en el título, tocar **Cuándo**, elegir **Intervalo** (se ven **Cada** y la unidad) con **Cada** `2` **días**, y tocar **Guardar**: el panel se cierra y la lista tiene **Regar**.
6. Tocar **+** y luego **Cerrar** (la **X**): el panel se cierra sin crear nada.

## Flujo 2: editar y las tres pestañas

Precondición: lista vacía, reloj en `2026-07-15T10:00:00`, viewport de celular. Crear `Regar` con **Intervalo** cada `2` **horas**, emoji 🌱, nota `Las del balcón`, esfuerzo **Media (≈ 15 min)**, etiqueta `casa`, y completarla a las `2026-07-15T08:00:00` (para "Última vez"; a las 10:00 vuelve a estar pendiente, así ofrece posponer).

1. Tocar la fila **Regar**: el panel **Editar tarea** abre en **Tarea** (aunque antes se haya cerrado estando en otra pestaña). La barra tiene **Tarea**, **Cuándo** y **Acciones**.
2. En **Tarea**, de arriba abajo: "Última vez: hoy 08:00"; el título `Regar` con el emoji 🌱 al lado y **Quitar emoji** debajo; la nota; el esfuerzo; las etiquetas. No hay "Pausada" ni "Pospuesta".
3. Tocar **Cuándo**: **Intervalo** elegida (la de la tarea, no la inicial de crear), **Cada** `2` **horas**, y después **Solo en un horario** apagado.
4. Tocar **Acciones**: las opciones **1 hora**, **3 horas** y **Hasta mañana** visibles (sin **Posponer**), **Pausar**, y al final, separado y en el color de error, **Borrar tarea**. Cada una con su icono; no hay **Quitar posponer** ni **Reanudar**.
5. Tocar **1 hora**: el panel se cierra y **Regar** se ve pospuesta. Volver a abrirla: abre en **Tarea** y arriba dice "Pospuesta hasta 11:00"; en **Acciones** está **Quitar posponer** (en lugar de las tres opciones) y **Pausar**.
6. Tocar **Quitar posponer**: el panel se cierra y la tarea deja de estar pospuesta.
7. Abrirla, ir a **Acciones** y tocar **Pausar**: el panel se cierra. Abrirla (con **Mostrar pausadas** encendido): arriba de **Tarea** dice "Pausada"; **Acciones** tiene **Reanudar** y no tiene las opciones de posponer.
8. Crear `Pagar` con **No se repite**: su panel, en **Acciones**, no tiene **Pausar** ni **Reanudar** pero sí las opciones de posponer y **Borrar tarea**. Una tarea completada o fuera de su horario conserva al menos **Borrar tarea** en **Acciones**.

## Flujo 3: pantalla completa y barras fijas

Precondición: lista vacía, viewport de celular. Crear una tarea y abrirla en edición.

1. El panel ocupa todo el viewport. Anotar la posición del encabezado, de la barra de pestañas y de **Guardar**.
2. En **Tarea**, agregar `casa`, `cocina`, `jardín`, `limpieza` y `compras` como etiquetas y una nota de 10 líneas, hasta que el contenido no entre. Desplazar el contenido hasta abajo: el encabezado, la barra de pestañas y **Guardar** están en la misma posición que en el paso 1 y ninguno queda tapado por el contenido.
3. Tocar **Cuándo** y volver a **Tarea**: el contenido empieza arriba (desplazamiento 0) en cada pestaña, aunque antes se hubiera desplazado.
4. En **Cuándo**, elegir **Días de la semana** con varias ventanas de horario (**Agregar horario** hasta 4) hasta que no entre: lo mismo, las tres barras fijas y el contenido se desplaza. Ningún control queda fuera del ancho (sin desplazamiento horizontal: `scrollWidth` = `clientWidth`), con 360 px y también con 320 px.

## Flujo 4: nada se pierde

Precondición: lista vacía, viewport de celular, panel **Nueva tarea**.

1. Escribir `Barrer` en el título y la nota `Con cuidado`; en **Etiquetas** escribir `cas` sin confirmar; tocar **Cuándo**, elegir **Días de la semana** con lunes y jueves y un horario de `08:00` a `10:00`.
2. Tocar **Tarea**: el título dice `Barrer`, la nota `Con cuidado` y el campo **Etiquetas** conserva `cas`. Tocar **Cuándo**: lunes y jueves y el horario siguen.
3. Cambiar el ancho del viewport a 1024 px: se ven seguidas las tres secciones con todo lo escrito, incluido `cas`. Volver a 360 px: el panel vuelve a las pestañas con lo mismo.
4. Estando en **Cuándo**, tocar **Guardar**: se crea `Barrer` semanal con lunes y jueves, horario `08:00`-`10:00`, nota `Con cuidado` (sin etiqueta `cas`, porque no se confirmó). Es un solo guardado con todo lo de las dos pestañas.
5. Abrir `Barrer`, cambiar el título a `Barrer más` y tocar **Cerrar** y **Descartar** en el aviso: la lista sigue con `Barrer`. Abrirla, cambiar el título y tocar **Pausar** en **Acciones** (una semanal fuera de su día no ofrece posponer) y **Descartar y pausar** en el aviso: la tarea se pausa y el cambio del título no se guardó.

## Flujo 5: errores

Precondición: lista vacía, viewport de celular.

1. Tocar **+**. Con el título vacío, tocar **Cuándo**, elegir **Intervalo**, dejar **Cada** vacío y activar **Solo en un horario** con `Desde` `10:00` y `Hasta` `09:00`. Tocar **Guardar**: el panel sigue abierto, salta a **Tarea** (la primera pestaña con error) y el contenido está en el campo **Título**, con su error a la vista. **Tarea** y **Cuándo** tienen la marca de error, distinta del icono.
2. Escribir `Regar` en el título: la marca de **Tarea** desaparece en el acto (el error de Título se va); la de **Cuándo** sigue.
3. En **Tarea**, escribir en **Etiquetas** un nombre de 31 caracteres: el error en vivo aparece bajo el campo y **Tarea** vuelve a tener la marca. Borrar caracteres hasta 30: la marca se va.
4. Tocar **Guardar**: salta a **Cuándo** y el contenido está en el primer campo con error (**Cada**). Corregir **Cada** con `2` **días**: la marca de **Cuándo** sigue por el horario; arreglar el horario (`Hasta` `11:00`): la marca se va. Guardar: se crea.
5. Con 1024 px de ancho, abrir **+**, dejar el título vacío y poner `Hasta` antes que `Desde`; tocar **Guardar**: no hay pestañas ni marcas, el panel sigue abierto y el contenido se desplaza hasta el campo **Título** con su error a la vista (aunque el horario también falle).
6. Con 1024 px, abrir otra vez y dejar solo el horario inválido: se desplaza hasta el campo del horario.

## Flujo 6: teclado en pantalla

Precondición: lista vacía, viewport de celular con emulación táctil.

1. Tocar **+**: el panel abre sin foco en ningún campo y la barra de **Guardar** está visible. Tocar el título y escribir `Regar`: con el teclado emulado como abierto, la barra de **Guardar** no se ve; el encabezado y la barra de pestañas siguen fijos.
2. Con el teclado "abierto", tocar **Cuándo** (tocar la pestaña quita el foco del campo y el teclado; se emula tocando de nuevo un campo de texto, **Cada**, con el viewport achicado): la barra de **Guardar** sigue oculta (en cualquier pestaña). Cerrar el teclado (viewport al alto original) con el campo todavía enfocado: la barra de **Guardar** vuelve.
3. Tocar **Cuándo**, activar **Solo en un horario**, y tocar el campo **Desde** (selector de hora): la barra de **Guardar** sigue visible.
4. Con el viewport de 1024 px (compu), tocar el título: la barra de **Guardar** sigue visible con el campo enfocado.
5. Celular, en **Tarea**: teclado abierto, dejar el título vacío y pulsar Enter en el título: intenta guardar, falla y salta a **Tarea** con el error en **Título**; la barra de **Guardar** sigue oculta mientras el teclado esté abierto. Con el título `Regar`, Enter en el título guarda y crea la tarea.
6. En **Nota**, Enter agrega una línea y no guarda. En **Etiquetas**, escribir `cas` con una sugerencia y pulsar Enter elige la sugerencia y no guarda.

## Flujo 7: iconos y nombres accesibles

Precondición: lista vacía, reloj en `2026-07-15T10:00:00`. Repetir en celular y en ancho. Crear `Regar` con **Intervalo** cada `2` **días**.

1. Tocar **+**: en el celular, **Tarea** y **Cuándo** tienen icono junto a su texto. El botón de emoji (sin emoji) tiene nombre accesible **Elegir emoji** y no tiene texto visible; el de cerrar tiene nombre **Cerrar** y no tiene texto visible. **Guardar** no tiene icono. En ancho, los títulos **Tarea** y **Cuándo** no tienen icono.
2. Abrir `Regar`: **Acciones** (celular) con icono; **1 hora**, **3 horas**, **Hasta mañana**, **Pausar** y **Borrar tarea** con icono, cada uno junto a su texto (en celular y en ancho). **Agregar horario** (con **Solo en un horario** encendido) y **Quitar** no tienen icono.
3. Elegir un emoji: el botón muestra el emoji y **Quitar emoji** (sin icono) aparece debajo.
4. Poner el navegador sin conexión (`setOffline(true)`), recargar y abrir `Regar`: los mismos iconos se ven (viajan con la app).

## Flujo 8: dos dispositivos con el panel abierto

Precondición: lista vacía, reloj en `2026-07-15T10:00:00` en A y B; A en celular. Crear `Regar` con **Intervalo** cada `2` **días** en A.

1. En A, abrir `Regar` y tocar **Acciones**: se ven las opciones de posponer y **Pausar**.
2. En B, pausar `Regar`. En A, sin cerrar el panel, la sección **Acciones** pasa a mostrar **Reanudar** y deja de mostrar las opciones de posponer; el panel sigue en **Acciones**. En **Tarea**, arriba, dice "Pausada".
3. En B, reanudarla y posponerla 3 horas. En A, **Acciones** muestra **Quitar posponer** y **Pausar**, y **Tarea** dice "Pospuesta hasta 13:00".

## Flujo 9: sobre el panel

Precondición: lista vacía, reloj en `2026-07-15T10:00:00`, viewport de celular. Crear `Regar` con **Intervalo** cada `2` **días**.

1. Abrir `Regar`, ir a **Cuándo** y tocar el botón de emoji en **Tarea** (volver a **Tarea**): el selector de emoji se abre sobre el panel, con la búsqueda a la vista. Elegir 🌱: se cierra y el panel sigue en **Tarea** con 🌱.
2. Ir a **Acciones** y tocar **Borrar tarea**: aparece la confirmación sobre el panel. Cancelar: se cierra la confirmación y el panel sigue en **Acciones**, la tarea intacta.
3. Con el navegador sin conexión (`setOffline(true)`), la franja "Sin conexión" se ve sin tapar el encabezado, la barra de pestañas ni **Guardar**. Volver a tener conexión: la franja desaparece.
4. Con conexión, completar `Regar` desde la lista (checkbox) y abrir su panel con el aviso todavía a la vista, o completar otra tarea con el panel de `Regar` abierto desde otro dispositivo: el aviso `Completaste «…»` se ve sobre la barra de **Guardar** sin tapar el encabezado ni las pestañas. Con el teclado "abierto" (Flujo 6) la barra de **Guardar** no está y el aviso se ve sobre el teclado.
5. A los 5 segundos el aviso desaparece.

## Flujo 10: el corte de 40rem y las pantallas anchas

Precondición: lista vacía. Crear `Regar` con **Intervalo** cada `2` **días**.

1. Viewport de 640 px: abrir `Regar`; hay barra de pestañas y el panel ocupa todo el viewport.
2. Viewport de 641 px: no hay barra de pestañas; el panel no ocupa todo el viewport (tiene el ancho y la ubicación de siempre).
3. Viewport de 1024 px: las secciones se ven seguidas, con los títulos **Tarea**, **Cuándo** y **Acciones** en ese orden, el contenido y orden del Flujo 2 en cada una, y **Acciones** al final antes de **Guardar**; **Guardar** en la barra fija abajo y **Cerrar** (la **X**) en el encabezado fijo. Desplazar el panel: el encabezado y **Guardar** no se mueven.
4. Crear una tarea con 1024 px: el panel no tiene el título **Acciones**. Abrir `Regar`: lo tiene, con **Borrar tarea** al final en el color de error.
5. Tocar **Guardar** sin cambios en `Regar`: no cambia nada y el panel se cierra.
