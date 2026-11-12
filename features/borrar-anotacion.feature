# Spec §6.7 (Borrar). Borrar una anotación la saca de la pantalla Anotaciones
# y de lo que copia Copiar, y solo a ella. La confirmación (diálogo con Borrar y
# Cancelar; Cancelar no cambia nada) se verifica en la suite QA
# (qa/anotacion.md).
# Una anotación se nombra por el instante en que se anotó (distinto en cada
# anotación de un escenario). "Anotaciones muestra" da los grupos en orden,
# separados por "; ", cada uno como "<encabezado>: <anotaciones>", y las
# anotaciones en orden, separadas por ", ", cada una como sus partes separadas
# por " · ".
Feature: Borrar anotación

  # Borrar anotación 1
  # Borrar una anotación la saca de la pantalla y deja las otras.
  Scenario Outline: Borrar anotación 1
    Given una anotación <sentido_a> en <pantalla_a> del <anotada_a>
    And una anotación <sentido_b> en <pantalla_b> del <anotada_b>
    And la anotación dice <texto_b>
    When borro la anotación del <anotada_a>
    And consulto Anotaciones el <ahora>
    Then no existe la anotación del <anotada_a>
    And Anotaciones muestra <anotaciones>

    Examples:
      | sentido_a | pantalla_a | anotada_a           | sentido_b  | pantalla_b | anotada_b           | texto_b     | ahora               | anotaciones                                          |
      | Me sirvió | Pendientes | 2026-07-15T08:05:00 | Me molestó | Historial  | 2026-07-15T09:10:00 | quedó lindo | 2026-07-15T12:00:00 | Hoy: 09:10 · Me molestó · Historial · quedó lindo    |

  # Borrar anotación 2
  # Borrar la única anotación deja la pantalla vacía y nada para copiar.
  Scenario Outline: Borrar anotación 2
    Given una anotación <sentido> en <pantalla> del <anotada>
    When borro la anotación del <anotada>
    And consulto Anotaciones el <ahora>
    And copio las anotaciones
    Then Anotaciones está vacía
    And no hay nada para copiar
    And no queda ninguna anotación

    Examples:
      | sentido   | pantalla   | anotada             | ahora               |
      | Me sirvió | Pendientes | 2026-07-15T08:05:00 | 2026-07-15T12:00:00 |

  # Borrar anotación 3
  # Borrar una anotación no toca su tarea ni sus completados.
  Scenario Outline: Borrar anotación 3
    Given una tarea puntual <titulo> con fecha límite <limite>
    And la tarea <titulo> fue completada el <completada>
    And una anotación <sentido> en <pantalla> del <anotada>
    And la anotación se refiere a la tarea <titulo>
    When borro la anotación del <anotada>
    Then no queda ninguna anotación
    And la tarea <titulo> conserva un solo completado, del <completada_guardada>

    Examples:
      | titulo | limite     | completada          | sentido   | pantalla   | anotada             | completada_guardada |
      | Pagar  | 2026-07-20 | 2026-07-15T08:00:00 | Me sirvió | Pendientes | 2026-07-15T08:05:00 | 2026-07-15T08:00:00 |
