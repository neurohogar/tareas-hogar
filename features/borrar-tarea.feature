# mutation-stamp: sha256=d0e05e3fb866774fbe43851aa1053514335a2c728292caec5e567f39d5689835
# acceptance-mutation-manifest-begin
# {"version":1,"tested_at":"2026-11-20T21:31:18.090501610Z","feature_name":"Delete task","feature_path":"features/borrar-tarea.feature","background_hash":"74234e98afe7498fb5daf1f36ac2d78acc339464f950703b8c019892f982b90b","implementation_hash":"sha256:92c50f88bdb9daee7f46b8bece9d184e0ffabd264987278dba8a02b74cbd9ca8","scenarios":[{"index":0,"name":"Delete task 1","scenario_hash":"b1ce891b9b982173d256846a96a45d5aae18c4394d177f0f4b2df2240946e5ec","mutation_count":10,"result":{"Total":10,"Killed":10,"Survived":0,"Errors":0},"tested_at":"2026-11-20T21:31:18.090501610Z"},{"index":1,"name":"Delete task 2","scenario_hash":"198724e480e2545e16d7eeb44398f3d3fd550ab491d5300f4511ef847012e35a","mutation_count":6,"result":{"Total":6,"Killed":6,"Survived":0,"Errors":0},"tested_at":"2026-11-20T21:31:18.090501610Z"},{"index":2,"name":"Delete task 3","scenario_hash":"4cf473aef3e8bb968afe1aa504c657eaba0fb50b726bd76332b7fe8995daf7d5","mutation_count":1,"result":{"Total":1,"Killed":1,"Survived":0,"Errors":0},"tested_at":"2026-11-20T21:31:18.090501610Z"},{"index":3,"name":"Delete task 4","scenario_hash":"67467d8ea13d2a2009489996d1c5713ada79f23a1bad391588021609cf87532d","mutation_count":11,"result":{"Total":11,"Killed":11,"Survived":0,"Errors":0},"tested_at":"2026-11-20T21:31:18.090501610Z"}]}
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
