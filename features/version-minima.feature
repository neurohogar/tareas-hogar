# Spec §4.1 (Versión mínima), con §6.2 y §7. Un campo opcional `versionMinima`
# con una versión chica de la tarea («Solo el inodoro»), para cualquier tipo
# de tarea y cualquier esfuerzo. Una sola línea, sin largo máximo; al guardar
# se recortan los espacios del inicio y del final; vacío o solo espacios es
# sin versión mínima (el campo no se guarda). Nunca es inválida: no rechaza la
# creación ni la edición. Una tarea guardada sin el campo no tiene versión
# mínima. No cambia el estado, el orden ni el nombre de la tarea. Es un campo
# independiente: gana el último cambio, por campo (§7).
# "La versión mínima de la tarea es X" deja la tarea ya guardada con ese valor,
# sin pasar por "editar".
Feature: Versión mínima

  # Versión mínima 1
  # Una puntual puede crearse con versión mínima (§4.1).
  Scenario Outline: Versión mínima 1
    When creo una tarea puntual con título <titulo> y versión mínima <minima>
    Then se crea una tarea puntual con título <titulo_guardado>
    And la tarea tiene versión mínima <minima_guardada>

    Examples:
      | titulo | minima           | titulo_guardado | minima_guardada  |
      | Limpiar baño | Solo el inodoro | Limpiar baño | Solo el inodoro |

  # Versión mínima 2
  # Una periódica relativa también.
  Scenario Outline: Versión mínima 2
    When creo una tarea periódica relativa con título <titulo> cada 2 dias y versión mínima <minima>
    Then se crea una tarea periódica con título <titulo_guardado>
    And la tarea tiene versión mínima <minima_guardada>

    Examples:
      | titulo | minima          | titulo_guardado | minima_guardada |
      | Regar  | Solo los helechos | Regar         | Solo los helechos |

  # Versión mínima 3
  # Una periódica de calendario también.
  Scenario Outline: Versión mínima 3
    When creo una tarea periódica semanal con título <titulo> los <dias> y versión mínima <minima>
    Then se crea una tarea periódica con título <titulo_guardado>
    And la tarea tiene versión mínima <minima_guardada>

    Examples:
      | titulo | dias           | minima           | titulo_guardado | minima_guardada  |
      | Basura | martes, jueves | Solo la de la cocina | Basura      | Solo la de la cocina |

  # Versión mínima 4
  # Con cualquier esfuerzo, también sin estimar.
  Scenario Outline: Versión mínima 4
    Given una tarea puntual sin fecha límite con esfuerzo <esfuerzo>
    When edito la versión mínima a <minima>
    Then la tarea tiene versión mínima <minima_guardada>

    Examples:
      | esfuerzo    | minima          | minima_guardada |
      | sin estimar | Solo el inodoro | Solo el inodoro |
      | rapida      | Solo el inodoro | Solo el inodoro |
      | media       | Solo el inodoro | Solo el inodoro |
      | larga       | Solo el inodoro | Solo el inodoro |

  # Versión mínima 5
  # Al guardar se recortan los espacios del inicio y del final.
  Scenario Outline: Versión mínima 5
    Given una tarea puntual sin fecha límite
    When edito la versión mínima a <minima> con espacios al inicio y al final
    Then la tarea tiene versión mínima <minima_guardada>

    Examples:
      | minima          | minima_guardada |
      | Solo el inodoro | Solo el inodoro |
      | Solo el lavabo  | Solo el lavabo  |

  # Versión mínima 6
  # Vaciar el campo deja la tarea sin versión mínima (el campo no se guarda).
  Scenario Outline: Versión mínima 6
    Given una tarea puntual sin fecha límite
    And la versión mínima de la tarea es <minima>
    When quito la versión mínima
    Then la tarea no tiene versión mínima

    Examples:
      | minima          |
      | Solo el inodoro |

  # Versión mínima 7
  # Solo espacios también deja la tarea sin versión mínima, y la edición no se
  # rechaza.
  Scenario Outline: Versión mínima 7
    Given una tarea puntual sin fecha límite
    And la versión mínima de la tarea es <minima>
    When edito la versión mínima a una de solo espacios
    Then la tarea no tiene versión mínima

    Examples:
      | minima          |
      | Solo el inodoro |

  # Versión mínima 8
  # Crear con una versión mínima de solo espacios no se rechaza: la tarea se
  # crea sin versión mínima.
  Scenario Outline: Versión mínima 8
    When creo una tarea puntual con título <titulo> y una versión mínima de solo espacios
    Then se crea una tarea puntual con título <titulo_guardado>
    And la tarea no tiene versión mínima

    Examples:
      | titulo | titulo_guardado |
      | Lavar  | Lavar           |

  # Versión mínima 9
  # La versión mínima no tiene largo máximo.
  Scenario Outline: Versión mínima 9
    Given una tarea puntual sin fecha límite
    When edito la versión mínima a una de <largo> caracteres
    Then la tarea tiene una versión mínima de <largo_guardado> caracteres

    Examples:
      | largo | largo_guardado |
      | 5000  | 5000           |

  # Versión mínima 10
  # Completar la tarea entera no borra ni cambia la versión mínima.
  Scenario Outline: Versión mínima 10
    Given una tarea periódica relativa cada <cada> <unidad>
    And la versión mínima de la tarea es <minima>
    When toco el checkbox de la tarea el <toque>
    Then la tarea tiene versión mínima <minima_guardada>

    Examples:
      | cada | unidad | minima            | toque               | minima_guardada   |
      | 2    | dias   | Solo los helechos | 2026-11-13T08:00:00 | Solo los helechos |

  # Versión mínima 11
  # La versión mínima no cambia el estado: una puntual con fecha límite sigue
  # pendiente el día límite (fila 1) y atrasada después (fila 2).
  Scenario Outline: Versión mínima 11
    Given una tarea puntual con fecha límite <limite>
    And la versión mínima de la tarea es <minima>
    When consulto el estado el <ahora>
    Then el estado es <estado>

    Examples:
      | limite     | minima          | ahora               | estado    |
      | 2026-11-12 | Solo el inodoro | 2026-11-12T23:59:59 | pendiente |
      | 2026-11-12 | Solo el inodoro | 2026-11-13T00:00:00 | atrasada  |

  # Versión mínima 12
  # No cambia el orden de la lista: sigue el de antes, por título entre
  # tareas igual de urgentes, tenga o no versión mínima la que va primero
  # (fila 1) o la que va segunda (fila 2).
  Scenario Outline: Versión mínima 12
    Given una tarea puntual <primera> sin fecha límite
    And una tarea puntual <segunda> sin fecha límite
    And la versión mínima de la tarea <con_minima> es <minima>
    When consulto Pendientes el <ahora>
    Then Pendientes muestra en orden <orden>

    Examples:
      | primera | segunda | con_minima | minima          | ahora               | orden         |
      | Barrer  | Lavar   | Barrer     | Solo el inodoro | 2026-11-13T10:00:00 | Barrer, Lavar |
      | Barrer  | Lavar   | Lavar      | Solo el inodoro | 2026-11-13T10:00:00 | Barrer, Lavar |

  # Versión mínima 13
  # El nombre de la tarea sigue siendo emoji y título.
  Scenario Outline: Versión mínima 13
    Given una tarea puntual <titulo> sin fecha límite con emoji <emoji>
    When edito la versión mínima a <minima>
    Then el nombre de la tarea es <nombre>

    Examples:
      | titulo | emoji | minima          | nombre  |
      | Lavar  | 🧺     | Solo el inodoro | 🧺 Lavar |

  # Versión mínima 14
  # Versión mínima y título son campos distintos: se combinan los dos cambios.
  Scenario Outline: Versión mínima 14
    Given una tarea puntual sin fecha límite
    When edito el título a <titulo_nuevo>
    And otro dispositivo, sin ver ese cambio, edita la versión mínima a <minima>
    Then la tarea tiene título <titulo_guardado>
    And la tarea tiene versión mínima <minima_guardada>

    Examples:
      | titulo_nuevo | minima          | titulo_guardado | minima_guardada |
      | Lavar a mano | Solo el inodoro | Lavar a mano    | Solo el inodoro |

  # Versión mínima 15
  # Versión mínima y nota son campos distintos: se combinan los dos cambios.
  Scenario Outline: Versión mínima 15
    Given una tarea puntual sin fecha límite
    When edito la versión mínima a <minima>
    And otro dispositivo, sin ver ese cambio, edita la nota a <nota>
    Then la tarea tiene versión mínima <minima_guardada>
    And la tarea tiene nota <nota_guardada>

    Examples:
      | minima          | nota         | minima_guardada | nota_guardada |
      | Solo el inodoro | Usar guantes | Solo el inodoro | Usar guantes  |

  # Versión mínima 16
  # Versión mínima y primer paso son campos distintos: se combinan los dos
  # cambios.
  Scenario Outline: Versión mínima 16
    Given una tarea puntual sin fecha límite
    When edito la versión mínima a <minima>
    And otro dispositivo, sin ver ese cambio, edita el primer paso a <primer_paso>
    Then la tarea tiene versión mínima <minima_guardada>
    And la tarea tiene primer paso <primer_paso_guardado>

    Examples:
      | minima          | primer_paso            | minima_guardada | primer_paso_guardado   |
      | Solo el inodoro | Separar la ropa blanca | Solo el inodoro | Separar la ropa blanca |

  # Versión mínima 17
  # El mismo campo: gana el último cambio en llegar y la nota no se toca.
  Scenario Outline: Versión mínima 17
    Given una tarea puntual sin fecha límite con nota <nota>
    When edito la versión mínima a <minima> con espacios al inicio y al final
    And otro dispositivo, sin ver ese cambio, edita la versión mínima a <segunda>
    Then la tarea tiene versión mínima <minima_guardada>
    And la tarea tiene nota <nota_guardada>

    Examples:
      | nota         | minima          | segunda        | minima_guardada | nota_guardada |
      | Usar guantes | Solo el inodoro | Solo el lavabo | Solo el lavabo  | Usar guantes  |

  # Versión mínima 18
  # Quitarla en un dispositivo y escribirla en el otro: gana el último en
  # llegar (la escrita).
  Scenario Outline: Versión mínima 18
    Given una tarea puntual sin fecha límite
    And la versión mínima de la tarea es <minima>
    When quito la versión mínima
    And otro dispositivo, sin ver ese cambio, edita la versión mínima a <segunda>
    Then la tarea tiene versión mínima <minima_guardada>

    Examples:
      | minima          | segunda        | minima_guardada |
      | Solo el inodoro | Solo el lavabo | Solo el lavabo  |

  # Versión mínima 19
  # Cambiarla en un dispositivo y quitarla en el otro, que ve una versión
  # mínima previa: gana el último en llegar (la quitada).
  Scenario Outline: Versión mínima 19
    Given una tarea puntual sin fecha límite
    And la versión mínima de la tarea es <otra_minima>
    When edito la versión mínima a <minima>
    And otro dispositivo, sin ver ese cambio, quita la versión mínima
    Then la tarea no tiene versión mínima

    Examples:
      | otra_minima    | minima          |
      | Solo el lavabo | Solo el inodoro |

  # Versión mínima 20
  # Una edición escribe solo si cambió: otro dispositivo que guarda sin
  # cambios no pisa la versión mínima que acaba de escribirse.
  Scenario Outline: Versión mínima 20
    Given una tarea puntual sin fecha límite
    When edito la versión mínima a <minima>
    And otro dispositivo, sin ver ese cambio, guarda la tarea sin cambios
    Then la tarea tiene versión mínima <minima_guardada>

    Examples:
      | minima          | minima_guardada |
      | Solo el inodoro | Solo el inodoro |
