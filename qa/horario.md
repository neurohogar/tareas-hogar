# QA: horario (ventanas diarias para completar)

Verifica, solo por la interfaz:

- el campo **Horario** del panel ("Solo en un horario", **Desde**, **Hasta**): crear, cambiar y quitar un horario en cualquier tipo de tarea, y sus dos errores;
- el horario en la fila ("08:00–11:00");
- los estados con horario: `en espera` hasta que abre la ventana, `pendiente` dentro de ella y `atrasada` cuando la ventana pasa sin completarse (o antes, si llega primero el atraso sin horario), también fuera de las ventanas;
- el checkbox de la fila: deshabilitado fuera de la ventana cuando completaría, siempre habilitado cuando borraría; Deshacer en el aviso a cualquier hora;
- Mostrar completadas: una periódica completada en espera por horario no se ve hasta que abre la ventana;
- el orden por urgencia con horario;
- la sincronización del horario como un solo campo;
- que una tarea sin horario se comporta como siempre;
- **varios horarios** (Flujos 11 a 15): **Agregar horario** y **Quitar** en el panel, sus dos errores, el texto "07:00–10:00 · 18:00–21:00" en la fila, y los estados y el checkbox con dos ventanas por día en calendario, puntual y relativa en días.

Cubre spec §4.1 (horario y varios horarios), §5.5, §5.6, §5.7, §6.1 (horario en la fila, checkbox fuera de la ventana, orden), §6.2 (campo Horario) y §7 (conflictos por campo).

Fuera de alcance: los estados sin horario (`qa/puntual.md`, `qa/periodica-relativa.md`, `qa/periodica-calendario.md`), el Historial más allá de borrar un completado (`qa/historial-deshacer.md`) y las etiquetas (`qa/etiquetas.md`).

## Entorno

- Firebase Emulator Suite (Auth + Firestore) con datos limpios al inicio de cada flujo.
- Cada flujo parte de un contexto de navegador nuevo (sin datos guardados en el dispositivo), con sesión iniciada con la cuenta `qa@example.com` del Auth Emulator (Flujo 1 de `qa/periodica-relativa.md`).
- Reloj simulado del navegador (`page.clock`) instalado **antes** de abrir la app, en la hora local que indica cada flujo (zona `America/Argentina/Buenos_Aires`).
  - "A las X" significa adelantar el reloj simulado hasta X antes del paso.
  - "Avanzar el reloj a X" significa adelantarlo hasta X y esperar a que la pantalla se actualice sola (sin recargar).
  - Con "reloj detenido" (`page.clock.pauseAt`), el reloj se adelanta con `page.clock.runFor` o `fastForward` hasta la hora exacta, para que el tiempo no corra mientras QA actúa.
- Crear una tarea: tocar **+**, escribir el título, elegir la opción de **Se repite** que indica el paso, con los controles de `qa/puntual.md`, `qa/periodica-relativa.md` y `qa/periodica-calendario.md`; si el paso da un horario, encender **Solo en un horario** y escribir **Desde** y **Hasta**; guardar.
- **Mostrar completadas** queda apagado salvo que el flujo diga encenderlo (`qa/mostrar-completadas.md`).
- **Dos dispositivos** (Flujo 9): dos contextos de navegador independientes, A y B, con la misma cuenta y el mismo reloj simulado. "B sin conexión" significa `browserContext.setOffline(true)` en B; "B vuelve a tener conexión", volverlo online y esperar a que las dos pantallas se actualicen solas.

Semana de referencia: lunes 2026-07-13, martes 14, miércoles 15, jueves 16, viernes 17, sábado 18.

## Contrato observable

