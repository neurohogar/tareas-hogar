# Harness de mejora de UI/UX: el método de Theo y cómo aplicarlo a Tareas Hogar

Investigado: 2026-11-04. Fuentes primarias: transcripción del video [«Agents Sucked At UI (Until Today)»](https://www.youtube.com/watch?v=xq0eB8vxeqk) (Theo - t3.gg, publicado el 2026-11-03, 31:44); repo [`t3dotgg/tstack`](https://github.com/t3dotgg/tstack); PR [#24776](https://github.com/pingdotgg/t3code/pull/24776), [#24837](https://github.com/pingdotgg/t3code/pull/24837) y [#24865](https://github.com/pingdotgg/t3code/pull/24865) de T3 Code; documentación oficial de Playwright, axe-core, Claude Code y W3C; artículo de ingeniería de [Anthropic](https://www.anthropic.com/engineering/harness-design-long-running-apps); código de este repo.

Transcripción: se obtuvieron los subtítulos automáticos en inglés (`en-orig`). Los subtítulos en español fallaron con HTTP 429 y no hicieron falta. No se vio la imagen del video, solo su texto. Las marcas de tiempo son el inicio de bloques de unos 30 segundos.

## 1. Conclusión

El video muestra un método simple: un agente modifica la UI, varios modelos puntúan capturas de pantalla y el ciclo sigue hasta llegar a una nota objetivo. Las notas de T3 Code suben de verdad, pero el mismo video prueba que **no sirven como medida**: la misma versión pasó de 9 a 7,4 con solo cambiar el contexto del juez.

Recomendación: adoptar el ciclo y el juez separado, y no adoptar la nota como condición de corte. Para este proyecto, los gates son solo lo que miden Playwright y axe; el modelo propone y critica; la persona elige la versión final. Cualquier cambio de comportamiento sale del ciclo y entra por el pipeline normal. Conviene empezar con un piloto sobre una sola pantalla.

## 2. Qué propone el video

El sponsor (Magic Patterns, 02:04-04:06) queda fuera del método.

| Marca | Propuesta o hecho |
|---|---|
| 01:03-01:34 | Plantea la mejora de UI como un *hill climb*, sin agregar skills ni pagar un diseñador: «turning it into a hill climb» (el subtítulo automático dice «hell»). Cifras declaradas: 18 horas, cinco modelos, más de 30 rondas. |
| 06:08-06:38 | Primer objetivo con `/goal`: seguir iterando hasta que el *council* dé al menos 9/10 a un conjunto de capturas. |
| 06:38-08:11 | Skill `council`: un modelo fuerte de cada proveedor, trabajo de solo lectura, una nota sobre 10 por delegado y una ronda nueva tras cada corrección. |
| 11:46-12:18 | Pide al modelo capturas de antes y después con flechas, porque le costaba ver las diferencias. |
| 12:49-13:19 | Llega a 9/10, mira la app y **no le alcanza**: la compara a mano con Claude Code y ChatGPT. |
| 14:19-14:51 | Agrega capturas de Claude Code y Codex al panel y pide superarlas en todas las categorías. Esa corrida dura casi 18 horas. |
| 15:22 | Con las referencias, la versión que había obtenido 9 baja a 7,4. |
| 16:53-17:23 | Para ahorrar tokens, corre primero un solo modelo y suma los otros cuando este llega al umbral. |
| 18:27-20:59 | Sube el objetivo a 9,5 en cada categoría, en un worktree aparte. Hacen falta 10 rondas más. |
| 19:58-20:28 | Las notas de las apps de referencia suben aunque sus capturas no cambiaron. Sospecha que mencionar el 9,5 sesga a los jueces y propone ocultárselo. |
| 20:59-23:01 | Costo declarado: 17,6 horas de agentes y entre USD 250 y 400. |
| 23:01-24:03 | Objetivo de 10/10. Detecta que el diseño quedó demasiado gris y pide recuperar color. |
| 26:37-30:11 | Generaliza: los jueces de modelo son «silly but working» y los programáticos son mejores. Ejemplo: un eval de 88 casos reales del MCP de T3 Code, llevado primero a nota perfecta y después a un tercio de los tokens. |

### Qué está demostrado y qué solo se afirma

**Verificado en fuentes:**

- El skill existe y es corto, como dice el video (25:35). El [`SKILL.md`](https://github.com/t3dotgg/tstack/blob/main/skills/council/SKILL.md) pide «one strong model from each of three different providers», trabajo de solo lectura, notas sobre 10 y seguir «until all delegates are satisfied». También pide «fight to keep scope limited».
- Las tablas de notas aparecen en los PR. #24776: de 6-6,5 a 9 en tres rondas. #24837: Sol pasa de 7,4 a 9,0. #24865: 18 rondas, con todos los delegados en 9,5 o más en cada categoría en el build `s10`.
- El cambio llegó a producción: #24865 se mergeó el 2026-10-25 (+583/-269, 59 archivos). Lo más visible quedó detrás de un toggle Beta apagado por defecto.

**Solo afirmado o sin verificar:**

- Costos, horas y la corrida 10/10: salen de lo que se narra en el video. Los PR abiertos #28839-28842 son rediseños, pero no se comprobó que correspondan a esa corrida.
- «Better UI than anyone on our team was capable of» (31:13) y «objectively» (25:05) son opiniones. Ni el video ni los PR mencionan pruebas con usuarios ni una métrica de tarea.

**Contradicciones:**

- El video dice «yesterday» (01:03, 22:01), pero los PR son del 2026-10-25 y el video se publicó el 2026-11-03. Puede haberse grabado antes.
- La versión pública del skill no coincide con la narrada: no incluye al juez bufón Gemini (09:43). El video dice que su nota se ignora y que no va al PR, pero #24865 lo cuenta entre los «four models» y publica sus notas.
- El skill público pide notas «for a code review». El uso con capturas de UI lo agregó el prompt del autor, no el skill.

## 3. Hallazgos

### 3.1 La nota de un modelo no es una medida

- **Depende del contexto.** La versión con 9/10 de Sol en #24776 parte de 7,4/10 en #24837 cuando entran las referencias (15:22).
- **Es ruidosa.** «You can give the same screenshot to the same model three times and get three different scores» (09:12). En #24776, Sol bajó a 8,5 por un artefacto de reducción de imagen y volvió a 9 sin cambios de código.
- **Sube sola.** Las referencias subieron sin cambiar (19:58).
- **Lo reconoce el autor del método.** Aun así, sostiene que llegar a 9-10 con varios modelos es «probably better» (09:12). Eso es un argumento, no una medición.
- **Necesita corrección humana.** El autor intervino dos veces contra lo que el ciclo aprobaba: a los 9/10 (13:19) y por el exceso de gris (24:03). #24865 confirma que el panel «pushed toward neutral rows and controls».

El artículo de Anthropic llega a lo mismo por otro lado. **El video no lo cita**; se incluye como evidencia independiente:

- «Agents reliably skew positive when grading their own work», y ajustar un evaluador separado para que sea escéptico es «far more tractable».
- Las notas mejoran sin ser lineales, y el autor «regularly saw cases where I preferred a middle iteration over the last one».
- Calibrar con ejemplos (*few-shot*) «reduced score drift».
- La redacción del criterio dirige el resultado: «museum quality» produjo una convergencia visual no buscada.

Inferencia: comparar dos versiones entre sí y pedir defectos con evidencia es más útil que una nota absoluta. Lo que el juez aporta son los hallazgos concretos; los cambios de #24776 y #24837 son de ese tipo (radios, jerarquía, contraste, truncado). No hay un experimento que compare ambos enfoques.

### 3.2 Qué se puede medir de forma determinista

| Pregunta | Herramienta | Clase | Límite |
|---|---|---|---|
| ¿Hay violaciones automáticas de WCAG? | [`@axe-core/playwright`](https://playwright.dev/docs/accessibility-testing) con etiquetas `wcag2a`, `wcag2aa`, `wcag22aa` | Gate | Encuentra «on average 57% of WCAG issues» ([axe-core](https://github.com/dequelabs/axe-core)). Los `incomplete` requieren revisión manual. |
| ¿El contraste de texto llega al mínimo? | axe `color-contrast` ([WCAG 1.4.3](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html): 4.5:1, o 3:1 en texto grande) | Gate | No evalúa todos los casos; lo dudoso queda en `incomplete`. |
| ¿Los objetivos táctiles tienen tamaño suficiente? | axe `target-size` ([WCAG 2.5.8](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html): 24×24 CSS px, con excepciones) | Gate | Las reglas de WCAG 2.2 están [«disabled by default»](https://github.com/dequelabs/axe-core/blob/develop/doc/rule-descriptions.md): hay que comprobar al construir que se ejecuta. |
| ¿Se corta o se desborda algo en 360×640? | Aserciones de Playwright, como `dentro` en `e2e/panel-mobile.spec.ts:41` | Gate | Solo cubre lo que se afirma explícitamente. |
| ¿Cambió la estructura accesible o el texto? | [`toMatchAriaSnapshot`](https://github.com/microsoft/playwright/blob/main/docs/src/aria-snapshots.md) | Gate | Inferencia: no ve un cambio de orden hecho solo con CSS ni un cambio de color. |
| ¿Cambió la apariencia? | [`toHaveScreenshot`](https://playwright.dev/docs/test-snapshots) | Detector de cambios | Mide diferencia, no calidad. Solo es válido en el entorno donde se generó la referencia. |
| ¿Cuesta menos usar la app? | Script propio: toques por flujo y elementos interactivos en la primera pantalla | Métrica propia | No es un estándar y el umbral sería una decisión. Es el «programmatic» que el video prefiere (26:37). |
| ¿Se ve bien? ¿Es claro? ¿Es calmo? | Juez de modelo | **Juicio** | No determinista. Nunca bloquea un merge. |

[COGA](https://www.w3.org/TR/coga-usable/) nombra explícitamente el AD(H)D y trae patrones útiles para este proyecto (4.6.1 *Limit Interruptions*, 4.6.2 *Make Short Critical Paths*, 4.2.4 *Make Each Step Clear*, 4.5.9 *Avoid Data Loss*). Pero es una Working Group Note de 2021, «not required for conformance». Se usa como rúbrica del juez, no como gate. Las [heurísticas de Nielsen](https://www.nngroup.com/articles/ten-usability-heuristics/) cumplen el mismo papel; las más pertinentes aquí son la 1 (estado del sistema), la 3 (control), la 6 (reconocer antes que recordar) y la 8 (diseño minimalista).

[Lighthouse](https://developer.chrome.com/docs/lighthouse/overview) queda descartado: su página describe auditorías de carga de una página, y estas capturas son estados dentro de un flujo con sesión iniciada. axe ya cubre la parte de accesibilidad que importa aquí.

### 3.3 Encaje con este repo

**Se reutiliza:**

- Emuladores y datos limpios: `package.json:24` y `limpiarEmuladores` en `e2e/apoyo.ts:12`.
- Sesión, reloj fijo y creación de datos por la UI: `sesionConReloj` y `crear` en `e2e/apoyo.ts:236` y `e2e/apoyo.ts:369`.
- Celular de 360×640 con táctil: `e2e/panel-mobile.spec.ts:24`.
- Patrón de hook de gate: `scripts/gate-hook.sh`, con su límite de 3 bloqueos para evitar bucles. Un rol que no está en su lista sale con `exit 0` sin correr nada (`scripts/gate-hook.sh:10-14`), así que un rol nuevo no tendría gate hasta agregarlo también en `scripts/gate.ts:13`.
- Subagentes de contexto fresco y herramientas restringidas ([documentación](https://code.claude.com/docs/en/sub-agents)).

**Falta:**

- Ninguna captura ni comparación visual: no hay `toHaveScreenshot` en `e2e/`. Tampoco `toHaveCSS`.
- axe no está en `package.json`.
- No hay proyecto con `colorScheme`, aunque la app tiene tema oscuro (`src/lib/ui/estilos.css:2`, `:24`). [Playwright lo emula](https://playwright.dev/docs/emulation).
- Falta un catálogo de escenas: pantalla, datos sembrados, hora, ancho y tema.

**`npm run qa` no sirve tal cual como base (inferencia).** Corre todo `e2e/` (`playwright.config.ts`, `testDir`), que incluye un proyecto PWA que reconstruye `build/` y tira el preview. Además, un spec nuevo dentro de `e2e/` entraría en el gate de qa (`scripts/gate.ts:111`). Conviene una configuración de Playwright aparte que importe los helpers de `e2e/apoyo.ts`. Sí se usa `npm run qa` entero como comprobación final de que nada se rompió.

**Fragilidad a tener en cuenta:**

- La fuente es `system-ui` (`src/lib/ui/estilos.css:21`), que varía entre máquinas. Las referencias visuales valdrían para una sola máquina. Eso afecta a la decisión de empaquetar una fuente, que además es de producto.
- Algunos tests de QA dependen de selectores como `.contenido` y `header` (`e2e/panel-mobile.spec.ts:36-37`): reestructurar el marcado puede romperlos sin que cambie el comportamiento.

**Ejemplo de hallazgo medible, calculado sobre la paleta actual** (fórmula de contraste de WCAG, valores de `src/lib/ui/estilos.css:3-10` y `:26-33`):

| Par | Contraste | Lectura |
|---|---|---|
| `--texto-suave` / `--fondo`, claro | 5,52:1 | Pasa 1.4.3 |
| `--texto-suave` / `--fondo`, oscuro | 7,53:1 | Pasa 1.4.3 |
| `--acento` / `--fondo`, claro | 5,31:1 | Pasa 1.4.3 |
| `--borde` / `--superficie`, claro | 1,45:1 | Bajo 3:1 |
| `--borde` / `--superficie`, oscuro | 1,35:1 | Bajo 3:1 |

Los bordes solo incumplen [1.4.11](https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast.html) si son lo único que identifica a un control, como un campo de texto. No se comprobó componente por componente.

### 3.4 Una mejora de UI puede ser una decisión de producto

- T3 Code tuvo este problema. #24776 prometía «No layout or feature changes», pero #24865 terminó cambiando textos, controles y qué filas se ocultan, y necesitó un toggle para que «nobody opens the app to a different sidebar».
- En este repo el spec fija cosas visuales. Solo la X y el botón de emoji van con icono sin texto, y **Guardar** queda solo con texto (`docs/spec.md:411`). El contraste entre completadas y no completadas está definido (`docs/spec.md:307`). El corte de celular es 40rem (`docs/spec.md:394`). Un agente que «mejore» agregando un icono a Guardar contradice el spec aunque todos los tests pasen.
- El proceso actual exige aprobación humana y el rol `ui` debe frenar con `QUESTION` ante un hueco de producto (`CLAUDE.md:11`, `.claude/agents/ui.md`).

## 4. Diseño recomendado

Un **ciclo aparte del pipeline**, en su propio worktree y rama, con tres clases de cambio:

| Clase | Ejemplos | Camino |
|---|---|---|
| A. Presentación | Espaciado, tipografía, tokens de color, radios | Dentro del ciclo |
| B. Regla visual del spec | Iconos, jerarquía definida, cortes de ancho | Propuesta: pasa por `spec-writer` |
| C. Comportamiento o texto | Flujos, orden, etiquetas, pantallas nuevas | Propuesta: pasa por `analyst` |

```
catálogo de escenas (datos sembrados, reloj fijo; 360×640, claro y oscuro)
        │
        ▼
1. capturar  ──►  PNG + reporte axe + aria snapshot + métricas de tarea
        ▼
2. juez (subagente fresco, solo lectura)
        │   compara antes/después a ciegas: defectos con evidencia, según rúbrica
        ▼
3. orquestador filtra: A entra al ciclo; B y C van a una lista de propuestas
        ▼
4. generador (subagente): corrige solo la clase A
        ▼
5. gate determinista: axe sin violaciones, aria sin cambios,
   superficie permitida, npm test ─── si falla, vuelve a 4
        │
        └─ se repite hasta el corte; un commit por ronda
        ▼
6. npm run qa + reporte HTML lado a lado ──► la persona elige una ronda y aprueba
```

Decisiones de diseño:

- **El corte no es una nota.** Se detiene al llegar a un máximo de rondas o cuando el juez no encuentra defectos nuevos de severidad alta. Anthropic observó que a veces la mejor iteración es una intermedia, por eso hay un commit por ronda y se elige.
- **Juez a ciegas.** No recibe el objetivo, las notas previas ni cuál versión es la nueva (el video lo sugiere a las 20:28; la aleatorización es una inferencia propia). Se calibra con ejemplos de esta app, buenos y malos.
- **Rúbrica propia, no de una app de escritorio.** Parte de `docs/spec.md:10` («la lista muestra primero lo que hay que hacer ahora, sin ruido») y suma COGA y Nielsen. Inferencia: las categorías estéticas de una herramienta densa para programadores no se trasladan a esta app.
- **Superficie controlada por un script.** Para la clase A, el ciclo toca `src/lib/ui/`, incluido el marcado de los componentes (decisión del §7); no toca `src/lib/core/`, `features/`, `qa/`, `e2e/` ni `docs/spec.md`. El gate de aria snapshot sigue exigiendo que el árbol accesible no cambie, así que el marcado solo puede cambiar sin alterar lo que ese árbol expone.
- **Relación con `CLAUDE.md:46`.** Playwright y axe se agregan como herramientas oficiales del ciclo. El reporte del juez se presenta como opinión y nunca figura como gate.
- **Presupuesto.** Si el ciclo corre con `claude -p`, [`--max-budget-usd`](https://code.claude.com/docs/en/cli-reference) lo limita, aunque la documentación avisa que el gasto puede superar el tope, y [`--json-schema`](https://code.claude.com/docs/en/headless) da una salida validable del juez.

### Alternativas

| Alternativa | A favor | En contra | Veredicto |
|---|---|---|---|
| **Ciclo con gates + juez + persona** | Respeta los gates; controla el alcance; detecta defectos visuales | Hay que construir escenas y el script; el resultado depende de la rúbrica | **Recomendada** |
| Copiar el video (panel de 3 proveedores, objetivo numérico) | Es lo único con resultado público | USD 250-400 declarados en una app mucho mayor; nota inestable; requiere suscripciones a otros proveedores | Descartada como está |
| Rol nuevo en la cadena de 10 | Cada feature sale pulida | Encarece todas las features; agrega juicio a una cadena de gates; mezcla pulido y entrega | No por ahora; sí se puede sumar axe a `qa` más adelante |
| Solo gates, sin modelo | Barato y determinista | Evita regresiones, pero no mejora nada que no sea un defecto medible | Es la primera etapa, no el total |

### Qué se adopta y qué se descarta del video

| Se adopta | Por qué |
|---|---|
| Ciclo con capturas frescas y juez de solo lectura | Separar quien hace de quien juzga está respaldado también por Anthropic |
| Antes/después anotado | Resolvió un problema real de revisión humana (11:46) |
| Juez barato primero | Bajó el costo sin perder el juez final (16:53) |
| Ocultar el objetivo al juez | Respuesta directa al sesgo observado (20:28) |
| Preferir evals programáticos | El propio autor los considera superiores (26:37) |
| Historial de rondas | Hace visible el ruido (12:18) |

| Se descarta | Por qué |
|---|---|
| Nota objetivo como condición de corte | Inestable, según su propia evidencia (15:22, 19:58) |
| Subir el objetivo hasta 10 | Costo creciente; 10 rondas más por medio punto (20:59) y sin demostración de beneficio para el usuario |
| Competir contra apps de desarrollo | Otro público y otra densidad (inferencia) |
| Juez bufón | Es entretenimiento, según el propio autor (09:43) |
| Merge sin revisión («YOLO merge», 30:42) | Choca con la aprobación humana de este proyecto |
| Toggle Beta | Resuelve un problema de muchos usuarios; aquí hay uno solo (`docs/spec.md:12`), y alcanza con una rama (inferencia) |

## 5. Piloto sugerido

Pantalla **Pendientes**, en celular y escritorio, tema claro y oscuro, con tres escenas: lista vacía, carga normal y muchas tareas atrasadas. Son 12 capturas por ronda, para cada juez. Máximo tres rondas. Sirve para responder lo que hoy no se sabe: costo real, y si los defectos de los jueces son útiles.

## 6. Sin verificar

- Costos, horas y la corrida 10/10 del video (§2).
- Que `target-size` corra al pedir `wcag22aa` con `withTags`: las reglas 2.2 están apagadas por defecto y la guía de Playwright solo muestra etiquetas de WCAG 2.1. Comprobar al construir.
- Que un subagente de solo lectura reciba bien las capturas por `Read`: la página oficial de subagentes no lo documenta. Probarlo en el piloto.
- `stop_hook_active` y el tope de continuaciones de hooks: se leyeron en un resumen de la página, no textualmente. El repo ya resuelve los bucles con su propio contador.
- Que los CLI `claude` y `gemini` tengan sesión iniciada y límites de uso suficientes para el panel: solo se comprobó que están instalados.
- Ninguna fuente demuestra que este método mejore el uso real para personas con TDAH. La única validación posible aquí es el uso real.

## 7. Decisiones del usuario

Tomadas el 2026-11-04.

1. **Alcance:** CSS y marcado, con aria snapshot como protección.
2. **Juez:** panel de Claude y Gemini. Con dos jueces, un desacuerdo lo resuelve el usuario.
3. **Referencias:** sin apps externas. Cada ronda se compara contra la anterior y contra la rúbrica.
4. **Cobertura:** celular y escritorio, tema claro y oscuro.
5. **Rondas:** máximo tres por corrida. El tope de gasto en dinero sigue sin definir.
6. **Fuente:** se empaqueta una. Es un cambio de producto: pasa por el pipeline antes del piloto, porque las capturas dependen de ella. La fuente concreta sigue sin elegir.
7. **Referencias visuales:** los PNG se commitean.
