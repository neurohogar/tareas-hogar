# mutation-stamp: sha256=1169c21aed164495d0e5dda6022ee7f21cc70d1cb5fcb8ca8602addc6e723194
# acceptance-mutation-manifest-begin
# {"version":1,"tested_at":"2026-11-19T12:14:20.235656997Z","feature_name":"Complete calendar recurring task","feature_path":"features/complete-recurring-calendar.feature","background_hash":"74234e98afe7498fb5daf1f36ac2d78acc339464f950703b8c019892f982b90b","implementation_hash":"sha256:cc54f35be7b90cdece629294ddb69395ff0e2dbfa2ae4caa4dc4280fa85ea599","scenarios":[{"index":0,"name":"Complete calendar recurring task 1","scenario_hash":"6a4e7a6e7f131b8cc309eda777336ceafd1da6616715a807c5c21f5113dad6c0","mutation_count":30,"result":{"Total":30,"Killed":30,"Survived":0,"Errors":0},"tested_at":"2026-11-19T12:14:20.235656997Z"},{"index":1,"name":"Complete calendar recurring task 2","scenario_hash":"fe9307576a165405a1690b7668a3a4e9aea40a8d272042910b1d537159c08a4c","mutation_count":38,"result":{"Total":38,"Killed":38,"Survived":0,"Errors":0},"tested_at":"2026-11-19T12:14:20.235656997Z"},{"index":2,"name":"Complete calendar recurring task 3","scenario_hash":"2817f47a6e93555666dae65f9a35d3a53ac2e10bc919883cfdee319467cf7e7f","mutation_count":46,"result":{"Total":46,"Killed":46,"Survived":0,"Errors":0},"tested_at":"2026-11-19T12:14:20.235656997Z"},{"index":3,"name":"Complete calendar recurring task 4","scenario_hash":"f9be03e340341758e791bee387018cd9816f40b97b86c43eb4df86cc9592edc8","mutation_count":16,"result":{"Total":16,"Killed":16,"Survived":0,"Errors":0},"tested_at":"2026-11-19T12:14:20.235656997Z"},{"index":4,"name":"Complete calendar recurring task 5","scenario_hash":"2d0639c7143c195121cc27b5508fcea1d79c4742c4a6ec22b16a8ebce3ea265b","mutation_count":36,"result":{"Total":36,"Killed":36,"Survived":0,"Errors":0},"tested_at":"2026-11-19T12:14:20.235656997Z"},{"index":5,"name":"Complete calendar recurring task 6","scenario_hash":"8b48cbe35afd7699de56d27b0b3d113462c7bb9aac3fa763b575f6cc4a14bfee","mutation_count":32,"result":{"Total":32,"Killed":32,"Survived":0,"Errors":0},"tested_at":"2026-11-19T12:14:20.235656997Z"},{"index":6,"name":"Complete calendar recurring task 7","scenario_hash":"4d95d075a334b14aa4343f015a601179935c67995f98ce074c79f7432262f2df","mutation_count":17,"result":{"Total":17,"Killed":17,"Survived":0,"Errors":0},"tested_at":"2026-11-19T12:14:20.235656997Z"}]}
# acceptance-mutation-manifest-end

