# mutation-stamp: sha256=37b547fe36f1688f4a33291d207f2e99f199ac4df5050215fc098bb4436cb174
# acceptance-mutation-manifest-begin
# {"version":1,"tested_at":"2026-11-19T12:16:35.820358489Z","feature_name":"Create one-off task","feature_path":"features/crear-puntual.feature","background_hash":"74234e98afe7498fb5daf1f36ac2d78acc339464f950703b8c019892f982b90b","implementation_hash":"sha256:f4bb7c422a93ba15108d4fcb84a0c6010c2a0cd2e24b83a2b0c69980f53e6607","scenarios":[{"index":0,"name":"Create one-off task 1","scenario_hash":"e3c32522cb977851921deea1f74da59ec40f2b2a0dd20d77b550f1abb0ca27d2","mutation_count":18,"result":{"Total":18,"Killed":18,"Survived":0,"Errors":0},"tested_at":"2026-11-19T12:16:35.820358489Z"},{"index":1,"name":"Create one-off task 2","scenario_hash":"45b54d425d4517f376e77936aaef6559794243e75296eba651232a88eab3ff66","mutation_count":4,"result":{"Total":4,"Killed":4,"Survived":0,"Errors":0},"tested_at":"2026-11-19T12:16:35.820358489Z"},{"index":2,"name":"Create one-off task 3","scenario_hash":"c39893b49167a7db07e88797bf0e372379f7d8b0d504bfc42e94bf67be5dfc66","mutation_count":5,"result":{"Total":5,"Killed":5,"Survived":0,"Errors":0},"tested_at":"2026-11-19T12:16:35.820358489Z"},{"index":3,"name":"Create one-off task 4","scenario_hash":"8a43594ec4f716fa487ef4103fc1c5d4b87ec83ef315d1a5d037e38b872d509a","mutation_count":1,"result":{"Total":1,"Killed":1,"Survived":0,"Errors":0},"tested_at":"2026-11-19T12:16:35.820358489Z"}]}
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
