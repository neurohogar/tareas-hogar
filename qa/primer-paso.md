# QA: primer paso de la tarea

Verifica, solo por la interfaz:

- el campo **Primer paso** del panel de edición: una línea, sin texto de ejemplo, justo debajo del título (con su emoji) y antes de la nota; arranca vacío al crear y con el valor actual al editar; Enter guarda; se recortan los espacios; vacío o solo espacios deja la tarea sin primer paso; no tiene largo máximo y nunca rechaza un guardado;
- que la fila de una tarea `pendiente` o `atrasada` con primer paso dice, en su propia línea debajo del título, `Primer paso: ` seguido del texto, completo (en varias líneas si hace falta), en el mismo tamaño y color que el esfuerzo y el horario y sin énfasis; y que tocarlo es tocar la fila;
- que las filas `en espera` (completadas, pospuestas, por su horario o de calendario antes de su ocurrencia), las completadas y las pausadas no muestran el primer paso, y que la línea desaparece y vuelve sola con el estado de cada momento (completar, deshacer, posponer, pausar, reanudar, el paso del tiempo);
- que el primer paso no tiene estado: completar, posponer, pausar, reanudar, deshacer y cambiar de tipo o de modo no lo borran ni lo cambian, una periódica que vuelve muestra el mismo, y no hay forma de marcarlo como hecho ni indicador de avance;
- que no cambia el estado, el orden de la lista, los filtros ni **Solo rápidas**, y que el nombre de la tarea sigue siendo emoji y título;
- que no se ve en el Historial, en el aviso de deshacer, en **Anotaciones** ni en el texto copiado;
- **Cambios sin guardar** con el campo y el caso de dos dispositivos.

Cubre spec §4.1 (`primerPaso`, **Primer paso**), §6.1 (fila), §6.2 (campo **Primer paso**, orden de las secciones, **Cambios sin guardar**) y §7 (conflictos por campo).

Fuera de alcance: las reglas de estado y de orden en sí (`qa/puntual.md`, `qa/periodica-relativa.md`, `qa/periodica-calendario.md`, `qa/horario.md`, `qa/orden-pendientes.md`), que cubren los `.feature`; el contenido de `qa/emoji-y-nota.md` más allá de su posición relativa al campo.

## Entorno

- Firebase Emulator Suite (Auth + Firestore) con datos limpios al inicio de cada flujo.
- Cada flujo parte de un contexto de navegador nuevo, con sesión iniciada con la cuenta `qa@example.com` del Auth Emulator (Flujo 1 de `qa/periodica-relativa.md`).
- Reloj simulado del navegador (`page.clock`) instalado **antes** de abrir la app, en la hora local que indica cada flujo (zona `America/Argentina/Buenos_Aires`), detenido (`page.clock.pauseAt`).
  - "A las X" y "Avanzar el reloj a X" significan adelantarlo hasta X (`page.clock.runFor` o `fastForward`) y esperar a que la pantalla se actualice sola, sin recargar.
- Crear una tarea: tocar **+**, escribir el título, elegir la opción de **Se repite** que indica el paso (controles de `qa/puntual.md`, `qa/periodica-relativa.md` y `qa/periodica-calendario.md`), horario como en `qa/horario.md`, escribir el **Primer paso** si el paso lo da y guardar.
- "Posponer X con la opción O": tocar la fila X y elegir O entre las opciones de **Posponer** (`qa/posponer.md`). "Pausar X" y "Reanudar X": tocar la fila X y el botón **Pausar** o **Reanudar** del panel (`qa/pausar.md`); solo las periódicas se pausan.
- **Mostrar completadas**, **Mostrar pausadas** y **Solo rápidas** quedan apagados salvo que el flujo diga encenderlos.
- **Dos dispositivos** (Flujo 8): dos contextos A y B con la misma cuenta y el mismo reloj simulado. "B sin conexión" es `browserContext.setOffline(true)`; "B vuelve a tener conexión", volverlo online y esperar a que las dos pantallas se actualicen solas.

Semana de referencia: lunes 2026-11-09, martes 10, miércoles 11, jueves 12, viernes 13, sábado 14, domingo 15.

## Contrato observable

