# mutation-stamp: sha256=9439e63a4bcba43a2e46ffde40cddd231ddc9d3967a621f7289293a397155ce7
# acceptance-mutation-manifest-begin
# {"version":1,"tested_at":"2026-11-22T22:07:57.677021677Z","feature_name":"One-off task status","feature_path":"features/status-one-off.feature","background_hash":"74234e98afe7498fb5daf1f36ac2d78acc339464f950703b8c019892f982b90b","implementation_hash":"sha256:b823478365216cfb6e74f694b159fa61eff7bbe7a073c95e178a56b766492c8f","scenarios":[{"index":1,"name":"One-off task status 2","scenario_hash":"39e49c28de01829652f30a2d0cee1a9853fa66c1207e296f1e14c47f32625b44","mutation_count":7,"result":{"Total":7,"Killed":7,"Survived":0,"Errors":0},"tested_at":"2026-11-22T22:07:57.677021677Z"},{"index":2,"name":"One-off task status 3","scenario_hash":"698e2a1ba2d3b3134209bf9b6b5bde3a749bfe2038ecc0fab9b77d386a8781c5","mutation_count":9,"result":{"Total":9,"Killed":9,"Survived":0,"Errors":0},"tested_at":"2026-11-22T22:07:57.677021677Z"}]}
# acceptance-mutation-manifest-end

# Spec §5.1. Derived status of a one-off task.
# Dates and times in the device's local time; the day starts at 00:00.
# "today" is the local date of "now". The due date counts as the whole
# day: until 23:59:59 of that day the task is still pending.
#   With at least one completion: it does not appear in Pendientes.
#   Without completion and without a due date: pending.
#   Without completion and today ≤ fechaLimite: pending.
#   Without completion and today > fechaLimite: overdue.
# A one-off task is never waiting. creadaEn does not affect its status.
Feature: One-off task status

  # One-off task status 1
  # Without completion and without a due date: pending, at any time.
  Scenario: One-off task status 1
    Given a one-off task without a due date
    When I query the status at any moment
    Then the status is pendiente

  # One-off task status 2
  # Without completion and today ≤ fechaLimite: pending.
  # Edges: the first and the last second of the due day, and the day before.
  Scenario Outline: One-off task status 2
    Given a one-off task with due date <due_date>
    When I query the status on <now>
    Then the status is pendiente

    Examples:
      | due_date     | now                 |
      | 2026-07-15   | 2026-07-15T00:00:00 |
      | 2026-07-15   | 2026-07-15T23:59:59 |
      | 2026-07-15   | 2026-07-14T23:59:59 |
      | 2026-12-31   | 2026-12-31T12:00:00 |

  # One-off task status 3
  # Without completion and today > fechaLimite: overdue.
  # Edges: the first second of the next day, end of month and end of year.
  Scenario Outline: One-off task status 3
    Given a one-off task with due date <due_date>
    When I query the status on <now>
    Then the status is atrasada

    Examples:
      | due_date     | now                 |
      | 2026-07-15   | 2026-07-16T00:00:00 |
      | 2026-07-31   | 2026-08-01T00:00:00 |
      | 2026-12-31   | 2027-01-01T00:00:00 |
      | 2026-07-15   | 2026-09-01T08:00:00 |

  # One-off task status 4
  # With a completion: it does not appear in Pendientes, at any time.
  Scenario: One-off task status 4
    Given a one-off task without a due date
    And the task has a completion
    When I query the status at any moment
    Then the task does not appear in Pendientes

  # One-off task status 5
  # With a due date and two completions (for example, from two devices):
  # it does not appear in Pendientes, neither before nor after the due date.
  Scenario: One-off task status 5
    Given a one-off task with any due date
    And the task has two completions
    When I query the status at any moment
    Then the task does not appear in Pendientes
