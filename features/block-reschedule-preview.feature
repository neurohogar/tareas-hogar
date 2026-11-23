# mutation-stamp: sha256=d4b54efff28dcebbd284c987c14ba85f07e41ce1ca03bb03b1a2c0e0442396a4
# acceptance-mutation-manifest-begin
# {"version":1,"tested_at":"2026-11-23T16:39:59.381307793Z","feature_name":"Block reschedule preview","feature_path":"features/block-reschedule-preview.feature","background_hash":"74234e98afe7498fb5daf1f36ac2d78acc339464f950703b8c019892f982b90b","implementation_hash":"sha256:92196e32838acba6c276f45b2fbf37bb3dbc492080548c53e5109876415012e4","scenarios":[{"index":0,"name":"Block reschedule preview 1","scenario_hash":"f2c1d5513f785698a3c32e375ae307fdf2b8152dec587dbeea3c354c7e7f2ff2","mutation_count":2,"result":{"Total":2,"Killed":2,"Survived":0,"Errors":0},"tested_at":"2026-11-23T16:39:59.381307793Z"},{"index":1,"name":"Block reschedule preview 2","scenario_hash":"ce0add812f476ce9caca848dc07878cd7272aae1d16cd4befed2efdfd9765701","mutation_count":1,"result":{"Total":1,"Killed":1,"Survived":0,"Errors":0},"tested_at":"2026-11-23T16:39:59.381307793Z"},{"index":4,"name":"Block reschedule preview 5","scenario_hash":"15f39ed1b9c521ea3a80065cd81624eda6cbeb280f8065419ee8ffc57e151999","mutation_count":5,"result":{"Total":5,"Killed":5,"Survived":0,"Errors":0},"tested_at":"2026-11-23T16:39:59.381307793Z"},{"index":7,"name":"Block reschedule preview 8","scenario_hash":"4df674e4e92e5e9e8645128a0b4abd9379f452acf82e3a194b6be3366c7b495e","mutation_count":2,"result":{"Total":2,"Killed":2,"Survived":0,"Errors":0},"tested_at":"2026-11-23T16:39:59.381307793Z"},{"index":8,"name":"Block reschedule preview 9","scenario_hash":"cee725d711627c9371961501c28e7391bf392f390fa237ab1dbe744c0df0592d","mutation_count":8,"result":{"Total":8,"Killed":8,"Survived":0,"Errors":0},"tested_at":"2026-11-23T16:39:59.381307793Z"},{"index":9,"name":"Block reschedule preview 10","scenario_hash":"f697a7fafba2c1d62b08141e4aabcfb99bd5a281758101fcb1defd7eefa61e9b","mutation_count":4,"result":{"Total":4,"Killed":4,"Survived":0,"Errors":0},"tested_at":"2026-11-23T16:39:59.381307793Z"},{"index":10,"name":"Block reschedule preview 11","scenario_hash":"935f45886ed8061f5242ef4c1b3a5f3e259c083a84b91f4f490a6765d3f835a2","mutation_count":3,"result":{"Total":3,"Killed":3,"Survived":0,"Errors":0},"tested_at":"2026-11-23T16:39:59.381307793Z"},{"index":11,"name":"Block reschedule preview 12","scenario_hash":"b52ae620f0728c1ed28b76fa309d81237482926ae68e61054ab873c5d8878862","mutation_count":2,"result":{"Total":2,"Killed":2,"Survived":0,"Errors":0},"tested_at":"2026-11-23T16:39:59.381307793Z"},{"index":12,"name":"Block reschedule preview 13","scenario_hash":"d76374bd10a60657769eb1f33b8fe75f2c8d393d072b3498a9a74b2927e34027","mutation_count":1,"result":{"Total":1,"Killed":1,"Survived":0,"Errors":0},"tested_at":"2026-11-23T16:39:59.381307793Z"},{"index":13,"name":"Block reschedule preview 14","scenario_hash":"fa8bb679f83796307f270a8d5ea6dfd330b20e7a966699ee28e65417276b1bce","mutation_count":2,"result":{"Total":2,"Killed":2,"Survived":0,"Errors":0},"tested_at":"2026-11-23T16:39:59.381307793Z"},{"index":14,"name":"Block reschedule preview 15","scenario_hash":"baebf41e5861e2dd0942331af187522746e713c19b6ade979458c2fe84599a8a","mutation_count":15,"result":{"Total":15,"Killed":15,"Survived":0,"Errors":0},"tested_at":"2026-11-23T16:39:59.381307793Z"},{"index":15,"name":"Block reschedule preview 16","scenario_hash":"0b9ea67a8ee653a04924e4bbd109f61bbe673fc5aa7786fb75af6c56b952dd36","mutation_count":2,"result":{"Total":2,"Killed":2,"Survived":0,"Errors":0},"tested_at":"2026-11-23T16:39:59.381307793Z"}]}
# acceptance-mutation-manifest-end

