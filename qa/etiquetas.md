# QA: etiquetas y filtro

Verifica, solo por la interfaz:

- la pestaña **Etiquetas** en la barra de navegación;
- elegir etiquetas en el panel: autocompletado, creación al guardar, color asignado, quitar, validación;
- los chips de etiquetas en las filas de Pendientes y su orden;
- el filtro por etiqueta de Pendientes: un chip a la vez, orden por urgencia dentro del filtro (con el reloj simulado), lista vacía, permanencia entre pantallas y vuelta a "Todas" al recargar;
- la pantalla Etiquetas: lista, renombrar, cambiar color y borrar con confirmación;
- los casos de dos dispositivos: cambios por campo, borrado contra edición o asignación, etiquetas duplicadas creadas sin conexión.

Cubre spec §4.1 (etiquetas), §4.3, §6 (navegación), §6.1 (chips y filtro), §6.2 (etiquetas en el panel), §6.4, §7 (etiquetas) y §10 criterio 6.

Fuera de alcance: emoji, nota y PWA.

## Entorno

Igual que `qa/historial-deshacer.md`:

- Firebase Emulator Suite (Auth + Firestore) con datos limpios al inicio de cada flujo.
- Reloj simulado del navegador (`page.clock`) instalado **antes** de abrir la app, en la hora local que indica cada flujo (zona `America/Argentina/Buenos_Aires`).
  - "A las X" significa adelantar el reloj simulado hasta X antes del paso.
  - "Avanzar el reloj a X" significa adelantarlo hasta X y esperar a que la pantalla se actualice sola (sin recargar), salvo que el paso diga "recargar".
- Sesión iniciada con la cuenta `qa@example.com` del Auth Emulator (Flujo 1 de `qa/periodica-relativa.md`).
- Crear una tarea: tocar **+**, escribir el título, elegir la opción de **Se repite** que indica el paso y guardar, con los controles de `qa/puntual.md` y `qa/periodica-calendario.md`. "Con etiquetas X, Y" significa agregarlas en el campo **Etiquetas** antes de guardar, en ese orden (ver "Agregar una etiqueta").
- **Dos dispositivos** (Flujos 14 a 18): dos contextos de navegador independientes, A y B, con la misma cuenta y el mismo reloj simulado.
  - "B sin conexión" significa poner el contexto B offline (`browserContext.setOffline(true)`).
  - "B vuelve a tener conexión" significa volverlo online y esperar a que las dos pantallas se actualicen solas.
- **Mostrar completadas** queda apagado (su valor inicial) en todos los flujos: una tarea completada no tiene fila en Pendientes (`qa/mostrar-completadas.md`).

Semana de referencia: lunes 2026-07-13, martes 14, miércoles 15, jueves 16, viernes 17.

Paleta, en orden: gris, rojo, naranja, amarillo, verde, celeste, azul, violeta.

## Contrato observable

- **Navegación**: la barra (rol `navigation`) de `qa/historial-deshacer.md`, ahora con tres enlaces: **Pendientes** (`/`), **Historial** (`/historial`) y **Etiquetas** (`/etiquetas`).
  - El enlace de la pantalla actual tiene `aria-current="page"` y los otros no.
  - Abrir `/etiquetas` directamente (o recargar ahí) muestra la pantalla Etiquetas.
