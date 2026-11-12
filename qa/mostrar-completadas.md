# QA: mostrar completadas y contraste

Verifica, solo por la interfaz:

- el check **Mostrar completadas**: apagado al empezar, oculta las completadas; encendido, las muestra al final, de la completada más recientemente a la más antigua;
- qué cuenta como completada: la puntual con un completado y la periódica en espera con un completado, pero no la semanal en espera antes de su primera ocurrencia;
- el contraste: no completadas en negrita; completadas tachadas, en peso normal, atenuadas y con el checkbox marcado;
- tocar el checkbox de una completada: en una puntual, o en una periódica cuyo completado más reciente es de hoy (o posterior), lo borra sin aviso nuevo; en una periódica cuyo completado más reciente es de un día anterior, la completa de nuevo, con aviso;
- el filtro por etiqueta aplicado a las completadas;
- que el valor del check se guarda en el dispositivo, sobrevive a recargar y no se sincroniza con otro dispositivo.

Cubre spec §5.1, §5.2–§5.3 (completar de nuevo), §5.4 (deshacer con el checkbox) y §6.1 (Mostrar completadas, Contraste, checkbox de la fila).

Fuera de alcance: el orden por urgencia de las no completadas (`qa/orden-pendientes.md`), el Historial más allá de contar entradas (`qa/historial-deshacer.md`) y la gestión de etiquetas (`qa/etiquetas.md`).

## Entorno

Como en `qa/historial-deshacer.md`, salvo el check **Mostrar completadas**, que cada flujo maneja explícitamente:

- Firebase Emulator Suite (Auth + Firestore) con datos limpios al inicio de cada flujo.
- Cada flujo parte de un contexto de navegador nuevo (sin datos guardados en el dispositivo), salvo que diga lo contrario.
- Reloj simulado del navegador (`page.clock`) instalado **antes** de abrir la app, en la hora local que indica cada flujo (zona `America/Argentina/Buenos_Aires`).
  - "A las X" significa adelantar el reloj simulado hasta X antes del paso.
  - "Avanzar el reloj a X" significa adelantarlo hasta X y esperar a que la pantalla se actualice sola (sin recargar), salvo que el paso diga "recargar".
  - Con "reloj detenido" (`page.clock.pauseAt`), el reloj se adelanta con `page.clock.runFor` o `fastForward` hasta la hora exacta, para que el tiempo no corra mientras QA actúa.
- Sesión iniciada con la cuenta `qa@example.com` del Auth Emulator (Flujo 1 de `qa/periodica-relativa.md`).
- Crear una tarea: tocar **+**, escribir el título, elegir la opción de **Se repite** que indica el paso y guardar, con los controles de `qa/puntual.md` y `qa/periodica-calendario.md`. Agregar etiquetas con el campo **Etiquetas** de `qa/etiquetas.md`.
- **Dos dispositivos** (Flujos 5, 6 y 8): dos contextos de navegador independientes, A y B, con la misma cuenta y el mismo reloj simulado. "B sin conexión" significa `browserContext.setOffline(true)` en B; "B vuelve a tener conexión", volverlo online y esperar a que las dos pantallas se actualicen solas.

Semana de referencia: lunes 2026-07-13, martes 14, miércoles 15, jueves 16, viernes 17, sábado 18.

## Contrato observable

- **Check Mostrar completadas**: un control con rol `checkbox` y nombre accesible "Mostrar completadas", arriba de la lista de Pendientes. Es distinto de los checkboxes de las filas (el de cada fila tiene un nombre que incluye el título de la tarea).
  - Marcado = encendido; sin marcar = apagado.
