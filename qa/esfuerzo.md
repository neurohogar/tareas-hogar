# QA: esfuerzo estimado y Solo rápidas

Verifica, solo por la interfaz:

- el selector **Esfuerzo** del panel: sus cuatro opciones, el valor inicial "Sin estimar", crear y editar con cualquier tipo de tarea, y que "Sin estimar" quita el esfuerzo;
- el nivel en la fila ("Rápida", "Media", "Larga"; nada sin esfuerzo);
- el botón **Solo rápidas**: se ve aunque no haya etiquetas, deja solo las rápidas en el mismo orden por urgencia, se combina con el filtro por etiqueta, aplica a completadas y pausadas, sus dos textos de lista vacía, se mantiene al ir a otra pantalla y vuelve a apagado al recargar o al abrir la app;
- que una tarea entra o sale de la lista filtrada al cambiarle el esfuerzo (en este dispositivo o en otro);
- el esfuerzo como campo independiente con dos dispositivos.

Cubre spec §4.1 (`esfuerzo`), §6.1 (Solo rápidas, nivel en la fila), §6.2 (Esfuerzo) y §7 (conflictos por campo).

Fuera de alcance: el orden por urgencia en sí (`qa/orden-pendientes.md`), el filtro por etiqueta sin Solo rápidas (`qa/etiquetas.md`), Mostrar completadas (`qa/mostrar-completadas.md`) y Mostrar pausadas (`qa/pausar.md`) más allá de su combinación con Solo rápidas.

## Entorno

- Firebase Emulator Suite (Auth + Firestore) con datos limpios al inicio de cada flujo.
- Cada flujo parte de un contexto de navegador nuevo (sin datos guardados en el dispositivo), con sesión iniciada con la cuenta `qa@example.com` del Auth Emulator (Flujo 1 de `qa/periodica-relativa.md`).
- Reloj simulado del navegador (`page.clock`) instalado **antes** de abrir la app, en la hora local que indica cada flujo (zona `America/Argentina/Buenos_Aires`).
  - "A las X" significa adelantar el reloj simulado hasta X antes del paso.
  - "Avanzar el reloj a X" significa adelantarlo hasta X y esperar a que la pantalla se actualice sola (sin recargar).
- Crear una tarea: tocar **+**, escribir el título, elegir la opción de **Se repite** que indica el paso, con los controles de `qa/puntual.md`, `qa/periodica-relativa.md` y `qa/periodica-calendario.md`; si el paso da un horario, cargarlo como en `qa/horario.md`; si da etiquetas, como en `qa/etiquetas.md`; si da un esfuerzo ("esfuerzo Rápida"), elegirlo en el selector **Esfuerzo** (ver contrato); guardar. Sin esfuerzo en el paso, el selector queda en su valor inicial.
- **Mostrar completadas** y **Mostrar pausadas** quedan apagados salvo que el flujo diga encenderlos.
- **Dos dispositivos** (Flujos 7 y 8): dos contextos de navegador independientes, A y B, con la misma cuenta y el mismo reloj simulado. "B sin conexión" significa `browserContext.setOffline(true)` en B; "B vuelve a tener conexión", volverlo online y esperar a que las dos pantallas se actualicen solas.

Semana de referencia: lunes 2026-07-13, martes 14, miércoles 15, jueves 16, viernes 17.

## Contrato observable

