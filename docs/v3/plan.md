# v3 plan

Twelve ordered epics, in two stages. The first lowers the cost of **starting a task** for a person on their own; the second opens the shared home. It answers the request in `docs/v3/brief-fable.md` and reasons over the four documents in `docs/research/v3/`, not over the original sources.

Each epic is a block of value that the analyst role later splits into features. What is listed under "What it proposes" is material for that analysis, not a committed scope.

## How to read this plan

- **Citations.** `tdah`, `tea`, `aacc` and `hogar` stand for `tdah.md`, `tea.md`, `aacc-2e.md` and `hogar-compartido-y-apps.md`. The finding follows (`tdah §1.3A`, `aacc H5`, `hogar A4`) and, in parentheses, the strength that document gives it.
- **Hypotheses.** There are no studies on household tasks in gifted or 2e adults, nor on homes where both people are neurodivergent (`README.md`, «Límites conocidos» (translation: «Known limits»)). Strictly speaking, every epic is a hypothesis. The **Hypothesis** mark flags the most fragile ones: those resting on weak, anecdotal or extrapolated evidence.

## Rules for every epic

What the research asks to avoid is part of the design. These rules always apply and are not repeated in each epic:

1. **No streaks, points, levels, pets or rankings.** Streaks motivate until they break and then push toward abandonment (`hogar B1`, moderate); expected rewards lower intrinsic motivation (`aacc H6`, strong).
2. **No guilt.** No growing counter, no "failed" status, no red wall (`aacc H5`, strong; `tdah §2.7`, weak to moderate).
3. **The app changes nothing by itself.** Neither the order, nor a status, nor a mode changes without a visible rule or a gesture by the person (`tea §2`, moderate).
4. **Everything new is optional and starts calm.** No setup wizards, no sound, no mandatory animations (`tea §10` and `§11`, weak; `hogar B5`, anecdotal).
5. **Adult, literal and informative tone.** It describes facts; it does not give orders, does not over-congratulate and does not use clinical language (`aacc H6`, strong; `aacc H12`, moderate; `tea §9`, weak).
6. **What is needed to act is in the row; settings are in the panel** (`tdah §2.1`, anecdotal to moderate; `aacc H9`, weak).

## How each epic is validated

Annotations were removed from the project (they were not used and were ambiguous). Each epic is judged by what the person reports and by the data the feature already stores in the account.

- **When it is read.** Not before four weeks of use of each feature: the novelty effect drops around the fourth week (`tdah §1.3E` and `§2.5`, weak to moderate). Judging earlier measures enthusiasm, not usefulness.
- **How it is read.** Two people give no statistics: each comment is read. The same annoyance reported twice, or by both people, is enough to change or remove a feature.
- **Silence does not approve.** It is complemented with the data the feature already stores in the account (how many tasks have a first step, how many completions were the minimal version), read by hand and not sent anywhere.
- **What is decided.** Keep, change or remove. After each epic the order of the remaining ones is decided again.

## Decision on notifications

