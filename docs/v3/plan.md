# Plan de la v3

Doce épicas ordenadas, en dos etapas. La primera baja el costo de **empezar una tarea** para una persona sola; la segunda abre el hogar compartido. Responde al encargo de `docs/v3/brief-fable.md` y razona sobre los cuatro documentos de `docs/research/v3/`, no sobre las fuentes originales.

Cada épica es un bloque de valor que el rol analyst parte después en features. Lo que figura en «Qué propone» es material para ese análisis, no un alcance comprometido.

## Cómo leer este plan

- **Citas.** `tdah`, `tea`, `aacc` y `hogar` abrevian `tdah.md`, `tea.md`, `aacc-2e.md` y `hogar-compartido-y-apps.md`. Sigue el hallazgo (`tdah §1.3A`, `aacc H5`, `hogar A4`) y, entre paréntesis, la fuerza que le asigna ese documento.
- **Hipótesis.** No hay estudios sobre tareas del hogar en adultos con altas capacidades o 2e, ni sobre hogares donde las dos personas son neurodivergentes (`README.md`, «Límites conocidos»). En rigor, todas las épicas son hipótesis. La marca **Hipótesis** señala las más frágiles: las que descansan sobre evidencia débil, anecdótica o extrapolada.

## Reglas para todas las épicas

Lo que la investigación pide evitar es parte del diseño. Estas reglas valen siempre y no se repiten en cada épica:

1. **Sin rachas, puntos, niveles, mascotas ni rankings.** Las rachas motivan hasta que se rompen y después empujan al abandono (`hogar B1`, moderada); las recompensas esperadas bajan la motivación intrínseca (`aacc H6`, fuerte).
2. **Sin culpa.** Ningún contador que crece, ningún estado «fallido», ningún muro rojo (`aacc H5`, fuerte; `tdah §2.7`, débil a moderada).
3. **La app no cambia nada sola.** Ni el orden, ni un estado, ni un modo cambian sin una regla visible o un gesto de la persona (`tea §2`, moderada).
4. **Todo lo nuevo es opcional y arranca en calma.** Sin asistentes de configuración, sin sonido, sin animaciones obligatorias (`tea §10` y `§11`, débil; `hogar B5`, anecdótica).
5. **Tono adulto, literal e informativo.** Describe hechos; no ordena, no felicita de más y no usa lenguaje clínico (`aacc H6`, fuerte; `aacc H12`, moderada; `tea §9`, débil).
6. **Lo necesario para actuar está en la fila; la configuración, en el panel** (`tdah §2.1`, anecdótica a moderada; `aacc H9`, débil).

## Cómo se valida cada épica

La anotación de la E1 es el instrumento. Cada nota guarda el sentido (me sirvió / me molestó), el contexto y la fecha.

- **Cuándo se lee.** No antes de cuatro semanas de uso de cada feature: el efecto de novedad cae alrededor de la cuarta semana (`tdah §1.3E` y `§2.5`, débil a moderada). Juzgar antes mide el entusiasmo, no la utilidad.
- **Cómo se lee.** Dos personas no dan estadística: se lee cada nota. La misma molestia anotada dos veces, o por las dos personas, alcanza para cambiar o retirar una feature.
- **El silencio no aprueba.** Se completa con el dato que la función ya guarda en la cuenta (cuántas tareas tienen primer paso, cuántos completados fueron versión mínima), leído a mano y sin enviarlo a ningún lado.
- **Qué se decide.** Mantener, cambiar o retirar. Después de cada épica se vuelve a decidir el orden de las que quedan.

## Decisión sobre los avisos

**No entran avisos con la app cerrada.** Sin servidor no hay notificaciones push, y no encontramos una forma estable de programar una notificación local desde una PWA (la API Notification Triggers de Chrome figura como experimental en su documentación). La investigación tampoco los defiende: las alarmas «recuerdan, pero no ayudan a vencer la inercia» (`tea §1`, moderada), las notificaciones cuestan atención (`hogar B3`, moderada) y la insistencia alimenta la evitación (`tea §5`, débil).

El disparador externo sí hace falta (`tea §1`; `tdah §2.3`, débil a moderada). Se resuelve de tres formas:

1. **Un evento de la vida diaria en lugar de una alarma** (E8): la memoria prospectiva basada en eventos se conserva mejor que la basada en horas (`tdah §2.3`).
2. **Señales discretas con la app abierta**, sin sonido (E7).
3. **La otra persona, a pedido de quien lo necesita** (E12).

