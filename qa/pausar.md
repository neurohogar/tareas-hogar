# QA: pausar y reanudar tareas periódicas

Verifica, solo por la interfaz:

- el botón **Pausar** / **Reanudar** del panel: aparece solo al editar una periódica, actúa en el momento (guarda y cierra el panel sin **Guardar**) y, con la tarea pausada, el panel dice "Pausada";
- que una pausada no se ve en Pendientes con **Mostrar pausadas** apagado, y que no se atrasa mientras está pausada;
- el check **Mostrar pausadas**: las pausadas van al final (después de las completadas), por título, atenuadas, con "Pausada" en lugar del indicador de estado y el checkbox deshabilitado; el filtro por etiqueta; el valor se guarda en el dispositivo y no se sincroniza;
- reanudar: la relativa queda `pendiente`; la de calendario queda `pendiente` si hoy toca y, si no, `en espera` hasta la próxima ocurrencia; con horario, una ventana que ya cerró al reanudar no la deja `atrasada`;
- que los completados de antes de la pausa siguen en el Historial y en "Última vez", pero no cuentan para el estado después de reanudar;
- pasar una periódica pausada a puntual la reanuda;
- la pausa con dos dispositivos.

Cubre spec §4.1 (`pausada`, `reanudadaEn`), §5.8, §6.1 (Mostrar pausadas), §6.2 (Pausar / Reanudar, Última vez) y §7 (conflictos).

Fuera de alcance: el orden por urgencia de las no pausadas (`qa/orden-pendientes.md`), los estados sin pausa (`qa/periodica-relativa.md`, `qa/periodica-calendario.md`, `qa/horario.md`) y el formato de "Última vez" (`qa/ultima-vez.md`).

## Entorno

- Firebase Emulator Suite (Auth + Firestore) con datos limpios al inicio de cada flujo.
- Cada flujo parte de un contexto de navegador nuevo (sin datos guardados en el dispositivo), con sesión iniciada con la cuenta `qa@example.com` del Auth Emulator (Flujo 1 de `qa/periodica-relativa.md`).
- Reloj simulado del navegador (`page.clock`) instalado **antes** de abrir la app, en la hora local que indica cada flujo (zona `America/Argentina/Buenos_Aires`).
  - "A las X" significa adelantar el reloj simulado hasta X antes del paso.
  - "Avanzar el reloj a X" significa adelantarlo hasta X y esperar a que la pantalla se actualice sola (sin recargar).
  - Con "reloj detenido" (`page.clock.pauseAt`), el reloj se adelanta con `page.clock.runFor` o `fastForward` hasta la hora exacta, para que el tiempo no corra mientras QA actúa.
- Crear una tarea: tocar **+**, escribir el título, elegir la opción de **Se repite** que indica el paso, con los controles de `qa/puntual.md`, `qa/periodica-relativa.md` y `qa/periodica-calendario.md`; si el paso da un horario, cargarlo como en `qa/horario.md`; si da etiquetas, como en `qa/etiquetas.md`; guardar.
- **Mostrar completadas** y **Mostrar pausadas** quedan apagados salvo que el flujo diga encenderlos.
- **Dos dispositivos** (Flujo 7): dos contextos de navegador independientes, A y B, con la misma cuenta y el mismo reloj simulado. "B sin conexión" significa `browserContext.setOffline(true)` en B; "B vuelve a tener conexión", volverlo online y esperar a que las dos pantallas se actualicen solas.

Semana de referencia: lunes 2026-07-13, martes 14, miércoles 15, jueves 16, viernes 17, sábado 18, domingo 19.

## Contrato observable

