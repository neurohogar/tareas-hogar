# mutation-stamp: sha256=07eacd1d58e3e6ee107c6ee2b1bdac2e1120838313d3416a2db05ba2126342bc
# acceptance-mutation-manifest-begin
# {"version":1,"tested_at":"2026-11-16T01:39:32.163869912Z","feature_name":"Completar con horario","feature_path":"features/completar-con-horario.feature","background_hash":"74234e98afe7498fb5daf1f36ac2d78acc339464f950703b8c019892f982b90b","implementation_hash":"sha256:2b7009723e953ffe8a3d64fdb293c78d03a5d57aca6067f3c0d20c372133ac11","scenarios":[{"index":0,"name":"Completar con horario 1","scenario_hash":"a28cc5deaf366e9dbfd84eb0cebc5d5abe5c7a1c2d9e6af79a582a6d533ff0f2","mutation_count":6,"result":{"Total":6,"Killed":6,"Survived":0,"Errors":0},"tested_at":"2026-11-16T01:39:32.163869912Z"},{"index":1,"name":"Completar con horario 2","scenario_hash":"49f6925102075e4f7c0c3e368e8d4156bf29dda6fea1b44381fb591f58396017","mutation_count":8,"result":{"Total":8,"Killed":8,"Survived":0,"Errors":0},"tested_at":"2026-11-16T01:39:32.163869912Z"},{"index":2,"name":"Completar con horario 3","scenario_hash":"edca00f66047ff795e93ebfb48bb8cdba667ddeee0f7247bc5c66a315288b00a","mutation_count":12,"result":{"Total":12,"Killed":12,"Survived":0,"Errors":0},"tested_at":"2026-11-16T01:39:32.163869912Z"},{"index":3,"name":"Completar con horario 4","scenario_hash":"ffe099ddb70b89d7ff94368880900a7e4fda9b9bbcb9a1983b27479a826528d6","mutation_count":7,"result":{"Total":7,"Killed":7,"Survived":0,"Errors":0},"tested_at":"2026-11-16T01:39:32.163869912Z"},{"index":4,"name":"Completar con horario 5","scenario_hash":"11d89972db553a8bfb623455f22fdad0cca12a9defa46ab164da817402dd43ea","mutation_count":5,"result":{"Total":5,"Killed":5,"Survived":0,"Errors":0},"tested_at":"2026-11-16T01:39:32.163869912Z"},{"index":5,"name":"Completar con horario 6","scenario_hash":"ac87e5e34fbf76bfb348d3d5396936a03146b2fc86be6779eb957ccd977e50a1","mutation_count":10,"result":{"Total":10,"Killed":10,"Survived":0,"Errors":0},"tested_at":"2026-11-16T01:39:32.163869912Z"},{"index":6,"name":"Completar con horario 7","scenario_hash":"161648324a87ec5a3ab40b4b5ab28adfcb291ce0f5cf60eaff1e237310395585","mutation_count":13,"result":{"Total":13,"Killed":13,"Survived":0,"Errors":0},"tested_at":"2026-11-16T01:39:32.163869912Z"},{"index":7,"name":"Completar con horario 8","scenario_hash":"c1639680d589d4998b65e05f4d67751f305ed9384d1ea1fa0ba6f855719fc38b","mutation_count":7,"result":{"Total":7,"Killed":7,"Survived":0,"Errors":0},"tested_at":"2026-11-16T01:39:32.163869912Z"},{"index":8,"name":"Completar con horario 9","scenario_hash":"a12cde7ab013c92560f611fb0408f5b5fb852bc3ad34e9f28e6acb8c40f042e2","mutation_count":5,"result":{"Total":5,"Killed":5,"Survived":0,"Errors":0},"tested_at":"2026-11-16T01:39:32.163869912Z"},{"index":9,"name":"Completar con horario 10","scenario_hash":"d1a965533bbac47ca651991b5bfbf48e04124d475a83c5115d67c9cef11a8958","mutation_count":6,"result":{"Total":6,"Killed":6,"Survived":0,"Errors":0},"tested_at":"2026-11-16T01:39:32.163869912Z"},{"index":10,"name":"Completar con horario 11","scenario_hash":"54d655d979926c487f6974b305383203ce919fe84867b5cc306c772b6079a678","mutation_count":2,"result":{"Total":2,"Killed":2,"Survived":0,"Errors":0},"tested_at":"2026-11-16T01:39:32.163869912Z"},{"index":11,"name":"Completar con horario 12","scenario_hash":"f324fe61db17bfc32a4e4024a1a5bde685845935a09b6179253a62ca38eb831c","mutation_count":5,"result":{"Total":5,"Killed":5,"Survived":0,"Errors":0},"tested_at":"2026-11-16T01:39:32.163869912Z"},{"index":12,"name":"Completar con horario 13","scenario_hash":"284d9e01639e9e378100fdba3d221ef9ca5c527906feaab032fe1323db75c6ab","mutation_count":8,"result":{"Total":8,"Killed":8,"Survived":0,"Errors":0},"tested_at":"2026-11-16T01:39:32.163869912Z"},{"index":13,"name":"Completar con horario 14","scenario_hash":"24d325133ad3894ec02195820b9193c56dead01551c74c8a07b8de4b4a022fc7","mutation_count":12,"result":{"Total":12,"Killed":12,"Survived":0,"Errors":0},"tested_at":"2026-11-16T01:39:32.163869912Z"},{"index":14,"name":"Completar con horario 15","scenario_hash":"0a399abcfe691dfe96f29657204067859d041b630444615b3d4790311563f7af","mutation_count":7,"result":{"Total":7,"Killed":7,"Survived":0,"Errors":0},"tested_at":"2026-11-16T01:39:32.163869912Z"},{"index":15,"name":"Completar con horario 16","scenario_hash":"58d235dcefe256b7ec9450b61e974c75c5b2afac36c2aae24019606dcb13bb96","mutation_count":4,"result":{"Total":4,"Killed":4,"Survived":0,"Errors":0},"tested_at":"2026-11-16T01:39:32.163869912Z"}]}
# acceptance-mutation-manifest-end

