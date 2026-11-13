# Tareas Hogar v2 — Especificación

Estado: borrador v1 · 2026-10-26

## 1. Propósito

Lista personal de tareas del hogar pensada para personas con TDAH. Resuelve dos problemas, en este orden:

1. **Que no se olviden las tareas recurrentes** ("¿cuándo limpié el baño por última vez?").
2. **Bajar la carga visual**: la lista muestra primero lo que hay que hacer ahora, sin ruido.

Un solo usuario, que la usa desde el celular (en el momento, por la casa) y desde la compu (Linux).

## 2. Alcance del MVP

**Incluye**

- Tareas puntuales y periódicas (modo relativo y modo calendario).
- Etiquetas con color, usadas como filtro.
- Historial de todo lo completado, con deshacer.
- Anotaciones «me sirvió / me molestó» con un gesto de dos toques, y una pantalla para releerlas, corregir su texto, borrarlas y copiarlas (§5.10, §6.7).
- Funcionamiento sin conexión y sincronización entre dispositivos.
- Login con Google.
- Fuente y emoji empaquetados con la app (§6).
- Pantalla de carga al iniciar la app (§6.6).

**No incluye**

- Notificaciones o recordatorios.
- Uso compartido o multiusuario.
- Subcategorías o secciones jerárquicas.
- Orden manual (arrastrar).
- Estadísticas o rachas.
- Apps nativas (solo PWA).

## 3. Glosario

| Término | Significado |
|---|---|
| **Tarea puntual** | Se hace una sola vez. Al completarla sale de la lista y queda en el historial. |
| **Tarea periódica** | Vuelve a estar pendiente según su recurrencia. |
| **Modo relativo** | Recurrencia "cada N horas" o "cada N días", contada desde el último completado. |
| **Modo calendario** | Recurrencia anclada a fechas: días de la semana o días del mes. |
| **Ocurrencia** | En modo calendario, cada día en que la tarea "toca" (ej. cada martes). |
| **Completado** | Registro inmutable de que una tarea se hizo, con fecha y hora. |
| **Estado** | `pendiente`, `atrasada` o `en espera`. Se calcula; nunca se guarda. |
| **Anotación** | Registro de «me sirvió» o «me molestó» con su contexto y una línea de texto opcional (§4.5). No es la **nota** de una tarea (§4.1). |

## 4. Modelo de dominio

### 4.1 Tarea

| Campo | Tipo | Obligatorio | Notas |
|---|---|---|---|
| `id` | string | sí | |
| `titulo` | string | sí | No vacío. |
| `emoji` | string | no | Un solo emoji (ver más abajo). |
| `nota` | string | no | Texto libre (ver más abajo). |
| `etiquetas` | id[] | no | Cero o más etiquetas, sin repetir y sin límite. |
| `tipo` | `puntual` \| `periodica` | sí | |
| `fechaLimite` | fecha (sin hora) | no | Solo para puntuales. |
| `recurrencia` | ver 4.2 | si es periódica | |
| `horario` | `{ desde: "HH:MM", hasta: "HH:MM" }` o lista de esas ventanas | no | Ventanas diarias en las que se puede completar (§5.5). Cualquier tipo de tarea, con una o más ventanas (§5.6, §5.7). |
| `creadaEn` | timestamp | sí | |
| `pausada` | booleano | no | Solo periódicas (§5.8). Sin el campo, no está pausada. |
| `reanudadaEn` | timestamp | no | Última vez que se reanudó (§5.8). |
| `pospuesta` | `{ desde: timestamp, hasta: timestamp }` | no | Posponer (§5.9). |
| `esfuerzo` | `rapida` \| `media` \| `larga` | no | Esfuerzo estimado: rápida (≤ 5 min), media (≈ 15 min), larga. Sin el campo, sin estimar. |

**Horario**: `desde` y `hasta` son horas locales en formato 24 h, con `desde` < `hasta` (la ventana no cruza la medianoche). La ventana de un día es [`desde`, `hasta`): se puede completar desde `desde` inclusive hasta `hasta` exclusive. Sin el campo, la tarea se puede completar a cualquier hora. Un horario con una sola de las dos horas, o con `desde` ≥ `hasta`, es inválido y rechaza la creación o la edición entera.

**Varios horarios** (§5.6, §5.7): cualquier tarea puede tener **una o más ventanas**, ordenadas por `desde` y sin superponerse (dos ventanas se superponen si una empieza antes de que termine la otra; que una empiece justo cuando termina la otra, ej. 08:00–10:00 y 10:00–12:00, es válido). Una relativa con más de una ventana tiene que tener el intervalo en días. Ventanas superpuestas, o más de una ventana en una relativa en horas, son inválidas y rechazan la creación o la edición entera. Un documento guardado con una sola ventana (el formato anterior) se lee como una lista de una.

**Emoji**: un solo emoji, es decir, un único grafema emoji: una secuencia con ZWJ (👨‍👩‍👧), con tono de piel (👍🏽), con selector de variación (❤️) o una bandera (🇦🇷) cuenta como uno. Texto vacío o solo espacios significa **sin emoji** (el campo no se guarda). Dos o más emojis, o cualquier texto que no sea exactamente un emoji (letras, números, un emoji con texto), es inválido: la creación o edición se rechaza entera, igual que un título vacío. La UI no puede producir un valor inválido (el emoji se elige de un selector, §6.2), pero la regla del dato se conserva en el core como validación al guardar: un valor inválido que llegue por otra vía (por ejemplo un documento con datos inválidos) se rechaza igual.

**Nota**: texto libre sin largo máximo. Al guardar se recortan los espacios y saltos de línea del inicio y del final; los saltos de línea internos se conservan. Vacía o solo espacios significa **sin nota** (el campo no se guarda). Una nota nunca es inválida.

**Cómo se muestra una tarea**: con emoji, «emoji título» (un espacio entre los dos); sin emoji, solo el título, sin hueco. Es el nombre que usan la fila de Pendientes, el Historial y el aviso de deshacer.

### 4.2 Recurrencia (solo periódicas)

Una sola de estas tres formas:

- **Relativa**: `{ modo: "relativo", cada: N, unidad: "horas" | "dias" }`, con N entero ≥ 1.
- **Semanal**: `{ modo: "calendario", diasSemana: [lun..dom] }`, con al menos un día.
- **Mensual**: `{ modo: "calendario", diasMes: [1..31] }`, con al menos un día. Un día que no existe en un mes (ej. 31 en abril) cae en el **último día de ese mes**.

Una recurrencia de calendario es semanal **o** mensual; no se combinan.

### 4.3 Etiqueta

| Campo | Tipo | Notas |
|---|---|---|
| `id` | string | |
| `nombre` | string | Único (sin distinguir mayúsculas). De 1 a 30 caracteres, sin espacios al principio ni al final. |
| `color` | clave de paleta | Paleta fija de 8 colores tenues. |

- **Paleta**, en este orden: `gris`, `rojo`, `naranja`, `amarillo`, `verde`, `celeste`, `azul`, `violeta`. La clave es también el nombre visible del color.
- **Nombre**: se le quitan los espacios del principio y del final. Vacío (o solo espacios) o con más de 30 caracteres (después de quitar esos espacios) es inválido. Dos nombres son el mismo si coinciden sin distinguir mayúsculas (sí se distinguen los acentos: "Baño" y "Bano" son distintos).
- **Creación**: se crea solo desde el panel de edición (§6.2), al **guardar** una tarea con un nombre de etiqueta que no existe. Cerrar el panel sin guardar, o una edición o creación rechazada, no crea ninguna etiqueta. Un nombre que ya existe (sin distinguir mayúsculas) usa esa etiqueta, con su nombre guardado.
- **Color de una etiqueta nueva**: el color de la paleta que menos etiquetas existentes tienen; si empatan, el primero de la paleta. Si un mismo guardado crea varias, se asignan en el orden en que se escribieron, cada una contando las anteriores. El color se puede cambiar después.
- **Orden**: en todos lados (chips de la fila, filtro, pantalla Etiquetas, sugerencias del panel) las etiquetas van en orden alfabético en español, igual que el desempate de títulos de la §6.1 (sin distinguir mayúsculas ni acentos, con la ñ después de la n); si empatan, por `id`.
- Se puede renombrar, recolorear y borrar desde la pantalla Etiquetas (§6.4). Renombrar valida el nombre igual que al crear y se rechaza si otra etiqueta ya tiene ese nombre (sin distinguir mayúsculas); cambiar solo mayúsculas de la misma etiqueta sí se permite.
- Borrar una etiqueta la quita de todas las tareas; las tareas no se borran.
- Una etiqueta que deja de usarse no se borra sola.

### 4.4 Completado

| Campo | Tipo | Notas |
|---|---|---|
| `id` | string | Único por dispositivo, generado en el cliente. |
| `tareaId` | id | |
| `completadoEn` | timestamp | |
| `ocurrenciaCubierta` | fecha (`2026-07-14`), o fecha y hora (`2026-07-14T07:00`): formatos distintos, para que una ventana que empieza a las 00:00 no se confunda con una fecha | En modo calendario (5.3, 5.6) y en relativas con varias ventanas (5.7). Sin horario, un día a las 00:00; con horario, el día a la hora `desde` de la ventana que cubre. |

Los completados **solo se agregan**: nunca se modifican. La única operación destructiva es borrar uno explícitamente (deshacer).

### 4.5 Anotación

| Campo | Tipo | Obligatorio | Notas |
|---|---|---|---|
| `id` | string | sí | Generado en el cliente. |
| `sentido` | `Me sirvió` \| `Me molestó` | sí | Con ese texto literal. |
| `anotadaEn` | timestamp | sí | Fecha y hora de la anotación, como `completadoEn`. |
| `pantalla` | `Pendientes` \| `Historial` \| `Etiquetas` \| `Anotaciones` \| `Panel de edición` | sí | Dónde estaba la persona (§5.10). |
| `tareaId` | id | no | Referencia a la tarea, si la hay (§5.10). No se copia su nombre: se muestra el nombre actual. |
| `texto` | string | no | Una sola línea (ver más abajo). |

**Texto**: una sola línea, sin saltos de línea y sin largo máximo. Al guardar se recortan los espacios del inicio y del final. Vacío o solo espacios significa **sin texto** (el campo no se guarda). Un texto nunca es inválido.

Una anotación no guarda ni los filtros activos, ni la pestaña del panel, ni escalas de ánimo. Solo el texto se puede cambiar después (§6.7); el sentido, `anotadaEn`, la pantalla y la tarea quedan fijos.

