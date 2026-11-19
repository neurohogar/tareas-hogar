# mutation-stamp: sha256=ceeb8542d590e7003173f672c8f7c757f1756b877fe1e5040a43f6f12e422330
# acceptance-mutation-manifest-begin
# {"version":1,"tested_at":"2026-11-17T21:05:42.588630996Z","feature_name":"Pausar tarea","feature_path":"features/pausar-tarea.feature","background_hash":"74234e98afe7498fb5daf1f36ac2d78acc339464f950703b8c019892f982b90b","implementation_hash":"sha256:9d0c56c6af46940ce26c8438950d321da092705034fe3421f2e48c1672e1acdf","scenarios":[{"index":0,"name":"Pausar tarea 1","scenario_hash":"ef72f322dc9d35a34cdd48984688d36e9417268fc3670a72b19a003b160da1c2","mutation_count":2,"result":{"Total":2,"Killed":2,"Survived":0,"Errors":0},"tested_at":"2026-11-17T21:05:42.588630996Z"},{"index":1,"name":"Pausar tarea 2","scenario_hash":"fb943038692fd8fe1522c1d80d46c9e3d00b29212dced7c964156903923c4432","mutation_count":2,"result":{"Total":2,"Killed":2,"Survived":0,"Errors":0},"tested_at":"2026-11-17T21:05:42.588630996Z"},{"index":3,"name":"Pausar tarea 4","scenario_hash":"74f1dfbd51303b301e2c186b062a6eef8c79531838471e70a2b9ee383d79a665","mutation_count":4,"result":{"Total":4,"Killed":4,"Survived":0,"Errors":0},"tested_at":"2026-11-17T21:05:42.588630996Z"},{"index":4,"name":"Pausar tarea 5","scenario_hash":"f5a658b1e5bbcbb23d875a74231188b7d340350400f52ed76999b08b03da931c","mutation_count":3,"result":{"Total":3,"Killed":3,"Survived":0,"Errors":0},"tested_at":"2026-11-17T21:05:42.588630996Z"},{"index":5,"name":"Pausar tarea 6","scenario_hash":"869c93294a5feb142cad4561e98ee8b9ac9abafe34481b54facea4ed4eff0b84","mutation_count":1,"result":{"Total":1,"Killed":1,"Survived":0,"Errors":0},"tested_at":"2026-11-17T21:05:42.588630996Z"},{"index":6,"name":"Pausar tarea 7","scenario_hash":"f21799ebd8b98cb7129181351f942809ee3f339adad8370abe7fad59245087ab","mutation_count":2,"result":{"Total":2,"Killed":2,"Survived":0,"Errors":0},"tested_at":"2026-11-17T21:05:42.588630996Z"},{"index":8,"name":"Pausar tarea 9","scenario_hash":"9da839a722724075f7c60fea1e1754e3ab47a72ab07b03add0dfa428b72c58b6","mutation_count":6,"result":{"Total":6,"Killed":6,"Survived":0,"Errors":0},"tested_at":"2026-11-17T21:05:42.588630996Z"},{"index":9,"name":"Pausar tarea 10","scenario_hash":"39692242584f177582f027e9135a822ca034ebd1bc6b88bbc41ff8edba8dc25e","mutation_count":9,"result":{"Total":9,"Killed":9,"Survived":0,"Errors":0},"tested_at":"2026-11-17T21:05:42.588630996Z"},{"index":10,"name":"Pausar tarea 11","scenario_hash":"2d80c38c2887844bf9a034a8a01e491b770766842292fba617a77cd84242c9cf","mutation_count":3,"result":{"Total":3,"Killed":3,"Survived":0,"Errors":0},"tested_at":"2026-11-17T21:05:42.588630996Z"},{"index":11,"name":"Pausar tarea 12","scenario_hash":"f94fae4ec1055d04902633ee7484c493942f54b67ebd58c3bb7d98da6cb19be4","mutation_count":1,"result":{"Total":1,"Killed":1,"Survived":0,"Errors":0},"tested_at":"2026-11-17T21:05:42.588630996Z"},{"index":12,"name":"Pausar tarea 13","scenario_hash":"eb3c3aac83b7794950583fca4b0354a88bd6d7b29b94f791358fbfaca5fe70d7","mutation_count":9,"result":{"Total":9,"Killed":9,"Survived":0,"Errors":0},"tested_at":"2026-11-17T21:05:42.588630996Z"}]}
# acceptance-mutation-manifest-end

