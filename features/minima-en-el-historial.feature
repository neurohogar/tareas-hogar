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