## 5. Reglas de estado

Todas las fechas y horas son de la **zona horaria local del dispositivo**. El día empieza a las **00:00**.

El estado de cada tarea se **deriva** de su definición y de sus completados. Nunca se guarda un flag de "completada".

### 5.1 Tarea puntual

| Situación | Estado |
|---|---|
| Tiene al menos un completado | Completada: sale de la lista (con **Mostrar completadas**, §6.1, se ve tachada al final) y se ve en el historial. |
| Sin completado, sin fecha límite | `pendiente` |
| Sin completado, hoy ≤ `fechaLimite` | `pendiente` |
| Sin completado, hoy > `fechaLimite` | `atrasada` |

Deshacer su completado (borrarlo) la devuelve a la lista con el estado que corresponda.

### 5.2 Periódica en modo relativo

Sea `U` el `completadoEn` más reciente y `V = U + intervalo` (el vencimiento).

| Situación | Estado |
|---|---|
| Nunca completada | `pendiente` |
| ahora < `U` (relojes desfasados) | `en espera`; progreso = 0 |
| `U` ≤ ahora < `V` | `en espera`; progreso = (ahora − U) / intervalo |
| `V` ≤ ahora < `V + intervalo` | `pendiente` |
| ahora ≥ `V + intervalo` (se perdió un ciclo completo) | `atrasada` |

`U` puede quedar después de ahora cuando los relojes de dos dispositivos están desfasados y se sincroniza un completado "del futuro". En ese caso la tarea queda `en espera` con progreso 0 hasta que ahora alcance a `U`.

Completarla en cualquier momento, incluso en espera, reinicia el intervalo desde ese momento.

### 5.3 Periódica en modo calendario

Sea `P` la **última ocurrencia cubierta**: la mayor `ocurrenciaCubierta` entre sus completados. Si nunca se completó, `P` = el día anterior a `creadaEn`. Así, una tarea recién creada queda `en espera` hasta su primera ocurrencia, o `pendiente` si se crea en un día de ocurrencia.

Un completado sin `ocurrenciaCubierta` (se hizo cuando la tarea era relativa o puntual, antes de pasarla a calendario) aporta a `P` el **día de su `completadoEn`**. En general, `P` = la mayor entre las `ocurrenciaCubierta` y los días de `completadoEn` de los completados sin `ocurrenciaCubierta`; sin completados, el día anterior a `creadaEn`.

Sea `N` la primera ocurrencia posterior a `P`.

| Situación | Estado |
|---|---|
| hoy < `N` | `en espera`; progreso = (ahora − inicio de espera) / (inicio de `N` − inicio de espera) |
| hoy = `N` | `pendiente` |
| hoy > `N` | `atrasada` (una sola instancia; las ocurrencias perdidas no se acumulan) |

El "inicio de espera" es el `completadoEn` más reciente o, si no hay ninguno, `creadaEn`.

Si el inicio de espera es un `completadoEn` posterior a ahora (relojes desfasados entre dispositivos: se sincronizó un completado "del futuro"), la tarea queda `en espera` con progreso 0 hasta que ahora alcance a ese completado. Al guardarse, ese completado dejó `P` en la última ocurrencia de su propio día o anterior, o en una posterior; así que `N` queda después de su día y, por lo tanto, hoy < `N`.

**Qué ocurrencia cubre un completado nuevo** (se calcula y se guarda al completar):

- Si hay ocurrencias sin cubrir en el intervalo (`P`, hoy], cubre **la más reciente** de ellas. Las anteriores se descartan.
- Si no hay ninguna, cubre **`N`, la primera ocurrencia posterior a `P`** (la próxima todavía no cubierta): completar antes de tiempo cuenta como la próxima, y cada completado extra avanza una ocurrencia.

Ejemplos con "martes y jueves":

| Completo el… | Cubre | Vuelve a pendiente |
|---|---|---|
| martes | martes | jueves |
| lunes (antes de tiempo) | martes | jueves |
| miércoles (martes atrasado) | martes | jueves |
| viernes (se perdieron martes y jueves) | jueves | martes siguiente |
| lunes, otra vez el lunes | jueves (el primero cubrió el martes) | martes siguiente |

Cambiar la recurrencia de una tarea no borra sus completados. El estado se recalcula con la regla nueva, usando el `P` guardado (aunque `P` ya no sea una ocurrencia de la regla nueva, `N` es la primera ocurrencia de la regla nueva posterior a `P`).

### 5.4 Deshacer

- Al completar una tarea aparece un **aviso** que nombra la tarea (emoji y título, §4.1: `Completaste «🌱 Regar»`, o `Completaste «Regar»` sin emoji) y tiene **Deshacer**. Dura **5 segundos**: se ve mientras `completadoEn` ≤ ahora < `completadoEn` + 5 s; después desaparece solo.
- Si la tarea completada vuelve (periódica), debajo de «Completaste …» el aviso dice cuándo: «Vuelve el jueves 19 · en 6 días», con el instante de regreso calculado después del completado y el formato de **Fecha y distancia** (§6.1), el mismo texto que mostrará su fila `en espera`. Una puntual (que no vuelve) muestra solo «Completaste …». No hay otro cierre ni felicitaciones.
- Hay un solo aviso a la vez: completar otra tarea (o la misma) con el aviso abierto lo **reemplaza** por el del completado nuevo. El completado anterior queda sin aviso y se puede borrar desde el Historial.
- **Deshacer** en el aviso borra el completado que nombra el aviso (solo ese) y cierra el aviso.
- El aviso sigue visible al cambiar de pantalla, hasta que expira.
- Desde el **Historial** se puede borrar cualquier completado (§6.3), no solo el más reciente.
- En todos los casos el completado se borra y el estado de la tarea se recalcula según las reglas anteriores con los completados que quedan: `U` pasa a ser el `completadoEn` más reciente que queda y `P` la mayor ocurrencia que queda (§5.2, §5.3); sin completados, la tarea vuelve a "nunca completada". Un completado nuevo después de deshacer cubre la ocurrencia que corresponde a ese `P` recalculado.
- Borrar un completado que ya no existe (otro dispositivo ya lo borró, o borró su tarea) no hace nada: no cambia ningún otro completado ni revive la tarea.

### 5.5 Horario

Una tarea con `horario` (§4.1) solo se puede completar **dentro de la ventana** de algún día. Las reglas de §5.1–§5.3 se aplican igual y el horario solo corre los momentos en que la tarea pasa a `pendiente` y a `atrasada`:

- Sea `T` el instante en que la tarea pasaría a `pendiente` sin horario: puntual, `creadaEn`; relativa, `V` (nunca completada, `creadaEn`); calendario, 00:00 de `N`.
- Sea `A` (**disponible**) el primer instante ≥ `T` que cae dentro de una ventana: `T` mismo si está dentro de la ventana de su día; si no, el `desde` de la próxima ventana. Sea `C` (**cierre**) el `hasta` de esa ventana.

| Situación (con horario) | Estado |
|---|---|
| ahora < `A` y ahora < atraso | `en espera`; progreso = (ahora − inicio de espera) / (`A` − inicio de espera), con el inicio de espera de §5.2/§5.3 (puntual: `creadaEn`) |
| `A` ≤ ahora < `C` | `pendiente` |
| ahora ≥ `C`, periódica | `atrasada` (también si el atraso sin horario de §5.2 llegara antes: vale el primero de los dos) |
| ahora ≥ `C`, puntual sin fecha límite | fuera de una ventana, `en espera` hasta el `desde` de la próxima (progreso desde el `hasta` de la anterior); dentro, `pendiente`. Nunca `atrasada`. |
| ahora ≥ `C`, puntual con fecha límite | como la puntual sin fecha límite hasta el `hasta` de la ventana del día `fechaLimite`; desde ahí, `atrasada` |

- **Atraso**: el primero entre `C` y el atraso sin horario (relativa: `V + intervalo`; puntual con fecha límite: el `hasta` de la ventana del día `fechaLimite`). Gana sobre todo lo demás, también antes de `A`: una tarea con el atraso ya cumplido está `atrasada` aunque su ventana todavía no haya abierto (con el checkbox deshabilitado hasta que abra).
- Una vez `atrasada`, sigue `atrasada` también fuera de las ventanas, pero solo se puede completar dentro de una.
- Una `en espera` por horario que tiene completados está completada (§6.1): con **Mostrar completadas** apagado aparece recién cuando abre la ventana.
- **Completar** fuera de la ventana no es posible: el checkbox que completaría está deshabilitado (§6.1). Borrar un completado (checkbox de una completada, aviso, Historial) se puede a cualquier hora.
- El completado se rige por §5.2/§5.3 como siempre (en calendario, la ocurrencia que cubre se calcula igual).
- El orden de §6.1 usa `C` como inicio de `atrasada` (o el atraso sin horario, si es anterior), `A` como inicio de `pendiente` de una periódica (una puntual `pendiente` conserva la clave de §6.1: `fechaLimite`, o al final por `creadaEn`) y `A` como el momento en que vuelve una `en espera`.

### 5.6 Varios horarios (calendario)

En una tarea de calendario con horario, una **ocurrencia** es un par (día de ocurrencia, ventana): con "todos los días" y ventanas 07:00–10:00 y 18:00–21:00, cada día tiene dos ocurrencias. Cada ocurrencia se identifica por su **inicio**: el día a la hora `desde` de su ventana. Con una sola ventana, cada día de ocurrencia tiene una sola ocurrencia, así que todo sigue igual que en §5.5.

Las reglas de §5.3 y §5.5 se aplican sobre ocurrencias en lugar de días:

