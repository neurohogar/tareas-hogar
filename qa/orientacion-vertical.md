# QA: orientación vertical de la app instalada

Verifica, solo por la interfaz y por lo que el navegador expone de la PWA, que
la app instalada se usa en vertical en cualquiera de los dos sentidos, en todas
sus pantallas, porque lo declara el manifest; que abierta en una pestaña del
navegador sigue girando con el diseño ancho de siempre; que en la compu no
cambia nada, y que quien ya la tiene instalada recibe el cambio con una versión
nueva, sin aviso ni pregunta. Cubre spec §6 (Orientación) y §8 (Manifest).

Fuera de alcance: el giro real de un teléfono con la app instalada (el
navegador de pruebas no instala la app ni gira la pantalla: se verifica lo que
la app declara y que no fija la orientación de ninguna otra manera); cuántas
aperturas tarda el sistema en aplicar el manifest nuevo (spec §6: "el sistema
puede tardar algunas aperturas").

## Entorno

- Firebase Emulator Suite (Auth + Firestore) con datos limpios al inicio de
  cada flujo.
- La app se sirve como build de producción (`vite build` + preview), como en
  `qa/pwa-sin-conexion.md`.
- Reloj simulado (`page.clock`) instalado **antes** de abrir la app, en
  `2026-07-15T08:00:00` (zona `America/Argentina/Buenos_Aires`); al abrir, se
  avanza hasta que se va la pantalla de carga (`qa/fuente-empaquetada.md`,
  Flujo 9).
- Sesión iniciada con `qa@example.com` (Flujo 1 de `qa/periodica-relativa.md`),
  salvo donde se pide la pantalla de entrada.
- **Celular vertical**: viewport de 360x640 px con emulación táctil.
  **Celular horizontal**: el mismo contexto con viewport de 740x360 px (más de
  40rem de ancho). **Compu**: 1280x800 px sin emulación táctil.
- **Espía de orientación**: antes de abrir la app (`addInitScript`), envolver
  `screen.orientation.lock` y `screen.orientation.unlock` para anotar cada
  llamada, y registrar los listeners de `orientationchange` y de
  `screen.orientation` `change`, sin cambiar lo que hacen.

## Contrato observable

- **Manifest**: el documento enlaza con `<link rel="manifest">` a un manifest
  que se descarga y parsea como JSON con `name` = "Tareas Hogar",
  `short_name` = "Tareas", `display` = `standalone` y `orientation` =
  `portrait` (no `portrait-primary` ni `portrait-secondary`, que fijarían un
  sentido; tampoco `landscape`, `any` ni ausente).
- **Sin bloqueo propio**: el espía no anota ninguna llamada a
  `screen.orientation.lock` ni a `unlock`, y ninguna regla de estilo gira el
  contenido: `transform` de `html` y `body` es `none` en vertical y en
  horizontal.
- **Diseño ancho**: el de `qa/panel-mobile.md`, Flujo 10, paso 3 (sin barra de
  pestañas; secciones **Tarea**, **Cuándo** y **Acciones** seguidas).

## Flujo 1: el manifest declara la orientación vertical

1. Abrir la app en **Celular vertical** y esperar a que el service worker esté
   activo.
2. Verificar el contrato de **Manifest**.
3. Abrir el mismo manifest desde `/historial` y `/etiquetas`, y desde la
   pantalla de entrada sin sesión: es el mismo documento, con la misma
   `orientation`.

## Flujo 2: ninguna pantalla fija la orientación por su cuenta

1. Con el **Espía de orientación**, en **Celular vertical**, recorrer:
   la pantalla de carga al abrir, Pendientes, Historial, Etiquetas, el panel
   de una tarea nueva y el de una existente (las tres pestañas), un aviso del
   panel (cerrar con cambios sin guardar) y, sin sesión, la pantalla de
   entrada.
2. En cada una, verificar **Sin bloqueo propio**.

## Flujo 3: en una pestaña del navegador sigue girando

Precondición: crear `Regar` con **Intervalo** cada `2` **días**.

1. En **Celular vertical**, abrir Pendientes: se ve `Regar`; abrir `Regar`:
   hay barra de pestañas (diseño de celular).
2. Pasar a **Celular horizontal** sin recargar: la página sigue la nueva
   orientación (`screen.orientation.type` empieza con `landscape` y el ancho
   visible es 740 px), el panel de `Regar` muestra el **Diseño ancho**, y no
   aparece ningún aviso ni pedido de girar el teléfono.
3. Cerrar el panel y abrir Historial y Etiquetas en **Celular horizontal**: se
   ven enteras, sin girar ni recortar.
4. Volver a **Celular vertical**: el panel vuelve al diseño de celular.
5. Verificar **Sin bloqueo propio** durante todo el flujo.

## Flujo 4: en la compu no cambia nada

1. En **Compu**, abrir Pendientes, Historial, Etiquetas y el panel de `Regar`:
   se ven como hoy, con el **Diseño ancho** en el panel.
2. Verificar **Sin bloqueo propio** y que no aparece ningún aviso sobre la
   orientación.

## Flujo 5: versión nueva

1. Con la app instalada y controlada por un build anterior, copia del actual
   con el manifest sin `orientation` (dos builds en el mismo origen, como los
   sirve `e2e/versiones-apoyo.ts`), publicar el build actual.
2. Abrir la app de nuevo: no se ve ningún aviso ni pregunta.
3. Tras cerrar y volver a abrir, la página queda controlada por el service
   worker nuevo y el manifest que enlaza cumple el contrato de **Manifest**;
   los datos y la sesión siguen intactos.
