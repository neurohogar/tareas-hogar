# QA: versión mínima

Verifica, solo por la interfaz:

- el campo **Versión mínima** del panel (**Nueva tarea** y **Editar tarea**): una línea, con la etiqueta «Versión mínima», sin texto de ejemplo, debajo de los pasos (después de **Agregar paso**) y antes de la **Nota**; Enter guarda; se recortan los espacios; vacío o solo espacios deja la tarea sin versión mínima, sin error; sin largo máximo; el orden de la sección **Tarea**;
- que la fila de una tarea `pendiente` o `atrasada` con versión mínima muestra en su propia línea `Mínima: ` seguido del texto, completo, con el botón de texto **Hice la mínima**, también sin primer paso y debajo de la línea del paso si la hay, con el estilo de la línea del paso; que tocar el texto de la línea abre el panel y que tocar el botón no lo abre ni pasa por **Cambios sin guardar**;
- que la línea y el botón desaparecen y vuelven solos con el estado de cada momento (`en espera`, pospuesta, completada, pausada) y que el botón está deshabilitado como el checkbox;
- **Hice la mínima**: completa la tarea como el checkbox (mismo estado, mismo orden), con el aviso `Completaste «…» · mínima`, **Deshacer** y «Vuelve …» si es periódica; la palabra «Mínima» en el Historial y en el diálogo de **Borrar**, nunca el texto de la mínima; borrar el completado de la mínima (aviso, Historial, checkbox) como cualquier otro;
- que con pasos, **Hice la mínima** funciona en cualquier paso, la tarea vuelve al paso 1 y deshacer devuelve el paso en que iba;
- que la mínima no cambia el orden ni el nombre de la tarea, y que el aviso de deshacer no muestra su texto; que editar o vaciar la versión mínima no toca los completados que ya fueron la mínima;
- **Cambios sin guardar** con el campo y el caso de dos dispositivos.

Cubre spec §4.1 (**Versión mínima**, **Pasos**), §4.4 (`fueMinima`), §5.4 (aviso y deshacer), §5.5 (ventana), §6.1 (fila y botón), §6.2 (campo, orden de la sección, **Cambios sin guardar**), §6.3 (Historial y **Borrar**) y §7 (conflictos por campo, completados de dos dispositivos).

Fuera de alcance: las reglas de estado y de orden en sí (`qa/puntual.md`, `qa/periodica-relativa.md`, `qa/periodica-calendario.md`, `qa/horario.md`, `qa/orden-pendientes.md`), el primer paso y los pasos solos (`qa/primer-paso.md`, `qa/pasos-de-a-uno.md`) y el campo «cuenta como hecha cuando…» de la E4, que es otra feature.

## Entorno

- Firebase Emulator Suite (Auth + Firestore) con datos limpios al inicio de cada flujo.
- Cada flujo parte de un contexto de navegador nuevo, con sesión iniciada con la cuenta `qa@example.com` del Auth Emulator (Flujo 1 de `qa/periodica-relativa.md`).
- Reloj simulado del navegador (`page.clock`) instalado **antes** de abrir la app, en la hora local que indica cada flujo (zona `America/Argentina/Buenos_Aires`), detenido (`page.clock.pauseAt`).
  - "A las X" y "Avanzar el reloj a X" significan adelantarlo hasta X (`page.clock.runFor` o `fastForward`) y esperar a que la pantalla se actualice sola, sin recargar.
  - "Fijar la hora a X" significa llevar el reloj a X justo antes del paso: con el reloj pausado el tiempo corre unos ms por aserción, y los avances de reloj van con holgura (varios segundos de más, nunca justo en el borde).
