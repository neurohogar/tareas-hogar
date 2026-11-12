# QA: editar y borrar tareas

Verifica, solo por la interfaz, que tocar una fila de Pendientes abre el panel
de edición con los valores de la tarea, que se pueden editar el título, el
tipo, la fecha límite y la recurrencia con las mismas validaciones que al
crear, que cerrar con cambios sin guardar pide confirmación (y **Descartar** los descarta), que el estado y el orden
se recalculan con la definición nueva (con el reloj simulado), que **Borrar
tarea** pide confirmación y saca la tarea, y los conflictos entre dos
dispositivos. Cubre spec §4.1–§4.2, §5.1–§5.3, §6.1 (tocar la fila), §6.2 y
§7 (ediciones parciales, borrado, edición contra borrado, completados
huérfanos).

Fuera de alcance: emoji, nota, etiquetas, historial y deshacer, PWA y
funcionamiento offline más allá de los flujos de dos dispositivos. Que el
borrado se lleve también los completados solo se ve en el Historial, que
todavía no existe; lo cubre `features/borrar-tarea.feature`.

## Entorno

Igual que `qa/puntual.md`:

- Firebase Emulator Suite (Auth + Firestore) con datos limpios al inicio de
  cada flujo.
- Reloj simulado del navegador (`page.clock`) instalado **antes** de abrir la
  app, en la hora local que indica cada flujo (zona
  `America/Argentina/Buenos_Aires`). "A las X" significa adelantar el reloj
  simulado hasta X antes del paso. "Avanzar el reloj a X" significa
  adelantarlo hasta X y esperar a que la pantalla se actualice sola (sin
  recargar), salvo que el paso diga "recargar".
- Sesión iniciada con la cuenta `qa@example.com` del Auth Emulator (Flujo 1 de
  `qa/periodica-relativa.md`).
- Crear una tarea: tocar **+**, escribir el título, elegir la opción de **Se
  repite** que indica el paso y guardar, con los controles de `qa/puntual.md`
  y `qa/periodica-calendario.md`.
- **Dos dispositivos** (Flujos 10 a 14): dos contextos de navegador
  independientes, A y B, con la misma cuenta y el mismo reloj simulado. "B
  sin conexión" significa poner el contexto B offline
  (`browserContext.setOffline(true)`), y "B vuelve a tener conexión",
  volverlo online y esperar a que las dos pantallas se actualicen solas.
- Al empezar cada flujo, tocar el check **Mostrar completadas** para
  encenderlo (en A y en B en los flujos de dos dispositivos): las completadas
  se ven tachadas al final de la lista (`qa/mostrar-completadas.md`).

Semana de referencia: lunes 2026-07-13, martes 14, miércoles 15, jueves 16,
viernes 17, sábado 18, domingo 19, lunes 20.

## Contrato observable

- **Fila**: el contrato de `qa/periodica-relativa.md` (checkbox, título,
  "Atrasada", atenuado y barra en espera). La barra de una calendario es la
  de `qa/periodica-calendario.md`.
- **Abrir la edición**: tocar la fila fuera del checkbox (por ejemplo, sobre
  el título) abre el panel de edición. Tocar el checkbox completa la tarea o,
  si está completada, actúa según `qa/mostrar-completadas.md` (borra el
  completado de hoy o, en una periódica completada en un día anterior, la
  completa de nuevo); en ningún caso abre el panel.
- **Panel de edición**: el mismo panel de creación (`qa/puntual.md`,
  `qa/periodica-calendario.md`), con estas diferencias:
  - Encabezado **Editar tarea** (al crear es **Nueva tarea**).
  - Abre con los valores actuales: **Título** con el título, la opción de
    **Se repite** que corresponde elegida y sus controles cargados:
    - **No se repite**: **Fecha límite** con la fecha, o vacía si no tiene.
    - **Intervalo**: **Cada** con N y la unidad elegida.
    - **Días de la semana** / **Días del mes**: los días de la tarea con
      `aria-pressed=true` y el resto `false`.
  - Al elegir otra opción de **Se repite**, sus controles empiezan como al
    crear (sin días elegidos; Fecha límite vacía).
  - Botones **Cerrar**, **Guardar** y **Borrar tarea**. El panel de creación
    (**+**) no tiene **Borrar tarea**.
- **Guardar** con datos válidos cierra el panel y la fila refleja la tarea
  editada. Con datos inválidos, el panel sigue abierto, se ve el error
  asociado al campo (los mismos mensajes que al crear) y la tarea no cambia.
