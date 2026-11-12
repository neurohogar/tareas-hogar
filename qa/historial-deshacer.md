# QA: historial y deshacer

Verifica, solo por la interfaz:

- la navegación entre **Pendientes** e **Historial**;
- el aviso con **Deshacer** al completar: dura 5 segundos (con el reloj simulado), uno nuevo reemplaza al anterior y sigue visible al cambiar de pantalla;
- el Historial: orden, grupos por día con "Hoy", "Ayer" o la fecha, hora, título actual y texto de vacío;
- borrar un completado desde el Historial, con confirmación, y el estado recalculado en Pendientes;
- abrir la edición de una tarea desde el Historial;
- los casos de dos dispositivos: dos completados sin conexión, el borrado de un completado o de la tarea, los huérfanos y un completado "del futuro".

Cubre spec §4.4, §5.1–§5.4, §6 (navegación), §6.2 (borrar tarea y editar desde el historial), §6.3, §7 y §10 criterio 5.

Fuera de alcance: etiquetas, emoji, nota, PWA y la pestaña Etiquetas.

## Entorno

Igual que `qa/editar-borrar.md`:

- Firebase Emulator Suite (Auth + Firestore) con datos limpios al inicio de cada flujo.
- Reloj simulado del navegador (`page.clock`) instalado **antes** de abrir la app, en la hora local que indica cada flujo (zona `America/Argentina/Buenos_Aires`).
  - "A las X" significa adelantar el reloj simulado hasta X antes del paso.
  - "Avanzar el reloj a X" significa adelantarlo hasta X y esperar a que la pantalla se actualice sola (sin recargar), salvo que el paso diga "recargar".
  - Los pasos que miden segundos del aviso usan el reloj detenido (`page.clock.pauseAt`) y lo adelantan con `page.clock.runFor` o `fastForward` hasta la hora exacta, para que el tiempo no corra mientras QA actúa.
- Sesión iniciada con la cuenta `qa@example.com` del Auth Emulator (Flujo 1 de `qa/periodica-relativa.md`).
- Al empezar cada flujo, tocar el check **Mostrar completadas** para encenderlo (en A y en B en los flujos de dos dispositivos): las completadas (puntual con un completado, periódica en espera con un completado) se ven tachadas al final de la lista, después de las no completadas (`qa/mostrar-completadas.md`). Una periódica en espera completada tiene su checkbox marcado: tocarlo el mismo día de su completado más reciente lo borra; en un día posterior, la completa de nuevo.
- Crear una tarea: tocar **+**, escribir el título, elegir la opción de **Se repite** que indica el paso y guardar, con los controles de `qa/puntual.md` y `qa/periodica-calendario.md`.
- **Dos dispositivos** (Flujos 11 a 14): dos contextos de navegador independientes, A y B, con la misma cuenta.
  - "B sin conexión" significa poner el contexto B offline (`browserContext.setOffline(true)`).
  - "B vuelve a tener conexión" significa volverlo online y esperar a que las dos pantallas se actualicen solas.

Semana de referencia: lunes 2026-07-13, martes 14, miércoles 15, jueves 16, viernes 17.

## Contrato observable

- **Fila de Pendientes y panel**: los contratos de `qa/periodica-relativa.md`, `qa/periodica-calendario.md`, `qa/puntual.md`, `qa/editar-borrar.md` y `qa/mostrar-completadas.md` (completada o no completada).
- **Navegación**: una barra (rol `navigation`) visible siempre, en las dos pantallas.
  - Tiene dos enlaces, **Pendientes** (ruta `/`) e **Historial** (ruta `/historial`).
  - El enlace de la pantalla actual tiene `aria-current="page"` y el otro no.
  - Abrir `/historial` directamente (o recargar ahí) muestra el Historial.
