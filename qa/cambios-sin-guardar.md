# QA: cambios sin guardar y botón Atrás

Verifica, solo por la interfaz, que cerrar el panel o usar una acción con cambios sin guardar pide confirmación en lugar de perderlos, y que el botón Atrás cierra el panel en lugar de salir de la pantalla:

- qué cuenta como "hay cambios" y qué no (al editar y al crear);
- el aviso de cierre (**Seguir editando**, **Descartar**, **Guardar**) al tocar la **X** o **Atrás**;
- el aviso de acción para **Pausar**, **Reanudar**, **Posponer** y **Quitar posponer**, con la hora del toque, la acción sin sentido y el guardado que falla;
- que **Borrar tarea** conserva solo su confirmación;
- los avisos sobre el panel, y que vuelven a la misma pestaña;
- el botón Atrás: qué cierra cada capa, el teclado en pantalla, el aviso de deshacer, el panel cerrado y las dos pantallas de origen del panel;
- la confirmación del navegador al recargar o cerrar la app;
- los otros dispositivos: un cambio remoto no hace aparecer el aviso, un borrado remoto cierra todo, y el aviso de acción se mantiene al día;
- que **Descartar** no quita un emoji de **Recientes**.

Cubre spec §6.2 (Cambios sin guardar, Atrás) y §7 (gana el borrado).

Fuera de alcance: la orientación vertical y las reglas de cada campo y acción (`qa/panel-mobile.md` y los demás).

## Entorno

El de `qa/panel-mobile.md` (Firebase Emulator Suite, sesión `qa@example.com`, reloj simulado detenido en `America/Argentina/Buenos_Aires`, **Celular** de 360x640 px con emulación táctil, **Ancho** de 1024x768 px, **Teclado en pantalla abierto** emulado reduciendo el alto del viewport visual, dos dispositivos A y B con la misma cuenta y el mismo reloj, **Mostrar completadas** y **Mostrar pausadas** apagados).

- **Atrás**: `page.goBack()`, que es lo que hace el botón Atrás de Android. "Adelante" es `page.goForward()`.
- **Confirmación del navegador**: el diálogo `beforeunload` de Playwright (`page.on("dialog")`, tipo `beforeunload`); se dispara al recargar con `page.reload()` o cerrar la página con `page.close({ runBeforeUnload: true })`, después de haber tocado la página. "Aceptarla" es continuar (recargar o cerrar); "cancelarla" es quedarse.

## Contrato observable

- **Aviso**: un diálogo (`alertdialog`) con nombre accesible **Tenés cambios sin guardar**, sobre el panel. Tiene tres botones, en este orden. En el aviso de cierre: **Seguir editando**, **Descartar**, **Guardar**. En el de una acción: **Seguir editando**, **Descartar y <acción>**, **Guardar y <acción>**, con `<acción>` en minúsculas: pausar, reanudar, posponer 1 hora, posponer 3 horas, posponer hasta mañana o quitar posponer.
- **Aviso de acción sin sentido**: el mismo diálogo con el texto "Con estos cambios la tarea ya no se puede <acción>" y solo **Seguir editando** y **Descartar y <acción>**.
- **Sobre el panel**: mientras hay un aviso abierto no se puede tocar nada de lo que está debajo (el panel, las pestañas, la lista). Al cerrarlo, el panel está en la misma pestaña, con lo mismo escrito.
- **Confirmación de Borrar tarea**: la de `qa/editar-borrar.md` (`alertdialog`, botones **Borrar** y **Cancelar**).
- **Selector de emoji** y **aviso de deshacer**: los de `qa/emoji-y-nota.md` y `qa/historial-deshacer.md`.
- **Panel cerrado** es que no hay ningún diálogo **Nueva tarea** ni **Editar tarea**.
- Panel de referencia al editar: `Regar` con **Intervalo** cada `2` **días**, nota `Las del balcón`, sin etiquetas ni horario, creada a las `2026-07-13T08:00:00` (a las 08:00 del 15 está pendiente).

## Flujo 1: cerrar con cambios al editar

Precondición: lista vacía, reloj en `2026-07-15T08:00:00`, celular. Crear `Regar` como en el panel de referencia.

