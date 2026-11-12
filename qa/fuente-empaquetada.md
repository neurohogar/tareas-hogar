# QA: fuente y emoji empaquetados, y pantalla de carga

Verifica, solo por la interfaz, que la app se ve con la fuente **Atkinson Hyperlegible Next** y los emoji de **Noto Color Emoji** que viajan con ella, y que al iniciar muestra la pantalla de carga mientras los espera:

- que rigen en todas las pantallas, en campos y botones, y en los dos temas;
- qué fuente dibuja cada tipo de carácter (la tabla de la §6);
- que tamaños, pesos y jerarquía no cambian, salvo el campo Título del panel, que mide 20px, y que las horas siguen con cifras de ancho fijo;
- que no se pide nada a un servicio externo y que todo funciona sin conexión, también un emoji que nunca se vio en ese dispositivo;
- qué se ve mientras la fuente o el juego de emoji no están disponibles, y que cambian solos, también cuando la descarga del juego se aborta por una falla de red;
- que la app se instala y queda disponible sin conexión aunque un archivo de fuente falle al bajar, y que ese archivo se vuelve a bajar;
- qué ofrece el selector de emoji;
- cuándo aparece la pantalla de carga, qué se ve en ella y qué espera (lo que decide cuándo se va, con todos sus tiempos, está también en `features/pantalla-de-carga.feature`);
- que un emoji que el juego no tiene se guarda y se muestra igual.

Cubre spec §6 (Fuente y emoji empaquetados), §6.2 (el campo Título y lo que ofrece el selector), §6.6 (Pantalla de carga), §7 (qué guarda la app para funcionar sin conexión y qué vive solo en el dispositivo) y §8 (la versión nueva llega sola; la instalación no depende de las fuentes).

Fuera de alcance: el teclado del celular y los calendarios y listas nativas de un campo (los dibuja el sistema), y la clasificación carácter por carácter y el rechazo de un tono de piel suelto (`features/fuente-empaquetada.feature`; la interfaz no puede producirlo).

## Entorno

- Firebase Emulator Suite (Auth + Firestore) con datos limpios al inicio de cada flujo; sesión iniciada con la cuenta `qa@example.com` del Auth Emulator (Flujo 1 de `qa/periodica-relativa.md`).
- Reloj simulado del navegador (`page.clock`) instalado **antes** de abrir la app, detenido, en la zona `America/Argentina/Buenos_Aires`.
- **Celular**: 360x640 px con emulación táctil. **Ancho**: 1024x768 px. **Tema claro** y **Tema oscuro**: `page.emulateMedia({ colorScheme })`.
- **Sin conexión**: `browserContext.setOffline(true)` después de que la app terminó de cargar y de bajar la fuente y el juego de emoji.
- **Bloquear la fuente / el juego de emoji**: `page.route` aborta los pedidos de los archivos de la fuente o del juego de emoji. **Bloquear servicios externos**: `page.route` registra todo pedido a un origen distinto del de la app (salvo Firebase Auth y Firestore).
- **Pedido demorado**: el pedido del juego de emoji queda retenido, sin respuesta, hasta que se lo libera.
- **Falla de red en un archivo**: el pedido del archivo se corta con un error de red, lo haga la página o el service worker, así que el corte tiene que alcanzar también a los pedidos del service worker (`page.route` no los ve). Lo elige QA: `browserContext.route` si los intercepta, o el servidor de versiones de `e2e/versiones-apoyo.ts` cerrando la conexión. Un archivo de fuente es uno cualquiera de Atkinson (por ejemplo `atkinson-hyperlegible-next-latin-400-normal.woff2`).
- **App instalada**: el service worker está activo y controla la página (`navigator.serviceWorker.controller`). Es la única espera que mira adentro; lo que se verifica después se ve en la interfaz.
- **Abrir la app**: toda apertura pasa por la pantalla de carga. Con el reloj detenido no se va sola: abrir incluye avanzar el reloj hasta que se fue, salvo en los pasos que miden ese tiempo. Los flujos 1 a 8 empiezan a verificar cuando ya se fue.
- **Tiempo de la pantalla**: los segundos cuentan desde que la app arranca y se miden con el reloj simulado (`page.clock.runFor`): antes del momento esperado sigue abierta y al llegar se va.
- **Demorar datos**: el pedido a Firestore (o a Auth) queda retenido hasta que se lo libera.
- Crear una tarea: tocar **+**, escribir el título (y elegir el emoji con el selector si el paso lo indica), guardar.

