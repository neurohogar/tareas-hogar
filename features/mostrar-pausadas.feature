# mutation-stamp: sha256=125a2035355cf550e07a1a549a733c2300832b6027542838dc5872e47703edb3
# acceptance-mutation-manifest-begin
# {"version":1,"tested_at":"2026-11-17T20:59:47.661271474Z","feature_name":"Mostrar pausadas","feature_path":"features/mostrar-pausadas.feature","background_hash":"74234e98afe7498fb5daf1f36ac2d78acc339464f950703b8c019892f982b90b","implementation_hash":"sha256:75d785dd6ab8a84851a92aa625c88803dc6e7dd79a7fcd8998db17a232075551","scenarios":[{"index":0,"name":"Mostrar pausadas 1","scenario_hash":"f815d48218aab240c420fe852dfcb77cc8ccffb4adb8680faec46264760dd185","mutation_count":3,"result":{"Total":3,"Killed":3,"Survived":0,"Errors":0},"tested_at":"2026-11-17T20:59:47.661271474Z"},{"index":1,"name":"Mostrar pausadas 2","scenario_hash":"dae650280283b75deb87596a31d5b398d609a48e15a14df4fe2234f5ee5b5ea1","mutation_count":4,"result":{"Total":4,"Killed":4,"Survived":0,"Errors":0},"tested_at":"2026-11-17T20:59:47.661271474Z"},{"index":2,"name":"Mostrar pausadas 3","scenario_hash":"dfe97aa6c417564265be5b47e10c7fef4046b8168f6abfd4dbf0252e554985df","mutation_count":4,"result":{"Total":4,"Killed":4,"Survived":0,"Errors":0},"tested_at":"2026-11-17T20:59:47.661271474Z"},{"index":3,"name":"Mostrar pausadas 4","scenario_hash":"17b69a445923baf43f5a7128f1a0ae4aaad6226166652c47dae90a33e17c39fd","mutation_count":4,"result":{"Total":4,"Killed":4,"Survived":0,"Errors":0},"tested_at":"2026-11-17T20:59:47.661271474Z"},{"index":4,"name":"Mostrar pausadas 5","scenario_hash":"39efc07da180485f6c3633bb467e57e9917c27bc4d837532b38b4462a92fdc82","mutation_count":12,"result":{"Total":12,"Killed":12,"Survived":0,"Errors":0},"tested_at":"2026-11-17T20:59:47.661271474Z"},{"index":5,"name":"Mostrar pausadas 7","scenario_hash":"c9e77b173b85dac56846987ce70d9d512214614ac12aeb7c87f4e1c088ca2dd9","mutation_count":1,"result":{"Total":1,"Killed":1,"Survived":0,"Errors":0},"tested_at":"2026-11-17T20:59:47.661271474Z"},{"index":6,"name":"Mostrar pausadas 8","scenario_hash":"17f5f21cb08792359930b692a89a609a4c4dbe3f78ae169d914fe1c12927f409","mutation_count":2,"result":{"Total":2,"Killed":2,"Survived":0,"Errors":0},"tested_at":"2026-11-17T20:59:47.661271474Z"},{"index":7,"name":"Mostrar pausadas 9","scenario_hash":"e28993471f59ce5fad0f638fe58d2725b42dbccaf9b61350bc5a9aed0bbc10fe","mutation_count":1,"result":{"Total":1,"Killed":1,"Survived":0,"Errors":0},"tested_at":"2026-11-17T20:59:47.661271474Z"}]}
# acceptance-mutation-manifest-end

