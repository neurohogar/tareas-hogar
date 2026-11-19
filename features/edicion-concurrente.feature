# mutation-stamp: sha256=b468106d784b0d9088d7a0eedfcce5b917f8b19166b2a3a836f536aaaea766b0
# acceptance-mutation-manifest-begin
# {"version":1,"tested_at":"2026-11-17T20:53:26.316043611Z","feature_name":"Edición concurrente","feature_path":"features/edicion-concurrente.feature","background_hash":"74234e98afe7498fb5daf1f36ac2d78acc339464f950703b8c019892f982b90b","implementation_hash":"sha256:6b7aa2a0f3ac15121d83a24023ff1a93cef541e75db439f394f7bcb50ae4edb0","scenarios":[{"index":0,"name":"Edición concurrente 1","scenario_hash":"1567fccc03912bb8e9e27ab1872dce1ae6d8324318411dfca6982cae06c62137","mutation_count":5,"result":{"Total":5,"Killed":5,"Survived":0,"Errors":0},"tested_at":"2026-11-17T20:53:26.316043611Z"},{"index":1,"name":"Edición concurrente 2","scenario_hash":"e2b0af26a8906ae3ca74e04d176b4e6ac319bf07c0876c880c4fe9b7ca15ea51","mutation_count":6,"result":{"Total":6,"Killed":6,"Survived":0,"Errors":0},"tested_at":"2026-11-17T20:53:26.316043611Z"},{"index":2,"name":"Edición concurrente 3","scenario_hash":"9f8a9404c6c2441562015ceeab400bbfbf79211244237f2a33310ec47e0f4ce8","mutation_count":5,"result":{"Total":5,"Killed":5,"Survived":0,"Errors":0},"tested_at":"2026-11-17T20:53:26.316043611Z"},{"index":3,"name":"Edición concurrente 4","scenario_hash":"863ff36b130153deeaa20a48302e90c7c0e72173049a3610a151008183dc4d5f","mutation_count":6,"result":{"Total":6,"Killed":6,"Survived":0,"Errors":0},"tested_at":"2026-11-17T20:53:26.316043611Z"},{"index":4,"name":"Edición concurrente 5","scenario_hash":"49db98b6537c586e1ae9e08d9c0122e62805d94b192958720321b70e4ba361ab","mutation_count":4,"result":{"Total":4,"Killed":4,"Survived":0,"Errors":0},"tested_at":"2026-11-17T20:53:26.316043611Z"},{"index":5,"name":"Edición concurrente 6","scenario_hash":"ed1d69f292ae63dafea5cd44457f67c0c1c093215bc1924b65c8bf586c7688a1","mutation_count":4,"result":{"Total":4,"Killed":4,"Survived":0,"Errors":0},"tested_at":"2026-11-17T20:53:26.316043611Z"},{"index":6,"name":"Edición concurrente 7","scenario_hash":"8913ca206a1de4182aec5a78da4b6509d34a27b27778769949f1c74802f44d63","mutation_count":2,"result":{"Total":2,"Killed":2,"Survived":0,"Errors":0},"tested_at":"2026-11-17T20:53:26.316043611Z"},{"index":7,"name":"Edición concurrente 8","scenario_hash":"b75e2e0421fbc8f7f159cd9144ccffd2aac4fb47ed31ff507c89621ddbdffafc","mutation_count":1,"result":{"Total":1,"Killed":1,"Survived":0,"Errors":0},"tested_at":"2026-11-17T20:53:26.316043611Z"},{"index":8,"name":"Edición concurrente 9","scenario_hash":"64db684f7382d63804cd908561ca5f6f5b7c190af9fd240606341a4973ed7916","mutation_count":2,"result":{"Total":2,"Killed":2,"Survived":0,"Errors":0},"tested_at":"2026-11-17T20:53:26.316043611Z"},{"index":9,"name":"Edición concurrente 10","scenario_hash":"c56f22078f0b79475397d250035c747f43a8dee47227d10b1dd2632f8fe47227","mutation_count":1,"result":{"Total":1,"Killed":1,"Survived":0,"Errors":0},"tested_at":"2026-11-17T20:53:26.316043611Z"},{"index":10,"name":"Edición concurrente 11","scenario_hash":"cf270a849d27873dbb76a2ec73f86f43058c5fec7a7d767a5dc7b1b68d8b72d4","mutation_count":4,"result":{"Total":4,"Killed":4,"Survived":0,"Errors":0},"tested_at":"2026-11-17T20:53:26.316043611Z"}]}
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
Feature: Concurrent editing

  # Edición concurrente 1
  # Campos distintos: se combinan los dos cambios.
  Scenario Outline: Concurrent editing 1
    Given a relative recurring task <title> every <every> <unit>
    When I edit the title to <title_new>
    And another device, without seeing that change, edits the task to weekly recurring on <days>
    Then the task has title <title_stored>
    And its recurrence is weekly on <days_stored>

    Examples:
      | title  | every | unit   | title_new     | days           | title_stored    | days_stored    |
      | Regar  | 2    | dias   | Regar plantas | martes, jueves | Regar plantas   | martes, jueves |

  # Edición concurrente 2
  # El mismo campo: gana el último cambio en llegar.
  Scenario Outline: Concurrent editing 2
    Given a one-off task <title> with due date <due_date>
    When I edit the title to <first>
    And another device, without seeing that change, edits the title to <second>
    Then the task has title <title_stored>
    And its due date is <due_date_stored>

    Examples:
      | title  | due_date   | first        | second          | title_stored    | due_date_stored |
      | Pagar  | 2026-07-14 | Pagar la luz | Pagar el gas    | Pagar el gas    | 2026-07-14      |

  # Edición concurrente 3
  # Guardar sin cambios no escribe nada, así que no pisa el cambio del otro.
  Scenario Outline: Concurrent editing 3
    Given a relative recurring task <title> every <every> <unit>
    When I edit the title to <title_new>
    And another device, without seeing that change, saves the task without changes
    Then the task has title <title_stored>
    And its recurrence is relative every <every_stored> <unit>

    Examples:
      | title  | every | unit   | title_new     | title_stored    | every_stored  |
      | Regar  | 2    | dias   | Regar plantas | Regar plantas   | 2             |

  # Edición concurrente 4
  # La recurrencia se reemplaza entera: queda la última, sin días de la
  # semana mezclados con el intervalo.
  Scenario Outline: Concurrent editing 4
    Given a relative recurring task every <every> <unit>
    When I edit the task to weekly recurring on <days>
    And another device, without seeing that change, edits the task to relative recurring every <every_other> <unit_other>
    Then its recurrence is relative every <every_stored> <unit_stored>

    Examples:
      | every | unit   | days           | every_other | unit_other  | every_stored  | unit_stored     |
      | 2    | dias   | martes, jueves | 8         | horas       | 8             | horas           |

  # Edición concurrente 5
  # La recurrencia se reemplaza entera: de semanal a mensual por un lado y a
  # relativa por el otro, queda la mensual (la última).
  Scenario Outline: Concurrent editing 5
    Given a weekly recurring task on <days>
    When I edit the task to relative recurring every <every> <unit>
    And another device, without seeing that change, edits the task to monthly recurring on days <days_month>
    Then its recurrence is monthly on days <days_stored>

    Examples:
      | days           | every | unit   | days_month | days_stored    |
      | martes, jueves | 3    | dias   | 10, 20   | 10, 20         |

  # Edición concurrente 6
  # Paso una relativa nunca completada a puntual; el otro dispositivo solo
  # cambió el intervalo. Queda puntual con una recurrencia que no le
  # corresponde y se ignora: el estado sale de la fecha límite (como
  # relativa nunca completada estaría pendiente).
  Scenario Outline: Concurrent editing 6
    Given a relative recurring task never completed
    When I edit the task to one-off with due date <due_date>
    And another device, without seeing that change, edits the task to relative recurring every <every> <unit>
    And I query the status on <now>
    Then the task is one-off
    And the status is atrasada

    Examples:
      | due_date   | every | unit   | now                 |
      | 2026-07-14 | 6    | horas  | 2026-07-15T00:00:00 |

  # Edición concurrente 7
  # Paso una puntual a relativa; el otro dispositivo solo cambió la fecha
  # límite. Queda periódica con una fecha límite que no le corresponde y se
  # ignora: nunca completada, pendiente (como puntual estaría atrasada).
  Scenario Outline: Concurrent editing 7
    Given a one-off task with due date <due_date>
    When I edit the task to relative recurring every <every> <unit>
    And another device, without seeing that change, edits the task to one-off with due date <due_date_other>
    And I query the status on <now>
    Then the task is recurring
    And the status is pendiente

    Examples:
      | due_date   | every | unit   | due_date_other | now                 |
      | 2026-07-20 | 2    | dias   | 2026-07-10  | 2026-07-15T10:00:00 |

  # Edición concurrente 8
  # Gana el borrado: la edición que llega después no revive la tarea.
  Scenario Outline: Concurrent editing 8
    Given a relative recurring task <title> every <every> <unit>
    When I delete the task
    And another device, without seeing that change, edits the title to <title_new>
    And I query Pendientes at any moment
    Then no task remains

    Examples:
      | title  | every | unit   | title_new     |
      | Regar  | 2    | dias   | Regar plantas |

  # Edición concurrente 9
  # Gana el borrado también si la edición llega antes.
  Scenario Outline: Concurrent editing 9
    Given a relative recurring task <title> every <every> <unit>
    When I edit the title to <title_new>
    And another device, without seeing that change, deletes the task
    And I query Pendientes at any moment
    Then no task remains

    Examples:
      | title  | every | unit   | title_new     |
      | Regar  | 2    | dias   | Regar plantas |

  # Edición concurrente 10
  # Paso una puntual a relativa y el otro dispositivo le cambia la fecha
  # límite: queda periódica con una fecha límite residual. Al pasarla a
  # puntual sin fecha límite, el residuo no sobrevive: queda sin fecha límite.
  Scenario Outline: Concurrent editing 10
    Given a one-off task with due date <due_date>
    When I edit the task to relative recurring every <every> <unit>
    And another device, without seeing that change, edits the task to one-off with due date <due_date_other>
    And I edit the task to one-off without a due date
    Then the task is one-off
    And the task has no due date

    Examples:
      | due_date   | every | unit   | due_date_other |
      | 2026-07-20 | 2    | dias   | 2026-07-10  |

  # Edición concurrente 11
  # Espejo: paso una relativa a puntual y el otro dispositivo le cambia el
  # intervalo: queda puntual con una recurrencia residual. Al pasarla a
  # periódica, queda la recurrencia elegida en el panel, no la residual.
  Scenario Outline: Concurrent editing 11
    Given a relative recurring task every <every> <unit>
    When I edit the task to one-off with due date <due_date>
    And another device, without seeing that change, edits the task to relative recurring every <every_other> <unit_other>
    And I edit the task to weekly recurring on <days>
    Then the task is recurring
    And its recurrence is weekly on <days_stored>

    Examples:
      | every | unit   | due_date   | every_other | unit_other  | days           | days_stored    |
      | 2    | dias   | 2026-07-14 | 6         | horas       | martes, jueves | martes, jueves |
