# Tareas Hogar v2 — Specification

Status: draft v1 · 2026-10-26

## 1. Purpose

A personal household task list designed for people with ADHD. It solves two problems, in this order:

1. **Recurring tasks must not be forgotten** ("when did I last clean the bathroom?").
2. **Lower the visual load**: the list shows first what has to be done now, without noise.

A single user, who uses it from the phone (in the moment, around the house) and from the computer (Linux).

## 2. MVP scope

**Includes**

- One-off and recurring tasks (relative mode and calendar mode).
- History of everything completed, with undo.
- Offline operation and sync between devices.
- Google sign-in.
- Font and emoji bundled with the app (§6).
- Loading screen when the app starts (§6.6).
- Update screen when there is a new version, and the version information (§6.8).

**Does not include**

- Notifications or reminders.
- Shared or multi-user use.
- Subcategories or hierarchical sections.
- Manual order (dragging).
- Statistics or streaks.
- Native apps (PWA only).

## 3. Glossary

| Term | Meaning |
|---|---|
| **One-off task** | Done a single time. Once completed it leaves the list and stays in the history. |
| **Recurring task** | Becomes pending again according to its recurrence. |
| **Relative mode** | Recurrence "every N hours" or "every N days", counted from the last completion. |
| **Calendar mode** | Recurrence anchored to dates: days of the week or days of the month. |
| **Occurrence** | In calendar mode, each day on which the task "is due" (e.g. every Tuesday). |
| **Completion** | Immutable record that a task was done, with date and time. |
| **Status** | `pending`, `overdue` or `waiting`. It is computed; never stored. |

## 4. Domain model

### 4.1 Task

| Field | Type | Required | Notes |
|---|---|---|---|
| `id` | string | yes | |
| `titulo` | string | yes | Not empty. |
| `emoji` | string | no | A single emoji (see below). |
| `nota` | string | no | Free text (see below). |
| `primerPaso` | string | no | One line with the first concrete move (see below). Any kind of task. |
| `pasos` | string[] | no | Steps 2 onward, in order (see **Steps**, below). Any kind of task. |
| `pasoActual` | integer ≥ 1 | no | Number of the step the task is on (see **Steps**). Without the field, it is on step 1. |
| `versionMinima` | string | no | One line with the small version of the task (see **Minimal version**, below). Any kind of task. |
| `tipo` | `puntual` \| `periodica` | yes | |
| `fechaLimite` | date (no time) | no | One-off tasks only. |
| `recurrencia` | see 4.2 | if recurring | |
| `horario` | `{ desde: "HH:MM", hasta: "HH:MM" }` or a list of such windows | no | Daily windows in which the task can be completed (§5.5). Any kind of task, with one or more windows (§5.6, §5.7). |
| `creadaEn` | timestamp | yes | |
| `pausada` | boolean | no | Recurring only (§5.8). Without the field, it is not paused. |
| `reanudadaEn` | timestamp | no | Last time it was resumed (§5.8). |
| `pospuesta` | `{ desde: timestamp, hasta: timestamp }` | no | Postpone (§5.9). |
| `essential` | boolean | no | Essential task (see **Essential**, below). Any kind of task. Without the field, it is not essential. |

**Schedule**: `desde` and `hasta` are local times in 24 h format, with `desde` < `hasta` (the window does not cross midnight). The window of a day is [`desde`, `hasta`): the task can be completed from `desde` inclusive until `hasta` exclusive. Without the field, the task can be completed at any hour. A schedule with only one of the two times, or with `desde` ≥ `hasta`, is invalid and rejects the whole creation or edit.

**Several schedules** (§5.6, §5.7): any task can have **one or more windows**, sorted by `desde` and not overlapping (two windows overlap if one starts before the other ends; one starting exactly when the other ends, e.g. 08:00–10:00 and 10:00–12:00, is valid). A relative task with more than one window must have its interval in days. Overlapping windows, or more than one window in a relative task in hours, are invalid and reject the whole creation or edit. A document saved with a single window (the previous format) is read as a list of one.

**Emoji**: a single emoji, that is, a single emoji grapheme: a ZWJ sequence (👨‍👩‍👧), one with a skin tone (👍🏽), one with a variation selector (❤️) or a flag (🇦🇷) counts as one. Empty text or only spaces means **no emoji** (the field is not saved). Two or more emojis, or any text that is not exactly one emoji (letters, numbers, an emoji with text), is invalid: the creation or edit is rejected entirely, just like an empty title. The UI cannot produce an invalid value (the emoji is chosen from a picker, §6.2), but the data rule is kept in the core as validation on save: an invalid value that arrives some other way (for example a document with invalid data) is rejected all the same.

**Note**: free text with no maximum length. On save, spaces and line breaks at the start and at the end are trimmed; inner line breaks are kept. Empty or only spaces means **no note** (the field is not saved). A note is never invalid.

**First step**: a single line, with no line breaks and no maximum length. On save, spaces at the start and at the end are trimmed. Empty or only spaces means **no first step** (the field is not saved). A first step is never invalid: it never rejects the creation or the edit. The first step is step 1 of the **Steps** list (below). In a one-step task it has no state: completing the task, postponing it, pausing it, resuming it, undoing and changing the kind or the mode do not erase it or change it, and a recurring task that comes back shows the same first step. In a one-step task there is no way to mark it as done and no progress indicator; in a task of two steps or more there is (see **Steps**). A task saved without the field has no first step (there is no migration). It does not change the status (§5) or the order of the list, and the task name (below) is still emoji and title. It is not shown in the **Historial** or in the undo notice.

**Steps**: a task can have, besides the first step, more steps, optional and for any kind of task. The first step is step 1 and `pasos` stores steps 2, 3… in the written order; a task saved without `pasos` has no more steps (there is no migration). A task has **a single step** if it has a first step and no `pasos`, and **two steps or more** if it has a first step and at least one step in `pasos`.
- **Text**: each step follows the first step rule: a single line, with no line breaks and no maximum length, spaces at the start and at the end are trimmed on save, and an empty step or one with only spaces is discarded on save, without error. The steps below move up: if the first step is left empty and step 2 is not, step 2 becomes the first step. A step is never invalid and never rejects the creation or the edit, and there is no maximum number of steps.
- **Progress**: `pasoActual` is the number of the step the task is on. «Hecho» (§6.1) takes it to the next step and «Paso anterior» (§6.1) to the previous one; neither goes past the first or the last. Editing the steps does not change that number: if fewer steps remain than `pasoActual`, the task is on the last one; if a single step remains, it is a one-step task. The app does not change the progress by itself.
- **Complete**: tapping «Hecho» on the last step of a task of two steps or more does exactly what tapping the checkbox of that uncompleted task does (it adds the same completion, opens the same notice of §5.4 and, if the checkbox is disabled by its window, §5.5, the «Hecho» of the last step is also disabled; that of the other steps is not). Completing the task, by the checkbox, by «Hecho» or by «Hice la mínima» (on any step, §6.1), returns `pasoActual` to step 1, so a recurring task that comes back starts from the beginning. The completion stores in `pasoAlCompletar` the number of the step the task was on, also when it was completed with «Hice la mínima».
- **Undo**: deleting the most recent completion of the task (notice, **Historial** or checkbox, §5.4) returns `pasoActual` to the value of its `pasoAlCompletar`, capped at the last step; for a task completed with «Hecho» on the last step, it stays on the last step; for one completed with «Hice la mínima», it returns to the step it was on. There is no undo notice for «Hecho» on a step that is not the last: it is corrected with «Paso anterior».
- **No other effects**: postponing, removing the postponement, pausing, resuming and changing the kind or the mode do not erase or change the steps or `pasoActual`. The steps and their progress do not change the status (§5) or the order of the list, and are not shown in the **Historial** or in the undo notice (the word «Mínima» of the **Historial** and of the notice, §6.3 and §5.4, does not show steps). The row never shows the whole list (§6.1).

**Minimal version**: a single line, with no line breaks and no maximum length, for any kind of task («Solo el inodoro»). On save, spaces at the start and at the end are trimmed. Empty or only spaces means **no minimal version** (the field is not saved). A minimal version is never invalid: it never rejects the creation or the edit. A task saved without the field has no minimal version (there is no migration). Doing it («Hice la mínima», §6.1) completes the task: it is a completion like any other, which also stores `fueMinima` (§4.4). The minimal version does not change the status (§5) or the order of the list, and the task name (below) is still emoji and title. The app does not suggest it or count it: it is offered the same way whenever it applies (§6.1), regardless of how overdue the task is or how many times it was done. The **Historial** and the undo notice only show the word «Mínima», never its text. Editing or emptying the minimal version does not touch the completions that were already the minimal one.

**Essential**: any task, one-off or recurring in any mode, can be marked essential (`essential` = `true`). It is the mark that the minimal mode (§5.8) uses to decide which tasks stay in view. A task saved without the field is not essential (there is no migration); unchecking the mark removes the field. A new task starts not essential with the minimal mode off and essential with it on (§6.2). The mark is never invalid. It does not change the status (§5) or the order of the list, and it does not change when the task is completed, postponed, paused, resumed or changes kind or mode.

**How a task is shown**: with an emoji, «emoji título» (one space between the two); without an emoji, only the title, with no gap. It is the name used by the row in **Pendientes**, the **Historial** and the undo notice.

### 4.2 Recurrence (recurring tasks only)

Exactly one of these three forms:

- **Relative**: `{ modo: "relativo", cada: N, unidad: "horas" | "dias" }`, with N an integer ≥ 1.
- **Weekly**: `{ modo: "calendario", diasSemana: [lun..dom] }`, with at least one day.
- **Monthly**: `{ modo: "calendario", diasMes: [1..31] }`, with at least one day. A day that does not exist in a month (e.g. 31 in April) falls on the **last day of that month**.

A calendar recurrence is weekly **or** monthly; they are not combined.

### 4.3 (removed)

This section no longer exists; the numbering of the others is not shifted so that references do not break.

### 4.4 Completion

| Field | Type | Notes |
|---|---|---|
| `id` | string | Unique per device, generated on the client. |
| `tareaId` | id | |
| `completadoEn` | timestamp | |
| `pasoAlCompletar` | integer ≥ 1 | no | Step the task was on when it was completed (**Steps**, §4.1). Only in tasks of two steps or more. |
| `fueMinima` | boolean | no | `true` if the completion was «Hice la mínima» (**Minimal version**, §4.1). Without the field, the completion was the whole task (there is no migration). It is set on completion. |
| `ocurrenciaCubierta` | date (`2026-07-14`), or date and time (`2026-07-14T07:00`): different formats, so that a window that starts at 00:00 is not confused with a date | In calendar mode (5.3, 5.6) and in relative tasks with several windows (5.7). Without a schedule, a day at 00:00; with a schedule, the day at the `desde` time of the window it covers. |

Completions are **append-only**: they are never modified. The only destructive operation is deleting one explicitly (undo). That a completion was the minimal one (`fueMinima`) is set on completion and not changed afterwards: a whole completion cannot be turned into a minimal one or the other way around; it is corrected by undoing and completing again. A completion of the minimal version counts like any other for the status and list rules (§5, §6.1, §6.2).

### 4.5 (removed)

This section no longer exists; the numbering of the others is not shifted so that references do not break.

## 5. Status rules

All dates and times are in the **local time zone of the device**. The day starts at **00:00**.

The status of each task is **derived** from its definition and its completions. A "completed" flag is never stored.

### 5.1 One-off task

| Situation | Status |
|---|---|
| Has at least one completion | Completed: it leaves the list and is shown in the history. It is never shown in **Pendientes**, with **Mostrar completadas** (§6.1) on or off. |
| No completion, no due date | `pending` |
| No completion, today ≤ `fechaLimite` | `pending` |
| No completion, today > `fechaLimite` | `overdue` |