- Crear una tarea: tocar **+**, escribir el título, elegir la opción de **Se repite** que indica el paso (controles de `qa/puntual.md`, `qa/periodica-relativa.md` y `qa/periodica-calendario.md`), horario como en `qa/horario.md`, escribir **Primer paso**, los pasos y **Versión mínima** que el paso indica y guardar.
- "Posponer X con la opción O": tocar la fila X y elegir O entre las opciones de **Posponer** (`qa/posponer.md`). "Pausar X" y "Reanudar X": tocar la fila X y el botón **Pausar** o **Reanudar** del panel (`qa/pausar.md`); solo las periódicas se pausan.
- **Mostrar completadas** y **Mostrar pausadas** quedan apagados salvo que el flujo diga encenderlos.
- **Dos dispositivos** (Flujo 8): dos contextos A y B con la misma cuenta y el mismo reloj simulado. "B sin conexión" es `browserContext.setOffline(true)`; "B vuelve a tener conexión", volverlo online y esperar a que las dos pantallas se actualicen solas, y además ~10 s quietos antes de mirar.

Semana de referencia: lunes 2026-11-09, martes 10, miércoles 11, jueves 12, viernes 13, sábado 14, domingo 15.

## Contrato observable

- **Campo del panel**: en la sección **Tarea** (**Nueva tarea** y **Editar tarea**), un campo de texto de una línea (rol `textbox`, etiqueta **Versión mínima**, sin `placeholder`), después de **Agregar paso** y antes de la **Nota**. Arranca vacío al crear y con el valor guardado al editar.
- **Línea de la fila**: un texto en su propia línea debajo del título (y debajo de la línea del paso, si la hay): `Mínima: ` seguido del texto. "La fila dice la mínima M" significa que ese texto es exactamente `Mínima: M`. Una fila sin versión mínima, o que no la muestra, no contiene `Mínima`.
- **Botón de la fila**: **Hice la mínima**, un botón de texto chico (rol `button`) junto a esa línea. Está habilitado o deshabilitado igual que el checkbox de la fila.
- **Estilo**: la línea tiene el mismo `color` y `font-size` computados que la línea del paso; `font-weight` normal, sin subrayado ni color propio en el texto ni en el botón; la fila no cambia de fondo. Sin recorte (sin `text-overflow: ellipsis`, sin `-webkit-line-clamp`, sin `max-height`): un texto largo se ve completo en varias líneas.
- **Tocar**: tocar el texto de la línea (fuera del botón) es tocar la fila: abre **Editar tarea**. Tocar **Hice la mínima** no abre el panel ni **Cambios sin guardar**, y sí abre el aviso de completar.
- **Aviso**: el de `qa/historial-deshacer.md`; con **Hice la mínima**, su texto es `Completaste «Regar» · mínima` (con emoji, `Completaste «🌱 Regar» · mínima`); con el checkbox o **Hecho**, sin ` · mínima`. Nunca contiene el texto de la versión mínima.
- **Historial**: cada entrada de un completado de la mínima muestra, después de la hora, la palabra `Mínima` en el mismo texto secundario, sin color ni icono (`08:05 Mínima`); la de un completado entero, solo la hora. Nunca muestra el texto de la versión mínima. El diálogo de **Borrar** de ese completado nombra la tarea, el momento y la palabra `Mínima`.
- **Lista**: "La lista es A, B, C" significa exactamente esas filas, de arriba hacia abajo.

## Flujo 1: el campo en el panel, crear y editar

Precondición: lista vacía, reloj en `2026-11-13T10:00:00` (viernes).

