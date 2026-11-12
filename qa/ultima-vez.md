# QA: última vez

Verifica, solo por la interfaz:

- que el panel **Editar tarea** muestra debajo de su encabezado cuándo se completó la tarea por última vez ("hoy", "ayer", "hace N días", la fecha para un completado "del futuro" o "nunca");
- que el panel de creación (**+**) no lo muestra y que la fila de Pendientes no cambia;
- que el texto se actualiza solo con el panel abierto: al pasar la medianoche y cuando otro dispositivo completa la tarea o borra un completado;
- que borrar un completado (desde el aviso, el checkbox o el Historial) lo recalcula.

Cubre spec §6.2 (Última vez), con §5.2 (relojes desfasados), §5.4 (deshacer) y §6.3 (formato de la fecha y abrir el panel desde el Historial).

Fuera de alcance: los estados y el orden (`qa/periodica-relativa.md`, `qa/orden-pendientes.md`), el contenido del Historial (`qa/historial-deshacer.md`), etiquetas, emoji, nota y PWA.

## Entorno

Igual que `qa/historial-deshacer.md`:

- Firebase Emulator Suite (Auth + Firestore) con datos limpios al inicio de cada flujo.
- Reloj simulado del navegador (`page.clock`) instalado **antes** de abrir la app, en la hora local que indica cada flujo (zona `America/Argentina/Buenos_Aires`).
  - "A las X" significa adelantar el reloj simulado hasta X antes del paso.
  - "Avanzar el reloj a X" significa adelantarlo hasta X y esperar a que la pantalla se actualice sola (sin recargar), salvo que el paso diga "recargar".
- Sesión iniciada con la cuenta `qa@example.com` del Auth Emulator (Flujo 1 de `qa/periodica-relativa.md`).
- Al empezar cada flujo, tocar el check **Mostrar completadas** para encenderlo (en A y en B en los flujos de dos dispositivos), así las completadas tienen fila (`qa/mostrar-completadas.md`).
- Crear una tarea: tocar **+**, escribir el título, elegir la opción de **Se repite** que indica el paso y guardar, con los controles de `qa/puntual.md` y `qa/periodica-calendario.md`.
- "Abrir el panel de X" significa tocar la fila de X en Pendientes fuera del checkbox (por ejemplo, sobre el título).
- **Dos dispositivos** (Flujos 5 y 6): dos contextos de navegador independientes, A y B, con la misma cuenta. Cada uno tiene su propio reloj simulado, con la hora que indica el flujo.

Semana de referencia: lunes 2026-07-13, martes 14, miércoles 15, jueves 16, viernes 17.

## Contrato observable

- **Panel de edición**: el de `qa/editar-borrar.md` (encabezado **Editar tarea**, valores actuales, **Cerrar**, **Guardar**, **Borrar tarea**).
- **Última vez**: en el panel **Editar tarea**, inmediatamente debajo del encabezado, un texto que empieza con `Última vez: `. "El panel dice T" significa que ese texto es exactamente `Última vez: T`.
  - La hora va en 24 h, `HH:MM`, sin segundos.
  - El panel de creación (encabezado **Nueva tarea**) no tiene ningún texto que empiece con `Última vez`.
- **Fila de Pendientes**: el contrato de `qa/periodica-relativa.md`, `qa/puntual.md` y `qa/mostrar-completadas.md`, sin cambios: ninguna fila contiene el texto `Última vez`.
- **Aviso**, **Historial** y **confirmación de borrado de un completado**: los de `qa/historial-deshacer.md`.

## Flujo 1: crear no la muestra; sin completados, "nunca"

Precondición: lista vacía, reloj en `2026-07-15T08:00:00` (miércoles).

1. Tocar **+**: el panel **Nueva tarea** no tiene texto `Última vez`. Crear `Regar` con **Intervalo** cada `1` **días**.
2. Abrir el panel de **Regar**: el panel dice `nunca`. Cerrar.
3. Ninguna fila de Pendientes contiene `Última vez`.

## Flujo 2: hoy, ayer y hace N días, con el panel abierto al pasar la medianoche

Precondición: lista vacía, reloj en `2026-07-13T08:00:00` (lunes).

