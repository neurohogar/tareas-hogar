# Paquete: reintento-y-aviso-de-copia

Dos arreglos a la feature `anotacion` ya terminada: la app reintenta las cuatro limpiezas de §7 (completados huérfanos, anotaciones huérfanas, referencias a etiquetas borradas y etiquetas duplicadas) cuando un intento falla o no hay conexión, y avisa con un texto breve y neutro cuando el portapapeles rechaza **Copiar**.

## Specs

- S1 (§7, D1, D8): «las cuatro limpiezas de esta sección (completados huérfanos, anotaciones huérfanas, referencias a etiquetas borradas y etiquetas duplicadas) se reintentan si un intento falla o no hay conexión; no quedan sin limpiar hasta recargar la app.»
- S2 (§7, D9): «Se reintenta al volver la conexión y cuando cambian los datos, sin temporizadores.»
- S3 (§7, D3, D8): «Cada elemento se intenta por separado: que uno falle (o que no haya conexión) no impide intentar los demás del lote.»
- S4 (§7, D4, D9): «Los reintentos son silenciosos: sin aviso, contador ni indicador de pendientes.»
- S5 (§6.7, D2, D6): «Si el portapapeles rechaza la copia, el mismo tipo de texto con «No se pudo copiar», sin más palabras»
- S6 (§6.7, D5): «sin botones, se va solo, no tapa el aviso de deshacer (§5.4), y solo se ve un texto a la vez (el último reemplaza al anterior).»
- S7 (§6.7, D7): «No se copia nada y no cambia nada más; la app no hace otra cosa sola y la persona puede volver a tocar **Copiar**.»

## Decisiones

- D1 (2026-11-13, usuario): «Reintentar en anotaciones y completados»: un único arreglo para ambos que reintente la limpieza de huérfanas, de modo que siga valiendo «como un completado huérfano» (§7).
- D2 (2026-11-13, usuario): «Mostrar un aviso breve» cuando el portapapeles rechaza la escritura al tocar **Copiar** en Anotaciones: un texto informativo y neutro, por ejemplo «No se pudo copiar», sin culpa ni alarma.
- D3 (2026-11-13, analyst): cada huérfana se intenta por separado: que una falle (o que no haya conexión) no impide intentar las demás del lote. Porque hoy la de anotaciones corta todo el lote al primer fallo, y una huérfana mala dejaría sin limpiar a las buenas.
- D4 (2026-11-13, analyst): la limpieza y sus reintentos son silenciosos: sin aviso, contador ni indicador de pendientes. Porque §7 («Aviso de conexión») prohíbe indicadores de cambios pendientes y D6 de `anotacion` prohíbe contadores.
- D5 (2026-11-13, analyst): el aviso de «no se pudo copiar» es como el de «Anotaciones copiadas» (§6.7): sin botones, se va solo, y un solo texto a la vez (el último reemplaza al anterior). No tapa el aviso de deshacer (§5.4). Porque es el mismo tipo de texto breve e informativo y debe comportarse igual.
- D6 (2026-11-13, analyst): el texto exacto es «No se pudo copiar», el ejemplo del usuario en D2, sin más palabras. Porque la regla global es sin culpa y sin alarma, y ese texto lo cumple.
- D7 (2026-11-13, analyst): si el portapapeles rechaza la copia no se copia nada y no se cambia nada más (la app no hace otra cosa sola); la persona puede volver a tocar **Copiar**. Porque la app no cambia nada sola (docs/v3/plan.md).
- D8 (2026-11-13, usuario, alcance del reintento): «Sí, las cuatro limpiezas (Recomendada)». El reintento alcanza también a las referencias a etiquetas borradas y a la fusión de etiquetas duplicadas (§7). Reconciliado con D3 y D4: lo de D3 (cada elemento se intenta por separado, una falla no corta el lote) y lo de D4 (silencioso) rigen para las cuatro limpiezas, no solo para completados y anotaciones.
- D9 (2026-11-13, usuario, cuándo se reintenta): «Al volver la conexión y al cambiar los datos (Recomendada)». Sin temporizadores. Reconciliado con D4: tampoco se avisa ni se cuenta cuándo se reintenta.

## Artefactos

## core

## acceptance

## ui

## cleaner · architect · hardener · qa

Trabajan sobre todo lo que cambió la feature (`git diff <base de la feature>`, anotada en `tmp/base-de-feature`); no necesitan sección propia salvo que el gherkin-writer anote algo para ellos acá.

## Log

- L1 (2026-11-13): «1) «Reintentar en anotaciones y completados»: la limpieza de huérfanas (src/lib/ui/Sesion.svelte, efectos de `completadosHuerfanos` y `anotacionesHuerfanas`; adapters `limpiarHuerfanos` y `limpiarAnotacionesHuerfanas`) agrega los ids a un Set `…EnLimpieza` antes de limpiar y nunca los saca; si el intento falla o está sin conexión (el adapter hace `catch { return }`, y en el de anotaciones corta todo el lote al primer fallo) esas huérfanas no se reintentan hasta recargar la app. El usuario quiere un único arreglo para ambos que reintente, de modo que siga valiendo «como un completado huérfano» (§7 de docs/spec.md). 2) «Mostrar un aviso breve» cuando el portapapeles rechaza la escritura al tocar Copiar en Anotaciones (hoy `copiar()` en src/lib/ui/Anotaciones.svelte vuelve sin mostrar nada): un texto informativo y neutro, por ejemplo «No se pudo copiar», sin culpa ni alarma, como el resto de los avisos de la app (reglas globales de docs/v3/plan.md: sin culpa, la app no cambia nada sola).»