Undoing its completion (deleting it) returns it to the list with the status that applies.

### 5.2 Recurring task in relative mode

Let `U` be the most recent `completadoEn` and `V = U + interval` (the due time).

| Situation | Status |
|---|---|
| Never completed | `pending` |
| now < `U` (clocks out of sync) | `waiting`; progress = 0 |
| `U` ≤ now < `V` | `waiting`; progress = (now − U) / interval |
| `V` ≤ now < `V + interval` | `pending` |
| now ≥ `V + interval` (a whole cycle was missed) | `overdue` |

`U` can end up after now when the clocks of two devices are out of sync and a completion "from the future" is synced. In that case the task stays `waiting` with progress 0 until now reaches `U`.

Completing it at any moment, even while waiting, restarts the interval from that moment.

### 5.3 Recurring task in calendar mode

Let `P` be the **last covered occurrence**: the greatest `ocurrenciaCubierta` among its completions. If it was never completed, `P` = the day before `creadaEn`. Thus, a newly created task stays `waiting` until its first occurrence, or `pending` if it is created on an occurrence day.

A completion without `ocurrenciaCubierta` (made when the task was relative or one-off, before it was changed to calendar) contributes to `P` the **day of its `completadoEn`**. In general, `P` = the greatest among the `ocurrenciaCubierta` values and the days of `completadoEn` of the completions without `ocurrenciaCubierta`; without completions, the day before `creadaEn`.

Let `N` be the first occurrence after `P`.

| Situation | Status |
|---|---|
| today < `N` | `waiting`; progress = (now − wait start) / (start of `N` − wait start) |
| today = `N` | `pending` |
| today > `N` | `overdue` (a single instance; missed occurrences do not accumulate) |

The "wait start" is the most recent `completadoEn` or, if there is none, `creadaEn`.

If the wait start is a `completadoEn` later than now (clocks out of sync between devices: a completion "from the future" was synced), the task stays `waiting` with progress 0 until now reaches that completion. When it was saved, that completion left `P` at the last occurrence of its own day or earlier, or at a later one; so `N` ends up after its day and, therefore, today < `N`.

**Which occurrence a new completion covers** (computed and stored on completion):

- If there are uncovered occurrences in the interval (`P`, today], it covers **the most recent** of them. The earlier ones are discarded.
- If there is none, it covers **`N`, the first occurrence after `P`** (the next one not yet covered): completing ahead of time counts as the next one, and each extra completion advances one occurrence.

Examples with "Tuesday and Thursday":

| I complete on… | Covers | Becomes pending again |
|---|---|---|
| Tuesday | Tuesday | Thursday |
| Monday (ahead of time) | Tuesday | Thursday |
| Wednesday (Tuesday overdue) | Tuesday | Thursday |
| Friday (Tuesday and Thursday were missed) | Thursday | next Tuesday |
| Monday, again on Monday | Thursday (the first one covered Tuesday) | next Tuesday |

Changing the recurrence of a task does not delete its completions. The status is recomputed with the new rule, using the stored `P` (even if `P` is no longer an occurrence of the new rule, `N` is the first occurrence of the new rule after `P`).

### 5.4 Undo

- When a task is completed a **notice** appears that names the task (emoji and title, §4.1: `Completaste «🌱 Regar»`, or `Completaste «Regar»` without emoji) and has **Deshacer**. If the completion was the minimal one (`fueMinima`, §4.4), the text adds « · mínima»: `Completaste «🌱 Regar» · mínima`; the rest of the notice does not change. It lasts **5 seconds**: it is shown while `completadoEn` ≤ now < `completadoEn` + 5 s; after that it disappears by itself.
- If the completed task comes back (recurring), below «Completaste …» the notice says when: «Vuelve el jueves 19 · en 6 días», with the return instant computed after the completion and the format of **Date and distance** (§6.1), the same text its `waiting` row will show. A one-off task (which does not come back) shows only «Completaste …». There is no other closing and no congratulations.
- There is only one notice at a time: completing another task (or the same one) with the notice open **replaces** it with the one for the new completion. The previous completion is left without a notice and can be deleted from the **Historial**.
- The notice «Hay una versión nueva» (§6.8) is not part of this single slot: it has its own place above this notice and never replaces it nor is replaced by it.
- The update screen (§6.8) can appear on coming back from the background while this notice (or «Tareas reprogramadas») is open: that does not close it nor stop its 5 seconds, so after «Continuar sin actualizar» within those 5 seconds it is shown again. If the app restarts instead, the notice is closed: the completion stays and can be deleted from the **Historial**, like one left without a notice by another (above).
- The notice of a block rescheduling (§5.11) is «Tareas reprogramadas», with **Deshacer**, and shares this single slot: it lasts **5 seconds** from the moment of confirming (shown while confirmation ≤ now < confirmation + 5 s), and either notice replaces the other. The replaced one loses its **Deshacer**: completing a task within those 5 seconds replaces the rescheduling notice and the rescheduling can no longer be undone from the notice. The same notice stays visible when changing screens, until it expires. **Deshacer** in it undoes the rescheduling (§5.11) and closes the notice.
- **Deshacer** in the notice deletes the completion that the notice names (only that one) and closes the notice.
- The notice stays visible when changing screens, until it expires: opening the **Historial** (§6, **Navigation**) or tapping «Volver» does not close it nor stop its 5 seconds. It sits at the bottom edge of the screen, without covering the last row or entry.
- From the **Historial** any completion can be deleted (§6.3), not only the most recent one.
- In all cases the completion is deleted and the status of the task is recomputed according to the rules above with the completions that remain: `U` becomes the most recent `completadoEn` that remains and `P` the greatest occurrence that remains (§5.2, §5.3); without completions, the task returns to "never completed". A new completion after undoing covers the occurrence that corresponds to that recomputed `P`.
- A completion of the minimal version is deleted like any other (notice, **Historial** or, for a recurring task, the checkbox of the completed task) and the status is recomputed with those that remain. The checkbox of a completed recurring task deletes the most recent completion, whether whole or minimal; that of a recurring task completed on an earlier day completes it again, as a whole.
- If the deleted completion is the most recent one of a task of two steps or more, `pasoActual` returns to the `pasoAlCompletar` of that completion (§4.1, **Steps**).
- Deleting a completion that no longer exists (another device already deleted it, or deleted its task) does nothing: it does not change any other completion or revive the task.

### 5.5 Schedule

A task with `horario` (§4.1) can only be completed **inside the window** of some day. The rules of §5.1–§5.3 apply the same and the schedule only shifts the moments at which the task becomes `pending` and `overdue`:

- Let `T` be the instant at which the task would become `pending` without a schedule: one-off, `creadaEn`; relative, `V` (never completed, `creadaEn`); calendar, 00:00 of `N`.
- Let `A` (**available**) be the first instant ≥ `T` that falls inside a window: `T` itself if it is inside the window of its day; if not, the `desde` of the next window. Let `C` (**close**) be the `hasta` of that window.

| Situation (with schedule) | Status |
|---|---|
| now < `A` and now < overdue time | `waiting`; progress = (now − wait start) / (`A` − wait start), with the wait start of §5.2/§5.3 (one-off: `creadaEn`) |
| `A` ≤ now < `C` | `pending` |
| now ≥ `C`, recurring | `overdue` (also if the overdue time without a schedule of §5.2 would arrive earlier: the first of the two applies) |
| now ≥ `C`, one-off without due date | outside a window, `waiting` until the `desde` of the next one (progress from the `hasta` of the previous one); inside, `pending`. Never `overdue`. |
| now ≥ `C`, one-off with due date | like the one-off without due date until the `hasta` of the window of the day `fechaLimite`; from then on, `overdue` |

- **Overdue time**: the first between `C` and the overdue time without a schedule (relative: `V + interval`; one-off with due date: the `hasta` of the window of the day `fechaLimite`). It wins over everything else, also before `A`: a task whose overdue time has already passed is `overdue` even if its window has not opened yet (with the checkbox disabled until it opens).
- Once `overdue`, it stays `overdue` also outside the windows, but it can only be completed inside one.
- A recurring task `waiting` because of its schedule that has completions is completed (§6.1): with **Mostrar completadas** off it appears only when the window opens.
- **Completing** outside the window is not possible: the checkbox that would complete is disabled (§6.1), and so is «Hice la mínima» (§6.1). Deleting a completion (checkbox of a completed recurring task, notice, **Historial**) is possible at any hour.
- The completion is governed by §5.2/§5.3 as always (in calendar mode, the occurrence it covers is computed the same way).
- The order of §6.1 uses `C` as the start of `overdue` (or the overdue time without a schedule, if it is earlier), `A` as the start of `pending` of a recurring task (a `pending` one-off task keeps the key of §6.1: `fechaLimite`, or at the end by `creadaEn`) and `A` as the moment at which a `waiting` task comes back.

### 5.6 Several schedules (calendar)

In a calendar task with a schedule, an **occurrence** is a pair (occurrence day, window): with "every day" and windows 07:00–10:00 and 18:00–21:00, each day has two occurrences. Each occurrence is identified by its **start**: the day at the `desde` time of its window. With a single window, each occurrence day has a single occurrence, so everything stays the same as in §5.5.

The rules of §5.3 and §5.5 apply over occurrences instead of days:

- `P` is the greatest `ocurrenciaCubierta`. Only an `ocurrenciaCubierta` with a time is an instant (the start it covered). Values without a time **cover the whole day** and leave `P` at the end of their day: an `ocurrenciaCubierta` stored only as a date (without a schedule, or from before this feature), the day of the `completadoEn` of a completion without `ocurrenciaCubierta` and, without completions, the day before `creadaEn`. Thus, with a single window §5.3 and §5.5 hold as they are.
- `N` is the first occurrence with a start after `P`. For §5.5: `A` = start of `N` and `C` = the `hasta` of its window that day.
- Statuses: now < `A`, `waiting` (progress toward `A`); `A` ≤ now < `C`, `pending`; now ≥ `C`, `overdue` (a single instance; missed occurrences do not accumulate).
- **Which occurrence a new completion covers**: if there are uncovered occurrences with a start in (`P`, now], the **most recent** one (the earlier ones are discarded); if not, `N`.
- Example (every day, 07:00–10:00 and 18:00–21:00): I complete at 08:00 → it covers the 07:00 one and stays `waiting` until 18:00. If I do not complete in the morning, at 10:00 it becomes `overdue` (checkbox disabled until 18:00); at 18:00 I complete → it covers the 18:00 one, the morning one is discarded, and it stays `waiting` until 07:00 of the next day.
- Changing the schedules does not delete completions: the status is recomputed with the new windows and the stored `P`. Exception to "with a single window nothing changes": since `P` with a time is an instant, moving a window later the same day can reopen the occurrence already done (I complete at 08:30 with 08:00–11:00, I change to 09:00–12:00: at 09:00 it is `pending` again), just like when changing the recurrence (§5.3).

### 5.7 Several schedules in one-off and relative tasks

**One-off**: it is completed a single time, in any of its windows. §5.5 applies taking as windows all those of the day: `A` is the first instant ≥ `creadaEn` inside some window and `C` the `hasta` of that window; between windows, `waiting` until the `desde` of the next one. With a due date, the overdue time is the `hasta` of the **last** window of the day `fechaLimite`.

**Relative with several windows** (interval in days): it has to be completed **once per window** on the days it is due. Each window of those days is an occurrence, identified by its start, and the rules of §5.6 apply (`P`, `N`, `A`, `C`, statuses, which occurrence a completion covers) with this sequence of occurrences:

