# QA: anotación

Verifica, solo por la interfaz:

- el botón **Anotar**, arriba y siempre en el mismo lugar, en Pendientes, Historial, Etiquetas, Anotaciones y el panel de edición, en celular y en pantalla ancha; y que no está en la pantalla de entrada ni en la de carga;
- el gesto de dos toques: el recuadro con el campo de texto y los dos botones de sentido, guardar con el texto escrito, la confirmación «Anotación guardada» y que la persona no elige el contexto;
- que anotar no toca el panel ni la tarea, y que **Atrás** cierra el recuadro sin anotar (con el panel abierto y con el panel cerrado);
- la cuarta pestaña **Anotaciones**: la barra de navegación, la lista agrupada por día, el contexto de cada anotación (pantalla y tarea con su nombre actual), el texto de vacío;
- **Editar texto**, **Borrar** (con confirmación y Cancelar) y **Copiar**, también sin conexión;
- el borrado de una tarea con sus anotaciones, y los casos de dos dispositivos (anotación sobre una tarea ya borrada, edición contra borrado);
- que la app nunca pide una anotación: sin avisos, contadores ni marcas.

Cubre spec §2, §3 (Anotación), §4.5, §5.10, §6 (navegación), §6.2 (Atrás y borrar tarea), §6.7 y §7.

Fuera de alcance: las reglas de contexto con todos sus bordes de tiempo, el orden y el formato del texto copiado, que cubren los `.feature` (`features/anotar.feature`, `features/anotaciones.feature`, `features/copiar-anotaciones.feature`, `features/editar-anotacion.feature`, `features/borrar-anotacion.feature`, `features/anotaciones-de-tarea-borrada.feature`).

## Entorno

Igual que `qa/historial-deshacer.md`:

- Firebase Emulator Suite (Auth + Firestore) con datos limpios al inicio de cada flujo.
- Reloj simulado del navegador (`page.clock`) instalado **antes** de abrir la app, en la hora local que indica cada flujo (zona `America/Argentina/Buenos_Aires`). "A las X" es adelantar el reloj hasta X antes del paso. Los pasos que miden segundos del aviso o de la confirmación usan el reloj detenido (`page.clock.pauseAt`) y lo adelantan con `page.clock.runFor` o `fastForward`.
- Sesión iniciada con la cuenta `qa@example.com` del Auth Emulator, salvo el Flujo 1, que arranca sin sesión.
- Crear una tarea: tocar **+**, escribir el título y guardar, con los controles de `qa/puntual.md`. Completar: tocar el checkbox de su fila.
- **Dos dispositivos** (Flujos 11 y 12): dos contextos de navegador independientes, A y B, con la misma cuenta. "B sin conexión" es `browserContext.setOffline(true)`; "B vuelve a tener conexión" es volverlo online y esperar a que las dos pantallas se actualicen solas.
- **Pantalla ancha**: viewport de 1280 × 800; **celular**: 390 × 844.

Semana de referencia: miércoles 2026-07-15 (hoy), martes 14 (ayer).

## Contrato observable

- **Botón Anotar**: un botón con nombre accesible **Anotar**, en la parte de arriba de la pantalla, en la misma posición en todas las pantallas (mismas coordenadas en Pendientes, Historial, Etiquetas y Anotaciones). Con el panel de edición abierto, también está visible en el panel o sobre él, y se puede tocar. No hay ajuste ni opción para ocultarlo.
- **Recuadro**: al tocar **Anotar** aparece un diálogo (rol `dialog`, nombre **Anotar**) con un campo de texto de una línea (rol `textbox`, etiqueta **Texto**, vacío al abrir) y dos botones, **Me sirvió** y **Me molestó**. No tiene otros campos ni selectores de pantalla o tarea.
- **Segundo toque**: tocar **Me sirvió** o **Me molestó** guarda la anotación con el texto escrito y cierra el recuadro.
- **Confirmación**: una región con rol `status` con el texto **Anotación guardada**, sin botones, que desaparece sola (con el reloj simulado: se ve al guardar y no se ve a los 5 s). Si hay un aviso de deshacer visible, los dos se ven a la vez.
- **Navegación**: la barra (rol `navigation`) tiene cuatro enlaces, en este orden: **Pendientes** (`/`), **Historial** (`/historial`), **Etiquetas** (`/etiquetas`) y **Anotaciones** (`/anotaciones`), sin contador ni marca. El de la pantalla actual tiene `aria-current="page"`. Abrir `/anotaciones` directamente (o recargar ahí) muestra la pantalla Anotaciones.
- **Pantalla Anotaciones**: encabezado **Anotaciones**.
  - Cada día con anotaciones es un grupo con un encabezado de nivel 2: **Hoy**, **Ayer** o la fecha en minúsculas ("martes 14 de julio"; con " de 2025" si el año no es el actual). Los grupos y las anotaciones van de la más reciente a la más antigua.
  - Cada anotación (rol `listitem`) muestra la hora `HH:MM` en 24 h, el sentido (**Me sirvió** o **Me molestó**), la pantalla (**Pendientes**, **Historial**, **Etiquetas**, **Anotaciones** o **Panel de edición**), el nombre actual de la tarea («emoji título» o solo el título) si la hay y el texto si lo hay; y los botones **Editar texto** y **Borrar**.
  - Sin anotaciones muestra el texto **Todavía no hay anotaciones**.
  - Un único botón **Copiar** en la pantalla.