- **Aviso**: una región con rol `status`.
  - Aparece al tocar el checkbox de una tarea no completada (al completarla). Su texto incluye el título de la tarea entre comillas angulares: `Completaste «Regar»`.
  - Tiene un botón **Deshacer**.
  - Hay a lo sumo **un** aviso en pantalla.
  - Se ve desde que se completa hasta 4,999 s después y no se ve desde los 5 s.
  - **Deshacer** cierra el aviso.
- **Historial**: la pantalla tiene el encabezado **Historial**.
  - Cada día con completados es un grupo con un encabezado de nivel 2. El texto del encabezado es **Hoy**, **Ayer** o la fecha en minúsculas ("martes 14 de julio"; con " de 2025" si el año no es el actual).
  - Debajo de cada encabezado hay una lista de entradas. Los grupos y las entradas van del más reciente al más antiguo.
  - Cada entrada (rol `listitem`) muestra el título actual de la tarea, la hora `HH:MM` en 24 h y un botón **Borrar**.
  - Sin completados, se ve el texto "Todavía no completaste nada" y ningún grupo.
- **Confirmación de borrado de un completado**: **Borrar** abre un diálogo (rol `alertdialog`) con los botones **Borrar** y **Cancelar**.
  - El diálogo nombra la tarea por su título y el momento con el encabezado de su día y la hora: `¿Borrar «Regar» de Hoy, 09:00?`.
  - **Cancelar** cierra el diálogo sin cambios. **Borrar** cierra el diálogo y saca la entrada.
- **Editar desde el Historial**: tocar una entrada fuera de **Borrar** (por ejemplo, sobre el título) abre el panel **Editar tarea** de esa tarea, con sus valores. Al guardar o cerrar, se sigue en el Historial.

## Flujo 1: navegación e historial vacío

Precondición: lista vacía, reloj en `2026-07-15T08:00:00`.

1. En **Pendientes**, la barra de navegación muestra **Pendientes** con `aria-current="page"` e **Historial** sin él.
2. Tocar **Historial**: la URL termina en `/historial`, se ve el encabezado **Historial** y el texto "Todavía no completaste nada". **Historial** tiene `aria-current="page"`.
3. Recargar: sigue en el Historial vacío.
4. Tocar **Pendientes**: vuelve a la lista (vacía, con **+**).
5. Abrir directamente `/historial`: se ve el Historial.

## Flujo 2: el aviso dura 5 segundos y Deshacer devuelve la tarea

Precondición: lista vacía, reloj detenido en `2026-07-15T08:00:00`.

1. Crear `Regar` con **Intervalo** cada `4` **horas** y `Pagar la luz` con **No se repite** sin fecha límite. No aparece ningún aviso.
2. A las `08:00:00`, tocar el checkbox de **Regar**: pasa a `en espera` y aparece el aviso `Completaste «Regar»` con **Deshacer**.
3. A las `08:00:04`, el aviso sigue visible.
4. A las `08:00:05`, el aviso ya no está. **Regar** sigue `en espera`.
5. A las `08:01:00`, tocar el checkbox de **Pagar la luz**: pasa a completada (tachada, al final) y el aviso dice `Completaste «Pagar la luz»`.
6. A las `08:01:03`, tocar **Deshacer**: el aviso se cierra y **Pagar la luz** vuelve a no completada, `pendiente`.
7. Tocar **Historial**: un solo grupo, **Hoy**, con una sola entrada: **Regar** `08:00`.
8. Volver a **Pendientes**. A las `12:00:00`, **Regar** vuelve a `pendiente`; tocar su checkbox: aparece el aviso `Completaste «Regar»`. A las `12:00:02`, tocar **Deshacer**.
9. En el Historial sigue una sola entrada, **Regar** `08:00`: Deshacer borró solo el último completado.
10. Recargar: lo mismo; en Pendientes, **Regar** y **Pagar la luz** `pendiente`.

## Flujo 3: un aviso nuevo reemplaza al anterior

Precondición: lista vacía, reloj detenido en `2026-07-15T08:00:00`.