- **Cerrar** con cambios abre el aviso "Tenés cambios sin guardar" (`qa/cambios-sin-guardar.md`); **Descartar** los descarta y sin cambios cierra directo.
- **Confirmación de borrado**: **Borrar tarea** abre un diálogo de
  confirmación (rol `alertdialog`) que nombra la tarea por su título, con los
  botones **Borrar** y **Cancelar**.

## Flujo 1: abrir el panel de edición con los valores de la tarea

Precondición: lista vacía, reloj en `2026-07-13T08:00:00` (lunes).

1. Tocar **+**: el panel dice **Nueva tarea** y no tiene **Borrar tarea**.
   Cerrarlo.
2. Crear `Pagar la luz` (**No se repite**, Fecha límite `2026-07-15`),
   `Cambiar foco` (**No se repite**, sin fecha límite), `Regar plantas`
   (**Intervalo**, Cada `2` **días**), `Sacar la basura` (**Días de la
   semana** `martes` y `jueves`) y `Pagar expensas` (**Días del mes** `10` y
   `31`).
3. Tocar la fila **Pagar la luz**: se abre el panel **Editar tarea** con
   Título `Pagar la luz`, **No se repite** elegida y Fecha límite
   `2026-07-15`; se ven **Cerrar**, **Guardar** y **Borrar tarea**. Cerrar.
4. Tocar **Cambiar foco**: **No se repite**, Fecha límite vacía. Cerrar.
5. Tocar **Regar plantas**: **Intervalo**, Cada `2`, unidad **días**. Cerrar.
6. Tocar **Sacar la basura**: **Días de la semana**, `martes` y `jueves` con
   `aria-pressed=true`, los otros cinco en `false`. Cerrar.
7. Tocar **Pagar expensas**: **Días del mes**, `10` y `31` con
   `aria-pressed=true`, los otros en `false`. Cerrar.
8. Tocar el checkbox de **Regar plantas**: pasa a `en espera` y no se abre
   ningún panel.
9. Ninguna tarea cambió: las cinco filas siguen con sus títulos y estados.

## Flujo 2: editar el título y cerrar sin guardar

Precondición: lista vacía, reloj en `2026-07-13T08:00:00`.

1. Crear `Regar` con **Intervalo** cada `2` **días**.
2. Tocar la fila **Regar**, cambiar el título a `Regar plantas` y guardar: el
   panel se cierra y la fila dice **Regar plantas**, `pendiente`.
3. Recargar la página: sigue **Regar plantas** (se guardó en Firestore).
4. Tocar la fila, cambiar el título a `Otra cosa`, poner Cada `5` y tocar
   **Cerrar** y **Descartar** en el aviso: la fila sigue diciendo **Regar plantas**.
5. Tocar la fila de nuevo: Título `Regar plantas` y Cada `2` (los cambios se
   descartaron). Tocar **Guardar** sin cambiar nada: la fila sigue igual.

## Flujo 3: validación al editar

Precondición: lista vacía, reloj en `2026-07-13T08:00:00`.

1. Crear `Sacar la basura` con **Días de la semana** `martes` y `jueves`.
2. Tocar la fila, borrar el título y guardar: error asociado al campo Título,
   el panel sigue abierto.
3. Escribir título `   ` (solo espacios) y guardar: mismo resultado.
4. Escribir `Basura`, destocar `martes` y `jueves` (ningún día elegido) y
   guardar: error de días; el panel sigue abierto.
5. Elegir **Intervalo**, poner Cada `0` y guardar: error asociado al campo
   Cada.
6. Elegir **No se repite**, dejar en Fecha límite una fecha incompleta
   ingresada por teclado (solo día y mes) y guardar: error asociado al campo
   Fecha límite.
7. Tocar **Cerrar** y **Descartar** en el aviso: la fila sigue **Sacar la basura**, `en espera`. Al
   abrirla, sigue con **Días de la semana** `martes` y `jueves`: ningún
   cambio de los pasos anteriores se guardó, ni el título válido del paso 4.

## Flujo 4: editar la fecha límite de una puntual

Precondición: lista vacía, reloj en `2026-07-15T10:00:00` (miércoles).

1. Crear `Pagar la luz` con **No se repite** y Fecha límite `2026-07-14`:
   `atrasada`.
2. Editarla con Fecha límite `2026-07-20`: pasa a `pendiente`, sin "Atrasada".
3. Editarla con Fecha límite vacía (sin fecha límite): sigue `pendiente`.
4. Editarla con Fecha límite `2026-07-15` (hoy): `pendiente`.
5. Avanzar el reloj a `2026-07-16T00:00:00`: pasa a `atrasada`.
6. Recargar: sigue `atrasada` (se guardó la última fecha).

## Flujo 5: editar el intervalo de una relativa completada

Precondición: lista vacía, reloj en `2026-07-15T08:00:00`.