- **Campo Primer paso**: en el panel (**Nueva tarea** y **Editar tarea**), sección **Tarea**, un campo de texto de una línea (rol `textbox`, etiqueta **Primer paso**) sin `placeholder`. En el orden de la sección, de arriba hacia abajo: el título con el botón de emoji, el campo **Primer paso**, la **Nota**, el esfuerzo y las etiquetas. Al crear está vacío; al editar muestra el valor guardado. Enter dentro del campo guarda, como en el campo **Título**.
- **Línea de la fila**: dentro de la fila de la tarea, un texto que empieza con `Primer paso: ` y sigue con el texto guardado, en su propia línea debajo del título. "La fila dice P" significa que ese texto es exactamente `Primer paso: P`. Una fila sin primer paso, o que no lo muestra, no contiene `Primer paso`.
- **Estilo de la línea**: el mismo `color` y el mismo `font-size` computados que el texto de esfuerzo (`Rápida`, `Media`, `Larga`) o el de horario de la misma fila o de otra; `font-weight` normal, sin subrayado ni color propio; la fila no cambia de fondo. No tiene recorte (sin `text-overflow: ellipsis`, sin `overflow: hidden` ni `max-height` que corten): el texto completo es visible, en varias líneas si hace falta.
- **Sin controles propios**: la línea no tiene botón, checkbox ni campo; el único checkbox de la fila es el de la tarea. Tocar la línea es tocar la fila: abre el panel **Editar tarea**.
- **Aviso, Historial, Anotaciones, texto copiado**: los de `qa/historial-deshacer.md`, `qa/anotacion.md` y `qa/reintento-y-aviso-de-copia.md`; ninguno contiene `Primer paso` ni el texto del primer paso.
- **Lista**: "La lista es A, B, C" significa exactamente esas filas, de arriba hacia abajo.

## Flujo 1: el campo en el panel y crear con primer paso

Precondición: lista vacía, reloj en `2026-11-13T10:00:00` (viernes).

1. Tocar **+**. En el panel **Nueva tarea**, el campo **Primer paso** existe, está vacío y no tiene texto de ejemplo. En la sección **Tarea**, el orden vertical es: **Título** (con el botón de emoji), **Primer paso**, **Nota**, esfuerzo, etiquetas.
2. Escribir `Lavar` en **Título** y `Separar la ropa blanca` en **Primer paso**. Con el foco en **Primer paso**, apretar Enter: el panel guarda y se cierra. La fila de `Lavar` dice `Primer paso: Separar la ropa blanca`, debajo del título.
3. Tocar **+**, escribir `Barrer` (**No se repite**, sin fecha límite) y guardar sin tocar **Primer paso**: la fila de `Barrer` no contiene `Primer paso`.
4. Tocar **+**, elegir **Intervalo** cada `2` **días**, título `Regar`, **Primer paso** `Llenar la regadera`, esfuerzo **Rápida**, y guardar: la fila dice `Primer paso: Llenar la regadera` y también muestra `Rápida`. Repetir con **Días de la semana** y **martes** (`Basura`, `Atar la bolsa llena`) y con esfuerzo **Sin estimar** (`Lavar los platos`, `Poner el agua a calentar`): cada fila muestra su línea.
5. Tocar la fila `Lavar`: el panel **Editar tarea** muestra **Primer paso** con `Separar la ropa blanca`. Tocar la fila `Barrer`: **Primer paso** está vacío. Recargar: las filas siguen igual.

## Flujo 2: editar, recortar, vaciar y texto largo

Precondición: lista con `Lavar` (**No se repite**, sin fecha límite) con **Primer paso** `Separar la ropa blanca`, reloj en `2026-11-13T10:00:00`.

1. Abrir la fila, escribir en **Primer paso** `  Juntar las llaves  ` (con espacios al inicio y al final) y guardar: la fila dice `Primer paso: Juntar las llaves`. Reabrir: el campo tiene exactamente `Juntar las llaves`.
2. Pegar en **Primer paso** un texto de dos líneas (`uno`, salto de línea, `dos`): el campo queda en una sola línea, sin salto de línea (el navegador aplana el pegado), y no hay forma de escribir un salto de línea con Enter (Enter guarda). Guardar: el texto de la fila no tiene salto de línea entre `uno` y `dos`. Reabrir: el campo sigue en una línea.
3. Vaciar el campo y guardar: la fila ya no contiene `Primer paso`. Reabrir: **Primer paso** está vacío. Recargar: sigue sin línea.
4. Escribir de nuevo `Separar la ropa blanca` y guardar. Abrir, escribir solo espacios en **Primer paso** y guardar: no hay error ni mensaje de rechazo; la fila ya no contiene `Primer paso` y reabrir muestra el campo vacío.
5. Pegar en **Primer paso** un texto de 5000 caracteres (por ejemplo `a` repetida) y guardar: se acepta sin error ni advertencia de largo. Reabrir: tiene los 5000 caracteres.
6. Escribir en **Primer paso** un texto largo con espacios, de unos 160 caracteres (`Abrir el cajón de abajo, sacar toda la ropa blanca y separarla en dos pilas: la que va con agua caliente y la que no se mezcla con nada de color oscuro ni delicado`), y guardar. En un celular (390 × 844): la fila muestra todo el texto, en varias líneas, sin `…` ni corte; el texto visible de la línea es exactamente `Primer paso: ` más ese texto.

