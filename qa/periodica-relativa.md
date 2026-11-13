# QA: tarea periódica relativa (rebanada vertical 1)

Verifica, solo por la interfaz, el flujo de punta a punta: entrar con Google,
crear una tarea periódica relativa, verla pendiente, completarla, verla en
espera con su barra de progreso, avanzar el reloj y verla pendiente y luego
atrasada. Cubre spec §4.2 (Relativa), §4.4, §5.2, §6.1 (subconjunto), §6.2
(subconjunto), §6.5 y §7.

Fuera de alcance: orden entre tareas, filtros, etiquetas, emoji, nota,
deshacer, historial, edición y borrado.

## Entorno

- Firebase Emulator Suite (Auth + Firestore) con datos limpios al inicio de
  cada flujo.
- Reloj simulado del navegador (`page.clock`) instalado **antes** de abrir la
  app, en hora local `2026-07-15T08:00:00`. "Avanzar el reloj X" significa
  adelantar el reloj simulado X y esperar a que la pantalla se actualice sola
  (sin recargar), salvo que el paso diga "recargar".
- Cuenta del Auth Emulator: `qa@example.com`.
- Crear una relativa: tocar **+**, escribir el título, elegir **Intervalo** en **Se repite** (el panel de creación abre con **No se repite**), poner **Cada** y la unidad, y guardar.
- Desde el Flujo 2, al empezar cada flujo (después de entrar), tocar el check
  **Mostrar completadas** para encenderlo: una periódica en espera con
  completados está completada y solo tiene fila con el check encendido
  (`qa/mostrar-completadas.md`).

## Contrato observable de la fila de Pendientes

Lo que QA mira en cada fila de tarea (identificada por su título):

| Estado | Checkbox | Título | Estilo atenuado | Barra de progreso | Indicador de atraso |
|---|---|---|---|---|---|
| `pendiente` | visible, sin marcar | negrita | no | no | no |
| `en espera`, con completados (completada) | visible, marcado | tachado, peso normal | sí | sí | no |
| `en espera`, sin completados (solo calendario) | visible, sin marcar | negrita | sí | sí | no |
| `atrasada` | visible, sin marcar | negrita | no | no | sí |

Una relativa en espera siempre tiene completados: está completada. Negrita,
tachado y peso normal se miden como en `qa/mostrar-completadas.md`.

- Checkbox: control accesible con rol `checkbox` y nombre que incluye el
  título; área táctil de al menos 48×48 px.
- Barra de progreso: rol `progressbar` con `aria-valuemin=0`,
  `aria-valuemax=100` y `aria-valuenow` = progreso × 100 (redondeado a entero).
- Estilo atenuado: la fila en espera tiene opacidad computada menor que 1 y
  menor que la de una fila pendiente; su checkbox sigue habilitado.
- Indicador de atraso: texto accesible "Atrasada" dentro de la fila. **Reemplazado** por el texto «Tocaba …» (`qa/estado-sin-culpa.md`): donde un procedimiento anterior espera "Atrasada", se espera ese texto.

## Flujo 1: entrar con Google

1. Abrir la app sin sesión.
2. Ver la pantalla de inicio de sesión con el botón **Entrar con Google**.
   No se ve la lista de Pendientes ni el botón **+**.
3. Tocar **Entrar con Google** y elegir la cuenta `qa@example.com` en el
   Auth Emulator.
4. Ver la pantalla **Pendientes**, vacía, con el botón **+** visible.
5. Recargar la página: sigue en **Pendientes** sin pedir login.

## Flujo 2: validación al crear

Precondición: sesión iniciada (Flujo 1), lista vacía.

1. Tocar **+**. Se abre el panel con el campo **Título** y el grupo **Se repite**
   con **No se repite** elegida. Elegir **Intervalo**: se ven **Cada** (número)
   y unidad (**horas** / **días**).
2. Dejar el título vacío, poner Cada = `2`, unidad **días**, y guardar.
   - Se ve un mensaje de error asociado al campo Título.
   - El panel sigue abierto; no aparece ninguna fila en Pendientes.
3. Escribir título `   ` (solo espacios) y guardar: mismo resultado que el
   paso 2.
4. Escribir título `Regar plantas`, poner Cada = `0` y guardar.
   - Se ve un mensaje de error asociado al campo Cada.
   - No aparece ninguna fila.
5. Poner Cada = `1.5` y guardar: mismo resultado que el paso 4.
6. Cerrar el panel sin guardar (y **Descartar** en el aviso "Tenés cambios sin guardar"): la lista sigue vacía.

## Flujo 3: ciclo de estados de "Regar plantas" cada 2 días

Precondición: sesión iniciada, lista vacía, reloj en `2026-07-15T08:00:00`.

1. Tocar **+**, escribir título `Regar plantas`, elegir **Intervalo**, Cada = `2`,
   unidad **días**, y guardar.
   - El panel se cierra.
   - Aparece la fila **Regar plantas** en estado `pendiente` (nunca
     completada): sin atenuar, sin barra, sin indicador de atraso.
2. Avanzar el reloj 3 días (`2026-07-18T08:00:00`): la fila sigue `pendiente`
   (una tarea nunca completada no se atrasa).
3. Volver el contexto al punto de partida: limpiar datos, reinstalar el reloj
   en `2026-07-15T08:00:00`, entrar y crear de nuevo `Regar plantas` cada 2
   días (paso 1).
