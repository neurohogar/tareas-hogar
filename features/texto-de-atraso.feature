# mutation-stamp: sha256=585dd021f0804cf4c40ff1c49f3d75ba482f249742887a6a1fe79cc611d6f091
# acceptance-mutation-manifest-begin
# {"version":1,"tested_at":"2026-11-19T12:58:48.112640299Z","feature_name":"Overdue text","feature_path":"features/texto-de-atraso.feature","background_hash":"74234e98afe7498fb5daf1f36ac2d78acc339464f950703b8c019892f982b90b","implementation_hash":"sha256:24e94e8aea65fab258b0846620ecceca9c2da98b41505c41a9fd6c7ad5d55145","scenarios":[{"index":0,"name":"Overdue text 1","scenario_hash":"2a743957c303269f235847070c632827cc2639b39433673a726d6813c9a2bf0e","mutation_count":33,"result":{"Total":33,"Killed":33,"Survived":0,"Errors":0},"tested_at":"2026-11-19T12:58:48.112640299Z"},{"index":1,"name":"Overdue text 2","scenario_hash":"553c6b928148cf167b0867b5f70818ccdc5b9f2f910ce03834203eec1852caf3","mutation_count":22,"result":{"Total":22,"Killed":22,"Survived":0,"Errors":0},"tested_at":"2026-11-19T12:58:48.112640299Z"},{"index":2,"name":"Overdue text 3","scenario_hash":"335f1eb02c130ce071a733c49f949f191a2757574eb1782dca19809e3da66f0e","mutation_count":80,"result":{"Total":80,"Killed":80,"Survived":0,"Errors":0},"tested_at":"2026-11-19T12:58:48.112640299Z"},{"index":3,"name":"Overdue text 4","scenario_hash":"020b283d57de34e501d089f6b71b04be5b26a5f8c8ed598243e0ab5833767398","mutation_count":38,"result":{"Total":38,"Killed":38,"Survived":0,"Errors":0},"tested_at":"2026-11-19T12:58:48.112640299Z"},{"index":4,"name":"Overdue text 5","scenario_hash":"b49684dfb4782ecf7747179f34f93fa9389780bc704c20fbca894e0037f5d226","mutation_count":40,"result":{"Total":40,"Killed":40,"Survived":0,"Errors":0},"tested_at":"2026-11-19T12:58:48.112640299Z"},{"index":5,"name":"Overdue text 6","scenario_hash":"75dfbc2f4cf5e153d10654298e873b568e40f49159251e37ff304cf9aa135367","mutation_count":22,"result":{"Total":22,"Killed":22,"Survived":0,"Errors":0},"tested_at":"2026-11-19T12:58:48.112640299Z"},{"index":6,"name":"Overdue text 7","scenario_hash":"256d5ed09650b94ae74f0c87d8b2873b9c0d6c432575c2eff4dd02dad9a2c688","mutation_count":8,"result":{"Total":8,"Killed":8,"Survived":0,"Errors":0},"tested_at":"2026-11-19T12:58:48.112640299Z"},{"index":7,"name":"Overdue text 8","scenario_hash":"ced9cfc9ec7c9c4e7d084304ab5ef4fa6b098b21a35f21faf9696ab7d58a99f6","mutation_count":55,"result":{"Total":55,"Killed":55,"Survived":0,"Errors":0},"tested_at":"2026-11-19T12:58:48.112640299Z"},{"index":8,"name":"Overdue text 9","scenario_hash":"eaf2940797e5dd04f338900b44fbc8ab70ee2d3c1e91be23cc4952f8d43b6d64","mutation_count":18,"result":{"Total":18,"Killed":18,"Survived":0,"Errors":0},"tested_at":"2026-11-19T12:58:48.112640299Z"},{"index":9,"name":"Overdue text 10","scenario_hash":"06f43f2839ade6da2dd8c14e35488b726aeb00ab0ca8a5047c89855dd951f16d","mutation_count":19,"result":{"Total":19,"Killed":19,"Survived":0,"Errors":0},"tested_at":"2026-11-19T12:58:48.112640299Z"},{"index":10,"name":"Overdue text 11","scenario_hash":"b5dd99844833e410bf2f6faa40062f36fb42de35ce4f6ce036441d8cd66bf164","mutation_count":12,"result":{"Total":12,"Killed":12,"Survived":0,"Errors":0},"tested_at":"2026-11-19T12:58:48.112640299Z"},{"index":11,"name":"Overdue text 12","scenario_hash":"73e582dc47fbdcc8cdf97d328af9e3b39155e5d5ccf88ddbe0f978841c4839a0","mutation_count":21,"result":{"Total":21,"Killed":21,"Survived":0,"Errors":0},"tested_at":"2026-11-19T12:58:48.112640299Z"}]}
# acceptance-mutation-manifest-end