# Spec §5.8 (Pausar), §4.1 (pausada), §6.2 (Pausar / Reanudar) and §7
# (pausing and resuming write pausada and reanudadaEn together).
# Only recurring tasks can be paused. A paused task has no status (it is not
# pending, overdue or waiting), does not become overdue, is not completed and its
# checkbox is disabled. Pausing does not touch the completions; they can still
# be deleted while the task is paused. Editing a paused task (Guardar) does not
# resume it.
# "I pause the task" taps Pausar in the edit panel: it acts at once,
# without Guardar. "the task was paused" is a task already paused before
# any other date in the scenario that does not name it. "the task is
# paused" asserts that it has pausada; "the task has no status", that
# when queried it is not pending, overdue or waiting.
# "the edit panel offers <action>" gives the pause button shown
# when editing the task: Pausar or Reanudar (with Reanudar, the panel says "Pausada").
# That the button saves and closes the panel, that it does not exist when creating a task and
# the text "Pausada" are verified in the QA suite.
# Reference week: Monday 2026-07-13 to Sunday 2026-07-19.
Feature: Pause task

  # Pause task 1
  # A paused relative has no status, is not completed and its checkbox
  # is disabled. Row 1: without the pause it would be waiting and completed.
  # Row 2: without the pause it would be overdue.
  Scenario Outline: Pause task 1
    Given a relative recurring task every <every> <unit>
    And the task was completed on <completed>
    When I pause the task
    And I query the status on <now>
    Then the task is paused
    And the task has no status
    And the task is not completed
    And the task checkbox is disabled

    Examples:
      | every | unit   | completed           | now                 |
      | 2    | dias   | 2026-07-15T09:00:00 | 2026-07-15T12:00:00 |
      | 2    | dias   | 2026-07-01T09:00:00 | 2026-07-15T12:00:00 |

  # Pause task 2
  # A paused weekly never completed has no status and does not become overdue,
  # even as its occurrences pass. Row 1: without the pause it would be pending.
  # Row 2: without the pause it would be overdue.
  Scenario Outline: Pause task 2
    Given a weekly recurring task on <days> created on <created>
    And the task was paused
    When I query the status on <now>
    Then the task has no status
    And the task checkbox is disabled

    Examples:
      | days           | created             | now                 |
      | martes, jueves | 2026-07-13T08:00:00 | 2026-07-14T10:00:00 |
      | martes, jueves | 2026-07-13T08:00:00 | 2026-08-20T10:00:00 |

  # Pause task 3
  # A paused monthly with completions has no status (without the pause it would be
  # pending) and is not completed.
  Scenario Outline: Pause task 3
    Given a monthly recurring task on days <days>
    And the task has a completion that covers <covered>
    And the task was paused
    When I query the status on <now>
    Then the task has no status
    And the task is not completed

    Examples:
      | days | covered    | now                 |
      | 15   | 2026-06-15 | 2026-07-15T10:00:00 |

  # Pause task 4
  # With a schedule, the paused task also has no status and its checkbox is still
  # disabled inside the window.
  Scenario Outline: Pause task 4
    Given a relative recurring task every <every> <unit>
    And the task was completed on <completed>
    And the task can be completed from <from> to <to>
    And the task was paused
    When I query the status on <now>
    Then the task has no status
    And the task checkbox is disabled

    Examples:
      | every | unit   | completed           | from  | to    | now                 |
      | 1    | dias   | 2026-07-14T09:00:00 | 08:00 | 11:00 | 2026-07-15T09:00:00 |

  # Pause task 5
  # When editing a non-paused relative, the panel offers Pausar.
  Scenario Outline: Pause task 5
    Given a relative recurring task every <every> <unit>
    When I open the task in the edit panel
    Then the edit panel offers <action>

    Examples:
      | every | unit   | action |
      | 2    | dias   | Pausar |

  # Pause task 6
  # When editing a non-paused calendar one, the panel offers Pausar.
  Scenario Outline: Pause task 6
    Given a monthly recurring task on days <days>
    When I open the task in the edit panel
    Then the edit panel offers <action>

    Examples:
      | days | action |
      | 10   | Pausar |

  # Pause task 7
  # When editing a paused one, the panel offers Reanudar.
  Scenario Outline: Pause task 7
    Given a weekly recurring task on <days>
    And the task was paused
    When I open the task in the edit panel
    Then the edit panel offers <action>

    Examples:
      | days           | action   |
      | martes, jueves | Reanudar |

  # Pause task 8
  # A one-off cannot be paused: the panel does not offer Pausar.
  Scenario: Pause task 8
    Given a one-off task without a due date
    When I open the task in the edit panel
    Then the edit panel does not offer pause

  # Pause task 9
  # Editing a paused task (title, mode) leaves it paused.
  Scenario Outline: Pause task 9
    Given a relative recurring task <title> every <every> <unit>
    And the task was paused
    When I edit the title to <title_new>
    And I edit the task to weekly recurring on <days>
    Then the task has title <title_stored>
    And its recurrence is weekly on <days_stored>
    And the task is paused

    Examples:
      | title  | every | unit   | title_new     | days   | title_stored    | days_stored    |
      | Regar  | 2    | dias   | Regar plantas | jueves | Regar plantas   | jueves         |

  # Pause task 10
  # Pausing does not touch the completions, and with the task paused they can be deleted;
  # it stays paused.
  Scenario Outline: Pause task 10
    Given a relative recurring task every <every> <unit>
    And the task was completed on <first>
    And the task was completed on <second>
    When I pause the task
    And I delete the completion from <second>
    Then the task keeps a single completion, from <remains>
    And the task is paused

    Examples:
      | every | unit   | first               | second              | remains             |
      | 2    | dias   | 2026-07-13T09:00:00 | 2026-07-15T09:00:00 | 2026-07-13T09:00:00 |

  # Pause task 11
  # Pausing on one device and changing the title on another: both
  # changes are kept.
  Scenario Outline: Pause task 11
    Given a relative recurring task <title> every <every> <unit>
    When I pause the task
    And another device, without seeing that change, edits the title to <title_new>
    Then the task has title <title_stored>
    And the task is paused

    Examples:
      | title  | every | unit   | title_new     | title_stored    |
      | Regar  | 2    | dias   | Regar plantas | Regar plantas   |

  # Pause task 12
  # Resuming on one device and, afterwards, pausing on another that did not see the
  # resume: the last change wins, it stays paused.
  Scenario Outline: Pause task 12
    Given a relative recurring task every <every> <unit>
    And the task was paused
    When I resume the task on <resumed>
    And another device, without seeing that change, pauses the task
    And I query the status on <now>
    Then the task is paused
    And the task has no status

    Examples:
      | every | unit   | resumed             | now                 |
      | 2    | dias   | 2026-07-15T10:00:00 | 2026-07-15T12:00:00 |

  # Pause task 13
  # Another device, without seeing the pause, completes the task: the completion is
  # saved and the task stays paused, with no status.
  Scenario Outline: Pause task 13
    Given a relative recurring task Regar every <every> <unit>
    When I pause the task
    And another device, without seeing that change, completes the task Regar on <completed>
    And I query the status on <now>
    Then the task keeps a single completion, from <completed_stored>
    And the task is paused
    And the task has no status

    Examples:
      | every | unit   | completed           | now                 | completed_stored    |
      | 2    | dias   | 2026-07-15T09:00:00 | 2026-07-15T12:00:00 | 2026-07-15T09:00:00 |
