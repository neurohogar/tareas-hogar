# mutation-stamp: sha256=c1056e15a34f837a1d1364237abbb8307754a212edbd12e4c5be616c3e7284b0
# acceptance-mutation-manifest-begin
# {"version":1,"tested_at":"2026-11-17T20:46:56.554345003Z","feature_name":"Anotaciones de una tarea borrada","feature_path":"features/anotaciones-de-tarea-borrada.feature","background_hash":"74234e98afe7498fb5daf1f36ac2d78acc339464f950703b8c019892f982b90b","implementation_hash":"sha256:3adbf53193bdd218e53ef98af0cb84de5b1b326044401f613f3941760bc590e3","scenarios":[{"index":0,"name":"Anotaciones de tarea borrada 1","scenario_hash":"c608c20268a206e4e07b6b96216362d6dba52f51a6b47449a0038ee6ee2a43a5","mutation_count":18,"result":{"Total":18,"Killed":18,"Survived":0,"Errors":0},"tested_at":"2026-11-17T20:46:56.554345003Z"},{"index":1,"name":"Anotaciones de tarea borrada 2","scenario_hash":"6a4018e222b1c71daa24ce133a268f41fca12e635f2176f78458aa5f85763aeb","mutation_count":9,"result":{"Total":9,"Killed":9,"Survived":0,"Errors":0},"tested_at":"2026-11-17T20:46:56.554345003Z"},{"index":2,"name":"Anotaciones de tarea borrada 3","scenario_hash":"f0be2567d9ccd945ec01598a760ccfc4932a48184a4095ab5e019c8481f3ffac","mutation_count":16,"result":{"Total":16,"Killed":16,"Survived":0,"Errors":0},"tested_at":"2026-11-17T20:46:56.554345003Z"}]}
# acceptance-mutation-manifest-end

# Spec §5.10 (Delete a task), §6.2 and §7. Deleting a task also deletes all
# its annotations, and only its own (in the same writeBatch as its
# completions); annotations without a task are not affected. An orphan
# annotation (another device, offline, annotated a task that had already been
# deleted) is not shown on the Anotaciones screen nor copied with Copiar, and is
# detected in order to clean it up, like an orphan completion.
# An annotation is named by the instant it was annotated (different for each
# annotation in a scenario). "Anotaciones shows" gives the groups in order,
# separated by "; ", each as "<heading>: <annotations>", and the
# annotations in order, separated by ", ", each as its parts separated
# by " · ". Each task is named by its title (one word).
Feature: Annotations of a deleted task

  # Annotations of a deleted task 1
  # Deleting a task deletes its annotations and its completions, and leaves those of
  # another task and those without a task.
  Scenario Outline: Annotations of a deleted task 1
    Given a one-off task Regar with due date <due_date>
    And a one-off task Pagar with due date <due_date>
    And the task Regar was completed on <completed>
    And an annotation <direction_1> in <screen_1> from <annotated_1>
    And the annotation refers to the task Regar
    And an annotation <direction_2> in <screen_2> from <annotated_2>
    And the annotation refers to the task Regar
    And an annotation <direction_3> in <screen_3> from <annotated_3>
    And the annotation refers to the task Pagar
    And an annotation <direction_4> in <screen_4> from <annotated_4>
    When I delete the task Regar
    And I query Anotaciones on <now>
    Then there is no task Regar
    And no completion remains of Regar
    And <count> annotations remain
    And Anotaciones shows <annotations>

    Examples:
      | due_date   | completed           | direction_1 | screen_1   | annotated_1         | direction_2 | screen_2         | annotated_2         | direction_3 | screen_3   | annotated_3         | direction_4 | screen_4    | annotated_4         | now                 | count    | annotations                                                                  |
      | 2026-07-20 | 2026-07-15T07:00:00 | Me sirvió | Pendientes | 2026-07-14T09:00:00 | Me molestó | Panel de edición | 2026-07-15T08:00:00 | Me sirvió | Historial  | 2026-07-15T09:00:00 | Me molestó | Anotaciones | 2026-07-15T10:00:00 | 2026-07-15T12:00:00 | 2        | Hoy: 10:00 · Me molestó · Anotaciones, 09:00 · Me sirvió · Historial · Pagar |

  # Annotations of a deleted task 2
  # Deleting a task without annotations does not touch those without a task.
  Scenario Outline: Annotations of a deleted task 2
    Given a one-off task Regar with due date <due_date>
    And an annotation <direction> in <screen> from <annotated>
    When I delete the task Regar
    And I query Anotaciones on <now>
    Then <count> annotations remain
    And Anotaciones shows <annotations>

    Examples:
      | due_date   | direction | screen     | annotated           | now                 | count    | annotations                          |
      | 2026-07-20 | Me sirvió | Pendientes | 2026-07-15T08:00:00 | 2026-07-15T12:00:00 | 1        | Hoy: 08:00 · Me sirvió · Pendientes  |

  # Annotations of a deleted task 3
  # Orphan annotation: another device, without seeing the deletion, annotates the
  # deleted task. The screen and Copiar ignore it, and it is the only one
  # detected for cleaning up; those of tasks that exist and those without a
  # task are not.
  Scenario Outline: Annotations of a deleted task 3
    Given a one-off task Regar with due date <due_date>
    And a one-off task Pagar with due date <due_date>
    And an annotation <direction_1> in <screen_1> from <annotated_1>
    And the annotation refers to the task Pagar
    And an annotation <direction_2> in <screen_2> from <annotated_2>
    When I delete the task Regar
    And another device, without seeing that change, annotates <direction_orphan> in <screen_orphan> on <annotated_orphan> about the task Regar
    And I query Anotaciones on <now>
    And I copy the annotations
    Then Anotaciones shows <annotations>
    And the copied text has the lines <lines>
    And the orphan annotations to clean are only the one from <annotated_orphan>

    Examples:
      | due_date   | direction_1 | screen_1   | annotated_1         | direction_2 | screen_2   | annotated_2         | direction_orphan | screen_orphan     | annotated_orphan    | now                 | annotations                                                                       | lines                                                                                        |
      | 2026-07-20 | Me sirvió | Historial  | 2026-07-15T08:00:00 | Me molestó | Pendientes | 2026-07-15T09:00:00 | Me sirvió        | Etiquetas         | 2026-07-15T10:00:00 | 2026-07-15T12:00:00 | Hoy: 09:00 · Me molestó · Pendientes, 08:00 · Me sirvió · Historial · Pagar       | 2026-07-15 08:00 · Me sirvió · Historial · Pagar; 2026-07-15 09:00 · Me molestó · Pendientes |
