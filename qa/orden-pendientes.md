# QA: orden por urgencia de Pendientes

Verifica, solo por la interfaz, que la lista de Pendientes se ordena sola por
urgencia, en los tres grupos (atrasada, pendiente, en espera), con el criterio
de cada grupo y el desempate, y que el orden se actualiza solo cuando pasa el
tiempo o se completa una tarea. Cubre spec §5.1–§5.3, §6.1 (orden) y §10
criterio 3.

Todos los flujos usan **Mostrar completadas** apagado (su valor inicial): las
completadas (puntuales con un completado y periódicas en espera con un
completado) no tienen fila. Así, el grupo en espera visible solo tiene
periódicas de calendario que todavía no llegaron a su primera ocurrencia. El
lugar de las completadas con el check encendido se verifica en
`qa/mostrar-completadas.md`.

Fuera de alcance: filtro por etiqueta, chips, edición, borrado, historial y
deshacer.

## Entorno

Igual que `qa/puntual.md`:

- Firebase Emulator Suite (Auth + Firestore) con datos limpios al inicio de
  cada flujo.
- Reloj simulado del navegador (`page.clock`) instalado **antes** de abrir la
  app, en la hora local que indica cada flujo (zona
  `America/Argentina/Buenos_Aires`). "A las X" significa adelantar el reloj
  simulado hasta X antes del paso. "Avanzar el reloj a X" significa adelantarlo
  hasta X y esperar a que la pantalla se actualice sola (sin recargar), salvo
  que el paso diga "recargar".
- Salvo el Flujo 5, cada tarea se crea en un minuto distinto: la hora del
  reloj al guardar es su `creadaEn`.
- Sesión iniciada con la cuenta `qa@example.com` del Auth Emulator (Flujo 1 de
  `qa/periodica-relativa.md`).
- Crear una tarea: tocar **+**, escribir el título, elegir la opción de **Se
  repite** que indica el paso (**No se repite** con o sin Fecha límite;
  **Intervalo** con Cada y unidad; **Días de la semana** o **Días del mes**
  con sus días) y guardar, con los controles de `qa/puntual.md`.
- **Mostrar completadas** queda apagado (su valor inicial) en todos los flujos.

Semana de referencia: lunes 2026-07-13, martes 14, miércoles 15, jueves 16,
viernes 17.

## Contrato observable

- **Orden**: el orden de las filas de arriba hacia abajo en Pendientes (el
  orden en pantalla y el de los elementos de fila en el documento es el
  mismo). "La lista es A, B, C" significa exactamente esas filas, en ese
  orden.
- El estado de cada fila (`pendiente`, `atrasada`, `en espera`) se ve con el
  contrato de fila de `qa/periodica-relativa.md`: el atraso por el indicador
  "Atrasada", la espera por el estilo atenuado y la barra.
- El orden no se puede cambiar a mano: no hay arrastre ni control de orden.

## Flujo 1: tres grupos y orden en vivo

Precondición: lista vacía, reloj en `2026-07-13T08:00:00` (lunes).

1. A las `08:00`, crear `Regar plantas` con **Intervalo** cada `4` **horas**.
2. A las `08:01`, crear `Pagar la luz` con **No se repite** y Fecha límite
   `2026-07-14`.
3. A las `08:02`, crear `Sacar la basura` con **Días de la semana** `martes`
   y `jueves`.
4. A las `08:03`, crear `Cambiar foco` con **No se repite** y sin fecha límite.
   - La lista es **Regar plantas**, **Pagar la luz**, **Cambiar foco**,
     **Sacar la basura**: las tres primeras `pendiente` (Regar plantas,
     nunca completada, está pendiente desde que se creó; Cambiar foco, sin
     fecha límite, va al final del grupo) y Sacar la basura `en espera`.
5. A las `08:04`, tocar el checkbox de **Regar plantas**: queda `en espera`
   hasta las `12:04`, completada, y su fila desaparece.
   - La lista es **Pagar la luz**, **Cambiar foco**, **Sacar la basura**.
6. Avanzar el reloj a `2026-07-13T12:04:00`: **Regar plantas** vuelve a la
   lista, `pendiente`, desde antes que la fecha límite de Pagar la luz.
   - La lista es **Regar plantas**, **Pagar la luz**, **Cambiar foco**,
     **Sacar la basura**.
7. Avanzar el reloj a `2026-07-14T00:00:00` (martes): **Regar plantas** está
   `atrasada` (desde las `16:04` del lunes); **Pagar la luz** y **Sacar la
   basura** están `pendiente` desde el mismo instante (00:00 de hoy) y
   desempata la creada antes.
   - La lista es **Regar plantas**, **Pagar la luz**, **Sacar la basura**,
     **Cambiar foco**.
8. Avanzar el reloj a `2026-07-15T00:00:00` (miércoles): **Pagar la luz** y
   **Sacar la basura** pasan a `atrasada`, las dos desde este instante; Regar
   plantas lleva más tiempo atrasada.
   - La lista es **Regar plantas**, **Pagar la luz**, **Sacar la basura**,
     **Cambiar foco**.
9. Recargar la página: la lista y los estados son los mismos.

## Flujo 2: atrasadas por el tiempo que llevan atrasadas

