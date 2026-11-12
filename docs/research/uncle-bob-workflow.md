# Workflow de Robert C. Martin: BDD + mutación con agentes

Investigado: 2026-10-25. Fuentes primarias: repos de `github.com/unclebob` (prompts de roles leídos textualmente de la rama `six-pack` de `swarm-forge`) y posts suyos en X.

## 1. Visión general

Cada historia o feature atraviesa una **cadena de agentes estrechos**. Cada agente tiene un único dueño de responsabilidad y le pasa el trabajo al siguiente con un **commit + handoff**. Martin no revisa el código generado línea por línea. Lo reemplaza con un **guantelete de gates deterministas**:

- Tests unitarios (TDD)
- Tests de aceptación generados desde Gherkin
- CRAP ≤ 10
- DRY
- Mutación del código fuente
- **Mutación del Gherkin**
- Suite de QA end-to-end

> "Lots of times I just use unit tests and crap evaluation. That seems to work pretty well." — Martin en X. Gherkin + QA rinden más en proyectos grandes.

## 2. La cadena (SwarmForge "six-pack")

Config real (`swarmforge/swarmforge.conf`):

```
specifier  master            (task)
coder      worktree coder    (task)
cleaner    worktree cleaner  batch back-one
architect  worktree architect batch back-all
hardender  worktree hardender batch
QA         worktree QA       batch back-all
```

Cada agente trabaja en su propio **git worktree** y sesión tmux. Los handoffs son commits encolados (`swarm_handoff.sh`, `ready_for_next.sh`, `done_with_current.sh`).

| # | Rol | Hace | NO hace |
|---|---|---|---|
| 1 | **specifier** | Gherkin (formato APS) + suite de QA E2E en prosa. Fases: escribir Gherkin → podar parámetros → `ir-dry-checker` → `Background` → suite QA → commit + handoff. | No corre mutación ni herramientas de calidad. |
| 2 | **coder** | Monta el pipeline de aceptación (generador, runtime, step handlers con regex). **TDD**: unit tests que fallarían ante una implementación plausible pero incorrecta, y después el código mínimo. Pasa a cleaner cuando unit + aceptación están en verde. | Ignora la suite QA. No corre CRAP/DRY/mutación. |
| 3 | **cleaner** | Refactor que preserva el comportamiento: nombres, cohesión, duplicación, tests legibles, más cobertura. **CRAP ≤ 10 en todos los archivos**, después DRY. Usa el scan de mutación como pista para dividir módulos con más de un trabajo. | No corre mutación. No agrega comportamiento. |
| 4 | **architect** | Boundaries: el dominio lejos del IO y las dependencias apuntando hacia adentro. La UI le pregunta al dominio y no reimplementa reglas. Checks automáticos de arquitectura (imports prohibidos, ciclos). Agrega **property tests**. | Ignora la suite QA. |
| 5 | **hardender** | Mutación del lenguaje **archivo por archivo, diferencial** contra el manifest. Mata sobrevivientes y cubre lo no cubierto. Después mutación de Gherkin `--level soft`, CRAP ≤ 10 en archivos cambiados y DRY. | Ignora la suite QA. |
| 6 | **QA** | Convierte la suite QA en prosa del specifier en **scripts ejecutables que operan solo por la UI** (sin API interna). Verifica todo, corrige bugs mínimos y corre CRAP + DRY. Si la QA contradice al Gherkin o a los unit tests, **frena y pregunta**. Al terminar hace handoff con `priority: 00` a todos (sync). | No corre mutación. |

Reglas transversales (constitución):

- Todos menos el specifier corren unit + aceptación antes del handoff.
- Las herramientas se corren **de a una, nunca en paralelo**.
- No se inventan proxies de CRAP/mutación: se usan las herramientas oficiales.
- Los manifests de mutación no se editan a mano.
- Separar los módulos testeables de los "ambientalmente inadecuados" (GUI, IO, red) en adapters chicos excluidos de las herramientas de test.
- Commits con byline `By <rol>.` y archivos temporales en `./tmp/` del worktree.

