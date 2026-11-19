# mutation-stamp: sha256=e5a4d6838488908d40db269727014edff2616a940a7846296752a57e12e4a9bd
# acceptance-mutation-manifest-begin
# {"version":1,"tested_at":"2026-11-17T21:11:46.985320649Z","feature_name":"Versión mínima y cambios sin guardar","feature_path":"features/version-minima-cambios-sin-guardar.feature","background_hash":"74234e98afe7498fb5daf1f36ac2d78acc339464f950703b8c019892f982b90b","implementation_hash":"sha256:b7ce897ed07a0bfc1898704758829898f08fae3f4a585e213818bffabe9127d0","scenarios":[{"index":0,"name":"Versión mínima y cambios sin guardar 1","scenario_hash":"8612b081bbd9f896338a1531e0fb9f0842d7c07922c4bc5c7de8060dc0ccd408","mutation_count":6,"result":{"Total":6,"Killed":6,"Survived":0,"Errors":0},"tested_at":"2026-11-17T21:11:46.985320649Z"},{"index":1,"name":"Versión mínima y cambios sin guardar 2","scenario_hash":"6cd8c85930398856f083a64e6e349b19bcf110cde1e683af7b2c51bc49087898","mutation_count":6,"result":{"Total":6,"Killed":6,"Survived":0,"Errors":0},"tested_at":"2026-11-17T21:11:46.985320649Z"},{"index":2,"name":"Versión mínima y cambios sin guardar 3","scenario_hash":"ceab9856e329dbbff2227284c8947cdf15807ca06e9606078791b4df968a7c7f","mutation_count":6,"result":{"Total":6,"Killed":6,"Survived":0,"Errors":0},"tested_at":"2026-11-17T21:11:46.985320649Z"},{"index":3,"name":"Versión mínima y cambios sin guardar 4","scenario_hash":"bd18986d994c9b823864bf423ed17d29ed489b4f38e8ccdf740ca778cd840495","mutation_count":2,"result":{"Total":2,"Killed":2,"Survived":0,"Errors":0},"tested_at":"2026-11-17T21:11:46.985320649Z"},{"index":4,"name":"Versión mínima y cambios sin guardar 5","scenario_hash":"2e78768788c3566de6c8cb2083f6712ced87e392ee7f5a5dcad492676c9d9511","mutation_count":2,"result":{"Total":2,"Killed":2,"Survived":0,"Errors":0},"tested_at":"2026-11-17T21:11:46.985320649Z"},{"index":5,"name":"Versión mínima y cambios sin guardar 6","scenario_hash":"0074e84c66c506a0ee881eee7bb8dc146590026ab2834d112936f7825c975d08","mutation_count":2,"result":{"Total":2,"Killed":2,"Survived":0,"Errors":0},"tested_at":"2026-11-17T21:11:46.985320649Z"},{"index":6,"name":"Versión mínima y cambios sin guardar 7","scenario_hash":"6e06ebe74f65fd8cd9aac62b4e54f5022a38aaf4d0ebb59c6766ab65efda7644","mutation_count":2,"result":{"Total":2,"Killed":2,"Survived":0,"Errors":0},"tested_at":"2026-11-17T21:11:46.985320649Z"},{"index":7,"name":"Versión mínima y cambios sin guardar 8","scenario_hash":"23e3bd6760342b86116a809979a8bca853891f12d391bfb418006114f1b3522a","mutation_count":2,"result":{"Total":2,"Killed":2,"Survived":0,"Errors":0},"tested_at":"2026-11-17T21:11:46.985320649Z"},{"index":8,"name":"Versión mínima y cambios sin guardar 9","scenario_hash":"68f65fcbd9101756907cb3d7e81eae3bdd10b8053ddc013c764e6c41225a60ab","mutation_count":2,"result":{"Total":2,"Killed":2,"Survived":0,"Errors":0},"tested_at":"2026-11-17T21:11:46.985320649Z"}]}
# acceptance-mutation-manifest-end

