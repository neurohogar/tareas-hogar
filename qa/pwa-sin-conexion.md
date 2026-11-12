# QA: PWA instalable y funcionamiento sin conexión

Verifica, solo por la interfaz y por lo que el navegador expone de la PWA, que
la app es instalable, que abre sin conexión después del primer login, que lo
hecho sin conexión (crear, editar, completar, deshacer, borrar) se ve al
instante, sobrevive a una recarga y sincroniza solo al reconectar, y que una
escritura pendiente no se pierde si se recarga antes de que llegue al
servidor. Cubre spec §2 (sin conexión y sync), §6.5 (abre directo, también sin
conexión), §7 (caché persistente multi-pestaña, sync al reconectar), §8 (PWA:
manifest + service worker) y §10 criterios 1, 4 y 7.

Fuera de alcance: las reglas de conflicto entre dispositivos (ya cubiertas en
`qa/editar-borrar.md` y `qa/etiquetas.md`); cualquier indicador visual de "sin
conexión" o "pendiente de sincronizar" (el spec no lo define: QA no lo exige ni
lo prohíbe); qué pasa con una versión nueva del service worker; abrir sin
conexión sin haber iniciado sesión nunca; el aspecto del ícono, el nombre y los
colores del manifest (solo se verifica que existan y sean válidos); la
instalación real en Android (se verifica que el navegador la considere
instalable).

## Entorno

Igual que `qa/editar-borrar.md`:

- Firebase Emulator Suite (Auth + Firestore) con datos limpios al inicio de
  cada flujo.
- Reloj simulado (`page.clock`) instalado **antes** de abrir la app, en
  `2026-07-15T08:00:00` (zona `America/Argentina/Buenos_Aires`).
- Sesión iniciada con `qa@example.com` (Flujo 1 de `qa/periodica-relativa.md`).
- "Sin conexión" significa `browserContext.setOffline(true)`; "reconectar",
  `setOffline(false)` y esperar a que la pantalla se actualice sola.
- Dos dispositivos: dos contextos independientes, A y B, con la misma cuenta.
- **Mostrar completadas** queda apagado (su valor inicial), salvo en el
  Flujo 3: una tarea completada no tiene fila en Pendientes.
- La app se sirve como build de producción (`vite build` + preview), porque el
  service worker solo se registra ahí. Para los flujos con recarga offline el
  service worker ya tiene que estar activo y controlando la página antes de
  cortar la conexión (esperar `navigator.serviceWorker.ready` y recargar una
  vez con conexión).

## Contrato observable

- **Manifest**: el documento enlaza con `<link rel="manifest">` a un manifest
  que se descarga y parsea como JSON con: `name` = "Tareas Hogar" y `short_name` = "Tareas",
  `start_url` dentro del alcance de la app, `display` = `standalone`, y
  `icons` con al menos un ícono de 192×192 y uno de 512×512, cada uno
  descargable con tipo de imagen.
- **Service worker**: `navigator.serviceWorker.getRegistration()` devuelve un
  registro con un worker en estado `activated` cuyo alcance cubre la raíz de la
  app, y la página queda controlada por él (`navigator.serviceWorker.controller`
  no es nulo tras la recarga).
- **Instalable**: el navegador dispara `beforeinstallprompt` (Chromium) con
  manifest y service worker válidos, o equivalente si el motor no lo expone.
- **Aviso de conexión**: texto visible "Sin conexión" mientras el contexto
  está sin conexión; sin él con conexión. No hay contador de pendientes.
- **Fila y pantallas**: el contrato de fila de `qa/periodica-relativa.md`, el
  de Historial de `qa/historial-deshacer.md` y el de etiquetas de
  `qa/etiquetas.md`.

## Flujo 1: PWA instalable

1. Abrir la app con conexión (build de producción) y esperar a que el service
   worker esté activo.
2. Verificar el contrato de **Manifest** y de **Service worker**.
3. Recargar y verificar que la página queda controlada por el service worker.
4. Verificar que el navegador considera la app instalable.

## Flujo 2: abrir sin conexión tras el primer login

1. Con conexión: entrar con Google (`qa@example.com`), crear la tarea
   puntual **Regar** y ver su fila en **Pendientes**. Esperar a que el service
   worker controle la página.
2. Poner el contexto sin conexión y recargar: la app abre directo en
   **Pendientes**, sin pantalla de login y sin error de red, y muestra la fila
   **Regar**.
3. Abrir `/historial` por URL directa y recargar, aún sin conexión: se ve el
   Historial (vacío: "Todavía no completaste nada"). Lo mismo con `/etiquetas`
   y sus textos.
4. Cerrar la página, abrir una pestaña nueva en la raíz, todavía sin conexión:
   abre directo en **Pendientes** con **Regar**.
5. Reconectar: no aparece pantalla de login ni cambia nada visible.

## Flujo 3: completar sin conexión y sincronizar (criterio 4)

