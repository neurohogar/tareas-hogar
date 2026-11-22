# Spec §4.1 (Essential), with §5.8, §6.1 (order), §6.2 (Esencial check) and §7 (Conflicts).
# Any task, one-off or recurring in any mode, can be marked essential. The mark is
# stored as `essential` = true; unchecking it removes the field (it is never stored
# as false). The mark never changes the status or the order of the list, and it
# survives completing, postponing, pausing, resuming and changing kind. It is an
# independent field: an edit writes it only if it changed. That the check is in
# the Tarea section after the note, that it carries no icon and the star of the
# row are verified in the QA suite (qa/minimal-mode.md).
# "I create a ... task with title T and Esencial S" saves the creation panel with
# the check at S (checked or unchecked), with the minimal mode off.
# "the task T was marked essential" is a task already essential before any other
# date in the scenario. "I set Esencial to S" is the edit that checks or unchecks
# the field and saves. "the stored essential mark is true" asserts the stored field;
# "absent" asserts that the document has no `essential` field.
# Reference week: Monday 2026-07-13 to Sunday 2026-07-19.
Feature: Essential mark

  # Essential mark 1
  # A one-off task is created essential only if the check is checked.
  Scenario Outline: Essential mark 1
    When I create a one-off task with title <title> and Esencial <state>
    Then the stored essential mark is <mark>

    Examples:
      | title | state     | mark   |
      | Foco  | checked   | true   |
      | Foco  | unchecked | absent |

  # Essential mark 2
  # A relative recurring task is created essential only if the check is checked.
  Scenario Outline: Essential mark 2
    When I create a relative recurring task with title <title> every <every> <unit> and Esencial <state>
    Then the stored essential mark is <mark>

    Examples:
      | title | every | unit | state     | mark   |
      | Regar | 2     | dias | checked   | true   |
      | Regar | 2     | dias | unchecked | absent |

  # Essential mark 3
  # A calendar recurring task is created essential only if the check is checked.
  Scenario Outline: Essential mark 3
    When I create a weekly recurring task with title <title> on <days> and Esencial <state>
    Then the stored essential mark is <mark>

    Examples:
      | title | days           | state     | mark   |
      | Basura | martes, jueves | checked   | true   |
      | Basura | martes, jueves | unchecked | absent |

  # Essential mark 4
  # Checking Esencial on a task that was not essential stores the mark.
  Scenario Outline: Essential mark 4
    Given a one-off task without a due date
    When I set Esencial to <state>
    Then the stored essential mark is <mark>

    Examples:
      | state   | mark |
      | checked | true |

  # Essential mark 5
  # Unchecking Esencial on an essential task removes the field.
  Scenario Outline: Essential mark 5
    Given a one-off task without a due date
    And the task was marked essential
    When I set Esencial to <state>
    Then the stored essential mark is <mark>

    Examples:
      | state     | mark   |
      | unchecked | absent |

  # Essential mark 6
  # The mark is a field of its own: another device that edits the title without
  # seeing my change does not overwrite it.
  Scenario Outline: Essential mark 6
    Given a relative recurring task <title> every <every> <unit>
    When I set Esencial to <state>
    And another device, without seeing that change, edits the title to <title_new>
    Then the task has title <title_new>
    And the stored essential mark is <mark>

    Examples:
      | title | every | unit | state   | title_new     | mark |
      | Regar | 2     | dias | checked | Regar plantas | true |

  # Essential mark 7
  # The other way round: my edit of the title does not overwrite the mark that
  # another device wrote without my seeing it.
  Scenario Outline: Essential mark 7
    Given a relative recurring task <title> every <every> <unit>
    When I edit the title to <title_new>
    And another device, without seeing that change, sets Esencial to <state>
    Then the task has title <title_new>
    And the stored essential mark is <mark>

    Examples:
      | title | every | unit | title_new     | state   | mark |
      | Regar | 2     | dias | Regar plantas | checked | true |

  # Essential mark 8
  # The mark does not change the order of the list: Pagar (overdue) goes first
  # whichever of the two is essential.
  Scenario Outline: Essential mark 8
    Given a one-off task Foco without a due date
    And a one-off task Pagar with due date <due_date>
    And the task <essential> was marked essential
    When I query Pendientes on <now>
    Then Pendientes shows in order <order>

    Examples:
      | due_date   | essential | now                 | order       |
      | 2026-07-14 | Foco      | 2026-07-15T12:00:00 | Pagar, Foco |
      | 2026-07-14 | Pagar     | 2026-07-15T12:00:00 | Pagar, Foco |

  # Essential mark 9
  # The mark does not change the status. Row 1: waiting; row 2: overdue; row 3: pending.
  Scenario Outline: Essential mark 9
    Given a relative recurring task every <every> <unit>
    And the task was completed on <completed>
    And the task was marked essential
    When I query the status on <now>
    Then the status is <status>

    Examples:
      | every | unit | completed           | now                 | status     |
      | 2     | dias | 2026-07-15T09:00:00 | 2026-07-15T12:00:00 | en espera  |
      | 2     | dias | 2026-07-01T09:00:00 | 2026-07-15T12:00:00 | atrasada   |
      | 2     | dias | 2026-07-14T09:00:00 | 2026-07-16T10:00:00 | pendiente  |

  # Essential mark 10
  # The mark survives completing, pausing, resuming and changing kind.
  Scenario Outline: Essential mark 10
    Given a relative recurring task every <every> <unit>
    And the task was marked essential
    When I complete the task on <completed>
    And I pause the task
    And I resume the task on <resumed>
    And I edit the task to one-off without a due date
    Then the stored essential mark is <mark>

    Examples:
      | every | unit | completed           | resumed             | mark |
      | 2     | dias | 2026-07-15T09:00:00 | 2026-07-16T10:00:00 | true |

  # Essential mark 11
  # The mark survives postponing a task.
  Scenario Outline: Essential mark 11
    Given a one-off task with due date <due_date>
    And the task was marked essential
    When I postpone the task with option <option> on <postponed>
    Then the stored essential mark is <mark>

    Examples:
      | due_date   | option | postponed           | mark |
      | 2026-07-14 | 1 hora | 2026-07-15T10:00:00 | true |
