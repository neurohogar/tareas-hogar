# mutation-stamp: sha256=021093077e6ee7cc491746fb293fc265f0883979fbc05e10c716d4c37027c319
# acceptance-mutation-manifest-begin
# {"version":1,"tested_at":"2026-11-19T12:16:06.589919945Z","feature_name":"Create calendar recurring task","feature_path":"features/crear-periodica-calendario.feature","background_hash":"74234e98afe7498fb5daf1f36ac2d78acc339464f950703b8c019892f982b90b","implementation_hash":"sha256:76016376abab828d8db05e95b33bff1083a6fd13d3aff7537b4526b09f8d8c49","scenarios":[{"index":0,"name":"Create calendar recurring task 1","scenario_hash":"cda701b429405294dd85373985b6842e7893271ef7c1145b7cadbf70cc57a7ee","mutation_count":20,"result":{"Total":20,"Killed":20,"Survived":0,"Errors":0},"tested_at":"2026-11-19T12:16:06.589919945Z"},{"index":1,"name":"Create calendar recurring task 2","scenario_hash":"2ac8002a2732892bacfa379f1545e93ce3d6481968d0afcd238c452a2d4bd003","mutation_count":20,"result":{"Total":20,"Killed":20,"Survived":0,"Errors":0},"tested_at":"2026-11-19T12:16:06.589919945Z"},{"index":2,"name":"Create calendar recurring task 3","scenario_hash":"58c2d709bacda1dbcfb256c1101f9e47abcc797ecaba8b3d92a3caead7335c17","mutation_count":1,"result":{"Total":1,"Killed":1,"Survived":0,"Errors":0},"tested_at":"2026-11-19T12:16:06.589919945Z"},{"index":3,"name":"Create calendar recurring task 4","scenario_hash":"c5798e81fa70042486826ede51832820444b94d8781b2444fcb401e591dd4e96","mutation_count":1,"result":{"Total":1,"Killed":1,"Survived":0,"Errors":0},"tested_at":"2026-11-19T12:16:06.589919945Z"},{"index":8,"name":"Create calendar recurring task 9","scenario_hash":"4165dbf41764e5b0ebc7f7d4b893b9aac9efbb2ef075476439f9be106a43188e","mutation_count":2,"result":{"Total":2,"Killed":2,"Survived":0,"Errors":0},"tested_at":"2026-11-19T12:16:06.589919945Z"}]}
# acceptance-mutation-manifest-end

# Spec §4.1 and §4.2 (Semanal, Mensual). Create a calendar recurring task with
# a title and days: weekly (one or more days of the week, lunes..domingo) or
# monthly (one or more days of the month, 1..31).
# Validation: non-empty title (a title of only spaces counts as empty),
# at least one day, whole days of the month between 1 and 31, and weekly and monthly
# are not combined.
# The days are a set: the order in which they are chosen does not matter.
Feature: Create calendar recurring task

  # Create calendar recurring task 1
  # Valid weekly: it is created with its weekly recurrence and no completions.
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

  # Create calendar recurring task 2
  # Valid monthly: it is created with its monthly recurrence and no completions.
  # The 31st is valid even though it does not exist in every month.
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

  # Create calendar recurring task 3
  # Weekly with an empty title: it is rejected and nothing is created.
  Scenario Outline: Create calendar recurring task 3
    When I create a weekly recurring task with title <title> and valid days
    Then creation is rejected for empty title
    And no task is created

    Examples:
      | title  |
      |        |

  # Create calendar recurring task 4
  # Monthly with an empty title: it is rejected and nothing is created.
  Scenario Outline: Create calendar recurring task 4
    When I create a monthly recurring task with title <title> and valid days
    Then creation is rejected for empty title
    And no task is created

    Examples:
      | title  |
      |        |

  # Create calendar recurring task 5
  # Weekly with a title of only spaces: counts as empty.
  Scenario: Create calendar recurring task 5
    When I create a weekly recurring task with a title of only spaces and valid days
    Then creation is rejected for empty title
    And no task is created

  # Create calendar recurring task 6
  # Monthly with a title of only spaces: counts as empty.
  Scenario: Create calendar recurring task 6
    When I create a monthly recurring task with a title of only spaces and valid days
    Then creation is rejected for empty title
    And no task is created

  # Create calendar recurring task 7
  # Weekly with no day: it is rejected.
  Scenario: Create calendar recurring task 7
    When I create a weekly recurring task with a valid title and without days
    Then creation is rejected for missing days
    And no task is created

  # Create calendar recurring task 8
  # Monthly with no day: it is rejected.
  Scenario: Create calendar recurring task 8
    When I create a monthly recurring task with a valid title and without days
    Then creation is rejected for missing days
    And no task is created

  # Create calendar recurring task 9
  # Some day of the month that is not a whole number between 1 and 31: the whole task is rejected.
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

  # Create calendar recurring task 10
  # Days of the week and days of the month at once: it is rejected.
  Scenario: Create calendar recurring task 10
    When I create a calendar recurring task with a valid title and weekdays and month days at once
    Then creation is rejected for weekly and monthly combined
    And no task is created
