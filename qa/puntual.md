# QA: tarea puntual con fecha límite opcional (feature 3)

Verifica, solo por la interfaz, crear tareas puntuales con y sin fecha límite,
la validación del panel, el paso de pendiente a atrasada al terminar el día
límite (con el reloj simulado), que completar una puntual la saca de
Pendientes, la persistencia, y que crear periódicas sigue funcionando con el
nuevo selector. Cubre spec §4.1, §4.4, §5.1, §6.1 (subconjunto), §6.2
(subconjunto) y §7.

Fuera de alcance: orden entre tareas, historial, deshacer (aviso y desde el
historial), volver a la lista, edición, borrado, etiquetas, emoji y nota.

## Entorno

Igual que `qa/periodica-calendario.md`:

- Firebase Emulator Suite (Auth + Firestore) con datos limpios al inicio de
  cada flujo.
- Reloj simulado del navegador (`page.clock`) instalado **antes** de abrir la
  app, en la hora local que indica cada flujo (zona
  `America/Argentina/Buenos_Aires`). "Avanzar el reloj a X" significa
  adelantar el reloj simulado hasta X y esperar a que la pantalla se actualice
  sola (sin recargar), salvo que el paso diga "recargar".
- Sesión iniciada con la cuenta `qa@example.com` del Auth Emulator (Flujo 1 de
  `qa/periodica-relativa.md`).
- **Mostrar completadas** queda apagado (su valor inicial) en todos los flujos.

Semana de referencia: lunes 2026-07-13, martes 14, miércoles 15, jueves 16,
viernes 17.

## Contrato observable de la fila de Pendientes

El mismo de `qa/periodica-relativa.md`. Una puntual nunca está `en espera`:

| Estado | Checkbox | Estilo atenuado | Barra de progreso | Indicador de atraso |
|---|---|---|---|---|
| `pendiente` | visible, sin marcar | no | no | no |
| `atrasada` | visible, sin marcar | no | no | sí ("Atrasada") |
| completada | — la fila no está en Pendientes — | | | |

En todo este documento **Mostrar completadas** queda apagado (su valor
inicial); con el check encendido, la completada se ve tachada al final
(`qa/mostrar-completadas.md`).

La fila de una puntual no muestra la fecha límite: QA la verifica por el
estado que toma con el paso del tiempo.

## Contrato observable del panel

Al tocar **+** se abre el panel con:

- **Título**.
- Grupo **Se repite** con cuatro opciones excluyentes (radio): **No se
  repite** (tarea puntual), **Intervalo** (como en las
  features 1 y 2), **Días de la semana** y **Días del mes**. Los controles de
  Intervalo, Días de la semana y Días del mes son los de
  `qa/periodica-calendario.md`.
- Con **No se repite**: un campo de fecha **Fecha límite** (fecha sin hora,
  opcional, vacío por defecto), con ese nombre accesible, único en el panel.
  No se ven **Cada**, la unidad ni las grillas de días.
- El campo **Fecha límite** se ve solo con **No se repite**.
- Botones **Cerrar** y **Guardar**.

## Flujo 1: selector de tipo en el panel

Precondición: lista vacía, reloj en `2026-07-13T08:00:00` (lunes).

1. Tocar **+**: el grupo **Se repite** ofrece **No se repite**, **Intervalo**,
   **Días de la semana** y **Días del mes**; **No se repite** está elegida (la
   opción con la que abre el panel al crear). Se ve **Fecha límite**, vacía; no
   se ven **Cada**, la unidad ni las grillas de días.
2. Elegir **Intervalo**: no se ve **Fecha límite**; se ven **Cada** y la
   unidad.
3. Elegir **Días de la semana**: no se ve **Fecha límite**; se ven los siete
   días.
4. Elegir **No se repite** otra vez: se ve **Fecha límite**.
5. Cerrar el panel sin guardar: la lista sigue vacía.

## Flujo 2: crear con y sin fecha límite

Precondición: lista vacía, reloj en `2026-07-13T08:00:00` (lunes).

1. Tocar **+**, escribir título `Pagar la luz`, elegir **No se repite**,
   ingresar Fecha límite `2026-07-15` y guardar.
   - El panel se cierra.
   - Aparece la fila **Pagar la luz** `pendiente`: sin atenuar, sin barra, sin
     indicador de atraso.
2. Tocar **+**, escribir `Cambiar foco`, elegir **No se repite**, dejar Fecha
   límite vacía y guardar: aparece **Cambiar foco** `pendiente`.
3. Tocar **+**, escribir `Devolver libro`, elegir **No se repite**, ingresar
   Fecha límite `2026-07-13` (hoy) y guardar: aparece **Devolver libro**
   `pendiente` (la fecha límite cuenta como el día completo).
4. Tocar **+**, escribir `Renovar DNI`, elegir **No se repite**, ingresar
   Fecha límite `2026-07-10` (en el pasado) y guardar: se acepta y aparece
   **Renovar DNI** `atrasada` de entrada, con el indicador "Atrasada".
5. Recargar la página: siguen las cuatro filas con los mismos estados
   (persistencia en Firestore).

## Flujo 3: validación del panel

Precondición: lista vacía, reloj en `2026-07-13T08:00:00`.

