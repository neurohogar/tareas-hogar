# mutation-stamp: sha256=e074ac0337a1f1a5a00bd9fa28ef68b3e06c8bf93057babbd7a2ba489ba4a23f
# acceptance-mutation-manifest-begin
# {"version":1,"tested_at":"2026-11-22T22:04:13.441377707Z","feature_name":"Row without date text","feature_path":"features/row-without-date-text.feature","background_hash":"74234e98afe7498fb5daf1f36ac2d78acc339464f950703b8c019892f982b90b","implementation_hash":"sha256:39c068336f66405fbb727ea5957503ff6bb1c5bea756ae4a364992df4b461ff3","scenarios":[{"index":0,"name":"Row without date text 1","scenario_hash":"724f40c2b3625c7858c6254942f448e87e41d2680435e051a92a0aacbcf63dfe","mutation_count":5,"result":{"Total":5,"Killed":5,"Survived":0,"Errors":0},"tested_at":"2026-11-22T22:04:13.441377707Z"},{"index":2,"name":"Row without date text 3","scenario_hash":"4f2b5afc01754884b4dfcf3ca90181185f2a41bd633c6ba803f3eb4fbf054871","mutation_count":13,"result":{"Total":13,"Killed":13,"Survived":0,"Errors":0},"tested_at":"2026-11-22T22:04:13.441377707Z"},{"index":4,"name":"Row without date text 5","scenario_hash":"bb34c77b22c53561172eed82f723ea7b81ec58b860c7d947c54224a00bb2f27b","mutation_count":8,"result":{"Total":8,"Killed":8,"Survived":0,"Errors":0},"tested_at":"2026-11-22T22:04:13.441377707Z"},{"index":5,"name":"Row without date text 6","scenario_hash":"3fe54a3bb0079dee12730e3fcbd7825d9e22ddd76c1f47c0bdac988f4a829904","mutation_count":12,"result":{"Total":12,"Killed":12,"Survived":0,"Errors":0},"tested_at":"2026-11-22T22:04:13.441377707Z"},{"index":7,"name":"Row without date text 8","scenario_hash":"5fb42984ba3eb0b7a57e261d4aa081cd37c86cd858988395774d9eadb7ca69a6","mutation_count":2,"result":{"Total":2,"Killed":2,"Survived":0,"Errors":0},"tested_at":"2026-11-22T22:04:13.441377707Z"}]}
# acceptance-mutation-manifest-end