- **Lista**: "La lista es A, B, C" significa exactamente esas filas, de arriba hacia abajo. Con el check apagado, una completada no tiene fila.
- **Fila no completada**: checkbox de la fila sin marcar; el título en **negrita** (`font-weight` computado ≥ 600) y sin tachar (`text-decoration-line` computado sin `line-through`).
- **Fila completada**: checkbox de la fila marcado; el título tachado (`text-decoration-line` computado con `line-through`), en peso normal (`font-weight` computado ≤ 400) y atenuado (opacidad efectiva del título, el producto de las opacidades computadas del título y sus ancestros, menor que 1 y menor que la del título de una fila `pendiente` de la misma lista).
- Una fila `en espera` conserva además lo de `qa/periodica-relativa.md`: estilo atenuado y barra de progreso, sea completada o no.
- **Aviso**: el de `qa/historial-deshacer.md` (rol `status`, `Completaste «…»`, **Deshacer**, 5 segundos).
- **Historial**: el de `qa/historial-deshacer.md`; aquí solo se cuentan sus entradas.

## Flujo 1: apagado por defecto, encender y apagar

Precondición: lista vacía, reloj en `2026-07-15T08:00:00` (miércoles).

1. A las `08:00`, crear `Cambiar foco` con **No se repite** y sin fecha límite. A las `08:01`, crear `Regar plantas` con **Intervalo** cada `2` **días**. A las `08:02`, crear `Sacar la basura` con **Días de la semana** `sábado`.
   - El check **Mostrar completadas** se ve sin marcar.
   - La lista es **Regar plantas**, **Cambiar foco**, **Sacar la basura**. Las tres son no completadas: título en negrita, checkbox sin marcar. **Sacar la basura** está `en espera` (atenuada, con barra) aunque no está completada: todavía no llegó su primera ocurrencia.
2. A las `08:05`, tocar el checkbox de **Cambiar foco**: su fila desaparece. La lista es **Regar plantas**, **Sacar la basura**.
3. A las `08:06`, tocar el checkbox de **Regar plantas**: pasa a `en espera` y, como está completada, su fila desaparece. La lista es **Sacar la basura**.
4. Tocar el check **Mostrar completadas**: queda marcado.
   - La lista es **Sacar la basura**, **Regar plantas**, **Cambiar foco**: primero la no completada; después las completadas, de la completada más recientemente (08:06) a la más antigua (08:05).
   - **Regar plantas** y **Cambiar foco** se ven completadas: tachadas, en peso normal, atenuadas y con el checkbox marcado. **Regar plantas** sigue con su barra, en 0.
   - **Sacar la basura** se ve no completada: en negrita y con el checkbox sin marcar.
5. Tocar el check otra vez: queda sin marcar y la lista es **Sacar la basura**.
6. Tocar el check: queda marcado. Avanzar el reloj a `2026-07-17T08:06:00` (viernes): **Regar plantas** vuelve a `pendiente`, deja de ser completada (en negrita, sin tachar, checkbox sin marcar) y sube con las no completadas.
   - La lista es **Regar plantas**, **Sacar la basura**, **Cambiar foco**.
   - La opacidad efectiva del título de **Cambiar foco** es menor que la del de **Regar plantas**.

## Flujo 2: orden de las completadas y filtro por etiqueta

Precondición: lista vacía, reloj en `2026-07-15T08:00:00` (miércoles). Tocar el check **Mostrar completadas** (queda marcado).

1. A las `08:00`, crear `Pagar la luz` (**No se repite**, sin fecha límite) con la etiqueta `Casa`. A las `08:01`, crear `Ventilar` (**Intervalo** cada `4` **horas**) con la etiqueta `Patio`. A las `08:02`, crear `Barrer` (**No se repite**, sin fecha límite) con la etiqueta `Casa`. A las `08:03`, crear `Lavar ropa` (**No se repite**, sin fecha límite) sin etiquetas.
2. A las `09:00`, completar **Barrer**. A las `09:30`, completar **Ventilar**. A las `10:00`, completar **Pagar la luz**.
   - Con **Todas**, la lista es **Lavar ropa**, **Pagar la luz**, **Ventilar**, **Barrer**: la no completada y después las completadas, de la más reciente a la más antigua (no por cuándo se crearon).
   - **Lavar ropa** en negrita; las otras tres tachadas, con el checkbox marcado.