- `P` es la mayor `ocurrenciaCubierta`. Solo una `ocurrenciaCubierta` con hora es un instante (el inicio que cubrió). Los valores sin hora **cubren el día entero** y dejan `P` al final de su día: una `ocurrenciaCubierta` guardada solo como fecha (sin horario, o de antes de esta feature), el día del `completadoEn` de un completado sin `ocurrenciaCubierta` y, sin completados, el día anterior a `creadaEn`. Así, con una sola ventana se mantienen §5.3 y §5.5 tal cual.
- `N` es la primera ocurrencia con inicio posterior a `P`. Para §5.5: `A` = inicio de `N` y `C` = el `hasta` de su ventana ese día.
- Estados: ahora < `A`, `en espera` (progreso hacia `A`); `A` ≤ ahora < `C`, `pendiente`; ahora ≥ `C`, `atrasada` (una sola instancia; las ocurrencias perdidas no se acumulan).
- **Qué ocurrencia cubre un completado nuevo**: si hay ocurrencias sin cubrir con inicio en (`P`, ahora], la **más reciente** (las anteriores se descartan); si no, `N`.
- Ejemplo (todos los días, 07:00–10:00 y 18:00–21:00): completo a las 08:00 → cubre la de las 07:00 y queda `en espera` hasta las 18:00. Si no completo a la mañana, a las 10:00 queda `atrasada` (checkbox deshabilitado hasta las 18:00); a las 18:00 completo → cubre la de las 18:00, la de la mañana se descarta, y queda `en espera` hasta las 07:00 del día siguiente.
- Cambiar los horarios no borra completados: el estado se recalcula con las ventanas nuevas y el `P` guardado. Excepción a "con una sola ventana nada cambia": como `P` con hora es un instante, mover una ventana más tarde el mismo día puede volver a abrir la ocurrencia ya hecha (completo a las 08:30 con 08:00–11:00, cambio a 09:00–12:00: a las 09:00 vuelve a estar `pendiente`), igual que al cambiar la recurrencia (§5.3).

### 5.7 Varios horarios en puntuales y relativas

**Puntual**: se completa una sola vez, en cualquiera de sus ventanas. §5.5 se aplica tomando como ventanas todas las del día: `A` es el primer instante ≥ `creadaEn` dentro de alguna ventana y `C` el `hasta` de esa ventana; entre ventanas, `en espera` hasta el `desde` de la próxima. Con fecha límite, el atraso es el `hasta` de la **última** ventana del día `fechaLimite`.

**Relativa con varias ventanas** (intervalo en días): hay que completarla **una vez por ventana** los días que le toca. Cada ventana de esos días es una ocurrencia, identificada por su inicio, y se aplican las reglas de §5.6 (`P`, `N`, `A`, `C`, estados, qué ocurrencia cubre un completado) con esta secuencia de ocurrencias:

- Nunca completada: todas las ventanas de todos los días, a partir de la primera cuyo `hasta` es posterior a `creadaEn`.
- Con `P`: primero las ventanas del día de `P` posteriores a `P` (la ronda del día sigue); después, todas las ventanas del día de `P` + `cada` días; y así sucesivamente cada `cada` días.
- Si está `atrasada` (se perdió `N`), un completado cubre la ventana con el inicio más reciente ≤ ahora, de cualquier día, y la secuencia sigue desde ahí.
- El atraso sin horario de §5.2 (`V + intervalo`) no se aplica: el atraso es `C`.
- Ejemplo (cada 2 días, 07:00–10:00 y 18:00–21:00): el lunes completo a las 08:00 (cubre lunes 07:00) y a las 19:00 (cubre lunes 18:00); queda `en espera` hasta el miércoles a las 07:00.

Con una sola ventana, la relativa sigue §5.2 y §5.5 sin cambios.

### 5.8 Pausar

Solo las tareas **periódicas** se pueden pausar.

- **Pausada**: no tiene estado (no es `pendiente`, `atrasada` ni `en espera`), no se atrasa y no está completada (§6.1). No aparece en Pendientes salvo con **Mostrar pausadas** (§6.1). Su checkbox está deshabilitado.
- **Reanudar** guarda `reanudadaEn` = ahora y quita `pausada`. Desde ahí la tarea se evalúa **como recién creada en `reanudadaEn`**: con `creadaEn` = `reanudadaEn` y sin los completados con `completadoEn` anterior a `reanudadaEn` (que siguen en el Historial y en "Última vez"). Así:
  - Relativa: queda `pendiente` al reanudar (nunca completada, §5.2).
  - Calendario: `pendiente` si hoy es día de ocurrencia; si no, `en espera` hasta la próxima (§5.3).
  - Con horario, §5.5–§5.7 con ese `creadaEn`.
  - Lo que pasó durante la pausa no cuenta como atraso.
- `reanudadaEn` solo vale para las periódicas: una puntual lo ignora (una periódica pausada con completados que pasa a puntual queda completada, §6.2). El filtro por `reanudadaEn` es permanente: sigue valiendo después de cambios de tipo o de modo, hasta la próxima reanudación.
- Con horario, una ocurrencia cuya ventana cerró antes de `reanudadaEn` no cuenta como perdida: el día de la reanudación, si la ventana ya cerró, la tarea queda `en espera` hasta la próxima ocurrencia (no `atrasada`).
- `creadaEn` real no cambia: el desempate del orden (§6.1) sigue usando el `creadaEn` real.
- Los completados se siguen pudiendo borrar (Historial, aviso) con la tarea pausada.
- Cambiar una periódica pausada a puntual la reanuda (quita `pausada` y guarda `reanudadaEn`).

### 5.9 Posponer

Posponer saca una tarea `pendiente` o `atrasada` de la urgencia por un rato, sin completarla.

- Opciones: **1 hora**, **3 horas** y **Hasta mañana** (07:00 del día local siguiente). Guarda `pospuesta = { desde: ahora, hasta }`.
- Mientras ahora < `pospuesta.hasta`, una tarea que según §5.1–§5.8 estaría `pendiente` o `atrasada` está **`en espera`**, con progreso = (ahora − `desde`) / (`hasta` − `desde`); vuelve en `hasta` (clave de orden de §6.1). Si estaría `en espera` por su propia regla, la posposición no cambia nada.
- Si ahora < `pospuesta.desde` (relojes de dos dispositivos desfasados), la tarea sigue **`en espera`** con progreso 0 (barra vacía) hasta que el reloj alcance `desde`. Ejemplo: `pospuesta = { desde: 2026-07-15T08:05:00, hasta: 2026-07-15T09:05:00 }` y ahora = `2026-07-15T08:00:00`: `en espera`, progreso 0; a las `08:05:00` empieza a avanzar.
- Desde `pospuesta.hasta`, el estado vuelve a ser el de §5.1–§5.8 (puede ser `atrasada` en el acto si su atraso ya llegó). La posposición no mueve vencimientos ni fechas límite.
- Una tarea pospuesta no está completada (§6.1): se ve con **Mostrar completadas** apagado.
- Se puede completar mientras está pospuesta (salvo que el horario lo impida, §5.5): el checkbox está habilitado.
- **Quitar posponer** borra `pospuesta`. Completar, deshacer o editar no la borran; vence sola.
- Una tarea pausada (§5.8) no se puede posponer.

### 5.10 Anotar

Una anotación se hace con un gesto de dos toques, disponible siempre en el mismo lugar.

- **Dónde**: un botón chico **Anotar**, arriba, siempre en el mismo lugar, en Pendientes, Historial, Etiquetas, Anotaciones y el panel de edición (al crear y al editar), en celular y en pantallas anchas. Con sesión iniciada; no está en la pantalla de entrada (§6.5) ni en la de carga (§6.6). No hay ajuste para ocultarlo.
- **Los dos toques**: el primero abre un recuadro con el campo de texto (una línea, opcional) y los dos botones de sentido, **Me sirvió** y **Me molestó**; el segundo, tocar un sentido, guarda la anotación con el texto escrito (§4.5) y cierra el recuadro. La persona no elige ni corrige el contexto.
- **Contexto**: se toma al tocar el sentido.
  - `anotadaEn` = ese momento.
  - `pantalla` = el **Panel de edición** si el panel está abierto (al crear o al editar), sobre cualquier pantalla; si no, la pantalla donde está: Pendientes, Historial, Etiquetas o Anotaciones.
  - `tareaId`: si el panel está abierto al **editar** una tarea, esa tarea; si no, si el aviso de deshacer (§5.4) está visible, la tarea que nombra; si no, ninguna. Con el panel abierto al **crear** no hay tarea, y con el panel abierto manda la tarea del panel aunque haya un aviso de deshacer visible.
- **No toca la tarea ni el panel**: anotar no es un cambio para **Cambios sin guardar** (§6.2), no cierra el panel, no cambia de pestaña ni abre ningún aviso de acción.
- **Cerrar sin anotar**: **Atrás** cierra el recuadro (§6.2, Atrás); cerrarlo sin elegir un sentido descarta el texto escrito sin preguntar, y no guarda nada.
- **Confirmación**: al guardarse, un texto breve e informativo, «Anotación guardada», sin botones, que se va solo y no tapa el aviso de deshacer (§5.4).
- **Nunca se pide**: no hay avisos, recordatorios, contadores ni marcas de «sin anotar», y el gesto no cambia de aspecto según cuántas anotaciones haya.
- **Borrar una tarea** borra también sus anotaciones, en el mismo borrado que sus completados (§6.2, §7). Una anotación cuya tarea ya no existe no se muestra ni se copia y la app la limpia al detectarla (§7). Las anotaciones sin tarea no se ven afectadas.

Ejemplo: el `2026-07-15T08:05:00`, con el panel de edición de «🌱 Regar» abierto, se toca **Anotar**, se escribe «  quedó lindo  » y se toca **Me sirvió**: se guarda `sentido` = Me sirvió, `anotadaEn` = `2026-07-15T08:05:00`, `pantalla` = Panel de edición, la tarea «🌱 Regar» y `texto` = «quedó lindo»; el panel sigue abierto y sin cambios sin guardar.

## 6. Pantallas

La interfaz está en **español** y el tema claro u oscuro sigue al sistema.

**Navegación**: una barra fija con cuatro pestañas, en este orden: **Pendientes** (ruta `/`), **Historial** (ruta `/historial`), **Etiquetas** (ruta `/etiquetas`) y **Anotaciones** (ruta `/anotaciones`), sin contador ni marca de anotaciones nuevas. La pestaña de la pantalla actual se ve elegida.

**Fuente y emoji empaquetados**: la app se ve igual en todas las máquinas. Todo el texto usa la fuente **Atkinson Hyperlegible Next** y todo emoji se dibuja con **Noto Color Emoji**; ambas viajan con la app (§2, §7) y no hay opción para cambiarlas.

