# mutation-stamp: sha256=2f7dbd573613fa6ae0d8147a7ba36b0727f64e4d6a7f98fbfb33b4fc9b9b5780
# acceptance-mutation-manifest-begin
# {"version":1,"tested_at":"2026-11-22T22:06:02.576136644Z","feature_name":"Mostrar completadas","feature_path":"features/show-completed.feature","background_hash":"74234e98afe7498fb5daf1f36ac2d78acc339464f950703b8c019892f982b90b","implementation_hash":"sha256:73a46c9b157a3cf1314b0bd4059dfbfa315bc8bf953fb2ac61c15d2565aec548","scenarios":[{"index":0,"name":"Mostrar completadas 1","scenario_hash":"562d6fd328d63fbc637133819bf645200cbebd9c0c95a1e66cbbec29fd14e100","mutation_count":21,"result":{"Total":21,"Killed":21,"Survived":0,"Errors":0},"tested_at":"2026-11-22T22:06:02.576136644Z"},{"index":1,"name":"Mostrar completadas 2","scenario_hash":"3ad0ed52e441fd67768612eaa1fd1681b6a4943e675eb6b033e27d11a444e34b","mutation_count":33,"result":{"Total":33,"Killed":33,"Survived":0,"Errors":0},"tested_at":"2026-11-22T22:06:02.576136644Z"},{"index":2,"name":"Mostrar completadas 3","scenario_hash":"8f26ab3324c20c1c44ec02635f8f19f48ff809bd3ea7f38b0876dcd0a3804b2d","mutation_count":8,"result":{"Total":8,"Killed":8,"Survived":0,"Errors":0},"tested_at":"2026-11-22T22:06:02.576136644Z"},{"index":3,"name":"Mostrar completadas 4","scenario_hash":"688b7e90273ad21ddfbf5b99e5b21cf00985eeecd87e3cc68cf4e3751a15425c","mutation_count":25,"result":{"Total":25,"Killed":25,"Survived":0,"Errors":0},"tested_at":"2026-11-22T22:06:02.576136644Z"},{"index":4,"name":"Mostrar completadas 6","scenario_hash":"a290f223b4ff5ff015fd97addc982129e3b13f06df78bb402d91d960590b0d9b","mutation_count":3,"result":{"Total":3,"Killed":3,"Survived":0,"Errors":0},"tested_at":"2026-11-22T22:06:02.576136644Z"},{"index":5,"name":"Mostrar completadas 7","scenario_hash":"3abf954d3120cf6975ba98f18979eb566e789ecef49425adfaade53242430f9c","mutation_count":4,"result":{"Total":4,"Killed":4,"Survived":0,"Errors":0},"tested_at":"2026-11-22T22:06:02.576136644Z"}]}
# acceptance-mutation-manifest-end

