# QA: reintento de limpiezas y aviso de copia

Verifica, solo por la interfaz (salvo la lectura auxiliar del emulador que se indica):

- que al tocar **Copiar** en **Anotaciones** y rechazar el navegador la copia, aparece el texto **No se pudo copiar**, breve y neutro, sin botones, que se va solo, y que no cambia nada más;
- que ese texto no tapa el aviso de deshacer, que solo se ve un texto a la vez (el último reemplaza al anterior) y que la persona puede volver a tocar **Copiar**;
- que las dos limpiezas de §7 (completados huérfanos y anotaciones huérfanas) se reintentan al volver la conexión y al cambiar los datos, sin temporizadores y sin que la app avise ni cuente nada.
- que los campos `etiquetas` y `esfuerzo` de una tarea y la colección `etiquetas`, que pueden seguir en los datos, no se ven, no se escriben ni se borran (§7, **Datos que ya no se usan**).

Cubre spec §6.7 (Copiar) y §7 (Limpiezas y reintentos, Datos que ya no se usan).

Fuera de alcance: qué elementos se intentan y cuáles quedan por limpiar (cada elemento por separado, las dos limpiezas), que cubre `features/reintento-de-limpiezas.feature`; el texto copiado cuando funciona, que cubre `features/copiar-anotaciones.feature` y `qa/anotacion.md` (Flujo 9).

## Entorno

Igual que `qa/anotacion.md`:

- Firebase Emulator Suite (Auth + Firestore) con datos limpios al inicio de cada flujo; sesión con `qa@example.com`.
- Reloj simulado del navegador (`page.clock`) instalado **antes** de abrir la app, en `America/Argentina/Buenos_Aires`; semana de referencia: miércoles 2026-07-15 (hoy). Los pasos que miden segundos usan el reloj detenido (`page.clock.pauseAt`) y lo adelantan con `page.clock.runFor`.
- **Dos dispositivos**: dos contextos de navegador A y B con la misma cuenta; "B sin conexión" es `browserContext.setOffline(true)`; "B vuelve a tener conexión" es volverlo online y esperar a que las pantallas se actualicen solas.
- **Rechazo del portapapeles**: un script de inicio (`page.addInitScript`) que hace que `navigator.clipboard.writeText` rechace con un error (`NotAllowedError`), y otro que lo deja funcionar. "El portapapeles rechaza" y "el portapapeles funciona" se refieren a ellos; cambiar de uno al otro es recargar la página con el otro script (las anotaciones persisten).
- **Fallo de una limpieza**: las limpiezas de huérfanos confirman con el servidor antes de borrar, así que fallan cuando no hay conexión. "Cortar la conexión durante el intento" es: con la red de B demorada (CDP `Network.emulateNetworkConditions` con latencia de 3 s), esperar a que llegue el dato huérfano y poner `setOffline(true)` antes de que termine el intento.
- **Lectura auxiliar**: la interfaz no muestra las huérfanas, así que su limpieza solo se comprueba leyendo el emulador (REST de Firestore Emulator, `GET /v1/projects/<id>/databases/(default)/documents/users/<uid>/anotaciones`, y lo mismo con `completados`).
- **Celular**: 390 × 844.

## Contrato observable

- **Aviso de copia rechazada**: una región con rol `status` con el texto exacto **No se pudo copiar** (sin más palabras), sin botones, que desaparece sola (con el reloj simulado: se ve al fallar y no se ve a los 5 s). Es el mismo tipo de texto que **Anotaciones copiadas**: misma región, misma posición.
- **Un texto a la vez**: nunca hay dos regiones `status` de copia visibles; el último texto reemplaza al anterior.
- **Aviso de deshacer**: el aviso con **Deshacer** (§5.4) sigue visible y tocable mientras se ve **No se pudo copiar**.
- **Limpiezas silenciosas**: durante los reintentos no aparece ningún texto, contador, marca ni franja distinta de "Sin conexión" (la franja de conexión es la de siempre).

## Flujos

### Flujo 1: el portapapeles rechaza la copia

1. Con la tarea `Regar` y una anotación de hoy 08:05 en Pendientes con el texto `quedó lindo`, abrir **Anotaciones** con el portapapeles rechazando.
2. Tocar **Copiar**: aparece **No se pudo copiar**, sin botones. No aparece **Anotaciones copiadas**.
3. La lista de anotaciones sigue exactamente igual, la pantalla sigue en **Anotaciones** y no se abre ningún diálogo ni aviso más. El portapapeles no cambió (con permiso de lectura, `readText()` devuelve lo que tenía antes).
4. Con el reloj detenido, adelantar 4 s: el texto se sigue viendo. A los 5 s: desaparece solo.

### Flujo 2: volver a tocar Copiar

1. Con el portapapeles rechazando, tocar **Copiar**: aparece **No se pudo copiar**.
2. Sin esperar, tocar **Copiar** otra vez: se ve un solo **No se pudo copiar** (no dos), y desaparece 5 s después del último toque.
3. Recargar con el portapapeles funcionando y tocar **Copiar**: aparece **Anotaciones copiadas** y el portapapeles tiene la línea de la anotación. Con el rechazo de nuevo, tocar **Copiar** mientras se ve **Anotaciones copiadas**: se ve solo **No se pudo copiar** (reemplaza al anterior), y al revés: con **No se pudo copiar** visible, un **Copiar** que funciona deja solo **Anotaciones copiadas**.
4. La app no copia sola en ningún momento: tras el rechazo, sin tocar nada, el portapapeles no cambia aunque pasen minutos.