## Contrato observable

- **Fuente que dibuja un texto**: la que informa el navegador para el nodo (CDP `CSS.getPlatformFontsForNode`, nombre de familia). Atkinson es "Atkinson Hyperlegible Next"; el juego de emoji, "Noto Color Emoji"; "la fuente del sistema" y "el emoji del dispositivo" son cualquier otra.
- **Pedidos de red**: los que registra Playwright (`page.on("request")`).
- **Tamaño y peso**: el alto y el ancho de la caja del elemento (`boundingBox`) y su `font-size` y `font-weight` calculados.
- **Pantalla de carga**: el elemento con nombre accesible «Cargando» (`getByRole('img', { name: 'Cargando' })`). **Pulso**: `element.getAnimations()` del ícono tiene una animación en curso; **quieto**: no tiene ninguna.
- **Textos de referencia**: título «Ñandú: camión 12:30», nota «Año 2026 ✈», etiqueta «Cocina», título con otro alfabeto «日本語».

## Flujo 1: toda la app con la fuente

1. Crear la tarea «Regar» con emoji 🌱, la etiqueta «Cocina» y nota «Año 2026 ✈».
2. En **Pendientes**, la fila de «Regar» y la pestaña **Pendientes** se ven con Atkinson; el 🌱 con Noto.
3. Ir a **Historial** y **Etiquetas**: los títulos, los botones, los campos y la barra de pestañas se ven con Atkinson.
4. Abrir el panel de «Regar»: título, nota, botones (**Guardar**, **Pausar** o **Posponer** según corresponda), las pestañas y los campos se ven con Atkinson; el ✈ de la nota se ve con Noto.
5. Abrir el selector de emoji: sus Recientes y todos los emoji que muestra se ven con Noto; los títulos y botones del selector, con Atkinson.
6. Tocar el checkbox de «Regar»: el aviso de deshacer («Completaste «🌱 Regar»») se ve con Atkinson y el 🌱 con Noto.
7. Cerrar el panel con cambios sin guardar: el aviso «Tenés cambios sin guardar» y sus botones se ven con Atkinson.
8. Cerrar sesión: la pantalla de entrada se ve con Atkinson.
9. Repetir 2 a 8 en **Celular** y en **Ancho**, y en **Tema claro** y en **Tema oscuro**: mismo resultado.

## Flujo 2: qué fuente dibuja cada carácter

1. Crear la tarea con título «Ñandú: camión ❤ 日本語 🌱», nota «☀ ☎ © ™ #».
2. En la fila y en el panel: «Ñandú: camión» se ve con Atkinson; «❤» con Noto; «日本語» con la fuente del sistema; «🌱» con Noto.
3. En la nota: «☀» y «☎» con Noto; «©», «™» y «#» con Atkinson.
4. Pegar en el título un emoji con ZWJ (👨‍👩‍👧), uno con tono (👍🏽) y una bandera (🇦🇷): los tres se ven con Noto, cada uno como un solo dibujo.

## Flujo 3: sin cambios de diseño y horas

