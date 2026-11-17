# QA: pasos de a uno

Verifica, solo por la interfaz:

- los campos de pasos del panel de edición: debajo de **Primer paso**, un campo de una línea por cada paso más, con la etiqueta **Paso 2**, **Paso 3**…, un botón **Quitar** cada uno y al final **Agregar paso**; Enter en esos campos guarda; se recortan los espacios; los pasos vacíos o de solo espacios se descartan sin error y los de abajo suben; sin largo ni cantidad máximos; el orden de la sección **Tarea**;
- que la fila de una tarea `pendiente` o `atrasada` muestra un solo paso, en su propia línea debajo del título (`Primer paso: ` en el paso 1, `Paso: ` en otro, sin número ni total y sin la lista entera), y que con dos pasos o más esa línea tiene los botones de texto **Paso anterior** (no en el paso 1) y **Hecho**; con un solo paso, sin botones;
- **Hecho** y **Paso anterior**: mueven el paso de a uno, no abren el panel, no pasan por **Cambios sin guardar** y no abren aviso; **Hecho** en el último paso completa la tarea como el checkbox (mismo aviso con **Deshacer**, deshabilitado igual que el checkbox) y la tarea vuelve al paso 1;
- que deshacer (aviso, Historial o checkbox) devuelve el paso en que iba la tarea;
- que la línea y los botones desaparecen y vuelven solos con el estado de cada momento, y que los pasos y su avance no cambian con ninguna otra acción, ni el estado ni el orden;
- que no se ven en el Historial, en el aviso de deshacer, en **Anotaciones** ni en el texto copiado;
- **Cambios sin guardar** con los pasos y el caso de dos dispositivos.

Cubre spec §4.1 (**Pasos**, `pasos`, `pasoActual`), §4.4 (`pasoAlCompletar`), §5.4 (deshacer), §6.1 (fila y botones), §6.2 (campos de pasos, orden de la sección, **Cambios sin guardar**) y §7 (conflictos por campo).

Fuera de alcance: las reglas de estado y de orden en sí (`qa/puntual.md`, `qa/periodica-relativa.md`, `qa/periodica-calendario.md`, `qa/horario.md`, `qa/orden-pendientes.md`) y el campo **Primer paso** solo (`qa/primer-paso.md`).

## Entorno

- Firebase Emulator Suite (Auth + Firestore) con datos limpios al inicio de cada flujo.
- Cada flujo parte de un contexto de navegador nuevo, con sesión iniciada con la cuenta `qa@example.com` del Auth Emulator (Flujo 1 de `qa/periodica-relativa.md`).
- Reloj simulado del navegador (`page.clock`) instalado **antes** de abrir la app, en la hora local que indica cada flujo (zona `America/Argentina/Buenos_Aires`), detenido (`page.clock.pauseAt`).
  - "A las X" y "Avanzar el reloj a X" significan adelantarlo hasta X (`page.clock.runFor` o `fastForward`) y esperar a que la pantalla se actualice sola, sin recargar.
- Crear una tarea: tocar **+**, escribir el título, elegir la opción de **Se repite** que indica el paso (controles de `qa/puntual.md`, `qa/periodica-relativa.md` y `qa/periodica-calendario.md`), horario como en `qa/horario.md`, escribir **Primer paso** y los pasos que el paso indica (**Agregar paso** y escribir en **Paso 2**, **Paso 3**…) y guardar.
- "Posponer X con la opción O": tocar la fila X y elegir O entre las opciones de **Posponer** (`qa/posponer.md`). "Pausar X" y "Reanudar X": tocar la fila X y el botón **Pausar** o **Reanudar** del panel (`qa/pausar.md`); solo las periódicas se pausan.
- **Mostrar completadas** y **Mostrar pausadas** quedan apagados salvo que el flujo diga encenderlos.
- **Dos dispositivos** (Flujo 8): dos contextos A y B con la misma cuenta y el mismo reloj simulado. "B sin conexión" es `browserContext.setOffline(true)`; "B vuelve a tener conexión", volverlo online y esperar a que las dos pantallas se actualicen solas, y además ~10 s quietos antes de mirar.

Semana de referencia: lunes 2026-11-09, martes 10, miércoles 11, jueves 12, viernes 13, sábado 14, domingo 15.

## Contrato observable

