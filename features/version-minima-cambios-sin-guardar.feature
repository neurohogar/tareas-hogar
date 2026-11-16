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
Feature: Versión mínima y cambios sin guardar

  # Versión mínima y cambios sin guardar 1
  # Al editar, el campo Versión mínima con otro valor es un cambio; con el
  # mismo valor, no.
  Scenario Outline: Versión mínima y cambios sin guardar 1
    Given abro el panel para editar la tarea <titulo> con versión mínima <minima>
    When escribo <valor> en el campo <campo>
    And toco la X del panel
    Then queda abierto <abierto>

    Examples:
      | titulo | minima          | campo          | valor           | abierto                         |
      | Lavar  | Solo el inodoro | Versión mínima | Solo el lavabo  | el panel con el aviso de cierre |
      | Lavar  | Solo el inodoro | Versión mínima | Solo el inodoro | nada                            |

  # Versión mínima y cambios sin guardar 2
  # Escribir y volver al valor original no cuenta como cambio; volver a otro
  # valor sí.
  Scenario Outline: Versión mínima y cambios sin guardar 2
    Given abro el panel para editar la tarea <titulo> con versión mínima <minima>
    When escribo <primero> en el campo <campo>
    And escribo <segundo> en el campo <campo>
    And toco la X del panel
    Then queda abierto <abierto>

    Examples:
      | titulo | minima          | campo          | primero        | segundo         | abierto                         |
      | Lavar  | Solo el inodoro | Versión mínima | Solo el lavabo | Solo el inodoro | nada                            |
      | Lavar  | Solo el inodoro | Versión mínima | Solo el lavabo | Solo la ducha   | el panel con el aviso de cierre |

  # Versión mínima y cambios sin guardar 3
  # Los espacios que Guardar recorta no cuentan: el mismo valor con espacios
  # alrededor no es un cambio (fila 1); otro valor sí (fila 2).
  Scenario Outline: Versión mínima y cambios sin guardar 3
    Given abro el panel para editar la tarea <titulo> con versión mínima <minima>
    When escribo <valor> con espacios alrededor en el campo <campo>
    And toco la X del panel
    Then queda abierto <abierto>

    Examples:
      | titulo | minima          | campo          | valor           | abierto                         |
      | Lavar  | Solo el inodoro | Versión mínima | Solo el inodoro | nada                            |
      | Lavar  | Solo el inodoro | Versión mínima | Solo el lavabo  | el panel con el aviso de cierre |

  # Versión mínima y cambios sin guardar 4
  # Vaciar una versión mínima existente cuenta como cambio.
  Scenario Outline: Versión mínima y cambios sin guardar 4
    Given abro el panel para editar la tarea <titulo> con versión mínima <minima>
    When vacío el campo <campo>
    And toco la X del panel
    Then queda abierto <abierto>

    Examples:
      | titulo | minima          | campo          | abierto                         |
      | Lavar  | Solo el inodoro | Versión mínima | el panel con el aviso de cierre |

  # Versión mínima y cambios sin guardar 5
  # Solo espacios en una versión mínima existente es vaciarla: cuenta como
  # cambio.
  Scenario Outline: Versión mínima y cambios sin guardar 5
    Given abro el panel para editar la tarea <titulo> con versión mínima <minima>
    When escribo solo espacios en el campo <campo>
    And toco la X del panel
    Then queda abierto <abierto>

    Examples:
      | titulo | minima          | campo          | abierto                         |
      | Lavar  | Solo el inodoro | Versión mínima | el panel con el aviso de cierre |

  # Versión mínima y cambios sin guardar 6
  # En una tarea sin versión mínima, escribir una es un cambio.
  Scenario Outline: Versión mínima y cambios sin guardar 6
    Given abro el panel para editar la tarea <titulo> con nota <nota>
    When escribo <valor> en el campo <campo>
    And toco la X del panel
    Then queda abierto <abierto>

    Examples:
      | titulo | nota | campo          | valor           | abierto                         |
      | Lavar  | Luz  | Versión mínima | Solo el inodoro | el panel con el aviso de cierre |

  # Versión mínima y cambios sin guardar 7
  # Sin versión mínima, solo espacios no cuenta.
  Scenario Outline: Versión mínima y cambios sin guardar 7
    Given abro el panel para editar la tarea <titulo> con nota <nota>
    When escribo solo espacios en el campo <campo>
    And toco la X del panel
    Then queda abierto <abierto>

    Examples:
      | titulo | nota | campo          | abierto |
      | Lavar  | Luz  | Versión mínima | nada    |

  # Versión mínima y cambios sin guardar 8
  # Al crear, el campo arranca vacío: escribir algo es cargar algo.
  Scenario Outline: Versión mínima y cambios sin guardar 8
    Given abro el panel para crear una tarea
    When escribo <valor> en el campo <campo>
    And toco la X del panel
    Then queda abierto <abierto>

    Examples:
      | campo          | valor           | abierto                         |
      | Versión mínima | Solo el inodoro | el panel con el aviso de cierre |

  # Versión mínima y cambios sin guardar 9
  # Al crear, solo espacios cierra directo.
  Scenario Outline: Versión mínima y cambios sin guardar 9
    Given abro el panel para crear una tarea
    When escribo solo espacios en el campo <campo>
    And toco la X del panel
    Then queda abierto <abierto>

    Examples:
      | campo          | abierto |
      | Versión mínima | nada    |
