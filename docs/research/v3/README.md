# Investigación para la v3

Base de evidencia para diseñar la v3 de Tareas Hogar a partir de investigación publicada y patrones de conducta estudiados, en lugar de intuiciones. Este archivo explica cómo se hizo, para poder repetirla, ampliarla o auditarla.

## Documentos

| Archivo | Tema | Fuentes (aprox.) |
|---|---|---|
| [`tdah.md`](tdah.md) | TDAH en adultos y tareas del hogar; foco en el inicio de tareas y el agobio previo | 30 |
| [`tea.md`](tea.md) | Autismo en adultos: inercia, incertidumbre, burnout, evitación de demandas, interocepción | 17 |
| [`aacc-2e.md`](aacc-2e.md) | Altas capacidades y doble excepcionalidad (2e) en adultos | 20 |
| [`hogar-compartido-y-apps.md`](hogar-compartido-y-apps.md) | Reparto de tareas y carga mental entre dos adultos; análisis de apps existentes | 45 |

Cada hallazgo tiene la afirmación, la fuerza de la evidencia (fuerte, moderada, débil, anecdótica o de comunidad), las URLs y su implicación para la app, incluido lo que conviene evitar.

## Pregunta de investigación

¿Qué funcionalidades y reglas de diseño respalda la evidencia para una app de tareas del hogar pensada para adultos con TEA, TDAH y altas capacidades, incluidos quienes comparten casa? El problema prioritario es **empezar una tarea**: la falta de impulso y el agobio antes de hacer el primer movimiento.

## Método

- **Fecha:** 2026-11-12.
- **Ejecución:** cuatro agentes de investigación de Claude Opus 5.5 en paralelo, uno por tema, con búsqueda y lectura web. Cada uno escribió solo su documento. Las consignas exactas están abajo.
- **Ajuste durante la investigación:** se le pidió al agente de TDAH que profundizara en el inicio de tareas y que contrastara críticamente la idea de «falta de dopamina» con la evidencia (consigna adicional abajo).
- **Paso siguiente previsto:** que Claude Fable 5.2 razone sobre estos cuatro documentos (no sobre las fuentes crudas) para armar el plan priorizado de funcionalidades. Cada propuesta del plan tiene que citar el hallazgo que la respalda.

## Límites conocidos

- **Fuentes leídas solo por resumen:** varias páginas bloquearon la lectura automática (PubMed, NICE, Springer, Sagepub, Nature). En esos casos se usaron resúmenes de Europe PMC, Crossref o Semantic Scholar, y cada documento lo indica. Ejemplos: Safren 2010, Solanto 2010, NICE NG87, el metaanálisis de intenciones de implementación de 2024 (en `tdah.md`). `aacc-2e.md` dejó afuera Stricker 2020 porque no se pudo leer.
- **Reddit no fue accesible:** la opinión de usuarios de apps sale de reseñas de tiendas, agregadores de reseñas y blogs.
- **Huecos de la literatura:**
  - No se encontró ningún estudio revisado por pares sobre parejas u hogares donde las dos personas son neurodivergentes.
  - No se encontró ningún estudio sobre tareas del hogar en adultos con altas capacidades o 2e.
  - Casi no hay estudios de interacción persona-computadora sobre apps de tareas para adultos autistas.
  - La teoría de las cucharas nunca se evaluó formalmente.
  - La tensión del AuDHD entre rutina y novedad se apoya sobre todo en relatos en primera persona.
  - El acompañamiento («body doubling») casi no tiene evidencia controlada.
- **Lo que hay que validar con uso real:** todas las reglas marcadas como hipótesis. Las personas que usan la app funcionan como comité de diseño.

## Cómo ampliar

1. Elegir un hueco de la lista anterior o una pregunta abierta del final de cada documento.
2. Reusar la consigna del tema más cercano (abajo), cambiando el tema y el archivo de salida.
3. Mantener el mismo formato de hallazgo (afirmación, fuerza, URLs, implicación) para que los documentos se puedan comparar.
4. Para fuentes bloqueadas, probar la API REST de Europe PMC (`EXT_ID:<PMID>` o `DOI:<doi>`), `api.crossref.org/works/<DOI>` o la API de Semantic Scholar.
5. Agregar el documento a la tabla de arriba y anotar en «Límites conocidos» lo que no se pudo verificar.

## Consignas usadas

Las consignas se escribieron en inglés. Se reproducen tal cual, salvo la descripción de los usuarios del contexto común, que se generalizó.

Contexto común a las cuatro (con variaciones mínimas según el tema):

