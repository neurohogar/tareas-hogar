# QA: emoji (selector) y nota de la tarea

Verifica, solo por la interfaz, que el panel de edición tiene el selector de
**Emoji** (sin campo de texto) y el campo **Nota**, que el selector ofrece todos
los emojis por categoría, busca en español, recuerda los recientes en el
dispositivo y funciona sin conexión, que el emoji se ve junto al título en
Pendientes, en el Historial y en el aviso de deshacer, que la nota se ve solo
en el panel y se normaliza, y los conflictos entre dos dispositivos. Cubre spec
§4.1, §6.1, §6.2, §6.3, §5.4 y §7.

Fuera de alcance: etiquetas, estados y orden (no dependen de estos campos);
la regla de rechazo de un emoji inválido (§4.1), que la UI no puede producir y
cubren los unit tests del core.

## Entorno

Igual que `qa/editar-borrar.md` (Emulator Suite, `page.clock` instalado antes
de abrir la app, sesión `qa@example.com`, crear tareas y flujo de dos
dispositivos A y B) y `qa/historial-deshacer.md` (reloj detenido para el
aviso). Para "sin conexión" se usa `browserContext.setOffline(true)` como en
`qa/pwa-sin-conexion.md`, con la app como build de producción y el service
worker activo. Los recientes se guardan por navegador: cada flujo parte de un
contexto nuevo (sin recientes) salvo que diga lo contrario.

## Contrato observable

- **Panel**: además de lo de `qa/editar-borrar.md`, tiene la sección
  **Emoji** y un campo de varias líneas **Nota**. No hay campo de texto para
  el emoji. Sin emoji, la sección muestra un botón **Elegir emoji**; con emoji,
  muestra ese emoji, un botón para cambiarlo y un botón **Quitar emoji**. Abre
  con el emoji y la nota actuales (vacíos si no tiene).
- **Selector**: se abre desde el panel. Muestra la lista de **Recientes**
  primero (solo si hay), la navegación por categorías, la grilla de emojis y un
  campo de búsqueda. Elegir un emoji lo asigna en el panel y cierra el
  selector; el cambio se guarda al guardar el panel. No existe el mensaje
  "Ingresá un solo emoji".
- **Recientes**: del más reciente al más viejo, sin repetidos, máximo 16.
  Quitar el emoji no los cambia. Son locales al dispositivo.
- **Nombre de la tarea** (fila de Pendientes, entrada del Historial, aviso):
  con emoji, `emoji título` (por ejemplo `🌱 Regar`); sin emoji, solo el
  título y sin espacio inicial. La nota no aparece en ninguno de los tres.

## Flujo 1: elegir el emoji y verlo en la fila

Precondición: lista vacía, reloj en `2026-07-13T08:00:00`.

1. Crear `Regar` con **Intervalo** cada `2` **días**. La fila dice `Regar`.
2. Tocar la fila: no hay campo de texto de emoji; se ve el botón **Elegir
   emoji** y la **Nota** vacía.
3. Tocar **Elegir emoji**: se abre el selector. Buscar `planta` y elegir `🌱`:
   el selector se cierra, el panel muestra `🌱` y los botones de cambiar y
   **Quitar emoji**. Guardar: la fila dice `🌱 Regar`.
4. Recargar: sigue diciendo `🌱 Regar`. Abrir la fila: el panel muestra `🌱`.
5. Cambiar el emoji, desde el selector, a `👨‍👩‍👧` y guardar: la fila dice
   `👨‍👩‍👧 Regar`. Repetir con `👍🏽`, `❤️` y `🇦🇷`: cada uno se ve como un solo
   emoji en la fila.
6. Crear con **+** `Barrer` (**Intervalo** cada `1` **día**, relativo a la
   última vez que se hizo), elegir `🧹` en el selector y escribir en **Nota**
   `Debajo de la mesa`: la fila dice `🧹 Barrer` y no muestra la nota.
7. Al crear una tarea nueva, **Elegir emoji** y cerrar el selector sin elegir
   (cerrar o Escape) deja el panel sin emoji.

## Flujo 2: quitar el emoji

Precondición: `🌱 Regar` en la lista, reloj en `2026-07-13T08:00:00`.

1. Abrir la fila, tocar **Quitar emoji**: el panel pasa a mostrar **Elegir
   emoji**. Guardar: la fila dice `Regar` (sin emoji y sin espacio inicial).
2. Reabrir: se ve **Elegir emoji**, no hay emoji. Recargar: la fila sigue
   diciendo `Regar`.
3. Abrir la fila, elegir `🔥`, tocar **Quitar emoji** y **Cerrar** sin guardar
   (y **Descartar** en el aviso "Tenés cambios sin guardar"):
   la fila sigue diciendo `Regar`.

## Flujo 3: catálogo, categorías y búsqueda en español

Precondición: lista con una tarea `Regar`, reloj en `2026-07-13T08:00:00`.

1. Abrir la fila y **Elegir emoji**. El selector muestra una navegación por
   categorías (al menos: caras, personas, animales y naturaleza, comida,
   viajes, actividades, objetos, símbolos, banderas).
2. Tocar cada categoría de la navegación: la grilla se desplaza a esa
   categoría y se ven emojis propios de ella (por ejemplo `🐶` en animales,
   `🇦🇷` en banderas).
3. Buscar `planta`: aparece `🌱` entre los resultados. Buscar `escoba`:
   aparece `🧹`. Buscar `perro`: aparece `🐶`. Buscar `PERRO` y `perró` (sin
   distinguir mayúsculas): también aparece `🐶`.
