# mutation-stamp: sha256=43d3dcd76ad178acc8245270f3edc67178443d43561a70304d43e5a8a1e463fa
# acceptance-mutation-manifest-begin
# {"version":1,"tested_at":"2026-11-23T16:40:32.804247530Z","feature_name":"Minimal mode panel","feature_path":"features/minimal-mode-panel.feature","background_hash":"74234e98afe7498fb5daf1f36ac2d78acc339464f950703b8c019892f982b90b","implementation_hash":"sha256:d084b00253aa785be03207b3ce031c21d4ebb430ae83479e6e7b47efe6f01b69","scenarios":[{"index":0,"name":"Minimal mode panel 1","scenario_hash":"0949f3daf0d6e18826d27b8379e02090a8663b1157b2cedaedacefe1c1191d7f","mutation_count":4,"result":{"Total":4,"Killed":4,"Survived":0,"Errors":0},"tested_at":"2026-11-23T16:40:32.804247530Z"},{"index":1,"name":"Minimal mode panel 2","scenario_hash":"8620501df570bb11f87187de3d654f76caa3bead89329c8412012e53730878bf","mutation_count":3,"result":{"Total":3,"Killed":3,"Survived":0,"Errors":0},"tested_at":"2026-11-23T16:40:32.804247530Z"},{"index":2,"name":"Minimal mode panel 3","scenario_hash":"38422a6824ddc43baa12ab312f1a0652bdb4516a75a51abd7f16afdb09f7f683","mutation_count":4,"result":{"Total":4,"Killed":4,"Survived":0,"Errors":0},"tested_at":"2026-11-23T16:40:32.804247530Z"},{"index":3,"name":"Minimal mode panel 4","scenario_hash":"7c495b6cdcd2962a1c39eaa37a6ee88285bc569e39f53adfa02339ed09fd844a","mutation_count":3,"result":{"Total":3,"Killed":3,"Survived":0,"Errors":0},"tested_at":"2026-11-23T16:40:32.804247530Z"},{"index":4,"name":"Minimal mode panel 5","scenario_hash":"59e3de41a62b3f4b75ab5ca361cd564c9dd5d878d318a9437fb6c59bf4c5dbbf","mutation_count":1,"result":{"Total":1,"Killed":1,"Survived":0,"Errors":0},"tested_at":"2026-11-23T16:40:32.804247530Z"},{"index":5,"name":"Minimal mode panel 6","scenario_hash":"3c3ff439acb21adbcafaa220c13d15d13a4a68e7b3494ddeea3f5ef4e9542ed6","mutation_count":2,"result":{"Total":2,"Killed":2,"Survived":0,"Errors":0},"tested_at":"2026-11-23T16:40:32.804247530Z"}]}
# acceptance-mutation-manifest-end

