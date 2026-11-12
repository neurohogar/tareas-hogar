# mutation-stamp: sha256=77fdbf21d1d65026c0b7a135c9e3abf97ea2d3498f11a91f9be4d154e27b229d
# acceptance-mutation-manifest-begin
# {"version":1,"tested_at":"2026-11-03T14:58:01.274014213Z","feature_name":"Color de etiqueta","feature_path":"features/color-de-etiqueta.feature","background_hash":"4e25b3add2de21bf87027d7baad0fecf182c768f005788878252c777a860f33d","implementation_hash":"sha256:8f400ac58a7d9ca21f7519b9f90ab8d82eadb0295153eeb0cb41ccab839208c8","scenarios":[{"index":0,"name":"Color de etiqueta 1","scenario_hash":"407ee17a1690c2670d513b2b254478b484f8c7e0e012cad66a2ec7b66545504c","mutation_count":2,"result":{"Total":2,"Killed":2,"Survived":0,"Errors":0},"tested_at":"2026-11-03T14:58:01.274014213Z"},{"index":1,"name":"Color de etiqueta 2","scenario_hash":"7d5419bb28a3ff9164dee6feb1c4b4b388d5361dd9049a8c642e3200aa80e7ad","mutation_count":11,"result":{"Total":11,"Killed":11,"Survived":0,"Errors":0},"tested_at":"2026-11-03T14:58:01.274014213Z"},{"index":2,"name":"Color de etiqueta 3","scenario_hash":"a03e4d086b28e391174c773c7051c4c0f477a1eec3bc880bdc7a5317742ae21f","mutation_count":3,"result":{"Total":3,"Killed":3,"Survived":0,"Errors":0},"tested_at":"2026-11-03T14:58:01.274014213Z"},{"index":3,"name":"Color de etiqueta 4","scenario_hash":"d9a2f33b1ac1b5d3159c1357c3a742a69f1791a6958949105d260f8b70cb5ade","mutation_count":2,"result":{"Total":2,"Killed":2,"Survived":0,"Errors":0},"tested_at":"2026-11-03T14:58:01.274014213Z"},{"index":4,"name":"Color de etiqueta 5","scenario_hash":"86e3a4640d7d74c3749f3fa6705ca94564e14665754939c01c1b413b6a3917c4","mutation_count":5,"result":{"Total":5,"Killed":5,"Survived":0,"Errors":0},"tested_at":"2026-11-03T14:58:01.274014213Z"},{"index":5,"name":"Color de etiqueta 6","scenario_hash":"c291c384d567cfa81caddf3b5a99700d1f45b8c1ac7f1fe171527865f7af0d72","mutation_count":4,"result":{"Total":4,"Killed":4,"Survived":0,"Errors":0},"tested_at":"2026-11-03T14:58:01.274014213Z"}]}
# acceptance-mutation-manifest-end

