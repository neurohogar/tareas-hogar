# mutation-stamp: sha256=fedec687e7c50438e0418a6cbd0d963b23dfc12c95854dc70b601ecea7325c26
# acceptance-mutation-manifest-begin
# {"version":1,"tested_at":"2026-11-17T20:52:22.928085946Z","feature_name":"Crear tarea puntual","feature_path":"features/crear-puntual.feature","background_hash":"74234e98afe7498fb5daf1f36ac2d78acc339464f950703b8c019892f982b90b","implementation_hash":"sha256:157cf0e765cac4b9fb8f2394309f0ba56d70c89dca02668b8d9f4ba68133610c","scenarios":[{"index":0,"name":"Crear tarea puntual 1","scenario_hash":"03872e56c46fc6ee802ab26d9272a858fba02352c238fb0d537189fabf077197","mutation_count":18,"result":{"Total":18,"Killed":18,"Survived":0,"Errors":0},"tested_at":"2026-11-17T20:52:22.928085946Z"},{"index":1,"name":"Crear tarea puntual 2","scenario_hash":"2a68ae3d1d50a9bf13076a14dc411840e734d732aadf47af374cee18db2d9b09","mutation_count":4,"result":{"Total":4,"Killed":4,"Survived":0,"Errors":0},"tested_at":"2026-11-17T20:52:22.928085946Z"},{"index":2,"name":"Crear tarea puntual 3","scenario_hash":"c3f030b5489c1c7ad45307aa03338c041ed07b71f61267c39fbaacd0a4cfc56c","mutation_count":5,"result":{"Total":5,"Killed":5,"Survived":0,"Errors":0},"tested_at":"2026-11-17T20:52:22.928085946Z"},{"index":3,"name":"Crear tarea puntual 4","scenario_hash":"0b87204fb56d9f06fe966fa4b76d61548b137d5c1bf1d91064d8ee3325d16900","mutation_count":1,"result":{"Total":1,"Killed":1,"Survived":0,"Errors":0},"tested_at":"2026-11-17T20:52:22.928085946Z"}]}
# acceptance-mutation-manifest-end

# Spec §4.1. Crear una tarea puntual con título y fecha límite opcional
# (fecha sin hora, ISO-8601 AAAA-MM-DD, en la zona local del dispositivo).
# Validación: título no vacío (un título de solo espacios cuenta como vacío)
# y, si hay fecha límite, que sea una fecha que existe en el calendario.
# Se acepta una fecha límite anterior al día de creación: la tarea queda
# atrasada de entrada.
Feature: Create one-off task

  # Crear tarea puntual 1
  # Con fecha límite: se crea la tarea puntual con esa fecha y sin completados.
  Scenario Outline: Create one-off task 1
    When I create a one-off task with title <title> and due date <due_date>
    Then a one-off task is created with title <title_stored>
    And its due date is <due_date_stored>
    And the task has no completions

    Examples:
      | title           | due_date     | title_stored    | due_date_stored       |
      | Pagar la luz    | 2026-07-20   | Pagar la luz    | 2026-07-20            |
      | Comprar regalo  | 2026-12-31   | Comprar regalo  | 2026-12-31            |
      | Renovar seguro  | 2028-02-29   | Renovar seguro  | 2028-02-29            |

  # Crear tarea puntual 2
  # Sin fecha límite: se crea la tarea puntual sin fecha límite y sin completados.
  Scenario Outline: Create one-off task 2
    When I create a one-off task with title <title> and no due date
    Then a one-off task is created with title <title_stored>
    And the task has no due date
    And the task has no completions

    Examples:
      | title          | title_stored    |
      | Cambiar foco   | Cambiar foco    |
      | Llamar plomero | Llamar plomero  |

  # Crear tarea puntual 3
  # Fecha límite anterior al día de creación: se acepta y queda atrasada de entrada.
  Scenario Outline: Create one-off task 3
    When I create on <created> a one-off task with a valid title and due date <due_date>
    And I query the status on <created>
    Then a one-off task is created
    And the status is atrasada

    Examples:
      | created             | due_date     |
      | 2026-07-15T08:00:00 | 2026-07-14   |
      | 2026-08-01T00:00:00 | 2026-07-31   |

  # Crear tarea puntual 4
  # Título vacío: se rechaza y no se crea nada.
  Scenario Outline: Create one-off task 4
    When I create a one-off task with title <title> and no due date
    Then creation is rejected for empty title
    And no task is created

    Examples:
      | title  |
      |        |

  # Crear tarea puntual 5
  # Título de solo espacios: cuenta como vacío.
  Scenario: Create one-off task 5
    When I create a one-off task with a title of only spaces and no due date
    Then creation is rejected for empty title
    And no task is created

  # Crear tarea puntual 6
  # Fecha límite que no existe en el calendario: se rechaza y no se crea nada.
  Scenario Outline: Create one-off task 6
    When I create a one-off task with a valid title and due date <due_date>
    Then creation is rejected for invalid due date
    And no task is created

    Examples:
      | due_date     |
      | 2026-02-29   |
      | 2026-04-31   |
      | 2026-13-01   |
      | 2026-00-10   |
      | 2026-07-00   |
