# mutation-stamp: sha256=3278aa246c2e2946c223e1fc862f5b00ed9a3905119a0315aa56d34f07ec68f5
# acceptance-mutation-manifest-begin
# {"version":1,"tested_at":"2026-11-22T21:52:19.432729089Z","feature_name":"First step in the row","feature_path":"features/first-step-in-row.feature","background_hash":"74234e98afe7498fb5daf1f36ac2d78acc339464f950703b8c019892f982b90b","implementation_hash":"sha256:2100cccb9bf7bd59de3e3112c07729c0dbf54f1d00d5d0f0138149173cde236d","scenarios":[{"index":0,"name":"First step in the row 1","scenario_hash":"2afd356462e258234adfc85dbe5c67761df2006098d5c57760ede1a8296c6489","mutation_count":4,"result":{"Total":4,"Killed":4,"Survived":0,"Errors":0},"tested_at":"2026-11-22T21:52:19.432729089Z"},{"index":1,"name":"First step in the row 2","scenario_hash":"afcf1de6362ce646ec79524bfd363ca8c4374f3a4f0999df8d80b523f7481c59","mutation_count":2,"result":{"Total":2,"Killed":2,"Survived":0,"Errors":0},"tested_at":"2026-11-22T21:52:19.432729089Z"},{"index":2,"name":"First step in the row 3","scenario_hash":"7eb006d16af91a07ea550b9a300e5d19e9a4280ca50aab99f8858c1db453a638","mutation_count":4,"result":{"Total":4,"Killed":4,"Survived":0,"Errors":0},"tested_at":"2026-11-22T21:52:19.432729089Z"},{"index":3,"name":"First step in the row 4","scenario_hash":"c93e5d44825f68addbdbf38de192f38af4b5f220594083cdeb80cb5331978516","mutation_count":4,"result":{"Total":4,"Killed":4,"Survived":0,"Errors":0},"tested_at":"2026-11-22T21:52:19.432729089Z"},{"index":4,"name":"First step in the row 5","scenario_hash":"95dae7a3e4e245d57dd9714a2fd5048bdb3187264a5e3cbddf67af00327a47c7","mutation_count":4,"result":{"Total":4,"Killed":4,"Survived":0,"Errors":0},"tested_at":"2026-11-22T21:52:19.432729089Z"},{"index":5,"name":"First step in the row 6","scenario_hash":"457daf559750d022fef567e72e086b373da320262ccae2ce7538dacf16166a5a","mutation_count":4,"result":{"Total":4,"Killed":4,"Survived":0,"Errors":0},"tested_at":"2026-11-22T21:52:19.432729089Z"},{"index":7,"name":"First step in the row 8","scenario_hash":"f8627ba02afeb6458f0208153843b5a1ceea07510dd592dabe95cbdde18348c1","mutation_count":1,"result":{"Total":1,"Killed":1,"Survived":0,"Errors":0},"tested_at":"2026-11-22T21:52:19.432729089Z"},{"index":8,"name":"First step in the row 9","scenario_hash":"74f18c84e8535903d61f2daa048d8514089f9ebae5fce03b6023442e42ae1084","mutation_count":2,"result":{"Total":2,"Killed":2,"Survived":0,"Errors":0},"tested_at":"2026-11-22T21:52:19.432729089Z"},{"index":9,"name":"First step in the row 10","scenario_hash":"804d5fe77e4b2b33f9b16af8eb86d802a49a5ade8111bb30fc12ee2c9f507078","mutation_count":2,"result":{"Total":2,"Killed":2,"Survived":0,"Errors":0},"tested_at":"2026-11-22T21:52:19.432729089Z"},{"index":10,"name":"First step in the row 11","scenario_hash":"0d6eefcd45f0ead764a4ca256f94dba9866f010e89b07d37032713f4f3bce2da","mutation_count":7,"result":{"Total":7,"Killed":7,"Survived":0,"Errors":0},"tested_at":"2026-11-22T21:52:19.432729089Z"},{"index":11,"name":"First step in the row 12","scenario_hash":"9a912837c42653d9a3222a106e62ccad547991d9632dbee1334853986fc9f214","mutation_count":6,"result":{"Total":6,"Killed":6,"Survived":0,"Errors":0},"tested_at":"2026-11-22T21:52:19.432729089Z"},{"index":14,"name":"First step in the row 15","scenario_hash":"b29851c03133de2ff6fd3a720583e8c5d9e51bba87c2d69dbfb379148f5ef374","mutation_count":14,"result":{"Total":14,"Killed":14,"Survived":0,"Errors":0},"tested_at":"2026-11-22T21:52:19.432729089Z"},{"index":15,"name":"First step in the row 16","scenario_hash":"14d6b814994ed6b83ae0ee49ceb9647843ba05b4df6fb14bf1a1dfa63ec62d34","mutation_count":12,"result":{"Total":12,"Killed":12,"Survived":0,"Errors":0},"tested_at":"2026-11-22T21:52:19.432729089Z"},{"index":16,"name":"First step in the row 17","scenario_hash":"f7681c8daf37a152764ab8bb82f5e222bff6d1303dbf51f9d7bbd7873277f270","mutation_count":3,"result":{"Total":3,"Killed":3,"Survived":0,"Errors":0},"tested_at":"2026-11-22T21:52:19.432729089Z"},{"index":17,"name":"First step in the row 18","scenario_hash":"9dd83edeb1f382ea4aa6055f0f3a5a327fd8d24e7212d331a3ac7c2723a7b280","mutation_count":2,"result":{"Total":2,"Killed":2,"Survived":0,"Errors":0},"tested_at":"2026-11-22T21:52:19.432729089Z"}]}
# acceptance-mutation-manifest-end

