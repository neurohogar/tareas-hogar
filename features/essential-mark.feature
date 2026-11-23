# mutation-stamp: sha256=716317f27bf6a22eddd21e4231795686332751a1a3e432cf192501b5c4db66fe
# acceptance-mutation-manifest-begin
# {"version":1,"tested_at":"2026-11-22T21:41:14.728030621Z","feature_name":"Essential mark","feature_path":"features/essential-mark.feature","background_hash":"74234e98afe7498fb5daf1f36ac2d78acc339464f950703b8c019892f982b90b","implementation_hash":"sha256:a2869cf5158aa4a94c3b10e5dfece162ff8f98485a543d43eda53440e7440855","scenarios":[{"index":10,"name":"Essential mark 11","scenario_hash":"5e89d4365a6166e87a4f7bfd35ca98ada43f88a8ea63af536e5fc541f6eeb7fe","mutation_count":2,"result":{"Total":2,"Killed":2,"Survived":0,"Errors":0},"tested_at":"2026-11-22T21:39:29.112812100Z"},{"index":0,"name":"Essential mark 1","scenario_hash":"f50313da34805b6dc1f0a00970e08fbf96c7eb1d5fc4b26c6d4b19a140e0c094","mutation_count":4,"result":{"Total":4,"Killed":4,"Survived":0,"Errors":0},"tested_at":"2026-11-22T21:39:15.484442283Z"},{"index":1,"name":"Essential mark 2","scenario_hash":"b9dcd3bed5254b95696b9e573f7e0980a15480ae4366c872785b529b3bd10535","mutation_count":4,"result":{"Total":4,"Killed":4,"Survived":0,"Errors":0},"tested_at":"2026-11-22T21:39:15.484442283Z"},{"index":2,"name":"Essential mark 3","scenario_hash":"6f7b3c3678cdc04c81242f225c1509c62417c22c115a9e7b224ee245ff38fe18","mutation_count":4,"result":{"Total":4,"Killed":4,"Survived":0,"Errors":0},"tested_at":"2026-11-22T21:39:15.484442283Z"},{"index":5,"name":"Essential mark 6","scenario_hash":"bcda2a2d0b65eee0a99387a055aa36de5742cfc3464f3d64efa39d1ca407bde6","mutation_count":3,"result":{"Total":3,"Killed":3,"Survived":0,"Errors":0},"tested_at":"2026-11-22T21:39:15.484442283Z"},{"index":6,"name":"Essential mark 7","scenario_hash":"f93ce10e3a291bd7af0b335de7515bd9219717a2f2e025fbd230983cf1c0e60d","mutation_count":4,"result":{"Total":4,"Killed":4,"Survived":0,"Errors":0},"tested_at":"2026-11-22T21:39:15.484442283Z"},{"index":9,"name":"Essential mark 10","scenario_hash":"7e1b636da5fb3a038040f8808e1338795cdbaf28418312a58d3fdd2f6417106d","mutation_count":2,"result":{"Total":2,"Killed":2,"Survived":0,"Errors":0},"tested_at":"2026-11-22T21:38:30.904705035Z"},{"index":3,"name":"Essential mark 4","scenario_hash":"47ef56111f4fc2f8ca8677cee01096f7df0f5a517e33474b92503ee4f0efffc2","mutation_count":2,"result":{"Total":2,"Killed":2,"Survived":0,"Errors":0},"tested_at":"2026-11-22T21:36:40.723770940Z"},{"index":4,"name":"Essential mark 5","scenario_hash":"9a497dc872025fccfd9fa132bf011f321c426a598d437d3eb65fd527acc03937","mutation_count":2,"result":{"Total":2,"Killed":2,"Survived":0,"Errors":0},"tested_at":"2026-11-22T21:36:40.723770940Z"},{"index":7,"name":"Essential mark 8","scenario_hash":"a64c7f5588192b623cd48376dea1a9a8b791a327bc55ae94a99cb4019e33c6aa","mutation_count":4,"result":{"Total":4,"Killed":4,"Survived":0,"Errors":0},"tested_at":"2026-11-22T21:36:40.723770940Z"},{"index":8,"name":"Essential mark 9","scenario_hash":"bea28ed049f6be78f3affc31c81cb1daac8f00dda01c917be0b84af340e8d255","mutation_count":10,"result":{"Total":10,"Killed":10,"Survived":0,"Errors":0},"tested_at":"2026-11-22T21:36:40.723770940Z"}]}
# acceptance-mutation-manifest-end

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
    When I create a one-off task with a valid title and Esencial <state>
    Then the stored essential mark is <mark>

    Examples:
      | state     | mark   |
      | checked   | true   |
      | unchecked | absent |

  # Essential mark 2
  # A relative recurring task is created essential only if the check is checked.
  Scenario Outline: Essential mark 2
    When I create a relative recurring task with a valid title, a valid interval and Esencial <state>
    Then the stored essential mark is <mark>

    Examples:
      | state     | mark   |
      | checked   | true   |
      | unchecked | absent |

  # Essential mark 3
  # A calendar recurring task is created essential only if the check is checked.
  Scenario Outline: Essential mark 3
    When I create a weekly recurring task with a valid title, valid days and Esencial <state>
    Then the stored essential mark is <mark>

    Examples:
      | state     | mark   |
      | checked   | true   |
      | unchecked | absent |

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
    Then the stored essential mark is <mark>

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
    Then the stored essential mark is <mark>

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
