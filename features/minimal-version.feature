# mutation-stamp: sha256=4a4c86830b18b1c39c27351d57163cd1c5839fd0bdcdff6bda687b4e6f9de72e
# acceptance-mutation-manifest-begin
# {"version":1,"tested_at":"2026-11-19T13:05:04.774458705Z","feature_name":"Minimal version","feature_path":"features/minimal-version.feature","background_hash":"74234e98afe7498fb5daf1f36ac2d78acc339464f950703b8c019892f982b90b","implementation_hash":"sha256:8d7f7c82a9ab07d95b20049cc87a5f48c2e12ea5d2927692c01c4afd8f29df17","scenarios":[{"index":0,"name":"Minimal version 1","scenario_hash":"2890159f22e300fd74703331ad9c14d763b34f23b82dee2774d1089a3bc4472e","mutation_count":4,"result":{"Total":4,"Killed":4,"Survived":0,"Errors":0},"tested_at":"2026-11-19T13:05:04.774458705Z"},{"index":1,"name":"Minimal version 2","scenario_hash":"a9570b41b6fcf6e1a35db00464fd9a6d48204890d3882167e11b0cb3a7c97f69","mutation_count":4,"result":{"Total":4,"Killed":4,"Survived":0,"Errors":0},"tested_at":"2026-11-19T13:05:04.774458705Z"},{"index":2,"name":"Minimal version 3","scenario_hash":"b7f2ac122c5d6849926f2d7a378b1418b30922fc8f7c2634442297ccb62aa02f","mutation_count":5,"result":{"Total":5,"Killed":5,"Survived":0,"Errors":0},"tested_at":"2026-11-19T13:05:04.774458705Z"},{"index":3,"name":"Minimal version 5","scenario_hash":"454b01edfa33871fa0f452cbc6e7d97b093b762738889136b9aef0426be468b1","mutation_count":4,"result":{"Total":4,"Killed":4,"Survived":0,"Errors":0},"tested_at":"2026-11-19T13:05:04.774458705Z"},{"index":6,"name":"Minimal version 8","scenario_hash":"2554814509adaf3e66da0cd2a2ea354106c02c6ddcbc44ad74e2d990a1d8473e","mutation_count":2,"result":{"Total":2,"Killed":2,"Survived":0,"Errors":0},"tested_at":"2026-11-19T13:05:04.774458705Z"},{"index":7,"name":"Minimal version 9","scenario_hash":"d9252a32af6caf05986a56c51c98e7f760e0771eeba3014c57dc28df2fdbe661","mutation_count":2,"result":{"Total":2,"Killed":2,"Survived":0,"Errors":0},"tested_at":"2026-11-19T13:05:04.774458705Z"},{"index":8,"name":"Minimal version 10","scenario_hash":"64940da5107f984c564aaa9738e2171160a240ce70aba2822a82d41c6e70557b","mutation_count":4,"result":{"Total":4,"Killed":4,"Survived":0,"Errors":0},"tested_at":"2026-11-19T13:05:04.774458705Z"},{"index":9,"name":"Minimal version 11","scenario_hash":"75ee1502cb658915338293ef6725cfea60d633cc139fbc9ac7bf8c435566553a","mutation_count":8,"result":{"Total":8,"Killed":8,"Survived":0,"Errors":0},"tested_at":"2026-11-19T13:05:04.774458705Z"},{"index":10,"name":"Minimal version 12","scenario_hash":"d4b741e5bbb2e07d2259ad989d4ccc0e93408d25091b998b9fa3599929e2cf48","mutation_count":8,"result":{"Total":8,"Killed":8,"Survived":0,"Errors":0},"tested_at":"2026-11-19T13:05:04.774458705Z"},{"index":11,"name":"Minimal version 13","scenario_hash":"4a5dcfc43a4139352ce42724d7fb3780cb17820a4a3845d8b723f0a9b5acff45","mutation_count":3,"result":{"Total":3,"Killed":3,"Survived":0,"Errors":0},"tested_at":"2026-11-19T13:05:04.774458705Z"},{"index":12,"name":"Minimal version 14","scenario_hash":"e1da0e969707fdad918d6254644fa4363817fc1f705dcb47fd947d7528dd70f1","mutation_count":4,"result":{"Total":4,"Killed":4,"Survived":0,"Errors":0},"tested_at":"2026-11-19T13:05:04.774458705Z"},{"index":13,"name":"Minimal version 15","scenario_hash":"71265824fc79a1a4f4be798da770ebec510627935dfad3b4688de572cba65e5c","mutation_count":4,"result":{"Total":4,"Killed":4,"Survived":0,"Errors":0},"tested_at":"2026-11-19T13:05:04.774458705Z"},{"index":14,"name":"Minimal version 16","scenario_hash":"7cdd5925cecd491b256ab48517e6bee2a111d14ac421c2f2af813b45d63dcc89","mutation_count":4,"result":{"Total":4,"Killed":4,"Survived":0,"Errors":0},"tested_at":"2026-11-19T13:05:04.774458705Z"},{"index":15,"name":"Minimal version 17","scenario_hash":"3be8bc9c93a9baca644bc742411bbb1b2ac46d92917c804993232e16347187c7","mutation_count":4,"result":{"Total":4,"Killed":4,"Survived":0,"Errors":0},"tested_at":"2026-11-19T13:05:04.774458705Z"},{"index":16,"name":"Minimal version 18","scenario_hash":"f85a8a42b72780f8431d9d4538df7df25665c2771ed6f2c07537dc4ad04f4729","mutation_count":2,"result":{"Total":2,"Killed":2,"Survived":0,"Errors":0},"tested_at":"2026-11-19T13:05:04.774458705Z"},{"index":18,"name":"Minimal version 20","scenario_hash":"406b829e3895ba6e7b52eb3fcda1d11e92490ecd092bbb08d7e063537d371704","mutation_count":2,"result":{"Total":2,"Killed":2,"Survived":0,"Errors":0},"tested_at":"2026-11-19T13:05:04.774458705Z"}]}
# acceptance-mutation-manifest-end