1. Con la fuente bloqueada (Flujo 5, paso 1) anotar tamaño de caja, `font-size` y `font-weight` del título de una fila, de un botón y de una pestaña. Recargar sin bloquear y compararlos.
2. `font-size` y `font-weight` son iguales; la jerarquía visual se mantiene: el título de la fila se distingue de la nota por el peso (el tamaño es el mismo), el encabezado del panel es más grande que la nota y la pestaña elegida se ve resaltada. Al crear y al editar una tarea, en **Celular** y en **Ancho**, el campo **Título** del panel mide 20px de `font-size` y la **Nota** 16px, con la fuente disponible y con la fuente bloqueada.
3. Completar una tarea para que el Historial muestre dos entradas «08:05» y «11:11»: las dos horas ocupan el mismo ancho y las cifras quedan alineadas en columna.

## Flujo 4: sin conexión y sin servicios externos

1. Bloquear servicios externos, abrir la app y recorrer las tres pantallas, el panel y el selector: ningún pedido fue a otro origen que el de la app, Firebase Auth o Firestore.
2. Esperar a que baje todo, ponerse **Sin conexión** y recargar: la app abre con Atkinson y Noto.
3. Sin conexión, abrir el selector y buscar un emoji que no se usó en ese dispositivo (por ejemplo 🪼): se ve con Noto.
4. Sin conexión, escribir 🪼 en el título de una tarea nueva: se ve con Noto.

## Flujo 5: mientras no están disponibles

1. Bloquear los archivos de la fuente y abrir la app: la pantalla de carga se muestra, sin ningún texto de respaldo a la vista, y no espera los archivos que fallaron. Al irse, todo el texto se ve con la fuente del sistema, ninguno desaparece, no hay aviso ni mensaje.
2. Quitar el bloqueo y recargar: el texto pasa a Atkinson sin tocar nada más.
3. Bloquear el juego de emoji y abrir la app: la pantalla de carga no espera el juego que falló. Al irse, los emoji se ven con los del dispositivo, ninguno en blanco, sin aviso.
4. Quitar el bloqueo y recargar: pasan a Noto.
5. **Pedido demorado**: abrir la app con el pedido del juego demorado: la pantalla de carga sigue abierta hasta el tope de 10 s, sin que se vea ningún emoji de respaldo. Al irse, los emoji se ven con los del dispositivo, ninguno en blanco, sin aviso. Liberar el pedido: los emoji pasan a Noto sin recargar ni aviso, y no hubo un segundo pedido.
6. **Descarga abortada**: abrir la app con **Falla de red** en el juego de emoji: la pantalla de carga no espera hasta el tope. Al irse, los emoji se ven con los del dispositivo, ninguno en blanco, sin aviso. Ponerse **Sin conexión**, quitar la falla y volver a tener conexión, sin recargar: la app pide el juego otra vez (hay un pedido nuevo registrado) y los emoji pasan a Noto, sin aviso.

## Flujo 6: emoji que el juego no tiene

Cada apertura empieza con la pantalla de carga (ver **Abrir la app**); cuando el juego está bloqueado, la pantalla no lo espera.

1. Crear una tarea con título «Prueba» y el emoji que Noto no tiene (el carácter U+1FAFF, sin dibujo asignado hoy, escrito en el título).
2. Guardar: la tarea se guarda; la fila muestra el carácter con el emoji del dispositivo, no en blanco, sin error ni aviso.
3. Abrir otra vez la tarea en el panel: el título conserva el carácter.
4. En otro dispositivo B con la misma cuenta, la fila muestra el mismo carácter.
5. El selector de emoji, con el juego y sin él, ofrece lo mismo: 1914 emoji base agrupados por categoría, con navegación entre categorías, y cada uno con sus variantes de un tono de piel. No ofrece los 9 emoji del grupo de componentes (los 5 tonos de piel y los 4 tipos de cabello sueltos) ni las variantes de dos tonos de piel. Buscar «planta», «escoba» o «perro» da resultados, y elegir uno lo asigna a la tarea y cierra el selector.
6. Poner en el Firestore Emulator, como llegados por otra vía, una tarea por cada cabello suelto (🦰, 🦱, 🦳, 🦲) y otra con 🧑🏻‍🤝‍🧑🏿 (dos tonos): las filas los muestran; al abrir cada tarea en el panel, cambiar la nota y guardar, se guarda y conserva su emoji, sin error.