# Spec §6.1 (Mostrar completadas), with §5.1–§5.3. A task is completed
# if it is one-off with at least one completion, or recurring and waiting with at
# least one completion. A recurring calendar task waiting without completions
# (before its first occurrence) is not completed; a recurring
# pending or overdue one is not either, even if it has completions.
# A completed one-off task is never shown in Pendientes, with Mostrar completadas
# on or off.
#   Off (initial value): Pendientes shows only the non-completed ones.
#   On: after the non-completed ones (in urgency order) come
#     the completed recurring ones, from most recent completadoEn to oldest; if
#     tied, oldest creadaEn first, then title in
#     alphabetical order in Spanish, then id (not observable).
# That the value is stored on the device and survives a reload, that it is an on/off
# item of the ⋮ menu, and the contrast (bold against struck-through and
# dimmed), are verified in the QA suite.
# Each task is named by its title (one word). "Pendientes shows in
# order" gives the titles from top to bottom and the list has no other
# rows. "Pendientes shows as completed" gives, in order, the titles of
# the rows that look completed; the other rows look non-completed.
# When the step does not give creadaEn, the task was created before any other
# date of the scenario; those that do not give creadaEn were created in the declared
# order. Without the step "Mostrar completadas is on", the check is
# at its initial value.
# Reference week: Monday 2026-07-13 to Sunday 2026-07-19.
Feature: Mostrar completadas

  # Mostrar completadas 1
  # Off (initial value): the completed one-off and the recurring
  # tasks waiting with completions are not shown (row 1, also with a completion
  # "from the future" in row 3). The pending or overdue recurring tasks with
  # completions (rows 2 and 3) and the weekly one waiting that
  # has not yet had its first occurrence (row 1) are shown.
  Scenario Outline: Mostrar completadas 1
    Given a one-off task Pagar without a due date
    And the task Pagar has a completion
    And a relative recurring task Regar every <every> <unit>
    And the task Regar was completed on <completed>
    And a weekly recurring task Basura on <days>
    And the task Basura has a completion that covers <covered>
    And a weekly recurring task Sábanas on <days_sheets> created on <created_sheets>
    When I query Pendientes on <now>
    Then Pendientes shows in order <order>

    Examples:
      | every | unit   | completed           | days           | covered    | days_sheets  | created_sheets      | now                 | order                  |
      | 1    | dias   | 2026-07-15T08:00:00 | martes, jueves | 2026-07-14 | sábado       | 2026-07-15T08:00:00 | 2026-07-15T12:00:00 | Sábanas                |
      | 4    | horas  | 2026-07-15T07:00:00 | miércoles      | 2026-07-08 | jueves       | 2026-07-15T08:00:00 | 2026-07-15T12:00:00 | Basura, Regar, Sábanas |
      | 4    | horas  | 2026-07-15T21:00:00 | lunes          | 2026-07-06 | miércoles    | 2026-07-15T08:00:00 | 2026-07-15T12:00:00 | Basura, Sábanas        |

  # Mostrar completadas 2
  # On: first the non-completed ones in their urgency order; then
  # the completed recurring ones, from most recent completadoEn to oldest. Row 3:
  # Regar has a completion but is pending, so it goes with the non-completed
  # ones. Row 4: a completion "from the future" (skewed clocks) is the most recent.
  Scenario Outline: Mostrar completadas 2
    Given Mostrar completadas is on
    And a one-off task Foco without a due date
    And a relative recurring task Regar every <every> <unit>
    And the task Regar was completed on <completed_water>
    And a weekly recurring task Basura on <days>
    And the task Basura has a completion from <completed_trash> that covers <covered>
    When I query Pendientes on <now>
    Then Pendientes shows in order <order>
    And Pendientes shows as completed <completed_list>

    Examples:
      | every | unit   | completed_water     | days           | completed_trash     | covered    | now                 | order              | completed_list |
      | 1    | dias   | 2026-07-15T08:00:00 | martes, jueves | 2026-07-14T10:00:00 | 2026-07-14 | 2026-07-15T12:00:00 | Foco, Regar, Basura | Regar, Basura  |
      | 1    | dias   | 2026-07-15T10:00:00 | martes, jueves | 2026-07-15T11:00:00 | 2026-07-16 | 2026-07-15T12:00:00 | Foco, Basura, Regar | Basura, Regar  |
      | 4    | horas  | 2026-07-15T07:00:00 | martes, jueves | 2026-07-15T11:00:00 | 2026-07-16 | 2026-07-15T12:00:00 | Regar, Foco, Basura | Basura         |
      | 4    | horas  | 2026-07-15T21:00:00 | martes, jueves | 2026-07-15T11:00:00 | 2026-07-16 | 2026-07-15T12:00:00 | Foco, Regar, Basura | Regar, Basura  |

  # Mostrar completadas 3
  # On: a weekly one waiting without completions (before its first
  # occurrence) is not completed; it goes with the non-completed ones, in the waiting
  # group, before the completed ones (row 1). Created on an
  # occurrence day, it is pending (row 2).
  Scenario Outline: Mostrar completadas 3
    Given Mostrar completadas is on
    And a one-off task Foco without a due date
    And a relative recurring task Regar every <every> <unit>
    And the task Regar was completed on <completed>
    And a weekly recurring task Sábanas on <days_sheets> created on <created_sheets>
    When I query Pendientes on <now>
    Then Pendientes shows in order <order>
    And Pendientes shows as completed <completed_list>

    Examples:
      | every | unit   | completed           | days_sheets  | created_sheets      | now                 | order                | completed_list |
      | 1    | dias   | 2026-07-15T08:00:00 | sábado       | 2026-07-15T08:00:00 | 2026-07-15T12:00:00 | Foco, Sábanas, Regar | Regar          |
      | 1    | dias   | 2026-07-15T08:00:00 | miércoles    | 2026-07-15T08:00:00 | 2026-07-15T12:00:00 | Sábanas, Foco, Regar | Regar          |

  # Mostrar completadas 4
  # On, completed recurring ones with the same completadoEn: first the one with the
  # oldest creadaEn (rows 1 and 2); with the same creadaEn, by title in alphabetical
  # order in Spanish (row 3).
  Scenario Outline: Mostrar completadas 4
    Given Mostrar completadas is on
    And a relative recurring task Planchar every <every> <unit> created on <created_iron>
    And the task Planchar was completed on <completed_iron>
    And a relative recurring task Barrer every <every> <unit> created on <created_sweep>
    And the task Barrer was completed on <completed_sweep>
    When I query Pendientes on <now>
    Then Pendientes shows in order <order>

    Examples:
      | every | unit   | created_iron        | completed_iron      | created_sweep       | completed_sweep     | now                 | order            |
      | 2    | dias   | 2026-07-10T08:00:00 | 2026-07-15T08:00:00 | 2026-07-10T08:00:01 | 2026-07-15T08:00:00 | 2026-07-15T12:00:00 | Planchar, Barrer |
      | 2    | dias   | 2026-07-10T08:00:01 | 2026-07-15T08:00:00 | 2026-07-10T08:00:00 | 2026-07-15T08:00:00 | 2026-07-15T12:00:00 | Barrer, Planchar |
      | 2    | dias   | 2026-07-10T08:00:00 | 2026-07-15T08:00:00 | 2026-07-10T08:00:00 | 2026-07-15T08:00:00 | 2026-07-15T12:00:00 | Barrer, Planchar |

  # Mostrar completadas 6
  # Off: when completing a task, its row disappears from Pendientes.
  Scenario Outline: Mostrar completadas 6
    Given a one-off task Foco without a due date
    And a relative recurring task Regar never completed
    When I complete the task Regar on <completed>
    And I query Pendientes on <now>
    Then Pendientes shows in order <order>

    Examples:
      | completed           | now                 | order |
      | 2026-07-15T08:00:00 | 2026-07-15T08:00:01 | Foco  |

  # Mostrar completadas 7
  # On: when completing a task, it moves to the completed ones, at the end.
  Scenario Outline: Mostrar completadas 7
    Given Mostrar completadas is on
    And a one-off task Foco without a due date
    And a relative recurring task Regar never completed
    When I complete the task Regar on <completed>
    And I query Pendientes on <now>
    Then Pendientes shows in order <order>
    And Pendientes shows as completed <completed_list>

    Examples:
      | completed           | now                 | order       | completed_list |
      | 2026-07-15T08:00:00 | 2026-07-15T08:00:01 | Foco, Regar | Regar       |

  # Mostrar completadas 8
  # On: a completed one-off task is never shown, with or without a due date
  # (row 2: due date already passed, with a completion "from the future"); the
  # non-completed one-off keeps its row.
  Scenario Outline: Mostrar completadas 8
    Given Mostrar completadas is on
    And a one-off task Foco without a due date
    And a one-off task Pagar with due date <due_date>
    And the task Pagar was completed on <completed>
    When I query Pendientes on <now>
    Then Pendientes shows in order <order>

    Examples:
      | due_date   | completed           | now                 | order |
      | 2026-07-20 | 2026-07-15T09:00:00 | 2026-07-15T12:00:00 | Foco  |
      | 2026-07-14 | 2026-07-16T09:00:00 | 2026-07-15T12:00:00 | Foco  |

  # Mostrar completadas 9
  # On: completing a one-off task makes its row disappear, as with the item off
  # (it is not moved to the completed ones, unlike a recurring one in 7).
  Scenario Outline: Mostrar completadas 9
    Given Mostrar completadas is on
    And a one-off task Foco without a due date
    And a one-off task Pagar without a due date
    When I complete the task Pagar on <completed>
    And I query Pendientes on <now>
    Then Pendientes shows in order <order>

    Examples:
      | completed           | now                 | order |
      | 2026-07-15T08:00:00 | 2026-07-15T08:00:01 | Foco  |