- **Campo Horario del panel**: un control con rol `checkbox` y nombre accesible "Solo en un horario". Encendido, muestra dos campos de hora (`input type="time"` o equivalente con rol accesible) con etiquetas **Desde** y **Hasta**; apagado, no se ven.
  - Debajo de las filas Desde/Hasta, un botón con nombre accesible **Agregar horario** que agrega otra fila Desde/Hasta vacía. Con más de una fila, cada fila tiene un botón **Quitar** que la elimina; con una sola, no hay **Quitar**.
  - Errores: el texto "La hora de fin tiene que ser posterior a la de inicio", "Completá las dos horas", "Los horarios no se pueden superponer" o "Con varios horarios, el intervalo tiene que ser en días", visible en el panel. Con un error, **Guardar** no cierra el panel ni guarda nada: al cerrar el panel sin guardar (con **Descartar** en el aviso), la lista y la fila no cambiaron.
- **Horario en la fila**: el texto `HH:MM–HH:MM` (con guion `–`, U+2013) dentro de la fila de la tarea, en letra más chica que el título (`font-size` computado menor). Con varias ventanas, en orden por desde y separadas por ` · ` (espacio, punto medio U+00B7, espacio): `07:00–10:00 · 18:00–21:00`. Una tarea sin horario no tiene ese texto.
- **Fila**: el contrato de `qa/periodica-relativa.md` (checkbox, título, estilo atenuado, barra de progreso con `aria-valuenow`, indicador "Atrasada") y el de `qa/mostrar-completadas.md` (completada / no completada). Con horario, una puntual también puede estar `en espera` (atenuada, con barra, sin completados).
- **Checkbox deshabilitado**: el checkbox de la fila tiene `disabled` o `aria-disabled="true"`; tocarlo no cambia nada (no hay aviso, la fila no cambia, el Historial no suma entradas). **Habilitado**: sin esos atributos.
- **Aviso**: el de `qa/historial-deshacer.md` (rol `status`, `Completaste «…»`, **Deshacer**, 5 segundos).
- **Lista**: "La lista es A, B, C" significa exactamente esas filas, de arriba hacia abajo.

## Flujo 1: crear, cambiar y quitar el horario

Precondición: lista vacía, reloj en `2026-07-15T06:00:00` (miércoles).

1. Tocar **+**. El check **Solo en un horario** se ve apagado y no hay campos **Desde** ni **Hasta**.
2. Escribir el título `Regar`, elegir **No se repite**, encender **Solo en un horario**: aparecen **Desde** y **Hasta**. Escribir **Desde** `08:00` y **Hasta** `11:00`. Guardar.
   - La fila **Regar** muestra `08:00–11:00`.
3. Crear `Ventilar` con **Intervalo** cada `1` **días** y horario `20:00` a `22:30`: su fila muestra `20:00–22:30`.
4. Crear `Sacar la basura` con **Días de la semana** `jueves` y horario `09:00` a `10:00`: su fila muestra `09:00–10:00`.
5. Crear `Barrer` con **No se repite** y sin horario: su fila no muestra ningún horario.
6. Tocar la fila **Regar**: el panel muestra **Solo en un horario** encendido, **Desde** `08:00` y **Hasta** `11:00`. Cambiar **Desde** a `07:30` y guardar: la fila muestra `07:30–11:00`.
7. Tocar la fila **Regar**, cambiar **Se repite** a **Intervalo** cada `2` **días** y guardar: la fila sigue mostrando `07:30–11:00`.
8. Tocar la fila **Regar**, apagar **Solo en un horario** y guardar: la fila no muestra ningún horario.
9. Recargar: **Regar** sin horario, **Ventilar** `20:00–22:30`, **Sacar la basura** `09:00–10:00`, **Barrer** sin horario.

## Flujo 2: errores del campo Horario

Precondición: lista vacía, reloj en `2026-07-15T06:00:00`. Crear `Regar` con **No se repite** y horario `08:00` a `11:00`.

1. Tocar **+**, escribir `Pagar la luz`, elegir **No se repite**, encender **Solo en un horario**, escribir **Desde** `11:00` y **Hasta** `08:00` y tocar **Guardar**.
   - Se ve "La hora de fin tiene que ser posterior a la de inicio" y el panel sigue abierto.