1. Tocar **+**. En **Nueva tarea** hay **Versión mínima**, vacío y sin texto de ejemplo. El orden vertical de la sección es: **Título** (con el botón de emoji), **Primer paso**, **Agregar paso**, **Versión mínima**, **Nota**. Tocar **Agregar paso**: el campo **Paso 2** aparece antes de **Versión mínima**.
2. Escribir `Limpiar baño` en **Título** y `Solo el inodoro` en **Versión mínima**. Con el foco en **Versión mínima**, apretar Enter: el panel guarda y se cierra. La fila de `Limpiar baño` dice la mínima `Solo el inodoro` y tiene **Hice la mínima**.
3. Tocar la fila: **Editar tarea** muestra **Versión mínima** `Solo el inodoro`. Recargar: sigue igual.
4. Escribir en **Versión mínima** `  Solo el lavabo  ` (con espacios al inicio y al final) y guardar. Reabrir: tiene exactamente `Solo el lavabo`.
5. Pegar un texto de dos líneas (`uno`, salto de línea, `dos`): el campo queda en una sola línea y Enter guarda en lugar de escribir un salto. Guardar y reabrir: el texto no tiene salto de línea.
6. Vaciar **Versión mínima** y guardar: la fila ya no contiene `Mínima` ni **Hice la mínima**; reabrir muestra el campo vacío. Escribir `Solo el inodoro` y guardar. Escribir solo espacios y guardar: no hay error ni mensaje de rechazo; la fila no tiene línea y reabrir muestra el campo vacío.
7. Pegar en **Versión mínima** un texto de 5000 caracteres y guardar: se acepta sin error ni advertencia. Reabrir: tiene los 5000.
8. Crear `Barrer` con **No se repite**, sin fecha límite, con solo espacios en **Versión mínima**: se crea sin error y sin línea. Crear `Planchar` sin tocar **Versión mínima**: la fila se ve como antes, sin `Mínima` ni botón.
9. Crear con **Versión mínima** una periódica (`Regar`, **Intervalo** cada `2` **días**, `Solo los helechos`), una de calendario (`Basura`, **Días de la semana** y **martes**, `Solo la de la cocina`): se aceptan; reabrir muestra el valor en cada una. Cambiar de tipo en `Regar` (**No se repite** y de nuevo **Intervalo**), guardando: reabrir conserva `Solo los helechos`.
10. Escribir en **Versión mínima** el texto de unos 160 caracteres `Abrir el cajón de abajo y sacar toda la ropa blanca y separarla en dos pilas: la que va con agua caliente y la que no se mezcla con nada de color oscuro ni delicado` y, en un celular (390 × 844), mirar la fila: la línea se ve completa, en varias líneas, sin cortar ni scroll horizontal.

## Flujo 2: la línea y el botón en la fila

Precondición: lista vacía, reloj en `2026-11-13T10:00:00`. Crear `Lavar` (**No se repite**, sin fecha límite) con `Separar la ropa blanca` en **Primer paso** y `Solo el inodoro` en **Versión mínima**, y `Barrer` (**No se repite**, sin fecha límite) con `Solo el pasillo` en **Versión mínima**, sin primer paso.