- **Alcance**: las dos rigen en todo texto y todo emoji de todas las pantallas (Pendientes, Historial, Etiquetas, el panel y sus avisos, el selector de emoji con sus Recientes, el aviso de deshacer y la pantalla de entrada), también en campos y botones, y en los dos temas. Incluye un emoji pegado o tecleado en un título, una nota o una etiqueta. Quedan fuera solo los elementos que dibuja el sistema y la app no controla (el teclado del celular, los calendarios y listas nativas de un campo).
- **Sin cambios de diseño**: tamaños, pesos y jerarquía visual no cambian, y las horas (`HH:MM`) siguen con cifras de ancho fijo. **Única excepción**: el campo **Título** del panel (§6.2) pasa a **20px (1.25rem)**, más grande que la **Nota**, que sigue en 16px. Las demás reglas de presentación de este capítulo valen igual con la fuente nueva.
- **Sin conexión y sin servicios externos**: la fuente y el juego de emoji completo (unos 5,8 MB comprimidos) viajan con la app, sin pedirse a un servicio externo, y funcionan sin conexión, también para un emoji que nunca se vio en ese dispositivo. Cada dispositivo los baja sin preguntar ni avisar, aparte de la instalación de la app: mientras la pantalla de carga (§6.6) está abierta, la app espera la descarga, y si llega el tope de esa pantalla la descarga sigue en segundo plano; la app se instala siempre, aunque la fuente o el juego de emoji no se puedan bajar, y las fuentes se bajan con reintentos. Si el juego de emoji (Noto) falla, la app igual queda disponible sin conexión, con el emoji del dispositivo. Quien ya tiene la app los recibe con la próxima versión, sin preguntar ni avisar (§8).
- **Mientras no están disponibles**: desde que se va la pantalla de carga (§6.6), si la fuente o el juego de emoji todavía no se bajaron, o no se pueden cargar, o el navegador no puede dibujar el juego, el texto se ve con la fuente del sistema y el emoji con el del dispositivo, sin aviso, y cambian solos cuando están disponibles. Mientras la pantalla de carga está abierta no se ve ningún respaldo: se espera lo que falte (§6.6). El texto nunca queda invisible y un emoji nunca se ve en blanco. Si la descarga del juego de emoji se aborta por una falla de red, la app lo vuelve a pedir al recuperar la conexión, sin recargar, y el emoji cambia solo cuando llega.
- **Qué se dibuja con qué**:

| Carácter | Se ve con |
|---|---|
| Letras y signos que tiene Atkinson (español incluido), cifras, `#`, `*`, `©`, `®`, `™` sin marca de emoji | Atkinson Hyperlegible Next |
| Carácter de texto que Atkinson no tiene (otro alfabeto en un título, por ejemplo) | la fuente del sistema |
| Carácter con versión de texto y de emoji, sin marca de emoji, que Atkinson no tiene (`❤`, `☀`, `☎`, `✈`) | Noto Color Emoji |
| Emoji (con o sin marca de emoji, `❤️`, `#️⃣`; ZWJ, tono, bandera), si Noto lo tiene | Noto Color Emoji |
| Emoji que Noto no tiene (de una versión de Unicode más nueva, llegado por otro dispositivo) | el emoji del dispositivo |

- **El dato no cambia**: empaquetar no cambia qué emoji son válidos (§4.1) ni cuáles ofrece el selector (§6.2); un emoji que el juego no tiene se guarda y se muestra igual. Hoy Noto dibuja como un solo glifo cada uno de los emoji que ofrece el selector (incluidas las variantes de un tono), así que el selector no pierde ninguno.

**Orientación**: la app instalada se usa en vertical. Abierta desde su ícono en el celular, no gira nunca: girar el teléfono no la pasa a horizontal.

- **Alcance**: rige en todas las pantallas de la app instalada (Pendientes, Historial, Etiquetas, el panel y sus avisos, la pantalla de entrada y la pantalla de carga, §6.6), sin excepciones.
- **Qué sentido**: cualquiera de los dos sentidos verticales que el sistema permita; la app no fija uno.
- **Solo la app instalada**: abierta en una pestaña del navegador sigue girando como hoy y, en horizontal, se ve el diseño ancho de siempre (§6.2, Pantallas anchas). En la compu no cambia nada: en una pantalla de escritorio la orientación no la elige la app, tampoco instalada.
- **Versión nueva**: quien ya tiene la app instalada recibe el cambio solo, sin reinstalar, preguntar ni avisar, como toda versión nueva (§8); el sistema puede tardar algunas aperturas en aplicarlo.

### 6.1 Pendientes (principal)

- Una sola lista, **ordenada automáticamente por urgencia**:
  1. `atrasada`: la que lleva más tiempo atrasada, primero.
  2. `pendiente`: las que tienen vencimiento o fecha límite más antiguos van primero; las puntuales sin fecha límite van al final, por fecha de creación.
  3. `en espera`: las que vuelven antes van primero.

  Cada grupo compara un instante (hora local), del más antiguo al más reciente:

  | Grupo | Puntual | Relativa | Calendario |
  |---|---|---|---|
  | `atrasada`: desde que está atrasada | 00:00 del día siguiente a `fechaLimite` | `V + intervalo` | 00:00 del día siguiente a `N` |
  | `pendiente`: desde que está pendiente | 00:00 de `fechaLimite`; sin fecha límite, al final del grupo, por `creadaEn` | `V`; nunca completada, `creadaEn` | 00:00 de `N` |
  | `en espera`: cuándo vuelve a pendiente | — | `V` | 00:00 de `N` |

  Horas y días se comparan en el mismo eje de tiempo. Si dos tareas empatan, va primero la de `creadaEn` más antigua; si también empatan, por título en orden alfabético en español (sin distinguir mayúsculas ni acentos, con la ñ después de la n); y si siguen empatadas, por `id`.
- **Filtro por etiqueta**: chips arriba ("Todas" + una por etiqueta, en el orden de la §4.3). Se elige una sola a la vez.
  - "Todas" muestra la lista entera. Una etiqueta muestra solo las tareas que la tienen, en el mismo orden por urgencia.
  - Hay un chip por cada etiqueta, tenga o no tareas pendientes. Sin etiquetas, no se muestra la fila de chips.
  - Si el filtro deja la lista vacía, se ve el texto "No hay tareas con esta etiqueta".
  - El filtro elegido se mantiene al ir a otra pantalla y volver; vuelve a "Todas" al recargar o al abrir la app.
  - Si la etiqueta elegida se borra (en este dispositivo o en otro), el filtro vuelve a "Todas".
  - El filtro aplica solo a Pendientes; el Historial no se filtra.
- **Solo rápidas**: un botón conmutable "Solo rápidas" junto a los chips de etiqueta (se ve aunque no haya etiquetas). Encendido, la lista muestra solo las tareas con `esfuerzo` = `rapida`, en el mismo orden; se combina con el filtro por etiqueta (las dos condiciones a la vez) y aplica también a completadas y pausadas cuando se muestran. Si deja la lista vacía, se ve "No hay tareas rápidas" (con una etiqueta elegida, "No hay tareas con esta etiqueta"). Como el filtro por etiqueta: se mantiene al ir a otra pantalla y volver, y vuelve a apagado al recargar o al abrir la app.
- **Mostrar pausadas**: un check junto a "Completadas", con el texto "Pausadas". Apagado (el valor inicial), las pausadas (§5.8) no se ven. Encendido, van al final de la lista (después de las completadas, si se muestran), por título en el orden alfabético de arriba; cada fila atenuada, con el texto "Pausada" en lugar del texto de atraso o de regreso y el checkbox deshabilitado. El filtro por etiqueta aplica también a las pausadas. El valor se guarda en ese dispositivo, como "Mostrar completadas".
- **Mostrar completadas**: un check arriba de la lista, con el texto "Completadas".
  - Una tarea está **completada** si es puntual con al menos un completado (§5.1), o periódica `en espera` con al menos un completado (§5.2, §5.3). Una periódica `en espera` sin completados (de calendario, antes de su primera ocurrencia) no está completada.
  - Apagado (el valor inicial): la lista muestra solo las tareas no completadas. Al completar una tarea, su fila desaparece de la lista.
  - Encendido: después de las no completadas (en el orden de arriba) van las completadas, de la de `completadoEn` más reciente a la más antigua; si empatan, se aplican los mismos desempates de arriba.
  - El filtro por etiqueta aplica también a las completadas.
  - El valor se guarda **en ese dispositivo** (no se sincroniza, no está en Firestore) y sobrevive a recargar la app.
- **Contraste**: el título de una tarea no completada se ve en **negrita**; el de una completada, tachado, en peso normal y atenuado, con el checkbox marcado. Las no completadas resaltan sobre las completadas a simple vista.
- Cada fila muestra:
  - Checkbox a la izquierda, con área táctil de al menos 48×48.
  - Emoji y título (§4.1: sin emoji, solo el título). La nota no se ve en la fila.
  - Chips de etiquetas (nombre y color, en el orden de la §4.3). No se pueden tocar como filtro: tocar el chip es tocar la fila.
  - Si la tarea está `atrasada`, el texto de atraso «Tocaba …» (**Fecha y distancia**, abajo), que reemplaza a «Atrasada» como indicador de atraso. No lleva color de alarma: se ve en el mismo color y el mismo tamaño de texto secundario que el esfuerzo y el horario, sin rojo ni énfasis. No se ve en una pausada.
  - Si la tarea tiene esfuerzo, su nivel en texto chico: "Rápida", "Media" o "Larga". Sin esfuerzo, nada.
  - Si la tarea tiene horario, el horario en texto chico: "08:00–11:00"; con varios, en orden y separados por " · ": "07:00–10:00 · 18:00–21:00".
  - En las tareas `en espera`: estilo atenuado, una barra de progreso fina con el tiempo hasta que vuelven y el texto de regreso «Vuelve …» (**Fecha y distancia**, abajo). Vale también para las periódicas completadas que se ven con **Mostrar completadas** y para las pospuestas, sin nombrar la posposición en la fila.
  - Las filas `pendiente`, las pausadas y las puntuales completadas no muestran texto de fecha ni de distancia.
**Fecha y distancia** (texto de atraso y de regreso de la fila, y cierre del aviso de completar, §5.4): una sola regla arma el texto de las tres. Las tareas que no son `atrasada` ni `en espera` no lo llevan.

- **Frase**: «Tocaba <fecha>[ · <distancia>]» en una `atrasada` y «Vuelve <fecha>[ · <distancia>]» en una `en espera`. «el» va solo delante de la fecha con día de la semana; con «hoy», «ayer» o «mañana» no. Ejemplos (ahora = viernes 13 de noviembre de 2026, 10:00): «Tocaba el martes 10 · hace 3 días», «Tocaba ayer», «Tocaba hoy 09:00 · hace 1 hora», «Tocaba hoy 10:00 · ahora», «Vuelve mañana», «Vuelve hoy 18:00 · en 8 horas», «Vuelve hoy 10:40 · en 40 minutos», «Vuelve el jueves 19 · en 6 días». Sin felicitaciones ni otras palabras.
- **Instante de «Tocaba»** (desde cuándo toca la tarea; nunca es un instante futuro):

