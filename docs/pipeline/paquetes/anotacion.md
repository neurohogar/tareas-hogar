# Paquete: anotacion

Un gesto de dos toques, siempre en el mismo lugar, para anotar «me sirvió» o «me molestó» con el contexto tomado solo y una línea de texto opcional; y una cuarta pestaña, **Anotaciones**, para releer las anotaciones propias, corregir su texto, borrarlas y copiarlas todas como texto.

## Specs

- **S1** (§2): «Anotaciones «me sirvió / me molestó» con un gesto de dos toques, y una pantalla para releerlas, corregir su texto, borrarlas y copiarlas (§5.10, §6.7).»
- **S2** (§3): «| **Anotación** | Registro de «me sirvió» o «me molestó» con su contexto y una línea de texto opcional (§4.5). No es la **nota** de una tarea (§4.1). |»
- **S3** (§4.5): «| `sentido` | `Me sirvió` \| `Me molestó` | sí | Con ese texto literal. |»
- **S4** (§4.5): «| `pantalla` | `Pendientes` \| `Historial` \| `Etiquetas` \| `Anotaciones` \| `Panel de edición` | sí | Dónde estaba la persona (§5.10). |»
- **S5** (§4.5): «| `tareaId` | id | no | Referencia a la tarea, si la hay (§5.10). No se copia su nombre: se muestra el nombre actual. |»
- **S6** (§4.5): «**Texto**: una sola línea, sin saltos de línea y sin largo máximo. Al guardar se recortan los espacios del inicio y del final. Vacío o solo espacios significa **sin texto** (el campo no se guarda). Un texto nunca es inválido.»
- **S7** (§4.5): «Una anotación no guarda ni los filtros activos, ni la pestaña del panel, ni escalas de ánimo. Solo el texto se puede cambiar después (§6.7); el sentido, `anotadaEn`, la pantalla y la tarea quedan fijos.»
- **S8** (§5.10): «**Dónde**: un botón chico **Anotar**, arriba, siempre en el mismo lugar, en Pendientes, Historial, Etiquetas, Anotaciones y el panel de edición (al crear y al editar), en celular y en pantallas anchas. Con sesión iniciada; no está en la pantalla de entrada (§6.5) ni en la de carga (§6.6). No hay ajuste para ocultarlo.»
- **S9** (§5.10): «**Los dos toques**: el primero abre un recuadro con el campo de texto (una línea, opcional) y los dos botones de sentido, **Me sirvió** y **Me molestó**; el segundo, tocar un sentido, guarda la anotación con el texto escrito (§4.5) y cierra el recuadro. La persona no elige ni corrige el contexto.»
- **S10** (§5.10): «`pantalla` = el **Panel de edición** si el panel está abierto (al crear o al editar), sobre cualquier pantalla; si no, la pantalla donde está: Pendientes, Historial, Etiquetas o Anotaciones.»
- **S11** (§5.10): «`tareaId`: si el panel está abierto al **editar** una tarea, esa tarea; si no, si el aviso de deshacer (§5.4) está visible, la tarea que nombra; si no, ninguna. Con el panel abierto al **crear** no hay tarea, y con el panel abierto manda la tarea del panel aunque haya un aviso de deshacer visible.»
- **S12** (§5.10): «**No toca la tarea ni el panel**: anotar no es un cambio para **Cambios sin guardar** (§6.2), no cierra el panel, no cambia de pestaña ni abre ningún aviso de acción.»
- **S13** (§5.10): «**Cerrar sin anotar**: **Atrás** cierra el recuadro (§6.2, Atrás); cerrarlo sin elegir un sentido descarta el texto escrito sin preguntar, y no guarda nada.»
- **S14** (§5.10): «**Confirmación**: al guardarse, un texto breve e informativo, «Anotación guardada», sin botones, que se va solo y no tapa el aviso de deshacer (§5.4).»
- **S15** (§5.10): «**Nunca se pide**: no hay avisos, recordatorios, contadores ni marcas de «sin anotar», y el gesto no cambia de aspecto según cuántas anotaciones haya.»
- **S16** (§5.10): «**Borrar una tarea** borra también sus anotaciones, en el mismo borrado que sus completados (§6.2, §7). Una anotación cuya tarea ya no existe no se muestra ni se copia y la app la limpia al detectarla (§7). Las anotaciones sin tarea no se ven afectadas.»
- **S17** (§6): «**Navegación**: una barra fija con cuatro pestañas, en este orden: **Pendientes** (ruta `/`), **Historial** (ruta `/historial`), **Etiquetas** (ruta `/etiquetas`) y **Anotaciones** (ruta `/anotaciones`), sin contador ni marca de anotaciones nuevas. La pestaña de la pantalla actual se ve elegida.»
- **S18** (§6.2): «Al borrar una tarea **se borran también todos sus completados** (y solo los suyos), así que desaparecen del historial, y **todas sus anotaciones** (y solo las suyas, §5.10), que desaparecen de la pantalla Anotaciones.»
- **S19** (§6.2): «el recuadro de **Anotar** (§5.10) se cierra sin anotar.»
- **S20** (§6.2): «Con el panel cerrado, **Atrás** hace lo de hoy: cerrar el panel con la **X**, con **Guardar** o con una acción no deja un **Atrás** de más que no haga nada, y **Adelante** no reabre un panel. Los diálogos de Historial y de Etiquetas (§6.3, §6.4) no cambian con esta feature. Con el panel cerrado y el recuadro de **Anotar** abierto, **Atrás** lo cierra y no sale de la pantalla donde está.»
- **S21** (§6.7): «Lista de todas las anotaciones con tarea existente o sin tarea, de la más reciente a la más antigua por `anotadaEn` (si dos tienen el mismo, primero la de `id` menor), agrupadas por **día local** con los mismos encabezados del Historial (§6.3: **Hoy**, **Ayer**, «martes 14 de julio»).»
- **S22** (§6.7): «Cada anotación muestra la hora `HH:MM`, el sentido, la pantalla, el **nombre actual** de la tarea si la hay (emoji y título, §4.1; la anotación no guarda el nombre) y el texto si lo hay.»
- **S23** (§6.7): «No muestra las anotaciones huérfanas (§7) ni las de tareas borradas (§6.2).»
- **S24** (§6.7): «Sin anotaciones, muestra el texto "Todavía no hay anotaciones".»
- **S25** (§6.7): «**Editar texto**: cada anotación tiene la acción **Editar texto**, que cambia solo el texto con las reglas de §4.5 (vaciarlo la deja sin texto). El sentido, `anotadaEn`, la pantalla y la tarea no cambian.»
- **S26** (§6.7): «**Borrar**: cada anotación tiene la acción **Borrar**. Pide confirmación en un diálogo con **Borrar** y **Cancelar**; Cancelar no cambia nada.»
- **S27** (§6.7): «**Copiar**: un único botón **Copiar** copia como texto todas las anotaciones que la pantalla muestra, y funciona sin conexión. El texto tiene una línea por anotación, de la más antigua a la más reciente (si empatan, primero la de `id` menor), con fecha y hora, sentido, pantalla, nombre actual de la tarea y texto, separados por « · »; el nombre de la tarea y el texto solo si los hay. Ejemplo: `2026-07-15 08:05 · Me sirvió · Pendientes · 🌱 Regar · quedó lindo`, y sin tarea ni texto: `2026-07-15 09:10 · Me molestó · Historial`. Sin anotaciones no hay nada para copiar. Al copiar, un texto breve e informativo («Anotaciones copiadas»), sin botones, que se va solo.»
- **S28** (§7): «`users/{uid}/anotaciones/{anotacionId}`»
- **S29** (§7): «Anotaciones: son documentos independientes con id generado en el cliente, así que **una anotación nunca se pierde** aunque dos dispositivos anoten sin conexión. Funcionan sin conexión y se sincronizan como los completados. El texto es un campo como los de una tarea: si dos dispositivos lo editan, **gana el último cambio**. **Borrar gana sobre editar**: una edición de una anotación ya borrada no la revive.»
- **S30** (§7): «**Anotaciones de una tarea borrada**: se borran en ese mismo `writeBatch`. Si otro dispositivo, sin conexión, anota sobre una tarea que ya se borró, queda una anotación huérfana: la pantalla Anotaciones y **Copiar** la ignoran, y la app la limpia al detectarla, como un completado huérfano.»

