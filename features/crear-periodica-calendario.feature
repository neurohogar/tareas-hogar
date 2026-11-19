# mutation-stamp: sha256=8ae90901477a2427aea2e7443f2b7e0073771e493e37b750d8f82ffa4ce1867a
# acceptance-mutation-manifest-begin
# {"version":1,"tested_at":"2026-11-17T20:51:58.105483731Z","feature_name":"Crear periódica de calendario","feature_path":"features/crear-periodica-calendario.feature","background_hash":"74234e98afe7498fb5daf1f36ac2d78acc339464f950703b8c019892f982b90b","implementation_hash":"sha256:3da09fc5badcc79bbc2315c01b38049aca47fb888c1e411a945f583f3f13b755","scenarios":[{"index":0,"name":"Crear periódica de calendario 1","scenario_hash":"ed2746cdbda2b70dce82b3dc98b5717ea95dda2a49d3d136f4a2bc02680c2fe9","mutation_count":20,"result":{"Total":20,"Killed":20,"Survived":0,"Errors":0},"tested_at":"2026-11-17T20:51:58.105483731Z"},{"index":1,"name":"Crear periódica de calendario 2","scenario_hash":"50b6b2a4784b9adbb56b7988d5a293fc6880024954e298d9ca1fe2abec9ba324","mutation_count":20,"result":{"Total":20,"Killed":20,"Survived":0,"Errors":0},"tested_at":"2026-11-17T20:51:58.105483731Z"},{"index":2,"name":"Crear periódica de calendario 3","scenario_hash":"ffa8906cabb4737f085ee78035e4c276231e41384b3dc8a16e4b43af35149312","mutation_count":1,"result":{"Total":1,"Killed":1,"Survived":0,"Errors":0},"tested_at":"2026-11-17T20:51:58.105483731Z"},{"index":3,"name":"Crear periódica de calendario 4","scenario_hash":"8c75b2946c64569dc644517c8671bac48491bfb024296ab01e2356219e31385b","mutation_count":1,"result":{"Total":1,"Killed":1,"Survived":0,"Errors":0},"tested_at":"2026-11-17T20:51:58.105483731Z"},{"index":8,"name":"Crear periódica de calendario 9","scenario_hash":"db953747b463ae75071c37fb391082fb82d6de920e4fba0246968fde1066f683","mutation_count":2,"result":{"Total":2,"Killed":2,"Survived":0,"Errors":0},"tested_at":"2026-11-17T20:51:58.105483731Z"}]}
# acceptance-mutation-manifest-end

# Spec §4.1 y §4.2 (Semanal, Mensual). Crear una periódica de calendario con
# título y días: semanal (uno o más días de la semana, lunes..domingo) o
# mensual (uno o más días del mes, 1..31).
# Validación: título no vacío (un título de solo espacios cuenta como vacío),
# al menos un día, días del mes enteros entre 1 y 31, y semanal y mensual no
# se combinan.
# Los días son un conjunto: el orden en que se eligen no importa.
Feature: Create calendar recurring task

  # Crear periódica de calendario 1
  # Semanal válida: se crea con su recurrencia semanal y sin completados.
  Scenario Outline: Create calendar recurring task 1
    When I create a weekly recurring task with title <title> on <days>
    Then a recurring task is created with title <title_stored>
    And its recurrence is weekly on <days_stored>
    And the task has no completions

    Examples:
      | title           | days                                                       | title_stored    | days_stored                                                |
      | Sacar la basura | martes, jueves                                             | Sacar la basura | martes, jueves                                             |
      | Regar plantas   | domingo                                                    | Regar plantas   | domingo                                                    |
      | Cambiar sábanas | lunes, miércoles, viernes                                  | Cambiar sábanas | lunes, miércoles, viernes                                  |
      | Ventilar        | lunes, martes, miércoles, jueves, viernes, sábado, domingo | Ventilar        | lunes, martes, miércoles, jueves, viernes, sábado, domingo |
      | Lavar ropa      | jueves, martes                                             | Lavar ropa      | martes, jueves                                             |

  # Crear periódica de calendario 2
  # Mensual válida: se crea con su recurrencia mensual y sin completados.
  # El 31 es válido aunque no exista en todos los meses.
  Scenario Outline: Create calendar recurring task 2
    When I create a monthly recurring task with title <title> on days <days>
    Then a recurring task is created with title <title_stored>
    And its recurrence is monthly on days <days_stored>
    And the task has no completions

    Examples:
      | title            | days      | title_stored     | days_stored    |
      | Pagar expensas   | 10        | Pagar expensas   | 10             |
      | Limpiar heladera | 1, 15     | Limpiar heladera | 1, 15          |
      | Revisar filtro   | 31        | Revisar filtro   | 31             |
      | Pagar tarjeta    | 5, 20, 31 | Pagar tarjeta    | 5, 20, 31      |
      | Limpiar horno    | 20, 5     | Limpiar horno    | 5, 20          |

  # Crear periódica de calendario 3
  # Semanal con título vacío: se rechaza y no se crea nada.
  Scenario Outline: Create calendar recurring task 3
    When I create a weekly recurring task with title <title> and valid days
    Then creation is rejected for empty title
    And no task is created

    Examples:
      | title  |
      |        |

  # Crear periódica de calendario 4
  # Mensual con título vacío: se rechaza y no se crea nada.
  Scenario Outline: Create calendar recurring task 4
    When I create a monthly recurring task with title <title> and valid days
    Then creation is rejected for empty title
    And no task is created

    Examples:
      | title  |
      |        |

  # Crear periódica de calendario 5
  # Semanal con título de solo espacios: cuenta como vacío.
  Scenario: Create calendar recurring task 5
    When I create a weekly recurring task with a title of only spaces and valid days
    Then creation is rejected for empty title
    And no task is created

  # Crear periódica de calendario 6
  # Mensual con título de solo espacios: cuenta como vacío.
  Scenario: Create calendar recurring task 6
    When I create a monthly recurring task with a title of only spaces and valid days
    Then creation is rejected for empty title
    And no task is created

  # Crear periódica de calendario 7
  # Semanal sin ningún día: se rechaza.
  Scenario: Create calendar recurring task 7
    When I create a weekly recurring task with a valid title and without days
    Then creation is rejected for missing days
    And no task is created

  # Crear periódica de calendario 8
  # Mensual sin ningún día: se rechaza.
  Scenario: Create calendar recurring task 8
    When I create a monthly recurring task with a valid title and without days
    Then creation is rejected for missing days
    And no task is created

  # Crear periódica de calendario 9
  # Algún día del mes que no es entero entre 1 y 31: se rechaza toda la tarea.
  Scenario Outline: Create calendar recurring task 9
    When I create a monthly recurring task with a valid title on days <days>
    Then creation is rejected for invalid month day
    And no task is created

    Examples:
      | days   |
      | 0      |
      | 32     |
      | -1     |
      | 1.5    |
      | 15, 32 |
      | 0, 10  |

  # Crear periódica de calendario 10
  # Días de la semana y días del mes a la vez: se rechaza.
  Scenario: Create calendar recurring task 10
    When I create a calendar recurring task with a valid title and weekdays and month days at once
    Then creation is rejected for weekly and monthly combined
    And no task is created
