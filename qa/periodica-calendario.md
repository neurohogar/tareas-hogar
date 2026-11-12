# QA: tarea periódica en modo calendario (feature 2)

Verifica, solo por la interfaz, crear periódicas de calendario (semanal y
mensual), la validación del panel y el ciclo de estados con el reloj simulado:
en espera hasta la primera ocurrencia, pendiente el día que toca, atrasada al
día siguiente, completar cubre la ocurrencia y vuelve a en espera hasta la
próxima. Cubre spec §4.2 (Semanal, Mensual), §4.4, §5.3, §6.1 (subconjunto),
§6.2 (subconjunto) y §7.

Fuera de alcance: orden entre tareas, edición de la recurrencia, historial,
deshacer, etiquetas, emoji, nota y borrado.

## Entorno

Igual que `qa/periodica-relativa.md`:

- Firebase Emulator Suite (Auth + Firestore) con datos limpios al inicio de
  cada flujo.
- Reloj simulado del navegador (`page.clock`) instalado **antes** de abrir la
  app, en la hora local que indica cada flujo (zona
  `America/Argentina/Buenos_Aires`). "Avanzar el reloj a X" significa
  adelantar el reloj simulado hasta X y esperar a que la pantalla se actualice
  sola (sin recargar), salvo que el paso diga "recargar".
- Sesión iniciada con la cuenta `qa@example.com` del Auth Emulator (Flujo 1 de
  `qa/periodica-relativa.md`).
- Al empezar cada flujo, tocar el check **Mostrar completadas** para
  encenderlo: una periódica en espera con completados está completada y solo
  tiene fila con el check encendido (`qa/mostrar-completadas.md`).

Semana de referencia: lunes 2026-07-13, martes 14, miércoles 15, jueves 16,
viernes 17, sábado 18, domingo 19, lunes 20, martes 21.

## Contrato observable de la fila de Pendientes

El mismo de `qa/periodica-relativa.md` (checkbox, título, "Atrasada",
atenuado + barra en espera). Una calendario en espera sin completados (antes de
su primera ocurrencia) no está completada: checkbox sin marcar y título en
negrita; con completados, está completada: checkbox marcado y título tachado. La barra vale (ahora − inicio de espera) /
(inicio de la próxima ocurrencia − inicio de espera) × 100, redondeado a
entero; el inicio de espera es el último completado o, si no hay, el momento
de creación.

## Contrato observable del panel

Al tocar **+** se abre el panel con:

- **Título**.
- Grupo **Se repite** con cuatro opciones excluyentes (radio): **No se
  repite** (tarea puntual, feature 3; ver `qa/puntual.md`), **Intervalo**
  (modo relativo de la feature 1, con el campo numérico
  **Cada** y la unidad), **Días de la semana** y **Días del mes**. El radio y
  el campo numérico tienen nombres accesibles distintos. Al crear viene
  elegida **No se repite**.
- Con **Días de la semana**: siete botones de selección con nombre accesible
  `lunes`, `martes`, `miércoles`, `jueves`, `viernes`, `sábado`, `domingo`
  (`aria-pressed` refleja si está elegido). Se pueden elegir varios.
- Con **Días del mes**: 31 botones de selección con nombre accesible `1` a
  `31` (`aria-pressed`), y ningún otro. Se pueden elegir varios.
- Solo se ven los controles de la opción elegida en **Se repite**.
- Botones **Cerrar** y **Guardar**.

## Flujo 1: crear una semanal y una mensual

Precondición: lista vacía, reloj en `2026-07-13T08:00:00` (lunes).

1. Tocar **+**, escribir título `Sacar la basura`, elegir **Días de la
   semana**, tocar `martes` y `jueves` (quedan con `aria-pressed=true`) y
   guardar.
   - El panel se cierra.
   - Aparece la fila **Sacar la basura** `en espera`: atenuada, barra en 0,
     sin indicador de atraso.
2. Tocar **+**, escribir `Pagar expensas`, elegir **Días del mes**, tocar `10`
   y guardar: aparece la fila **Pagar expensas** `en espera`, barra en 0.
3. Tocar **+**, escribir `Regar plantas`, elegir **Días de la semana**, tocar
   `lunes` y guardar: aparece la fila **Regar plantas** `pendiente` (creada en
   un día de ocurrencia): sin atenuar, sin barra, sin indicador de atraso.
4. Recargar la página: siguen las tres filas con los mismos estados
   (persistencia en Firestore).

## Flujo 2: validación del panel

Precondición: lista vacía, reloj en `2026-07-13T08:00:00`.

1. Tocar **+**, dejar el título vacío, elegir **Días de la semana**, tocar
   `martes` y guardar.
   - Se ve un mensaje de error asociado al campo Título.
   - El panel sigue abierto; no aparece ninguna fila.