1. Abrir `Regar` y tocar **Cerrar** (la **X**) sin tocar nada: el panel se cierra, sin aviso.
2. Abrir `Regar`, cambiar el título a `Regar plantas` y tocar **Cerrar**: se abre el aviso **Tenés cambios sin guardar** con **Seguir editando**, **Descartar** y **Guardar**. El panel sigue detrás.
3. Tocar **Seguir editando**: el aviso se cierra y el panel sigue abierto con el título `Regar plantas`, en la misma pestaña. La lista todavía dice `Regar`.
4. Con la pestaña **Cuándo** abierta, tocar **Cerrar** y luego **Seguir editando**: el panel sigue en **Cuándo**.
5. Tocar **Cerrar** y **Descartar**: el panel se cierra y la lista dice `Regar`. Abrir `Regar`: el título es `Regar`.
6. Cambiar el título a `Regar plantas`, tocar **Cerrar** y **Guardar**: el panel se cierra y la lista dice `Regar plantas`. Recargar: sigue `Regar plantas`.
7. Abrir `Regar plantas`, vaciar el título, tocar **Cerrar** (se abre el aviso) y **Guardar**: el aviso se cierra, el panel sigue abierto con el título vacío, salta a la pestaña **Tarea** y se ve el error de Título; la lista sigue diciendo `Regar plantas`. Tocar **Cerrar** y **Descartar**.
8. Abrir `Regar plantas`, escribir en **Etiquetas** un nombre de 31 caracteres sin confirmar, tocar **Cerrar** y **Guardar**: el panel sigue abierto con el error de Etiquetas visible y la lista no cambia. Tocar **Cerrar** y **Descartar**.
9. En ancho (1024 px) repetir los pasos 2, 3 y 5: el comportamiento es el mismo.

## Flujo 2: qué cuenta como cambio

Precondición: lista vacía, reloj en `2026-07-15T08:00:00`, celular. Crear `Regar` como en el panel de referencia, con horario `08:00` a `10:00` y una segunda ventana `12:00` a `14:00`. Cada paso parte de `Regar` recién abierto; "cierra directo" es que **Cerrar** cierra el panel sin aviso, y "pide confirmación" es que abre el aviso (entonces tocar **Descartar**).

1. Escribir `Z` en el título y borrarlo (vuelve a `Regar`): cierra directo.
2. Escribir espacios al final del título: cierra directo. Lo mismo con espacios al inicio y al final de la nota `Las del balcón`.
3. Cambiar el título a `Regar plantas`: pide confirmación.
4. Vaciar la nota: pide confirmación. Escribir solo espacios en la nota: pide confirmación (queda sin nota).
5. Vaciar el título: pide confirmación (aunque no se pueda guardar).
6. En **Etiquetas**, escribir solo espacios sin confirmar: cierra directo.
7. En **Etiquetas**, escribir `ca` sin confirmar (con o sin espacios alrededor): pide confirmación. Tocar **Guardar** desde el aviso no crea la etiqueta `ca`: en **Etiquetas** (pantalla) no aparece.
8. En **Etiquetas**, agregar la etiqueta existente `casa` y quitarla: cierra directo. Agregarla y no quitarla: pide confirmación.
9. En **Cuándo**, cambiar **Se repite** a **Días de la semana** y volver a **Intervalo** con **Cada** `2` **días**: cierra directo. Dejarlo en **Días de la semana**: pide confirmación.
10. Cambiar el esfuerzo a **Media (≈ 15 min)**: pide confirmación; volver a **Sin estimar**: cierra directo.
11. En **Cuándo**, intercambiar los valores de las dos ventanas (la primera pasa a `12:00`-`14:00` y la segunda a `08:00`-`10:00`): cierra directo. Cambiar `14:00` a `15:00` en una: pide confirmación.
12. En **Cuándo**, tocar **Agregar horario** (queda una fila vacía): pide confirmación.
13. Elegir un emoji en el botón de emoji: pide confirmación; tocar **Quitar emoji** y volver a no tener emoji: cierra directo.
14. Crear `Pagar` con **No se repite**. Con el reloj en `2026-07-15T08:00:00`, otro dispositivo (B) cambia el título de `Pagar` a `Pagar luz` mientras A tiene su panel abierto sin tocar nada: en A, **Cerrar** cierra directo (un cambio remoto no hace aparecer el aviso).

## Flujo 3: crear con cambios sin guardar

