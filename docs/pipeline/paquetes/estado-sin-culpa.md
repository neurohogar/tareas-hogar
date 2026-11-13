# Paquete: estado-sin-culpa

Primera feature de la épica E2 de `docs/v3/plan.md` («Estado sin culpa y reglas a la vista»): la fila de una tarea atrasada dice cuándo tocaba, como un hecho con fecha y distancia («Tocaba el martes 10 · hace 3 días») y sin color de alarma; las tareas en espera dicen cuándo vuelven («Vuelve el jueves 19 · en 6 días»), y al completar el aviso dice la próxima fecha. Solo textos y color: las reglas de estado (§5) y el orden de la lista (§6.1) no cambian.

## Specs

## Decisiones

- D1 (2026-11-13, analyst, alcance): esta feature cubre tres de las cuatro propuestas de la E2: el atraso como hecho con fecha y sin color de alarma, la distancia relativa junto a la fecha exacta (atraso y regreso de las tareas en espera) y el cierre informativo al completar. El «por qué está aquí» consultable por tarea queda para una feature aparte de la misma épica (`reglas-a-la-vista`). Porque el plan encarga al analyst partir cada épica en features, y el «por qué está aquí» necesita sus propias decisiones (dónde se consulta, qué regla explica) que no dependen de estas.
- D2 (2026-11-13, analyst): las reglas de estado de §5 no cambian: qué tarea está `pendiente`, `atrasada` o `en espera`, cuándo pasa de una a otra y qué se puede completar siguen igual. El orden de la lista de §6.1 tampoco cambia (D11). Porque el plan lo pone en «Evitar» («esta épica toca solo la presentación»).
- D3 (2026-11-13, analyst): el texto de atraso de la fila (el «Tocaba …» de D12, que reemplaza a «Atrasada» como indicador de atraso de §6.1) deja el color rojizo (`--atraso`) y se ve en el mismo color y tamaño de texto secundario que el esfuerzo y el horario. Porque el plan pide «sin color de alarma» y prohíbe «muros rojos» (regla global 2).
- D4 (2026-11-13, analyst): la fila de una tarea `en espera` muestra, además de la barra de progreso (que se queda), un texto con cuándo vuelve: «Vuelve el jueves 19 · en 6 días». El instante es el mismo con el que §6.1 ordena las `en espera` («cuándo vuelve a pendiente», con §5.5 y §5.9: con horario, `A`; pospuesta, `pospuesta.hasta`); si dos causas la tienen en espera, el instante en que deja de estarlo. Vale también para las periódicas completadas que se ven con **Mostrar completadas** (son `en espera`). Porque el plan pide la distancia relativa «también para el regreso de las tareas en espera», y un solo instante evita que el texto contradiga el orden.
- D5 (2026-11-13, analyst): una tarea pospuesta muestra el mismo «Vuelve …» que cualquier `en espera`, sin nombrar la posposición en la fila; el panel sigue mostrando «Pospuesta hasta HH:MM» como hoy. Porque la fila dice cuándo vuelve, y la causa es materia del «por qué está aquí» (D1).
- D6 (2026-11-13, analyst): las filas `pendiente`, las pausadas y las puntuales completadas no muestran texto nuevo. Porque el plan solo pide fecha para el atraso y el regreso, y la fila gana densidad (riesgo anotado en la E3 y la E9).
- D7 (2026-11-13, analyst, fecha exacta): la fecha se escribe «hoy», «ayer» o «mañana» si cae en esos días locales; si no, día de la semana y número («martes 10»), con « de <mes>» si el mes no es el de ahora («martes 28 de octubre») y « de <año>» si el año no es el de ahora. Lleva la hora `HH:MM` en 24 h (cifras de ancho fijo, §6) cuando el instante no es las 00:00 (horario, relativas, posposición): «hoy 18:00», «martes 10 19:30». Porque sigue el ejemplo del plan («martes 10») y las convenciones de **Última vez** (§6.2) y del Historial (§6.3).
- D8 (2026-11-13, analyst, distancia relativa): va después de la fecha, separada por « · ». A 2 o más días locales: «hace N días» / «en N días» (diferencia en días locales, como **Última vez**). Con la fecha escrita como «hoy», «ayer» o «mañana»: si lleva hora, en horas («hace 3 horas», «en 1 hora») o, a menos de una hora, en minutos («en 40 minutos»; lo pasado redondea hacia abajo y lo futuro hacia arriba, nunca «en 0 minutos»); sin hora, no hay distancia porque la palabra ya lo es. Porque el plan pide la distancia junto a la fecha exacta y estas son las unidades que la app ya usa.
- D9 (2026-11-13, analyst): los textos de fecha y distancia se actualizan solos con el paso del tiempo (al pasar la medianoche, la hora o el minuto que corresponda), como **Última vez** con el panel abierto. Porque derivan de ahora y de reglas visibles; no es un cambio de estado ni de orden que la app haga sola (regla global 3).
- D10 (2026-11-13, analyst, cierre al completar): el cierre es el aviso de deshacer de §5.4, no un aviso nuevo: debajo de «Completaste «🌱 Regar»» agrega «Vuelve el jueves 19 · en 6 días», con el instante de D4 calculado después del completado y el formato de D7, D8 y D14 (el mismo texto que mostrará su fila `en espera`). Sin felicitaciones ni otras palabras. Una puntual (que no vuelve) muestra solo «Completaste …», como hoy. Duración, Deshacer y reemplazo no cambian. Porque §5.4 ya es el aviso de completar y solo hay uno a la vez; el plan pide un cierre «breve» e «informativo» y pone las felicitaciones en «Evitar».
- D11 (2026-11-13, usuario, orden): P1 «No, §6.1 queda igual (Recomendada)». El orden de la lista no cambia; la épica toca solo textos y color.
- D12 (2026-11-13, usuario, texto de la fila atrasada): P2 ««Tocaba el martes 10 · hace 3 días» (Recomendada)», con la fecha en que pasó a tocar (fecha límite o N; en una relativa, V; con horario, A) y la distancia relativa, sin la palabra «Atrasada».
- D13 (2026-11-13, analyst, qué fecha muestra «Tocaba»): el instante de D12 por tipo. Puntual con fecha límite: el día `fechaLimite`, sin hora, tenga o no horario (con horario, `A` de una puntual es la primera ventana después de `creadaEn`, que puede ser semanas antes de la fecha límite). Relativa: `V` (con hora, D7). Calendario: el día de `N`, sin hora. Con horario, las periódicas usan `A` (en varios horarios, el inicio de `N`, §5.6 y §5.7). Si `A` todavía no llegó (la tarea se atrasó por el atraso sin horario de §5.5 antes de que abriera su ventana), se usa el instante sin horario (`V`, o 00:00 de `N`), así «Tocaba» nunca nombra un instante futuro. Porque D12 elige «la fecha límite» para las puntuales, y un «Tocaba» con fecha futura contradice la palabra.
- D14 (2026-11-13, analyst, armado de la frase): «Tocaba» y «Vuelve» llevan «el» solo delante de la forma con día de la semana: «Tocaba el martes 10 · hace 3 días», «Tocaba ayer», «Tocaba hoy 09:00 · hace 3 horas», «Vuelve mañana», «Vuelve hoy 18:00 · en 40 minutos», «Vuelve el jueves 19 · en 6 días». La distancia sigue a D8 en las dos frases. Porque «el hoy» o «el mañana» no son castellano, y así una sola regla arma la fecha para la fila atrasada, la fila en espera y el aviso de D10.

## Artefactos

## core

## acceptance

## ui

## cleaner · architect · hardener · qa

## Log

- L1 (2026-11-13): pedido original del usuario, textual: «dale, arrancá con el analyst», sobre la épica E2 de `docs/v3/plan.md`, «Estado sin culpa y reglas a la vista». El usuario autorizó el modo automático: preguntar solo decisiones de producto reales, de a una, con opciones cerradas, y resolver lo demás con el plan y el spec.
