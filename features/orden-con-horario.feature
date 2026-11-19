# mutation-stamp: sha256=6a920ba4d215c9d965a7a81182f3132bdf06f964105a8bf67ec5bad0809d1a1e
# acceptance-mutation-manifest-begin
# {"version":1,"tested_at":"2026-11-19T12:42:39.494217196Z","feature_name":"Order with schedule","feature_path":"features/orden-con-horario.feature","background_hash":"74234e98afe7498fb5daf1f36ac2d78acc339464f950703b8c019892f982b90b","implementation_hash":"sha256:8d60ba7f6c1fc0ac5f0f19ce6911a5a671ca9ed34e85e347e1549ca19d63cd2e","scenarios":[{"index":0,"name":"Order with schedule 1","scenario_hash":"7362097a4df14226a4034a095f78c0ad58df86d4679aa6fe25f302dccb849685","mutation_count":26,"result":{"Total":26,"Killed":26,"Survived":0,"Errors":0},"tested_at":"2026-11-19T12:42:39.494217196Z"},{"index":1,"name":"Order with schedule 2","scenario_hash":"6abb31d7e7fe339d0cc57ece6f17e6980aa8c148a14065edfba7695434e0be2e","mutation_count":19,"result":{"Total":19,"Killed":19,"Survived":0,"Errors":0},"tested_at":"2026-11-19T12:42:39.494217196Z"},{"index":2,"name":"Order with schedule 3","scenario_hash":"8fb359f94c7c75f71fd89543ed649b7c8a84154ee8fcf2b96f63200db8f866e7","mutation_count":17,"result":{"Total":17,"Killed":17,"Survived":0,"Errors":0},"tested_at":"2026-11-19T12:42:39.494217196Z"},{"index":3,"name":"Order with schedule 4","scenario_hash":"a11a72bd810cc8a4c645397144d10cf320a74c0e8fa5865bb713f726c6912712","mutation_count":17,"result":{"Total":17,"Killed":17,"Survived":0,"Errors":0},"tested_at":"2026-11-19T12:42:39.494217196Z"}]}
# acceptance-mutation-manifest-end