# Spec §6.1 (Mostrar pausadas), with §5.8 and Mostrar completadas.
#   Off (initial value): paused tasks are not shown in Pendientes.
#   On: they go at the end of the list (after the completed ones, if those are
#     shown), by title in Spanish alphabetical order (case- and accent-insensitive,
#     ñ after n), regardless of their urgency or their createdAt.
#   A paused task is not completed: it does not go with the completed ones.
# That the value is saved on the device and survives a reload, and that the
# row is dimmed with "Pausada" instead of the status indicator, are
# verified in the QA suite.
# Each task is named by its title (one word). "Pendientes shows in
# order" gives the titles from top to bottom and the list has no other
# rows. "Pendientes shows as paused" gives, in order, the titles of the
# rows that look paused (checkbox disabled, no status); the other
# rows do not look paused. "Pendientes shows as completed", the same with
# the completed ones. When the step does not give createdAt, the task was created before
# any other date in the scenario, in the declared order. "the task X was
# paused" is a task already paused before any other date in the
# scenario; "I pause the task X" taps Pausar in its panel. Without the step
# "Mostrar pausadas is on" (or "Mostrar completadas is on"),
# the check is at its initial value.
# Reference week: Monday 2026-07-13 to Sunday 2026-07-19.
Feature: Mostrar pausadas

  # Mostrar pausadas 1
  # Off (initial value): paused tasks are not shown, even though without the pause they
  # would be atrasada.
  Scenario Outline: Mostrar pausadas 1
    Given a one-off task Foco without a due date
    And a relative recurring task Regar every <every> <unit>
    And the task Regar was completed on <completed>
    And the task Regar was paused
    And a weekly recurring task Basura on <days> created on <created_trash>
    And the task Basura was paused
    When I query Pendientes on <now>
    Then Pendientes shows in order <order>

    Examples:
      | every | unit   | completed           | days   | created_trash       | now                 | order |
      | 2    | dias   | 2026-07-01T09:00:00 | martes | 2026-07-01T08:00:00 | 2026-07-15T12:00:00 | Foco  |

  # Mostrar pausadas 2
  # On: paused tasks go at the end, by title and not by urgency
  # (without the pause, Regar would go first: atrasada since the 5th, Basura since the 8th).
  Scenario Outline: Mostrar pausadas 2
    Given Mostrar pausadas is on
    And a one-off task Foco without a due date
    And a one-off task Pagar with due date <due_date>
    And a relative recurring task Regar every <every> <unit>
    And the task Regar was completed on <completed>
    And the task Regar was paused
    And a weekly recurring task Basura on <days> created on <created_trash>
    And the task Basura was paused
    When I query Pendientes on <now>
    Then Pendientes shows in order <order>
    And Pendientes shows as paused <paused>

    Examples:
      | due_date   | every | unit   | completed           | days   | created_trash       | now                 | order                      | paused        |
      | 2026-07-14 | 2    | dias   | 2026-07-01T09:00:00 | martes | 2026-07-01T08:00:00 | 2026-07-15T12:00:00 | Pagar, Foco, Basura, Regar | Basura, Regar |

  # Mostrar pausadas 3
  # With Mostrar completadas on and Mostrar pausadas off: a
  # paused task with a recent completion is not shown (it is not completed).
  Scenario Outline: Mostrar pausadas 3
    Given Mostrar completadas is on
    And a one-off task Foco without a due date
    And a one-off task Pagar without a due date
    And the task Pagar was completed on <completed_pay>
    And a relative recurring task Barrer every <every> <unit>
    And the task Barrer was completed on <completed_sweep>
    And the task Barrer was paused
    When I query Pendientes on <now>
    Then Pendientes shows in order <order>
    And Pendientes shows as completed <completed_list>

    Examples:
      | completed_pay       | every | unit   | completed_sweep     | now                 | order       | completed_list |
      | 2026-07-15T09:00:00 | 2    | dias   | 2026-07-15T08:00:00 | 2026-07-15T12:00:00 | Foco, Pagar | Pagar       |

  # Mostrar pausadas 4
  # Both on: first the non-completed ones, then the completed ones
  # and at the end the paused ones, even if the title of the paused one goes earlier.
  Scenario Outline: Mostrar pausadas 4
    Given Mostrar completadas is on
    And Mostrar pausadas is on
    And a one-off task Foco without a due date
    And a one-off task Pagar without a due date
    And the task Pagar was completed on <completed_pay>
    And a relative recurring task Barrer every <every> <unit>
    And the task Barrer was completed on <completed_sweep>
    And the task Barrer was paused
    When I query Pendientes on <now>
    Then Pendientes shows in order <order>
    And Pendientes shows as completed <completed_list>
    And Pendientes shows as paused <paused>

    Examples:
      | completed_pay       | every | unit   | completed_sweep     | now                 | order               | completed_list | paused   |
      | 2026-07-15T09:00:00 | 2    | dias   | 2026-07-15T08:00:00 | 2026-07-15T12:00:00 | Foco, Pagar, Barrer | Pagar       | Barrer   |

  # Mostrar pausadas 5
  # Paused tasks are ordered by title in Spanish alphabetical order, not
  # by createdAt. Row 1: the ñ goes after the n. Row 2: the Á goes with the
  # A. Row 3: case-insensitive. Row 4: the one created first can also
  # go first.
  Scenario Outline: Mostrar pausadas 5
    Given Mostrar pausadas is on
    And a relative recurring task <title_1> never completed
    And the task <title_1> was paused
    And a relative recurring task <title_2> never completed
    And the task <title_2> was paused
    When I query Pendientes at any moment
    Then Pendientes shows in order <order>
    And Pendientes shows as paused <order>

    Examples:
      | title_1  | title_2    | order              |
      | Ñandú    | Nube       | Nube, Ñandú        |
      | Barrer   | Árbol      | Árbol, Barrer      |
      | Zapallo  | acelga     | acelga, Zapallo    |
      | Cocina   | Dormitorio | Cocina, Dormitorio |

  # Mostrar pausadas 7
  # Off: when a task is paused, its row disappears from Pendientes.
  Scenario Outline: Mostrar pausadas 7
    Given a one-off task Foco without a due date
    And a relative recurring task Regar never completed
    When I pause the task Regar
    And I query Pendientes at any moment
    Then Pendientes shows in order <order>

    Examples:
      | order |
      | Foco  |

  # Mostrar pausadas 8
  # On: when a task is paused, it goes to the end (without the pause, pendiente Regar goes
  # before the one-off without a due date).
  Scenario Outline: Mostrar pausadas 8
    Given Mostrar pausadas is on
    And a one-off task Foco without a due date
    And a relative recurring task Regar never completed
    When I pause the task Regar
    And I query Pendientes at any moment
    Then Pendientes shows in order <order>
    And Pendientes shows as paused <paused>

    Examples:
      | order       | paused   |
      | Foco, Regar | Regar    |

  # Mostrar pausadas 9
  # Off: when a task is resumed, it returns to its place by urgency.
  Scenario Outline: Mostrar pausadas 9
    Given a one-off task Foco without a due date
    And a relative recurring task Regar never completed
    And the task Regar was paused
    When I resume the task Regar on <resumed>
    And I query Pendientes on <now>
    Then Pendientes shows in order <order>

    Examples:
      | resumed             | now                 | order       |
      | 2026-07-15T10:00:00 | 2026-07-15T10:00:00 | Regar, Foco |
