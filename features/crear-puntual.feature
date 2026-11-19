# mutation-stamp: sha256=fedec687e7c50438e0418a6cbd0d963b23dfc12c95854dc70b601ecea7325c26
# acceptance-mutation-manifest-begin
# {"version":1,"tested_at":"2026-11-17T20:52:22.928085946Z","feature_name":"Crear tarea puntual","feature_path":"features/crear-puntual.feature","background_hash":"74234e98afe7498fb5daf1f36ac2d78acc339464f950703b8c019892f982b90b","implementation_hash":"sha256:157cf0e765cac4b9fb8f2394309f0ba56d70c89dca02668b8d9f4ba68133610c","scenarios":[{"index":0,"name":"Crear tarea puntual 1","scenario_hash":"03872e56c46fc6ee802ab26d9272a858fba02352c238fb0d537189fabf077197","mutation_count":18,"result":{"Total":18,"Killed":18,"Survived":0,"Errors":0},"tested_at":"2026-11-17T20:52:22.928085946Z"},{"index":1,"name":"Crear tarea puntual 2","scenario_hash":"2a68ae3d1d50a9bf13076a14dc411840e734d732aadf47af374cee18db2d9b09","mutation_count":4,"result":{"Total":4,"Killed":4,"Survived":0,"Errors":0},"tested_at":"2026-11-17T20:52:22.928085946Z"},{"index":2,"name":"Crear tarea puntual 3","scenario_hash":"c3f030b5489c1c7ad45307aa03338c041ed07b71f61267c39fbaacd0a4cfc56c","mutation_count":5,"result":{"Total":5,"Killed":5,"Survived":0,"Errors":0},"tested_at":"2026-11-17T20:52:22.928085946Z"},{"index":3,"name":"Crear tarea puntual 4","scenario_hash":"0b87204fb56d9f06fe966fa4b76d61548b137d5c1bf1d91064d8ee3325d16900","mutation_count":1,"result":{"Total":1,"Killed":1,"Survived":0,"Errors":0},"tested_at":"2026-11-17T20:52:22.928085946Z"}]}
# acceptance-mutation-manifest-end

# Spec §4.1. Create a one-off task with a title and an optional due date
# (a date without time, ISO-8601 YYYY-MM-DD, in the device's local time zone).
# Validation: non-empty title (a title of only spaces counts as empty)
# and, if there is a due date, that it is a date that exists in the calendar.
# A due date earlier than the creation day is accepted: the task is
# overdue from the start.
Feature: Create one-off task

  # Create one-off task 1
  # With a due date: the one-off task is created with that date and no completions.
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

  # Create one-off task 2
  # Without a due date: the one-off task is created without a due date and no completions.
  Scenario Outline: Create one-off task 2
    When I create a one-off task with title <title> and no due date
    Then a one-off task is created with title <title_stored>
    And the task has no due date
    And the task has no completions

    Examples:
      | title          | title_stored    |
      | Cambiar foco   | Cambiar foco    |
      | Llamar plomero | Llamar plomero  |

  # Create one-off task 3
  # Due date earlier than the creation day: it is accepted and the task is overdue from the start.
  Scenario Outline: Create one-off task 3
    When I create on <created> a one-off task with a valid title and due date <due_date>
    And I query the status on <created>
    Then a one-off task is created
    And the status is atrasada

    Examples:
      | created             | due_date     |
      | 2026-07-15T08:00:00 | 2026-07-14   |
      | 2026-08-01T00:00:00 | 2026-07-31   |

  # Create one-off task 4
  # Empty title: it is rejected and nothing is created.
  Scenario Outline: Create one-off task 4
    When I create a one-off task with title <title> and no due date
    Then creation is rejected for empty title
    And no task is created

    Examples:
      | title  |
      |        |

  # Create one-off task 5
  # Title of only spaces: counts as empty.
  Scenario: Create one-off task 5
    When I create a one-off task with a title of only spaces and no due date
    Then creation is rejected for empty title
    And no task is created

  # Create one-off task 6
  # Due date that does not exist in the calendar: it is rejected and nothing is created.
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