Feature: First step in the row

  # First step in the row 1
  # A pending task with a first step shows it with the prefix «Primer paso: »,
  # in full (row 2: long, not truncated).
  Scenario Outline: First step in the row 1
    Given a one-off task without a due date
    And the first step of the task is <first_step>
    When I query Pendientes at any moment
    Then the task row shows the first step <text>

    Examples:
      | first_step                                                                                                                     | text                                                                                                                                        |
      | Separar la ropa blanca                                                                                                         | Primer paso: Separar la ropa blanca                                                                                                         |
      | Abrir el cajón de abajo, sacar toda la ropa blanca y separarla en dos pilas: la que va con agua caliente y la que no se mezcla | Primer paso: Abrir el cajón de abajo, sacar toda la ropa blanca y separarla en dos pilas: la que va con agua caliente y la que no se mezcla |

  # First step in the row 2
  # Also on a pending relative recurring task.
  Scenario Outline: First step in the row 2
    Given a relative recurring task every <every> <unit>
    And the first step of the task is <first_step>
    When I query Pendientes on <now>
    Then the task row shows the first step <text>

    Examples:
      | every | unit   | first_step         | now                 | text                            |
      | 2    | dias   | Llenar la regadera | 2026-11-13T10:00:00 | Primer paso: Llenar la regadera |

  # First step in the row 3
  # Also on a pending calendar recurring task (on the day of its occurrence).
  Scenario Outline: First step in the row 3
    Given a weekly recurring task on <days> created on <created>
    And the first step of the task is <first_step>
    When I query Pendientes on <now>
    Then the task row shows the first step <text>

    Examples:
      | days   | created             | first_step          | now                 | text                             |
      | martes | 2026-11-09T08:00:00 | Atar la bolsa llena | 2026-11-10T09:00:00 | Primer paso: Atar la bolsa llena |

  # First step in the row 4
  # An overdue one-off task also shows it. Row 1: just became overdue (at
  # 00:00 of the next day); row 2: days later.
  Scenario Outline: First step in the row 4
    Given a one-off task with due date <due_date>
    And the first step of the task is <first_step>
    When I query Pendientes on <now>
    Then the task row shows the first step <text>

    Examples:
      | due_date   | first_step             | now                 | text                                |
      | 2026-11-12 | Separar la ropa blanca | 2026-11-13T00:00:00 | Primer paso: Separar la ropa blanca |
      | 2026-11-10 | Separar la ropa blanca | 2026-11-13T10:00:00 | Primer paso: Separar la ropa blanca |

  # First step in the row 5
  # An overdue relative recurring task too.
  Scenario Outline: First step in the row 5
    Given a relative recurring task every <every> <unit>
    And the task was completed on <completed>
    And the first step of the task is <first_step>
    When I query Pendientes on <now>
    Then the task row shows the first step <text>

    Examples:
      | every | unit   | completed           | first_step         | now                 | text                            |
      | 2    | dias   | 2026-11-10T09:00:00 | Llenar la regadera | 2026-11-14T09:00:00 | Primer paso: Llenar la regadera |

  # First step in the row 6
  # An overdue task with the checkbox disabled until its window opens
  # (§5.5) shows it.
  Scenario Outline: First step in the row 6
    Given a one-off task with due date <due_date> created on <created>
    And the task can be completed from <from> to <to>
    And the first step of the task is <first_step>
    When I query Pendientes on <now>
    Then the task checkbox is disabled
    And the task row shows the first step <text>

    Examples:
      | due_date   | created             | from  | to    | first_step             | now                 | text                                |
      | 2026-11-10 | 2026-11-01T09:00:00 | 08:00 | 11:00 | Separar la ropa blanca | 2026-11-13T07:00:00 | Primer paso: Separar la ropa blanca |

  # First step in the row 7
  # A task without the field has no first step: the row looks as it does today.
  Scenario Outline: First step in the row 7
    Given a relative recurring task every <every> <unit>
    When I query Pendientes on <now>
    Then the task row shows no first step

    Examples:
      | every | unit   | now                 |
      | 2    | dias   | 2026-11-13T10:00:00 |

  # First step in the row 8
  # A waiting (completed) relative recurring task does not show it.
  Scenario Outline: First step in the row 8
    Given Mostrar completadas is on
    And a relative recurring task every <every> <unit>
    And the task was completed on <completed>
    And the first step of the task is <first_step>
    When I query Pendientes on <now>
    Then the task row shows no first step

    Examples:
      | every | unit   | completed           | first_step         | now                 |
      | 2    | dias   | 2026-11-13T08:00:00 | Llenar la regadera | 2026-11-13T10:00:00 |

  # First step in the row 9
  # A waiting calendar recurring task (before its occurrence) does not
  # show it.
  Scenario Outline: First step in the row 9
    Given a weekly recurring task on <days> created on <created>
    And the first step of the task is <first_step>
    When I query Pendientes on <now>
    Then the task row shows no first step

    Examples:
      | days   | created             | first_step          | now                 |
      | martes | 2026-11-09T08:00:00 | Atar la bolsa llena | 2026-11-09T12:00:00 |

  # First step in the row 10
  # A one-off task waiting because of its schedule (outside the window) does not show it.
  Scenario Outline: First step in the row 10
    Given a one-off task without a due date created on <created>
    And the task can be completed from <from> to <to>
    And the first step of the task is <first_step>
    When I query Pendientes on <now>
    Then the task row shows no first step

    Examples:
      | created             | from  | to    | first_step             | now                 |
      | 2026-11-13T06:00:00 | 08:00 | 11:00 | Separar la ropa blanca | 2026-11-13T07:00:00 |

  # First step in the row 11
  # Inside the window, the same task is pending and does show it.
  Scenario Outline: First step in the row 11
    Given a one-off task without a due date created on <created>
    And the task can be completed from <from> to <to>
    And the first step of the task is <first_step>
    When I query Pendientes on <now>
    Then the task row shows the first step <text>

    Examples:
      | created             | from  | to    | first_step             | now                 | text                                |
      | 2026-11-13T06:00:00 | 08:00 | 11:00 | Separar la ropa blanca | 2026-11-13T08:00:00 | Primer paso: Separar la ropa blanca |

  # First step in the row 12
  # A postponed task (waiting) does not show it, whether it is pending (row 1) or
  # overdue (row 2) without the postponement.
  Scenario Outline: First step in the row 12
    Given a one-off task with due date <due_date>
    And the first step of the task is <first_step>
    And the task was postponed with option <option> on <postponed>
    When I query Pendientes on <now>
    Then the task row shows no first step

    Examples:
      | due_date   | first_step             | option  | postponed           | now                 |
      | 2026-11-20 | Separar la ropa blanca | 3 horas | 2026-11-13T10:00:00 | 2026-11-13T11:30:00 |
      | 2026-11-10 | Separar la ropa blanca | 3 horas | 2026-11-13T10:00:00 | 2026-11-13T11:30:00 |

  # First step in the row 13
  # A paused task (with Mostrar pausadas) does not show it, even though without the pause it would be
  # overdue.
  Scenario Outline: First step in the row 13
    Given Mostrar pausadas is on
    And a relative recurring task every <every> <unit>
    And the task was completed on <completed>
    And the first step of the task is <first_step>
    And the task was paused
    When I query Pendientes on <now>
    Then the task row shows no first step

    Examples:
      | every | unit   | completed           | first_step         | now                 |
      | 2    | dias   | 2026-11-10T09:00:00 | Llenar la regadera | 2026-11-14T09:00:00 |

  # First step in the row 14
  # On completing a recurring task (with Mostrar completadas) the line disappears.
  Scenario Outline: First step in the row 14
    Given Mostrar completadas is on
    And a relative recurring task never completed
    And the first step of the task is <first_step>
    When I tap the task checkbox on <tap>
    And I query Pendientes on <now>
    Then the task row shows no first step

    Examples:
      | first_step             | tap                 | now                 |
      | Separar la ropa blanca | 2026-11-13T10:00:00 | 2026-11-13T10:00:00 |

  # First step in the row 15
  # When the postponement ends it comes back on its own: pending (row 1) or overdue
  # (row 2).
  Scenario Outline: First step in the row 15
    Given a one-off task with due date <due_date>
    And the first step of the task is <first_step>
    And the task was postponed with option <option> on <postponed>
    When I query Pendientes on <now>
    Then the task row shows the first step <text>

    Examples:
      | due_date   | first_step             | option  | postponed           | now                 | text                                |
      | 2026-11-20 | Separar la ropa blanca | 3 horas | 2026-11-13T10:00:00 | 2026-11-13T13:00:00 | Primer paso: Separar la ropa blanca |
      | 2026-11-10 | Separar la ropa blanca | 3 horas | 2026-11-13T10:00:00 | 2026-11-13T13:00:00 | Primer paso: Separar la ropa blanca |

  # First step in the row 16
  # A recurring task that comes back (its interval elapses) shows the same first
  # step. Row 1: at the moment it comes back (pending); row 2: already overdue.
  Scenario Outline: First step in the row 16
    Given a relative recurring task every <every> <unit>
    And the task was completed on <completed>
    And the first step of the task is <first_step>
    When I query Pendientes on <now>
    Then the task row shows the first step <text>

    Examples:
      | every | unit   | completed           | first_step         | now                 | text                            |
      | 2    | dias   | 2026-11-10T09:00:00 | Llenar la regadera | 2026-11-12T09:00:00 | Primer paso: Llenar la regadera |
      | 2    | dias   | 2026-11-10T09:00:00 | Llenar la regadera | 2026-11-14T09:00:00 | Primer paso: Llenar la regadera |

  # First step in the row 17
  # On resuming it, it comes back on its own: the resumed relative task is pending.
  Scenario Outline: First step in the row 17
    Given a relative recurring task every <every> <unit>
    And the task was completed on <completed>
    And the first step of the task is <first_step>
    And the task was paused
    When I resume the task on <resumed>
    And I query Pendientes on <now>
    Then the task row shows the first step <text>

    Examples:
      | every | unit   | completed           | first_step         | resumed             | now                 | text                            |
      | 2    | dias   | 2026-11-12T09:00:00 | Llenar la regadera | 2026-11-13T10:00:00 | 2026-11-13T10:00:00 | Primer paso: Llenar la regadera |

  # First step in the row 18
  # On undoing the completion it comes back on its own: the one-off task goes back to pending.
  Scenario Outline: First step in the row 18
    Given a one-off task with due date <due_date>
    And the first step of the task is <first_step>
    And the task was completed on <completed>
    When I delete the completion from <completed>
    And I query Pendientes on <now>
    Then the task row shows the first step <text>

    Examples:
      | due_date   | first_step             | completed           | now                 | text                                |
      | 2026-11-20 | Separar la ropa blanca | 2026-11-13T08:00:00 | 2026-11-13T10:00:00 | Primer paso: Separar la ropa blanca |
