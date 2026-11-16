# Spec §6.1 (botón «Hice la mínima»), con §4.1 (Versión mínima y Pasos), §4.4
# (`fueMinima`), §5.4, §5.5 y §7. «Hice la mínima» completa la tarea como el
# checkbox, pero el completado guarda que fue la mínima (`fueMinima`): el
# estado y la lista lo tratan como a cualquier otro completado. El aviso suma
# « · mínima». En una tarea de dos pasos o más guarda `pasoAlCompletar` y
# `pasoActual` vuelve al paso 1, en cualquier paso. Un completado de la mínima
# se borra como cualquier otro, y que fue la mínima se fija al completar: ni
# editar o vaciar la versión mínima de la tarea ni nada más lo cambia.
# "toco Hice la mínima el T" es el botón de la fila de la única tarea del
# escenario (o de la tarea que se nombra). Los Given "con la mínima" dejan un
# completado ya guardado, que no abre aviso. "el último completado de la tarea
# fue la mínima / fue entero" mira el completado de completadoEn más reciente.
# El aviso lo abre un toque de este dispositivo y se ve mientras
# completadoEn <= ahora < completadoEn + 5 segundos.
# Semana de referencia: viernes 2026-11-13.
Feature: Hice la mínima

  # Hice la mínima 1
  # En una puntual agrega un completado que fue la mínima y la tarea queda
  # completada.
  Scenario Outline: Hice la mínima 1
    Given una tarea puntual sin fecha límite
    And la versión mínima de la tarea es <minima>
    When toco Hice la mínima el <toque>
    Then la tarea está completada
    And el completado registrado es del <toque_guardado>
    And el último completado de la tarea fue la mínima

    Examples:
      | minima          | toque               | toque_guardado      |
      | Solo el inodoro | 2026-11-13T10:00:00 | 2026-11-13T10:00:00 |

  # Hice la mínima 2
  # En una relativa reinicia el intervalo desde el toque: queda en espera, con
  # el progreso de un completado entero.
  Scenario Outline: Hice la mínima 2
    Given una tarea periódica relativa cada <cada> <unidad>
    And la versión mínima de la tarea es <minima>
    When toco Hice la mínima el <toque>
    And consulto el estado el <ahora>
    Then el estado es en espera
    And el progreso es <progreso>

    Examples:
      | cada | unidad | minima            | toque               | ahora               | progreso |
      | 4    | horas  | Solo los helechos | 2026-11-13T10:00:00 | 2026-11-13T12:00:00 | 0.5      |

  # Hice la mínima 3
  # En una de calendario cubre la ocurrencia que corresponde, como un
  # completado entero: la última sin cubrir (el jueves 12) y queda en espera.
  Scenario Outline: Hice la mínima 3
    Given una tarea periódica semanal los <dias> creada el <creada>
    And la versión mínima de la tarea es <minima>
    When toco Hice la mínima el <toque>
    And consulto el estado el <ahora>
    Then se registró un completado que cubre el <cubierta>
    And el estado es en espera

    Examples:
      | dias   | creada              | minima               | toque               | ahora               | cubierta   |
      | jueves | 2026-11-01T08:00:00 | Solo la de la cocina | 2026-11-13T10:00:00 | 2026-11-13T10:00:01 | 2026-11-12 |

  # Hice la mínima 4
  # Dentro de la ventana de la tarea se puede hacer, como completar (§5.5).
  Scenario Outline: Hice la mínima 4
    Given una tarea puntual sin fecha límite creada el <creada>
    And la tarea se puede completar de <desde> a <hasta>
    And la versión mínima de la tarea es <minima>
    When toco Hice la mínima el <toque>
    Then la tarea está completada
    And el último completado de la tarea fue la mínima

    Examples:
      | creada              | desde | hasta | minima          | toque               |
      | 2026-11-13T06:00:00 | 08:00 | 11:00 | Solo el inodoro | 2026-11-13T09:00:00 |

  # Hice la mínima 5
  # El aviso nombra la tarea (emoji y título) y suma « · mínima»; no muestra el
  # texto de la versión mínima.
  Scenario Outline: Hice la mínima 5
    Given una tarea puntual <titulo> sin fecha límite con emoji <emoji>
    And la versión mínima de la tarea es <minima>
    When toco Hice la mínima el <toque>
    And consulto el aviso el <ahora>
    Then el aviso del completado dice <texto>

    Examples:
      | titulo | emoji | minima          | toque               | ahora               | texto                           |
      | Regar  | 🌱     | Solo los helechos | 2026-11-13T10:00:00 | 2026-11-13T10:00:04 | Completaste «🌱 Regar» · mínima |

  # Hice la mínima 6
  # Sin emoji, solo el título.
  Scenario Outline: Hice la mínima 6
    Given una tarea puntual <titulo> sin fecha límite
    And la versión mínima de la tarea es <minima>
    When toco Hice la mínima el <toque>
    And consulto el aviso el <ahora>
    Then el aviso del completado dice <texto>

    Examples:
      | titulo | minima            | toque               | ahora               | texto                        |
      | Regar  | Solo los helechos | 2026-11-13T10:00:00 | 2026-11-13T10:00:00 | Completaste «Regar» · mínima |

  # Hice la mínima 7
  # Completar entera la misma tarea (checkbox) no suma « · mínima».
  Scenario Outline: Hice la mínima 7
    Given una tarea puntual <titulo> sin fecha límite con emoji <emoji>
    And la versión mínima de la tarea es <minima>
    When toco el checkbox de la tarea el <toque>
    And consulto el aviso el <ahora>
    Then el aviso del completado dice <texto>
    And el último completado de la tarea fue entero

    Examples:
      | titulo | emoji | minima            | toque               | ahora               | texto                 |
      | Regar  | 🌱     | Solo los helechos | 2026-11-13T10:00:00 | 2026-11-13T10:00:00 | Completaste «🌱 Regar» |

  # Hice la mínima 8
  # El aviso de una periódica dice cuándo vuelve, debajo, como siempre.
  Scenario Outline: Hice la mínima 8
    Given una tarea periódica relativa Regar cada <cada> <unidad>
    And la versión mínima de la tarea Regar es <minima>
    When toco Hice la mínima en la tarea Regar el <toque>
    And consulto el aviso el <ahora>
    Then el aviso del completado dice <texto>
    And el aviso del completado muestra el regreso <regreso>

    Examples:
      | cada | unidad | minima            | toque               | ahora               | texto                        | regreso                       |
      | 8    | horas  | Solo los helechos | 2026-11-13T10:00:00 | 2026-11-13T10:00:00 | Completaste «Regar» · mínima | Vuelve hoy 18:00 · en 8 horas |

  # Hice la mínima 9
  # Deshacer en el aviso borra el completado de la mínima y cierra el aviso.
  Scenario Outline: Hice la mínima 9
    Given una tarea puntual sin fecha límite
    And la versión mínima de la tarea es <minima>
    When toco Hice la mínima el <toque>
    And toco Deshacer en el aviso el <deshacer>
    And consulto el aviso el <ahora>
    Then la tarea no tiene completados
    And no hay aviso

    Examples:
      | minima          | toque               | deshacer            | ahora               |
      | Solo el inodoro | 2026-11-13T10:00:00 | 2026-11-13T10:00:02 | 2026-11-13T10:00:03 |

  # Hice la mínima 10
  # Borrar el completado (Historial) recalcula el estado con los que quedan:
  # U pasa al anterior, con el que ya venció, y la tarea vuelve pendiente.
  Scenario Outline: Hice la mínima 10
    Given una tarea periódica relativa cada <cada> <unidad>
    And la tarea fue completada el <primera>
    And la tarea fue completada el <segunda> con la mínima
    When borro el completado del <segunda>
    And consulto el estado el <ahora>
    Then la tarea conserva un solo completado, del <primera>
    And el estado es pendiente

    Examples:
      | cada | unidad | primera             | segunda             | ahora               |
      | 2    | dias   | 2026-11-09T09:00:00 | 2026-11-10T09:00:00 | 2026-11-11T12:00:00 |

  # Hice la mínima 11
  # El checkbox de una puntual completada con la mínima borra ese completado.
  Scenario Outline: Hice la mínima 11
    Given Mostrar completadas está encendido
    And una tarea puntual sin fecha límite
    And la tarea fue completada el <completada> con la mínima
    When toco el checkbox de la tarea el <toque>
    And consulto el estado el <ahora>
    Then la tarea no tiene completados
    And el estado es pendiente

    Examples:
      | completada          | toque               | ahora               |
      | 2026-11-13T08:00:00 | 2026-11-13T10:00:00 | 2026-11-13T10:00:01 |

  # Hice la mínima 12
  # El checkbox de una completada borra el completado más reciente, sea entero
  # o la mínima: acá el más reciente es la mínima y queda el entero.
  Scenario Outline: Hice la mínima 12
    Given Mostrar completadas está encendido
    And una tarea puntual sin fecha límite
    And la tarea fue completada el <primera>
    And la tarea fue completada el <segunda> con la mínima
    When toco el checkbox de la tarea el <toque>
    Then la tarea conserva un solo completado, del <primera>
    And el último completado de la tarea fue entero

    Examples:
      | primera             | segunda             | toque               |
      | 2026-11-13T08:00:00 | 2026-11-13T08:05:00 | 2026-11-13T10:00:00 |

  # Hice la mínima 13
  # Acá el más reciente es el entero y queda la mínima.
  Scenario Outline: Hice la mínima 13
    Given Mostrar completadas está encendido
    And una tarea puntual sin fecha límite
    And la tarea fue completada el <primera> con la mínima
    And la tarea fue completada el <segunda>
    When toco el checkbox de la tarea el <toque>
    Then la tarea conserva un solo completado, del <primera>
    And el último completado de la tarea fue la mínima

    Examples:
      | primera             | segunda             | toque               |
      | 2026-11-13T08:00:00 | 2026-11-13T08:05:00 | 2026-11-13T10:00:00 |

  # Hice la mínima 14
  # El checkbox de una periódica completada un día anterior con la mínima la
  # completa de nuevo, entera: reinicia el intervalo desde el toque.
  Scenario Outline: Hice la mínima 14
    Given Mostrar completadas está encendido
    And una tarea periódica relativa cada <cada> <unidad>
    And la tarea fue completada el <anterior> con la mínima
    When toco el checkbox de la tarea el <toque>
    And consulto el estado el <ahora>
    Then el nuevo completado se agrega sin modificar los anteriores
    And el último completado de la tarea fue entero
    And el estado es en espera
    And el progreso es <progreso>

    Examples:
      | cada | unidad | anterior            | toque               | ahora               | progreso |
      | 2    | dias   | 2026-11-14T20:00:00 | 2026-11-15T08:00:00 | 2026-11-16T08:00:00 | 0.5      |

  # Hice la mínima 15
  # En una tarea de dos pasos o más, en cualquier paso, completa la tarea: la
  # tarea vuelve al paso 1 y el completado guarda el paso en que iba.
  Scenario Outline: Hice la mínima 15
    Given una tarea puntual sin fecha límite
    And los pasos de la tarea son <pasos>
    And el paso actual de la tarea es <actual>
    And la versión mínima de la tarea es <minima>
    When toco Hice la mínima el <toque>
    Then la tarea va en el paso 1
    And el último completado de la tarea guarda el paso <paso_guardado>
    And el último completado de la tarea fue la mínima

    Examples:
      | pasos                                                       | actual | minima          | toque               | paso_guardado |
      | Separar la ropa blanca, Poner el lavarropas, Tender la ropa | 1      | Solo el inodoro | 2026-11-13T10:00:00 | 1             |
      | Separar la ropa blanca, Poner el lavarropas, Tender la ropa | 2      | Solo el inodoro | 2026-11-13T10:00:00 | 2             |
      | Separar la ropa blanca, Poner el lavarropas, Tender la ropa | 3      | Solo el inodoro | 2026-11-13T10:00:00 | 3             |

  # Hice la mínima 16
  # Deshacer en el aviso devuelve el paso en que iba la tarea.
  Scenario Outline: Hice la mínima 16
    Given una tarea puntual sin fecha límite
    And los pasos de la tarea son <pasos>
    And el paso actual de la tarea es <actual>
    And la versión mínima de la tarea es <minima>
    When toco Hice la mínima el <toque>
    And toco Deshacer en el aviso el <deshacer>
    Then la tarea va en el paso <actual_guardado>

    Examples:
      | pasos                                                       | actual | minima          | toque               | deshacer            | actual_guardado |
      | Separar la ropa blanca, Poner el lavarropas, Tender la ropa | 2      | Solo el inodoro | 2026-11-13T10:00:00 | 2026-11-13T10:00:02 | 2               |
      | Separar la ropa blanca, Poner el lavarropas, Tender la ropa | 3      | Solo el inodoro | 2026-11-13T10:00:00 | 2026-11-13T10:00:02 | 3               |

  # Hice la mínima 17
  # Borrar el completado de la mínima desde el Historial o el checkbox también
  # devuelve el paso que guarda.
  Scenario Outline: Hice la mínima 17
    Given una tarea puntual sin fecha límite
    And los pasos de la tarea son <pasos>
    And la tarea fue completada el <completada> en el paso <paso_completado> con la mínima
    When borro el completado del <completada>
    Then la tarea va en el paso <actual_guardado>

    Examples:
      | pasos                                                       | completada          | paso_completado | actual_guardado |
      | Separar la ropa blanca, Poner el lavarropas, Tender la ropa | 2026-11-13T08:00:00 | 2               | 2               |

  # Hice la mínima 18
  # En una tarea de un solo paso el completado no guarda paso.
  Scenario Outline: Hice la mínima 18
    Given una tarea puntual sin fecha límite
    And el primer paso de la tarea es <primer_paso>
    And la versión mínima de la tarea es <minima>
    When toco Hice la mínima el <toque>
    Then el último completado de la tarea no guarda paso

    Examples:
      | primer_paso            | minima          | toque               |
      | Separar la ropa blanca | Solo el inodoro | 2026-11-13T10:00:00 |

  # Hice la mínima 19
  # Hacer la mínima no borra ni cambia la versión mínima de la tarea.
  Scenario Outline: Hice la mínima 19
    Given una tarea periódica relativa cada <cada> <unidad>
    And la versión mínima de la tarea es <minima>
    When toco Hice la mínima el <toque>
    Then la tarea tiene versión mínima <minima_guardada>

    Examples:
      | cada | unidad | minima            | toque               | minima_guardada   |
      | 2    | dias   | Solo los helechos | 2026-11-13T08:00:00 | Solo los helechos |

  # Hice la mínima 20
  # Editar la versión mínima no toca los completados que ya fueron la mínima.
  Scenario Outline: Hice la mínima 20
    Given una tarea puntual sin fecha límite
    And la versión mínima de la tarea es <minima>
    And la tarea fue completada el <completada> con la mínima
    When edito la versión mínima a <nueva>
    Then el último completado de la tarea fue la mínima

    Examples:
      | minima          | completada          | nueva          |
      | Solo el inodoro | 2026-11-13T08:00:00 | Solo el lavabo |

  # Hice la mínima 21
  # Vaciarla tampoco.
  Scenario Outline: Hice la mínima 21
    Given una tarea puntual sin fecha límite
    And la versión mínima de la tarea es <minima>
    And la tarea fue completada el <completada> con la mínima
    When quito la versión mínima
    Then la tarea no tiene versión mínima
    And el último completado de la tarea fue la mínima

    Examples:
      | minima          | completada          |
      | Solo el inodoro | 2026-11-13T08:00:00 |

  # Hice la mínima 22
  # Ni escribirla vuelve «mínima» a un completado entero: no se puede pasar un
  # completado entero a mínimo.
  Scenario Outline: Hice la mínima 22
    Given una tarea puntual sin fecha límite
    And la tarea fue completada el <completada>
    When edito la versión mínima a <nueva>
    Then el último completado de la tarea fue entero

    Examples:
      | completada          | nueva           |
      | 2026-11-13T08:00:00 | Solo el inodoro |

  # Hice la mínima 23
  # Un completado de la mínima cuenta para Mostrar completadas: encendido, la
  # puntual se ve completada.
  Scenario Outline: Hice la mínima 23
    Given Mostrar completadas está encendido
    And una tarea puntual <titulo> sin fecha límite
    And la tarea <titulo> fue completada el <completada> con la mínima
    When consulto Pendientes el <ahora>
    Then Pendientes muestra como completadas <completadas>

    Examples:
      | titulo | completada          | ahora               | completadas |
      | Pagar  | 2026-11-13T08:00:00 | 2026-11-13T10:00:00 | Pagar       |

  # Hice la mínima 24
  # Con Mostrar completadas apagado, la puntual completada con la mínima no se
  # ve, como una completada entera.
  Scenario Outline: Hice la mínima 24
    Given una tarea puntual <titulo> sin fecha límite
    And la tarea <titulo> fue completada el <completada> con la mínima
    When consulto Pendientes el <ahora>
    Then Pendientes no muestra ninguna tarea

    Examples:
      | titulo | completada          | ahora               |
      | Pagar  | 2026-11-13T08:00:00 | 2026-11-13T10:00:00 |

  # Hice la mínima 25
  # Cuenta para Última vez, como cualquier completado.
  Scenario Outline: Hice la mínima 25
    Given una tarea puntual sin fecha límite
    And la tarea fue completada el <completada> con la mínima
    When consulto la última vez el <ahora>
    Then la última vez muestra <ultima_vez>

    Examples:
      | completada          | ahora               | ultima_vez |
      | 2026-11-13T08:05:00 | 2026-11-13T12:00:00 | hoy 08:05  |

  # Hice la mínima 26
  # Dos dispositivos que completan sin conexión, uno entera y otro con «Hice la
  # mínima», dejan las dos entradas, cada una con lo suyo.
  Scenario Outline: Hice la mínima 26
    Given una tarea puntual sin fecha límite
    And la versión mínima de la tarea es <minima>
    When toco el checkbox de la tarea el <toque>
    And otro dispositivo, sin ver ese cambio, toca Hice la mínima el <toque_otro>
    Then la tarea tiene dos completados, uno entero y uno de la mínima

    Examples:
      | minima          | toque               | toque_otro          |
      | Solo el inodoro | 2026-11-13T10:00:00 | 2026-11-13T10:00:05 |