# Spec §5.5 (last point) and §6.1 (order by urgency).
# With a schedule, the order of §6.1 uses:
#   overdue: the overdue point, the earlier of C and the overdue point without a schedule
#     (relative: V + interval; one-off with due date: the to of the
#     window of the day fechaLimite).
#   pending: in a recurring task, A, the instant at which it became available.
#     A one-off keeps the key of §6.1: 00:00 of fechaLimite; without a
#     due date, at the end of the group by creadaEn.
#   waiting: A, the moment it goes back to pending.
# Tasks without a schedule keep using the instants of §6.1. A, C, U, V and N as
# in §5.2, §5.3 and §5.5. Reference week: Monday 2026-07-13 to Sunday
# 2026-07-19.
# Each task is named by its title (one word). "Pendientes shows in
# order" gives the titles from top to bottom, separated by ", ", and the list
# has no other rows. When the step does not give creadaEn, all those tasks were
# created at the same instant, earlier than any other date in the scenario.
# "the task X can be completed from D to H" is the schedule of task X.
# Tasks are declared in an order different from the expected one: the loading order
# decides nothing.
Feature: Order with schedule

  # Order with schedule 1
  # Overdue: Pagar (schedule) is overdue since the close of the window
  # of its due day (the 15th at 11:00), before Barrer, without a schedule,
  # since 00:00 of the 16th (without a schedule they would tie and Barrer would go first
  # by title). Basura, without a schedule, since V + interval (the 16th at
  # 10:45). Row 1: Regar since C (the 16th at 11:00). Row 2: Regar since
  # V + interval (10:30), earlier than C.
  Scenario Outline: Order with schedule 1
    Given a relative recurring task Regar every <every> <unit>
    And the task Regar was completed on <completed_water>
    And the task Regar can be completed from <from> to <to>
    And a relative recurring task Basura every <every_trash> <unit_trash>
    And the task Basura was completed on <completed_trash>
    And a one-off task Barrer with due date <due_date>
    And a one-off task Pagar with due date <due_date>
    And the task Pagar can be completed from <from> to <to>
    When I query Pendientes on <now>
    Then Pendientes shows in order <order>

    Examples:
      | every | unit   | completed_water     | from  | to    | every_trash | unit_trash    | completed_trash     | due_date   | now                 | order                        |
      | 1    | dias   | 2026-07-15T09:00:00 | 08:00 | 11:00 | 4           | horas         | 2026-07-16T02:45:00 | 2026-07-15 | 2026-07-16T12:00:00 | Pagar, Barrer, Basura, Regar |
      | 1    | horas  | 2026-07-16T08:30:00 | 08:00 | 11:00 | 4           | horas         | 2026-07-16T02:45:00 | 2026-07-15 | 2026-07-16T12:00:00 | Pagar, Barrer, Regar, Basura |

  # Order with schedule 2
  # Pendientes: Regar (schedule) is pending since A, the from of the 16th
  # (08:00), not since V (the 15th at 12:00, outside the window). Row 1:
  # Basura, without a schedule, since V the 15th at 20:00, goes first. Row 2:
  # Basura since V the 16th at 08:30, goes after.
  Scenario Outline: Order with schedule 2
    Given a relative recurring task Regar every <every> <unit>
    And the task Regar was completed on <completed_water>
    And the task Regar can be completed from <from> to <to>
    And a relative recurring task Basura every <every> <unit>
    And the task Basura was completed on <completed_trash>
    When I query Pendientes on <now>
    Then Pendientes shows in order <order>

    Examples:
      | every | unit   | completed_water     | from  | to    | completed_trash     | now                 | order         |
      | 1    | dias   | 2026-07-14T12:00:00 | 08:00 | 11:00 | 2026-07-14T20:00:00 | 2026-07-16T09:00:00 | Basura, Regar |
      | 1    | dias   | 2026-07-14T12:00:00 | 08:00 | 11:00 | 2026-07-15T08:30:00 | 2026-07-16T09:00:00 | Regar, Basura |

  # Order with schedule 3
  # Waiting (without completions, so they are shown with Mostrar completadas
  # off): the ones that come back sooner go first. Sábanas, without a schedule, comes back
  # on Thursday at 00:00; Basura, on Thursday when its window opens (09:00);
  # Foco, a one-off created after its window, when Thursday's opens.
  # Row 1: Foco at 08:00. Row 2: Foco at 10:00.
  Scenario Outline: Order with schedule 3
    Given a one-off task Foco without a due date created on <created_focus>
    And the task Foco can be completed from <from_bulb> to <to_bulb>
    And a weekly recurring task Basura on <days> created on <created_trash>
    And the task Basura can be completed from <from_trash> to <to_trash>
    And a weekly recurring task Sábanas on <days_sheets> created on <created_sheets>
    When I query Pendientes on <now>
    Then Pendientes shows in order <order>

    Examples:
      | created_focus       | from_bulb  | to_bulb    | days   | created_trash       | from_trash   | to_trash     | days_sheets  | created_sheets      | now                 | order                 |
      | 2026-07-15T12:00:00 | 08:00      | 11:00      | jueves | 2026-07-15T08:00:00 | 09:00        | 10:00        | jueves       | 2026-07-15T08:00:00 | 2026-07-15T14:00:00 | Sábanas, Foco, Basura |
      | 2026-07-15T12:00:00 | 10:00      | 11:00      | jueves | 2026-07-15T08:00:00 | 09:00        | 10:00        | jueves       | 2026-07-15T08:00:00 | 2026-07-15T14:00:00 | Sábanas, Basura, Foco |

  # Order with schedule 4
  # Pendientes: a one-off with a schedule keeps the key of §6.1, not A
  # (which, by its creadaEn, would be earlier than everything). Pagar goes by 00:00
  # of its due date: row 1, the 16th, before Basura (V the 16th at
  # 08:30); row 2, the 17th, after. Foco, with no due date, goes last.
  Scenario Outline: Order with schedule 4
    Given a one-off task Foco without a due date
    And the task Foco can be completed from <from> to <to>
    And a relative recurring task Basura every <every> <unit>
    And the task Basura was completed on <completed_trash>
    And a one-off task Pagar with due date <due_date>
    And the task Pagar can be completed from <from> to <to>
    When I query Pendientes on <now>
    Then Pendientes shows in order <order>

    Examples:
      | from  | to    | every | unit   | completed_trash     | due_date   | now                 | order               |
      | 08:00 | 11:00 | 1    | dias   | 2026-07-15T08:30:00 | 2026-07-16 | 2026-07-16T09:00:00 | Pagar, Basura, Foco |
      | 08:00 | 11:00 | 1    | dias   | 2026-07-15T08:30:00 | 2026-07-17 | 2026-07-16T09:00:00 | Basura, Pagar, Foco |
