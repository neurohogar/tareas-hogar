# mutation-stamp: sha256=b468106d784b0d9088d7a0eedfcce5b917f8b19166b2a3a836f536aaaea766b0
# acceptance-mutation-manifest-begin
# {"version":1,"tested_at":"2026-11-13T22:04:14.606398846Z","feature_name":"Edición concurrente","feature_path":"features/edicion-concurrente.feature","background_hash":"74234e98afe7498fb5daf1f36ac2d78acc339464f950703b8c019892f982b90b","implementation_hash":"sha256:6b7aa2a0f3ac15121d83a24023ff1a93cef541e75db439f394f7bcb50ae4edb0","scenarios":[{"index":0,"name":"Edición concurrente 1","scenario_hash":"1567fccc03912bb8e9e27ab1872dce1ae6d8324318411dfca6982cae06c62137","mutation_count":5,"result":{"Total":5,"Killed":5,"Survived":0,"Errors":0},"tested_at":"2026-11-13T22:04:14.606398846Z"},{"index":1,"name":"Edición concurrente 2","scenario_hash":"e2b0af26a8906ae3ca74e04d176b4e6ac319bf07c0876c880c4fe9b7ca15ea51","mutation_count":6,"result":{"Total":6,"Killed":6,"Survived":0,"Errors":0},"tested_at":"2026-11-13T22:04:14.606398846Z"},{"index":2,"name":"Edición concurrente 3","scenario_hash":"9f8a9404c6c2441562015ceeab400bbfbf79211244237f2a33310ec47e0f4ce8","mutation_count":5,"result":{"Total":5,"Killed":5,"Survived":0,"Errors":0},"tested_at":"2026-11-13T22:04:14.606398846Z"},{"index":3,"name":"Edición concurrente 4","scenario_hash":"863ff36b130153deeaa20a48302e90c7c0e72173049a3610a151008183dc4d5f","mutation_count":6,"result":{"Total":6,"Killed":6,"Survived":0,"Errors":0},"tested_at":"2026-11-13T22:04:14.606398846Z"},{"index":4,"name":"Edición concurrente 5","scenario_hash":"49db98b6537c586e1ae9e08d9c0122e62805d94b192958720321b70e4ba361ab","mutation_count":4,"result":{"Total":4,"Killed":4,"Survived":0,"Errors":0},"tested_at":"2026-11-13T22:04:14.606398846Z"},{"index":5,"name":"Edición concurrente 6","scenario_hash":"ed1d69f292ae63dafea5cd44457f67c0c1c093215bc1924b65c8bf586c7688a1","mutation_count":4,"result":{"Total":4,"Killed":4,"Survived":0,"Errors":0},"tested_at":"2026-11-13T22:04:14.606398846Z"},{"index":6,"name":"Edición concurrente 7","scenario_hash":"8913ca206a1de4182aec5a78da4b6509d34a27b27778769949f1c74802f44d63","mutation_count":2,"result":{"Total":2,"Killed":2,"Survived":0,"Errors":0},"tested_at":"2026-11-13T22:04:14.606398846Z"},{"index":7,"name":"Edición concurrente 8","scenario_hash":"b75e2e0421fbc8f7f159cd9144ccffd2aac4fb47ed31ff507c89621ddbdffafc","mutation_count":1,"result":{"Total":1,"Killed":1,"Survived":0,"Errors":0},"tested_at":"2026-11-13T22:04:14.606398846Z"},{"index":8,"name":"Edición concurrente 9","scenario_hash":"64db684f7382d63804cd908561ca5f6f5b7c190af9fd240606341a4973ed7916","mutation_count":2,"result":{"Total":2,"Killed":2,"Survived":0,"Errors":0},"tested_at":"2026-11-13T22:04:14.606398846Z"},{"index":9,"name":"Edición concurrente 10","scenario_hash":"c56f22078f0b79475397d250035c747f43a8dee47227d10b1dd2632f8fe47227","mutation_count":1,"result":{"Total":1,"Killed":1,"Survived":0,"Errors":0},"tested_at":"2026-11-13T22:04:14.606398846Z"},{"index":10,"name":"Edición concurrente 11","scenario_hash":"cf270a849d27873dbb76a2ec73f86f43058c5fec7a7d767a5dc7b1b68d8b72d4","mutation_count":4,"result":{"Total":4,"Killed":4,"Survived":0,"Errors":0},"tested_at":"2026-11-13T22:04:14.606398846Z"}]}
# acceptance-mutation-manifest-end

