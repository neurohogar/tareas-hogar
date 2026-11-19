# mutation-stamp: sha256=5ab154d9777d79ccb01da52eb5f92ea55aafb3ca1c5e02eb4422e8c12b3d9714
# acceptance-mutation-manifest-begin
# {"version":1,"tested_at":"2026-11-14T01:22:56.543822354Z","feature_name":"Fila sin texto de fecha","feature_path":"features/fila-sin-texto-de-fecha.feature","background_hash":"74234e98afe7498fb5daf1f36ac2d78acc339464f950703b8c019892f982b90b","implementation_hash":"sha256:fb10b55ce7a8affeef9edcebcff0c7e5b3c0a6d0eca681274117d4743e2e466e","scenarios":[{"index":0,"name":"Fila sin texto de fecha 1","scenario_hash":"c38cc533a7ebdd56f683143756cb8ec6c3e6440cb24f0026353ba01cbbaacf65","mutation_count":5,"result":{"Total":5,"Killed":5,"Survived":0,"Errors":0},"tested_at":"2026-11-14T01:22:56.543822354Z"},{"index":2,"name":"Fila sin texto de fecha 3","scenario_hash":"e3d5a9f6dc5683c74938fd8d8de66d48dd13fb70cd61de1b567d27891781058a","mutation_count":14,"result":{"Total":14,"Killed":14,"Survived":0,"Errors":0},"tested_at":"2026-11-14T01:22:56.543822354Z"},{"index":4,"name":"Fila sin texto de fecha 5","scenario_hash":"1dc45992a7c482dbc6a566bc2fe619c97e86695aa54cbf2236c775dc4e61d984","mutation_count":8,"result":{"Total":8,"Killed":8,"Survived":0,"Errors":0},"tested_at":"2026-11-14T01:22:56.543822354Z"},{"index":5,"name":"Fila sin texto de fecha 6","scenario_hash":"ab1bcd4113cda2949a264a2ac9c74c9e75621742abca5c276dc6015cc194cb8f","mutation_count":12,"result":{"Total":12,"Killed":12,"Survived":0,"Errors":0},"tested_at":"2026-11-14T01:22:56.543822354Z"},{"index":7,"name":"Fila sin texto de fecha 8","scenario_hash":"209848a5070d486d1c0c0b4b123745a20aeb70e289afdb6f48df143355f178d5","mutation_count":2,"result":{"Total":2,"Killed":2,"Survived":0,"Errors":0},"tested_at":"2026-11-14T01:22:56.543822354Z"}]}
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
