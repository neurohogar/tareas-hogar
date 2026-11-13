# QA: estado sin culpa (texto de atraso, texto de regreso y cierre al completar)

Verifica, solo por la interfaz:

- que la fila de una tarea `atrasada` dice desde cuándo toca, como un hecho con fecha y distancia («Tocaba el martes 10 · hace 3 días»), en el mismo color y tamaño que el esfuerzo y el horario, y que ya no dice «Atrasada»;
- que la fila de una tarea `en espera` (periódica completada con **Mostrar completadas**, de calendario antes de su ocurrencia, con horario fuera de la ventana, pospuesta) dice cuándo vuelve («Vuelve el jueves 19 · en 6 días») además de su barra de progreso, sin nombrar la posposición;
- que las filas `pendiente`, las pausadas y las puntuales completadas no muestran texto de fecha ni de distancia;
- que los textos se actualizan solos con el paso del tiempo (medianoche, hora, minuto) y que el estado y el orden de la lista no cambian;
- que el aviso de completar dice debajo de «Completaste …» cuándo vuelve la tarea (una periódica), y que una puntual muestra solo «Completaste …».

Cubre spec §6.1 (texto de atraso, texto de regreso, **Fecha y distancia**, **Se actualiza solo**, filas sin texto, **Mostrar pausadas**) y §5.4 (aviso de deshacer), con §5.1–§5.9 como reglas de estado, que no cambian.

Este procedimiento reemplaza el indicador «Atrasada» de los contratos de `qa/*.md` anteriores: donde esos documentos esperan el texto accesible «Atrasada» dentro de la fila, se espera ahora el texto de atraso «Tocaba …» de este contrato (y «Atrasada» ya no aparece en ninguna fila).

Fuera de alcance: los estados y el orden (`qa/puntual.md`, `qa/periodica-relativa.md`, `qa/periodica-calendario.md`, `qa/horario.md`, `qa/orden-pendientes.md`), el contenido del panel de edición (`qa/posponer.md`, `qa/pausar.md`) y el Historial (`qa/historial-deshacer.md`).

## Entorno

- Firebase Emulator Suite (Auth + Firestore) con datos limpios al inicio de cada flujo.
- Cada flujo parte de un contexto de navegador nuevo (sin datos guardados en el dispositivo), con sesión iniciada con la cuenta `qa@example.com` del Auth Emulator (Flujo 1 de `qa/periodica-relativa.md`).
- Reloj simulado del navegador (`page.clock`) instalado **antes** de abrir la app, en la hora local que indica cada flujo (zona `America/Argentina/Buenos_Aires`), con el reloj detenido (`page.clock.pauseAt`).
  - "A las X" significa adelantar el reloj simulado hasta X (`page.clock.runFor` o `fastForward`) antes del paso.
  - "Avanzar el reloj a X" significa adelantarlo hasta X y esperar a que la pantalla se actualice sola (sin recargar).
- Crear una tarea: tocar **+**, escribir el título, elegir la opción de **Se repite** que indica el paso, con los controles de `qa/puntual.md`, `qa/periodica-relativa.md` y `qa/periodica-calendario.md`; si el paso da un horario, cargarlo como en `qa/horario.md`; guardar.
- "Posponer X con la opción O": tocar la fila X y elegir O entre las opciones de **Posponer**, sin tocar **Guardar** (`qa/posponer.md`).
- **Mostrar completadas** y **Mostrar pausadas** quedan apagados salvo que el flujo diga encenderlos.

Semana de referencia: lunes 2026-11-09, martes 10, miércoles 11, jueves 12, viernes 13, sábado 14, domingo 15.

## Contrato observable

- **Texto de la fila**: dentro de la fila de la tarea, un texto que empieza con `Tocaba ` (atrasada) o `Vuelve ` (en espera). "La fila dice T" significa que el texto de la fila es exactamente T (con el punto medio `·`, U+00B7, rodeado de espacios, y sin otras palabras). Una fila sin texto de fecha no contiene `Tocaba`, `Vuelve` ni `hace`/`en` seguidos de una cantidad.
  - Ninguna fila contiene el texto `Atrasada`.
  - La hora va en 24 h, `HH:MM`, sin segundos.
- **Estilo del texto de atraso**: el mismo `color` y el mismo `font-size` computados que el texto de esfuerzo (`Rápida`, `Media`, `Larga`) o el de horario de la misma fila o de otra fila; no es rojizo (el canal rojo no domina: no es el color de alarma `--atraso` de antes), no está en negrita (`font-weight` normal) ni subrayado, y la fila atrasada no cambia de fondo.
- **Fila en espera**: el contrato de `qa/periodica-relativa.md` (estilo atenuado, barra de progreso con `aria-valuenow`), con el texto «Vuelve …» además de la barra. La barra no cambia.
- **Fila atrasada**: sin atenuar, sin barra, con el texto «Tocaba …».
- **Fila pausada** (con **Mostrar pausadas** encendido): dice «Pausada» y ningún `Tocaba` ni `Vuelve`.
- **Aviso**: el de `qa/historial-deshacer.md` (rol `status`, `Completaste «…»`, **Deshacer**, 5 segundos). "El aviso dice T" significa que, debajo de `Completaste «…»`, hay un texto exactamente T; "el aviso no dice nada más" significa que no hay otro texto que `Completaste «…»` y **Deshacer**.
- **Lista**: "La lista es A, B, C" significa exactamente esas filas, de arriba hacia abajo.

