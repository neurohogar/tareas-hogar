# mutation-stamp: sha256=b78b904f7985bbd45cb2fddce62cd4b29aa421ae148d4668e7e7600736f675f2
# acceptance-mutation-manifest-begin
# {"version":1,"tested_at":"2026-11-13T20:10:52.191386414Z","feature_name":"Texto de atraso","feature_path":"features/texto-de-atraso.feature","background_hash":"74234e98afe7498fb5daf1f36ac2d78acc339464f950703b8c019892f982b90b","implementation_hash":"sha256:ec1c6fdaeb19b6b64d490fc043f3f4ef0c051dacc934a62439278a1895ab53a6","scenarios":[{"index":0,"name":"Texto de atraso 1","scenario_hash":"bb0688e02721de3a377b98b7d7149aa503d8e2400dcca0cde45c7660f1e85a76","mutation_count":33,"result":{"Total":33,"Killed":33,"Survived":0,"Errors":0},"tested_at":"2026-11-13T20:10:52.191386414Z"},{"index":1,"name":"Texto de atraso 2","scenario_hash":"3138cf3fba9bdb0de17bc0217a1139e73d6323413ff39cb4d4d473e9d023da06","mutation_count":22,"result":{"Total":22,"Killed":22,"Survived":0,"Errors":0},"tested_at":"2026-11-13T20:10:52.191386414Z"},{"index":2,"name":"Texto de atraso 3","scenario_hash":"438a1686c39f8b8b72de01d8e5c78b2280fcd5910f5671ad1ca48d8b83aaae53","mutation_count":80,"result":{"Total":80,"Killed":80,"Survived":0,"Errors":0},"tested_at":"2026-11-13T20:10:52.191386414Z"},{"index":3,"name":"Texto de atraso 4","scenario_hash":"0e022c61b5a66ca2aa7902c275c86da981f584564dfd07c947ef055efa208e0f","mutation_count":38,"result":{"Total":38,"Killed":38,"Survived":0,"Errors":0},"tested_at":"2026-11-13T20:10:52.191386414Z"},{"index":4,"name":"Texto de atraso 5","scenario_hash":"089fba698e02b145550aca09d710c7f85571ada35987b41253fec76bda88ce48","mutation_count":41,"result":{"Total":41,"Killed":41,"Survived":0,"Errors":0},"tested_at":"2026-11-13T20:10:52.191386414Z"},{"index":5,"name":"Texto de atraso 6","scenario_hash":"e0973d20e342cc250b4181f0871a44af9e38d96bd164712f052fe295f7f86a87","mutation_count":22,"result":{"Total":22,"Killed":22,"Survived":0,"Errors":0},"tested_at":"2026-11-13T20:10:52.191386414Z"},{"index":6,"name":"Texto de atraso 7","scenario_hash":"2fa5eea9d0d3e83680606bec524a11413e71d4efcfef861cb114119beae66e81","mutation_count":8,"result":{"Total":8,"Killed":8,"Survived":0,"Errors":0},"tested_at":"2026-11-13T20:10:52.191386414Z"},{"index":7,"name":"Texto de atraso 8","scenario_hash":"05c346533168326f1494cf1100d5ec879c775329e329e68f35cfa4ddcea02116","mutation_count":55,"result":{"Total":55,"Killed":55,"Survived":0,"Errors":0},"tested_at":"2026-11-13T20:10:52.191386414Z"},{"index":8,"name":"Texto de atraso 9","scenario_hash":"bbbcf2578f027cd2518625b0cc8bd703d8a0e6cb637e4ca1fc4a52e1036d5978","mutation_count":18,"result":{"Total":18,"Killed":18,"Survived":0,"Errors":0},"tested_at":"2026-11-13T20:10:52.191386414Z"},{"index":9,"name":"Texto de atraso 10","scenario_hash":"d01599ca61fd5e55c9b3424b32299aa0f5d839eb61135cd45eed2990acf91878","mutation_count":19,"result":{"Total":19,"Killed":19,"Survived":0,"Errors":0},"tested_at":"2026-11-13T20:10:52.191386414Z"},{"index":10,"name":"Texto de atraso 11","scenario_hash":"42a6421a64d19904adbb00483403b89b6cf05cc22cd8d51a202239f839bea52a","mutation_count":12,"result":{"Total":12,"Killed":12,"Survived":0,"Errors":0},"tested_at":"2026-11-13T20:10:52.191386414Z"},{"index":11,"name":"Texto de atraso 12","scenario_hash":"fe1adc09dd207238206855ff3b7e1e5912c4563ea7be056f98a1af3f0693ac3b","mutation_count":21,"result":{"Total":21,"Killed":21,"Survived":0,"Errors":0},"tested_at":"2026-11-13T20:10:52.191386414Z"}]}
# acceptance-mutation-manifest-end

