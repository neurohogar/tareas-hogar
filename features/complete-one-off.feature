# mutation-stamp: sha256=cd52cea78766fb06607faec8c1dadbc755227dbe01ec5640d65fa39734ab2809
# acceptance-mutation-manifest-begin
# {"version":1,"tested_at":"2026-11-22T21:43:10.910845301Z","feature_name":"Complete one-off task","feature_path":"features/complete-one-off.feature","background_hash":"74234e98afe7498fb5daf1f36ac2d78acc339464f950703b8c019892f982b90b","implementation_hash":"sha256:e5c8a7748f97b7da2b424b49cfbf47ef165aad74d5e7bfa82d8f00462e47ff93","scenarios":[{"index":0,"name":"Complete one-off task 1","scenario_hash":"421dac7cc37da733d63a810f28f7f989a5c5bc01f35308969494b29c899a8332","mutation_count":8,"result":{"Total":8,"Killed":8,"Survived":0,"Errors":0},"tested_at":"2026-11-22T21:43:10.910845301Z"},{"index":1,"name":"Complete one-off task 2","scenario_hash":"adbe01cd605e9ec5460f1b2a53dcda6158f461eed79d52f6cbec4ba39cb49d04","mutation_count":8,"result":{"Total":8,"Killed":8,"Survived":0,"Errors":0},"tested_at":"2026-11-22T21:43:10.910845301Z"}]}
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
