# Spec §6.1. La fila de una tarea `pendiente` o `atrasada` con primer paso
# muestra, en su propia línea, el paso en que va la tarea: «Primer paso: …» en
# el paso 1 y «Paso: …» en otro, nunca la lista entera. Si la tarea tiene dos
# pasos o más, esa línea tiene los botones «Paso anterior» (no en el paso 1) y
# «Hecho». Una tarea de un solo paso se ve como con solo primer paso, sin
# botones.
# "La fila de la tarea muestra el paso T" compara el texto exacto de la línea,
# con su prefijo. "La fila de la tarea no muestra primer paso" vale para las
# dos formas de la línea («Primer paso: …» y «Paso: …»).
Feature: Pasos en la fila

  # Pasos en la fila 1
  # Una tarea de un solo paso se ve como hoy: «Primer paso: …» y sin botones.
  Scenario Outline: Pasos en la fila 1
    Given una tarea puntual sin fecha límite
    And el primer paso de la tarea es <primer_paso>
    When consulto Pendientes en cualquier momento
    Then la fila de la tarea muestra el paso <texto>
    And la fila de la tarea no muestra botones de paso

    Examples:
      | primer_paso            | texto                               |
      | Separar la ropa blanca | Primer paso: Separar la ropa blanca |

  # Pasos en la fila 2
  # Con dos pasos o más, en el paso 1: «Primer paso: …» con «Hecho» y sin «Paso
  # anterior».
  Scenario Outline: Pasos en la fila 2
    Given una tarea puntual sin fecha límite
    And los pasos de la tarea son <pasos>
    When consulto Pendientes en cualquier momento
    Then la fila de la tarea muestra el paso <texto>
    And la fila de la tarea muestra los botones <botones>

    Examples:
      | pasos                                       | texto                               | botones |
      | Separar la ropa blanca, Poner el lavarropas | Primer paso: Separar la ropa blanca | Hecho   |

  # Pasos en la fila 3
  # En otro paso: «Paso: …», sin número ni total ni el resto de la lista, con
  # «Paso anterior» y «Hecho».
  Scenario Outline: Pasos en la fila 3
    Given una tarea puntual sin fecha límite
    And los pasos de la tarea son <pasos>
    And el paso actual de la tarea es <actual>
    When consulto Pendientes en cualquier momento
    Then la fila de la tarea muestra el paso <texto>
    And la fila de la tarea muestra los botones <botones>

    Examples:
      | pasos                                                       | actual | texto                      | botones              |
      | Separar la ropa blanca, Poner el lavarropas, Tender la ropa | 2      | Paso: Poner el lavarropas  | Paso anterior y Hecho |
      | Separar la ropa blanca, Poner el lavarropas, Tender la ropa | 3      | Paso: Tender la ropa       | Paso anterior y Hecho |

  # Pasos en la fila 4
  # El paso se ve completo, sin cortar, también el que no es el primero.
  Scenario Outline: Pasos en la fila 4
    Given una tarea puntual sin fecha límite
    And los pasos de la tarea son <pasos>
    And el paso actual de la tarea es <actual>
    When consulto Pendientes en cualquier momento
    Then la fila de la tarea muestra el paso <texto>

    Examples:
      | pasos                                                                                                                                                              | actual | texto                                                                                                                                  |
      | Separar la ropa blanca, Abrir el cajón de abajo y sacar toda la ropa blanca y separarla en dos pilas: la que va con agua caliente y la que no se mezcla con nada | 2      | Paso: Abrir el cajón de abajo y sacar toda la ropa blanca y separarla en dos pilas: la que va con agua caliente y la que no se mezcla con nada |

  # Pasos en la fila 5
  # Sin pasos ni primer paso, la fila se ve como hoy: sin línea y sin botones.
  Scenario Outline: Pasos en la fila 5
    Given una tarea periódica relativa cada <cada> <unidad>
    When consulto Pendientes el <ahora>
    Then la fila de la tarea no muestra primer paso
    And la fila de la tarea no muestra botones de paso

    Examples:
      | cada | unidad | ahora               |
      | 2    | dias   | 2026-11-13T10:00:00 |

  # Pasos en la fila 6
  # Una puntual atrasada muestra el paso en que va, con sus botones.
  Scenario Outline: Pasos en la fila 6
    Given una tarea puntual con fecha límite <limite>
    And los pasos de la tarea son <pasos>
    And el paso actual de la tarea es <actual>
    When consulto Pendientes el <ahora>
    Then la fila de la tarea muestra el paso <texto>
    And la fila de la tarea muestra los botones <botones>

    Examples:
      | limite     | pasos                                  | actual | ahora               | texto                      | botones               |
      | 2026-11-12 | Llenar la regadera, Regar los helechos | 2      | 2026-11-13T00:00:00 | Paso: Regar los helechos   | Paso anterior y Hecho |

  # Pasos en la fila 7
  # Una periódica relativa pendiente (que ya volvió) también.
  Scenario Outline: Pasos en la fila 7
    Given una tarea periódica relativa cada <cada> <unidad>
    And la tarea fue completada el <completada>
    And los pasos de la tarea son <pasos>
    And el paso actual de la tarea es <actual>
    When consulto Pendientes el <ahora>
    Then la fila de la tarea muestra el paso <texto>
    And la fila de la tarea muestra los botones <botones>

    Examples:
      | cada | unidad | completada          | pasos                                  | actual | ahora               | texto                    | botones               |
      | 2    | dias   | 2026-11-10T09:00:00 | Llenar la regadera, Regar los helechos | 2      | 2026-11-12T09:00:00 | Paso: Regar los helechos | Paso anterior y Hecho |

  # Pasos en la fila 8
  # Una periódica de calendario pendiente también.
  Scenario Outline: Pasos en la fila 8
    Given una tarea periódica semanal los <dias> creada el <creada>
    And los pasos de la tarea son <pasos>
    And el paso actual de la tarea es <actual>
    When consulto Pendientes el <ahora>
    Then la fila de la tarea muestra el paso <texto>
    And la fila de la tarea muestra los botones <botones>

    Examples:
      | dias   | creada              | pasos                                | actual | ahora               | texto                  | botones               |
      | martes | 2026-11-09T08:00:00 | Atar la bolsa llena, Bajar la basura | 2      | 2026-11-10T09:00:00 | Paso: Bajar la basura  | Paso anterior y Hecho |

  # Pasos en la fila 9
  # Una periódica relativa en espera (completada) no muestra línea ni botones.
  Scenario Outline: Pasos en la fila 9
    Given Mostrar completadas está encendido
    And una tarea periódica relativa cada <cada> <unidad>
    And la tarea fue completada el <completada>
    And los pasos de la tarea son <pasos>
    And el paso actual de la tarea es <actual>
    When consulto Pendientes el <ahora>
    Then la fila de la tarea no muestra primer paso
    And la fila de la tarea no muestra botones de paso

    Examples:
      | cada | unidad | completada          | pasos                                  | actual | ahora               |
      | 2    | dias   | 2026-11-13T08:00:00 | Llenar la regadera, Regar los helechos | 2      | 2026-11-13T10:00:00 |

  # Pasos en la fila 10
  # Una pospuesta (en espera) no los muestra, sea pendiente (fila 1) o
  # atrasada (fila 2) sin la posposición.
  Scenario Outline: Pasos en la fila 10
    Given una tarea puntual con fecha límite <limite>
    And los pasos de la tarea son <pasos>
    And el paso actual de la tarea es <actual>
    And la tarea fue pospuesta con la opción <opcion> el <pospuesta>
    When consulto Pendientes el <ahora>
    Then la fila de la tarea no muestra primer paso
    And la fila de la tarea no muestra botones de paso

    Examples:
      | limite     | pasos                                  | actual | opcion  | pospuesta           | ahora               |
      | 2026-11-20 | Llenar la regadera, Regar los helechos | 2      | 3 horas | 2026-11-13T10:00:00 | 2026-11-13T11:30:00 |
      | 2026-11-10 | Llenar la regadera, Regar los helechos | 2      | 3 horas | 2026-11-13T10:00:00 | 2026-11-13T11:30:00 |

  # Pasos en la fila 11
  # Una pausada (con Mostrar pausadas) no los muestra, aunque sin pausa estaría
  # atrasada.
  Scenario Outline: Pasos en la fila 11
    Given Mostrar pausadas está encendido
    And una tarea periódica relativa cada <cada> <unidad>
    And la tarea fue completada el <completada>
    And los pasos de la tarea son <pasos>
    And el paso actual de la tarea es <actual>
    And la tarea fue pausada
    When consulto Pendientes el <ahora>
    Then la fila de la tarea no muestra primer paso
    And la fila de la tarea no muestra botones de paso

    Examples:
      | cada | unidad | completada          | pasos                                  | actual | ahora               |
      | 2    | dias   | 2026-11-10T09:00:00 | Llenar la regadera, Regar los helechos | 2      | 2026-11-14T09:00:00 |

  # Pasos en la fila 12
  # Una puntual en espera por su horario (fuera de la ventana) no los muestra.
  Scenario Outline: Pasos en la fila 12
    Given una tarea puntual sin fecha límite creada el <creada>
    And la tarea se puede completar de <desde> a <hasta>
    And los pasos de la tarea son <pasos>
    And el paso actual de la tarea es <actual>
    When consulto Pendientes el <ahora>
    Then la fila de la tarea no muestra primer paso
    And la fila de la tarea no muestra botones de paso

    Examples:
      | creada              | desde | hasta | pasos                                  | actual | ahora               |
      | 2026-11-13T06:00:00 | 08:00 | 11:00 | Llenar la regadera, Regar los helechos | 2      | 2026-11-13T07:00:00 |

  # Pasos en la fila 13
  # Una periódica de calendario en espera (antes de su ocurrencia) tampoco.
  Scenario Outline: Pasos en la fila 13
    Given una tarea periódica semanal los <dias> creada el <creada>
    And los pasos de la tarea son <pasos>
    And el paso actual de la tarea es <actual>
    When consulto Pendientes el <ahora>
    Then la fila de la tarea no muestra primer paso
    And la fila de la tarea no muestra botones de paso

    Examples:
      | dias   | creada              | pasos                                | actual | ahora               |
      | martes | 2026-11-09T08:00:00 | Atar la bolsa llena, Bajar la basura | 2      | 2026-11-09T12:00:00 |

  # Pasos en la fila 14
  # Al volver sola (termina la posposición) vuelven la línea y los botones.
  # Fila 1: pendiente; fila 2: atrasada.
  Scenario Outline: Pasos en la fila 14
    Given una tarea puntual con fecha límite <limite>
    And los pasos de la tarea son <pasos>
    And el paso actual de la tarea es <actual>
    And la tarea fue pospuesta con la opción <opcion> el <pospuesta>
    When consulto Pendientes el <ahora>
    Then la fila de la tarea muestra el paso <texto>
    And la fila de la tarea muestra los botones <botones>

    Examples:
      | limite     | pasos                                  | actual | opcion  | pospuesta           | ahora               | texto                    | botones               |
      | 2026-11-20 | Llenar la regadera, Regar los helechos | 2      | 3 horas | 2026-11-13T10:00:00 | 2026-11-13T13:00:00 | Paso: Regar los helechos | Paso anterior y Hecho |
      | 2026-11-10 | Llenar la regadera, Regar los helechos | 2      | 3 horas | 2026-11-13T10:00:00 | 2026-11-13T13:00:00 | Paso: Regar los helechos | Paso anterior y Hecho |

  # Pasos en la fila 15
  # Al reanudarla vuelve sola, en el paso en que iba.
  Scenario Outline: Pasos en la fila 15
    Given una tarea periódica relativa cada <cada> <unidad>
    And la tarea fue completada el <completada>
    And los pasos de la tarea son <pasos>
    And el paso actual de la tarea es <actual>
    And la tarea fue pausada
    When reanudo la tarea el <reanudada>
    And consulto Pendientes el <ahora>
    Then la fila de la tarea muestra el paso <texto>
    And la fila de la tarea muestra los botones <botones>

    Examples:
      | cada | unidad | completada          | pasos                                  | actual | reanudada           | ahora               | texto                    | botones               |
      | 2    | dias   | 2026-11-12T09:00:00 | Llenar la regadera, Regar los helechos | 2      | 2026-11-13T10:00:00 | 2026-11-13T10:00:00 | Paso: Regar los helechos | Paso anterior y Hecho |

  # Pasos en la fila 16
  # Al deshacer el completado vuelve sola, en el paso en que iba.
  Scenario Outline: Pasos en la fila 16
    Given una tarea puntual con fecha límite <limite>
    And los pasos de la tarea son <pasos>
    And la tarea fue completada el <completada> en el paso <paso_completado>
    When borro el completado del <completada>
    And consulto Pendientes el <ahora>
    Then la fila de la tarea muestra el paso <texto>
    And la fila de la tarea muestra los botones <botones>

    Examples:
      | limite     | pasos                                                       | completada          | paso_completado | ahora               | texto                     | botones               |
      | 2026-11-20 | Separar la ropa blanca, Poner el lavarropas, Tender la ropa | 2026-11-13T08:00:00 | 2               | 2026-11-13T10:00:00 | Paso: Poner el lavarropas | Paso anterior y Hecho |

  # Pasos en la fila 17
  # Una atrasada con el checkbox deshabilitado hasta que abra su ventana
  # (§5.5) muestra la línea; «Hecho» de un paso que no es el último está
  # habilitado (fila 1) y el del último paso, deshabilitado como el checkbox
  # (fila 2).
  Scenario Outline: Pasos en la fila 17
    Given una tarea puntual con fecha límite <limite> creada el <creada>
    And la tarea se puede completar de <desde> a <hasta>
    And los pasos de la tarea son <pasos>
    And el paso actual de la tarea es <actual>
    When consulto Pendientes el <ahora>
    Then el checkbox de la tarea está deshabilitado
    And la fila de la tarea muestra el paso <texto>
    And el botón Hecho de la tarea está <estado_del_boton>

    Examples:
      | limite     | creada              | desde | hasta | pasos                                  | actual | ahora               | texto                    | estado_del_boton |
      | 2026-11-10 | 2026-11-01T09:00:00 | 08:00 | 11:00 | Llenar la regadera, Regar los helechos | 1      | 2026-11-13T07:00:00 | Primer paso: Llenar la regadera | habilitado    |
      | 2026-11-10 | 2026-11-01T09:00:00 | 08:00 | 11:00 | Llenar la regadera, Regar los helechos | 2      | 2026-11-13T07:00:00 | Paso: Regar los helechos | deshabilitado    |

  # Pasos en la fila 18
  # Dentro de la ventana, el «Hecho» del último paso está habilitado como el
  # checkbox.
  Scenario Outline: Pasos en la fila 18
    Given una tarea puntual sin fecha límite creada el <creada>
    And la tarea se puede completar de <desde> a <hasta>
    And los pasos de la tarea son <pasos>
    And el paso actual de la tarea es <actual>
    When consulto Pendientes el <ahora>
    Then el checkbox de la tarea está habilitado
    And el botón Hecho de la tarea está <estado_del_boton>

    Examples:
      | creada              | desde | hasta | pasos                                  | actual | ahora               | estado_del_boton |
      | 2026-11-13T06:00:00 | 08:00 | 11:00 | Llenar la regadera, Regar los helechos | 2      | 2026-11-13T08:00:00 | habilitado       |

  # Pasos en la fila 19
  # «Hecho» en un paso que no es el último muestra el paso siguiente.
  Scenario Outline: Pasos en la fila 19
    Given una tarea puntual sin fecha límite
    And los pasos de la tarea son <pasos>
    When toco Hecho el <toque>
    And consulto Pendientes el <ahora>
    Then la fila de la tarea muestra el paso <texto>
    And la fila de la tarea muestra los botones <botones>

    Examples:
      | pasos                                       | toque               | ahora               | texto                     | botones               |
      | Separar la ropa blanca, Poner el lavarropas | 2026-11-13T10:00:00 | 2026-11-13T10:00:01 | Paso: Poner el lavarropas | Paso anterior y Hecho |

  # Pasos en la fila 20
  # «Paso anterior» muestra el paso de antes.
  Scenario Outline: Pasos en la fila 20
    Given una tarea puntual sin fecha límite
    And los pasos de la tarea son <pasos>
    And el paso actual de la tarea es <actual>
    When toco Paso anterior
    And consulto Pendientes en cualquier momento
    Then la fila de la tarea muestra el paso <texto>
    And la fila de la tarea muestra los botones <botones>

    Examples:
      | pasos                                       | actual | texto                               | botones |
      | Separar la ropa blanca, Poner el lavarropas | 2      | Primer paso: Separar la ropa blanca | Hecho   |

  # Pasos en la fila 21
  # «Hecho» en el último paso completa la tarea: la línea desaparece.
  Scenario Outline: Pasos en la fila 21
    Given Mostrar completadas está encendido
    And una tarea puntual sin fecha límite
    And los pasos de la tarea son <pasos>
    And el paso actual de la tarea es <actual>
    When toco Hecho el <toque>
    And consulto Pendientes el <ahora>
    Then la fila de la tarea no muestra primer paso
    And la fila de la tarea no muestra botones de paso

    Examples:
      | pasos                                       | actual | toque               | ahora               |
      | Separar la ropa blanca, Poner el lavarropas | 2      | 2026-11-13T10:00:00 | 2026-11-13T10:00:01 |

  # Pasos en la fila 22
  # Una periódica que vuelve arranca del principio: «Primer paso: …» con
  # «Hecho» y sin «Paso anterior».
  Scenario Outline: Pasos en la fila 22
    Given una tarea periódica relativa cada <cada> <unidad>
    And los pasos de la tarea son <pasos>
    And el paso actual de la tarea es <actual>
    When toco el checkbox de la tarea el <toque>
    And consulto Pendientes el <ahora>
    Then la fila de la tarea muestra el paso <texto>
    And la fila de la tarea muestra los botones <botones>

    Examples:
      | cada | unidad | pasos                                  | actual | toque               | ahora               | texto                           | botones |
      | 2    | dias   | Llenar la regadera, Regar los helechos | 2      | 2026-11-13T08:00:00 | 2026-11-15T08:00:00 | Primer paso: Llenar la regadera | Hecho   |

  # Pasos en la fila 23
  # Si al editar queda un solo paso, la fila es la de una tarea de un solo
  # paso: sin botones.
  Scenario Outline: Pasos en la fila 23
    Given una tarea puntual sin fecha límite
    And los pasos de la tarea son <pasos>
    And el paso actual de la tarea es <actual>
    When vacío el paso 2
    And consulto Pendientes en cualquier momento
    Then la fila de la tarea muestra el paso <texto>
    And la fila de la tarea no muestra botones de paso

    Examples:
      | pasos                                       | actual | texto                               |
      | Separar la ropa blanca, Poner el lavarropas | 2      | Primer paso: Separar la ropa blanca |

  # Pasos en la fila 24
  # Si quedan menos pasos que el número en que va la tarea, la fila muestra el
  # último, con sus botones.
  Scenario Outline: Pasos en la fila 24
    Given una tarea puntual sin fecha límite
    And los pasos de la tarea son <pasos>
    And el paso actual de la tarea es <actual>
    When vacío el paso 2
    And consulto Pendientes en cualquier momento
    Then la fila de la tarea muestra el paso <texto>
    And la fila de la tarea muestra los botones <botones>

    Examples:
      | pasos                                                       | actual | texto                | botones               |
      | Separar la ropa blanca, Poner el lavarropas, Tender la ropa | 3      | Paso: Tender la ropa | Paso anterior y Hecho |
