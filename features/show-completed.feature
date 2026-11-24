# mutation-stamp: sha256=54bfe99125eb4422fbfebf0b174964bce4b1494326d3c37b6803428625442695
# acceptance-mutation-manifest-begin
# {"version":1,"tested_at":"2026-11-24T02:58:57.139431438Z","feature_name":"Mostrar completadas","feature_path":"features/show-completed.feature","background_hash":"74234e98afe7498fb5daf1f36ac2d78acc339464f950703b8c019892f982b90b","implementation_hash":"sha256:f86683c134258e0ac70025913a3091f25405b911567b1f0f7dfcabcc778177ca","scenarios":[{"index":0,"name":"Mostrar completadas 1","scenario_hash":"562d6fd328d63fbc637133819bf645200cbebd9c0c95a1e66cbbec29fd14e100","mutation_count":21,"result":{"Total":21,"Killed":21,"Survived":0,"Errors":0},"tested_at":"2026-11-24T02:58:57.139431438Z"},{"index":1,"name":"Mostrar completadas 2","scenario_hash":"089a7478fa16fdd475b2fd82b9f92868563c93c1345203f8a13e053609ab11fe","mutation_count":29,"result":{"Total":29,"Killed":29,"Survived":0,"Errors":0},"tested_at":"2026-11-24T02:58:57.139431438Z"},{"index":2,"name":"Mostrar completadas 3","scenario_hash":"7057ad29986e527f045f24a2767497f3bd2f448ef4a3cb4858706bac8468b463","mutation_count":15,"result":{"Total":15,"Killed":15,"Survived":0,"Errors":0},"tested_at":"2026-11-24T02:58:57.139431438Z"},{"index":3,"name":"Mostrar completadas 4","scenario_hash":"536611dbeb37f2b654315e39570e201f13574997cff7fbde26fec13c9002b300","mutation_count":29,"result":{"Total":29,"Killed":29,"Survived":0,"Errors":0},"tested_at":"2026-11-24T02:58:57.139431438Z"},{"index":4,"name":"Mostrar completadas 6","scenario_hash":"a290f223b4ff5ff015fd97addc982129e3b13f06df78bb402d91d960590b0d9b","mutation_count":3,"result":{"Total":3,"Killed":3,"Survived":0,"Errors":0},"tested_at":"2026-11-24T02:58:57.139431438Z"},{"index":5,"name":"Mostrar completadas 7","scenario_hash":"3abf954d3120cf6975ba98f18979eb566e789ecef49425adfaade53242430f9c","mutation_count":4,"result":{"Total":4,"Killed":4,"Survived":0,"Errors":0},"tested_at":"2026-11-24T02:58:57.139431438Z"},{"index":6,"name":"Mostrar completadas 8","scenario_hash":"deaef23469fe51bdd365f5d87600fae5fcbcbb76247b27a0d14c857e214b991b","mutation_count":2,"result":{"Total":2,"Killed":2,"Survived":0,"Errors":0},"tested_at":"2026-11-24T02:58:57.139431438Z"},{"index":7,"name":"Mostrar completadas 9","scenario_hash":"ec5919ba645a3302d4c53edcaab35adac657a1de676904b7d4a99e18f324eb33","mutation_count":1,"result":{"Total":1,"Killed":1,"Survived":0,"Errors":0},"tested_at":"2026-11-24T02:58:57.139431438Z"}]}
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