- **Editar texto**: abre un campo de una línea con el texto actual (vacío si no tiene) y un botón **Guardar**; guardar cambia solo el texto de esa anotación.
- **Borrar**: abre un diálogo de confirmación con los botones **Borrar** y **Cancelar**.
- **Copiar**: copia al portapapeles (`navigator.clipboard`) un texto con una línea por anotación, de la más antigua a la más reciente, con fecha y hora, sentido, pantalla, nombre de la tarea y texto separados por « · » (la tarea y el texto solo si los hay), y muestra el texto **Anotaciones copiadas**, sin botones, que desaparece solo. El texto se lee con `page.evaluate(() => navigator.clipboard.readText())` con permiso de lectura concedido.
- **Atrás**: el botón Atrás del navegador (`page.goBack()`).

## Flujos

### Flujo 1: dónde está el botón

1. Abrir la app sin sesión. Ver la pantalla de entrada: no hay botón **Anotar**.
2. Recargar con la respuesta de Auth del emulador demorada: mientras se ve la pantalla de carga no hay botón **Anotar**.
3. Iniciar sesión. En celular (390 × 844), recorrer **Pendientes**, **Historial**, **Etiquetas** y **Anotaciones**: en cada una hay un botón **Anotar** arriba, en las mismas coordenadas que en las demás.
4. Repetir el recorrido en pantalla ancha (1280 × 800): el botón está en cada pantalla, arriba, en las mismas coordenadas entre pantallas.
5. Tocar **+**: con el panel de creación abierto, el botón **Anotar** está visible y se puede tocar. Cerrar el panel con la **X**. Abrir una tarea (editar): también está.
6. No existe ninguna opción para ocultar el botón (ni en pantallas ni en ajustes, si los hay).

### Flujo 2: los dos toques

1. En Pendientes, a las 2026-07-15 08:05, tocar **Anotar**: aparece el recuadro con el campo vacío y los botones **Me sirvió** y **Me molestó**, y nada más para elegir.
2. Escribir `quedó lindo` y tocar **Me sirvió**: el recuadro se cierra y aparece **Anotación guardada**. Esperar 5 s: desaparece sola.
3. Tocar la pestaña **Anotaciones**: aparece en **Hoy**: `08:05`, **Me sirvió**, **Pendientes**, `quedó lindo`, sin tarea.
4. Tocar **Anotar** y tocar **Me molestó** sin escribir nada: se guarda sin texto (es válido) y aparece en la lista sin texto, con **Me molestó**.
5. Tocar **Anotar**, escribir `   espacios   ` (con espacios a los lados) y tocar **Me molestó**: en la lista el texto es `espacios`. Repetir con solo espacios: queda sin texto.
6. Tocar **Anotar** y escribir un texto de 300 caracteres: se guarda completo, sin error.
7. Desde Historial, Etiquetas y Anotaciones, anotar una vez en cada una: cada anotación muestra su pantalla (**Historial**, **Etiquetas**, **Anotaciones**).

### Flujo 3: contexto con el panel y con el aviso

