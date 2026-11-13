Feature: Primer paso en la fila

  # Primer paso en la fila 1
  # Una pendiente con primer paso lo muestra con el prefijo «Primer paso: »,
  # completo (fila 2: largo, sin cortar).
  Scenario Outline: Primer paso en la fila 1
    Given una tarea puntual sin fecha límite
    And el primer paso de la tarea es <primer_paso>
    When consulto Pendientes en cualquier momento
    Then la fila de la tarea muestra el primer paso <texto>

    Examples:
      | primer_paso                                                                                                                    | texto                                                                                                                                       |
      | Separar la ropa blanca                                                                                                         | Primer paso: Separar la ropa blanca                                                                                                         |
      | Abrir el cajón de abajo, sacar toda la ropa blanca y separarla en dos pilas: la que va con agua caliente y la que no se mezcla | Primer paso: Abrir el cajón de abajo, sacar toda la ropa blanca y separarla en dos pilas: la que va con agua caliente y la que no se mezcla |

  # Primer paso en la fila 2
  # También en una periódica relativa pendiente.
  Scenario Outline: Primer paso en la fila 2
    Given una tarea periódica relativa cada <cada> <unidad>
    And el primer paso de la tarea es <primer_paso>
    When consulto Pendientes el <ahora>
    Then la fila de la tarea muestra el primer paso <texto>

    Examples:
      | cada | unidad | primer_paso        | ahora               | texto                           |
      | 2    | dias   | Llenar la regadera | 2026-11-13T10:00:00 | Primer paso: Llenar la regadera |

  # Primer paso en la fila 3
  # También en una periódica de calendario pendiente (el día de su ocurrencia).
  Scenario Outline: Primer paso en la fila 3
    Given una tarea periódica semanal los <dias> creada el <creada>
    And el primer paso de la tarea es <primer_paso>
    When consulto Pendientes el <ahora>
    Then la fila de la tarea muestra el primer paso <texto>

    Examples:
      | dias   | creada              | primer_paso         | ahora               | texto                            |
      | martes | 2026-11-09T08:00:00 | Atar la bolsa llena | 2026-11-10T09:00:00 | Primer paso: Atar la bolsa llena |

  # Primer paso en la fila 4
  # Una puntual atrasada también lo muestra. Fila 1: recién atrasada (a las
  # 00:00 del día siguiente); fila 2: días después.
  Scenario Outline: Primer paso en la fila 4
    Given una tarea puntual con fecha límite <limite>
    And el primer paso de la tarea es <primer_paso>
    When consulto Pendientes el <ahora>
    Then la fila de la tarea muestra el primer paso <texto>

    Examples:
      | limite     | primer_paso            | ahora               | texto                               |
      | 2026-11-12 | Separar la ropa blanca | 2026-11-13T00:00:00 | Primer paso: Separar la ropa blanca |
      | 2026-11-10 | Separar la ropa blanca | 2026-11-13T10:00:00 | Primer paso: Separar la ropa blanca |

  # Primer paso en la fila 5
  # Una periódica relativa atrasada también.
  Scenario Outline: Primer paso en la fila 5
    Given una tarea periódica relativa cada <cada> <unidad>
    And la tarea fue completada el <completada>
    And el primer paso de la tarea es <primer_paso>
    When consulto Pendientes el <ahora>
    Then la fila de la tarea muestra el primer paso <texto>

    Examples:
      | cada | unidad | completada          | primer_paso        | ahora               | texto                           |
      | 2    | dias   | 2026-11-10T09:00:00 | Llenar la regadera | 2026-11-14T09:00:00 | Primer paso: Llenar la regadera |

  # Primer paso en la fila 6
  # Una atrasada con el checkbox deshabilitado hasta que abra su ventana
  # (§5.5) lo muestra.
  Scenario Outline: Primer paso en la fila 6
    Given una tarea puntual con fecha límite <limite> creada el <creada>
    And la tarea se puede completar de <desde> a <hasta>
    And el primer paso de la tarea es <primer_paso>
    When consulto Pendientes el <ahora>
    Then el checkbox de la tarea está deshabilitado
    And la fila de la tarea muestra el primer paso <texto>

    Examples:
      | limite     | creada              | desde | hasta | primer_paso            | ahora               | texto                               |
      | 2026-11-10 | 2026-11-01T09:00:00 | 08:00 | 11:00 | Separar la ropa blanca | 2026-11-13T07:00:00 | Primer paso: Separar la ropa blanca |

  # Primer paso en la fila 7
  # Una tarea sin el campo no tiene primer paso: la fila se ve como hoy.
  Scenario Outline: Primer paso en la fila 7
    Given una tarea periódica relativa cada <cada> <unidad>
    When consulto Pendientes el <ahora>
    Then la fila de la tarea no muestra primer paso

    Examples:
      | cada | unidad | ahora               |
      | 2    | dias   | 2026-11-13T10:00:00 |

  # Primer paso en la fila 8
  # Una periódica relativa en espera (completada) no lo muestra.
  Scenario Outline: Primer paso en la fila 8
    Given Mostrar completadas está encendido
    And una tarea periódica relativa cada <cada> <unidad>
    And la tarea fue completada el <completada>
    And el primer paso de la tarea es <primer_paso>
    When consulto Pendientes el <ahora>
    Then la fila de la tarea no muestra primer paso

    Examples:
      | cada | unidad | completada          | primer_paso        | ahora               |
      | 2    | dias   | 2026-11-13T08:00:00 | Llenar la regadera | 2026-11-13T10:00:00 |

  # Primer paso en la fila 9
  # Una periódica de calendario en espera (antes de su ocurrencia) no lo
  # muestra.
  Scenario Outline: Primer paso en la fila 9
    Given una tarea periódica semanal los <dias> creada el <creada>
    And el primer paso de la tarea es <primer_paso>
    When consulto Pendientes el <ahora>
    Then la fila de la tarea no muestra primer paso

    Examples:
      | dias   | creada              | primer_paso         | ahora               |
      | martes | 2026-11-09T08:00:00 | Atar la bolsa llena | 2026-11-09T12:00:00 |

  # Primer paso en la fila 10
  # Una puntual en espera por su horario (fuera de la ventana) no lo muestra.
  Scenario Outline: Primer paso en la fila 10
    Given una tarea puntual sin fecha límite creada el <creada>
    And la tarea se puede completar de <desde> a <hasta>
    And el primer paso de la tarea es <primer_paso>
    When consulto Pendientes el <ahora>
    Then la fila de la tarea no muestra primer paso

    Examples:
      | creada              | desde | hasta | primer_paso            | ahora               |
      | 2026-11-13T06:00:00 | 08:00 | 11:00 | Separar la ropa blanca | 2026-11-13T07:00:00 |

  # Primer paso en la fila 11
  # Dentro de la ventana, la misma tarea está pendiente y sí lo muestra.
  Scenario Outline: Primer paso en la fila 11
    Given una tarea puntual sin fecha límite creada el <creada>
    And la tarea se puede completar de <desde> a <hasta>
    And el primer paso de la tarea es <primer_paso>
    When consulto Pendientes el <ahora>
    Then la fila de la tarea muestra el primer paso <texto>

    Examples:
      | creada              | desde | hasta | primer_paso            | ahora               | texto                               |
      | 2026-11-13T06:00:00 | 08:00 | 11:00 | Separar la ropa blanca | 2026-11-13T08:00:00 | Primer paso: Separar la ropa blanca |

  # Primer paso en la fila 12
  # Una pospuesta (en espera) no lo muestra, sea pendiente (fila 1) o
  # atrasada (fila 2) sin la posposición.
  Scenario Outline: Primer paso en la fila 12
    Given una tarea puntual con fecha límite <limite>
    And el primer paso de la tarea es <primer_paso>
    And la tarea fue pospuesta con la opción <opcion> el <pospuesta>
    When consulto Pendientes el <ahora>
    Then la fila de la tarea no muestra primer paso

    Examples:
      | limite     | primer_paso            | opcion  | pospuesta           | ahora               |
      | 2026-11-20 | Separar la ropa blanca | 3 horas | 2026-11-13T10:00:00 | 2026-11-13T11:30:00 |
      | 2026-11-10 | Separar la ropa blanca | 3 horas | 2026-11-13T10:00:00 | 2026-11-13T11:30:00 |

  # Primer paso en la fila 13
  # Una pausada (con Mostrar pausadas) no lo muestra, aunque sin pausa estaría
  # atrasada.
  Scenario Outline: Primer paso en la fila 13
    Given Mostrar pausadas está encendido
    And una tarea periódica relativa cada <cada> <unidad>
    And la tarea fue completada el <completada>
    And el primer paso de la tarea es <primer_paso>
    And la tarea fue pausada
    When consulto Pendientes el <ahora>
    Then la fila de la tarea no muestra primer paso

    Examples:
      | cada | unidad | completada          | primer_paso        | ahora               |
      | 2    | dias   | 2026-11-10T09:00:00 | Llenar la regadera | 2026-11-14T09:00:00 |

  # Primer paso en la fila 14
  # Al completarla una puntual (con Mostrar completadas) la línea desaparece.
  Scenario Outline: Primer paso en la fila 14
    Given Mostrar completadas está encendido
    And una tarea puntual sin fecha límite
    And el primer paso de la tarea es <primer_paso>
    When toco el checkbox de la tarea el <toque>
    And consulto Pendientes el <ahora>
    Then la fila de la tarea no muestra primer paso

    Examples:
      | primer_paso            | toque               | ahora               |
      | Separar la ropa blanca | 2026-11-13T10:00:00 | 2026-11-13T10:00:00 |

  # Primer paso en la fila 15
  # Al terminar la posposición vuelve sola: pendiente (fila 1) o atrasada
  # (fila 2).
  Scenario Outline: Primer paso en la fila 15
    Given una tarea puntual con fecha límite <limite>
    And el primer paso de la tarea es <primer_paso>
    And la tarea fue pospuesta con la opción <opcion> el <pospuesta>
    When consulto Pendientes el <ahora>
    Then la fila de la tarea muestra el primer paso <texto>

    Examples:
      | limite     | primer_paso            | opcion  | pospuesta           | ahora               | texto                               |
      | 2026-11-20 | Separar la ropa blanca | 3 horas | 2026-11-13T10:00:00 | 2026-11-13T13:00:00 | Primer paso: Separar la ropa blanca |
      | 2026-11-10 | Separar la ropa blanca | 3 horas | 2026-11-13T10:00:00 | 2026-11-13T13:00:00 | Primer paso: Separar la ropa blanca |

  # Primer paso en la fila 16
  # Una periódica que vuelve (se cumple su intervalo) muestra el mismo primer
  # paso. Fila 1: en el momento de volver (pendiente); fila 2: ya atrasada.
  Scenario Outline: Primer paso en la fila 16
    Given una tarea periódica relativa cada <cada> <unidad>
    And la tarea fue completada el <completada>
    And el primer paso de la tarea es <primer_paso>
    When consulto Pendientes el <ahora>
    Then la fila de la tarea muestra el primer paso <texto>

    Examples:
      | cada | unidad | completada          | primer_paso        | ahora               | texto                           |
      | 2    | dias   | 2026-11-10T09:00:00 | Llenar la regadera | 2026-11-12T09:00:00 | Primer paso: Llenar la regadera |
      | 2    | dias   | 2026-11-10T09:00:00 | Llenar la regadera | 2026-11-14T09:00:00 | Primer paso: Llenar la regadera |

  # Primer paso en la fila 17
  # Al reanudarla vuelve sola: la relativa reanudada está pendiente.
  Scenario Outline: Primer paso en la fila 17
    Given una tarea periódica relativa cada <cada> <unidad>
    And la tarea fue completada el <completada>
    And el primer paso de la tarea es <primer_paso>
    And la tarea fue pausada
    When reanudo la tarea el <reanudada>
    And consulto Pendientes el <ahora>
    Then la fila de la tarea muestra el primer paso <texto>

    Examples:
      | cada | unidad | completada          | primer_paso        | reanudada           | ahora               | texto                           |
      | 2    | dias   | 2026-11-12T09:00:00 | Llenar la regadera | 2026-11-13T10:00:00 | 2026-11-13T10:00:00 | Primer paso: Llenar la regadera |

  # Primer paso en la fila 18
  # Al deshacer el completado vuelve sola: la puntual vuelve a pendiente.
  Scenario Outline: Primer paso en la fila 18
    Given una tarea puntual con fecha límite <limite>
    And el primer paso de la tarea es <primer_paso>
    And la tarea fue completada el <completada>
    When borro el completado del <completada>
    And consulto Pendientes el <ahora>
    Then la fila de la tarea muestra el primer paso <texto>

    Examples:
      | limite     | primer_paso            | completada          | ahora               | texto                               |
      | 2026-11-20 | Separar la ropa blanca | 2026-11-13T08:00:00 | 2026-11-13T10:00:00 | Primer paso: Separar la ropa blanca |
