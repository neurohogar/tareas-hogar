# QA: posponer una tarea

Verifica, solo por la interfaz:

- las opciones de **Posponer** del panel (en **Acciones**, sin botón intermedio): aparecen solo al editar una tarea `pendiente` o `atrasada` que no está pausada ni pospuesta, y son **1 hora**, **3 horas** y **Hasta mañana**; elegir una actúa en el momento (guarda y cierra el panel sin **Guardar**);
- con la tarea pospuesta, el panel dice "Pospuesta hasta HH:MM" (o "Pospuesta hasta mañana HH:MM") y ofrece **Quitar posponer**, que también actúa en el momento;
- que la pospuesta se ve `en espera` (atenuada, con la barra hacia el fin de la posposición), en el grupo `en espera` ordenada por cuándo vuelve, y que se ve con **Mostrar completadas** apagado;
- que vuelve sola a su estado al vencer (`atrasada` en el acto si su atraso llegó), sin mover vencimientos ni fechas límite;
- que se puede completar mientras está pospuesta (salvo fuera del horario) y que completar, deshacer o editar no quitan la posposición;
- que una pausada no se puede posponer;
- la posposición con dos dispositivos, también con relojes desfasados (S12).

Cubre spec §4.1 (`pospuesta`), §5.9, §6.1 (orden, Mostrar completadas, checkbox), §6.2 (Posponer / Quitar posponer) y §7 (conflictos).

Fuera de alcance: los estados sin posponer (`qa/puntual.md`, `qa/periodica-relativa.md`, `qa/periodica-calendario.md`, `qa/horario.md`), el orden de las no pospuestas (`qa/orden-pendientes.md`) y pausar (`qa/pausar.md`).

## Entorno

- Firebase Emulator Suite (Auth + Firestore) con datos limpios al inicio de cada flujo.
- Cada flujo parte de un contexto de navegador nuevo (sin datos guardados en el dispositivo), con sesión iniciada con la cuenta `qa@example.com` del Auth Emulator (Flujo 1 de `qa/periodica-relativa.md`).
- Reloj simulado del navegador (`page.clock`) instalado **antes** de abrir la app, en la hora local que indica cada flujo (zona `America/Argentina/Buenos_Aires`), con el reloj detenido (`page.clock.pauseAt`).
  - "A las X" significa adelantar el reloj simulado hasta X (`page.clock.runFor` o `fastForward`) antes del paso.
  - "Avanzar el reloj a X" significa adelantarlo hasta X y esperar a que la pantalla se actualice sola (sin recargar).
- Crear una tarea: tocar **+**, escribir el título, elegir la opción de **Se repite** que indica el paso, con los controles de `qa/puntual.md`, `qa/periodica-relativa.md` y `qa/periodica-calendario.md`; si el paso da un horario, cargarlo como en `qa/horario.md`; guardar.
- "Posponer X con la opción O": tocar la fila X y elegir O entre las opciones de **Posponer** (en **Acciones**, a la vista), sin tocar **Guardar**.
- **Mostrar completadas** y **Mostrar pausadas** quedan apagados salvo que el flujo diga encenderlos.
- **Dos dispositivos** (Flujo 7): dos contextos de navegador independientes, A y B, con la misma cuenta y el mismo reloj simulado. "B sin conexión" significa `browserContext.setOffline(true)` en B; "B vuelve a tener conexión", volverlo online y esperar a que las dos pantallas se actualicen solas.

Semana de referencia: lunes 2026-07-13, martes 14, miércoles 15, jueves 16, viernes 17, sábado 18, domingo 19.

## Contrato observable