- **Campos del panel**: en la sección **Tarea** (**Nueva tarea** y **Editar tarea**), de arriba hacia abajo: el título con el botón de emoji (y **Quitar emoji** debajo), **Primer paso**, un campo de texto de una línea (rol `textbox`, sin `placeholder`) por cada paso más, con la etiqueta **Paso 2**, **Paso 3**… y su botón **Quitar**, el botón **Agregar paso**, la **Nota**. **Agregar paso** suma un campo vacío al final (con la etiqueta del número que sigue) y le da el foco. **Quitar** saca ese campo y los de abajo renumeran sus etiquetas. El panel no muestra ni elige el paso en que va la tarea.
- **Línea de la fila**: un texto en su propia línea debajo del título: `Primer paso: ` seguido del texto si la tarea va en el paso 1, `Paso: ` seguido del texto si va en otro. "La fila dice P" significa que ese texto es exactamente `Primer paso: P` (o `Paso: P`). Nunca contiene la lista entera, ni un número de paso, ni un total. Una fila sin primer paso, o que no lo muestra, no contiene `Primer paso` ni `Paso:`.
- **Botones de la fila**: dentro de esa misma línea, solo si la tarea tiene dos pasos o más: **Paso anterior** (no se ve en el paso 1) y **Hecho**, en ese orden, ambos botones de texto chicos (rol `button`). Una tarea de un solo paso no tiene ninguno.
- **Estilo**: la línea tiene el mismo `color` y `font-size` computados que el texto de horario; `font-weight` normal, sin subrayado ni color propio en el texto ni en los botones; la fila no cambia de fondo. Sin recorte (sin `text-overflow: ellipsis`, sin `-webkit-line-clamp`, sin `max-height`): un texto largo se ve completo en varias líneas.
- **Tocar**: tocar el texto del paso (fuera de los botones) es tocar la fila: abre **Editar tarea**. Tocar **Hecho** o **Paso anterior** no abre el panel, no abre **Cambios sin guardar** y no abre aviso, salvo **Hecho** en el último paso (aviso de completar).
- **Aviso, Historial, Anotaciones, texto copiado**: los de `qa/historial-deshacer.md`, `qa/anotacion.md` y `qa/reintento-y-aviso-de-copia.md`; ninguno contiene el texto de un paso, `Primer paso` ni `Paso:`.
- **Lista**: "La lista es A, B, C" significa exactamente esas filas, de arriba hacia abajo.

## Flujo 1: los campos de pasos en el panel y crear

Precondición: lista vacía, reloj en `2026-11-13T10:00:00` (viernes).

1. Tocar **+**. En **Nueva tarea** hay **Primer paso** y **Agregar paso**, y ningún campo **Paso 2**. El orden vertical de la sección es: **Título** (con el botón de emoji), **Primer paso**, **Agregar paso**, **Nota**.
2. Escribir `Lavar` en **Título** y `Separar la ropa blanca` en **Primer paso**. Tocar **Agregar paso**: aparece el campo **Paso 2** vacío, con el foco, un botón **Quitar** a su lado, y **Agregar paso** queda debajo de él. Escribir `Poner el lavarropas`. Tocar **Agregar paso** otra vez: aparece **Paso 3**; escribir `Tender la ropa`. El orden es: **Primer paso**, **Paso 2**, **Paso 3**, **Agregar paso**, **Nota**.
3. Con el foco en **Paso 3**, apretar Enter: el panel guarda y se cierra. La fila de `Lavar` dice `Primer paso: Separar la ropa blanca` y tiene los botones **Hecho** (sin **Paso anterior**). La fila no contiene `Poner el lavarropas` ni `Tender la ropa`.
4. Tocar la fila `Lavar`: **Editar tarea** muestra **Primer paso** `Separar la ropa blanca`, **Paso 2** `Poner el lavarropas` y **Paso 3** `Tender la ropa`, cada uno con su **Quitar**. No hay ningún control ni texto que diga en qué paso va la tarea. Recargar: sigue igual.
5. Crear `Barrer` con **No se repite**, sin fecha límite y solo **Primer paso** `Juntar la basura`: la fila dice `Primer paso: Juntar la basura` y no tiene botones.
6. Crear `Regar` con **Intervalo** cada `2` **días**, **Primer paso** `Llenar la regadera` y **Paso 2** `Regar los helechos`, y otra `Basura` con **Días de la semana** y **martes**, **Primer paso** `Atar la bolsa llena` y **Paso 2** `Bajar la basura`: `Regar` (pendiente) dice `Primer paso: Llenar la regadera` y tiene **Hecho**; `Basura` está `en espera` hasta el martes y no muestra línea ni botones (la línea no se ve en `en espera`; Flujo 5).
7. Crear `Planchar` sin tocar **Primer paso** ni los pasos: la fila no contiene `Paso` ni botones, como antes de existir los pasos.

