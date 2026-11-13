# mutation-stamp: sha256=6438818eef2c133cfe6428c7bd07f600f3ca2204813ae0d420d29d60d0d5175f
# acceptance-mutation-manifest-begin
# {"version":1,"tested_at":"2026-11-13T22:14:17.759595547Z","feature_name":"Horario de tarea","feature_path":"features/horario-de-tarea.feature","background_hash":"74234e98afe7498fb5daf1f36ac2d78acc339464f950703b8c019892f982b90b","implementation_hash":"sha256:3487240879892216687351d73a7f89c4d3e278aca1674b471def7ab9dd38a95b","scenarios":[{"index":0,"name":"Horario de tarea 1","scenario_hash":"d0f3cd2d6ba97340b8bfce13baae5ad594de484100e872ecaba39f013c372dd0","mutation_count":18,"result":{"Total":18,"Killed":18,"Survived":0,"Errors":0},"tested_at":"2026-11-13T22:14:17.759595547Z"},{"index":1,"name":"Horario de tarea 2","scenario_hash":"854f68eb35fba59b1ec2c3e94541a0dbfdb723dbf6958b843abb64ec526f57bd","mutation_count":9,"result":{"Total":9,"Killed":9,"Survived":0,"Errors":0},"tested_at":"2026-11-13T22:14:17.759595547Z"},{"index":2,"name":"Horario de tarea 3","scenario_hash":"36c0747ef158f22af9d04bf3b01e187d17b106ed5da9d08209e2bcd3282830d8","mutation_count":8,"result":{"Total":8,"Killed":8,"Survived":0,"Errors":0},"tested_at":"2026-11-13T22:14:17.759595547Z"},{"index":3,"name":"Horario de tarea 4","scenario_hash":"f8a0f7ee9904707e44bd5f95f7c58eaff1ada7fc522cbd7df697d08a9d22300d","mutation_count":2,"result":{"Total":2,"Killed":2,"Survived":0,"Errors":0},"tested_at":"2026-11-13T22:14:17.759595547Z"},{"index":4,"name":"Horario de tarea 5","scenario_hash":"c5a3381468211b0f9039337c733273421ec97a983f3c099f3000166e95e5bb55","mutation_count":6,"result":{"Total":6,"Killed":6,"Survived":0,"Errors":0},"tested_at":"2026-11-13T22:14:17.759595547Z"},{"index":7,"name":"Horario de tarea 8","scenario_hash":"07839b15710debb58bcb6e2efb40823a596f5bdb2f3ba78e57f8974774fa8671","mutation_count":4,"result":{"Total":4,"Killed":4,"Survived":0,"Errors":0},"tested_at":"2026-11-13T22:14:17.759595547Z"},{"index":8,"name":"Horario de tarea 9","scenario_hash":"88dc4fc78a094a9b4ee23a198979bb360a03e93d11279cb5efb36d15e2c9b2f1","mutation_count":6,"result":{"Total":6,"Killed":6,"Survived":0,"Errors":0},"tested_at":"2026-11-13T22:14:17.759595547Z"},{"index":9,"name":"Horario de tarea 10","scenario_hash":"63d7bf825b3dee44b7a58d4d7f28e1756f64249b5a2afe0e9527eee1a6d33900","mutation_count":2,"result":{"Total":2,"Killed":2,"Survived":0,"Errors":0},"tested_at":"2026-11-13T22:14:17.759595547Z"},{"index":10,"name":"Horario de tarea 11","scenario_hash":"e03fa41715de423fd9f9d55c26205cb837fde164763d3f67e395bcf4565fb08c","mutation_count":16,"result":{"Total":16,"Killed":16,"Survived":0,"Errors":0},"tested_at":"2026-11-13T22:14:17.759595547Z"},{"index":11,"name":"Horario de tarea 12","scenario_hash":"4c93783a69e9856867a435dcc8fed5e300557e3111b1289fccf8078d31b340f1","mutation_count":2,"result":{"Total":2,"Killed":2,"Survived":0,"Errors":0},"tested_at":"2026-11-13T22:14:17.759595547Z"},{"index":12,"name":"Horario de tarea 13","scenario_hash":"31b01ec1c0beef98e8e0592ab1d867328c6f5c870c2a2ca1bb737509653d9719","mutation_count":5,"result":{"Total":5,"Killed":5,"Survived":0,"Errors":0},"tested_at":"2026-11-13T22:14:17.759595547Z"},{"index":13,"name":"Horario de tarea 14","scenario_hash":"233ce3d0bb3299259c35449295a03b8a5329444166168c00c8de1fb0f3374d1f","mutation_count":10,"result":{"Total":10,"Killed":10,"Survived":0,"Errors":0},"tested_at":"2026-11-13T22:14:17.759595547Z"},{"index":14,"name":"Horario de tarea 15","scenario_hash":"e30347a418c388215fbd59ece75722de85f23a6aaa208aa2ecddb3489c12b6aa","mutation_count":6,"result":{"Total":6,"Killed":6,"Survived":0,"Errors":0},"tested_at":"2026-11-13T22:14:17.759595547Z"},{"index":15,"name":"Horario de tarea 16","scenario_hash":"fd60b9ca67ecb32212dbfb7c04f248ec2d6359007aca59712f539719a01dcbd5","mutation_count":5,"result":{"Total":5,"Killed":5,"Survived":0,"Errors":0},"tested_at":"2026-11-13T22:14:17.759595547Z"},{"index":16,"name":"Horario de tarea 17","scenario_hash":"e453d5fc368e71abbf8a8ac29c73ce46f1afa4ca5b897c78721d0c691c2ac3d8","mutation_count":4,"result":{"Total":4,"Killed":4,"Survived":0,"Errors":0},"tested_at":"2026-11-13T22:14:17.759595547Z"},{"index":17,"name":"Horario de tarea 18","scenario_hash":"76f59b69e94cf2344d51a0e6e4226bb0d0644655332d80dc1ddd8e7273adc624","mutation_count":2,"result":{"Total":2,"Killed":2,"Survived":0,"Errors":0},"tested_at":"2026-11-13T22:14:17.759595547Z"}]}
# acceptance-mutation-manifest-end

