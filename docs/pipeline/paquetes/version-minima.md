# Paquete: version-minima

Épica E4 de `docs/v3/plan.md` («Versión mínima»): un campo opcional por tarea con una versión chica de la tarea («solo el inodoro»). Hacer esa versión completa la tarea como cualquier completado, y el completado recuerda que fue la mínima.

## Specs

## Decisiones

- D1 (2026-11-15, analyst, modelo del campo): la tarea suma un campo opcional de texto con la versión mínima, para cualquier tipo de tarea (puntual y periódica, en cualquier modo) y cualquier esfuerzo. Sigue la regla de texto del primer paso (§4.1): una sola línea, sin saltos de línea y sin largo máximo; al guardar se recortan los espacios del inicio y del final; vacío o solo espacios significa **sin versión mínima** (el campo no se guarda); nunca es inválido ni rechaza la creación o la edición. Porque es la regla de los textos opcionales de una línea de la tarea (primer paso, pasos, texto de anotación) y la regla 4 del plan pide que todo lo nuevo sea opcional y sin trabas.
- D2 (2026-11-15, analyst, tareas existentes): no hay migración. Una tarea guardada sin el campo no tiene versión mínima y su fila y su panel se ven como hoy. Porque «sin el campo» ya significa «sin valor» en los opcionales de la §4.1 (D9 de `primer-paso`).
- D3 (2026-11-15, analyst, dónde se edita): en el panel (§6.2), sección **Tarea**, un campo de una línea con la etiqueta «Versión mínima», sin texto de ejemplo, debajo de los pasos (después de **Agregar paso**) y antes de la nota. Enter en ese campo guarda, como en todo campo de una línea (Teclado en pantalla, §6.2). Al crear arranca vacío; al editar, con el valor actual. Porque la configuración va en el panel (regla 6 del plan) y la mínima describe qué hacer, como el primer paso y los pasos; un texto de ejemplo sería la app sugiriéndola (E4, «Evitar»).
- D4 (2026-11-15, analyst, Cambios sin guardar): el campo cuenta para **Cambios sin guardar** con la definición única de la §6.2: escribir y volver al valor original no cuenta, ni los espacios que **Guardar** recorta; vaciar una versión mínima existente sí. Porque es la definición única de «hay cambios» (D4 de `primer-paso`).
- D5 (2026-11-15, analyst, sincronización): es un campo independiente de la §4.1: gana el último cambio, por campo, como `nota` y `primerPaso` (§7); una edición escribe solo si cambió. El dato que marca un completado como mínima viaja dentro del completado, que es un documento independiente y nunca se pierde (§7); dos dispositivos que completan sin conexión, uno entera y otro la mínima, dejan las dos entradas. Porque es la regla de conflictos de los campos de texto de la tarea y de los completados.
- D6 (2026-11-15, analyst, cuenta como hecha): un completado de la versión mínima es un completado como cualquier otro para todas las reglas de estado y de lista: la puntual queda completada (§5.1); en la relativa reinicia el intervalo (§5.2); en la de calendario y en las de varias ventanas cubre la ocurrencia que corresponde con la misma regla (§5.3, §5.6, §5.7); cuenta para «Mostrar completadas», el orden (§6.1), **Última vez** (§6.2) y el checkbox de una completada (§6.1), y una pausa o una posposición se comportan igual. La mínima no cambia el estado, el orden, los filtros ni **Solo rápidas**. Porque el plan dice «Completarla cuenta como hecha», y una regla de estado distinta para la mínima la volvería un completado de segunda (E4, «Evitar»).
- D7 (2026-11-15, analyst, horario): hacer la versión mínima solo se puede dentro de la ventana, igual que completar (§5.5): si el checkbox está deshabilitado por la ventana, la forma de marcar la mínima también. Deshacer un completado de la mínima se puede a cualquier hora. Porque D6 la hace un completado y §5.5 rige todo completar (como el «Hecho» del último paso, D16 de `pasos-de-a-uno`).
- D8 (2026-11-15, analyst, deshacer): un completado de la mínima se borra como cualquier otro, desde el aviso, el Historial o el checkbox de la completada (§5.4, §6.1), y el estado se recalcula con los que quedan. El checkbox de una completada borra el completado más reciente sea entero o mínimo, y el de una periódica completada un día anterior la completa de nuevo, entera. Porque los completados solo se agregan o se borran (§4.4) y el checkbox no cambia de significado por la mínima.
- D9 (2026-11-15, analyst, inmutabilidad): que un completado fue la mínima se fija al completar y no se cambia después: no se puede pasar un completado entero a mínimo ni al revés; se corrige deshaciendo y completando de nuevo. Editar o vaciar la versión mínima de la tarea no toca sus completados. Porque los completados «solo se agregan: nunca se modifican» (§4.4).
- D10 (2026-11-15, analyst, la app no la sugiere): la versión mínima se ve y se ofrece igual siempre que corresponda (P2), sin depender del atraso, de cuántas veces se hizo la mínima ni de ningún otro dato; no hay textos que la propongan, contadores de mínimas, ni marcas de «otra vez la mínima». Sin felicitaciones. Porque el plan pide evitar «que la app la sugiera sola» y la regla 2 prohíbe contadores; la cuenta de mínimas para validar se lee a mano desde los datos («El silencio no aprueba»).
- D11 (2026-11-15, analyst, dónde no se ve la definición): el texto de la versión mínima no se ve en Anotaciones (§6.7) ni en su texto copiado, y no cambia el nombre de la tarea (§4.1), que sigue siendo emoji y título. Lo que muestran del completado el Historial y el aviso de deshacer queda para las preguntas P3 y P4. Porque es la regla del primer paso y los pasos (D7 de `primer-paso`).
- D12 (2026-11-15, analyst, en qué filas se ofrece; sujeta a P2): si la forma de marcar la mínima vive en la fila, se ve solo en las filas `pendiente` y `atrasada`, decidido con el estado de cada momento, nunca en `en espera` (pospuestas y completadas incluidas) ni en pausadas; una `atrasada` con el checkbox deshabilitado por su ventana la muestra, con el botón deshabilitado (D7). Una pospuesta se sigue pudiendo completar entera con el checkbox (§5.9), no con la mínima. Porque es la regla que ya eligió el usuario para la línea del paso (D10 y D13 de `primer-paso`, D4 de `pasos-de-a-uno`).

## Artefactos

## core

## acceptance

## ui

## cleaner · architect · hardener · qa

## Log

- L1 (2026-11-15): pedido original del usuario, textual: «dale», en respuesta a «arrancar E4 (Versión mínima) con el analyst», sobre la épica E4 de `docs/v3/plan.md`, que dice en «Qué propone»: «Un campo opcional «versión mínima» («solo el inodoro»). Completarla cuenta como hecha y queda en el historial como lo que fue. Un campo opcional «cuenta como hecha cuando…».»; en «Evitar»: «Presentar la mínima como «parcial» o con un indicador que baje. Que la app la sugiera sola.»; y en riesgos: «Agrega un dato al completado y toca las reglas de completar (spec §4.4 y §5).»
