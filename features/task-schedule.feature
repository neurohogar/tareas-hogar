# mutation-stamp: sha256=f9b4434e90bb646c76a8f0eb17ffdef648be15a3cd8890c2d6912b281339609f
# acceptance-mutation-manifest-begin
# {"version":1,"tested_at":"2026-11-19T12:40:35.789198924Z","feature_name":"Task schedule","feature_path":"features/task-schedule.feature","background_hash":"74234e98afe7498fb5daf1f36ac2d78acc339464f950703b8c019892f982b90b","implementation_hash":"sha256:7747670bf1246ca8622e0a710c064a1c7900703f2ff6c1492b43ec6a6450e2e4","scenarios":[{"index":0,"name":"Task schedule 1","scenario_hash":"bccd9378233e51003f31c4265e34f38f1c245b13f49bb995d84ff6ce59d2fd1e","mutation_count":18,"result":{"Total":18,"Killed":18,"Survived":0,"Errors":0},"tested_at":"2026-11-19T12:40:35.789198924Z"},{"index":1,"name":"Task schedule 2","scenario_hash":"e34598bb3683a7fe8d677278e904667f0ee57c98b813c98c298e21add16854fd","mutation_count":9,"result":{"Total":9,"Killed":9,"Survived":0,"Errors":0},"tested_at":"2026-11-19T12:40:35.789198924Z"},{"index":2,"name":"Task schedule 3","scenario_hash":"b50e5d2773c1a4a9dcdb72b0a5e986c8683b34778c41072db5c06f526ecbf971","mutation_count":8,"result":{"Total":8,"Killed":8,"Survived":0,"Errors":0},"tested_at":"2026-11-19T12:40:35.789198924Z"},{"index":3,"name":"Task schedule 4","scenario_hash":"ad9b9f971e5e7fcc5fa565dbb2c416910fa775c625a166751d18dc1157a38e0d","mutation_count":2,"result":{"Total":2,"Killed":2,"Survived":0,"Errors":0},"tested_at":"2026-11-19T12:40:35.789198924Z"},{"index":4,"name":"Task schedule 5","scenario_hash":"c42eb5833fef284f5565b6ba50e883594781cbb5aee6df2b81468a8772297ca6","mutation_count":6,"result":{"Total":6,"Killed":6,"Survived":0,"Errors":0},"tested_at":"2026-11-19T12:40:35.789198924Z"},{"index":7,"name":"Task schedule 8","scenario_hash":"7239da58fbb0a97fd016293b79ef180d8ee94e57773e77c5050129e4bc450f49","mutation_count":4,"result":{"Total":4,"Killed":4,"Survived":0,"Errors":0},"tested_at":"2026-11-19T12:40:35.789198924Z"},{"index":8,"name":"Task schedule 9","scenario_hash":"3b1ded62c6188abbeb63910e278394e2a58d1d0730d1fb801d6fc6fbe386d038","mutation_count":6,"result":{"Total":6,"Killed":6,"Survived":0,"Errors":0},"tested_at":"2026-11-19T12:40:35.789198924Z"},{"index":9,"name":"Task schedule 10","scenario_hash":"08235ee586b1d1f34832d7b5be0fa71b5b225ab7eec0b6a3baab1d590e2362bb","mutation_count":2,"result":{"Total":2,"Killed":2,"Survived":0,"Errors":0},"tested_at":"2026-11-19T12:40:35.789198924Z"},{"index":10,"name":"Task schedule 11","scenario_hash":"068e30304a1cd3f42d673ec574ce6dc4f42d5e49959d64383489554fc0a9f648","mutation_count":16,"result":{"Total":16,"Killed":16,"Survived":0,"Errors":0},"tested_at":"2026-11-19T12:40:35.789198924Z"},{"index":11,"name":"Task schedule 12","scenario_hash":"b29be67eb86b41e3b24722d7bb02fb4291434ac1d097c02cc3b14ed9b1faaf7e","mutation_count":2,"result":{"Total":2,"Killed":2,"Survived":0,"Errors":0},"tested_at":"2026-11-19T12:40:35.789198924Z"},{"index":12,"name":"Task schedule 13","scenario_hash":"11f54c245b868ee0535ab08b7594e8bc74633a59597cb561fa432f8b45be7c5b","mutation_count":5,"result":{"Total":5,"Killed":5,"Survived":0,"Errors":0},"tested_at":"2026-11-19T12:40:35.789198924Z"},{"index":13,"name":"Task schedule 14","scenario_hash":"c3e5762ff0766cc047216cdd0e77d789a8fca14a037e61643fa138bccde9f41a","mutation_count":10,"result":{"Total":10,"Killed":10,"Survived":0,"Errors":0},"tested_at":"2026-11-19T12:40:35.789198924Z"},{"index":14,"name":"Task schedule 15","scenario_hash":"bf93977a65b4bda36d87a373a9fbab18f1e106b91c21938bc8e507cfe2656026","mutation_count":6,"result":{"Total":6,"Killed":6,"Survived":0,"Errors":0},"tested_at":"2026-11-19T12:40:35.789198924Z"},{"index":15,"name":"Task schedule 16","scenario_hash":"ddd9be8ce873d0a9a5fa84d8adf2f4967db291fcf27fb8f0b03d8634cd5c19a5","mutation_count":5,"result":{"Total":5,"Killed":5,"Survived":0,"Errors":0},"tested_at":"2026-11-19T12:40:35.789198924Z"},{"index":16,"name":"Task schedule 17","scenario_hash":"e38b0104cc7d3f7ec47b24004437321ce4ea73be2efb7af0344acf82796e5c82","mutation_count":4,"result":{"Total":4,"Killed":4,"Survived":0,"Errors":0},"tested_at":"2026-11-19T12:40:35.789198924Z"},{"index":17,"name":"Task schedule 18","scenario_hash":"8489774522b9bc3e1afc162f1f2b46ce9f529b488aa27875454c6d751835a056","mutation_count":2,"result":{"Total":2,"Killed":2,"Survived":0,"Errors":0},"tested_at":"2026-11-19T12:40:35.789198924Z"}]}
# acceptance-mutation-manifest-end

