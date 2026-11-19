# mutation-stamp: sha256=81a90e24ab5c40c668baa8b74556e6e9c29c9637549b7c725f667c9db134ff4f
# acceptance-mutation-manifest-begin
# {"version":1,"tested_at":"2026-11-17T20:52:09.921967521Z","feature_name":"Crear periódica relativa","feature_path":"features/crear-periodica-relativa.feature","background_hash":"74234e98afe7498fb5daf1f36ac2d78acc339464f950703b8c019892f982b90b","implementation_hash":"sha256:556282e78e83e0dc6318ea77ab93f52f216a4279b2430bff7e1f528f4d8f83d8","scenarios":[{"index":0,"name":"Crear periódica relativa 1","scenario_hash":"5b2b21f266b76ca351a127148c6134adfb94aa109509e1c8d45110f70ae09ed5","mutation_count":20,"result":{"Total":20,"Killed":20,"Survived":0,"Errors":0},"tested_at":"2026-11-17T20:52:09.921967521Z"},{"index":1,"name":"Crear periódica relativa 2","scenario_hash":"060cc329cff5570332e3dc342b95fd1b7632b625bf1908b43512c1009c902bd7","mutation_count":1,"result":{"Total":1,"Killed":1,"Survived":0,"Errors":0},"tested_at":"2026-11-17T20:52:09.921967521Z"},{"index":3,"name":"Crear periódica relativa 4","scenario_hash":"24f0154a4e19ee97a4720137866c8b0bbe6d828766df21bcdc1e02d22d337d58","mutation_count":1,"result":{"Total":1,"Killed":1,"Survived":0,"Errors":0},"tested_at":"2026-11-17T20:52:09.921967521Z"}]}
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
