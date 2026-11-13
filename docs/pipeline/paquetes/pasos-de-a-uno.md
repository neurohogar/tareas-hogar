# Paquete: pasos-de-a-uno

Segunda feature de la épica E3 de `docs/v3/plan.md` («Primer paso a la vista»): pasos opcionales para tareas largas, mostrados de a uno. Complementa el campo «primer paso» de la feature `primer-paso`.

## Specs

## Decisiones

- D1 (2026-11-13, analyst, alcance): esta feature cubre los «pasos opcionales para tareas largas, mostrados de a uno» de la E3 y cierra la épica. No cambia el estado (§5), el orden de la lista (§6.1), los filtros ni **Solo rápidas**, y el nombre de la tarea (§4.1) sigue siendo emoji y título. Porque D1 de `primer-paso` dejó para esta feature justamente los pasos, y el plan pide que la E3 no toque las reglas de estado (la E7, que sí las toca, depende de la E3 y usará «su paso actual»).
- D2 (2026-11-13, analyst, opcional): los pasos son opcionales para cualquier tipo de tarea y cualquier esfuerzo; una tarea sin pasos se crea, se ve y se edita como hoy, y una tarea guardada sin pasos no tiene pasos (no hay migración). Porque el plan pide no exigir pasos para crear una tarea (E3, «Evitar»; regla 4) y es la regla de `primerPaso` (D9 de `primer-paso`).
- D3 (2026-11-13, analyst, texto de cada paso): cada paso sigue la regla de texto del primer paso (§4.1): una sola línea, sin saltos de línea y sin largo máximo, se recortan los espacios del inicio y del final al guardar, y un paso vacío o de solo espacios no se guarda (se descarta al guardar, sin error). Un paso nunca es inválido: nunca rechaza la creación ni la edición. Porque es la regla del primer paso, de la que los pasos son la extensión, y el plan pide no poner trabas.
- D4 (2026-11-13, analyst, en qué filas se ve): el paso que la fila muestra sigue la regla de D10 y D13 de `primer-paso` (§6.1): solo en las filas `pendiente` y `atrasada`, decidido con el estado de cada momento, nunca en `en espera` (pospuestas y completadas incluidas) ni en pausadas; una `atrasada` con el checkbox deshabilitado por su ventana lo muestra. Se ve completo, en varias líneas si hace falta, en texto secundario sin énfasis ni color propio. Porque es la misma línea de la fila que ya existe y el usuario ya eligió esa regla.
- D5 (2026-11-13, analyst, lo que no se ve): los pasos y su avance no se ven en el Historial (§6.3), en el aviso de deshacer (§5.4), en Anotaciones (§6.7) ni en el texto copiado. La fila nunca muestra la lista entera. Porque es D7 de `primer-paso` y el plan pide no mostrar la descomposición entera.
- D6 (2026-11-13, analyst, acciones que no los tocan): posponer, quitar posponer, pausar, reanudar y cambiar de tipo o de modo no borran ni cambian los pasos. Porque son parte de la definición de la tarea, como la nota y el primer paso (D5 de `primer-paso`). Qué pasa con el avance al completar y al deshacer se pregunta (P4).
- D7 (2026-11-13, analyst, Cambios sin guardar): editar los pasos en el panel cuenta para **Cambios sin guardar** con la definición única de la §6.2: escribir y volver al valor original no cuenta, ni los espacios que **Guardar** recorta ni un paso vacío que **Guardar** descarta; agregar, quitar o cambiar un paso sí. Porque es la definición única de «hay cambios».

## Artefactos

## core

## acceptance

## ui

## cleaner · architect · hardener · qa

Trabajan sobre todo lo que cambió la feature (`git diff <base de la feature>`, anotada en `tmp/base-de-feature`); no necesitan sección propia salvo que el gherkin-writer anote algo para ellos acá.

## Log

- L1 (2026-11-13): pedido original del usuario, textual: «dale, seguí con pasos-de-a-uno», sobre la épica E3 de `docs/v3/plan.md`, cuya parte pendiente dice: «Pasos opcionales para tareas largas, mostrados de a uno.» y, en «Evitar»: «Mostrar la descomposición entera; exigir pasos para crear una tarea; tratar como fallo una tarea con pasos a medio hacer. Demasiadas partes también paralizan (`tea §1`).»
