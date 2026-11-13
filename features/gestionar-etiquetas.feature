# mutation-stamp: sha256=287a9882b2f9ec53f58a5b4a09e9c8ddb6bfb3bf33419930587def6f572e238c
# acceptance-mutation-manifest-begin
# {"version":1,"tested_at":"2026-11-13T22:12:02.870822373Z","feature_name":"Gestionar etiquetas","feature_path":"features/gestionar-etiquetas.feature","background_hash":"9521082c77c7288bf1e55566d31477cf37c6079bfa4c2229e585c93c1025c40e","implementation_hash":"sha256:34fcb68bf674747147969ec57133bc0c0834f1a4f71a70524c00c28646bdf709","scenarios":[{"index":0,"name":"Gestionar etiquetas 1","scenario_hash":"307307f0a56b2d08d61418c4f6907e0e287fe08a6f97d79c97c6c9b8bf01fb96","mutation_count":18,"result":{"Total":18,"Killed":18,"Survived":0,"Errors":0},"tested_at":"2026-11-13T22:12:02.870822373Z"},{"index":1,"name":"Gestionar etiquetas 2","scenario_hash":"a0b0702f40fbf209f68980c777cd0ba2f708eb64a786e221762119ba33dc561b","mutation_count":4,"result":{"Total":4,"Killed":4,"Survived":0,"Errors":0},"tested_at":"2026-11-13T22:12:02.870822373Z"},{"index":2,"name":"Gestionar etiquetas 3","scenario_hash":"f6bc9884144d35cad51b49aaf9252fe04d68083821bdf6400ee21c8df6410892","mutation_count":6,"result":{"Total":6,"Killed":6,"Survived":0,"Errors":0},"tested_at":"2026-11-13T22:12:02.870822373Z"},{"index":3,"name":"Gestionar etiquetas 4","scenario_hash":"8e039ac640d40a6e1356a7bff2abc8b55096bee5b7593706532462b0386c5422","mutation_count":4,"result":{"Total":4,"Killed":4,"Survived":0,"Errors":0},"tested_at":"2026-11-13T22:12:02.870822373Z"},{"index":4,"name":"Gestionar etiquetas 5","scenario_hash":"5ab492fdcb9b8d756a2ec15bcee10a9c632c8633e1d0730b667f836c7e260ff6","mutation_count":3,"result":{"Total":3,"Killed":3,"Survived":0,"Errors":0},"tested_at":"2026-11-13T22:12:02.870822373Z"},{"index":5,"name":"Gestionar etiquetas 6","scenario_hash":"49669f15feba88aeeb4aeb4363b531f785de075ee1a3793aebc2b7783d612e1c","mutation_count":4,"result":{"Total":4,"Killed":4,"Survived":0,"Errors":0},"tested_at":"2026-11-13T22:12:02.870822373Z"},{"index":6,"name":"Gestionar etiquetas 7","scenario_hash":"547dd25f7f7398ec21b105bae101acf0dc53fa94e0fbaa2cd4a6f3238c500c15","mutation_count":3,"result":{"Total":3,"Killed":3,"Survived":0,"Errors":0},"tested_at":"2026-11-13T22:12:02.870822373Z"},{"index":7,"name":"Gestionar etiquetas 8","scenario_hash":"477cf6e3f8a9f3ecee69b41952488e67161633d5d65ed747a8a9223522a1b7ee","mutation_count":12,"result":{"Total":12,"Killed":12,"Survived":0,"Errors":0},"tested_at":"2026-11-13T22:12:02.870822373Z"},{"index":8,"name":"Gestionar etiquetas 9","scenario_hash":"91679f8401ed608d2b6228e9e3c98c0a9b43988796b061311da2f8caff546d4d","mutation_count":7,"result":{"Total":7,"Killed":7,"Survived":0,"Errors":0},"tested_at":"2026-11-13T22:12:02.870822373Z"},{"index":9,"name":"Gestionar etiquetas 10","scenario_hash":"a35e32d66e9275b9744b933ecb567549c78185c2454b46ee5ba161bd5c7a8168","mutation_count":3,"result":{"Total":3,"Killed":3,"Survived":0,"Errors":0},"tested_at":"2026-11-13T22:12:02.870822373Z"}]}
# acceptance-mutation-manifest-end