Precondición: lista vacía, celular.

1. Tocar **+**: en **Cuándo**, **Se repite** viene con **No se repite** elegida. **Cerrar** sin tocar nada: cierra directo (esa opción inicial no cuenta como cambio).
2. Tocar **+**, escribir solo espacios en el título y **Cerrar**: cierra directo.
3. Tocar **+**, escribir `Pagar` en el título y **Cerrar**: se abre el aviso con **Seguir editando**, **Descartar** y **Guardar**. **Seguir editando**: el panel sigue con `Pagar`. **Cerrar** y **Descartar**: la lista sigue vacía.
4. Tocar **+**, elegir **Intervalo** en **Se repite** (sin escribir nada más) y **Cerrar**: pide confirmación. **Descartar**. Tocar **+**, elegir **Intervalo** y volver a **No se repite**, y **Cerrar**: cierra directo.
5. Tocar **+**, elegir el esfuerzo **Media (≈ 15 min)** y **Cerrar**: pide confirmación. **Descartar**.
6. Tocar **+**, escribir `Pagar` y borrarlo, y **Cerrar**: cierra directo.
7. Tocar **+**, escribir `Pagar` y **Cerrar**, y **Guardar**: se crea `Pagar` y el panel se cierra.

## Flujo 4: acciones con cambios

Precondición: lista vacía, reloj en `2026-07-15T08:00:00`, celular. Crear `Regar` como en el panel de referencia.

1. Abrir `Regar` y tocar **Pausar** en **Acciones** sin cambios: el panel se cierra y `Regar` queda pausada (con **Mostrar pausadas** apagado sale de la lista). Con **Mostrar pausadas** encendido, abrirla y tocar **Reanudar**: actúa en el momento y la tarea deja de estar pausada.
2. Abrir `Regar`, cambiar el título a `Regar plantas` y tocar **Pausar**: se abre el aviso con **Seguir editando**, **Descartar y pausar** y **Guardar y pausar**. El panel sigue en **Acciones**.
3. Tocar **Seguir editando**: el aviso se cierra, el panel sigue en **Acciones** con el título `Regar plantas` escrito, y la tarea no está pausada.
4. Tocar **Pausar** y **Descartar y pausar**: el panel se cierra, `Regar` está pausada y el título es `Regar` (con **Mostrar pausadas** encendido). Reanudarla desde el panel.
5. Cambiar el título a `Regar plantas`, tocar **Pausar** y **Guardar y pausar**: el panel se cierra, la tarea está pausada y se llama `Regar plantas`.
6. Con la tarea pausada, abrirla, cambiar la nota y tocar **Reanudar**: el aviso tiene **Seguir editando**, **Descartar y reanudar** y **Guardar y reanudar**. **Guardar y reanudar**: la tarea se reanuda y se guarda la nota.
7. Abrir `Regar plantas`, cambiar la nota y tocar **1 hora** en **Acciones**: el aviso ofrece **Descartar y posponer 1 hora** y **Guardar y posponer 1 hora**. Repetir con **3 horas** y **Hasta mañana**: los botones nombran la opción tocada. **Seguir editando**.
8. Ahora (hora de elegir) `2026-07-15T08:00:00`: tocar **1 hora**, dejar el aviso abierto, avanzar el reloj a `2026-07-15T08:03:00` y tocar **Guardar y posponer 1 hora**. Abrir la tarea: dice "Pospuesta hasta 09:03". Con **Descartar y posponer 3 horas** a las `08:03` (otra tarea): "Pospuesta hasta 11:03".
9. Con la tarea pospuesta, abrirla, cambiar la nota y tocar **Quitar posponer**: el aviso ofrece **Descartar y quitar posponer** y **Guardar y quitar posponer**.
10. En `Regar` (periódica, sin pausar) cambiar **Se repite** a **No se repite** y tocar **Pausar**: el aviso dice "Con estos cambios la tarea ya no se puede pausar" y tiene solo **Seguir editando** y **Descartar y pausar** (no **Guardar y pausar**). **Descartar y pausar**: la tarea se pausa como periódica.
11. Con `Regar` pausada, abrirla, cambiar **Se repite** a **No se repite** y tocar **Reanudar**: el aviso dice "Con estos cambios la tarea ya no se puede reanudar" y no ofrece **Guardar y reanudar**.
12. En `Regar`, vaciar el título y tocar **Pausar**: como lo escrito es inválido, el aviso ofrece **Guardar y pausar**. Tocarlo: no se pausa, el aviso se cierra, el panel sigue abierto con el título vacío y salta a **Tarea** con el error de Título.
13. Abrir `Regar`, cambiar la nota y tocar **Borrar tarea**: aparece solo la confirmación de borrado (no el aviso **Tenés cambios sin guardar**). **Cancelar**: el panel sigue abierto con la nota escrita, en **Acciones**.