4. Tocar el checkbox de **Regar plantas** a las `2026-07-15T08:00:00`.
   - La fila pasa a `en espera`: atenuada, con barra de progreso en 0, sin
     indicador de atraso. Está completada: el checkbox queda marcado y
     habilitado, y el título tachado.
5. Avanzar el reloj 1 día (`2026-07-16T08:00:00`): sigue `en espera`, barra
   en 50.
6. Avanzar el reloj 23 horas (`2026-07-17T07:00:00`): sigue `en espera`,
   barra en 98 (47/48).
7. Avanzar el reloj 1 hora (`2026-07-17T08:00:00`, vencimiento): la fila
   pasa a `pendiente`: sin atenuar, sin barra, sin indicador de atraso.
8. Avanzar el reloj 1 día 23 horas (`2026-07-19T07:00:00`): sigue
   `pendiente`.
9. Avanzar el reloj 1 hora (`2026-07-19T08:00:00`, se perdió un ciclo
   completo): la fila pasa a `atrasada`: muestra el indicador "Atrasada",
   sin atenuar, sin barra.
10. Recargar la página: la fila **Regar plantas** sigue `atrasada`
    (persistencia en Firestore).
11. Tocar el checkbox a las `2026-07-19T08:00:00`: la fila pasa a
    `en espera` con barra en 0 (completar reinicia el intervalo).
12. Avanzar el reloj 1 día (`2026-07-20T08:00:00`): `en espera`, barra en 50.
13. Avanzar el reloj 1 día (`2026-07-21T08:00:00`): `pendiente`.

## Flujo 4: el checkbox en espera borra el completado de hoy; completar de nuevo reinicia el intervalo (horas)

Una relativa en espera está completada: si su completado más reciente es de
hoy, tocar su checkbox lo borra (spec §6.1) en lugar de completarla otra vez.
Si es de un día anterior, la completa de nuevo (Flujo 7).

Precondición: sesión iniciada, lista vacía, reloj en `2026-07-15T08:00:00`.

1. Crear `Ventilar` cada `4` **horas**: fila `pendiente`.
2. Tocar el checkbox: `en espera`, barra en 0, checkbox marcado.
3. Avanzar el reloj 1 hora (`2026-07-15T09:00:00`): barra en 25.
4. Tocar el checkbox otra vez: se borra el completado y la fila vuelve a
   `pendiente` (nunca completada): sin atenuar, sin barra, checkbox sin
   marcar.
5. Tocar el checkbox: `en espera`, barra en 0 (el intervalo empieza a las
   `09:00`).
6. Avanzar el reloj 3 horas (`2026-07-15T12:00:00`, cuando vencía el primer
   completado): sigue `en espera`, barra en 75.
7. Avanzar el reloj 1 hora (`2026-07-15T13:00:00`): `pendiente`.
8. Avanzar el reloj 4 horas (`2026-07-15T17:00:00`): `atrasada`.

## Flujo 5: persistencia entre sesiones

Precondición: Flujo 3 hasta el paso 5 (fila en espera, barra en 50).

1. Cerrar la pestaña y abrir la app de nuevo con el mismo reloj.
2. Entra directo a **Pendientes** (sin login) y **Regar plantas** sigue
   `en espera` con barra en 50.

## Flujo 6: relojes desfasados (completado "del futuro")

Simula un completado registrado por un dispositivo con el reloj adelantado:
se completa con el reloj simulado en un momento y después se lo retrocede.
"Retroceder el reloj a X" significa fijar el reloj simulado en X
(`page.clock.setSystemTime`) y esperar a que la pantalla se actualice sola,
sin recargar. Cubre la fila "ahora < U" de spec §5.2.

Precondición: sesión iniciada, lista vacía, reloj en `2026-07-15T08:00:00`.

1. Crear `Ventilar` cada `4` **horas** y tocar su checkbox: `en espera`,
   barra en 0.
2. Retroceder el reloj a `2026-07-15T07:00:00` (una hora antes del
   completado): sigue `en espera`, barra en 0, sin indicador de atraso.
3. Recargar la página: sigue `en espera`, barra en 0.
4. Avanzar el reloj a `2026-07-15T08:00:00` (el momento del completado):
   `en espera`, barra en 0.
5. Avanzar el reloj a `2026-07-15T09:00:00`: `en espera`, barra en 25.
6. Avanzar el reloj a `2026-07-15T12:00:00`: `pendiente`.

## Flujo 7: completar en espera, con el último completado de ayer, reinicia el intervalo

Si el completado más reciente es de un día anterior, tocar el checkbox de la
relativa en espera la completa de nuevo (spec §5.2, §6.1).

Precondición: sesión iniciada, lista vacía, reloj en `2026-07-15T20:00:00`.

1. Crear `Regar plantas` cada `2` **días** y tocar su checkbox: `en espera`,
   barra en 0, checkbox marcado. Aparece el aviso `Completaste «Regar plantas»`.
2. Avanzar el reloj a `2026-07-16T00:00:00` (el día siguiente): sigue
   `en espera`, barra en 8 (4 de 48 horas).
3. Tocar el checkbox: aparece el aviso `Completaste «Regar plantas»`. Sigue
   `en espera`, completada, con barra en 0 (el intervalo empieza ahora).
4. En el Historial hay dos entradas de **Regar plantas**: **Hoy** `00:00` y
   **Ayer** `20:00`.
5. Avanzar el reloj a `2026-07-17T20:00:00` (cuando vencía el primer
   completado): sigue `en espera`, barra en 92 (44 de 48 horas).
6. Avanzar el reloj a `2026-07-18T00:00:00`: `pendiente`.