1. Crear `Regar` con **Intervalo** cada `10` **días**.
2. A las `2026-07-13T08:05:30`, completar **Regar**.
3. Abrir el panel de **Regar**: el panel dice `hoy 08:05`.
4. Sin cerrar el panel, avanzar el reloj a `2026-07-13T23:59:59`: sigue `hoy 08:05`.
5. Avanzar el reloj a `2026-07-14T00:00:00`: el panel dice `ayer 08:05`.
6. Avanzar el reloj a `2026-07-15T00:00:00`: el panel dice `hace 2 días`.
7. Avanzar el reloj a `2026-07-23T10:00:00`: el panel dice `hace 10 días`.
8. Cerrar. La fila de **Regar** no contiene `Última vez`. Recargar y abrir el panel de **Regar**: `hace 10 días`.

## Flujo 3: borrar completados la recalcula

Precondición: lista vacía, reloj en `2026-07-14T10:00:00` (martes).

1. Crear `Regar` con **Intervalo** cada `1` **horas** y completarla (`10:00`).
2. A las `2026-07-15T09:00:00`, completar **Regar** otra vez (aparece el aviso) y tocar enseguida **Deshacer** (dentro de los 5 segundos).
3. Abrir el panel de **Regar**: el panel dice `ayer 10:00`. Cerrar.
4. A las `2026-07-15T09:30:00`, completar **Regar** y esperar a que el aviso desaparezca. Abrir el panel: `hoy 09:30`. Cerrar.
5. Tocar el checkbox marcado de **Regar** (completada hoy: borra ese completado, `qa/mostrar-completadas.md`). Abrir el panel: `ayer 10:00`. Cerrar.
6. En el Historial, borrar **Regar** `10:00` (grupo **Ayer**, con confirmación).
7. En Pendientes, abrir el panel de **Regar**: el panel dice `nunca`.

## Flujo 4: una puntual completada, abierta desde el Historial

Precondición: lista vacía, reloj en `2026-07-15T08:00:00` (miércoles).

1. Crear `Pagar la luz` con **No se repite** sin fecha límite. A las `2026-07-15T08:20:00`, completarla.
2. Apagar **Mostrar completadas**: **Pagar la luz** no tiene fila.
3. En el Historial, tocar el título de la entrada **Pagar la luz**: se abre **Editar tarea** y el panel dice `hoy 08:20`.
4. Sin cerrar el panel, elegir **Intervalo** cada `4` **horas** y guardar. Tocar de nuevo la entrada: el panel sigue diciendo `hoy 08:20`.

## Flujo 5: otro dispositivo completa y borra con el panel abierto

Precondición: lista vacía, reloj en `2026-07-15T08:00:00` en A y en B.

1. En A, crear `Regar` con **Intervalo** cada `1` **horas** y completarla (`08:00`).
2. En A, abrir el panel de **Regar**: `hoy 08:00`. Dejarlo abierto.
3. A las `2026-07-15T09:15:00` en A y en B, completar **Regar** en B. Sin tocar A, su panel pasa a decir `hoy 09:15`.
4. En B, en el Historial, borrar **Regar** `09:15` (con confirmación). Sin tocar A, su panel vuelve a `hoy 08:00`.
5. En B, borrar **Regar** `08:00` desde el Historial. El panel de A pasa a `nunca`.

## Flujo 6: completado "del futuro"

Precondición: lista vacía, reloj de A en `2026-12-31T20:00:00` (jueves) y reloj de B en `2027-01-01T08:00:00` (viernes, adelantado).

1. En A, crear `Regar` con **Intervalo** cada `2` **días**. En B, completar **Regar** (`08:00`).
2. En A, abrir el panel de **Regar**: el panel dice `viernes 1 de enero de 2027 08:00` (nunca "mañana").
3. En A, avanzar el reloj a `2027-01-01T07:00:00` con el panel abierto: el panel dice `hoy 08:00`.
4. Avanzar el reloj de A a `2027-01-02T10:00:00`: el panel dice `ayer 08:00`.
5. En B, abrir el panel de **Regar**: el panel dice `hoy 08:00`.