| Tipo | Instante |
|---|---|
| Puntual con fecha límite | el día `fechaLimite`, sin hora, tenga o no horario |
| Relativa | `V` (con hora) |
| Calendario | el día de `N`, sin hora |
| Periódica con horario (§5.5) | `A`; con varios horarios (§5.6, §5.7), el inicio de `N` |

  Si `A` todavía no llegó (la tarea se atrasó por el atraso sin horario de §5.5 antes de que abriera su ventana), se usa el instante sin horario: `V`, o 00:00 de `N`. Una puntual sin fecha límite nunca está `atrasada`, así que no lleva «Tocaba».
- **Instante de «Vuelve»**: el mismo con el que esta sección ordena las `en espera` (cuándo vuelve a pendiente): relativa, `V`; calendario, 00:00 de `N`; con horario, `A` (§5.5; una puntual fuera de ventana, el `desde` de la próxima); pospuesta, `pospuesta.hasta` (§5.9). Si dos causas la tienen `en espera`, el instante en que deja de estarlo (el más tarde de los dos).
- **Fecha**: «hoy», «ayer» o «mañana» si el instante cae en esos días locales (el día empieza a las 00:00); si no, el día de la semana y el número («martes 10»), con « de <mes>» en minúsculas si el mes no es el de ahora («martes 28 de octubre») y « de <año>» si el año no es el de ahora («miércoles 31 de diciembre de 2025»). Lleva la hora `HH:MM` en 24 h (cifras de ancho fijo) cuando el instante no es las 00:00 (horario, relativas, posposición): «hoy 18:00», «martes 10 19:30». Es el formato de **Última vez** (§6.2) y del Historial (§6.3).
- **Distancia**, después de la fecha, separada por « · »:
  - A 2 o más días locales: «hace N días» / «en N días» (diferencia en días locales, como **Última vez**), con o sin hora en la fecha.
  - Con la fecha «hoy», «ayer» o «mañana» y con hora: en horas («hace 3 horas», «en 1 hora») o, a menos de una hora, en minutos («hace 40 minutos», «en 40 minutos»). Lo pasado se redondea hacia abajo y lo futuro hacia arriba, nunca «en 0 minutos». Se cuenta desde ahora, aunque cruce la medianoche («Tocaba ayer 23:00 · hace 2 horas» a la 01:00).
  - Con la fecha «hoy», «ayer» o «mañana» y con hora, si el instante cae a menos de un minuto en el pasado, la distancia es «ahora», no «hace 0 minutos» («Tocaba hoy 10:00 · ahora» a las 10:00:30). Lo futuro sigue hacia arriba: nunca «en 0 minutos».
  - Con la fecha «hoy», «ayer» o «mañana» y sin hora: no hay distancia, la palabra ya lo es («Tocaba ayer», «Vuelve mañana»).
- **Se actualiza solo** con el paso del tiempo (al pasar la medianoche, la hora o el minuto que corresponda), como **Última vez** con el panel abierto. No cambia el estado ni el orden de la lista.
- Solo son textos y color: los estados de §5 y el orden de esta sección no cambian.

- Si tocar el checkbox completaría la tarea y ahora está fuera de su ventana (§5.5), el checkbox está deshabilitado. Si lo borraría, siempre está habilitado.
- Tocar el checkbox de una tarea no completada la completa. Tocar el checkbox de una completada:
  - Puntual: borra su completado más reciente (como Deshacer, §5.4) y la tarea vuelve al estado que corresponda.
  - Periódica cuyo completado más reciente es de hoy o posterior (día local de `completadoEn`; posterior solo con relojes desfasados, §5.2): lo borra, igual que una puntual.
  - Periódica cuyo completado más reciente es de un día anterior: la completa de nuevo (agrega un completado; §5.2 reinicia el intervalo, §5.3 cubre la próxima ocurrencia).
- Tocar la fila abre el **panel de edición**.
- Un botón **+** crea una tarea nueva con el mismo panel.

### 6.2 Panel de edición

Campos:

- Título, emoji, nota y etiquetas (con autocompletado y creación de etiquetas nuevas). El campo **Título** se ve en 20px (1.25rem), más grande que la **Nota** (16px; §6, Sin cambios de diseño).
- **Emoji**: no hay campo de texto; se elige con un **selector propio**.
  - El panel muestra el emoji elegido (con un botón para cambiarlo) o, si no hay, un botón **Elegir emoji**. Con emoji hay además un botón **Quitar emoji** que deja la tarea sin emoji. Como no se puede escribir, no existe el error "Ingresá un solo emoji".
  - El selector ofrece **1914 emoji base** con sus **variantes de un tono de piel**, agrupados por categoría (con navegación entre categorías), y una **búsqueda en español** (por ejemplo "planta", "escoba", "perro"). Elegir un emoji lo asigna a la tarea y cierra el selector. No ofrece los 9 emoji del grupo de componentes (los 5 tonos de piel y los 4 tipos de cabello sueltos) ni las variantes de dos tonos de piel. Lo que llegue por otra vía se rige por §4.1: un tono de piel suelto es inválido y se rechaza; un cabello suelto (🦰, 🦱, 🦳, 🦲) y una variante de dos tonos (🧑🏻‍🤝‍🧑🏿) son un emoji válido, se guardan y se muestran igual.
  - El selector **funciona sin conexión**: el catálogo y los textos de búsqueda viajan empaquetados con la app, sin pedirse a un servicio externo.
  - **Recientes**: el selector muestra primero los últimos emojis elegidos, del más reciente al más viejo. Reglas: al elegir un emoji pasa al primer lugar; si ya estaba en la lista no se repite (se mueve al primer lugar); la lista guarda como máximo **16** emojis y al agregar uno nuevo con la lista llena se descarta el más viejo. Quitar el emoji no modifica la lista. Los recientes se guardan **en ese dispositivo** (no se sincronizan, no están en Firestore) y sobreviven a recargar la app.
- **Nota**: campo de texto de varias líneas. Se ve y se edita solo en el panel; vacía deja la tarea sin nota.
- **Etiquetas**: las de la tarea se ven como chips, cada uno con un botón para quitarlo.
  - Al escribir, el autocompletado sugiere las etiquetas existentes cuyo nombre contiene lo escrito (sin distinguir mayúsculas ni acentos), sin las que la tarea ya tiene, en el orden de la §4.3. Si ninguna coincide exactamente (sin distinguir mayúsculas), ofrece también «Crear "x"».
  - Una etiqueta que la tarea ya tiene no se agrega dos veces.
  - Las etiquetas nuevas se crean al guardar (§4.3). Un nombre de etiqueta inválido (vacío o de más de 30 caracteres) no se agrega: se ve el error en el campo Etiquetas ("El nombre puede tener hasta 30 caracteres"; solo espacios no ofrece crear). Guardar con un nombre inválido rechaza la creación o la edición entera.
- **Horario** (opcional, cualquier tipo): un check "Solo en un horario" que, encendido, muestra dos campos de hora, **Desde** y **Hasta**. Apagado, la tarea no tiene horario. Con `desde` ≥ `hasta` se ve el error "La hora de fin tiene que ser posterior a la de inicio"; con el check encendido y una de las dos horas vacía, "Completá las dos horas". En los dos casos no se guarda.
  - Debajo de las ventanas hay un botón **Agregar horario** que agrega otra fila Desde/Hasta vacía, y cada fila (si hay más de una) tiene un botón **Quitar**. Al guardar, las ventanas quedan ordenadas por `desde`. Ventanas superpuestas muestran el error "Los horarios no se pueden superponer" y no se guarda.
  - Una relativa en horas con más de una ventana muestra el error "Con varios horarios, el intervalo tiene que ser en días" y no se guarda.
- **Esfuerzo** (opcional, cualquier tipo): un selector con "Sin estimar" (el valor inicial), "Rápida (≤ 5 min)", "Media (≈ 15 min)" y "Larga".
- **Posponer** (solo al editar una tarea `pendiente` o `atrasada` no pausada): las opciones **1 hora**, **3 horas** y **Hasta mañana** se ven directamente en el panel, sin un botón **Posponer** intermedio (§6.2, Presentación); elegir una actúa en el momento y cierra el panel (con cambios sin guardar, primero abre el aviso de acción de **Cambios sin guardar**). Si la tarea está pospuesta, el panel muestra "Pospuesta hasta HH:MM" (o "hasta mañana HH:MM") y un botón **Quitar posponer**, que también actúa en el momento (con la misma excepción).
- **Pausar / Reanudar** (solo al editar una periódica): un botón **Pausar**; si la tarea está pausada, el panel lo indica ("Pausada") y el botón es **Reanudar**. El botón actúa en el momento (guarda y cierra el panel), sin pasar por **Guardar**; con cambios sin guardar, primero abre el aviso de acción de **Cambios sin guardar**.
- Tipo, elegido en **Se repite** con cuatro opciones: **No se repite** (puntual: fecha límite opcional), **Intervalo** (periódica en modo relativo: N + horas/días), **Días de la semana** y **Días del mes** (periódica en modo calendario). Al crear una tarea, la opción de **Se repite** que viene elegida es **No se repite**.

El mismo panel sirve para crear (botón **+**) y para editar (tocar la fila). Al editar se abre con los valores actuales de la tarea.

**Última vez** (solo al editar): debajo del título del panel se ve cuándo se completó la tarea por última vez, según su `completadoEn` más reciente y el **día local** (el día empieza a las 00:00):

- Del día de ahora: "Última vez: hoy 08:05" (hora en 24 h, `HH:MM`).
- Del día anterior: "Última vez: ayer 19:30".
- De N ≥ 2 días antes: "Última vez: hace N días" (diferencia en días locales, sin hora).
- De un día posterior a hoy (relojes desfasados, §5.2): con la fecha, como en el Historial (§6.3): "Última vez: jueves 16 de julio 08:05".
- Sin completados: "Última vez: nunca".
- Se actualiza mientras el panel está abierto (al pasar la medianoche, al completar o borrar desde otro dispositivo).

**Editar**:

