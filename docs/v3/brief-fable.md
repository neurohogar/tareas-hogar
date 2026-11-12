# Brief: plan de la v3

Encargo para la sesión que arma el plan de funcionalidades de la v3. Se abre en una sesión nueva con `/model fable`, con este pedido: «Seguí `docs/v3/brief-fable.md`».

## Qué hay que entregar

`docs/v3/plan.md`: el plan de la v3 en **épicas ordenadas**. Cada épica es un bloque de valor que después el rol analyst del pipeline parte en features. No hace falta bajar a features.

Para cada épica:

- qué problema ataca y para qué persona (TDAH, TEA, altas capacidades, o hogar compartido);
- los hallazgos que la respaldan, citados por documento y hallazgo (por ejemplo `tdah.md §1.3B`), con la fuerza de su evidencia;
- la hipótesis que pone a prueba y cómo la vamos a validar con la anotación «me sirvió / me molestó»;
- lo que tiene que **evitar**, según la investigación;
- de qué depende, un tamaño aproximado (S/M/L) y sus riesgos.

Después de las épicas:

- el orden propuesto y por qué;
- las ideas de la investigación que **quedan afuera** de la v3, y el motivo;
- los conflictos entre hallazgos y cómo los resolviste (por ejemplo, rutina contra novedad);
- las preguntas que solo pueden responder los usuarios.

Escribí en español neutro. Un plan que se pueda leer en 15 minutos vale más que uno exhaustivo.

## Qué leer

1. `docs/research/v3/README.md`: método y límites de la investigación.
2. Los cuatro documentos de `docs/research/v3/`: `tdah.md`, `tea.md`, `aacc-2e.md` y `hogar-compartido-y-apps.md`.
3. `docs/v3/backlog.md`: trabajo técnico ya decidido.
4. `docs/spec.md`, secciones 1 y 2: qué hace la app hoy y qué excluye. Leé el resto solo si una épica toca una regla existente.

## Decisiones ya tomadas (no reabrirlas)

- **Para quién:** la v3 es para dos adultos que comparten casa, con TEA, TDAH y altas capacidades. La comunidad la usa instalando su propia copia; una instancia pública queda para la v4.
- **Objetivo central:** **bajar el costo de arrancar una tarea**, es decir, la falta de impulso y el agobio antes de empezar. Es el problema principal y la idea en la que coinciden los cuatro documentos. La primera tanda de épicas apunta a esto.
- **Hogar compartido:** entra en la v3, pero como **segunda etapa**, después de lo personal. Hoy cada cuenta tiene sus datos aislados.
- **Primera épica fija:** la anotación «me sirvió / me molestó». Un gesto mínimo dentro de la app, guardado en la cuenta de cada persona y sin telemetría hacia afuera. Es la herramienta con la que se valida todo lo demás. Ponela primera en el orden.
- **Antes de cualquier épica** se hace la migración a SvelteKit 3 (`docs/v3/backlog.md`). No hace falta planificarla, solo tenerla en cuenta como precedente.
- **Infraestructura:** solo el plan gratis de Firebase, sin Blaze ni Cloud Functions. Como no hay servidor, no hay notificaciones push con la app cerrada. Lo que dependa de eso se descarta o se resuelve de otra forma (por ejemplo, con la app abierta o con el reloj del dispositivo). Decidí vos si los avisos entran y cómo.
- **Entrega:** cada feature se despliega en cuanto pasa QA, así que las épicas tienen que rendir valor de a una feature, no recién al completarse.
- **Proceso:** cada feature recorre el pipeline de 10 roles (`CLAUDE.md`). El plan no lo cambia.

## Restricciones de diseño

- Toda propuesta cita la evidencia que la respalda. Si una épica descansa sobre evidencia débil o solo anecdótica, decilo y tratala como hipótesis.
- Lo que la investigación pide evitar es parte del diseño: rachas, puntos, culpa, recordatorios que insisten, cambios que la app hace sola y tono infantil.
- La app ya resuelve bastante: no repitas lo que existe (ver el spec). Mejorá sobre eso.
- El repositorio es público y anónimo: el plan no nombra ni describe a personas concretas.
