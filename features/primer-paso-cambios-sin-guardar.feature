# mutation-stamp: sha256=b85ff0435e4e4efa6995ad28f5c207429d4cf3c75b6676a4b2b4c39e216cf119
# acceptance-mutation-manifest-begin
# {"version":1,"tested_at":"2026-11-13T21:44:58.878210109Z","feature_name":"Primer paso y cambios sin guardar","feature_path":"features/primer-paso-cambios-sin-guardar.feature","background_hash":"74234e98afe7498fb5daf1f36ac2d78acc339464f950703b8c019892f982b90b","implementation_hash":"sha256:3ad39a0759fffedbe43aa7f9dd2df01153337cce243d4ab5ad61a37424e62997","scenarios":[{"index":0,"name":"Primer paso y cambios sin guardar 1","scenario_hash":"a7710df439f36ec0b9eea4f475fb0b5ee6071bf662c7fb5be4b510a67aa09285","mutation_count":6,"result":{"Total":6,"Killed":6,"Survived":0,"Errors":0},"tested_at":"2026-11-13T21:44:58.878210109Z"},{"index":1,"name":"Primer paso y cambios sin guardar 2","scenario_hash":"7544c0708128b8a1d8a932a65cbb93b58178ebdf47e24586cd9032e9bafe6e78","mutation_count":6,"result":{"Total":6,"Killed":6,"Survived":0,"Errors":0},"tested_at":"2026-11-13T21:44:58.878210109Z"},{"index":2,"name":"Primer paso y cambios sin guardar 3","scenario_hash":"4386f6871755314e620d40f0c94f2672139a487b801eff801f3abb33a8897c40","mutation_count":6,"result":{"Total":6,"Killed":6,"Survived":0,"Errors":0},"tested_at":"2026-11-13T21:44:58.878210109Z"},{"index":3,"name":"Primer paso y cambios sin guardar 4","scenario_hash":"011fc682029d97eec86b1dea43868396c9c81b0bf35922fe5852760e55079b36","mutation_count":2,"result":{"Total":2,"Killed":2,"Survived":0,"Errors":0},"tested_at":"2026-11-13T21:44:58.878210109Z"},{"index":4,"name":"Primer paso y cambios sin guardar 5","scenario_hash":"90ced181dc95bfa7695bd99a28b96d9847d48d328aacc85b6b76fa05d2171e57","mutation_count":2,"result":{"Total":2,"Killed":2,"Survived":0,"Errors":0},"tested_at":"2026-11-13T21:44:58.878210109Z"},{"index":5,"name":"Primer paso y cambios sin guardar 6","scenario_hash":"9677586ac9abc2922b8b319ca52e7054f9e68fc12840e7fb70d6c992769de95c","mutation_count":2,"result":{"Total":2,"Killed":2,"Survived":0,"Errors":0},"tested_at":"2026-11-13T21:44:58.878210109Z"},{"index":6,"name":"Primer paso y cambios sin guardar 7","scenario_hash":"12f8e6abe8ef5884bcc1941b1036b8602a724b92ad3631e3f2fe103b9b170014","mutation_count":2,"result":{"Total":2,"Killed":2,"Survived":0,"Errors":0},"tested_at":"2026-11-13T21:44:58.878210109Z"},{"index":7,"name":"Primer paso y cambios sin guardar 8","scenario_hash":"279ec701ac3c4189e7293063f71866f17a0c7078611461a04a419988b47c22cb","mutation_count":2,"result":{"Total":2,"Killed":2,"Survived":0,"Errors":0},"tested_at":"2026-11-13T21:44:58.878210109Z"},{"index":8,"name":"Primer paso y cambios sin guardar 9","scenario_hash":"e66dca7eb08f63dbc80d7751f0b51160bb6a14773550ac63ebae89a92bc6273e","mutation_count":2,"result":{"Total":2,"Killed":2,"Survived":0,"Errors":0},"tested_at":"2026-11-13T21:44:58.878210109Z"}]}
# acceptance-mutation-manifest-end