- **Selector Esfuerzo** (panel **Nueva tarea** y **Editar tarea**, en cualquier tipo de tarea): un control con rol `combobox` (por ejemplo un `select`) y nombre accesible **Esfuerzo**. Sus opciones, en este orden: "Sin estimar", "Rápida (≤ 5 min)", "Media (≈ 15 min)" y "Larga". En **Nueva tarea** muestra "Sin estimar". En **Editar tarea** muestra el esfuerzo guardado ("Sin estimar" si no tiene). El valor elegido se guarda con **Guardar**, como los demás campos.
- **Nivel en la fila**: el texto "Rápida", "Media" o "Larga" dentro de la fila de la tarea, en letra más chica que el título (`font-size` computado menor). Una tarea sin esfuerzo no tiene ninguno de esos textos en su fila.
- **Botón Solo rápidas**: un botón con nombre accesible "Solo rápidas", junto al grupo **Filtrar por etiqueta** de `qa/etiquetas.md` y fuera de él; se ve aunque no haya etiquetas (y el grupo no se vea). Encendido = `aria-pressed="true"`; apagado = `aria-pressed="false"`. Al abrir la app está apagado.
- **Texto de lista vacía**: con la lista vacía, se ve "No hay tareas rápidas" si **Solo rápidas** está encendido y el filtro está en **Todas**; "No hay tareas con esta etiqueta" si hay una etiqueta elegida (con **Solo rápidas** encendido o apagado). Con la lista no vacía, no se ve ninguno de los dos.
- **Fila**: el contrato de `qa/periodica-relativa.md` (checkbox, título, estilo atenuado, barra de progreso, indicador "Atrasada"), el de `qa/mostrar-completadas.md` (completada / no completada) y el de `qa/pausar.md` (fila pausada).
- **Lista**: "La lista es A, B, C" significa exactamente esas filas, de arriba hacia abajo.

## Flujo 1: el selector Esfuerzo y el nivel en la fila

Precondición: lista vacía, reloj en `2026-07-15T08:00:00` (miércoles).

1. Tocar **+**: el panel **Nueva tarea** tiene el selector **Esfuerzo** con "Sin estimar" elegido, y ofrece "Sin estimar", "Rápida (≤ 5 min)", "Media (≈ 15 min)" y "Larga", en ese orden.
2. Escribir el título `Cambiar foco`, elegir **No se repite**, elegir "Rápida (≤ 5 min)" en **Esfuerzo** y guardar. La fila **Cambiar foco** muestra "Rápida".
3. Crear `Pagar la luz` con **No se repite**, sin fecha límite y sin tocar **Esfuerzo**. Su fila no muestra "Rápida", "Media" ni "Larga".
4. Tocar la fila **Cambiar foco**: el panel **Editar tarea** muestra "Rápida (≤ 5 min)" en **Esfuerzo**. Elegir "Larga" y guardar: la fila muestra "Larga" y ya no "Rápida".
5. Tocar la fila **Pagar la luz**: **Esfuerzo** muestra "Sin estimar". Elegir "Media (≈ 15 min)" y guardar: la fila muestra "Media".
6. Tocar la fila **Pagar la luz**, elegir "Sin estimar" y guardar: la fila ya no muestra ningún nivel. Volver a abrirla: **Esfuerzo** muestra "Sin estimar".
7. Tocar la fila **Cambiar foco**, elegir "Rápida (≤ 5 min)" y tocar **Cerrar** sin guardar (y **Descartar** en el aviso "Tenés cambios sin guardar"): la fila sigue mostrando "Larga".
8. Recargar: **Cambiar foco** muestra "Larga" y **Pagar la luz** ningún nivel.

## Flujo 2: esfuerzo en periódicas, con horario y con cambio de tipo

Precondición: lista vacía, reloj en `2026-07-15T08:00:00` (miércoles).

1. Crear `Regar` con **Intervalo** cada `2` **días**, horario `08:00`–`11:00` y esfuerzo **Rápida**. La fila muestra "Rápida" y "08:00–11:00".
2. Crear `Sacar la basura` con **Días de la semana** `jueves` y esfuerzo **Larga**. La fila muestra "Larga".
3. Tocar la fila **Regar**: **Esfuerzo** muestra "Rápida (≤ 5 min)". Cambiar **Se repite** a **No se repite**, sin fecha límite, y guardar: la fila sigue mostrando "Rápida". Al abrirla de nuevo, **Esfuerzo** sigue en "Rápida (≤ 5 min)".

## Flujo 3: Solo rápidas, orden y lista vacía

Precondición: lista vacía, reloj en `2026-07-15T08:00:00` (miércoles). No hay etiquetas.