- Never completed: all the windows of all the days, starting from the first one whose `hasta` is after `creadaEn`.
- With `P`: first the windows of the day of `P` after `P` (the round of the day continues); then, all the windows of the day of `P` + `cada` days; and so on every `cada` days.
- If it is `overdue` (`N` was missed), a completion covers the window with the most recent start ≤ now, of any day, and the sequence continues from there.
- The overdue time without a schedule of §5.2 (`V + interval`) does not apply: the overdue time is `C`.
- Example (every 2 days, 07:00–10:00 and 18:00–21:00): on Monday I complete at 08:00 (it covers Monday 07:00) and at 19:00 (it covers Monday 18:00); it stays `waiting` until Wednesday at 07:00.

With a single window, the relative task follows §5.2 and §5.5 unchanged.

### 5.8 Pause

Only **recurring** tasks can be paused. A task can be paused in two independent ways: **by hand** (`pausada`, with **Pausar**) and **by the minimal mode** (below). In the rest of the spec, «paused» without more words means paused by either cause.

- **Paused**: it has no status (it is not `pending`, `overdue` or `waiting`), it does not become overdue and it is not completed (§6.1). It does not appear in **Pendientes** except with **Mostrar pausadas** (§6.1). Its checkbox is disabled.
- **Resume** (**Reanudar**) stores `reanudadaEn` = now and removes `pausada`. From then on the task is evaluated **as newly created at `reanudadaEn`**: with `creadaEn` = `reanudadaEn` and without the completions with `completadoEn` before `reanudadaEn` (which stay in the **Historial** and in "Última vez"). Thus:
  - Relative: it is `pending` on resume (never completed, §5.2).
  - Calendar: `pending` if today is an occurrence day; if not, `waiting` until the next one (§5.3).
  - With a schedule, §5.5–§5.7 with that `creadaEn`.
  - What happened during the pause does not count as overdue.
- `reanudadaEn` only applies to recurring tasks: a one-off task ignores it (a paused recurring task with completions that becomes one-off stays completed, §6.2). The filter by `reanudadaEn` is permanent: it keeps applying after changes of kind or mode, until the next resume.
- With a schedule, an occurrence whose window closed before `reanudadaEn` does not count as missed: on the day of the resume, if the window has already closed, the task stays `waiting` until the next occurrence (not `overdue`).
- The real `creadaEn` does not change: the tie-break of the order (§6.1) still uses the real `creadaEn`.
- Completions can still be deleted (**Historial**, notice) while the task is paused.
- Changing a paused recurring task to one-off resumes it (removes `pausada` and stores `reanudadaEn`).

**Minimal mode** («Modo mínimo»): a mode that the user turns on and off by hand (§6.1) to leave only the essential tasks (§4.1) in view on a bad day, without the rest piling up as overdue.

- **State**: the mode is on or off. It stays on until the user turns it off from the same menu: the app never turns it on or off by itself (no timer, no end date) and it survives reloading the app. It can be turned on with no essential task. The state is a single value synced between devices (§7), not a field of a task.
- **Paused by the minimal mode**: while the mode is on, every recurring task that is **not essential** is paused by the mode. It behaves like a paused task (the **Paused** bullet above: no status, it does not become overdue, disabled checkbox, no row in **Pendientes**) and does not depend on `pausada`: a task paused by the mode and by hand is paused by both. The mode never writes `pausada` and never undoes it: a task paused by hand stays paused, with the mode on or off, until **Reanudar** (essential ones too: with the mode on they stay paused and out of view, §6.1).
- **One-off tasks**: they are never paused (only recurring tasks can be). While the mode is on, a **non-essential one-off task** is **hidden** (§6.1): its status, date and «Tocaba …» do not change, and when the mode is turned off it comes back exactly as it was.
- **Essential tasks**: the mode changes nothing of them: status, order, texts, steps, minimal version, postponement, checkbox and actions follow the rest of the spec as with the mode off.
- **Turning it off** is a **Reanudar** (above) of every recurring task that is not essential and is not paused by hand, with `reanudadaEn` = the moment of turning it off. Each one comes back as if newly created at that moment, even one completed the day before the mode was turned on: interval tasks (relative) are all `pending` at once; calendar tasks are `pending` if today is one of their days and `waiting` otherwise (§5.8, Resume). What happened during the mode does not count as overdue and no «Tocaba …» of the mode is shown. The moment of turning it on is the moment from which they stop being in view. Example: a relative task of every 2 days, last completed `2026-07-10T09:00:00`, not essential; the mode is turned on at `2026-07-14T08:00:00` and off at `2026-07-20T10:00:00`: it was out of view in between, and at `2026-07-20T10:00:00` it is `pending` (not «Tocaba hace 4 días»), with `reanudadaEn` = `2026-07-20T10:00:00`.
- **Changing the mark with the mode on**: unchecking **Esencial** on an essential recurring task pauses it by the mode from the moment of saving (it leaves the list) and hides an essential one-off task. Checking **Esencial** on a non-essential task brings it back right away: a recurring one like turning the mode off for that task, that is, a **Reanudar** at the moment of saving (`reanudadaEn` = now), unless it is also paused by hand, in which case it stays paused (and without `reanudadaEn`); a one-off task as it was. Changing the kind with the mode on follows the same: a non-essential recurring task that becomes one-off is hidden (and resumed as the **Changing a paused recurring task to one-off** bullet says), and a non-essential one-off task that becomes recurring is paused by the mode. Marking essential is the only way back during the mode.
- **Manual pause with the mode on**: a non-essential recurring task cannot be paused by hand while the mode is on (it has no **Pausar**, §6.2). A non-essential one that was already paused by hand stays so; **Reanudar** removes the manual pause and the task stays paused by the mode until the mode is turned off or it is marked essential. When the mode is turned off, a task still paused by hand stays paused.
- **New task with the mode on**: it starts essential (§6.2); if it is saved unchecked, it is non-essential and the rules above apply from the moment of saving.
- **No summary**: turning the mode on or off shows no summary, count or message of how many tasks were paused or came back, and no congratulations.

### 5.9 Postpone

Postponing takes a `pending` or `overdue` task out of urgency for a while, without completing it.

- Options: **1 hora**, **3 horas** and **Hasta mañana** (07:00 of the next local day). It stores `pospuesta = { desde: now, hasta }`.
- While now < `pospuesta.hasta`, a task that according to §5.1–§5.8 would be `pending` or `overdue` is **`waiting`**, with progress = (now − `desde`) / (`hasta` − `desde`); it comes back at `hasta` (order key of §6.1). If it would be `waiting` by its own rule, the postponement changes nothing.
- If now < `pospuesta.desde` (clocks of two devices out of sync), the task stays **`waiting`** with progress 0 (empty bar) until the clock reaches `desde`. Example: `pospuesta = { desde: 2026-07-15T08:05:00, hasta: 2026-07-15T09:05:00 }` and now = `2026-07-15T08:00:00`: `waiting`, progress 0; at `08:05:00` it starts to advance.
- From `pospuesta.hasta`, the status goes back to that of §5.1–§5.8 (it can be `overdue` right away if its overdue time has already arrived). The postponement does not move due times or due dates.
- A postponed task is not completed (§6.1): it is shown with **Mostrar completadas** off.
- It can be completed while postponed (unless the schedule prevents it, §5.5): the checkbox is enabled.
- **Quitar posponer** deletes `pospuesta`. Completing, undoing or editing do not delete it; it expires by itself.
- A paused task (§5.8) cannot be postponed, whether it is paused by hand or by the minimal mode. A postponed non-essential task keeps its `pospuesta` while it is paused by the mode or hidden; it expires by itself as above and has no effect while the task is out of view.

### 5.10 (removed)

This section no longer exists; the numbering of the others is not shifted so that references do not break.

### 5.11 Block rescheduling

**Block rescheduling** («Reprogramar vencidas») lets the person come back after an absence without the overdue recurring tasks piling up as debt. It is done by hand from the **⋮** menu of **Pendientes** (§6.1): the app never offers it or does it by itself.

- **Which tasks**: every **recurring** task that is `overdue` at that moment and in view (§6.1), with no choice: a task cannot be left out. One-off tasks are not rescheduled even if they are overdue and keep their «Tocaba …». Paused tasks (by hand or by the minimal mode) have no status (§5.8), a postponed task is `waiting` (§5.9) and `pending` and `waiting` tasks carry no debt: all of these stay untouched. With the minimal mode on, it works the same on the overdue recurring tasks in view, which are the essential ones (§5.8, §6.1).
- **What it does**: it is a **Reanudar** (§5.8) of each of those tasks, with `reanudadaEn` = the moment of confirming. Each one is evaluated as newly created at that moment: relative tasks are `pending` at once; calendar tasks are `pending` if today is one of their days and `waiting` otherwise; with a schedule, §5.8 applies (an occurrence whose window closed before `reanudadaEn` does not count as missed). The «Tocaba …» of what was missed goes away and does not come back later: the filter by `reanudadaEn` is permanent (§5.8). Example: a relative task of every 2 days, last completed `2026-07-10T09:00:00`, is `overdue` («Tocaba hace 4 días») at `2026-07-16T10:00:00`; confirmed at that moment, it is `pending`, with `reanudadaEn` = `2026-07-16T10:00:00`.
- **Only `reanudadaEn`**: it writes nothing else. Title, emoji, note, steps and `pasoActual`, minimal version, `essential`, schedule, recurrence, `creadaEn`, `pausada` and `pospuesta` do not change. It adds no completion and deletes none: the **Historial** and «Última vez» do not change (§4.4).
- **Undo**: the notice of §5.4 has **Deshacer**. Undoing writes back, for each rescheduled task that still exists, the value of `reanudadaEn` that the rescheduling replaced (or removes the field if the task had none), and nothing else. Completions made after the rescheduling stay; a task deleted in between is not revived (§7).
- **No summary**: neither the preview, nor confirming, nor undoing shows a count of how many tasks were rescheduled, a message about what had piled up, or congratulations.

## 6. Screens

The interface is in **Spanish** and the light or dark theme follows the system.

**Navigation**: there is no navigation bar, on the phone or on wide screens. There are two screens: **Pendientes** (route `/`) and **Historial** (route `/history`). **Pendientes** takes up the whole screen. The **Historial** is opened from the «Historial» item of the **⋮** menu of **Pendientes** (§6.1), the only way in from the app, or directly by its address (a bookmark, the browser history or reloading there), which still opens it. Opening it from the menu adds one entry to the browser history; the «Volver» button of the **Historial** (§6.3) and **Back** (the Android Back button or the equivalent browser gesture) with nothing open on the **Historial** return to **Pendientes** the same way, and **Forward** after either reopens the **Historial**. If the **Historial** was opened directly, «Volver» opens **Pendientes** replacing that entry of the browser history, so there is no extra **Back** that does nothing. The routes `/etiquetas` and `/anotaciones` no longer exist: opening one of them (a bookmark, the browser history or a reload of a screen that was there when the new version arrived) opens **Pendientes**, replacing that entry of the browser history and without a notice, so **Back** does not return to it.

**Bundled font and emoji**: the app looks the same on all machines. All the text uses the **Atkinson Hyperlegible Next** font and every emoji is drawn with **Noto Color Emoji**; both travel with the app (§2, §7) and there is no option to change them.