### Flujo 3: no tapa el aviso de deshacer

1. En Pendientes, a las 08:00 completar `Pagar`: aparece el aviso con **Deshacer**.
2. A las 08:00:02 abrir **Anotaciones** (con el aviso aún visible) y tocar **Copiar** con el portapapeles rechazando: se ven **No se pudo copiar** y el aviso con **Deshacer**, a la vez y sin superponerse.
3. Tocar **Deshacer** mientras se ve el texto: deshace el completado como siempre.
4. En celular (390 × 844) repetir 1 y 2: los dos se ven y el aviso se puede tocar.

### Flujo 4: reintento de una huérfana al volver la conexión

1. A y B con la misma cuenta, con la tarea `Regar` y una anotación sobre `Regar` creada por A. B abre la app.
2. B sin conexión. A borra `Regar` (sus anotaciones se borran con ella) y, para dejar una huérfana, A anota sin conexión sobre `Regar` desde su panel abierto antes del borrado: cuando A vuelve a tener conexión llega una anotación cuya tarea no existe.
3. Cortar la conexión de B durante el intento de limpiarla (ver Entorno). La anotación huérfana no se ve en **Anotaciones** de B ni en la de A, y el emulador todavía la tiene (lectura auxiliar).
4. B vuelve a tener conexión: sin tocar nada, la anotación huérfana desaparece del emulador (lectura auxiliar). No se ve ningún texto, contador ni indicador en B durante todo el proceso, y **Copiar** no la incluye en ningún momento.
5. Repetir 2 a 4 sin reconectar B pero provocando un cambio de datos: con B todavía sin conexión, B anota un `Me sirvió` (cambia sus datos); la huérfana no se limpia mientras no haya conexión. B vuelve a tener conexión: se limpia.

### Flujo 5: una falla no impide limpiar las demás

1. Con tres anotaciones huérfanas de tres tareas borradas (por el mismo camino del Flujo 4) y B sin conexión durante el primer intento, B vuelve a tener conexión: las tres se limpian (lectura auxiliar), también si la conexión se cortó durante el intento de la primera o la segunda.
2. Repetir con completados huérfanos: B sin conexión completa `Regar` mientras A la borra; al volver B a tener conexión, el completado huérfano se limpia (lectura auxiliar) y el Historial de B nunca lo mostró.
3. En ningún momento aparecen avisos ni contadores de pendientes.

### Flujo 6: sin temporizadores

1. Con una huérfana que quedó sin limpiar porque B estaba sin conexión (Flujo 4, paso 3), dejar B con conexión pero sin cambiar datos, detener el reloj y adelantarlo 1 hora (`page.clock.runFor`): no hay reintento por tiempo (el estado del emulador no cambia por el solo paso del tiempo simulado).
2. Hacer que cambien los datos (A edita una tarea y B la recibe): ahí sí se reintenta y la huérfana se limpia (lectura auxiliar).

### Flujo 7: datos que ya no se usan

Precondición: reloj en `2026-07-15T08:00:00`, un dispositivo, sesión iniciada. Como en la lectura auxiliar, el emulador se lee y se escribe por su REST (`PATCH` y `GET` sobre `/v1/projects/<id>/databases/(default)/documents/users/<uid>/...`); es la única forma de dejar datos de antes de esta versión.

1. Crear `Regar` con **Intervalo** cada `2` **días** y `Pagar` con **No se repite**. Con el REST, agregar al documento de `Regar` en `tareas` los campos `etiquetas` = `["x"]` y `esfuerzo` = `"media"`, y crear un documento en la colección `etiquetas` (`nombre` = `Casa`, `color` = `rojo`). Recargar.
2. La app se ve igual que sin esos datos: la fila de `Regar` no muestra chips ni nivel de esfuerzo, Pendientes no tiene filtro por etiqueta ni **Solo rápidas**, la barra tiene **Pendientes**, **Historial** y **Anotaciones**, y no aparece ningún aviso.
3. Abrir `Regar`: el panel no tiene **Etiquetas** ni **Esfuerzo**. Cambiar el título a `Regar plantas` y **Guardar**. Leer el documento (lectura auxiliar): `titulo` es `Regar plantas` y `etiquetas` (`["x"]`) y `esfuerzo` (`"media"`) siguen intactos.
4. Abrir `Regar plantas`, cambiar **Se repite** a **No se repite** y **Guardar**. Leer el documento: ya no tiene los campos de la recurrencia y sigue con `etiquetas` y `esfuerzo` intactos.
5. Leer la colección `etiquetas`: el documento `Casa` sigue ahí, sin cambios, y las anotaciones existentes tampoco cambiaron. Borrar `Regar plantas` desde su panel: el documento desaparece de `tareas`; el de `etiquetas` sigue.