# Spec §6.1 (Reprogramar vencidas, Menu and minimal mode) and §5.11 (Which tasks), with
# §5.8, §5.9 and §5.2-§5.3. The item Reprogramar vencidas of the ⋮ menu is disabled
# whenever there is no overdue recurring task in view (one-off tasks are never counted;
# with the minimal mode on only the essential ones are in view). Enabled, it opens a
# preview that lists exactly the tasks that would be rescheduled, in the order of
# Pendientes, and that follows the data and the clock while it is open. Reprogramar acts on
# the tasks in the preview at that moment; if it is empty Reprogramar is disabled;
# Cancelar closes it and changes nothing.
#   What each row shows (only emoji and title, no «Tocaba ...», no date, no checks, no
#   count), the texts of the preview and that the disabled item does nothing when
#   tapped are verified in the QA suite (qa/block-reschedule.md).
# "I query Pendientes on M" evaluates the list and the menu at that moment; "I query the
# preview on M" evaluates the open preview at that moment. "the preview lists T" gives the
# titles from top to bottom, separated by ", ". "another device ..." steps are changes
# made by another device that this one has not seen. "I tap Cancelar in the preview on M"
# closes the preview. The titles name the tasks (one word).
# Reference week: Monday 2026-07-13 to Sunday 2026-07-19.
Feature: Block reschedule preview

  # Block reschedule preview 1
  # With an overdue recurring task in view the item is enabled.
  Scenario Outline: Block reschedule preview 1
    Given a relative recurring task every <every> <unit>
    And the task was completed on <completed>
    When I query Pendientes on <now>
    Then the Reprogramar vencidas item is enabled

    Examples:
      | every | unit | completed           | now                 |
      | 2     | dias | 2026-07-10T09:00:00 | 2026-07-16T10:00:00 |

  # Block reschedule preview 2
  # With nothing to reschedule the item is disabled: a waiting task (row 1 of this
  # scenario), and in the following ones an overdue one-off, a paused task, a postponed
  # one and no task at all.
  Scenario Outline: Block reschedule preview 2
    Given a relative recurring task every <every> <unit>
    And the task was completed on <completed>
    When I query Pendientes on <now>
    Then the Reprogramar vencidas item is disabled

    Examples:
      | every | unit | completed           | now                 |
      | 2     | dias | 2026-07-16T09:00:00 | 2026-07-16T10:00:00 |

  # Block reschedule preview 3
  Scenario Outline: Block reschedule preview 3
    Given a one-off task with due date <due_date>
    When I query Pendientes on <now>
    Then the Reprogramar vencidas item is disabled

    Examples:
      | due_date   | now                 |
      | 2026-07-10 | 2026-07-16T10:00:00 |

  # Block reschedule preview 4
  Scenario Outline: Block reschedule preview 4
    Given a relative recurring task every <every> <unit>
    And the task was completed on <completed>
    And the task was paused
    When I query Pendientes on <now>
    Then the Reprogramar vencidas item is disabled

    Examples:
      | every | unit | completed           | now                 |
      | 2     | dias | 2026-07-10T09:00:00 | 2026-07-16T10:00:00 |

  # Block reschedule preview 5
  Scenario Outline: Block reschedule preview 5
    Given a relative recurring task every <every> <unit>
    And the task was completed on <completed>
    And the task was postponed with option <option> on <postponed>
    When I query Pendientes on <now>
    Then the Reprogramar vencidas item is disabled

    Examples:
      | every | unit | completed           | option  | postponed           | now                 |
      | 2     | dias | 2026-07-10T09:00:00 | 3 horas | 2026-07-16T09:30:00 | 2026-07-16T10:00:00 |

  # Block reschedule preview 6
  Scenario: Block reschedule preview 6
    When I query Pendientes at any moment
    Then the Reprogramar vencidas item is disabled

  # Block reschedule preview 7
  # With the minimal mode on, a non-essential overdue task is not in view: disabled.
  Scenario Outline: Block reschedule preview 7
    Given a relative recurring task every <every> <unit>
    And the task was completed on <completed>
    And the minimal mode is on
    When I query Pendientes on <now>
    Then the Reprogramar vencidas item is disabled

    Examples:
      | every | unit | completed           | now                 |
      | 2     | dias | 2026-07-10T09:00:00 | 2026-07-16T10:00:00 |

  # Block reschedule preview 8
  # With the minimal mode on, an essential overdue task is in view: enabled.
  Scenario Outline: Block reschedule preview 8
    Given a relative recurring task every <every> <unit>
    And the task was completed on <completed>
    And the task was marked essential
    And the minimal mode is on
    When I query Pendientes on <now>
    Then the Reprogramar vencidas item is enabled

    Examples:
      | every | unit | completed           | now                 |
      | 2     | dias | 2026-07-10T09:00:00 | 2026-07-16T10:00:00 |

  # Block reschedule preview 9
  # The item follows the clock: a calendar task is pending until 23:59:59 of its day
  # (row 1) and overdue from 00:00 (row 2).
  Scenario Outline: Block reschedule preview 9
    Given a weekly recurring task on <days> created on <created>
    When I query Pendientes on <now>
    Then the Reprogramar vencidas item is <state>

    Examples:
      | days   | created             | now                 | state    |
      | martes | 2026-07-13T08:00:00 | 2026-07-14T23:59:59 | disabled |
      | martes | 2026-07-13T08:00:00 | 2026-07-15T00:00:00 | enabled  |

  # Block reschedule preview 10
  # The preview lists the overdue recurring tasks in the order of Pendientes (the oldest
  # overdue first: Basura, then Regar, though Regar is declared first) and no other task: not
  # Pagar (one-off, overdue) or Barrer (waiting).
  Scenario Outline: Block reschedule preview 10
    Given a relative recurring task Regar every <every> <unit>
    And the task Regar was completed on <regar_completed>
    And a weekly recurring task Basura on <days> created on <created>
    And a one-off task Pagar with due date <due_date>
    And a relative recurring task Barrer every <every> <unit>
    And the task Barrer was completed on <barrer_completed>
    When I query the preview on <now>
    Then the preview lists <titles>

    Examples:
      | every | unit | regar_completed     | days           | created             | due_date   | barrer_completed    | now                 | titles        |
      | 2     | dias | 2026-07-10T09:00:00 | martes, jueves | 2026-07-01T08:00:00 | 2026-07-10 | 2026-07-16T09:00:00 | 2026-07-16T10:00:00 | Basura, Regar |

  # Block reschedule preview 11
  # With the minimal mode on, the preview lists only the essential overdue tasks.
  Scenario Outline: Block reschedule preview 11
    Given a relative recurring task Regar every <every> <unit>
    And the task Regar was completed on <completed>
    And the task Regar was marked essential
    And a relative recurring task Barrer every <every> <unit>
    And the task Barrer was completed on <completed>
    And the minimal mode is on
    When I query the preview on <now>
    Then the preview lists <titles>

    Examples:
      | every | unit | completed           | now                 | titles |
      | 2     | dias | 2026-07-10T09:00:00 | 2026-07-16T10:00:00 | Regar  |

  # Block reschedule preview 12
  # The preview follows the data: a task that another device completed leaves it, and
  # when it is left empty Reprogramar is disabled.
  Scenario Outline: Block reschedule preview 12
    Given a relative recurring task Regar every <every> <unit>
    And the task Regar was completed on <completed>
    When another device, without seeing that change, completes the task Regar on <other>
    And I query the preview on <now>
    Then the preview lists no task
    And the Reprogramar button is disabled

    Examples:
      | every | unit | completed           | other               | now                 |
      | 2     | dias | 2026-07-10T09:00:00 | 2026-07-16T10:05:00 | 2026-07-16T10:06:00 |

  # Block reschedule preview 13
  # A task that another device deleted leaves the preview.
  Scenario Outline: Block reschedule preview 13
    Given a relative recurring task Regar every <every> <unit>
    And the task Regar was completed on <completed>
    When another device, without seeing that change, deletes the task
    And I query the preview on <now>
    Then the preview lists no task
    And the Reprogramar button is disabled

    Examples:
      | every | unit | completed           | now                 |
      | 2     | dias | 2026-07-10T09:00:00 | 2026-07-16T10:06:00 |

  # Block reschedule preview 14
  # A task that another device paused leaves the preview.
  Scenario Outline: Block reschedule preview 14
    Given a relative recurring task Regar every <every> <unit>
    And the task Regar was completed on <completed>
    When another device, without seeing that change, pauses the task
    And I query the preview on <now>
    Then the preview lists no task
    And the Reprogramar button is disabled

    Examples:
      | every | unit | completed           | now                 |
      | 2     | dias | 2026-07-10T09:00:00 | 2026-07-16T10:06:00 |

  # Block reschedule preview 15
  # The preview follows the clock: a task that becomes overdue enters it, and with a
  # task already in it the list grows (Basura becomes overdue at 00:00).
  Scenario Outline: Block reschedule preview 15
    Given a relative recurring task Regar every <every> <unit>
    And the task Regar was completed on <completed>
    And a weekly recurring task Basura on <days> created on <created>
    When I query the preview on <now>
    Then the preview lists <titles>

    Examples:
      | every | unit | completed           | days   | created             | now                 | titles        |
      | 2     | dias | 2026-07-10T09:00:00 | martes | 2026-07-13T08:00:00 | 2026-07-14T23:59:59 | Regar         |
      | 2     | dias | 2026-07-10T09:00:00 | martes | 2026-07-13T08:00:00 | 2026-07-15T00:00:00 | Regar, Basura |

  # Block reschedule preview 16
  # Cancelar closes the preview and changes nothing: no resume moment and no notice.
  Scenario Outline: Block reschedule preview 16
    Given a relative recurring task every <every> <unit>
    And the task was completed on <completed>
    When I tap Cancelar in the preview on <now>
    And I query the notice on <now>
    Then the task has no resume moment
    And there is no notice

    Examples:
      | every | unit | completed           | now                 |
      | 2     | dias | 2026-07-10T09:00:00 | 2026-07-16T10:00:00 |
