# Spec §4.5 (Anotación) y §5.10 (Anotar). Un gesto de dos toques guarda una
# anotación «Me sirvió» o «Me molestó» con el contexto tomado solo: el instante,
# la pantalla y, si la hay, la tarea. La persona no elige ni corrige el contexto.
# pantalla: el Panel de edición si el panel está abierto (al crear o al editar),
# sobre cualquier pantalla; si no, la pantalla donde está (Pendientes, Historial,
# Etiquetas o Anotaciones).
# tareaId: la tarea del panel si está abierto al editar; si no, la que nombra el
# aviso de deshacer (§5.4) si está visible; si no, ninguna. Con el panel abierto
# al crear no hay tarea, aunque haya un aviso de deshacer visible.
# Texto: una línea opcional, sin largo máximo; se recortan los espacios del
# inicio y del final, y vacío o solo espacios es sin texto. Nunca es inválido.
# Una anotación se nombra por el instante en que se anotó. Cada tarea se nombra
# por su título (una palabra). Que el recuadro tiene el campo y los dos botones,
# que Atrás lo cierra sin anotar, la confirmación y que el botón está en todas
# las pantallas con sesión se verifican en la suite QA (qa/anotacion.md).
Feature: Anotar

  # Anotar 1
  # Sin panel ni aviso: sentido, instante y la pantalla donde está la persona;
  # sin tarea y sin texto.
  Scenario Outline: Anotar 1
    Given estoy en <pantalla>
    When anoto <sentido> el <ahora>
    Then queda una sola anotación
    And la anotación del <ahora> tiene sentido <sentido_guardado> en <pantalla_guardada>
    And la anotación del <ahora> no es de ninguna tarea
    And la anotación del <ahora> no tiene texto

    Examples:
      | pantalla     | sentido    | ahora               | sentido_guardado | pantalla_guardada |
      | Pendientes   | Me sirvió  | 2026-07-15T08:05:00 | Me sirvió        | Pendientes        |
      | Historial    | Me molestó | 2026-07-15T09:10:30 | Me molestó       | Historial         |
      | Etiquetas    | Me sirvió  | 2026-07-15T23:59:59 | Me sirvió        | Etiquetas         |
      | Anotaciones  | Me molestó | 2026-07-16T00:00:00 | Me molestó       | Anotaciones       |

  # Anotar 2
  # Con el panel abierto al editar una tarea, la pantalla es el Panel de
  # edición, sobre cualquier pantalla, y la tarea es la del panel.
  Scenario Outline: Anotar 2
    Given una tarea puntual Regar sin fecha límite
    And estoy en <pantalla>
    And el panel de edición está abierto al editar la tarea Regar
    When anoto <sentido> el <ahora>
    Then queda una sola anotación
    And la anotación del <ahora> tiene sentido <sentido_guardado> en <pantalla_guardada>
    And la anotación del <ahora> es de la tarea Regar

    Examples:
      | pantalla    | sentido    | ahora               | sentido_guardado | pantalla_guardada |
      | Pendientes  | Me sirvió  | 2026-07-15T08:05:00 | Me sirvió        | Panel de edición  |
      | Historial   | Me molestó | 2026-07-15T08:05:00 | Me molestó       | Panel de edición  |
      | Etiquetas   | Me sirvió  | 2026-07-15T08:05:00 | Me sirvió        | Panel de edición  |
      | Anotaciones | Me molestó | 2026-07-15T08:05:00 | Me molestó       | Panel de edición  |

  # Anotar 3
  # Con el panel abierto al crear no hay tarea, sobre cualquier pantalla.
  Scenario Outline: Anotar 3
    Given estoy en <pantalla>
    And el panel de edición está abierto al crear una tarea
    When anoto <sentido> el <ahora>
    Then queda una sola anotación
    And la anotación del <ahora> tiene sentido <sentido_guardado> en <pantalla_guardada>
    And la anotación del <ahora> no es de ninguna tarea

    Examples:
      | pantalla    | sentido    | ahora               | sentido_guardado | pantalla_guardada |
      | Pendientes  | Me sirvió  | 2026-07-15T08:05:00 | Me sirvió        | Panel de edición  |
      | Historial   | Me molestó | 2026-07-15T08:05:00 | Me molestó       | Panel de edición  |

  # Anotar 4
  # Con el panel cerrado y el aviso de deshacer visible, la tarea es la que
  # nombra el aviso: visible hasta el último segundo antes de los 5 segundos.
  Scenario Outline: Anotar 4
    Given una tarea puntual Regar sin fecha límite
    And estoy en <pantalla>
    When completo la tarea Regar el <completada>
    And anoto <sentido> el <ahora>
    Then queda una sola anotación
    And la anotación del <ahora> tiene sentido <sentido_guardado> en <pantalla_guardada>
    And la anotación del <ahora> es de la tarea Regar

    Examples:
      | pantalla    | sentido    | completada          | ahora               | sentido_guardado | pantalla_guardada |
      | Pendientes  | Me sirvió  | 2026-07-15T08:00:00 | 2026-07-15T08:00:00 | Me sirvió        | Pendientes        |
      | Historial   | Me molestó | 2026-07-15T08:00:00 | 2026-07-15T08:00:04 | Me molestó       | Historial         |
      | Etiquetas   | Me sirvió  | 2026-07-15T08:00:00 | 2026-07-15T08:00:04 | Me sirvió        | Etiquetas         |
      | Anotaciones | Me molestó | 2026-07-15T08:00:00 | 2026-07-15T08:00:04 | Me molestó       | Anotaciones       |

  # Anotar 5
  # Con el aviso de deshacer ya vencido (5 segundos o más) no hay tarea.
  Scenario Outline: Anotar 5
    Given una tarea puntual Regar sin fecha límite
    And estoy en <pantalla>
    When completo la tarea Regar el <completada>
    And anoto <sentido> el <ahora>
    Then queda una sola anotación
    And la anotación del <ahora> tiene sentido <sentido_guardado> en <pantalla_guardada>
    And la anotación del <ahora> no es de ninguna tarea

    Examples:
      | pantalla   | sentido   | completada          | ahora               | sentido_guardado | pantalla_guardada |
      | Pendientes | Me sirvió | 2026-07-15T08:00:00 | 2026-07-15T08:00:05 | Me sirvió        | Pendientes        |
      | Historial  | Me sirvió | 2026-07-15T08:00:00 | 2026-07-15T09:00:00 | Me sirvió        | Historial         |

  # Anotar 6
  # Con el panel abierto al editar, manda la tarea del panel aunque haya un
  # aviso de deshacer visible de otra tarea.
  Scenario Outline: Anotar 6
    Given una tarea puntual Regar sin fecha límite
    And una tarea puntual Pagar sin fecha límite
    And estoy en <pantalla>
    When completo la tarea Regar el <completada>
    And el panel de edición está abierto al editar la tarea Pagar
    And anoto <sentido> el <ahora>
    Then queda una sola anotación
    And la anotación del <ahora> tiene sentido <sentido_guardado> en <pantalla_guardada>
    And la anotación del <ahora> es de la tarea Pagar

    Examples:
      | pantalla   | sentido   | completada          | ahora               | sentido_guardado | pantalla_guardada |
      | Pendientes | Me sirvió | 2026-07-15T08:00:00 | 2026-07-15T08:00:02 | Me sirvió        | Panel de edición  |

  # Anotar 7
  # Con el panel abierto al crear no hay tarea aunque haya un aviso de
  # deshacer visible.
  Scenario Outline: Anotar 7
    Given una tarea puntual Regar sin fecha límite
    And estoy en <pantalla>
    When completo la tarea Regar el <completada>
    And el panel de edición está abierto al crear una tarea
    And anoto <sentido> el <ahora>
    Then queda una sola anotación
    And la anotación del <ahora> tiene sentido <sentido_guardado> en <pantalla_guardada>
    And la anotación del <ahora> no es de ninguna tarea

    Examples:
      | pantalla   | sentido    | completada          | ahora               | sentido_guardado | pantalla_guardada |
      | Pendientes | Me molestó | 2026-07-15T08:00:00 | 2026-07-15T08:00:02 | Me molestó       | Panel de edición  |

  # Anotar 8
  # El texto escrito se guarda tal cual; los espacios del inicio y del final
  # se recortan y los de adentro quedan.
  Scenario Outline: Anotar 8
    Given estoy en <pantalla>
    When anoto <sentido> el <ahora> con el texto <texto> entre <espacios> espacios
    Then queda una sola anotación
    And la anotación del <ahora> dice <texto_guardado>

    Examples:
      | pantalla   | sentido    | ahora               | texto       | espacios | texto_guardado |
      | Pendientes | Me sirvió  | 2026-07-15T08:05:00 | quedó lindo | 0        | quedó lindo    |
      | Historial  | Me molestó | 2026-07-15T08:05:00 | quedó lindo | 3        | quedó lindo    |

  # Anotar 9
  # Vacío o solo espacios es sin texto: el campo no se guarda y nunca es un
  # error.
  Scenario Outline: Anotar 9
    Given estoy en <pantalla>
    When anoto <sentido> el <ahora> con <espacios> espacios como texto
    Then queda una sola anotación
    And la anotación del <ahora> no tiene texto

    Examples:
      | pantalla   | sentido    | ahora               | espacios |
      | Pendientes | Me sirvió  | 2026-07-15T08:05:00 | 0        |
      | Historial  | Me molestó | 2026-07-15T08:05:00 | 1        |
      | Historial  | Me sirvió  | 2026-07-15T08:05:00 | 4        |

  # Anotar 10
  # El texto no tiene largo máximo.
  Scenario Outline: Anotar 10
    Given estoy en <pantalla>
    When anoto <sentido> el <ahora> con un texto de <largo> caracteres
    Then queda una sola anotación
    And la anotación del <ahora> dice un texto de <largo_guardado> caracteres

    Examples:
      | pantalla   | sentido   | ahora               | largo | largo_guardado |
      | Pendientes | Me sirvió | 2026-07-15T08:05:00 | 1     | 1              |
      | Pendientes | Me sirvió | 2026-07-15T08:05:00 | 5000  | 5000           |

  # Anotar 11
  # Anotar no es un cambio del panel: con el panel abierto sin cambios sigue
  # abierto y sin cambios sin guardar.
  Scenario Outline: Anotar 11
    Given una tarea puntual Regar sin fecha límite
    And estoy en <pantalla>
    And el panel de edición está abierto al editar la tarea Regar
    When anoto <sentido> el <ahora> con el texto <texto>
    Then el panel sigue abierto sin cambios sin guardar

    Examples:
      | pantalla   | sentido    | ahora               | texto       |
      | Pendientes | Me molestó | 2026-07-15T08:05:00 | quedó lindo |

  # Anotar 12
  # Dos dispositivos anotan sin conexión: no se pierde ninguna, cada una
  # con su contexto.
  Scenario Outline: Anotar 12
    Given estoy en <pantalla>
    When anoto <sentido> el <ahora>
    And otro dispositivo, sin ver ese cambio, anota <sentido_otro> en <pantalla_otro> el <ahora_otro>
    Then quedan <cantidad> anotaciones
    And la anotación del <ahora> tiene sentido <sentido> en <pantalla>
    And la anotación del <ahora_otro> tiene sentido <sentido_otro> en <pantalla_otro>

    Examples:
      | pantalla   | sentido   | ahora               | sentido_otro | pantalla_otro | ahora_otro          | cantidad |
      | Pendientes | Me sirvió | 2026-07-15T08:05:00 | Me molestó   | Historial     | 2026-07-15T08:06:00 | 2        |