1. Crear `Regar` y `Barrer` con **Intervalo** cada `2` **días**, y `Pagar la luz` y `Cambiar foco` con **No se repite** sin fecha límite.
2. A las `08:00:00`, completar **Regar**. A las `08:00:03`, completar **Barrer**: se ve un solo aviso y dice `Completaste «Barrer»`.
3. A las `08:00:07`, el aviso de **Barrer** sigue visible (sus 5 segundos cuentan desde su propio completado).
4. A las `08:00:08`, no hay aviso.
5. A las `08:10:00`, completar **Pagar la luz**. A las `08:10:02`, completar **Cambiar foco**: un solo aviso, `Completaste «Cambiar foco»`.
6. A las `08:10:03`, tocar **Deshacer**: **Cambiar foco** vuelve a no completada, `pendiente`; **Pagar la luz** sigue completada.
7. En el Historial, grupo **Hoy**: **Pagar la luz** `08:10`, **Barrer** `08:00`, **Regar** `08:00`. **Barrer** va antes que **Regar** porque se completó 3 s después.

## Flujo 4: el aviso sigue visible al cambiar de pantalla

Precondición: lista vacía, reloj detenido en `2026-07-15T08:00:00`.

1. Crear `Regar` con **Intervalo** cada `2` **días**.
2. A las `08:00:00`, completar **Regar**: aparece el aviso.
3. A las `08:00:01`, tocar **Historial**: el aviso sigue visible y el Historial muestra **Hoy**, **Regar** `08:00`.
4. A las `08:00:02`, tocar **Deshacer**: el aviso se cierra, la entrada desaparece y se ve "Todavía no completaste nada".
5. Tocar **Pendientes**: **Regar** está `pendiente` (nunca completada).

## Flujo 5: orden, grupos por día y hora

Precondición: lista vacía, reloj en `2026-07-13T08:00:00` (lunes).

1. Crear:
   - `Regar` con **Intervalo** cada `1` **días**;
   - `Sacar la basura` con **Días de la semana** `martes` y `jueves`;
   - `Pagar la luz` con **No se repite** sin fecha límite.
2. A las `2026-07-13T09:00:00`, completar **Regar**.
3. A las `2026-07-14T21:30:00`, completar **Sacar la basura**.
4. A las `2026-07-15T08:05:00`, completar **Regar**.
5. A las `2026-07-15T10:00:00`, completar **Pagar la luz**.
6. A las `2026-07-15T12:00:00`, tocar **Historial**. Se ven, en este orden:
   - **Hoy**: **Pagar la luz** `10:00`, **Regar** `08:05`;
   - **Ayer**: **Sacar la basura** `21:30`;
   - **lunes 13 de julio**: **Regar** `09:00`.
7. Avanzar el reloj a `2026-07-16T00:00:00` sin salir del Historial. Los encabezados se actualizan solos:
   - **Ayer**: **Pagar la luz** `10:00`, **Regar** `08:05`;
   - **martes 14 de julio**: **Sacar la basura** `21:30`;
   - **lunes 13 de julio**: **Regar** `09:00`.
8. A las `2026-07-16T23:59:59`, ir a **Pendientes**, completar **Regar** y volver al Historial. Arriba de todo hay un grupo **Hoy** con **Regar** `23:59` (sin segundos).
9. Recargar: lo mismo que en el paso 8.

## Flujo 6: el año se muestra solo si no es el actual

Precondición: lista vacía, reloj en `2025-12-31T21:00:00`.

1. Crear `Regar` con **Intervalo** cada `1` **días**. A las `2025-12-31T22:00:00`, completarla.
2. En el Historial se ve **Hoy**: **Regar** `22:00`.
3. Avanzar el reloj a `2026-01-01T10:00:00`: el grupo pasa a **Ayer**.
4. Avanzar el reloj a `2026-01-02T10:00:00`: el grupo pasa a **miércoles 31 de diciembre de 2025**.

