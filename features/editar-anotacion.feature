# Spec §6.7 (Editar texto), §4.5 y §7 (Conflictos). Editar texto cambia solo el
# texto de una anotación, con las reglas de §4.5: una sola línea, sin largo
# máximo, recorte de los espacios del inicio y del final; vaciarlo (o dejar solo
# espacios) la deja sin texto. El sentido, el instante, la pantalla y la tarea
# no cambian.
# Si dos dispositivos editan el texto sin ver el cambio del otro, gana el último
# en llegar (el orden de los pasos: primero el mío, después el del otro
# dispositivo). Borrar gana sobre editar: una edición de una anotación ya
# borrada no la revive.
# Una anotación se nombra por el instante en que se anotó (distinto en cada
# anotación de un escenario). Cada tarea se nombra por su título (una palabra).
Feature: Editar anotación

  # Editar anotación 1
  # Cambiar el texto deja todo lo demás como estaba.
  Scenario Outline: Editar anotación 1
    Given una tarea puntual <titulo> sin fecha límite
    And una anotación <sentido> en <pantalla> del <anotada>
    And la anotación se refiere a la tarea <titulo>
    And la anotación dice <texto>
    When edito el texto de la anotación del <anotada> a <texto_nuevo>
    Then queda una sola anotación
    And la anotación del <anotada> dice <texto_guardado>
    And la anotación del <anotada> tiene sentido <sentido_guardado> en <pantalla_guardada>
    And la anotación del <anotada> es de la tarea <titulo>

    Examples:
      | titulo | sentido    | pantalla         | anotada             | texto       | texto_nuevo  | texto_guardado | sentido_guardado | pantalla_guardada |
      | Regar  | Me molestó | Panel de edición | 2026-07-15T08:05:00 | quedó lindo | quedó mal    | quedó mal      | Me molestó       | Panel de edición  |

  # Editar anotación 2
  # Una anotación sin texto puede recibir uno, y sin tarea sigue sin tarea.
  Scenario Outline: Editar anotación 2
    Given una anotación <sentido> en <pantalla> del <anotada>
    When edito el texto de la anotación del <anotada> a <texto_nuevo>
    Then la anotación del <anotada> dice <texto_guardado>
    And la anotación del <anotada> no es de ninguna tarea
    And la anotación del <anotada> tiene sentido <sentido_guardado> en <pantalla_guardada>

    Examples:
      | sentido   | pantalla   | anotada             | texto_nuevo | texto_guardado | sentido_guardado | pantalla_guardada |
      | Me sirvió | Pendientes | 2026-07-15T08:05:00 | quedó lindo | quedó lindo    | Me sirvió        | Pendientes        |

  # Editar anotación 3
  # Los espacios del inicio y del final se recortan y los de adentro quedan;
  # el texto no tiene largo máximo.
  Scenario Outline: Editar anotación 3
    Given una anotación <sentido> en <pantalla> del <anotada>
    And la anotación dice <texto>
    When edito el texto de la anotación del <anotada> a <texto_nuevo> entre <espacios> espacios
    Then la anotación del <anotada> dice <texto_guardado>

    Examples:
      | sentido   | pantalla   | anotada             | texto       | texto_nuevo | espacios | texto_guardado |
      | Me sirvió | Pendientes | 2026-07-15T08:05:00 | quedó lindo | muy lindo   | 0        | muy lindo      |
      | Me sirvió | Pendientes | 2026-07-15T08:05:00 | quedó lindo | muy lindo   | 3        | muy lindo      |

  # Editar anotación 4
  # Vaciar el texto, o dejar solo espacios, la deja sin texto: nunca es un
  # error.
  Scenario Outline: Editar anotación 4
    Given una anotación <sentido> en <pantalla> del <anotada>
    And la anotación dice <texto>
    When edito el texto de la anotación del <anotada> a <espacios> espacios
    Then la anotación del <anotada> no tiene texto
    And la anotación del <anotada> tiene sentido <sentido_guardado> en <pantalla_guardada>

    Examples:
      | sentido    | pantalla  | anotada             | texto       | espacios | sentido_guardado | pantalla_guardada |
      | Me molestó | Historial | 2026-07-15T08:05:00 | quedó lindo | 0        | Me molestó       | Historial         |
      | Me molestó | Historial | 2026-07-15T08:05:00 | quedó lindo | 2        | Me molestó       | Historial         |

  # Editar anotación 5
  # Solo cambia la anotación elegida: las otras no se tocan.
  Scenario Outline: Editar anotación 5
    Given una anotación <sentido_a> en <pantalla_a> del <anotada_a>
    And la anotación dice <texto_a>
    And una anotación <sentido_b> en <pantalla_b> del <anotada_b>
    And la anotación dice <texto_b>
    When edito el texto de la anotación del <anotada_a> a <texto_nuevo>
    Then la anotación del <anotada_a> dice <texto_nuevo_guardado>
    And la anotación del <anotada_b> dice <texto_b_guardado>

    Examples:
      | sentido_a | pantalla_a | anotada_a           | texto_a | sentido_b  | pantalla_b | anotada_b           | texto_b | texto_nuevo | texto_nuevo_guardado | texto_b_guardado |
      | Me sirvió | Pendientes | 2026-07-15T08:05:00 | uno     | Me molestó | Historial  | 2026-07-15T09:10:00 | dos     | tres        | tres                 | dos              |

  # Editar anotación 6
  # Dos dispositivos editan el texto: gana el último en llegar.
  Scenario Outline: Editar anotación 6
    Given una anotación <sentido> en <pantalla> del <anotada>
    And la anotación dice <texto>
    When edito el texto de la anotación del <anotada> a <primero>
    And otro dispositivo, sin ver ese cambio, edita el texto de la anotación del <anotada> a <segundo>
    Then la anotación del <anotada> dice <texto_guardado>
    And la anotación del <anotada> tiene sentido <sentido_guardado> en <pantalla_guardada>

    Examples:
      | sentido   | pantalla   | anotada             | texto | primero | segundo | texto_guardado | sentido_guardado | pantalla_guardada |
      | Me sirvió | Pendientes | 2026-07-15T08:05:00 | uno   | dos     | tres    | tres           | Me sirvió        | Pendientes        |

  # Editar anotación 7
  # Borrar gana sobre editar: si otro dispositivo borra la anotación que yo
  # edité, la anotación no queda.
  Scenario Outline: Editar anotación 7
    Given una anotación <sentido> en <pantalla> del <anotada>
    And la anotación dice <texto>
    When edito el texto de la anotación del <anotada> a <nuevo>
    And otro dispositivo, sin ver ese cambio, borra la anotación del <anotada>
    Then no existe la anotación del <anotada>
    And no queda ninguna anotación

    Examples:
      | sentido   | pantalla   | anotada             | texto | nuevo |
      | Me sirvió | Pendientes | 2026-07-15T08:05:00 | uno   | dos   |

  # Editar anotación 8
  # Una edición de una anotación ya borrada no la revive: borro yo y después
  # llega la edición del otro dispositivo.
  Scenario Outline: Editar anotación 8
    Given una anotación <sentido> en <pantalla> del <anotada>
    And la anotación dice <texto>
    When borro la anotación del <anotada>
    And otro dispositivo, sin ver ese cambio, edita el texto de la anotación del <anotada> a <nuevo>
    Then no existe la anotación del <anotada>
    And no queda ninguna anotación

    Examples:
      | sentido   | pantalla   | anotada             | texto | nuevo |
      | Me sirvió | Pendientes | 2026-07-15T08:05:00 | uno   | dos   |
