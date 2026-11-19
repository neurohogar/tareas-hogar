# mutation-stamp: sha256=d4e870844b35eb8069ab62dda0687489f8bed2af7d6e1edb724aafe7bf8e5d75
# acceptance-mutation-manifest-begin
# {"version":1,"tested_at":"2026-11-16T02:02:22.245113394Z","feature_name":"Tocar el checkbox","feature_path":"features/tocar-checkbox.feature","background_hash":"74234e98afe7498fb5daf1f36ac2d78acc339464f950703b8c019892f982b90b","implementation_hash":"sha256:7635417019e618b216a035035028762048f83ef6289d4a93e6b0b710b6abfe0b","scenarios":[{"index":0,"name":"Tocar el checkbox 1","scenario_hash":"a7e2cbf087d271844bbfce02fb8391f5a489a5b521ef615080ea0aaa0464302a","mutation_count":8,"result":{"Total":8,"Killed":8,"Survived":0,"Errors":0},"tested_at":"2026-11-16T02:02:22.245113394Z"},{"index":1,"name":"Tocar el checkbox 2","scenario_hash":"260eab56cd815e7ad9d8241c9229de2fe0518b5046413173d568b2eeefccbe99","mutation_count":24,"result":{"Total":24,"Killed":24,"Survived":0,"Errors":0},"tested_at":"2026-11-16T02:02:22.245113394Z"},{"index":2,"name":"Tocar el checkbox 3","scenario_hash":"435bb1a4bd7a6e01db91ef49d306fb2a8796701632e083af5ad9d4ec0dd129c3","mutation_count":3,"result":{"Total":3,"Killed":3,"Survived":0,"Errors":0},"tested_at":"2026-11-16T02:02:22.245113394Z"},{"index":3,"name":"Tocar el checkbox 4","scenario_hash":"eeeb7a966c8b094bb4d0e258dc067e9a1b7dca76a049daa0b48a7953bb4a4145","mutation_count":2,"result":{"Total":2,"Killed":2,"Survived":0,"Errors":0},"tested_at":"2026-11-16T02:02:22.245113394Z"},{"index":4,"name":"Tocar el checkbox 5","scenario_hash":"65034db33507782c0404c21a84c7cea6d3ad101284cc34fdad71e3bca28a0286","mutation_count":18,"result":{"Total":18,"Killed":18,"Survived":0,"Errors":0},"tested_at":"2026-11-16T02:02:22.245113394Z"},{"index":5,"name":"Tocar el checkbox 6","scenario_hash":"9cf6b5d8671bc39906913a0a8356f5d5a7b58fb39962fd5b4faad1e03c933234","mutation_count":26,"result":{"Total":26,"Killed":26,"Survived":0,"Errors":0},"tested_at":"2026-11-16T02:02:22.245113394Z"},{"index":6,"name":"Tocar el checkbox 7","scenario_hash":"03c07935ce00f6c23a4ad4a6fa4559ae8381a0f2e0ee2efdff01955c2423e5f7","mutation_count":11,"result":{"Total":11,"Killed":11,"Survived":0,"Errors":0},"tested_at":"2026-11-16T02:02:22.245113394Z"},{"index":7,"name":"Tocar el checkbox 8","scenario_hash":"2e588e9c2b90ec5650a5746fc7807982caa9e9c727d6be9e8782e578605c59eb","mutation_count":13,"result":{"Total":13,"Killed":13,"Survived":0,"Errors":0},"tested_at":"2026-11-16T02:02:22.245113394Z"},{"index":8,"name":"Tocar el checkbox 9","scenario_hash":"d401dab85af81d7522f9b252caa893c07ce66948fd0a61f5d946690717be0468","mutation_count":25,"result":{"Total":25,"Killed":25,"Survived":0,"Errors":0},"tested_at":"2026-11-16T02:02:22.245113394Z"},{"index":9,"name":"Tocar el checkbox 10","scenario_hash":"6375a9b7deeaca1e45206a18696128f5b2ca67cde29c4d00286cdbcf0aea0235","mutation_count":14,"result":{"Total":14,"Killed":14,"Survived":0,"Errors":0},"tested_at":"2026-11-16T02:02:22.245113394Z"}]}
# acceptance-mutation-manifest-end