1. Crear `Ventilar` con **Intervalo** cada `4` **horas** y tocar su
   checkbox: `en espera`, barra en 0.
2. Avanzar el reloj a `2026-07-15T20:00:00`: `atrasada` (pasaron 12 horas).
3. Editarla a cada `2` **días**: pasa a `en espera`, barra en 25 (12 de 48
   horas desde el completado, que se conservó).
4. Editarla a cada `12` **horas**: pasa a `pendiente`.
5. Editarla a cada `4` **horas**: vuelve a `atrasada`.

## Flujo 6: cambiar los días de una semanal completada

Precondición: lista vacía, reloj en `2026-07-14T08:00:00` (martes).

1. Crear `Sacar la basura` con **Días de la semana** `martes` y `jueves`:
   `pendiente` (creada en un día de ocurrencia).
2. A las `2026-07-14T12:00:00`, tocar su checkbox: `en espera`, barra en 0
   (cubrió el martes).
3. Avanzar el reloj a `2026-07-16T06:00:00` (jueves): `pendiente`.
4. Editarla a **Días de la semana** `sábado`: pasa a `en espera`, barra en 50
   (42 de 84 horas desde el completado hasta el sábado).
5. Editarla a **Días de la semana** `miércoles`: pasa a `atrasada` (la
   primera ocurrencia nueva después del martes cubierto fue el miércoles 15).
6. Editarla a **Días del mes** `16`: pasa a `pendiente`.
7. Recargar: sigue `pendiente`, y al abrirla muestra **Días del mes** `16`.

## Flujo 7: cambiar de tipo y de modo

Precondición: lista vacía, reloj en `2026-07-13T10:00:00` (lunes).

1. Crear `Regar` con **Intervalo** cada `1` **días** y tocar su checkbox:
   `en espera`.
2. Crear `Renovar DNI` con **No se repite** y Fecha límite `2026-07-10`:
   `atrasada`.
3. Crear `Limpiar horno` con **Intervalo** cada `3` **días** (nunca
   completada): `pendiente`.
4. Crear `Barrer` con **Intervalo** cada `2` **días** y tocar su checkbox:
   `en espera`.
5. Avanzar el reloj a `2026-07-14T09:00:00` (martes): **Regar** sigue
   `en espera`.
6. Editar **Regar** a **Días de la semana** `martes` y `jueves`: pasa a
   `pendiente` (el completado del lunes cuenta como cubierto hasta ese día;
   toca el martes).
7. Tocar el checkbox de **Regar**: `en espera` hasta el jueves.
8. Editar **Renovar DNI** a **Intervalo** cada `2` **días**: pasa a
   `pendiente` (periódica nunca completada).
9. Editar **Limpiar horno** a **No se repite** con Fecha límite `2026-07-13`:
   pasa a `atrasada`.
10. Editar **Barrer** a **No se repite** sin fecha límite: **Barrer** pasa a
    completada (ya tenía un completado), tachada, al final de la lista.
11. Recargar: la lista es **Limpiar horno** (`atrasada`), **Renovar DNI**
    (`pendiente`), **Regar** (`en espera`, completada) y **Barrer**
    (completada): las completadas al final, de la completada más
    recientemente a la más antigua.
12. Apagar el check **Mostrar completadas**: la lista es **Limpiar horno**,
    **Renovar DNI**.

## Flujo 8: editar cambia el orden

Precondición: lista vacía, reloj en `2026-07-15T06:00:00` (miércoles).

1. Crear `Regar` con **Intervalo** cada `4` **horas** y tocar su checkbox.
2. A las `2026-07-15T06:01:00`, crear `Pagar` con **No se repite** y Fecha
   límite `2026-07-14`.
3. Avanzar el reloj a `2026-07-15T12:00:00`: la lista es **Pagar**
   (`atrasada`), **Regar** (`pendiente`).
4. Editar **Pagar** con Fecha límite `2026-07-20`: la lista es **Regar**,
   **Pagar**, las dos `pendiente`.
5. Editar **Pagar** con Fecha límite `2026-07-14`: la lista vuelve a ser
   **Pagar**, **Regar**.

## Flujo 9: borrar una tarea

Precondición: lista vacía, reloj en `2026-07-13T08:00:00`.

1. Crear `Regar` (**Intervalo** cada `2` **días**) y tocar su checkbox;
   crear `Pagar la luz` (**No se repite**, sin fecha límite).
2. Tocar la fila **Regar** y tocar **Borrar tarea**: aparece el diálogo de
   confirmación con el título `Regar` y los botones **Borrar** y
   **Cancelar**.