# Spec §6.1 (date and distance text), with §5.1–§5.5 and §5.8. Only the
# overdue rows («Tocaba …») and waiting rows («Vuelve …») carry date and
# distance text. Pending rows, paused rows (even if they would be overdue or
# waiting without the pause) and completed one-off tasks show none: no
# «Tocaba», «Vuelve» or date or distance.
# "the task row shows no date text" asserts that the list has a
# single row and that it has no date or distance text. A one-off task without a
# due date is never overdue, so it never carries «Tocaba». When the
# step gives no creadaEn, the task was created before any other date of the
# scenario. Reference week: Friday 2026-11-13.
Feature: Row without date text

  # Row without date text 1
  # Pending one-off task with a due date: up to the last second of the due day.
  Scenario Outline: Row without date text 1
    Given a one-off task with due date <due_date>
    When I query Pendientes on <now>
    Then the task row shows no date text

    Examples:
      | due_date   | now                 |
      | 2026-11-13 | 2026-11-13T10:00:00 |
      | 2026-11-13 | 2026-11-13T23:59:59 |
      | 2026-11-20 | 2026-11-13T10:00:00 |

  # Row without date text 2
  # One-off task without a due date: never overdue, however much time passes.
  Scenario Outline: Row without date text 2
    Given a one-off task without a due date
    When I query Pendientes on <now>
    Then the task row shows no date text

    Examples:
      | now                 |
      | 2026-11-13T10:00:00 |
      | 2027-11-13T10:00:00 |

  # Row without date text 3
  # Pending relative task, from V (inclusive) up to V + interval (exclusive).
  Scenario Outline: Row without date text 3
    Given a relative recurring task every <every> <unit>
    And the task was completed on <completed>
    When I query Pendientes on <now>
    Then the task row shows no date text

    Examples:
      | every | unit   | completed           | now                 |
      | 2    | dias   | 2026-11-11T10:00:00 | 2026-11-13T10:00:00 |
      | 4    | horas  | 2026-11-13T04:00:00 | 2026-11-13T11:59:59 |

  # Row without date text 4
  # Never-completed relative task: pending, however much time passes.
  Scenario Outline: Row without date text 4
    Given a relative recurring task never completed
    When I query Pendientes on <now>
    Then the task row shows no date text

    Examples:
      | now                 |
      | 2026-11-13T10:00:00 |
      | 2026-12-13T10:00:00 |

  # Row without date text 5
  # Calendar task pending on the day of the occurrence, from 00:00 to 23:59:59.
  Scenario Outline: Row without date text 5
    Given a weekly recurring task on <days> created on <created>
    When I query Pendientes on <now>
    Then the task row shows no date text

    Examples:
      | days    | created             | now                 |
      | viernes | 2026-11-12T08:00:00 | 2026-11-13T00:00:00 |
      | viernes | 2026-11-12T08:00:00 | 2026-11-13T23:59:59 |

  # Row without date text 6
  # With a schedule, pending inside the window (from inclusive, to
  # exclusive).
  Scenario Outline: Row without date text 6
    Given a weekly recurring task on <days> created on <created>
    And the task can be completed from <from> to <to>
    When I query Pendientes on <now>
    Then the task row shows no date text

    Examples:
      | days    | created             | from  | to    | now                 |
      | viernes | 2026-11-12T08:00:00 | 09:00 | 11:00 | 2026-11-13T09:00:00 |
      | viernes | 2026-11-12T08:00:00 | 09:00 | 11:00 | 2026-11-13T10:59:59 |

  # Row without date text 7
  # Completed one-off task (with Mostrar completadas): no return text, because
  # it does not come back.
  Scenario Outline: Row without date text 7
    Given Mostrar completadas is on
    And a one-off task without a due date
    And the task was completed on <completed>
    When I query Pendientes on <now>
    Then the task row shows no date text

    Examples:
      | completed           | now                 |
      | 2026-11-12T09:00:00 | 2026-11-13T10:00:00 |
      | 2026-11-13T09:30:00 | 2026-11-13T10:00:00 |

  # Row without date text 8
  # Completed one-off task with a schedule, which outside the window is waiting until
  # the next one: it stays completed and without return text.
  Scenario Outline: Row without date text 8
    Given Mostrar completadas is on
    And a one-off task without a due date created on <created>
    And the task can be completed from <from> to <to>
    And the task was completed on <completed>
    When I query Pendientes on <now>
    Then the task row shows no date text

    Examples:
      | created             | from  | to    | completed           | now                 |
      | 2026-11-13T06:00:00 | 08:00 | 11:00 | 2026-11-13T09:00:00 | 2026-11-13T12:00:00 |

  # Row without date text 9
  # Paused task that without the pause would be overdue: says «Pausada», without «Tocaba».
  Scenario Outline: Row without date text 9
    Given Mostrar pausadas is on
    And a relative recurring task every <every> <unit>
    And the task was completed on <completed>
    And the task was paused
    When I query Pendientes on <now>
    Then the task row shows no date text

    Examples:
      | every | unit   | completed           | now                 |
      | 1    | dias   | 2026-11-10T09:00:00 | 2026-11-13T10:00:00 |

  # Row without date text 10
  # Paused task that without the pause would be waiting: says «Pausada», without «Vuelve».
  Scenario Outline: Row without date text 10
    Given Mostrar pausadas is on
    And a relative recurring task every <every> <unit>
    And the task was completed on <completed>
    And the task was paused
    When I query Pendientes on <now>
    Then the task row shows no date text

    Examples:
      | every | unit   | completed           | now                 |
      | 8    | horas  | 2026-11-13T10:00:00 | 2026-11-13T12:00:00 |
