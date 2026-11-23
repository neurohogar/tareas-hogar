# Spec §5.11 (Block rescheduling: Which tasks, What it does, Only reanudadaEn), with §5.8
# (Reanudar), §5.2, §5.3, §5.5-§5.7, §5.9, §4.4 and §6.2 (Última vez).
# Block rescheduling is a Reanudar (reanudadaEn = the moment of confirming) of every
# recurring task that is overdue at that moment and in view, with no choice. Each one is
# evaluated as newly created at that moment: relative tasks are pending at once;
# calendar tasks are pending if today is one of their days and waiting otherwise; with a
# schedule, an occurrence whose window closed before the confirmation does not count as
# missed. The «Tocaba ...» of what was missed goes away and does not come back. One-off
# tasks, paused tasks (by hand or by the minimal mode), postponed tasks and pending or
# waiting tasks are not touched. It writes only reanudadaEn and adds or deletes no
# completion.
#   The single writeBatch of all the tasks, and the edge of a delay under 60 seconds
#   (an overdue task is always at least one minute late), are verified in the core unit
#   tests. The menu, the preview, that no count or message is shown and the
#   offline behavior are verified in the QA suite (qa/block-reschedule.md).
# "I reschedule the overdue tasks on M" taps Reprogramar in the preview at that moment
# (the "now" of the resumes). "the task was resumed at that moment" asserts that the
# stored reanudadaEn is that moment; "the task has no resume moment" asserts there is none;
# "only the resume moment of the task changed" asserts that the stored task is the same
# as before, except reanudadaEn. The titled forms name the task by its title (one word).
# "the minimal mode is on" and "the task was marked essential" / "was paused" are already
# done before any other date. A task declared with a title and without `created on` is
# created at the same instant as the others.
# Reference week: Monday 2026-07-13 to Sunday 2026-07-19.
Feature: Block reschedule

  # Block reschedule 1
  # An overdue relative task comes back pending at the moment of confirming (row 1: the
  # example of the spec; row 2: in hours).
  Scenario Outline: Block reschedule 1
    Given a relative recurring task every <every> <unit>
    And the task was completed on <completed>
    When I reschedule the overdue tasks on <now>
    And I query the status on <now>
    Then the task was resumed at that moment
    And the status is pendiente

    Examples:
      | every | unit  | completed           | now                 |
      | 2     | dias  | 2026-07-10T09:00:00 | 2026-07-16T10:00:00 |
      | 4     | horas | 2026-07-15T09:00:00 | 2026-07-16T10:00:00 |

  # Block reschedule 2
  # An overdue calendar task is pending if the moment of confirming is one of its days
  # (row 1: Thursday) and waiting otherwise (row 2: Wednesday; row 3: monthly, the 10th
  # already passed; row 4: monthly, the 10th itself).
  Scenario Outline: Block reschedule 2
    Given a <shape> recurring task <on> <days> created on <created>
    When I reschedule the overdue tasks on <now>
    And I query the status on <now>
    Then the task was resumed at that moment
    And the status is <status>

    Examples:
      | shape   | on      | days           | created             | now                 | status    |
      | weekly  | on      | martes, jueves | 2026-07-01T08:00:00 | 2026-07-16T10:00:00 | pendiente |
      | weekly  | on      | martes, jueves | 2026-07-01T08:00:00 | 2026-07-15T10:00:00 | en espera |
      | monthly | on days | 10             | 2026-05-01T08:00:00 | 2026-07-15T10:00:00 | en espera |
      | monthly | on days | 10             | 2026-05-01T08:00:00 | 2026-07-10T10:00:00 | pendiente |

  # Block reschedule 3
  # A relative task with a schedule whose window already closed does not count that window
  # as missed: waiting until the next from, with progress from the confirmation.
  Scenario Outline: Block reschedule 3
    Given a relative recurring task every <every> <unit>
    And the task was completed on <completed>
    And the task can be completed from <from> to <to>
    When I reschedule the overdue tasks on <confirmed>
    And I query the status on <now>
    Then the task was resumed at that moment
    And the status is en espera
    And the progress is <progress>

    Examples:
      | every | unit | completed           | from  | to    | confirmed           | now                 | progress |
      | 1     | dias | 2026-07-10T09:00:00 | 08:00 | 11:00 | 2026-07-15T12:00:00 | 2026-07-15T20:00:00 | 0.4      |

  # Block reschedule 4
  # A relative task with a schedule confirmed inside the window is pending in it.
  Scenario Outline: Block reschedule 4
    Given a relative recurring task every <every> <unit>
    And the task was completed on <completed>
    And the task can be completed from <from> to <to>
    When I reschedule the overdue tasks on <confirmed>
    And I query the status on <confirmed>
    Then the task was resumed at that moment
    And the status is pendiente

    Examples:
      | every | unit | completed           | from  | to    | confirmed           |
      | 1     | dias | 2026-07-10T09:00:00 | 08:00 | 11:00 | 2026-07-15T10:00:00 |

  # Block reschedule 5
  # A calendar task with a schedule whose window of today closed: that occurrence does not
  # count as missed, waiting until the next one with progress from the confirmation.
  Scenario Outline: Block reschedule 5
    Given a weekly recurring task on <days>
    And the task has a completion from <completed> that covers <covered>
    And the task can be completed from <from> to <to>
    When I reschedule the overdue tasks on <confirmed>
    And I query the status on <now>
    Then the task was resumed at that moment
    And the status is en espera
    And the progress is <progress>

    Examples:
      | days               | completed           | covered    | from  | to    | confirmed           | now                 | progress |
      | miércoles, viernes | 2026-07-10T09:00:00 | 2026-07-10 | 08:00 | 11:00 | 2026-07-15T12:00:00 | 2026-07-15T23:00:00 | 0.25     |

  # Block reschedule 6
  # What was missed before does not come back, and what is missed after does count: row 1
  # the Tuesday missed does not count; row 2 the Thursday is pending; row 3 the Thursday
  # missed after the confirmation makes it overdue.
  Scenario Outline: Block reschedule 6
    Given a weekly recurring task on <days> created on <created>
    When I reschedule the overdue tasks on <confirmed>
    And I query the status on <now>
    Then the status is <status>

    Examples:
      | days           | created             | confirmed           | now                 | status    |
      | martes, jueves | 2026-07-01T08:00:00 | 2026-07-15T11:00:00 | 2026-07-15T11:00:00 | en espera |
      | martes, jueves | 2026-07-01T08:00:00 | 2026-07-15T11:00:00 | 2026-07-16T10:00:00 | pendiente |
      | martes, jueves | 2026-07-01T08:00:00 | 2026-07-15T11:00:00 | 2026-07-17T00:00:00 | atrasada  |

  # Block reschedule 7
  # A relative task rescheduled does not become overdue again because of the time before:
  # without a new completion it stays pending.
  Scenario Outline: Block reschedule 7
    Given a relative recurring task every <every> <unit>
    And the task was completed on <completed>
    When I reschedule the overdue tasks on <confirmed>
    And I query the status on <now>
    Then the status is pendiente

    Examples:
      | every | unit | completed           | confirmed           | now                 |
      | 2     | dias | 2026-07-10T09:00:00 | 2026-07-16T10:00:00 | 2026-07-30T10:00:00 |

  # Block reschedule 8
  # An overdue one-off task is not rescheduled: it keeps its status and has no resume moment.
  Scenario Outline: Block reschedule 8
    Given a one-off task with due date <due_date>
    When I reschedule the overdue tasks on <now>
    And I query the status on <now>
    Then the task has no resume moment
    And the status is atrasada

    Examples:
      | due_date   | now                 |
      | 2026-07-10 | 2026-07-16T10:00:00 |

  # Block reschedule 9
  # A waiting recurring task carries no debt and is not touched.
  Scenario Outline: Block reschedule 9
    Given a relative recurring task every <every> <unit>
    And the task was completed on <completed>
    When I reschedule the overdue tasks on <now>
    And I query the status on <now>
    Then the task has no resume moment
    And the status is en espera

    Examples:
      | every | unit | completed           | now                 |
      | 2     | dias | 2026-07-16T09:00:00 | 2026-07-16T10:00:00 |

  # Block reschedule 10
  # A pending recurring task is not touched.
  Scenario Outline: Block reschedule 10
    Given a relative recurring task never completed
    When I reschedule the overdue tasks on <now>
    And I query the status on <now>
    Then the task has no resume moment
    And the status is pendiente

    Examples:
      | now                 |
      | 2026-07-16T10:00:00 |

  # Block reschedule 11
  # A task paused by hand has no status and is not touched; it stays paused.
  Scenario Outline: Block reschedule 11
    Given a relative recurring task every <every> <unit>
    And the task was completed on <completed>
    And the task was paused
    When I reschedule the overdue tasks on <now>
    And I query the status on <now>
    Then the task is paused
    And the task has no resume moment
    And the task has no status

    Examples:
      | every | unit | completed           | now                 |
      | 2     | dias | 2026-07-10T09:00:00 | 2026-07-16T10:00:00 |

  # Block reschedule 12
  # A postponed task is waiting and is not touched.
  Scenario Outline: Block reschedule 12
    Given a relative recurring task every <every> <unit>
    And the task was completed on <completed>
    And the task was postponed with option <option> on <postponed>
    When I reschedule the overdue tasks on <now>
    And I query the status on <now>
    Then the task has no resume moment
    And the status is en espera

    Examples:
      | every | unit | completed           | option  | postponed           | now                 |
      | 2     | dias | 2026-07-10T09:00:00 | 3 horas | 2026-07-16T09:30:00 | 2026-07-16T10:00:00 |

  # Block reschedule 13
  # With the minimal mode on, a non-essential overdue task is paused by the mode and is not
  # rescheduled.
  Scenario Outline: Block reschedule 13
    Given a relative recurring task every <every> <unit>
    And the task was completed on <completed>
    And the minimal mode is on
    When I reschedule the overdue tasks on <now>
    And I query the status on <now>
    Then the task is paused by the minimal mode
    And the task has no resume moment
    And the task has no status

    Examples:
      | every | unit | completed           | now                 |
      | 2     | dias | 2026-07-10T09:00:00 | 2026-07-16T10:00:00 |

  # Block reschedule 14
  # With the minimal mode on, an essential overdue task is rescheduled like any other.
  Scenario Outline: Block reschedule 14
    Given a relative recurring task every <every> <unit>
    And the task was completed on <completed>
    And the task was marked essential
    And the minimal mode is on
    When I reschedule the overdue tasks on <now>
    And I query the status on <now>
    Then the task was resumed at that moment
    And the status is pendiente

    Examples:
      | every | unit | completed           | now                 |
      | 2     | dias | 2026-07-10T09:00:00 | 2026-07-16T10:00:00 |

  # Block reschedule 15
  # All the overdue recurring tasks go at once and nothing else does: Regar and Basura are
  # rescheduled; Pagar (one-off, overdue) and Barrer (waiting) are not.
  Scenario Outline: Block reschedule 15
    Given a relative recurring task Regar every <every> <unit>
    And the task Regar was completed on <regar_completed>
    And a weekly recurring task Basura on <days> created on <created>
    And a one-off task Pagar with due date <due_date>
    And a relative recurring task Barrer every <every> <unit>
    And the task Barrer was completed on <barrer_completed>
    When I reschedule the overdue tasks on <now>
    Then the task Regar was resumed at that moment
    And the task Basura was resumed at that moment
    And the task Pagar has no resume moment
    And the task Barrer has no resume moment

    Examples:
      | every | unit | regar_completed     | days           | created             | due_date   | barrer_completed    | now                 |
      | 2     | dias | 2026-07-10T09:00:00 | martes, jueves | 2026-07-01T08:00:00 | 2026-07-10 | 2026-07-16T09:00:00 | 2026-07-16T10:00:00 |

  # Block reschedule 16
  # It writes only reanudadaEn: the essential mark and the rest of the task stay, and the
  # completion, the Historial and the last time do not change.
  Scenario Outline: Block reschedule 16
    Given a relative recurring task Regar every <every> <unit>
    And the task Regar was completed on <completed>
    And the task Regar was marked essential
    When I reschedule the overdue tasks on <now>
    And I query the last time on <now>
    Then only the resume moment of the task changed
    And the task Regar keeps a single completion, from <completed>
    And the last time shows <last_time>

    Examples:
      | every | unit | completed           | now                 | last_time   |
      | 2     | dias | 2026-07-10T09:00:00 | 2026-07-16T10:00:00 | hace 6 días |