# Spec §4.1 (campo horario), §6.2 (campo Horario del panel) y §7 (Conflictos).
# Horario: { desde: "HH:MM", hasta: "HH:MM" }, horas locales en formato 24 h,
# opcional y para cualquier tipo de tarea. Sin el campo, la tarea se puede
# completar a cualquier hora. Válido solo con las dos horas y desde < hasta
# (la ventana no cruza la medianoche). Con una sola de las dos horas, o con
# desde ≥ hasta, la creación o la edición se rechaza entera.
# Quitar el horario (apagar "Solo en un horario") deja la tarea sin horario.
# Cambiar el tipo de la tarea no toca el horario (no es un campo de tipo).
# Conflictos: horario es un solo campo (desde y hasta se escriben juntos);
# gana el último cambio, por campo. Es independiente de título y de los demás
# campos.
# "la tarea se puede completar de D a H" es una tarea que ya tiene ese
# horario guardado; "la tarea tiene horario de D a H" mira lo guardado.
Feature: Horario de tarea

  # Horario de tarea 1
  # Crear una puntual con horario lo guarda tal cual. Fila 2: el horario
  # más amplio posible. Fila 3: un minuto de ventana.
  Scenario Outline: Horario de tarea 1
    When creo una tarea puntual con título <titulo> y horario de <desde> a <hasta>
    Then se crea una tarea puntual con título <titulo_guardado>
    And la tarea tiene horario de <desde_guardado> a <hasta_guardado>

    Examples:
      | titulo | desde | hasta | titulo_guardado | desde_guardado | hasta_guardado |
      | Regar  | 08:00 | 11:00 | Regar           | 08:00          | 11:00          |
      | Regar  | 00:00 | 23:59 | Regar           | 00:00          | 23:59          |
      | Regar  | 09:00 | 09:01 | Regar           | 09:00          | 09:01          |

  # Horario de tarea 2
  # Una periódica relativa también puede tener horario.
  Scenario Outline: Horario de tarea 2
    When creo una tarea periódica relativa con título <titulo> cada <cada> <unidad> y horario de <desde> a <hasta>
    Then se crea una tarea periódica con título <titulo_guardado>
    And su recurrencia es relativa cada <cada_guardado> <unidad>
    And la tarea tiene horario de <desde_guardado> a <hasta_guardado>

    Examples:
      | titulo | cada | unidad | desde | hasta | titulo_guardado | cada_guardado | desde_guardado | hasta_guardado |
      | Regar  | 2    | dias   | 08:00 | 11:00 | Regar           | 2             | 08:00          | 11:00          |

  # Horario de tarea 3
  # Una periódica de calendario también puede tener horario.
  Scenario Outline: Horario de tarea 3
    When creo una tarea periódica semanal con título <titulo> los <dias> y horario de <desde> a <hasta>
    Then se crea una tarea periódica con título <titulo_guardado>
    And su recurrencia es semanal los <dias_guardados>
    And la tarea tiene horario de <desde_guardado> a <hasta_guardado>

    Examples:
      | titulo | dias           | desde | hasta | titulo_guardado | dias_guardados | desde_guardado | hasta_guardado |
      | Basura | martes, jueves | 20:00 | 22:30 | Basura          | martes, jueves | 20:00          | 22:30          |

  # Horario de tarea 4
  # Sin horario, la tarea no lo tiene.
  Scenario Outline: Horario de tarea 4
    When creo una tarea puntual con título <titulo> y sin fecha límite
    Then se crea una tarea puntual con título <titulo_guardado>
    And la tarea no tiene horario

    Examples:
      | titulo | titulo_guardado |
      | Regar  | Regar           |

  # Horario de tarea 5
  # Con desde ≥ hasta, la creación se rechaza entera. Fila 2: iguales. Fila
  # 3: la ventana cruzaría la medianoche.
  Scenario Outline: Horario de tarea 5
    When creo una tarea puntual con un título válido y horario de <desde> a <hasta>
    Then la creación se rechaza porque la hora de fin no es posterior a la de inicio
    And no se crea ninguna tarea

    Examples:
      | desde | hasta |
      | 11:00 | 08:00 |
      | 09:00 | 09:00 |
      | 22:00 | 02:00 |

  # Horario de tarea 6
  # Con una sola de las dos horas, la creación se rechaza entera.
  Scenario Outline: Horario de tarea 6
    When creo una tarea puntual con un título válido y un horario con solo la hora de inicio <desde>
    Then la creación se rechaza por horario incompleto
    And no se crea ninguna tarea

    Examples:
      | desde |
      | 08:00 |

  # Horario de tarea 7
  # Con solo la hora de fin, también.
  Scenario Outline: Horario de tarea 7
    When creo una tarea puntual con un título válido y un horario con solo la hora de fin <hasta>
    Then la creación se rechaza por horario incompleto
    And no se crea ninguna tarea

    Examples:
      | hasta |
      | 11:00 |

  # Horario de tarea 8
  # Poner un horario a una tarea que no lo tenía.
  Scenario Outline: Horario de tarea 8
    Given una tarea puntual sin fecha límite
    When pongo el horario de <desde> a <hasta>
    Then la tarea tiene horario de <desde_guardado> a <hasta_guardado>

    Examples:
      | desde | hasta | desde_guardado | hasta_guardado |
      | 08:00 | 11:00 | 08:00          | 11:00          |

  # Horario de tarea 9
  # Cambiar el horario reemplaza las dos horas.
  Scenario Outline: Horario de tarea 9
    Given una tarea puntual sin fecha límite
    And la tarea se puede completar de <desde> a <hasta>
    When pongo el horario de <desde_nuevo> a <hasta_nuevo>
    Then la tarea tiene horario de <desde_guardado> a <hasta_guardado>

    Examples:
      | desde | hasta | desde_nuevo | hasta_nuevo | desde_guardado | hasta_guardado |
      | 08:00 | 11:00 | 18:00       | 20:00       | 18:00          | 20:00          |

  # Horario de tarea 10
  # Quitar el horario deja la tarea sin horario.
  Scenario Outline: Horario de tarea 10
    Given una tarea puntual sin fecha límite
    And la tarea se puede completar de <desde> a <hasta>
    When quito el horario
    Then la tarea no tiene horario

    Examples:
      | desde | hasta |
      | 08:00 | 11:00 |

  # Horario de tarea 11
  # Una edición con desde ≥ hasta se rechaza entera: no cambia el título que
  # venía en la misma edición ni el horario guardado.
  Scenario Outline: Horario de tarea 11
    Given una tarea puntual <titulo> sin fecha límite
    And la tarea se puede completar de <desde> a <hasta>
    When edito en una misma edición el título a <titulo_nuevo> y el horario de <desde_nuevo> a <hasta_nuevo>
    Then la edición se rechaza porque la hora de fin no es posterior a la de inicio
    And la tarea tiene título <titulo_guardado>
    And la tarea tiene horario de <desde_guardado> a <hasta_guardado>

    Examples:
      | titulo | desde | hasta | titulo_nuevo | desde_nuevo | hasta_nuevo | titulo_guardado | desde_guardado | hasta_guardado |
      | Regar  | 08:00 | 11:00 | Barrer       | 11:00       | 10:00       | Regar           | 08:00          | 11:00          |
      | Regar  | 08:00 | 11:00 | Barrer       | 10:00       | 10:00       | Regar           | 08:00          | 11:00          |

  # Horario de tarea 12
  # Una edición con una sola de las dos horas se rechaza y la tarea no
  # cambia.
  Scenario Outline: Horario de tarea 12
    Given una tarea puntual sin fecha límite
    And la tarea se puede completar de <desde> a <hasta>
    When pongo un horario con solo la hora de inicio <desde_nuevo>
    Then la edición se rechaza por horario incompleto
    And la tarea no cambia

    Examples:
      | desde | hasta | desde_nuevo |
      | 08:00 | 11:00 | 09:00       |

  # Horario de tarea 13
  # Cambiar el tipo de la tarea conserva el horario.
  Scenario Outline: Horario de tarea 13
    Given una tarea puntual sin fecha límite
    And la tarea se puede completar de <desde> a <hasta>
    When edito la tarea a periódica relativa cada <cada> <unidad>
    Then la tarea es periódica
    And la tarea tiene horario de <desde_guardado> a <hasta_guardado>

    Examples:
      | desde | hasta | cada | unidad | desde_guardado | hasta_guardado |
      | 08:00 | 11:00 | 2    | dias   | 08:00          | 11:00          |

  # Horario de tarea 14
  # Poner el horario no cambia el id ni toca los completados.
  Scenario Outline: Horario de tarea 14
    Given una tarea periódica relativa cada <cada> <unidad>
    And la tarea fue completada el <completada>
    When pongo el horario de <desde> a <hasta>
    Then la tarea conserva su id
    And la tarea conserva un solo completado, del <completada_guardada>

    Examples:
      | cada | unidad | completada          | desde | hasta | completada_guardada |
      | 2    | dias   | 2026-07-15T08:00:00 | 08:00 | 11:00 | 2026-07-15T08:00:00 |

  # Horario de tarea 15
  # Horario y título son campos distintos: se combinan los dos cambios.
  Scenario Outline: Horario de tarea 15
    Given una tarea puntual sin fecha límite
    When pongo el horario de <desde> a <hasta>
    And otro dispositivo, sin ver ese cambio, edita el título a <titulo_nuevo>
    Then la tarea tiene horario de <desde_guardado> a <hasta_guardado>
    And la tarea tiene título <titulo_guardado>

    Examples:
      | desde | hasta | titulo_nuevo | desde_guardado | hasta_guardado | titulo_guardado |
      | 08:00 | 11:00 | Barrer       | 08:00          | 11:00          | Barrer          |

  # Horario de tarea 16
  # Horario es un solo campo: si un dispositivo cambia el desde y otro el
  # hasta, gana entero el último cambio (no se mezclan las horas).
  Scenario Outline: Horario de tarea 16
    Given una tarea puntual sin fecha límite
    And la tarea se puede completar de <desde> a <hasta>
    When pongo el horario de <desde_mio> a <hasta>
    And otro dispositivo, sin ver ese cambio, pone el horario de <desde> a <hasta_otro>
    Then la tarea tiene horario de <desde_guardado> a <hasta_guardado>

    Examples:
      | desde | hasta | desde_mio | hasta_otro | desde_guardado | hasta_guardado |
      | 08:00 | 11:00 | 07:00     | 12:00      | 08:00          | 12:00          |

  # Horario de tarea 17
  # Quitar el horario y editar el título en otro dispositivo: se combinan.
  Scenario Outline: Horario de tarea 17
    Given una tarea puntual sin fecha límite
    And la tarea se puede completar de <desde> a <hasta>
    When quito el horario
    And otro dispositivo, sin ver ese cambio, edita el título a <titulo_nuevo>
    Then la tarea no tiene horario
    And la tarea tiene título <titulo_guardado>

    Examples:
      | desde | hasta | titulo_nuevo | titulo_guardado |
      | 08:00 | 11:00 | Barrer       | Barrer          |

  # Horario de tarea 18
  # Cambiar el horario y que otro dispositivo, después, lo quite: gana el
  # último cambio y la tarea queda sin horario.
  Scenario Outline: Horario de tarea 18
    Given una tarea puntual sin fecha límite
    And la tarea se puede completar de <desde> a <hasta>
    When pongo el horario de <desde_nuevo> a <hasta_nuevo>
    And otro dispositivo, sin ver ese cambio, quita el horario
    Then la tarea no tiene horario

    Examples:
      | desde | hasta | desde_nuevo | hasta_nuevo |
      | 08:00 | 11:00 | 18:00       | 20:00       |