# Spec §4.1 (Versión mínima), with §6.2 and §7. An optional field `versionMinima`
# with a small version of the task («Solo el inodoro»), for any kind
# of task. A single line, with no maximum length; on saving,
# leading and trailing spaces are trimmed; empty or only spaces means
# no minimal version (the field is not saved). It is never invalid: it does not reject
# creation or editing. A task saved without the field has no minimal
# version. It does not change the status, the order or the name of the task. It is an
# independent field: the last change wins, per field (§7).
# "The minimal version of the task is X" leaves the task already saved with that value,
# without going through "edit".
Feature: Minimal version

  # Minimal version 1
  # A one-off can be created with a minimal version (§4.1).
  Scenario Outline: Minimal version 1
    When I create a one-off task with title <title> and minimal version <minimal>
    Then a one-off task is created with title <title_stored>
    And the task has minimal version <minimal_stored>

    Examples:
      | title        | minimal         | title_stored | minimal_stored  |
      | Limpiar baño | Solo el inodoro | Limpiar baño | Solo el inodoro |

  # Minimal version 2
  # A relative recurring task too.
  Scenario Outline: Minimal version 2
    When I create a relative recurring task with title <title> every 2 days and minimal version <minimal>
    Then a recurring task is created with title <title_stored>
    And the task has minimal version <minimal_stored>

    Examples:
      | title  | minimal           | title_stored  | minimal_stored    |
      | Regar  | Solo los helechos | Regar         | Solo los helechos |

  # Minimal version 3
  # A calendar recurring task too.
  Scenario Outline: Minimal version 3
    When I create a weekly recurring task with title <title> on <days> and minimal version <minimal>
    Then a recurring task is created with title <title_stored>
    And the task has minimal version <minimal_stored>

    Examples:
      | title  | days           | minimal              | title_stored | minimal_stored       |
      | Basura | martes, jueves | Solo la de la cocina | Basura      | Solo la de la cocina |

  # Minimal version 5
  # On saving, leading and trailing spaces are trimmed.
  Scenario Outline: Minimal version 5
    Given a one-off task without a due date
    When I edit the minimal version to <minimal> with spaces at the start and end
    Then the task has minimal version <minimal_stored>

    Examples:
      | minimal         | minimal_stored  |
      | Solo el inodoro | Solo el inodoro |
      | Solo el lavabo  | Solo el lavabo  |

  # Minimal version 6
  # Clearing the field leaves the task without a minimal version (the field is not saved).
  Scenario Outline: Minimal version 6
    Given a one-off task without a due date
    And the minimal version of the task is <minimal>
    When I remove the minimal version
    Then the task has no minimal version

    Examples:
      | minimal         |
      | Solo el inodoro |

  # Minimal version 7
  # Only spaces also leaves the task without a minimal version, and the edit is not
  # rejected.
  Scenario Outline: Minimal version 7
    Given a one-off task without a due date
    And the minimal version of the task is <minimal>
    When I edit the minimal version to one of only spaces
    Then the task has no minimal version

    Examples:
      | minimal         |
      | Solo el inodoro |

  # Minimal version 8
  # Creating with a minimal version of only spaces is not rejected: the task is
  # created without a minimal version.
  Scenario Outline: Minimal version 8
    When I create a one-off task with title <title> and a minimal version of only spaces
    Then a one-off task is created with title <title_stored>
    And the task has no minimal version

    Examples:
      | title  | title_stored    |
      | Lavar  | Lavar           |

  # Minimal version 9
  # The minimal version has no maximum length.
  Scenario Outline: Minimal version 9
    Given a one-off task without a due date
    When I edit the minimal version to one of <length> characters
    Then the task has a minimal version of <length_stored> characters

    Examples:
      | length | length_stored  |
      | 5000  | 5000           |

  # Minimal version 10
  # Completing the whole task does not delete or change the minimal version.
  Scenario Outline: Minimal version 10
    Given a relative recurring task every <every> <unit>
    And the minimal version of the task is <minimal>
    When I tap the task checkbox on <tap>
    Then the task has minimal version <minimal_stored>

    Examples:
      | every | unit   | minimal           | tap                 | minimal_stored    |
      | 2    | dias   | Solo los helechos | 2026-11-13T08:00:00 | Solo los helechos |

  # Minimal version 11
  # The minimal version does not change the status: a one-off with a due date is still
  # pending on the due day (row 1) and overdue after (row 2).
  Scenario Outline: Minimal version 11
    Given a one-off task with due date <due_date>
    And the minimal version of the task is <minimal>
    When I query the status on <now>
    Then the status is <status>

    Examples:
      | due_date   | minimal         | now                 | status    |
      | 2026-11-12 | Solo el inodoro | 2026-11-12T23:59:59 | pendiente |
      | 2026-11-12 | Solo el inodoro | 2026-11-13T00:00:00 | atrasada  |

  # Minimal version 12
  # It does not change the order of the list: it follows the previous one, by title among
  # equally urgent tasks, whether or not the one that goes first
  # (row 1) or second (row 2) has a minimal version.
  Scenario Outline: Minimal version 12
    Given a one-off task <first> without a due date
    And a one-off task <second> without a due date
    And the minimal version of the task <with_minimal> is <minimal>
    When I query Pendientes on <now>
    Then Pendientes shows in order <order>

    Examples:
      | first   | second  | with_minimal | minimal         | now                 | order         |
      | Barrer  | Lavar   | Barrer     | Solo el inodoro | 2026-11-13T10:00:00 | Barrer, Lavar |
      | Barrer  | Lavar   | Lavar      | Solo el inodoro | 2026-11-13T10:00:00 | Barrer, Lavar |

  # Minimal version 13
  # The name of the task is still emoji and title.
  Scenario Outline: Minimal version 13
    Given a one-off task <title> without a due date with emoji <emoji>
    When I edit the minimal version to <minimal>
    Then the task name is <name>

    Examples:
      | title  | emoji | minimal         | name    |
      | Lavar  | 🧺     | Solo el inodoro | 🧺 Lavar |

  # Minimal version 14
  # Minimal version and title are different fields: both changes are combined.
  Scenario Outline: Minimal version 14
    Given a one-off task without a due date
    When I edit the title to <title_new>
    And another device, without seeing that change, edits the minimal version to <minimal>
    Then the task has title <title_stored>
    And the task has minimal version <minimal_stored>

    Examples:
      | title_new    | minimal         | title_stored    | minimal_stored  |
      | Lavar a mano | Solo el inodoro | Lavar a mano    | Solo el inodoro |

  # Minimal version 15
  # Minimal version and note are different fields: both changes are combined.
  Scenario Outline: Minimal version 15
    Given a one-off task without a due date
    When I edit the minimal version to <minimal>
    And another device, without seeing that change, edits the note to <note>
    Then the task has minimal version <minimal_stored>
    And the task has note <note_stored>

    Examples:
      | minimal         | note         | minimal_stored  | note_stored   |
      | Solo el inodoro | Usar guantes | Solo el inodoro | Usar guantes  |

  # Minimal version 16
  # Minimal version and first step are different fields: both
  # changes are combined.
  Scenario Outline: Minimal version 16
    Given a one-off task without a due date
    When I edit the minimal version to <minimal>
    And another device, without seeing that change, edits the first step to <first_step>
    Then the task has minimal version <minimal_stored>
    And the task has first step <first_step_stored>

    Examples:
      | minimal         | first_step             | minimal_stored  | first_step_stored      |
      | Solo el inodoro | Separar la ropa blanca | Solo el inodoro | Separar la ropa blanca |

  # Minimal version 17
  # The same field: the last change to arrive wins and the note is not touched.
  Scenario Outline: Minimal version 17
    Given a one-off task without a due date with note <note>
    When I edit the minimal version to <minimal> with spaces at the start and end
    And another device, without seeing that change, edits the minimal version to <second>
    Then the task has minimal version <minimal_stored>
    And the task has note <note_stored>

    Examples:
      | note         | minimal         | second         | minimal_stored  | note_stored   |
      | Usar guantes | Solo el inodoro | Solo el lavabo | Solo el lavabo  | Usar guantes  |

  # Minimal version 18
  # Removing it on one device and writing it on the other: the last to
  # arrive wins (the written one).
  Scenario Outline: Minimal version 18
    Given a one-off task without a due date
    And the minimal version of the task is <minimal>
    When I remove the minimal version
    And another device, without seeing that change, edits the minimal version to <second>
    Then the task has minimal version <minimal_stored>

    Examples:
      | minimal         | second         | minimal_stored  |
      | Solo el inodoro | Solo el lavabo | Solo el lavabo  |

  # Minimal version 19
  # Changing it on one device and removing it on the other, which sees a previous minimal
  # version: the last to arrive wins (the removed one).
  Scenario Outline: Minimal version 19
    Given a one-off task without a due date
    And the minimal version of the task is <other_minimal>
    When I edit the minimal version to <minimal>
    And another device, without seeing that change, removes the minimal version
    Then the task has no minimal version

    Examples:
      | other_minimal  | minimal         |
      | Solo el lavabo | Solo el inodoro |

  # Minimal version 20
  # An edit writes only if something changed: another device that saves without
  # changes does not overwrite the minimal version that was just written.
  Scenario Outline: Minimal version 20
    Given a one-off task without a due date
    When I edit the minimal version to <minimal>
    And another device, without seeing that change, saves the task without changes
    Then the task has minimal version <minimal_stored>

    Examples:
      | minimal         | minimal_stored  |
      | Solo el inodoro | Solo el inodoro |