2. Cambiar **Hasta** a `11:00` (igual a **Desde**) y tocar **Guardar**: se ve el mismo error.
3. Borrar **Hasta** (vacío) y tocar **Guardar**: se ve "Completá las dos horas".
4. Escribir **Hasta** `12:00` y tocar **Guardar**: el panel se cierra y **Pagar la luz** muestra `11:00–12:00` (el error se muestra hasta el siguiente intento de guardar, como el de los demás campos del panel).
5. Tocar la fila **Regar**, cambiar el título a `Regar plantas` y **Desde** a `11:30`, y tocar **Guardar**: se ve "La hora de fin tiene que ser posterior a la de inicio". Cerrar el panel sin guardar (y **Descartar** en el aviso "Tenés cambios sin guardar"): la fila sigue siendo **Regar** con `08:00–11:00` (la edición se rechaza entera).
6. Tocar la fila **Regar**, vaciar **Desde** y tocar **Guardar**: se ve "Completá las dos horas". Cerrar sin guardar (y **Descartar** en el aviso "Tenés cambios sin guardar"): la fila sigue con `08:00–11:00`.

## Flujo 3: puntual con horario, checkbox y Deshacer

Precondición: lista vacía, reloj detenido en `2026-07-15T06:00:00` (miércoles).

1. Crear `Regar` con **No se repite**, sin fecha límite, horario `08:00` a `11:00`.
   - La fila está `en espera`: atenuada, con barra; el título en negrita y el checkbox sin marcar (no está completada); sin indicador de atraso.
   - El checkbox está **deshabilitado**. Tocarlo: no aparece aviso y la fila no cambia.
2. A las `07:00`: la barra marca `50` (1 h de las 2 h hasta las 08:00).
3. A las `08:00:00`: la fila pasa a `pendiente` (sin atenuar, sin barra) y el checkbox está **habilitado**.
4. A las `10:59:58`, tocar el checkbox: aparece `Completaste «Regar»` y la fila desaparece de la lista.
5. A las `11:00:02` (la ventana ya cerró, el aviso sigue visible), tocar **Deshacer**: el aviso se cierra y **Regar** vuelve a la lista `en espera`, con la barra en `0` y el checkbox **deshabilitado** (hasta las 08:00 del jueves).
6. A las `2026-07-15T21:30:00`: la barra marca `50`. Sigue sin indicador de atraso (una puntual sin fecha límite nunca se atrasa).
7. A las `2026-07-16T08:00:00`: `pendiente` y checkbox habilitado.

## Flujo 4: puntual con fecha límite

Precondición: lista vacía, reloj en `2026-07-15T06:00:00`.

1. Crear `Pagar la luz` con **No se repite**, Fecha límite `2026-07-16` y horario `08:00` a `11:00`. Está `en espera`, checkbox deshabilitado.
2. Avanzar el reloj a `2026-07-16T10:59:00`: `pendiente`, checkbox habilitado.
3. Avanzar el reloj a `2026-07-16T11:00:00`: `atrasada` (indicador "Atrasada", sin atenuar, sin barra) y checkbox **deshabilitado**.
4. Avanzar el reloj a `2026-07-17T08:00:00`: sigue `atrasada`, ahora con el checkbox **habilitado**. Tocarlo: aparece `Completaste «Pagar la luz»` y la fila desaparece.
5. Avanzar el reloj a `2026-07-17T12:00:00`. Crear `Pagar el gas` con Fecha límite `2026-07-17` y horario `08:00` a `11:00`: aparece `atrasada` en el acto (la ventana de su día límite ya cerró), con el checkbox deshabilitado.

## Flujo 5: relativa con horario

Precondición: lista vacía, reloj detenido en `2026-07-15T09:00:00` (miércoles). Tocar **Mostrar completadas** (queda marcado).