1. La fila de `Lavar` tiene dos líneas debajo del título, en este orden: `Primer paso: Separar la ropa blanca` y `Mínima: Solo el inodoro` (con **Hice la mínima**). La fila de `Barrer` tiene la línea `Mínima: Solo el pasillo` y **Hice la mínima** aunque no tenga primer paso.
2. **Estilo**: la línea de la mínima tiene el mismo `color` y `font-size` que la línea del paso; el botón no tiene color propio ni fondo destacado; la fila no cambia de fondo. La fila no tiene contadores, marcas ni textos que propongan hacer la mínima.
3. Tocar el texto `Mínima: Solo el pasillo` (fuera del botón): se abre **Editar tarea** de `Barrer`. Cerrar con la X sin cambios: cierra directo.
4. Con el panel cerrado, tocar **Hice la mínima** en `Barrer`: no se abre el panel ni aparece **Cambios sin guardar**; aparece el aviso de completar (Flujo 3).
5. Con pasos: abrir `Lavar`, agregar `Poner el lavarropas` en **Paso 2** y `Tender la ropa` en **Paso 3** y guardar. En el paso 1 la fila dice `Primer paso: Separar la ropa blanca` y debajo `Mínima: Solo el inodoro`, con **Hecho** y **Hice la mínima**. Tocar **Hecho**: dice `Paso: Poner el lavarropas` y la mínima sigue igual, debajo de la línea del paso. Tocar **Hecho** otra vez: igual en el paso 3.
6. **Dónde no se ve** (**Mostrar completadas** y **Mostrar pausadas** encendidos desde acá): crear `Cambiar foco` (**No se repite**, sin fecha límite) con `Solo la lámpara` en **Versión mínima**, `Pagar` (**No se repite**, fecha límite `2026-11-10`) con `Solo la luz`, `Regar` (**Intervalo** cada `8` **horas**) con `Solo los helechos`. `Pagar` está `atrasada` y la muestra con **Hice la mínima** habilitado; las otras también.
7. Posponer `Cambiar foco` con la opción **3 horas**: pasa a `en espera` y la fila no contiene `Mínima` ni **Hice la mínima**; el checkbox sigue habilitado. Posponer `Pagar` con **Hasta mañana**: tampoco. Tocar el checkbox de `Regar`: `en espera`, sin línea ni botón.
8. Avanzar el reloj a `2026-11-13T13:01:00`: `Cambiar foco` vuelve a `pendiente` con su línea y su botón. `Regar` sigue sin línea. A `2026-11-13T18:01:00`: `Regar` vuelve a `pendiente` y dice `Mínima: Solo los helechos` con **Hice la mínima**.
9. Tocar la fila `Regar` y **Pausar**: `Regar` se ve pausada, sin línea ni botón. Abrir, **Reanudar**: vuelve con su línea y su botón.
10. Tocar el checkbox de `Cambiar foco` (puntual): la fila completada (con **Mostrar completadas**) no tiene línea ni botón. Desmarcar el checkbox: vuelve a `pendiente` con su línea y su botón.
11. Crear `Basura` con **Días de la semana** y **martes** y `Solo la de la cocina` en **Versión mínima**, con el reloj en el viernes: `en espera` hasta el martes, sin línea ni botón. Avanzar a `2026-11-17T09:00:00`: `pendiente`, con `Mínima: Solo la de la cocina` y **Hice la mínima**.
12. Crear `Llamar` (**No se repite**, sin fecha límite, horario **Desde** `08:00` **Hasta** `09:00`) con `Solo a mamá` en **Versión mínima**, con el reloj en `2026-11-17T09:30:00`: fuera de su ventana, `en espera`, sin línea ni botón. Avanzar a `2026-11-18T08:30:00`: `pendiente`, con su línea y su botón habilitado.
13. **Checkbox deshabilitado**: crear `Lavar la ropa` (**No se repite**, fecha límite `2026-11-10`, horario **Desde** `08:00` **Hasta** `11:00`) con `Solo lo blanco` en **Versión mínima**. Con el reloj en `2026-11-19T07:00:00`: `atrasada`, checkbox deshabilitado, la fila dice `Mínima: Solo lo blanco` y **Hice la mínima** está deshabilitado: tocarlo no completa nada ni abre aviso. Avanzar a `2026-11-19T08:30:00`: checkbox y **Hice la mínima** quedan habilitados.
14. **Sin sugerencias**: una periódica que ya se completó dos veces con **Hice la mínima** (Flujo 3) y vuelve a `pendiente` o a `atrasada` muestra la misma línea y el mismo botón, sin ningún texto, contador ni marca adicional.

## Flujo 3: hacer la mínima, aviso, regreso y deshacer

Precondición: lista vacía, reloj en `2026-11-13T09:00:00`, **Mostrar completadas** encendido. Crear `Regar` con **Intervalo** cada `8` **horas**, emoji `🌱` y `Solo los helechos`; `Limpiar` (**No se repite**, sin fecha límite) con `Solo el inodoro`.

