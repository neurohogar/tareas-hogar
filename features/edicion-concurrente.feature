# mutation-stamp: sha256=cc784155716f57a47919ce1ff4fe5377af5298ebd003405f8565e78be179349c
# acceptance-mutation-manifest-begin
# {"version":1,"tested_at":"2026-11-19T12:17:50.965263478Z","feature_name":"Concurrent editing","feature_path":"features/edicion-concurrente.feature","background_hash":"74234e98afe7498fb5daf1f36ac2d78acc339464f950703b8c019892f982b90b","implementation_hash":"sha256:8e3dd9406d40cb3a20ef825a21347f8f2585e47b4f78735d9d7804c927c05512","scenarios":[{"index":0,"name":"Concurrent editing 1","scenario_hash":"d3aab88fe73adb203ca2e7ecaae750e1bcb084c2d0cafed7a1d8c8d1a54e19c1","mutation_count":6,"result":{"Total":6,"Killed":6,"Survived":0,"Errors":0},"tested_at":"2026-11-19T12:17:50.965263478Z"},{"index":1,"name":"Concurrent editing 2","scenario_hash":"e7e37a868290057c8ac0a5549a571dcd21bcb27b4715bb2d0cf15f487bf15b0a","mutation_count":6,"result":{"Total":6,"Killed":6,"Survived":0,"Errors":0},"tested_at":"2026-11-19T12:17:50.965263478Z"},{"index":2,"name":"Concurrent editing 3","scenario_hash":"5a41fe4b65ee9f166563383cda7ecb9be84e541c3aa5d7b19834c5c0eef730e7","mutation_count":5,"result":{"Total":5,"Killed":5,"Survived":0,"Errors":0},"tested_at":"2026-11-19T12:17:50.965263478Z"},{"index":3,"name":"Concurrent editing 4","scenario_hash":"48f39091208e45bd1d9febb7a68e8fbff80b5625d65351e6f333a1dd1a3740b2","mutation_count":6,"result":{"Total":6,"Killed":6,"Survived":0,"Errors":0},"tested_at":"2026-11-19T12:17:50.965263478Z"},{"index":4,"name":"Concurrent editing 5","scenario_hash":"adacd071515d9ef2fca474f52c15bd6bd9529b261fff172708ccbf429175ad0d","mutation_count":4,"result":{"Total":4,"Killed":4,"Survived":0,"Errors":0},"tested_at":"2026-11-19T12:17:50.965263478Z"},{"index":5,"name":"Concurrent editing 6","scenario_hash":"584437e679c8b24a0bf4808a5c63cb9db132c0478f826fb450d6b5d2205aef4b","mutation_count":1,"result":{"Total":1,"Killed":1,"Survived":0,"Errors":0},"tested_at":"2026-11-19T12:17:50.965263478Z"},{"index":6,"name":"Concurrent editing 7","scenario_hash":"567a3ed7678250c6c909b44e9c8540b3e58bedd296c8287eb8567095f7e15a3b","mutation_count":1,"result":{"Total":1,"Killed":1,"Survived":0,"Errors":0},"tested_at":"2026-11-19T12:17:50.965263478Z"},{"index":7,"name":"Concurrent editing 8","scenario_hash":"fe4381d55ffd9e4bf0a2fbae2575e18d7a5e27c30a33d5dd5b69a231802d389c","mutation_count":1,"result":{"Total":1,"Killed":1,"Survived":0,"Errors":0},"tested_at":"2026-11-19T12:17:50.965263478Z"},{"index":8,"name":"Concurrent editing 9","scenario_hash":"d32da3e66f941da882f4bd58e58c56df64370aaf61d4912dc80f3863d07dfbf0","mutation_count":2,"result":{"Total":2,"Killed":2,"Survived":0,"Errors":0},"tested_at":"2026-11-19T12:17:50.965263478Z"},{"index":9,"name":"Concurrent editing 10","scenario_hash":"c5fe7a2e4c340663a4ccd1a8ea3f5027a8a3a88b0b7c13462bb4aefa76942ad7","mutation_count":1,"result":{"Total":1,"Killed":1,"Survived":0,"Errors":0},"tested_at":"2026-11-19T12:17:50.965263478Z"},{"index":10,"name":"Concurrent editing 11","scenario_hash":"696e07be2727afaca6c9f86be8447e737587e0375acecfbfebda56b274c20855","mutation_count":4,"result":{"Total":4,"Killed":4,"Survived":0,"Errors":0},"tested_at":"2026-11-19T12:17:50.965263478Z"}]}
# acceptance-mutation-manifest-end