# Spec §4.3 y §6.4 (pantalla Etiquetas). Desde la pantalla Etiquetas se
# renombra, se cambia el color y se borra una etiqueta.
# Renombrar: se quitan los espacios del principio y del final; vacío (o solo
# espacios), de más de 30 caracteres, o igual al de otra etiqueta (sin
# distinguir mayúsculas) se rechaza y no cambia nada. Cambiar solo
# mayúsculas de la misma etiqueta sí se permite. Las tareas muestran el
# nombre nuevo.
# Borrar una etiqueta la quita de todas las tareas; las tareas no se borran.
# La confirmación del borrado se verifica en la suite QA.
# "existen las etiquetas" da "<nombre>:<color>" separados por ", ". "la
# pantalla Etiquetas muestra" da todas las etiquetas que existen, en orden
# alfabético, como "<nombre>:<color>", sin otras. "la tarea X muestra las
# etiquetas" da los chips de su fila en orden, sin otros. Las tareas y las
# etiquetas de los Given se crearon antes de cualquier otra fecha del
# escenario, en el orden declarado; los ids de etiqueta crecen en ese orden.
Feature: Gestionar etiquetas

  Background:
    Given una tarea puntual Pagar sin fecha límite
    And una tarea periódica relativa Regar nunca completada

  # Gestionar etiquetas 1
  # Renombrar: la etiqueta y las tareas que la tienen muestran el nombre
  # nuevo, con el mismo color. Fila 2: solo cambian mayúsculas. Fila 3: el
  # mismo nombre, sin cambios.
  Scenario Outline: Gestionar etiquetas 1
    Given existen las etiquetas <existentes>
    And la tarea Pagar tiene las etiquetas <etiquetas_pagar>
    When renombro la etiqueta <etiqueta> a <nombre_nuevo>
    Then la pantalla Etiquetas muestra <etiquetas_guardadas>
    And la tarea Pagar muestra las etiquetas <chips_pagar>

    Examples:
      | existentes              | etiquetas_pagar | etiqueta | nombre_nuevo | etiquetas_guardadas     | chips_pagar  |
      | Cocina:azul, Baño:verde | Cocina, Baño    | Cocina   | Comida       | Baño:verde, Comida:azul | Baño, Comida |
      | Cocina:azul, Baño:verde | Cocina          | Cocina   | COCINA       | Baño:verde, COCINA:azul | COCINA       |
      | Cocina:azul, Baño:verde | Cocina          | Cocina   | Cocina       | Baño:verde, Cocina:azul | Cocina       |

  # Gestionar etiquetas 2
  # Renombrar quita los espacios del principio y del final.
  Scenario Outline: Gestionar etiquetas 2
    Given existen las etiquetas <existentes>
    When renombro la etiqueta <etiqueta> a <nombre_nuevo> con espacios al principio y al final
    Then la pantalla Etiquetas muestra <etiquetas_guardadas>

    Examples:
      | existentes  | etiqueta | nombre_nuevo | etiquetas_guardadas |
      | Cocina:azul | Cocina   | Ropa sucia   | Ropa sucia:azul     |

  # Gestionar etiquetas 3
  # Renombrar al nombre de otra etiqueta, sin distinguir mayúsculas, se
  # rechaza y no cambia nada.
  Scenario Outline: Gestionar etiquetas 3
    Given existen las etiquetas <existentes>
    When renombro la etiqueta <etiqueta> a <nombre_nuevo>
    Then el renombrado se rechaza por nombre repetido
    And la pantalla Etiquetas muestra <etiquetas_guardadas>

    Examples:
      | existentes              | etiqueta | nombre_nuevo | etiquetas_guardadas     |
      | Cocina:azul, Baño:verde | Cocina   | Baño         | Baño:verde, Cocina:azul |
      | Cocina:azul, Baño:verde | Cocina   | BAÑO         | Baño:verde, Cocina:azul |

  # Gestionar etiquetas 4
  # Un nombre que difiere solo en acentos es otro nombre: se permite. En el
  # orden empatan (no distingue acentos) y va primero la de id menor, la
  # declarada antes (la renombrada).
  Scenario Outline: Gestionar etiquetas 4
    Given existen las etiquetas <existentes>
    When renombro la etiqueta <etiqueta> a <nombre_nuevo>
    Then la pantalla Etiquetas muestra <etiquetas_guardadas>

    Examples:
      | existentes               | etiqueta | nombre_nuevo | etiquetas_guardadas     |
      | Cocina:azul, Árbol:verde | Cocina   | Arbol        | Arbol:azul, Árbol:verde |

  # Gestionar etiquetas 5
  # Renombrar a un nombre de más de 30 caracteres se rechaza.
  Scenario Outline: Gestionar etiquetas 5
    Given existen las etiquetas <existentes>
    When renombro la etiqueta <etiqueta> a <nombre_nuevo>
    Then el renombrado se rechaza por nombre demasiado largo
    And la pantalla Etiquetas muestra <etiquetas_guardadas>

    Examples:
      | existentes  | etiqueta | nombre_nuevo                    | etiquetas_guardadas |
      | Cocina:azul | Cocina   | Limpieza profunda del baño 1234 | Cocina:azul         |

  # Gestionar etiquetas 6
  # Renombrar a un nombre de 30 caracteres, el máximo, es válido.
  Scenario Outline: Gestionar etiquetas 6
    Given existen las etiquetas <existentes>
    When renombro la etiqueta <etiqueta> a <nombre_nuevo>
    Then la pantalla Etiquetas muestra <etiquetas_guardadas>

    Examples:
      | existentes  | etiqueta | nombre_nuevo                   | etiquetas_guardadas                 |
      | Cocina:azul | Cocina   | Limpieza profunda del baño 123 | Limpieza profunda del baño 123:azul |

  # Gestionar etiquetas 7
  # Renombrar a un nombre vacío o de solo espacios se rechaza.
  Scenario Outline: Gestionar etiquetas 7
    Given existen las etiquetas <existentes>
    When renombro la etiqueta <etiqueta> a uno de solo espacios
    Then el renombrado se rechaza por nombre vacío
    And la pantalla Etiquetas muestra <etiquetas_guardadas>

    Examples:
      | existentes  | etiqueta | etiquetas_guardadas |
      | Cocina:azul | Cocina   | Cocina:azul         |

  # Gestionar etiquetas 8
  # Cambiar el color: solo cambia el de esa etiqueta; las tareas la siguen
  # teniendo.
  Scenario Outline: Gestionar etiquetas 8
    Given existen las etiquetas <existentes>
    And la tarea Pagar tiene las etiquetas <etiquetas_pagar>
    When cambio el color de la etiqueta <etiqueta> a <color_nuevo>
    Then la pantalla Etiquetas muestra <etiquetas_guardadas>
    And la tarea Pagar muestra las etiquetas <chips_pagar>

    Examples:
      | existentes              | etiquetas_pagar | etiqueta | color_nuevo | etiquetas_guardadas        | chips_pagar  |
      | Cocina:azul, Baño:verde | Cocina, Baño    | Cocina   | violeta     | Baño:verde, Cocina:violeta | Baño, Cocina |
      | Cocina:azul, Baño:verde | Cocina          | Baño     | azul        | Baño:azul, Cocina:azul     | Cocina       |

  # Gestionar etiquetas 9
  # Borrar una etiqueta la quita de todas las tareas, que siguen existiendo
  # con sus otras etiquetas y en Pendientes.
  Scenario Outline: Gestionar etiquetas 9
    Given existen las etiquetas <existentes>
    And la tarea Pagar tiene las etiquetas <etiquetas_pagar>
    And la tarea Regar tiene las etiquetas <etiquetas_regar>
    When borro la etiqueta <etiqueta>
    And consulto Pendientes en cualquier momento
    Then la pantalla Etiquetas muestra <etiquetas_guardadas>
    And la tarea Pagar muestra las etiquetas <chips_pagar>
    And la tarea Regar no muestra etiquetas
    And Pendientes muestra en orden <orden>

    Examples:
      | existentes              | etiquetas_pagar | etiquetas_regar | etiqueta | etiquetas_guardadas | chips_pagar | orden        |
      | Cocina:azul, Baño:verde | Baño, Cocina    | Cocina          | Cocina   | Baño:verde          | Baño        | Regar, Pagar |

  # Gestionar etiquetas 10
  # Borrar la única etiqueta: la pantalla Etiquetas queda vacía.
  Scenario Outline: Gestionar etiquetas 10
    Given existen las etiquetas <existentes>
    And la tarea Pagar tiene las etiquetas <etiquetas_pagar>
    When borro la etiqueta <etiqueta>
    Then la pantalla Etiquetas no muestra ninguna etiqueta
    And la tarea Pagar no muestra etiquetas

    Examples:
      | existentes  | etiquetas_pagar | etiqueta |
      | Cocina:azul | Cocina          | Cocina   |