1. Fijar la hora a `2026-11-13T09:00:00` y tocar **Hice la mínima** en `Regar`: aparece el aviso con el texto `Completaste «🌱 Regar» · mínima`, el botón **Deshacer** y debajo `Vuelve hoy 17:00 · en 8 horas`. El aviso no contiene `Solo los helechos`. La fila queda `en espera` (completada), sin línea ni botón, como si se hubiera tocado el checkbox.
2. Tocar **Deshacer** dentro de los 5 segundos: el aviso se cierra y `Regar` vuelve a `pendiente`, con su línea y su botón.
3. Fijar la hora a `2026-11-13T09:00:00` y tocar el checkbox de `Regar`: el aviso dice `Completaste «🌱 Regar»`, sin ` · mínima`, con la misma línea «Vuelve …». Deshacer.
4. Tocar **Hice la mínima** en `Limpiar`: el aviso dice `Completaste «Limpiar» · mínima` y no tiene línea «Vuelve …» (no se repite). Esperar 5 s: el aviso desaparece solo. `Limpiar` se ve completada (tachada, con el checkbox marcado) al final de la lista.
5. Con `Limpiar` completada con la mínima, tocar su checkbox: se desmarca y vuelve a `pendiente` (el checkbox borra el completado de la mínima como cualquier otro). Sin aviso.
6. Fijar la hora a `2026-11-13T09:00:00`, tocar el checkbox de `Limpiar` (entero) y, con el aviso abierto, tocar **Hice la mínima** en `Regar`: el aviso es ahora el de `Regar` con ` · mínima` (reemplaza al anterior; hay un solo aviso).
7. **Estado**: con `Regar` completada con la mínima el `2026-11-13T09:00:00`, avanzar a `2026-11-13T15:00:00`: sigue `en espera` y la barra de progreso avanzó; a `2026-11-13T17:01:00`: `pendiente`, con su línea y su botón. Es lo mismo que con un completado entero.
8. **Lista**: fijar la hora a `2026-11-13T09:30:00` y tocar el checkbox de `Limpiar` (entero; antes, si está completada, desmarcarla). Con `Regar` completada con la mínima a las `09:00` y `Limpiar` completada a las `09:30`, las dos filas completadas van al final, tachadas, la de completado más reciente primero: `Limpiar`, `Regar`. Es el mismo orden que con dos completados enteros.
9. **Última vez**: abrir `Regar`: **Última vez** dice `hoy 09:00` (hora del completado de la mínima).
10. **Calendario**: en un contexto nuevo con el reloj en `2026-11-09T08:00:00` (lunes), crear `Basura` con **Días de la semana** y **martes** y `Solo la de la cocina`. Avanzar a `2026-11-10T09:00:00`: `pendiente`. Fijar la hora a `2026-11-10T09:00:00` y tocar **Hice la mínima**: aviso `Completaste «Basura» · mínima` y debajo `Vuelve el martes 17` (con su distancia); la fila queda `en espera`.
11. **Completada de un día anterior**: con el reloj en `2026-11-13T09:30:00`, crear `Riego` (**Intervalo** cada `2` **días**) con `Solo las macetas`, tocar **Hice la mínima** y esperar el aviso. Avanzar a `2026-11-14T10:00:00`: `Riego` sigue `en espera` y completada. Tocar el checkbox de la fila: la completa de nuevo, entera (aviso `Completaste «Riego»` sin ` · mínima`). El mismo día del completado, el checkbox lo habría borrado.

## Flujo 4: con pasos, en cualquier paso

Precondición: lista vacía, reloj en `2026-11-13T10:00:00`, **Mostrar completadas** encendido. Crear `Lavar` (**No se repite**, sin fecha límite) con `Separar la ropa blanca`, `Poner el lavarropas`, `Tender la ropa` y `Solo lo blanco`.

