# mutation-stamp: sha256=fa338e63f980088def2ab2c5a67f9675049113570c3efea1b1bb319eaed6301a
# acceptance-mutation-manifest-begin
# {"version":1,"tested_at":"2026-11-17T21:11:32.283289946Z","feature_name":"Versión mínima","feature_path":"features/version-minima.feature","background_hash":"74234e98afe7498fb5daf1f36ac2d78acc339464f950703b8c019892f982b90b","implementation_hash":"sha256:bf1b621c171b5e733b7fd966ef0d058dba0aeb72c48db3881958642cc80b52a8","scenarios":[{"index":0,"name":"Versión mínima 1","scenario_hash":"47cd8f5e343c4f88a648c8fca64ee43eaec653e0788670c0dee972ed385b1d7b","mutation_count":4,"result":{"Total":4,"Killed":4,"Survived":0,"Errors":0},"tested_at":"2026-11-17T21:11:32.283289946Z"},{"index":1,"name":"Versión mínima 2","scenario_hash":"43a6ccb7916759330135f9a58934606acf34259580014b2758c5f6632d598ae4","mutation_count":4,"result":{"Total":4,"Killed":4,"Survived":0,"Errors":0},"tested_at":"2026-11-17T21:11:32.283289946Z"},{"index":2,"name":"Versión mínima 3","scenario_hash":"21f98d29d5af0681c640d23fcf3e50a4215481c37415c2ec3e1bc67643e64150","mutation_count":5,"result":{"Total":5,"Killed":5,"Survived":0,"Errors":0},"tested_at":"2026-11-17T21:11:32.283289946Z"},{"index":3,"name":"Versión mínima 5","scenario_hash":"25ed4db0acca97dbd641d183508c3158c5f85fb025aef611c89984bbc1993a9e","mutation_count":4,"result":{"Total":4,"Killed":4,"Survived":0,"Errors":0},"tested_at":"2026-11-17T21:11:32.283289946Z"},{"index":6,"name":"Versión mínima 8","scenario_hash":"a58aa15a95684f3a3813db3d0ff0f490036cee0275da4a7e3e924424e2a715aa","mutation_count":2,"result":{"Total":2,"Killed":2,"Survived":0,"Errors":0},"tested_at":"2026-11-17T21:11:32.283289946Z"},{"index":7,"name":"Versión mínima 9","scenario_hash":"bb04ee6a4a40a0027f983cd83aa84489731e06f3a8ff89cc14fb54c7350dc613","mutation_count":2,"result":{"Total":2,"Killed":2,"Survived":0,"Errors":0},"tested_at":"2026-11-17T21:11:32.283289946Z"},{"index":8,"name":"Versión mínima 10","scenario_hash":"9b1e8a6c342f824de9e1c964a7eef81581e41ee0e628d358efef4eea24d34601","mutation_count":4,"result":{"Total":4,"Killed":4,"Survived":0,"Errors":0},"tested_at":"2026-11-17T21:11:32.283289946Z"},{"index":9,"name":"Versión mínima 11","scenario_hash":"c9a50bf2acd8aca7cdae780b049a82c9b6be3ab8a7d1d4d8288468db85e19e06","mutation_count":8,"result":{"Total":8,"Killed":8,"Survived":0,"Errors":0},"tested_at":"2026-11-17T21:11:32.283289946Z"},{"index":10,"name":"Versión mínima 12","scenario_hash":"2fcb5a088e6ae21889b176bfa52f229da3cc955b374ba9e6a2cff5afd43dbf9a","mutation_count":8,"result":{"Total":8,"Killed":8,"Survived":0,"Errors":0},"tested_at":"2026-11-17T21:11:32.283289946Z"},{"index":11,"name":"Versión mínima 13","scenario_hash":"c0c2406930d86c70933c70fd151a0b2d28e18b6d538adffb55cd208470ee7766","mutation_count":3,"result":{"Total":3,"Killed":3,"Survived":0,"Errors":0},"tested_at":"2026-11-17T21:11:32.283289946Z"},{"index":12,"name":"Versión mínima 14","scenario_hash":"9f68a447d2c4c7dbe96da4e0ac253eb94f42133c893bee2585d3c51267b0c4d5","mutation_count":4,"result":{"Total":4,"Killed":4,"Survived":0,"Errors":0},"tested_at":"2026-11-17T21:11:32.283289946Z"},{"index":13,"name":"Versión mínima 15","scenario_hash":"96d8cfdc65ce2edf6acb350ae184d3d23fccd24557fa4f408ba34fd4ed51b7e4","mutation_count":4,"result":{"Total":4,"Killed":4,"Survived":0,"Errors":0},"tested_at":"2026-11-17T21:11:32.283289946Z"},{"index":14,"name":"Versión mínima 16","scenario_hash":"bc2f8c2a02249ed2dee1f11aace9b045cf2be181c56a515d2f412f5fb2240080","mutation_count":4,"result":{"Total":4,"Killed":4,"Survived":0,"Errors":0},"tested_at":"2026-11-17T21:11:32.283289946Z"},{"index":15,"name":"Versión mínima 17","scenario_hash":"56042d2b910a0148353c21e93d5919a8576ae8ab5aa86be6f23569048c9e1190","mutation_count":4,"result":{"Total":4,"Killed":4,"Survived":0,"Errors":0},"tested_at":"2026-11-17T21:11:32.283289946Z"},{"index":16,"name":"Versión mínima 18","scenario_hash":"0d39c9ff39cadb146aced59b3312b4bb6fe0356b40d7fe573fa0d9eb46836f0e","mutation_count":2,"result":{"Total":2,"Killed":2,"Survived":0,"Errors":0},"tested_at":"2026-11-17T21:11:32.283289946Z"},{"index":18,"name":"Versión mínima 20","scenario_hash":"ff07aa1087db7286285c8fbbea7b9284c4402ba64af9b0ada01108747279bf88","mutation_count":2,"result":{"Total":2,"Killed":2,"Survived":0,"Errors":0},"tested_at":"2026-11-17T21:11:32.283289946Z"}]}
# acceptance-mutation-manifest-end

