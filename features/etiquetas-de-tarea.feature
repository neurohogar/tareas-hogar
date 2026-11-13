# mutation-stamp: sha256=fdba9eec4e1280e9e3108b26b600329f9f84169fc2b15f16bdfe2a4d1162957e
# acceptance-mutation-manifest-begin
# {"version":1,"tested_at":"2026-11-13T22:10:10.021344363Z","feature_name":"Etiquetas de una tarea","feature_path":"features/etiquetas-de-tarea.feature","background_hash":"4e25b3add2de21bf87027d7baad0fecf182c768f005788878252c777a860f33d","implementation_hash":"sha256:573f3fd91d51fa4d69784ca46033cd7e863df50021081f5f8189105f14475182","scenarios":[{"index":0,"name":"Etiquetas de una tarea 1","scenario_hash":"7d109bf146ceaef3fa668a7e31e939bdbb430233dd17efa98af3e76e49abd179","mutation_count":6,"result":{"Total":6,"Killed":6,"Survived":0,"Errors":0},"tested_at":"2026-11-13T22:10:10.021344363Z"},{"index":1,"name":"Etiquetas de una tarea 2","scenario_hash":"e1286474d60736bf7c6ea63954169cb7f14cb914169a3a5601f6f1fff94b1afa","mutation_count":3,"result":{"Total":3,"Killed":3,"Survived":0,"Errors":0},"tested_at":"2026-11-13T22:10:10.021344363Z"},{"index":2,"name":"Etiquetas de una tarea 3","scenario_hash":"96e6ce2e0694ae214058c4fe0c8fa1bf5c997b6784da1fad36e9251f941777a3","mutation_count":9,"result":{"Total":9,"Killed":9,"Survived":0,"Errors":0},"tested_at":"2026-11-13T22:10:10.021344363Z"},{"index":3,"name":"Etiquetas de una tarea 4","scenario_hash":"381a517920323bb26136fc6fd77a1318d0685f0990720651ce49cfeac1f44dbe","mutation_count":6,"result":{"Total":6,"Killed":6,"Survived":0,"Errors":0},"tested_at":"2026-11-13T22:10:10.021344363Z"},{"index":4,"name":"Etiquetas de una tarea 5","scenario_hash":"67bc57879754bbdb7654610acb99bf36b7dd7fd9724c44b9ce04491c91a4b871","mutation_count":4,"result":{"Total":4,"Killed":4,"Survived":0,"Errors":0},"tested_at":"2026-11-13T22:10:10.021344363Z"},{"index":5,"name":"Etiquetas de una tarea 6","scenario_hash":"089f13f9fd284c84774040e3c8975b65a06153fb4f6ae7177826b2bbc959c3c5","mutation_count":3,"result":{"Total":3,"Killed":3,"Survived":0,"Errors":0},"tested_at":"2026-11-13T22:10:10.021344363Z"},{"index":6,"name":"Etiquetas de una tarea 7","scenario_hash":"0b29ed7c8bd47ffe58ce485050892ea973b3f98a8243c1d7eab809d2e8691194","mutation_count":7,"result":{"Total":7,"Killed":7,"Survived":0,"Errors":0},"tested_at":"2026-11-13T22:10:10.021344363Z"},{"index":7,"name":"Etiquetas de una tarea 8","scenario_hash":"9621d5794252c9a037cd848e1e9f3280b42206fd9b078144e978d2acd170b7f8","mutation_count":3,"result":{"Total":3,"Killed":3,"Survived":0,"Errors":0},"tested_at":"2026-11-13T22:10:10.021344363Z"},{"index":11,"name":"Etiquetas de una tarea 12","scenario_hash":"5e73777b4606c64b9b04ab6b1cca05e67bbe5a9d456936c63ef77262864cedf0","mutation_count":1,"result":{"Total":1,"Killed":1,"Survived":0,"Errors":0},"tested_at":"2026-11-13T22:10:10.021344363Z"},{"index":12,"name":"Etiquetas de una tarea 13","scenario_hash":"a37534118706b9e5bceca4e364513c0eb61a7175d47c2f1a55c7f705ddccefa5","mutation_count":3,"result":{"Total":3,"Killed":3,"Survived":0,"Errors":0},"tested_at":"2026-11-13T22:10:10.021344363Z"}]}
# acceptance-mutation-manifest-end