1. En el paso 1 (`Primer paso: Separar la ropa blanca`), tocar **Hice la mínima**: aviso `Completaste «Lavar» · mínima`. La fila completada no tiene línea de paso ni de mínima ni botones. Tocar **Deshacer**: `Lavar` vuelve a `pendiente` en el paso 1.
2. Tocar **Hecho** (paso 2): dice `Paso: Poner el lavarropas`. Fijar la hora a `2026-11-13T10:00:00` y tocar **Hice la mínima**: completa. Tocar **Deshacer**: `Lavar` vuelve a decir `Paso: Poner el lavarropas` (el paso en que iba).
3. Tocar **Hice la mínima** otra vez (paso 2), esperar a que pase el aviso y desmarcar el checkbox de la fila completada: vuelve `pendiente` diciendo `Paso: Poner el lavarropas`.
4. Tocar **Hecho** (paso 3, `Paso: Tender la ropa`), tocar **Hice la mínima** y **Deshacer**: dice `Paso: Tender la ropa`. Tocar **Hice la mínima** y, tras el aviso, ir al **Historial** y borrar esa entrada (confirmando): vuelve a `Paso: Tender la ropa`.
5. Tocar **Hice la mínima** (paso 3) y no deshacer: con el completado de la mínima y **Mostrar completadas**, tocar el checkbox de la completada: `Lavar` vuelve a `pendiente` en el paso 3.
6. Crear una periódica `Regar` cada `2` **días** de dos pasos (`Llenar la regadera`, `Regar los helechos`) y `Solo los helechos`, tocar **Hecho** (paso 2), fijar la hora a `2026-11-13T10:00:00`, tocar **Hice la mínima** y avanzar a `2026-11-15T10:30:00`: `Regar` vuelve `pendiente` y dice `Primer paso: ` con el primer paso (arranca del paso 1), con **Hecho** y sin **Paso anterior**.
7. Con un solo paso (solo **Primer paso**), **Hice la mínima** y deshacer dejan la tarea como estaba (sin botones de paso).

## Flujo 5: Historial y Borrar

Precondición: lista vacía, reloj en `2026-11-13T08:05:00`. Crear `Regar` (**Intervalo** cada `2` **días**, `Solo los helechos`) y `Pagar` (**No se repite**, sin fecha límite, sin versión mínima).

1. Tocar **Hice la mínima** en `Regar`. Ir a **Historial**: grupo **Hoy**, entrada `Regar` `08:05` con la palabra `Mínima` después de la hora, en el mismo texto secundario que la hora, sin color ni icono. La entrada no contiene `Solo los helechos`.
2. Avanzar el reloj a `2026-11-13T10:00:00`, tocar el checkbox de `Pagar` (entero): en el Historial, la entrada `Pagar` `10:00` no tiene `Mínima`; la de `Regar` `08:05` sí; `Pagar` arriba de `Regar` (más reciente primero).
3. Tocar **Borrar** en la entrada de `Regar`: el diálogo nombra `Regar`, `Hoy, 08:05` y la palabra `Mínima`, con **Borrar** y **Cancelar**. **Cancelar**: sin cambios. **Borrar** y confirmar: la entrada desaparece y `Regar` vuelve a `pendiente` en Pendientes. El diálogo de la entrada de `Pagar` no dice `Mínima`.
4. Tocar **Hice la mínima** en `Regar` otra vez, abrir el panel y cambiar **Versión mínima** a `Solo el brote`, guardar: en el Historial, la entrada de `Regar` sigue diciendo `Mínima` y no contiene ninguna de las dos versiones. Abrir, vaciar **Versión mínima** y guardar: la entrada sigue diciendo `Mínima`. Cambiar el título a `Plantas` y guardar: la entrada dice `Plantas` y `Mínima`.
5. Escribir `Solo el brote` en **Versión mínima** de `Pagar` (que tiene un completado entero) y guardar: la entrada de `Pagar` sigue sin `Mínima` (no se puede pasar un completado entero a mínimo).

## Flujo 6: lo que no cambia y lo que no lo muestra

Precondición: lista vacía, reloj detenido en `2026-11-13T10:00:00`, **Mostrar completadas** encendido.

1. Crear `Barrer`, `Lavar` y `Planchar`, todas con **No se repite** y sin fecha límite. Anotar el orden y el texto de cada fila.
2. Escribir en `Lavar` una **Versión mínima** (`Solo el inodoro`) y guardar: el orden de la lista es el mismo; las filas de `Barrer` y `Planchar` son idénticas a antes. Escribir también una en `Barrer` y guardar: el orden no cambia.
3. Poner a `Lavar` el emoji `🧺`: el título dice `🧺 Lavar`, la línea `Mínima: …` va en su propia línea debajo. El título no incluye la versión mínima.
4. Tocar **Hice la mínima** en `Lavar`: el aviso dice `Completaste «🧺 Lavar» · mínima`, sin el texto de la mínima.
5. Tocar el texto `Mínima: …` de una fila (fuera del botón): abre el panel de esa tarea.