Feature: Primer paso y cambios sin guardar

  # Primer paso y cambios sin guardar 1
  # Al editar, el campo Primer paso con otro valor es un cambio; con el mismo
  # valor, no.
  Scenario Outline: Primer paso y cambios sin guardar 1
    Given abro el panel para editar la tarea <titulo> con primer paso <primer_paso>
    When escribo <valor> en el campo <campo>
    And toco la X del panel
    Then queda abierto <abierto>

    Examples:
      | titulo | primer_paso            | campo       | valor                  | abierto                         |
      | Lavar  | Separar la ropa blanca | Primer paso | Juntar las llaves      | el panel con el aviso de cierre |
      | Lavar  | Separar la ropa blanca | Primer paso | Separar la ropa blanca | nada                            |

  # Primer paso y cambios sin guardar 2
  # Escribir y volver al valor original no cuenta como cambio; volver a otro
  # valor sí.
  Scenario Outline: Primer paso y cambios sin guardar 2
    Given abro el panel para editar la tarea <titulo> con primer paso <primer_paso>
    When escribo <primero> en el campo <campo>
    And escribo <segundo> en el campo <campo>
    And toco la X del panel
    Then queda abierto <abierto>

    Examples:
      | titulo | primer_paso            | campo       | primero           | segundo                | abierto                         |
      | Lavar  | Separar la ropa blanca | Primer paso | Juntar las llaves | Separar la ropa blanca | nada                            |
      | Lavar  | Separar la ropa blanca | Primer paso | Juntar las llaves | Buscar el detergente   | el panel con el aviso de cierre |

  # Primer paso y cambios sin guardar 3
  # Los espacios que Guardar recorta no cuentan: el mismo valor con espacios
  # alrededor no es un cambio (fila 1); otro valor sí (fila 2).
  Scenario Outline: Primer paso y cambios sin guardar 3
    Given abro el panel para editar la tarea <titulo> con primer paso <primer_paso>
    When escribo <valor> con espacios alrededor en el campo <campo>
    And toco la X del panel
    Then queda abierto <abierto>

    Examples:
      | titulo | primer_paso            | campo       | valor                  | abierto                         |
      | Lavar  | Separar la ropa blanca | Primer paso | Separar la ropa blanca | nada                            |
      | Lavar  | Separar la ropa blanca | Primer paso | Juntar las llaves      | el panel con el aviso de cierre |

  # Primer paso y cambios sin guardar 4
  # Vaciar un primer paso existente cuenta como cambio.
  Scenario Outline: Primer paso y cambios sin guardar 4
    Given abro el panel para editar la tarea <titulo> con primer paso <primer_paso>
    When vacío el campo <campo>
    And toco la X del panel
    Then queda abierto <abierto>

    Examples:
      | titulo | primer_paso            | campo       | abierto                         |
      | Lavar  | Separar la ropa blanca | Primer paso | el panel con el aviso de cierre |

  # Primer paso y cambios sin guardar 5
  # Solo espacios en un primer paso existente es vaciarlo: cuenta como cambio.
  Scenario Outline: Primer paso y cambios sin guardar 5
    Given abro el panel para editar la tarea <titulo> con primer paso <primer_paso>
    When escribo solo espacios en el campo <campo>
    And toco la X del panel
    Then queda abierto <abierto>

    Examples:
      | titulo | primer_paso            | campo       | abierto                         |
      | Lavar  | Separar la ropa blanca | Primer paso | el panel con el aviso de cierre |

  # Primer paso y cambios sin guardar 6
  # En una tarea sin primer paso, escribir uno es un cambio.
  Scenario Outline: Primer paso y cambios sin guardar 6
    Given abro el panel para editar la tarea <titulo> con nota <nota>
    When escribo <valor> en el campo <campo>
    And toco la X del panel
    Then queda abierto <abierto>

    Examples:
      | titulo | nota | campo       | valor                  | abierto                         |
      | Lavar  | Luz  | Primer paso | Separar la ropa blanca | el panel con el aviso de cierre |

  # Primer paso y cambios sin guardar 7
  # Sin primer paso, solo espacios no cuenta.
  Scenario Outline: Primer paso y cambios sin guardar 7
    Given abro el panel para editar la tarea <titulo> con nota <nota>
    When escribo solo espacios en el campo <campo>
    And toco la X del panel
    Then queda abierto <abierto>

    Examples:
      | titulo | nota | campo       | abierto |
      | Lavar  | Luz  | Primer paso | nada    |

  # Primer paso y cambios sin guardar 8
  # Al crear, el campo arranca vacío: escribir algo es cargar algo.
  Scenario Outline: Primer paso y cambios sin guardar 8
    Given abro el panel para crear una tarea
    When escribo <valor> en el campo <campo>
    And toco la X del panel
    Then queda abierto <abierto>

    Examples:
      | campo       | valor                  | abierto                         |
      | Primer paso | Separar la ropa blanca | el panel con el aviso de cierre |

  # Primer paso y cambios sin guardar 9
  # Al crear, solo espacios cierra directo.
  Scenario Outline: Primer paso y cambios sin guardar 9
    Given abro el panel para crear una tarea
    When escribo solo espacios en el campo <campo>
    And toco la X del panel
    Then queda abierto <abierto>

    Examples:
      | campo       | abierto |
      | Primer paso | nada    |