4. Buscar `zzzzqq`: no hay resultados y se ve un mensaje de que no se
   encontró nada. Borrar la búsqueda: vuelve la grilla completa.
5. Con la búsqueda `escoba`, elegir `🧹`: se cierra y el panel muestra `🧹`.

## Flujo 4: recientes

Precondición: contexto nuevo (sin recientes), lista con una tarea `Regar`,
reloj en `2026-07-13T08:00:00`.

1. Abrir el selector: no hay sección **Recientes**. Elegir `🌱` y guardar.
2. Abrir de nuevo el selector: **Recientes** muestra `🌱`. Elegir `🔥` y
   guardar.
3. Reabrir el selector: **Recientes** muestra `🔥`, `🌱` en ese orden.
4. Elegir `🌱` otra vez: tras reabrir, **Recientes** muestra `🌱`, `🔥` (sin
   repetir `🌱`).
5. Tocar **Quitar emoji**, guardar y reabrir el selector: **Recientes** sigue
   siendo `🌱`, `🔥`.
6. Elegir 16 emojis distintos más, uno por uno: **Recientes** muestra
   exactamente 16, el último elegido primero, y `🔥` y `🌱` ya no están.
7. Recargar la página y abrir el selector: **Recientes** conserva los mismos
   16 emojis en el mismo orden.
8. Crear una tarea nueva con **+** y abrir el selector: los **Recientes** son
   los mismos (son del dispositivo, no de la tarea).
9. Abrir la app en un contexto nuevo (otro dispositivo B, misma cuenta):
   el selector no tiene **Recientes**: no se sincronizan.

## Flujo 5: el selector sin conexión

Precondición: build de producción, sesión iniciada, service worker activo y
controlando la página, lista con una tarea `Regar`.

1. Con conexión, abrir el selector una vez y cerrarlo (para que cualquier
   dato diferido se haya cargado). Cortar la conexión y recargar.
2. Abrir la fila y **Elegir emoji**: el selector abre con su grilla, sus
   categorías y sus emojis visibles, sin errores.
3. Buscar `planta`: aparece `🌱`, igual que con conexión. Elegirlo y guardar:
   la fila dice `🌱 Regar`.
4. Durante todo el flujo, el navegador no emitió ninguna petición de red a un
   dominio que no sea el de la app o el emulador (el catálogo y los textos de
   búsqueda no se piden a un servicio externo).
5. Reconectar: la fila sigue diciendo `🌱 Regar`.

## Flujo 6: la nota, solo en el panel

Precondición: lista vacía, reloj en `2026-07-13T08:00:00`.

1. Crear `Regar` con **Intervalo** cada `2` **días**.
2. Abrir la fila, escribir en **Nota** `  Usar guantes  ` (con espacios al
   inicio y al final) y guardar. La fila no muestra la nota.
3. Reabrir: **Nota** tiene exactamente `Usar guantes`, sin espacios en los
   extremos.
4. Escribir una nota de dos líneas (`Usar guantes`, salto de línea,
   `Ventilar`) y guardar. Reabrir: se ven las dos líneas.
5. Pegar una nota de 5000 caracteres y guardar: se acepta sin error; al
   reabrir, tiene los 5000 caracteres.
6. Escribir solo espacios en **Nota** y guardar. Reabrir: **Nota** está vacía.
7. Recargar la página: la nota sigue vacía; la fila sigue sin mostrar nota.

## Flujo 7: el emoji en Historial y en el aviso de deshacer

Precondición: lista vacía, reloj detenido en `2026-07-13T08:00:00`.

1. Crear `Regar` con **Intervalo** cada `4` **horas** y el emoji `🌱` (elegido en el selector), y
   `Barrer` con **Intervalo** cada `4` **horas** sin emoji.
2. Tocar el checkbox de `🌱 Regar`: aparece el aviso `Completaste «🌱 Regar»`
   con **Deshacer**. Dejarlo expirar (5 segundos).
3. Tocar el checkbox de `Barrer`: el aviso dice `Completaste «Barrer»` (sin
   hueco). Dejarlo expirar.
4. Ir a **Historial**: hay dos entradas del día **Hoy**, `🌱 Regar` y
   `Barrer`, cada una con su hora.
5. Tocar la entrada `🌱 Regar`, elegir el emoji `🔥` en el selector y guardar: la entrada
   dice `🔥 Regar`. Tocar **Quitar emoji** y guardar: dice `Regar`.
6. Tocar **Borrar** en una entrada: el diálogo de confirmación nombra la
   tarea con su nombre (emoji y título, o solo título).

## Flujo 8: dos dispositivos, emoji y nota

Precondición: lista vacía, reloj en `2026-07-13T08:00:00` en A y en B.

1. En A, crear `Regar` con **No se repite**. B la ve aparecer.
2. B sin conexión. En B, elegir `🌱` en el selector de emoji y guardar.
3. En A, poner **Nota** `Usar guantes` y guardar.
4. B vuelve a tener conexión: en A y en B la fila dice `🌱 Regar`, y al abrirla
   en cada uno, el panel muestra `🌱` y **Nota** `Usar guantes` (los dos cambios se
   conservaron).
5. B sin conexión. En B, elegir el emoji `🔥` y cambiar **Nota** a `Ventilar`. En
   A, elegir el emoji `🌿`.
6. B vuelve a tener conexión: en A y en B la fila dice `🔥 Regar` (el cambio de
   B llegó último), y la nota es `Ventilar` en los dos.
7. B sin conexión. En B, tocar **Quitar emoji** y guardar. En A,
   cambiar **Nota** a `Barrer abajo`. B vuelve a tener conexión: en A y en B la
   fila dice `Regar` (sin emoji) y la nota es `Barrer abajo`.