## Flujo 7: borrar desde el Historial recalcula el estado

Precondición: lista vacía, reloj en `2026-07-13T08:00:00` (lunes).

1. Crear:
   - `Regar` con **Intervalo** cada `4` **horas**;
   - `Sacar la basura` con **Días de la semana** `martes` y `jueves`;
   - `Pagar la luz` con **No se repite** y Fecha límite `2026-07-14`.
2. A las `2026-07-14T10:00:00`, completar **Sacar la basura** (cubre el martes) y **Pagar la luz**: las dos pasan a completadas.
3. A las `2026-07-15T04:00:00`, completar **Regar**. A las `2026-07-15T09:00:00` (**Regar** está `pendiente` desde las `08:00`), completar **Regar** otra vez.
4. Avanzar el reloj a `2026-07-15T11:00:00`. En Pendientes: **Regar** `en espera` con la barra en 50 y **Sacar la basura** `en espera`, las dos completadas.
5. En el Historial, tocar **Borrar** en **Regar** `09:00` (grupo **Hoy**): aparece el diálogo `¿Borrar «Regar» de Hoy, 09:00?` con **Borrar** y **Cancelar**.
6. Tocar **Cancelar**: el diálogo se cierra y las entradas siguen iguales.
7. Tocar **Borrar** en **Regar** `09:00` y confirmar con **Borrar**: la entrada desaparece; queda **Regar** `04:00`.
8. En Pendientes, **Regar** está `pendiente`, no completada (el completado de las `04:00` venció a las `08:00`).
9. En el Historial, borrar **Regar** `04:00` (con confirmación). **Regar** sigue `pendiente` en Pendientes (nunca completada).
10. En el Historial, borrar **Pagar la luz** `10:00` (grupo **Ayer**): en Pendientes, **Pagar la luz** vuelve a no completada, `atrasada`.
11. A las `2026-07-16T10:00:00` (jueves, **Sacar la basura** está `pendiente`), completar **Sacar la basura** (cubre el jueves): `en espera`, completada, hasta el martes 21.
12. Avanzar el reloj a `2026-07-18T17:00:00`: **Sacar la basura** está `en espera` con la barra en 50 (55 de las 110 horas hasta el martes 21).
13. En el Historial, borrar **Sacar la basura** `10:00` del grupo **jueves 16 de julio**: en Pendientes, **Sacar la basura** pasa a `atrasada`, no completada (vuelve a cubrir solo el martes, y se perdió el jueves).
14. Recargar: el Historial muestra solo **martes 14 de julio**: **Sacar la basura** `10:00`. Pendientes muestra, en este orden, **Pagar la luz** (`atrasada`), **Sacar la basura** (`atrasada`) y **Regar** (`pendiente`), ninguna completada.

## Flujo 8: borrar un completado que no es el más reciente

Precondición: lista vacía, reloj en `2026-07-15T06:00:00`.

1. Crear `Regar` con **Intervalo** cada `4` **horas** y completarla. A las `2026-07-15T10:30:00` (**Regar** está `pendiente` desde las `10:00`), completarla otra vez.
2. Avanzar el reloj a `2026-07-15T12:30:00`: **Regar** está `en espera`, con la barra en 50.
3. En el Historial, borrar **Regar** `06:00` (con confirmación): queda **Regar** `10:30`.
4. En Pendientes, **Regar** sigue `en espera`, completada, con la barra en 50.

## Flujo 9: el título que se ve es el actual

Precondición: lista vacía, reloj en `2026-07-14T09:00:00`.

1. Crear `Regar` con **Intervalo** cada `1` **días** y completarla. A las `2026-07-15T10:00:00` (**Regar** está `pendiente` desde las `09:00`), completarla otra vez.
2. En Pendientes, editar el título a `Regar plantas`.
3. En el Historial: **Hoy**: **Regar plantas** `10:00`; **Ayer**: **Regar plantas** `09:00`.