# Spec §5.5 and §6.1 (row checkbox and Mostrar completadas), with §5.2–§5.4.
# Completing is only possible inside the window [from, to): if tapping the
# checkbox would complete the task and it is now outside its window, the checkbox
# is disabled and tapping it does nothing. If tapping it would delete a completion
# (completed one-off, or completed recurring whose most recent completion
# is from today or later), it is always enabled. Undo in the notice
# can also be done at any time.
# Once overdue, it stays overdue outside the windows, but it can only be
# completed inside one. The completion is governed by §5.2/§5.3 as usual.
# A task waiting because of its schedule that has completions is completed: with
# Mostrar completadas off it is not shown until the window opens. One
# waiting with no completions is not completed and is shown.
# "the task can be completed from X to Y" is the task's schedule.
# "I query Pendientes on <now>" looks at the row of the only task in the
# scenario at that moment.
# Progress is a fraction between 0 and 1, compared exactly.
# Reference week: Monday 2026-07-13 to Sunday 2026-07-19.
Feature: Complete with schedule

  # Complete with schedule 1
  # Inside the window, the checkbox of a non-completed task is enabled.
  # Row 1: the from is inclusive.
  Scenario Outline: Complete with schedule 1
    Given a one-off task without a due date created on <created>
    And the task can be completed from <from> to <to>
    When I query Pendientes on <now>
    Then the task checkbox is enabled

    Examples:
      | created             | from  | to    | now                 |
      | 2026-07-15T06:00:00 | 08:00 | 11:00 | 2026-07-15T08:00:00 |
      | 2026-07-15T06:00:00 | 08:00 | 11:00 | 2026-07-15T10:59:59 |

  # Complete with schedule 2
  # Outside the window, the checkbox of a non-completed task is
  # disabled. Row 2: the to is exclusive.
  Scenario Outline: Complete with schedule 2
    Given a one-off task without a due date created on <created>
    And the task can be completed from <from> to <to>
    When I query Pendientes on <now>
    Then the task checkbox is disabled

    Examples:
      | created             | from  | to    | now                 |
      | 2026-07-15T06:00:00 | 08:00 | 11:00 | 2026-07-15T07:59:59 |
      | 2026-07-15T06:00:00 | 08:00 | 11:00 | 2026-07-15T11:00:00 |
      | 2026-07-15T06:00:00 | 08:00 | 11:00 | 2026-07-16T03:00:00 |

  # Complete with schedule 3
  # An overdue task outside the window has the checkbox disabled. Row
  # 1: overdue before the window opens (V + interval at 18:00).
  Scenario Outline: Complete with schedule 3
    Given a relative recurring task every <every> <unit>
    And the task was completed on <completed>
    And the task can be completed from <from> to <to>
    When I query Pendientes on <now>
    Then the task checkbox is disabled

    Examples:
      | every | unit   | completed           | from  | to    | now                 |
      | 4    | horas  | 2026-07-15T10:00:00 | 08:00 | 11:00 | 2026-07-15T20:00:00 |
      | 1    | dias   | 2026-07-15T09:00:00 | 08:00 | 11:00 | 2026-07-16T11:00:00 |

  # Complete with schedule 4
  # An overdue task inside the next window has the checkbox enabled.
  Scenario Outline: Complete with schedule 4
    Given a relative recurring task every <every> <unit>
    And the task was completed on <completed>
    And the task can be completed from <from> to <to>
    When I query Pendientes on <now>
    Then the task checkbox is enabled

    Examples:
      | every | unit   | completed           | from  | to    | now                 |
      | 4    | horas  | 2026-07-15T10:00:00 | 08:00 | 11:00 | 2026-07-16T08:00:00 |
      | 1    | dias   | 2026-07-15T09:00:00 | 08:00 | 11:00 | 2026-07-17T09:00:00 |

  # Complete with schedule 5
  # Tapping the disabled checkbox registers no completion.
  Scenario Outline: Complete with schedule 5
    Given a one-off task without a due date created on <created>
    And the task can be completed from <from> to <to>
    When I tap the task checkbox on <tap>
    Then the task has no completions

    Examples:
      | created             | from  | to    | tap                 |
      | 2026-07-15T06:00:00 | 08:00 | 11:00 | 2026-07-15T07:00:00 |
      | 2026-07-15T06:00:00 | 08:00 | 11:00 | 2026-07-15T11:00:00 |

  # Complete with schedule 6
  # Tapping the checkbox inside the window completes the task and it leaves
  # Pendientes.
  Scenario Outline: Complete with schedule 6
    Given a one-off task without a due date created on <created>
    And the task can be completed from <from> to <to>
    When I tap the task checkbox on <tap>
    And I query the status at any moment
    Then a completion without a covered occurrence was recorded
    And the recorded completion is from <tap_stored>
    And the task does not appear in Pendientes

    Examples:
      | created             | from  | to    | tap                 | tap_stored          |
      | 2026-07-15T06:00:00 | 08:00 | 11:00 | 2026-07-15T10:59:59 | 2026-07-15T10:59:59 |

  # Complete with schedule 7
  # An overdue relative is completed in the next window: it restarts the
  # interval from the tap (V = 18 at 08:00, inside the window).
  Scenario Outline: Complete with schedule 7
    Given a relative recurring task every <every> <unit>
    And the task was completed on <previous>
    And the task can be completed from <from> to <to>
    When I tap the task checkbox on <tap>
    And I query the status on <now>
    Then the new completion is added without changing the previous ones
    And the status is en espera
    And the progress is <progress>

    Examples:
      | every | unit   | previous            | from  | to    | tap                 | now                 | progress |
      | 1    | dias   | 2026-07-15T09:00:00 | 08:00 | 11:00 | 2026-07-17T08:00:00 | 2026-07-17T20:00:00 | 0.5      |

  # Complete with schedule 8
  # A calendar task overdue since the close of Thursday is completed on
  # Friday inside the window: it covers Thursday, as in §5.3. With a schedule,
  # the covered occurrence is stored with the from time of its window (§4.4).
  Scenario Outline: Complete with schedule 8
    Given a weekly recurring task on <days>
    And the task has a completion from <previous> that covers <covered_previous>
    And the task can be completed from <from> to <to>
    When I tap the task checkbox on <tap>
    Then the new completion is added without changing the previous ones
    And a completion was recorded that covers <covered>

    Examples:
      | days           | previous            | covered_previous  | from  | to    | tap                 | covered             |
      | martes, jueves | 2026-07-14T08:00:00 | 2026-07-14        | 08:00 | 11:00 | 2026-07-17T09:00:00 | 2026-07-16T08:00:00 |

  # Complete with schedule 9
  # A completed recurring task whose most recent completion is from a previous
  # day: tapping the checkbox would complete it again, so outside the
  # window it is disabled.
  Scenario Outline: Complete with schedule 9
    Given Mostrar completadas is on
    And a relative recurring task every <every> <unit>
    And the task was completed on <completed>
    And the task can be completed from <from> to <to>
    When I query Pendientes on <now>
    Then the task is completed
    And the task checkbox is disabled

    Examples:
      | every | unit   | completed           | from  | to    | now                 |
      | 3    | dias   | 2026-07-14T09:00:00 | 08:00 | 11:00 | 2026-07-15T12:00:00 |

  # Complete with schedule 10
  # The same completed recurring task, inside the window: tapping the checkbox
  # completes it again.
  Scenario Outline: Complete with schedule 10
    Given Mostrar completadas is on
    And a relative recurring task every <every> <unit>
    And the task was completed on <completed>
    And the task can be completed from <from> to <to>
    When I tap the task checkbox on <tap>
    Then the new completion is added without changing the previous ones

    Examples:
      | every | unit   | completed           | from  | to    | tap                 |
      | 3    | dias   | 2026-07-14T09:00:00 | 08:00 | 11:00 | 2026-07-15T09:00:00 |

  # Complete with schedule 11
  # A completed one-off, outside the window: the checkbox would delete its
  # completion, so it is enabled: tapping it deletes it and the task goes back to
  # waiting until the next window.
  Scenario Outline: Complete with schedule 11
    Given Mostrar completadas is on
    And a one-off task without a due date created on <created>
    And the task was completed on <completed>
    And the task can be completed from <from> to <to>
    When I tap the task checkbox on <tap>
    And I query the status on <now>
    Then the task has no completions
    And the status is en espera

    Examples:
      | created             | completed           | from  | to    | tap                 | now                 |
      | 2026-07-15T06:00:00 | 2026-07-15T09:00:00 | 08:00 | 11:00 | 2026-07-15T20:00:00 | 2026-07-15T20:00:01 |

  # Complete with schedule 12
  # A recurring task completed today, outside the window: the checkbox would delete
  # its completion, so it is enabled: tapping it deletes it.
  Scenario Outline: Complete with schedule 12
    Given Mostrar completadas is on
    And a relative recurring task every <every> <unit>
    And the task was completed on <completed>
    And the task can be completed from <from> to <to>
    When I tap the task checkbox on <tap>
    Then the task has no completions

    Examples:
      | every | unit   | completed           | from  | to    | tap                 |
      | 3    | dias   | 2026-07-15T09:00:00 | 08:00 | 11:00 | 2026-07-15T20:00:00 |

  # Complete with schedule 13
  # Undo in the notice can be done even though the window has already closed.
  Scenario Outline: Complete with schedule 13
    Given a one-off task without a due date created on <created>
    And the task can be completed from <from> to <to>
    When I tap the task checkbox on <tap>
    And I tap Deshacer in the notice on <undo>
    Then the task has no completions

    Examples:
      | created             | from  | to    | tap                 | undo                |
      | 2026-07-15T06:00:00 | 08:00 | 11:00 | 2026-07-15T10:59:58 | 2026-07-15T11:00:02 |

  # Complete with schedule 14
  # With Mostrar completadas off, a recurring task waiting because of its schedule with
  # completions is completed and is not shown: V has already passed (without a schedule it would be
  # pending) but the window has not opened yet.
  Scenario Outline: Complete with schedule 14
    Given a relative recurring task every <every> <unit>
    And the task was completed on <completed>
    And the task can be completed from <from> to <to>
    When I query Pendientes on <now>
    Then the task does not appear in Pendientes

    Examples:
      | every | unit   | completed           | from  | to    | now                 |
      | 1    | dias   | 2026-07-15T12:00:00 | 08:00 | 11:00 | 2026-07-16T14:00:00 |
      | 1    | dias   | 2026-07-15T12:00:00 | 08:00 | 11:00 | 2026-07-17T07:59:59 |

  # Complete with schedule 15
  # The same recurring task appears when the window opens, pending.
  Scenario Outline: Complete with schedule 15
    Given a relative recurring task every <every> <unit>
    And the task was completed on <completed>
    And the task can be completed from <from> to <to>
    When I query Pendientes on <now>
    Then the task appears in Pendientes

    Examples:
      | every | unit   | completed           | from  | to    | now                 |
      | 1    | dias   | 2026-07-15T12:00:00 | 08:00 | 11:00 | 2026-07-17T08:00:00 |

  # Complete with schedule 16
  # A one-off waiting because of its schedule has no completions: it is not
  # completed and is shown with Mostrar completadas off.
  Scenario Outline: Complete with schedule 16
    Given a one-off task without a due date created on <created>
    And the task can be completed from <from> to <to>
    When I query Pendientes on <now>
    Then the task appears in Pendientes

    Examples:
      | created             | from  | to    | now                 |
      | 2026-07-15T06:00:00 | 08:00 | 11:00 | 2026-07-15T07:00:00 |
      | 2026-07-15T06:00:00 | 08:00 | 11:00 | 2026-07-15T20:00:00 |
