# mutation-stamp: sha256=2489c3c3e83f6fdd4d9cee466f7ea9606a1eae5668a8537d92bc6b10d0315dd9
# acceptance-mutation-manifest-begin
# {"version":1,"tested_at":"2026-11-24T02:59:32.030723727Z","feature_name":"Tap the checkbox","feature_path":"features/tap-checkbox.feature","background_hash":"74234e98afe7498fb5daf1f36ac2d78acc339464f950703b8c019892f982b90b","implementation_hash":"sha256:9f3b0aa3e4028c0568de98d286f0db32eeb034fd88407f2bda3bba31c0a829e0","scenarios":[{"index":0,"name":"Tap the checkbox 1","scenario_hash":"a20939ab25f644fbcf574efb81930cf58c37713be67553cfe40e1ec3a3288883","mutation_count":8,"result":{"Total":8,"Killed":8,"Survived":0,"Errors":0},"tested_at":"2026-11-24T02:59:32.030723727Z"},{"index":1,"name":"Tap the checkbox 2","scenario_hash":"6a9871a4cd0077873f4c62573b787ff4df60a6b7891c44e1bdef00649f767230","mutation_count":24,"result":{"Total":24,"Killed":24,"Survived":0,"Errors":0},"tested_at":"2026-11-24T02:59:32.030723727Z"},{"index":2,"name":"Tap the checkbox 6","scenario_hash":"85b7a26a50a939a2f0d1a6e87ab1be07fb3a2a558cbed3811b2266df0e5c7a8e","mutation_count":26,"result":{"Total":26,"Killed":26,"Survived":0,"Errors":0},"tested_at":"2026-11-24T02:59:32.030723727Z"},{"index":3,"name":"Tap the checkbox 7","scenario_hash":"9ef2ed20512250cd4e31d571ca52077d15ee88c430d62d3e76a6872d0b545980","mutation_count":10,"result":{"Total":10,"Killed":10,"Survived":0,"Errors":0},"tested_at":"2026-11-24T02:59:32.030723727Z"},{"index":4,"name":"Tap the checkbox 8","scenario_hash":"814a83ca32faecc5a99f2b03cf8e6985350c544565d90ee7f98a802dc8beca41","mutation_count":13,"result":{"Total":13,"Killed":13,"Survived":0,"Errors":0},"tested_at":"2026-11-24T02:59:32.030723727Z"},{"index":5,"name":"Tap the checkbox 9","scenario_hash":"c9cf17b90cffe480f4392f02f1d69aafd446045a73a86f6ed32b628b2c16b7d7","mutation_count":25,"result":{"Total":25,"Killed":25,"Survived":0,"Errors":0},"tested_at":"2026-11-24T02:59:32.030723727Z"},{"index":6,"name":"Tap the checkbox 10","scenario_hash":"e8c90aa28d23cba7b021ce6ceae21fd1b2d4441fddc6b18167b87b00d03f4655","mutation_count":14,"result":{"Total":14,"Killed":14,"Survived":0,"Errors":0},"tested_at":"2026-11-24T02:59:32.030723727Z"}]}
# acceptance-mutation-manifest-end

# Spec §6.1 (row checkbox), with §5.1–§5.4. Tapping the checkbox of a
# task that is not completed completes it (as in §4.4). A completed one-off task
# has no row in Pendientes, so it has no checkbox to tap: it is un-completed only
# with Deshacer or from the Historial. Tapping the checkbox of a completed
# recurring task:
#   whose most recent completion is from today or later (local day
#     of completadoEn; later with skewed clocks): deletes it (the one with the
#     greatest completadoEn), like Deshacer;
#   whose most recent completion is from an earlier day: completes
#     it again (relative: restarts the interval; calendar: covers
#     the next occurrence).
# When deleting, the task returns to the status that corresponds to the remaining
# completions; it can still be completed if it has another one and is still waiting.
# A task is completed if it is one-off with at least one completion, or
# recurring and waiting with at least one completion. Completed recurring tasks only
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