## Flujo 10: editar y borrar la tarea desde el Historial

Precondición: lista vacía, reloj en `2026-07-15T08:00:00`.

1. Crear `Pagar la luz` con **No se repite** sin fecha límite y `Regar` con **Intervalo** cada `2` **días**. Completar las dos: las dos pasan a completadas.
2. A las `2026-07-15T10:00:00`, en el Historial, tocar el título de la entrada **Pagar la luz**. Se abre el panel **Editar tarea** con Título `Pagar la luz` y **No se repite** sin fecha límite. Tocar **Cerrar**: sigue en el Historial, sin cambios.
3. Tocar de nuevo la entrada **Pagar la luz**, elegir **Intervalo** cada `4` **horas** y guardar. El panel se cierra y sigue en el Historial con las dos entradas.
4. En Pendientes, **Pagar la luz** está `en espera` con la barra en 50 (completada hace 2 de 4 horas), sigue completada.
5. En el Historial, tocar la entrada **Pagar la luz**: el panel muestra **Intervalo** cada `4` **horas**. Tocar **Borrar tarea** y confirmar.
6. Su entrada desaparece del Historial; queda **Regar** `08:00`. En Pendientes no está **Pagar la luz**.
7. En Pendientes, borrar **Regar** (con confirmación). El Historial queda con "Todavía no completaste nada".

## Flujo 11: dos dispositivos completan sin conexión

Precondición: lista vacía, reloj en `2026-07-15T08:00:00` en A y en B.

1. En A, crear `Regar` con **Intervalo** cada `2` **días**. B la ve `pendiente`.
2. B sin conexión. En A, completar **Regar** (`08:00`). A las `2026-07-15T09:00:00` (en A y en B), completar **Regar** en B, que no vio el completado de A y la sigue viendo `pendiente`.
3. B vuelve a tener conexión. En el Historial de A y de B: **Hoy**: **Regar** `09:00`, **Regar** `08:00`.
4. En A, borrar **Regar** `09:00` desde el Historial: en B la entrada desaparece sola; queda **Regar** `08:00`.

## Flujo 12: Deshacer cuando otro dispositivo ya borró la tarea

Precondición: lista vacía, reloj en `2026-07-15T10:00:00` en A y en B.

1. En A, crear `Regar` con **Intervalo** cada `2` **días**. Detener el reloj de A en `10:00:00`.
2. En A, completar **Regar**: aparece el aviso.
3. En B, borrar **Regar** (con confirmación). Esperar a que la fila desaparezca en A.
4. Con el reloj de A en `10:00:02`, tocar **Deshacer** en A: el aviso se cierra y **Regar** no reaparece.
5. En A y en B, Pendientes está vacía y el Historial dice "Todavía no completaste nada". Recargar los dos: lo mismo.

## Flujo 13: completado huérfano

Precondición: lista vacía, reloj en `2026-07-15T08:00:00` en A y en B.

1. En A, crear `Barrer` y `Regar` con **Intervalo** cada `2` **días**, y completar **Regar**.
2. B sin conexión. En B, completar **Barrer**.
3. En A, borrar **Barrer** (con confirmación).
4. B vuelve a tener conexión. En A y en B, el Historial muestra solo **Hoy**: **Regar** `08:00`; no aparece **Barrer**.
5. Recargar A y B: lo mismo.

## Flujo 14: completado "del futuro"

Precondición: lista vacía, reloj de A en `2026-07-15T12:00:00` (miércoles) y reloj de B en `2026-07-16T09:00:00` (jueves, adelantado).

1. En A, crear `Regar` con **Intervalo** cada `2` **días**.
2. En B, completar **Regar**.
3. En el Historial de A, se ve un solo grupo, **jueves 16 de julio** (no "Mañana"), con **Regar** `09:00`.
4. En Pendientes de A, **Regar** está `en espera` con la barra en 0.
