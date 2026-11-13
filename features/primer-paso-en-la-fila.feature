# mutation-stamp: sha256=f359251417a574c488649ff1770ece4a411940faec3d8e75517a6d29434aa4e2
# acceptance-mutation-manifest-begin
# {"version":1,"tested_at":"2026-11-13T21:49:33.103258181Z","feature_name":"Primer paso en la fila","feature_path":"features/primer-paso-en-la-fila.feature","background_hash":"74234e98afe7498fb5daf1f36ac2d78acc339464f950703b8c019892f982b90b","implementation_hash":"sha256:f6334af792236c8ee46d6da3fd4255343ec1c32bd74ab51f5a3f84bd6f505b63","scenarios":[{"index":0,"name":"Primer paso en la fila 1","scenario_hash":"52bb72d962ca10438ce1f4488d0e0ae91fdd932a289f2cc8769411914008bd5c","mutation_count":4,"result":{"Total":4,"Killed":4,"Survived":0,"Errors":0},"tested_at":"2026-11-13T21:49:33.103258181Z"},{"index":1,"name":"Primer paso en la fila 2","scenario_hash":"2d9ef656e674d1b5e36c1ebd27546e00f6a4b697c5e51b03fdabd3061fde39ef","mutation_count":2,"result":{"Total":2,"Killed":2,"Survived":0,"Errors":0},"tested_at":"2026-11-13T21:49:33.103258181Z"},{"index":2,"name":"Primer paso en la fila 3","scenario_hash":"3892bbdc3aac4f02432ce3fc899ccc8bf01ea1b35eab05c36daca97373dbf52a","mutation_count":4,"result":{"Total":4,"Killed":4,"Survived":0,"Errors":0},"tested_at":"2026-11-13T21:49:33.103258181Z"},{"index":3,"name":"Primer paso en la fila 4","scenario_hash":"60a6991841ea716362a72d76fd98b5817c34235a61196869ab2dff2d10b099ab","mutation_count":4,"result":{"Total":4,"Killed":4,"Survived":0,"Errors":0},"tested_at":"2026-11-13T21:49:33.103258181Z"},{"index":4,"name":"Primer paso en la fila 5","scenario_hash":"68ff07ea2432c1878056dfdab089143fdda600f79d9f1d69e3cef4633ef9325e","mutation_count":4,"result":{"Total":4,"Killed":4,"Survived":0,"Errors":0},"tested_at":"2026-11-13T21:49:33.103258181Z"},{"index":5,"name":"Primer paso en la fila 6","scenario_hash":"91c7d757156e0a86325f463aec93012108d9455ed5eca1659f2563a1f8a080ed","mutation_count":4,"result":{"Total":4,"Killed":4,"Survived":0,"Errors":0},"tested_at":"2026-11-13T21:49:33.103258181Z"},{"index":7,"name":"Primer paso en la fila 8","scenario_hash":"ef034edbd4bc1e2ff5b55a3ae6542ca8e2b8610bb06b797da92f4beafc4b2598","mutation_count":1,"result":{"Total":1,"Killed":1,"Survived":0,"Errors":0},"tested_at":"2026-11-13T21:49:33.103258181Z"},{"index":8,"name":"Primer paso en la fila 9","scenario_hash":"532620479b651d950995d45eea2e37aaeeed04ff5793b43f401bd83711ab9350","mutation_count":2,"result":{"Total":2,"Killed":2,"Survived":0,"Errors":0},"tested_at":"2026-11-13T21:49:33.103258181Z"},{"index":9,"name":"Primer paso en la fila 10","scenario_hash":"2d4e21e090caf9189cf60b6ca8b6a600b393e9e66bbe253bd15068ead72c9382","mutation_count":2,"result":{"Total":2,"Killed":2,"Survived":0,"Errors":0},"tested_at":"2026-11-13T21:49:33.103258181Z"},{"index":10,"name":"Primer paso en la fila 11","scenario_hash":"4362cb31e07d249916641131b6ebfe6cbc940a8a0558897f96e0f23642467af0","mutation_count":7,"result":{"Total":7,"Killed":7,"Survived":0,"Errors":0},"tested_at":"2026-11-13T21:49:33.103258181Z"},{"index":11,"name":"Primer paso en la fila 12","scenario_hash":"5875dee1a685fc489f02d1cdb1b8359a42623661b6219ca7bbc93dae977b3123","mutation_count":6,"result":{"Total":6,"Killed":6,"Survived":0,"Errors":0},"tested_at":"2026-11-13T21:49:33.103258181Z"},{"index":14,"name":"Primer paso en la fila 15","scenario_hash":"d32ceeb0064bf68bdff61e07e994f0f2b889cb2199d291b64a5331030b9307f6","mutation_count":14,"result":{"Total":14,"Killed":14,"Survived":0,"Errors":0},"tested_at":"2026-11-13T21:49:33.103258181Z"},{"index":15,"name":"Primer paso en la fila 16","scenario_hash":"032e0d0674672fcceb02505a5c0265e74d455908bf8e39b8b6834fd559eb70dc","mutation_count":11,"result":{"Total":11,"Killed":11,"Survived":0,"Errors":0},"tested_at":"2026-11-13T21:49:33.103258181Z"},{"index":16,"name":"Primer paso en la fila 17","scenario_hash":"7ae06ae65621ba09b6e93203a0065f40c69fe4bd32d04f147bd99fa9e2146943","mutation_count":3,"result":{"Total":3,"Killed":3,"Survived":0,"Errors":0},"tested_at":"2026-11-13T21:49:33.103258181Z"},{"index":17,"name":"Primer paso en la fila 18","scenario_hash":"c9420742cc92289fa57c41615eb6c768894d3ce27a4fa27ec3bdd302ac9adb4a","mutation_count":2,"result":{"Total":2,"Killed":2,"Survived":0,"Errors":0},"tested_at":"2026-11-13T21:49:33.103258181Z"}]}
# acceptance-mutation-manifest-end

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