- **Scope**: both apply to all text and every emoji on all screens (**Pendientes**, **Historial**, the panel and its notices, the emoji picker with its Recientes, the undo notice and the sign-in screen), also in fields and buttons, and in both themes. This includes an emoji pasted or typed in a title or a note. Only the elements drawn by the system that the app does not control are left out (the phone keyboard, the native calendars and lists of a field).
- **No design changes**: sizes, weights and visual hierarchy do not change, and times (`HH:MM`) keep fixed-width digits. **Only exception**: the **Título** field of the panel (§6.2) becomes **20px (1.25rem)**, larger than the **Nota**, which stays at 16px. The other presentation rules of this chapter hold the same with the new font.
- **Offline and no external services**: the font and the complete emoji set (about 5.8 MB compressed) travel with the app, without being requested from an external service, and work offline, also for an emoji that was never seen on that device. Each device downloads them without asking or notifying, separately from the installation of the app: on the first start on a device, while the loading screen (§6.6) is open, the app waits for the download, and if the cap of that screen is reached the download continues in the background; the app is always installed, even if the font or the emoji set cannot be downloaded, and the fonts are downloaded with retries. If the emoji set (Noto) fails, the app is still available offline, with the device emoji. Whoever already has the app receives them with the next version, inside the single progress of the update screen (§6.8, §8), and the restart does not wait for them again.
- **While they are not available**: from the moment the loading screen (§6.6) goes away, if the font or the emoji set have not been downloaded yet, or cannot be loaded, or the browser cannot draw the set, the text is shown with the system font and the emoji with the device one, without a notice, and they change by themselves when they are available. While the loading screen is open no fallback is shown: it waits for what is missing (§6.6). The text is never invisible and an emoji is never shown blank. If the download of the emoji set is aborted by a network failure, the app requests it again when the connection recovers, without reloading, and the emoji changes by itself when it arrives.
- **What is drawn with what**:

| Character | Drawn with |
|---|---|
| Letters and signs that Atkinson has (Spanish included), digits, `#`, `*`, `©`, `®`, `™` without an emoji mark | Atkinson Hyperlegible Next |
| Text character that Atkinson does not have (another alphabet in a title, for example) | the system font |
| Character with a text and an emoji version, without an emoji mark, that Atkinson does not have (`❤`, `☀`, `☎`, `✈`) | Noto Color Emoji |
| Emoji (with or without an emoji mark, `❤️`, `#️⃣`; ZWJ, skin tone, flag), if Noto has it | Noto Color Emoji |
| Emoji that Noto does not have (from a newer Unicode version, arrived from another device) | the device emoji |

- **The data does not change**: bundling does not change which emoji are valid (§4.1) or which ones the picker offers (§6.2); an emoji that the set does not have is stored and shown all the same. Today Noto draws as a single glyph each of the emoji that the picker offers (including the single-skin-tone variants), so the picker does not lose any.

**Orientation**: the installed app is used in portrait. Opened from its icon on the phone, it never rotates: turning the phone does not put it in landscape.

- **Scope**: it applies to all the screens of the installed app (**Pendientes**, **Historial**, the panel and its notices, the sign-in screen, the loading screen, §6.6, the update screen and the «Versión» dialog, §6.8), without exceptions.
- **Which direction**: either of the two portrait directions that the system allows; the app does not fix one.
- **Installed app only**: opened in a browser tab it keeps rotating as today and, in landscape, the usual wide layout is shown (§6.2, Wide screens). On the computer nothing changes: on a desktop screen the orientation is not chosen by the app, not even when installed.
- **New version**: whoever already has the app installed receives the change without reinstalling, through the update screen or the «Hay una versión nueva» notice (§6.8), like any new version (§8); the system may take a few openings to apply it.

### 6.1 Pending (main)

- A single list, **sorted automatically by urgency**:
  1. `overdue`: the one that has been overdue the longest, first.
  2. `pending`: those with the oldest due time or due date go first; one-off tasks without a due date go last, by creation date.
  3. `waiting`: those that come back sooner go first.

  Each group compares an instant (local time), from the oldest to the most recent:

  | Group | One-off | Relative | Calendar |
  |---|---|---|---|
  | `overdue`: since it has been overdue | 00:00 of the day after `fechaLimite` | `V + interval` | 00:00 of the day after `N` |
  | `pending`: since it has been pending | 00:00 of `fechaLimite`; without a due date, at the end of the group, by `creadaEn` | `V`; never completed, `creadaEn` | 00:00 of `N` |
  | `waiting`: when it becomes pending again | — | `V` | 00:00 of `N` |

  Hours and days are compared on the same time axis. If two tasks tie, the one with the oldest `creadaEn` goes first; if they also tie, by title in Spanish alphabetical order (ignoring case and accents, with the ñ after the n); and if they are still tied, by `id`.
- **Menu and minimal mode**: the header of **Pendientes** has a small **⋮** button, with the accessible name «Menú», that opens a menu with six items, in this order: «Historial», **Modo mínimo**, "Completadas" (**Mostrar completadas**, below), "Pausadas" (**Mostrar pausadas**, below), **Reprogramar vencidas** (below) and «Versión». **Modo mínimo**, "Completadas" and "Pausadas" are on/off items: each one shows a check mark when on, and tapping it acts at that moment, without confirmation: it turns its value on or off (§5.8 for the mode) and closes the menu. «Historial» is a plain item (it has no check mark, it is not an on/off item): tapping it closes the menu and opens the **Historial** (§6, **Navigation**). It is always enabled, also with the mode on and with no completions. «Versión» is also a plain item, the sixth and last, below **Reprogramar vencidas**: tapping it closes the menu and opens the «Versión» dialog (§6.8); it is always enabled, also with the mode on. The menu has no other items. The three on/off items are always enabled, also with the mode on and with nothing to show. Nothing outside the menu shows the value of "Completadas" or "Pausadas" (there is no indicator in **Pendientes**), except the rows themselves. While the mode is on, above the list there is a line with the text «Modo mínimo» in secondary text, without color, icon or counter. It is only text (tapping it does nothing) and it is shown even if the list is empty (with the mode on and no essential task, the list is empty with that line). Turning the mode on or off does not show any other message (§5.8).
- **Reprogramar vencidas** (§5.11): the fifth item of the **⋮** menu, between "Pausadas" and «Versión». It is **disabled** (shown dimmed, tapping it does nothing and the menu stays open) whenever there is no overdue recurring task in view, including when the only overdue tasks are one-off ones or, with the minimal mode on, non-essential ones; the menu always looks the same. Enabled, tapping it closes the menu and opens a **preview**: a title «Reprogramar vencidas», a line «Vuelven como recién creadas, desde ahora.», the list of the tasks that will be rescheduled, and the buttons **Reprogramar** and **Cancelar**. Each row shows only the emoji and the title (§4.1), in the order of this section, with no «Tocaba …», no date, no checks and no count. The preview follows the data and the clock while it is open: a task that another device completed, deleted or paused, or that stops being an overdue recurring task, leaves it, and one that becomes one enters it. **Reprogramar** acts on all the tasks that are in the preview at that moment, without further confirmation, closes the preview and shows the notice of §5.4. If the preview is left with no task, **Reprogramar** is disabled and it can only be closed; **Cancelar** closes it and changes nothing.
- **Which rows are in view with the mode on**: only the essential tasks (§4.1), in the same order and with the same rows as with the mode off. The non-essential ones, recurring (paused by the mode) and one-off (hidden), are in no way in view: neither with **Mostrar completadas** nor with **Mostrar pausadas**. A task paused by hand that is essential stays paused and is shown only with **Mostrar pausadas**; a non-essential one paused by hand is not shown even with it. The **Historial** (§6.3) does not change.
- **Mostrar pausadas**: the item "Pausadas" of the **⋮** menu (above), an on/off item. Off (the initial value), the paused tasks (§5.8) are not shown. With the mode on, it shows only the tasks paused by hand that are essential (the ones paused by the mode are never shown, above). On, they go at the end of the list (after the completed ones, if those are shown), by title in the alphabetical order above; each row dimmed, with the text "Pausada" instead of the overdue or return text and the checkbox disabled. The value is saved on that device, like **Mostrar completadas**: a device that already had it on keeps it on.
- **Mostrar completadas**: the item "Completadas" of the **⋮** menu (above), an on/off item.
  - A task is **completed** if it is one-off with at least one completion (§5.1; it is never shown in **Pendientes**, below), or recurring `waiting` with at least one completion (§5.2, §5.3). A recurring `waiting` task without completions (calendar, before its first occurrence) is not completed.
  - Off (the initial value): the list shows only the uncompleted tasks. When a task is completed, its row disappears from the list.
  - On: it adds only the completed **recurring** tasks; the completed one-off tasks are never shown in **Pendientes**, with it on or off (after the undo notice of §5.4 closes, the **Historial**, §6.3, is the only way to open or un-complete one). After the uncompleted ones (in the order above) come the completed recurring ones, from the one with the most recent `completadoEn` to the oldest; if they tie, the same tie-breaks as above apply.
  - The value is saved **on that device** (it is not synced, it is not in Firestore) and survives reloading the app; a device that already had it on keeps it on.
- **Contrast**: the title of an uncompleted task is shown in **bold**; that of a completed (recurring) one, struck through, in normal weight and dimmed, with the checkbox checked. The uncompleted ones stand out from the completed ones at a glance.
- Each row shows:
  - Checkbox on the left, with a touch area of at least 48×48.
  - Emoji and title (§4.1: without an emoji, only the title). The note is not shown in the row.
  - If the task is essential (§4.1), a small outlined star right after the title, on the same line, with the mode on or off and in every kind of row (pending, overdue, waiting, completed, paused). It has no color of its own (the color of the title text), the accessible name «Esencial» and no action: tapping it is tapping the row. It does not change the status or the order.
  - If the task is `pending` or `overdue` and has a first step (§4.1), on its own line below the title, the step the task is on: «Primer paso: » followed by the text if it is on step 1 (for example «Primer paso: Separar la ropa blanca»), or «Paso: » followed by the text if it is on another one (for example «Paso: Poner el lavarropas»), without number or total; it never shows the whole list. It is shown in full, on several lines if needed, without cutting, in the same size and secondary text color as the schedule, without emphasis or its own color. It is not shown in `waiting` rows (nor the postponed or completed ones) or in the paused ones. It is decided with the status of each moment: the line disappears when the task becomes `waiting` (on completing it, postponing it or because of its schedule) or is paused, and comes back by itself when it becomes `pending` or `overdue` again. An `overdue` task with the checkbox disabled until its window opens (§5.5) shows it. Tapping the step text is tapping the row (it opens the panel); in a one-step task the line is not edited from the row and has no buttons.
  - In a task of two steps or more (§4.1, **Steps**), on the step line, and therefore only when the line is shown, two small text buttons, without their own color: **Paso anterior** (before **Hecho**; not shown on step 1) and **Hecho**. **Hecho** moves to the next step; on the last step it completes the task like the checkbox (§5.4: same completion, same notice «Completaste «…»» with **Deshacer**, and `pasoActual` returns to step 1), and it is disabled if the checkbox is (§5.5). **Paso anterior** returns to the previous step. Tapping them does not open the panel, does not go through **Unsaved changes** and does not open an undo notice, except the «Hecho» of the last step. **Hice la mínima** is not one of them: it does open the undo notice (below).
  - If the task is `pending` or `overdue` and has a minimal version (§4.1), on its own line below the title (below the step line, if there is one), «Mínima: » followed by the text (for example «Mínima: Solo el inodoro»), and next to it the **Hice la mínima** button. The line is shown in full, on several lines if needed, without cutting, in the same size and secondary text color as the step line, without emphasis or its own color, and it is shown even if the task has no first step. **Hice la mínima** is a small text button, without its own color, like **Hecho** and **Paso anterior**; it completes the task like the checkbox (§5.4: it adds the completion with `fueMinima`, §4.4, and opens the notice «Completaste «…» · mínima» with **Deshacer**, and with «Vuelve …» below if it is recurring), on any step: in a task of two steps or more it stores `pasoAlCompletar` and `pasoActual` returns to step 1 (§4.1, **Steps**). It is disabled if the checkbox that would complete is (§5.5). Tapping it does not open the panel or go through **Unsaved changes**; tapping the text of the line outside the button is tapping the row (it opens the panel). It is not shown in `waiting` rows (nor the postponed or completed ones) or in the paused ones; it is decided with the status of each moment, and an `overdue` task with the checkbox disabled until its window opens (§5.5) shows it, with the button disabled. A postponed task can still be completed whole with the checkbox (§5.9), not with the minimal version. No texts that propose it, no counters or marks.
  - If the task is `overdue`, the overdue text «Tocaba …» (**Date and distance**, below), which replaces «Atrasada» as the overdue indicator. It carries no alarm color: it is shown in the same color and the same secondary text size as the schedule, without red or emphasis. It is not shown in a paused task.
  - If the task has a schedule, the schedule in small text: "08:00–11:00"; with several, in order and separated by " · ": "07:00–10:00 · 18:00–21:00".
  - In `waiting` tasks: dimmed style, a thin progress bar with the time until they come back and the return text «Vuelve …» (**Date and distance**, below). It also applies to the completed recurring tasks that are shown with **Mostrar completadas** and to the postponed ones, without naming the postponement in the row.
  - `pending` rows and the paused ones do not show date or distance text.