## Flujo 2: editar, recortar, descartar, quitar y sin máximos

Precondición: `Lavar` (**No se repite**, sin fecha límite) con `Separar la ropa blanca`, `Poner el lavarropas` y `Tender la ropa`, reloj en `2026-11-13T10:00:00`.

1. Abrir la fila, escribir en **Paso 2** `  Juntar las llaves  ` (con espacios al inicio y al final) y guardar. Reabrir: **Paso 2** tiene exactamente `Juntar las llaves`.
2. Pegar en **Paso 2** un texto de dos líneas (`uno`, salto de línea, `dos`): el campo queda en una sola línea, y Enter guarda en lugar de escribir un salto. Guardar y reabrir: el texto no tiene salto de línea.
3. Vaciar **Paso 2** y guardar: reabrir muestra **Primer paso** igual, **Paso 2** con `Tender la ropa` (el de abajo subió) y ningún **Paso 3**.
4. Escribir solo espacios en **Paso 2** y guardar: no hay error ni mensaje de rechazo; reabrir muestra `Separar la ropa blanca` y ningún **Paso 2**. Volver a agregar `Poner el lavarropas` con **Agregar paso** y guardar.
5. Vaciar **Primer paso** y guardar: la fila dice `Primer paso: Poner el lavarropas` y reabrir muestra **Primer paso** `Poner el lavarropas` (el paso 2 subió a primer paso) y el resto de los pasos corridos un lugar hacia arriba.
6. Abrir, agregar dos pasos con **Agregar paso** (`Tender la ropa` y `Guardar la ropa`) y guardar. Abrir, tocar **Quitar** junto a **Paso 2** y guardar: el paso desaparece y los de abajo suben; los nombres de campo quedan **Paso 2**, **Paso 3** sin saltos de número. Tocar **Agregar paso** y guardar sin escribir: reabrir no muestra el campo vacío agregado.
7. Pegar en un paso un texto de 5000 caracteres y guardar: se acepta sin error ni advertencia. Reabrir: tiene los 5000.
8. Agregar 30 pasos con **Agregar paso** (escribiendo `p1` … `p30`) y guardar: se acepta sin error ni advertencia; reabrir muestra los 30 en orden.
9. Escribir como paso un texto largo con espacios de unos 160 caracteres (`Abrir el cajón de abajo y sacar toda la ropa blanca y separarla en dos pilas: la que va con agua caliente y la que no se mezcla con nada de color oscuro ni delicado`) y, en un celular (390 × 844), llevar la tarea a ese paso (Flujo 3): la fila lo muestra completo, en varias líneas, sin cortar ni scroll horizontal.

## Flujo 3: avanzar y retroceder desde la fila

Precondición: lista vacía, reloj detenido en `2026-11-13T10:00:00`. Crear `Lavar` (**No se repite**, sin fecha límite) con `Separar la ropa blanca`, `Poner el lavarropas`, `Tender la ropa`; y `Barrer` (**No se repite**, sin fecha límite, sin pasos) con horario **Desde** `08:00` **Hasta** `12:00`.

1. La fila dice `Primer paso: Separar la ropa blanca` y tiene **Hecho**, sin **Paso anterior**.
2. Tocar **Hecho**: la fila dice `Paso: Poner el lavarropas` y tiene **Paso anterior** y **Hecho** (en ese orden). No se abrió el panel ni apareció aviso alguno. La fila no contiene `Tender la ropa` ni un número de paso.
3. Tocar **Paso anterior**: la fila dice `Primer paso: Separar la ropa blanca`, sin **Paso anterior**. Tocar **Hecho** dos veces: la fila dice `Paso: Tender la ropa`.
4. Recargar la página: la fila sigue diciendo `Paso: Tender la ropa` (el paso se guardó).
5. Tocar el texto `Paso: Tender la ropa` (no un botón): se abre **Editar tarea** de `Lavar`, sin ningún control del paso actual. Cerrarlo sin cambios (cierra directo). Tocar **Hecho** o **Paso anterior** no pasa por **Cambios sin guardar** (ver Flujo 7).
6. **Estilo**: el texto de la línea tiene el mismo `color` y `font-size` que el texto de horario de la fila de `Barrer`; los botones no tienen color propio ni fondo destacado; la fila no cambia de fondo.
7. Tocar **Hecho** en `Paso: Tender la ropa` (último paso): ver Flujo 4.