# Spec §6.1 (overdue text «Tocaba …» and Date and distance), with §5.1–§5.7
# (statuses, A, C, N, V). The row of an overdue task says since when it was due,
# as a fact with a date and a distance: «Tocaba <fecha>[ · <distancia>]», with «el»
# only before a date that has a weekday. It replaces «Atrasada» and does not
# change the statuses of §5 or the order of the list.
# Instant of «Tocaba» (never in the future):
# - one-off with due date: the day fechaLimite, without a time, with or without a schedule;
# - relative: V (with a time);
# - calendar: the day of N, without a time (missed occurrences do not pile up:
#   it is the first one not covered);
# - recurring with a schedule: A; with several schedules, the start of N; if A
#   has not arrived yet (it became overdue through the overdue point without a
#   schedule before the window opened), V.
# Date: «hoy», «ayer» or «mañana» if it falls on those local days; otherwise
# weekday and number («martes 10»), with « de <mes>» if the month is not the
# current one and « de <año>» if the year is not the current one; with a 24-hour
# HH:MM time when the instant is not 00:00.
# Distance after « · »: at 2 or more local days, «hace N días» (local days,
# not elapsed hours); with «hoy»/«ayer» and with a time, in hours or, under
# an hour, in minutes (elapsed time is rounded down, counted from now even if
# it crosses midnight); without a time, no distance.
# The text is a function of now: each Examples row with a different now is the
# text updating by itself as time passes.
# "the task row shows the text T" asserts that the list has a single row and
# that it says T. When the step does not give creadaEn, the task was created before
# any other date in the scenario. Reference week: Friday 2026-11-13
# (Tuesday 10, Wednesday 11, Thursday 12, Saturday 14, Sunday 15).
Feature: Overdue text

  # Overdue text 1
  # One-off with due date: the day of the due date, without a time. Edges: it
  # becomes overdue at 00:00 of the next day (row 3) and until 23:59:59 it is
  # still «ayer» (row 4); at 2 days (row 2); another month (row 5) and another year
  # (row 6).
  Scenario Outline: Overdue text 1
    Given a one-off task with due date <due_date>
    When I query Pendientes on <now>
    Then the task row shows the text <text>

    Examples:
      | due_date   | now                 | text                                                       |
      | 2026-11-10 | 2026-11-13T10:00:00 | Tocaba el martes 10 · hace 3 días                          |
      | 2026-11-11 | 2026-11-13T00:00:00 | Tocaba el miércoles 11 · hace 2 días                       |
      | 2026-11-12 | 2026-11-13T00:00:00 | Tocaba ayer                                                |
      | 2026-11-12 | 2026-11-13T23:59:59 | Tocaba ayer                                                |
      | 2026-10-28 | 2026-11-13T10:00:00 | Tocaba el miércoles 28 de octubre · hace 16 días           |
      | 2025-12-31 | 2026-01-03T10:00:00 | Tocaba el miércoles 31 de diciembre de 2025 · hace 3 días |

  # Overdue text 2
  # One-off with due date and schedule: it is still the day of the due date,
  # without a time, even if A (the first window since it was created) is weeks
  # earlier. Row 3: it becomes overdue at the close of the window of the due day, and that day
  # is «hoy», without a distance.
  Scenario Outline: Overdue text 2
    Given a one-off task with due date <due_date> created on <created>
    And the task can be completed from <from> to <to>
    When I query Pendientes on <now>
    Then the task row shows the text <text>

    Examples:
      | due_date   | created             | from  | to    | now                 | text                              |
      | 2026-11-10 | 2026-11-01T09:00:00 | 08:00 | 11:00 | 2026-11-13T10:00:00 | Tocaba el martes 10 · hace 3 días |
      | 2026-11-12 | 2026-11-01T09:00:00 | 08:00 | 11:00 | 2026-11-13T10:00:00 | Tocaba ayer                       |
      | 2026-11-13 | 2026-11-01T09:00:00 | 08:00 | 11:00 | 2026-11-13T11:00:00 | Tocaba hoy                        |

  # Overdue text 3
  # Relative: V (the due instant) with a time. Row 2: at 2 local days even though
  # 25 hours have passed. Row 4: crosses midnight. Row 7: elapsed time is
  # rounded down (1 hour and a half is «1 hora»). Row 8: another month. Row
  # 9: another year.
  Scenario Outline: Overdue text 3
    Given a relative recurring task every <every> <unit>
    And the task was completed on <completed>
    When I query Pendientes on <now>
    Then the task row shows the text <text>

    Examples:
      | every | unit   | completed           | now                 | text                                                        |
      | 2    | dias   | 2026-11-08T09:00:00 | 2026-11-13T10:00:00 | Tocaba el martes 10 09:00 · hace 3 días                     |
      | 1    | dias   | 2026-11-10T23:00:00 | 2026-11-13T00:30:00 | Tocaba el miércoles 11 23:00 · hace 2 días                  |
      | 3    | horas  | 2026-11-12T18:00:00 | 2026-11-13T10:00:00 | Tocaba ayer 21:00 · hace 13 horas                           |
      | 1    | horas  | 2026-11-12T22:00:00 | 2026-11-13T01:00:00 | Tocaba ayer 23:00 · hace 2 horas                            |
      | 2    | horas  | 2026-11-13T02:00:00 | 2026-11-13T10:00:00 | Tocaba hoy 04:00 · hace 6 horas                             |
      | 1    | horas  | 2026-11-13T08:00:00 | 2026-11-13T10:00:00 | Tocaba hoy 09:00 · hace 1 hora                              |
      | 1    | horas  | 2026-11-13T07:30:00 | 2026-11-13T10:00:00 | Tocaba hoy 08:30 · hace 1 hora                              |
      | 2    | dias   | 2026-10-24T09:00:00 | 2026-11-13T10:00:00 | Tocaba el lunes 26 de octubre 09:00 · hace 18 días          |
      | 2    | dias   | 2025-12-27T09:00:00 | 2026-01-03T10:00:00 | Tocaba el lunes 29 de diciembre de 2025 09:00 · hace 5 días |

  # Overdue text 4
  # The text advances by itself as time passes, without changing task: the hour
  # and the distance go up (row 1 to 2), «hoy» becomes «ayer» at 00:00 (row 3)
  # and, two local days later, the distance becomes days (row 4).
  Scenario Outline: Overdue text 4
    Given a relative recurring task every <every> <unit>
    And the task was completed on <completed>
    When I query Pendientes on <now>
    Then the task row shows the text <text>

    Examples:
      | every | unit   | completed           | now                 | text                                   |
      | 1    | horas  | 2026-11-12T20:00:00 | 2026-11-12T22:00:00 | Tocaba hoy 21:00 · hace 1 hora         |
      | 1    | horas  | 2026-11-12T20:00:00 | 2026-11-12T23:59:59 | Tocaba hoy 21:00 · hace 2 horas        |
      | 1    | horas  | 2026-11-12T20:00:00 | 2026-11-13T00:00:00 | Tocaba ayer 21:00 · hace 3 horas       |
      | 1    | horas  | 2026-11-12T20:00:00 | 2026-11-14T00:00:00 | Tocaba el jueves 12 21:00 · hace 2 días |

  # Overdue text 5
  # Relative with a schedule: A, not V. Row 1: V (06:00) falls before the window and
  # the task is due since it opened (08:00). Row 2: it became overdue through the overdue point
  # without a schedule (V + interval, 08:00) before its window opened (20:00):
  # «Tocaba» never names a future instant and uses V. Row 3: A arrived (08:00),
  # the overdue point is the close (09:00).
  Scenario Outline: Overdue text 5
    Given a relative recurring task every <every> <unit>
    And the task was completed on <completed>
    And the task can be completed from <from> to <to>
    When I query Pendientes on <now>
    Then the task row shows the text <text>

    Examples:
      | every | unit   | completed           | from  | to    | now                 | text                                   |
      | 1    | dias   | 2026-11-11T06:00:00 | 08:00 | 10:00 | 2026-11-12T12:00:00 | Tocaba hoy 08:00 · hace 4 horas        |
      | 3    | horas  | 2026-11-13T02:00:00 | 20:00 | 22:00 | 2026-11-13T10:00:00 | Tocaba hoy 05:00 · hace 5 horas        |
      | 3    | horas  | 2026-11-13T04:00:00 | 08:00 | 09:00 | 2026-11-13T10:00:00 | Tocaba hoy 08:00 · hace 2 horas        |
      | 1    | dias   | 2026-11-08T06:00:00 | 08:00 | 10:00 | 2026-11-13T10:00:00 | Tocaba el lunes 9 08:00 · hace 4 días |

  # Overdue text 6
  # Weekly calendar: the day of N, without a time. Row 1: it missed Tuesday 3 and
  # Thursday 5 and 12, and it says the first one not covered, not the last. Row 3: it
  # becomes overdue at 00:00 of the day after N. Rows 4 and 5: another month and another year.
  Scenario Outline: Overdue text 6
    Given a weekly recurring task on <days> created on <created>
    When I query Pendientes on <now>
    Then the task row shows the text <text>

    Examples:
      | days           | created             | now                 | text                                                   |
      | martes, jueves | 2026-11-02T08:00:00 | 2026-11-13T10:00:00 | Tocaba el martes 3 · hace 10 días                      |
      | jueves         | 2026-11-11T08:00:00 | 2026-11-13T10:00:00 | Tocaba ayer                                            |
      | jueves         | 2026-11-11T08:00:00 | 2026-11-13T00:00:00 | Tocaba ayer                                            |
      | miércoles      | 2026-10-20T08:00:00 | 2026-11-13T10:00:00 | Tocaba el miércoles 21 de octubre · hace 23 días       |
      | lunes          | 2025-12-29T08:00:00 | 2026-01-03T10:00:00 | Tocaba el lunes 29 de diciembre de 2025 · hace 5 días  |

  # Overdue text 7
  # Monthly calendar: the day of N, without a time.
  Scenario Outline: Overdue text 7
    Given a monthly recurring task on days <days> created on <created>
    When I query Pendientes on <now>
    Then the task row shows the text <text>

    Examples:
      | days | created             | now                 | text                               |
      | 10   | 2026-11-01T08:00:00 | 2026-11-13T10:00:00 | Tocaba el martes 10 · hace 3 días  |
      | 1    | 2026-10-31T08:00:00 | 2026-11-13T10:00:00 | Tocaba el domingo 1 · hace 12 días |

  # Overdue text 8
  # Calendar with one window: A, the start of the occurrence, with a time. Rows
  # 2 to 5: in minutes, rounded down (59 extra seconds do not add a
  # minute); row 6: on the hour it becomes hours. Row 1: crosses
  # midnight. Row 8: at 2 or more days, with a time.
  Scenario Outline: Overdue text 8
    Given a weekly recurring task on <days> created on <created>
    And the task can be completed from <from> to <to>
    When I query Pendientes on <now>
    Then the task row shows the text <text>

    Examples:
      | days    | created             | from  | to    | now                 | text                                   |
      | jueves  | 2026-11-11T08:00:00 | 22:00 | 23:30 | 2026-11-13T01:00:00 | Tocaba ayer 22:00 · hace 3 horas       |
      | viernes | 2026-11-12T08:00:00 | 09:20 | 09:50 | 2026-11-13T10:00:00 | Tocaba hoy 09:20 · hace 40 minutos     |
      | viernes | 2026-11-12T08:00:00 | 09:20 | 09:50 | 2026-11-13T10:00:59 | Tocaba hoy 09:20 · hace 40 minutos     |
      | viernes | 2026-11-12T08:00:00 | 09:20 | 09:50 | 2026-11-13T10:01:00 | Tocaba hoy 09:20 · hace 41 minutos     |
      | viernes | 2026-11-12T08:00:00 | 09:01 | 09:30 | 2026-11-13T10:00:00 | Tocaba hoy 09:01 · hace 59 minutos     |
      | viernes | 2026-11-12T08:00:00 | 09:00 | 09:30 | 2026-11-13T10:00:00 | Tocaba hoy 09:00 · hace 1 hora         |
      | viernes | 2026-11-12T08:00:00 | 08:00 | 09:30 | 2026-11-13T10:00:00 | Tocaba hoy 08:00 · hace 2 horas        |
      | martes  | 2026-11-02T08:00:00 | 09:00 | 11:00 | 2026-11-13T10:00:00 | Tocaba el martes 3 09:00 · hace 10 días |

  # Overdue text 9
  # Calendar with several schedules: the start of N. With the morning missed, it is still
  # due since 07:00, also after the afternoon window (§5.6:
  # missed occurrences do not pile up).
  Scenario Outline: Overdue text 9
    Given a weekly recurring task on <days> created on <created>
    And the task can be completed from <from> to <to> and from <from2> to <to2>
    When I query Pendientes on <now>
    Then the task row shows the text <text>

    Examples:
      | days    | created             | from  | to    | from2  | to2    | now                 | text                               |
      | viernes | 2026-11-12T08:00:00 | 07:00 | 10:00 | 18:00  | 21:00  | 2026-11-13T10:00:00 | Tocaba hoy 07:00 · hace 3 horas    |
      | viernes | 2026-11-12T08:00:00 | 07:00 | 10:00 | 18:00  | 21:00  | 2026-11-13T21:00:00 | Tocaba hoy 07:00 · hace 14 horas   |

  # Overdue text 10
  # Relative with several schedules, never completed: the start of N, the first
  # window whose end is later than creadaEn (row 1, the one that was in
  # progress; row 2, the afternoon one).
  Scenario Outline: Overdue text 10
    Given a relative recurring task every <every> <unit> created on <created>
    And the task can be completed from <from> to <to> and from <from2> to <to2>
    When I query Pendientes on <now>
    Then the task row shows the text <text>

    Examples:
      | every | unit   | created             | from  | to    | from2  | to2    | now                 | text                                    |
      | 2    | dias   | 2026-11-10T08:00:00 | 07:00 | 10:00 | 18:00  | 21:00  | 2026-11-13T10:00:00 | Tocaba el martes 10 07:00 · hace 3 días |
      | 2    | dias   | 2026-11-10T12:00:00 | 07:00 | 10:00 | 18:00  | 21:00  | 2026-11-13T10:00:00 | Tocaba el martes 10 18:00 · hace 3 días |

  # Overdue text 11
  # The text does not change the order: the one of §6.1 is still since when it is
  # overdue (Pagar, since the 11th at 00:00, before Regar, since the 12th at
  # 09:00), even though Regar was «due» earlier (Sunday 8) than Pagar (Tuesday 10).
  Scenario Outline: Overdue text 11
    Given a one-off task Pagar with due date <due_date>
    And a relative recurring task Regar every <every> <unit>
    And the task Regar was completed on <completed>
    When I query Pendientes on <now>
    Then Pendientes shows in order <order>
    And the row of Pagar shows the text <text_pay>
    And the row of Regar shows the text <text_water>

    Examples:
      | due_date   | every | unit   | completed           | now                 | order        | text_pay                          | text_water                              |
      | 2026-11-10 | 4    | dias   | 2026-11-04T09:00:00 | 2026-11-13T10:00:00 | Pagar, Regar | Tocaba el martes 10 · hace 3 días | Tocaba el domingo 8 09:00 · hace 5 días |

  # Overdue text 12
  # Less than a minute elapsed: «ahora», not «hace 0 minutos» (§6.1, S16).
  # With the shortest window (one minute) the task becomes overdue at the close and 60
  # seconds have already passed since A, so the reachable edge is the exact
  # minute (row 1): «hace 1 minuto», singular; 59 more seconds are still
  # that minute (row 2) and at 60 it becomes «hace 2 minutos» (row 3).
  Scenario Outline: Overdue text 12
    Given a weekly recurring task on <days> created on <created>
    And the task can be completed from <from> to <to>
    When I query Pendientes on <now>
    Then the task row shows the text <text>

    Examples:
      | days    | created             | from  | to    | now                 | text                               |
      | viernes | 2026-11-12T08:00:00 | 10:00 | 10:01 | 2026-11-13T10:01:00 | Tocaba hoy 10:00 · hace 1 minuto   |
      | viernes | 2026-11-12T08:00:00 | 10:00 | 10:01 | 2026-11-13T10:01:59 | Tocaba hoy 10:00 · hace 1 minuto   |
      | viernes | 2026-11-12T08:00:00 | 10:00 | 10:01 | 2026-11-13T10:02:00 | Tocaba hoy 10:00 · hace 2 minutos  |
