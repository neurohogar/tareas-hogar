# mutation-stamp: sha256=67dd2c988dde89a6b94404687fb06bd0f5e0c86b7ab22ad332f862d0a70e7143
# acceptance-mutation-manifest-begin
# {"version":1,"tested_at":"2026-11-19T12:50:12.204430230Z","feature_name":"Pause task","feature_path":"features/pause-task.feature","background_hash":"74234e98afe7498fb5daf1f36ac2d78acc339464f950703b8c019892f982b90b","implementation_hash":"sha256:575c6b2a0e4b465a2b8a57dc7567872663a9c9c4c4c4a91fcbc5fdba4950bace","scenarios":[{"index":0,"name":"Pause task 1","scenario_hash":"de8f0bce678eb2625c2c8d967b5deadb35abec53bedc4e3bf0e482a1aa748a7f","mutation_count":3,"result":{"Total":3,"Killed":3,"Survived":0,"Errors":0},"tested_at":"2026-11-19T12:50:12.204430230Z"},{"index":1,"name":"Pause task 2","scenario_hash":"aa5a41f3e8e86075b2140b64508ce0e4eed7f39d316e69184b44b22a76e89e11","mutation_count":2,"result":{"Total":2,"Killed":2,"Survived":0,"Errors":0},"tested_at":"2026-11-19T12:50:12.204430230Z"},{"index":3,"name":"Pause task 4","scenario_hash":"0a0d241943912b93ca9fe64bfab5655861b904b995283907a849283d94424fe5","mutation_count":4,"result":{"Total":4,"Killed":4,"Survived":0,"Errors":0},"tested_at":"2026-11-19T12:50:12.204430230Z"},{"index":4,"name":"Pause task 5","scenario_hash":"1f4ef6c69868a90bfd5abe004533a85ac8ca492c750834239f70d6fdf02ed2f2","mutation_count":3,"result":{"Total":3,"Killed":3,"Survived":0,"Errors":0},"tested_at":"2026-11-19T12:50:12.204430230Z"},{"index":5,"name":"Pause task 6","scenario_hash":"e205ed7783003fbdb430d2756ad4c5e71025fbd1f53700d883066e5b3f448790","mutation_count":1,"result":{"Total":1,"Killed":1,"Survived":0,"Errors":0},"tested_at":"2026-11-19T12:50:12.204430230Z"},{"index":6,"name":"Pause task 7","scenario_hash":"81f9777facdc462becccb5b91860d985ed6f16f8b416a8f73fbefff01febc625","mutation_count":2,"result":{"Total":2,"Killed":2,"Survived":0,"Errors":0},"tested_at":"2026-11-19T12:50:12.204430230Z"},{"index":8,"name":"Pause task 9","scenario_hash":"7ae93277c1e472346711d353eb35262ef76d16581c5a9d300b8a71d3a35d0524","mutation_count":6,"result":{"Total":6,"Killed":6,"Survived":0,"Errors":0},"tested_at":"2026-11-19T12:50:12.204430230Z"},{"index":9,"name":"Pause task 10","scenario_hash":"4ccab8c9616576114473448f572974c7c1df3434366f5765cd996af21b57ec96","mutation_count":9,"result":{"Total":9,"Killed":9,"Survived":0,"Errors":0},"tested_at":"2026-11-19T12:50:12.204430230Z"},{"index":10,"name":"Pause task 11","scenario_hash":"d8398d97f726fe2d2c7c252f520d2e3c8873929d5a29f417ec0d833dca1bbc3f","mutation_count":3,"result":{"Total":3,"Killed":3,"Survived":0,"Errors":0},"tested_at":"2026-11-19T12:50:12.204430230Z"},{"index":11,"name":"Pause task 12","scenario_hash":"80b8e2d7ca032568b85f4639cbe33901898b22cef2a1ea5a6dafa66c331b5bb4","mutation_count":2,"result":{"Total":2,"Killed":2,"Survived":0,"Errors":0},"tested_at":"2026-11-19T12:50:12.204430230Z"},{"index":12,"name":"Pause task 13","scenario_hash":"24781bf9c115c178eeb52923655a77db7fef59da2a99791bd694204c2072c194","mutation_count":9,"result":{"Total":9,"Killed":9,"Survived":0,"Errors":0},"tested_at":"2026-11-19T12:50:12.204430230Z"}]}
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