**No notifications with the app closed.** Without a server there are no push notifications, and we found no stable way to schedule a local notification from a PWA (Chrome's Notification Triggers API is listed as experimental in its documentation). The research does not defend them either: alarms «recuerdan, pero no ayudan a vencer la inercia» (translation: «remind, but do not help overcome inertia») (`tea §1`, moderate), notifications cost attention (`hogar B3`, moderate) and insistence feeds avoidance (`tea §5`, weak).

The external trigger is needed (`tea §1`; `tdah §2.3`, weak to moderate). It is solved in three ways:

1. **An everyday event instead of an alarm** (E8): event-based prospective memory holds up better than time-based (`tdah §2.3`).
2. **Discreet signals with the app open**, without sound (E7).
3. **The other person, when the one who needs it asks** (E12).

## Stage 1: starting

Precedent: the migration to SvelteKit 3 (`docs/v3/backlog.md`), already done on the `chore/sveltekit-3` branch, is integrated before E1.

### E1. «Me sirvió / me molestó» annotation (removed)

- **Status.** Removed: it was implemented and the person discarded it because it did not help and was ambiguous (feature `remove-annotations`, branch `v3`). The text below stays as a record.

- **Problem and persona.** All. The plan rests on inferences; without a cheap record of what works, it is evaluated from memory.
- **Evidence.** `aacc H1` (strong on the base being scarce); `aacc H12` (moderate: ADHD technology is designed without its users); `tea`, open question 7.
- **What it proposes.** A two-tap gesture, always in the same place: sense, context taken by itself (screen and, if there is one, task), date and an optional line of text. A screen to reread one's own notes and copy them as text.
- **Hypothesis and validation.** A gesture this short is used spontaneously enough to decide. Zero notes after four weeks means it is costly or hidden.
- **Avoid.** The app asking for an opinion: it is a repeated complaint about apps in this field (`hogar` Part B, Tiimo; anecdotal). Mood scales (`tea §6`, moderate). Sending anything outside the account. In stage 2, showing one person's notes to the other.
- **Depends on · Size · Risks.** The migration · S · Silence; it is offset with a periodic review outside the app, with the notes each person decides to share.

### E2. Guilt-free status and rules in view

- **Status.** Implemented (feature `guilt-free-status`): the text «Tocaba …» with date and distance instead of «Atrasada», without an alarm color.

- **Problem and persona.** ADHD, autism and giftedness. Before starting one has to look at the list, and today the row says «Atrasada» in a reddish color and puts first what has gone longest without being done (spec §6.1). That raises the emotional threshold for starting.
- **Evidence.** `aacc H6` (strong: controlling language increases guilt-based motivation); `aacc H5` (strong: perfectionism and procrastination); `tdah §1.2c` (moderate); `tea §2` (moderate); `tdah §2.2` (moderate, mixed results); `tea §5` and `§9` (weak).
- **What it proposes.** Word the delay as a dated fact («desde el martes 10» (translation: «since Tuesday the 10th»)), without an alarm color. Relative distance next to the exact date, also for the return of waiting tasks. A "why is it here" that can be checked per task. On completing, a brief informative closing with the next date.
- **Hypothesis and validation.** A list that describes without judging is opened with less resistance. Signal: what is reported, «me sirvió» (translation: «it helped me»), about the list. It is refuted if the neutral wording reads as vague.
- **Avoid.** Euphemisms that hide the data. Congratulations on completing. Changing the status rules: this epic only touches presentation.
- **Depends on · Size · Risks.** E1 · S to M · Many interface texts appear in scenarios and QA scripts.

### E3. First step in view

- **Status.** Implemented (features `first-step` and `one-step-at-a-time`): the optional "first step" field and steps one at a time. The row shows a single step, with «Paso anterior» and «Hecho» when there are two or more.

- **Problem and persona.** ADHD and autism. A task's title is abstract («Ropa» (translation: «Laundry»)); deciding where to start is part of the cost of starting.
- **Evidence.** `tdah §1.3A` (moderate and indirect: no trial isolates the first step); `tea §1` (moderate: not knowing the first step paralyzes); `tdah §1.2b` (weak: forming the plan fails, not remembering it); `tdah §2.1` (anecdotal to moderate).
- **What it proposes.** An optional "first step" field shown in the row. Optional steps for long tasks, shown one at a time.
- **Hypothesis and validation.** Seeing the first concrete move costs less than reading the title. Signal: what is reported about tasks with a first step, and the field is still being filled after four weeks. It is refuted if writing it costs more than it saves.
- **Avoid.** Showing the whole breakdown; requiring steps to create a task; treating a task with half-done steps as a failure. Too many parts also paralyze (`tea §1`).
- **Depends on · Size · Risks.** Nothing · M · The row gains density (E9 offsets it).

### E4. Minimal version

- **Status.** Closed. Implemented the optional "minimal version" field and «Hice la mínima» (feature `minimal-version`); the completion stays in the «Historial» as «Mínima». The "counts as done when…" field was discarded without implementing it (2026-11-22): the person does not have the problem of not knowing when a task ends.

- **Problem and persona.** Giftedness and autism, above all. All or nothing: if the whole task cannot be done, it is not started.
- **Evidence.** `aacc H5` (strong for the problem; partial credit as a remedy is an inference); `tdah §1.2a` (strong in the general population: aversion and low self-efficacy); `tea §4` (moderate); `tea §3`, `tea §9` and `hogar A4` (weak).
- **What it proposes.** An optional "minimal version" field («solo el inodoro» (translation: «just the toilet»)). Completing it counts as done and stays in the history as what it was. An optional "counts as done when…" field.
- **Hypothesis and validation.** Being allowed a small version makes starting more likely. Signal: what is reported, «me sirvió» (translation: «it helped me»), on completing a minimal one. It is refuted if marking it is felt as a defeat.
- **Avoid.** Presenting the minimal one as "partial" or with an indicator that goes down. The app suggesting it by itself.
- **Depends on · Size · Risks.** Nothing · M · It adds a datum to the completion and touches the completion rules (spec §4.4 and §5).

### E5. Choose for me

- **Status.** Discarded without implementing it (2026-11-22): the whole list only holds the person back when there are many tasks, and they did not think it was worth it. That case goes to E6. The text below stays as a record.

- **Problem and persona.** ADHD and autism. Faced with the whole list, choosing is another cost before starting.
- **Evidence.** `tdah §1.3C` (moderate, general population); `tea §1` and `§2` (moderate: the proposal has to be deterministic); `tea §8` (weak to moderate: one thing per screen); `aacc H10` (weak).
- **What it proposes.** A one-tap entry from «Pendientes» that shows a single task: the first in the visible order, its first step and the reason. Three ways out: do it, go to the next in the same order or go back to the list.
- **Hypothesis and validation.** Removing the decision unblocks more than showing everything. Signal: it is still used after four weeks. It is refuted if the first in the order is always the most dreaded.
- **Avoid.** Randomness. Opening the app in this mode without the person having chosen it. Asking for priorities per task.
- **Depends on · Size · Risks.** Pays off more after E3 and E4 · S to M · Ordering by age of delay may not be the best for getting started.

### E6. Low-capacity days and return without debt

- **Status.** Implemented in two features. `minimal-mode`: the "essential" mark and the minimal mode, turned on by hand from the ⋮ menu of «Pendientes»; it shows only the essential tasks and pauses the rest, and turning it off brings them back as if newly created. `block-reschedule`: «Reprogramar vencidas» in the same menu reschedules every overdue recurring task as if newly created, with a name-only preview and a 5-second «Deshacer»; overdue one-off tasks are left out and keep their «Tocaba».

- **Problem and persona.** Autism and ADHD. There are days, or weeks, when almost nothing is possible; on coming back, the accumulated list is the pre-start overwhelm at its worst.
- **Evidence.** `tea §4` (moderate for the phenomenon, weak for what helps); `hogar B2` (strong in general: abandonment is the norm and the return has to be designed); `aacc H5` (strong); `aacc H3` (moderate); `aacc H8` (weak). **Hypothesis** in the mechanism.
- **What it proposes.** An "essential" mark per task, set at a calm moment. A minimal mode turned on by hand that leaves only what is essential in view; the rest stays as paused, relying on the pause that already exists (spec §5.8). A block rescheduling, with a preview, to come back after an absence.
- **Hypothesis and validation.** Being able to shrink the house to the essentials without creating debt prevents abandonment. Signal: what is reported on entering and leaving the mode. It is refuted by a way out that is felt as debt.
- **Avoid.** The app turning the mode on or inferring the person's state; mood questions (`tea §6`); a summary of «lo acumulado» (translation: «what piled up») on leaving.
- **Depends on · Size · Risks.** Nothing · M to L · These are actions on many tasks at once: the preview and undo are part of the scope.

### E7. Start without commitment

- **Problem and persona.** ADHD and autism. Today a task is done or not; there is no "I started it". And once under way, it is hard to stop.
- **Evidence.** `tdah §1.3A` (moderate, indirect); `hogar A8` (moderate); `tdah §2.6` and `tea §1` (moderate: hyperfocus and help to stop); `tdah §2.2` (moderate, mixed); `tea §8` (weak to moderate).
- **What it proposes.** "Start" leaves the task in progress without forcing it to be finished; letting it go returns it to its status without a trace. A "doing now" view with one task, its current step and the elapsed time, computed from timestamps (`hogar` Part B, Routinery). An optional early close, visible with the app open.
- **Hypothesis and validation.** Committing only to starting lowers the threshold. Signal: tasks in progress get finished or let go without complaints. It is refuted if they stay in progress forever and weigh on the person.
- **Avoid.** A countdown with an alarm; recording interrupted sessions; abrupt interruptions (`tea §1`).
- **Depends on · Size · Risks.** E3 · L · It is the largest domain change of the stage: a new status crosses the rules of §5 and the order of §6.1. With the screen off, no signal arrives.

### E8. "When… then" plans

- **Problem and persona.** ADHD. What fails most is deciding when and how, and remembering by time.
- **Evidence.** `tdah §1.3B` (strong in the general population; weak in adults with ADHD, with much smaller corrected estimates); `tdah §2.3` (weak to moderate); `tdah §1.3F` and `tea §1` (moderate: routines reduce decisions). **Hypothesis.**
- **What it proposes.** An optional "moment" per task («después de cenar» (translation: «after dinner»)), worded as a plan. A view per moment with its tasks in a fixed order. It is the replacement for the alarm.
- **Hypothesis and validation.** Tying the task to a concrete event gets it started more than a time does. Signal: what is reported about the moment view. It is refuted if nobody opens the app at that moment.
- **Avoid.** Abstract plans ("this week"); an unfulfilled plan leaving a status; duplicating the schedules that already exist.
- **Depends on · Size · Risks.** Nothing · M · It overlaps with schedules; the analysis decides whether it is built on them. It moves up in the order if «me olvido de abrir la app» (translation: «I forget to open the app») is reported.

### E9. Sensory settings and density

- **Problem and persona.** Autism. Tolerance to stimuli varies between people and between days.
- **Evidence.** `tea §10` and `§11` (weak); `aacc H7` (moderate to strong against a generic "intensity": what helps is per-person adjustment). **Hypothesis.**
- **What it proposes.** Independent controls: animations (besides respecting the system preference), full or muted status color, emoji shown or not, and two row densities.
- **Hypothesis and validation.** The earlier epics load the row; being able to lighten it sustains use on bad days. Signal: the settings are changed and stay. It is refuted if nobody touches them.
- **Avoid.** Turning the settings into a step before use; adding sound.
- **Depends on · Size · Risks.** E2 to E7 · S to M · Each switch multiplies the states QA has to cover. It moves forward if complaints about density appear.

## Stage 2: shared home

### E10. Home and household tasks

- **Problem and persona.** Shared home. The invisible load is in anticipating and monitoring, not in doing; if one person assigns and reminds the other, the app becomes a channel for reproach.
- **Evidence.** `hogar A1` (moderate); `A2` (moderate to strong: perceived fairness weighs); `A3` (moderate); `A10` and `A4` (weak); `B5` and `B6` (anecdotal).
- **What it proposes.** Two accounts form a home. Three kinds of task: personal (invisible to the other person), household with an end-to-end owner, and shared household («la toma quien pueda» (translation: «whoever can takes it»)). The same editing ability for both people. It starts with one task, moving personal ones over one at a time.
- **Hypothesis and validation.** A common pool with explicit owners spreads the anticipation without creating a manager. Signal: both people create and complete household tasks, and nobody reports something that describes monitoring.
- **Avoid.** Administrator roles; one person assigning to the other; a full mandatory split before using it.
- **Depends on · Size · Risks.** E2 · L · The highest risk of the plan: security rules (who reads what), a change of the stored data model and two-person editing offline. It lifts the «Uso compartido» (translation: «Shared use») exclusion of spec §2.

### E11. Agreements and changes in view

- **Problem and persona.** Shared home, with weight on autism. Implicit agreements and silent changes create conflict.
- **Evidence.** `hogar A7` (moderate); `A2` (moderate to strong); `A6` (moderate to weak); `A4` and `tea §9` (weak).
- **What it proposes.** An agreed "counts as done when…" in household tasks. Changes to a household task stay visible to both people, with who changed what. A household history that shows the work of both, without totals.
- **Hypothesis and validation.** Seeing the work and the agreements adjusts perception without turning it into a scoreboard. Signal: what is reported, «me sirvió» (translation: «it helped me»), about the household history. It is refuted by the first comment that talks about feeling measured.
- **Avoid.** Percentages and counts per person; alarm color next to a name; notifications for each action of the other (`hogar B3`); showing one person what the other did not do (`tdah §2.7`).
- **Depends on · Size · Risks.** E10 · M · The evidence does not say where visibility ends and keeping score begins (`hogar`, question 3).

### E12. Ask for a hand and do it together

- **Problem and persona.** Shared home. Inertia sometimes only gives way to an external stimulus, and asking for it does not have to be a reproach or an order.
- **Evidence.** `hogar A8` and `tea §1` (moderate: the "body double"); `hogar A9` and `tdah §1.3G` (weak: no controlled trials and a published null result); `hogar A5` (moderate). **Hypothesis**, treated as a cheap experiment.
- **What it proposes.** A hand-off («¿puedes tomar esta?» (translation: «can you take this one?»)) that the other person accepts or declines without giving reasons. Seeing that the other person started something and joining with a task of one's own.
- **Hypothesis and validation.** The external stimulus helps when the one who needs it asks for it. Signal: hand-offs are used and accepted. It is refuted by a single comment that describes pressure or monitoring.
- **Avoid.** A button to remind the other person of something; invitations the app generates by itself; comparisons.
- **Depends on · Size · Risks.** E10 and E7 · M · Without notifications, a request is seen only when the other person opens the app.

## Order and reasons

| # | Epic | Size | Support |
|---|---|---|---|
| E1 | Annotation (removed) | S | Discarded by use |
| E2 | Guilt-free status and rules in view | S to M | Strong to moderate |
| E3 | First step in view | M | Moderate, indirect |
| E4 | Minimal version (closed) | M | Strong for the problem, inferred for the remedy |
| E5 | Choose for me (discarded) | S to M | Moderate |
| E6 | Low capacity and return without debt (implemented) | M to L | Moderate; hypothesis in the mechanism |
| E7 | Start without commitment | L | Moderate, indirect |
| E8 | "When… then" plans | M | Hypothesis |
| E9 | Sensory settings and density | S to M | Hypothesis |
| E10 | Home and household tasks | L | Moderate |
| E11 | Agreements and changes in view | M | Moderate |
| E12 | Ask for a hand and do it together | M | Hypothesis |

1. **E1 removed**: it did not help; epics are judged by what is reported and by the stored data.
2. **E2 second**: it is cheap, has the best support in the plan, touches no domain rules and sets the wording the following epics use.
3. **E3 to E5** are the core of "starting": what to do first, how much is enough and which one to choose. They go from the most direct to the one that pays off most with the earlier ones already done.
4. **E6 before E7**: it reuses the existing pause and attacks the worst case of pre-start overwhelm. E7 is the riskiest domain change of the stage and, besides, enables E12.
5. **E8 and E9 at the end of the stage**, for being the weakest in evidence. Both have a written condition for moving forward.
6. **Between stages, a reading pause**: what was reported is reviewed and stage 2 is adjusted before starting it.
7. **E10 to E12** follow their dependencies: first the home, then what is seen and finally what is asked.

Each epic pays off from its first feature: a single field or a single view already helps in production.

## What stays out of v3

| Idea | Reason |
|---|---|
| Notifications with the app closed | No server; see "Decision on notifications". |
| Streaks, points, levels, pets, rankings | Rule 1. |
| Energy budget ("spoons") and status logs | Community evidence (`tea §7`) and a risk with alexithymia (`tea §6`). The minimal mode of E6 covers the need with a single switch. |
| Novelty: challenges, races against the clock, themes | Weak and it wears off (`tdah §1.3E`); it clashes with predictability (`tea §2`). |
| AI task breakdown | Anecdotal (`hogar` Part B); it requires an external service and taking data out of the account. Steps are written by hand (E3). |
| Photos per step (`tea §9`) | Cloud Storage for Firebase requires the Blaze plan. |
| Timeline or visual calendar | Anecdotal (`hogar` Part B). Waiting tasks with an exact date (E2) cover anticipation. |
| Comparing estimated and actual time (`tdah §2.2`) | It needs the data of E7; it is evaluated afterwards. |
| Pairing a task with something pleasant (`tdah §1.3D`); self-care templates by time (`tea §6`) | Already possible: the note, the emoji and the hourly recurrence exist. |
| Automatic task rotation | Anecdotal; first the fixed agreement (E10). |
| Home indicator ("up to date on 8 of 10") | Anecdotal (`hogar B4`); it can turn into a score. |
| Accumulated effort per person | It is keeping score (`hogar A2`, `aacc H3`). |
| Data export | Each installation owns its Firebase project. |

## Conflicts between findings

1. **Routine against novelty.** Predictability has moderate support (`tea §2`); novelty, weak support that wears off (`tdah §1.3E`); the tension itself only appears in accounts (`aacc H10`). The fixed structure wins. Only what the person chooses varies (emoji, name) and a deterministic "go to the next" (E5).
2. **Immediate reward against rewards that harm motivation.** `tdah §1.3D` (moderate) asks for something immediate, `aacc H6` (strong) rules out the tangible reward and `tea §10` asks for calm. Resolution: an informative, brief closing without sound (E2). It reports what was achieved; it does not reward.
3. **An external trigger is needed, but notifications repel.** `tea §1` and `tdah §2.3` against `tea §5` and `hogar B3`. Resolution in "Decision on notifications".
4. **Exact date against relative distance.** `tea §9` asks for literalness and `tdah §2.2` asks for distance. Both are shown.
5. **Breaking down helps, but too many parts paralyze** (`tdah §1.3A`, `tea §1`). Optional steps, one at a time, never mandatory (E3).
6. **Autonomy against structure.** `aacc H6` and `tea §5` ask for control, but a blank screen does not help (`aacc`, question 1). Strong defaults; every new field is optional.
7. **Making the work visible against not keeping score.** `hogar A2` against `A6` and `aacc H3`. Household facts are shown, never per-person aggregates (E11).
8. **Visible changes against friction.** `hogar A7` against the cost of confirming for the ADHD profile (`hogar`, question 4). The change is seen, but it does not ask for confirmation.

## Questions only the users can answer

1. Which trigger really gets things started: the first step in view, a moment of the day or the other person? (`tea`, question 2)
2. Are notifications with the app closed missed?
3. Which wording of the delay feels neutral without being vague?
4. Does the minimal version restart the full cycle of a recurring task, or should the task come back sooner?
5. Are there recurring tasks that should never appear as overdue, only as available? (`tea`, question 3)
6. Should "Choose for me" start with the oldest or with the shortest?
7. What is essential on a bad day? Is the minimal mode only turned on by hand, or can the app offer it on coming back from an absence?
8. On completing, something or nothing?
9. In the home, are personal tasks fully invisible, or is a "busy with N things" shown? (`hogar`, question 1)
10. Who sees a household task as overdue: its owner or both people? (`hogar`, question 2)
11. A fixed owner by agreement or rotation? (`hogar`, question 5)
12. Does doing things together help or does it feel like monitoring? (`tdah`, question 5)
