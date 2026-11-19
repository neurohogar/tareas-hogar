# mutation-stamp: sha256=ffca69d295f1d6b2ee5da46829e03236c7cfc78c5e2a9cbd3882ecdf4cca2352
# acceptance-mutation-manifest-begin
# {"version":1,"tested_at":"2026-11-19T12:39:45.034712090Z","feature_name":"Historial","feature_path":"features/historial.feature","background_hash":"74234e98afe7498fb5daf1f36ac2d78acc339464f950703b8c019892f982b90b","implementation_hash":"sha256:e3bd895aa5b78abdc8f5fd6445102376f8fb53997bd3f33b29a4a7445de2c0e2","scenarios":[{"index":0,"name":"Historial 1","scenario_hash":"1ab03582aa2cb4b73af38efbbe1aafe0f9f7e40d5ea32a25928e3f9d43081ccc","mutation_count":18,"result":{"Total":18,"Killed":18,"Survived":0,"Errors":0},"tested_at":"2026-11-19T12:39:45.034712090Z"},{"index":1,"name":"Historial 2","scenario_hash":"87464dc41ab6537cdb21b97e5ae193bc25cabc9d02c0686a40b4ee72e3fe8894","mutation_count":59,"result":{"Total":59,"Killed":59,"Survived":0,"Errors":0},"tested_at":"2026-11-19T12:39:45.034712090Z"},{"index":2,"name":"Historial 3","scenario_hash":"e27e7996708605f94148c5e9c9fad83bc38c0838730411b36076d49859d54d8d","mutation_count":17,"result":{"Total":17,"Killed":17,"Survived":0,"Errors":0},"tested_at":"2026-11-19T12:39:45.034712090Z"},{"index":3,"name":"Historial 4","scenario_hash":"3a2cd2eb792c3f2d1e808c3b26beb8b4b5a72db016b55a7aaa797cb8eb2d8ed3","mutation_count":11,"result":{"Total":11,"Killed":11,"Survived":0,"Errors":0},"tested_at":"2026-11-19T12:39:45.034712090Z"},{"index":4,"name":"Historial 5","scenario_hash":"86dcd9d2f72538dae5f6b748cf0887f9c9c89edf918f05366b5b344b743bcc4f","mutation_count":11,"result":{"Total":11,"Killed":11,"Survived":0,"Errors":0},"tested_at":"2026-11-19T12:39:45.034712090Z"},{"index":5,"name":"Historial 6","scenario_hash":"86b0cf99ccbcf5e97794c504e964f73c9dd602527e556dedd4d6026ec028e97a","mutation_count":7,"result":{"Total":7,"Killed":7,"Survived":0,"Errors":0},"tested_at":"2026-11-19T12:39:45.034712090Z"},{"index":6,"name":"Historial 7","scenario_hash":"b7da258695655c0cd3d89b534b35cd8ee8c1df06a0e8c09216a955e442f9250a","mutation_count":8,"result":{"Total":8,"Killed":8,"Survived":0,"Errors":0},"tested_at":"2026-11-19T12:39:45.034712090Z"}]}
# acceptance-mutation-manifest-end