- Valen las mismas validaciones que al crear (§4.1–§4.2). Si algún campo es inválido, la edición se rechaza entera: no se guarda ningún campo, el panel sigue abierto y muestra el error en el campo.
- **Cerrar** (la **X**, o **Atrás** en Android) con cambios sin guardar pide confirmación en lugar de descartarlos (**Cambios sin guardar**, abajo); sin cambios cierra directo. Guardar sin cambios no cambia nada.
- Editar nunca cambia `id` ni `creadaEn` y nunca toca los completados. El estado se recalcula con la definición nueva (§5): editar puede cambiar el estado y la posición en la lista.
- Se puede cambiar el tipo (puntual ↔ periódica) y el modo (relativo ↔ calendario, semanal ↔ mensual). Los completados se conservan y siguen contando:
  - Una periódica con completados que pasa a puntual queda completada (§5.1: tiene al menos un completado): con **Mostrar completadas** apagado **sale de Pendientes**; encendido, se ve tachada con las completadas (§6.1).
  - Una tarea con completados que pasa a calendario toma `P` según §5.3 (los completados sin `ocurrenciaCubierta` aportan el día de su `completadoEn`).
  - Una puntual completada no tiene fila en Pendientes con **Mostrar completadas** apagado (encendido, se ve tachada al final, §6.1); si se edita (por ejemplo, desde el historial) y pasa a periódica, se rige por las reglas de periódica con esos completados.

**Cambios sin guardar** (al crear y al editar):

- **Hay cambios** cuando **Guardar** cambiaría algo respecto de los valores con que se abrió el panel. Escribir y volver al valor original no cuenta; tampoco los espacios que **Guardar** recorta ni el orden de las ventanas de horario, que **Guardar** ordena. Un campo vaciado o una fila de horario vacía sí cuentan, aunque sean inválidos. Única excepción: el texto sin confirmar del campo Etiquetas cuenta como cambio (salvo que sean solo espacios) aunque **Guardar** no cambie nada por él; **Guardar** no crea esa etiqueta, y si el texto es un nombre inválido que hace fallar **Guardar**, vale **Si Guardar falla** (abajo). Esta es la única definición de "hay cambios": vale para cerrar, para crear, para las acciones y para la confirmación del navegador.
- **Se mide contra los valores al abrir el panel**, no contra lo que otro dispositivo escribió después: un cambio remoto no hace aparecer el aviso.
- **Al crear**, "sin cambios" significa que el formulario sigue como se abrió. Tocar cualquier campo con otro valor (por ejemplo **Se repite** o el esfuerzo) es cargar algo; un título de solo espacios no. Si está vacío, cierra directo; si cargaste algo, pide confirmación.
- **Aviso de cierre**: cerrar con la **X** (o **Atrás**, ver **Atrás**) con cambios abre el aviso "Tenés cambios sin guardar" con tres botones: **Seguir editando** (cierra el aviso y deja el panel como estaba, en la misma pestaña), **Descartar** (cierra el panel sin guardar) y **Guardar** (guarda como **Guardar** y, si guarda, cierra el panel). **Descartar** no quita de **Recientes** un emoji elegido en el panel: los recientes se actualizan al elegir, sin depender de guardar.
- **Aviso de acción**: **Pausar**, **Reanudar**, **Posponer** (**1 hora**, **3 horas**, **Hasta mañana**) y **Quitar posponer** con cambios abren el aviso "Tenés cambios sin guardar" con tres botones: **Seguir editando** (cierra el aviso sin actuar), **Descartar y <acción>** (descarta los cambios, actúa sobre la tarea tal como estaba guardada y cierra el panel) y **Guardar y <acción>** (guarda como **Guardar**, actúa sobre la tarea guardada y cierra el panel), con `<acción>` = pausar, reanudar, posponer o quitar posponer (para posponer, con la opción tocada: "Descartar y posponer 1 hora"). Sin cambios, la acción actúa en el momento, como siempre. "Ahora" de §5.8 y §5.9 es el momento de tocar el botón del aviso, no el de elegir la acción. Ejemplo: se elige **1 hora** a las `2026-07-15T08:00:00`, el aviso queda abierto y se toca **Guardar y posponer 1 hora** a las `2026-07-15T08:03:00`: `pospuesta = { desde: 2026-07-15T08:03:00, hasta: 2026-07-15T09:03:00 }`.
- **Si lo guardado deja la acción sin sentido**: una acción "queda sin sentido" si la tarea, como quedaría guardada, no cumple las condiciones con que §5.8, §5.9 y este apartado la muestran (por ejemplo, se cambió a **No se repite** y se tocó **Pausar**; se cambió a **No se repite** una periódica pausada y se tocó **Reanudar**, porque guardar ya la reanuda, §5.8). Entonces el aviso dice "Con estos cambios la tarea ya no se puede <acción>" y ofrece solo **Seguir editando** y **Descartar y <acción>**, sin **Guardar y <acción>**. Si lo escrito es inválido no hay cómo evaluarlo: se ofrece **Guardar y <acción>** y, al tocarlo, falla según **Si Guardar falla**. Las acciones a la vista del panel se siguen decidiendo con la tarea de ahora, no con lo escrito.
- **El aviso de acción se mantiene al día** mientras está abierto, con la tarea y el ahora del momento, como las acciones a la vista: si otro dispositivo cambia la tarea o pasa el tiempo, **Guardar y <acción>** puede aparecer o desaparecer. Al tocarlo se vuelve a evaluar; si ya no corresponde, no se guarda ni se actúa y el aviso queda actualizado. Si otro dispositivo hace que la acción ya no corresponda (por ejemplo, pausa la tarea con el aviso de **Pausar** abierto), el aviso se cierra y queda el panel con lo escrito.
- **Si Guardar falla** (desde el aviso de cierre o el de una acción) por validación (reglas de arriba y §4.1–§4.2): no se ejecuta nada, ni la acción ni el cierre. El aviso se cierra, el panel sigue abierto con lo escrito y salta a la primera pestaña con error, con las reglas de **Errores**.
- **Los avisos se abren sobre el panel** con las reglas de **Sobre el panel**: bloquean lo de abajo y, al cerrarlos, se vuelve a la misma pestaña sin perder nada.
- **Si otro dispositivo borra la tarea** con un aviso abierto, se cierran el aviso y el panel sin pedir nada (§7, gana el borrado).
- **Borrar tarea** no suma este aviso: mantiene solo su confirmación.
- **Atrás** (botón Atrás de Android, o el gesto equivalente del navegador), con el panel abierto, cierra el panel y no sale de la pantalla donde está (Pendientes, o Historial si el panel se abrió desde ahí), en cualquier navegador y ancho. Cierra solo lo que esté más arriba, como si se tocara su salida, y deja el panel como estaba:
  - el aviso de cierre o de acción equivale a **Seguir editando**;
  - la confirmación de **Borrar tarea** equivale a cancelar;
  - el selector de emoji se cierra sin elegir;
  - el recuadro de **Anotar** (§5.10) se cierra sin anotar.

  Un nuevo **Atrás** cierra el panel; si el panel queda con cambios, abre el aviso de cierre, y sin cambios cierra directo. El aviso de deshacer (§5.4) no cuenta: no se abre encima de nada, **Atrás** lo ignora y sigue sus 5 segundos. Las sugerencias de Etiquetas tampoco cuentan como algo abierto. Con el teclado en pantalla abierto, el primer **Atrás** lo cierra el sistema y el panel sigue igual; el siguiente aplica estas reglas.
  - Con el panel cerrado, **Atrás** hace lo de hoy: cerrar el panel con la **X**, con **Guardar** o con una acción no deja un **Atrás** de más que no haga nada, y **Adelante** no reabre un panel. Los diálogos de Historial y de Etiquetas (§6.3, §6.4) no cambian con esta feature. Con el panel cerrado y el recuadro de **Anotar** abierto, **Atrás** lo cierra y no sale de la pantalla donde está.
- **Recargar o cerrar la app** con cambios sin guardar muestra la confirmación del navegador. Aparece solo si hay cambios, con un aviso abierto o sin él, y nunca por **Atrás** con el panel abierto. Su texto es el del navegador y, donde el sistema no la ofrece, se pierde lo escrito. Al recargar, el panel no se reabre. Un **Atrás** posterior a una recarga puede volver a la misma pantalla sin efecto visible.

**Borrar tarea**: acción disponible solo al editar. Pide confirmación; si se cancela, no cambia nada. No suma el aviso de **Cambios sin guardar**.

Al borrar una tarea **se borran también todos sus completados** (y solo los suyos), así que desaparecen del historial, y **todas sus anotaciones** (y solo las suyas, §5.10), que desaparecen de la pantalla Anotaciones.

**Presentación del panel**: el contenido de los campos y acciones de arriba se organiza en tres secciones, **Tarea**, **Cuándo** y **Acciones**. "Celular" significa una pantalla de hasta **40rem** de ancho (inclusive); por encima, pantallas anchas. Las reglas de cada campo no cambian, solo dónde se ven.

- **Contenido y orden de las secciones** (igual en celular y en pantallas anchas):
  - **Tarea**: arriba, "Pausada" (si corresponde), "Pospuesta hasta HH:MM" (o "hasta mañana HH:MM") y **Última vez**; después el título con el emoji al lado (el botón de emoji junto al campo Título, con **Quitar emoji** debajo); la nota; el esfuerzo; las etiquetas.
  - **Cuándo**: primero **Se repite**, con sus cuatro opciones en una grilla de 2x2 y los campos de la opción elegida (fecha límite, Cada, días); después **Solo en un horario** con sus ventanas (**Agregar horario**, **Quitar**).
  - **Acciones**: **Posponer** (las opciones **1 hora**, **3 horas**, **Hasta mañana** a la vista) o **Quitar posponer**; **Pausar** o **Reanudar**; y al final, separado del resto y en el color de error, **Borrar tarea**. Cada acción aparece con las condiciones de la §5.8, la §5.9 y de este apartado, y se actualiza si otro dispositivo cambia la tarea con el panel abierto.
- **Celular** (hasta 40rem):
  - El panel ocupa **toda la pantalla**.
  - Las secciones son **pestañas** con una barra de pestañas: Tarea, Cuándo y Acciones. Siempre abre en **Tarea**, al crear y al editar. Se cambia de pestaña solo tocándola, sin deslizar.
  - El encabezado (con el título del panel y la **X** para cerrar) y la barra de pestañas quedan fijos; solo se desplaza el contenido, y cada pestaña se abre desde arriba.
  - **Guardar** está en una barra fija abajo, visible en todas las pestañas. **Cerrar** es la **X** del encabezado.
  - Al crear una tarea la pestaña **Acciones** no aparece (no hay acciones disponibles). Al editar aparece siempre, porque **Borrar tarea** está disponible en toda edición.