- **Opciones de Posponer**: en el panel **Editar tarea**, un grupo con nombre accesible **Posponer** que muestra tres botones con nombre accesible **1 hora**, **3 horas** y **Hasta mañana** (sin botón **Posponer** intermedio). Elegir una cierra el panel y el cambio queda guardado: al volver a abrir la tarea, o al recargar, se mantiene. El panel **Nueva tarea** no tiene **Posponer**.
- **Pospuesta en el panel**: el texto "Pospuesta hasta HH:MM" (hora en 24 h, sin segundos), con "mañana" antes de la hora si el fin de la posposición es del día siguiente al de ahora; un botón **Quitar posponer** y ningún grupo **Posponer**. Tocar **Quitar posponer** cierra el panel y el cambio queda guardado.
- **Sin posponer**: el panel no tiene el texto "Pospuesta" ni el botón **Quitar posponer**.
- **Fila pospuesta**: la fila `en espera` del contrato de `qa/periodica-relativa.md`, siempre **no completada**: checkbox sin marcar, título en negrita, estilo atenuado, barra de progreso (`aria-valuenow` = porcentaje de la posposición transcurrida, redondeado al entero) y sin el indicador "Atrasada".
- **Fila**: para las no pospuestas, el contrato de `qa/periodica-relativa.md` y el de `qa/mostrar-completadas.md`.
- **Checkbox deshabilitado**: `disabled` o `aria-disabled="true"`, y tocarlo no cambia nada (no hay aviso ni entrada nueva en el Historial).
- **Lista**: "La lista es A, B, C" significa exactamente esas filas, de arriba hacia abajo.
- **Aviso** e **Historial**: los de `qa/historial-deshacer.md`.

## Flujo 1: posponer una atrasada 1 hora

Precondición: lista vacía, reloj en `2026-07-15T10:00:00` (miércoles).

1. Crear `Cambiar foco` con **No se repite** y sin fecha límite, y `Pagar la luz` con **No se repite** y fecha límite `2026-07-14`. Tocar **+**: el panel **Nueva tarea** no tiene las opciones de **Posponer**. Cerrarlo.
2. La lista es **Pagar la luz** (con "Atrasada"), **Cambiar foco**.
3. Tocar la fila **Pagar la luz**: el panel tiene las opciones de **Posponer** (**1 hora**, **3 horas** y **Hasta mañana**, a la vista), no tiene **Quitar posponer** ni el texto "Pospuesta". Elegir **1 hora**, sin tocar **Guardar**: el panel se cierra.
4. La lista es **Cambiar foco**, **Pagar la luz**. **Pagar la luz** se ve pospuesta: atenuada, sin "Atrasada", barra en 0, checkbox habilitado y sin marcar, título en negrita.
5. Tocar la fila **Pagar la luz**: el panel dice "Pospuesta hasta 11:00", tiene **Quitar posponer** y no tiene las opciones de **Posponer**. Cerrar el panel.
6. Avanzar el reloj a `2026-07-15T10:30:00`: la barra de **Pagar la luz** está en 50.
7. Recargar: **Pagar la luz** sigue pospuesta, con la barra en 50.
8. Avanzar el reloj a `2026-07-15T11:00:00`: **Pagar la luz** está `atrasada` (con "Atrasada", sin barra, no atenuada) y la lista es **Pagar la luz**, **Cambiar foco**. Tocar su fila: el panel tiene las opciones de **Posponer** y no dice "Pospuesta".

## Flujo 2: 3 horas y Hasta mañana, pasando la medianoche

Precondición: lista vacía, reloj en `2026-07-15T22:00:00` (miércoles).