# Spec §7 (Conflictos). Two devices edit the same task without seeing the
# other's change (for example, one offline). The changes arrive in the
# order the steps appear: first mine, then the other
# device's.
#   The last change wins, per field of §4.1: an edit writes only the
#   fields it changed, so it does not overwrite the others.
#   recurrencia is replaced whole, never merged by subfield.
#   A field that does not belong to the kind (fechaLimite on a recurring task,
#   recurrencia on a one-off task) is ignored when deriving the status. When changing
#   kind, the task keeps only the kind fields the panel shows: a
#   residual value from a concurrent edit does not survive.
#   Edit versus deletion: the deletion wins; an edit of a task that no
#   longer exists does not revive it.
# The "its recurrence is ..." steps compare the whole recurrence, with no extra fields.
Feature: Concurrent editing

  # Concurrent editing 1
  # Different fields: the two changes are combined.
  Scenario Outline: Concurrent editing 1
    Given a relative recurring task <title> every <every> <unit>
    When I edit the title to <title_new>
    And another device, without seeing that change, edits the task to weekly recurring on <days>
    Then the task has title <title_stored>
    And its recurrence is weekly on <days_stored>

    Examples:
      | title  | every | unit   | title_new     | days           | title_stored    | days_stored    |
      | Regar  | 2    | dias   | Regar plantas | martes, jueves | Regar plantas   | martes, jueves |

  # Concurrent editing 2
  # The same field: the last change to arrive wins.
  Scenario Outline: Concurrent editing 2
    Given a one-off task <title> with due date <due_date>
    When I edit the title to <first>
    And another device, without seeing that change, edits the title to <second>
    Then the task has title <title_stored>
    And its due date is <due_date_stored>

    Examples:
      | title  | due_date   | first        | second          | title_stored    | due_date_stored |
      | Pagar  | 2026-07-14 | Pagar la luz | Pagar el gas    | Pagar el gas    | 2026-07-14      |

  # Concurrent editing 3
  # Guardar without changes writes nothing, so it does not overwrite the other's change.
  Scenario Outline: Concurrent editing 3
    Given a relative recurring task <title> every <every> <unit>
    When I edit the title to <title_new>
    And another device, without seeing that change, saves the task without changes
    Then the task has title <title_stored>
    And its recurrence is relative every <every_stored> <unit>

    Examples:
      | title  | every | unit   | title_new     | title_stored    | every_stored  |
      | Regar  | 2    | dias   | Regar plantas | Regar plantas   | 2             |

  # Concurrent editing 4
  # The recurrence is replaced whole: the last one remains, with no weekdays
  # mixed with the interval.
  Scenario Outline: Concurrent editing 4
    Given a relative recurring task every <every> <unit>
    When I edit the task to weekly recurring on <days>
    And another device, without seeing that change, edits the task to relative recurring every <every_other> <unit_other>
    Then its recurrence is relative every <every_stored> <unit_stored>

    Examples:
      | every | unit   | days           | every_other | unit_other  | every_stored  | unit_stored     |
      | 2    | dias   | martes, jueves | 8         | horas       | 8             | horas           |

  # Concurrent editing 5
  # The recurrence is replaced whole: from weekly to monthly on one side and to
  # relative on the other, the monthly one remains (the last one).
  Scenario Outline: Concurrent editing 5
    Given a weekly recurring task on <days>
    When I edit the task to relative recurring every <every> <unit>
    And another device, without seeing that change, edits the task to monthly recurring on days <days_month>
    Then its recurrence is monthly on days <days_stored>

    Examples:
      | days           | every | unit   | days_month | days_stored    |
      | martes, jueves | 3    | dias   | 10, 20   | 10, 20         |

  # Concurrent editing 6
  # I change a never-completed relative task to one-off; the other device only
  # changed the interval. It ends up one-off with a recurrence that does not
  # belong to it and is ignored: the status comes from the due date (as a
  # never-completed relative task it would be pending).
  Scenario Outline: Concurrent editing 6
    Given a relative recurring task never completed
    When I edit the task to one-off with due date <due_date>
    And another device, without seeing that change, edits the task to relative recurring every <every> <unit>
    And I query the status on <now>
    Then the task is one-off
    And the status is atrasada

    Examples:
      | due_date   | every | unit   | now                 |
      | 2026-07-14 | 6    | horas  | 2026-07-15T00:00:00 |

  # Concurrent editing 7
  # I change a one-off task to relative; the other device only changed the due
  # date. It ends up recurring with a due date that does not belong to it and it is
  # ignored: never completed, pending (as a one-off task it would be overdue).
  Scenario Outline: Concurrent editing 7
    Given a one-off task with due date <due_date>
    When I edit the task to relative recurring every <every> <unit>
    And another device, without seeing that change, edits the task to one-off with due date <due_date_other>
    And I query the status on <now>
    Then the task is recurring
    And the status is pendiente

    Examples:
      | due_date   | every | unit   | due_date_other | now                 |
      | 2026-07-20 | 2    | dias   | 2026-07-10  | 2026-07-15T10:00:00 |

  # Concurrent editing 8
  # The deletion wins: the edit that arrives later does not revive the task.
  Scenario Outline: Concurrent editing 8
    Given a relative recurring task <title> every <every> <unit>
    When I delete the task
    And another device, without seeing that change, edits the title to <title_new>
    And I query Pendientes at any moment
    Then no task remains

    Examples:
      | title  | every | unit   | title_new     |
      | Regar  | 2    | dias   | Regar plantas |

  # Concurrent editing 9
  # The deletion also wins if the edit arrives earlier.
  Scenario Outline: Concurrent editing 9
    Given a relative recurring task <title> every <every> <unit>
    When I edit the title to <title_new>
    And another device, without seeing that change, deletes the task
    And I query Pendientes at any moment
    Then no task remains

    Examples:
      | title  | every | unit   | title_new     |
      | Regar  | 2    | dias   | Regar plantas |

  # Concurrent editing 10
  # I change a one-off task to relative and the other device changes its due
  # date: it ends up recurring with a residual due date. On changing it to
  # one-off without a due date, the residue does not survive: it ends up without a due date.
  Scenario Outline: Concurrent editing 10
    Given a one-off task with due date <due_date>
    When I edit the task to relative recurring every <every> <unit>
    And another device, without seeing that change, edits the task to one-off with due date <due_date_other>
    And I edit the task to one-off without a due date
    Then the task is one-off
    And the task has no due date

    Examples:
      | due_date   | every | unit   | due_date_other |
      | 2026-07-20 | 2    | dias   | 2026-07-10  |

  # Concurrent editing 11
  # Mirror: I change a relative task to one-off and the other device changes its
  # interval: it ends up one-off with a residual recurrence. On changing it to
  # recurring, the recurrence chosen in the panel remains, not the residual one.
  Scenario Outline: Concurrent editing 11
    Given a relative recurring task every <every> <unit>
    When I edit the task to one-off with due date <due_date>
    And another device, without seeing that change, edits the task to relative recurring every <every_other> <unit_other>
    And I edit the task to weekly recurring on <days>
    Then the task is recurring
    And its recurrence is weekly on <days_stored>

    Examples:
      | every | unit   | due_date   | every_other | unit_other  | days           | days_stored    |
      | 2    | dias   | 2026-07-14 | 6         | horas       | martes, jueves | martes, jueves |