## Decisiones

- D1 (2026-11-12, analyst): la entidad y la pantalla se llaman **anotación** / **Anotaciones**, no «nota». Porque «nota» ya es un campo de la tarea (§4.1, §6.2) y usar la misma palabra para dos cosas confunde en la UI y en el spec.
- D2 (2026-11-12, analyst): una anotación guarda el sentido (**Me sirvió** o **Me molestó**, con ese texto literal), el instante (fecha y hora, como `completadoEn`), la pantalla y, si la hay, la tarea (como referencia a la tarea, sin copiar su nombre: D18), y el texto opcional. Nada más: ni filtros activos, ni pestaña del panel, ni escalas. Porque el pedido nombra exactamente ese contexto y evita escalas de ánimo (`tea §6`).
- D3 (2026-11-12, analyst): el contexto lo toma la app y la persona no lo elige ni lo corrige al anotar. Porque el pedido dice «contexto tomado solo» y elegirlo agrega toques.
- D4 (2026-11-12, analyst): el texto es una sola línea (sin saltos de línea), sin largo máximo; se recortan los espacios del inicio y del final, y vacío o solo espacios significa sin texto. Nunca es inválido. Porque el pedido dice «una línea de texto opcional» y es la misma regla de recorte que la nota de la tarea (§4.1).
- D5 (2026-11-12, analyst): las anotaciones se guardan en la cuenta (Firestore, bajo `users/{uid}`), se sincronizan entre dispositivos y funcionan sin conexión, como los completados: cada una es un documento independiente con id generado en el cliente, así que dos dispositivos sin conexión nunca pierden una. Porque el pedido solo prohíbe enviar algo **fuera** de la cuenta, y el plan lee «el dato que la función ya guarda en la cuenta».
- D6 (2026-11-12, analyst): la app nunca pide una anotación: sin avisos, recordatorios, contadores ni marcas de «sin anotar», y el gesto no cambia de aspecto según cuántas haya. Porque el pedido lo pone en «Evitar» y las reglas 1 y 2 del plan prohíben contadores.
- D7 (2026-11-12, analyst): el gesto no tiene ajuste para ocultarlo y está disponible con sesión iniciada en todas las pantallas de la app (Pendientes, Historial, Etiquetas, Anotaciones y el panel de edición), en celular y en pantallas anchas; no está en la pantalla de entrada ni en la de carga. Porque «siempre en el mismo lugar» pide que esté en todos lados, usarlo ya es opcional (regla 4) y sin sesión no hay cuenta donde guardar.
- D8 (2026-11-12, analyst): anotar no toca la tarea ni el panel: no cuenta como cambio para **Cambios sin guardar**, no cierra el panel ni cambia de pestaña, y no abre ningún aviso de acción. Porque una anotación no es un campo de la tarea.
- D9 (2026-11-12, analyst): si el gesto está abierto (a medio anotar), **Atrás** lo cierra sin anotar, como cualquier cosa abierta encima (§6.2, Atrás), y cerrarlo sin elegir sentido descarta el texto escrito sin preguntar. Porque es una sola línea y pedir confirmación por ella cuesta más que reescribirla.
- D10 (2026-11-12, analyst): al guardarse, la app lo confirma con un texto breve e informativo («Anotación guardada»), sin botones, que se va solo y no tapa el aviso de deshacer (§5.4). Porque la regla 5 del plan pide describir hechos sin felicitar, y sin confirmación no se sabe si el segundo toque contó.
- D11 (2026-11-12, analyst): «pantalla» toma uno de estos valores: Pendientes, Historial, Etiquetas, Anotaciones, o **Panel de edición** (al crear o al editar) si el panel está abierto, sobre cualquier pantalla. Porque son las pantallas de la §6 y el panel es donde se está mirando una tarea.
- D12 (2026-11-12, analyst): la pantalla Anotaciones lista las anotaciones de la más reciente a la más antigua, agrupadas por día local con los mismos encabezados que el Historial (§6.3: Hoy, Ayer, «martes 14 de julio»); cada una muestra la hora `HH:MM`, el sentido, la pantalla, el nombre actual de la tarea si la hay (§4.1, D18) y el texto si lo hay. Sin anotaciones muestra «Todavía no hay anotaciones». Porque es la misma forma de releer que ya conoce del Historial.
- D13 (2026-11-12, analyst): el texto copiado tiene una línea por anotación, de la más antigua a la más reciente, con fecha y hora (`2026-07-15 08:05`), sentido, pantalla, nombre actual de la tarea y texto (los dos últimos solo si los hay), separados por « · ». Porque es para pegar en una revisión fuera de la app, donde se lee en orden cronológico y se edita a mano.
- D14 (2026-11-12, usuario, dónde vive el gesto): «Botón chico arriba (Recomendado)»
- D15 (2026-11-12, usuario, cómo son los dos toques): «Recuadro con sentido y texto (Recomendado)»
- D16 (2026-11-12, usuario, cuándo hay tarea en el contexto): «Panel abierto o aviso de deshacer (Recomendado)»
- D17 (2026-11-12, usuario, cómo se llega a Anotaciones): «Cuarta pestaña»
- D18 (2026-11-12, usuario, nombre de la tarea y qué pasa si se borra): «Nombre actual, se borra con la tarea»
- D19 (2026-11-12, usuario, borrar o editar): «Borrar y editar el texto»
- D20 (2026-11-12, usuario, qué copia «copiar como texto»): «Todas, un solo botón (Recomendado)»
- D21 (2026-11-12, analyst): por D17, la barra de navegación (§6) pasa a cuatro pestañas: **Pendientes**, **Historial**, **Etiquetas** y **Anotaciones** (ruta `/anotaciones`), en ese orden, sin contador ni marca de anotaciones nuevas. Porque la pestaña nueva se agrega al final sin mover las que ya se conocen, y D6 prohíbe contadores.
- D22 (2026-11-12, analyst): por D18, la anotación guarda una referencia a la tarea y no su nombre; borrar una tarea borra también sus anotaciones, en el mismo borrado que sus completados (§6.2, §7). Una anotación cuya tarea ya no existe (otro dispositivo sin conexión anotó sobre una tarea ya borrada) no se muestra ni se copia y la app la limpia al detectarla, como un completado huérfano (§7). Las anotaciones sin tarea no se ven afectadas. Porque es la misma regla que los completados, que el usuario eligió como modelo.
- D23 (2026-11-12, analyst): por D19, cada anotación de la pantalla Anotaciones tiene **Editar texto** y **Borrar**. Editar cambia solo el texto, con las reglas de D4 (vaciarlo la deja sin texto); el sentido, el instante, la pantalla y la tarea no cambian. Borrar pide confirmación, con **Borrar** y **Cancelar**, como en el Historial (§6.3). Si dos dispositivos editan el texto, gana el último cambio, como los campos de una tarea (§7); borrar gana sobre editar (§7, gana el borrado). Esto reemplaza lo dicho en la pregunta P6 de que lo anotado «no se reescribe»: con D19, solo el contexto queda fijo.
- D24 (2026-11-12, analyst): por D20, **Copiar** está en la pantalla Anotaciones, copia todas las anotaciones que la pantalla muestra con el formato de D13 y funciona sin conexión; sin anotaciones no hay nada para copiar. La app confirma la copia con un texto breve e informativo, como D10. Porque es el único botón de la pantalla y lo copiado no sale de la cuenta hasta que la persona lo pega.

