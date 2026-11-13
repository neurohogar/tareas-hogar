# Spec §6.2 (Cambios sin guardar con los pasos). Los pasos más van como
# campos «Paso 2», «Paso 3»… debajo del primer paso. Agregar, quitar o cambiar
# un paso cuenta; escribir y volver al valor original no cuenta, ni los
# espacios que Guardar recorta ni un paso vacío que Guardar descarta.
Feature: Pasos y cambios sin guardar

  # Pasos y cambios sin guardar 1
  # Cambiar un paso es un cambio; escribir el mismo valor, no.
  Scenario Outline: Pasos y cambios sin guardar 1
    Given abro el panel para editar la tarea <titulo> con los pasos <pasos>
    When escribo <valor> en el campo <campo>
    And toco la X del panel
    Then queda abierto <abierto>

    Examples:
      | titulo | pasos                                       | campo  | valor               | abierto                         |
      | Lavar  | Separar la ropa blanca, Poner el lavarropas | Paso 2 | Juntar las llaves   | el panel con el aviso de cierre |
      | Lavar  | Separar la ropa blanca, Poner el lavarropas | Paso 2 | Poner el lavarropas | nada                            |

  # Pasos y cambios sin guardar 2
  # Escribir y volver al valor original no cuenta; volver a otro valor sí.
  Scenario Outline: Pasos y cambios sin guardar 2
    Given abro el panel para editar la tarea <titulo> con los pasos <pasos>
    When escribo <primero> en el campo <campo>
    And escribo <segundo> en el campo <campo>
    And toco la X del panel
    Then queda abierto <abierto>

    Examples:
      | titulo | pasos                                       | campo  | primero           | segundo              | abierto                         |
      | Lavar  | Separar la ropa blanca, Poner el lavarropas | Paso 2 | Juntar las llaves | Poner el lavarropas  | nada                            |
      | Lavar  | Separar la ropa blanca, Poner el lavarropas | Paso 2 | Juntar las llaves | Buscar el detergente | el panel con el aviso de cierre |

  # Pasos y cambios sin guardar 3
  # Los espacios que Guardar recorta no cuentan: el mismo valor con espacios
  # alrededor no es un cambio (fila 1); otro valor sí (fila 2).
  Scenario Outline: Pasos y cambios sin guardar 3
    Given abro el panel para editar la tarea <titulo> con los pasos <pasos>
    When escribo <valor> con espacios alrededor en el campo <campo>
    And toco la X del panel
    Then queda abierto <abierto>

    Examples:
      | titulo | pasos                                       | campo  | valor               | abierto                         |
      | Lavar  | Separar la ropa blanca, Poner el lavarropas | Paso 2 | Poner el lavarropas | nada                            |
      | Lavar  | Separar la ropa blanca, Poner el lavarropas | Paso 2 | Juntar las llaves   | el panel con el aviso de cierre |

  # Pasos y cambios sin guardar 4
  # Vaciar un paso existente cuenta como cambio.
  Scenario Outline: Pasos y cambios sin guardar 4
    Given abro el panel para editar la tarea <titulo> con los pasos <pasos>
    When vacío el campo <campo>
    And toco la X del panel
    Then queda abierto <abierto>

    Examples:
      | titulo | pasos                                       | campo  | abierto                         |
      | Lavar  | Separar la ropa blanca, Poner el lavarropas | Paso 2 | el panel con el aviso de cierre |

  # Pasos y cambios sin guardar 5
  # Solo espacios en un paso existente es vaciarlo: cuenta como cambio.
  Scenario Outline: Pasos y cambios sin guardar 5
    Given abro el panel para editar la tarea <titulo> con los pasos <pasos>
    When escribo solo espacios en el campo <campo>
    And toco la X del panel
    Then queda abierto <abierto>

    Examples:
      | titulo | pasos                                       | campo  | abierto                         |
      | Lavar  | Separar la ropa blanca, Poner el lavarropas | Paso 2 | el panel con el aviso de cierre |

  # Pasos y cambios sin guardar 6
  # Agregar un paso y no escribirlo no cuenta: Guardar descarta el vacío.
  Scenario Outline: Pasos y cambios sin guardar 6
    Given abro el panel para editar la tarea <titulo> con los pasos <pasos>
    When toco Agregar paso
    And toco la X del panel
    Then queda abierto <abierto>

    Examples:
      | titulo | pasos                                       | abierto |
      | Lavar  | Separar la ropa blanca, Poner el lavarropas | nada    |

  # Pasos y cambios sin guardar 7
  # Agregar un paso y escribirlo sí cuenta.
  Scenario Outline: Pasos y cambios sin guardar 7
    Given abro el panel para editar la tarea <titulo> con los pasos <pasos>
    When toco Agregar paso
    And escribo <valor> en el campo <campo>
    And toco la X del panel
    Then queda abierto <abierto>

    Examples:
      | titulo | pasos                                       | campo  | valor          | abierto                         |
      | Lavar  | Separar la ropa blanca, Poner el lavarropas | Paso 3 | Tender la ropa | el panel con el aviso de cierre |

  # Pasos y cambios sin guardar 8
  # Agregar un paso y escribir solo espacios no cuenta.
  Scenario Outline: Pasos y cambios sin guardar 8
    Given abro el panel para editar la tarea <titulo> con los pasos <pasos>
    When toco Agregar paso
    And escribo solo espacios en el campo <campo>
    And toco la X del panel
    Then queda abierto <abierto>

    Examples:
      | titulo | pasos                                       | campo  | abierto |
      | Lavar  | Separar la ropa blanca, Poner el lavarropas | Paso 3 | nada    |

  # Pasos y cambios sin guardar 9
  # Quitar un paso existente cuenta como cambio.
  Scenario Outline: Pasos y cambios sin guardar 9
    Given abro el panel para editar la tarea <titulo> con los pasos <pasos>
    When toco Quitar en el campo <campo>
    And toco la X del panel
    Then queda abierto <abierto>

    Examples:
      | titulo | pasos                                       | campo  | abierto                         |
      | Lavar  | Separar la ropa blanca, Poner el lavarropas | Paso 2 | el panel con el aviso de cierre |

  # Pasos y cambios sin guardar 10
  # Agregar un paso y quitarlo de nuevo vuelve a lo original: no cuenta.
  Scenario Outline: Pasos y cambios sin guardar 10
    Given abro el panel para editar la tarea <titulo> con los pasos <pasos>
    When toco Agregar paso
    And toco Quitar en el campo <campo>
    And toco la X del panel
    Then queda abierto <abierto>

    Examples:
      | titulo | pasos                                       | campo  | abierto |
      | Lavar  | Separar la ropa blanca, Poner el lavarropas | Paso 3 | nada    |

  # Pasos y cambios sin guardar 11
  # Al crear, agregar un paso y escribirlo es cargar algo.
  Scenario Outline: Pasos y cambios sin guardar 11
    Given abro el panel para crear una tarea
    When toco Agregar paso
    And escribo <valor> en el campo <campo>
    And toco la X del panel
    Then queda abierto <abierto>

    Examples:
      | campo  | valor               | abierto                         |
      | Paso 2 | Poner el lavarropas | el panel con el aviso de cierre |

  # Pasos y cambios sin guardar 12
  # Al crear, agregar un paso y no escribirlo cierra directo.
  Scenario Outline: Pasos y cambios sin guardar 12
    Given abro el panel para crear una tarea
    When toco Agregar paso
    And toco la X del panel
    Then queda abierto <abierto>

    Examples:
      | abierto |
      | nada    |
