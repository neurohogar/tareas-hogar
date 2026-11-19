# mutation-stamp: sha256=f359251417a574c488649ff1770ece4a411940faec3d8e75517a6d29434aa4e2
# acceptance-mutation-manifest-begin
# {"version":1,"tested_at":"2026-11-16T01:59:20.907360940Z","feature_name":"Primer paso en la fila","feature_path":"features/primer-paso-en-la-fila.feature","background_hash":"74234e98afe7498fb5daf1f36ac2d78acc339464f950703b8c019892f982b90b","implementation_hash":"sha256:f6334af792236c8ee46d6da3fd4255343ec1c32bd74ab51f5a3f84bd6f505b63","scenarios":[{"index":0,"name":"Primer paso en la fila 1","scenario_hash":"52bb72d962ca10438ce1f4488d0e0ae91fdd932a289f2cc8769411914008bd5c","mutation_count":4,"result":{"Total":4,"Killed":4,"Survived":0,"Errors":0},"tested_at":"2026-11-16T01:59:20.907360940Z"},{"index":1,"name":"Primer paso en la fila 2","scenario_hash":"2d9ef656e674d1b5e36c1ebd27546e00f6a4b697c5e51b03fdabd3061fde39ef","mutation_count":2,"result":{"Total":2,"Killed":2,"Survived":0,"Errors":0},"tested_at":"2026-11-16T01:59:20.907360940Z"},{"index":2,"name":"Primer paso en la fila 3","scenario_hash":"3892bbdc3aac4f02432ce3fc899ccc8bf01ea1b35eab05c36daca97373dbf52a","mutation_count":4,"result":{"Total":4,"Killed":4,"Survived":0,"Errors":0},"tested_at":"2026-11-16T01:59:20.907360940Z"},{"index":3,"name":"Primer paso en la fila 4","scenario_hash":"60a6991841ea716362a72d76fd98b5817c34235a61196869ab2dff2d10b099ab","mutation_count":4,"result":{"Total":4,"Killed":4,"Survived":0,"Errors":0},"tested_at":"2026-11-16T01:59:20.907360940Z"},{"index":4,"name":"Primer paso en la fila 5","scenario_hash":"68ff07ea2432c1878056dfdab089143fdda600f79d9f1d69e3cef4633ef9325e","mutation_count":4,"result":{"Total":4,"Killed":4,"Survived":0,"Errors":0},"tested_at":"2026-11-16T01:59:20.907360940Z"},{"index":5,"name":"Primer paso en la fila 6","scenario_hash":"91c7d757156e0a86325f463aec93012108d9455ed5eca1659f2563a1f8a080ed","mutation_count":4,"result":{"Total":4,"Killed":4,"Survived":0,"Errors":0},"tested_at":"2026-11-16T01:59:20.907360940Z"},{"index":7,"name":"Primer paso en la fila 8","scenario_hash":"ef034edbd4bc1e2ff5b55a3ae6542ca8e2b8610bb06b797da92f4beafc4b2598","mutation_count":1,"result":{"Total":1,"Killed":1,"Survived":0,"Errors":0},"tested_at":"2026-11-16T01:59:20.907360940Z"},{"index":8,"name":"Primer paso en la fila 9","scenario_hash":"532620479b651d950995d45eea2e37aaeeed04ff5793b43f401bd83711ab9350","mutation_count":2,"result":{"Total":2,"Killed":2,"Survived":0,"Errors":0},"tested_at":"2026-11-16T01:59:20.907360940Z"},{"index":9,"name":"Primer paso en la fila 10","scenario_hash":"2d4e21e090caf9189cf60b6ca8b6a600b393e9e66bbe253bd15068ead72c9382","mutation_count":2,"result":{"Total":2,"Killed":2,"Survived":0,"Errors":0},"tested_at":"2026-11-16T01:59:20.907360940Z"},{"index":10,"name":"Primer paso en la fila 11","scenario_hash":"4362cb31e07d249916641131b6ebfe6cbc940a8a0558897f96e0f23642467af0","mutation_count":7,"result":{"Total":7,"Killed":7,"Survived":0,"Errors":0},"tested_at":"2026-11-16T01:59:20.907360940Z"},{"index":11,"name":"Primer paso en la fila 12","scenario_hash":"5875dee1a685fc489f02d1cdb1b8359a42623661b6219ca7bbc93dae977b3123","mutation_count":6,"result":{"Total":6,"Killed":6,"Survived":0,"Errors":0},"tested_at":"2026-11-16T01:59:20.907360940Z"},{"index":14,"name":"Primer paso en la fila 15","scenario_hash":"d32ceeb0064bf68bdff61e07e994f0f2b889cb2199d291b64a5331030b9307f6","mutation_count":14,"result":{"Total":14,"Killed":14,"Survived":0,"Errors":0},"tested_at":"2026-11-16T01:59:20.907360940Z"},{"index":15,"name":"Primer paso en la fila 16","scenario_hash":"032e0d0674672fcceb02505a5c0265e74d455908bf8e39b8b6834fd559eb70dc","mutation_count":11,"result":{"Total":11,"Killed":11,"Survived":0,"Errors":0},"tested_at":"2026-11-16T01:59:20.907360940Z"},{"index":16,"name":"Primer paso en la fila 17","scenario_hash":"7ae06ae65621ba09b6e93203a0065f40c69fe4bd32d04f147bd99fa9e2146943","mutation_count":3,"result":{"Total":3,"Killed":3,"Survived":0,"Errors":0},"tested_at":"2026-11-16T01:59:20.907360940Z"},{"index":17,"name":"Primer paso en la fila 18","scenario_hash":"c9420742cc92289fa57c41615eb6c768894d3ce27a4fa27ec3bdd302ac9adb4a","mutation_count":2,"result":{"Total":2,"Killed":2,"Survived":0,"Errors":0},"tested_at":"2026-11-16T01:59:20.907360940Z"}]}
# acceptance-mutation-manifest-end