## Etapa 1: empezar

Precedente: la migración a SvelteKit 3 (`docs/v3/backlog.md`), ya hecha en la rama `chore/sveltekit-3`, se integra antes de la E1.

### E1. Anotación «me sirvió / me molestó»

- **Problema y persona.** Todas. El plan descansa en inferencias; sin un registro barato de qué funciona, se evalúa de memoria.
- **Evidencia.** `aacc H1` (fuerte en que la base es escasa); `aacc H12` (moderada: la tecnología para TDAH se diseña sin sus usuarios); `tea`, pregunta abierta 7.
- **Qué propone.** Un gesto de dos toques, siempre en el mismo lugar: sentido, contexto tomado solo (pantalla y, si la hay, tarea), fecha y una línea de texto opcional. Una pantalla para releer las notas propias y copiarlas como texto.
- **Hipótesis y validación.** Un gesto así de corto se usa de forma espontánea lo suficiente como para decidir. Cero notas a las cuatro semanas significa que es caro o está escondido.
- **Evitar.** Que la app pida opinión: es una queja repetida en apps del rubro (`hogar` Parte B, Tiimo; anecdótica). Escalas de ánimo (`tea §6`, moderada). Enviar algo fuera de la cuenta. En la etapa 2, mostrar las notas de una persona a la otra.
- **Depende de · Tamaño · Riesgos.** La migración · S · El silencio; se compensa con una revisión periódica fuera de la app, con las notas que cada persona decida compartir.

### E2. Estado sin culpa y reglas a la vista

- **Problema y persona.** TDAH, TEA y altas capacidades. Antes de empezar hay que mirar la lista, y hoy la fila dice «Atrasada» en un color rojizo y pone primero lo que lleva más tiempo sin hacerse (spec §6.1). Eso sube el umbral emocional de inicio.
- **Evidencia.** `aacc H6` (fuerte: el lenguaje controlador aumenta la motivación basada en culpa); `aacc H5` (fuerte: perfeccionismo y procrastinación); `tdah §1.2c` (moderada); `tea §2` (moderada); `tdah §2.2` (moderada, resultados mixtos); `tea §5` y `§9` (débil).
- **Qué propone.** Redactar el atraso como un hecho con fecha («desde el martes 10»), sin color de alarma. Distancia relativa junto a la fecha exacta, también para el regreso de las tareas en espera. Un «por qué está aquí» consultable por tarea. Al completar, un cierre informativo breve con la próxima fecha.
- **Hipótesis y validación.** Una lista que describe sin juzgar se abre con menos resistencia. Señal: notas «me sirvió» sobre la lista. La refuta que la redacción neutra se lea como vaga.
- **Evitar.** Eufemismos que escondan el dato. Felicitaciones al completar. Cambiar las reglas de estado: esta épica toca solo la presentación.
- **Depende de · Tamaño · Riesgos.** E1 · S a M · Muchos textos de la interfaz figuran en escenarios y scripts de QA.

### E3. Primer paso a la vista

- **Problema y persona.** TDAH y TEA. El título de una tarea es abstracto («Ropa»); decidir por dónde empezar es parte del costo de empezar.
- **Evidencia.** `tdah §1.3A` (moderada e indirecta: ningún ensayo aísla el primer paso); `tea §1` (moderada: no saber cuál es el primer paso paraliza); `tdah §1.2b` (débil: falla formar el plan, no recordarlo); `tdah §2.1` (anecdótica a moderada).
- **Qué propone.** Un campo opcional «primer paso» que se ve en la fila. Pasos opcionales para tareas largas, mostrados de a uno.
- **Hipótesis y validación.** Ver el primer movimiento concreto cuesta menos que leer el título. Señal: notas sobre tareas con primer paso, y el campo se sigue llenando después de cuatro semanas. La refuta que escribirlo cueste más de lo que ahorra.
- **Evitar.** Mostrar la descomposición entera; exigir pasos para crear una tarea; tratar como fallo una tarea con pasos a medio hacer. Demasiadas partes también paralizan (`tea §1`).
- **Depende de · Tamaño · Riesgos.** Nada · M · La fila gana densidad (la E9 lo compensa).

### E4. Versión mínima

