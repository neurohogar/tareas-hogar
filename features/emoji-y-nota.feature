# mutation-stamp: sha256=5f7cc9275a2e4155fe8ef571769d1014e34b7ac5c46d6c3ca3fc65b78fe2da5b
# acceptance-mutation-manifest-begin
# {"version":1,"tested_at":"2026-10-29T03:33:12.172837344Z","feature_name":"Emoji y nota","feature_path":"features/emoji-y-nota.feature","background_hash":"74234e98afe7498fb5daf1f36ac2d78acc339464f950703b8c019892f982b90b","implementation_hash":"sha256:4b84fac0feacd5b9e4094fd38c02cb6debf7d7c1674b9c4bed6f0b168e78d2ad","scenarios":[{"index":0,"name":"Emoji y nota 1","scenario_hash":"0545e75a7a6aebb1f4f7f62360ae1f3e1589fa633250ef6cfa241f637a81ac83","mutation_count":10,"result":{"Total":10,"Killed":10,"Survived":0,"Errors":0},"tested_at":"2026-10-29T03:33:12.172837344Z"},{"index":1,"name":"Emoji y nota 2","scenario_hash":"a65678f25dff0c97628c5d6810fc84993733fdd5981f6850a53990972d0c829a","mutation_count":1,"result":{"Total":1,"Killed":1,"Survived":0,"Errors":0},"tested_at":"2026-10-29T03:33:12.172837344Z"},{"index":2,"name":"Emoji y nota 5","scenario_hash":"0fb5eb2d991986259ef47eca03420a08194da35757876d383c71767de9aaa278","mutation_count":4,"result":{"Total":4,"Killed":4,"Survived":0,"Errors":0},"tested_at":"2026-10-29T03:33:12.172837344Z"},{"index":3,"name":"Emoji y nota 6","scenario_hash":"57af6f287bea00261b3070a8d7636fbba9b89ef0a18c58314b0c891c0e63e193","mutation_count":4,"result":{"Total":4,"Killed":4,"Survived":0,"Errors":0},"tested_at":"2026-10-29T03:33:12.172837344Z"},{"index":5,"name":"Emoji y nota 8","scenario_hash":"08bb72843b18d22b0a118f357779a790fbca39d9f696232411c8cfb798313ac9","mutation_count":2,"result":{"Total":2,"Killed":2,"Survived":0,"Errors":0},"tested_at":"2026-10-29T03:33:12.172837344Z"},{"index":6,"name":"Emoji y nota 9","scenario_hash":"1e1a0037ed72569a6f51fdc0b39271569adc323fdffd0783566c18746a614618","mutation_count":6,"result":{"Total":6,"Killed":6,"Survived":0,"Errors":0},"tested_at":"2026-10-29T03:33:12.172837344Z"},{"index":7,"name":"Emoji y nota 11","scenario_hash":"e52861572c704cf66eb74f73a156232129a59e5abbe04a197db6e55bd8c42262","mutation_count":3,"result":{"Total":3,"Killed":3,"Survived":0,"Errors":0},"tested_at":"2026-10-29T03:33:12.172837344Z"},{"index":8,"name":"Emoji y nota 12","scenario_hash":"7802344ad352fddcea265734d879674578c3def47bb0e04c09c04dc547e7e04e","mutation_count":2,"result":{"Total":2,"Killed":2,"Survived":0,"Errors":0},"tested_at":"2026-10-29T03:33:12.172837344Z"},{"index":9,"name":"Emoji y nota 13","scenario_hash":"a442f2ae58acc8855b273a0c8997d64cee3326f6c04e9008bba02d781c0d0e78","mutation_count":9,"result":{"Total":9,"Killed":9,"Survived":0,"Errors":0},"tested_at":"2026-10-29T03:33:12.172837344Z"},{"index":10,"name":"Emoji y nota 14","scenario_hash":"6bad6656e0320dee79c1e78ab1ecdf590ca20b1ed03dbb7d3d87abf2f97636ff","mutation_count":4,"result":{"Total":4,"Killed":4,"Survived":0,"Errors":0},"tested_at":"2026-10-29T03:33:12.172837344Z"},{"index":11,"name":"Emoji y nota 15","scenario_hash":"8935232cf345f8daa0e1c01ff3b08bab900029f2665214efd66a45dc63a661e0","mutation_count":2,"result":{"Total":2,"Killed":2,"Survived":0,"Errors":0},"tested_at":"2026-10-29T03:33:12.172837344Z"},{"index":12,"name":"Emoji y nota 16","scenario_hash":"fb245360186c5ba761a789fd7510a3bdcd2ca4ce1879a70f9cf82cc3dabf8b74","mutation_count":4,"result":{"Total":4,"Killed":4,"Survived":0,"Errors":0},"tested_at":"2026-10-29T03:33:12.172837344Z"},{"index":13,"name":"Emoji y nota 17","scenario_hash":"e67e0316dc6452739e3c8b49889774475580241924e97f21375132d20af9d3f1","mutation_count":3,"result":{"Total":3,"Killed":3,"Survived":0,"Errors":0},"tested_at":"2026-10-29T03:33:12.172837344Z"}]}
# acceptance-mutation-manifest-end