1. Crear `Cambiar foco`, `Barrer` y `Regar plantas`, las tres con **No se repite** y sin fecha límite. La lista es **Cambiar foco**, **Barrer**, **Regar plantas**.
2. A las `2026-07-15T22:30:00`, posponer **Barrer** con la opción **Hasta mañana** y **Cambiar foco** con la opción **3 horas**.
3. La lista es **Regar plantas**, **Cambiar foco**, **Barrer**: las pospuestas en espera, primero la que vuelve antes.
4. Tocar la fila **Cambiar foco**: el panel dice "Pospuesta hasta mañana 01:30". Cerrarlo. Tocar la fila **Barrer**: dice "Pospuesta hasta mañana 07:00". Cerrarlo.
5. Avanzar el reloj a `2026-07-16T00:00:00`: tocar la fila **Cambiar foco**: el panel dice "Pospuesta hasta 01:30" (ya sin "mañana"). Cerrarlo.
6. Avanzar el reloj a `2026-07-16T01:30:00`: **Cambiar foco** está `pendiente` y la lista es **Cambiar foco**, **Regar plantas**, **Barrer**.
7. A las `2026-07-16T02:00:00`, posponer **Regar plantas** con la opción **Hasta mañana**. Tocar su fila: el panel dice "Pospuesta hasta mañana 07:00" (el viernes 17, no hoy). Cerrarlo.
8. Avanzar el reloj a `2026-07-16T07:00:00`: **Barrer** está `pendiente` y **Regar plantas** sigue pospuesta. La lista es **Cambiar foco**, **Barrer**, **Regar plantas**.

## Flujo 3: quitar posponer, completar, deshacer y editar

Precondición: lista vacía, reloj en `2026-07-15T10:00:00` (miércoles).

1. Crear `Pagar la luz` con **No se repite** y fecha límite `2026-07-14`. Posponerla con la opción **3 horas**: está pospuesta.
2. Tocar su fila y tocar **Quitar posponer**, sin tocar **Guardar**: el panel se cierra y **Pagar la luz** está `atrasada` en el acto. Tocar su fila: el panel tiene las opciones de **Posponer** y no dice "Pospuesta". Cerrarlo.
3. A las `2026-07-15T10:05:00`, posponerla con la opción **3 horas**. A las `2026-07-15T10:30:00`, tocar su checkbox (está habilitado): aparece el aviso `Completaste «Pagar la luz»` y la fila desaparece de la lista.
4. Tocar **Deshacer** en el aviso: **Pagar la luz** vuelve pospuesta (atenuada, sin "Atrasada"), con la barra en 14. Tocar su fila: el panel dice "Pospuesta hasta 13:05".
5. En el mismo panel, cambiar el título a `Pagar el gas` y tocar **Guardar**. **Pagar el gas** sigue pospuesta; su panel sigue diciendo "Pospuesta hasta 13:05".
6. Avanzar el reloj a `2026-07-15T13:05:00`: **Pagar el gas** está `atrasada`, con la clave de siempre (vencida desde el 15 a las 00:00).

## Flujo 4: periódicas pospuestas

Precondición: lista vacía, reloj en `2026-07-15T08:00:00` (miércoles).

1. Crear `Regar` y `Barrer`, las dos con **Intervalo** cada `4` **horas**, y completar las dos: quedan `en espera`, completadas, y desaparecen de la lista.
2. Avanzar el reloj a `2026-07-15T12:30:00`: las dos están `pendiente`. Posponer las dos con la opción **3 horas**.
3. La lista (con **Mostrar completadas** apagado) es **Regar**, **Barrer**: empatan en el fin de la posposición y va primero la creada antes. Las dos se ven pospuestas: no completadas, checkbox sin marcar, barra en 0.
4. A las `2026-07-15T13:00:00`, tocar el checkbox de **Regar**: aparece el aviso y queda `en espera`, completada (sale de la lista). El Historial tiene dos entradas de **Regar**, `08:00` y `13:00`.
5. Encender **Mostrar completadas**. Tocar la fila **Regar**: el panel sigue teniendo **Quitar posponer** ("Pospuesta hasta 15:30"). Cerrarlo.
6. Avanzar el reloj a `2026-07-15T15:30:00`: **Barrer** está `pendiente`. **Regar** sigue `en espera`, completada (vence a las 17:00).
7. Avanzar el reloj a `2026-07-15T16:00:00`: **Barrer** está `atrasada` (la posposición no movió su vencimiento).