3. Tocar **Cancelar**: el diálogo se cierra, el panel de edición sigue
   abierto con los datos de **Regar**. Cerrar el panel: **Regar** sigue en la
   lista, `en espera`.
4. Tocar la fila **Regar**, **Borrar tarea** y **Borrar**: el diálogo y el
   panel se cierran y la fila **Regar** desaparece. **Pagar la luz** sigue
   `pendiente`.
5. Recargar: solo se ve **Pagar la luz**.
6. Borrar **Pagar la luz** de la misma manera: la lista queda vacía. Recargar:
   sigue vacía.

## Flujo 10: dos dispositivos editan campos distintos

Precondición: lista vacía, reloj en `2026-07-13T08:00:00` en A y en B.

1. En A, crear `Regar` con **Intervalo** cada `2` **días**. B la ve aparecer.
2. B sin conexión. En B, editar **Regar** a **Días de la semana** `martes` y
   `jueves`.
3. En A, editar el título a `Regar plantas`.
4. B vuelve a tener conexión.
5. En A y en B, la fila se llama **Regar plantas** y está `en espera` (semanal
   martes y jueves, creada el lunes). Al abrirla en A: **Días de la semana**
   `martes` y `jueves`.

## Flujo 11: el mismo campo, gana el último en llegar

Precondición: lista vacía, reloj en `2026-07-13T08:00:00` en A y en B.

1. En A, crear `Pagar` con **No se repite** y sin fecha límite.
2. B sin conexión. En B, editar el título a `Pagar el gas`.
3. En A, editar el título a `Pagar la luz`.
4. B vuelve a tener conexión: en A y en B la fila se llama **Pagar el gas**
   (el cambio de B llegó último).

## Flujo 12: gana el borrado

Precondición: lista vacía, reloj en `2026-07-13T08:00:00` en A y en B.

1. En A, crear `Regar` con **Intervalo** cada `2` **días** y `Barrer` con
   **Intervalo** cada `1` **días**.
2. B sin conexión. En B, editar el título de **Regar** a `Regar plantas` y
   tocar el checkbox de **Barrer**.
3. En A, borrar **Regar** y **Barrer** (con confirmación).
4. B vuelve a tener conexión: en A y en B la lista queda vacía; no reaparece
   **Regar plantas** ni **Barrer**.
5. Recargar A y B: la lista sigue vacía.

## Flujo 13: la tarea se borra mientras está abierta en el otro dispositivo

Precondición: lista vacía, reloj en `2026-07-13T08:00:00` en A y en B.

1. En A, crear `Regar` con **Intervalo** cada `2` **días**.
2. En B, tocar la fila **Regar**: el panel de edición está abierto.
3. En A, borrar **Regar** (con confirmación).
4. En B, el panel de edición se cierra solo y la fila **Regar** desaparece.

## Flujo 14: cambiar de tipo no deja un valor residual de otro dispositivo

Spec §7: al cambiar de tipo, la tarea queda solo con los campos de tipo que
muestra el panel.

Precondición: lista vacía, reloj en `2026-07-13T08:00:00` en A y en B.

1. En A, crear `Renovar DNI` con **No se repite** y Fecha límite
   `2026-07-20`: `pendiente`. B la ve aparecer.
2. B sin conexión. En B, editar **Renovar DNI** cambiando solo la Fecha
   límite a `2026-07-10`.
3. En A, editar **Renovar DNI** a **Intervalo** cada `2` **días**.
4. B vuelve a tener conexión: en A y en B, **Renovar DNI** está `pendiente`
   (periódica nunca completada; la fecha límite que dejó B no cuenta).
5. En A, editar **Renovar DNI** a **No se repite** dejando **Fecha límite**
   vacía y guardar.
6. En A y en B, **Renovar DNI** está `pendiente`, no `atrasada` (no reapareció
   la fecha `2026-07-10`). Al abrirla en A, **No se repite** con **Fecha
   límite** vacía. Cerrar.
7. Recargar A y B: lo mismo que en el paso 6.

Espejo, con lista vacía y el mismo reloj:

8. En A, crear `Regar` con **Intervalo** cada `2` **días**.
9. B sin conexión. En B, editar **Regar** cambiando solo **Cada** a `6`
   **horas**.
10. En A, editar **Regar** a **No se repite** con Fecha límite `2026-07-20`.
11. B vuelve a tener conexión: en A y en B, **Regar** está `pendiente`.
12. En A, editar **Regar** a **Días de la semana** `martes` y `jueves`.
13. Recargar A y B. Al abrir **Regar** en B: **Días de la semana** con
    `martes` y `jueves` en `aria-pressed=true` y el resto en `false` (no
    **Intervalo** cada `6` **horas**).