- **Problema y persona.** Altas capacidades y TEA, sobre todo. El todo o nada: si no se puede hacer la tarea entera, no se empieza.
- **Evidencia.** `aacc H5` (fuerte para el problema; el crédito parcial como remedio es una inferencia); `tdah §1.2a` (fuerte en población general: aversión y baja autoeficacia); `tea §4` (moderada); `tea §3`, `tea §9` y `hogar A4` (débil).
- **Qué propone.** Un campo opcional «versión mínima» («solo el inodoro»). Completarla cuenta como hecha y queda en el historial como lo que fue. Un campo opcional «cuenta como hecha cuando…».
- **Hipótesis y validación.** Tener permitida una versión chica hace más probable empezar. Señal: notas «me sirvió» al completar una mínima. La refuta que marcarla se viva como derrota.
- **Evitar.** Presentar la mínima como «parcial» o con un indicador que baje. Que la app la sugiera sola.
- **Depende de · Tamaño · Riesgos.** Nada · M · Agrega un dato al completado y toca las reglas de completar (spec §4.4 y §5).

### E5. Elegir por mí

- **Problema y persona.** TDAH y TEA. Frente a la lista entera, elegir es otro costo previo a empezar.
- **Evidencia.** `tdah §1.3C` (moderada, población general); `tea §1` y `§2` (moderada: la propuesta tiene que ser determinista); `tea §8` (débil a moderada: una cosa por pantalla); `aacc H10` (débil).
- **Qué propone.** Una entrada de un toque desde Pendientes que muestra una sola tarea: la primera del orden visible, con los filtros puestos (incluido «Solo rápidas»), su primer paso y el motivo. Tres salidas: hacerla, pasar a la siguiente del mismo orden o volver a la lista.
- **Hipótesis y validación.** Quitar la decisión destraba más que mostrar todo. Señal: se sigue usando después de cuatro semanas. La refuta que la primera del orden sea siempre la más temida.
- **Evitar.** El azar. Abrir la app en este modo sin que la persona lo haya elegido. Pedir prioridades por tarea.
- **Depende de · Tamaño · Riesgos.** Rinde más después de la E3 y la E4 · S a M · El orden por antigüedad del atraso puede no ser el mejor para arrancar.

### E6. Días de baja capacidad y regreso sin deuda

- **Problema y persona.** TEA y TDAH. Hay días, o semanas, en que casi nada es posible; al volver, la lista acumulada es el agobio previo en su peor forma.
- **Evidencia.** `tea §4` (moderada para el fenómeno, débil para qué ayuda); `hogar B2` (fuerte en general: el abandono es la norma y hay que diseñar el regreso); `aacc H5` (fuerte); `aacc H3` (moderada); `aacc H8` (débil). **Hipótesis** en el mecanismo.
- **Qué propone.** Una marca «esencial» por tarea, definida en un momento de calma. Un modo mínimo que se enciende a mano y deja a la vista solo lo esencial; el resto queda como pausado, apoyado en la pausa que ya existe (spec §5.8). Una reprogramación en bloque, con vista previa, para volver después de una ausencia.
- **Hipótesis y validación.** Poder achicar la casa a lo esencial sin generar deuda evita el abandono. Señal: notas al entrar y al salir del modo. La refuta una salida que se viva como deuda.
- **Evitar.** Que la app encienda el modo o infiera el estado de la persona; preguntas de ánimo (`tea §6`); un resumen de «lo acumulado» al salir.
- **Depende de · Tamaño · Riesgos.** Nada · M a L · Son acciones sobre muchas tareas a la vez: la vista previa y el deshacer son parte del alcance.

### E7. Empezar sin compromiso

- **Problema y persona.** TDAH y TEA. Hoy una tarea está hecha o no; no existe «la empecé». Y una vez en marcha cuesta parar.
- **Evidencia.** `tdah §1.3A` (moderada, indirecta); `hogar A8` (moderada); `tdah §2.6` y `tea §1` (moderada: hiperfoco y ayuda para parar); `tdah §2.2` (moderada, mixta); `tea §8` (débil a moderada).
- **Qué propone.** «Empezar» deja la tarea en curso sin obligar a terminarla; soltarla la devuelve a su estado sin dejar rastro. Una vista «haciendo ahora» con una tarea, su paso actual y el tiempo transcurrido, calculado desde marcas de tiempo (`hogar` Parte B, Routinery). Un cierre anticipado opcional, visible con la app abierta.
- **Hipótesis y validación.** Comprometerse solo a empezar baja el umbral. Señal: las tareas en curso se terminan o se sueltan sin notas «me molestó». La refuta que queden en curso para siempre y pesen.
- **Evitar.** Cuenta regresiva con alarma; registrar sesiones cortadas; interrupciones bruscas (`tea §1`).
- **Depende de · Tamaño · Riesgos.** E3 · L · Es el mayor cambio de dominio de la etapa: un estado nuevo cruza las reglas de la §5 y el orden de la §6.1. Con la pantalla apagada, ninguna señal llega.

