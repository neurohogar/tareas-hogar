# mutation-stamp: sha256=21a8b9f46bf581aef85b1e0d71edb2575ee1af00c90d196c493e390aed25f39d
# acceptance-mutation-manifest-begin
# {"version":1,"tested_at":"2026-11-22T21:45:20.853419682Z","feature_name":"Complete relative recurring task","feature_path":"features/complete-recurring-relative.feature","background_hash":"74234e98afe7498fb5daf1f36ac2d78acc339464f950703b8c019892f982b90b","implementation_hash":"sha256:d13099f2bd5f6d5ac3c1d10e0ace908e1a3c767480c66bd8435dae2f50340896","scenarios":[{"index":0,"name":"Complete relative recurring task 1","scenario_hash":"e48e5a82476c75114e1c541b7c090cde968135ff90e4bb1df372ff453621400e","mutation_count":11,"result":{"Total":11,"Killed":11,"Survived":0,"Errors":0},"tested_at":"2026-11-22T21:45:20.853419682Z"},{"index":1,"name":"Complete relative recurring task 2","scenario_hash":"9736363ff6c792b32d2f01a22bc104c51e8325017a7228c467bcf8a838d66ff7","mutation_count":47,"result":{"Total":47,"Killed":47,"Survived":0,"Errors":0},"tested_at":"2026-11-22T21:45:20.853419682Z"},{"index":2,"name":"Complete relative recurring task 3","scenario_hash":"1caaaecfd376edff417f3f14f27868b38327d99c5c6d900345471aa829d6920b","mutation_count":17,"result":{"Total":17,"Killed":17,"Survived":0,"Errors":0},"tested_at":"2026-11-22T21:45:20.853419682Z"},{"index":3,"name":"Complete relative recurring task 4","scenario_hash":"4e081548e3eb674853e78024d8f1b83081fe5d07b20e8c0b83ceeabdf9f71a21","mutation_count":5,"result":{"Total":5,"Killed":5,"Survived":0,"Errors":0},"tested_at":"2026-11-22T21:45:20.853419682Z"}]}
# acceptance-mutation-manifest-end

# Spec §4.4 and §5.2. Completing a relative recurring task records a Completion
# (without ocurrenciaCubierta) and restarts the interval from that moment,
# in any status. Earlier completions are not modified.
# Progress is a fraction between 0 and 1, compared exactly.
Feature: Complete relative recurring task

  # Complete relative recurring task 1
  # Completing a never-completed task leaves it waiting from that moment.
  Scenario Outline: Complete relative recurring task 1
    Given a relative recurring task every <every> <unit>
    When I complete the task on <completed>
    And I query the status on <now>
    Then a completion without a covered occurrence was recorded
    And the status is en espera
    And the progress is <progress>

    Examples:
      | every | unit   | completed           | now                 | progress |
      | 2    | dias   | 2026-07-15T08:00:00 | 2026-07-16T08:00:00 | 0.5      |

  # Complete relative recurring task 2
  # Completing while waiting, pending or overdue restarts the interval from the new completion.
  Scenario Outline: Complete relative recurring task 2
    Given a relative recurring task every <every> <unit>
    And the task was completed on <previous>
    When I complete the task on <new>
    And I query the status on <now>
    Then the new completion is added without changing the previous ones
    And the status is en espera
    And the progress is <progress>

    Examples:
      | every | unit   | previous            | new                 | now                 | progress |
      | 4    | horas  | 2026-07-15T08:00:00 | 2026-07-15T09:00:00 | 2026-07-15T10:00:00 | 0.25     |
      | 4    | horas  | 2026-07-15T08:00:00 | 2026-07-15T13:00:00 | 2026-07-15T15:00:00 | 0.5      |
      | 4    | horas  | 2026-07-15T08:00:00 | 2026-07-16T08:00:00 | 2026-07-16T11:00:00 | 0.75     |
      | 2    | dias   | 2026-07-15T08:00:00 | 2026-07-15T20:00:00 | 2026-07-16T08:00:00 | 0.25     |

  # Complete relative recurring task 3
  # After completing early, it goes back to pending when the new interval expires
  # (with the previous completion, at those moments it would be overdue).
  Scenario Outline: Complete relative recurring task 3
    Given a relative recurring task every <every> <unit>
    And the task was completed on <previous>
    When I complete the task on <new>
    And I query the status on <now>
    Then the status is pendiente

    Examples:
      | every | unit   | previous            | new                 | now                 |
      | 4    | horas  | 2026-07-15T08:00:00 | 2026-07-15T11:00:00 | 2026-07-15T15:00:00 |
      | 4    | horas  | 2026-07-15T08:00:00 | 2026-07-15T11:00:00 | 2026-07-15T16:00:00 |
      | 3    | dias   | 2026-07-15T08:00:00 | 2026-07-17T08:00:00 | 2026-07-21T08:00:00 |

  # Complete relative recurring task 4
  # Queried at the same instant as the completion: waiting, with no progress.
  # The interval does not affect this edge, which is why it is not a parameter.
  Scenario Outline: Complete relative recurring task 4
    Given a relative recurring task never completed
    When I complete the task on <completed>
    And I query the status on <now>
    Then a completion without a covered occurrence was recorded
    And the status is en espera
    And the progress is <progress>

    Examples:
      | completed           | now                 | progress |
      | 2026-07-15T08:00:00 | 2026-07-15T08:00:00 | 0        |