## 3. Acceptance Pipeline Specification (APS)

Repo: `unclebob/Acceptance-Pipeline-Specification`.

```
.feature → gherkin-parser → JSON IR → [ir-dry-checker] → generador de entrypoints → tests ejecutables → runner del proyecto
```

- **Lo provee APS** (Babashka `bb`, con fallback en Go): `gherkin-parser`, `gherkin-ir-dry-checker` y `gherkin-mutator`.
- **Lo construye el proyecto/agente**: generador de entrypoints, runtime (expande escenarios y despacha pasos), step handlers y **runner adapter** (worker persistente por stdin/stdout para el mutador).
- **Subconjunto de Gherkin**:
  - Soporta `Feature`, `Background`, `Scenario`, `Scenario Outline` y `Examples`, con los pasos `Given/When/Then/And`.
  - **No soporta**: tags, `Rule`, **keywords localizadas** (en español no se puede), doc strings, data tables en pasos ni celdas entre comillas.
  - Los parámetros son `<nombre>`.
- **Mutación de Gherkin**:
  - Muta **solo los valores de las tablas `Examples`**, una celda por vez, sobre una copia del IR. Cada mutación tiene que hacer **fallar** el test.
  - Por tipo de valor: entero ± delta, float, booleano invertido, **fecha/hora ISO-8601 ± delta**, duraciones, listas separadas por coma y "dither" de strings.
  - Un escenario sin `Examples` no se puede mutar. Por eso todo lo que varía se escribe como parámetro.
  - Es diferencial: guarda un stamp/manifest en el `.feature` y tiene los niveles `full | hard (default) | soft`.
- Las pruebas de aceptación corren contra el **comportamiento del proyecto vía step handlers**, no contra la UI. La UI la cubre la suite QA aparte.

## 4. Herramientas para TypeScript

| Gate | Herramienta | Notas TS |
|---|---|---|
| Mutación | `unclebob/mutator` (Python, multi-lenguaje) | Operadores Java + `===`/`!==` + `??`. Corre `npm test` desde el `package.json` más cercano. Exige `crapper` clonado en `../crapper`. Diferencial con snapshots en `.metrics/mutate/`. `--scan` y `--changed`. Exit 3 si sobrevive un mutante. |
| CRAP | `unclebob/crapper` | `CRAP = CC² × (1 − cov)³ + CC`. Cobertura LCOV; con Vitest usa `vitest --coverage`. `--threshold 10` sale con 2 si se supera. Escribe `.metrics/crap.edn`. |
| DRY | `unclebob/dryer` | Repo sin README público; hay que verificar el soporte para TS. |
| Gherkin | APS (`bb`) | Hay que instalar Babashka. |

## 5. Diferencias con nuestro spec actual

1. `docs/spec.md` §9 dice "BDD todo E2E con playwright-bdd". En el modelo de Martin, **el Gherkin corre contra el dominio** (rápido y mutable), y **lo E2E es la suite QA** separada. Mutar Gherkin sobre E2E con navegador + emulador sería lentísimo: cada mutación es una corrida completa.
2. Gherkin APS no admite keywords en español: `Given/When/Then` van en inglés, aunque el texto de los pasos puede ir en español.
3. SwarmForge orquesta CLIs separadas en tmux. Con Claude Code, el equivalente es **un subagente por rol** (`.claude/agents/*.md`) y un orquestador que hace los handoffs.

## Fuentes

- https://github.com/unclebob/swarm-forge (ramas `main`, `six-pack`)
- https://github.com/unclebob/Acceptance-Pipeline-Specification (`parser-spec.md`, `mutator-spec.md`, `acceptance-generator.md`)
- https://github.com/unclebob/mutator · https://github.com/unclebob/crapper
- https://x.com/unclebobmartin/status/2054614775397568761 (mutación de Gherkin vía JSON IR)
- https://x.com/unclebobmartin/status/2072736888478175413 ("unit tests and crap")
- https://x.com/unclebobmartin/status/2026015551009460727 (mutación sobre líneas cubiertas)