Precondición: lista vacía, reloj en `2026-07-13T08:00:00` (lunes).

1. A las `08:00`, crear `Regar plantas` con **Intervalo** cada `1` **días** y
   tocar su checkbox: queda `en espera`, completada, y su fila desaparece
   (vence el martes a las `08:00`, se atrasa el miércoles a las `08:00`).
2. A las `08:01`, crear `Pagar la luz` con **No se repite** y Fecha límite
   `2026-07-14` (se atrasa el miércoles a las `00:00`).
3. A las `08:02`, crear `Sacar la basura` con **Días de la semana** `lunes`:
   `pendiente` (se creó en un día de ocurrencia; se atrasa el martes a las
   `00:00`).
4. Avanzar el reloj a `2026-07-16T12:00:00` (jueves): las tres están
   `atrasada`.
   - La lista es **Sacar la basura**, **Pagar la luz**, **Regar plantas**:
     Regar plantas va última aunque su vencimiento (martes 08:00) sea el más
     antiguo, porque recién se atrasó el miércoles a las 08:00.
5. Recargar la página: la lista es la misma.

## Flujo 3: pendientes por el momento desde el que están pendientes

Precondición: lista vacía, reloj en `2026-07-15T08:00:00` (miércoles).

1. A las `08:00`, crear `Cambiar foco` con **No se repite** y sin fecha
   límite.
2. A las `08:01`, crear `Llamar plomero` con **No se repite** y sin fecha
   límite.
3. A las `08:02`, crear `Comprar regalo` con **No se repite** y Fecha límite
   `2026-07-16`.
4. A las `08:03`, crear `Ventilar` con **Intervalo** cada `4` **horas**.
5. A las `08:04`, crear `Pagar la luz` con **No se repite** y Fecha límite
   `2026-07-15` (hoy).
   - Todas `pendiente`. La lista es **Pagar la luz** (desde las 00:00 de hoy),
     **Ventilar** (nunca completada, desde las 08:03), **Comprar regalo**
     (desde las 00:00 de mañana), **Cambiar foco**, **Llamar plomero** (sin
     fecha límite, al final, la creada antes primero).
6. A las `08:05`, tocar el checkbox de **Ventilar**: queda `en espera`,
   completada, y su fila desaparece.
   - La lista es **Pagar la luz**, **Comprar regalo**, **Cambiar foco**,
     **Llamar plomero**.
7. Avanzar el reloj a `2026-07-15T12:05:00`: **Ventilar** vuelve a la lista,
   `pendiente`, desde un instante posterior a las 00:00 de hoy y anterior a
   las de mañana.
   - La lista es **Pagar la luz**, **Ventilar**, **Comprar regalo**,
     **Cambiar foco**, **Llamar plomero**.

## Flujo 4: en espera por cuándo vuelven

En espera sin completados solo puede estar una periódica de calendario antes
de su primera ocurrencia.

Precondición: lista vacía, reloj en `2026-07-15T08:00:00` (miércoles).

1. A las `08:00`, crear `Cambiar sábanas` con **Días de la semana** `sábado`:
   `en espera` (vuelve el sábado a las `00:00`).
2. A las `08:01`, crear `Limpiar heladera` con **Días del mes** `17`:
   `en espera` (vuelve el viernes 17 a las `00:00`).
3. A las `08:02`, crear `Sacar la basura` con **Días de la semana** `martes`
   y `jueves`: `en espera` (vuelve el jueves a las `00:00`).
4. A las `08:03`, crear `Cambiar foco` con **No se repite** y sin fecha
   límite: `pendiente`.
   - Las tres periódicas atenuadas, con barra, y no completadas (en negrita,
     con el checkbox sin marcar). La lista es **Cambiar foco**, **Sacar la
     basura**, **Limpiar heladera**, **Cambiar sábanas**: la pendiente
     primero y después las en espera por cuándo vuelven, no por cuándo se
     crearon.
5. Avanzar el reloj a `2026-07-16T00:00:00` (jueves): **Sacar la basura**
   pasa a `pendiente` desde las 00:00 de hoy, antes que **Cambiar foco** (sin
   fecha límite, al final del grupo).
   - La lista es **Sacar la basura**, **Cambiar foco**, **Limpiar heladera**,
     **Cambiar sábanas**.
6. A las `2026-07-16T08:00:00`, tocar el checkbox de **Sacar la basura**
   (cubre el jueves): queda `en espera`, completada, y su fila desaparece.
   - La lista es **Cambiar foco**, **Limpiar heladera**, **Cambiar sábanas**.
7. Recargar la página: la lista es la misma.

## Flujo 5: desempate por título

Precondición: lista vacía, reloj simulado **detenido** en
`2026-07-15T08:00:00` (no avanza solo), así todas las tareas tienen la misma
`creadaEn`.

1. Crear, en este orden, con **No se repite** y sin fecha límite: `Zapallo`,
   `Ñoquis`, `Barrer`, `Nueces`, `Árbol`, `acelga`.
   - Todas `pendiente`. La lista es **acelga**, **Árbol**, **Barrer**,
     **Nueces**, **Ñoquis**, **Zapallo**: orden alfabético en español, sin
     distinguir mayúsculas ni acentos y con la ñ después de la n.
2. Recargar la página: la lista es la misma.
