# mutation-stamp: sha256=6438818eef2c133cfe6428c7bd07f600f3ca2204813ae0d420d29d60d0d5175f
# acceptance-mutation-manifest-begin
# {"version":1,"tested_at":"2026-11-17T20:58:54.843930951Z","feature_name":"Horario de tarea","feature_path":"features/horario-de-tarea.feature","background_hash":"74234e98afe7498fb5daf1f36ac2d78acc339464f950703b8c019892f982b90b","implementation_hash":"sha256:3487240879892216687351d73a7f89c4d3e278aca1674b471def7ab9dd38a95b","scenarios":[{"index":0,"name":"Horario de tarea 1","scenario_hash":"d0f3cd2d6ba97340b8bfce13baae5ad594de484100e872ecaba39f013c372dd0","mutation_count":18,"result":{"Total":18,"Killed":18,"Survived":0,"Errors":0},"tested_at":"2026-11-17T20:58:54.843930951Z"},{"index":1,"name":"Horario de tarea 2","scenario_hash":"854f68eb35fba59b1ec2c3e94541a0dbfdb723dbf6958b843abb64ec526f57bd","mutation_count":9,"result":{"Total":9,"Killed":9,"Survived":0,"Errors":0},"tested_at":"2026-11-17T20:58:54.843930951Z"},{"index":2,"name":"Horario de tarea 3","scenario_hash":"36c0747ef158f22af9d04bf3b01e187d17b106ed5da9d08209e2bcd3282830d8","mutation_count":8,"result":{"Total":8,"Killed":8,"Survived":0,"Errors":0},"tested_at":"2026-11-17T20:58:54.843930951Z"},{"index":3,"name":"Horario de tarea 4","scenario_hash":"f8a0f7ee9904707e44bd5f95f7c58eaff1ada7fc522cbd7df697d08a9d22300d","mutation_count":2,"result":{"Total":2,"Killed":2,"Survived":0,"Errors":0},"tested_at":"2026-11-17T20:58:54.843930951Z"},{"index":4,"name":"Horario de tarea 5","scenario_hash":"c5a3381468211b0f9039337c733273421ec97a983f3c099f3000166e95e5bb55","mutation_count":6,"result":{"Total":6,"Killed":6,"Survived":0,"Errors":0},"tested_at":"2026-11-17T20:58:54.843930951Z"},{"index":7,"name":"Horario de tarea 8","scenario_hash":"07839b15710debb58bcb6e2efb40823a596f5bdb2f3ba78e57f8974774fa8671","mutation_count":4,"result":{"Total":4,"Killed":4,"Survived":0,"Errors":0},"tested_at":"2026-11-17T20:58:54.843930951Z"},{"index":8,"name":"Horario de tarea 9","scenario_hash":"88dc4fc78a094a9b4ee23a198979bb360a03e93d11279cb5efb36d15e2c9b2f1","mutation_count":6,"result":{"Total":6,"Killed":6,"Survived":0,"Errors":0},"tested_at":"2026-11-17T20:58:54.843930951Z"},{"index":9,"name":"Horario de tarea 10","scenario_hash":"63d7bf825b3dee44b7a58d4d7f28e1756f64249b5a2afe0e9527eee1a6d33900","mutation_count":2,"result":{"Total":2,"Killed":2,"Survived":0,"Errors":0},"tested_at":"2026-11-17T20:58:54.843930951Z"},{"index":10,"name":"Horario de tarea 11","scenario_hash":"e03fa41715de423fd9f9d55c26205cb837fde164763d3f67e395bcf4565fb08c","mutation_count":16,"result":{"Total":16,"Killed":16,"Survived":0,"Errors":0},"tested_at":"2026-11-17T20:58:54.843930951Z"},{"index":11,"name":"Horario de tarea 12","scenario_hash":"4c93783a69e9856867a435dcc8fed5e300557e3111b1289fccf8078d31b340f1","mutation_count":2,"result":{"Total":2,"Killed":2,"Survived":0,"Errors":0},"tested_at":"2026-11-17T20:58:54.843930951Z"},{"index":12,"name":"Horario de tarea 13","scenario_hash":"31b01ec1c0beef98e8e0592ab1d867328c6f5c870c2a2ca1bb737509653d9719","mutation_count":5,"result":{"Total":5,"Killed":5,"Survived":0,"Errors":0},"tested_at":"2026-11-17T20:58:54.843930951Z"},{"index":13,"name":"Horario de tarea 14","scenario_hash":"233ce3d0bb3299259c35449295a03b8a5329444166168c00c8de1fb0f3374d1f","mutation_count":10,"result":{"Total":10,"Killed":10,"Survived":0,"Errors":0},"tested_at":"2026-11-17T20:58:54.843930951Z"},{"index":14,"name":"Horario de tarea 15","scenario_hash":"e30347a418c388215fbd59ece75722de85f23a6aaa208aa2ecddb3489c12b6aa","mutation_count":6,"result":{"Total":6,"Killed":6,"Survived":0,"Errors":0},"tested_at":"2026-11-17T20:58:54.843930951Z"},{"index":15,"name":"Horario de tarea 16","scenario_hash":"fd60b9ca67ecb32212dbfb7c04f248ec2d6359007aca59712f539719a01dcbd5","mutation_count":5,"result":{"Total":5,"Killed":5,"Survived":0,"Errors":0},"tested_at":"2026-11-17T20:58:54.843930951Z"},{"index":16,"name":"Horario de tarea 17","scenario_hash":"e453d5fc368e71abbf8a8ac29c73ce46f1afa4ca5b897c78721d0c691c2ac3d8","mutation_count":4,"result":{"Total":4,"Killed":4,"Survived":0,"Errors":0},"tested_at":"2026-11-17T20:58:54.843930951Z"},{"index":17,"name":"Horario de tarea 18","scenario_hash":"76f59b69e94cf2344d51a0e6e4226bb0d0644655332d80dc1ddd8e7273adc624","mutation_count":2,"result":{"Total":2,"Killed":2,"Survived":0,"Errors":0},"tested_at":"2026-11-17T20:58:54.843930951Z"}]}
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
