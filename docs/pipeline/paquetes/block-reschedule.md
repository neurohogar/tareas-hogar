# Package: block-reschedule

Second feature of epic E6 of `docs/v3/plan.md` («Low-capacity days and return without debt»): a block rescheduling, by hand and with a preview, that lets the person come back after an absence without the overdue tasks («Tocaba …») piling up as debt, with undo. The «esencial» mark and the minimal mode were already done in `minimal-mode`.

## Specs

## Decisions

- D1 (2026-11-23, analyst, what rescheduling does to the debt): a rescheduled task stops being `overdue` and carries no «Tocaba …» of what was missed; it does not come back as overdue later because of the time before the rescheduling. Because the epic is «return without debt» and the plan refutes it with «a way out that is felt as debt»; a plain postponement (§5.9) does not move due times and would bring them back overdue.
- D2 (2026-11-23, analyst, completions and history): rescheduling adds no completion and deletes none; the **Historial** and «Última vez» do not change. Because completions are append-only and record what was done (§4.4), and rescheduling is not doing the task.
- D3 (2026-11-23, analyst, tasks out of the rescheduling): only tasks that are `overdue` at that moment and in view can be rescheduled. Paused tasks (by hand or by the minimal mode) have no status (§5.8); a postponed task is `waiting` (§5.9); a non-essential one-off task hidden by the minimal mode «comes back exactly as it was» when the mode is turned off (§5.8); `pending` and `waiting` tasks carry no debt text. All of these stay untouched.
- D4 (2026-11-23, analyst, other fields): rescheduling does not change the title, emoji, note, steps or `pasoActual`, minimal version, `essential`, schedule, recurrence, `pausada` or `pospuesta`. Because §4.1 says those fields do not change when the task is postponed, paused or resumed, and the rescheduling is the same kind of action.
- D5 (2026-11-23, analyst, sync): the rescheduling of all the selected tasks is written in a single `writeBatch`, with the moment of confirming as "now", and works offline like the rest of the app; undo is likewise a single `writeBatch`. Because turning the minimal mode off, also an action on many tasks, is written that way (§7) and the unit of conflict stays per field.
- D6 (2026-11-23, analyst, preview kept up to date): while the preview is open it follows the data and the clock (a task that another device completed, deleted or that stops being `overdue` leaves the preview; one that becomes `overdue` enters it), and confirming acts only on the tasks that are still in it at that moment. Because the action notice of §6.2 already follows that rule ("kept up to date while it is open ... evaluated again on tapping").
- D7 (2026-11-23, analyst, what undo restores): undo writes back, for each rescheduled task that still exists, the values that the rescheduling replaced, and nothing else: completions made after the rescheduling stay; a task deleted in between is not revived. Because deletion wins over an edit (§7) and completions are never lost (§4.4).
- D8 (2026-11-23, analyst, no summary): neither confirming nor undoing shows a count of how many tasks were rescheduled, a message about what had piled up, or congratulations. Because the plan's Avoid line forbids «a summary of what piled up», and §5.8 (**No summary**) and §5.4 (no congratulations) already follow it.
- D9 (2026-11-23, analyst, minimal mode on): with the mode on, the rescheduling works the same on the tasks in view (the essential ones, §6.1). Because the mode «changes nothing» of essential tasks (§5.8) and D3 already leaves the paused and hidden ones out.

## Artifacts

## core

## acceptance

## ui

## cleaner · architect · hardener · qa

They work on everything the feature changed (`git diff <feature base>`, recorded in `tmp/base-de-feature`); they need no section of their own unless the gherkin-writer leaves a note for them here.

## Log

- L1 (2026-11-23): the user's original request, verbatim: «dale, arrancá el analyst» (translation: «go ahead, start the analyst»), in answer to the orchestrator's proposal to start the pending part of epic E6 of `docs/v3/plan.md` («Low-capacity days and return without debt»): the block rescheduling. The plan says of it: «Pending: the block rescheduling, in another feature.» (line 103); «A block rescheduling, with a preview, to come back after an absence.» (line 107); Avoid: «The app turning the mode on or inferring the person's state; mood questions (`tea §6`); a summary of «lo acumulado» (translation: «what piled up») on leaving.» (line 109); «These are actions on many tasks at once: the preview and undo are part of the scope.» (line 110); open question: «Is the minimal mode only turned on by hand, or can the app offer it on coming back from an absence?» (line 232); and `docs/research/v3/hogar-compartido-y-apps.md:166`: «Retorno tras ausencia sin penalidad y con reprogramación en bloque.» (translation: «Return after absence without penalty and with block rescheduling.»).