- **Chip de etiqueta** (en la fila, en el panel y en la pantalla Etiquetas): su nombre accesible es el nombre de la etiqueta y su descripción accesible es el nombre del color (por ejemplo, `rojo`).
- **Fila de Pendientes**: el contrato de `qa/periodica-relativa.md`, más una lista (rol `list`, nombre accesible `Etiquetas`) con un chip (rol `listitem`) por etiqueta de la tarea, en orden alfabético. Sin etiquetas, la fila no tiene esa lista. Tocar un chip de la fila abre el panel, igual que tocar la fila; no filtra.
- **Panel** (crear y editar, `qa/editar-borrar.md`): un campo **Etiquetas** (rol `combobox`) debajo de **Título**.
  - Las etiquetas de la tarea se ven como chips junto al campo, cada uno con un botón **Quitar «<nombre>»**.
  - Al escribir, se abre una lista de sugerencias (rol `listbox`). Sus opciones (rol `option`) son:
    - las etiquetas existentes cuyo nombre contiene lo escrito, sin distinguir mayúsculas ni acentos, sin las que la tarea ya tiene, en orden alfabético;
    - al final, **Crear «<texto escrito sin los espacios del borde>»**, salvo que una etiqueta existente se llame exactamente así (sin distinguir mayúsculas).
  - **Agregar una etiqueta**: escribir el nombre y elegir la opción que corresponde (la existente o **Crear «…»**), o apretar Enter, que elige la existente con ese nombre (sin distinguir mayúsculas) o, si no hay, crea. El campo queda vacío y aparece el chip. Si la tarea ya tiene esa etiqueta, no aparece otro chip.
  - Un chip de una etiqueta todavía no creada (se crea al guardar) se ve igual que los otros, con el color que tendrá.
  - Un nombre de más de 30 caracteres no se puede agregar: Enter o **Crear «…»** muestra el error "El nombre puede tener hasta 30 caracteres" asociado al campo **Etiquetas** y no agrega el chip. Escribir solo espacios no ofrece **Crear** y Enter no hace nada.
- **Filtro**: arriba de la lista de Pendientes, un grupo (rol `group`, nombre accesible `Filtrar por etiqueta`) con botones: **Todas** y uno por etiqueta, en orden alfabético.
  - El elegido tiene `aria-pressed="true"` y los otros `"false"`. Al abrir la app, **Todas** está elegido.
  - Sin etiquetas, el grupo no se ve.
  - Si el filtro deja la lista vacía, se ve el texto "No hay tareas con esta etiqueta".
- **Pantalla Etiquetas**: encabezado **Etiquetas**.
  - Una lista con una entrada (rol `listitem`) por etiqueta, en orden alfabético. Cada entrada muestra el chip de la etiqueta y los botones **Renombrar**, **Cambiar color** y **Borrar**.
  - Sin etiquetas, se ve el texto "Todavía no hay etiquetas" y ninguna entrada.
  - No hay botón para crear etiquetas.
- **Renombrar**: abre un diálogo (rol `dialog`) **Renombrar etiqueta** con el campo **Nombre** cargado con el nombre actual y los botones **Guardar** y **Cancelar**.
  - **Guardar** con un nombre válido cierra el diálogo.
  - Con un nombre inválido, el diálogo sigue abierto, se ve el error asociado al campo y nada cambia:
    - vacío o solo espacios: "El nombre no puede estar vacío";
    - más de 30 caracteres: "El nombre puede tener hasta 30 caracteres";
    - el de otra etiqueta, sin distinguir mayúsculas: "Ya existe una etiqueta con ese nombre".
  - **Cancelar** cierra sin cambios.
- **Cambiar color**: abre un diálogo (rol `dialog`) **Color de «<nombre>»** con un grupo de radios (rol `radiogroup`, nombre `Color`) con los 8 colores de la paleta, en su orden, con el actual elegido, y los botones **Guardar** y **Cancelar**.
- **Confirmación de borrado**: **Borrar** abre un diálogo (rol `alertdialog`) con el texto `¿Borrar la etiqueta «<nombre>»?`, la aclaración "Las tareas no se borran" y los botones **Borrar** y **Cancelar**.

## Flujo 1: navegación y estado sin etiquetas

Precondición: lista vacía, reloj en `2026-07-15T08:00:00`.

1. En **Pendientes**, la barra muestra **Pendientes**, **Historial** y **Etiquetas**; solo **Pendientes** tiene `aria-current="page"`.
2. Crear `Pagar la luz` (**No se repite**, sin fecha límite). No se ve el grupo **Filtrar por etiqueta**. La fila de **Pagar la luz** no tiene lista de etiquetas.
3. Tocar **Etiquetas**: la URL es `/etiquetas`, se ve el encabezado **Etiquetas**, el texto "Todavía no hay etiquetas", y solo **Etiquetas** tiene `aria-current="page"`. No hay botón para crear etiquetas.
4. Recargar en `/etiquetas`: se sigue viendo la pantalla Etiquetas.

## Flujo 2: crear etiquetas desde el panel, con colores de la paleta

