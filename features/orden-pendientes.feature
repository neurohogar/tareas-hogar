# mutation-stamp: sha256=9e465e5269ac2ed0aca06f23318e1e57d8c4e042b528f855b91dfb445095a945
# acceptance-mutation-manifest-begin
# {"version":1,"tested_at":"2026-11-17T21:01:45.938517909Z","feature_name":"Orden de Pendientes","feature_path":"features/orden-pendientes.feature","background_hash":"74234e98afe7498fb5daf1f36ac2d78acc339464f950703b8c019892f982b90b","implementation_hash":"sha256:5720495ceadfc94c3459d9eab68e4b959909b08456a81c18d7fffa2d218bb2d7","scenarios":[{"index":0,"name":"Orden de Pendientes 1","scenario_hash":"2b0779f4a4445675b56feb1a9247ac318275af4545b3e1da92b33dc1d193e8e1","mutation_count":28,"result":{"Total":28,"Killed":28,"Survived":0,"Errors":0},"tested_at":"2026-11-17T21:01:45.938517909Z"},{"index":1,"name":"Orden de Pendientes 2","scenario_hash":"9be50305d35e96097d7727eff93c088c41f394b40c35afd83a5dfd6ce2e15250","mutation_count":15,"result":{"Total":15,"Killed":15,"Survived":0,"Errors":0},"tested_at":"2026-11-17T21:01:45.938517909Z"},{"index":2,"name":"Orden de Pendientes 3","scenario_hash":"5b097ccf8b329a4ec2b060248fc8936340614a47776fbcca1e053d8f194fdd5a","mutation_count":16,"result":{"Total":16,"Killed":16,"Survived":0,"Errors":0},"tested_at":"2026-11-17T21:01:45.938517909Z"},{"index":3,"name":"Orden de Pendientes 4","scenario_hash":"bc9608112d54563a580b5de47a566ab41c99d0d7327716eb64bb62cbd8548777","mutation_count":20,"result":{"Total":20,"Killed":20,"Survived":0,"Errors":0},"tested_at":"2026-11-17T21:01:45.938517909Z"},{"index":4,"name":"Orden de Pendientes 5","scenario_hash":"e963f15b57169748e9a1d44866e68c6240fcb5116bc99d31260617b896930f98","mutation_count":11,"result":{"Total":11,"Killed":11,"Survived":0,"Errors":0},"tested_at":"2026-11-17T21:01:45.938517909Z"},{"index":5,"name":"Orden de Pendientes 6","scenario_hash":"24b14c9c003091dbf9c08dd11eb05ebba6f85c5708b00d9f24f65b400f2055d6","mutation_count":8,"result":{"Total":8,"Killed":8,"Survived":0,"Errors":0},"tested_at":"2026-11-17T21:01:45.938517909Z"},{"index":6,"name":"Orden de Pendientes 7","scenario_hash":"b563940469eeb0fd67a4fb4053bdd036f6b2da42c3f9ce8c24c722cb75c64771","mutation_count":7,"result":{"Total":7,"Killed":7,"Survived":0,"Errors":0},"tested_at":"2026-11-17T21:01:45.938517909Z"},{"index":7,"name":"Orden de Pendientes 8","scenario_hash":"c8a3e932d38f5617d7be6365fad8f097971bab3992514ac6f5f726987f8caa4d","mutation_count":12,"result":{"Total":12,"Killed":12,"Survived":0,"Errors":0},"tested_at":"2026-11-17T21:01:45.938517909Z"},{"index":8,"name":"Orden de Pendientes 9","scenario_hash":"03e61583d36fd0ea3bcf77189809cd7fc3729e797f4edd590ff6d6ae901e4f50","mutation_count":13,"result":{"Total":13,"Killed":13,"Survived":0,"Errors":0},"tested_at":"2026-11-17T21:01:45.938517909Z"},{"index":9,"name":"Orden de Pendientes 10","scenario_hash":"a62491e86e8af5a10cee4f93f77de789c370ffa8506114b00ce3129b4b0b6bc4","mutation_count":11,"result":{"Total":11,"Killed":11,"Survived":0,"Errors":0},"tested_at":"2026-11-17T21:01:45.938517909Z"},{"index":10,"name":"Orden de Pendientes 11","scenario_hash":"98e9b39c4efc07d3aac5307c805c6714b07a0720fca74850a9325e4983e2f4ed","mutation_count":28,"result":{"Total":28,"Killed":28,"Survived":0,"Errors":0},"tested_at":"2026-11-17T21:01:45.938517909Z"}]}
# acceptance-mutation-manifest-end