Feature: First step in the row

  # Primer paso en la fila 1
  # Una pendiente con primer paso lo muestra con el prefijo «Primer paso: »,
  # completo (fila 2: largo, sin cortar).
  Scenario Outline: First step in the row 1
    Given a one-off task without a due date
    And the first step of the task is <first_step>
    When I query Pendientes at any moment
    Then the task row shows the first step <text>

    Examples:
      | first_step                                                                                                                     | text                                                                                                                                        |
      | Separar la ropa blanca                                                                                                         | Primer paso: Separar la ropa blanca                                                                                                         |
      | Abrir el cajón de abajo, sacar toda la ropa blanca y separarla en dos pilas: la que va con agua caliente y la que no se mezcla | Primer paso: Abrir el cajón de abajo, sacar toda la ropa blanca y separarla en dos pilas: la que va con agua caliente y la que no se mezcla |

  # Primer paso en la fila 2
  # También en una periódica relativa pendiente.
  Scenario Outline: First step in the row 2
    Given a relative recurring task every <every> <unit>
    And the first step of the task is <first_step>
    When I query Pendientes on <now>
    Then the task row shows the first step <text>

    Examples:
      | every | unit   | first_step         | now                 | text                            |
      | 2    | dias   | Llenar la regadera | 2026-11-13T10:00:00 | Primer paso: Llenar la regadera |

  # Primer paso en la fila 3
  # También en una periódica de calendario pendiente (el día de su ocurrencia).
  Scenario Outline: First step in the row 3
    Given a weekly recurring task on <days> created on <created>
    And the first step of the task is <first_step>
    When I query Pendientes on <now>
    Then the task row shows the first step <text>

    Examples:
      | days   | created             | first_step          | now                 | text                             |
      | martes | 2026-11-09T08:00:00 | Atar la bolsa llena | 2026-11-10T09:00:00 | Primer paso: Atar la bolsa llena |

  # Primer paso en la fila 4
  # Una puntual atrasada también lo muestra. Fila 1: recién atrasada (a las
  # 00:00 del día siguiente); fila 2: días después.
  Scenario Outline: First step in the row 4
    Given a one-off task with due date <due_date>
    And the first step of the task is <first_step>
    When I query Pendientes on <now>
    Then the task row shows the first step <text>

    Examples:
      | due_date   | first_step             | now                 | text                                |
      | 2026-11-12 | Separar la ropa blanca | 2026-11-13T00:00:00 | Primer paso: Separar la ropa blanca |
      | 2026-11-10 | Separar la ropa blanca | 2026-11-13T10:00:00 | Primer paso: Separar la ropa blanca |

  # Primer paso en la fila 5
  # Una periódica relativa atrasada también.
  Scenario Outline: First step in the row 5
    Given a relative recurring task every <every> <unit>
    And the task was completed on <completed>
    And the first step of the task is <first_step>
    When I query Pendientes on <now>
    Then the task row shows the first step <text>

    Examples:
      | every | unit   | completed           | first_step         | now                 | text                            |
      | 2    | dias   | 2026-11-10T09:00:00 | Llenar la regadera | 2026-11-14T09:00:00 | Primer paso: Llenar la regadera |

  # Primer paso en la fila 6
  # Una atrasada con el checkbox deshabilitado hasta que abra su ventana
  # (§5.5) lo muestra.
  Scenario Outline: First step in the row 6
    Given a one-off task with due date <due_date> created on <created>
    And the task can be completed from <from> to <to>
    And the first step of the task is <first_step>
    When I query Pendientes on <now>
    Then the task checkbox is disabled
    And the task row shows the first step <text>

    Examples:
      | due_date   | created             | from  | to    | first_step             | now                 | text                                |
      | 2026-11-10 | 2026-11-01T09:00:00 | 08:00 | 11:00 | Separar la ropa blanca | 2026-11-13T07:00:00 | Primer paso: Separar la ropa blanca |

  # Primer paso en la fila 7
  # Una tarea sin el campo no tiene primer paso: la fila se ve como hoy.
  Scenario Outline: First step in the row 7
    Given a relative recurring task every <every> <unit>
    When I query Pendientes on <now>
    Then the task row shows no first step

    Examples:
      | every | unit   | now                 |
      | 2    | dias   | 2026-11-13T10:00:00 |

  # Primer paso en la fila 8
  # Una periódica relativa en espera (completada) no lo muestra.
  Scenario Outline: First step in the row 8
    Given Mostrar completadas is on
    And a relative recurring task every <every> <unit>
    And the task was completed on <completed>
    And the first step of the task is <first_step>
    When I query Pendientes on <now>
    Then the task row shows no first step

    Examples:
      | every | unit   | completed           | first_step         | now                 |
      | 2    | dias   | 2026-11-13T08:00:00 | Llenar la regadera | 2026-11-13T10:00:00 |

  # Primer paso en la fila 9
  # Una periódica de calendario en espera (antes de su ocurrencia) no lo
  # muestra.
  Scenario Outline: First step in the row 9
    Given a weekly recurring task on <days> created on <created>
    And the first step of the task is <first_step>
    When I query Pendientes on <now>
    Then the task row shows no first step

    Examples:
      | days   | created             | first_step          | now                 |
      | martes | 2026-11-09T08:00:00 | Atar la bolsa llena | 2026-11-09T12:00:00 |

  # Primer paso en la fila 10
  # Una puntual en espera por su horario (fuera de la ventana) no lo muestra.
  Scenario Outline: First step in the row 10
    Given a one-off task without a due date created on <created>
    And the task can be completed from <from> to <to>
    And the first step of the task is <first_step>
    When I query Pendientes on <now>
    Then the task row shows no first step

    Examples:
      | created             | from  | to    | first_step             | now                 |
      | 2026-11-13T06:00:00 | 08:00 | 11:00 | Separar la ropa blanca | 2026-11-13T07:00:00 |

  # Primer paso en la fila 11
  # Dentro de la ventana, la misma tarea está pendiente y sí lo muestra.
  Scenario Outline: First step in the row 11
    Given a one-off task without a due date created on <created>
    And the task can be completed from <from> to <to>
    And the first step of the task is <first_step>
    When I query Pendientes on <now>
    Then the task row shows the first step <text>

    Examples:
      | created             | from  | to    | first_step             | now                 | text                                |
      | 2026-11-13T06:00:00 | 08:00 | 11:00 | Separar la ropa blanca | 2026-11-13T08:00:00 | Primer paso: Separar la ropa blanca |

  # Primer paso en la fila 12
  # Una pospuesta (en espera) no lo muestra, sea pendiente (fila 1) o
  # atrasada (fila 2) sin la posposición.
  Scenario Outline: First step in the row 12
    Given a one-off task with due date <due_date>
    And the first step of the task is <first_step>
    And the task was postponed with option <option> on <postponed>
    When I query Pendientes on <now>
    Then the task row shows no first step

    Examples:
      | due_date   | first_step             | option  | postponed           | now                 |
      | 2026-11-20 | Separar la ropa blanca | 3 horas | 2026-11-13T10:00:00 | 2026-11-13T11:30:00 |
      | 2026-11-10 | Separar la ropa blanca | 3 horas | 2026-11-13T10:00:00 | 2026-11-13T11:30:00 |

  # Primer paso en la fila 13
  # Una pausada (con Mostrar pausadas) no lo muestra, aunque sin pausa estaría
  # atrasada.
  Scenario Outline: First step in the row 13
    Given Mostrar pausadas is on
    And a relative recurring task every <every> <unit>
    And the task was completed on <completed>
    And the first step of the task is <first_step>
    And the task was paused
    When I query Pendientes on <now>
    Then the task row shows no first step

    Examples:
      | every | unit   | completed           | first_step         | now                 |
      | 2    | dias   | 2026-11-10T09:00:00 | Llenar la regadera | 2026-11-14T09:00:00 |

  # Primer paso en la fila 14
  # Al completarla una puntual (con Mostrar completadas) la línea desaparece.
  Scenario Outline: First step in the row 14
    Given Mostrar completadas is on
    And a one-off task without a due date
    And the first step of the task is <first_step>
    When I tap the task checkbox on <tap>
    And I query Pendientes on <now>
    Then the task row shows no first step

    Examples:
      | first_step             | tap                 | now                 |
      | Separar la ropa blanca | 2026-11-13T10:00:00 | 2026-11-13T10:00:00 |

  # Primer paso en la fila 15
  # Al terminar la posposición vuelve sola: pendiente (fila 1) o atrasada
  # (fila 2).
  Scenario Outline: First step in the row 15
    Given a one-off task with due date <due_date>
    And the first step of the task is <first_step>
    And the task was postponed with option <option> on <postponed>
    When I query Pendientes on <now>
    Then the task row shows the first step <text>

    Examples:
      | due_date   | first_step             | option  | postponed           | now                 | text                                |
      | 2026-11-20 | Separar la ropa blanca | 3 horas | 2026-11-13T10:00:00 | 2026-11-13T13:00:00 | Primer paso: Separar la ropa blanca |
      | 2026-11-10 | Separar la ropa blanca | 3 horas | 2026-11-13T10:00:00 | 2026-11-13T13:00:00 | Primer paso: Separar la ropa blanca |

  # Primer paso en la fila 16
  # Una periódica que vuelve (se cumple su intervalo) muestra el mismo primer
  # paso. Fila 1: en el momento de volver (pendiente); fila 2: ya atrasada.
  Scenario Outline: First step in the row 16
    Given a relative recurring task every <every> <unit>
    And the task was completed on <completed>
    And the first step of the task is <first_step>
    When I query Pendientes on <now>
    Then the task row shows the first step <text>

    Examples:
      | every | unit   | completed           | first_step         | now                 | text                            |
      | 2    | dias   | 2026-11-10T09:00:00 | Llenar la regadera | 2026-11-12T09:00:00 | Primer paso: Llenar la regadera |
      | 2    | dias   | 2026-11-10T09:00:00 | Llenar la regadera | 2026-11-14T09:00:00 | Primer paso: Llenar la regadera |

  # Primer paso en la fila 17
  # Al reanudarla vuelve sola: la relativa reanudada está pendiente.
  Scenario Outline: First step in the row 17
    Given a relative recurring task every <every> <unit>
    And the task was completed on <completed>
    And the first step of the task is <first_step>
    And the task was paused
    When I resume the task on <resumed>
    And I query Pendientes on <now>
    Then the task row shows the first step <text>

    Examples:
      | every | unit   | completed           | first_step         | resumed             | now                 | text                            |
      | 2    | dias   | 2026-11-12T09:00:00 | Llenar la regadera | 2026-11-13T10:00:00 | 2026-11-13T10:00:00 | Primer paso: Llenar la regadera |

  # Primer paso en la fila 18
  # Al deshacer el completado vuelve sola: la puntual vuelve a pendiente.
  Scenario Outline: First step in the row 18
    Given a one-off task with due date <due_date>
    And the first step of the task is <first_step>
    And the task was completed on <completed>
    When I delete the completion from <completed>
    And I query Pendientes on <now>
    Then the task row shows the first step <text>

    Examples:
      | due_date   | first_step             | completed           | now                 | text                                |
      | 2026-11-20 | Separar la ropa blanca | 2026-11-13T08:00:00 | 2026-11-13T10:00:00 | Primer paso: Separar la ropa blanca |