2. Escribir título `   ` (solo espacios) y guardar: mismo resultado que el
   paso 1.
3. Escribir título `Sacar la basura`, destocar `martes` (ningún día elegido)
   y guardar.
   - Se ve un mensaje de error asociado al grupo de días.
   - No aparece ninguna fila.
4. Elegir **Días del mes** sin tocar ningún día y guardar: mismo resultado que
   el paso 3.
5. Verificar que la grilla de **Días del mes** ofrece exactamente los días `1`
   a `31`.
6. Cerrar el panel sin guardar (y **Descartar** en el aviso "Tenés cambios sin guardar"): la lista sigue vacía.
7. Semanal y mensual no se combinan: tocar **+**, escribir `Combinada`, elegir
   **Días de la semana**, tocar `martes`; cambiar a **Días del mes**, tocar
   `15` y guardar.
   - Aparece una sola fila **Combinada**, `en espera`.
8. Avanzar el reloj a `2026-07-14T00:00:00` (martes): **Combinada** sigue
   `en espera` (no se guardó el martes).
9. Avanzar el reloj a `2026-07-15T00:00:00`: **Combinada** pasa a
   `pendiente` (día 15).

## Flujo 3: ciclo de estados de una semanal

Precondición: lista vacía, reloj en `2026-07-13T08:00:00` (lunes).

1. Crear `Sacar la basura` los `martes` y `jueves`: `en espera`, barra en 0
   (la primera ocurrencia es el martes 14 a las 00:00).
2. Avanzar el reloj a `2026-07-13T16:00:00`: sigue `en espera`, barra en 50.
3. Avanzar el reloj a `2026-07-13T23:00:00`: sigue `en espera`, barra en 94.
4. Avanzar el reloj a `2026-07-14T00:00:00` (martes): pasa a `pendiente`.
5. Avanzar el reloj a `2026-07-14T23:59:59`: sigue `pendiente`.
6. Avanzar el reloj a `2026-07-15T00:00:00` (miércoles): pasa a `atrasada`:
   muestra "Atrasada", sin atenuar, sin barra.
7. Recargar la página: sigue `atrasada`.
8. Avanzar el reloj a `2026-07-15T08:00:00` y tocar el checkbox (cubre el
   martes): pasa a `en espera`, barra en 0, sin indicador de atraso.
9. Avanzar el reloj a `2026-07-15T16:00:00`: `en espera`, barra en 50.
10. Avanzar el reloj a `2026-07-16T00:00:00` (jueves): `pendiente`.
11. Avanzar el reloj a `2026-07-16T12:00:00` y tocar el checkbox (cubre el
    jueves): `en espera`, barra en 0.
12. Avanzar el reloj a `2026-07-18T18:00:00`: `en espera`, barra en 50.
13. Avanzar el reloj a `2026-07-21T00:00:00` (martes siguiente): `pendiente`.

## Flujo 4: completar antes de tiempo y ocurrencias perdidas

Precondición: lista vacía, reloj en `2026-07-13T08:00:00` (lunes).

1. Crear `Sacar la basura` los `martes` y `jueves`: `en espera`.
2. Tocar el checkbox el lunes (antes de tiempo, cubre el martes): sigue
   `en espera`, barra en 0 (ahora espera hasta el jueves 16 a las 00:00).
3. Avanzar el reloj a `2026-07-14T00:00:00` (martes): sigue `en espera`,
   barra en 25 (el martes ya está cubierto).
4. Avanzar el reloj a `2026-07-14T16:00:00`: `en espera`, barra en 50.
5. Avanzar el reloj a `2026-07-16T00:00:00` (jueves): `pendiente`.
6. Avanzar el reloj a `2026-07-17T10:00:00` (viernes, se perdió el jueves):
   `atrasada`, con un solo indicador "Atrasada" y una sola fila.
7. Tocar el checkbox (cubre el jueves; no queda nada atrasado): `en espera`,
   barra en 0, sin indicador de atraso.
8. Avanzar el reloj a `2026-07-19T05:00:00`: `en espera`, barra en 50.
9. Avanzar el reloj a `2026-07-21T00:00:00` (martes): `pendiente`.

## Flujo 5: mensual con día 31 en un mes de 30 días

Precondición: lista vacía, reloj en `2026-06-20T00:00:00`.

1. Crear `Revisar filtro` con **Días del mes** `31`: `en espera`, barra en 0
   (junio tiene 30 días: la ocurrencia es el 30 de junio).
2. Avanzar el reloj a `2026-06-25T00:00:00`: `en espera`, barra en 50.
3. Avanzar el reloj a `2026-06-30T00:00:00`: `pendiente`.
4. Avanzar el reloj a `2026-07-01T00:00:00`: `atrasada`.
5. Avanzar el reloj a `2026-07-01T08:00:00` y tocar el checkbox (cubre el 30
   de junio): `en espera`, barra en 0.
