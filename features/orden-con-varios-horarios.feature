# mutation-stamp: sha256=7245475c0d1c5789ec68f82ff037272304a63aec647278647974cf0bef8bd321
# acceptance-mutation-manifest-begin
# {"version":1,"tested_at":"2026-11-19T12:43:03.674871473Z","feature_name":"Order with several schedules","feature_path":"features/orden-con-varios-horarios.feature","background_hash":"74234e98afe7498fb5daf1f36ac2d78acc339464f950703b8c019892f982b90b","implementation_hash":"sha256:6b9ea885e9586f6952f5f2db0311ea4b77156bfa794af3d1f3f3450d0eaacb0d","scenarios":[{"index":0,"name":"Order with several schedules 1","scenario_hash":"399a6b2652b81cef421d24284659d0327b2eb2ccd420405707bccf8d0dbb2292","mutation_count":21,"result":{"Total":21,"Killed":21,"Survived":0,"Errors":0},"tested_at":"2026-11-19T12:43:03.674871473Z"},{"index":1,"name":"Order with several schedules 2","scenario_hash":"f97857284c44554afba1d9f9afc01401fdc515fef8df18b1dfcb6e1f93ff764b","mutation_count":26,"result":{"Total":26,"Killed":26,"Survived":0,"Errors":0},"tested_at":"2026-11-19T12:43:03.674871473Z"}]}
# acceptance-mutation-manifest-end

# Spec §5.5, §5.6 and §6.1. The order by urgency of a task with several
# windows uses the occurrence N: C (the to of its window) as the start of
# overdue and A (its from) as the start of pending. A relative without a
# schedule uses V + interval and V. Reference week: Tuesday 2026-07-14,
# Wednesday 15.
Feature: Order with several schedules

  # Order with several schedules 1
  # Overdue: Basura (calendar, created on Tuesday) missed the Wednesday morning
  # and is overdue since its close (10:00). Regar, relative without a
  # schedule, since V + interval: row 1, at 11:00, after; row 2, at
  # 09:00, before.
  Scenario Outline: Order with several schedules 1
    Given a weekly recurring task Basura on <days> created on <created_trash>
    And the task Basura can be completed from <from> to <to> and from <from2> to <to2>
    And a relative recurring task Regar every <every> <unit>
    And the task Regar was completed on <completed_water>
    When I query Pendientes on <now>
    Then Pendientes shows in order <order>

    Examples:
      | days      | created_trash       | from  | to    | from2  | to2    | every | unit   | completed_water     | now                 | order         |
      | miércoles | 2026-07-14T12:00:00 | 07:00 | 10:00 | 18:00  | 21:00  | 4    | horas  | 2026-07-15T03:00:00 | 2026-07-15T12:00:00 | Basura, Regar |
      | miércoles | 2026-07-14T12:00:00 | 07:00 | 10:00 | 18:00  | 21:00  | 4    | horas  | 2026-07-15T01:00:00 | 2026-07-15T12:00:00 | Regar, Basura |

  # Order with several schedules 2
  # Pendientes: Basura, with the morning covered, is pending since the
  # from of the afternoon (18:00), not since 00:00 of the day. Regar, relative
  # without a schedule, since V: row 1, at 18:30, after; row 2, at 17:30,
  # before.
  Scenario Outline: Order with several schedules 2
    Given a weekly recurring task Basura on <days>
    And the task Basura has a completion from <completed_trash> that covers <covered_trash>
    And the task Basura can be completed from <from> to <to> and from <from2> to <to2>
    And a relative recurring task Regar every <every> <unit>
    And the task Regar was completed on <completed_water>
    When I query Pendientes on <now>
    Then Pendientes shows in order <order>

    Examples:
      | days      | completed_trash     | covered_trash       | from  | to    | from2  | to2    | every | unit   | completed_water     | now                 | order         |
      | miércoles | 2026-07-15T08:00:00 | 2026-07-15T07:00:00 | 07:00 | 10:00 | 18:00  | 21:00  | 1    | dias   | 2026-07-14T18:30:00 | 2026-07-15T19:00:00 | Basura, Regar |
      | miércoles | 2026-07-15T08:00:00 | 2026-07-15T07:00:00 | 07:00 | 10:00 | 18:00  | 21:00  | 1    | dias   | 2026-07-14T17:30:00 | 2026-07-15T19:00:00 | Regar, Basura |
