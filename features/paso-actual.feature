# Spec §4.1 (Pasos: Avance, Completar, Deshacer), §4.4 (`pasoAlCompletar`),
# §5.4 y §7. `pasoActual` es el número del paso en que va la tarea (sin el
# campo, el paso 1). «Hecho» lo lleva al paso siguiente y «Paso anterior» al
# anterior; «Hecho» en el último paso completa la tarea como el checkbox.
# "El paso actual de la tarea es N" deja la tarea ya en el paso N.
Feature: Paso actual

  # Paso actual 1
  # «Hecho» pasa al paso siguiente y no completa la tarea.
  Scenario Outline: Paso actual 1
    Given una tarea puntual sin fecha límite
    And los pasos de la tarea son <pasos>
    And el paso actual de la tarea es <actual>
    When toco Hecho el <toque>
    Then la tarea va en el paso <actual_guardado>
    And la tarea no tiene completados

    Examples:
      | pasos                                                       | actual | toque               | actual_guardado |
      | Separar la ropa blanca, Poner el lavarropas, Tender la ropa | 1      | 2026-11-13T10:00:00 | 2               |
      | Separar la ropa blanca, Poner el lavarropas, Tender la ropa | 2      | 2026-11-13T10:00:00 | 3               |

  # Paso actual 2
  # «Hecho» en un paso que no es el último no abre aviso de deshacer.
  Scenario Outline: Paso actual 2
    Given una tarea puntual sin fecha límite
    And los pasos de la tarea son <pasos>
    When toco Hecho el <toque>
    And consulto el aviso el <ahora>
    Then no hay aviso

    Examples:
      | pasos                                  | toque               | ahora               |
      | Llenar la regadera, Regar los helechos | 2026-11-13T10:00:00 | 2026-11-13T10:00:01 |

  # Paso actual 3
  # «Paso anterior» vuelve al paso de antes; en el paso 1 no pasa del primero.
  Scenario Outline: Paso actual 3
    Given una tarea puntual sin fecha límite
    And los pasos de la tarea son <pasos>
    And el paso actual de la tarea es <actual>
    When toco Paso anterior
    Then la tarea va en el paso <actual_guardado>

    Examples:
      | pasos                                                       | actual | actual_guardado |
      | Separar la ropa blanca, Poner el lavarropas, Tender la ropa | 3      | 2               |
      | Separar la ropa blanca, Poner el lavarropas, Tender la ropa | 2      | 1               |
      | Separar la ropa blanca, Poner el lavarropas, Tender la ropa | 1      | 1               |

  # Paso actual 4
  # «Hecho» en el último paso completa la tarea como el checkbox: agrega el
  # completado y abre su aviso.
  Scenario Outline: Paso actual 4
    Given una tarea periódica relativa Regar cada <cada> <unidad>
    And los pasos de la tarea son <pasos>
    And el paso actual de la tarea es <actual>
    When toco Hecho el <toque>
    And consulto el aviso el <ahora>
    Then la tarea está completada
    And el aviso ofrece deshacer el completado de Regar del <completada_guardada>

    Examples:
      | cada | unidad | pasos                                  | actual | toque               | ahora               | completada_guardada |
      | 2    | dias   | Llenar la regadera, Regar los helechos | 2      | 2026-11-13T10:00:00 | 2026-11-13T10:00:01 | 2026-11-13T10:00:00 |

  # Paso actual 5
  # El checkbox hace lo mismo: mismo completado y mismo aviso.
  Scenario Outline: Paso actual 5
    Given una tarea periódica relativa Regar cada <cada> <unidad>
    And los pasos de la tarea son <pasos>
    And el paso actual de la tarea es <actual>
    When toco el checkbox de la tarea el <toque>
    And consulto el aviso el <ahora>
    Then la tarea está completada
    And el aviso ofrece deshacer el completado de Regar del <completada_guardada>

    Examples:
      | cada | unidad | pasos                                  | actual | toque               | ahora               | completada_guardada |
      | 2    | dias   | Llenar la regadera, Regar los helechos | 2      | 2026-11-13T10:00:00 | 2026-11-13T10:00:01 | 2026-11-13T10:00:00 |

  # Paso actual 6
  # Completar con el checkbox, en el paso que sea, vuelve la tarea al paso 1 y
  # el completado guarda el paso en que iba.
  Scenario Outline: Paso actual 6
    Given una tarea puntual sin fecha límite
    And los pasos de la tarea son <pasos>
    And el paso actual de la tarea es <actual>
    When toco el checkbox de la tarea el <toque>
    Then la tarea va en el paso 1
    And el último completado de la tarea guarda el paso <paso_guardado>

    Examples:
      | pasos                                                       | actual | toque               | paso_guardado |
      | Separar la ropa blanca, Poner el lavarropas, Tender la ropa | 1      | 2026-11-13T10:00:00 | 1             |
      | Separar la ropa blanca, Poner el lavarropas, Tender la ropa | 2      | 2026-11-13T10:00:00 | 2             |
      | Separar la ropa blanca, Poner el lavarropas, Tender la ropa | 3      | 2026-11-13T10:00:00 | 3             |

  # Paso actual 7
  # Completar con «Hecho» en el último paso también vuelve al paso 1 y guarda
  # el último paso en el completado.
  Scenario Outline: Paso actual 7
    Given una tarea puntual sin fecha límite
    And los pasos de la tarea son <pasos>
    And el paso actual de la tarea es <actual>
    When toco Hecho el <toque>
    Then la tarea va en el paso 1
    And el último completado de la tarea guarda el paso <paso_guardado>

    Examples:
      | pasos                                                       | actual | toque               | paso_guardado |
      | Separar la ropa blanca, Poner el lavarropas, Tender la ropa | 3      | 2026-11-13T10:00:00 | 3             |

  # Paso actual 8
  # En una tarea de un solo paso el completado no guarda paso.
  Scenario Outline: Paso actual 8
    Given una tarea puntual sin fecha límite
    And el primer paso de la tarea es <primer_paso>
    When toco el checkbox de la tarea el <toque>
    Then el último completado de la tarea no guarda paso

    Examples:
      | primer_paso            | toque               |
      | Separar la ropa blanca | 2026-11-13T10:00:00 |

  # Paso actual 9
  # Deshacer en el aviso devuelve el avance que tenía la tarea antes de
  # completarla.
  Scenario Outline: Paso actual 9
    Given una tarea puntual sin fecha límite
    And los pasos de la tarea son <pasos>
    And el paso actual de la tarea es <actual>
    When toco el checkbox de la tarea el <toque>
    And toco Deshacer en el aviso el <deshacer>
    Then la tarea va en el paso <actual_guardado>

    Examples:
      | pasos                                                       | actual | toque               | deshacer            | actual_guardado |
      | Separar la ropa blanca, Poner el lavarropas, Tender la ropa | 2      | 2026-11-13T10:00:00 | 2026-11-13T10:00:02 | 2               |
      | Separar la ropa blanca, Poner el lavarropas, Tender la ropa | 3      | 2026-11-13T10:00:00 | 2026-11-13T10:00:02 | 3               |

  # Paso actual 10
  # Borrar el completado (Historial o checkbox) devuelve el paso que guarda.
  Scenario Outline: Paso actual 10
    Given una tarea puntual sin fecha límite
    And los pasos de la tarea son <pasos>
    And la tarea fue completada el <completada> en el paso <paso_completado>
    When borro el completado del <completada>
    Then la tarea va en el paso <actual_guardado>

    Examples:
      | pasos                                                       | completada          | paso_completado | actual_guardado |
      | Separar la ropa blanca, Poner el lavarropas, Tender la ropa | 2026-11-13T08:00:00 | 2               | 2               |
      | Separar la ropa blanca, Poner el lavarropas, Tender la ropa | 2026-11-13T08:00:00 | 3               | 3               |

  # Paso actual 11
  # Una tarea completada con «Hecho» en el último paso vuelve a ese paso al
  # deshacer.
  Scenario Outline: Paso actual 11
    Given una tarea puntual sin fecha límite
    And los pasos de la tarea son <pasos>
    And el paso actual de la tarea es <actual>
    When toco Hecho el <toque>
    And toco Deshacer en el aviso el <deshacer>
    Then la tarea va en el paso <actual_guardado>

    Examples:
      | pasos                                                       | actual | toque               | deshacer            | actual_guardado |
      | Separar la ropa blanca, Poner el lavarropas, Tender la ropa | 3      | 2026-11-13T10:00:00 | 2026-11-13T10:00:02 | 3               |

  # Paso actual 12
  # Con el tope del último paso: si ahora hay menos pasos que el del completado,
  # la tarea queda en el último.
  Scenario Outline: Paso actual 12
    Given una tarea puntual sin fecha límite
    And los pasos de la tarea son <pasos>
    And la tarea fue completada el <completada> en el paso <paso_completado>
    When vacío el paso 3
    And borro el completado del <completada>
    Then la tarea va en el paso <actual_guardado>

    Examples:
      | pasos                                                       | completada          | paso_completado | actual_guardado |
      | Separar la ropa blanca, Poner el lavarropas, Tender la ropa | 2026-11-13T08:00:00 | 3               | 2               |

  # Paso actual 13
  # Solo el completado más reciente devuelve su paso: borrar uno anterior no
  # cambia el avance (fila 1); borrar el más reciente sí (fila 2).
  Scenario Outline: Paso actual 13
    Given una tarea periódica relativa cada <cada> <unidad>
    And los pasos de la tarea son <pasos>
    And la tarea fue completada el <primera> en el paso <paso_primera>
    And la tarea fue completada el <segunda> en el paso <paso_segunda>
    When borro el completado del <borrada>
    Then la tarea va en el paso <actual_guardado>

    Examples:
      | cada | unidad | pasos                                                       | primera             | paso_primera | segunda             | paso_segunda | borrada             | actual_guardado |
      | 2    | dias   | Separar la ropa blanca, Poner el lavarropas, Tender la ropa | 2026-11-09T08:00:00 | 3            | 2026-11-11T08:00:00 | 2            | 2026-11-09T08:00:00 | 1               |
      | 2    | dias   | Separar la ropa blanca, Poner el lavarropas, Tender la ropa | 2026-11-09T08:00:00 | 3            | 2026-11-11T08:00:00 | 2            | 2026-11-11T08:00:00 | 2               |

  # Paso actual 14
  # Editar los pasos no cambia el número del paso en que va la tarea.
  Scenario Outline: Paso actual 14
    Given una tarea puntual sin fecha límite
    And los pasos de la tarea son <pasos>
    And el paso actual de la tarea es <actual>
    When edito el paso <numero> a <paso>
    Then la tarea va en el paso <actual_guardado>

    Examples:
      | pasos                                                       | actual | numero | paso              | actual_guardado |
      | Separar la ropa blanca, Poner el lavarropas, Tender la ropa | 2      | 1      | Juntar las llaves | 2               |
      | Separar la ropa blanca, Poner el lavarropas, Tender la ropa | 2      | 3      | Juntar las llaves | 2               |

  # Paso actual 15
  # Si quedan menos pasos que el número en que va la tarea, va en el último.
  Scenario Outline: Paso actual 15
    Given una tarea puntual sin fecha límite
    And los pasos de la tarea son <pasos>
    And el paso actual de la tarea es <actual>
    When vacío el paso <numero>
    Then la tarea va en el paso <actual_guardado>

    Examples:
      | pasos                                                       | actual | numero | actual_guardado |
      | Separar la ropa blanca, Poner el lavarropas, Tender la ropa | 3      | 3      | 2               |
      | Separar la ropa blanca, Poner el lavarropas, Tender la ropa | 3      | 2      | 2               |

  # Paso actual 16
  # La app no cambia el avance sola: el número se conserva, y si vuelve a haber
  # tantos pasos, la tarea va en ese paso.
  Scenario Outline: Paso actual 16
    Given una tarea puntual sin fecha límite
    And los pasos de la tarea son <pasos>
    And el paso actual de la tarea es <actual>
    When vacío el paso 3
    And edito el paso 3 a <paso>
    Then la tarea va en el paso <actual_guardado>

    Examples:
      | pasos                                                       | actual | paso           | actual_guardado |
      | Separar la ropa blanca, Poner el lavarropas, Tender la ropa | 3      | Guardar la ropa | 3               |

  # Paso actual 17
  # Con menos pasos que el número en que va, «Hecho» actúa sobre el último y
  # completa la tarea.
  Scenario Outline: Paso actual 17
    Given una tarea puntual sin fecha límite
    And los pasos de la tarea son <pasos>
    And el paso actual de la tarea es <actual>
    When vacío el paso 3
    And toco Hecho el <toque>
    Then la tarea está completada

    Examples:
      | pasos                                                       | actual | toque               |
      | Separar la ropa blanca, Poner el lavarropas, Tender la ropa | 3      | 2026-11-13T10:00:00 |

  # Paso actual 18
  # El avance no cambia el estado: una puntual con fecha límite sigue pendiente
  # el día límite (fila 1) y atrasada después (fila 2).
  Scenario Outline: Paso actual 18
    Given una tarea puntual con fecha límite <limite>
    And los pasos de la tarea son <pasos>
    When toco Hecho el <toque>
    And consulto el estado el <ahora>
    Then el estado es <estado>

    Examples:
      | limite     | pasos                                  | toque               | ahora               | estado    |
      | 2026-11-12 | Llenar la regadera, Regar los helechos | 2026-11-12T10:00:00 | 2026-11-12T23:59:59 | pendiente |
      | 2026-11-12 | Llenar la regadera, Regar los helechos | 2026-11-12T10:00:00 | 2026-11-13T00:00:00 | atrasada  |

  # Paso actual 19
  # El avance no cambia el orden de la lista: sigue el de antes, sea la tarea
  # que avanza la primera (fila 1) o la segunda (fila 2).
  Scenario Outline: Paso actual 19
    Given una tarea puntual <primera> sin fecha límite
    And una tarea puntual <segunda> sin fecha límite
    And los pasos de la tarea <avanza> son <pasos>
    When toco Hecho en la tarea <avanza> el <toque>
    And consulto Pendientes el <ahora>
    Then Pendientes muestra en orden <orden>

    Examples:
      | primera | segunda | avanza | pasos                                  | toque               | ahora               | orden         |
      | Barrer  | Lavar   | Barrer | Llenar la regadera, Regar los helechos | 2026-11-13T10:00:00 | 2026-11-13T10:00:01 | Barrer, Lavar |
      | Barrer  | Lavar   | Lavar  | Llenar la regadera, Regar los helechos | 2026-11-13T10:00:00 | 2026-11-13T10:00:01 | Barrer, Lavar |

  # Paso actual 20
  # Dos «Hecho» sin conexión en el mismo paso dejan la tarea en el paso
  # siguiente, no dos más adelante.
  Scenario Outline: Paso actual 20
    Given una tarea puntual sin fecha límite
    And los pasos de la tarea son <pasos>
    When toco Hecho el <toque>
    And otro dispositivo, sin ver ese cambio, toca Hecho el <toque_otro>
    Then la tarea va en el paso <actual_guardado>

    Examples:
      | pasos                                                       | toque               | toque_otro          | actual_guardado |
      | Separar la ropa blanca, Poner el lavarropas, Tender la ropa | 2026-11-13T10:00:00 | 2026-11-13T10:00:05 | 2               |

  # Paso actual 21
  # Un «Hecho» no pierde lo que otro dispositivo editó en el panel: el avance
  # y los pasos son campos distintos.
  Scenario Outline: Paso actual 21
    Given una tarea puntual sin fecha límite
    And los pasos de la tarea son <pasos>
    When toco Hecho el <toque>
    And otro dispositivo, sin ver ese cambio, edita el paso 2 a <paso>
    Then la tarea va en el paso <actual_guardado>
    And la tarea tiene los pasos <pasos_guardados>

    Examples:
      | pasos                                                       | toque               | paso              | actual_guardado | pasos_guardados                                           |
      | Separar la ropa blanca, Poner el lavarropas, Tender la ropa | 2026-11-13T10:00:00 | Juntar las llaves | 2               | Separar la ropa blanca, Juntar las llaves, Tender la ropa |

  # Paso actual 22
  # Y al revés: editar los pasos en el panel no pisa el avance que otro
  # dispositivo hizo con «Hecho».
  Scenario Outline: Paso actual 22
    Given una tarea puntual sin fecha límite
    And los pasos de la tarea son <pasos>
    When edito el paso 3 a <paso>
    And otro dispositivo, sin ver ese cambio, toca Hecho el <toque>
    Then la tarea va en el paso <actual_guardado>
    And la tarea tiene los pasos <pasos_guardados>

    Examples:
      | pasos                                                       | paso              | toque               | actual_guardado | pasos_guardados                                             |
      | Separar la ropa blanca, Poner el lavarropas, Tender la ropa | Juntar las llaves | 2026-11-13T10:00:00 | 2               | Separar la ropa blanca, Poner el lavarropas, Juntar las llaves |
