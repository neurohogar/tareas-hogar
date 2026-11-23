# mutation-stamp: sha256=361d46fa7e261fac6516ac0af25d170b105f855920e4b86b115c726ba9e388f1
# acceptance-mutation-manifest-begin
# {"version":1,"tested_at":"2026-11-22T21:55:44.430122403Z","feature_name":"Order with postponed tasks","feature_path":"features/order-postponed.feature","background_hash":"74234e98afe7498fb5daf1f36ac2d78acc339464f950703b8c019892f982b90b","implementation_hash":"sha256:c6f167b36a0a6555de356afe2926a5fd5716170173c76e5fa3d2aa4cd86ce84e","scenarios":[{"index":0,"name":"Order with postponed tasks 1","scenario_hash":"0326d93096d754051204499c6bb1b400b243b1073dd4446982beaf3be8875c00","mutation_count":31,"result":{"Total":31,"Killed":31,"Survived":0,"Errors":0},"tested_at":"2026-11-22T21:55:44.430122403Z"},{"index":1,"name":"Order with postponed tasks 2","scenario_hash":"c0d79815a0f0b300d805a112ce6ecf1e0591ef42b03931cb4e829a2c350200f5","mutation_count":10,"result":{"Total":10,"Killed":10,"Survived":0,"Errors":0},"tested_at":"2026-11-22T21:55:44.430122403Z"},{"index":2,"name":"Order with postponed tasks 3","scenario_hash":"e4f05be2eec9ab334d614541aae7a07271ec4e29e4513158ef737eb01a237026","mutation_count":12,"result":{"Total":12,"Killed":12,"Survived":0,"Errors":0},"tested_at":"2026-11-22T21:55:44.430122403Z"}]}
# acceptance-mutation-manifest-end

# Spec §5.9 (Posponer) with §6.1 (order by urgency and Mostrar completadas).
# A postponed task (now < pospuesta.hasta) that would be pending or overdue
# goes in the waiting group, and its order key is hasta: when it comes back.
# When it expires, it returns to its group with its usual key (the postponement does not
# move due dates or deadlines).
# A postponed task is not completed: it is visible with Mostrar completadas off,
# even if it is a recurring one with completions.
# Each task is named by its title (one word). "Pendientes shows in
# order" gives the titles from top to bottom, separated by ", ", and the
# list has no other rows. "Pendientes shows as completed" gives, in
# order, the titles of the rows that look completed; the others look
# not completed. When the step does not give creadaEn, the task was created before
# any other date of the scenario, in the declared order. "the task was
# postponed with option <option> on <moment>" is tapping Posponer in its
# panel at that moment and choosing the option. Without the step "Mostrar completadas
# is on", the check is at its initial value (off).
# Reference week: Monday 2026-07-13 to Sunday 2026-07-19.
Feature: Order with postponed tasks

  # Order with postponed tasks 1
  # Pagar (overdue, postponed until 13:00 on the 15th) and Regar (pending,
  # postponed until 07:00 on the 16th) go in waiting by hasta, among those waiting
  # by their rule (Sábanas comes back at 00:00 on the 16th): row 1. On
  # expiry, Pagar is again the first overdue one (row 2) and Regar returns
  # to pending with its key, creadaEn (row 3).
  Scenario Outline: Order with postponed tasks 1
    Given a one-off task Foco without a due date
    And a one-off task Pagar with due date <due_date>
    And the task Pagar was postponed with option <option_pay> on <postponed_pay>
    And a relative recurring task Regar every <every_water> <unit_water>
    And the task Regar was postponed with option <option_water> on <postponed_water>
    And a weekly recurring task Sábanas on <days> created on <created_sheets>
    When I query Pendientes on <now>
    Then Pendientes shows in order <order>

    Examples:
      | due_date   | option_pay   | postponed_pay       | every_water | unit_water   | option_water | postponed_water     | days   | created_sheets      | now                 | order                       |
      | 2026-07-14 | 3 horas      | 2026-07-15T10:00:00 | 2          | dias         | hasta mañana | 2026-07-15T10:00:00 | jueves | 2026-07-15T08:00:00 | 2026-07-15T11:00:00 | Foco, Pagar, Sábanas, Regar |
      | 2026-07-14 | 3 horas      | 2026-07-15T10:00:00 | 2          | dias         | hasta mañana | 2026-07-15T10:00:00 | jueves | 2026-07-15T08:00:00 | 2026-07-15T13:00:00 | Pagar, Foco, Sábanas, Regar |
      | 2026-07-14 | 3 horas      | 2026-07-15T10:00:00 | 2          | dias         | hasta mañana | 2026-07-15T10:00:00 | jueves | 2026-07-15T08:00:00 | 2026-07-16T07:00:00 | Pagar, Regar, Sábanas, Foco |

  # Order with postponed tasks 2
  # With Mostrar completadas off, Regar (postponed, with a completion from
  # today) is visible: it is not completed. Basura, waiting by its rule with a
  # completion, is not visible.
  Scenario Outline: Order with postponed tasks 2
    Given a one-off task Foco without a due date
    And a relative recurring task Regar every <every_water> <unit_water>
    And the task Regar was completed on <completed_water>
    And the task Regar was postponed with option <option_water> on <postponed_water>
    And a relative recurring task Basura every <every_trash> <unit_trash>
    And the task Basura was completed on <completed_trash>
    When I query Pendientes on <now>
    Then Pendientes shows in order <order>

    Examples:
      | every_water | unit_water   | completed_water     | option_water | postponed_water     | every_trash | unit_trash    | completed_trash     | now                 | order       |
      | 4          | horas        | 2026-07-15T08:00:00 | 3 horas      | 2026-07-15T12:30:00 | 1           | dias          | 2026-07-15T09:00:00 | 2026-07-15T13:00:00 | Foco, Regar |

  # Order with postponed tasks 3
  # With Mostrar completadas on, Regar goes with the not completed ones and
  # Basura with the completed ones.
  Scenario Outline: Order with postponed tasks 3
    Given Mostrar completadas is on
    And a one-off task Foco without a due date
    And a relative recurring task Regar every <every_water> <unit_water>
    And the task Regar was completed on <completed_water>
    And the task Regar was postponed with option <option_water> on <postponed_water>
    And a relative recurring task Basura every <every_trash> <unit_trash>
    And the task Basura was completed on <completed_trash>
    When I query Pendientes on <now>
    Then Pendientes shows in order <order>
    And Pendientes shows as completed <completed_list>

    Examples:
      | every_water | unit_water   | completed_water     | option_water | postponed_water     | every_trash | unit_trash    | completed_trash     | now                 | order               | completed_list |
      | 4          | horas        | 2026-07-15T08:00:00 | 3 horas      | 2026-07-15T12:30:00 | 1           | dias          | 2026-07-15T09:00:00 | 2026-07-15T13:00:00 | Foco, Regar, Basura | Basura      |
