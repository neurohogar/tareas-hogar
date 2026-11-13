# Spec §5.4 (Deshacer, el aviso) con §6.1 (Fecha y distancia). Al completar una
# periódica, debajo de «Completaste …» el aviso dice cuándo vuelve: «Vuelve <fecha>
# [ · <distancia>]», con el instante de regreso calculado después del
# completado y el mismo formato (y el mismo texto) que mostrará su fila en
# espera. Una puntual (que no vuelve) muestra solo «Completaste …». No hay otro
# cierre ni felicitaciones. Duración, Deshacer y reemplazo no cambian
# (aviso-deshacer.feature).
# El aviso lo abre un "completo la tarea ..." de este dispositivo y se ve
# mientras completadoEn <= ahora < completadoEn + 5 segundos; el regreso se
# cuenta desde ahora. "el aviso del completado muestra el regreso T" afirma
# que el aviso nombra la tarea y dice T debajo. Cada tarea se nombra por su
# título (una palabra). Semana de referencia: viernes 2026-11-13.
Feature: Aviso con regreso

  # Aviso con regreso 1
  # Relativa: V con hora. Fila 2: ahora es 4 segundos después del completado
  # (7 horas, 59 minutos y 56 segundos es «en 8 horas»).
  Scenario Outline: Aviso con regreso 1
    Given una tarea periódica relativa Regar cada <cada> <unidad>
    When completo la tarea Regar el <completada>
    And consulto el aviso el <ahora>
    Then el aviso del completado muestra el regreso <regreso>

    Examples:
      | cada | unidad | completada          | ahora               | regreso                                 |
      | 8    | horas  | 2026-11-13T10:00:00 | 2026-11-13T10:00:00 | Vuelve hoy 18:00 · en 8 horas           |
      | 8    | horas  | 2026-11-13T10:00:00 | 2026-11-13T10:00:04 | Vuelve hoy 18:00 · en 8 horas           |
      | 1    | horas  | 2026-11-13T10:00:00 | 2026-11-13T10:00:00 | Vuelve hoy 11:00 · en 1 hora            |
      | 1    | dias   | 2026-11-13T10:00:00 | 2026-11-13T10:00:00 | Vuelve mañana 10:00 · en 24 horas       |
      | 6    | dias   | 2026-11-13T10:00:00 | 2026-11-13T10:00:00 | Vuelve el jueves 19 10:00 · en 6 días   |

  # Aviso con regreso 2
  # Calendario: 00:00 de la próxima ocurrencia, sin hora. Fila 1: cubre la más
  # reciente sin cubrir (el 12) y vuelve el jueves siguiente. Fila 2: «mañana»
  # no lleva distancia. Fila 3: completar antes de tiempo cubre la próxima (el
  # 19), así que vuelve la semana siguiente (el 26).
  Scenario Outline: Aviso con regreso 2
    Given una tarea periódica semanal Regar los <dias> creada el <creada>
    When completo la tarea Regar el <completada>
    And consulto el aviso el <ahora>
    Then el aviso del completado muestra el regreso <regreso>

    Examples:
      | dias   | creada              | completada          | ahora               | regreso                           |
      | jueves | 2026-11-01T08:00:00 | 2026-11-13T10:00:00 | 2026-11-13T10:00:00 | Vuelve el jueves 19 · en 6 días   |
      | sábado | 2026-11-01T08:00:00 | 2026-11-13T10:00:00 | 2026-11-13T10:00:00 | Vuelve mañana                     |
      | jueves | 2026-11-13T08:00:00 | 2026-11-13T10:00:00 | 2026-11-13T10:00:00 | Vuelve el jueves 26 · en 13 días  |

  # Aviso con regreso 3
  # Relativa con horario: A. Fila 1: V (22:00) cae fuera de la ventana y vuelve
  # cuando abre (mañana 08:00). Fila 2: V cae dentro de la ventana.
  Scenario Outline: Aviso con regreso 3
    Given una tarea periódica relativa Regar cada <cada> <unidad>
    And la tarea Regar se puede completar de <desde> a <hasta>
    When completo la tarea Regar el <completada>
    And consulto el aviso el <ahora>
    Then el aviso del completado muestra el regreso <regreso>

    Examples:
      | cada | unidad | desde | hasta | completada          | ahora               | regreso                           |
      | 12   | horas  | 08:00 | 10:30 | 2026-11-13T10:00:00 | 2026-11-13T10:00:00 | Vuelve mañana 08:00 · en 22 horas |
      | 1    | dias   | 08:00 | 11:00 | 2026-11-13T10:00:00 | 2026-11-13T10:00:00 | Vuelve mañana 10:00 · en 24 horas |

  # Aviso con regreso 4
  # Puntual con fecha límite (pendiente en la fila 1, atrasada en la fila 2):
  # no vuelve, así que el aviso es solo «Completaste …».
  Scenario Outline: Aviso con regreso 4
    Given una tarea puntual Pagar con fecha límite <limite>
    When completo la tarea Pagar el <completada>
    And consulto el aviso el <ahora>
    Then el aviso del completado no muestra regreso

    Examples:
      | limite     | completada          | ahora               |
      | 2026-11-20 | 2026-11-13T10:00:00 | 2026-11-13T10:00:00 |
      | 2026-11-05 | 2026-11-13T10:00:00 | 2026-11-13T10:00:00 |

  # Aviso con regreso 5
  # Puntual sin fecha límite: tampoco lleva regreso.
  Scenario Outline: Aviso con regreso 5
    Given una tarea puntual Pagar sin fecha límite
    When completo la tarea Pagar el <completada>
    And consulto el aviso el <ahora>
    Then el aviso del completado no muestra regreso

    Examples:
      | completada          | ahora               |
      | 2026-11-13T10:00:00 | 2026-11-13T10:00:04 |