Precondición: lista vacía, reloj en `2026-07-15T08:00:00`.

1. Tocar **+**, escribir título `Pagar la luz`, elegir **No se repite**. En **Etiquetas**, escribir `Facturas`: la lista de sugerencias tiene una sola opción, **Crear «Facturas»**. Elegirla: aparece el chip **Facturas** (`gris`) y el campo queda vacío.
2. Escribir `Casa` y apretar Enter: aparece el chip **Casa** (`rojo`). Guardar.
3. La fila de **Pagar la luz** muestra los chips **Casa** (`rojo`), **Facturas** (`gris`), en ese orden.
4. Ir a **Etiquetas**: la lista muestra **Casa** (`rojo`) y **Facturas** (`gris`), en ese orden.
5. Volver a **Pendientes**. Crear `Regar plantas` (**Intervalo** cada `2` **días**) con la etiqueta nueva `Patio`: su chip es **Patio** (`naranja`).
6. El filtro muestra **Todas**, **Casa**, **Facturas**, **Patio**, en ese orden, con **Todas** elegido.

## Flujo 3: autocompletado y etiquetas existentes

Precondición: lista vacía, reloj en `2026-07-15T08:00:00`. Crear `Pagar la luz` (**No se repite**, sin fecha límite) con las etiquetas `Baño`, `Cocina`, `Ropa sucia`.

1. Crear `Regar plantas` (**Intervalo** cada `2` **días**): al escribir `ba` en **Etiquetas**, las sugerencias son **Baño** y **Crear «ba»**.
2. Borrar lo escrito y escribir `BANO`: las sugerencias son **Baño** y **Crear «BANO»** (Baño coincide sin acentos, pero no exactamente).
3. Borrar lo escrito y escribir `cocina`: las sugerencias son solo **Cocina** (sin **Crear**, porque coincide sin distinguir mayúsculas). Apretar Enter: aparece el chip **Cocina**, no `cocina`.
4. Escribir `co`: no se sugiere **Cocina** (la tarea ya la tiene). Escribir `COCINA` y apretar Enter: no aparece otro chip.
5. Escribir `  Sucia ` (con espacios): la sugerencia **Ropa sucia** aparece. Elegirla. Guardar.
6. La fila de **Regar plantas** muestra **Cocina**, **Ropa sucia**. En **Etiquetas** siguen siendo tres: **Baño**, **Cocina**, **Ropa sucia**, con los mismos colores que antes.

## Flujo 4: validación del nombre en el panel

Precondición: lista vacía, reloj en `2026-07-15T08:00:00`. Crear `Pagar la luz` (**No se repite**, sin fecha límite).

1. Abrir **Pagar la luz**. En **Etiquetas**, escribir solo espacios: no hay opción **Crear**; Enter no agrega chips.
2. Escribir `Limpieza profunda del baño 1234` (31 caracteres) y apretar Enter: se ve el error "El nombre puede tener hasta 30 caracteres" en el campo **Etiquetas** y no aparece el chip.
3. Borrar el último carácter (`Limpieza profunda del baño 123`, 30 caracteres) y apretar Enter: aparece el chip y el error ya no se ve.
4. Escribir `  Ropa sucia  ` y elegir **Crear «Ropa sucia»**: el chip se llama **Ropa sucia**. Guardar.
5. En **Etiquetas**: **Limpieza profunda del baño 123** y **Ropa sucia**.

## Flujo 5: las etiquetas se crean solo al guardar

Precondición: lista vacía, reloj en `2026-07-15T08:00:00`. Crear `Pagar la luz` (**No se repite**, sin fecha límite).

1. Abrir **Pagar la luz**, agregar la etiqueta nueva `Cocina` y tocar **Cerrar** y **Descartar** en el aviso. La fila no tiene etiquetas. En **Etiquetas** se ve "Todavía no hay etiquetas".
2. Volver a **Pendientes**, abrir **Pagar la luz**, agregar `Cocina`, borrar el título y guardar: se ve el error de título vacío y el panel sigue abierto. Tocar **Cerrar** y **Descartar** en el aviso.
3. En **Etiquetas** se sigue viendo "Todavía no hay etiquetas". La fila de **Pagar la luz** no tiene etiquetas.

