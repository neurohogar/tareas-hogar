# Spec §6.1 (texto de fecha y de distancia), con §5.1–§5.5 y §5.8. Solo las
# filas atrasadas («Tocaba …») y en espera («Vuelve …») llevan texto de fecha y
# de distancia. Las filas pendientes, las pausadas (aunque estén atrasadas o en
# espera sin la pausa) y las puntuales completadas no muestran ninguno: nada
# de «Tocaba», «Vuelve» ni de fecha o distancia.
# "la fila de la tarea no muestra texto de fecha" afirma que la lista tiene una
# sola fila y que no tiene texto de fecha ni de distancia. Una puntual sin
# fecha límite nunca está atrasada, así que nunca lleva «Tocaba». Cuando el
# paso no da creadaEn, la tarea se creó antes de cualquier otra fecha del
# escenario. Semana de referencia: viernes 2026-11-13.
Feature: Fila sin texto de fecha

  # Fila sin texto de fecha 1
  # Puntual pendiente con fecha límite: hasta el último segundo del día límite.
  Scenario Outline: Fila sin texto de fecha 1
    Given una tarea puntual con fecha límite <limite>
    When consulto Pendientes el <ahora>
    Then la fila de la tarea no muestra texto de fecha

    Examples:
      | limite     | ahora               |
      | 2026-11-13 | 2026-11-13T10:00:00 |
      | 2026-11-13 | 2026-11-13T23:59:59 |
      | 2026-11-20 | 2026-11-13T10:00:00 |

  # Fila sin texto de fecha 2
  # Puntual sin fecha límite: nunca está atrasada, por mucho tiempo que pase.
  Scenario Outline: Fila sin texto de fecha 2
    Given una tarea puntual sin fecha límite
    When consulto Pendientes el <ahora>
    Then la fila de la tarea no muestra texto de fecha

    Examples:
      | ahora               |
      | 2026-11-13T10:00:00 |
      | 2027-11-13T10:00:00 |

  # Fila sin texto de fecha 3
  # Relativa pendiente, de V (inclusive) hasta V + intervalo (exclusive).
  Scenario Outline: Fila sin texto de fecha 3
    Given una tarea periódica relativa cada <cada> <unidad>
    And la tarea fue completada el <completada>
    When consulto Pendientes el <ahora>
    Then la fila de la tarea no muestra texto de fecha

    Examples:
      | cada | unidad | completada          | ahora               |
      | 2    | dias   | 2026-11-11T10:00:00 | 2026-11-13T10:00:00 |
      | 4    | horas  | 2026-11-13T04:00:00 | 2026-11-13T11:59:59 |

  # Fila sin texto de fecha 4
  # Relativa nunca completada: pendiente, por mucho tiempo que pase.
  Scenario Outline: Fila sin texto de fecha 4
    Given una tarea periódica relativa nunca completada
    When consulto Pendientes el <ahora>
    Then la fila de la tarea no muestra texto de fecha

    Examples:
      | ahora               |
      | 2026-11-13T10:00:00 |
      | 2026-12-13T10:00:00 |

  # Fila sin texto de fecha 5
  # Calendario pendiente el día de la ocurrencia, de las 00:00 a las 23:59:59.
  Scenario Outline: Fila sin texto de fecha 5
    Given una tarea periódica semanal los <dias> creada el <creada>
    When consulto Pendientes el <ahora>
    Then la fila de la tarea no muestra texto de fecha

    Examples:
      | dias    | creada              | ahora               |
      | viernes | 2026-11-12T08:00:00 | 2026-11-13T00:00:00 |
      | viernes | 2026-11-12T08:00:00 | 2026-11-13T23:59:59 |

  # Fila sin texto de fecha 6
  # Con horario, pendiente dentro de la ventana (desde inclusive, hasta
  # exclusive).
  Scenario Outline: Fila sin texto de fecha 6
    Given una tarea periódica semanal los <dias> creada el <creada>
    And la tarea se puede completar de <desde> a <hasta>
    When consulto Pendientes el <ahora>
    Then la fila de la tarea no muestra texto de fecha

    Examples:
      | dias    | creada              | desde | hasta | ahora               |
      | viernes | 2026-11-12T08:00:00 | 09:00 | 11:00 | 2026-11-13T09:00:00 |
      | viernes | 2026-11-12T08:00:00 | 09:00 | 11:00 | 2026-11-13T10:59:59 |

  # Fila sin texto de fecha 7
  # Puntual completada (con Mostrar completadas): sin texto de regreso, porque
  # no vuelve.
  Scenario Outline: Fila sin texto de fecha 7
    Given Mostrar completadas está encendido
    And una tarea puntual sin fecha límite
    And la tarea fue completada el <completada>
    When consulto Pendientes el <ahora>
    Then la fila de la tarea no muestra texto de fecha

    Examples:
      | completada          | ahora               |
      | 2026-11-12T09:00:00 | 2026-11-13T10:00:00 |
      | 2026-11-13T09:30:00 | 2026-11-13T10:00:00 |

  # Fila sin texto de fecha 8
  # Puntual con horario completada, que fuera de la ventana está en espera hasta
  # la próxima: sigue completada y sin texto de regreso.
  Scenario Outline: Fila sin texto de fecha 8
    Given Mostrar completadas está encendido
    And una tarea puntual sin fecha límite creada el <creada>
    And la tarea se puede completar de <desde> a <hasta>
    And la tarea fue completada el <completada>
    When consulto Pendientes el <ahora>
    Then la fila de la tarea no muestra texto de fecha

    Examples:
      | creada              | desde | hasta | completada          | ahora               |
      | 2026-11-13T06:00:00 | 08:00 | 11:00 | 2026-11-13T09:00:00 | 2026-11-13T12:00:00 |

  # Fila sin texto de fecha 9
  # Pausada que sin la pausa estaría atrasada: dice «Pausada», sin «Tocaba».
  Scenario Outline: Fila sin texto de fecha 9
    Given Mostrar pausadas está encendido
    And una tarea periódica relativa cada <cada> <unidad>
    And la tarea fue completada el <completada>
    And la tarea fue pausada
    When consulto Pendientes el <ahora>
    Then la fila de la tarea no muestra texto de fecha

    Examples:
      | cada | unidad | completada          | ahora               |
      | 1    | dias   | 2026-11-10T09:00:00 | 2026-11-13T10:00:00 |

  # Fila sin texto de fecha 10
  # Pausada que sin la pausa estaría en espera: dice «Pausada», sin «Vuelve».
  Scenario Outline: Fila sin texto de fecha 10
    Given Mostrar pausadas está encendido
    And una tarea periódica relativa cada <cada> <unidad>
    And la tarea fue completada el <completada>
    And la tarea fue pausada
    When consulto Pendientes el <ahora>
    Then la fila de la tarea no muestra texto de fecha

    Examples:
      | cada | unidad | completada          | ahora               |
      | 8    | horas  | 2026-11-13T10:00:00 | 2026-11-13T12:00:00 |