## Flujo 3: la línea en la fila (posición, estilo, toque)

Precondición: lista vacía, reloj en `2026-11-13T10:00:00`. Crear `Pagar la luz` con **No se repite**, fecha límite `2026-11-10`, esfuerzo **Rápida** y **Primer paso** `Buscar la factura`; y `Cambiar foco` con **No se repite**, sin fecha límite y **Primer paso** `Sacar la escalera`.

1. **Pagar la luz** está `atrasada` y **Cambiar foco** `pendiente`: la fila de **Pagar la luz** dice `Primer paso: Buscar la factura`, y la de **Cambiar foco**, `Primer paso: Sacar la escalera`, cada una en su propia línea, debajo del título (la línea queda más abajo que el título en la pantalla).
2. El texto de la línea de **Pagar la luz** tiene el mismo `color` y `font-size` que su texto `Rápida`, no está en negrita ni subrayado y no es rojizo. La fila no cambió de fondo respecto de una fila sin primer paso.
3. Las filas no tienen ningún campo ni botón nuevo: el único checkbox de la fila es el de la tarea, y no hay marca de «hecho» ni indicador de avance del primer paso.
4. Tocar la línea `Primer paso: Sacar la escalera`: se abre el panel **Editar tarea** de **Cambiar foco** (igual que tocar el título). Cerrarlo sin cambios.
5. Tocar el checkbox de **Cambiar foco**: completa la tarea; la línea no se marca ni cambia de ningún modo antes de desaparecer (ver Flujo 4).

## Flujo 4: dónde se ve y cuándo desaparece y vuelve

Precondición: lista vacía, reloj detenido en `2026-11-13T10:00:00` (viernes). Encender **Mostrar completadas**.

1. Crear `Cambiar foco` con **No se repite**, sin fecha límite y **Primer paso** `Sacar la escalera`; `Pagar` con **No se repite**, fecha límite `2026-11-10` y **Primer paso** `Buscar la factura`; `Regar` con **Intervalo** cada `8` **horas** y **Primer paso** `Llenar la regadera`.
2. `Pagar` (atrasada) y `Cambiar foco` (pendiente) muestran su línea; `Regar` (nunca completada: pendiente) también.
3. Tocar el checkbox de **Regar**: queda `en espera`, completada, y su fila ya no contiene `Primer paso`. Avanzar el reloj a `2026-11-13T17:59:00`: sigue sin línea. Avanzar a `2026-11-13T18:00:00`: **Regar** vuelve a `pendiente` y su fila dice `Primer paso: Llenar la regadera`, igual que antes.
4. Avanzar a `2026-11-14T02:00:00`: **Regar** está `atrasada` y sigue diciendo `Primer paso: Llenar la regadera`.
5. Tocar el checkbox de **Cambiar foco** (puntual): aparece el aviso `Completaste «Cambiar foco»` sin ningún `Primer paso`. La fila (completada, con **Mostrar completadas**) no contiene `Primer paso`. Tocar **Deshacer** dentro de los 5 segundos: la fila vuelve a `pendiente` y dice `Primer paso: Sacar la escalera`.
6. Posponer **Cambiar foco** con la opción **3 horas**: pasa a `en espera` y su fila no contiene `Primer paso`. Posponer **Pagar** con la opción **Hasta mañana**: tampoco. Avanzar el reloj hasta que venza la posposición de **Cambiar foco**: la línea vuelve sola con su texto; **Pagar** (atrasada de nuevo al vencer) también.
7. Tocar la fila **Regar** y **Pausar**: la fila ya no se ve. Encender **Mostrar pausadas**: **Regar** se ve pausada (dice «Pausada») y no contiene `Primer paso`. Tocar la fila, **Reanudar**: **Regar** queda `pendiente` y la fila dice `Primer paso: Llenar la regadera`.
8. Crear `Basura` con **Días de la semana** y **martes** y **Primer paso** `Atar la bolsa llena`, con el reloj en el viernes: está `en espera` hasta el martes 17 y no contiene `Primer paso`. Avanzar el reloj a `2026-11-17T09:00:00`: está `pendiente` y dice `Primer paso: Atar la bolsa llena`.
9. Crear `Llamar` con **No se repite**, sin fecha límite, horario **Desde** `08:00` **Hasta** `09:00` y **Primer paso** `Buscar el número`: con el reloj en `2026-11-17T09:00:00` está fuera de su ventana (`en espera`) y no contiene `Primer paso`. Avanzar a `2026-11-18T08:00:00`: está `pendiente` y dice `Primer paso: Buscar el número`.