1. El grupo **Filtrar por etiqueta** no se ve; el botón **Solo rápidas** sí, apagado. La lista está vacía y no se ve "No hay tareas rápidas".
2. Tocar **Solo rápidas**: queda encendido. La lista está vacía y se ve "No hay tareas rápidas". Tocarlo otra vez: apagado, y el texto desaparece.
3. A las `08:00`, crear `Cambiar foco` con **No se repite**, sin fecha límite y esfuerzo **Rápida**. A las `08:01`, crear `Ventilar` con **Intervalo** cada `4` **horas** y esfuerzo **Media**. A las `08:02`, crear `Pagar la luz` con **No se repite**, Fecha límite `2026-07-14` y esfuerzo **Rápida**. A las `08:03`, crear `Regar` con **Intervalo** cada `4` **horas** y esfuerzo **Rápida**. A las `08:04`, crear `Barrer` con **No se repite** y sin fecha límite (sin esfuerzo).
4. A las `09:00`, completar **Regar**. A las `09:30`, completar **Ventilar**.
5. Avanzar el reloj a `2026-07-15T14:00:00`: la lista es **Pagar la luz** (atrasada), **Regar** (pendiente desde las 13:00), **Ventilar** (pendiente desde las 13:30), **Cambiar foco**, **Barrer**.
6. Tocar **Solo rápidas**: la lista es **Pagar la luz**, **Regar**, **Cambiar foco**, en el mismo orden relativo. No se ve "No hay tareas rápidas".
7. Tocar el checkbox de **Pagar la luz**: su fila desaparece. La lista es **Regar**, **Cambiar foco**.
8. Tocar la fila **Regar**, elegir "Media (≈ 15 min)" y guardar: **Regar** sale de la lista. La lista es **Cambiar foco**.
9. Tocar la fila **Cambiar foco**, elegir "Sin estimar" y guardar: la lista está vacía y se ve "No hay tareas rápidas".
10. Tocar **Solo rápidas**: apagado. La lista es **Regar**, **Ventilar**, **Cambiar foco**, **Barrer** y el texto de lista vacía desaparece.

## Flujo 4: combinación con el filtro por etiqueta

Precondición: lista vacía, reloj en `2026-07-15T08:00:00` (miércoles).

1. A las `08:00`, crear `Pagar la luz` (**No se repite**, sin fecha límite) con la etiqueta `Casa` y esfuerzo **Rápida**. A las `08:01`, crear `Barrer` (**No se repite**, sin fecha límite) con la etiqueta `Casa` y esfuerzo **Larga**. A las `08:02`, crear `Regar` (**No se repite**, sin fecha límite) con la etiqueta `Patio` y esfuerzo **Rápida**. A las `08:03`, crear `Lavar ropa` (**No se repite**, sin fecha límite), sin etiquetas y con esfuerzo **Rápida**.
2. El grupo **Filtrar por etiqueta** muestra **Todas**, **Casa**, **Patio** y, fuera del grupo, el botón **Solo rápidas**, apagado.
3. Tocar **Casa**: la lista es **Pagar la luz**, **Barrer**. Tocar **Solo rápidas**: la lista es **Pagar la luz**; **Casa** sigue elegido.
4. Tocar **Patio**: la lista es **Regar**; **Solo rápidas** sigue encendido.
5. Tocar **Todas**: la lista es **Pagar la luz**, **Regar**, **Lavar ropa**.
6. Tocar **Patio**. Tocar la fila **Regar**, elegir "Larga" y guardar: la lista está vacía y se ve "No hay tareas con esta etiqueta" (no "No hay tareas rápidas").
7. Tocar **Solo rápidas**: apagado. La lista es **Regar** y no se ve texto de lista vacía.

## Flujo 5: completadas y pausadas

Precondición: lista vacía, reloj en `2026-07-15T08:00:00` (miércoles).

