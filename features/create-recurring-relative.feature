# mutation-stamp: sha256=d0597c253071d75b92b86acce1e632fcbdd9481a9a002d6f60e62f3d57919139
# acceptance-mutation-manifest-begin
# {"version":1,"tested_at":"2026-11-19T12:16:20.385494385Z","feature_name":"Create relative recurring task","feature_path":"features/create-recurring-relative.feature","background_hash":"74234e98afe7498fb5daf1f36ac2d78acc339464f950703b8c019892f982b90b","implementation_hash":"sha256:79b6bfa0bbfeafc970118933633d5afe8ef58487e8cb6d49290e402d7e890205","scenarios":[{"index":0,"name":"Create relative recurring task 1","scenario_hash":"ec90cb4287bf3c2e9dcc82eddcab37bb0d24681c1f06d99da187d0dcd38e4f2c","mutation_count":20,"result":{"Total":20,"Killed":20,"Survived":0,"Errors":0},"tested_at":"2026-11-19T12:16:20.385494385Z"},{"index":1,"name":"Create relative recurring task 2","scenario_hash":"6aee8e3c3012df6c2545c72eea1d7ac378c9005a9458df0d0077cabc8520dd81","mutation_count":1,"result":{"Total":1,"Killed":1,"Survived":0,"Errors":0},"tested_at":"2026-11-19T12:16:20.385494385Z"},{"index":3,"name":"Create relative recurring task 4","scenario_hash":"259a713c61a8449dce59d50818ed7bfbf7100b7caeca9fd420f209b90a0ed7bb","mutation_count":1,"result":{"Total":1,"Killed":1,"Survived":0,"Errors":0},"tested_at":"2026-11-19T12:16:20.385494385Z"}]}
# acceptance-mutation-manifest-end

# Spec §4.1 and §4.2 (Relative). Creating a relative recurring task with title and
# "cada N horas|dias". Validation: non-empty title (a title of only spaces
# counts as empty) and N an integer >= 1.
Feature: Create relative recurring task

  # Create relative recurring task 1
  # Valid data: the recurring task is created with its relative recurrence and without completions.
  Scenario Outline: Create relative recurring task 1
    When I create a relative recurring task with title <title> every <every> <unit>
    Then a recurring task is created with title <title_stored>
    And its recurrence is relative every <every_stored> <unit>
    And the task has no completions

    Examples:
      | title           | every | unit   | title_stored    | every_stored  |
      | Limpiar el baño | 1    | horas  | Limpiar el baño | 1             |
      | Regar plantas   | 3    | dias   | Regar plantas   | 3             |
      | Cambiar sábanas | 14   | dias   | Cambiar sábanas | 14            |
      | Ventilar        | 36   | horas  | Ventilar        | 36            |

  # Create relative recurring task 2
  # Empty title: it is rejected and nothing is created.
  Scenario Outline: Create relative recurring task 2
    When I create a relative recurring task with title <title> and a valid interval
    Then creation is rejected for empty title
    And no task is created

    Examples:
      | title  |
      |        |

  # Create relative recurring task 3
  # Title of only spaces: it counts as empty.
  Scenario: Create relative recurring task 3
    When I create a relative recurring task with a title of only spaces and a valid interval
    Then creation is rejected for empty title
    And no task is created

  # Create relative recurring task 4
  # N that is not an integer >= 1: it is rejected and nothing is created.
  Scenario Outline: Create relative recurring task 4
    When I create a relative recurring task with a valid title and <every> as the interval amount
    Then creation is rejected for invalid interval
    And no task is created

    Examples:
      | every |
      | 0    |
      | 1.5  |
