# mutation-stamp: sha256=cae7085dade1ea7977b647ae76e4efc7cc414a93e55eee715678650b143eda71
# acceptance-mutation-manifest-begin
# {"version":1,"tested_at":"2026-11-04T12:22:20.977736860Z","feature_name":"Emojis recientes","feature_path":"features/emojis-recientes.feature","background_hash":"74234e98afe7498fb5daf1f36ac2d78acc339464f950703b8c019892f982b90b","implementation_hash":"sha256:369b8a6ef7cf8addd8cc404b4cc295b7374c5593cefc1b8c2c8ca663d1aa6217","scenarios":[{"index":0,"name":"Emojis recientes 1","scenario_hash":"fa2a3fd452ef1a2f135f9dcd0ca5e71b4c3eb80a2f05e15a9b71ad49228e2b70","mutation_count":2,"result":{"Total":2,"Killed":2,"Survived":0,"Errors":0},"tested_at":"2026-11-04T12:22:20.977736860Z"},{"index":1,"name":"Emojis recientes 2","scenario_hash":"380d186c75ebf200660eca7e2d8e9445aeedc59573afed2c2dd40d6d031615f9","mutation_count":3,"result":{"Total":3,"Killed":3,"Survived":0,"Errors":0},"tested_at":"2026-11-04T12:22:20.977736860Z"},{"index":2,"name":"Emojis recientes 3","scenario_hash":"12714c7bc9864accface0c5e6e3d0246962781a4ff9f19cdc77e86c7a4f3d9f6","mutation_count":6,"result":{"Total":6,"Killed":6,"Survived":0,"Errors":0},"tested_at":"2026-11-04T12:22:20.977736860Z"},{"index":3,"name":"Emojis recientes 4","scenario_hash":"676e796e33dc86eb39c255a7bf050ab26889362e595fe7f7812f19ad8148dcc3","mutation_count":2,"result":{"Total":2,"Killed":2,"Survived":0,"Errors":0},"tested_at":"2026-11-04T12:22:20.977736860Z"},{"index":4,"name":"Emojis recientes 5","scenario_hash":"d9d83b4a9a559d23e7698a8e95bc800d66f944eb91149d005427654388b7dd69","mutation_count":2,"result":{"Total":2,"Killed":2,"Survived":0,"Errors":0},"tested_at":"2026-11-04T12:22:20.977736860Z"}]}
# acceptance-mutation-manifest-end

# Spec §6.2 (Emoji, Recientes). Los recientes del selector van del más
# reciente al más viejo. Elegir un emoji lo pone primero; si ya estaba no se
# repite (se mueve al primer lugar); la lista guarda como máximo 16 y, llena,
# descarta el más viejo.
# "los emojis recientes son" da la lista en orden, separada por ", ".
Feature: Emojis recientes

  # Emojis recientes 1
  # Elegir un emoji sin recientes previos: queda como único reciente.
  Scenario Outline: Emojis recientes 1
    Given que no hay emojis recientes
    When elijo el emoji <emoji>
    Then los emojis recientes son <recientes_guardados>

    Examples:
      | emoji | recientes_guardados |
      | 🌱     | 🌱                   |

  # Emojis recientes 2
  # El emoji elegido pasa al primer lugar y los anteriores bajan.
  Scenario Outline: Emojis recientes 2
    Given los emojis recientes son <recientes>
    When elijo el emoji <emoji>
    Then los emojis recientes son <recientes_guardados>

    Examples:
      | recientes | emoji | recientes_guardados |
      | 🔥, 🌱     | 🧹     | 🧹, 🔥, 🌱           |

  # Emojis recientes 3
  # Elegir uno que ya estaba: se mueve al primer lugar, sin repetirse.
  Scenario Outline: Emojis recientes 3
    Given los emojis recientes son <recientes>
    When elijo el emoji <emoji>
    Then los emojis recientes son <recientes_guardados>

    Examples:
      | recientes     | emoji | recientes_guardados |
      | 🔥, 🌱, 🧹     | 🧹     | 🧹, 🔥, 🌱           |
      | 🔥, 🌱, 🧹     | 🔥     | 🔥, 🌱, 🧹           |

  # Emojis recientes 4
  # Hasta 16 recientes se conservan todos.
  Scenario Outline: Emojis recientes 4
    Given hay <cantidad> emojis recientes
    When elijo un emoji que no estaba entre los recientes
    Then hay <cantidad_guardada> emojis recientes
    And el primero es el que elegí

    Examples:
      | cantidad | cantidad_guardada |
      | 15       | 16                |

  # Emojis recientes 5
  # Con 16 recientes, uno nuevo descarta el más viejo.
  Scenario Outline: Emojis recientes 5
    Given hay <cantidad> emojis recientes
    When elijo un emoji que no estaba entre los recientes
    Then hay <cantidad_guardada> emojis recientes
    And el primero es el que elegí
    And el emoji más viejo de antes ya no está

    Examples:
      | cantidad | cantidad_guardada |
      | 16       | 16                |