## Flujo 5: posponer con horario

Precondición: lista vacía, reloj en `2026-07-15T07:00:00` (miércoles).

1. Crear `Ventilar` con **No se repite**, sin fecha límite y horario `08:00` a `11:00`. Está `en espera` hasta las 08:00. Tocar su fila: el panel no tiene las opciones de **Posponer**. Cerrarlo.
2. Avanzar el reloj a `2026-07-15T09:00:00`: `pendiente`. Posponerla con la opción **3 horas**.
3. Avanzar el reloj a `2026-07-15T09:30:00`: está pospuesta, con el checkbox habilitado.
4. Avanzar el reloj a `2026-07-15T11:30:00`: sigue `en espera`, con el checkbox deshabilitado (fuera de la ventana). Tocarlo: no pasa nada.
5. Avanzar el reloj a `2026-07-15T12:00:00`: sigue `en espera` por su horario (hasta las 08:00 de mañana); el panel no dice "Pospuesta" ni tiene las opciones de **Posponer**.

## Flujo 6: pausar y posponer

Precondición: lista vacía, reloj en `2026-07-15T10:00:00` (miércoles).

1. Crear `Regar` con **Intervalo** cada `2` **días** (`pendiente`). Tocar su fila: el panel tiene las opciones de **Posponer** y **Pausar**. Tocar **Pausar**.
2. Encender **Mostrar pausadas**. Tocar la fila **Regar**: el panel dice "Pausada", tiene **Reanudar** y no tiene las opciones de **Posponer**. Tocar **Reanudar**: `pendiente`.
3. Posponer **Regar** con la opción **3 horas**. Tocar su fila: el panel tiene **Quitar posponer** y **Pausar**. Tocar **Pausar**: **Regar** se ve pausada ("Pausada", sin barra).
4. A las `2026-07-15T11:30:00`, reanudarla: queda pospuesta, con la barra en 50.

## Flujo 7: dos dispositivos

Precondición: lista vacía, reloj en `2026-07-15T10:00:00` (miércoles) en A y en B.

1. En A, crear `Pagar la luz` con **No se repite** y sin fecha límite. B la ve.
2. B sin conexión. En A, posponer **Pagar la luz** con la opción **3 horas**. En B (que no vio la posposición), cambiar el título a `Pagar el gas` y guardar.
3. B vuelve a tener conexión. En A y en B, **Pagar el gas** está pospuesta y su panel dice "Pospuesta hasta 13:00".
4. En A, tocar **Quitar posponer**. B la ve `pendiente`. B sin conexión. En A, a las `2026-07-15T10:10:00`, posponerla con la opción **3 horas**. En B, que no vio la posposición, a las `2026-07-15T10:15:00`, posponerla con la opción **1 hora**.
5. B vuelve a tener conexión. En A y en B, el panel de **Pagar el gas** dice "Pospuesta hasta 11:15" (gana la última posposición entera).

## Flujo 8: dos dispositivos con relojes desfasados

Precondición: lista vacía, reloj en `2026-07-15T08:05:00` (miércoles) en A y en `2026-07-15T08:00:00` en B (B va cinco minutos atrasado); ambos avanzan a la par.

1. En A, crear `Pagar la luz` con **No se repite** y sin fecha límite. B la ve `pendiente`.
2. En A, posponer **Pagar la luz** con la opción **1 hora**. En A, su panel dice "Pospuesta hasta 09:05" y la barra está en 0.
3. En B (cuyo reloj marca `08:00:00`, antes del inicio de la posposición), **Pagar la luz** está pospuesta: atenuada, sin "Atrasada", con la barra en 0 (vacía, no negativa), y su panel dice "Pospuesta hasta 09:05".
4. Avanzar los dos relojes 30 minutos: en A la barra está en 50; en B (`08:30:00`) la barra está en 42 (la posposición empezó a las 08:05 en A).