## Flujo 7: versión nueva

1. Con la app abierta con una versión anterior, publicar la versión con la fuente y el juego de emoji.
2. Cerrar la app y abrirla de nuevo: se ve con Atkinson y Noto, sin que haya aparecido pregunta ni aviso en ningún momento.

## Flujo 8: la instalación no depende de la fuente ni del juego

En todos los casos la pantalla de carga se muestra al abrir y no espera lo que falló: se va antes del tope de 10 s, y nunca impide instalar ni usar la app.

Primera instalación (cada caso en un contexto de navegador nuevo, sin nada guardado):

1. Con **Falla de red** en el juego de emoji, abrir la app, entrar y crear la tarea «Regar» con emoji 🌱. Esperar **App instalada**.
2. Ponerse **Sin conexión** y recargar: la app abre, «Regar» se ve con Atkinson y el 🌱 con el emoji del dispositivo, no en blanco, sin aviso ni mensaje sobre la fuente.
3. Quitar la falla, volver a tener conexión y, si hace falta, cerrar la app y abrirla de nuevo una vez: el 🌱 pasa a Noto sin aviso. Ponerse **Sin conexión** y recargar: el 🌱 sigue con Noto, y también uno que nunca se vio en ese dispositivo (🪼, escrito en un título).
4. En otro contexto nuevo, con **Falla de red** en un archivo de fuente, abrir la app, entrar y crear la tarea. Esperar **App instalada**.
5. Ponerse **Sin conexión** y recargar: la app abre, sin aviso; el texto que usa ese archivo se ve con la fuente del sistema, nunca invisible. El 🌱 se ve con Noto.
6. Quitar la falla, volver a tener conexión y, si hace falta, cerrar la app y abrirla de nuevo una vez. Ponerse **Sin conexión** y recargar: el texto se ve con Atkinson.
7. En otro contexto nuevo, hacer que falle solo el primer pedido de cada archivo de fuente y del juego; los siguientes responden. Abrir la app (la pantalla de carga deja de esperarlos en cuanto fallan, aunque los reintentos sigan), entrar y, si hace falta, cerrarla y abrirla de nuevo una vez: hay más de un pedido registrado de esos archivos. Ponerse **Sin conexión** y recargar: Atkinson y Noto.

Actualización (la versión anterior, sin la fuente ni el juego, como en el Flujo 7):

8. Con la versión anterior instalada, publicar la versión nueva con **Falla de red** en el juego de emoji. Cerrar la app y abrirla de nuevo: se aplica la versión nueva, el texto se ve con Atkinson y los emoji con los del dispositivo, sin pregunta ni aviso en ningún momento.
9. Ponerse **Sin conexión** y recargar: la app abre igual, con Atkinson y el emoji del dispositivo.
10. Quitar la falla y volver a tener conexión: repetir el paso 3 (pasan a Noto y quedan disponibles sin conexión).
11. Repetir 8 a 10 con **Falla de red** en un archivo de fuente en vez del juego: se aplica la versión nueva (los emoji se ven con Noto), el texto que usa ese archivo se ve con la fuente del sistema, y al quitar la falla queda con Atkinson también sin conexión.

## Flujo 9: pantalla de carga

Qué se ve:

1. Con el código de la app demorado, abrir la app: desde lo primero que dibuja se ve la pantalla de carga, sin página en blanco ni contenido vacío antes.
2. Se ve el ícono de la app con pulso, con el nombre accesible «Cargando», y ningún texto visible, indicador de progreso ni giro. Tocarla no hace nada.
3. Con movimiento reducido (`page.emulateMedia({ reducedMotion: 'reduce' })`): el ícono se ve quieto; lo demás es igual.
4. En **Tema claro** y en **Tema oscuro**, y en **Celular** y en **Ancho**: sigue el tema del sistema, sin destello de otro color al irse.