## Artefactos

## core

## acceptance

## ui

## cleaner · architect · hardener · qa

## Log

- L1 (2026-11-12): pedido original del usuario, textual:

  ### E1. Anotación «me sirvió / me molestó»

  - **Problema y persona.** Todas. El plan descansa en inferencias; sin un registro barato de qué funciona, se evalúa de memoria.
  - **Evidencia.** `aacc H1` (fuerte en que la base es escasa); `aacc H12` (moderada: la tecnología para TDAH se diseña sin sus usuarios); `tea`, pregunta abierta 7.
  - **Qué propone.** Un gesto de dos toques, siempre en el mismo lugar: sentido, contexto tomado solo (pantalla y, si la hay, tarea), fecha y una línea de texto opcional. Una pantalla para releer las notas propias y copiarlas como texto.
  - **Hipótesis y validación.** Un gesto así de corto se usa de forma espontánea lo suficiente como para decidir. Cero notas a las cuatro semanas significa que es caro o está escondido.
  - **Evitar.** Que la app pida opinión: es una queja repetida en apps del rubro (`hogar` Parte B, Tiimo; anecdótica). Escalas de ánimo (`tea §6`, moderada). Enviar algo fuera de la cuenta. En la etapa 2, mostrar las notas de una persona a la otra.
  - **Depende de · Tamaño · Riesgos.** La migración · S · El silencio; se compensa con una revisión periódica fuera de la app, con las notas que cada persona decida compartir.