3. Tocar **Casa** en el filtro: la lista es **Pagar la luz**, **Barrer**, las dos completadas.
4. Tocar **Patio**: la lista es **Ventilar**, completada.
5. Tocar **Todas**. Avanzar el reloj a `2026-07-15T13:30:00`: **Ventilar** vuelve a `pendiente` y deja de ser completada.
   - La lista es **Ventilar**, **Lavar ropa**, **Pagar la luz**, **Barrer**.
6. Recargar: el check sigue marcado, **Todas** está elegido y la lista es la misma.

## Flujo 3: tocar el checkbox de una completada

Precondición: lista vacía, reloj detenido en `2026-07-15T08:00:00` (miércoles). Tocar el check **Mostrar completadas** (queda marcado).

1. Crear `Pagar la luz` con **No se repite** y Fecha límite `2026-07-15`, y `Regar` con **Intervalo** cada `4` **horas**. La lista es **Pagar la luz**, **Regar**.
2. A las `08:00:00`, tocar el checkbox de **Pagar la luz**: aparece el aviso `Completaste «Pagar la luz»` y la fila pasa al final, completada. La lista es **Regar**, **Pagar la luz**.
3. A las `08:00:10` (el aviso ya expiró), tocar el checkbox de **Pagar la luz**: vuelve a no completada, `pendiente`, en negrita y con el checkbox sin marcar. **No** aparece ningún aviso. La lista es **Pagar la luz**, **Regar**. El Historial dice "Todavía no completaste nada".
4. A las `08:01:00`, tocar el checkbox de **Regar**: aparece el aviso `Completaste «Regar»`; **Regar** queda `en espera`, completada, con la barra en 0.
5. A las `08:01:02`, con el aviso todavía visible, tocar el checkbox de **Regar**: vuelve a `pendiente` (nunca completada), no completada. No aparece un aviso nuevo; el de `Completaste «Regar»` sigue visible.
6. A las `08:01:03`, tocar **Deshacer** en ese aviso: el aviso se cierra y no cambia nada (su completado ya no existe). **Regar** sigue `pendiente` y el Historial dice "Todavía no completaste nada".
7. A las `08:02:00`, tocar el checkbox de **Regar** (completada, `en espera`). Avanzar el reloj a `2026-07-15T12:02:00`: **Regar** vuelve a `pendiente`, no completada. Tocar su checkbox: completada otra vez, barra en 0. El Historial tiene dos entradas de **Regar**: `12:02` y `08:02`.
8. A las `2026-07-15T12:02:10`, tocar el checkbox de **Regar**: se borra solo el completado de las `12:02`. **Regar** está `pendiente` (el de las `08:02` venció a las `12:02`), no completada. El Historial tiene una sola entrada: **Regar** `08:02`.
9. Avanzar el reloj a `2026-07-16T00:00:00` (jueves): **Pagar la luz** está `atrasada` (y **Regar** también, desde las `16:02` de ayer). Tocar el checkbox de **Pagar la luz**: completada. Tocarlo otra vez: vuelve a `atrasada` (muestra "Atrasada"), en negrita y con el checkbox sin marcar.
10. Recargar: la lista es **Regar**, **Pagar la luz**, las dos `atrasada` y no completadas.

## Flujo 4: el valor se guarda en el dispositivo

Precondición: lista vacía, reloj en `2026-07-15T08:00:00`.

1. Crear `Cambiar foco` y `Pagar la luz` con **No se repite** y sin fecha límite. Completar **Cambiar foco**: la lista es **Pagar la luz**.
2. Tocar el check **Mostrar completadas**: la lista es **Pagar la luz**, **Cambiar foco** (tachada).
3. Recargar: el check sigue marcado y la lista es la misma.
4. Cerrar la pestaña y abrir la app de nuevo en el mismo contexto: entra directo a **Pendientes** con el check marcado y la misma lista.
5. Tocar el check: queda sin marcar. Recargar: sigue sin marcar y la lista es **Pagar la luz**.