Precondición: A y B con sesión, tarea periódica **Regar** (Cada 1 día) creada
desde A y visible en B, **Pendientes** en ambos, con **Mostrar completadas**
encendido en ambos (`qa/mostrar-completadas.md`).

1. A sin conexión.
2. En A, completar **Regar**: pasa a en espera al instante (atenuada, con
   barra, completada). En B, **Regar** sigue pendiente (sin atenuar).
3. En A, abrir **Historial**: una entrada **Regar** `08:00` en **Hoy**.
4. Recargar A (sigue sin conexión): **Regar** sigue en espera y la entrada
   sigue en el Historial.
5. A se reconecta: sin tocar nada, B muestra **Regar** en espera y, en su
   Historial, la entrada **Regar** `08:00`. Una sola entrada.

## Flujo 4: crear, editar y borrar sin conexión

Precondición: A y B con sesión y listas vacías.

1. A sin conexión.
2. En A, crear **Barrer** (puntual) y **Pagar** (puntual con fecha límite
   `2026-07-20`): ambas aparecen al instante en A. B no las ve.
3. En A, editar **Barrer** a título **Barrer patio**; el cambio se ve al
   instante.
4. En A, completar **Pagar** y luego **Deshacer** desde el aviso: **Pagar**
   vuelve a pendiente.
5. En A, borrar **Pagar** (confirmando): desaparece.
6. Recargar A, aún sin conexión: solo **Barrer patio**; el Historial vacío.
7. A se reconecta: B muestra **Barrer patio** y no **Pagar**; el Historial de
   B está vacío.

## Flujo 5: la escritura pendiente sobrevive a una recarga

Es la observación de QA de la feature anterior: recargar justo después de
crear no debe perder la tarea.

Precondición: A y B con sesión y listas vacías.

1. A sin conexión.
2. En A, crear **Comprar pan** y, sin esperar, recargar A (todavía sin
   conexión): **Comprar pan** sigue en **Pendientes**.
3. En A, completar **Comprar pan** y recargar enseguida, aún sin conexión:
   sigue completada (no está en Pendientes; en el Historial hay una entrada).
4. Cerrar A y abrirla de nuevo en una pestaña nueva, aún sin conexión: mismo
   estado.
5. A se reconecta: B muestra **Comprar pan** completada en su Historial, una
   sola entrada, sin duplicados.
6. Variante con conexión: en A (con conexión) crear **Lavar** y recargar
   inmediatamente, sin esperar. Tras recargar, **Lavar** está en A y también
   aparece en B. Repetir con completar y recargar de inmediato.

## Flujo 6: varias pestañas del mismo dispositivo

Precondición: sesión iniciada, dos pestañas (P1 y P2) del mismo contexto.

1. Ambas abren la app sin errores ni pantallas de "ya hay otra pestaña
   abierta".
2. Con conexión, crear **Regar** en P1: aparece en P2 sin recargar.
3. Contexto sin conexión: crear **Barrer** en P1: P2 la muestra sin recargar
   (caché compartida).
4. Reconectar y abrir B (otro contexto): ve **Regar** y **Barrer**.

## Flujo 7: ida y vuelta de conexión

Precondición: A y B con sesión, **Regar** y **Barrer** puntuales visibles en
ambos.

1. A sin conexión; en B (con conexión) completar **Regar**.
2. A no ve el cambio. Reconectar A: sin recargar, **Regar** pasa a completada
   en A y sale de la lista (**Mostrar completadas** apagado).
3. A sin conexión otra vez, completar **Barrer** y reconectar a los pocos
   segundos: B lo ve sin recargar. Repetir el corte y la reconexión dos veces
   más sin que la app muestre errores ni pierda los cambios.

## Flujo 8: aviso "Sin conexión"

Precondición: sesión iniciada, en **Pendientes**.

1. Con conexión no se ve "Sin conexión".
2. Poner el contexto sin conexión: aparece "Sin conexión" sin recargar.
3. Crear **Regar** sin conexión: el aviso sigue siendo solo "Sin conexión"
   (sin número ni texto de cambios pendientes).
4. Recargar sin conexión: el aviso sigue visible.
5. Reconectar: el aviso desaparece solo.

## Flujo 9: abrir sin conexión sin haber iniciado sesión nunca

Precondición: contexto nuevo, sin sesión previa. Se carga la app con
conexión una vez (para que el service worker la guarde) sin iniciar sesión.

1. Poner el contexto sin conexión y recargar.
2. Se ve la pantalla de entrada con el mensaje "Necesitás conexión para
   entrar la primera vez" y el botón **Entrar con Google** deshabilitado.
3. Reconectar: el mensaje desaparece y el botón queda habilitado, sin
   recargar.

## Flujo 10: versión nueva del service worker

1. Con la app instalada y controlada por el service worker, publicar un
   build nuevo (distinto service worker).
2. Abrir la app de nuevo: no se ve ningún aviso ni pregunta de actualización.
3. Tras cerrar y volver a abrir la app, la página queda controlada por el
   service worker nuevo (versión observable por el build servido) y los datos
   y la sesión siguen intactos.