# Spec §4.1 (Versión mínima), con §6.2 y §7. Un campo opcional `versionMinima`
# con una versión chica de la tarea («Solo el inodoro»), para cualquier tipo
# de tarea. Una sola línea, sin largo máximo; al guardar
# se recortan los espacios del inicio y del final; vacío o solo espacios es
# sin versión mínima (el campo no se guarda). Nunca es inválida: no rechaza la
# creación ni la edición. Una tarea guardada sin el campo no tiene versión
# mínima. No cambia el estado, el orden ni el nombre de la tarea. Es un campo
# independiente: gana el último cambio, por campo (§7).
# "La versión mínima de la tarea es X" deja la tarea ya guardada con ese valor,
# sin pasar por "editar".
Feature: Minimal version

  # Versión mínima 1
  # Una puntual puede crearse con versión mínima (§4.1).
  Scenario Outline: Minimal version 1
    When I create a one-off task with title <title> and minimal version <minimal>
    Then a one-off task is created with title <title_stored>
    And the task has minimal version <minimal_stored>

    Examples:
      | title        | minimal         | title_stored | minimal_stored  |
      | Limpiar baño | Solo el inodoro | Limpiar baño | Solo el inodoro |

  # Versión mínima 2
  # Una periódica relativa también.
  Scenario Outline: Minimal version 2
    When I create a relative recurring task with title <title> every 2 days and minimal version <minimal>
    Then a recurring task is created with title <title_stored>
    And the task has minimal version <minimal_stored>

    Examples:
      | title  | minimal           | title_stored  | minimal_stored    |
      | Regar  | Solo los helechos | Regar         | Solo los helechos |

  # Versión mínima 3
  # Una periódica de calendario también.
  Scenario Outline: Minimal version 3
    When I create a weekly recurring task with title <title> on <days> and minimal version <minimal>
    Then a recurring task is created with title <title_stored>
    And the task has minimal version <minimal_stored>

    Examples:
      | title  | days           | minimal              | title_stored | minimal_stored       |
      | Basura | martes, jueves | Solo la de la cocina | Basura      | Solo la de la cocina |

  # Versión mínima 5
  # Al guardar se recortan los espacios del inicio y del final.
  Scenario Outline: Minimal version 5
    Given a one-off task without a due date
    When I edit the minimal version to <minimal> with spaces at the start and end
    Then the task has minimal version <minimal_stored>

    Examples:
      | minimal         | minimal_stored  |
      | Solo el inodoro | Solo el inodoro |
      | Solo el lavabo  | Solo el lavabo  |

  # Versión mínima 6
  # Vaciar el campo deja la tarea sin versión mínima (el campo no se guarda).
  Scenario Outline: Minimal version 6
    Given a one-off task without a due date
    And the minimal version of the task is <minimal>
    When I remove the minimal version
    Then the task has no minimal version

    Examples:
      | minimal         |
      | Solo el inodoro |

  # Versión mínima 7
  # Solo espacios también deja la tarea sin versión mínima, y la edición no se
  # rechaza.
  Scenario Outline: Minimal version 7
    Given a one-off task without a due date
    And the minimal version of the task is <minimal>
    When I edit the minimal version to one of only spaces
    Then the task has no minimal version

    Examples:
      | minimal         |
      | Solo el inodoro |

  # Versión mínima 8
  # Crear con una versión mínima de solo espacios no se rechaza: la tarea se
  # crea sin versión mínima.
  Scenario Outline: Minimal version 8
    When I create a one-off task with title <title> and a minimal version of only spaces
    Then a one-off task is created with title <title_stored>
    And the task has no minimal version

    Examples:
      | title  | title_stored    |
      | Lavar  | Lavar           |

  # Versión mínima 9
  # La versión mínima no tiene largo máximo.
  Scenario Outline: Minimal version 9
    Given a one-off task without a due date
    When I edit the minimal version to one of <length> characters
    Then the task has a minimal version of <length_stored> characters

    Examples:
      | length | length_stored  |
      | 5000  | 5000           |

  # Versión mínima 10
  # Completar la tarea entera no borra ni cambia la versión mínima.
  Scenario Outline: Minimal version 10
    Given a relative recurring task every <every> <unit>
    And the minimal version of the task is <minimal>
    When I tap the task checkbox on <tap>
    Then the task has minimal version <minimal_stored>

    Examples:
      | every | unit   | minimal           | tap                 | minimal_stored    |
      | 2    | dias   | Solo los helechos | 2026-11-13T08:00:00 | Solo los helechos |

  # Versión mínima 11
  # La versión mínima no cambia el estado: una puntual con fecha límite sigue
  # pendiente el día límite (fila 1) y atrasada después (fila 2).
  Scenario Outline: Minimal version 11
    Given a one-off task with due date <due_date>
    And the minimal version of the task is <minimal>
    When I query the status on <now>
    Then the status is <status>

    Examples:
      | due_date   | minimal         | now                 | status    |
      | 2026-11-12 | Solo el inodoro | 2026-11-12T23:59:59 | pendiente |
      | 2026-11-12 | Solo el inodoro | 2026-11-13T00:00:00 | atrasada  |

  # Versión mínima 12
  # No cambia el orden de la lista: sigue el de antes, por título entre
  # tareas igual de urgentes, tenga o no versión mínima la que va primero
  # (fila 1) o la que va segunda (fila 2).
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

  # Versión mínima 13
  # El nombre de la tarea sigue siendo emoji y título.
  Scenario Outline: Minimal version 13
    Given a one-off task <title> without a due date with emoji <emoji>
    When I edit the minimal version to <minimal>
    Then the task name is <name>

    Examples:
      | title  | emoji | minimal         | name    |
      | Lavar  | 🧺     | Solo el inodoro | 🧺 Lavar |

  # Versión mínima 14
  # Versión mínima y título son campos distintos: se combinan los dos cambios.
  Scenario Outline: Minimal version 14
    Given a one-off task without a due date
    When I edit the title to <title_new>
    And another device, without seeing that change, edits the minimal version to <minimal>
    Then the task has title <title_stored>
    And the task has minimal version <minimal_stored>

    Examples:
      | title_new    | minimal         | title_stored    | minimal_stored  |
      | Lavar a mano | Solo el inodoro | Lavar a mano    | Solo el inodoro |

  # Versión mínima 15
  # Versión mínima y nota son campos distintos: se combinan los dos cambios.
  Scenario Outline: Minimal version 15
    Given a one-off task without a due date
    When I edit the minimal version to <minimal>
    And another device, without seeing that change, edits the note to <note>
    Then the task has minimal version <minimal_stored>
    And the task has note <note_stored>

    Examples:
      | minimal         | note         | minimal_stored  | note_stored   |
      | Solo el inodoro | Usar guantes | Solo el inodoro | Usar guantes  |

  # Versión mínima 16
  # Versión mínima y primer paso son campos distintos: se combinan los dos
  # cambios.
  Scenario Outline: Minimal version 16
    Given a one-off task without a due date
    When I edit the minimal version to <minimal>
    And another device, without seeing that change, edits the first step to <first_step>
    Then the task has minimal version <minimal_stored>
    And the task has first step <first_step_stored>

    Examples:
      | minimal         | first_step             | minimal_stored  | first_step_stored      |
      | Solo el inodoro | Separar la ropa blanca | Solo el inodoro | Separar la ropa blanca |

  # Versión mínima 17
  # El mismo campo: gana el último cambio en llegar y la nota no se toca.
  Scenario Outline: Minimal version 17
    Given a one-off task without a due date with note <note>
    When I edit the minimal version to <minimal> with spaces at the start and end
    And another device, without seeing that change, edits the minimal version to <second>
    Then the task has minimal version <minimal_stored>
    And the task has note <note_stored>

    Examples:
      | note         | minimal         | second         | minimal_stored  | note_stored   |
      | Usar guantes | Solo el inodoro | Solo el lavabo | Solo el lavabo  | Usar guantes  |

  # Versión mínima 18
  # Quitarla en un dispositivo y escribirla en el otro: gana el último en
  # llegar (la escrita).
  Scenario Outline: Minimal version 18
    Given a one-off task without a due date
    And the minimal version of the task is <minimal>
    When I remove the minimal version
    And another device, without seeing that change, edits the minimal version to <second>
    Then the task has minimal version <minimal_stored>

    Examples:
      | minimal         | second         | minimal_stored  |
      | Solo el inodoro | Solo el lavabo | Solo el lavabo  |

  # Versión mínima 19
  # Cambiarla en un dispositivo y quitarla en el otro, que ve una versión
  # mínima previa: gana el último en llegar (la quitada).
  Scenario Outline: Minimal version 19
    Given a one-off task without a due date
    And the minimal version of the task is <other_minimal>
    When I edit the minimal version to <minimal>
    And another device, without seeing that change, removes the minimal version
    Then the task has no minimal version

    Examples:
      | other_minimal  | minimal         |
      | Solo el lavabo | Solo el inodoro |

  # Versión mínima 20
  # Una edición escribe solo si cambió: otro dispositivo que guarda sin
  # cambios no pisa la versión mínima que acaba de escribirse.
  Scenario Outline: Minimal version 20
    Given a one-off task without a due date
    When I edit the minimal version to <minimal>
    And another device, without seeing that change, saves the task without changes
    Then the task has minimal version <minimal_stored>

    Examples:
      | minimal         | minimal_stored  |
      | Solo el inodoro | Solo el inodoro |
