# mutation-stamp: sha256=fba917f20a69a5ea4e7924d0bf07d537bdb3236bf6ce6eaa3584679a06a8549d
# acceptance-mutation-manifest-begin
# {"version":1,"tested_at":"2026-11-16T01:43:04.266232744Z","feature_name":"Completar periódica de calendario","feature_path":"features/completar-periodica-calendario.feature","background_hash":"74234e98afe7498fb5daf1f36ac2d78acc339464f950703b8c019892f982b90b","implementation_hash":"sha256:bd150cab555b7a42e904581409f7b450d8aef184152d91f2c9e55ac85c93c8aa","scenarios":[{"index":0,"name":"Completar periódica de calendario 1","scenario_hash":"eb5ba7b75efd92e9aaca106b48bf8a63ad92d0bafe53516b56a3c3ac5b9297e3","mutation_count":30,"result":{"Total":30,"Killed":30,"Survived":0,"Errors":0},"tested_at":"2026-11-16T01:43:04.266232744Z"},{"index":1,"name":"Completar periódica de calendario 2","scenario_hash":"394d5fc5953b6688f8d26a91a10a185b09fd2e0d47d0547732d9f74f6b2a9a02","mutation_count":38,"result":{"Total":38,"Killed":38,"Survived":0,"Errors":0},"tested_at":"2026-11-16T01:43:04.266232744Z"},{"index":2,"name":"Completar periódica de calendario 3","scenario_hash":"d19620968a93e56f3a0bc131a8573de82f24d337128a21fa0d96fbba00d8dbc2","mutation_count":46,"result":{"Total":46,"Killed":46,"Survived":0,"Errors":0},"tested_at":"2026-11-16T01:43:04.266232744Z"},{"index":3,"name":"Completar periódica de calendario 4","scenario_hash":"b9542ac7c1c0402aa1137414edd2c172dd1baac6bad8ab6dda8c1d08243336f9","mutation_count":16,"result":{"Total":16,"Killed":16,"Survived":0,"Errors":0},"tested_at":"2026-11-16T01:43:04.266232744Z"},{"index":4,"name":"Completar periódica de calendario 5","scenario_hash":"d5bf67005a1dafbb052d7e3f26697ba95c68dc026c1aa28c04456c9a23b29e63","mutation_count":36,"result":{"Total":36,"Killed":36,"Survived":0,"Errors":0},"tested_at":"2026-11-16T01:43:04.266232744Z"},{"index":5,"name":"Completar periódica de calendario 6","scenario_hash":"b6996731b4a8b18a6fa1646098c39d6ca7460c5e48888106e7d76244b9cebcd8","mutation_count":32,"result":{"Total":32,"Killed":32,"Survived":0,"Errors":0},"tested_at":"2026-11-16T01:43:04.266232744Z"},{"index":6,"name":"Completar periódica de calendario 7","scenario_hash":"418d308cd8bc20525253f1455d3f919e625b60801293310fbd16795531d9105d","mutation_count":17,"result":{"Total":17,"Killed":17,"Survived":0,"Errors":0},"tested_at":"2026-11-16T01:43:04.266232744Z"}]}
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