# Spec §6.3 (Historial), §6.2 and §7 (completions of deleted tasks and
# orphans). The Historial lists the completions of the tasks that exist,
# from most recent to oldest by completadoEn (if tied, the one with the lower
# id first), grouped by local day of completadoEn.
# Heading of each day: "Hoy", "Ayer" or "<día de la semana> <número> de
# <mes>", with " de <año>" if the year is not the current one. A day after today
# (completion "from the future") carries the date, never "Mañana".
# Each entry: the current title of the task and the time HH:MM in 24 h.
# "the Historial shows" gives the groups in order, separated by "; ", each one
# as "<heading>: <entries>", and the entries in order, separated by
# ", ", as "<title> <HH:MM>". The Historial has no other entries.
# Each task is named by its title (one word).
# Reference week: Monday 2026-07-13 to Sunday 2026-07-19.
Feature: Historial

  # Historial 1
  # One-offs and recurring tasks together, from most recent to oldest and
  # grouped by day, even if they were completed in another order.
  Scenario Outline: Historial 1
    Given a relative recurring task Regar every <every> <unit>
    And a weekly recurring task Basura on <days>
    And a one-off task Pagar with due date <due_date>
    And the task Regar was completed on <water_recent>
    And the task Pagar was completed on <pay>
    And the task Regar was completed on <water_old>
    And the task Basura was completed on <trash>
    When I query the Historial on <now>
    Then the Historial shows <history>

    Examples:
      | every | unit   | days           | due_date   | water_recent        | pay                 | water_old           | trash               | now                 | history                                                                           |
      | 2    | dias   | martes, jueves | 2026-07-20 | 2026-07-15T08:05:00 | 2026-07-15T10:00:00 | 2026-07-13T09:00:00 | 2026-07-14T21:30:00 | 2026-07-15T12:00:00 | Hoy: Pagar 10:00, Regar 08:05; Ayer: Basura 21:30; lunes 13 de julio: Regar 09:00 |

  # Historial 2
  # Heading of the day and time: edges at 00:00, "Ayer" across the change
  # of year, the year when it is not the current one, and completions "from the future" (the
  # same day, later, goes under "Hoy"; another day, with the date). The time is
  # shown without seconds.
  Scenario Outline: Historial 2
    Given a relative recurring task Regar every <every> <unit>
    And the task Regar was completed on <completed>
    When I query the Historial on <now>
    Then the Historial shows <history>

    Examples:
      | every | unit   | completed           | now                 | history                                         |
      | 2    | dias   | 2026-07-15T00:00:00 | 2026-07-15T12:00:00 | Hoy: Regar 00:00                                |
      | 2    | dias   | 2026-07-14T23:59:59 | 2026-07-15T12:00:00 | Ayer: Regar 23:59                               |
      | 2    | dias   | 2026-07-14T23:59:59 | 2026-07-16T00:00:00 | martes 14 de julio: Regar 23:59                 |
      | 2    | dias   | 2026-07-13T08:00:00 | 2026-07-14T23:59:59 | Ayer: Regar 08:00                               |
      | 2    | dias   | 2025-12-31T22:00:00 | 2026-01-01T10:00:00 | Ayer: Regar 22:00                               |
      | 2    | dias   | 2025-12-31T22:00:00 | 2026-01-02T10:00:00 | miércoles 31 de diciembre de 2025: Regar 22:00  |
      | 2    | dias   | 2026-07-15T13:00:00 | 2026-07-15T12:00:00 | Hoy: Regar 13:00                                |
      | 2    | dias   | 2026-07-16T09:00:00 | 2026-07-15T12:00:00 | jueves 16 de julio: Regar 09:00                 |

  # Historial 3
  # Two completions at the same instant: the one with the lower id goes first, regardless of
  # the order in which they were recorded.
  Scenario Outline: Historial 3
    Given a relative recurring task Regar every <every> <unit>
    And a one-off task Pagar with due date <due_date>
    And the task Regar was completed on <moment> with id <id_water>
    And the task Pagar was completed on <moment> with id <id_pay>
    When I query the Historial on <now>
    Then the Historial shows <history>

    Examples:
      | every | unit   | due_date   | moment              | id_water | id_pay   | now                 | history                       |
      | 2    | dias   | 2026-07-20 | 2026-07-15T10:00:00 | c2       | c1       | 2026-07-15T12:00:00 | Hoy: Pagar 10:00, Regar 10:00 |
      | 2    | dias   | 2026-07-20 | 2026-07-15T10:00:00 | c1       | c2       | 2026-07-15T12:00:00 | Hoy: Regar 10:00, Pagar 10:00 |

  # Historial 4
  # Each entry shows the current title: renaming the task changes all
  # its entries.
  Scenario Outline: Historial 4
    Given a relative recurring task <title> every <every> <unit>
    And the task was completed on <first>
    And the task was completed on <second>
    When I edit the title to <title_new>
    And I query the Historial on <now>
    Then the Historial shows <history>

    Examples:
      | title  | every | unit   | first               | second              | title_new    | now                 | history                                     |
      | Regar  | 2    | dias   | 2026-07-14T09:00:00 | 2026-07-15T08:00:00 | Plantas      | 2026-07-15T12:00:00 | Hoy: Plantas 08:00; Ayer: Plantas 09:00     |

  # Historial 5
  # Two devices complete the same task offline: both
  # entries remain.
  Scenario Outline: Historial 5
    Given a relative recurring task Regar every <every> <unit>
    When I complete the task on <mine>
    And another device, without seeing that change, completes the task Regar on <other>
    And I query the Historial on <now>
    Then the Historial shows <history>

    Examples:
      | every | unit   | mine                | other               | now                 | history                       |
      | 2    | dias   | 2026-07-15T08:00:00 | 2026-07-15T09:00:00 | 2026-07-15T12:00:00 | Hoy: Regar 09:00, Regar 08:00 |

  # Historial 6
  # Deleting a task removes all its entries from the Historial, and only its own.
  Scenario Outline: Historial 6
    Given a relative recurring task Regar every <every> <unit>
    And a one-off task Pagar with due date <due_date>
    And the task Regar was completed on <water_1>
    And the task Regar was completed on <water_2>
    And the task Pagar was completed on <pay>
    When I delete the task Regar
    And I query the Historial on <now>
    Then the Historial shows <history>

    Examples:
      | every | unit   | due_date   | water_1             | water_2             | pay                 | now                 | history                         |
      | 2    | dias   | 2026-07-20 | 2026-07-14T09:00:00 | 2026-07-15T08:00:00 | 2026-07-14T10:00:00 | 2026-07-15T12:00:00 | Ayer: Pagar 10:00               |

  # Historial 7
  # An orphan completion (another device, without seeing the deletion, completes the
  # deleted task) does not appear in the Historial.
  Scenario Outline: Historial 7
    Given a relative recurring task Regar every <every> <unit>
    And a one-off task Pagar with due date <due_date>
    And the task Pagar was completed on <pay>
    When I delete the task Regar
    And another device, without seeing that change, completes the task Regar on <orphan>
    And I query the Historial on <now>
    Then the Historial shows <history>

    Examples:
      | every | unit   | due_date   | pay                 | orphan              | now                 | history          |
      | 2    | dias   | 2026-07-20 | 2026-07-15T08:00:00 | 2026-07-15T09:00:00 | 2026-07-15T12:00:00 | Hoy: Pagar 08:00 |

  # Historial 8
  # Without completions, the Historial is empty.
  Scenario Outline: Historial 8
    Given a relative recurring task Regar never completed created on <created>
    When I query the Historial on <now>
    Then the Historial is empty

    Examples:
      | created             | now                 |
      | 2026-07-13T08:00:00 | 2026-07-15T12:00:00 |