# Spec §6.1 (row checkbox), with §5.1–§5.4. Tapping the checkbox of a
# task that is not completed completes it (as in §4.4). Tapping the checkbox of a
# completed one:
#   one-off: deletes its most recent completion (the one with the greatest completadoEn),
#     like Deshacer;
#   recurring whose most recent completion is from today or later (local day
#     of completadoEn; later with skewed clocks): deletes it the same way;
#   recurring whose most recent completion is from an earlier day: completes
#     it again (relative: restarts the interval; calendar: covers
#     the next occurrence).
# When deleting, the task returns to the status that corresponds to the remaining
# completions; it can still be completed if it has another one and is still waiting.
# A task is completed if it is one-off with at least one completion, or
# recurring and waiting with at least one completion. Completed tasks only
# have a row with Mostrar completadas on. The day starts at 00:00.
# "I tap the task checkbox on ..." taps the checkbox of the only
# task in the scenario at that time. That no notice appears when deleting a
# completion with the checkbox is verified in the QA suite.
# Progress is a fraction between 0 and 1, compared exactly.
# Reference week: Monday 2026-07-13 to Sunday 2026-07-19.
Feature: Tap the checkbox

  # Tap the checkbox 1
  # A one-off task not completed: tapping the checkbox completes it and it leaves
  # Pendientes.
  Scenario Outline: Tap the checkbox 1
    Given a one-off task without a due date
    When I tap the task checkbox on <tap>
    And I query the status at any moment
    Then a completion without a covered occurrence was recorded
    And the recorded completion is from <tap_stored>
    And the task does not appear in Pendientes

    Examples:
      | tap                 | tap_stored          |
      | 2026-07-15T08:00:00 | 2026-07-15T08:00:00 |

  # Tap the checkbox 2
  # A recurring task with completions but pending (row 1) or overdue (row 2)
  # is not completed: tapping the checkbox adds a new completion, it does not
  # delete the previous one.
  Scenario Outline: Tap the checkbox 2
    Given a relative recurring task every <every> <unit>
    And the task was completed on <previous>
    When I tap the task checkbox on <tap>
    And I query the status on <now>
    Then the new completion is added without changing the previous ones
    And the status is en espera
    And the progress is <progress>

    Examples:
      | every | unit   | previous            | tap                 | now                 | progress |
      | 4    | horas  | 2026-07-15T08:00:00 | 2026-07-15T13:00:00 | 2026-07-15T14:00:00 | 0.25     |
      | 4    | horas  | 2026-07-15T08:00:00 | 2026-07-15T16:00:00 | 2026-07-15T18:00:00 | 0.5      |

  # Tap the checkbox 3
  # A completed one-off: tapping the checkbox deletes its completion and it returns to
  # pending until the end of the due day.
  Scenario Outline: Tap the checkbox 3
    Given Mostrar completadas is on
    And a one-off task with due date <due_date>
    And the task was completed on <completed>
    When I tap the task checkbox on <tap>
    And I query the status on <now>
    Then the task has no completions
    And the status is pendiente

    Examples:
      | due_date   | completed           | tap                 | now                 |
      | 2026-07-15 | 2026-07-14T10:00:00 | 2026-07-15T23:59:00 | 2026-07-15T23:59:59 |

  # Tap the checkbox 4
  # A completed one-off returns as overdue if the due day has already passed.
  Scenario Outline: Tap the checkbox 4
    Given Mostrar completadas is on
    And a one-off task with due date <due_date>
    And the task was completed on <completed>
    When I tap the task checkbox on <tap>
    And I query the status on <now>
    Then the task has no completions
    And the status is atrasada

    Examples:
      | due_date   | completed           | tap                 | now                 |
      | 2026-07-15 | 2026-07-14T10:00:00 | 2026-07-16T00:00:00 | 2026-07-16T00:00:01 |

  # Tap the checkbox 5
  # A one-off with two completions (two offline devices): tapping the
  # checkbox deletes only the most recent one, regardless of the order in which they were
  # recorded (row 2); with the other one, it is still completed.
  Scenario Outline: Tap the checkbox 5
    Given Mostrar completadas is on
    And a one-off task without a due date
    And the task was completed on <first>
    And the task was completed on <second>
    When I tap the task checkbox on <tap>
    And I query the status at any moment
    Then the task keeps a single completion, from <remains>
    And the task is completed

    Examples:
      | first               | second              | tap                 | remains             |
      | 2026-07-14T10:00:00 | 2026-07-14T10:05:00 | 2026-07-15T08:00:00 | 2026-07-14T10:00:00 |
      | 2026-07-14T10:05:00 | 2026-07-14T10:00:00 | 2026-07-15T08:00:00 | 2026-07-14T10:00:00 |

  # Tap the checkbox 6
  # A waiting relative with two completions: tapping the checkbox deletes the
  # most recent one; U moves to the earlier one, with which it is already due, and it becomes pending
  # (not completed). Row 2: the most recent one was recorded first.
  Scenario Outline: Tap the checkbox 6
    Given Mostrar completadas is on
    And a relative recurring task every <every> <unit>
    And the task was completed on <first>
    And the task was completed on <second>
    When I tap the task checkbox on <tap>
    And I query the status on <now>
    Then the task keeps a single completion, from <remains>
    And the status is pendiente

    Examples:
      | every | unit   | first               | second              | tap                 | now                 | remains             |
      | 2    | dias   | 2026-07-13T09:00:00 | 2026-07-15T09:00:00 | 2026-07-15T10:00:00 | 2026-07-15T12:00:00 | 2026-07-13T09:00:00 |
      | 2    | dias   | 2026-07-15T09:00:00 | 2026-07-13T09:00:00 | 2026-07-15T10:00:00 | 2026-07-15T12:00:00 | 2026-07-13T09:00:00 |

  # Tap the checkbox 7
  # A waiting relative with a single completion from today: tapping the checkbox
  # deletes it and it goes back to "never completed" (pending). Row 2: completion at
  # 00:00 and tap at 23:59:59, the same day. Row 3: "future" completion
  # (skewed clocks), later than today: it is also deleted.
  Scenario Outline: Tap the checkbox 7
    Given Mostrar completadas is on
    And a relative recurring task every <every> <unit>
    And the task was completed on <completed>
    When I tap the task checkbox on <tap>
    And I query the status on <now>
    Then the task has no completions
    And the status is pendiente

    Examples:
      | every | unit   | completed           | tap                 | now                 |
      | 2    | dias   | 2026-07-15T09:00:00 | 2026-07-15T10:00:00 | 2026-07-15T12:00:00 |
      | 2    | dias   | 2026-07-15T00:00:00 | 2026-07-15T23:59:59 | 2026-07-16T00:00:00 |
      | 2    | dias   | 2026-07-16T09:00:00 | 2026-07-15T12:00:00 | 2026-07-15T12:00:01 |

  # Tap the checkbox 8
  # A waiting weekly with two completions, the most recent from today: tapping
  # the checkbox deletes it; P moves to the occurrence of the remaining one and, as N is still in the
  # future, it is still waiting and completed.
  Scenario Outline: Tap the checkbox 8
    Given Mostrar completadas is on
    And a weekly recurring task on <days>
    And the task has a completion from <first> that covers <covered_first>
    And the task has a completion from <second> that covers <covered_second>
    When I tap the task checkbox on <tap>
    And I query the status on <now>
    Then the task keeps a single completion, from <remains>
    And the status is en espera
    And the task is completed

    Examples:
      | days           | first               | covered_first    | second              | covered_second   | tap                 | now                 | remains             |
      | martes, jueves | 2026-07-14T10:00:00 | 2026-07-14       | 2026-07-15T08:00:00 | 2026-07-16       | 2026-07-15T12:00:00 | 2026-07-15T12:00:01 | 2026-07-14T10:00:00 |

  # Tap the checkbox 9
  # A waiting relative whose most recent completion is from an earlier
  # day: tapping the checkbox completes it again and restarts the interval
  # from the tap. Row 2: completion at 23:59:59 yesterday and tap at
  # 00:00 today.
  Scenario Outline: Tap the checkbox 9
    Given Mostrar completadas is on
    And a relative recurring task every <every> <unit>
    And the task was completed on <previous>
    When I tap the task checkbox on <tap>
    And I query the status on <now>
    Then the new completion is added without changing the previous ones
    And the status is en espera
    And the progress is <progress>
    And the task is completed

    Examples:
      | every | unit   | previous            | tap                 | now                 | progress |
      | 2    | dias   | 2026-07-14T20:00:00 | 2026-07-15T08:00:00 | 2026-07-16T08:00:00 | 0.5      |
      | 2    | dias   | 2026-07-14T23:59:59 | 2026-07-15T00:00:00 | 2026-07-15T12:00:00 | 0.25     |

  # Tap the checkbox 10
  # A waiting weekly whose most recent completion is from an earlier
  # day: tapping the checkbox completes it again and covers the next
  # occurrence (completing ahead of time). Row 1: completion on Monday that
  # covered Tuesday; on early Tuesday it covers Thursday. Row 2: completion
  # at 23:59:59 on Monday and tap at 00:00 on Tuesday.
  Scenario Outline: Tap the checkbox 10
    Given Mostrar completadas is on
    And a weekly recurring task on <days>
    And the task has a completion from <previous> that covers <covered_previous>
    When I tap the task checkbox on <tap>
    And I query the status on <now>
    Then the new completion is added without changing the previous ones
    And a completion was recorded that covers <covered>
    And the status is en espera
    And the task is completed

    Examples:
      | days           | previous            | covered_previous  | tap                 | now                 | covered    |
      | martes, jueves | 2026-07-13T10:00:00 | 2026-07-14        | 2026-07-14T08:00:00 | 2026-07-14T12:00:00 | 2026-07-16 |
      | martes, jueves | 2026-07-13T23:59:59 | 2026-07-14        | 2026-07-14T00:00:00 | 2026-07-14T12:00:00 | 2026-07-16 |
