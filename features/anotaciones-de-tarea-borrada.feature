# Spec §5.10 (Borrar una tarea), §6.2 y §7. Borrar una tarea borra también todas
# sus anotaciones, y solo las suyas (en el mismo writeBatch que sus
# completados); las anotaciones sin tarea no se ven afectadas. Una anotación
# huérfana (otro dispositivo, sin conexión, anotó sobre una tarea que ya se
# borró) no se muestra en la pantalla Anotaciones ni se copia con Copiar, y se
# detecta para limpiarla, como un completado huérfano.
# Una anotación se nombra por el instante en que se anotó (distinto en cada
# anotación de un escenario). "Anotaciones muestra" da los grupos en orden,
# separados por "; ", cada uno como "<encabezado>: <anotaciones>", y las
# anotaciones en orden, separadas por ", ", cada una como sus partes separadas
# por " · ". Cada tarea se nombra por su título (una palabra).
Feature: Anotaciones de una tarea borrada

  # Anotaciones de tarea borrada 1
  # Borrar una tarea borra sus anotaciones y sus completados, y deja las de
  # otra tarea y las que no tienen tarea.
  Scenario Outline: Anotaciones de tarea borrada 1
    Given una tarea puntual Regar con fecha límite <limite>
    And una tarea puntual Pagar con fecha límite <limite>
    And la tarea Regar fue completada el <completada>
    And una anotación <sentido_1> en <pantalla_1> del <anotada_1>
    And la anotación se refiere a la tarea Regar
    And una anotación <sentido_2> en <pantalla_2> del <anotada_2>
    And la anotación se refiere a la tarea Regar
    And una anotación <sentido_3> en <pantalla_3> del <anotada_3>
    And la anotación se refiere a la tarea Pagar
    And una anotación <sentido_4> en <pantalla_4> del <anotada_4>
    When borro la tarea Regar
    And consulto Anotaciones el <ahora>
    Then no existe la tarea Regar
    And no queda ningún completado de Regar
    And quedan <cantidad> anotaciones
    And Anotaciones muestra <anotaciones>

    Examples:
      | limite     | completada          | sentido_1 | pantalla_1 | anotada_1           | sentido_2  | pantalla_2       | anotada_2           | sentido_3 | pantalla_3 | anotada_3           | sentido_4  | pantalla_4  | anotada_4           | ahora               | cantidad | anotaciones                                                                                |
      | 2026-07-20 | 2026-07-15T07:00:00 | Me sirvió | Pendientes | 2026-07-14T09:00:00 | Me molestó | Panel de edición | 2026-07-15T08:00:00 | Me sirvió | Historial  | 2026-07-15T09:00:00 | Me molestó | Anotaciones | 2026-07-15T10:00:00 | 2026-07-15T12:00:00 | 2        | Hoy: 10:00 · Me molestó · Anotaciones, 09:00 · Me sirvió · Historial · Pagar |

  # Anotaciones de tarea borrada 2
  # Borrar una tarea sin anotaciones no toca las que no tienen tarea.
  Scenario Outline: Anotaciones de tarea borrada 2
    Given una tarea puntual Regar con fecha límite <limite>
    And una anotación <sentido> en <pantalla> del <anotada>
    When borro la tarea Regar
    And consulto Anotaciones el <ahora>
    Then quedan <cantidad> anotaciones
    And Anotaciones muestra <anotaciones>

    Examples:
      | limite     | sentido   | pantalla   | anotada             | ahora               | cantidad | anotaciones                          |
      | 2026-07-20 | Me sirvió | Pendientes | 2026-07-15T08:00:00 | 2026-07-15T12:00:00 | 1        | Hoy: 08:00 · Me sirvió · Pendientes  |

  # Anotaciones de tarea borrada 3
  # Anotación huérfana: otro dispositivo, sin ver el borrado, anota sobre la
  # tarea borrada. La pantalla y Copiar la ignoran, y es la única que se
  # detecta para limpiar; las de las tareas que existen y las que no tienen
  # tarea no.
  Scenario Outline: Anotaciones de tarea borrada 3
    Given una tarea puntual Regar con fecha límite <limite>
    And una tarea puntual Pagar con fecha límite <limite>
    And una anotación <sentido_1> en <pantalla_1> del <anotada_1>
    And la anotación se refiere a la tarea Pagar
    And una anotación <sentido_2> en <pantalla_2> del <anotada_2>
    When borro la tarea Regar
    And otro dispositivo, sin ver ese cambio, anota <sentido_huerfana> en <pantalla_huerfana> el <anotada_huerfana> sobre la tarea Regar
    And consulto Anotaciones el <ahora>
    And copio las anotaciones
    Then Anotaciones muestra <anotaciones>
    And el texto copiado tiene las líneas <lineas>
    And las anotaciones huérfanas a limpiar son solo la del <anotada_huerfana>

    Examples:
      | limite     | sentido_1 | pantalla_1 | anotada_1           | sentido_2  | pantalla_2 | anotada_2           | sentido_huerfana | pantalla_huerfana | anotada_huerfana    | ahora               | anotaciones                                                                       | lineas                                                                                  |
      | 2026-07-20 | Me sirvió | Historial  | 2026-07-15T08:00:00 | Me molestó | Pendientes | 2026-07-15T09:00:00 | Me sirvió        | Etiquetas         | 2026-07-15T10:00:00 | 2026-07-15T12:00:00 | Hoy: 09:00 · Me molestó · Pendientes, 08:00 · Me sirvió · Historial · Pagar       | 2026-07-15 08:00 · Me sirvió · Historial · Pagar; 2026-07-15 09:00 · Me molestó · Pendientes |