## Flujo 7: Cambios sin guardar

Precondición: lista vacía, reloj detenido en `2026-11-13T10:00:00`. `Lavar` (**No se repite**, sin fecha límite) con **Versión mínima** `Solo el inodoro` y `Planchar` (**No se repite**, sin fecha límite) sin versión mínima.

1. Abrir `Lavar`, cambiar **Versión mínima** a `Solo el lavabo` y tocar la X: aparece el aviso «Tenés cambios sin guardar»; **Descartar**: la fila sigue diciendo `Mínima: Solo el inodoro`.
2. Abrir, cambiar a `Solo el lavabo` y volver a escribir `Solo el inodoro`, y tocar la X: cierra directo. Escribir `  Solo el inodoro  ` (con espacios al inicio y al final): cierra directo.
3. Abrir, vaciar **Versión mínima**: aviso; **Descartar**. Repetir con solo espacios: aviso; **Descartar**.
4. Abrir `Planchar` (sin versión mínima), escribir solo espacios en **Versión mínima** y tocar la X: cierra directo. Escribir `Solo el inodoro` y tocar la X: aviso; **Descartar**.
5. Tocar **+**, escribir solo espacios en **Versión mínima** y la X: cierra directo. Escribir `Solo el inodoro` y la X: aviso; **Descartar**.
6. Con el panel de `Lavar` cerrado, tocar **Hice la mínima** en la fila: no aparece **Cambios sin guardar** ni se abre el panel; aparece el aviso de completar.

## Flujo 8: dos dispositivos

Precondición: lista vacía, reloj en `2026-11-13T10:00:00` en A y en B.

1. En A, crear `Regar` con **Intervalo** cada `2` **días** y **Versión mínima** `Solo los helechos`. B la ve aparecer con su línea.
2. B sin conexión. En B, cambiar el título a `Regar plantas` y guardar. En A, cambiar **Versión mínima** a `Solo el brote` y guardar. B vuelve a tener conexión: en A y en B el título dice `Regar plantas` y la fila dice `Mínima: Solo el brote` (campos distintos, los dos cambios se conservaron).
3. B sin conexión. En B, cambiar **Versión mínima** a `Solo los esquejes` y guardar. En A, cambiar la **Nota** a `Usar la regadera chica` y guardar. B vuelve a tener conexión: en A y en B la fila dice `Mínima: Solo los esquejes` y la nota es `Usar la regadera chica`.
4. B sin conexión. En B, cambiar **Versión mínima** a `Solo la maceta` y guardar. En A, cambiar **Versión mínima** a `Solo la planta grande` y guardar. B vuelve a tener conexión: en A y en B dice `Mínima: Solo la maceta` (el último cambio en llegar es el de B).
5. B sin conexión. En B, vaciar **Versión mínima** y guardar. En A, cambiar **Versión mínima** a `Solo el tronco` y guardar. B vuelve a tener conexión: en A y en B la fila no tiene línea ni botón (gana el último en llegar, el de B). Después, en A, escribir `Solo el tronco` y guardar.
6. B sin conexión. En B, cambiar **Versión mínima** a `Solo la maceta` y guardar. En A, vaciar **Versión mínima** y guardar. B vuelve a tener conexión: en A y en B dice `Mínima: Solo la maceta` (gana el último en llegar, el de B).
7. B sin conexión. En B, cambiar **Versión mínima** a `Solo el brote` y guardar. En A, abrir la fila y guardar sin cambiar nada. B vuelve a tener conexión: en A y en B dice `Mínima: Solo el brote` (guardar sin cambios no pisó el cambio de B).
8. **Completados**: B sin conexión. En B, tocar el checkbox de `Regar plantas` (entero). En A, tocar **Hice la mínima**. B vuelve a tener conexión: en el **Historial** de A y de B hay dos entradas de `Regar plantas`, una con `Mínima` después de la hora y otra sin ella, cada una con lo suyo.