**Date and distance** (overdue text and return text of the row, and closing of the completion notice, §5.4): a single rule builds the text of the three. Tasks that are neither `overdue` nor `waiting` do not carry it.

- **Phrase**: «Tocaba <fecha>[ · <distancia>]» in an `overdue` task and «Vuelve <fecha>[ · <distancia>]» in a `waiting` one. «el» goes only before the date with a day of the week; with «hoy», «ayer» or «mañana» it does not. Examples (now = Friday 13 November 2026, 10:00): «Tocaba el martes 10 · hace 3 días», «Tocaba ayer», «Tocaba hoy 09:00 · hace 1 hora», «Tocaba hoy 10:00 · ahora», «Vuelve mañana», «Vuelve hoy 18:00 · en 8 horas», «Vuelve hoy 10:40 · en 40 minutos», «Vuelve el jueves 19 · en 6 días». No congratulations or other words.
- **Instant of «Tocaba»** (since when the task is due; it is never a future instant):

| Kind | Instant |
|---|---|
| One-off with due date | the day `fechaLimite`, without a time, whether or not it has a schedule |
| Relative | `V` (with a time) |
| Calendar | the day of `N`, without a time |
| Recurring with a schedule (§5.5) | `A`; with several schedules (§5.6, §5.7), the start of `N` |

  If `A` has not arrived yet (the task became overdue by the overdue time without a schedule of §5.5 before its window opened), the instant without a schedule is used: `V`, or 00:00 of `N`. A one-off task without a due date is never `overdue`, so it carries no «Tocaba».
- **Instant of «Vuelve»**: the same one with which this section sorts the `waiting` tasks (when it becomes pending again): relative, `V`; calendar, 00:00 of `N`; with a schedule, `A` (§5.5; a one-off task outside a window, the `desde` of the next one); postponed, `pospuesta.hasta` (§5.9). If two causes have it `waiting`, the instant at which it stops being so (the later of the two).
- **Date**: «hoy», «ayer» or «mañana» if the instant falls on those local days (the day starts at 00:00); if not, the day of the week and the number («martes 10»), with « de <mes>» in lowercase if the month is not the current one («martes 28 de octubre») and « de <año>» if the year is not the current one («miércoles 31 de diciembre de 2025»). It carries the time `HH:MM` in 24 h (fixed-width digits) when the instant is not 00:00 (schedule, relative tasks, postponement): «hoy 18:00», «martes 10 19:30». It is the format of **Última vez** (§6.2) and of the **Historial** (§6.3).
- **Distance**, after the date, separated by « · »:
  - At 2 or more local days: «hace N días» / «en N días» (difference in local days, like **Última vez**), with or without a time in the date.
  - With the date «hoy», «ayer» or «mañana» and with a time: in hours («hace 3 horas», «en 1 hora») or, at less than an hour, in minutes («hace 40 minutos», «en 40 minutos»). The past is rounded down and the future up, never «en 0 minutos». It is counted from now, even if it crosses midnight («Tocaba ayer 23:00 · hace 2 horas» at 01:00).
  - With the date «hoy», «ayer» or «mañana» and with a time, if the instant falls less than a minute in the past, the distance is «ahora», not «hace 0 minutos» («Tocaba hoy 10:00 · ahora» at 10:00:30). The future still rounds up: never «en 0 minutos».
  - With the date «hoy», «ayer» or «mañana» and without a time: there is no distance, the word already is one («Tocaba ayer», «Vuelve mañana»).
- **It updates by itself** as time passes (at midnight, at the hour or at the minute that applies), like **Última vez** with the panel open. It does not change the status or the order of the list.
- They are only texts and color: the statuses of §5 and the order of this section do not change.

- If tapping the checkbox would complete the task and now is outside its window (§5.5), the checkbox is disabled. If it would delete, it is always enabled.
- Tapping the checkbox of an uncompleted task completes it. Tapping the checkbox of a completed task (always recurring: a completed one-off task has no row in **Pendientes**):
  - Whose most recent completion is from today or later (local day of `completadoEn`; later only with clocks out of sync, §5.2): it deletes it (like **Deshacer**, §5.4) and the task returns to the status that applies.
  - Whose most recent completion is from an earlier day: it completes it again (adds a completion; §5.2 restarts the interval, §5.3 covers the next occurrence).
- Tapping the row opens the **edit panel**.
- A **+** button creates a new task with the same panel. It sits at the bottom edge of the screen, without covering the last row. The last row is not covered either by the undo notice (§5.4) or by the «Hay una versión nueva» notice (§6.8), alone or both stacked: the list reserves at the bottom the real height of the notices shown.

### 6.2 Edit panel

Fields:

- Title, emoji and note. The **Título** field is shown at 20px (1.25rem), larger than the **Nota** (16px; §6, No design changes).
- **Emoji**: there is no text field; it is chosen with a **custom picker**.
  - The panel shows the chosen emoji (with a button to change it) or, if there is none, an **Elegir emoji** button. With an emoji there is also a **Quitar emoji** button that leaves the task without an emoji. Since it cannot be typed, the error "Ingresá un solo emoji" does not exist.
  - The picker offers **1914 base emoji** with their **single-skin-tone variants**, grouped by category (with navigation between categories), and a **search in Spanish** (for example "planta", "escoba", "perro"). Choosing an emoji assigns it to the task and closes the picker. It does not offer the 9 emoji of the components group (the 5 skin tones and the 4 hair types alone) or the two-skin-tone variants. What arrives some other way is governed by §4.1: a lone skin tone is invalid and is rejected; a lone hair type (🦰, 🦱, 🦳, 🦲) and a two-tone variant (🧑🏻‍🤝‍🧑🏿) are a valid emoji, are stored and are shown all the same.
  - The picker **works offline**: the catalog and the search texts travel bundled with the app, without being requested from an external service.
  - **Recientes**: the picker first shows the last emojis chosen, from the most recent to the oldest. Rules: when an emoji is chosen it goes to the first place; if it was already in the list it is not repeated (it moves to the first place); the list stores at most **16** emojis and when a new one is added to a full list the oldest is discarded. Removing the emoji does not modify the list. The recents are stored **on that device** (they are not synced, they are not in Firestore) and survive reloading the app.
- **First step**: a one-line field with the label «Primer paso», without example text, right below the title (with its emoji) and before the note. Enter in that field saves, as in every one-line field (**On-screen keyboard**, below). On create it starts empty; on edit, with the current value. Empty leaves the task without a first step, and counts for **Unsaved changes** like any field (typing and going back to the original value does not count; emptying an existing first step does).
- **More steps**: below the first step, each more step is a one-line field with the label «Paso 2», «Paso 3»…, with a **Quitar** button each, and at the end an **Agregar paso** button that adds an empty field, like **Agregar horario**. Enter in those fields saves. The steps go in the written order, without reordering; on save, the empty ones are discarded and the ones below move up (§4.1, **Steps**). Adding, removing or changing a step counts for **Unsaved changes**; typing and going back to the original value does not count, nor do the spaces that **Guardar** trims or an empty step that **Guardar** discards. The panel does not show or choose the step the task is on: that is corrected from the row.
- **Minimal version**: a one-line field with the label «Versión mínima», without example text, below the steps (after **Agregar paso**) and before the note. Enter in that field saves, as in every one-line field (**On-screen keyboard**, below). On create it starts empty; on edit, with the current value. Empty leaves the task without a minimal version (§4.1, **Minimal version**). It counts for **Unsaved changes** like any field: typing and going back to the original value does not count, nor do the spaces that **Guardar** trims; emptying an existing minimal version does.
- **Note**: a multi-line text field. It is shown and edited only in the panel; empty leaves the task without a note.
- **Schedule** (optional, any kind): a check "Solo en un horario" that, when on, shows two time fields, **Desde** and **Hasta**. Off, the task has no schedule. With `desde` ≥ `hasta` the error "La hora de fin tiene que ser posterior a la de inicio" is shown; with the check on and one of the two times empty, "Completá las dos horas". In both cases it is not saved.
  - Below the windows there is an **Agregar horario** button that adds another empty Desde/Hasta row, and each row (if there is more than one) has a **Quitar** button. On save, the windows are sorted by `desde`. Overlapping windows show the error "Los horarios no se pueden superponer" and it is not saved.
  - A relative task in hours with more than one window shows the error "Con varios horarios, el intervalo tiene que ser en días" and it is not saved.
- **Postpone** (only when editing a `pending` or `overdue` task that is not paused): the options **1 hora**, **3 horas** and **Hasta mañana** are shown directly in the panel, without an intermediate **Posponer** button (§6.2, Presentation); choosing one acts at that moment and closes the panel (with unsaved changes, it first opens the action notice of **Unsaved changes**). If the task is postponed, the panel shows "Pospuesta hasta HH:MM" (or "hasta mañana HH:MM") and a **Quitar posponer** button, which also acts at that moment (with the same exception).
- **Esencial**: a check with the text «Esencial» in the **Tarea** section, after the note (text only, no icon). It is saved with **Guardar** like any field and counts for **Unsaved changes**. On edit, it starts with the current value. On create, it starts unchecked with the minimal mode off and checked with it on (the mode as of the moment the panel opens); that starting value is the one the form is measured against, so it does not count as a change, and unchecking it does. If the mode changes with the panel open (for example from another device), the check is not changed. Enter in a one-line field also saves it.
- **Pause / Resume** (only when editing a recurring task): a **Pausar** button; if the task is paused, the panel indicates it ("Pausada") and the button is **Reanudar**. With the minimal mode on this is different for a non-essential recurring task (**Minimal mode in the panel**, below). The button acts at that moment (saves and closes the panel), without going through **Guardar**; with unsaved changes, it first opens the action notice of **Unsaved changes**.
- Kind, chosen in **Se repite** with four options: **No se repite** (one-off: optional due date), **Intervalo** (recurring in relative mode: N + hours/days), **Días de la semana** and **Días del mes** (recurring in calendar mode). When creating a task, the option of **Se repite** that comes selected is **No se repite**.

The same panel serves to create (**+** button) and to edit (tapping the row). When editing it opens with the current values of the task.

**Minimal mode in the panel** (mode on):

| Task | Top of **Tarea** | **Acciones** |
|---|---|---|
| Non-essential recurring, not paused by hand | «Pausada por el modo mínimo» | no **Posponer**, **Quitar posponer**, **Pausar** or **Reanudar**; **Borrar tarea** stays |
| Non-essential recurring, paused by hand | «Pausada» | **Reanudar** (it removes the manual pause; the task then stays paused by the mode and the panel shows the row above); no **Posponer**; **Borrar tarea** |
| Non-essential one-off (hidden) | as always | as always |
| Essential | as always | as always (**Pausar**, **Reanudar** and **Posponer** with the conditions of §5.8 and §5.9) |