1. Tocar **+**, elegir **No se repite**, dejar el título vacío y Fecha límite
   vacía, y guardar.
   - Se ve un mensaje de error asociado al campo Título.
   - El panel sigue abierto; no aparece ninguna fila.
2. Escribir título `   ` (solo espacios) y guardar: mismo resultado que el
   paso 1.
3. Dejar el título vacío, ingresar Fecha límite `2026-07-15` y guardar: mismo
   resultado que el paso 1.
4. Escribir título `Pagar la luz` y dejar en Fecha límite una fecha
   incompleta, ingresada por teclado (solo día y mes, sin año), y guardar.
   - Se ve un mensaje de error asociado al campo Fecha límite.
   - El panel sigue abierto; no aparece ninguna fila (una fecha incompleta no
     se guarda como "sin fecha límite").
5. Cerrar el panel sin guardar (y **Descartar** en el aviso): la lista sigue vacía.

## Flujo 4: de pendiente a atrasada al terminar el día límite

Precondición: lista vacía, reloj en `2026-07-13T08:00:00` (lunes).

1. Crear `Pagar la luz` con **No se repite** y Fecha límite `2026-07-15`:
   `pendiente`.
2. Crear `Cambiar foco` con **No se repite** y sin fecha límite: `pendiente`.
3. Avanzar el reloj a `2026-07-15T00:00:00` (día límite): **Pagar la luz**
   sigue `pendiente`.
4. Avanzar el reloj a `2026-07-15T23:59:59`: sigue `pendiente`.
5. Avanzar el reloj a `2026-07-16T00:00:00`: **Pagar la luz** pasa a
   `atrasada`: muestra "Atrasada", sin atenuar, sin barra.
6. Recargar la página: **Pagar la luz** sigue `atrasada`.
7. Avanzar el reloj a `2026-09-01T08:00:00`: **Pagar la luz** sigue
   `atrasada`; **Cambiar foco** sigue `pendiente` en todo el flujo (sin fecha
   límite nunca se atrasa).

## Flujo 5: completar saca la tarea de Pendientes

Precondición: lista vacía, reloj en `2026-07-13T08:00:00` (lunes).

1. Crear `Pagar la luz` con Fecha límite `2026-07-15` y `Cambiar foco` sin
   fecha límite: las dos `pendiente`.
2. Tocar el checkbox de **Cambiar foco** (pendiente): la fila **Cambiar foco**
   desaparece de Pendientes. **Pagar la luz** sigue `pendiente`.
3. Avanzar el reloj a `2026-07-16T10:00:00`: **Pagar la luz** pasa a
   `atrasada`.
4. Tocar el checkbox de **Pagar la luz** (atrasada): la fila desaparece. La
   lista queda vacía.
5. Recargar la página: la lista sigue vacía (el completado se guardó).
6. Avanzar el reloj a `2026-08-01T00:00:00`: la lista sigue vacía.

## Flujo 6: persistencia entre sesiones

Precondición: Flujo 4 hasta el paso 2 (dos filas `pendiente`, reloj en
`2026-07-13T08:00:00`).

1. Cerrar la pestaña y abrir la app de nuevo con el reloj en
   `2026-07-16T00:00:00`.
2. Entra directo a **Pendientes** (sin login): **Pagar la luz** está
   `atrasada` (la fecha límite se guardó) y **Cambiar foco** `pendiente`.
3. Tocar el checkbox de **Pagar la luz**: la fila desaparece.
4. Cerrar la pestaña y abrir la app de nuevo con el mismo reloj: solo se ve
   **Cambiar foco**, `pendiente`.

## Flujo 7: las periódicas se siguen creando con el nuevo selector

Precondición: lista vacía, reloj en `2026-07-13T08:00:00` (lunes).

1. Tocar **+**, escribir `Ventilar`, elegir **Intervalo** (el panel abre con
   **No se repite**), poner Cada = `4`, unidad **horas**, y guardar: aparece
   **Ventilar** `pendiente` (nunca completada).
2. Tocar el checkbox de **Ventilar**: queda `en espera`, completada, y su
   fila desaparece.
3. Tocar **+**, escribir `Sacar la basura`, elegir **No se repite**, ingresar
   Fecha límite `2026-07-14`, cambiar a **Días de la semana**, tocar `martes`
   y `jueves` y guardar: aparece **Sacar la basura** `en espera`, barra en 0
   (se guardó la periódica; la fecha límite no aplica).
4. Avanzar el reloj a `2026-07-14T00:00:00` (martes): **Sacar la basura** pasa
   a `pendiente`; **Ventilar** pasa a `pendiente` desde las
   `2026-07-13T12:00:00` y a `atrasada` desde las `2026-07-13T16:00:00`, así
   que ahora vuelve a la lista, `atrasada`.
5. Avanzar el reloj a `2026-07-15T00:00:00`: **Sacar la basura** pasa a
   `atrasada`, como cualquier semanal con el martes sin cubrir.
6. Tocar **+**, escribir `Pagar expensas`, elegir **Días del mes**, tocar `20`
   y guardar: aparece **Pagar expensas** `en espera`.
7. Recargar la página: las tres filas siguen con los mismos estados.
