# mutation-stamp: sha256=b468106d784b0d9088d7a0eedfcce5b917f8b19166b2a3a836f536aaaea766b0
# acceptance-mutation-manifest-begin
# {"version":1,"tested_at":"2026-11-17T20:53:26.316043611Z","feature_name":"Edición concurrente","feature_path":"features/edicion-concurrente.feature","background_hash":"74234e98afe7498fb5daf1f36ac2d78acc339464f950703b8c019892f982b90b","implementation_hash":"sha256:6b7aa2a0f3ac15121d83a24023ff1a93cef541e75db439f394f7bcb50ae4edb0","scenarios":[{"index":0,"name":"Edición concurrente 1","scenario_hash":"1567fccc03912bb8e9e27ab1872dce1ae6d8324318411dfca6982cae06c62137","mutation_count":5,"result":{"Total":5,"Killed":5,"Survived":0,"Errors":0},"tested_at":"2026-11-17T20:53:26.316043611Z"},{"index":1,"name":"Edición concurrente 2","scenario_hash":"e2b0af26a8906ae3ca74e04d176b4e6ac319bf07c0876c880c4fe9b7ca15ea51","mutation_count":6,"result":{"Total":6,"Killed":6,"Survived":0,"Errors":0},"tested_at":"2026-11-17T20:53:26.316043611Z"},{"index":2,"name":"Edición concurrente 3","scenario_hash":"9f8a9404c6c2441562015ceeab400bbfbf79211244237f2a33310ec47e0f4ce8","mutation_count":5,"result":{"Total":5,"Killed":5,"Survived":0,"Errors":0},"tested_at":"2026-11-17T20:53:26.316043611Z"},{"index":3,"name":"Edición concurrente 4","scenario_hash":"863ff36b130153deeaa20a48302e90c7c0e72173049a3610a151008183dc4d5f","mutation_count":6,"result":{"Total":6,"Killed":6,"Survived":0,"Errors":0},"tested_at":"2026-11-17T20:53:26.316043611Z"},{"index":4,"name":"Edición concurrente 5","scenario_hash":"49db98b6537c586e1ae9e08d9c0122e62805d94b192958720321b70e4ba361ab","mutation_count":4,"result":{"Total":4,"Killed":4,"Survived":0,"Errors":0},"tested_at":"2026-11-17T20:53:26.316043611Z"},{"index":5,"name":"Edición concurrente 6","scenario_hash":"ed1d69f292ae63dafea5cd44457f67c0c1c093215bc1924b65c8bf586c7688a1","mutation_count":4,"result":{"Total":4,"Killed":4,"Survived":0,"Errors":0},"tested_at":"2026-11-17T20:53:26.316043611Z"},{"index":6,"name":"Edición concurrente 7","scenario_hash":"8913ca206a1de4182aec5a78da4b6509d34a27b27778769949f1c74802f44d63","mutation_count":2,"result":{"Total":2,"Killed":2,"Survived":0,"Errors":0},"tested_at":"2026-11-17T20:53:26.316043611Z"},{"index":7,"name":"Edición concurrente 8","scenario_hash":"b75e2e0421fbc8f7f159cd9144ccffd2aac4fb47ed31ff507c89621ddbdffafc","mutation_count":1,"result":{"Total":1,"Killed":1,"Survived":0,"Errors":0},"tested_at":"2026-11-17T20:53:26.316043611Z"},{"index":8,"name":"Edición concurrente 9","scenario_hash":"64db684f7382d63804cd908561ca5f6f5b7c190af9fd240606341a4973ed7916","mutation_count":2,"result":{"Total":2,"Killed":2,"Survived":0,"Errors":0},"tested_at":"2026-11-17T20:53:26.316043611Z"},{"index":9,"name":"Edición concurrente 10","scenario_hash":"c56f22078f0b79475397d250035c747f43a8dee47227d10b1dd2632f8fe47227","mutation_count":1,"result":{"Total":1,"Killed":1,"Survived":0,"Errors":0},"tested_at":"2026-11-17T20:53:26.316043611Z"},{"index":10,"name":"Edición concurrente 11","scenario_hash":"cf270a849d27873dbb76a2ec73f86f43058c5fec7a7d767a5dc7b1b68d8b72d4","mutation_count":4,"result":{"Total":4,"Killed":4,"Survived":0,"Errors":0},"tested_at":"2026-11-17T20:53:26.316043611Z"}]}
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
