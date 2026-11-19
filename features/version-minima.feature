# mutation-stamp: sha256=fa338e63f980088def2ab2c5a67f9675049113570c3efea1b1bb319eaed6301a
# acceptance-mutation-manifest-begin
# {"version":1,"tested_at":"2026-11-17T21:11:32.283289946Z","feature_name":"Versión mínima","feature_path":"features/version-minima.feature","background_hash":"74234e98afe7498fb5daf1f36ac2d78acc339464f950703b8c019892f982b90b","implementation_hash":"sha256:bf1b621c171b5e733b7fd966ef0d058dba0aeb72c48db3881958642cc80b52a8","scenarios":[{"index":0,"name":"Versión mínima 1","scenario_hash":"47cd8f5e343c4f88a648c8fca64ee43eaec653e0788670c0dee972ed385b1d7b","mutation_count":4,"result":{"Total":4,"Killed":4,"Survived":0,"Errors":0},"tested_at":"2026-11-17T21:11:32.283289946Z"},{"index":1,"name":"Versión mínima 2","scenario_hash":"43a6ccb7916759330135f9a58934606acf34259580014b2758c5f6632d598ae4","mutation_count":4,"result":{"Total":4,"Killed":4,"Survived":0,"Errors":0},"tested_at":"2026-11-17T21:11:32.283289946Z"},{"index":2,"name":"Versión mínima 3","scenario_hash":"21f98d29d5af0681c640d23fcf3e50a4215481c37415c2ec3e1bc67643e64150","mutation_count":5,"result":{"Total":5,"Killed":5,"Survived":0,"Errors":0},"tested_at":"2026-11-17T21:11:32.283289946Z"},{"index":3,"name":"Versión mínima 5","scenario_hash":"25ed4db0acca97dbd641d183508c3158c5f85fb025aef611c89984bbc1993a9e","mutation_count":4,"result":{"Total":4,"Killed":4,"Survived":0,"Errors":0},"tested_at":"2026-11-17T21:11:32.283289946Z"},{"index":6,"name":"Versión mínima 8","scenario_hash":"a58aa15a95684f3a3813db3d0ff0f490036cee0275da4a7e3e924424e2a715aa","mutation_count":2,"result":{"Total":2,"Killed":2,"Survived":0,"Errors":0},"tested_at":"2026-11-17T21:11:32.283289946Z"},{"index":7,"name":"Versión mínima 9","scenario_hash":"bb04ee6a4a40a0027f983cd83aa84489731e06f3a8ff89cc14fb54c7350dc613","mutation_count":2,"result":{"Total":2,"Killed":2,"Survived":0,"Errors":0},"tested_at":"2026-11-17T21:11:32.283289946Z"},{"index":8,"name":"Versión mínima 10","scenario_hash":"9b1e8a6c342f824de9e1c964a7eef81581e41ee0e628d358efef4eea24d34601","mutation_count":4,"result":{"Total":4,"Killed":4,"Survived":0,"Errors":0},"tested_at":"2026-11-17T21:11:32.283289946Z"},{"index":9,"name":"Versión mínima 11","scenario_hash":"c9a50bf2acd8aca7cdae780b049a82c9b6be3ab8a7d1d4d8288468db85e19e06","mutation_count":8,"result":{"Total":8,"Killed":8,"Survived":0,"Errors":0},"tested_at":"2026-11-17T21:11:32.283289946Z"},{"index":10,"name":"Versión mínima 12","scenario_hash":"2fcb5a088e6ae21889b176bfa52f229da3cc955b374ba9e6a2cff5afd43dbf9a","mutation_count":8,"result":{"Total":8,"Killed":8,"Survived":0,"Errors":0},"tested_at":"2026-11-17T21:11:32.283289946Z"},{"index":11,"name":"Versión mínima 13","scenario_hash":"c0c2406930d86c70933c70fd151a0b2d28e18b6d538adffb55cd208470ee7766","mutation_count":3,"result":{"Total":3,"Killed":3,"Survived":0,"Errors":0},"tested_at":"2026-11-17T21:11:32.283289946Z"},{"index":12,"name":"Versión mínima 14","scenario_hash":"9f68a447d2c4c7dbe96da4e0ac253eb94f42133c893bee2585d3c51267b0c4d5","mutation_count":4,"result":{"Total":4,"Killed":4,"Survived":0,"Errors":0},"tested_at":"2026-11-17T21:11:32.283289946Z"},{"index":13,"name":"Versión mínima 15","scenario_hash":"96d8cfdc65ce2edf6acb350ae184d3d23fccd24557fa4f408ba34fd4ed51b7e4","mutation_count":4,"result":{"Total":4,"Killed":4,"Survived":0,"Errors":0},"tested_at":"2026-11-17T21:11:32.283289946Z"},{"index":14,"name":"Versión mínima 16","scenario_hash":"bc2f8c2a02249ed2dee1f11aace9b045cf2be181c56a515d2f412f5fb2240080","mutation_count":4,"result":{"Total":4,"Killed":4,"Survived":0,"Errors":0},"tested_at":"2026-11-17T21:11:32.283289946Z"},{"index":15,"name":"Versión mínima 17","scenario_hash":"56042d2b910a0148353c21e93d5919a8576ae8ab5aa86be6f23569048c9e1190","mutation_count":4,"result":{"Total":4,"Killed":4,"Survived":0,"Errors":0},"tested_at":"2026-11-17T21:11:32.283289946Z"},{"index":16,"name":"Versión mínima 18","scenario_hash":"0d39c9ff39cadb146aced59b3312b4bb6fe0356b40d7fe573fa0d9eb46836f0e","mutation_count":2,"result":{"Total":2,"Killed":2,"Survived":0,"Errors":0},"tested_at":"2026-11-17T21:11:32.283289946Z"},{"index":18,"name":"Versión mínima 20","scenario_hash":"ff07aa1087db7286285c8fbbea7b9284c4402ba64af9b0ada01108747279bf88","mutation_count":2,"result":{"Total":2,"Killed":2,"Survived":0,"Errors":0},"tested_at":"2026-11-17T21:11:32.283289946Z"}]}
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