## Flujo 5: el valor no se sincroniza entre dispositivos

Precondición: lista vacía, reloj en `2026-07-15T08:00:00` en A y en B.

1. En A, crear `Cambiar foco` y `Pagar la luz` con **No se repite** y sin fecha límite, y completar **Cambiar foco**. B ve solo **Pagar la luz**.
2. En A, tocar el check **Mostrar completadas**: en A la lista es **Pagar la luz**, **Cambiar foco**. En B el check sigue sin marcar y la lista sigue siendo **Pagar la luz**, también después de recargar B.
3. En B, tocar el check: en B se ve **Cambiar foco** tachada. En A, apagar el check: en A la lista es **Pagar la luz**; en B el check sigue marcado y se sigue viendo **Cambiar foco**.

## Flujo 6: dos completados de dos dispositivos

Tocar el checkbox borra el completado más reciente; si queda otro, la puntual sigue completada.

Precondición: lista vacía, reloj en `2026-07-15T08:00:00` en A y en B. En A, tocar el check **Mostrar completadas** (queda marcado).

1. En A, crear `Pagar la luz` con **No se repite** y sin fecha límite. B la ve.
2. B sin conexión. A las `08:00`, completar **Pagar la luz** en A. A las `08:05`, completar **Pagar la luz** en B (B no vio el completado de A).
3. B vuelve a tener conexión. En A, **Pagar la luz** está completada y el Historial tiene dos entradas: **Pagar la luz** `08:05` y `08:00`.
4. En A, tocar el checkbox de **Pagar la luz**: sigue completada (tachada, con el checkbox marcado). El Historial tiene una sola entrada, **Pagar la luz** `08:00`; en B también.
5. En A, tocar el checkbox otra vez: **Pagar la luz** vuelve a `pendiente`, no completada. El Historial de A y el de B dicen "Todavía no completaste nada".

## Flujo 7: periódica completada ayer: el checkbox la completa de nuevo

Precondición: lista vacía, reloj detenido en `2026-07-15T20:00:00` (miércoles). Tocar el check **Mostrar completadas** (queda marcado).

1. Crear `Regar` con **Intervalo** cada `2` **días**. A las `20:00:00`, tocar su checkbox: aparece el aviso `Completaste «Regar»`; **Regar** queda `en espera`, completada.
2. A las `2026-07-15T23:59:59`, tocar su checkbox (el completado es de hoy): se borra. **Regar** vuelve a `pendiente`, no completada; no aparece aviso nuevo. Tocarlo otra vez: completada, `en espera`, barra en 0. El Historial tiene una entrada: **Regar** `23:59`.
3. A las `2026-07-16T00:00:00` (el día siguiente), tocar su checkbox: el último completado es de ayer, así que la completa de nuevo. Aparece el aviso `Completaste «Regar»`; sigue completada, barra en 0. El Historial tiene dos entradas: **Hoy** `00:00` y **Ayer** `23:59`.
4. A las `2026-07-16T00:00:10`, tocar su checkbox: el completado más reciente (`00:00`) es de hoy y se borra; no aparece aviso nuevo. **Regar** sigue `en espera` y completada (le queda el de ayer). El Historial tiene una entrada: **Ayer** **Regar** `23:59`.

## Flujo 8: completado "del futuro"

Un completado posterior a hoy (relojes desfasados) cuenta como de hoy o posterior: el checkbox lo borra.

Precondición: lista vacía; reloj de A en `2026-07-15T12:00:00` (miércoles) y de B en `2026-07-16T09:00:00` (jueves, adelantado). En A, tocar el check **Mostrar completadas**.

1. En A, crear `Regar` con **Intervalo** cada `2` **días**. En B, completar **Regar**.
2. En A, **Regar** está `en espera`, completada, con la barra en 0.
3. En A, tocar el checkbox de **Regar**: se borra el completado de B. **Regar** vuelve a `pendiente`, no completada, y el Historial de A y el de B dicen "Todavía no completaste nada".