# Spec §6.2 (Pause / Resume, Minimal mode in the panel, Tarea), with §5.8, §5.9 and
# §6.3. With the minimal mode on, the panel of a non-essential recurring task says what
# pauses it and hides actions:
#   not paused by hand: «Pausada por el modo mínimo»; no Posponer, Quitar posponer, Pausar
#     or Reanudar; Borrar tarea stays.
#   paused by hand: «Pausada»; Reanudar (it removes the manual pause); no Posponer;
#     Borrar tarea.
# The panel of an essential task, and that of a non-essential one-off task, is the usual
# one. With the mode off, the panel is the usual one too. That the panel of a
# non-essential task is opened from the Historial (the only way during the mode) and
# where the text goes (top of Tarea) are verified in the QA suite (qa/minimal-mode.md).
# "I open the task in the edit panel on M" opens the panel at that moment. "the edit
# panel says T" asserts the pause text at the top of Tarea; "the edit panel says no pause
# text" asserts there is none. "the edit panel does not offer pause" asserts that
# neither Pausar nor Reanudar is offered; "the edit panel offers Reanudar" asserts the
# button; "the edit panel offers Borrar tarea" asserts the delete action. "the postpone
# button of the panel is ninguno" asserts that neither Posponer nor Quitar posponer is
# offered.
# Reference week: Monday 2026-07-13 to Sunday 2026-07-19.
Feature: Minimal mode panel

  # Minimal mode panel 1
  # Non-essential recurring task not paused by hand, mode on. Without the mode it would
  # be overdue and offer Posponer and Pausar.
  Scenario Outline: Minimal mode panel 1
    Given a relative recurring task every <every> <unit>
    And the task was completed on <completed>
    And the minimal mode is on
    When I open the task in the edit panel on <now>
    Then the edit panel says <text>
    And the edit panel does not offer pause
    And the postpone button of the panel is <button>
    And the edit panel offers Borrar tarea

    Examples:
      | every | unit | completed           | now                 | text                      | button  |
      | 2     | dias | 2026-07-01T09:00:00 | 2026-07-15T12:00:00 | Pausada por el modo mínimo | ninguno |

  # Minimal mode panel 2
  # Non-essential recurring task paused by hand, mode on: it says «Pausada» and offers
  # Reanudar.
  Scenario Outline: Minimal mode panel 2
    Given a relative recurring task every <every> <unit>
    And the task was paused
    And the minimal mode is on
    When I open the task in the edit panel on <now>
    Then the edit panel says <text>
    And the edit panel offers Reanudar
    And the postpone button of the panel is <button>
    And the edit panel offers Borrar tarea

    Examples:
      | every | unit | now                 | text    | button  |
      | 2     | dias | 2026-07-15T12:00:00 | Pausada | ninguno |

  # Minimal mode panel 3
  # Essential recurring task, mode on: the usual panel (overdue, so it offers Pausar and
  # Posponer) and no pause text.
  Scenario Outline: Minimal mode panel 3
    Given a relative recurring task every <every> <unit>
    And the task was completed on <completed>
    And the task was marked essential
    And the minimal mode is on
    When I open the task in the edit panel on <now>
    Then the edit panel says no pause text
    And the edit panel offers <action>
    And the postpone button of the panel is <button>

    Examples:
      | every | unit | completed           | now                 | action | button   |
      | 2     | dias | 2026-07-01T09:00:00 | 2026-07-15T12:00:00 | Pausar | Posponer |

  # Minimal mode panel 4
  # Essential recurring task paused by hand, mode on: the usual panel of a paused task.
  Scenario Outline: Minimal mode panel 4
    Given a relative recurring task every <every> <unit>
    And the task was paused
    And the task was marked essential
    And the minimal mode is on
    When I open the task in the edit panel on <now>
    Then the edit panel says <text>
    And the edit panel offers Reanudar
    And the postpone button of the panel is <button>

    Examples:
      | every | unit | now                 | text    | button  |
      | 2     | dias | 2026-07-15T12:00:00 | Pausada | ninguno |

  # Minimal mode panel 5
  # A non-essential one-off task (hidden) has its usual panel: no pause text and no
  # pause button; overdue, it offers Posponer.
  Scenario Outline: Minimal mode panel 5
    Given a one-off task with due date <due_date>
    And the minimal mode is on
    When I open the task in the edit panel on <now>
    Then the edit panel says no pause text
    And the edit panel does not offer pause
    And the postpone button of the panel is <button>

    Examples:
      | due_date   | now                 | button   |
      | 2026-07-14 | 2026-07-15T10:00:00 | Posponer |

  # Minimal mode panel 6
  # With the mode off, a non-essential recurring task has the usual panel: no pause text
  # and Pausar.
  Scenario Outline: Minimal mode panel 6
    Given a relative recurring task every <every> <unit>
    And the task was completed on <completed>
    And the minimal mode is off
    When I open the task in the edit panel on <now>
    Then the edit panel says no pause text
    And the edit panel offers <action>

    Examples:
      | every | unit | completed           | now                 | action |
      | 2     | dias | 2026-07-01T09:00:00 | 2026-07-15T12:00:00 | Pausar |
