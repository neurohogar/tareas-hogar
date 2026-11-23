# Spec §5.4 (the notice of a block rescheduling) and §5.11 (Undo, No summary), with §7.
# After confirming, the notice «Tareas reprogramadas» with Deshacer is shown while
# confirmation <= now < confirmation + 5 seconds. It shares the single slot of the
# completion notice: either one replaces the other, and the replaced one loses its
# Deshacer. Deshacer in it writes back, for each rescheduled task that still exists, the
# reanudadaEn that the rescheduling replaced (or removes the field if there was none),
# and nothing else: completions made after stay and a deleted task is not revived. It
# closes the notice.
#   That the notice says «Tareas reprogramadas», that it stays visible when changing screens
#   and that neither confirming nor undoing shows a count, a message about what piled up or
#   congratulations are verified in the QA suite (qa/block-reschedule.md). The single
#   writeBatch of the undo is verified in the core unit tests.
# "the notice offers to undo the rescheduling" asserts that the notice is the one of the
# rescheduling, with Deshacer. "the task was resumed earlier on M" is a reanudadaEn
# already stored before any other date; "the task resume moment is M" asserts the stored
# reanudadaEn. The titles name the tasks (one word). "another device ..." steps are changes
# of another device that this one has not seen.
# Reference week: Monday 2026-07-13 to Sunday 2026-07-19.
Feature: Block reschedule undo

  # Block reschedule undo 1
  # The notice is shown from the moment of confirming until the last second before the 5.
  Scenario Outline: Block reschedule undo 1
    Given a relative recurring task every <every> <unit>
    And the task was completed on <completed>
    When I reschedule the overdue tasks on <confirmed>
    And I query the notice on <now>
    Then the notice offers to undo the rescheduling

    Examples:
      | every | unit | completed           | confirmed           | now                 |
      | 2     | dias | 2026-07-10T09:00:00 | 2026-07-16T10:00:00 | 2026-07-16T10:00:00 |
      | 2     | dias | 2026-07-10T09:00:00 | 2026-07-16T10:00:00 | 2026-07-16T10:00:04 |

  # Block reschedule undo 2
  # At 5 seconds the notice disappears by itself.
  Scenario Outline: Block reschedule undo 2
    Given a relative recurring task every <every> <unit>
    And the task was completed on <completed>
    When I reschedule the overdue tasks on <confirmed>
    And I query the notice on <now>
    Then there is no notice

    Examples:
      | every | unit | completed           | confirmed           | now                 |
      | 2     | dias | 2026-07-10T09:00:00 | 2026-07-16T10:00:00 | 2026-07-16T10:00:05 |
      | 2     | dias | 2026-07-10T09:00:00 | 2026-07-16T10:00:00 | 2026-07-16T11:00:00 |

  # Block reschedule undo 3
  # Completing a task within the 5 seconds replaces the notice: it offers to undo the
  # completion and not the rescheduling.
  Scenario Outline: Block reschedule undo 3
    Given a relative recurring task Regar every <every> <unit>
    And the task Regar was completed on <completed>
    And a one-off task Pagar with due date <due_date>
    When I reschedule the overdue tasks on <confirmed>
    And I complete the task Pagar on <pay>
    And I query the notice on <now>
    Then the notice offers to undo the completion of Pagar from <pay_stored>

    Examples:
      | every | unit | completed           | due_date   | confirmed           | pay                 | now                 | pay_stored          |
      | 2     | dias | 2026-07-10T09:00:00 | 2026-07-20 | 2026-07-16T10:00:00 | 2026-07-16T10:00:02 | 2026-07-16T10:00:03 | 2026-07-16T10:00:02 |

  # Block reschedule undo 4
  # Deshacer on the notice that replaced it undoes only the completion: the rescheduling
  # stays.
  Scenario Outline: Block reschedule undo 4
    Given a relative recurring task Regar every <every> <unit>
    And the task Regar was completed on <completed>
    And a one-off task Pagar with due date <due_date>
    When I reschedule the overdue tasks on <confirmed>
    And I complete the task Pagar on <pay>
    And I tap Deshacer in the notice on <tap>
    Then no completion remains of Pagar
    And the task Regar was resumed at that moment

    Examples:
      | every | unit | completed           | due_date   | confirmed           | pay                 | tap                 |
      | 2     | dias | 2026-07-10T09:00:00 | 2026-07-20 | 2026-07-16T10:00:00 | 2026-07-16T10:00:02 | 2026-07-16T10:00:03 |

  # Block reschedule undo 5
  # The rescheduling notice replaces that of a completion: Deshacer undoes the
  # rescheduling and the completion of before stays.
  Scenario Outline: Block reschedule undo 5
    Given a relative recurring task Regar every <every> <unit>
    And the task Regar was completed on <completed>
    And a one-off task Pagar with due date <due_date>
    When I complete the task Pagar on <pay>
    And I reschedule the overdue tasks on <confirmed>
    And I tap Deshacer in the notice on <tap>
    Then the task Regar has no resume moment
    And the task Pagar keeps a single completion, from <pay_stored>

    Examples:
      | every | unit | completed           | due_date   | pay                 | confirmed           | tap                 | pay_stored          |
      | 2     | dias | 2026-07-10T09:00:00 | 2026-07-20 | 2026-07-16T09:59:58 | 2026-07-16T10:00:00 | 2026-07-16T10:00:02 | 2026-07-16T09:59:58 |

  # Block reschedule undo 6
  # Deshacer removes the reanudadaEn the task did not have before: it is overdue again
  # with its «Tocaba ...», and the notice closes.
  Scenario Outline: Block reschedule undo 6
    Given a relative recurring task every <every> <unit>
    And the task was completed on <completed>
    When I reschedule the overdue tasks on <confirmed>
    And I tap Deshacer in the notice on <tap>
    And I query the notice on <tap>
    And I query the status on <tap>
    Then there is no notice
    And the task has no resume moment
    And the status is atrasada

    Examples:
      | every | unit | completed           | confirmed           | tap                 |
      | 2     | dias | 2026-07-10T09:00:00 | 2026-07-16T10:00:00 | 2026-07-16T10:00:03 |

  # Block reschedule undo 7
  # Deshacer writes back the reanudadaEn that the rescheduling replaced, not a removal:
  # the task is overdue again from its earlier resume.
  Scenario Outline: Block reschedule undo 7
    Given a relative recurring task every <every> <unit>
    And the task was completed on <completed>
    And the task was resumed earlier on <earlier>
    When I reschedule the overdue tasks on <confirmed>
    And I tap Deshacer in the notice on <tap>
    And I query the status on <tap>
    Then the task resume moment is <earlier>
    And the status is atrasada

    Examples:
      | every | unit | completed           | earlier             | confirmed           | tap                 |
      | 2     | dias | 2026-07-06T09:00:00 | 2026-07-05T10:00:00 | 2026-07-16T10:00:00 | 2026-07-16T10:00:03 |

  # Block reschedule undo 8
  # Each rescheduled task gets back its own value: Regar had none and Basura its earlier one.
  Scenario Outline: Block reschedule undo 8
    Given a relative recurring task Regar every <every> <unit>
    And the task Regar was completed on <completed>
    And a weekly recurring task Basura on <days> created on <created>
    And the task Basura was resumed earlier on <earlier>
    When I reschedule the overdue tasks on <confirmed>
    And I tap Deshacer in the notice on <tap>
    Then the task Regar has no resume moment
    And the task Basura resume moment is <earlier>

    Examples:
      | every | unit | completed           | days           | created             | earlier             | confirmed           | tap                 |
      | 2     | dias | 2026-07-10T09:00:00 | martes, jueves | 2026-07-01T08:00:00 | 2026-07-05T10:00:00 | 2026-07-16T10:00:00 | 2026-07-16T10:00:03 |

  # Block reschedule undo 9
  # A completion made after the rescheduling stays when undoing: the task is waiting
  # because of it.
  Scenario Outline: Block reschedule undo 9
    Given a relative recurring task Regar every <every> <unit>
    And the task Regar was completed on <completed>
    When I reschedule the overdue tasks on <confirmed>
    And another device, without seeing that change, completes the task Regar on <other>
    And I tap Deshacer in the notice on <tap>
    And I query the status on <tap>
    Then the task Regar has no resume moment
    And the status is en espera

    Examples:
      | every | unit | completed           | confirmed           | other               | tap                 |
      | 2     | dias | 2026-07-10T09:00:00 | 2026-07-16T10:00:00 | 2026-07-16T10:00:02 | 2026-07-16T10:00:03 |

  # Block reschedule undo 10
  # A task that another device deleted after the rescheduling is not revived by Deshacer.
  Scenario Outline: Block reschedule undo 10
    Given a relative recurring task Regar every <every> <unit>
    And the task Regar was completed on <completed>
    When I reschedule the overdue tasks on <confirmed>
    And another device, without seeing that change, deletes the task
    And I tap Deshacer in the notice on <tap>
    And I query Pendientes at any moment
    Then no task remains

    Examples:
      | every | unit | completed           | confirmed           | tap                 |
      | 2     | dias | 2026-07-10T09:00:00 | 2026-07-16T10:00:00 | 2026-07-16T10:00:03 |