> "Tareas Hogar" is a personal PWA for household chores, designed for adults who are autistic (TEA), have ADHD (TDAH) and/or intellectual giftedness (AACC, "altas capacidades"), i.e. twice-exceptional / AuDHD, including people who share a home. The app today (v2) has: one-off tasks, periodic tasks (every N days/hours, or weekdays / days of month), time windows ("solo en un horario"), postpone, pause, labels, effort estimate (quick/medium/long, "Solo rápidas" filter), emoji and note per task, history of completions with undo, states pending / overdue / waiting with a progress bar, offline support. Each Google account has its own separate data (no sharing yet). We are planning v3 and need an evidence-based map of features.

### `tdah.md`

> Investigate what the evidence says helps adults with ADHD start, sustain and finish household tasks, and how that translates into app features. Cover at least: executive dysfunction, task initiation and the "wall of awful", time blindness and time perception, working memory and external memory aids, reminders and notification fatigue, implementation intentions, chunking and task decomposition, body doubling, dopamine/reward and gamification (evidence for and against, novelty decay), hyperfocus, rejection sensitivity and shame around unfinished tasks, interest-based nervous system. Prefer primary/high-trust sources: peer-reviewed studies, meta-analyses, clinical guidelines (NICE, CADDRA), recognized clinicians (Barkley, etc.). Clearly separate strong evidence from popular advice and from anecdotes.

Consigna adicional durante la investigación:

> Give task initiation and pre-task overwhelm the deepest section of tdah.md. Specifically, (1) check the dopamine framing critically: what the evidence actually supports (reward processing differences, delay aversion such as Sonuga-Barke's dual pathway, Volkow's work on dopamine pathways and motivation) versus pop-science simplification, and say plainly where "dopamine deficit" is an oversimplification; (2) cover interventions with evidence for lowering the activation threshold: making the first step tiny and concrete, implementation intentions, reducing perceived effort, tackling anticipatory overwhelm and choice paralysis, immediate versus delayed rewards, novelty, external structure, and body doubling; (3) for each one, give a concrete app mechanism and what to avoid.

### `tea.md`

> Investigate what the evidence and the autistic community say helps autistic adults with daily living and household tasks, and how that translates into app features. Cover at least: predictability and routines, transitions and unexpected changes, demand avoidance / PDA (pathological or persistent drive for autonomy) and how a task app can avoid feeling like pressure, autistic burnout and energy accounting (spoon theory, capacity tracking), interoception and alexithymia (noticing hunger, fatigue, overload), sensory load (visual noise, sounds, animations, notifications), literal and explicit instructions, visual supports and step-by-step task scripts, executive function differences specific to autism, inertia (hard to start AND hard to stop), information density preferences, customization and control. Prefer high-trust sources: peer-reviewed research, participatory/autistic-led research, recognized organizations (Autistica, NAS), and clearly mark community/lived-experience sources as such. [...] End with open questions and contradictions (especially where autism and ADHD needs pull in opposite directions, e.g. routine vs novelty).

### `aacc-2e.md`

> Investigate: what is known about gifted adults and 2e adults (gifted + autism and/or ADHD) in daily life; the masking effect (abilities hiding deficits and vice versa); boredom with repetitive, low-meaning tasks; perfectionism and all-or-nothing thinking; need for autonomy, understanding the "why", and systems they can tweak; intensity / overexcitabilities (Dabrowski, and the critiques of that model); asynchronous development; the AuDHD tension between craving routine and craving novelty; how to keep motivation for chores that never end. Also: what this means for an app's tone (not condescending, not childish, no infantilizing gamification). Prefer peer-reviewed research and recognized organizations (e.g. SENG, NAGC, Davidson Institute, academic 2e research); mark weaker sources clearly. Be honest where adult giftedness research is thin.

### `hogar-compartido-y-apps.md`

> A) Investigate division of household labor and mental/cognitive load in couples and flatmates (research on invisible labor, the "Fair Play" method, cognitive household labor studies), and specifically what is known or reported about neurodivergent couples or households (both partners ADHD and/or autistic): conflict triggers (forgotten tasks, nagging, uneven perception of who does what), communication styles, needs for explicit agreements, visibility of the other person's effort without surveillance or scorekeeping, handing off tasks, shared vs personal tasks.
> B) Review existing apps aimed at ADHD/autistic users or shared chores: for example Tiimo, Goblin Tools, Structured, Routinery, Llama Life, Finch, Sweepy, Tody, OurHome, Flatastic, Habitica. For each: key features, what users praise and complain about (app store reviews, Reddit communities such as r/ADHD, r/autism, r/AuDHD, r/adhdwomen), and the lesson for us. Look for recurring complaints like notification fatigue, guilt from streaks, setup burden, abandonment after novelty wears off.

Formato de salida pedido a todos: español neutro y profesional; un resumen breve; hallazgos con afirmación, fuerza de la evidencia, URLs e «implicación para la app» (incluido qué evitar); al final, preguntas abiertas y contradicciones. Ninguna afirmación sin una URL efectivamente leída.
