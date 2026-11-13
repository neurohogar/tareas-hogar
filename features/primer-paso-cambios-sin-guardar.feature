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