# Spec §4.4 and §5.3. Completing a recurring calendar task records a
# completion with the occurrence it covers (ocurrenciaCubierta, a date),
# computed on completion with P = the greatest occurrence covered up to that
# moment (or the day before creadaEn if it was never completed) and today = the local
# date of the completion:
#   - if there are occurrences in (P, today], it covers the most recent; the earlier ones are
#     discarded;
#   - if there are none, it covers N, the first occurrence after P (the
#     next one not yet covered): each extra completion advances one occurrence.
# Afterwards, the status follows §5.3 with the new P. Earlier completions
# are not modified. Progress is a fraction between 0 and 1, compared exactly.
# Reference week: Monday 2026-07-13 to Sunday 2026-07-19.
Feature: Complete calendar recurring task

  # Complete calendar recurring task 1
  # Which occurrence the first completion covers. Rows 1 to 4: the table
  # "martes y jueves" of the spec (Tuesday, Monday ahead of time, Wednesday with
  # Tuesday overdue, Friday with Tuesday and Thursday missed). Rows 5 and 6:
  # the edge at 00:00 on Thursday.
  Scenario Outline: Complete calendar recurring task 1
    Given a weekly recurring task on <days> created on <created>
    When I complete the task on <completed>
    Then a completion was recorded that covers <covered>

    Examples:
      | days           | created             | completed           | covered    |
      | martes, jueves | 2026-07-13T08:00:00 | 2026-07-14T10:00:00 | 2026-07-14 |
      | martes, jueves | 2026-07-13T08:00:00 | 2026-07-13T10:00:00 | 2026-07-14 |
      | martes, jueves | 2026-07-13T08:00:00 | 2026-07-15T10:00:00 | 2026-07-14 |
      | martes, jueves | 2026-07-13T08:00:00 | 2026-07-17T10:00:00 | 2026-07-16 |
      | martes, jueves | 2026-07-13T08:00:00 | 2026-07-15T23:59:59 | 2026-07-14 |
      | martes, jueves | 2026-07-13T08:00:00 | 2026-07-16T00:00:00 | 2026-07-16 |
      | domingo        | 2026-07-13T08:00:00 | 2026-07-18T10:00:00 | 2026-07-19 |
      | domingo        | 2026-07-13T08:00:00 | 2026-08-04T10:00:00 | 2026-08-02 |

  # Complete calendar recurring task 2
  # After completing, it goes back to pending on the day of the next uncovered
  # occurrence (column "Vuelve a pendiente" of the spec table).
  Scenario Outline: Complete calendar recurring task 2
    Given a weekly recurring task on <days> created on <created>
    When I complete the task on <completed>
    And I query the status on <returns>
    Then the status is pendiente

    Examples:
      | days           | created             | completed           | returns             |
      | martes, jueves | 2026-07-13T08:00:00 | 2026-07-14T10:00:00 | 2026-07-16T00:00:00 |
      | martes, jueves | 2026-07-13T08:00:00 | 2026-07-13T10:00:00 | 2026-07-16T00:00:00 |
      | martes, jueves | 2026-07-13T08:00:00 | 2026-07-15T10:00:00 | 2026-07-16T00:00:00 |
      | martes, jueves | 2026-07-13T08:00:00 | 2026-07-17T10:00:00 | 2026-07-21T00:00:00 |
      | martes, jueves | 2026-07-13T08:00:00 | 2026-07-15T23:59:59 | 2026-07-16T00:00:00 |
      | martes, jueves | 2026-07-13T08:00:00 | 2026-07-16T00:00:00 | 2026-07-21T00:00:00 |
      | domingo        | 2026-07-13T08:00:00 | 2026-07-18T10:00:00 | 2026-07-26T00:00:00 |
      | domingo        | 2026-07-13T08:00:00 | 2026-08-04T10:00:00 | 2026-08-09T00:00:00 |

  # Complete calendar recurring task 3
  # Until it comes back, it is waiting with progress since the completion, in
  # whatever state it was. Row 2: completed on Monday, on Tuesday it is no longer
  # pending. Row 5: at the very instant of the completion, progress 0.
  Scenario Outline: Complete calendar recurring task 3
    Given a weekly recurring task on <days> created on <created>
    When I complete the task on <completed>
    And I query the status on <now>
    Then the status is en espera
    And the progress is <progress>

    Examples:
      | days           | created             | completed           | now                 | progress |
      | martes, jueves | 2026-07-13T08:00:00 | 2026-07-14T10:00:00 | 2026-07-14T19:30:00 | 0.25     |
      | martes, jueves | 2026-07-13T08:00:00 | 2026-07-13T10:00:00 | 2026-07-14T17:00:00 | 0.5      |
      | martes, jueves | 2026-07-13T08:00:00 | 2026-07-15T10:00:00 | 2026-07-15T20:30:00 | 0.75     |
      | martes, jueves | 2026-07-13T08:00:00 | 2026-07-17T10:00:00 | 2026-07-19T05:00:00 | 0.5      |
      | martes, jueves | 2026-07-13T08:00:00 | 2026-07-14T10:00:00 | 2026-07-14T10:00:00 | 0        |

  # Complete calendar recurring task 4
  # With an earlier completion, P is what that completion covered.
  # Row 1: normal sequence. Row 2: completing twice on Tuesday covers
  # Thursday (there are no uncovered occurrences in (P, today], it covers N). Row 3:
  # completing twice on Monday covers Tuesday and then Thursday (row
  # "lunes, otra vez el lunes" of the spec). Row 4: Thursday and Tuesday were missed;
  # it covers Tuesday. Row 5: completed on Monday (covers Tuesday) and again on
  # Tuesday: it covers Thursday.
  Scenario Outline: Complete calendar recurring task 4
    Given a weekly recurring task on <days> created on <created>
    And the task was completed on <previous>
    When I complete the task on <new>
    Then a completion was recorded that covers <covered>
    And the new completion is added without changing the previous ones

    Examples:
      | days           | created             | previous            | new                 | covered    |
      | martes, jueves | 2026-07-13T08:00:00 | 2026-07-14T08:00:00 | 2026-07-16T09:00:00 | 2026-07-16 |
      | martes, jueves | 2026-07-13T08:00:00 | 2026-07-14T08:00:00 | 2026-07-14T20:00:00 | 2026-07-16 |
      | martes, jueves | 2026-07-13T08:00:00 | 2026-07-13T09:00:00 | 2026-07-13T20:00:00 | 2026-07-16 |
      | martes, jueves | 2026-07-13T08:00:00 | 2026-07-14T08:00:00 | 2026-07-22T09:00:00 | 2026-07-21 |
      | martes, jueves | 2026-07-13T08:00:00 | 2026-07-13T09:00:00 | 2026-07-14T09:00:00 | 2026-07-16 |

  # Complete calendar recurring task 5
  # Monthly: which occurrence the first completion covers, including days that
  # do not exist in a shorter month (they fall on the last day of that month).
  Scenario Outline: Complete calendar recurring task 5
    Given a monthly recurring task on days <days> created on <created>
    When I complete the task on <completed>
    Then a completion was recorded that covers <covered>

    Examples:
      | days   | created             | completed           | covered    |
      | 15     | 2026-07-01T08:00:00 | 2026-07-15T10:00:00 | 2026-07-15 |
      | 15     | 2026-07-01T08:00:00 | 2026-07-10T10:00:00 | 2026-07-15 |
      | 1, 15  | 2026-07-02T08:00:00 | 2026-07-20T10:00:00 | 2026-07-15 |
      | 1, 15  | 2026-06-02T08:00:00 | 2026-07-10T10:00:00 | 2026-07-01 |
      | 31     | 2026-06-01T08:00:00 | 2026-06-30T10:00:00 | 2026-06-30 |
      | 31     | 2026-06-01T08:00:00 | 2026-06-20T10:00:00 | 2026-06-30 |
      | 31     | 2026-06-01T08:00:00 | 2026-07-01T10:00:00 | 2026-06-30 |
      | 30, 31 | 2026-06-01T08:00:00 | 2026-06-30T10:00:00 | 2026-06-30 |
      | 31     | 2026-02-01T08:00:00 | 2026-02-28T10:00:00 | 2026-02-28 |
      | 29     | 2026-02-01T08:00:00 | 2026-02-20T10:00:00 | 2026-02-28 |
      | 29     | 2028-02-01T08:00:00 | 2028-02-29T10:00:00 | 2028-02-29 |
      | 31     | 2026-07-01T08:00:00 | 2026-08-02T10:00:00 | 2026-07-31 |

  # Complete calendar recurring task 6
  # Monthly: after completing, it goes back to pending on the day of the next
  # uncovered occurrence.
  Scenario Outline: Complete calendar recurring task 6
    Given a monthly recurring task on days <days> created on <created>
    When I complete the task on <completed>
    And I query the status on <returns>
    Then the status is pendiente

    Examples:
      | days   | created             | completed           | returns             |
      | 15     | 2026-07-01T08:00:00 | 2026-07-15T10:00:00 | 2026-08-15T00:00:00 |
      | 15     | 2026-07-01T08:00:00 | 2026-07-10T10:00:00 | 2026-08-15T00:00:00 |
      | 1, 15  | 2026-07-02T08:00:00 | 2026-07-20T10:00:00 | 2026-08-01T00:00:00 |
      | 31     | 2026-06-01T08:00:00 | 2026-06-30T10:00:00 | 2026-07-31T00:00:00 |
      | 30, 31 | 2026-06-01T08:00:00 | 2026-06-30T10:00:00 | 2026-07-30T00:00:00 |
      | 31     | 2026-02-01T08:00:00 | 2026-02-28T10:00:00 | 2026-03-31T00:00:00 |
      | 29     | 2028-02-01T08:00:00 | 2028-02-29T10:00:00 | 2028-03-29T00:00:00 |
      | 31     | 2026-07-01T08:00:00 | 2026-08-02T10:00:00 | 2026-08-31T00:00:00 |

  # Complete calendar recurring task 7
  # With an earlier completion, it goes back to pending on the day of the first
  # uncovered occurrence. Rows 2 and 3: completing twice on Monday or twice
  # on Tuesday covers Tuesday and Thursday; it comes back the following Tuesday.
  Scenario Outline: Complete calendar recurring task 7
    Given a weekly recurring task on <days> created on <created>
    And the task was completed on <previous>
    When I complete the task on <new>
    And I query the status on <returns>
    Then the status is pendiente

    Examples:
      | days           | created             | previous            | new                 | returns             |
      | martes, jueves | 2026-07-13T08:00:00 | 2026-07-14T08:00:00 | 2026-07-16T09:00:00 | 2026-07-21T00:00:00 |
      | martes, jueves | 2026-07-13T08:00:00 | 2026-07-13T09:00:00 | 2026-07-13T20:00:00 | 2026-07-21T00:00:00 |
      | martes, jueves | 2026-07-13T08:00:00 | 2026-07-14T08:00:00 | 2026-07-14T20:00:00 | 2026-07-21T00:00:00 |
      | martes, jueves | 2026-07-13T08:00:00 | 2026-07-14T08:00:00 | 2026-07-22T09:00:00 | 2026-07-23T00:00:00 |