- **Botón de pausa del panel**: en el panel **Editar tarea** de una periódica, un botón con nombre accesible **Pausar** o, si la tarea está pausada, **Reanudar**; con **Reanudar**, el panel muestra el texto "Pausada". Tocarlo cierra el panel y el cambio queda guardado: al volver a abrir la tarea, o al recargar, se mantiene. El panel **Nueva tarea** y el de una puntual no tienen ninguno de los dos botones.
- **Check Mostrar pausadas**: un control con rol `checkbox` y nombre accesible "Mostrar pausadas", junto a "Mostrar completadas". Marcado = encendido.
- **Fila pausada** (solo con el check encendido): el checkbox de la fila deshabilitado (`disabled` o `aria-disabled="true"`, y tocarlo no cambia nada: no hay aviso ni entrada nueva en el Historial); la fila atenuada (opacidad efectiva menor que 1 y menor que la de una fila `pendiente`); el texto "Pausada" dentro de la fila; sin el indicador "Atrasada" y sin barra de progreso.
- **Fila**: para las no pausadas, el contrato de `qa/periodica-relativa.md` (checkbox, título, estilo atenuado, barra de progreso con `aria-valuenow`, indicador "Atrasada") y el de `qa/mostrar-completadas.md`.
- **Lista**: "La lista es A, B, C" significa exactamente esas filas, de arriba hacia abajo.
- **Última vez** e **Historial**: los de `qa/ultima-vez.md` y `qa/historial-deshacer.md`.

## Flujo 1: pausar y reanudar una relativa

Precondición: lista vacía, reloj en `2026-07-14T09:00:00` (martes).

1. Crear `Cambiar foco` con **No se repite** y sin fecha límite. Tocar **+**: el panel **Nueva tarea** no tiene **Pausar**. Crear `Regar` con **Intervalo** cada `2` **días**.
2. Tocar el checkbox de **Regar**: queda `en espera`, completada, y su fila desaparece. La lista es **Cambiar foco**.
3. Tocar la fila **Cambiar foco**: el panel no tiene **Pausar** ni **Reanudar**. Cerrarlo.
4. Encender **Mostrar completadas**. Tocar la fila **Regar**: el panel tiene **Pausar** y dice `Última vez: hoy 09:00`. Tocar **Pausar**, sin tocar **Guardar**: el panel se cierra. La lista es **Cambiar foco**: **Regar** ya no se ve, ni siquiera con las completadas.
5. Tocar el check **Mostrar pausadas**: la lista es **Cambiar foco**, **Regar**. **Regar** se ve pausada: atenuada, con "Pausada", sin barra y con el checkbox deshabilitado. Tocar su checkbox: no pasa nada (no hay aviso; el Historial sigue con una sola entrada).
6. Tocar la fila **Regar**: el panel dice "Pausada", tiene **Reanudar** y no tiene **Pausar**, y sigue diciendo `Última vez: hoy 09:00`. Cerrar el panel.
7. Avanzar el reloj a `2026-07-20T10:00:00` (lunes; sin pausa, **Regar** estaría atrasada desde el 18): **Regar** sigue pausada, sin "Atrasada".
8. Recargar: **Mostrar pausadas** y **Mostrar completadas** siguen marcados; **Regar** sigue pausada.
9. Tocar la fila **Regar** y tocar **Reanudar**: el panel se cierra. **Regar** está `pendiente` (en negrita, checkbox habilitado y sin marcar, sin "Atrasada" ni "Pausada") y la lista es **Regar**, **Cambiar foco**.
10. Tocar la fila **Regar**: el panel tiene **Pausar** y dice `Última vez: hace 6 días`. Cerrar el panel. El Historial tiene la entrada **Regar** `09:00` del martes 14 de julio.
11. Avanzar el reloj a `2026-07-25T10:00:00`: **Regar** sigue `pendiente`, sin "Atrasada" (nunca completada desde que se reanudó).
12. A las `2026-07-25T10:05:00`, tocar el checkbox de **Regar**: aparece el aviso `Completaste «Regar»` y queda `en espera`, completada, con la barra en 0.

## Flujo 2: reanudar una de calendario

Precondición: lista vacía, reloj detenido en `2026-07-07T09:00:00` (martes). **Mostrar completadas** encendido hasta pausar las dos (para poder abrirlas).

