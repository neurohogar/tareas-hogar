# mutation-stamp: sha256=d412c30db0598eaec3e7038b020349cd0a0819dfeed2a03846e9710476ea1a4c
# acceptance-mutation-manifest-begin
# {"version":1,"tested_at":"2026-11-17T20:50:33.834362854Z","feature_name":"Borrar tarea","feature_path":"features/borrar-tarea.feature","background_hash":"74234e98afe7498fb5daf1f36ac2d78acc339464f950703b8c019892f982b90b","implementation_hash":"sha256:91f0975fbef86739246719c2117f7b7f936523169bd49cf40f9272b7008e15d4","scenarios":[{"index":0,"name":"Borrar tarea 1","scenario_hash":"0335eb487498f00f4fc5d221032ddca9659b356c262538683326499d771f52bd","mutation_count":9,"result":{"Total":9,"Killed":9,"Survived":0,"Errors":0},"tested_at":"2026-11-17T20:50:33.834362854Z"},{"index":1,"name":"Borrar tarea 2","scenario_hash":"5a28bddeabb0e2e947a17b727ce164d49af1a8d3122fb185b6d45d63ea925d42","mutation_count":6,"result":{"Total":6,"Killed":6,"Survived":0,"Errors":0},"tested_at":"2026-11-17T20:50:33.834362854Z"},{"index":2,"name":"Borrar tarea 3","scenario_hash":"0c5160be1f06e716fa0228120994720e787e761e6c847e11ee51ce70f99ab137","mutation_count":1,"result":{"Total":1,"Killed":1,"Survived":0,"Errors":0},"tested_at":"2026-11-17T20:50:33.834362854Z"},{"index":3,"name":"Borrar tarea 4","scenario_hash":"de8b9fa79bdf0991c7663ea79d1a0ea3c4285ec8872ee8abb5919d50c706a0d3","mutation_count":11,"result":{"Total":11,"Killed":11,"Survived":0,"Errors":0},"tested_at":"2026-11-17T20:50:33.834362854Z"}]}
# acceptance-mutation-manifest-end

# Spec §6.2 (Borrar tarea) and §7 (Deleting tasks). Deleting a task also deletes
# all its completions, and only its own (in a single writeBatch).
# A completion whose task no longer exists (orphan: another device, offline,
# completed a task that was already deleted) counts for nothing and is
# detected so it can be cleaned. The confirmation is verified in the QA suite.
# Each task is named by its title (one word). "Pendientes shows in
# order" gives the titles from top to bottom and the list has no other rows.
Feature: Delete task

  # Delete task 1
  # Deleting a relative deletes its completions and leaves those of another task.
  Scenario Outline: Delete task 1
    Given a relative recurring task Regar every <every> <unit>
    And the task Regar was completed on <completed_water>
    And the task Regar was completed on <other_water>
    And a one-off task Pagar with due date <due_date>
    And the task Pagar was completed on <completed_pay>
    When I delete the task Regar
    Then there is no task Regar
    And no completion remains of Regar
    And the task Pagar keeps a single completion, from <completed_pay_stored>

    Examples:
      | every | unit   | completed_water     | other_water         | due_date   | completed_pay       | completed_pay_stored      |
      | 2    | dias   | 2026-07-13T08:00:00 | 2026-07-15T08:00:00 | 2026-07-20 | 2026-07-14T10:00:00 | 2026-07-14T10:00:00       |

  # Delete task 2
  # Deleting a weekly deletes its completions; the other task stays in
  # Pendientes with the same status.
  Scenario Outline: Delete task 2
    Given a weekly recurring task Basura on <days>
    And the task Basura has a completion that covers <covered>
    And a relative recurring task Regar every <every> <unit>
    And the task Regar was completed on <completed>
    When I delete the task Basura
    And I query Pendientes on <now>
    Then there is no task Basura
    And no completion remains of Basura
    And Pendientes shows in order <order>

    Examples:
      | days           | covered    | every | unit   | completed           | now                 | order |
      | martes, jueves | 2026-07-14 | 4    | horas  | 2026-07-15T06:00:00 | 2026-07-15T12:00:00 | Regar |

  # Delete task 3
  # Deleting a never-completed task: it stops appearing in Pendientes.
  Scenario Outline: Delete task 3
    Given a one-off task Pagar with due date <due_date>
    And a relative recurring task Regar never completed created on <created_water>
    When I delete the task Pagar
    And I query Pendientes on <now>
    Then there is no task Pagar
    And Pendientes shows in order <order>

    Examples:
      | due_date   | created_water       | now                 | order |
      | 2026-07-14 | 2026-07-13T08:00:00 | 2026-07-15T12:00:00 | Regar |

  # Delete task 4
  # Orphan completion: another device, without seeing the deletion, completes the
  # deleted task. It is ignored in Pendientes and it is the only one detected for
  # cleaning; the completions of the tasks that exist are not.
  Scenario Outline: Delete task 4
    Given a relative recurring task Regar every <every> <unit>
    And a weekly recurring task Basura on <days>
    And the task Basura has a completion that covers <covered>
    When I delete the task Regar
    And another device, without seeing that change, completes the task Regar on <completed>
    And I query Pendientes on <now>
    Then there is no task Regar
    And Pendientes shows in order <order>
    And the orphan completions to clean are only the one of Regar from <completed_stored>

    Examples:
      | every | unit   | days           | covered    | completed           | now                 | order  | completed_stored    |
      | 2    | dias   | martes, jueves | 2026-07-09 | 2026-07-15T09:00:00 | 2026-07-15T12:00:00 | Basura | 2026-07-15T09:00:00 |
