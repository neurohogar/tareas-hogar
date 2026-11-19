# mutation-stamp: sha256=786c4e94f757054ed3b9b74371059b383e451e52abcd3b49ea5fb659a589bd4f
# acceptance-mutation-manifest-begin
# {"version":1,"tested_at":"2026-11-19T12:44:23.282584553Z","feature_name":"Pendientes order","feature_path":"features/orden-pendientes.feature","background_hash":"74234e98afe7498fb5daf1f36ac2d78acc339464f950703b8c019892f982b90b","implementation_hash":"sha256:385422b0022f921b7d797d6fdc8db62cf12ff1d4042599095cf3e159b273cbac","scenarios":[{"index":0,"name":"Pendientes order 1","scenario_hash":"7c025a8ea942050b7622d5c569b60211510b463a253e9db47ddfedc7b92e1897","mutation_count":29,"result":{"Total":29,"Killed":29,"Survived":0,"Errors":0},"tested_at":"2026-11-19T12:44:23.282584553Z"},{"index":1,"name":"Pendientes order 2","scenario_hash":"09200c609511c34c1560048c9dcbe79c4caa82cfb8afd7cb86aebb6695b0b6d7","mutation_count":16,"result":{"Total":16,"Killed":16,"Survived":0,"Errors":0},"tested_at":"2026-11-19T12:44:23.282584553Z"},{"index":2,"name":"Pendientes order 3","scenario_hash":"7a51cce1ed5725c1019923d1988901df4fbabfc2e2368462ec1811d190873af7","mutation_count":15,"result":{"Total":15,"Killed":15,"Survived":0,"Errors":0},"tested_at":"2026-11-19T12:44:23.282584553Z"},{"index":3,"name":"Pendientes order 4","scenario_hash":"b56b4f56a5a7dc57448a060a88df5ccce3d3afd485b79d480eafbc768c8135b5","mutation_count":21,"result":{"Total":21,"Killed":21,"Survived":0,"Errors":0},"tested_at":"2026-11-19T12:44:23.282584553Z"},{"index":4,"name":"Pendientes order 5","scenario_hash":"9325a408d2d804d738fee763324fc2ec191f10f3ea9262271715fca67f91f098","mutation_count":11,"result":{"Total":11,"Killed":11,"Survived":0,"Errors":0},"tested_at":"2026-11-19T12:44:23.282584553Z"},{"index":5,"name":"Pendientes order 6","scenario_hash":"ec01dbdfaa9654d0f9934315bd105bcfcef9eb48cbcdc4cb65158079f5e64abc","mutation_count":8,"result":{"Total":8,"Killed":8,"Survived":0,"Errors":0},"tested_at":"2026-11-19T12:44:23.282584553Z"},{"index":6,"name":"Pendientes order 7","scenario_hash":"f3e57568e31098e7c48d65c032787e63fc3b32338e035ebf5cf2895802e56d07","mutation_count":8,"result":{"Total":8,"Killed":8,"Survived":0,"Errors":0},"tested_at":"2026-11-19T12:44:23.282584553Z"},{"index":7,"name":"Pendientes order 8","scenario_hash":"e6d9538a3de8a2be4aa64400c03e15b2c6d4cca798c8cd5e9bcc09ad8308a51c","mutation_count":12,"result":{"Total":12,"Killed":12,"Survived":0,"Errors":0},"tested_at":"2026-11-19T12:44:23.282584553Z"},{"index":8,"name":"Pendientes order 9","scenario_hash":"fe5e9b6d31badff833475f1c0412fbfefc34a0bfd795485179bb85672b20a11c","mutation_count":13,"result":{"Total":13,"Killed":13,"Survived":0,"Errors":0},"tested_at":"2026-11-19T12:44:23.282584553Z"},{"index":9,"name":"Pendientes order 10","scenario_hash":"ebb9be04adcb211dc176b9a8e575c026e9e374a546944b2a53279766663b09b3","mutation_count":11,"result":{"Total":11,"Killed":11,"Survived":0,"Errors":0},"tested_at":"2026-11-19T12:44:23.282584553Z"},{"index":10,"name":"Pendientes order 11","scenario_hash":"b2ed0e81b6ec63fa9a0aa2f35c28b36013485c755da9d9b3b666b4907cf0d3fc","mutation_count":28,"result":{"Total":28,"Killed":28,"Survived":0,"Errors":0},"tested_at":"2026-11-19T12:44:23.282584553Z"}]}
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