- **Pantallas anchas** (más de 40rem): el panel tiene el ancho y la ubicación de siempre, sin barra de pestañas; las tres secciones se ven seguidas, cada una con su nombre como título (**Tarea**, **Cuándo**, **Acciones**) y las acciones como una sección más antes del pie, que lleva **Guardar** (barra fija abajo) y la **X** de **Cerrar** en el encabezado fijo.
- **Nada se pierde**: cambiar de pestaña o de ancho no pierde nada de lo escrito, incluido el texto sin confirmar del campo Etiquetas. **Guardar** considera todas las secciones (es un solo formulario) y solo **Cerrar** (confirmado con **Descartar**, si hay cambios) o **Descartar y <acción>** descartan los cambios.
- **Errores**: una pestaña se marca mientras alguno de sus campos muestra un error, sea cual sea su origen (al guardar, o el error en vivo de Etiquetas); la marca dura lo que dura el mensaje y se distingue del icono de la pestaña. Los errores de Título y Etiquetas son de **Tarea**; los de fecha límite, Cada, días y horario, de **Cuándo**.
  - Si **Guardar** falla, el panel salta a la primera pestaña con error (**Tarea** antes que **Cuándo**) y el contenido se desplaza hasta el primer campo con error. Lo mismo vale en pantallas anchas, donde no hay pestañas: solo se desplaza hasta el primer campo con error.