6. Avanzar el reloj a `2026-07-15T04:00:00`: `en espera`, barra en 47
   (332 h de 712 h: de 2026-07-01T08:00 a 2026-07-31T00:00).
7. Avanzar el reloj a `2026-07-31T00:00:00`: `pendiente`.

## Flujo 6: el checkbox en espera borra el completado de hoy

Con un completado, una calendario en espera está completada: si ese
completado es de hoy, tocar su checkbox lo borra (spec §6.1) en lugar de
cubrir otra ocurrencia. Si es de un día anterior, la completa de nuevo
(Flujo 9).

Precondición: lista vacía, reloj en `2026-07-13T08:00:00` (lunes).

1. Crear `Sacar la basura` los `martes` y `jueves`: `en espera`, no
   completada (checkbox sin marcar), barra en 0.
2. Tocar el checkbox (antes de tiempo, cubre el martes): `en espera`,
   completada (checkbox marcado), barra en 0 (ahora espera hasta el jueves 16
   a las 00:00).
3. Avanzar el reloj a `2026-07-13T12:00:00` y tocar el checkbox otra vez: se
   borra el completado. Vuelve a esperar el martes sin completados: `en
   espera`, no completada, barra en 25 (4 de las 16 horas desde la creación
   hasta el martes a las 00:00).
4. Tocar el checkbox: completada otra vez, cubre el martes, barra en 0.
5. Avanzar el reloj a `2026-07-16T00:00:00` (jueves): `pendiente`, no
   completada (el martes está cubierto).

## Flujo 7: persistencia entre sesiones

Precondición: Flujo 4 hasta el paso 4 (fila en espera, barra en 50, con el
martes cubierto por el completado del lunes).

1. Cerrar la pestaña y abrir la app de nuevo con el mismo reloj.
2. Entra directo a **Pendientes** (sin login) y **Sacar la basura** sigue
   `en espera` con barra en 50 (la ocurrencia cubierta se guardó).
3. Avanzar el reloj a `2026-07-16T00:00:00`: `pendiente`.

## Flujo 8: relojes desfasados (completado "del futuro")

Simula un completado registrado por un dispositivo con el reloj adelantado,
como en el Flujo 6 de `qa/periodica-relativa.md`: "retroceder el reloj a X"
significa fijar el reloj simulado en X (`page.clock.setSystemTime`) y esperar
a que la pantalla se actualice sola. Cubre la regla de spec §5.3 sobre un
inicio de espera posterior a ahora.

Precondición: lista vacía, reloj en `2026-07-13T08:00:00` (lunes).

1. Crear `Sacar la basura` los `martes` y `jueves`: `en espera`.
2. Avanzar el reloj a `2026-07-15T20:00:00` (miércoles): `atrasada`. Tocar el
   checkbox (cubre el martes): `en espera`, barra en 0.
3. Retroceder el reloj a `2026-07-15T10:00:00` (diez horas antes del
   completado): sigue `en espera`, barra en 0, sin indicador de atraso.
4. Recargar la página: sigue `en espera`, barra en 0.
5. Avanzar el reloj a `2026-07-15T20:00:00` (el momento del completado):
   `en espera`, barra en 0.
6. Avanzar el reloj a `2026-07-15T22:00:00`: `en espera`, barra en 50 (2 de
   las 4 horas hasta el jueves).
7. Avanzar el reloj a `2026-07-16T00:00:00` (jueves): `pendiente`.

## Flujo 9: completar dos veces antes de tiempo, en días distintos

Si el completado más reciente es de un día anterior, tocar el checkbox de la
calendario en espera la completa de nuevo y cubre la próxima ocurrencia
(spec §5.3, §6.1).

Precondición: lista vacía, reloj en `2026-07-13T08:00:00` (lunes).

1. Crear `Sacar la basura` los `martes` y `jueves` y tocar el checkbox (antes
   de tiempo, cubre el martes): `en espera`, completada, barra en 0 (espera
   hasta el jueves 16 a las 00:00).
2. Avanzar el reloj a `2026-07-14T16:00:00` (martes, ya cubierto): sigue
   `en espera`, barra en 50 (32 de 64 horas).
3. Tocar el checkbox (el último completado es de ayer; cubre el jueves):
   aparece el aviso `Completaste «Sacar la basura»`. Sigue `en espera`,
   completada, barra en 0 (ahora espera hasta el martes 21 a las 00:00).
4. Avanzar el reloj a `2026-07-16T00:00:00` (jueves): sigue `en espera`,
   barra en 21 (32 de 152 horas: el jueves ya está cubierto).
5. Avanzar el reloj a `2026-07-21T00:00:00` (martes siguiente): `pendiente`.