### E8. Planes «cuando… entonces»

- **Problema y persona.** TDAH. Lo que más falla es decidir cuándo y cómo, y recordar por hora.
- **Evidencia.** `tdah §1.3B` (fuerte en población general; débil en adultos con TDAH, con estimaciones corregidas mucho menores); `tdah §2.3` (débil a moderada); `tdah §1.3F` y `tea §1` (moderada: las rutinas reducen decisiones). **Hipótesis.**
- **Qué propone.** Un «momento» opcional por tarea («después de cenar»), redactado como plan. Una vista por momento con sus tareas en orden fijo. Es el reemplazo de la alarma.
- **Hipótesis y validación.** Atar la tarea a un evento concreto la arranca más que una hora. Señal: notas en la vista del momento. La refuta que nadie abra la app en ese momento.
- **Evitar.** Planes abstractos («esta semana»); que un plan no cumplido deje un estado; duplicar las etiquetas y los horarios que ya existen.
- **Depende de · Tamaño · Riesgos.** Nada · M · Se solapa con etiquetas y horarios; el análisis define si se construye sobre ellos. Sube en el orden si las notas dicen «me olvido de abrir la app».

### E9. Ajustes sensoriales y densidad

- **Problema y persona.** TEA. La tolerancia a estímulos varía entre personas y entre días.
- **Evidencia.** `tea §10` y `§11` (débil); `aacc H7` (moderada a fuerte en contra de una «intensidad» genérica: lo que sirve es el ajuste por persona). **Hipótesis.**
- **Qué propone.** Controles independientes: animaciones (además de respetar la preferencia del sistema), color de los estados pleno o atenuado, emoji visibles o no, y dos densidades de fila.
- **Hipótesis y validación.** Las épicas anteriores cargan la fila; poder aliviarla sostiene el uso en días malos. Señal: los ajustes se cambian y quedan. La refuta que nadie los toque.
- **Evitar.** Convertir los ajustes en un paso previo al uso; agregar sonido.
- **Depende de · Tamaño · Riesgos.** E2 a E7 · S a M · Cada interruptor multiplica los estados que QA tiene que cubrir. Se adelanta si aparecen quejas de densidad.

## Etapa 2: hogar compartido

### E10. Hogar y tareas del hogar

- **Problema y persona.** Hogar compartido. La carga invisible está en anticipar y vigilar, no en ejecutar; si una persona asigna y recuerda a la otra, la app se vuelve un canal de reproche.
- **Evidencia.** `hogar A1` (moderada); `A2` (moderada a fuerte: pesa la justicia percibida); `A3` (moderada); `A10` y `A4` (débil); `B5` y `B6` (anecdótica).
- **Qué propone.** Dos cuentas forman un hogar. Tres tipos de tarea: personal (invisible para la otra persona), del hogar con dueño de punta a punta y del hogar compartida («la toma quien pueda»). La misma capacidad de edición para ambas personas. Se empieza con una tarea, pasando las personales de a una.
- **Hipótesis y validación.** Un pool común con dueños explícitos reparte la anticipación sin crear un gerente. Señal: las dos personas crean y completan tareas del hogar, y ninguna nota describe vigilancia.
- **Evitar.** Roles de administrador; que una persona asigne a la otra; un reparto completo obligatorio antes de usarla.
- **Depende de · Tamaño · Riesgos.** E2 · L · El riesgo más alto del plan: reglas de seguridad (quién lee qué), cambio del modelo de datos guardado y edición de dos personas sin conexión. Levanta la exclusión «Uso compartido» del spec §2.

### E11. Acuerdos y cambios a la vista