# Spec §6.1 (texto de atraso «Tocaba …» y Fecha y distancia), con §5.1–§5.7
# (estados, A, C, N, V). La fila de una tarea atrasada dice desde cuándo toca,
# como un hecho con fecha y distancia: «Tocaba <fecha>[ · <distancia>]», con «el»
# solo delante de la fecha con día de la semana. Reemplaza a «Atrasada» y no
# cambia los estados de §5 ni el orden de la lista.
# Instante de «Tocaba» (nunca futuro):
# - puntual con fecha límite: el día fechaLimite, sin hora, tenga o no horario;
# - relativa: V (con hora);
# - calendario: el día de N, sin hora (las ocurrencias perdidas no se acumulan:
#   es la primera sin cubrir);
# - periódica con horario: A; con varios horarios, el inicio de N; si A todavía
#   no llegó (se atrasó por el atraso sin horario antes de abrir la ventana),
#   V.
# Fecha: «hoy», «ayer» o «mañana» si cae en esos días locales; si no, día de la
# semana y número («martes 10»), con « de <mes>» si el mes no es el de ahora y
# « de <año>» si el año no es el de ahora; con hora HH:MM de 24 h cuando el
# instante no es las 00:00.
# Distancia después de « · »: a 2 o más días locales, «hace N días» (días
# locales, no horas transcurridas); con «hoy»/«ayer» y con hora, en horas o, a
# menos de una hora, en minutos (lo pasado se redondea hacia abajo, se cuenta
# desde ahora aunque cruce la medianoche); sin hora, sin distancia.
# El texto es función de ahora: cada fila de Examples con otro ahora es el
# texto actualizándose solo con el paso del tiempo.
# "la fila de la tarea muestra el texto T" afirma que la lista tiene una sola
# fila y que dice T. Cuando el paso no da creadaEn, la tarea se creó antes de
# cualquier otra fecha del escenario. Semana de referencia: viernes 2026-11-13
# (martes 10, miércoles 11, jueves 12, sábado 14, domingo 15).
Feature: Texto de atraso

  # Texto de atraso 1
  # Puntual con fecha límite: el día de la fecha límite, sin hora. Bordes: se
  # atrasa a las 00:00 del día siguiente (fila 3) y hasta las 23:59:59 sigue
  # siendo «ayer» (fila 4); a 2 días (fila 2); otro mes (fila 5) y otro año
  # (fila 6).
  Scenario Outline: Texto de atraso 1
    Given una tarea puntual con fecha límite <limite>
    When consulto Pendientes el <ahora>
    Then la fila de la tarea muestra el texto <texto>

    Examples:
      | limite     | ahora               | texto                                                      |
      | 2026-11-10 | 2026-11-13T10:00:00 | Tocaba el martes 10 · hace 3 días                          |
      | 2026-11-11 | 2026-11-13T00:00:00 | Tocaba el miércoles 11 · hace 2 días                       |
      | 2026-11-12 | 2026-11-13T00:00:00 | Tocaba ayer                                                |
      | 2026-11-12 | 2026-11-13T23:59:59 | Tocaba ayer                                                |
      | 2026-10-28 | 2026-11-13T10:00:00 | Tocaba el miércoles 28 de octubre · hace 16 días           |
      | 2025-12-31 | 2026-01-03T10:00:00 | Tocaba el miércoles 31 de diciembre de 2025 · hace 3 días |

  # Texto de atraso 2
  # Puntual con fecha límite y horario: sigue siendo el día de la fecha límite,
  # sin hora, aunque A (la primera ventana desde que se creó) sea semanas
  # antes. Fila 3: se atrasa al cierre de la ventana del día límite, y ese día
  # es «hoy», sin distancia.
  Scenario Outline: Texto de atraso 2
    Given una tarea puntual con fecha límite <limite> creada el <creada>
    And la tarea se puede completar de <desde> a <hasta>
    When consulto Pendientes el <ahora>
    Then la fila de la tarea muestra el texto <texto>

    Examples:
      | limite     | creada              | desde | hasta | ahora               | texto                             |
      | 2026-11-10 | 2026-11-01T09:00:00 | 08:00 | 11:00 | 2026-11-13T10:00:00 | Tocaba el martes 10 · hace 3 días |
      | 2026-11-12 | 2026-11-01T09:00:00 | 08:00 | 11:00 | 2026-11-13T10:00:00 | Tocaba ayer                       |
      | 2026-11-13 | 2026-11-01T09:00:00 | 08:00 | 11:00 | 2026-11-13T11:00:00 | Tocaba hoy                        |

  # Texto de atraso 3
  # Relativa: V (el vencimiento) con hora. Fila 2: a 2 días locales aunque
  # pasaron 25 horas. Fila 4: cruza la medianoche. Fila 7: lo pasado se
  # redondea hacia abajo (1 hora y media es «1 hora»). Fila 8: otro mes. Fila
  # 9: otro año.
  Scenario Outline: Texto de atraso 3
    Given una tarea periódica relativa cada <cada> <unidad>
    And la tarea fue completada el <completada>
    When consulto Pendientes el <ahora>
    Then la fila de la tarea muestra el texto <texto>

    Examples:
      | cada | unidad | completada          | ahora               | texto                                                       |
      | 2    | dias   | 2026-11-08T09:00:00 | 2026-11-13T10:00:00 | Tocaba el martes 10 09:00 · hace 3 días                     |
      | 1    | dias   | 2026-11-10T23:00:00 | 2026-11-13T00:30:00 | Tocaba el miércoles 11 23:00 · hace 2 días                  |
      | 3    | horas  | 2026-11-12T18:00:00 | 2026-11-13T10:00:00 | Tocaba ayer 21:00 · hace 13 horas                           |
      | 1    | horas  | 2026-11-12T22:00:00 | 2026-11-13T01:00:00 | Tocaba ayer 23:00 · hace 2 horas                            |
      | 2    | horas  | 2026-11-13T02:00:00 | 2026-11-13T10:00:00 | Tocaba hoy 04:00 · hace 6 horas                             |
      | 1    | horas  | 2026-11-13T08:00:00 | 2026-11-13T10:00:00 | Tocaba hoy 09:00 · hace 1 hora                              |
      | 1    | horas  | 2026-11-13T07:30:00 | 2026-11-13T10:00:00 | Tocaba hoy 08:30 · hace 1 hora                              |
      | 2    | dias   | 2026-10-24T09:00:00 | 2026-11-13T10:00:00 | Tocaba el lunes 26 de octubre 09:00 · hace 18 días          |
      | 2    | dias   | 2025-12-27T09:00:00 | 2026-01-03T10:00:00 | Tocaba el lunes 29 de diciembre de 2025 09:00 · hace 5 días |

  # Texto de atraso 4
  # El texto avanza solo con el paso del tiempo, sin cambiar de tarea: la hora
  # y la distancia suben (fila 1 a 2), «hoy» pasa a «ayer» a las 00:00 (fila 3)
  # y, dos días locales después, la distancia pasa a días (fila 4).
  Scenario Outline: Texto de atraso 4
    Given una tarea periódica relativa cada <cada> <unidad>
    And la tarea fue completada el <completada>
    When consulto Pendientes el <ahora>
    Then la fila de la tarea muestra el texto <texto>

    Examples:
      | cada | unidad | completada          | ahora               | texto                                  |
      | 1    | horas  | 2026-11-12T20:00:00 | 2026-11-12T22:00:00 | Tocaba hoy 21:00 · hace 1 hora         |
      | 1    | horas  | 2026-11-12T20:00:00 | 2026-11-12T23:59:59 | Tocaba hoy 21:00 · hace 2 horas        |
      | 1    | horas  | 2026-11-12T20:00:00 | 2026-11-13T00:00:00 | Tocaba ayer 21:00 · hace 3 horas       |
      | 1    | horas  | 2026-11-12T20:00:00 | 2026-11-14T00:00:00 | Tocaba el jueves 12 21:00 · hace 2 días |

  # Texto de atraso 5
  # Relativa con horario: A, no V. Fila 1: V (06:00) cae antes de la ventana y
  # la tarea toca desde que abrió (08:00). Fila 2: se atrasó por el atraso sin
  # horario (V + intervalo, 08:00) antes de que abriera su ventana (20:00):
  # «Tocaba» nunca nombra un instante futuro y usa V. Fila 3: A llegó (08:00),
  # el atraso es el cierre (09:00).
  Scenario Outline: Texto de atraso 5
    Given una tarea periódica relativa cada <cada> <unidad>
    And la tarea fue completada el <completada>
    And la tarea se puede completar de <desde> a <hasta>
    When consulto Pendientes el <ahora>
    Then la fila de la tarea muestra el texto <texto>

    Examples:
      | cada | unidad | completada          | desde | hasta | ahora               | texto                                  |
      | 1    | dias   | 2026-11-11T06:00:00 | 08:00 | 10:00 | 2026-11-12T12:00:00 | Tocaba hoy 08:00 · hace 4 horas        |
      | 3    | horas  | 2026-11-13T02:00:00 | 20:00 | 22:00 | 2026-11-13T10:00:00 | Tocaba hoy 05:00 · hace 5 horas        |
      | 3    | horas  | 2026-11-13T04:00:00 | 08:00 | 09:00 | 2026-11-13T10:00:00 | Tocaba hoy 08:00 · hace 2 horas        |
      | 1    | dias   | 2026-11-08T06:00:00 | 08:00 | 10:00 | 2026-11-13T10:00:00 | Tocaba el lunes 9 08:00 · hace 4 días |

  # Texto de atraso 6
  # Calendario semanal: el día de N, sin hora. Fila 1: perdió el martes 3 y el
  # jueves 5 y el 12, y dice la primera sin cubrir, no la última. Fila 3: se
  # atrasa a las 00:00 del día siguiente a N. Filas 4 y 5: otro mes y otro año.
  Scenario Outline: Texto de atraso 6
    Given una tarea periódica semanal los <dias> creada el <creada>
    When consulto Pendientes el <ahora>
    Then la fila de la tarea muestra el texto <texto>

    Examples:
      | dias           | creada              | ahora               | texto                                                  |
      | martes, jueves | 2026-11-02T08:00:00 | 2026-11-13T10:00:00 | Tocaba el martes 3 · hace 10 días                      |
      | jueves         | 2026-11-11T08:00:00 | 2026-11-13T10:00:00 | Tocaba ayer                                            |
      | jueves         | 2026-11-11T08:00:00 | 2026-11-13T00:00:00 | Tocaba ayer                                            |
      | miércoles      | 2026-10-20T08:00:00 | 2026-11-13T10:00:00 | Tocaba el miércoles 21 de octubre · hace 23 días       |
      | lunes          | 2025-12-29T08:00:00 | 2026-01-03T10:00:00 | Tocaba el lunes 29 de diciembre de 2025 · hace 5 días  |

  # Texto de atraso 7
  # Calendario mensual: el día de N, sin hora.
  Scenario Outline: Texto de atraso 7
    Given una tarea periódica mensual los días <dias> creada el <creada>
    When consulto Pendientes el <ahora>
    Then la fila de la tarea muestra el texto <texto>

    Examples:
      | dias | creada              | ahora               | texto                              |
      | 10   | 2026-11-01T08:00:00 | 2026-11-13T10:00:00 | Tocaba el martes 10 · hace 3 días  |
      | 1    | 2026-10-31T08:00:00 | 2026-11-13T10:00:00 | Tocaba el domingo 1 · hace 12 días |

  # Texto de atraso 8
  # Calendario con una ventana: A, el inicio de la ocurrencia, con hora. Filas
  # 2 a 5: en minutos, redondeados hacia abajo (59 segundos de más no suman el
  # minuto); fila 6: a la hora en punto pasa a horas. Fila 1: cruza la
  # medianoche. Fila 8: a 2 o más días, con hora.
  Scenario Outline: Texto de atraso 8
    Given una tarea periódica semanal los <dias> creada el <creada>
    And la tarea se puede completar de <desde> a <hasta>
    When consulto Pendientes el <ahora>
    Then la fila de la tarea muestra el texto <texto>

    Examples:
      | dias    | creada              | desde | hasta | ahora               | texto                                  |
      | jueves  | 2026-11-11T08:00:00 | 22:00 | 23:30 | 2026-11-13T01:00:00 | Tocaba ayer 22:00 · hace 3 horas       |
      | viernes | 2026-11-12T08:00:00 | 09:20 | 09:50 | 2026-11-13T10:00:00 | Tocaba hoy 09:20 · hace 40 minutos     |
      | viernes | 2026-11-12T08:00:00 | 09:20 | 09:50 | 2026-11-13T10:00:59 | Tocaba hoy 09:20 · hace 40 minutos     |
      | viernes | 2026-11-12T08:00:00 | 09:20 | 09:50 | 2026-11-13T10:01:00 | Tocaba hoy 09:20 · hace 41 minutos     |
      | viernes | 2026-11-12T08:00:00 | 09:01 | 09:30 | 2026-11-13T10:00:00 | Tocaba hoy 09:01 · hace 59 minutos     |
      | viernes | 2026-11-12T08:00:00 | 09:00 | 09:30 | 2026-11-13T10:00:00 | Tocaba hoy 09:00 · hace 1 hora         |
      | viernes | 2026-11-12T08:00:00 | 08:00 | 09:30 | 2026-11-13T10:00:00 | Tocaba hoy 08:00 · hace 2 horas        |
      | martes  | 2026-11-02T08:00:00 | 09:00 | 11:00 | 2026-11-13T10:00:00 | Tocaba el martes 3 09:00 · hace 10 días |

  # Texto de atraso 9
  # Calendario con varios horarios: el inicio de N. Perdida la mañana, sigue
  # tocando desde las 07:00, también después de la ventana de la tarde (§5.6:
  # las ocurrencias perdidas no se acumulan).
  Scenario Outline: Texto de atraso 9
    Given una tarea periódica semanal los <dias> creada el <creada>
    And la tarea se puede completar de <desde> a <hasta> y de <desde2> a <hasta2>
    When consulto Pendientes el <ahora>
    Then la fila de la tarea muestra el texto <texto>

    Examples:
      | dias    | creada              | desde | hasta | desde2 | hasta2 | ahora               | texto                              |
      | viernes | 2026-11-12T08:00:00 | 07:00 | 10:00 | 18:00  | 21:00  | 2026-11-13T10:00:00 | Tocaba hoy 07:00 · hace 3 horas    |
      | viernes | 2026-11-12T08:00:00 | 07:00 | 10:00 | 18:00  | 21:00  | 2026-11-13T21:00:00 | Tocaba hoy 07:00 · hace 14 horas   |

  # Texto de atraso 10
  # Relativa con varios horarios, nunca completada: el inicio de N, la primera
  # ventana cuyo hasta es posterior a creadaEn (fila 1, la que estaba en
  # curso; fila 2, la de la tarde).
  Scenario Outline: Texto de atraso 10
    Given una tarea periódica relativa cada <cada> <unidad> creada el <creada>
    And la tarea se puede completar de <desde> a <hasta> y de <desde2> a <hasta2>
    When consulto Pendientes el <ahora>
    Then la fila de la tarea muestra el texto <texto>

    Examples:
      | cada | unidad | creada              | desde | hasta | desde2 | hasta2 | ahora               | texto                                   |
      | 2    | dias   | 2026-11-10T08:00:00 | 07:00 | 10:00 | 18:00  | 21:00  | 2026-11-13T10:00:00 | Tocaba el martes 10 07:00 · hace 3 días |
      | 2    | dias   | 2026-11-10T12:00:00 | 07:00 | 10:00 | 18:00  | 21:00  | 2026-11-13T10:00:00 | Tocaba el martes 10 18:00 · hace 3 días |

  # Texto de atraso 11
  # El texto no cambia el orden: el de §6.1 sigue siendo desde cuándo está
  # atrasada (Pagar, desde el 11 a las 00:00, antes que Regar, desde el 12 a las
  # 09:00), aunque Regar «toque» desde antes (domingo 8) que Pagar (martes 10).
  Scenario Outline: Texto de atraso 11
    Given una tarea puntual Pagar con fecha límite <limite>
    And una tarea periódica relativa Regar cada <cada> <unidad>
    And la tarea Regar fue completada el <completada>
    When consulto Pendientes el <ahora>
    Then Pendientes muestra en orden <orden>
    And la fila de Pagar muestra el texto <texto_pagar>
    And la fila de Regar muestra el texto <texto_regar>

    Examples:
      | limite     | cada | unidad | completada          | ahora               | orden        | texto_pagar                       | texto_regar                             |
      | 2026-11-10 | 4    | dias   | 2026-11-04T09:00:00 | 2026-11-13T10:00:00 | Pagar, Regar | Tocaba el martes 10 · hace 3 días | Tocaba el domingo 8 09:00 · hace 5 días |

  # Texto de atraso 12
  # Menos de un minuto de pasado: «ahora», no «hace 0 minutos» (§6.1, S16).
  # Con la ventana más corta (un minuto) la tarea se atrasa al cierre y ya
  # pasaron 60 segundos desde A, así que el borde alcanzable es el minuto
  # exacto (fila 1): «hace 1 minuto», singular; 59 segundos más siguen siendo
  # ese minuto (fila 2) y a los 60 pasa a «hace 2 minutos» (fila 3).
  Scenario Outline: Texto de atraso 12
    Given una tarea periódica semanal los <dias> creada el <creada>
    And la tarea se puede completar de <desde> a <hasta>
    When consulto Pendientes el <ahora>
    Then la fila de la tarea muestra el texto <texto>

    Examples:
      | dias    | creada              | desde | hasta | ahora               | texto                              |
      | viernes | 2026-11-12T08:00:00 | 10:00 | 10:01 | 2026-11-13T10:01:00 | Tocaba hoy 10:00 · hace 1 minuto   |
      | viernes | 2026-11-12T08:00:00 | 10:00 | 10:01 | 2026-11-13T10:01:59 | Tocaba hoy 10:00 · hace 1 minuto   |
      | viernes | 2026-11-12T08:00:00 | 10:00 | 10:01 | 2026-11-13T10:02:00 | Tocaba hoy 10:00 · hace 2 minutos  |