1. Crear `Regar` con **Intervalo** cada `1` **días** y horario `08:00` a `11:00`. Está `pendiente` (nunca completada, creada dentro de la ventana), checkbox habilitado.
2. Tocar el checkbox: la fila pasa a completada, `en espera`, con la barra en `0`.
3. A las `15:00`: la barra marca `25` (vuelve el jueves a las 09:00). El checkbox (que borraría el completado de hoy) está **habilitado**.
4. A las `2026-07-16T09:00:00`: `pendiente`. A las `2026-07-16T11:00:00`: `atrasada`, checkbox **deshabilitado**. A las `2026-07-16T20:00:00`: sigue `atrasada` y deshabilitado.
5. A las `2026-07-17T08:00:00`: sigue `atrasada`, checkbox **habilitado**. Tocarlo: aparece el aviso y la fila pasa a completada, `en espera`.
6. A las `2026-07-17T20:00:00`: barra en `50`.

## Flujo 6: atraso antes de que abra la ventana

Precondición: lista vacía, reloj detenido en `2026-07-15T10:00:00`.

1. Crear `Remedio` con **Intervalo** cada `4` **horas** y horario `08:00` a `11:00`, y tocar su checkbox a las `10:00`. Tocar **Mostrar completadas**.
2. A las `15:30`: `en espera`, barra en `25` (vuelve el jueves a las 08:00).
3. A las `18:00`: `atrasada` (pasó V + intervalo, aunque la ventana no abrió), checkbox **deshabilitado**.
4. A las `2026-07-16T08:00:00`: sigue `atrasada`, checkbox **habilitado**.

## Flujo 7: calendario y Mostrar completadas

Precondición: lista vacía, reloj en `2026-07-14T07:00:00` (martes). Mostrar completadas apagado.

1. Crear `Sacar la basura` con **Días de la semana** `martes` y `jueves` y horario `08:00` a `11:00`. Está `en espera` sin completados (no completada): se ve, en negrita, checkbox sin marcar y **deshabilitado**.
2. A las `08:00`: `pendiente`. Tocar el checkbox: la fila desaparece (completada).
3. Avanzar el reloj a `2026-07-16T07:59:00` (jueves): la lista sigue vacía (la tarea sigue `en espera` y completada; sin horario ya estaría `pendiente` desde las 00:00).
4. Tocar **Mostrar completadas**: se ve **Sacar la basura** completada, `en espera`. Su checkbox (que la completaría de nuevo: el completado es de un día anterior) está **deshabilitado**. Apagar **Mostrar completadas**.
5. Avanzar el reloj a `2026-07-16T08:00:00`: **Sacar la basura** aparece `pendiente`.
6. Avanzar el reloj a `2026-07-16T11:00:00`: `atrasada`, checkbox deshabilitado.
7. Avanzar el reloj a `2026-07-17T09:00:00` (viernes): sigue `atrasada`, checkbox habilitado. Tocarlo: completada. En el **Historial**, el completado nuevo figura con la tarea **Sacar la basura** (§5.3: cubre el jueves; vuelve el martes siguiente).
8. En el **Historial**, a las `2026-07-17T20:00:00` (fuera de la ventana), borrar ese completado: se borra y la tarea vuelve a la lista `atrasada`.

## Flujo 8: orden con horario

Precondición: lista vacía, reloj en `2026-07-15T08:00:00` (miércoles).

1. A las `08:00`, crear `Cambiar sábanas` con **Días de la semana** `jueves` (sin horario) y `Sacar la basura` con **Días de la semana** `jueves` y horario `09:00` a `10:00`.
2. A las `12:00`, crear `Cambiar foco` con **No se repite**, sin fecha límite, y horario `08:00` a `11:00`.
3. A las `14:00`: las tres están `en espera` y la lista es **Cambiar sábanas**, **Cambiar foco**, **Sacar la basura** (vuelven el jueves a las 00:00, 08:00 y 09:00).
4. Tocar **Cambiar foco**, cambiar el horario a `10:00` a `11:00` y guardar: la lista es **Cambiar sábanas**, **Sacar la basura**, **Cambiar foco**.
5. Avanzar el reloj a `2026-07-16T09:30:00`: **Cambiar sábanas** y **Sacar la basura** están `pendiente` y **Cambiar foco** `en espera`. La lista es **Cambiar sábanas**, **Sacar la basura**, **Cambiar foco** (pendiente desde las 00:00 y desde las 09:00).
6. Crear `Pagar la luz` con **No se repite**, Fecha límite `2026-07-17` y horario `08:00` a `11:00`, y `Barrer` con **No se repite**, sin fecha límite y horario `08:00` a `11:00`. Las dos están `pendiente` (dentro de su ventana).
   - La lista es **Cambiar sábanas**, **Sacar la basura**, **Pagar la luz**, **Barrer**, **Cambiar foco**: una puntual con horario conserva su clave de orden (00:00 de su fecha límite; sin fecha límite, al final del grupo), no el momento en que abrió su ventana.