## Flujo 5: atrasada con el checkbox deshabilitado

Precondición: lista vacía, reloj detenido en `2026-11-09T09:00:00` (lunes).

1. Crear `Lavar` con **No se repite**, fecha límite `2026-11-10`, horario **Desde** `08:00` **Hasta** `11:00` y **Primer paso** `Separar la ropa blanca`.
2. Avanzar el reloj a `2026-11-11T07:00:00` (el día límite ya pasó y la ventana de hoy aún no abrió): **Lavar** está `atrasada`, con el checkbox deshabilitado, y su fila dice `Primer paso: Separar la ropa blanca`.
3. Avanzar a `2026-11-11T08:00:00`: el checkbox queda habilitado y la fila sigue diciendo `Primer paso: Separar la ropa blanca`.

## Flujo 6: el primer paso no cambia con las acciones de la tarea

Precondición: lista vacía, reloj en `2026-11-13T10:00:00`. **Mostrar completadas** y **Mostrar pausadas** encendidos.

1. Crear `Regar` con **Intervalo** cada `2` **días** y **Primer paso** `Llenar la regadera`. Tocar su checkbox. Abrir la fila: **Primer paso** sigue valiendo `Llenar la regadera`. Cerrar.
2. Pausar **Regar** y abrir su fila: **Primer paso** vale `Llenar la regadera`. **Reanudar**: abrir la fila, sigue igual.
3. Tocar el checkbox de **Regar** y tocar **Deshacer** en el aviso: abrir la fila, **Primer paso** sigue igual.
4. En el panel de **Regar**, cambiar **Se repite** a **Días de la semana** con **martes** y guardar: reabrir, **Primer paso** sigue valiendo `Llenar la regadera`. Cambiar **Se repite** a **No se repite** y guardar: reabrir, sigue igual. Volver a **Intervalo** cada `2` **días** y guardar: sigue igual.
5. Crear `Cambiar foco` con **No se repite** y **Primer paso** `Sacar la escalera`, posponerla con la opción **3 horas** y abrir la fila: **Primer paso** sigue valiendo `Sacar la escalera`.
6. Recargar la página: ambos valores se mantienen. No existe en ninguna pantalla un control para marcar el primer paso como hecho.
7. Crear una tarea sin primer paso (`Barrer`) y abrir su fila: **Primer paso** está vacío y la fila no contiene `Primer paso`, como antes de existir el campo.

## Flujo 7: lo que no cambia y lo que no lo muestra

Precondición: lista vacía, reloj detenido en `2026-11-13T10:00:00`. Dos etiquetas creadas con los controles de `qa/etiquetas.md`.

