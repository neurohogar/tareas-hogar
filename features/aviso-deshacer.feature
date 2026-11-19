# mutation-stamp: sha256=4e97342023d1fc23eebe0b4fab60154de1da614941f9422a1315c1742692de05
# acceptance-mutation-manifest-begin
# {"version":1,"tested_at":"2026-11-17T20:50:08.990787156Z","feature_name":"Aviso de deshacer","feature_path":"features/aviso-deshacer.feature","background_hash":"74234e98afe7498fb5daf1f36ac2d78acc339464f950703b8c019892f982b90b","implementation_hash":"sha256:52e09416deecfe273a2d28355b21d5fe7c870b2f1dd5e66751c3b58580f01900","scenarios":[{"index":0,"name":"Aviso de deshacer 1","scenario_hash":"10d8ffce7ba4d409124daa03d3e4a7e07fe5bb8cbcc500303a3d0ef10bdbea19","mutation_count":24,"result":{"Total":24,"Killed":24,"Survived":0,"Errors":0},"tested_at":"2026-11-17T20:50:08.990787156Z"},{"index":1,"name":"Aviso de deshacer 2","scenario_hash":"540c65c666c555ea2109b4702aeabfcae655ac319ef1033a49af1fe8bfd5d96a","mutation_count":4,"result":{"Total":4,"Killed":4,"Survived":0,"Errors":0},"tested_at":"2026-11-17T20:50:08.990787156Z"},{"index":2,"name":"Aviso de deshacer 3","scenario_hash":"ee0f8dcbd74016215a3e760608d85974251d8132a0fb76b593cbf06464652052","mutation_count":24,"result":{"Total":24,"Killed":24,"Survived":0,"Errors":0},"tested_at":"2026-11-17T20:50:08.990787156Z"},{"index":3,"name":"Aviso de deshacer 4","scenario_hash":"468c7f1aa042585c346c48481a345fffb3b3bafa80fd9fb3ecd58701118a4c45","mutation_count":11,"result":{"Total":11,"Killed":11,"Survived":0,"Errors":0},"tested_at":"2026-11-17T20:50:08.990787156Z"},{"index":4,"name":"Aviso de deshacer 5","scenario_hash":"a9445d98ddf09d68b6412c61fdfa4cd185fe8eafd913fdff82bce6abdb2e782c","mutation_count":18,"result":{"Total":18,"Killed":18,"Survived":0,"Errors":0},"tested_at":"2026-11-17T20:50:08.990787156Z"},{"index":5,"name":"Aviso de deshacer 6","scenario_hash":"7f08ad51427bc61e3db6a2168dd8de66dfe94c4936855ac7833e1a0d9a114e35","mutation_count":5,"result":{"Total":5,"Killed":5,"Survived":0,"Errors":0},"tested_at":"2026-11-17T20:50:08.990787156Z"},{"index":6,"name":"Aviso de deshacer 7","scenario_hash":"3c033ed5dbc9d6b0ab8bc01aedcb3bd5266654ff8d27cbe21b64b30cc570606e","mutation_count":14,"result":{"Total":14,"Killed":14,"Survived":0,"Errors":0},"tested_at":"2026-11-17T20:50:08.990787156Z"},{"index":7,"name":"Aviso de deshacer 8","scenario_hash":"cafc32888d422c536d3b8fd6f61580c462e9a94d508bdb5977deb007c4fb6a08","mutation_count":9,"result":{"Total":9,"Killed":9,"Survived":0,"Errors":0},"tested_at":"2026-11-17T20:50:08.990787156Z"},{"index":8,"name":"Aviso de deshacer 9","scenario_hash":"6c19b50b2ec5e0cd050920c4b3a891026d35e8e3f34fec27e78cef93aed9bd7b","mutation_count":6,"result":{"Total":6,"Killed":6,"Survived":0,"Errors":0},"tested_at":"2026-11-17T20:50:08.990787156Z"}]}
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
Feature: Undo notice

  # Aviso de deshacer 1
  # El aviso se ve desde que completo hasta el último segundo antes de los 5.
  Scenario Outline: Undo notice 1
    Given a relative recurring task Regar every <every> <unit>
    When I complete the task Regar on <completed>
    And I query the notice on <now>
    Then the notice offers to undo the completion of Regar from <completed_stored>

    Examples:
      | every | unit   | completed           | now                 | completed_stored    |
      | 2    | dias   | 2026-07-15T08:00:00 | 2026-07-15T08:00:00 | 2026-07-15T08:00:00 |
      | 2    | dias   | 2026-07-15T08:00:00 | 2026-07-15T08:00:04 | 2026-07-15T08:00:00 |

  # Aviso de deshacer 2
  # A los 5 segundos el aviso desaparece solo.
  Scenario Outline: Undo notice 2
    Given a relative recurring task Regar every <every> <unit>
    When I complete the task Regar on <completed>
    And I query the notice on <now>
    Then there is no notice

    Examples:
      | every | unit   | completed           | now                 |
      | 2    | dias   | 2026-07-15T08:00:00 | 2026-07-15T08:00:05 |
      | 2    | dias   | 2026-07-15T08:00:00 | 2026-07-15T09:00:00 |

  # Aviso de deshacer 3
  # Completar otra tarea con el aviso abierto lo reemplaza; el aviso nuevo
  # dura 5 segundos desde su propio completado. Fila 1: dentro de los 5
  # segundos de los dos completados. Fila 2: pasados los del primero.
  Scenario Outline: Undo notice 3
    Given a relative recurring task Regar every <every> <unit>
    And a one-off task Pagar with due date <due_date>
    When I complete the task Regar on <water>
    And I complete the task Pagar on <pay>
    And I query the notice on <now>
    Then the notice offers to undo the completion of Pagar from <pay_stored>

    Examples:
      | every | unit   | due_date   | water               | pay                 | now                 | pay_stored          |
      | 2    | dias   | 2026-07-20 | 2026-07-15T08:00:00 | 2026-07-15T08:00:03 | 2026-07-15T08:00:04 | 2026-07-15T08:00:03 |
      | 2    | dias   | 2026-07-20 | 2026-07-15T08:00:00 | 2026-07-15T08:00:03 | 2026-07-15T08:00:07 | 2026-07-15T08:00:03 |

  # Aviso de deshacer 4
  # Completar otra vez la misma tarea con el aviso abierto también lo
  # reemplaza.
  Scenario Outline: Undo notice 4
    Given a relative recurring task Regar every <every> <unit>
    When I complete the task Regar on <first>
    And I complete the task Regar on <second>
    And I query the notice on <now>
    Then the notice offers to undo the completion of Regar from <second_stored>

    Examples:
      | every | unit   | first               | second              | now                 | second_stored       |
      | 2    | dias   | 2026-07-15T08:00:00 | 2026-07-15T08:00:02 | 2026-07-15T08:00:03 | 2026-07-15T08:00:02 |

  # Aviso de deshacer 5
  # Deshacer en el aviso borra ese completado, recalcula el estado con los
  # que quedan (U vuelve al anterior, que ya venció) y cierra el aviso.
  Scenario Outline: Undo notice 5
    Given a relative recurring task Regar every <every> <unit>
    And the task Regar was completed on <previous>
    When I complete the task Regar on <completed>
    And I tap Deshacer in the notice on <tap>
    And I query the notice on <tap>
    And I query the status on <now>
    Then there is no notice
    And the task Regar keeps a single completion, from <previous_stored>
    And the status is pendiente

    Examples:
      | every | unit   | previous            | completed           | tap                 | now                 | previous_stored     |
      | 4    | horas  | 2026-07-15T06:00:00 | 2026-07-15T11:00:00 | 2026-07-15T11:00:04 | 2026-07-15T11:00:05 | 2026-07-15T06:00:00 |

  # Aviso de deshacer 6
  # Deshacer una puntual desde el aviso la devuelve a Pendientes.
  Scenario Outline: Undo notice 6
    Given a one-off task Pagar with due date <due_date>
    When I complete the task Pagar on <completed>
    And I tap Deshacer in the notice on <tap>
    And I query Pendientes on <now>
    Then no completion remains of Pagar
    And Pendientes shows in order <order>

    Examples:
      | due_date   | completed           | tap                 | now                 | order |
      | 2026-07-20 | 2026-07-15T08:00:00 | 2026-07-15T08:00:02 | 2026-07-15T08:00:03 | Pagar |

  # Aviso de deshacer 7
  # Después de reemplazar el aviso, Deshacer borra solo el último completado;
  # el de la otra tarea sigue.
  Scenario Outline: Undo notice 7
    Given a relative recurring task Regar every <every> <unit>
    And a one-off task Pagar with due date <due_date>
    When I complete the task Regar on <water>
    And I complete the task Pagar on <pay>
    And I tap Deshacer in the notice on <tap>
    Then no completion remains of Pagar
    And the task Regar keeps a single completion, from <water_stored>

    Examples:
      | every | unit   | due_date   | water               | pay                 | tap                 | water_stored        |
      | 2    | dias   | 2026-07-20 | 2026-07-15T08:00:00 | 2026-07-15T08:00:03 | 2026-07-15T08:00:04 | 2026-07-15T08:00:00 |

  # Aviso de deshacer 8
  # Si otro dispositivo ya borró ese completado, Deshacer no hace nada: el
  # completado anterior sigue.
  Scenario Outline: Undo notice 8
    Given a relative recurring task Regar every <every> <unit>
    And the task Regar was completed on <previous>
    When I complete the task Regar on <completed>
    And another device, without seeing that change, deletes the completion from <completed>
    And I tap Deshacer in the notice on <tap>
    Then the task Regar keeps a single completion, from <previous_stored>

    Examples:
      | every | unit   | previous            | completed           | tap                 | previous_stored     |
      | 2    | dias   | 2026-07-13T09:00:00 | 2026-07-15T08:00:00 | 2026-07-15T08:00:02 | 2026-07-13T09:00:00 |

  # Aviso de deshacer 9
  # Si otro dispositivo ya borró la tarea, Deshacer no la revive.
  Scenario Outline: Undo notice 9
    Given a relative recurring task Regar every <every> <unit>
    When I complete the task Regar on <completed>
    And another device, without seeing that change, deletes the task
    And I tap Deshacer in the notice on <tap>
    And I query Pendientes at any moment
    Then no task remains
    And no completion remains of Regar

    Examples:
      | every | unit   | completed           | tap                 |
      | 2    | dias   | 2026-07-15T08:00:00 | 2026-07-15T08:00:02 |