1. Crear la tarea `Regar`. Tocar su fila para abrir el panel de edición y, con el panel abierto, tocar **Anotar**, tocar **Me sirvió**: la anotación, en **Anotaciones**, dice **Panel de edición** y nombra `Regar`.
2. Abrir el panel de creación (**+**) y anotar: dice **Panel de edición** y no tiene tarea.
3. Con el panel abierto desde Historial (tocar el título de una entrada), anotar: **Panel de edición**. El panel cubre la barra y solo se abre desde Pendientes o Historial, así que no existe sobre Etiquetas.
4. Cerrar el panel. A las 08:00 completar `Regar` (aparece el aviso con **Deshacer**); a las 08:00:04 anotar en Pendientes: la anotación dice **Pendientes** y nombra `Regar`. Anotar a las 08:00:05 con el aviso ya cerrado: sin tarea.
5. Completar otra tarea `Pagar` y, con su aviso visible, abrir el panel de edición de `Regar` y anotar: la anotación nombra `Regar` (manda el panel). Con el panel de creación abierto y el aviso visible, anotar: sin tarea.
6. Con el aviso de deshacer visible, anotar: al guardar se ve **Anotación guardada** y el aviso con **Deshacer** sigue visible (no lo tapa).

### Flujo 4: anotar no toca la tarea ni el panel

1. Abrir el panel de edición de `Regar`, sin cambiar nada. Anotar con texto: el panel sigue abierto en la misma pestaña, con los mismos valores, y no aparece ningún aviso de cambios ni de acción.
2. Cerrar el panel con la **X**: se cierra sin avisar (no había cambios sin guardar, anotar no cuenta).
3. Abrir el panel, cambiar el título (cambio sin guardar), anotar: el panel sigue abierto con el título cambiado. Tocar la **X**: aparece el aviso de cambios sin guardar como siempre («Tenés cambios sin guardar»; el aviso no lista los campos cambiados).
4. Anotar no cambia de pestaña de pantalla: en Historial, anotar deja la pantalla en Historial. Con el panel abierto en la pestaña **Cuándo**, anotar deja la pestaña **Cuándo**.

### Flujo 5: Atrás y cerrar sin anotar

1. En Pendientes, tocar **Anotar**, escribir `a medias` y tocar **Atrás**: el recuadro se cierra, no aparece **Anotación guardada** y la app sigue en Pendientes. La lista de Anotaciones no tiene la anotación. Tocar **Anotar** de nuevo: el campo está vacío.
2. Tocar **Anotar**, escribir texto y cerrar el recuadro con la tecla `Escape`: se cierra sin guardar y sin preguntar.
3. Con el panel de edición abierto, tocar **Anotar** y **Atrás**: se cierra el recuadro y el panel sigue abierto (el panel no se cierra con ese Atrás). Tocar **Atrás** otra vez: hace lo de siempre con el panel (cerrarlo, o el aviso de cambios sin guardar si los hay).
4. En Historial, con el panel cerrado, tocar **Anotar** y **Atrás**: se cierra el recuadro y la app sigue en Historial. Hacer lo mismo en Etiquetas y Anotaciones.
5. Con el panel cerrado, abrir y cerrar el recuadro con **Atrás** varias veces, y después tocar **Atrás** una vez más: sale de la pantalla como siempre (no hay un **Atrás** de más que no haga nada) y **Adelante** no reabre el recuadro ni el panel.
6. Los diálogos de Historial (borrar un completado) y de Etiquetas (renombrar, borrar) se comportan como antes de la feature con **Atrás**.

### Flujo 6: la pantalla Anotaciones

1. Sin anotaciones, abrir **Anotaciones**: el texto **Todavía no hay anotaciones** y ninguna lista.
2. Crear anotaciones (con el reloj): ayer 2026-07-14 21:30 en Etiquetas con texto `muy lento` (**Me sirvió**); hoy 08:05 en Pendientes, con tarea `Regar` (🌱) y texto `quedó lindo` (**Me sirvió**); hoy 09:10 en Historial, sin tarea y sin texto (**Me molestó**).
3. En **Anotaciones**: grupos **Hoy** (09:10 arriba, 08:05 abajo) y **Ayer** (21:30). Cada anotación muestra hora, sentido, pantalla; la de 08:05 muestra `🌱 Regar` y `quedó lindo`; la de 09:10 no muestra tarea ni texto.
4. Avanzar el reloj al 2026-07-16 00:00: el grupo de las 08:05 y 09:10 pasa a **Ayer** y el de las 21:30 a `martes 14 de julio`. Avanzar a 2027-01-02: el encabezado lleva " de 2026".
5. Renombrar `Regar` a `Plantas` desde su panel: la anotación de 08:05 muestra `🌱 Plantas` (nombre actual).
6. La pestaña **Anotaciones** y la barra no tienen contador ni marca de anotaciones nuevas: no cambian de aspecto después de anotar.

