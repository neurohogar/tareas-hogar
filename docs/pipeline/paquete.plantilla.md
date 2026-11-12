# Paquete: <feature>

<Una o dos líneas: qué agrega la feature, desde el punto de vista del usuario.>

## Specs

Cada `S#` cita **textual** la regla de `docs/spec.md` (con su sección), sin resumir ni reescribir. Una regla por `S#`.

- **S1** (§x.y): «<texto exacto del spec>»
- **S2** (§x.y): «…»

## Decisiones

Respuestas del usuario y decisiones del orquestador que el spec ya refleja, **textuales**, con su fecha.

- D1 (<fecha>, usuario): «<respuesta literal>»

## Artefactos

- Gherkin: `features/<a>.feature` (S1, S2), `features/<b>.feature` (S3)
- QA: `qa/<feature>.md`

## core

- **Puede editar**: `src/lib/core/<archivo>.ts`, `src/lib/core/*.test.ts` (todos los tests del core: un cambio de tipo exportado puede tocarlos) (archivos nuevos: con un glob estrecho como `src/lib/core/<tema>*.ts`, nunca el directorio entero)
- **Reglas**: S1, S2, …
- **Reusa**: <funciones existentes del core que la feature debe usar, si las hay; el gherkin-writer las nombra cuando el spec se apoya en reglas ya implementadas>
- **Gate**: `node scripts/gate.ts core`

## acceptance

- **Puede editar**: `acceptance/steps/<archivo>.ts`, `acceptance/oracle*.ts`, `acceptance/equivalence.ts`, `docs/pipeline/pendientes.txt`
- **Features a conectar**: `features/<a>.feature`, `features/<b>.feature`
- **Pasos nuevos**: <texto de cada forma de paso nueva>
- **Gate**: `node scripts/gate.ts acceptance`

## ui

- **Puede editar**: `src/lib/ui/<Componente>.svelte`, `src/lib/adapters/<archivo>.ts`, `src/routes/…`
- **Comportamiento visible**: `qa/<feature>.md`
- **Gate**: `node scripts/gate.ts ui`

## cleaner · architect · hardener · qa

Trabajan sobre todo lo que cambió la feature (`git diff <base de la feature>`, anotada en `tmp/base-de-feature`); no necesitan sección propia salvo que el gherkin-writer anote algo para ellos acá.

## Log

- L1 (<fecha>): pedido original del usuario, textual.
