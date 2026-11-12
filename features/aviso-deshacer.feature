# mutation-stamp: sha256=4e97342023d1fc23eebe0b4fab60154de1da614941f9422a1315c1742692de05
# acceptance-mutation-manifest-begin
# {"version":1,"tested_at":"2026-11-02T22:53:11.973146152Z","feature_name":"Aviso de deshacer","feature_path":"features/aviso-deshacer.feature","background_hash":"74234e98afe7498fb5daf1f36ac2d78acc339464f950703b8c019892f982b90b","implementation_hash":"sha256:580b58dfa7a42c14117457afcfc74fd1bcf3a759cc6c20349dfa85d287f78020","scenarios":[{"index":0,"name":"Aviso de deshacer 1","scenario_hash":"10d8ffce7ba4d409124daa03d3e4a7e07fe5bb8cbcc500303a3d0ef10bdbea19","mutation_count":24,"result":{"Total":24,"Killed":24,"Survived":0,"Errors":0},"tested_at":"2026-11-02T22:53:11.973146152Z"},{"index":1,"name":"Aviso de deshacer 2","scenario_hash":"540c65c666c555ea2109b4702aeabfcae655ac319ef1033a49af1fe8bfd5d96a","mutation_count":4,"result":{"Total":4,"Killed":4,"Survived":0,"Errors":0},"tested_at":"2026-11-02T22:53:11.973146152Z"},{"index":2,"name":"Aviso de deshacer 3","scenario_hash":"ee0f8dcbd74016215a3e760608d85974251d8132a0fb76b593cbf06464652052","mutation_count":24,"result":{"Total":24,"Killed":24,"Survived":0,"Errors":0},"tested_at":"2026-11-02T22:53:11.973146152Z"},{"index":3,"name":"Aviso de deshacer 4","scenario_hash":"468c7f1aa042585c346c48481a345fffb3b3bafa80fd9fb3ecd58701118a4c45","mutation_count":11,"result":{"Total":11,"Killed":11,"Survived":0,"Errors":0},"tested_at":"2026-11-02T22:53:11.973146152Z"},{"index":4,"name":"Aviso de deshacer 5","scenario_hash":"a9445d98ddf09d68b6412c61fdfa4cd185fe8eafd913fdff82bce6abdb2e782c","mutation_count":18,"result":{"Total":18,"Killed":18,"Survived":0,"Errors":0},"tested_at":"2026-11-02T22:53:11.973146152Z"},{"index":5,"name":"Aviso de deshacer 6","scenario_hash":"7f08ad51427bc61e3db6a2168dd8de66dfe94c4936855ac7833e1a0d9a114e35","mutation_count":5,"result":{"Total":5,"Killed":5,"Survived":0,"Errors":0},"tested_at":"2026-11-02T22:53:11.973146152Z"},{"index":6,"name":"Aviso de deshacer 7","scenario_hash":"3c033ed5dbc9d6b0ab8bc01aedcb3bd5266654ff8d27cbe21b64b30cc570606e","mutation_count":14,"result":{"Total":14,"Killed":14,"Survived":0,"Errors":0},"tested_at":"2026-11-02T22:53:11.973146152Z"},{"index":7,"name":"Aviso de deshacer 8","scenario_hash":"cafc32888d422c536d3b8fd6f61580c462e9a94d508bdb5977deb007c4fb6a08","mutation_count":9,"result":{"Total":9,"Killed":9,"Survived":0,"Errors":0},"tested_at":"2026-11-02T22:53:11.973146152Z"},{"index":8,"name":"Aviso de deshacer 9","scenario_hash":"6c19b50b2ec5e0cd050920c4b3a891026d35e8e3f34fec27e78cef93aed9bd7b","mutation_count":6,"result":{"Total":6,"Killed":6,"Survived":0,"Errors":0},"tested_at":"2026-11-02T22:53:11.973146152Z"}]}
# acceptance-mutation-manifest-end