# Spec §6.1 (order by urgency), with the statuses of §5.1–§5.3 and §10 criterion 3.
# Pendientes is a single list in three groups: atrasada, then pendiente,
# then en espera. Within each group an instant (local time) is compared,
# from oldest to most recent:
#   atrasada (since it became atrasada): one-off = 00:00 of the day after the
#     due date; relative = V + interval; calendar = 00:00 of the day
#     after N.
#   pendiente (since it became pendiente): one-off = 00:00 of the due date;
#     relative = V, or createdAt if it was never completed; calendar = 00:00 of N.
#     One-offs without a due date go at the end of the group, by createdAt.
#   en espera (when it becomes pendiente again): relative = V; calendar = 00:00 of N.
# With Mostrar completadas off (the initial value, §6.1) completed tasks are not
# shown: the one-off with completions and the recurring task en espera with completions.
# So the visible en espera group only has calendar recurring tasks without
# completions, before their first occurrence (Sábanas, with its createdAt).
# Tie-break: oldest createdAt first; then title in Spanish alphabetical
# order (case- and accent-insensitive, ñ after n); then
# id (not observable, not specified with examples).
# U, V, P and N as in §5.2 and §5.3. Reference week: Monday 2026-07-13 to
# Sunday 2026-07-19.
# Each task is named by its title (one word). "Pendientes shows in
# order" gives the titles from top to bottom, separated by ", ", and the list
# has no other rows. When the step does not give createdAt, all those tasks were
# created at the same instant, earlier than any other date in the scenario.
# "has a completion that covers ..." is an already saved completion with that
# covered occurrence; its moment does not influence the result as long as the
# task is not en espera.
# Tasks are declared in an order different from the expected one: load order
# decides nothing.
Feature: Pendientes order

  # Pendientes order 1
  # The groups go atrasada, pendiente, en espera, with any kind in
  # atrasada and in pendiente. Row 2: Sábanas comes back on the 16th, before
  # Pagar is pendiente (on the 20th), and it still goes after. Row 3: the relative
  # task that became atrasada only just now goes before the one-off pendiente since
  # 00:00 today (the group rules, not the instant).
  Scenario Outline: Pendientes order 1
    Given a weekly recurring task Sábanas on <days_sheets> created on <created_sheets>
    And a one-off task Pagar with due date <due_date>
    And a weekly recurring task Basura on <days>
    And the task Basura has a completion that covers <covered>
    And a relative recurring task Regar every <every> <unit>
    And the task Regar was completed on <completed>
    When I query Pendientes on <now>
    Then Pendientes shows in order <order>

    Examples:
      | due_date   | days      | covered    | every | unit   | completed           | days_sheets  | created_sheets      | now                 | order                         |
      | 2026-07-14 | miércoles | 2026-07-08 | 4    | horas  | 2026-07-15T07:00:00 | sábado       | 2026-07-15T08:00:00 | 2026-07-15T12:00:00 | Pagar, Basura, Regar, Sábanas |
      | 2026-07-20 | lunes     | 2026-07-06 | 1    | dias   | 2026-07-14T08:00:00 | jueves       | 2026-07-15T08:00:00 | 2026-07-15T12:00:00 | Basura, Regar, Pagar, Sábanas |
      | 2026-07-15 | lunes     | 2026-07-06 | 1    | horas  | 2026-07-15T10:00:00 | sábado       | 2026-07-15T08:00:00 | 2026-07-15T12:00:00 | Basura, Regar, Pagar, Sábanas |

  # Pendientes order 2
  # Atrasada: first the one that has been atrasada longest, counted from when
  # it became atrasada (not from V). Row 1: Basura since the 10th, Regar since the
  # 14th at 20:00, Pagar since the 15th. Row 2: Regar with V on the 14th at 04:00
  # but atrasada only since the 15th at 04:00, after Pagar (since the
  # 9th). Row 3: relative in hours atrasada since the 8th at 20:00.
  Scenario Outline: Pendientes order 2
    Given a one-off task Pagar with due date <due_date>
    And a weekly recurring task Basura on <days>
    And the task Basura has a completion that covers <covered>
    And a relative recurring task Regar every <every> <unit>
    And the task Regar was completed on <completed>
    When I query Pendientes on <now>
    Then Pendientes shows in order <order>

    Examples:
      | due_date   | days           | covered    | every | unit   | completed           | now                 | order                |
      | 2026-07-14 | martes, jueves | 2026-07-07 | 1    | dias   | 2026-07-12T20:00:00 | 2026-07-17T12:00:00 | Basura, Regar, Pagar |
      | 2026-07-08 | jueves         | 2026-07-02 | 1    | dias   | 2026-07-13T04:00:00 | 2026-07-17T12:00:00 | Pagar, Basura, Regar |
      | 2026-07-14 | viernes        | 2026-07-03 | 12   | horas  | 2026-07-07T20:00:00 | 2026-07-17T12:00:00 | Regar, Basura, Pagar |

  # Pendientes order 3
  # Pendiente of the three kinds: first the one that has been pendiente longer.
  # Row 1: Regar since the 15th at 20:00, Basura since 00:00 today,
  # Pagar with a future due date. Row 2: Regar pendiente since today at
  # 09:00, after Basura.
  Scenario Outline: Pendientes order 3
    Given a one-off task Pagar with due date <due_date>
    And a weekly recurring task Basura on <days>
    And the task Basura has a completion that covers <covered>
    And a relative recurring task Regar every <every> <unit>
    And the task Regar was completed on <completed>
    When I query Pendientes on <now>
    Then Pendientes shows in order <order>

    Examples:
      | due_date   | days           | covered    | every | unit   | completed           | now                 | order                |
      | 2026-07-20 | martes, jueves | 2026-07-14 | 1    | dias   | 2026-07-14T20:00:00 | 2026-07-16T12:00:00 | Regar, Basura, Pagar |
      | 2026-07-17 | jueves         | 2026-07-09 | 4    | horas  | 2026-07-16T05:00:00 | 2026-07-16T12:00:00 | Basura, Regar, Pagar |

  # Pendientes order 4
  # One-off with a due date versus relative: the due date counts from
  # 00:00 of that day. Row 1: due date today (00:00) before V today at
  # 09:00. Row 2: due date tomorrow, after. Row 3: V yesterday at
  # 23:00, before the due date of today.
  Scenario Outline: Pendientes order 4
    Given a one-off task Pagar with due date <due_date>
    And a relative recurring task Regar every <every> <unit>
    And the task Regar was completed on <completed>
    When I query Pendientes on <now>
    Then Pendientes shows in order <order>

    Examples:
      | due_date   | every | unit   | completed           | now                 | order        |
      | 2026-07-16 | 4    | horas  | 2026-07-16T05:00:00 | 2026-07-16T12:00:00 | Pagar, Regar |
      | 2026-07-17 | 4    | horas  | 2026-07-16T05:00:00 | 2026-07-16T12:00:00 | Regar, Pagar |
      | 2026-07-16 | 2    | dias   | 2026-07-13T23:00:00 | 2026-07-16T12:00:00 | Regar, Pagar |

  # Pendientes order 5
  # A relative task never completed is pendiente since its createdAt and competes
  # on the same axis. Row 2: created one second before 00:00 of the
  # due date of Pagar.
  Scenario Outline: Pendientes order 5
    Given a one-off task Pagar with due date <due_date>
    And a relative recurring task Regar never completed created on <created_water>
    When I query Pendientes on <now>
    Then Pendientes shows in order <order>

    Examples:
      | due_date   | created_water       | now                 | order        |
      | 2026-07-15 | 2026-07-15T10:00:00 | 2026-07-15T12:00:00 | Pagar, Regar |
      | 2026-07-15 | 2026-07-14T23:59:59 | 2026-07-15T12:00:00 | Regar, Pagar |
      | 2026-07-16 | 2026-07-15T10:00:00 | 2026-07-15T12:00:00 | Regar, Pagar |

  # Pendientes order 6
  # One-offs without a due date go at the end of the pendiente group, by
  # createdAt (oldest first), even if they were created before the
  # others.
  Scenario Outline: Pendientes order 6
    Given a one-off task Foco without a due date created on <created_focus>
    And a one-off task Dentista without a due date created on <created_dentist>
    And a relative recurring task Regar never completed created on <created_water>
    And a one-off task Pagar with due date <due_date>
    When I query Pendientes on <now>
    Then Pendientes shows in order <order>

    Examples:
      | created_focus       | created_dentist     | created_water       | due_date   | now                 | order                         |
      | 2026-07-01T08:00:00 | 2026-07-01T08:00:01 | 2026-07-10T08:00:00 | 2026-12-31 | 2026-07-15T12:00:00 | Regar, Pagar, Foco, Dentista  |
      | 2026-07-01T08:00:01 | 2026-07-01T08:00:00 | 2026-07-10T08:00:00 | 2026-12-31 | 2026-07-15T12:00:00 | Regar, Pagar, Dentista, Foco  |

  # Pendientes order 7
  # En espera: first the one that comes back earlier (00:00 of N), even if it was
  # created later. Before its first occurrence, P is the day before
  # createdAt. Row 3: N of the monthly one falls in the next month.
  Scenario Outline: Pendientes order 7
    Given a weekly recurring task Basura on <days_trash> created on <created_trash>
    And a monthly recurring task Sábanas on days <days_sheets> created on <created_sheets>
    When I query Pendientes on <now>
    Then Pendientes shows in order <order>

    Examples:
      | days_trash  | created_trash       | days_sheets  | created_sheets      | now                 | order           |
      | jueves      | 2026-07-15T08:00:00 | 17           | 2026-07-15T07:00:00 | 2026-07-15T12:00:00 | Basura, Sábanas |
      | sábado      | 2026-07-15T07:00:00 | 17           | 2026-07-15T08:00:00 | 2026-07-15T12:00:00 | Sábanas, Basura |
      | jueves      | 2026-07-15T08:00:00 | 1            | 2026-07-15T07:00:00 | 2026-07-15T12:00:00 | Basura, Sábanas |

  # Pendientes order 8
  # Tie-break in pendiente: with the same due date, first the one with the
  # oldest createdAt (even if its title goes later).
  Scenario Outline: Pendientes order 8
    Given a one-off task Planchar with due date <due_date_iron> created on <created_iron>
    And a one-off task Barrer with due date <due_date_sweep> created on <created_sweep>
    When I query Pendientes on <now>
    Then Pendientes shows in order <order>

    Examples:
      | due_date_iron   | created_iron        | due_date_sweep | created_sweep       | now                 | order            |
      | 2026-07-20      | 2026-07-10T08:00:00 | 2026-07-20    | 2026-07-10T08:00:01 | 2026-07-15T12:00:00 | Planchar, Barrer |
      | 2026-07-20      | 2026-07-10T08:00:01 | 2026-07-20    | 2026-07-10T08:00:00 | 2026-07-15T12:00:00 | Barrer, Planchar |

  # Pendientes order 9
  # Tie-break in atrasada between kinds: the one-off with a due date on the 9th and the
  # weekly one with N on the 9th are atrasada since the 10th at 00:00; first the one with
  # the oldest createdAt.
  Scenario Outline: Pendientes order 9
    Given a one-off task Pagar with due date <due_date> created on <created_pay>
    And a weekly recurring task Basura on <days> created on <created_trash>
    And the task Basura has a completion that covers <covered>
    When I query Pendientes on <now>
    Then Pendientes shows in order <order>

    Examples:
      | due_date   | created_pay         | days           | created_trash       | covered    | now                 | order         |
      | 2026-07-09 | 2026-07-01T08:00:00 | martes, jueves | 2026-07-01T08:00:01 | 2026-07-07 | 2026-07-15T12:00:00 | Pagar, Basura |
      | 2026-07-09 | 2026-07-01T08:00:01 | martes, jueves | 2026-07-01T08:00:00 | 2026-07-07 | 2026-07-15T12:00:00 | Basura, Pagar |

  # Pendientes order 10
  # Tie-break in en espera between weekly and monthly: both come back on the 16th at
  # 00:00; first the one with the oldest createdAt.
  Scenario Outline: Pendientes order 10
    Given a weekly recurring task Basura on <days_trash> created on <created_trash>
    And a monthly recurring task Sábanas on days <days_sheets> created on <created_sheets>
    When I query Pendientes on <now>
    Then Pendientes shows in order <order>

    Examples:
      | days_trash  | created_trash       | days_sheets  | created_sheets      | now                 | order           |
      | jueves      | 2026-07-15T08:00:00 | 16           | 2026-07-15T08:00:01 | 2026-07-15T12:00:00 | Basura, Sábanas |
      | jueves      | 2026-07-15T08:00:01 | 16           | 2026-07-15T08:00:00 | 2026-07-15T12:00:00 | Sábanas, Basura |

  # Pendientes order 11
  # Tie-break by title when createdAt also matches: Spanish alphabetical
  # order. Row 1: the ñ goes after the n. Row 2: the Á goes with the A.
  # Row 3: case-insensitive. Row 4: the title declared
  # first can also go first.
  Scenario Outline: Pendientes order 11
    Given a one-off task <title_1> without a due date created on <created_1>
    And a one-off task <title_2> without a due date created on <created_2>
    When I query Pendientes at any moment
    Then Pendientes shows in order <order>

    Examples:
      | title_1  | created_1           | title_2    | created_2           | order               |
      | Ñandú    | 2026-07-10T08:00:00 | Nube       | 2026-07-10T08:00:00 | Nube, Ñandú         |
      | Barrer   | 2026-07-10T08:00:00 | Árbol      | 2026-07-10T08:00:00 | Árbol, Barrer       |
      | Zapallo  | 2026-07-10T08:00:00 | acelga     | 2026-07-10T08:00:00 | acelga, Zapallo     |
      | Cocina   | 2026-07-10T08:00:00 | Dormitorio | 2026-07-10T08:00:00 | Cocina, Dormitorio  |