The panel of a non-essential task is opened from the **Historial** (§6.3), the only way to reach it during the mode; the **Historial** is reached from the «Historial» item of the **⋮** menu, which the mode does not disable (§6.1). Marking it **Esencial** and saving brings it back (§5.8). With the mode off, the panel is the usual one.

**Última vez** (only when editing): below the title of the panel it is shown when the task was last completed, according to its most recent `completadoEn` and the **local day** (the day starts at 00:00):

- From the day of now: "Última vez: hoy 08:05" (24 h time, `HH:MM`).
- From the previous day: "Última vez: ayer 19:30".
- From N ≥ 2 days before: "Última vez: hace N días" (difference in local days, without a time).
- From a day after today (clocks out of sync, §5.2): with the date, as in the **Historial** (§6.3): "Última vez: jueves 16 de julio 08:05".
- Without completions: "Última vez: nunca".
- It updates while the panel is open (at midnight, when completing or deleting from another device).

**Edit**:

- The same validations as when creating apply (§4.1–§4.2). If any field is invalid, the edit is rejected entirely: no field is saved, the panel stays open and shows the error in the field.
- **Close** (the **X**, or **Back** on Android) with unsaved changes asks for confirmation instead of discarding them (**Unsaved changes**, below); without changes it closes directly. Saving without changes changes nothing.
- Editing never changes `id` or `creadaEn` and never touches the completions. The status is recomputed with the new definition (§5): editing can change the status and the position in the list.
- The kind (one-off ↔ recurring) and the mode (relative ↔ calendar, weekly ↔ monthly) can be changed. The completions are kept and keep counting:
  - A recurring task with completions that becomes one-off is completed (§5.1: it has at least one completion): on saving it **leaves Pendientes**, with **Mostrar completadas** on or off (§6.1), and is reached only from the **Historial** (§6.3).
  - A task with completions that becomes calendar takes `P` according to §5.3 (the completions without `ocurrenciaCubierta` contribute the day of their `completadoEn`).
  - A completed one-off task has no row in **Pendientes**, with **Mostrar completadas** on or off (§6.1); if it is edited (for example, from the history) and becomes recurring, it is governed by the recurring rules with those completions.

**Unsaved changes** (when creating and when editing):

- There **are changes** when **Guardar** would change something compared to the values the panel was opened with. Typing and going back to the original value does not count; neither do the spaces that **Guardar** trims or the order of the schedule windows, which **Guardar** sorts. An emptied field or an empty schedule row do count, even if they are invalid. This is the only definition of "there are changes": it applies to closing, to creating, to the actions and to the browser confirmation.
- It **is measured against the values when the panel was opened**, not against what another device wrote afterwards: a remote change does not make the notice appear.
- **When creating**, "no changes" means the form is still as it was opened. Touching any field with another value (for example **Se repite**) is entering something; a title of only spaces is not. If it is empty, it closes directly; if something was entered, it asks for confirmation.
- **Close notice**: closing with the **X** (or **Back**, see **Back**) with changes opens the notice "Tenés cambios sin guardar" with three buttons: **Seguir editando** (closes the notice and leaves the panel as it was, on the same tab), **Descartar** (closes the panel without saving) and **Guardar** (saves like **Guardar** and, if it saves, closes the panel). **Descartar** does not remove from **Recientes** an emoji chosen in the panel: the recents are updated on choosing, regardless of saving.
- **Action notice**: **Pausar**, **Reanudar**, **Posponer** (**1 hora**, **3 horas**, **Hasta mañana**) and **Quitar posponer** with changes open the notice "Tenés cambios sin guardar" with three buttons: **Seguir editando** (closes the notice without acting), **Descartar y <acción>** (discards the changes, acts on the task as it was saved and closes the panel) and **Guardar y <acción>** (saves like **Guardar**, acts on the saved task and closes the panel), with `<acción>` = pausar, reanudar, posponer or quitar posponer (for postponing, with the option tapped: "Descartar y posponer 1 hora"). Without changes, the action acts at that moment, as always. "Now" of §5.8 and §5.9 is the moment of tapping the button of the notice, not that of choosing the action. Example: **1 hora** is chosen at `2026-07-15T08:00:00`, the notice stays open and **Guardar y posponer 1 hora** is tapped at `2026-07-15T08:03:00`: `pospuesta = { desde: 2026-07-15T08:03:00, hasta: 2026-07-15T09:03:00 }`.
- **If what is saved leaves the action meaningless**: an action "becomes meaningless" if the task, as it would be saved, does not meet the conditions with which §5.8, §5.9 and this section show it (for example, it was changed to **No se repite** and **Pausar** was tapped; a paused recurring task was changed to **No se repite** and **Reanudar** was tapped, because saving already resumes it, §5.8). Then the notice says "Con estos cambios la tarea ya no se puede <acción>" and offers only **Seguir editando** and **Descartar y <acción>**, without **Guardar y <acción>**. If what was written is invalid there is no way to evaluate it: **Guardar y <acción>** is offered and, on tapping it, it fails according to **If Guardar fails**. The actions in view of the panel are still decided with the task as of now, not with what was written.
- **The action notice is kept up to date** while it is open, with the task and the now of the moment, like the actions in view: if another device changes the task or time passes, **Guardar y <acción>** can appear or disappear. On tapping it, it is evaluated again; if it no longer applies, nothing is saved or acted on and the notice is left updated. If another device makes the action no longer apply (for example, it pauses the task with the **Pausar** notice open), the notice closes and the panel stays with what was written.
- **If Guardar fails** (from the close notice or that of an action) by validation (rules above and §4.1–§4.2): nothing is executed, neither the action nor the closing. The notice closes, the panel stays open with what was written and jumps to the first tab with an error, with the rules of **Errors**.
- **The notices open over the panel** with the rules of **Over the panel**: they block what is below and, on closing them, it returns to the same tab without losing anything.
- **If another device deletes the task** with a notice open, the notice and the panel close without asking for anything (§7, the deletion wins).
- **Borrar tarea** does not add this notice: it keeps only its confirmation.
- **Back** (the Android Back button, or the equivalent browser gesture), with the panel open, closes the panel and does not leave the screen where it is (**Pendientes**, or **Historial** if the panel was opened from there), in any browser and width. It closes only what is on top, as if its exit were tapped, and leaves the panel as it was:
  - the close or action notice is equivalent to **Seguir editando**;
  - the confirmation of **Borrar tarea** is equivalent to cancel;
  - the emoji picker closes without choosing.

  A new **Back** closes the panel; if the panel has changes, it opens the close notice, and without changes it closes directly. The undo notice (§5.4) does not count: it does not open over anything, **Back** ignores it and its 5 seconds continue. With the on-screen keyboard open, the first **Back** is closed by the system and the panel stays the same; the next one applies these rules.
  - With the panel closed, **Back** does what it does today: closing the panel with the **X**, with **Guardar** or with an action does not leave an extra **Back** that does nothing, and **Forward** does not reopen a panel. The dialogs of the **Historial** (§6.3) do not change with this feature.
- **Reloading or closing the app** with unsaved changes shows the browser confirmation. It appears only if there are changes, with a notice open or without one, and never by **Back** with the panel open. Its text is the browser's and, where the system does not offer it, what was written is lost. On reload, the panel is not reopened. **Actualizar** of the «Hay una versión nueva» notice (§6.8) reloads the app, so with unsaved changes it shows this same confirmation, and if it is canceled the notice stays. Coming back from the background with the panel open (with or without changes) does not show the update screen (§6.8). A **Back** after a reload can return to the same screen without a visible effect.

**Borrar tarea**: an action available only when editing. It asks for confirmation; if canceled, nothing changes. It does not add the **Unsaved changes** notice.

When a task is deleted **all its completions are also deleted** (and only its own), so they disappear from the history.

**Panel presentation**: the content of the fields and actions above is organized into three sections, **Tarea**, **Cuándo** and **Acciones**. "Phone" means a screen up to **40rem** wide (inclusive); above that, wide screens. The rules of each field do not change, only where they are shown.

- **Content and order of the sections** (the same on phone and on wide screens):
  - **Tarea**: at the top, "Pausada" or «Pausada por el modo mínimo» (if applicable), "Pospuesta hasta HH:MM" (or "hasta mañana HH:MM") and **Última vez**; then the title with the emoji beside it (the emoji button next to the Título field, with **Quitar emoji** below); the first step and the more steps; the minimal version; the note; the **Esencial** check.
  - **Cuándo**: first **Se repite**, with its four options in a 2x2 grid and the fields of the chosen option (due date, Cada, days); then **Solo en un horario** with its windows (**Agregar horario**, **Quitar**).
  - **Acciones**: **Posponer** (the options **1 hora**, **3 horas**, **Hasta mañana** in view) or **Quitar posponer**; **Pausar** or **Reanudar**; and at the end, separated from the rest and in the error color, **Borrar tarea**. Each action appears with the conditions of §5.8, §5.9 and this section (with the minimal mode on, see **Minimal mode in the panel**), and is updated if another device changes the task with the panel open.
- **Phone** (up to 40rem):
  - The panel takes the **whole screen**.
  - The sections are **tabs** with a tab bar: Tarea, Cuándo and Acciones. It always opens on **Tarea**, when creating and when editing. Tabs are changed only by tapping them, without swiping.
  - The header (with the title of the panel and the **X** to close) and the tab bar stay fixed; only the content scrolls, and each tab opens from the top.
  - **Guardar** is in a fixed bar at the bottom, visible on all tabs. **Cerrar** is the **X** of the header.
  - When creating a task the **Acciones** tab does not appear (there are no actions available). When editing it always appears, because **Borrar tarea** is available in every edit.
- **Wide screens** (more than 40rem): the panel has the usual width and location, without a tab bar; the three sections are shown one after the other, each with its name as a title (**Tarea**, **Cuándo**, **Acciones**) and the actions as one more section before the footer, which carries **Guardar** (fixed bar at the bottom) and the **X** of **Cerrar** in the fixed header.
- **Nothing is lost**: changing tabs or width does not lose anything of what was written. **Guardar** considers all the sections (it is a single form) and only **Cerrar** (confirmed with **Descartar**, if there are changes) or **Descartar y <acción>** discard the changes.
- **Errors**: a tab is marked while any of its fields shows an error, whatever its origin (on saving); the mark lasts as long as the message and is distinguished from the icon of the tab. The Título errors belong to **Tarea**; those of due date, Cada, days and schedule, to **Cuándo**.
  - If **Guardar** fails, the panel jumps to the first tab with an error (**Tarea** before **Cuándo**) and the content scrolls to the first field with an error. The same holds on wide screens, where there are no tabs: it only scrolls to the first field with an error.