## Flujo 6: quitar etiquetas de una tarea

Precondición: lista vacía, reloj en `2026-07-15T08:00:00`. Crear `Pagar la luz` (**No se repite**, sin fecha límite) con las etiquetas `Baño`, `Cocina`.

1. Abrir **Pagar la luz**: se ven los chips **Baño** y **Cocina**. Tocar **Quitar «Baño»** y guardar. La fila muestra solo **Cocina**.
2. Abrir **Pagar la luz**, tocar **Quitar «Cocina»** y guardar: la fila no tiene lista de etiquetas.
3. En **Etiquetas** siguen **Baño** y **Cocina** (no se borran solas). En **Pendientes**, el filtro sigue mostrando **Todas**, **Baño**, **Cocina**.

## Flujo 7: color de una etiqueta nueva, el menos usado

Precondición: lista vacía, reloj en `2026-07-15T08:00:00`. Crear `Pagar la luz` (**No se repite**, sin fecha límite) con las etiquetas `A`, `B`, `C` (quedan `gris`, `rojo`, `naranja`).

1. En **Etiquetas**, cambiar el color de **A** a `rojo` (ver Flujo 11).
2. Abrir **Pagar la luz** y agregar la etiqueta nueva `D`: su chip es `gris` (gris quedó sin usar). Guardar.
3. En **Etiquetas**, borrar **B** (ver Flujo 12). Quedan A `rojo`, C `naranja`, D `gris`.
4. Agregar a **Pagar la luz** la etiqueta nueva `E`: su chip es `amarillo` (gris, rojo y naranja tienen una cada una; amarillo, ninguna). Guardar.
5. Agregar las etiquetas nuevas `G` y después `F` y guardar: `G` es `verde` y `F` es `celeste` (se asignan en el orden en que se escribieron).

## Flujo 8: orden alfabético de las etiquetas

Precondición: lista vacía, reloj en `2026-07-15T08:00:00`.

1. Crear `Pagar la luz` (**No se repite**, sin fecha límite) con las etiquetas, en este orden: `zapatos`, `Ñoquis`, `árbol`, `Nube`, `baño`, `Bano`.
2. La fila muestra los chips **árbol**, **Bano**, **baño**, **Nube**, **Ñoquis**, **zapatos**, en ese orden.
3. El filtro muestra **Todas**, **árbol**, **Bano**, **baño**, **Nube**, **Ñoquis**, **zapatos**.
4. La pantalla Etiquetas lista las seis en ese mismo orden.

## Flujo 9: filtrar Pendientes por etiqueta

Precondición: lista vacía, reloj en `2026-07-13T08:00:00` (lunes).

1. Crear:
   - `Pagar la luz` (**No se repite**, Fecha límite `2026-07-14`) con las etiquetas `Casa`, `Facturas`;
   - `Basura` (**Días de la semana**: martes y jueves) con la etiqueta `Casa`;
   - `Regar plantas` (**Intervalo** cada `4` **horas**) con la etiqueta `Patio`.
2. A las `2026-07-15T07:00:00`, completar **Regar plantas**. A las `2026-07-15T12:00:00`, recargar. Con **Todas** se ven, en orden: **Pagar la luz** (Atrasada), **Basura** (Atrasada), **Regar plantas** (pendiente).
3. Tocar **Casa** en el filtro: **Casa** tiene `aria-pressed="true"` y los demás `"false"`. Se ven solo **Pagar la luz** y **Basura**, en ese orden.
4. Tocar **Facturas**: solo **Facturas** está elegido; se ve solo **Pagar la luz**.
5. Tocar **Patio**: se ve solo **Regar plantas**. Completarla: queda `en espera`, completada, y con **Mostrar completadas** apagado (su valor inicial) su fila desaparece: se ve "No hay tareas con esta etiqueta" y sigue elegido **Patio**. Avanzar el reloj a `2026-07-15T16:00:00`: **Regar plantas** vuelve a verse, `pendiente`.
6. Tocar **Todas**: se ven, en orden, **Pagar la luz**, **Basura**, **Regar plantas**.

## Flujo 10: lista filtrada vacía, permanencia y recarga

