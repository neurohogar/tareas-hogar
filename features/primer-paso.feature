Feature: Primer paso

  # Primer paso 1
  # Una puntual puede crearse con primer paso (§4.1).
  Scenario Outline: Primer paso 1
    When creo una tarea puntual con título <titulo> y primer paso <primer_paso>
    Then se crea una tarea puntual con título <titulo_guardado>
    And la tarea tiene primer paso <primer_paso_guardado>

    Examples:
      | titulo | primer_paso            | titulo_guardado | primer_paso_guardado   |
      | Lavar  | Separar la ropa blanca | Lavar           | Separar la ropa blanca |

  # Primer paso 2
  # Una periódica relativa también.
  Scenario Outline: Primer paso 2
    When creo una tarea periódica relativa con título <titulo> cada <cada> <unidad> y primer paso <primer_paso>
    Then se crea una tarea periódica con título <titulo_guardado>
    And la tarea tiene primer paso <primer_paso_guardado>

    Examples:
      | titulo | cada | unidad | primer_paso        | titulo_guardado | primer_paso_guardado |
      | Regar  | 2    | dias   | Llenar la regadera | Regar           | Llenar la regadera   |

  # Primer paso 3
  # Una periódica de calendario también.
  Scenario Outline: Primer paso 3
    When creo una tarea periódica semanal con título <titulo> los <dias> y primer paso <primer_paso>
    Then se crea una tarea periódica con título <titulo_guardado>
    And la tarea tiene primer paso <primer_paso_guardado>

    Examples:
      | titulo | dias           | primer_paso         | titulo_guardado | primer_paso_guardado |
      | Basura | martes, jueves | Atar la bolsa llena | Basura          | Atar la bolsa llena  |

  # Primer paso 4
  # Con cualquier esfuerzo, también sin estimar.
  Scenario Outline: Primer paso 4
    Given una tarea puntual sin fecha límite con esfuerzo <esfuerzo>
    When edito el primer paso a <primer_paso>
    Then la tarea tiene primer paso <primer_paso_guardado>

    Examples:
      | esfuerzo    | primer_paso            | primer_paso_guardado   |
      | sin estimar | Separar la ropa blanca | Separar la ropa blanca |
      | rapida      | Separar la ropa blanca | Separar la ropa blanca |
      | media       | Separar la ropa blanca | Separar la ropa blanca |
      | larga       | Separar la ropa blanca | Separar la ropa blanca |

  # Primer paso 5
  # Al guardar se recortan los espacios del inicio y del final.
  Scenario Outline: Primer paso 5
    Given una tarea puntual sin fecha límite
    When edito el primer paso a <primer_paso> con espacios al inicio y al final
    Then la tarea tiene primer paso <primer_paso_guardado>

    Examples:
      | primer_paso            | primer_paso_guardado   |
      | Separar la ropa blanca | Separar la ropa blanca |
      | Juntar las llaves      | Juntar las llaves      |

  # Primer paso 6
  # Vaciar el campo deja la tarea sin primer paso (el campo no se guarda).
  Scenario Outline: Primer paso 6
    Given una tarea puntual sin fecha límite
    And el primer paso de la tarea es <primer_paso>
    When quito el primer paso
    Then la tarea no tiene primer paso

    Examples:
      | primer_paso            |
      | Separar la ropa blanca |

  # Primer paso 7
  # Solo espacios también deja la tarea sin primer paso, y la edición no se
  # rechaza.
  Scenario Outline: Primer paso 7
    Given una tarea puntual sin fecha límite
    And el primer paso de la tarea es <primer_paso>
    When edito el primer paso a uno de solo espacios
    Then la tarea no tiene primer paso

    Examples:
      | primer_paso            |
      | Separar la ropa blanca |

  # Primer paso 8
  # Crear con un primer paso de solo espacios no se rechaza: la tarea se crea
  # sin primer paso.
  Scenario Outline: Primer paso 8
    When creo una tarea puntual con título <titulo> y un primer paso de solo espacios
    Then se crea una tarea puntual con título <titulo_guardado>
    And la tarea no tiene primer paso

    Examples:
      | titulo | titulo_guardado |
      | Lavar  | Lavar           |

  # Primer paso 9
  # El primer paso no tiene largo máximo.
  Scenario Outline: Primer paso 9
    Given una tarea puntual sin fecha límite
    When edito el primer paso a uno de <largo> caracteres
    Then la tarea tiene un primer paso de <largo_guardado> caracteres

    Examples:
      | largo | largo_guardado |
      | 5000  | 5000           |

  # Primer paso 10
  # Completar la tarea no borra ni cambia el primer paso.
  Scenario Outline: Primer paso 10
    Given una tarea periódica relativa cada <cada> <unidad>
    And el primer paso de la tarea es <primer_paso>
    When toco el checkbox de la tarea el <toque>
    Then la tarea tiene primer paso <primer_paso_guardado>

    Examples:
      | cada | unidad | primer_paso        | toque               | primer_paso_guardado |
      | 2    | dias   | Llenar la regadera | 2026-11-13T08:00:00 | Llenar la regadera   |

  # Primer paso 11
  # Posponer no lo borra ni lo cambia.
  Scenario Outline: Primer paso 11
    Given una tarea puntual sin fecha límite
    And el primer paso de la tarea es <primer_paso>
    When pospongo la tarea con la opción <opcion> el <ahora>
    Then la tarea tiene primer paso <primer_paso_guardado>

    Examples:
      | primer_paso            | opcion  | ahora               | primer_paso_guardado   |
      | Separar la ropa blanca | 3 horas | 2026-11-13T10:00:00 | Separar la ropa blanca |

  # Primer paso 12
  # Pausar y reanudar no lo borran ni lo cambian.
  Scenario Outline: Primer paso 12
    Given una tarea periódica relativa cada <cada> <unidad>
    And el primer paso de la tarea es <primer_paso>
    When pauso la tarea
    And reanudo la tarea el <reanudada>
    Then la tarea tiene primer paso <primer_paso_guardado>

    Examples:
      | cada | unidad | primer_paso        | reanudada           | primer_paso_guardado |
      | 2    | dias   | Llenar la regadera | 2026-11-13T10:00:00 | Llenar la regadera   |

  # Primer paso 13
  # Deshacer un completado no lo borra ni lo cambia.
  Scenario Outline: Primer paso 13
    Given una tarea periódica relativa cada <cada> <unidad>
    And el primer paso de la tarea es <primer_paso>
    And la tarea fue completada el <completada>
    When borro el completado del <completada>
    Then la tarea tiene primer paso <primer_paso_guardado>

    Examples:
      | cada | unidad | primer_paso        | completada          | primer_paso_guardado |
      | 2    | dias   | Llenar la regadera | 2026-11-13T08:00:00 | Llenar la regadera   |

  # Primer paso 14
  # Cambiar de puntual a periódica no lo borra ni lo cambia.
  Scenario Outline: Primer paso 14
    Given una tarea puntual sin fecha límite
    And el primer paso de la tarea es <primer_paso>
    When edito la tarea a periódica relativa cada <cada> <unidad>
    Then la tarea es periódica
    And la tarea tiene primer paso <primer_paso_guardado>

    Examples:
      | primer_paso            | cada | unidad | primer_paso_guardado   |
      | Separar la ropa blanca | 3    | dias   | Separar la ropa blanca |

  # Primer paso 15
  # Cambiar de periódica a puntual tampoco.
  Scenario Outline: Primer paso 15
    Given una tarea periódica relativa cada <cada> <unidad>
    And el primer paso de la tarea es <primer_paso>
    When edito la tarea a puntual sin fecha límite
    Then la tarea es puntual
    And la tarea tiene primer paso <primer_paso_guardado>

    Examples:
      | cada | unidad | primer_paso        | primer_paso_guardado |
      | 2    | dias   | Llenar la regadera | Llenar la regadera   |

  # Primer paso 16
  # Cambiar de modo (de relativa a de calendario) tampoco.
  Scenario Outline: Primer paso 16
    Given una tarea periódica relativa cada <cada> <unidad>
    And el primer paso de la tarea es <primer_paso>
    When edito la tarea a periódica semanal los <dias>
    Then la tarea tiene primer paso <primer_paso_guardado>

    Examples:
      | cada | unidad | primer_paso        | dias   | primer_paso_guardado |
      | 2    | dias   | Llenar la regadera | martes | Llenar la regadera   |

  # Primer paso 17
  # El primer paso no cambia el estado: una puntual con fecha límite sigue
  # pendiente el día límite (fila 1) y atrasada después (fila 2).
  Scenario Outline: Primer paso 17
    Given una tarea puntual con fecha límite <limite>
    And el primer paso de la tarea es <primer_paso>
    When consulto el estado el <ahora>
    Then el estado es <estado>

    Examples:
      | limite     | primer_paso            | ahora               | estado    |
      | 2026-11-12 | Separar la ropa blanca | 2026-11-12T23:59:59 | pendiente |
      | 2026-11-12 | Separar la ropa blanca | 2026-11-13T00:00:00 | atrasada  |

  # Primer paso 18
  # No cambia el orden de la lista: sigue el de antes, por título entre
  # tareas igual de urgentes, tenga o no primer paso la que va primero (fila
  # 1) o la que va segunda (fila 2).
  Scenario Outline: Primer paso 18
    Given una tarea puntual <primera> sin fecha límite
    And una tarea puntual <segunda> sin fecha límite
    And el primer paso de la tarea <con_primer_paso> es <primer_paso>
    When consulto Pendientes el <ahora>
    Then Pendientes muestra en orden <orden>

    Examples:
      | primera | segunda | con_primer_paso | primer_paso            | ahora               | orden         |
      | Barrer  | Lavar   | Barrer          | Separar la ropa blanca | 2026-11-13T10:00:00 | Barrer, Lavar |
      | Barrer  | Lavar   | Lavar           | Separar la ropa blanca | 2026-11-13T10:00:00 | Barrer, Lavar |

  # Primer paso 19
  # El nombre de la tarea sigue siendo emoji y título.
  Scenario Outline: Primer paso 19
    Given una tarea puntual <titulo> sin fecha límite con emoji <emoji>
    When edito el primer paso a <primer_paso>
    Then el nombre de la tarea es <nombre>

    Examples:
      | titulo | emoji | primer_paso            | nombre  |
      | Lavar  | 🧺     | Separar la ropa blanca | 🧺 Lavar |

  # Primer paso 20
  # Primer paso y título son campos distintos: se combinan los dos cambios.
  Scenario Outline: Primer paso 20
    Given una tarea puntual sin fecha límite
    When edito el título a <titulo_nuevo>
    And otro dispositivo, sin ver ese cambio, edita el primer paso a <primer_paso>
    Then la tarea tiene título <titulo_guardado>
    And la tarea tiene primer paso <primer_paso_guardado>

    Examples:
      | titulo_nuevo | primer_paso            | titulo_guardado | primer_paso_guardado   |
      | Lavar a mano | Separar la ropa blanca | Lavar a mano    | Separar la ropa blanca |

  # Primer paso 21
  # Primer paso y nota son campos distintos: se combinan los dos cambios.
  Scenario Outline: Primer paso 21
    Given una tarea puntual sin fecha límite
    When edito el primer paso a <primer_paso>
    And otro dispositivo, sin ver ese cambio, edita la nota a <nota>
    Then la tarea tiene primer paso <primer_paso_guardado>
    And la tarea tiene nota <nota_guardada>

    Examples:
      | primer_paso            | nota         | primer_paso_guardado   | nota_guardada |
      | Separar la ropa blanca | Usar guantes | Separar la ropa blanca | Usar guantes  |

  # Primer paso 22
  # El mismo campo: gana el último cambio en llegar y la nota no se toca.
  Scenario Outline: Primer paso 22
    Given una tarea puntual sin fecha límite con nota <nota>
    When edito el primer paso a <primer_paso> con espacios al inicio y al final
    And otro dispositivo, sin ver ese cambio, edita el primer paso a <segundo>
    Then la tarea tiene primer paso <primer_paso_guardado>
    And la tarea tiene nota <nota_guardada>

    Examples:
      | nota         | primer_paso            | segundo           | primer_paso_guardado | nota_guardada |
      | Usar guantes | Separar la ropa blanca | Juntar las llaves | Juntar las llaves    | Usar guantes  |

  # Primer paso 23
  # Quitarlo en un dispositivo y escribirlo en el otro: gana el último en
  # llegar (el escrito).
  Scenario Outline: Primer paso 23
    Given una tarea puntual sin fecha límite
    And el primer paso de la tarea es <primer_paso>
    When quito el primer paso
    And otro dispositivo, sin ver ese cambio, edita el primer paso a <segundo>
    Then la tarea tiene primer paso <primer_paso_guardado>

    Examples:
      | primer_paso            | segundo           | primer_paso_guardado |
      | Separar la ropa blanca | Juntar las llaves | Juntar las llaves    |

  # Primer paso 24
  # Cambiarlo en un dispositivo y quitarlo en el otro, que ve un primer paso
  # previo: gana el último en llegar (el quitado).
  Scenario Outline: Primer paso 24
    Given una tarea puntual sin fecha límite
    And el primer paso de la tarea es <otro_primer_paso>
    When edito el primer paso a <primer_paso>
    And otro dispositivo, sin ver ese cambio, quita el primer paso
    Then la tarea no tiene primer paso

    Examples:
      | otro_primer_paso  | primer_paso            |
      | Juntar las llaves | Separar la ropa blanca |

  # Primer paso 25
  # Una edición escribe solo si cambió: otro dispositivo que guarda sin
  # cambios no pisa el primer paso que acaba de escribirse.
  Scenario Outline: Primer paso 25
    Given una tarea puntual sin fecha límite
    When edito el primer paso a <primer_paso>
    And otro dispositivo, sin ver ese cambio, guarda la tarea sin cambios
    Then la tarea tiene primer paso <primer_paso_guardado>

    Examples:
      | primer_paso            | primer_paso_guardado   |
      | Separar la ropa blanca | Separar la ropa blanca |