- **On-screen keyboard**: opening the panel does not focus any field, so the phone keyboard does not appear until one is tapped. The **Guardar** bar is hidden **only while the on-screen keyboard is open** (on any tab and width) and comes back when it closes, even if the field stays focused; a focused field without an on-screen keyboard (on the computer, or in the date and time pickers) does not hide it. The header and the tabs stay fixed. The keyboard does not change how the form is submitted: Enter in a one-line field saves and Enter in Nota adds a line; if that save fails, the rules of Errors apply.
- **Icons**: the tabs **Tarea**, **Cuándo** and **Acciones** and the actions **1 hora**/**3 horas**/**Hasta mañana** (Postpone), **Quitar posponer**, **Pausar**/**Reanudar** and **Borrar tarea** carry an icon, always next to their text, at all widths. Only the **X** to close and the button to choose an emoji when there is no emoji carry an icon without visible text, and keep the accessible names «Cerrar» and «Elegir emoji». **Guardar**, **Agregar horario**, **Agregar paso**, **Quitar**, **Quitar emoji**, the section titles of wide screens and the dialogs are left with text only. The icons travel with the app (§2, §7): they work offline.
- **Over the panel**: the emoji picker, the confirmation of **Borrar tarea** and the notices of **Unsaved changes** open over the panel, as always; on closing them it returns to the same tab. In full screen, the "Sin conexión" strip (§7) and the undo notice (§5.4, above the **Guardar** bar; with the bar hidden by the keyboard, above the keyboard) stay visible without covering the header, the tabs or **Guardar**. The notice can pass over the content during its 5 seconds. The «Hay una versión nueva» notice (§6.8) also stays visible over the panel, above the undo notice (and, with the bar hidden by the keyboard, above the keyboard), without covering the header, the tabs or **Guardar**; since it does not expire, the content of each tab reserves its height so that the end of the tab can be scrolled into view uncovered.

### 6.3 History

- **Header**: an arrow button with the accessible name «Volver», to the left of the title «Historial», the same on the phone and on wide screens. The **Historial** has no **⋮** menu. «Volver» behaves like **Back** (§6, **Navigation**): it returns to **Pendientes** and a later **Back** does not reopen the **Historial**; if the **Historial** was opened directly, it opens **Pendientes** replacing that entry. The header scrolls with the content, it is not fixed. With the panel (§6.2) or the **Borrar** dialog open, «Volver» is covered like the rest of the screen and does nothing until they close.
- List of all the completions, one-off and recurring, with no limit or pagination, sorted from the most recent to the oldest by `completadoEn`. If two have the same `completadoEn`, the one with the smaller `id` goes first.
- Grouped by **local day** of `completadoEn` (the day starts at 00:00). Each group has a header:
  - **Hoy** if it is the day of now; **Ayer** if it is the previous day.
  - If not, the day of the week, the number and the month in lowercase: "martes 14 de julio"; if the year is not the current one, it is added: "miércoles 31 de diciembre de 2025".
  - A completion "from the future" (clocks out of sync, §5.2) is grouped by its own date with the same format: a day after today is shown with the date, never as "Mañana".
- Each entry shows the **current name** of the task (emoji and title, §4.1) (the completion does not store title or emoji: if the task was renamed or changed emoji, all its entries show the new name) and the **time** of `completadoEn` in 24 h, `HH:MM` ("08:05"). If the completion was the minimal one (`fueMinima`, §4.4), the word «Mínima» after the time ("08:05 Mínima"), in the same secondary text, without color or icon; it never shows the text of the minimal version (the completion does not store it either).
- Each entry has the **Borrar** action (undo). It asks for confirmation in a dialog that names the task and the date and time of the completion (and the word «Mínima» if it was the minimal one), with **Borrar** and **Cancelar**; Cancelar changes nothing. Borrar follows §5.4.
- Tapping an entry outside **Borrar** opens the **Editar tarea** panel of that task (§6.2), also for a completed one-off task, which never has a row in **Pendientes** (§6.1): after the undo notice of §5.4 closes, the **Historial** is the only way to open it, and **Borrar** the only way to un-complete it.
- It does not show the orphan completions (§7) or those of deleted tasks (§6.2).
- Without completions, it shows the text "Todavía no completaste nada".
- The last entry is not covered by the undo notice, the «Hay una versión nueva» notice (§6.8, alone or stacked above the undo notice), the "Sin conexión" strip (§7) or the bottom edge of the screen.

### 6.4 (removed)

This section no longer exists; the numbering of the others is not shifted so that references do not break.

### 6.5 Sign-in

- Button "Entrar con Google".
- After the first login, the app opens directly, also offline.
- Opening offline without ever having signed in shows the sign-in screen with the message "Necesitás conexión para entrar la primera vez" and the "Entrar con Google" button disabled.

### 6.6 Loading screen

On start, the app shows a **loading screen** instead of the blank page and the empty content of today.

- **When it appears**: every time the app **starts** (open, reload, open with a new version) and on any destination screen, from the first thing the app draws. The loading screen does not appear when returning from the background if the app is still alive (the update screen can, §6.8), nor after tapping **Entrar con Google** (§6.5). The screen that the system draws when opening an installed PWA is left out (as in §6, Scope).
- **What is seen**: the app icon with a **slow, soft pulse**, without flicker, spin or progress indicator, and **without visible text**. When it finds a new version it becomes the update screen (§6.8), which does show progress and texts; the loading screen itself keeps this rule. The icon has the accessible name «Cargando». With the system's reduced-motion preference (`prefers-reduced-motion`) the icon is shown still; the rest does not change. It follows the light or dark theme of the system (§6).
- **It goes away by itself**: nothing is tapped on it and it does not announce anything technical (neither fonts, nor downloads, nor sync). The "Sin conexión" strip (§7) is seen only on entering the app. The update screen (§6.8) is another screen: it has a button, announces a download and shows the strip.
- **What it waits for with a session**: the response of Auth and the **first response** of tasks, of completions and of the state of the minimal mode (§7) (from the local cache or from the network), and also the **Atkinson Hyperlegible Next** font and **Noto Color Emoji**, even if they have to be downloaded, and, **only with a connection**, the answer to «is there a new version?» (§6.8). It goes away when all that is ready, with a **minimum of 0.5 seconds** even if everything is ready right away.
- **Without a session**: it does not wait for data, because there is none. It waits for the response of Auth, **only Atkinson** and, only with a connection, the answer about a new version (§6.8); Noto keeps downloading behind. It gives way to the sign-in screen (§6.5), which does not change, also offline. If Noto did not arrive on entering, the emoji are shown for a while with the device ones and change by themselves.
- **10-second cap**: it is a single one for the data, the fonts and the answer about a new version, and it counts from when the app starts; the wait for Auth does not count toward the cap. It does not apply to the update screen (§6.8): if the answer arrives after the cap, the app has already entered and the new version is treated like «Continuar sin actualizar». When it is reached, the app enters with what there is, as today, and the list is completed by itself, without a notice; what is missing of the font or of the set is shown with the fallback (§6). The download does not start again and each thing changes by itself when it arrives; if the download is aborted by a network failure, what §6 says applies (it is requested again when the connection recovers).
- **It does not wait for what is not going to arrive**: offline it waits for nothing that can only come over the network (not even the answer about a new version): it goes away when the local cache has responded and the already stored fonts are ready. A font that failed, or a set that the browser cannot draw, stops being waited for at that moment, even if the retries continue; whatever else is pending is still waited for until the cap. Losing the connection with the screen open counts the same. The 0.5 s minimum applies in all cases.
- **New version**: a new version that does not change the font or the set does not download them again, and opening it does not wait for them again. A new version that changes them downloads them on the update screen (§6.8), inside its single progress, and the restart does not wait for them again.
- **After a cap with Noto not downloaded**: the next openings with a session **do not wait for Noto** until it is stored, and it keeps downloading behind. Only a cap reached with Noto not downloaded in an opening that waited for it counts; an opening without a session does not wait for it, so it does not count. The device remembers it: it applies only on that device (it is not synced, it is not in Firestore, §7), it is not seen, and it is forgotten when Noto is stored. A new version that changes the set treats it as not stored and downloads it on the update screen (§6.8); that memory is forgotten when Noto is stored, whichever screen stores it.

Examples (with a session): everything ready at 0.2 s: it goes away at 0.5 s. The data arrives at 3 s and Noto at 6 s: it goes away at 6 s. Noto did not arrive by 10 s: it enters at 10 s with the device emoji and the next openings do not wait for Noto until it is stored.

### 6.7 (removed)

This section no longer exists; the numbering of the others is not shifted so that references do not break.

### 6.8 Update screen and version

Version information and the screen that applies a new version. Versions are never synced: the data of this section is local to each device and is not written to Firestore (§7); nothing about it is remembered on the device either (there is no «skipped version»), so after «Continuar sin actualizar» the next opening or return from the background asks again.

- **A version** is shown as its number and its date: «Versión 412 · 24 de noviembre de 2026 · 11:20». The number goes up by itself with each published version and is never set by hand: the build computes it from the number of changes (commits) in the history that is built. The date is the date and time of the build (`$app/env` `version`), in local time, with the month in words and 24 h time (§6.3). The `package.json` version is not shown. The build writes `build/_app/version.json` with `version` (the build timestamp), `number` and `files` (each file of the version with its `size` in bytes: the precache, the fonts and the emoji set); that file is read from the network, without reloading, to learn the latest version.
- **Size of the download**: the sum of the `size` of the files of the latest version that the device does not have stored yet (so it includes the fonts and the set only when the new version changes them). It is shown in decimal megabytes with one decimal and a comma, «1,4 MB», and below 1 MB in kilobytes without decimals, «512 KB».
- **Progress**: a single bar and a single percentage for the whole download, fonts and set included, computed by bytes stored over the size of the download and shown as «45 %» (rounded down: «100 %» only when everything is stored). The files are downloaded one by one, so the progress moves evenly.
- **Status** (the same texts on the update screen and in the dialog): «Al día» when the latest version is the current one; «Descargando 45 %» when there is a new version and its download is not complete; «Lista: tocá Actualizar» when the new version is completely downloaded and not applied yet; «Sin conexión: no se pudo consultar» when the app could not ask (offline).
- **When it asks** («is there a new version?»): on opening with a connection (the loading screen waits for the answer, counted toward its 10 s cap, §6.6) and when coming back from the background (the app is shown at once as it was; the answer arrives afterwards). It asks with and without a session (the version does not depend on the session, so it also applies before the sign-in screen, §6.5). It does not ask, and so there is no update screen, offline (the app opens with the loading screen as today, or comes back as it was), nor the first time the app is opened on a device (there is no installed version: it already runs the latest and installs in the background, §8).
- **When the update screen appears**: when the answer says there is a new version and **nothing is open**. On opening the loading screen becomes the update screen; on coming back from the background the update screen appears over the app. **Something open** is exactly: the edit panel (with or without unsaved changes, and what opens over it: the emoji picker, the **Borrar tarea** confirmation and the notices of **Unsaved changes**, §6.2), the **Reprogramar vencidas** preview (§5.11), the «Versión» dialog and the dialogs of the **Historial** (the **Borrar** confirmation, §6.3). The open **⋮** menu and the notices (undo, «Tareas reprogramadas», «Hay una versión nueva») do not count: the update screen covers them. On opening nothing can be open (on reload the panel is not reopened, §6.2), so this only acts when coming back from the background. With something open the screen does not appear and the download goes on in the background (notice, below); closing what was open afterwards does not bring the screen: the next moment it can appear is the next opening or return from the background. If on opening the answer arrives after the 10 s cap of §6.6, or when coming back from the background the answer arrives with something open, it is treated like «Continuar sin actualizar». A window of the app already open on the computer is not reloaded when another window installs the version: it keeps its version until it is reloaded, opened again or comes back from the background, and then these rules apply (with the download already done and nothing open, the update screen restarts it at once).
- **What the update screen shows**, from top to bottom: the app icon (with the pulse of §6.6; still with `prefers-reduced-motion`), the status line («Descargando 45 %»), the bar with the percentage, the size of the download («1,4 MB»), the current version and the latest version (number and date, as above) and the button «Continuar sin actualizar». The progress bar keeps advancing with `prefers-reduced-motion`. It follows the theme of the system, the bundled font of the installed version with the same fallback (§6; the new fonts are not used until the restart) and the portrait orientation of the installed app (§6). On the phone (390 px wide) and on wide screens the button is always in view without scrolling and is not covered by the bottom edge of the screen or by the "Sin conexión" strip (§7), which the update screen does show.
- **How long it lasts**: the 10 s cap of §6.6 does not apply: the update screen stays until the download finishes or «Continuar sin actualizar» is tapped, however long that takes.
- **When the download finishes on the update screen** (fonts and set included) the app restarts by itself in the new version, without asking. The restart is a start like any other: the loading screen appears and waits for what §6.6 says, but the fonts and the set of the new version are already stored, so it does not wait for them again.
- **«Continuar sin actualizar»**: the text of the button is exactly «Continuar sin actualizar». It enters the app with the version it already has, and the download goes on in the background. On a start, §6.6 still decides when the app has enough to be shown: if the data or the fonts of that opening are not ready, the screen keeps waiting for them like the loading screen (same 0.5 s minimum and same 10 s cap counted from the start, so after a long wait it usually enters at once), without the button and without the progress. When coming back from the background it returns to the app as it was, without a loading screen.
- **If the download fails** on the update screen, the screen stays with the bar at the percentage it reached and the status «Descargando 45 %»; the "Sin conexión" strip (§7) is shown on it while there is no network; when the connection returns, the download resumes by itself from what was already stored. «Continuar sin actualizar» stays enabled.
- **The notice «Hay una versión nueva»**: after «Continuar sin actualizar», or when the new version was found with something open, the download goes on in the background and, **only when it is complete** (status «Lista: tocá Actualizar»), a notice appears with the text exactly «Hay una versión nueva» and a single button, «Actualizar». It never appears while downloading. It stays, also when changing screens, until «Actualizar» is tapped or the app restarts; there is no other way to close it. «Actualizar» reloads the app in the new version without another wait; with unsaved changes in the panel the browser confirmation of §6.2 applies, and if it is canceled the notice stays. It works offline: the new version is already fully stored, so the restart opens it like any offline opening.
- **Where the notice sits**: on every screen where the undo notice can be (**Pendientes**, the **Historial** and over the panel, §6.2) and on the sign-in screen; not on the loading screen or the update screen. It has the same horizontal place and width as the undo notice (beside the **+** button, which it does not cover). Alone, it sits at the bottom edge of the screen. When the undo notice or «Tareas reprogramadas» (§5.4) is also shown, that one keeps its place at the bottom edge and the version notice sits right above it, both fully visible, without overlapping; when that one expires the version notice goes back down to the bottom edge. §5.4 does not change: its single slot is only for the undo notice and «Tareas reprogramadas». The content reserves at the bottom the real height of the notices shown (one or the two stacked), so the last row of **Pendientes** and the last entry of the **Historial** can always be scrolled into view uncovered, whatever the length of the texts.
- **The notice and the connection strip** are independent: the strip stays at the top and the notices at the bottom, so both can be seen at once; going offline does not hide the notice.
- **The «Versión» dialog**: opened from the «Versión» item of the **⋮** menu (§6.1; the menu exists only in **Pendientes**, so it is not available on the sign-in screen). It shows «Actual: » and «Última: » with a version each (number and date), «Estado: » with the status (above) and, while there is a download pending or done, «Tamaño: » with its size. With «Lista: tocá Actualizar» it has an **Actualizar** button that does the same as the one of the notice; it always has **Cerrar**, and **Back** closes it without leaving **Pendientes** (§6.2, **Back**). It does not ask by itself whether there is a new version: it shows what the app learned at the last opening or return from the background and follows the download while it is open. With «Al día» the latest version is the current one and there is no size. When the app could not ask (offline) it shows the current version and «Sin conexión: no se pudo consultar», without the «Última: » line.

Example (installed version 412; version 413 changes the fonts, 7,0 MB): the person comes back from the background to **Pendientes** with nothing open and the update screen shows «Descargando 0 %», «7,0 MB», «Actual: Versión 412 · 24 de noviembre de 2026 · 11:20» and «Última: Versión 413 · 25 de noviembre de 2026 · 09:05». If they tap «Continuar sin actualizar» at 45 % they return to the app as it was; when the download completes the notice «Hay una versión nueva» appears above the undo notice if it is shown, and «Actualizar» restarts in version 413.

## 7. Data, sync and offline

- **Firestore** with a persistent local cache (`persistentLocalCache`, multi-tab). The app works offline and syncs by itself on reconnecting.
- **Connection notice**: while there is no network a small, discreet notice (a strip) is shown with the text "Sin conexión"; it disappears on reconnecting. It is also shown on the update screen (§6.8, not on the loading screen) and coexists with the «Hay una versión nueva» notice. There is no counter or indicator of pending changes.
- Structure, all under the user:
  - `users/{uid}/tareas/{tareaId}`
  - `users/{uid}/completados/{completadoId}`
  - `users/{uid}/settings/minimalMode`: the state of the minimal mode (§5.8), `{ active: boolean }`. Without the document, the mode is off.
- **Conflicts**:
  - Tasks: **the last change wins, per field** (`emoji`, `nota`, `primerPaso` and `versionMinima` are independent fields, like `titulo`; `horario` is a single field: its windows, with `desde` and `hasta`, are written together; pausing and resuming write `pausada` and `reanudadaEn` together; `pospuesta` is a single field; `essential` is an independent field, written only if it changed; `pasos` is a single field that is replaced whole, and `pasoActual` is another independent field: a «Hecho» in the row does not lose what another device edited in the panel; two «Hecho» offline on the same step leave the task on the next step, not two further along). Edits are partial updates (`update` / `set` with `merge`), never replacements of the whole document. An edit writes only the fields that changed.
  - The unit of conflict is each field of §4.1. `recurrencia` is replaced **whole**, never merged by subfield (so a recurrence that combines modes cannot result). A field that does not correspond to the kind of the task (`fechaLimite` in a recurring task, `recurrencia` in a one-off task) is ignored when deriving the status; when changing kind, the task is left with only the kind fields that the panel shows: the edit removes the field that no longer applies and writes that of the new kind even if it is empty (a one-off task without a due date), so a residual value left by a concurrent edit in that field does not survive.
  - **Edit versus deletion: the deletion wins.** An edit of a task that no longer exists (because another device deleted it, for example offline) does not revive it: it is discarded. If the edit panel of that task was open, it closes, also with an **Unsaved changes** notice open and without asking for anything (§6.2).
  - Completions: they are independent documents with an id generated on the client, so **a completion is never lost**. If two devices complete the same task offline, both entries remain in the history, and the status uses the most recent one / the greatest `ocurrenciaCubierta`. The `fueMinima` data travels inside the completion: two devices that complete offline, one whole and the other with «Hice la mínima», leave both entries, each with its own.
- **Deleting tasks**: the task and its completions (only those) are deleted in a single `writeBatch`. It can happen that another device, offline, completes a task that was already deleted. In that case an orphan completion remains: the history ignores the completions whose task does not exist, and the app cleans them up when it detects them.
- **Cleanups and retries**: the cleanup of orphan completions is retried if an attempt fails or there is no connection; they do not stay uncleaned until the app is reloaded. It is retried when the connection returns and when the data changes, without timers. Each element is attempted separately: one failing (or there being no connection) does not prevent attempting the others of the batch. The retries are silent: no notice, counter or pending indicator. Example: with three orphan completions and the cleanup of the second failing, the first and the third are cleaned, and the second is retried when the connection returns or when the data changes.
- **Minimal mode**: the state is user data synced between devices, not a local preference (§5.8): turning it on on one device turns it on on the others, and all agree on which tasks are paused and which are overdue. The unit of conflict is `active`: with two devices offline, the last change wins. Turning it off writes `active` = `false` and the `reanudadaEn` of the tasks it brings back (§5.8) in a single `writeBatch`, with the moment of turning it off as "now".
- **Block rescheduling** (§5.11): the `reanudadaEn` of all the rescheduled tasks is written in a single `writeBatch`, with the moment of confirming as "now", and works offline like the rest of the app. Undoing is likewise a single `writeBatch`. The unit of conflict stays per field (`reanudadaEn`); a deleted task is not revived by the undo.
- **Local preferences**: the recent emojis of the picker (§6.2) and the memory of a loading-screen cap with Noto not downloaded (§6.6) live only on the device (local browser storage); they are not written to Firestore or synced.
- **Font and emoji**: the bundled font and emoji set (§6) are part of what the app stores to work offline; they are downloaded separately from the installation of the app and with retries (§8): on the first start of a device, while the loading screen is open, the download is waited for, and if the cap is reached it continues in the background (§6.6); a new version that changes them downloads them with the update (§6.8). From when the screen goes away until they are available, those of the system and the device apply (§6). If they cannot be downloaded, the app is still installed and available offline.
- **Data no longer used**: the task documents may still have `etiquetas` and `esfuerzo`, and the `etiquetas` collection may still exist, until a separate migration deletes them. The app does not read them, does not show them, does not write them and does not delete them: an edit writes only the fields that changed, so those fields stay intact, and a change of kind removes only the kind fields. The same holds for the `users/{uid}/anotaciones` collection, which may have existed when there were annotations: it may still exist until a separate script deletes it, and the app does not read it, does not show it, does not write it and does not delete it; deleting a task does not touch it.
- **Security rules**: each user reads and writes only under `users/{their uid}`.

## 8. Architecture and stack

- **Frontend**: SvelteKit + TypeScript, built as a static site (`adapter-static`), with an installable PWA (manifest + service worker). Manifest: `name` "Tareas Hogar", `short_name` "Tareas"; icon and colors with the palette of the app; portrait orientation (§6). A new version of the service worker is applied through the update screen when the app is opened or comes back from the background (§6.8), or with **Actualizar** of the notice «Hay una versión nueva» after «Continuar sin actualizar». That includes the font and the emoji set (§6), which are downloaded inside the same progress. The installation of the app (what it stores to work offline) does not depend on the font or on the emoji set: if a font file fails to download, the app is installed anyway and the fonts are downloaded separately, with retries; the failure of Noto leaves the app available offline, with the device emoji (§6). The wait of the loading screen (§6.6) has a cap and never prevents installing or using the app; the update screen has no cap, but «Continuar sin actualizar» always lets the person use the app.
- **Backend**: Firebase: Authentication (Google), Firestore and Hosting.
- **Domain** (`src/lib/core/`): a pure TypeScript module, without Firebase or Svelte, that implements the rules of §5 receiving "now" as a parameter. The UI and the data layer depend on it, not the other way around.

## 9. Test strategy

The process follows the workflow of Robert C. Martin (see `docs/research/uncle-bob-workflow.md`); the exact tools and gates are in `CLAUDE.md`.

- **Acceptance (Gherkin, APS format)**: scenarios in `features/*.feature` that run **against the domain** (`src/lib/core/`) through step handlers, without a browser. "Now" is a parameter of each scenario, so due times, overdue times and occurrences are deterministic. Each rule of §5 (including the rows of the examples) has at least one scenario.
- **Gherkin mutation**: the values of the `Examples` tables are mutated (dates ±, numbers ±, etc.) and each mutation has to make its scenario fail.
- **Unit tests with TDD** (Vitest), **code mutation** (`mutator`), **CRAP ≤ 10** (`crapper`), **DRY** (`dryer`) and **property tests** (fast-check) on the core.
- **End-to-end QA suite**: procedures in `qa/*.md` converted into **Playwright** scripts that operate only through the UI, against the **Firebase Emulator Suite** (Auth + Firestore), with clean data in each scenario and time controlled with `page.clock`.

## 10. MVP acceptance criteria

1. I can sign in with Google on the phone and on the computer and see the same tasks.
2. I can create, edit and delete one-off and recurring tasks (of the three kinds of recurrence).
3. The statuses and the order of the list meet §5 and §6.1 (verified by the `.feature` files).
4. I complete a task offline on the phone and, on reconnecting, the completion appears on the computer.
5. I can undo a completion from the notice or from the history.
6. The app installs as a PWA on Android and opens offline.