## Flujo 1: atraso con fecha y distancia, sin color de alarma

Precondición: lista vacía, reloj en `2026-11-13T10:00:00` (viernes).

1. Crear `Pagar la luz` con **No se repite**, fecha límite `2026-11-10` y esfuerzo **Rápida**; `Pagar agua` con **No se repite** y fecha límite `2026-11-12`; `Cambiar foco` con **No se repite** y sin fecha límite; y `Barrer` con **Días de la semana** y **viernes**.
2. La lista es **Pagar la luz**, **Pagar agua**, **Barrer**, **Cambiar foco** (las dos primeras `atrasadas`; las otras, `pendiente`). La fila de **Pagar la luz** dice `Tocaba el martes 10 · hace 3 días`; la de **Pagar agua**, `Tocaba ayer`. Ninguna fila contiene `Atrasada`. **Cambiar foco** y **Barrer** no muestran texto de fecha.
3. El texto de atraso de **Pagar la luz** tiene el mismo `color` y `font-size` que su texto `Rápida`, no está en negrita y no es rojizo.
4. Crear `Lavar` con **No se repite**, fecha límite `2026-11-13` y horario **Desde** `08:00` **Hasta** `11:00`. Avanzar el reloj a `2026-11-13T10:59:00`: **Lavar** está `pendiente` y no muestra texto de fecha. Avanzar a `2026-11-13T11:00:00`: su fila dice `Tocaba hoy`, sin hora ni distancia.
5. Crear `Regar` con **Intervalo** cada `1` **horas** y tocar su checkbox. Avanzar el reloj a `2026-11-13T13:00:00`: **Regar** está `atrasada` y su fila dice `Tocaba hoy 12:00 · hace 1 hora`. Avanzar a `2026-11-13T14:30:00`: dice `Tocaba hoy 12:00 · hace 2 horas`.
6. Avanzar el reloj a `2026-11-14T00:00:00` (sábado): **Barrer** está `atrasada` y dice `Tocaba ayer` (sin hora); **Regar** dice `Tocaba ayer 12:00 · hace 12 horas`.
7. Avanzar el reloj a `2026-11-15T10:00:00` (domingo): **Barrer** dice `Tocaba el viernes 13 · hace 2 días` y **Pagar la luz**, `Tocaba el martes 10 · hace 5 días`.

## Flujo 2: «Vuelve …» en las filas en espera

Precondición: lista vacía, reloj en `2026-11-13T10:00:00` (viernes). Encender **Mostrar completadas**.

1. Crear `Regar` con **Intervalo** cada `8` **horas** y tocar su checkbox. Su fila (completada, atenuada, con la barra en 0) dice `Vuelve hoy 18:00 · en 8 horas`.
2. Crear `Sacar la basura` con **Días de la semana** y **jueves**: su fila (atenuada, con la barra, no completada) dice `Vuelve el jueves 19 · en 6 días`. Crear `Barrer` con **Días de la semana** y **sábado**: dice `Vuelve mañana`.
3. Crear `Dormir` con **Intervalo** cada `6` **días** y tocar su checkbox: su fila dice `Vuelve el jueves 19 10:00 · en 6 días`.
4. Crear `Llamar` con **No se repite**, sin fecha límite y horario **Desde** `08:00` **Hasta** `09:00` (ahora está fuera de la ventana): su fila dice `Vuelve mañana 08:00 · en 22 horas`.
5. Crear `Cambiar foco` con **No se repite** y sin fecha límite, y posponerla con la opción **3 horas**: su fila (atenuada, con la barra en 0, no completada) dice `Vuelve hoy 13:00 · en 3 horas` y no contiene `Pospuesta`. Tocar su fila: el panel sigue diciendo `Pospuesta hasta 13:00`. Cerrarlo.
6. Crear `Pagar la luz` con **No se repite** y fecha límite `2026-11-10` (`atrasada`) y posponerla con la opción **Hasta mañana**: su fila dice `Vuelve mañana 07:00 · en 21 horas`, no `Tocaba`.
7. Ninguna fila contiene `Atrasada`. La barra de cada fila en espera sigue visible.

## Flujo 3: filas sin texto de fecha

Precondición: lista vacía, reloj en `2026-11-13T10:00:00` (viernes).