## Flujo 4: «Hecho» en el último paso completa la tarea

Precondición: reloj en `2026-11-13T10:00:00`, **Mostrar completadas** encendido. `Regar` con **Intervalo** cada `2` **días**, `Llenar la regadera` y `Regar los helechos`; `Cambiar foco` con **No se repite**, sin fecha límite, y los pasos `Sacar la escalera`, `Cambiar el foco`.

1. En `Regar`, tocar **Hecho**: la fila dice `Paso: Regar los helechos`. Tocar **Hecho** otra vez: aparece el aviso `Completaste «Regar»` con **Deshacer** y la línea «Vuelve …» (igual que al tocar su checkbox). La fila queda `en espera` (completada), sin línea de paso ni botones. El aviso no contiene `Paso`.
2. Tocar **Deshacer** dentro de los 5 segundos: `Regar` vuelve a `pendiente` en el último paso: dice `Paso: Regar los helechos` con **Paso anterior** y **Hecho**.
3. Tocar **Paso anterior**, volver a tocar **Hecho** y de nuevo **Hecho** (completa): esperar a que pase el aviso. Ir a **Historial** y borrar el completado: `Regar` vuelve a `pendiente` y dice `Paso: Regar los helechos`.
4. En `Cambiar foco`, tocar **Hecho** y **Hecho** (completa), y luego el checkbox de la fila completada (la desmarca): la fila vuelve a `pendiente` en el último paso.
5. Fijar la hora a `2026-11-13T10:00:00` justo antes de tocar el checkbox (con el reloj pausado el tiempo corre unos ms por aserción, y si no se fija, avanzar a `2026-11-15T10:00:00` no vence el intervalo). Tocar el checkbox de `Regar` estando en el paso 1 (sin usar **Hecho**): completa igual, con el mismo aviso. Avanzar el reloj a `2026-11-15T10:00:00`: `Regar` vuelve a `pendiente` y dice `Primer paso: Llenar la regadera` con **Hecho** y sin **Paso anterior** (la tarea que vuelve arranca del paso 1). Repetir: tocar **Hecho** (paso 2), fijar la hora a `2026-11-15T10:00:00` justo antes de tocar el checkbox, completar con él y avanzar a `2026-11-17T10:00:00`: al volver, también arranca del paso 1.
6. Tocar **Deshacer** en el aviso de un completado hecho con el checkbox en el paso 2 de `Regar`: `Regar` vuelve a decir `Paso: Regar los helechos` (el paso en que iba).
7. Hecho en el último paso con el checkbox deshabilitado: ver Flujo 5.

## Flujo 5: dónde se ve y cuándo desaparece y vuelve

Precondición: lista vacía, reloj detenido en `2026-11-13T10:00:00` (viernes). Encender **Mostrar completadas**.