# Spec §6.2 (Versión mínima, Cambios sin guardar), con §4.1. El campo
# «Versión mínima» cuenta para Cambios sin guardar con la definición única de
# «hay cambios»: escribir y volver al valor original no cuenta, ni los
# espacios que Guardar recorta; vaciar una versión mínima existente sí. Al
# crear, el campo arranca vacío. El lugar del campo en el panel (debajo de los
# pasos y antes de la nota), la etiqueta, la falta de texto de ejemplo y Enter
# que guarda los cubre solo la suite QA.
# "abro el panel para editar la tarea T con versión mínima V" abre el panel con
# ese valor ya guardado; "queda abierto X" afirma qué quedó abierto después de
# tocar la X del panel.
Feature: Minimal version and unsaved changes

  # Versión mínima y cambios sin guardar 1
  # Al editar, el campo Versión mínima con otro valor es un cambio; con el
  # mismo valor, no.
  Scenario Outline: Minimal version and unsaved changes 1
    Given I open the panel to edit the task <title> with minimal version <minimal>
    When I type <value> in the field <field>
    And I tap the X of the panel
    Then what stays open is <open>

    Examples:
      | title  | minimal         | field          | value           | open                            |
      | Lavar  | Solo el inodoro | Versión mínima | Solo el lavabo  | el panel con el aviso de cierre |
      | Lavar  | Solo el inodoro | Versión mínima | Solo el inodoro | nada                            |

  # Versión mínima y cambios sin guardar 2
  # Escribir y volver al valor original no cuenta como cambio; volver a otro
  # valor sí.
  Scenario Outline: Minimal version and unsaved changes 2
    Given I open the panel to edit the task <title> with minimal version <minimal>
    When I type <first> in the field <field>
    And I type <second> in the field <field>
    And I tap the X of the panel
    Then what stays open is <open>

    Examples:
      | title  | minimal         | field          | first          | second          | open                            |
      | Lavar  | Solo el inodoro | Versión mínima | Solo el lavabo | Solo el inodoro | nada                            |
      | Lavar  | Solo el inodoro | Versión mínima | Solo el lavabo | Solo la ducha   | el panel con el aviso de cierre |

  # Versión mínima y cambios sin guardar 3
  # Los espacios que Guardar recorta no cuentan: el mismo valor con espacios
  # alrededor no es un cambio (fila 1); otro valor sí (fila 2).
  Scenario Outline: Minimal version and unsaved changes 3
    Given I open the panel to edit the task <title> with minimal version <minimal>
    When I type <value> with spaces around it in the field <field>
    And I tap the X of the panel
    Then what stays open is <open>

    Examples:
      | title  | minimal         | field          | value           | open                            |
      | Lavar  | Solo el inodoro | Versión mínima | Solo el inodoro | nada                            |
      | Lavar  | Solo el inodoro | Versión mínima | Solo el lavabo  | el panel con el aviso de cierre |

  # Versión mínima y cambios sin guardar 4
  # Vaciar una versión mínima existente cuenta como cambio.
  Scenario Outline: Minimal version and unsaved changes 4
    Given I open the panel to edit the task <title> with minimal version <minimal>
    When I clear the field <field>
    And I tap the X of the panel
    Then what stays open is <open>

    Examples:
      | title  | minimal         | field          | open                            |
      | Lavar  | Solo el inodoro | Versión mínima | el panel con el aviso de cierre |

  # Versión mínima y cambios sin guardar 5
  # Solo espacios en una versión mínima existente es vaciarla: cuenta como
  # cambio.
  Scenario Outline: Minimal version and unsaved changes 5
    Given I open the panel to edit the task <title> with minimal version <minimal>
    When I type only spaces in the field <field>
    And I tap the X of the panel
    Then what stays open is <open>

    Examples:
      | title  | minimal         | field          | open                            |
      | Lavar  | Solo el inodoro | Versión mínima | el panel con el aviso de cierre |

  # Versión mínima y cambios sin guardar 6
  # En una tarea sin versión mínima, escribir una es un cambio.
  Scenario Outline: Minimal version and unsaved changes 6
    Given I open the panel to edit the task <title> with note <note>
    When I type <value> in the field <field>
    And I tap the X of the panel
    Then what stays open is <open>

    Examples:
      | title  | note | field          | value           | open                            |
      | Lavar  | Luz  | Versión mínima | Solo el inodoro | el panel con el aviso de cierre |

  # Versión mínima y cambios sin guardar 7
  # Sin versión mínima, solo espacios no cuenta.
  Scenario Outline: Minimal version and unsaved changes 7
    Given I open the panel to edit the task <title> with note <note>
    When I type only spaces in the field <field>
    And I tap the X of the panel
    Then what stays open is <open>

    Examples:
      | title  | note | field          | open    |
      | Lavar  | Luz  | Versión mínima | nada    |

  # Versión mínima y cambios sin guardar 8
  # Al crear, el campo arranca vacío: escribir algo es cargar algo.
  Scenario Outline: Minimal version and unsaved changes 8
    Given I open the panel to create a task
    When I type <value> in the field <field>
    And I tap the X of the panel
    Then what stays open is <open>

    Examples:
      | field          | value           | open                            |
      | Versión mínima | Solo el inodoro | el panel con el aviso de cierre |

  # Versión mínima y cambios sin guardar 9
  # Al crear, solo espacios cierra directo.
  Scenario Outline: Minimal version and unsaved changes 9
    Given I open the panel to create a task
    When I type only spaces in the field <field>
    And I tap the X of the panel
    Then what stays open is <open>

    Examples:
      | field          | open    |
      | Versión mínima | nada    |