# Spec §5.4 (Deshacer, el aviso). Al completar una tarea aparece un aviso que
# nombra la tarea y tiene Deshacer. Se ve mientras
# completadoEn <= ahora < completadoEn + 5 segundos.
# Hay un solo aviso: completar otra tarea con el aviso abierto lo reemplaza
# por el del completado nuevo. Deshacer en el aviso borra solo el completado
# que nombra el aviso y cierra el aviso; si ese completado ya no existe, no
# hace nada.
# El aviso lo abre un "completo la tarea ..." de este dispositivo; los
# completados de los Given son anteriores y no abren aviso.
# Cada tarea se nombra por su título (una palabra).
Feature: Aviso de deshacer

  # Aviso de deshacer 1
  # El aviso se ve desde que completo hasta el último segundo antes de los 5.
  Scenario Outline: Aviso de deshacer 1
    Given una tarea periódica relativa Regar cada <cada> <unidad>
    When completo la tarea Regar el <completada>
    And consulto el aviso el <ahora>
    Then el aviso ofrece deshacer el completado de Regar del <completada_guardada>

    Examples:
      | cada | unidad | completada          | ahora               | completada_guardada |
      | 2    | dias   | 2026-07-15T08:00:00 | 2026-07-15T08:00:00 | 2026-07-15T08:00:00 |
      | 2    | dias   | 2026-07-15T08:00:00 | 2026-07-15T08:00:04 | 2026-07-15T08:00:00 |

  # Aviso de deshacer 2
  # A los 5 segundos el aviso desaparece solo.
  Scenario Outline: Aviso de deshacer 2
    Given una tarea periódica relativa Regar cada <cada> <unidad>
    When completo la tarea Regar el <completada>
    And consulto el aviso el <ahora>
    Then no hay aviso

    Examples:
      | cada | unidad | completada          | ahora               |
      | 2    | dias   | 2026-07-15T08:00:00 | 2026-07-15T08:00:05 |
      | 2    | dias   | 2026-07-15T08:00:00 | 2026-07-15T09:00:00 |

  # Aviso de deshacer 3
  # Completar otra tarea con el aviso abierto lo reemplaza; el aviso nuevo
  # dura 5 segundos desde su propio completado. Fila 1: dentro de los 5
  # segundos de los dos completados. Fila 2: pasados los del primero.
  Scenario Outline: Aviso de deshacer 3
    Given una tarea periódica relativa Regar cada <cada> <unidad>
    And una tarea puntual Pagar con fecha límite <limite>
    When completo la tarea Regar el <regar>
    And completo la tarea Pagar el <pagar>
    And consulto el aviso el <ahora>
    Then el aviso ofrece deshacer el completado de Pagar del <pagar_guardada>

    Examples:
      | cada | unidad | limite     | regar               | pagar               | ahora               | pagar_guardada      |
      | 2    | dias   | 2026-07-20 | 2026-07-15T08:00:00 | 2026-07-15T08:00:03 | 2026-07-15T08:00:04 | 2026-07-15T08:00:03 |
      | 2    | dias   | 2026-07-20 | 2026-07-15T08:00:00 | 2026-07-15T08:00:03 | 2026-07-15T08:00:07 | 2026-07-15T08:00:03 |

  # Aviso de deshacer 4
  # Completar otra vez la misma tarea con el aviso abierto también lo
  # reemplaza.
  Scenario Outline: Aviso de deshacer 4
    Given una tarea periódica relativa Regar cada <cada> <unidad>
    When completo la tarea Regar el <primera>
    And completo la tarea Regar el <segunda>
    And consulto el aviso el <ahora>
    Then el aviso ofrece deshacer el completado de Regar del <segunda_guardada>

    Examples:
      | cada | unidad | primera             | segunda             | ahora               | segunda_guardada    |
      | 2    | dias   | 2026-07-15T08:00:00 | 2026-07-15T08:00:02 | 2026-07-15T08:00:03 | 2026-07-15T08:00:02 |

  # Aviso de deshacer 5
  # Deshacer en el aviso borra ese completado, recalcula el estado con los
  # que quedan (U vuelve al anterior, que ya venció) y cierra el aviso.
  Scenario Outline: Aviso de deshacer 5
    Given una tarea periódica relativa Regar cada <cada> <unidad>
    And la tarea Regar fue completada el <anterior>
    When completo la tarea Regar el <completada>
    And toco Deshacer en el aviso el <toque>
    And consulto el aviso el <toque>
    And consulto el estado el <ahora>
    Then no hay aviso
    And la tarea Regar conserva un solo completado, del <anterior_guardada>
    And el estado es pendiente

    Examples:
      | cada | unidad | anterior            | completada          | toque               | ahora               | anterior_guardada   |
      | 4    | horas  | 2026-07-15T06:00:00 | 2026-07-15T11:00:00 | 2026-07-15T11:00:04 | 2026-07-15T11:00:05 | 2026-07-15T06:00:00 |

  # Aviso de deshacer 6
  # Deshacer una puntual desde el aviso la devuelve a Pendientes.
  Scenario Outline: Aviso de deshacer 6
    Given una tarea puntual Pagar con fecha límite <limite>
    When completo la tarea Pagar el <completada>
    And toco Deshacer en el aviso el <toque>
    And consulto Pendientes el <ahora>
    Then no queda ningún completado de Pagar
    And Pendientes muestra en orden <orden>

    Examples:
      | limite     | completada          | toque               | ahora               | orden |
      | 2026-07-20 | 2026-07-15T08:00:00 | 2026-07-15T08:00:02 | 2026-07-15T08:00:03 | Pagar |

  # Aviso de deshacer 7
  # Después de reemplazar el aviso, Deshacer borra solo el último completado;
  # el de la otra tarea sigue.
  Scenario Outline: Aviso de deshacer 7
    Given una tarea periódica relativa Regar cada <cada> <unidad>
    And una tarea puntual Pagar con fecha límite <limite>
    When completo la tarea Regar el <regar>
    And completo la tarea Pagar el <pagar>
    And toco Deshacer en el aviso el <toque>
    Then no queda ningún completado de Pagar
    And la tarea Regar conserva un solo completado, del <regar_guardada>

    Examples:
      | cada | unidad | limite     | regar               | pagar               | toque               | regar_guardada      |
      | 2    | dias   | 2026-07-20 | 2026-07-15T08:00:00 | 2026-07-15T08:00:03 | 2026-07-15T08:00:04 | 2026-07-15T08:00:00 |

  # Aviso de deshacer 8
  # Si otro dispositivo ya borró ese completado, Deshacer no hace nada: el
  # completado anterior sigue.
  Scenario Outline: Aviso de deshacer 8
    Given una tarea periódica relativa Regar cada <cada> <unidad>
    And la tarea Regar fue completada el <anterior>
    When completo la tarea Regar el <completada>
    And otro dispositivo, sin ver ese cambio, borra el completado del <completada>
    And toco Deshacer en el aviso el <toque>
    Then la tarea Regar conserva un solo completado, del <anterior_guardada>

    Examples:
      | cada | unidad | anterior            | completada          | toque               | anterior_guardada   |
      | 2    | dias   | 2026-07-13T09:00:00 | 2026-07-15T08:00:00 | 2026-07-15T08:00:02 | 2026-07-13T09:00:00 |

  # Aviso de deshacer 9
  # Si otro dispositivo ya borró la tarea, Deshacer no la revive.
  Scenario Outline: Aviso de deshacer 9
    Given una tarea periódica relativa Regar cada <cada> <unidad>
    When completo la tarea Regar el <completada>
    And otro dispositivo, sin ver ese cambio, borra la tarea
    And toco Deshacer en el aviso el <toque>
    And consulto Pendientes en cualquier momento
    Then no queda ninguna tarea
    And no queda ningún completado de Regar

    Examples:
      | cada | unidad | completada          | toque               |
      | 2    | dias   | 2026-07-15T08:00:00 | 2026-07-15T08:00:02 |