1. A las `09:00:00`, crear `Sacar la basura` con **Días de la semana** `martes` y `jueves`; a las `09:01:00`, crear `Cambiar sábanas` con **Días de la semana** `jueves`. Tocar el checkbox de las dos: quedan `en espera`.
2. Pausar las dos (fila, **Pausar**). Encender **Mostrar pausadas**: la lista es **Cambiar sábanas**, **Sacar la basura**, las dos pausadas.
3. Avanzar el reloj a `2026-07-15T12:00:00` (miércoles). Reanudar **Sacar la basura**: queda `en espera` (no "Atrasada"), atenuada, con la barra en 0 y el checkbox sin marcar (no está completada).
4. Avanzar el reloj a `2026-07-15T18:00:00`: la barra de **Sacar la basura** está en 50 (`aria-valuenow`).
5. Avanzar el reloj a `2026-07-16T10:00:00` (jueves): **Sacar la basura** está `pendiente`. Reanudar **Cambiar sábanas** (hoy le toca): queda `pendiente`. La lista es **Sacar la basura**, **Cambiar sábanas**, sin pausadas: las dos están pendientes desde las 00:00 de hoy y desempata el `creadaEn` real, no la reanudación ni el título.
6. Tocar el checkbox de **Sacar la basura**: queda `en espera`, completada, hasta el martes 21.
7. Avanzar el reloj a `2026-07-17T00:00:00` (viernes): **Cambiar sábanas** está `atrasada` (perdió el jueves después de reanudarla); **Sacar la basura** sigue `en espera`.

## Flujo 3: completar después de reanudar cubre la próxima ocurrencia

Precondición: lista vacía, reloj detenido en `2026-07-07T09:00:00` (martes). **Mostrar completadas** encendido.

1. Crear `Sacar la basura` con **Días de la semana** `martes` y `jueves`. Completarla y pausarla.
2. A las `2026-07-15T10:00:00` (miércoles), reanudarla: `en espera`, no completada.
3. A las `2026-07-15T11:00:00`, tocar su checkbox: aparece el aviso y queda `en espera`, completada.
4. Avanzar el reloj a `2026-07-16T10:00:00` (jueves): sigue `en espera`, completada (el completado cubrió el jueves, no el martes perdido durante la pausa).
5. Avanzar el reloj a `2026-07-21T00:00:00` (martes): está `pendiente`.

## Flujo 4: reanudar con horario

Precondición: lista vacía, reloj detenido en `2026-07-10T09:00:00` (viernes). **Mostrar completadas** y **Mostrar pausadas** encendidos (para abrir la tarea completada y la pausada).

1. Crear `Ventilar` con **Días de la semana** `miércoles` y `viernes` y horario `08:00` a `11:00`. A las `09:00`, completarla. Pausarla.
2. A las `2026-07-15T12:00:00` (miércoles, ya cerró la ventana de hoy), reanudarla: queda `en espera`, no "Atrasada", con la barra en 0 y el checkbox deshabilitado (fuera de la ventana).
3. Avanzar el reloj a `2026-07-15T23:00:00`: sigue `en espera`, barra en 25.
4. Avanzar el reloj a `2026-07-17T08:00:00` (viernes): `pendiente`, checkbox habilitado.
5. Avanzar el reloj a `2026-07-17T11:00:00`: `atrasada` (con el checkbox deshabilitado: la ventana ya cerró).
6. Pausarla. A las `2026-07-22T09:00:00` (miércoles, dentro de la ventana), reanudarla: `pendiente`, checkbox habilitado. Avanzar el reloj a `2026-07-22T11:00:00` sin completarla: `atrasada` (la ventana estaba abierta al reanudar).

## Flujo 5: Mostrar pausadas, orden y filtro

Precondición: lista vacía, reloj en `2026-07-15T08:00:00` (miércoles).