- **Problema y persona.** Hogar compartido, con peso en TEA. Los acuerdos implícitos y los cambios silenciosos generan conflicto.
- **Evidencia.** `hogar A7` (moderada); `A2` (moderada a fuerte); `A6` (moderada a débil); `A4` y `tea §9` (débil).
- **Qué propone.** «Cuenta como hecha cuando…» acordado en las tareas del hogar. Los cambios a una tarea del hogar quedan visibles para ambas personas, con quién cambió qué. Un historial del hogar que muestra el trabajo de las dos, sin totales.
- **Hipótesis y validación.** Ver el trabajo y los acuerdos ajusta la percepción sin convertirla en marcador. Señal: notas «me sirvió» en el historial del hogar. La refuta la primera nota que hable de sentirse medido.
- **Evitar.** Porcentajes y conteos por persona; color de alarma junto a un nombre; avisos por cada acción ajena (`hogar B3`); mostrar a una persona lo que la otra no hizo (`tdah §2.7`).
- **Depende de · Tamaño · Riesgos.** E10 · M · La evidencia no dice dónde termina la visibilidad y empieza llevar la cuenta (`hogar`, pregunta 3).

### E12. Pedir una mano y hacer juntos

- **Problema y persona.** Hogar compartido. La inercia a veces solo cede con un estímulo externo, y pedirlo no tiene que ser un reproche ni una orden.
- **Evidencia.** `hogar A8` y `tea §1` (moderada: el «compañero de atasco»); `hogar A9` y `tdah §1.3G` (débil: sin ensayos controlados y con un resultado nulo publicado); `hogar A5` (moderada). **Hipótesis**, tratada como experimento barato.
- **Qué propone.** Un pase de mano («¿puedes tomar esta?») que la otra persona acepta o rechaza sin dar motivos. Ver que la otra persona empezó algo y sumarse con una tarea propia.
- **Hipótesis y validación.** El estímulo externo sirve cuando lo pide quien lo necesita. Señal: los pases se usan y se aceptan. La refuta una sola nota que describa presión o vigilancia.
- **Evitar.** Un botón para recordarle algo a la otra persona; invitaciones que la app genera sola; comparaciones.
- **Depende de · Tamaño · Riesgos.** E10 y E7 · M · Sin avisos, un pedido se ve recién cuando la otra persona abre la app.

## Orden y motivos

| # | Épica | Tamaño | Respaldo |
|---|---|---|---|
| E1 | Anotación | S | Decisión tomada |
| E2 | Estado sin culpa y reglas a la vista | S a M | Fuerte a moderado |
| E3 | Primer paso a la vista | M | Moderado, indirecto |
| E4 | Versión mínima | M | Fuerte el problema, inferido el remedio |
| E5 | Elegir por mí | S a M | Moderado |
| E6 | Baja capacidad y regreso sin deuda | M a L | Moderado; hipótesis en el mecanismo |
| E7 | Empezar sin compromiso | L | Moderado, indirecto |
| E8 | Planes «cuando… entonces» | M | Hipótesis |
| E9 | Ajustes sensoriales y densidad | S a M | Hipótesis |
| E10 | Hogar y tareas del hogar | L | Moderado |
| E11 | Acuerdos y cambios a la vista | M | Moderado |
| E12 | Pedir una mano y hacer juntos | M | Hipótesis |

1. **E1 primero**, por decisión tomada: sin ella nada de lo demás se puede juzgar.
2. **E2 segunda**: es barata, tiene el mejor respaldo del plan, no toca reglas de dominio y fija la redacción que usan las épicas siguientes.
3. **E3 a E5** son el núcleo de «empezar»: qué hacer primero, cuánto alcanza y cuál elegir. Van de la más directa a la que más rinde con las anteriores ya hechas.
4. **E6 antes que E7**: reutiliza la pausa existente y ataca el peor caso del agobio previo. La E7 es el cambio de dominio más riesgoso de la etapa y, además, habilita la E12.
5. **E8 y E9 al final de la etapa**, por ser las más débiles en evidencia. Las dos tienen escrita una condición para adelantarse.
6. **Entre etapas, una pausa de lectura**: se revisan todas las notas y se ajusta la etapa 2 antes de empezarla.
7. **E10 a E12** siguen sus dependencias: primero el hogar, después lo que se ve y al final lo que se pide.

Cada épica rinde desde su primera feature: un solo campo o una sola vista ya sirve en producción.

## Qué queda afuera de la v3