### Flujo 7: editar el texto

1. En **Anotaciones**, tocar **Editar texto** en la anotación de 08:05: el campo muestra `quedó lindo`. Cambiarlo a `quedó mal` y **Guardar**: el texto cambia; hora, sentido, pantalla y tarea no cambian, y el orden y el grupo siguen igual.
2. **Editar texto** en la de 09:10 (sin texto): el campo está vacío. Escribir `  ayer lo vi  ` y guardar: queda `ayer lo vi` (recortado) y nada más cambia.
3. **Editar texto**, vaciar el campo y guardar: queda sin texto (no se muestra texto). Repetir con solo espacios: queda sin texto. Nunca se muestra un error.
4. Recargar la página: los cambios persisten.

### Flujo 8: borrar una anotación

1. Tocar **Borrar** en la anotación de 08:05: aparece el diálogo con **Borrar** y **Cancelar**.
2. Tocar **Cancelar**: el diálogo se cierra y la anotación sigue igual.
3. Tocar **Borrar** otra vez y confirmar con **Borrar**: la anotación desaparece de la lista, las otras quedan, y la tarea `Regar` sigue en Pendientes.
4. Borrar las que quedan: aparece **Todavía no hay anotaciones**.

### Flujo 9: copiar

1. Con una anotación de hoy 08:05 en Pendientes de `Regar` (🌱) con texto `quedó lindo`, y otra de hoy 09:10 en Historial sin tarea ni texto, tocar **Copiar**: aparece **Anotaciones copiadas**, sin botones, que se va solo a los 5 s.
2. El portapapeles tiene exactamente dos líneas, de la más antigua a la más reciente: `2026-07-15 08:05 · Me sirvió · Pendientes · 🌱 Regar · quedó lindo` y `2026-07-15 09:10 · Me molestó · Historial`.
3. Renombrar `Regar` a `Plantas` y copiar de nuevo: la primera línea lleva `🌱 Plantas`.
4. Poner el navegador sin conexión y tocar **Copiar**: funciona igual y muestra **Anotaciones copiadas**.
5. Sin anotaciones, **Copiar** no copia nada: el portapapeles no cambia y no aparece **Anotaciones copiadas**.

### Flujo 10: borrar una tarea borra sus anotaciones

1. Con `Regar` (dos anotaciones), `Pagar` (una anotación) y una anotación sin tarea, borrar `Regar` desde su panel con la confirmación.
2. En **Anotaciones** quedan la de `Pagar` y la que no tiene tarea; las de `Regar` desaparecieron. **Copiar** copia solo esas dos.
3. El Historial también perdió los completados de `Regar`, como siempre.

### Flujo 11: dos dispositivos, anotar sin conexión

1. A y B en la misma cuenta. B sin conexión.
2. A anota **Me sirvió** en Pendientes a las 08:05; B anota **Me molestó** en Historial a las 08:06.
3. B vuelve a tener conexión: las dos pantallas **Anotaciones** muestran las dos anotaciones, ninguna se pierde.

### Flujo 12: dos dispositivos, edición contra borrado y tarea borrada

1. A y B con una anotación de `quedó lindo`. B sin conexión.
2. A edita el texto a `uno`; B edita el texto a `dos` (después). B vuelve a tener conexión: las dos pantallas muestran `dos` (gana el último cambio).
3. B sin conexión de nuevo. A borra la anotación; B edita su texto a `tres`. B vuelve a tener conexión: la anotación no está en ninguna de las dos (borrar gana, la edición no la revive).
4. B sin conexión. A borra la tarea `Regar`. B (sin ver el borrado) anota sobre `Regar`: abre el panel de edición de `Regar`, anota **Me sirvió**. B vuelve a tener conexión: en las dos pantallas **Anotaciones** no se ve esa anotación y **Copiar** no la incluye; las otras anotaciones siguen igual.

### Flujo 13: la app nunca pide

1. Usar la app una semana simulada sin anotar (avanzar el reloj, completar tareas, abrir pantallas): no aparece ningún aviso, recordatorio, contador ni marca de «sin anotar», ni en la barra ni en el botón **Anotar**.
2. Comparar el botón **Anotar** (su apariencia) sin anotaciones y con 20 anotaciones: es idéntico.