Cuándo aparece:

5. Aparece al abrir, al recargar y al abrir con una versión nueva, y en las tres pantallas de destino (`/`, `/historial`, `/etiquetas`).
6. Con la app abierta, pasarla a segundo plano y volver (abrir otra pestaña y volver, con `visibilitychange`): no aparece.
7. Sin sesión, tocar **Entrar con Google** y completar la entrada: se pasa de la pantalla de entrada a la app sin que aparezca.

Qué espera con sesión:

8. Con la app guardada y todo disponible, recargar: a los 0,4 s sigue abierta, a los 0,5 s se va, y se ve la lista completa.
9. Con Auth demorado, más allá de los 10 s: sigue abierta hasta que Auth responde, y entonces se va.
10. Con cada una de las colecciones (tareas, completados, etiquetas) demorada por turno, 3 s: sigue abierta hasta los 3 s y se va cuando responde.
11. En un contexto nuevo, con Atkinson demorada y después con Noto demorado, 6 s: sigue abierta hasta los 6 s; al irse, el texto y los emoji ya se ven con Atkinson y con Noto, sin haber mostrado un respaldo.
12. Con los datos demorados más de 10 s: se va a los 10 s, sin aviso, y la lista se completa sola al liberarlos.

Sin sesión:

13. Con Atkinson demorada: sigue abierta hasta que llega y da paso a la pantalla de entrada, que no cambió.
14. Con Noto demorado y Atkinson disponible: no lo espera, da paso a la pantalla de entrada a los 0,5 s, y Noto sigue bajando. Si se entra antes de que llegue, los emoji se ven con los del dispositivo y cambian solos al liberarlo.
15. **Sin conexión**, sin Atkinson guardada: se va a los 0,5 s y da paso a la pantalla de entrada, con su mensaje de siempre.

Lo que no va a llegar:

16. Con sesión, **Sin conexión**, y sin el juego guardado: recargar se va a los 0,5 s, sin llegar al tope. La franja "Sin conexión" se ve recién al entrar; en la pantalla de carga no aparece ningún aviso.
17. Con Noto demorado y la pantalla abierta, ponerse **Sin conexión** a los 2 s: se va en ese momento, no a los 10 s.
18. Con **Falla de red** en Noto a los 2 s y los datos demorados 5 s: se va a los 5 s, cuando responden.
19. Con **Falla de red** en Noto y todo lo demás listo: el mínimo vale igual: se va a los 0,5 s, no antes.

Tope de Noto recordado por dispositivo:

20. Con sesión y Noto demorado, llegar al tope de 10 s y entrar a la app con el emoji del dispositivo. Sin que Noto haya llegado, recargar: con los datos listos se va a los 0,5 s, sin esperarlo, y Noto se sigue pidiendo detrás.
21. En un dispositivo B con la misma cuenta, con Noto demorado: sí lo espera hasta el tope (lo recordado no se sincroniza). En el Firestore Emulator no hay ningún documento nuevo con ese dato.
22. Volviendo al primer dispositivo, liberar Noto hasta que quede guardado. Publicar una versión que cambia el juego y demorarlo: la próxima apertura vuelve a esperarlo, hasta el tope. Si llega al tope, la siguiente ya no lo espera.
23. En un contexto nuevo, sin sesión y con Noto demorado, dejar pasar más de 10 s; entrar y recargar: esa apertura con sesión sí espera a Noto, porque el tiempo sin sesión no cuenta.

Versión nueva:

24. Con Atkinson y Noto guardados, publicar una versión que no los cambia y abrirla: no hay ningún pedido nuevo a esos archivos y la pantalla se va a los 0,5 s, con Atkinson y Noto.