1. Crear `Cambiar foco` (**No se repite**, sin fecha límite) con `Sacar la escalera` y `Cambiar el foco`; `Pagar` (**No se repite**, fecha límite `2026-11-10`) con `Buscar la factura` y `Pagar en el banco`; `Regar` (**Intervalo** cada `8` **horas**) con `Llenar la regadera` y `Regar los helechos`. Las tres (`Pagar` atrasada, las otras pendientes) muestran `Primer paso: …` y **Hecho**.
2. Tocar **Hecho** en `Pagar`: dice `Paso: Pagar en el banco`, con **Paso anterior** y **Hecho**. Sigue `atrasada` y en el mismo lugar de la lista.
3. Tocar el checkbox de `Cambiar foco` (en el paso 1): completa y la fila deja de mostrar línea y botones. Deshacer: vuelve en el paso 1.
4. Con el reloj aún en `2026-11-13T10:00:00`: posponer `Cambiar foco` con la opción **3 horas**: pasa a `en espera` y la fila no contiene `Primer paso`, `Paso:` ni botones. Posponer `Pagar` con **Hasta mañana**: tampoco. Tocar el checkbox de `Regar`: `en espera`, sin línea ni botones.
5. Avanzar el reloj a `2026-11-13T13:01:00`: `Cambiar foco` vuelve a `pendiente` con la línea y los botones, en el paso 1; `Regar` y `Pagar` siguen sin línea. Avanzar a `2026-11-13T17:59:00`: `Regar` sigue sin línea. A `2026-11-13T18:00:00`: `Regar` vuelve a `pendiente` y dice `Primer paso: Llenar la regadera` con **Hecho**.
6. Tocar la fila `Regar` y **Pausar**; encender **Mostrar pausadas**: `Regar` se ve pausada (dice «Pausada»), sin línea de paso ni botones. Abrir, **Reanudar**: vuelve `pendiente` con su línea y botones.
7. Crear `Basura` con **Días de la semana** y **martes** con `Atar la bolsa llena` y `Bajar la basura`, con el reloj en el viernes: está `en espera` hasta el martes y no muestra línea ni botones. Avanzar a `2026-11-17T09:00:00`: `pendiente`, con `Primer paso: Atar la bolsa llena` y **Hecho**.
8. Crear `Llamar` (**No se repite**, sin fecha límite, horario **Desde** `08:00` **Hasta** `09:00`) con `Buscar el número` y `Marcar`: con el reloj en `2026-11-17T09:00:00` está fuera de su ventana: sin línea ni botones. Avanzar a `2026-11-18T08:00:00`: `pendiente`, con su línea y botones.
9. **Checkbox deshabilitado**: crear `Lavar` (**No se repite**, fecha límite `2026-11-10`, horario **Desde** `08:00` **Hasta** `11:00`) con `Separar la ropa blanca` y `Poner el lavarropas`. Con el reloj en `2026-11-13T07:00:00`: `atrasada`, checkbox deshabilitado, dice `Primer paso: Separar la ropa blanca`, y **Hecho** está habilitado (no es el último paso): tocarlo lleva a `Paso: Poner el lavarropas`. Ahora **Hecho** está deshabilitado (es el último paso, como el checkbox) y no completa nada al tocarlo; **Paso anterior** sigue habilitado. Avanzar a `2026-11-13T08:00:00`: checkbox y **Hecho** quedan habilitados.

## Flujo 6: editar los pasos y el avance

Precondición: `Lavar` con `Separar la ropa blanca`, `Poner el lavarropas`, `Tender la ropa`, ya en el paso 3 (Flujo 3), reloj en `2026-11-13T10:00:00`.

1. Abrir, cambiar el texto de **Paso 2** y guardar: la fila sigue diciendo `Paso: Tender la ropa` (editar no cambia el paso en que va).
2. Abrir, vaciar **Paso 3** y guardar: ahora la tarea tiene dos pasos y la fila dice `Paso: <el texto de Paso 2>` (va en el último), con **Paso anterior** y **Hecho**. Abrir, **Agregar paso** y escribir `Guardar la ropa` en **Paso 3**, guardar: la fila vuelve a `Paso: Guardar la ropa` (el número se conservó).
3. Con la tarea en el paso 3, abrir, vaciar **Paso 3** y **Paso 2** y guardar: queda un solo paso; la fila dice `Primer paso: Separar la ropa blanca` sin botones. Abrir, agregar de nuevo dos pasos y guardar: la fila muestra `Paso: ` seguido del último, otra vez en el paso 3.
4. Con la tarea en el paso 3 y dos pasos, tocar **Hecho**: completa la tarea (aviso). Deshacer.
5. Cambiar de tipo (**Intervalo** cada `3` **días**, **Días de la semana** y **martes**, **No se repite**), guardando en cada uno: reabrir; los pasos son los mismos y la fila sigue en el mismo paso. Posponer, pausar y reanudar tampoco cambian los pasos ni el paso en que va.
6. Recargar: todo se mantiene. No existe en ninguna pantalla un control que muestre el número del paso actual ni el total.

## Flujo 7: lo que no cambia y lo que no lo muestra; Cambios sin guardar

Precondición: lista vacía, reloj detenido en `2026-11-13T10:00:00`.