# Spec §4.1 (etiquetas), §4.3 (Etiqueta) y §6.2 (Etiquetas en el panel).
# Las etiquetas de una tarea se eligen en el panel al crearla o editarla.
# Escribir un nombre que no existe crea la etiqueta al guardar; un nombre que
# ya existe (sin distinguir mayúsculas) usa esa etiqueta, con su nombre
# guardado. Una etiqueta no se repite en una tarea y no hay límite por tarea.
# Nombre: se quitan los espacios del principio y del final; vacío (o solo
# espacios) o de más de 30 caracteres es inválido y rechaza la creación o la
# edición entera: no se guarda ningún campo ni se crea ninguna etiqueta.
# Una etiqueta que deja de usarse no se borra sola.
# "las etiquetas ... <lista>" da nombres separados por ", ", tal como se
# escriben en el panel. "edito las etiquetas de la tarea X a ..." deja a la
# tarea exactamente con esas etiquetas (reemplaza las que tenía) y guarda.
# "existen las etiquetas" da "<nombre>:<color>" separados por ", ".
# "la tarea X muestra las etiquetas" da los chips de su fila en orden, sin
# otros chips. "la pantalla Etiquetas muestra" da todas las etiquetas que
# existen, en orden, como "<nombre>:<color>", sin otras.
# Paleta, en orden: gris, rojo, naranja, amarillo, verde, celeste, azul,
# violeta. Una etiqueta nueva toma el color menos usado (lo cubre
# features/color-de-etiqueta.feature).
Feature: Etiquetas de una tarea

  Background:
    Given una tarea puntual Pagar sin fecha límite

  # Etiquetas de una tarea 1
  # Escribir nombres nuevos crea las etiquetas al guardar y la tarea las
  # tiene. Fila 2: una sola etiqueta.
  Scenario Outline: Etiquetas de una tarea 1
    When edito las etiquetas de la tarea Pagar a <escritas>
    Then la tarea Pagar muestra las etiquetas <chips>
    And la pantalla Etiquetas muestra <etiquetas_guardadas>

    Examples:
      | escritas       | chips          | etiquetas_guardadas      |
      | Facturas, Casa | Casa, Facturas | Casa:rojo, Facturas:gris |
      | Ropa sucia     | Ropa sucia     | Ropa sucia:gris          |

  # Etiquetas de una tarea 2
  # Crear una tarea con etiquetas: la tarea nueva las tiene.
  Scenario Outline: Etiquetas de una tarea 2
    When creo una tarea puntual con título <titulo>, sin fecha límite y con las etiquetas <escritas>
    Then la tarea que se creó muestra las etiquetas <chips>
    And la pantalla Etiquetas muestra <etiquetas_guardadas>

    Examples:
      | titulo | escritas | chips  | etiquetas_guardadas |
      | Barrer | Cocina   | Cocina | Cocina:gris         |

  # Etiquetas de una tarea 3
  # Un nombre que ya existe, sin distinguir mayúsculas, usa esa etiqueta con
  # su nombre y su color guardados: no crea otra.
  Scenario Outline: Etiquetas de una tarea 3
    Given existen las etiquetas <existentes>
    When edito las etiquetas de la tarea Pagar a <escritas>
    Then la tarea Pagar muestra las etiquetas <chips>
    And la pantalla Etiquetas muestra <etiquetas_guardadas>

    Examples:
      | existentes  | escritas | chips  | etiquetas_guardadas |
      | Cocina:azul | COCINA   | Cocina | Cocina:azul         |
      | Cocina:azul | Cocina   | Cocina | Cocina:azul         |
      | Baño:verde  | baño     | Baño   | Baño:verde          |

  # Etiquetas de una tarea 4
  # La misma etiqueta escrita dos veces (aunque cambien las mayúsculas)
  # queda una sola vez en la tarea, con el primer nombre escrito.
  Scenario Outline: Etiquetas de una tarea 4
    When edito las etiquetas de la tarea Pagar a <escritas>
    Then la tarea Pagar muestra las etiquetas <chips>
    And la pantalla Etiquetas muestra <etiquetas_guardadas>

    Examples:
      | escritas             | chips         | etiquetas_guardadas     |
      | Cocina, cocina       | Cocina        | Cocina:gris             |
      | Patio, Cocina, PATIO | Cocina, Patio | Cocina:rojo, Patio:gris |

  # Etiquetas de una tarea 5
  # Quitar etiquetas de la tarea: la tarea queda solo con las que se dejan y
  # las etiquetas quitadas siguen existiendo (no se borran solas).
  Scenario Outline: Etiquetas de una tarea 5
    Given existen las etiquetas <existentes>
    And la tarea Pagar tiene las etiquetas <iniciales>
    When edito las etiquetas de la tarea Pagar a <escritas>
    Then la tarea Pagar muestra las etiquetas <chips>
    And la pantalla Etiquetas muestra <etiquetas_guardadas>

    Examples:
      | existentes              | iniciales    | escritas | chips  | etiquetas_guardadas     |
      | Baño:verde, Cocina:rojo | Baño, Cocina | Cocina   | Cocina | Baño:verde, Cocina:rojo |

  # Etiquetas de una tarea 6
  # Quitar todas las etiquetas: la tarea queda sin etiquetas y las etiquetas
  # siguen existiendo.
  Scenario Outline: Etiquetas de una tarea 6
    Given existen las etiquetas <existentes>
    And la tarea Pagar tiene las etiquetas <iniciales>
    When edito la tarea Pagar para quitarle todas las etiquetas
    Then la tarea Pagar no muestra etiquetas
    And la pantalla Etiquetas muestra <etiquetas_guardadas>

    Examples:
      | existentes              | iniciales    | etiquetas_guardadas     |
      | Baño:verde, Cocina:rojo | Baño, Cocina | Baño:verde, Cocina:rojo |

  # Etiquetas de una tarea 7
  # Los espacios del principio y del final no forman parte del nombre: se
  # crea sin ellos, y si sin ellos coincide con una existente, usa esa.
  Scenario Outline: Etiquetas de una tarea 7
    Given existen las etiquetas <existentes>
    When edito las etiquetas de la tarea Pagar a <escrita> con espacios al principio y al final
    Then la tarea Pagar muestra las etiquetas <chips>
    And la pantalla Etiquetas muestra <etiquetas_guardadas>

    Examples:
      | existentes  | escrita    | chips      | etiquetas_guardadas          |
      | Cocina:azul | Ropa sucia | Ropa sucia | Cocina:azul, Ropa sucia:gris |
      | Cocina:azul | cocina     | Cocina     | Cocina:azul                  |

  # Etiquetas de una tarea 8
  # Un nombre de 30 caracteres, el máximo, es válido.
  Scenario Outline: Etiquetas de una tarea 8
    When edito las etiquetas de la tarea Pagar a <escritas>
    Then la tarea Pagar muestra las etiquetas <chips>
    And la pantalla Etiquetas muestra <etiquetas_guardadas>

    Examples:
      | escritas                       | chips                          | etiquetas_guardadas                 |
      | Limpieza profunda del baño 123 | Limpieza profunda del baño 123 | Limpieza profunda del baño 123:gris |

  # Etiquetas de una tarea 9
  # Un nombre de más de 30 caracteres rechaza la edición entera: la tarea no
  # cambia y no se crea ninguna etiqueta, tampoco las válidas.
  Scenario Outline: Etiquetas de una tarea 9
    When edito las etiquetas de la tarea Pagar a <escritas>
    Then la edición se rechaza por nombre de etiqueta demasiado largo
    And la tarea no cambia
    And la pantalla Etiquetas no muestra ninguna etiqueta

    Examples:
      | escritas                              |
      | Casa, Limpieza profunda del baño 1234 |

  # Etiquetas de una tarea 10
  # Un nombre de solo espacios cuenta como vacío y rechaza la edición entera.
  Scenario: Etiquetas de una tarea 10
    When edito las etiquetas de la tarea Pagar a una de solo espacios
    Then la edición se rechaza por nombre de etiqueta vacío
    And la tarea no cambia
    And la pantalla Etiquetas no muestra ninguna etiqueta

  # Etiquetas de una tarea 11
  # Crear una tarea con un nombre de etiqueta inválido: no se crea la tarea
  # ni la etiqueta.
  Scenario Outline: Etiquetas de una tarea 11
    When creo una tarea puntual con título <titulo>, sin fecha límite y con las etiquetas <escritas>
    Then la creación se rechaza por nombre de etiqueta demasiado largo
    And no se crea ninguna tarea nueva
    And la pantalla Etiquetas no muestra ninguna etiqueta

    Examples:
      | titulo | escritas                        |
      | Barrer | Limpieza profunda del baño 1234 |

  # Etiquetas de una tarea 12
  # Una edición rechazada por otro campo (título vacío) tampoco crea las
  # etiquetas nuevas que se escribieron.
  Scenario Outline: Etiquetas de una tarea 12
    When edito en una misma edición el título a <titulo_nuevo> y las etiquetas a <escritas>
    Then la edición se rechaza por título vacío
    And la tarea no cambia
    And la pantalla Etiquetas no muestra ninguna etiqueta

    Examples:
      | titulo_nuevo | escritas |
      |              | Cocina   |

  # Etiquetas de una tarea 13
  # Editar otro campo no toca las etiquetas de la tarea.
  Scenario Outline: Etiquetas de una tarea 13
    Given existen las etiquetas <existentes>
    And la tarea Pagar tiene las etiquetas <iniciales>
    When edito la tarea Pagar a puntual con fecha límite <limite_nuevo>
    Then la tarea Pagar muestra las etiquetas <chips>

    Examples:
      | existentes              | iniciales    | limite_nuevo | chips        |
      | Baño:verde, Cocina:rojo | Cocina, Baño | 2026-07-25   | Baño, Cocina |
