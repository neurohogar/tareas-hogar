# Paquete: primer-paso

Primera feature de la épica E3 de `docs/v3/plan.md` («Primer paso a la vista»): cada tarea puede tener un «primer paso» opcional, una línea con el primer movimiento concreto («Separar la ropa blanca»), que se escribe en el panel y se ve en la fila debajo del título. Los pasos múltiples, mostrados de a uno, quedan para una feature aparte de la misma épica.

## Specs

## Decisiones

- D1 (2026-11-13, analyst, alcance): esta feature cubre solo el campo opcional «primer paso» que se ve en la fila. Los «pasos opcionales para tareas largas, mostrados de a uno» quedan para una feature aparte de la misma épica (`pasos-de-a-uno`), que decide cómo se relacionan con el primer paso, si un paso se marca hecho y qué pasa con el avance al completar o al repetir una periódica. Porque el plan encarga al analyst partir cada épica en features (como la E2, D1 de `estado-sin-culpa`), el primer paso solo se valida por separado («cuántas tareas tienen primer paso») y los pasos traen decisiones propias de estado que el campo no necesita.
- D2 (2026-11-13, analyst, modelo): la tarea suma el campo opcional `primerPaso` (string), para cualquier tipo de tarea y cualquier esfuerzo. Es una sola línea, sin saltos de línea y sin largo máximo; al guardar se recortan los espacios del inicio y del final, y vacío o solo espacios significa **sin primer paso** (el campo no se guarda). Nunca es inválido, así que nunca rechaza un guardado ni marca una pestaña con error. Porque es la regla del texto de una anotación (§4.5) y de la nota (§4.1), y el plan pide no exigirlo ni poner trabas para crear una tarea.
- D3 (2026-11-13, analyst, dónde se edita): en el panel de edición (§6.2), sección **Tarea**, un campo de una línea con la etiqueta «Primer paso», justo debajo del título (con su emoji) y antes de la nota, sin texto de ejemplo. Enter en ese campo guarda, como en todo campo de una línea (§6.2, Teclado en pantalla). Al crear arranca vacío; al editar, con el valor actual. Porque la configuración va en el panel (regla 6 del plan), y el primer paso es lo que concreta el título.
- D4 (2026-11-13, analyst): el primer paso cuenta para **Cambios sin guardar** como cualquier campo: escribir y volver al valor original no cuenta, ni los espacios que **Guardar** recorta; vaciar un primer paso existente sí. Porque es la definición única de «hay cambios» (§6.2).
- D5 (2026-11-13, analyst): no hay forma de marcar el primer paso como hecho ni ningún indicador de avance; completar la tarea no lo borra ni lo cambia, y una periódica que vuelve muestra el mismo primer paso. Posponer, pausar, reanudar, deshacer y cambiar de tipo o de modo no lo tocan. Porque es parte de la definición de la tarea, como la nota, y el plan pide no tratar como fallo una tarea a medio hacer.
- D6 (2026-11-13, analyst): en la fila se ve en su propia línea, debajo del título, en el tamaño y el color de texto secundario del esfuerzo y el horario, sin énfasis ni color propio. Tocarlo es tocar la fila (abre el panel), como los chips; no se edita desde la fila. Porque lo que se configura va en el panel (regla 6) y la fila no gana otro control.
- D7 (2026-11-13, analyst): el primer paso no se ve en el Historial (§6.3), en el aviso de deshacer (§5.4), en Anotaciones (§6.7) ni en el texto copiado. No cambia el estado (§5), el orden de la lista (§6.1), los filtros ni «Solo rápidas». Porque el plan lo pide «en la fila», y el nombre de la tarea (§4.1) sigue siendo emoji y título.
- D8 (2026-11-13, analyst, sincronización): `primerPaso` es un campo independiente de la §4.1: gana el último cambio, por campo, como `nota` (§7). Una edición escribe solo si cambió. Porque es la regla de conflictos de los campos de texto de la tarea.
- D9 (2026-11-13, analyst, tareas existentes): no hay migración. Una tarea guardada sin el campo no tiene primer paso, y su fila y su panel se ven como hoy. Porque «sin el campo» ya significa «sin valor» para los opcionales de la §4.1 (emoji, nota, esfuerzo) y el plan pide que todo lo nuevo arranque en calma.

## Artefactos

## core

## acceptance

## ui

## cleaner · architect · hardener · qa

Trabajan sobre todo lo que cambió la feature (`git diff <base de la feature>`, anotada en `tmp/base-de-feature`); no necesitan sección propia salvo que el gherkin-writer anote algo para ellos acá.

## Log

- L1 (2026-11-13): pedido original del usuario, textual: «Run all remaining features of docs/v3/plan.md through the pipeline in automatic mode», sobre la épica E3 de `docs/v3/plan.md`:

  ### E3. Primer paso a la vista

  - **Problema y persona.** TDAH y TEA. El título de una tarea es abstracto («Ropa»); decidir por dónde empezar es parte del costo de empezar.
  - **Evidencia.** `tdah §1.3A` (moderada e indirecta: ningún ensayo aísla el primer paso); `tea §1` (moderada: no saber cuál es el primer paso paraliza); `tdah §1.2b` (débil: falla formar el plan, no recordarlo); `tdah §2.1` (anecdótica a moderada).
  - **Qué propone.** Un campo opcional «primer paso» que se ve en la fila. Pasos opcionales para tareas largas, mostrados de a uno.
  - **Hipótesis y validación.** Ver el primer movimiento concreto cuesta menos que leer el título. Señal: notas sobre tareas con primer paso, y el campo se sigue llenando después de cuatro semanas. La refuta que escribirlo cueste más de lo que ahorra.
  - **Evitar.** Mostrar la descomposición entera; exigir pasos para crear una tarea; tratar como fallo una tarea con pasos a medio hacer. Demasiadas partes también paralizan (`tea §1`).
  - **Depende de · Tamaño · Riesgos.** Nada · M · La fila gana densidad (la E9 lo compensa).
