# Spec §4.1 (Pasos), §6.1 y §7. Una tarea puede tener, además del primer paso,
# más pasos (`pasos`: los pasos 2 en adelante, en orden). El primer paso es el
# paso 1. Los números de paso de los escenarios cuentan el primer paso como 1.
# "Los pasos de la tarea son A, B, C" es el primer paso A y `pasos` B, C.
Feature: Pasos

  # Pasos 1
  # Una puntual puede crearse con más pasos además del primer paso (§4.1).
  Scenario Outline: Pasos 1
    When creo una tarea puntual con título <titulo> y pasos <pasos>
    Then se crea una tarea puntual con título <titulo_guardado>
    And la tarea tiene los pasos <pasos_guardados>

    Examples:
      | titulo | pasos                                                       | titulo_guardado | pasos_guardados                                             |
      | Lavar  | Separar la ropa blanca, Poner el lavarropas, Tender la ropa | Lavar           | Separar la ropa blanca, Poner el lavarropas, Tender la ropa |

  # Pasos 2
  # Una periódica relativa también.
  Scenario Outline: Pasos 2
    When creo una tarea periódica relativa con título <titulo> cada 2 dias y pasos <pasos>
    Then se crea una tarea periódica con título <titulo_guardado>
    And la tarea tiene los pasos <pasos_guardados>

    Examples:
      | titulo | pasos                                     | titulo_guardado | pasos_guardados                           |
      | Regar  | Llenar la regadera, Regar los helechos    | Regar           | Llenar la regadera, Regar los helechos    |

  # Pasos 3
  # Una periódica de calendario también.
  Scenario Outline: Pasos 3
    When creo una tarea periódica semanal con título <titulo> los <dias> y pasos <pasos>
    Then se crea una tarea periódica con título <titulo_guardado>
    And la tarea tiene los pasos <pasos_guardados>

    Examples:
      | titulo | dias           | pasos                                  | titulo_guardado | pasos_guardados                        |
      | Basura | martes, jueves | Atar la bolsa llena, Bajar la basura   | Basura          | Atar la bolsa llena, Bajar la basura   |

  # Pasos 4
  # Con cualquier esfuerzo, también sin estimar.
  Scenario Outline: Pasos 4
    Given una tarea puntual sin fecha límite con esfuerzo <esfuerzo>
    And el primer paso de la tarea es <primer_paso>
    When edito el paso 2 a <paso>
    Then la tarea tiene los pasos <pasos_guardados>

    Examples:
      | esfuerzo    | primer_paso            | paso                | pasos_guardados                            |
      | sin estimar | Separar la ropa blanca | Poner el lavarropas | Separar la ropa blanca, Poner el lavarropas |
      | rapida      | Separar la ropa blanca | Poner el lavarropas | Separar la ropa blanca, Poner el lavarropas |
      | media       | Separar la ropa blanca | Poner el lavarropas | Separar la ropa blanca, Poner el lavarropas |
      | larga       | Separar la ropa blanca | Poner el lavarropas | Separar la ropa blanca, Poner el lavarropas |

  # Pasos 5
  # Al guardar se recortan los espacios del inicio y del final de cada paso.
  Scenario Outline: Pasos 5
    Given una tarea puntual sin fecha límite
    And el primer paso de la tarea es <primer_paso>
    When edito el paso 2 a <paso> con espacios al inicio y al final
    Then la tarea tiene los pasos <pasos_guardados>

    Examples:
      | primer_paso            | paso                | pasos_guardados                             |
      | Separar la ropa blanca | Poner el lavarropas | Separar la ropa blanca, Poner el lavarropas |
      | Separar la ropa blanca | Tender la ropa      | Separar la ropa blanca, Tender la ropa      |

  # Pasos 6
  # Un paso vaciado se descarta al guardar y los de abajo suben.
  Scenario Outline: Pasos 6
    Given una tarea puntual sin fecha límite
    And los pasos de la tarea son <pasos>
    When vacío el paso <numero>
    Then la tarea tiene los pasos <pasos_guardados>

    Examples:
      | pasos                                                       | numero | pasos_guardados                             |
      | Separar la ropa blanca, Poner el lavarropas, Tender la ropa | 2      | Separar la ropa blanca, Tender la ropa      |
      | Separar la ropa blanca, Poner el lavarropas, Tender la ropa | 3      | Separar la ropa blanca, Poner el lavarropas |

  # Pasos 7
  # Un paso de solo espacios también se descarta, sin rechazar la edición.
  Scenario Outline: Pasos 7
    Given una tarea puntual sin fecha límite
    And los pasos de la tarea son <pasos>
    When edito el paso <numero> a uno de solo espacios
    Then la tarea tiene los pasos <pasos_guardados>

    Examples:
      | pasos                                                       | numero | pasos_guardados                        |
      | Separar la ropa blanca, Poner el lavarropas, Tender la ropa | 2      | Separar la ropa blanca, Tender la ropa |

  # Pasos 8
  # Si el primer paso queda vacío y el paso 2 no, el paso 2 pasa a ser el
  # primer paso.
  Scenario Outline: Pasos 8
    Given una tarea puntual sin fecha límite
    And los pasos de la tarea son <pasos>
    When vacío el paso 1
    Then la tarea tiene primer paso <primer_paso_guardado>
    And la tarea tiene los pasos <pasos_guardados>

    Examples:
      | pasos                                                       | primer_paso_guardado | pasos_guardados                    |
      | Separar la ropa blanca, Poner el lavarropas, Tender la ropa | Poner el lavarropas  | Poner el lavarropas, Tender la ropa |

  # Pasos 9
  # Sin pasos más allá del primero, la tarea queda sin más pasos (el campo no
  # se guarda).
  Scenario Outline: Pasos 9
    Given una tarea puntual sin fecha límite
    And los pasos de la tarea son <pasos>
    When vacío el paso 2
    Then la tarea no tiene más pasos
    And la tarea tiene primer paso <primer_paso_guardado>

    Examples:
      | pasos                                       | primer_paso_guardado   |
      | Separar la ropa blanca, Poner el lavarropas | Separar la ropa blanca |

  # Pasos 10
  # Crear con un paso de solo espacios no se rechaza: la tarea se crea sin él.
  Scenario Outline: Pasos 10
    When creo una tarea puntual con título <titulo> y pasos <pasos> y un paso más de solo espacios
    Then se crea una tarea puntual con título <titulo_guardado>
    And la tarea tiene los pasos <pasos_guardados>

    Examples:
      | titulo | pasos                                       | titulo_guardado | pasos_guardados                             |
      | Lavar  | Separar la ropa blanca, Poner el lavarropas | Lavar           | Separar la ropa blanca, Poner el lavarropas |

  # Pasos 11
  # Un paso no tiene largo máximo.
  Scenario Outline: Pasos 11
    Given una tarea puntual sin fecha límite
    And el primer paso de la tarea es <primer_paso>
    When edito el paso 2 a uno de <largo> caracteres
    Then el paso 2 de la tarea tiene <largo_guardado> caracteres

    Examples:
      | primer_paso            | largo | largo_guardado |
      | Separar la ropa blanca | 5000  | 5000           |

  # Pasos 12
  # No hay máximo de pasos.
  Scenario Outline: Pasos 12
    Given una tarea puntual sin fecha límite
    When edito la tarea con <cantidad> pasos
    Then la tarea tiene <cantidad_guardada> pasos

    Examples:
      | cantidad | cantidad_guardada |
      | 100      | 100               |

  # Pasos 13
  # Completar la tarea no borra ni cambia los pasos.
  Scenario Outline: Pasos 13
    Given una tarea periódica relativa cada <cada> <unidad>
    And los pasos de la tarea son <pasos>
    When toco el checkbox de la tarea el <toque>
    Then la tarea tiene los pasos <pasos_guardados>

    Examples:
      | cada | unidad | pasos                                       | toque               | pasos_guardados                             |
      | 2    | dias   | Llenar la regadera, Regar los helechos      | 2026-11-13T08:00:00 | Llenar la regadera, Regar los helechos      |

  # Pasos 14
  # Posponer no borra ni cambia los pasos ni el paso en que va la tarea.
  Scenario Outline: Pasos 14
    Given una tarea puntual sin fecha límite
    And los pasos de la tarea son <pasos>
    And el paso actual de la tarea es <actual>
    When pospongo la tarea con la opción <opcion> el <ahora>
    Then la tarea tiene los pasos <pasos_guardados>
    And la tarea va en el paso <actual_guardado>

    Examples:
      | pasos                                                       | actual | opcion  | ahora               | pasos_guardados                                             | actual_guardado |
      | Separar la ropa blanca, Poner el lavarropas, Tender la ropa | 2      | 3 horas | 2026-11-13T10:00:00 | Separar la ropa blanca, Poner el lavarropas, Tender la ropa | 2               |

  # Pasos 15
  # Pausar y reanudar tampoco.
  Scenario Outline: Pasos 15
    Given una tarea periódica relativa cada <cada> <unidad>
    And los pasos de la tarea son <pasos>
    And el paso actual de la tarea es <actual>
    When pauso la tarea
    And reanudo la tarea el <reanudada>
    Then la tarea tiene los pasos <pasos_guardados>
    And la tarea va en el paso <actual_guardado>

    Examples:
      | cada | unidad | pasos                                  | actual | reanudada           | pasos_guardados                        | actual_guardado |
      | 2    | dias   | Llenar la regadera, Regar los helechos | 2      | 2026-11-13T10:00:00 | Llenar la regadera, Regar los helechos | 2               |

  # Pasos 16
  # Deshacer un completado no borra ni cambia los pasos.
  Scenario Outline: Pasos 16
    Given una tarea periódica relativa cada <cada> <unidad>
    And los pasos de la tarea son <pasos>
    And la tarea fue completada el <completada>
    When borro el completado del <completada>
    Then la tarea tiene los pasos <pasos_guardados>

    Examples:
      | cada | unidad | pasos                                  | completada          | pasos_guardados                        |
      | 2    | dias   | Llenar la regadera, Regar los helechos | 2026-11-13T08:00:00 | Llenar la regadera, Regar los helechos |

  # Pasos 17
  # Cambiar de puntual a periódica no borra ni cambia los pasos ni el paso en
  # que va la tarea.
  Scenario Outline: Pasos 17
    Given una tarea puntual sin fecha límite
    And los pasos de la tarea son <pasos>
    And el paso actual de la tarea es <actual>
    When edito la tarea a periódica relativa cada <cada> <unidad>
    Then la tarea tiene los pasos <pasos_guardados>
    And la tarea va en el paso <actual_guardado>

    Examples:
      | pasos                                  | actual | cada | unidad | pasos_guardados                        | actual_guardado |
      | Llenar la regadera, Regar los helechos | 2      | 3    | dias   | Llenar la regadera, Regar los helechos | 2               |

  # Pasos 18
  # Cambiar de periódica a puntual tampoco.
  Scenario Outline: Pasos 18
    Given una tarea periódica relativa cada <cada> <unidad>
    And los pasos de la tarea son <pasos>
    And el paso actual de la tarea es <actual>
    When edito la tarea a puntual sin fecha límite
    Then la tarea tiene los pasos <pasos_guardados>
    And la tarea va en el paso <actual_guardado>

    Examples:
      | cada | unidad | pasos                                  | actual | pasos_guardados                        | actual_guardado |
      | 2    | dias   | Llenar la regadera, Regar los helechos | 2      | Llenar la regadera, Regar los helechos | 2               |

  # Pasos 19
  # Cambiar de modo (de relativa a de calendario) tampoco.
  Scenario Outline: Pasos 19
    Given una tarea periódica relativa cada <cada> <unidad>
    And los pasos de la tarea son <pasos>
    And el paso actual de la tarea es <actual>
    When edito la tarea a periódica semanal los <dias>
    Then la tarea tiene los pasos <pasos_guardados>
    And la tarea va en el paso <actual_guardado>

    Examples:
      | cada | unidad | pasos                                  | actual | dias   | pasos_guardados                        | actual_guardado |
      | 2    | dias   | Llenar la regadera, Regar los helechos | 2      | martes | Llenar la regadera, Regar los helechos | 2               |

  # Pasos 20
  # Los pasos no cambian el estado: una puntual con fecha límite sigue
  # pendiente el día límite (fila 1) y atrasada después (fila 2).
  Scenario Outline: Pasos 20
    Given una tarea puntual con fecha límite <limite>
    And los pasos de la tarea son <pasos>
    And el paso actual de la tarea es <actual>
    When consulto el estado el <ahora>
    Then el estado es <estado>

    Examples:
      | limite     | pasos                                  | actual | ahora               | estado    |
      | 2026-11-12 | Llenar la regadera, Regar los helechos | 2      | 2026-11-12T23:59:59 | pendiente |
      | 2026-11-12 | Llenar la regadera, Regar los helechos | 2      | 2026-11-13T00:00:00 | atrasada  |

  # Pasos 21
  # No cambian el orden de la lista: sigue el de antes, por título entre
  # tareas igual de urgentes, tenga o no pasos la que va primero (fila 1) o la
  # que va segunda (fila 2).
  Scenario Outline: Pasos 21
    Given una tarea puntual <primera> sin fecha límite
    And una tarea puntual <segunda> sin fecha límite
    And los pasos de la tarea <con_pasos> son <pasos>
    When consulto Pendientes el <ahora>
    Then Pendientes muestra en orden <orden>

    Examples:
      | primera | segunda | con_pasos | pasos                                  | ahora               | orden         |
      | Barrer  | Lavar   | Barrer    | Llenar la regadera, Regar los helechos | 2026-11-13T10:00:00 | Barrer, Lavar |
      | Barrer  | Lavar   | Lavar     | Llenar la regadera, Regar los helechos | 2026-11-13T10:00:00 | Barrer, Lavar |

  # Pasos 22
  # El nombre de la tarea sigue siendo emoji y título.
  Scenario Outline: Pasos 22
    Given una tarea puntual <titulo> sin fecha límite con emoji <emoji>
    And el primer paso de la tarea es <primer_paso>
    When edito el paso 2 a <paso>
    Then el nombre de la tarea es <nombre>

    Examples:
      | titulo | emoji | primer_paso            | paso                | nombre  |
      | Lavar  | 🧺     | Separar la ropa blanca | Poner el lavarropas | 🧺 Lavar |

  # Pasos 23
  # Los pasos y el título son campos distintos: se combinan los dos cambios.
  Scenario Outline: Pasos 23
    Given una tarea puntual sin fecha límite
    And el primer paso de la tarea es <primer_paso>
    When edito el título a <titulo_nuevo>
    And otro dispositivo, sin ver ese cambio, edita el paso 2 a <paso>
    Then la tarea tiene título <titulo_guardado>
    And la tarea tiene los pasos <pasos_guardados>

    Examples:
      | primer_paso            | titulo_nuevo | paso                | titulo_guardado | pasos_guardados                             |
      | Separar la ropa blanca | Lavar a mano | Poner el lavarropas | Lavar a mano    | Separar la ropa blanca, Poner el lavarropas |

  # Pasos 24
  # El primer paso y los pasos más son campos distintos: se combinan los dos
  # cambios.
  Scenario Outline: Pasos 24
    Given una tarea puntual sin fecha límite
    And los pasos de la tarea son <pasos>
    When edito el primer paso a <primer_paso>
    And otro dispositivo, sin ver ese cambio, edita el paso 2 a <paso>
    Then la tarea tiene los pasos <pasos_guardados>

    Examples:
      | pasos                                       | primer_paso       | paso                | pasos_guardados                        |
      | Separar la ropa blanca, Poner el lavarropas | Juntar las llaves | Tender la ropa      | Juntar las llaves, Tender la ropa      |

  # Pasos 25
  # El mismo paso: gana el último cambio en llegar.
  Scenario Outline: Pasos 25
    Given una tarea puntual sin fecha límite
    And los pasos de la tarea son <pasos>
    When edito el paso 2 a <primero>
    And otro dispositivo, sin ver ese cambio, edita el paso 2 a <segundo>
    Then la tarea tiene los pasos <pasos_guardados>

    Examples:
      | pasos                                                       | primero              | segundo           | pasos_guardados                                                |
      | Separar la ropa blanca, Poner el lavarropas, Tender la ropa | Buscar el detergente | Juntar las llaves | Separar la ropa blanca, Juntar las llaves, Tender la ropa |

  # Pasos 26
  # `pasos` es un solo campo que se reemplaza entero, como etiquetas: dos
  # ediciones de pasos distintos no se mezclan; gana la lista del último
  # cambio en llegar, que parte de lo que ese dispositivo veía.
  Scenario Outline: Pasos 26
    Given una tarea puntual sin fecha límite
    And los pasos de la tarea son <pasos>
    When edito el paso 2 a <primero>
    And otro dispositivo, sin ver ese cambio, edita el paso 3 a <segundo>
    Then la tarea tiene los pasos <pasos_guardados>

    Examples:
      | pasos                                                       | primero              | segundo           | pasos_guardados                                          |
      | Separar la ropa blanca, Poner el lavarropas, Tender la ropa | Buscar el detergente | Juntar las llaves | Separar la ropa blanca, Poner el lavarropas, Juntar las llaves |

  # Pasos 27
  # Una edición escribe solo si cambió: otro dispositivo que guarda sin
  # cambios no pisa el paso que acaba de escribirse.
  Scenario Outline: Pasos 27
    Given una tarea puntual sin fecha límite
    And el primer paso de la tarea es <primer_paso>
    When edito el paso 2 a <paso>
    And otro dispositivo, sin ver ese cambio, guarda la tarea sin cambios
    Then la tarea tiene los pasos <pasos_guardados>

    Examples:
      | primer_paso            | paso                | pasos_guardados                             |
      | Separar la ropa blanca | Poner el lavarropas | Separar la ropa blanca, Poner el lavarropas |
