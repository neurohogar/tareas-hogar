# Paquete: anotacion

Un gesto de dos toques, siempre en el mismo lugar, para anotar «me sirvió» o «me molestó» con el contexto tomado solo y una línea de texto opcional; y una pantalla para releer las anotaciones propias y copiarlas como texto.

## Specs

## Decisiones

- D1 (2026-11-12, analyst): la entidad y la pantalla se llaman **anotación** / **Anotaciones**, no «nota». Porque «nota» ya es un campo de la tarea (§4.1, §6.2) y usar la misma palabra para dos cosas confunde en la UI y en el spec.
- D2 (2026-11-12, analyst): una anotación guarda el sentido (**Me sirvió** o **Me molestó**, con ese texto literal), el instante (fecha y hora, como `completadoEn`), la pantalla y, si la hay, la tarea, y el texto opcional. Nada más: ni filtros activos, ni pestaña del panel, ni escalas. Porque el pedido nombra exactamente ese contexto y evita escalas de ánimo (`tea §6`).
- D3 (2026-11-12, analyst): el contexto lo toma la app y la persona no lo elige ni lo corrige al anotar. Porque el pedido dice «contexto tomado solo» y elegirlo agrega toques.
- D4 (2026-11-12, analyst): el texto es una sola línea (sin saltos de línea), sin largo máximo; se recortan los espacios del inicio y del final, y vacío o solo espacios significa sin texto. Nunca es inválido. Porque el pedido dice «una línea de texto opcional» y es la misma regla de recorte que la nota de la tarea (§4.1).
- D5 (2026-11-12, analyst): las anotaciones se guardan en la cuenta (Firestore, bajo `users/{uid}`), se sincronizan entre dispositivos y funcionan sin conexión, como los completados: cada una es un documento independiente con id generado en el cliente, así que dos dispositivos sin conexión nunca pierden una. Porque el pedido solo prohíbe enviar algo **fuera** de la cuenta, y el plan lee «el dato que la función ya guarda en la cuenta».
- D6 (2026-11-12, analyst): la app nunca pide una anotación: sin avisos, recordatorios, contadores ni marcas de «sin anotar», y el gesto no cambia de aspecto según cuántas haya. Porque el pedido lo pone en «Evitar» y las reglas 1 y 2 del plan prohíben contadores.
- D7 (2026-11-12, analyst): el gesto no tiene ajuste para ocultarlo y está disponible con sesión iniciada en todas las pantallas de la app (Pendientes, Historial, Etiquetas, Anotaciones y el panel de edición), en celular y en pantallas anchas; no está en la pantalla de entrada ni en la de carga. Porque «siempre en el mismo lugar» pide que esté en todos lados, usarlo ya es opcional (regla 4) y sin sesión no hay cuenta donde guardar.
- D8 (2026-11-12, analyst): anotar no toca la tarea ni el panel: no cuenta como cambio para **Cambios sin guardar**, no cierra el panel ni cambia de pestaña, y no abre ningún aviso de acción. Porque una anotación no es un campo de la tarea.
- D9 (2026-11-12, analyst): si el gesto está abierto (a medio anotar), **Atrás** lo cierra sin anotar, como cualquier cosa abierta encima (§6.2, Atrás), y cerrarlo sin elegir sentido descarta el texto escrito sin preguntar. Porque es una sola línea y pedir confirmación por ella cuesta más que reescribirla.
- D10 (2026-11-12, analyst): al guardarse, la app lo confirma con un texto breve e informativo («Anotación guardada»), sin botones, que se va solo y no tapa el aviso de deshacer (§5.4). Porque la regla 5 del plan pide describir hechos sin felicitar, y sin confirmación no se sabe si el segundo toque contó.
- D11 (2026-11-12, analyst): «pantalla» toma uno de estos valores: Pendientes, Historial, Etiquetas, Anotaciones, o **Panel de edición** (al crear o al editar) si el panel está abierto, sobre cualquier pantalla. Porque son las pantallas de la §6 y el panel es donde se está mirando una tarea.
- D12 (2026-11-12, analyst): la pantalla Anotaciones lista las anotaciones de la más reciente a la más antigua, agrupadas por día local con los mismos encabezados que el Historial (§6.3: Hoy, Ayer, «martes 14 de julio»); cada una muestra la hora `HH:MM`, el sentido, la pantalla, la tarea si la hay y el texto si lo hay. Sin anotaciones muestra «Todavía no hay anotaciones». Porque es la misma forma de releer que ya conoce del Historial.
- D13 (2026-11-12, analyst): el texto copiado tiene una línea por anotación, de la más antigua a la más reciente, con fecha y hora (`2026-07-15 08:05`), sentido, pantalla, tarea y texto (los dos últimos solo si los hay), separados por « · ». Porque es para pegar en una revisión fuera de la app, donde se lee en orden cronológico y se edita a mano.

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