## Flujo 5: los avisos sobre el panel

Precondición: lista con `Regar` como en el panel de referencia, reloj en `2026-07-15T08:00:00`, celular.

1. Abrir `Regar`, ir a **Cuándo**, cambiar **Cada** a `3`, tocar **Cerrar**: el aviso está sobre el panel; con el aviso abierto, tocar **Tarea** en la barra de pestañas no hace nada (el aviso bloquea lo de abajo).
2. **Seguir editando**: el panel está en **Cuándo** con `3` en **Cada**.
3. Tocar **Acciones** y **Pausar**: aviso de acción; **Seguir editando**: el panel sigue en **Acciones**; ir a **Cuándo**: **Cada** sigue en `3`.
4. En ancho (1024 px), repetir 1 y 2: el aviso cubre el panel completo, sin tapar el encabezado fijo del panel; **Seguir editando** vuelve al mismo estado.
5. Con el navegador sin conexión (`setOffline(true)`), tocar **Cerrar**: el aviso se abre y la franja "Sin conexión" sigue a la vista. Volver a tener conexión.

## Flujo 6: botón Atrás

Precondición: lista vacía, celular. Crear `Regar` (panel de referencia) y completarla a las `2026-07-15T08:00:00` para que tenga Historial (reloj en `2026-07-15T10:00:00`).

1. En **Pendientes**, abrir `Regar` y tocar Atrás (`page.goBack()`): el panel se cierra y la pantalla sigue en **Pendientes** (no sale de la pantalla).
2. Ir al **Historial**, tocar el título de la entrada `Regar`: se abre el panel **Editar tarea**. Tocar Atrás: el panel se cierra y la pantalla sigue en el **Historial**.
3. Abrir `Regar`, cambiar el título a `Regar plantas` y tocar Atrás: se abre el aviso de cierre y el panel sigue detrás. Tocar Atrás de nuevo: el aviso se cierra (equivale a **Seguir editando**) y el panel sigue con `Regar plantas`. Tocar Atrás otra vez: se abre el aviso de cierre. **Descartar**.
4. Abrir `Regar`, tocar **Borrar tarea** y luego Atrás: la confirmación se cierra (equivale a **Cancelar**) y el panel sigue abierto, en **Acciones**. Tocar Atrás: el panel se cierra (no hay cambios).
5. Abrir `Regar` en la pestaña **Tarea**, tocar el botón de emoji y luego Atrás: el selector se cierra sin elegir emoji y el panel sigue. Tocar Atrás de nuevo: el panel se cierra.
6. Abrir `Regar`, cambiar el título, tocar **Pausar** (aviso de acción) y Atrás: el aviso se cierra sin actuar y el panel sigue con el título escrito; la tarea no está pausada. Tocar Atrás: se abre el aviso de cierre. **Seguir editando**.
7. Abrir `Regar`, escribir `ca` en **Etiquetas** (se ven las sugerencias) y tocar Atrás: las sugerencias no cuentan como algo abierto, así que se abre el aviso de cierre (hay texto sin confirmar). **Descartar**.
8. Con el aviso de deshacer a la vista (completar `Regar` desde la lista, a las `2026-07-15T10:00:00`), abrir otra tarea sin cambios y tocar Atrás: el panel se cierra y el aviso de deshacer sigue a la vista sus 5 segundos (Atrás no lo toca).
9. Abrir `Regar` (sin cambios), tocar el título (teclado en pantalla abierto, viewport achicado) y tocar Atrás: el primer Atrás solo cierra el teclado (viewport al alto original) y el panel sigue exactamente igual; el segundo Atrás cierra el panel. Repetir con el título cambiado: el primer Atrás solo cierra el teclado y el segundo abre el aviso de cierre.
10. Con el panel cerrado: abrir `Regar` y tocar **Cerrar**; tocar Atrás: sale de la pantalla (igual que antes de esta feature), sin un Atrás de más que no haga nada. Hacer lo mismo cerrando con **Guardar** y con una acción (**1 hora**). Después de cerrar el panel, tocar Adelante (`page.goForward()`): no reabre el panel.
11. En ancho (1024 px), repetir 1, 3 y 4: Atrás hace lo mismo.
12. Con cambios sin guardar, tocar Atrás: el navegador no muestra su confirmación (ningún diálogo `beforeunload`).

