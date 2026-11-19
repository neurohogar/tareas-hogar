# mutation-stamp: sha256=791508a7703277b6d967fa4428a1ebe37246dc8bcabce7848d6d87dc8891760b
# acceptance-mutation-manifest-begin
# {"version":1,"tested_at":"2026-11-16T01:43:51.701126474Z","feature_name":"Completar tarea puntual","feature_path":"features/completar-puntual.feature","background_hash":"74234e98afe7498fb5daf1f36ac2d78acc339464f950703b8c019892f982b90b","implementation_hash":"sha256:6edbf6553c7fd6087ce0626379da4ca1ebc91f59a6fee0a3f15254a487e5111a","scenarios":[{"index":0,"name":"Completar tarea puntual 1","scenario_hash":"d3b7a800a4cd40f4dbda26b451f2e335dbd5c41a4d80d0bcb1be4bb496527ca7","mutation_count":8,"result":{"Total":8,"Killed":8,"Survived":0,"Errors":0},"tested_at":"2026-11-16T01:43:51.701126474Z"},{"index":1,"name":"Completar tarea puntual 2","scenario_hash":"8207ae633c036bd9847c3271367fb73fe69a6cc0e59dc52cd56d99fcaa9a505b","mutation_count":8,"result":{"Total":8,"Killed":8,"Survived":0,"Errors":0},"tested_at":"2026-11-16T01:43:51.701126474Z"}]}
# acceptance-mutation-manifest-end

# Spec §4.4 and §5.1. Completing a one-off task records a Completion
# (without ocurrenciaCubierta) with the moment it was completed, and the task stops
# appearing in Pendientes, whether it is pending or overdue.
Feature: Complete one-off task

  # Complete one-off task 1
  # Without a due date: the completion is recorded and the task leaves Pendientes.
  Scenario Outline: Complete one-off task 1
    Given a one-off task without a due date
    When I complete the task on <completed>
    And I query the status at any moment
    Then a completion without a covered occurrence was recorded
    And the recorded completion is from <completed_stored>
    And the task does not appear in Pendientes

    Examples:
      | completed           | completed_stored    |
      | 2026-07-15T08:00:00 | 2026-07-15T08:00:00 |

  # Complete one-off task 2
  # With a due date: the completion is recorded and the task leaves Pendientes,
  # both before and after the due date.
  Scenario Outline: Complete one-off task 2
    Given a one-off task with any due date
    When I complete the task on <completed>
    And I query the status at any moment
    Then a completion without a covered occurrence was recorded
    And the recorded completion is from <completed_stored>
    And the task does not appear in Pendientes

    Examples:
      | completed           | completed_stored    |
      | 2026-07-31T23:59:59 | 2026-07-31T23:59:59 |