# Spec §4.3 (Color de una etiqueta nueva). Paleta, en orden: gris, rojo,
# naranja, amarillo, verde, celeste, azul, violeta.
# Una etiqueta nueva toma el color de la paleta que menos etiquetas
# existentes tienen (usadas o no por alguna tarea); si empatan, el primero de
# la paleta. Si un mismo guardado crea varias, se asignan en el orden en que
# se escribieron, cada una contando las anteriores.
# "existen las etiquetas" da "<nombre>:<color>" separados por ", ". "la
# pantalla Etiquetas muestra" da todas las etiquetas que existen, en orden
# alfabético, como "<nombre>:<color>", sin otras.
Feature: Color de etiqueta

  Background:
    Given una tarea puntual Pagar sin fecha límite

  # Color de etiqueta 1
  # Sin etiquetas, la primera toma el primer color de la paleta.
  Scenario Outline: Color de etiqueta 1
    When edito las etiquetas de la tarea Pagar a <escritas>
    Then la pantalla Etiquetas muestra <etiquetas_guardadas>

    Examples:
      | escritas | etiquetas_guardadas |
      | Cocina   | Cocina:gris         |

  # Color de etiqueta 2
  # Toma el color menos usado; si empatan, el primero de la paleta. Fila 1:
  # gris ya está usado. Fila 2: gris está libre aunque rojo no. Fila 3: los
  # tres primeros usados. Fila 4: todos usados una vez, vuelve a gris.
  # Fila 5: gris usado dos veces y el resto una, salvo violeta. Fila 6: gris
  # y rojo usados dos veces, el resto una: el primero con una, naranja.
  Scenario Outline: Color de etiqueta 2
    Given existen las etiquetas <existentes>
    When edito las etiquetas de la tarea Pagar a <escritas>
    Then la etiqueta nueva tiene color <color>

    Examples:
      | existentes                                                                                   | escritas | color    |
      | Baño:gris                                                                                    | Cocina   | rojo     |
      | Baño:rojo                                                                                    | Cocina   | gris     |
      | Baño:gris, Living:rojo, Patio:naranja                                                        | Cocina   | amarillo |
      | A:gris, B:rojo, C:naranja, D:amarillo, E:verde, F:celeste, G:azul, H:violeta                 | Cocina   | gris     |
      | A:gris, B:rojo, C:naranja, D:amarillo, E:verde, F:celeste, G:azul, I:gris                    | Cocina   | violeta  |
      | A:gris, B:rojo, C:naranja, D:amarillo, E:verde, F:celeste, G:azul, H:violeta, I:gris, J:rojo | Cocina   | naranja  |

  # Color de etiqueta 3
  # Varias nuevas en un mismo guardado: se asignan en el orden en que se
  # escribieron (no alfabético), cada una contando las anteriores.
  Scenario Outline: Color de etiqueta 3
    Given existen las etiquetas <existentes>
    When edito las etiquetas de la tarea Pagar a <escritas>
    Then la pantalla Etiquetas muestra <etiquetas_guardadas>

    Examples:
      | existentes | escritas      | etiquetas_guardadas                   |
      | Baño:gris  | Patio, Cocina | Baño:gris, Cocina:naranja, Patio:rojo |

  # Color de etiqueta 4
  # Una etiqueta existente escrita junto a una nueva conserva su color; la
  # nueva cuenta los colores de todas las existentes.
  Scenario Outline: Color de etiqueta 4
    Given existen las etiquetas <existentes>
    When edito las etiquetas de la tarea Pagar a <escritas>
    Then la pantalla Etiquetas muestra <etiquetas_guardadas>

    Examples:
      | existentes              | escritas      | etiquetas_guardadas                 |
      | Cocina:gris, Baño:verde | cocina, Patio | Baño:verde, Cocina:gris, Patio:rojo |

  # Color de etiqueta 5
  # El color que se cuenta es el actual: después de recolorear, el color
  # liberado vuelve a estar disponible.
  Scenario Outline: Color de etiqueta 5
    Given existen las etiquetas <existentes>
    When cambio el color de la etiqueta <recoloreada> a <color_nuevo>
    And edito las etiquetas de la tarea Pagar a <escritas>
    Then la pantalla Etiquetas muestra <etiquetas_guardadas>

    Examples:
      | existentes            | recoloreada | color_nuevo | escritas | etiquetas_guardadas                |
      | Baño:gris, Patio:rojo | Baño        | rojo        | Cocina   | Baño:rojo, Cocina:gris, Patio:rojo |

  # Color de etiqueta 6
  # Las etiquetas borradas no cuentan.
  Scenario Outline: Color de etiqueta 6
    Given existen las etiquetas <existentes>
    When borro la etiqueta <borrada>
    And edito las etiquetas de la tarea Pagar a <escritas>
    Then la pantalla Etiquetas muestra <etiquetas_guardadas>

    Examples:
      | existentes            | borrada | escritas | etiquetas_guardadas     |
      | Baño:gris, Patio:rojo | Baño    | Cocina   | Cocina:gris, Patio:rojo |