- **Teclado en pantalla**: abrir el panel no enfoca ningún campo, así el teclado del celular no aparece hasta que se toca uno. La barra de **Guardar** se oculta **solo mientras el teclado en pantalla está abierto** (en cualquier pestaña y ancho) y vuelve al cerrarse, aunque el campo siga enfocado; un campo enfocado sin teclado en pantalla (en la compu, o en los selectores de fecha y hora) no la oculta. El encabezado y las pestañas siguen fijos. El teclado no cambia cómo se envía el formulario: Enter en un campo de una línea guarda, Enter en Nota agrega una línea y Enter en Etiquetas elige la sugerencia; si ese guardado falla, valen las reglas de Errores.
- **Iconos**: llevan icono, siempre junto a su texto, las pestañas **Tarea**, **Cuándo** y **Acciones** y las acciones **1 hora**/**3 horas**/**Hasta mañana** (Posponer), **Quitar posponer**, **Pausar**/**Reanudar** y **Borrar tarea**, en todos los anchos. Solo la **X** de cerrar y el botón de elegir emoji cuando no hay emoji llevan icono sin texto visible, y conservan los nombres accesibles «Cerrar» y «Elegir emoji». **Guardar**, **Agregar horario**, **Quitar**, **Quitar emoji**, los títulos de sección de pantallas anchas y los diálogos quedan solo con texto. Los iconos viajan con la app (§2, §7): funcionan sin conexión.
- **Sobre el panel**: el selector de emoji, la confirmación de **Borrar tarea** y los avisos de **Cambios sin guardar** se abren sobre el panel, como siempre; al cerrarlos se vuelve a la misma pestaña. En pantalla completa siguen visibles sin tapar el encabezado, las pestañas ni **Guardar** la franja "Sin conexión" (§7) y el aviso de deshacer (§5.4, sobre la barra de **Guardar**; con la barra oculta por el teclado, sobre el teclado). El aviso puede pasar por encima del contenido durante sus 5 segundos.

### 6.3 Historial

- Lista de todos los completados, puntuales y periódicos, sin límite ni paginación, ordenados del más reciente al más antiguo por `completadoEn`. Si dos tienen el mismo `completadoEn`, va primero el de `id` menor.
- Agrupados por **día local** de `completadoEn` (el día empieza a las 00:00). Cada grupo tiene un encabezado:
  - **Hoy** si es el día de ahora; **Ayer** si es el día anterior.
  - Si no, el día de la semana, el número y el mes en minúsculas: "martes 14 de julio"; si el año no es el de ahora, se agrega: "miércoles 31 de diciembre de 2025".
  - Un completado "del futuro" (relojes desfasados, §5.2) se agrupa por su propia fecha con el mismo formato: un día posterior a hoy se muestra con la fecha, nunca como "Mañana".
- Cada entrada muestra el **nombre actual** de la tarea (emoji y título, §4.1) (el completado no guarda título ni emoji: si la tarea se renombró o cambió de emoji, todas sus entradas muestran el nombre nuevo) y la **hora** de `completadoEn` en 24 h, `HH:MM` ("08:05").
- Cada entrada tiene la acción **Borrar** (deshacer). Pide confirmación en un diálogo que nombra la tarea y la fecha y hora del completado, con **Borrar** y **Cancelar**; Cancelar no cambia nada. Borrar sigue la §5.4.
- Tocar una entrada fuera de **Borrar** abre el panel **Editar tarea** de esa tarea (§6.2), también para una puntual completada, que con **Mostrar completadas** apagado no tiene fila en Pendientes.
- No muestra los completados huérfanos (§7) ni los de tareas borradas (§6.2).
- Sin completados, muestra el texto "Todavía no completaste nada".

### 6.4 Etiquetas

- Lista de todas las etiquetas, en el orden de la §4.3, cada una con su nombre y su color. Sin etiquetas, muestra el texto "Todavía no hay etiquetas". No se crean etiquetas desde esta pantalla (solo desde el panel, §6.2).
- **Renombrar**: valida el nombre como la §4.3. Un nombre inválido o repetido se rechaza con el error en el campo y no cambia nada: "El nombre no puede estar vacío", "El nombre puede tener hasta 30 caracteres" o "Ya existe una etiqueta con ese nombre" (si otra lo tiene, sin distinguir mayúsculas). Las tareas muestran el nombre nuevo.
- **Cambiar color**: se elige un color de la paleta.
- **Borrar**: pide confirmación en un diálogo que nombra la etiqueta ("¿Borrar la etiqueta «Cocina»?") y aclara que las tareas no se borran, con **Borrar** y **Cancelar**. Cancelar no cambia nada. Borrar quita la etiqueta de todas las tareas (§4.3).

### 6.5 Inicio de sesión

- Botón "Entrar con Google".
- Después del primer login, la app abre directo, también sin conexión.
- Abrir sin conexión sin haber iniciado sesión nunca muestra la pantalla de entrada con el mensaje "Necesitás conexión para entrar la primera vez" y el botón "Entrar con Google" deshabilitado.

### 6.6 Pantalla de carga

Al iniciar, la app muestra una **pantalla de carga** en lugar de la página en blanco y del contenido vacío de hoy.

- **Cuándo aparece**: cada vez que la app **arranca** (abrir, recargar, abrir con una versión nueva) y en cualquier pantalla de destino, desde lo primero que la app dibuja. No aparece al volver de segundo plano si la app sigue viva, ni después de tocar **Entrar con Google** (§6.5). La pantalla que dibuja el sistema al abrir una PWA instalada queda fuera (como en §6, Alcance).
- **Qué se ve**: el ícono de la app con un **pulso lento y suave**, sin parpadeo, giro ni indicador de progreso, y **sin texto visible**. El ícono tiene el nombre accesible «Cargando». Con la preferencia de movimiento reducido del sistema (`prefers-reduced-motion`) el ícono se ve quieto; lo demás no cambia. Sigue el tema claro u oscuro del sistema (§6).
- **Se va sola**: no se toca nada en ella y no avisa nada técnico (ni fuentes, ni descargas, ni sincronización). La franja "Sin conexión" (§7) se ve recién al entrar a la app.
- **Qué espera con sesión**: la respuesta de Auth y la **primera respuesta** de tareas, completados y etiquetas (del caché local o de la red), y también la fuente **Atkinson Hyperlegible Next** y **Noto Color Emoji**, aunque haya que bajarlas. Se va cuando todo eso está listo, con un **mínimo de 0,5 segundos** aunque esté todo listo enseguida.
- **Sin sesión**: no espera datos, porque no hay. Espera la respuesta de Auth y **solo Atkinson**; Noto sigue bajando detrás. Da paso a la pantalla de entrada (§6.5), que no cambia, también sin conexión. Si Noto no llegó al entrar, los emoji se ven un rato con los del dispositivo y cambian solos.
- **Tope de 10 segundos**: es uno solo para los datos y las fuentes y cuenta desde que la app arranca; la espera de Auth no entra en el tope. Al llegar, la app entra con lo que haya, como hoy, y la lista se completa sola, sin aviso; lo que falte de la fuente o del juego se ve con el respaldo (§6). La descarga no empieza de nuevo y cada cosa cambia sola cuando llega; si la descarga se aborta por una falla de red vale lo de §6 (se vuelve a pedir al recuperar la conexión).
- **No espera lo que no va a llegar**: sin conexión no espera nada que solo pueda venir por red: se va cuando respondió el caché local y están listas las fuentes ya guardadas. Una fuente que falló, o un juego que el navegador no puede dibujar, se deja de esperar en ese momento, aunque los reintentos sigan; lo demás pendiente se sigue esperando hasta el tope. Perder la conexión con la pantalla abierta cuenta igual. El mínimo de 0,5 s vale en todos los casos.
- **Versión nueva**: una versión nueva que no cambia la fuente ni el juego no los vuelve a bajar, y abrirla no los espera de nuevo.
- **Después de un tope con Noto sin bajar**: las próximas aperturas con sesión **no esperan a Noto** hasta que quede guardado, y se sigue bajando detrás. Solo cuenta un tope alcanzado con Noto sin bajar en una apertura que lo esperaba; una apertura sin sesión no lo espera, así que no cuenta. El dispositivo lo recuerda: vale solo en ese dispositivo (no se sincroniza, no está en Firestore, §7), no se ve, y se olvida cuando Noto queda guardado. Una versión nueva que cambia el juego lo trata como no guardado y vuelve a esperarlo una vez.

Ejemplos (con sesión): todo listo a los 0,2 s: se va a los 0,5 s. Los datos llegan a los 3 s y Noto a los 6 s: se va a los 6 s. Noto no llegó a los 10 s: entra a los 10 s con el emoji del dispositivo y las próximas aperturas no esperan a Noto hasta que quede guardado.

### 6.7 Anotaciones

- Lista de todas las anotaciones con tarea existente o sin tarea, de la más reciente a la más antigua por `anotadaEn` (si dos tienen el mismo, primero la de `id` menor), agrupadas por **día local** con los mismos encabezados del Historial (§6.3: **Hoy**, **Ayer**, «martes 14 de julio»).
- Cada anotación muestra la hora `HH:MM`, el sentido, la pantalla, el **nombre actual** de la tarea si la hay (emoji y título, §4.1; la anotación no guarda el nombre) y el texto si lo hay.
- No muestra las anotaciones huérfanas (§7) ni las de tareas borradas (§6.2).
- Sin anotaciones, muestra el texto "Todavía no hay anotaciones".
- **Editar texto**: cada anotación tiene la acción **Editar texto**, que cambia solo el texto con las reglas de §4.5 (vaciarlo la deja sin texto). El sentido, `anotadaEn`, la pantalla y la tarea no cambian.
- **Borrar**: cada anotación tiene la acción **Borrar**. Pide confirmación en un diálogo con **Borrar** y **Cancelar**; Cancelar no cambia nada.
- **Copiar**: un único botón **Copiar** copia como texto todas las anotaciones que la pantalla muestra, y funciona sin conexión. El texto tiene una línea por anotación, de la más antigua a la más reciente (si empatan, primero la de `id` menor), con fecha y hora, sentido, pantalla, nombre actual de la tarea y texto, separados por « · »; el nombre de la tarea y el texto solo si los hay. Ejemplo: `2026-07-15 08:05 · Me sirvió · Pendientes · 🌱 Regar · quedó lindo`, y sin tarea ni texto: `2026-07-15 09:10 · Me molestó · Historial`. Sin anotaciones no hay nada para copiar. Al copiar, un texto breve e informativo («Anotaciones copiadas»), sin botones, que se va solo. Si el portapapeles rechaza la copia, el mismo tipo de texto con «No se pudo copiar», sin más palabras: sin botones, se va solo, no tapa el aviso de deshacer (§5.4), y solo se ve un texto a la vez (el último reemplaza al anterior). No se copia nada y no cambia nada más; la app no hace otra cosa sola y la persona puede volver a tocar **Copiar**.

## 7. Datos, sincronización y offline

- **Firestore** con caché persistente local (`persistentLocalCache`, multi-pestaña). La app funciona sin conexión y sincroniza sola al reconectar.
- **Aviso de conexión**: mientras no hay red se ve un aviso chico y discreto (una franja) con el texto "Sin conexión"; desaparece al reconectar. No hay contador ni indicador de cambios pendientes.
- Estructura, toda bajo el usuario:
  - `users/{uid}/tareas/{tareaId}`
  - `users/{uid}/etiquetas/{etiquetaId}`
  - `users/{uid}/completados/{completadoId}`
  - `users/{uid}/anotaciones/{anotacionId}`
- **Conflictos**:
  - Tareas y etiquetas: **gana el último cambio, por campo** (`emoji` y `nota` son campos independientes, como `titulo`; `horario` es un solo campo: sus ventanas, con `desde` y `hasta`, se escriben juntas; pausar y reanudar escriben `pausada` y `reanudadaEn` juntos; `pospuesta` es un solo campo). Las ediciones son actualizaciones parciales (`update` / `set` con `merge`), nunca reemplazos del documento entero. Una edición escribe solo los campos que cambiaron.
  - La unidad de conflicto es cada campo de la §4.1. `recurrencia` se reemplaza **entera**, nunca se mezcla por subcampo (así no puede quedar una recurrencia que combine modos). Un campo que no corresponde al tipo de la tarea (`fechaLimite` en una periódica, `recurrencia` en una puntual) se ignora al derivar el estado; al cambiar de tipo, la tarea queda solo con los campos de tipo que muestra el panel: la edición quita el campo que deja de corresponder y escribe el del tipo nuevo aunque quede vacío (una puntual sin fecha límite), así un valor residual que dejó una edición concurrente en ese campo no sobrevive.
  - `etiquetas` de una tarea es un campo más: se reemplaza **entero** y gana el último cambio (no se unen los agregados de dos dispositivos).
  - En una etiqueta, `nombre` y `color` son campos independientes: renombrar en un dispositivo y recolorear en otro conserva los dos cambios.
  - **Etiquetas duplicadas**: si dos dispositivos sin conexión crean etiquetas con el mismo nombre (sin distinguir mayúsculas), o renombran dos etiquetas a un mismo nombre, al detectarlo la app las **fusiona**: sobrevive la de `id` menor, con su nombre y su color; las tareas que tenían la otra pasan a tener la sobreviviente (sin repetirla), y la otra se borra.
  - **Etiqueta borrada**: una tarea que referencia una etiqueta que ya no existe (por ejemplo, otro dispositivo sin conexión se la asignó después de que se borró) ignora esa referencia: no muestra el chip ni aparece en ese filtro, y la app la quita al detectarla. Una edición de una etiqueta borrada no la revive.
  - **Edición contra borrado: gana el borrado.** Una edición de una tarea que ya no existe (porque otro dispositivo la borró, por ejemplo sin conexión) no la revive: se descarta. Si el panel de edición de esa tarea estaba abierto, se cierra, también con un aviso de **Cambios sin guardar** abierto y sin pedir nada (§6.2).
  - Anotaciones: son documentos independientes con id generado en el cliente, así que **una anotación nunca se pierde** aunque dos dispositivos anoten sin conexión. Funcionan sin conexión y se sincronizan como los completados. El texto es un campo como los de una tarea: si dos dispositivos lo editan, **gana el último cambio**. **Borrar gana sobre editar**: una edición de una anotación ya borrada no la revive.
  - Completados: son documentos independientes con id generado en el cliente, así que **un completado nunca se pierde**. Si dos dispositivos completan la misma tarea sin conexión, quedan las dos entradas en el historial, y el estado usa el más reciente / la mayor `ocurrenciaCubierta`.
- **Borrado de tareas**: la tarea y sus completados se borran en un solo `writeBatch`. Puede pasar que otro dispositivo, sin conexión, complete una tarea que ya se borró. En ese caso queda un completado huérfano: el historial ignora los completados cuya tarea no existe, y la app los limpia al detectarlos.
- **Anotaciones de una tarea borrada**: se borran en ese mismo `writeBatch`. Si otro dispositivo, sin conexión, anota sobre una tarea que ya se borró, queda una anotación huérfana: la pantalla Anotaciones y **Copiar** la ignoran, y la app la limpia al detectarla, como un completado huérfano.
- **Limpiezas y reintentos**: las cuatro limpiezas de esta sección (completados huérfanos, anotaciones huérfanas, referencias a etiquetas borradas y etiquetas duplicadas) se reintentan si un intento falla o no hay conexión; no quedan sin limpiar hasta recargar la app. Se reintenta al volver la conexión y cuando cambian los datos, sin temporizadores. Cada elemento se intenta por separado: que uno falle (o que no haya conexión) no impide intentar los demás del lote. Los reintentos son silenciosos: sin aviso, contador ni indicador de pendientes. Ejemplo: con tres anotaciones huérfanas y la limpieza de la segunda fallando, se limpian la primera y la tercera, y la segunda se vuelve a intentar al volver la conexión o al cambiar los datos.
- **Preferencias locales**: los emojis recientes del selector (§6.2) y el recuerdo de un tope de la pantalla de carga con Noto sin bajar (§6.6) viven solo en el dispositivo (almacenamiento local del navegador); no se escriben en Firestore ni se sincronizan.
- **Fuente y emoji**: la fuente y el juego de emoji empaquetados (§6) forman parte de lo que la app guarda para funcionar sin conexión; se bajan aparte de la instalación de la app y con reintentos (§8): mientras la pantalla de carga está abierta se espera la descarga, y si llega el tope sigue en segundo plano (§6.6). Desde que se va la pantalla y hasta que están valen los del sistema y el dispositivo (§6). Si no se pueden bajar, la app igual se instala y queda disponible sin conexión.
- **Reglas de seguridad**: cada usuario lee y escribe solo bajo `users/{su uid}`.

## 8. Arquitectura y stack

- **Frontend**: SvelteKit + TypeScript, compilado como sitio estático (`adapter-static`), con PWA instalable (manifest + service worker). Manifest: `name` "Tareas Hogar", `short_name` "Tareas"; ícono y colores con la paleta de la app; orientación vertical (§6). Una versión nueva del service worker se aplica sola la próxima vez que se abre la app, sin preguntar ni avisar. Eso incluye la fuente y el juego de emoji (§6). La instalación de la app (lo que guarda para funcionar sin conexión) no depende de la fuente ni del juego de emoji: si un archivo de fuente falla al bajarse, la app se instala igual y las fuentes se bajan aparte, con reintentos; la falla de Noto deja la app disponible sin conexión, con el emoji del dispositivo (§6). La espera de la pantalla de carga (§6.6) tiene tope y nunca impide instalar ni usar la app.
- **Backend**: Firebase: Authentication (Google), Firestore y Hosting.
- **Dominio** (`src/lib/core/`): módulo de TypeScript puro, sin Firebase ni Svelte, que implementa las reglas de la §5 recibiendo el "ahora" como parámetro. La UI y la capa de datos dependen de él, no al revés.

## 9. Estrategia de tests

El proceso sigue el workflow de Robert C. Martin (ver `docs/research/uncle-bob-workflow.md`); las herramientas y los gates exactos están en `CLAUDE.md`.

- **Aceptación (Gherkin, formato APS)**: escenarios en `features/*.feature` que corren **contra el dominio** (`src/lib/core/`) mediante step handlers, sin navegador. El "ahora" es un parámetro de cada escenario, así los vencimientos, atrasos y ocurrencias son deterministas. Cada regla de la §5 (incluidas las filas de los ejemplos) tiene al menos un escenario.
- **Mutación de Gherkin**: los valores de las tablas `Examples` se mutan (fechas ±, números ±, etc.) y cada mutación tiene que hacer fallar su escenario.
- **Unit tests con TDD** (Vitest), **mutación del código** (`mutator`), **CRAP ≤ 10** (`crapper`), **DRY** (`dryer`) y **property tests** (fast-check) sobre el core.
- **Suite QA end-to-end**: procedimientos en `qa/*.md` convertidos en scripts **Playwright** que operan solo por la UI, contra el **Firebase Emulator Suite** (Auth + Firestore), con datos limpios en cada escenario y el tiempo controlado con `page.clock`.

## 10. Criterios de aceptación del MVP

1. Puedo entrar con Google en el celular y en la compu y veo las mismas tareas.
2. Puedo crear, editar y borrar tareas puntuales y periódicas (de los tres tipos de recurrencia).
3. Los estados y el orden de la lista cumplen la §5 y la §6.1 (lo verifican los `.feature`).
4. Completo una tarea sin conexión en el celular y, al reconectar, el completado aparece en la compu.
5. Puedo deshacer un completado desde el aviso o desde el historial.
6. Puedo filtrar por etiqueta y gestionar etiquetas.
7. La app se instala como PWA en Android y abre sin conexión.