7. Tocar **Pagar la luz**, cambiar la Fecha límite a `2026-07-16` y guardar: la lista es **Cambiar sábanas**, **Pagar la luz**, **Sacar la basura**, **Barrer**, **Cambiar foco** (las 00:00 del 16 empatan con **Cambiar sábanas**, que va primero por `creadaEn` más antigua; **Pagar la luz** pasa antes que **Sacar la basura**, pendiente desde las 09:00).

## Flujo 9: dos dispositivos

Precondición: lista vacía, reloj en `2026-07-15T06:00:00`. A y B abiertos. En A, crear `Regar` con **No se repite** y horario `08:00` a `11:00`; esperar a que B la muestre con `08:00–11:00`.

1. Poner B sin conexión. En A, cambiar **Desde** de **Regar** a `07:00` y guardar. En B, cambiar **Hasta** de **Regar** a `12:00` y guardar.
2. B vuelve a tener conexión: las dos pantallas muestran `08:00–12:00` (gana entero el último cambio; no queda `07:00–12:00`).
3. Poner B sin conexión. En A, apagar **Solo en un horario** de **Regar** y guardar. En B, cambiar el título de **Regar** a `Regar plantas` y guardar.
4. B vuelve a tener conexión: las dos pantallas muestran **Regar plantas** sin horario.

## Flujo 10: sin horario, todo sigue igual

Precondición: lista vacía, reloj en `2026-07-15T03:00:00`.

1. Crear `Barrer` con **No se repite**, sin fecha límite y sin horario: `pendiente`, sin texto de horario, checkbox **habilitado** a las 03:00.
2. Crear `Regar` con **Intervalo** cada `1` **días** sin horario y tocar su checkbox a las `03:00`. Avanzar el reloj a `2026-07-16T03:00:00`: **Regar** está `pendiente` y su checkbox habilitado, a cualquier hora.

## Flujo 11: Agregar horario y Quitar

Precondición: lista vacía, reloj en `2026-07-15T06:00:00` (miércoles).

