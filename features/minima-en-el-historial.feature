# mutation-stamp: sha256=29a848233f36129b1b9adc99a965b9249ef441f878da9f3961f15a3ad3e87f34
# acceptance-mutation-manifest-begin
# {"version":1,"tested_at":"2026-11-16T01:53:24.117537279Z","feature_name":"Mínima en el Historial","feature_path":"features/minima-en-el-historial.feature","background_hash":"74234e98afe7498fb5daf1f36ac2d78acc339464f950703b8c019892f982b90b","implementation_hash":"sha256:8acac7a821a0e2b84bbbc0c75731d2b0722152e4cf189553dc95ad9f8d32a46c","scenarios":[{"index":0,"name":"Mínima en el Historial 1","scenario_hash":"91d066eef6729dcb844cd318cfe3971cb6fe8086d8606bb824dd0c991a758e41","mutation_count":7,"result":{"Total":7,"Killed":7,"Survived":0,"Errors":0},"tested_at":"2026-11-16T01:53:24.117537279Z"},{"index":1,"name":"Mínima en el Historial 2","scenario_hash":"1818c53161a507c9bbe43865241cebcfba958bac6fa82c8512035d1053a2e024","mutation_count":13,"result":{"Total":13,"Killed":13,"Survived":0,"Errors":0},"tested_at":"2026-11-16T01:53:24.117537279Z"},{"index":2,"name":"Mínima en el Historial 3","scenario_hash":"1dd6ca8c1c4b9a46593775c64a0d9d19ffa668c6be80cc74b503806a600700b8","mutation_count":9,"result":{"Total":9,"Killed":9,"Survived":0,"Errors":0},"tested_at":"2026-11-16T01:53:24.117537279Z"},{"index":3,"name":"Mínima en el Historial 4","scenario_hash":"d5abb36d7a03c8cd4d06052cf5ad2ddcac8169e97679ddaf499174d1e9fcacc9","mutation_count":7,"result":{"Total":7,"Killed":7,"Survived":0,"Errors":0},"tested_at":"2026-11-16T01:53:24.117537279Z"},{"index":4,"name":"Mínima en el Historial 5","scenario_hash":"220ced7b6645e1714367ccb21ff34e2c293a5dbe117908277209109c374b60e1","mutation_count":8,"result":{"Total":8,"Killed":8,"Survived":0,"Errors":0},"tested_at":"2026-11-16T01:53:24.117537279Z"}]}
# acceptance-mutation-manifest-end

# Spec §6.3 (Historial), con §4.4 (`fueMinima`) y §4.1 (Versión mínima). Si el
# completado fue la mínima, su entrada suma la palabra «Mínima» después de la
# hora ("08:05 Mínima"), en el mismo texto secundario; los completados enteros
# no suman nada. La entrada nunca muestra el texto de la versión mínima (el
# completado tampoco lo guarda), aunque la tarea la tenga o la edite después.
# El diálogo de Borrar, que nombra la tarea, la fecha, la hora y la palabra
# «Mínima», lo cubre la suite QA.
# "el Historial muestra" da los grupos en orden, separados por "; ", cada uno
# como "<encabezado>: <entradas>", y las entradas como "<título> <HH:MM>"
# (con " Mínima" al final si fue la mínima). Cada tarea se nombra por su
# título (una palabra). Semana de referencia: viernes 2026-11-13.
Feature: Mínima en el Historial

  # Mínima en el Historial 1
  # Un completado de la mínima suma «Mínima» después de la hora.
  Scenario Outline: Mínima en el Historial 1
    Given una tarea periódica relativa Regar cada <cada> <unidad>
    And la tarea Regar fue completada el <completada> con la mínima
    When consulto el Historial el <ahora>
    Then el Historial muestra <historial>

    Examples:
      | cada | unidad | completada          | ahora               | historial          |
      | 2    | dias   | 2026-11-13T08:05:00 | 2026-11-13T12:00:00 | Hoy: Regar 08:05 Mínima |

  # Mínima en el Historial 2
  # Un completado entero de la misma tarea no suma nada, y los dos conviven
  # en el mismo día y en distintos días.
  Scenario Outline: Mínima en el Historial 2
    Given una tarea periódica relativa Regar cada <cada> <unidad>
    And una tarea puntual Pagar sin fecha límite
    And la tarea Regar fue completada el <regar_ayer>
    And la tarea Regar fue completada el <regar_hoy> con la mínima
    And la tarea Pagar fue completada el <pagar>
    When consulto el Historial el <ahora>
    Then el Historial muestra <historial>

    Examples:
      | cada | unidad | regar_ayer          | regar_hoy           | pagar               | ahora               | historial                                      |
      | 2    | dias   | 2026-11-12T09:00:00 | 2026-11-13T08:05:00 | 2026-11-13T10:00:00 | 2026-11-13T12:00:00 | Hoy: Pagar 10:00, Regar 08:05 Mínima; Ayer: Regar 09:00 |

  # Mínima en el Historial 3
  # Con otro nombre de la tarea, la entrada muestra el nombre actual y sigue
  # diciendo «Mínima».
  Scenario Outline: Mínima en el Historial 3
    Given una tarea periódica relativa <titulo> cada <cada> <unidad>
    And la tarea fue completada el <completada> con la mínima
    When edito el título a <titulo_nuevo>
    And consulto el Historial el <ahora>
    Then el Historial muestra <historial>

    Examples:
      | titulo | cada | unidad | completada          | titulo_nuevo | ahora               | historial                  |
      | Regar  | 2    | dias   | 2026-11-13T08:05:00 | Plantas      | 2026-11-13T12:00:00 | Hoy: Plantas 08:05 Mínima |

  # Mínima en el Historial 4
  # Nunca muestra el texto de la versión mínima, ni el que tiene la tarea ahora.
  Scenario Outline: Mínima en el Historial 4
    Given una tarea periódica relativa Regar cada <cada> <unidad>
    And la versión mínima de la tarea es <minima>
    When toco Hice la mínima el <toque>
    And edito la versión mínima a <nueva>
    And consulto el Historial el <ahora>
    Then el Historial muestra <historial>

    Examples:
      | cada | unidad | minima            | toque               | nueva          | ahora               | historial               |
      | 2    | dias   | Solo los helechos | 2026-11-13T08:05:00 | Solo el brote  | 2026-11-13T12:00:00 | Hoy: Regar 08:05 Mínima |

  # Mínima en el Historial 5
  # Con pasos, la palabra «Mínima» no muestra pasos: la entrada es la misma
  # que la de una tarea sin pasos.
  Scenario Outline: Mínima en el Historial 5
    Given una tarea periódica relativa Regar cada <cada> <unidad>
    And los pasos de la tarea son <pasos>
    And la tarea fue completada el <completada> en el paso <paso_completado> con la mínima
    When consulto el Historial el <ahora>
    Then el Historial muestra <historial>

    Examples:
      | cada | unidad | pasos                                  | completada          | paso_completado | ahora               | historial               |
      | 2    | dias   | Llenar la regadera, Regar los helechos | 2026-11-13T08:05:00 | 2               | 2026-11-13T12:00:00 | Hoy: Regar 08:05 Mínima |