Precondición: lista vacía, reloj en `2026-07-15T08:00:00`. Crear `Pagar la luz` (**No se repite**, sin fecha límite) con la etiqueta `Facturas` y `Regar plantas` (**Intervalo** cada `2` **días**) con la etiqueta `Patio`.

1. Tocar **Facturas** en el filtro y completar **Pagar la luz**: se ve el texto "No hay tareas con esta etiqueta" y **Facturas** sigue en el filtro, elegido.
2. Ir a **Historial**: no hay filtro de etiquetas; se ve el completado de **Pagar la luz**.
3. Ir a **Etiquetas** y volver a **Pendientes**: **Facturas** sigue elegido y se sigue viendo "No hay tareas con esta etiqueta".
4. Recargar: **Todas** está elegido y se ve **Regar plantas**.

## Flujo 11: renombrar y cambiar el color

Precondición: lista vacía, reloj en `2026-07-15T08:00:00`. Crear `Pagar la luz` (**No se repite**, sin fecha límite) con las etiquetas `Baño`, `Cocina` (`gris`, `rojo`).

1. En **Pendientes**, tocar **Cocina** en el filtro.
2. En **Etiquetas**, **Renombrar** **Cocina**: el campo **Nombre** tiene `Cocina`.
   - Escribir `baño` y **Guardar**: error "Ya existe una etiqueta con ese nombre"; el diálogo sigue abierto.
   - Dejarlo vacío y **Guardar**: error "El nombre no puede estar vacío".
   - Escribir `Limpieza profunda del baño 1234` y **Guardar**: error "El nombre puede tener hasta 30 caracteres".
   - **Cancelar**: la lista sigue con **Baño** y **Cocina**.
3. **Renombrar** **Cocina** a `  Comida  ` y **Guardar**: la lista muestra **Baño**, **Comida** (`rojo`).
4. **Renombrar** **Comida** a `COMIDA` y **Guardar**: se acepta; la lista muestra **COMIDA**.
5. **Cambiar color** de **COMIDA**: el diálogo **Color de «COMIDA»** tiene los 8 colores en orden, con `rojo` elegido. Elegir `violeta` y **Cancelar**: sigue `rojo`. Repetir, elegir `violeta` y **Guardar**: el chip es `violeta`.
6. En **Pendientes**: la fila de **Pagar la luz** muestra **Baño**, **COMIDA** (`violeta`); el filtro muestra **Todas**, **Baño**, **COMIDA**, con **COMIDA** elegido.

## Flujo 12: borrar una etiqueta

Precondición: lista vacía, reloj en `2026-07-15T08:00:00`. Crear `Pagar la luz` (**No se repite**, sin fecha límite) con las etiquetas `Baño`, `Cocina`, y `Regar plantas` (**Intervalo** cada `2` **días**) con la etiqueta `Cocina`.

1. En **Pendientes**, tocar **Cocina** en el filtro: se ven las dos tareas.
2. En **Etiquetas**, **Borrar** **Cocina**: el diálogo dice `¿Borrar la etiqueta «Cocina»?` y "Las tareas no se borran". **Cancelar**: **Cocina** sigue.
3. **Borrar** **Cocina** y confirmar con **Borrar**: la lista muestra solo **Baño**.
4. En **Pendientes**: **Todas** está elegido; se ven **Pagar la luz** (chip **Baño**) y **Regar plantas** (sin etiquetas). El filtro muestra **Todas**, **Baño**.
5. En **Etiquetas**, borrar **Baño**: se ve "Todavía no hay etiquetas". En **Pendientes** no se ve el filtro y las dos tareas siguen.

## Flujo 13: las etiquetas persisten

Precondición: lista vacía, reloj en `2026-07-15T08:00:00`. Crear `Pagar la luz` (**No se repite**, sin fecha límite) con las etiquetas `Baño`, `Cocina`.

1. Recargar: la fila muestra **Baño**, **Cocina**, con los mismos colores; la pantalla Etiquetas también.

## Flujo 14: renombrar y recolorear en dos dispositivos

Precondición: lista vacía, reloj en `2026-07-15T08:00:00` en A y en B. En A, crear `Pagar la luz` (**No se repite**, sin fecha límite) con la etiqueta `Cocina` (`gris`). B la ve.