| Idea | Motivo |
|---|---|
| Avisos con la app cerrada | Sin servidor; ver «Decisión sobre los avisos». |
| Rachas, puntos, niveles, mascotas, rankings | Regla 1. |
| Presupuesto de energía («cucharas») y registros de estado | Evidencia de comunidad (`tea §7`) y riesgo con alexitimia (`tea §6`). El modo mínimo de la E6 cubre la necesidad con un solo interruptor. |
| Novedad: retos, contra reloj, temas | Débil y se desgasta (`tdah §1.3E`); choca con la predictibilidad (`tea §2`). |
| Desglose de tareas con IA | Anecdótica (`hogar` Parte B); exige un servicio externo y sacar datos de la cuenta. Los pasos se escriben a mano (E3). |
| Fotos por paso (`tea §9`) | Cloud Storage for Firebase exige el plan Blaze. |
| Línea de tiempo o calendario visual | Anecdótica (`hogar` Parte B). Las tareas en espera con fecha exacta (E2) cubren la anticipación. |
| Comparar tiempo estimado y real (`tdah §2.2`) | Necesita los datos de la E7; se evalúa después. |
| Emparejar una tarea con algo agradable (`tdah §1.3D`); plantillas de autocuidado por hora (`tea §6`) | Ya se puede: la nota, el emoji y la periodicidad por horas existen. |
| Rotación automática de tareas | Anecdótica; primero el acuerdo fijo (E10). |
| Indicador del hogar («al día en 8 de 10») | Anecdótica (`hogar B4`); puede volverse puntaje. |
| Esfuerzo acumulado por persona | Es llevar la cuenta (`hogar A2`, `aacc H3`). |
| Exportación de datos | Cada instalación es dueña de su proyecto de Firebase. |

## Conflictos entre hallazgos

1. **Rutina contra novedad.** La predictibilidad tiene respaldo moderado (`tea §2`); la novedad, débil y con desgaste (`tdah §1.3E`); la tensión misma solo consta en relatos (`aacc H10`). Gana la estructura fija. Varía solo lo que la persona elige (emoji, nombre) y un «pasar a la siguiente» determinista (E5).
2. **Recompensa inmediata contra recompensas que dañan la motivación.** `tdah §1.3D` (moderada) pide algo inmediato, `aacc H6` (fuerte) descarta la recompensa tangible y `tea §10` pide calma. Resolución: un cierre informativo, breve y sin sonido (E2). Informa lo logrado, no premia.
3. **Hace falta un disparador externo, pero los avisos repelen.** `tea §1` y `tdah §2.3` contra `tea §5` y `hogar B3`. Resolución en «Decisión sobre los avisos».
4. **Fecha exacta contra distancia relativa.** `tea §9` pide literalidad y `tdah §2.2` pide distancia. Se muestran las dos.
5. **Descomponer ayuda, pero demasiadas partes paralizan** (`tdah §1.3A`, `tea §1`). Pasos opcionales, de a uno, nunca obligatorios (E3).
6. **Autonomía contra estructura.** `aacc H6` y `tea §5` piden control, pero una pantalla en blanco no ayuda (`aacc`, pregunta 1). Valores por defecto fuertes; todo campo nuevo es opcional.
7. **Hacer visible el trabajo contra no llevar la cuenta.** `hogar A2` contra `A6` y `aacc H3`. Se muestran hechos del hogar, nunca agregados por persona (E11).
8. **Cambios visibles contra fricción.** `hogar A7` contra el costo de confirmar para el perfil TDAH (`hogar`, pregunta 4). El cambio se ve, pero no pide confirmación.

## Preguntas que solo pueden responder los usuarios

1. ¿Qué disparador hace empezar de verdad: el primer paso a la vista, un momento del día o la otra persona? (`tea`, pregunta 2)
2. ¿Se extrañan los avisos con la app cerrada?
3. ¿Qué redacción del atraso se siente neutra sin ser vaga?
4. ¿La versión mínima reinicia el ciclo completo de una tarea periódica, o la tarea tendría que volver antes?
5. ¿Hay tareas periódicas que no deberían figurar nunca como atrasadas, solo como disponibles? (`tea`, pregunta 3)
6. ¿«Elegir por mí» tiene que empezar por lo más antiguo o por lo más corto?
7. ¿Qué es esencial en un día malo? ¿El modo mínimo se enciende solo a mano, o la app puede ofrecerlo al volver de una ausencia?
8. Al completar, ¿algo o nada?
9. En el hogar, ¿las tareas personales son del todo invisibles, o se ve un «ocupado con N cosas»? (`hogar`, pregunta 1)
10. ¿Quién ve como atrasada una tarea del hogar: su dueño o las dos personas? (`hogar`, pregunta 2)
11. ¿Dueño fijo por acuerdo o rotación? (`hogar`, pregunta 5)
12. ¿Hacer juntos ayuda o se siente como vigilancia? (`tdah`, pregunta 5)