## Flujo 7: recargar o cerrar la app

Precondición: lista con `Regar`, celular.

1. Abrir `Regar`, cambiar el título y recargar (`page.reload()`): el navegador muestra su confirmación. Cancelarla: el panel sigue abierto con el cambio. Aceptarla: la app recarga, el panel no se reabre y la lista dice `Regar`.
2. Abrir `Regar` sin tocar nada y recargar: no hay confirmación.
3. Abrir `Regar`, escribir `ca` sin confirmar en **Etiquetas** y recargar: hay confirmación. Con solo espacios: no hay.
4. Abrir `Regar`, cambiar el título y tocar **Cerrar** (aviso de cierre abierto) y cerrar la página con `page.close({ runBeforeUnload: true })`: hay confirmación.
5. Abrir `Regar`, cambiar el título, tocar **Pausar** (aviso de acción abierto) y recargar: hay confirmación.
6. Abrir `Regar`, cambiar el título y **Descartar** desde el aviso, y recargar: no hay confirmación.
7. Tocar **+** y recargar sin tocar nada: no hay confirmación; escribir `Pagar` y recargar: hay.
8. Abrir `Regar`, cambiar el título y tocar Atrás: no hay confirmación del navegador (solo el aviso de la app).

## Flujo 8: dos dispositivos con el panel abierto

Precondición: reloj en `2026-07-15T08:00:00` en A y B; A en celular. `Regar` como en el panel de referencia en A.

1. En A, abrir `Regar` y cambiar la nota a `Las del patio`. En B, cambiar el título a `Regar plantas`. En A, sin cerrar: el título de A no cambia por lo escrito. Tocar **Cerrar** en A: se abre el aviso por la nota (el cambio remoto no suma ni quita). **Descartar**.
2. En A, abrir `Regar plantas` sin tocar nada. En B, cambiar el título a `Regar flores`. En A, **Cerrar**: cierra directo, sin aviso.
3. En A, abrir `Regar flores`, cambiar la nota y tocar **Cerrar** (aviso de cierre abierto). En B, borrar `Regar flores`: en A se cierran el aviso y el panel sin pedir nada, y la lista no tiene la tarea.
4. En A, abrir otra tarea `Pagar`, cambiar la nota y tocar **Cerrar** (aviso abierto). En B, borrarla: en A se cierran el aviso y el panel; la lista no tiene `Pagar`.
5. En A, abrir `Regar`, cambiar la nota y tocar **Pausar** (aviso de acción abierto). En B, pausar `Regar`: en A el aviso se cierra y queda el panel con la nota escrita, en **Acciones**, que ahora ofrece **Reanudar**.
6. Con `Regar` pausada, en A abrir, cambiar la nota y tocar **Reanudar** (aviso de acción). En B, reanudarla: en A el aviso se cierra y el panel sigue con la nota.
7. En A, con `Regar` pospuesta 1 hora a las `08:00`, abrir a las `08:30`, cambiar la nota y tocar **Quitar posponer** (aviso). Avanzar el reloj a `2026-07-15T09:00:00`: el aviso se cierra solo y el panel sigue con la nota escrita.
8. En A, abrir `Regar`, cambiar la nota y tocar **Pausar** con el aviso abierto; en B, borrarla: en A se cierran el aviso y el panel.

## Flujo 9: Recientes

Precondición: lista vacía, celular, ningún emoji reciente (contexto nuevo).

1. Tocar **+**, tocar el botón de emoji y elegir 🌱: el selector se cierra y el panel muestra 🌱.
2. Tocar **Cerrar** y **Descartar**: el panel se cierra y la lista sigue vacía.
3. Tocar **+** y el botón de emoji: **Recientes** muestra 🌱 primero (descartar no lo quitó).