1. A las `08:00`, crear `Cambiar foco` (**No se repite**, sin fecha límite) con esfuerzo **Media**. A las `08:01`, crear `Pagar la luz` (**No se repite**, sin fecha límite) con esfuerzo **Rápida**. A las `08:02`, crear `Regar` (**Intervalo** cada `2` **días**) con esfuerzo **Rápida**. A las `08:03`, crear `Sacar la basura` (**Intervalo** cada `3` **días**) con esfuerzo **Larga**.
2. A las `09:00`, completar **Pagar la luz**. Tocar la fila **Regar** y tocar **Pausar**. Tocar la fila **Sacar la basura** y tocar **Pausar**. La lista es **Cambiar foco**.
3. Tocar **Solo rápidas**: la lista está vacía y se ve "No hay tareas rápidas" (la completada y la pausada rápidas siguen ocultas).
4. Encender **Mostrar completadas**: la lista es **Pagar la luz**, completada.
5. Encender **Mostrar pausadas**: la lista es **Pagar la luz** (completada), **Regar** (pausada). **Sacar la basura** no se ve.
6. Tocar **Solo rápidas**: apagado. La lista es **Cambiar foco**, **Pagar la luz**, **Regar**, **Sacar la basura**.

## Flujo 6: se mantiene entre pantallas y vuelve a apagado al recargar

Precondición: lista vacía, reloj en `2026-07-15T08:00:00`.

1. Crear `Cambiar foco` (**No se repite**, sin fecha límite) con la etiqueta `Casa` y esfuerzo **Rápida**, y `Barrer` (**No se repite**, sin fecha límite) con la etiqueta `Casa`, sin esfuerzo.
2. Tocar **Solo rápidas** y **Casa**: la lista es **Cambiar foco**.
3. Ir a **Historial** y volver a **Pendientes**: **Solo rápidas** sigue encendido, **Casa** elegido y la lista es **Cambiar foco**. Lo mismo al ir a **Etiquetas** y volver.
4. Recargar: **Solo rápidas** está apagado, **Todas** elegido y la lista es **Cambiar foco**, **Barrer**.
5. Tocar **Solo rápidas**. Cerrar la pestaña y abrir la app de nuevo en el mismo contexto: entra a **Pendientes** con **Solo rápidas** apagado.

## Flujo 7: el esfuerzo con dos dispositivos

Precondición: lista vacía, reloj en `2026-07-15T08:00:00` en A y en B.

1. En A, crear `Pagar la luz` (**No se repite**, sin fecha límite) con esfuerzo **Media**. B ve la fila **Pagar la luz** con "Media".
2. En A, tocar **Solo rápidas**: en A la lista está vacía con "No hay tareas rápidas". En B, **Solo rápidas** sigue apagado y la lista es **Pagar la luz** (no se sincroniza).
3. En B, tocar la fila **Pagar la luz**, elegir "Rápida (≤ 5 min)" y guardar: en A, sin recargar, aparece **Pagar la luz** con "Rápida" y el texto de lista vacía desaparece.
4. B sin conexión. En A, tocar la fila **Pagar la luz**, cambiar el título a `Pagar el gas` y guardar. En B, tocar la fila **Pagar la luz**, elegir "Larga" y guardar.
5. B vuelve a tener conexión. En A y en B, la fila dice **Pagar el gas** con "Larga" (se conservan los dos cambios). En A, con **Solo rápidas** encendido, la lista está vacía con "No hay tareas rápidas".

## Flujo 8: mismo campo, gana el último cambio

Precondición: lista vacía, reloj en `2026-07-15T08:00:00` en A y en B.

1. En A, crear `Regar` (**Intervalo** cada `2` **días**) con esfuerzo **Media**. B la ve con "Media".
2. B sin conexión. En A, elegir "Rápida (≤ 5 min)" para **Regar** y guardar. A las `08:05`, en B, elegir "Sin estimar" para **Regar** y guardar.
3. B vuelve a tener conexión. En A y en B, la fila **Regar** no muestra ningún nivel, y al abrirla **Esfuerzo** muestra "Sin estimar".
