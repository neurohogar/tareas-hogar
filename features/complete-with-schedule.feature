# mutation-stamp: sha256=466038a1ae18604a6179f63706485b93629beb761a009d2246817a0a788aca63
# acceptance-mutation-manifest-begin
# {"version":1,"tested_at":"2026-11-24T02:59:36.893822224Z","feature_name":"Complete with schedule","feature_path":"features/complete-with-schedule.feature","background_hash":"74234e98afe7498fb5daf1f36ac2d78acc339464f950703b8c019892f982b90b","implementation_hash":"sha256:4a99efac17d89b18e90fddb5eb5c341e598db4d56850fbcfbb00f4eebfab9dd3","scenarios":[{"index":0,"name":"Complete with schedule 1","scenario_hash":"f3ff468575243847078826d9a36b2727c3a8a48d2f55efdfab5d118f3c386c61","mutation_count":6,"result":{"Total":6,"Killed":6,"Survived":0,"Errors":0},"tested_at":"2026-11-24T02:59:36.893822224Z"},{"index":1,"name":"Complete with schedule 2","scenario_hash":"95c99763628b370772cadf01b0283cb78747810eec3acd6e57fd5c1db63e10ad","mutation_count":8,"result":{"Total":8,"Killed":8,"Survived":0,"Errors":0},"tested_at":"2026-11-24T02:59:36.893822224Z"},{"index":2,"name":"Complete with schedule 3","scenario_hash":"2e5ed9e025b2eaa2bef39a8d02b1f0be6f0d87f103f6765e46aa749f892e7380","mutation_count":13,"result":{"Total":13,"Killed":13,"Survived":0,"Errors":0},"tested_at":"2026-11-24T02:59:36.893822224Z"},{"index":3,"name":"Complete with schedule 4","scenario_hash":"13e3aaeb0ee149a19286c0ca2b05ead9cac013f6fed15cea9555891a19626220","mutation_count":7,"result":{"Total":7,"Killed":7,"Survived":0,"Errors":0},"tested_at":"2026-11-24T02:59:36.893822224Z"},{"index":4,"name":"Complete with schedule 5","scenario_hash":"bea8c1f005c82373ee844fb4466847e84f55dfe397855328b42343b564e04b40","mutation_count":5,"result":{"Total":5,"Killed":5,"Survived":0,"Errors":0},"tested_at":"2026-11-24T02:59:36.893822224Z"},{"index":5,"name":"Complete with schedule 6","scenario_hash":"c9bfa5dc6429be614e991590234edbd45f78791526b5ae7b5c01db6b5b0e98a5","mutation_count":10,"result":{"Total":10,"Killed":10,"Survived":0,"Errors":0},"tested_at":"2026-11-24T02:59:36.893822224Z"},{"index":6,"name":"Complete with schedule 7","scenario_hash":"f3e9964f0352b738525bb8d3aee1f97daabe206b969a9b0ce984eb2c8dbf72f7","mutation_count":13,"result":{"Total":13,"Killed":13,"Survived":0,"Errors":0},"tested_at":"2026-11-24T02:59:36.893822224Z"},{"index":7,"name":"Complete with schedule 8","scenario_hash":"d87af267b98cae326597fdf15d44d819c31a4aee154f95acaadf8e1e7c6fcd25","mutation_count":7,"result":{"Total":7,"Killed":7,"Survived":0,"Errors":0},"tested_at":"2026-11-24T02:59:36.893822224Z"},{"index":8,"name":"Complete with schedule 9","scenario_hash":"d5da513ca71878b8b3373d23517db4c85ef7ec6c3053207149f5571ae3569cb4","mutation_count":5,"result":{"Total":5,"Killed":5,"Survived":0,"Errors":0},"tested_at":"2026-11-24T02:59:36.893822224Z"},{"index":9,"name":"Complete with schedule 10","scenario_hash":"adc73bdfb5d7316fde50f348de97cf0c013ec990badd2131643b4423c6858bea","mutation_count":6,"result":{"Total":6,"Killed":6,"Survived":0,"Errors":0},"tested_at":"2026-11-24T02:59:36.893822224Z"},{"index":10,"name":"Complete with schedule 12","scenario_hash":"9608af09db4e0909406d8c6a4e360be3e7afc7680d7332009945a8fae5f3755b","mutation_count":6,"result":{"Total":6,"Killed":6,"Survived":0,"Errors":0},"tested_at":"2026-11-24T02:59:36.893822224Z"},{"index":11,"name":"Complete with schedule 13","scenario_hash":"3a9c9b63d63557f21bd70987583eb06e331e7485fc2c29aa557a7db7d163628c","mutation_count":8,"result":{"Total":8,"Killed":8,"Survived":0,"Errors":0},"tested_at":"2026-11-24T02:59:36.893822224Z"},{"index":12,"name":"Complete with schedule 14","scenario_hash":"0e25e752999309e0a6beded1796ea8dba88b838f7745db2e637e57cd8eeae83d","mutation_count":12,"result":{"Total":12,"Killed":12,"Survived":0,"Errors":0},"tested_at":"2026-11-24T02:59:36.893822224Z"},{"index":13,"name":"Complete with schedule 15","scenario_hash":"b699621789fc0f7fab352e1f20d397e9e4553d871722c85f297005e5afbc3a54","mutation_count":7,"result":{"Total":7,"Killed":7,"Survived":0,"Errors":0},"tested_at":"2026-11-24T02:59:36.893822224Z"},{"index":14,"name":"Complete with schedule 16","scenario_hash":"4032458b8ca6c148e3405be74a4fb990d81efb14fcce4e34e910e1a22bb78d5c","mutation_count":4,"result":{"Total":4,"Killed":4,"Survived":0,"Errors":0},"tested_at":"2026-11-24T02:59:36.893822224Z"}]}
# acceptance-mutation-manifest-end

# Spec §5.5 and §6.1 (row checkbox and Mostrar completadas), with §5.2–§5.4.
# Completing is only possible inside the window [from, to): if tapping the
# checkbox would complete the task and it is now outside its window, the checkbox
# is disabled and tapping it does nothing. If tapping it would delete a completion
# (completed recurring whose most recent completion is from today or later), it
# is always enabled. A completed one-off task has no row, so no checkbox. Undo in
# the notice can also be done at any time.
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