# Spec §4.1 (horario field), §6.2 (Horario field of the panel) and §7 (Conflicts).
# Horario: { desde: "HH:MM", hasta: "HH:MM" }, local times in 24 h format,
# optional and for any kind of task. Without the field, the task can be
# completed at any time. Valid only with both times and desde < hasta
# (the window does not cross midnight). With only one of the two times, or with
# desde >= hasta, the creation or the edit is rejected entirely.
# Removing the schedule (turning off "Solo en un horario") leaves the task without a schedule.
# Changing the kind of the task does not touch the schedule (it is not a kind field).
# Conflicts: horario is a single field (desde and hasta are written together);
# the last change wins, per field. It is independent of title and of the other
# fields.
# "the task can be completed from D to H" is a task that already has that
# schedule stored; "the task has schedule from D to H" looks at what is stored.
Feature: Task schedule

  # Task schedule 1
  # Creating a one-off with a schedule stores it as is. Row 2: the widest
  # possible schedule. Row 3: a window of one minute.
  Scenario Outline: Task schedule 1
    When I create a one-off task with title <title> and schedule from <from> to <to>
    Then a one-off task is created with title <title_stored>
    And the task has schedule from <from_stored> to <to_stored>

    Examples:
      | title  | from  | to    | title_stored    | from_stored    | to_stored      |
      | Regar  | 08:00 | 11:00 | Regar           | 08:00          | 11:00          |
      | Regar  | 00:00 | 23:59 | Regar           | 00:00          | 23:59          |
      | Regar  | 09:00 | 09:01 | Regar           | 09:00          | 09:01          |

  # Task schedule 2
  # A relative recurring task can also have a schedule.
  Scenario Outline: Task schedule 2
    When I create a relative recurring task with title <title> every <every> <unit> and schedule from <from> to <to>
    Then a recurring task is created with title <title_stored>
    And its recurrence is relative every <every_stored> <unit>
    And the task has schedule from <from_stored> to <to_stored>

    Examples:
      | title  | every | unit   | from  | to    | title_stored    | every_stored  | from_stored    | to_stored      |
      | Regar  | 2    | dias   | 08:00 | 11:00 | Regar           | 2             | 08:00          | 11:00          |

  # Task schedule 3
  # A calendar recurring task can also have a schedule.
  Scenario Outline: Task schedule 3
    When I create a weekly recurring task with title <title> on <days> and schedule from <from> to <to>
    Then a recurring task is created with title <title_stored>
    And its recurrence is weekly on <days_stored>
    And the task has schedule from <from_stored> to <to_stored>

    Examples:
      | title  | days           | from  | to    | title_stored    | days_stored    | from_stored    | to_stored      |
      | Basura | martes, jueves | 20:00 | 22:30 | Basura          | martes, jueves | 20:00          | 22:30          |

  # Task schedule 4
  # Without a schedule, the task does not have one.
  Scenario Outline: Task schedule 4
    When I create a one-off task with title <title> and no due date
    Then a one-off task is created with title <title_stored>
    And the task has no schedule

    Examples:
      | title  | title_stored    |
      | Regar  | Regar           |

  # Task schedule 5
  # With desde >= hasta, the creation is rejected entirely. Row 2: equal. Row
  # 3: the window would cross midnight.
  Scenario Outline: Task schedule 5
    When I create a one-off task with a valid title and schedule from <from> to <to>
    Then creation is rejected because the end time is not after the start time
    And no task is created

    Examples:
      | from  | to    |
      | 11:00 | 08:00 |
      | 09:00 | 09:00 |
      | 22:00 | 02:00 |

  # Task schedule 6
  # With only one of the two times, the creation is rejected entirely.
  Scenario Outline: Task schedule 6
    When I create a one-off task with a valid title and a schedule with only the start time <from>
    Then creation is rejected for incomplete schedule
    And no task is created

    Examples:
      | from  |
      | 08:00 |

  # Task schedule 7
  # With only the end time, too.
  Scenario Outline: Task schedule 7
    When I create a one-off task with a valid title and a schedule with only the end time <to>
    Then creation is rejected for incomplete schedule
    And no task is created

    Examples:
      | to    |
      | 11:00 |

  # Task schedule 8
  # Giving a schedule to a task that did not have one.
  Scenario Outline: Task schedule 8
    Given a one-off task without a due date
    When I set the schedule from <from> to <to>
    Then the task has schedule from <from_stored> to <to_stored>

    Examples:
      | from  | to    | from_stored    | to_stored      |
      | 08:00 | 11:00 | 08:00          | 11:00          |

  # Task schedule 9
  # Changing the schedule replaces both times.
  Scenario Outline: Task schedule 9
    Given a one-off task without a due date
    And the task can be completed from <from> to <to>
    When I set the schedule from <from_new> to <to_new>
    Then the task has schedule from <from_stored> to <to_stored>

    Examples:
      | from  | to    | from_new    | to_new      | from_stored    | to_stored      |
      | 08:00 | 11:00 | 18:00       | 20:00       | 18:00          | 20:00          |

  # Task schedule 10
  # Removing the schedule leaves the task without a schedule.
  Scenario Outline: Task schedule 10
    Given a one-off task without a due date
    And the task can be completed from <from> to <to>
    When I remove the schedule
    Then the task has no schedule

    Examples:
      | from  | to    |
      | 08:00 | 11:00 |

  # Task schedule 11
  # An edit with desde >= hasta is rejected entirely: it does not change the title that
  # came in the same edit nor the stored schedule.
  Scenario Outline: Task schedule 11
    Given a one-off task <title> without a due date
    And the task can be completed from <from> to <to>
    When in a single edit I edit the title to <title_new> and the schedule from <from_new> to <to_new>
    Then editing is rejected because the end time is not after the start time
    And the task has title <title_stored>
    And the task has schedule from <from_stored> to <to_stored>

    Examples:
      | title  | from  | to    | title_new    | from_new    | to_new      | title_stored    | from_stored    | to_stored      |
      | Regar  | 08:00 | 11:00 | Barrer       | 11:00       | 10:00       | Regar           | 08:00          | 11:00          |
      | Regar  | 08:00 | 11:00 | Barrer       | 10:00       | 10:00       | Regar           | 08:00          | 11:00          |

  # Task schedule 12
  # An edit with only one of the two times is rejected and the task does not
  # change.
  Scenario Outline: Task schedule 12
    Given a one-off task without a due date
    And the task can be completed from <from> to <to>
    When I set a schedule with only the start time <from_new>
    Then editing is rejected for incomplete schedule
    And the task does not change

    Examples:
      | from  | to    | from_new    |
      | 08:00 | 11:00 | 09:00       |

  # Task schedule 13
  # Changing the kind of the task keeps the schedule.
  Scenario Outline: Task schedule 13
    Given a one-off task without a due date
    And the task can be completed from <from> to <to>
    When I edit the task to relative recurring every <every> <unit>
    Then the task is recurring
    And the task has schedule from <from_stored> to <to_stored>

    Examples:
      | from  | to    | every | unit   | from_stored    | to_stored      |
      | 08:00 | 11:00 | 2    | dias   | 08:00          | 11:00          |

  # Task schedule 14
  # Setting the schedule does not change the id nor touch the completions.
  Scenario Outline: Task schedule 14
    Given a relative recurring task every <every> <unit>
    And the task was completed on <completed>
    When I set the schedule from <from> to <to>
    Then the task keeps its id
    And the task keeps a single completion, from <completed_stored>

    Examples:
      | every | unit   | completed           | from  | to    | completed_stored    |
      | 2    | dias   | 2026-07-15T08:00:00 | 08:00 | 11:00 | 2026-07-15T08:00:00 |

  # Task schedule 15
  # Schedule and title are different fields: both changes are combined.
  Scenario Outline: Task schedule 15
    Given a one-off task without a due date
    When I set the schedule from <from> to <to>
    And another device, without seeing that change, edits the title to <title_new>
    Then the task has schedule from <from_stored> to <to_stored>
    And the task has title <title_stored>

    Examples:
      | from  | to    | title_new    | from_stored    | to_stored      | title_stored    |
      | 08:00 | 11:00 | Barrer       | 08:00          | 11:00          | Barrer          |

  # Task schedule 16
  # Schedule is a single field: if one device changes the desde and another the
  # hasta, the last change wins whole (the times are not mixed).
  Scenario Outline: Task schedule 16
    Given a one-off task without a due date
    And the task can be completed from <from> to <to>
    When I set the schedule from <from_mine> to <to>
    And another device, without seeing that change, sets the schedule from <from> to <to_other>
    Then the task has schedule from <from_stored> to <to_stored>

    Examples:
      | from  | to    | from_mine | to_other   | from_stored    | to_stored      |
      | 08:00 | 11:00 | 07:00     | 12:00      | 08:00          | 12:00          |

  # Task schedule 17
  # Removing the schedule and editing the title on another device: they are combined.
  Scenario Outline: Task schedule 17
    Given a one-off task without a due date
    And the task can be completed from <from> to <to>
    When I remove the schedule
    And another device, without seeing that change, edits the title to <title_new>
    Then the task has no schedule
    And the task has title <title_stored>

    Examples:
      | from  | to    | title_new    | title_stored    |
      | 08:00 | 11:00 | Barrer       | Barrer          |

  # Task schedule 18
  # Changing the schedule and another device, afterwards, removing it: the
  # last change wins and the task ends up without a schedule.
  Scenario Outline: Task schedule 18
    Given a one-off task without a due date
    And the task can be completed from <from> to <to>
    When I set the schedule from <from_new> to <to_new>
    And another device, without seeing that change, removes the schedule
    Then the task has no schedule

    Examples:
      | from  | to    | from_new    | to_new      |
      | 08:00 | 11:00 | 18:00       | 20:00       |