1. Tocar **+**, escribir `Alimentar a los perros`, elegir **No se repite** y encender **Solo en un horario**: hay una fila **Desde**/**Hasta**, sin botón **Quitar**, y un botón **Agregar horario**.
2. Escribir **Desde** `18:00` y **Hasta** `21:00`. Tocar **Agregar horario**: aparece una segunda fila vacía y cada fila tiene **Quitar**. Escribir en ella **Desde** `07:00` y **Hasta** `10:00`. Guardar.
   - La fila **Alimentar a los perros** muestra `07:00–10:00 · 18:00–21:00` (ordenadas por desde, aunque se cargaron al revés).
3. Tocar la fila: el panel muestra **Solo en un horario** encendido y dos filas, en orden: `07:00`–`10:00` y `18:00`–`21:00`.
4. Tocar **Quitar** en la fila `07:00`–`10:00` y guardar: la fila de la tarea muestra `18:00–21:00`. Al abrir el panel, hay una sola fila, sin **Quitar**.
5. Tocar **Agregar horario**, escribir `10:00` a `12:00` en la fila nueva y cambiar la otra a `08:00` a `10:00` (contiguas). Guardar: la fila muestra `08:00–10:00 · 10:00–12:00`.
6. Tocar la fila, apagar **Solo en un horario** y guardar: la fila no muestra ningún horario.
7. Crear `Remedio` con **Intervalo** cada `8` **horas** y una sola ventana `08:00` a `20:00`: se guarda y muestra `08:00–20:00`.
8. Recargar: **Alimentar a los perros** sin horario, **Remedio** con `08:00–20:00`.

## Flujo 12: errores de varios horarios

Precondición: lista vacía, reloj en `2026-07-15T06:00:00`. Crear `Regar` con **No se repite** y horario `08:00` a `11:00`, y `Remedio` con **Intervalo** cada `8` **horas** y horario `08:00` a `11:00`.

1. Tocar **+**, escribir `Perros`, elegir **No se repite**, encender **Solo en un horario**, escribir `08:00` a `11:00`, tocar **Agregar horario** y escribir `10:00` a `12:00`. Tocar **Guardar**: se ve "Los horarios no se pueden superponer" y el panel sigue abierto.
2. Cambiar la segunda fila a `08:00` a `11:00` (igual a la primera) y tocar **Guardar**: el mismo error.
3. Cambiar la segunda fila a `09:00` a `10:00` (dentro de la primera) y tocar **Guardar**: el mismo error.
4. Vaciar **Hasta** de la segunda fila y tocar **Guardar**: se ve "Completá las dos horas".
5. Escribir **Hasta** `08:00` en la segunda fila (desde `09:00`) y tocar **Guardar**: se ve "La hora de fin tiene que ser posterior a la de inicio".
6. Cambiar la segunda fila a `18:00` a `21:00` y elegir **Intervalo** cada `8` **horas**. Tocar **Guardar**: se ve "Con varios horarios, el intervalo tiene que ser en días".
7. Cambiar la unidad a **días** (cada `1`) y tocar **Guardar**: el panel se cierra y **Perros** muestra `08:00–11:00 · 18:00–21:00`.
8. Tocar la fila **Regar**, cambiar el título a `Regar plantas`, tocar **Agregar horario** y escribir `10:59` a `12:00`. Tocar **Guardar**: se ve "Los horarios no se pueden superponer". Cerrar sin guardar (y **Descartar** en el aviso): la fila sigue siendo **Regar** con `08:00–11:00`.
9. Tocar la fila **Remedio** (cada 8 horas), tocar **Agregar horario**, escribir `18:00` a `21:00` y tocar **Guardar**: se ve "Con varios horarios, el intervalo tiene que ser en días". Cerrar sin guardar (y **Descartar** en el aviso): **Remedio** sigue con `08:00–11:00`.
10. Tocar la fila **Perros**, cambiar **Se repite** a **Intervalo** cada `8` **horas** y tocar **Guardar**: se ve el mismo error. Cerrar sin guardar (y **Descartar** en el aviso): **Perros** sigue cada 1 día con las dos ventanas.

## Flujo 13: calendario con dos ventanas

Precondición: lista vacía, reloj detenido en `2026-07-15T06:00:00` (miércoles). Mostrar completadas apagado.

1. Crear `Perros` con **Días de la semana** `miércoles` y `jueves` y horarios `07:00` a `10:00` y `18:00` a `21:00`. Está `en espera` sin completados: se ve, en negrita, checkbox sin marcar y **deshabilitado**.
2. A las `06:30`: la barra marca `50`.
3. A las `08:00`: `pendiente`, checkbox habilitado. Tocarlo: aparece `Completaste «Perros»` y la fila desaparece (completada).
4. A las `13:00`: la lista sigue vacía. Tocar **Mostrar completadas**: **Perros** se ve completada, `en espera`, con la barra en `50` (vuelve a las 18:00) y el checkbox **habilitado** (borraría el completado de hoy). Apagar **Mostrar completadas**.
5. A las `18:00`: **Perros** aparece `pendiente`, **no** completada (título en negrita, checkbox sin marcar), checkbox habilitado. Tocarlo: aparece el aviso y la fila desaparece.
6. Tocar **Mostrar completadas**. A las `2026-07-16T05:00:00`: **Perros** completada, `en espera`, con el checkbox **deshabilitado** (lo completaría de nuevo y está fuera de las ventanas). Apagar **Mostrar completadas**.
7. A las `2026-07-16T07:00:00`: `pendiente`. No completarla. A las `2026-07-16T10:00:00`: `atrasada` (indicador "Atrasada"), checkbox **deshabilitado**. A las `2026-07-16T12:00:00`: sigue igual.
8. A las `2026-07-16T18:00:00`: sigue `atrasada`, checkbox **habilitado**. Tocarlo: la fila desaparece (cubre la tarde; la mañana se descarta).
9. En el **Historial**: tres completados de **Perros** (miércoles 08:00, miércoles 18:00 y jueves 18:00).
10. A las `2026-07-16T22:00:00`: la lista está vacía (la próxima es el miércoles siguiente a las 07:00). Tocar **Mostrar completadas**: **Perros** completada, `en espera`, con el checkbox **habilitado** (borraría el completado de hoy).

## Flujo 14: puntual con dos ventanas

Precondición: lista vacía, reloj detenido en `2026-07-15T06:00:00` (miércoles).

1. Crear `Comprar pan` con **No se repite**, sin fecha límite, horarios `07:00` a `10:00` y `18:00` a `21:00`; y `Pagar la luz` con **No se repite**, Fecha límite `2026-07-15`, los mismos horarios.
   - Las dos `en espera`, checkbox deshabilitado.
2. A las `07:00`: las dos `pendiente`, checkbox habilitado.
3. A las `10:00`: las dos `en espera` (ninguna atrasada: **Pagar la luz** se atrasa recién al cierre de la última ventana de su día límite), checkbox deshabilitado. A las `14:00`: barra en `50` en las dos.
4. A las `18:00`: las dos `pendiente`. Tocar el checkbox de **Comprar pan**: aparece el aviso y la fila desaparece.
5. A las `21:00`: **Pagar la luz** `atrasada` (cerró la última ventana de su día límite), checkbox deshabilitado.
6. A las `2026-07-16T08:00:00`: **Comprar pan** sigue sin estar en la lista (se completa una sola vez); **Pagar la luz** sigue `atrasada`, con el checkbox habilitado.

## Flujo 15: relativa cada 2 días con dos ventanas

Precondición: lista vacía, reloj detenido en `2026-07-13T06:00:00` (lunes). Tocar **Mostrar completadas** (queda marcado).

1. Crear `Perros` con **Intervalo** cada `2` **días** y horarios `07:00` a `10:00` y `18:00` a `21:00`. Está `en espera` (nunca completada), checkbox deshabilitado.
2. A las `08:00`: `pendiente`. Tocar el checkbox: completada, `en espera`.
3. A las `13:00`: barra en `50` (vuelve a las 18:00 del mismo lunes, no el miércoles). Checkbox habilitado (borraría el de hoy).
4. A las `18:00`: `pendiente`, no completada (checkbox sin marcar). Tocarlo: completada, `en espera`.
5. A las `2026-07-14T12:30:00` (martes): barra en `50` (vuelve el miércoles a las 07:00). A las `2026-07-14T19:00:00`: sigue `en espera` (el martes no le toca), con el checkbox **habilitado** (dentro de una ventana, la completaría de nuevo). No tocarlo.
6. A las `2026-07-15T07:00:00`: `pendiente`. No completarla. A las `2026-07-15T10:00:00`: `atrasada`, checkbox deshabilitado.
7. A las `2026-07-16T08:00:00` (jueves): sigue `atrasada`, checkbox habilitado. Tocarlo: completada, `en espera` (la secuencia sigue desde la mañana del jueves).
8. A las `2026-07-16T13:00:00`: barra en `50`. A las `2026-07-16T18:00:00`: `pendiente`.
