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