# Spec §4.1 (emoji y nota), §6.2 (Editar) y §7 (Conflictos).
# Emoji: se elige con el selector (§6.2), así que la UI nunca produce un valor
# inválido. Es un único grafema emoji (ZWJ, tono de piel, selector de
# variación y banderas cuentan como uno). Quitar el emoji deja la tarea sin
# emoji. La regla de rechazo de un emoji inválido (§4.1) sigue en el core como
# validación al guardar, pero ya no es comportamiento observable por la UI: la
# cubren los unit tests, no estos escenarios.
# Nota: texto libre sin largo máximo. Se recortan los espacios y saltos de
# línea del inicio y del final; los saltos de línea internos se conservan.
# Vacía o solo espacios significa sin nota. Una nota nunca es inválida.
# Nombre de la tarea: «emoji título» con emoji, solo el título sin emoji.
# Es el nombre que usan Pendientes, Historial y el aviso de deshacer.
# Conflictos: emoji y nota son campos independientes; gana el último cambio,
# por campo.
Feature: Emoji y nota

  # Emoji y nota 1
  # Un solo emoji, de cualquier forma, se guarda tal cual.
  Scenario Outline: Emoji y nota 1
    Given una tarea puntual sin fecha límite
    When elijo el emoji <emoji>
    Then la tarea tiene emoji <emoji_guardado>

    Examples:
      | emoji | emoji_guardado |
      | 🌱     | 🌱              |
      | 👨‍👩‍👧   | 👨‍👩‍👧            |
      | 👍🏽    | 👍🏽             |
      | ❤️    | ❤️             |
      | 🇦🇷    | 🇦🇷             |

  # Emoji y nota 2
  # Quitar el emoji deja la tarea sin emoji.
  Scenario Outline: Emoji y nota 2
    Given una tarea puntual sin fecha límite con emoji <emoji>
    When quito el emoji
    Then la tarea no tiene emoji

    Examples:
      | emoji |
      | 🌱     |

  # Emoji y nota 5
  # La nota se recorta al inicio y al final.
  Scenario Outline: Emoji y nota 5
    Given una tarea puntual sin fecha límite
    When edito la nota a <nota> con espacios al inicio y al final
    Then la tarea tiene nota <nota_guardada>

    Examples:
      | nota                  | nota_guardada         |
      | Usar guantes          | Usar guantes          |
      | Comprar detergente    | Comprar detergente    |

  # Emoji y nota 6
  # Los saltos de línea internos se conservan.
  Scenario Outline: Emoji y nota 6
    Given una tarea puntual sin fecha límite
    When edito la nota a <primera> y <segunda> en líneas separadas
    Then la nota de la tarea tiene dos líneas: <primera_guardada> y <segunda_guardada>

    Examples:
      | primera        | segunda     | primera_guardada | segunda_guardada |
      | Usar guantes   | Ventilar    | Usar guantes     | Ventilar         |

  # Emoji y nota 7
  # Una nota de solo espacios quita la nota.
  Scenario Outline: Emoji y nota 7
    Given una tarea puntual sin fecha límite con nota <nota>
    When edito la nota a una de solo espacios
    Then la tarea no tiene nota

    Examples:
      | nota         |
      | Usar guantes |

  # Emoji y nota 8
  # La nota no tiene largo máximo.
  Scenario Outline: Emoji y nota 8
    Given una tarea puntual sin fecha límite
    When edito la nota a una de <largo> caracteres
    Then la tarea tiene una nota de <largo_guardado> caracteres

    Examples:
      | largo | largo_guardado |
      | 5000  | 5000           |

  # Emoji y nota 9
  # Crear con emoji y nota: se guardan con la tarea.
  Scenario Outline: Emoji y nota 9
    When creo una tarea puntual con título <titulo>, emoji <emoji> y nota <nota>
    Then se crea una tarea puntual con título <titulo_guardado>
    And la tarea tiene emoji <emoji_guardado>
    And la tarea tiene nota <nota_guardada>

    Examples:
      | titulo | emoji | nota         | titulo_guardado | emoji_guardado | nota_guardada |
      | Regar  | 🌱     | Usar guantes | Regar           | 🌱              | Usar guantes  |

  # Emoji y nota 11
  # Nombre de la tarea: con emoji, «emoji título»; sin emoji, solo el título.
  Scenario Outline: Emoji y nota 11
    Given una tarea puntual <titulo> sin fecha límite con emoji <emoji>
    Then el nombre de la tarea es <nombre>

    Examples:
      | titulo | emoji | nombre  |
      | Regar  | 🌱     | 🌱 Regar |

  # Emoji y nota 12
  # Sin emoji, el nombre es solo el título.
  Scenario Outline: Emoji y nota 12
    Given una tarea puntual <titulo> sin fecha límite
    Then el nombre de la tarea es <nombre>

    Examples:
      | titulo | nombre |
      | Regar  | Regar  |

  # Emoji y nota 13
  # Editar emoji y nota no cambia el id ni toca los completados.
  Scenario Outline: Emoji y nota 13
    Given una tarea periódica relativa cada <cada> <unidad>
    And la tarea fue completada el <completada>
    When elijo el emoji <emoji> y edito la nota a <nota>
    Then la tarea conserva su id
    And la tarea conserva un solo completado, del <completada_guardada>

    Examples:
      | cada | unidad | completada          | emoji | nota         | completada_guardada |
      | 2    | dias   | 2026-07-15T08:00:00 | 🌱     | Usar guantes | 2026-07-15T08:00:00 |

  # Emoji y nota 14
  # Emoji y nota son campos distintos: se combinan los dos cambios.
  Scenario Outline: Emoji y nota 14
    Given una tarea puntual sin fecha límite
    When elijo el emoji <emoji>
    And otro dispositivo, sin ver ese cambio, edita la nota a <nota>
    Then la tarea tiene emoji <emoji_guardado>
    And la tarea tiene nota <nota_guardada>

    Examples:
      | emoji | nota         | emoji_guardado | nota_guardada |
      | 🌱     | Usar guantes | 🌱              | Usar guantes  |

  # Emoji y nota 15
  # El mismo emoji: gana el último cambio en llegar.
  Scenario Outline: Emoji y nota 15
    Given una tarea puntual sin fecha límite
    When elijo el emoji <primero>
    And otro dispositivo, sin ver ese cambio, elige el emoji <segundo>
    Then la tarea tiene emoji <emoji_guardado>

    Examples:
      | primero | segundo | emoji_guardado |
      | 🌱       | 🔥       | 🔥              |

  # Emoji y nota 16
  # La misma nota: gana el último cambio en llegar y el emoji no se toca.
  Scenario Outline: Emoji y nota 16
    Given una tarea puntual sin fecha límite con emoji <emoji>
    When edito la nota a <primera> con espacios al inicio y al final
    And otro dispositivo, sin ver ese cambio, edita la nota a <segunda>
    Then la tarea tiene nota <nota_guardada>
    And la tarea tiene emoji <emoji_guardado>

    Examples:
      | emoji | primera      | segunda  | nota_guardada | emoji_guardado |
      | 🌱     | Usar guantes | Ventilar | Ventilar      | 🌱              |

  # Emoji y nota 17
  # Quitar el emoji en un dispositivo y editar la nota en el otro: se combinan.
  Scenario Outline: Emoji y nota 17
    Given una tarea puntual sin fecha límite con emoji <emoji>
    When quito el emoji
    And otro dispositivo, sin ver ese cambio, edita la nota a <nota>
    Then la tarea no tiene emoji
    And la tarea tiene nota <nota_guardada>

    Examples:
      | emoji | nota         | nota_guardada |
      | 🌱     | Usar guantes | Usar guantes  |