1. Crear `Barrer` con **No se repite** y sin fecha límite, `Pagar` con **No se repite** y fecha límite `2026-11-13`, y `Regar` con **Intervalo** cada `2` **días** (sin completarla). Las tres están `pendiente`: ninguna de sus filas contiene `Tocaba`, `Vuelve` ni una distancia.
2. Avanzar el reloj a `2026-12-13T10:00:00`: **Barrer** y **Regar** siguen `pendiente`, sin texto de fecha (nunca se atrasan); **Pagar** pasó a `atrasada` y dice `Tocaba el viernes 13 de noviembre · hace 30 días`.
3. Encender **Mostrar completadas** y tocar el checkbox de **Barrer**: su fila queda completada (tachada, checkbox marcado) y no muestra texto de fecha ni de distancia.
4. Tocar la fila de **Regar** y elegir **Pausar**; tocar la fila de **Pagar** y elegir **Pausar**. Encender **Mostrar pausadas**: las dos filas dicen «Pausada» y ninguna contiene `Tocaba` ni `Vuelve`.
5. Apagar **Mostrar pausadas**: las pausadas desaparecen.

## Flujo 4: se actualiza solo y no cambia el orden

Precondición: lista vacía, reloj en `2026-11-12T20:00:00` (jueves). Encender **Mostrar completadas**.

1. Crear `Pagar` con **No se repite** y fecha límite `2026-11-10`, `Barrer` con **Días de la semana** y **sábado**, y `Regar` con **Intervalo** cada `1` **horas**; tocar el checkbox de **Regar**.
2. Avanzar el reloj a `2026-11-12T20:30:00`: **Regar** (completada, en espera) dice `Vuelve hoy 21:00 · en 30 minutos`. Sin recargar, avanzar a `2026-11-12T20:31:00`: dice `Vuelve hoy 21:00 · en 29 minutos`. La lista es **Pagar**, **Barrer**, **Regar**.
3. Avanzar el reloj a `2026-11-12T21:00:00`: **Regar** está `pendiente` y no muestra texto de fecha.
4. Avanzar el reloj a `2026-11-12T22:00:00`: **Regar** está `atrasada` y dice `Tocaba hoy 21:00 · hace 1 hora`. Sin recargar, a las `2026-11-12T23:59:00` dice `Tocaba hoy 21:00 · hace 2 horas`, y a las `2026-11-13T00:00:00` dice `Tocaba ayer 21:00 · hace 3 horas` (el cambio de «hoy» a «ayer» ocurre solo, al pasar la medianoche).
5. Avanzar el reloj a `2026-11-14T00:00:00`: **Regar** dice `Tocaba el jueves 12 21:00 · hace 2 días`; **Barrer** (`pendiente` ese día) no muestra texto de fecha.
6. En los pasos 4 y 5 la lista es **Pagar**, **Regar**, **Barrer** (las atrasadas por desde cuándo lo están, y después la pendiente): el cambio de texto no cambia el orden. Recargar la página no cambia el texto que corresponde a esa hora.

## Flujo 5: el cierre al completar

Precondición: lista vacía, reloj en `2026-11-02T10:00:00` (lunes). Encender **Mostrar completadas**.

1. Crear `Regar` con **Intervalo** cada `8` **horas**, `Sacar la basura` con **Días de la semana** y **jueves**, `Barrer` con **Días de la semana** y **sábado**, `Pagar la luz` con **No se repite** y sin fecha límite, y `Comprar pan` con **No se repite** y fecha límite `2026-11-05`.
2. Avanzar el reloj a `2026-11-13T10:00:00` (viernes). Tocar el checkbox de **Regar**: aparece el aviso `Completaste «Regar»` con **Deshacer** y, debajo, `Vuelve hoy 18:00 · en 8 horas`. Sin felicitaciones ni otras palabras. Esperar 5 segundos: el aviso desaparece entero, y la fila de **Regar** dice `Vuelve hoy 18:00 · en 8 horas`, el mismo texto.
3. Tocar el checkbox de **Sacar la basura**: el aviso dice debajo de `Completaste «Sacar la basura»` el texto `Vuelve el jueves 19 · en 6 días`. Tocar el checkbox de **Barrer**: reemplaza al aviso anterior y dice `Vuelve mañana`.
4. Tocar el checkbox de **Pagar la luz**: el aviso dice solo `Completaste «Pagar la luz»` y **Deshacer**, sin otro texto debajo. Tocar el checkbox de **Comprar pan** (atrasada): igual, solo `Completaste «Comprar pan»`.
5. Avanzar el reloj a `2026-11-13T18:00:00` y tocar el checkbox de **Regar** (ya `pendiente`): el aviso dice `Vuelve mañana 02:00 · en 8 horas`. Tocar **Deshacer**: el aviso se cierra y **Regar** vuelve a estar `pendiente`, sin texto de fecha.