1. Crear, en este orden: `Ñandú` con **Intervalo** cada `1` **días** y la etiqueta `Patio`; `Nube` con **Intervalo** cada `1` **días** y la etiqueta `Casa`; `Árbol` con **Días de la semana** `lunes` y la etiqueta `Patio`; `Pagar la luz` con **No se repite**, sin fecha límite y la etiqueta `Casa`; `Cambiar foco` con **No se repite** y sin fecha límite.
2. Completar **Pagar la luz**. Pausar **Ñandú**, **Nube** y **Árbol**. La lista es **Cambiar foco**.
3. Encender **Mostrar pausadas**: la lista es **Cambiar foco**, **Árbol**, **Nube**, **Ñandú** (las pausadas al final, por título: la Á con la A, la ñ después de la n; no por cuándo se crearon).
4. Encender **Mostrar completadas**: la lista es **Cambiar foco**, **Pagar la luz**, **Árbol**, **Nube**, **Ñandú**: las pausadas después de la completada. **Pagar la luz** se ve completada (tachada, checkbox marcado); las tres pausadas, con "Pausada" y el checkbox deshabilitado.
5. Tocar **Casa** en el filtro: la lista es **Pagar la luz**, **Nube**. Tocar **Patio**: la lista es **Árbol**, **Ñandú**. Tocar **Todas**.
6. Apagar **Mostrar completadas**: la lista es **Cambiar foco**, **Árbol**, **Nube**, **Ñandú**.
7. Recargar: **Mostrar pausadas** sigue marcado y la lista es la misma. Cerrar la pestaña y abrir la app de nuevo en el mismo contexto: el check sigue marcado.
8. Apagar **Mostrar pausadas**: la lista es **Cambiar foco**. Recargar: sigue sin marcar.

## Flujo 6: pasar una periódica pausada a puntual

Precondición: lista vacía, reloj en `2026-07-10T09:00:00` (viernes). **Mostrar completadas** encendido.

1. Crear `Regar` con **Intervalo** cada `2` **días** y completarla. Pausarla: la lista está vacía.
2. A las `2026-07-15T10:00:00`, encender **Mostrar pausadas**, tocar la fila **Regar**, cambiar **Se repite** a **No se repite** (sin fecha límite) y guardar.
   - **Regar** se ve completada (tachada, checkbox marcado), sin "Pausada": tiene el completado del 10.
   - Tocar su fila: el panel no tiene **Pausar** ni **Reanudar**.
3. Cambiarla a **Intervalo** cada `2` **días** y guardar: **Regar** está `pendiente` (no "Atrasada"; el completado del 10 es de antes de la reanudación), y el panel tiene **Pausar**.

## Flujo 7: dos dispositivos

Precondición: lista vacía, reloj en `2026-07-14T08:00:00` (martes) en A y en B. En A y en B, encender **Mostrar pausadas**.

1. En A, crear `Regar` con **Intervalo** cada `2` **días**. B la ve.
2. B sin conexión. En A, pausar **Regar**. En B, a las `2026-07-14T09:00:00`, completar **Regar** (B no vio la pausa).
3. B vuelve a tener conexión. En A y en B, **Regar** está pausada (con "Pausada" y el checkbox deshabilitado); el Historial de los dos tiene la entrada **Regar** `09:00`.
4. B sin conexión. En A, a las `2026-07-15T10:00:00`, reanudar **Regar**: en A está `pendiente` (no cuenta el completado de B, que es de antes de reanudar). En B, que no vio la reanudación, cambiar el título a `Regar plantas` y guardar.
5. B vuelve a tener conexión. En A y en B, la tarea se llama **Regar plantas**, está `pendiente` y no pausada.
6. En A, apagar **Mostrar pausadas**: en B sigue marcado, también después de recargar B.
7. B sin conexión. En A, pausar **Regar plantas**. En B, cambiar el título a `Regar` y guardar. B vuelve a tener conexión: en A y en B la tarea se llama **Regar** y está pausada (A no la muestra; B sí, con "Pausada").