# Spec §7 (Conflictos). Dos dispositivos editan la misma tarea sin ver el
# cambio del otro (por ejemplo, uno sin conexión). Los cambios llegan en el
# orden en que aparecen los pasos: primero el mío, después el del otro
# dispositivo.
#   Gana el último cambio, por campo de la §4.1: una edición escribe solo los
#   campos que cambió, así que no pisa los demás.
#   recurrencia se reemplaza entera, nunca se mezcla por subcampo.
#   Un campo que no corresponde al tipo (fechaLimite en una periódica,
#   recurrencia en una puntual) se ignora al derivar el estado. Al cambiar de
#   tipo, la tarea queda solo con los campos de tipo que muestra el panel: un
#   valor residual de una edición concurrente no sobrevive.
#   Edición contra borrado: gana el borrado; una edición de una tarea que ya
#   no existe no la revive.
# Los "su recurrencia es ..." comparan la recurrencia entera, sin campos de más.
Feature: Edición concurrente

  # Edición concurrente 1
  # Campos distintos: se combinan los dos cambios.
  Scenario Outline: Edición concurrente 1
    Given una tarea periódica relativa <titulo> cada <cada> <unidad>
    When edito el título a <titulo_nuevo>
    And otro dispositivo, sin ver ese cambio, edita la tarea a periódica semanal los <dias>
    Then la tarea tiene título <titulo_guardado>
    And su recurrencia es semanal los <dias_guardados>

    Examples:
      | titulo | cada | unidad | titulo_nuevo  | dias           | titulo_guardado | dias_guardados |
      | Regar  | 2    | dias   | Regar plantas | martes, jueves | Regar plantas   | martes, jueves |

  # Edición concurrente 2
  # El mismo campo: gana el último cambio en llegar.
  Scenario Outline: Edición concurrente 2
    Given una tarea puntual <titulo> con fecha límite <limite>
    When edito el título a <primero>
    And otro dispositivo, sin ver ese cambio, edita el título a <segundo>
    Then la tarea tiene título <titulo_guardado>
    And su fecha límite es <limite_guardado>

    Examples:
      | titulo | limite     | primero      | segundo         | titulo_guardado | limite_guardado |
      | Pagar  | 2026-07-14 | Pagar la luz | Pagar el gas    | Pagar el gas    | 2026-07-14      |

  # Edición concurrente 3
  # Guardar sin cambios no escribe nada, así que no pisa el cambio del otro.
  Scenario Outline: Edición concurrente 3
    Given una tarea periódica relativa <titulo> cada <cada> <unidad>
    When edito el título a <titulo_nuevo>
    And otro dispositivo, sin ver ese cambio, guarda la tarea sin cambios
    Then la tarea tiene título <titulo_guardado>
    And su recurrencia es relativa cada <cada_guardado> <unidad>

    Examples:
      | titulo | cada | unidad | titulo_nuevo  | titulo_guardado | cada_guardado |
      | Regar  | 2    | dias   | Regar plantas | Regar plantas   | 2             |

  # Edición concurrente 4
  # La recurrencia se reemplaza entera: queda la última, sin días de la
  # semana mezclados con el intervalo.
  Scenario Outline: Edición concurrente 4
    Given una tarea periódica relativa cada <cada> <unidad>
    When edito la tarea a periódica semanal los <dias>
    And otro dispositivo, sin ver ese cambio, edita la tarea a periódica relativa cada <cada_otro> <unidad_otra>
    Then su recurrencia es relativa cada <cada_guardado> <unidad_guardada>

    Examples:
      | cada | unidad | dias           | cada_otro | unidad_otra | cada_guardado | unidad_guardada |
      | 2    | dias   | martes, jueves | 8         | horas       | 8             | horas           |

  # Edición concurrente 5
  # La recurrencia se reemplaza entera: de semanal a mensual por un lado y a
  # relativa por el otro, queda la mensual (la última).
  Scenario Outline: Edición concurrente 5
    Given una tarea periódica semanal los <dias>
    When edito la tarea a periódica relativa cada <cada> <unidad>
    And otro dispositivo, sin ver ese cambio, edita la tarea a periódica mensual los días <dias_mes>
    Then su recurrencia es mensual los días <dias_guardados>

    Examples:
      | dias           | cada | unidad | dias_mes | dias_guardados |
      | martes, jueves | 3    | dias   | 10, 20   | 10, 20         |

  # Edición concurrente 6
  # Paso una relativa nunca completada a puntual; el otro dispositivo solo
  # cambió el intervalo. Queda puntual con una recurrencia que no le
  # corresponde y se ignora: el estado sale de la fecha límite (como
  # relativa nunca completada estaría pendiente).
  Scenario Outline: Edición concurrente 6
    Given una tarea periódica relativa nunca completada
    When edito la tarea a puntual con fecha límite <limite>
    And otro dispositivo, sin ver ese cambio, edita la tarea a periódica relativa cada <cada> <unidad>
    And consulto el estado el <ahora>
    Then la tarea es puntual
    And el estado es atrasada

    Examples:
      | limite     | cada | unidad | ahora               |
      | 2026-07-14 | 6    | horas  | 2026-07-15T00:00:00 |

  # Edición concurrente 7
  # Paso una puntual a relativa; el otro dispositivo solo cambió la fecha
  # límite. Queda periódica con una fecha límite que no le corresponde y se
  # ignora: nunca completada, pendiente (como puntual estaría atrasada).
  Scenario Outline: Edición concurrente 7
    Given una tarea puntual con fecha límite <limite>
    When edito la tarea a periódica relativa cada <cada> <unidad>
    And otro dispositivo, sin ver ese cambio, edita la tarea a puntual con fecha límite <limite_otro>
    And consulto el estado el <ahora>
    Then la tarea es periódica
    And el estado es pendiente

    Examples:
      | limite     | cada | unidad | limite_otro | ahora               |
      | 2026-07-20 | 2    | dias   | 2026-07-10  | 2026-07-15T10:00:00 |

  # Edición concurrente 8
  # Gana el borrado: la edición que llega después no revive la tarea.
  Scenario Outline: Edición concurrente 8
    Given una tarea periódica relativa <titulo> cada <cada> <unidad>
    When borro la tarea
    And otro dispositivo, sin ver ese cambio, edita el título a <titulo_nuevo>
    And consulto Pendientes en cualquier momento
    Then no queda ninguna tarea

    Examples:
      | titulo | cada | unidad | titulo_nuevo  |
      | Regar  | 2    | dias   | Regar plantas |

  # Edición concurrente 9
  # Gana el borrado también si la edición llega antes.
  Scenario Outline: Edición concurrente 9
    Given una tarea periódica relativa <titulo> cada <cada> <unidad>
    When edito el título a <titulo_nuevo>
    And otro dispositivo, sin ver ese cambio, borra la tarea
    And consulto Pendientes en cualquier momento
    Then no queda ninguna tarea

    Examples:
      | titulo | cada | unidad | titulo_nuevo  |
      | Regar  | 2    | dias   | Regar plantas |

  # Edición concurrente 10
  # Paso una puntual a relativa y el otro dispositivo le cambia la fecha
  # límite: queda periódica con una fecha límite residual. Al pasarla a
  # puntual sin fecha límite, el residuo no sobrevive: queda sin fecha límite.
  Scenario Outline: Edición concurrente 10
    Given una tarea puntual con fecha límite <limite>
    When edito la tarea a periódica relativa cada <cada> <unidad>
    And otro dispositivo, sin ver ese cambio, edita la tarea a puntual con fecha límite <limite_otro>
    And edito la tarea a puntual sin fecha límite
    Then la tarea es puntual
    And la tarea no tiene fecha límite

    Examples:
      | limite     | cada | unidad | limite_otro |
      | 2026-07-20 | 2    | dias   | 2026-07-10  |

  # Edición concurrente 11
  # Espejo: paso una relativa a puntual y el otro dispositivo le cambia el
  # intervalo: queda puntual con una recurrencia residual. Al pasarla a
  # periódica, queda la recurrencia elegida en el panel, no la residual.
  Scenario Outline: Edición concurrente 11
    Given una tarea periódica relativa cada <cada> <unidad>
    When edito la tarea a puntual con fecha límite <limite>
    And otro dispositivo, sin ver ese cambio, edita la tarea a periódica relativa cada <cada_otro> <unidad_otra>
    And edito la tarea a periódica semanal los <dias>
    Then la tarea es periódica
    And su recurrencia es semanal los <dias_guardados>

    Examples:
      | cada | unidad | limite     | cada_otro | unidad_otra | dias           | dias_guardados |
      | 2    | dias   | 2026-07-14 | 6         | horas       | martes, jueves | martes, jueves |