1. B sin conexión. En A, renombrar **Cocina** a `Comida`. En B, cambiar el color de **Cocina** a `violeta`.
2. B vuelve a tener conexión. En A y en B: la etiqueta es **Comida** (`violeta`) y la fila de **Pagar la luz** muestra **Comida** (`violeta`).

## Flujo 15: el campo etiquetas de una tarea, gana el último en llegar

Precondición: lista vacía, reloj en `2026-07-15T08:00:00` en A y en B. En A, crear `Pagar la luz` (**No se repite**, sin fecha límite) con la etiqueta `Cocina`, y `Regar plantas` (**Intervalo** cada `2` **días**) con las etiquetas `Baño`, `Patio`. B las ve.

1. B sin conexión. En A, agregar **Baño** a **Pagar la luz** (queda **Baño**, **Cocina**). En B, agregar **Patio** a **Pagar la luz** (queda **Cocina**, **Patio**).
2. B vuelve a tener conexión. En A y en B, la fila de **Pagar la luz** muestra **Cocina**, **Patio** (el cambio de B llegó último; no se unen).

## Flujo 16: borrar una etiqueta que otro dispositivo usa sin conexión

Precondición: lista vacía, reloj en `2026-07-15T08:00:00` en A y en B. En A, crear `Pagar la luz` (**No se repite**, sin fecha límite) con las etiquetas `Baño`, `Cocina`, y `Regar plantas` (**Intervalo** cada `2` **días**) sin etiquetas. B las ve.

1. B sin conexión. En B, tocar **Cocina** en el filtro. En A, borrar **Cocina**.
2. En B, con el filtro en **Cocina** **Regar plantas** no se ve (no tiene etiquetas): tocar **Todas**, abrir **Regar plantas**, agregar **Cocina** y **Baño** y guardar. Volver a tocar **Cocina** en el filtro y renombrar **Cocina** a `Comida`.
3. B vuelve a tener conexión. En A y en B:
   - la pantalla Etiquetas muestra solo **Baño** (ni **Cocina** ni **Comida**);
   - **Regar plantas** muestra solo **Baño** y **Pagar la luz** solo **Baño**;
   - el filtro muestra **Todas**, **Baño**, y en B **Todas** está elegido.

## Flujo 17: dos dispositivos crean la misma etiqueta sin conexión

Precondición: lista vacía, reloj en `2026-07-15T08:00:00` en A y en B. En A, crear `Pagar la luz` (**No se repite**, sin fecha límite) con la etiqueta `Baño`, y `Regar plantas` (**Intervalo** cada `2` **días**) sin etiquetas. B las ve.

1. B sin conexión. En A, agregar la etiqueta nueva `Cocina` a **Pagar la luz** y guardar (`rojo`). En B, cambiar el color de **Baño** a `rojo`, y después agregar la etiqueta nueva `cocina` a **Regar plantas** y guardar (`gris`).
2. B vuelve a tener conexión. Esperar a que las pantallas se actualicen. En A y en B:
   - la pantalla Etiquetas muestra **Baño** y **una sola** etiqueta más, que es **Cocina** (`rojo`) o **cocina** (`gris`): el nombre y el color de la misma etiqueta original (sobrevive la de id menor, que la UI no muestra);
   - las filas de **Pagar la luz** y **Regar plantas** muestran esa misma etiqueta, una vez cada una;
   - el filtro muestra **Todas**, **Baño** y esa etiqueta; elegirla muestra las dos tareas.

## Flujo 18: dos dispositivos renombran al mismo nombre sin conexión

Precondición: lista vacía, reloj en `2026-07-15T08:00:00` en A y en B. En A, crear `Pagar la luz` (**No se repite**, sin fecha límite) con la etiqueta `Comida`, y `Regar plantas` (**Intervalo** cada `2` **días**) con la etiqueta `Patio`. B las ve.

1. B sin conexión. En A, renombrar **Comida** a `Cocina`. En B, renombrar **Patio** a `cocina`.
2. B vuelve a tener conexión. En A y en B, la pantalla Etiquetas muestra una sola etiqueta, **Cocina** o **cocina**, y las dos filas la muestran.