1. Crear `Barrer` y `Lavar`, ambas con **No se repite**, sin fecha límite y esfuerzo **Rápida**; `Planchar` con **No se repite**, sin fecha límite y esfuerzo **Larga**. Anotar el orden de la lista y el texto de cada fila.
2. Escribir en `Lavar` el **Primer paso** `Separar la ropa blanca` y guardar. El orden de la lista es el mismo que anotó; las filas de **Barrer** y **Planchar** son idénticas a antes. Repetir poniendo el primer paso en `Barrer` y quitándoselo a `Lavar`: el orden de la lista sigue siendo el mismo.
3. Tocar **Solo rápidas**: la lista deja a **Barrer** y **Lavar**, con o sin primer paso, y **Planchar** (**Larga**) no se ve. Apagarlo. Asignar una etiqueta a `Lavar` y elegirla en **Filtrar por etiqueta**: la lista es **Lavar** (con su línea de primer paso). **Todas**: vuelve la lista completa.
4. Poner a `Lavar` el emoji `🧺` con el selector: el título de la fila dice `🧺 Lavar` y la línea de primer paso sigue en su propia línea debajo. El título no incluye el primer paso.
5. Tocar el checkbox de **Lavar**: el aviso dice `Completaste «🧺 Lavar»`, sin `Primer paso`. Ir a **Historial**: la entrada dice `🧺 Lavar` con su hora, sin `Primer paso`.
6. Tocar **Anotar**, escribir `salió bien`, **Me sirvió**, con `Lavar` en la lista. Ir a **Anotaciones**: la anotación muestra el nombre de la tarea (`🧺 Lavar`) y el texto `salió bien`, sin `Primer paso`. Con el portapapeles funcionando (`qa/reintento-y-aviso-de-copia.md`), tocar **Copiar**: el texto copiado no contiene `Primer paso` ni `Separar la ropa blanca`.

## Flujo 8: cambios sin guardar con el campo

Precondición: `Lavar` con **Primer paso** `Separar la ropa blanca` y `Barrer` sin primer paso, reloj en `2026-11-13T10:00:00`.

1. Abrir `Lavar`, cambiar **Primer paso** a `Juntar las llaves` y tocar la X del panel: aparece el aviso "Tenés cambios sin guardar". Elegir **Descartar**: la fila sigue diciendo `Primer paso: Separar la ropa blanca`.
2. Abrir `Lavar`, cambiar **Primer paso** a `Juntar las llaves`, volver a escribir `Separar la ropa blanca` y tocar la X: el panel se cierra directo, sin aviso.
3. Abrir `Lavar`, escribir `Separar la ropa blanca` con espacios al inicio y al final (el mismo valor) y tocar la X: se cierra directo, sin aviso.
4. Abrir `Lavar`, vaciar **Primer paso** y tocar la X: aparece el aviso. **Descartar**. Repetir escribiendo solo espacios: aparece el aviso. **Descartar**.
5. Abrir `Barrer`, escribir solo espacios en **Primer paso** y tocar la X: se cierra directo, sin aviso. Abrir `Barrer`, escribir `Barrer abajo` y tocar la X: aparece el aviso. **Descartar**.
6. Tocar **+**, tocar la X: se cierra directo. Tocar **+**, escribir en **Primer paso** `Separar la ropa blanca` y tocar la X: aparece el aviso. **Descartar**.

## Flujo 9: dos dispositivos

Precondición: lista vacía, reloj en `2026-11-13T10:00:00` en A y en B.

1. En A, crear `Lavar` con **No se repite** y sin fecha límite. B la ve aparecer.
2. B sin conexión. En B, escribir **Primer paso** `Separar la ropa blanca` y guardar. En A, cambiar **Título** a `Lavar a mano` y guardar.
3. B vuelve a tener conexión: en A y en B la fila dice `Lavar a mano` y `Primer paso: Separar la ropa blanca` (los dos cambios se conservaron).
4. B sin conexión. En B, cambiar **Primer paso** a `Juntar las llaves`. En A, cambiar **Nota** a `Usar guantes`. B vuelve a tener conexión: en A y en B la fila dice `Primer paso: Juntar las llaves` y la nota es `Usar guantes`.
5. B sin conexión. En B, cambiar **Primer paso** a `Buscar el detergente`. En A, cambiar **Primer paso** a `Poner el agua a calentar`. B vuelve a tener conexión: en A y en B la fila dice `Primer paso: Buscar el detergente` (el último cambio en llegar es el de B).
6. B sin conexión. En B, vaciar **Primer paso** y guardar. En A, cambiar **Primer paso** a `Sacar la escalera` y guardar. B vuelve a tener conexión: en A y en B la fila no contiene `Primer paso` (el último cambio en llegar es el de B, que lo quitó).
7. B sin conexión. En B, escribir `Barrer abajo` en **Primer paso** y guardar. En A, vaciar **Primer paso** y guardar. B vuelve a tener conexión: en A y en B la fila dice `Primer paso: Barrer abajo` (el último cambio en llegar es el de B).
8. B sin conexión. En B, escribir `Separar la ropa blanca` en **Primer paso** y guardar. En A, abrir la fila y guardar sin cambiar nada. B vuelve a tener conexión: en A y en B la fila dice `Primer paso: Separar la ropa blanca` (guardar sin cambios no pisó el cambio de B).
