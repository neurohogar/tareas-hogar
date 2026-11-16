# Spec §6.1 (fila de Pendientes), con §4.1 (Versión mínima), §5.5 y §5.9. Si la
# tarea está `pendiente` o `atrasada` y tiene versión mínima, la fila muestra en
# su propia línea «Mínima: » seguido del texto (completo, sin cortar) y el
# botón «Hice la mínima». La línea se ve aunque la tarea no tenga primer paso,
# y debajo de la línea del paso si la hay. No se ve en las filas `en espera`
# (tampoco las pospuestas ni las completadas) ni en las pausadas; se decide con
# el estado de cada momento. Una `atrasada` con el checkbox deshabilitado hasta
# que abra su ventana la muestra, con el botón deshabilitado. La app no la
# ofrece distinto según el atraso ni cuántas veces se hizo.
# "la fila de la tarea muestra la mínima T" afirma el texto exacto de la línea,
# con su prefijo; la lista consultada tiene una sola fila. El estilo, el botón
# de texto y tocar la línea los cubre la suite QA.
# Semana de referencia: viernes 2026-11-13.
Feature: Versión mínima en la fila

  # Versión mínima en la fila 1
  # Una pendiente con versión mínima la muestra con el prefijo «Mínima: »,
  # completa (fila 2: larga, sin cortar), con el botón «Hice la mínima»
  # habilitado.
  Scenario Outline: Versión mínima en la fila 1
    Given una tarea puntual sin fecha límite
    And la versión mínima de la tarea es <minima>
    When consulto Pendientes en cualquier momento
    Then la fila de la tarea muestra la mínima <texto>
    And el botón Hice la mínima de la tarea está habilitado

    Examples:
      | minima                                                                                                                         | texto                                                                                                                                       |
      | Solo el inodoro                                                                                                                | Mínima: Solo el inodoro                                                                                                                     |
      | Abrir el cajón de abajo, sacar solo la ropa blanca y separarla en dos pilas: la que va con agua caliente y la que no se mezcla | Mínima: Abrir el cajón de abajo, sacar solo la ropa blanca y separarla en dos pilas: la que va con agua caliente y la que no se mezcla |

  # Versión mínima en la fila 2
  # También en una periódica relativa pendiente.
  Scenario Outline: Versión mínima en la fila 2
    Given una tarea periódica relativa cada <cada> <unidad>
    And la versión mínima de la tarea es <minima>
    When consulto Pendientes el <ahora>
    Then la fila de la tarea muestra la mínima <texto>

    Examples:
      | cada | unidad | minima            | ahora               | texto                     |
      | 2    | dias   | Solo los helechos | 2026-11-13T10:00:00 | Mínima: Solo los helechos |

  # Versión mínima en la fila 3
  # También en una periódica de calendario pendiente (el día de su ocurrencia).
  Scenario Outline: Versión mínima en la fila 3
    Given una tarea periódica semanal los <dias> creada el <creada>
    And la versión mínima de la tarea es <minima>
    When consulto Pendientes el <ahora>
    Then la fila de la tarea muestra la mínima <texto>

    Examples:
      | dias   | creada              | minima               | ahora               | texto                         |
      | martes | 2026-11-09T08:00:00 | Solo la de la cocina | 2026-11-10T09:00:00 | Mínima: Solo la de la cocina  |

  # Versión mínima en la fila 4
  # Una puntual atrasada también la muestra, con el botón habilitado. Fila 1:
  # recién atrasada (a las 00:00 del día siguiente); fila 2: días después.
  Scenario Outline: Versión mínima en la fila 4
    Given una tarea puntual con fecha límite <limite>
    And la versión mínima de la tarea es <minima>
    When consulto Pendientes el <ahora>
    Then la fila de la tarea muestra la mínima <texto>
    And el botón Hice la mínima de la tarea está habilitado

    Examples:
      | limite     | minima          | ahora               | texto                   |
      | 2026-11-12 | Solo el inodoro | 2026-11-13T00:00:00 | Mínima: Solo el inodoro |
      | 2026-11-10 | Solo el inodoro | 2026-11-13T10:00:00 | Mínima: Solo el inodoro |

  # Versión mínima en la fila 5
  # Una periódica relativa atrasada también.
  Scenario Outline: Versión mínima en la fila 5
    Given una tarea periódica relativa cada <cada> <unidad>
    And la tarea fue completada el <completada>
    And la versión mínima de la tarea es <minima>
    When consulto Pendientes el <ahora>
    Then la fila de la tarea muestra la mínima <texto>

    Examples:
      | cada | unidad | completada          | minima            | ahora               | texto                     |
      | 2    | dias   | 2026-11-10T09:00:00 | Solo los helechos | 2026-11-14T09:00:00 | Mínima: Solo los helechos |

  # Versión mínima en la fila 6
  # Una atrasada con el checkbox deshabilitado hasta que abra su ventana
  # (§5.5) la muestra, con «Hice la mínima» deshabilitado como el checkbox.
  Scenario Outline: Versión mínima en la fila 6
    Given una tarea puntual con fecha límite <limite> creada el <creada>
    And la tarea se puede completar de <desde> a <hasta>
    And la versión mínima de la tarea es <minima>
    When consulto Pendientes el <ahora>
    Then el checkbox de la tarea está deshabilitado
    And la fila de la tarea muestra la mínima <texto>
    And el botón Hice la mínima de la tarea está deshabilitado

    Examples:
      | limite     | creada              | desde | hasta | minima          | ahora               | texto                   |
      | 2026-11-10 | 2026-11-01T09:00:00 | 08:00 | 11:00 | Solo el inodoro | 2026-11-13T07:00:00 | Mínima: Solo el inodoro |

  # Versión mínima en la fila 7
  # Dentro de la ventana, la misma tarea tiene el checkbox y «Hice la mínima»
  # habilitados.
  Scenario Outline: Versión mínima en la fila 7
    Given una tarea puntual sin fecha límite creada el <creada>
    And la tarea se puede completar de <desde> a <hasta>
    And la versión mínima de la tarea es <minima>
    When consulto Pendientes el <ahora>
    Then el checkbox de la tarea está habilitado
    And la fila de la tarea muestra la mínima <texto>
    And el botón Hice la mínima de la tarea está habilitado

    Examples:
      | creada              | desde | hasta | minima          | ahora               | texto                   |
      | 2026-11-13T06:00:00 | 08:00 | 11:00 | Solo el inodoro | 2026-11-13T08:00:00 | Mínima: Solo el inodoro |

  # Versión mínima en la fila 8
  # Una tarea sin el campo no tiene versión mínima: la fila se ve como hoy.
  Scenario Outline: Versión mínima en la fila 8
    Given una tarea periódica relativa cada <cada> <unidad>
    When consulto Pendientes el <ahora>
    Then la fila de la tarea no muestra mínima

    Examples:
      | cada | unidad | ahora               |
      | 2    | dias   | 2026-11-13T10:00:00 |

  # Versión mínima en la fila 9
  # Una periódica relativa en espera (completada) no la muestra.
  Scenario Outline: Versión mínima en la fila 9
    Given Mostrar completadas está encendido
    And una tarea periódica relativa cada <cada> <unidad>
    And la tarea fue completada el <completada>
    And la versión mínima de la tarea es <minima>
    When consulto Pendientes el <ahora>
    Then la fila de la tarea no muestra mínima

    Examples:
      | cada | unidad | completada          | minima            | ahora               |
      | 2    | dias   | 2026-11-13T08:00:00 | Solo los helechos | 2026-11-13T10:00:00 |

  # Versión mínima en la fila 10
  # Una periódica de calendario en espera (antes de su ocurrencia) no la
  # muestra.
  Scenario Outline: Versión mínima en la fila 10
    Given una tarea periódica semanal los <dias> creada el <creada>
    And la versión mínima de la tarea es <minima>
    When consulto Pendientes el <ahora>
    Then la fila de la tarea no muestra mínima

    Examples:
      | dias   | creada              | minima               | ahora               |
      | martes | 2026-11-09T08:00:00 | Solo la de la cocina | 2026-11-09T12:00:00 |

  # Versión mínima en la fila 11
  # Una puntual en espera por su horario (fuera de la ventana) no la muestra.
  Scenario Outline: Versión mínima en la fila 11
    Given una tarea puntual sin fecha límite creada el <creada>
    And la tarea se puede completar de <desde> a <hasta>
    And la versión mínima de la tarea es <minima>
    When consulto Pendientes el <ahora>
    Then la fila de la tarea no muestra mínima

    Examples:
      | creada              | desde | hasta | minima          | ahora               |
      | 2026-11-13T06:00:00 | 08:00 | 11:00 | Solo el inodoro | 2026-11-13T07:00:00 |

  # Versión mínima en la fila 12
  # Una pospuesta (en espera) no la muestra, sea pendiente (fila 1) o atrasada
  # (fila 2) sin la posposición; el checkbox sigue pudiendo completarla entera
  # (§5.9).
  Scenario Outline: Versión mínima en la fila 12
    Given una tarea puntual con fecha límite <limite>
    And la versión mínima de la tarea es <minima>
    And la tarea fue pospuesta con la opción <opcion> el <pospuesta>
    When consulto Pendientes el <ahora>
    Then la fila de la tarea no muestra mínima
    And el checkbox de la tarea está habilitado

    Examples:
      | limite     | minima          | opcion  | pospuesta           | ahora               |
      | 2026-11-20 | Solo el inodoro | 3 horas | 2026-11-13T10:00:00 | 2026-11-13T11:30:00 |
      | 2026-11-10 | Solo el inodoro | 3 horas | 2026-11-13T10:00:00 | 2026-11-13T11:30:00 |

  # Versión mínima en la fila 13
  # Una pausada (con Mostrar pausadas) no la muestra, aunque sin pausa estaría
  # atrasada.
  Scenario Outline: Versión mínima en la fila 13
    Given Mostrar pausadas está encendido
    And una tarea periódica relativa cada <cada> <unidad>
    And la tarea fue completada el <completada>
    And la versión mínima de la tarea es <minima>
    And la tarea fue pausada
    When consulto Pendientes el <ahora>
    Then la fila de la tarea no muestra mínima

    Examples:
      | cada | unidad | completada          | minima            | ahora               |
      | 2    | dias   | 2026-11-10T09:00:00 | Solo los helechos | 2026-11-14T09:00:00 |

  # Versión mínima en la fila 14
  # Al completarla entera una puntual (con Mostrar completadas) la línea
  # desaparece.
  Scenario Outline: Versión mínima en la fila 14
    Given Mostrar completadas está encendido
    And una tarea puntual sin fecha límite
    And la versión mínima de la tarea es <minima>
    When toco el checkbox de la tarea el <toque>
    And consulto Pendientes el <ahora>
    Then la fila de la tarea no muestra mínima

    Examples:
      | minima          | toque               | ahora               |
      | Solo el inodoro | 2026-11-13T10:00:00 | 2026-11-13T10:00:00 |

  # Versión mínima en la fila 15
  # Al terminar la posposición vuelve sola: pendiente (fila 1) o atrasada
  # (fila 2).
  Scenario Outline: Versión mínima en la fila 15
    Given una tarea puntual con fecha límite <limite>
    And la versión mínima de la tarea es <minima>
    And la tarea fue pospuesta con la opción <opcion> el <pospuesta>
    When consulto Pendientes el <ahora>
    Then la fila de la tarea muestra la mínima <texto>

    Examples:
      | limite     | minima          | opcion  | pospuesta           | ahora               | texto                   |
      | 2026-11-20 | Solo el inodoro | 3 horas | 2026-11-13T10:00:00 | 2026-11-13T13:00:00 | Mínima: Solo el inodoro |
      | 2026-11-10 | Solo el inodoro | 3 horas | 2026-11-13T10:00:00 | 2026-11-13T13:00:00 | Mínima: Solo el inodoro |

  # Versión mínima en la fila 16
  # Al reanudar una pausada vuelve sola.
  Scenario Outline: Versión mínima en la fila 16
    Given una tarea periódica relativa cada <cada> <unidad>
    And la tarea fue completada el <completada>
    And la versión mínima de la tarea es <minima>
    And la tarea fue pausada
    When reanudo la tarea el <reanudada>
    And consulto Pendientes el <ahora>
    Then la fila de la tarea muestra la mínima <texto>

    Examples:
      | cada | unidad | completada          | minima            | reanudada           | ahora               | texto                     |
      | 2    | dias   | 2026-11-10T09:00:00 | Solo los helechos | 2026-11-13T10:00:00 | 2026-11-14T09:00:00 | Mínima: Solo los helechos |

  # Versión mínima en la fila 17
  # La línea se ve aunque la tarea no tenga primer paso (fila 1), y con primer
  # paso la fila muestra las dos: el paso y la mínima (fila 2).
  Scenario Outline: Versión mínima en la fila 17
    Given una tarea puntual sin fecha límite
    And el primer paso de la tarea es <primer_paso>
    And la versión mínima de la tarea es <minima>
    When consulto Pendientes en cualquier momento
    Then la fila de la tarea muestra el primer paso <texto_paso>
    And la fila de la tarea muestra la mínima <texto>

    Examples:
      | primer_paso            | minima          | texto_paso                          | texto                   |
      | Separar la ropa blanca | Solo el inodoro | Primer paso: Separar la ropa blanca | Mínima: Solo el inodoro |

  # Versión mínima en la fila 18
  # Con pasos, la línea de la mínima se ve en cualquier paso, debajo de la del
  # paso en que va la tarea.
  Scenario Outline: Versión mínima en la fila 18
    Given una tarea puntual sin fecha límite
    And los pasos de la tarea son <pasos>
    And el paso actual de la tarea es <actual>
    And la versión mínima de la tarea es <minima>
    When consulto Pendientes en cualquier momento
    Then la fila de la tarea muestra el paso <texto_paso>
    And la fila de la tarea muestra la mínima <texto>

    Examples:
      | pasos                                                       | actual | minima          | texto_paso                          | texto                   |
      | Separar la ropa blanca, Poner el lavarropas, Tender la ropa | 1      | Solo el inodoro | Primer paso: Separar la ropa blanca | Mínima: Solo el inodoro |
      | Separar la ropa blanca, Poner el lavarropas, Tender la ropa | 2      | Solo el inodoro | Paso: Poner el lavarropas           | Mínima: Solo el inodoro |
      | Separar la ropa blanca, Poner el lavarropas, Tender la ropa | 3      | Solo el inodoro | Paso: Tender la ropa                | Mínima: Solo el inodoro |

  # Versión mínima en la fila 19
  # La app no la ofrece distinto según cuántas veces se hizo: una periódica
  # que ya se completó dos veces con la mínima, al volver pendiente, la
  # muestra igual.
  Scenario Outline: Versión mínima en la fila 19
    Given una tarea periódica relativa cada <cada> <unidad>
    And la tarea fue completada el <primera> con la mínima
    And la tarea fue completada el <segunda> con la mínima
    And la versión mínima de la tarea es <minima>
    When consulto Pendientes el <ahora>
    Then la fila de la tarea muestra la mínima <texto>
    And el botón Hice la mínima de la tarea está habilitado

    Examples:
      | cada | unidad | primera             | segunda             | minima            | ahora               | texto                     |
      | 2    | dias   | 2026-11-08T09:00:00 | 2026-11-10T09:00:00 | Solo los helechos | 2026-11-13T09:00:00 | Mínima: Solo los helechos |