1. Crear `Barrer`, `Lavar` y `Planchar`, todas con **No se repite** y sin fecha límite. Anotar el orden y el texto de cada fila.
2. Escribir en `Lavar` un **Primer paso** y dos pasos más y guardar; tocar **Hecho** en la fila. El orden de la lista es el mismo que anotó; las filas de **Barrer** y **Planchar** son idénticas a antes. Repetir con `Barrer` y quitárselos a `Lavar`: el orden no cambia.
3. Poner a `Lavar` el emoji `🧺`: el título dice `🧺 Lavar` y la línea de paso va en su propia línea debajo. El título no incluye ningún paso.
4. Tocar **Hecho** hasta completar `Lavar`: el aviso dice `Completaste «🧺 Lavar»` sin ningún paso. En **Historial** la entrada dice `🧺 Lavar` con su hora, sin ningún paso.
5. Tocar **Anotar**, `salió bien`, **Me sirvió**, con `Lavar` en la lista. En **Anotaciones**: el nombre `🧺 Lavar` y `salió bien`, sin pasos. Con el portapapeles funcionando (`qa/reintento-y-aviso-de-copia.md`), **Copiar**: el texto copiado no contiene ningún paso.
6. **Cambios sin guardar**: encender **Mostrar completadas**, abrir `Lavar` (completada) y quitarle **Paso 3** para que quede con **Primer paso** y **Paso 2**; guardar (`Lavar` con **Primer paso** `Separar la ropa blanca` y **Paso 2** `Poner el lavarropas`): abrir, cambiar **Paso 2** a `Juntar las llaves` y tocar la X: aparece el aviso «Tenés cambios sin guardar»; **Descartar**: la fila no cambió.
7. Abrir, cambiar **Paso 2** y volver a escribir `Poner el lavarropas`, y tocar la X: cierra directo. Escribirlo con espacios al inicio y al final: cierra directo.
8. Abrir, vaciar **Paso 2**: aviso; **Descartar**. Repetir con solo espacios: aviso; **Descartar**.
9. Abrir, tocar **Agregar paso** y tocar la X sin escribir: cierra directo. Repetir escribiendo `Tender la ropa`: aviso; **Descartar**. Repetir escribiendo solo espacios: cierra directo.
10. Abrir, tocar **Quitar** en **Paso 2**: aviso; **Descartar**. Tocar **Agregar paso** y **Quitar** del campo recién agregado: cierra directo.
11. Tocar **+**, tocar **Agregar paso** y la X: cierra directo. Tocar **+**, **Agregar paso**, escribir `Poner el lavarropas` y la X: aviso; **Descartar**.
12. Desmarcar el checkbox de `Lavar` (vuelve `pendiente` en el último paso). Con el panel de `Lavar` cerrado, tocar **Hecho** y **Paso anterior** en la fila: no aparece **Cambios sin guardar** ni se abre el panel.

## Flujo 8: dos dispositivos

Precondición: lista vacía, reloj en `2026-11-13T10:00:00` en A y en B.

1. En A, crear `Lavar` con **No se repite**, sin fecha límite, `Separar la ropa blanca`, `Poner el lavarropas` y `Tender la ropa`. B la ve aparecer.
2. B sin conexión. En B, tocar **Hecho**. En A, tocar **Hecho**. B vuelve a tener conexión: en A y en B la fila dice `Paso: Poner el lavarropas` (no `Tender la ropa`: dos **Hecho** en el mismo paso dejan la tarea en el paso siguiente).
3. B sin conexión. En B, tocar **Hecho** (queda en el paso 3). En A, abrir el panel, cambiar **Paso 2** a `Juntar las llaves` y guardar. B vuelve a tener conexión: en A y en B la tarea va en el paso 3 y el panel muestra **Paso 2** `Juntar las llaves` (el avance y la edición se conservaron).
4. B sin conexión. En B, cambiar **Paso 2** a `Buscar el detergente` y guardar. En A, tocar **Paso anterior**. B vuelve a tener conexión: la fila dice el mismo paso en A y en B (el del avance de A, ahora en el paso 2) y el panel muestra `Buscar el detergente`.
5. B sin conexión. En B, cambiar **Paso 2** a `Buscar la esponja` y guardar. En A, cambiar **Paso 2** a `Poner el agua a calentar` y guardar. B vuelve a tener conexión: en A y en B **Paso 2** dice `Buscar la esponja` (el último cambio en llegar es el de B).
6. B sin conexión. En B, cambiar **Paso 2** a `Barrer abajo` y guardar. En A, cambiar **Paso 3** a `Guardar la ropa` y guardar. B vuelve a tener conexión: en A y en B la lista de pasos es la del último cambio en llegar entera (la de B), sin mezclar un paso de cada una.
7. B sin conexión. En B, cambiar **Primer paso** a `Juntar las llaves` y guardar. En A, cambiar **Paso 2** a `Tender la ropa` y guardar. B vuelve a tener conexión: en A y en B, **Primer paso** dice `Juntar las llaves` y **Paso 2** `Tender la ropa` (campos distintos, los dos cambios se conservaron).
8. B sin conexión. En B, cambiar **Paso 2** a `Barrer abajo` y guardar. En A, abrir la fila y guardar sin cambiar nada. B vuelve a tener conexión: en A y en B **Paso 2** dice `Barrer abajo` (guardar sin cambios no pisó el cambio de B).
