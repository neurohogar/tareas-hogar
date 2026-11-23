# mutation-stamp: sha256=9fa1c04f4146be670d38386b68e59b8d50036cb830bbb8c532e09e23506d8e22
# acceptance-mutation-manifest-begin
# {"version":1,"tested_at":"2026-11-22T22:06:19.431871913Z","feature_name":"Mostrar pausadas","feature_path":"features/show-paused.feature","background_hash":"74234e98afe7498fb5daf1f36ac2d78acc339464f950703b8c019892f982b90b","implementation_hash":"sha256:62411f675c16dc15adb1816d23f5af54a3402522652519559bbaf85ee048abff","scenarios":[{"index":0,"name":"Mostrar pausadas 1","scenario_hash":"a8982621d4d9606849089ccdb549878a3996636d9b9903a8a2b7b38dc7920efe","mutation_count":4,"result":{"Total":4,"Killed":4,"Survived":0,"Errors":0},"tested_at":"2026-11-22T22:06:19.431871913Z"},{"index":1,"name":"Mostrar pausadas 2","scenario_hash":"18678d345e0f2f86ec9bfe0ecd063b7147ca2c5863068728bcf2c9d9930a89b5","mutation_count":4,"result":{"Total":4,"Killed":4,"Survived":0,"Errors":0},"tested_at":"2026-11-22T22:06:19.431871913Z"},{"index":2,"name":"Mostrar pausadas 3","scenario_hash":"80973cc3b693df5b3d9659b96c04e0807d63cc2a64522f9328c2e4613e08ed79","mutation_count":4,"result":{"Total":4,"Killed":4,"Survived":0,"Errors":0},"tested_at":"2026-11-22T22:06:19.431871913Z"},{"index":3,"name":"Mostrar pausadas 4","scenario_hash":"75f08b60fa464d8b57ffe6b53801bd42b0d2fd234f4d847d2b1ada5b453424dd","mutation_count":4,"result":{"Total":4,"Killed":4,"Survived":0,"Errors":0},"tested_at":"2026-11-22T22:06:19.431871913Z"},{"index":4,"name":"Mostrar pausadas 5","scenario_hash":"a4357acdae33bf945df54bf88719b00680cdb755f8130b7ce2e2153df4fa4b71","mutation_count":12,"result":{"Total":12,"Killed":12,"Survived":0,"Errors":0},"tested_at":"2026-11-22T22:06:19.431871913Z"},{"index":5,"name":"Mostrar pausadas 7","scenario_hash":"f4f698d59d3d151e2c5dffca0ff6a1ecb78fcbdf225d579c6d2c01a29f9dec7e","mutation_count":1,"result":{"Total":1,"Killed":1,"Survived":0,"Errors":0},"tested_at":"2026-11-22T22:06:19.431871913Z"},{"index":6,"name":"Mostrar pausadas 8","scenario_hash":"120c499c7ac00b1ecf8304eaeb3a0758518e83cc834895db229c9132ae6f35ab","mutation_count":2,"result":{"Total":2,"Killed":2,"Survived":0,"Errors":0},"tested_at":"2026-11-22T22:06:19.431871913Z"},{"index":7,"name":"Mostrar pausadas 9","scenario_hash":"f15eef5874777d43e009d5707390a1306d340d59a6c83863c7d7397a1a986d7e","mutation_count":1,"result":{"Total":1,"Killed":1,"Survived":0,"Errors":0},"tested_at":"2026-11-22T22:06:19.431871913Z"}]}
# acceptance-mutation-manifest-end

# Spec §6.1 (Mostrar pausadas), with §5.8 and Mostrar completadas.
#   Off (initial value): paused tasks are not shown in Pendientes.
#   On: they go at the end of the list (after the completed ones, if those are
#     shown), by title in Spanish alphabetical order (case- and accent-insensitive,
#     ñ after n), regardless of their urgency or their createdAt.
#   A paused task is not completed: it does not go with the completed ones.
# That the value is saved on the device and survives a reload, that it is an on/off
# item of the ⋮ menu, and that the row is dimmed with "Pausada" instead of the status indicator, are
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
    And a relative recurring task Pagar every <every> <unit>
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
    And a relative recurring task Pagar every <every> <unit>
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
