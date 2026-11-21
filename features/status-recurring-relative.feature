# mutation-stamp: sha256=548d2de3ad45b109707417c9d9ef28c2e1aed9f0699c7607c5a444202b28433f
# acceptance-mutation-manifest-begin
# {"version":1,"tested_at":"2026-11-19T12:33:10.349518424Z","feature_name":"Relative recurring task status","feature_path":"features/status-recurring-relative.feature","background_hash":"74234e98afe7498fb5daf1f36ac2d78acc339464f950703b8c019892f982b90b","implementation_hash":"sha256:ecc8f79c93cb3ff86354c454d3058d6f2065463bbc3d025ae53b8e7f0ab42935","scenarios":[{"index":1,"name":"Relative recurring task status 2","scenario_hash":"be006cc26bfb5e8a3b41f02f270e8dda17db1522464a000e253c98930b12d1ad","mutation_count":55,"result":{"Total":55,"Killed":55,"Survived":0,"Errors":0},"tested_at":"2026-11-19T12:33:10.349518424Z"},{"index":2,"name":"Relative recurring task status 3","scenario_hash":"a09b2be524cbf398262dca1f75b9f40db082797ea79239abd0e5ff606412b01e","mutation_count":12,"result":{"Total":12,"Killed":12,"Survived":0,"Errors":0},"tested_at":"2026-11-19T12:33:10.349518424Z"},{"index":3,"name":"Relative recurring task status 4","scenario_hash":"b7f8cf2f054c5a86505de6d256e66ed9996cd90701953acd624221d7c5eacc0b","mutation_count":35,"result":{"Total":35,"Killed":35,"Survived":0,"Errors":0},"tested_at":"2026-11-19T12:33:10.349518424Z"},{"index":4,"name":"Relative recurring task status 5","scenario_hash":"f31bfe57e0b491fccba7e2bf0fc8eaf94238faac2199e5ff32d4f6ff7e4533aa","mutation_count":19,"result":{"Total":19,"Killed":19,"Survived":0,"Errors":0},"tested_at":"2026-11-19T12:33:10.349518424Z"},{"index":5,"name":"Relative recurring task status 6","scenario_hash":"db8f8ad796e01560d128ab11066acda4b9a50eae71d2507fcc23d776aade6360","mutation_count":22,"result":{"Total":22,"Killed":22,"Survived":0,"Errors":0},"tested_at":"2026-11-19T12:33:10.349518424Z"},{"index":6,"name":"Relative recurring task status 7","scenario_hash":"b74a867090aed25e104d6ad593475ac4e86dcd3f70ea1c4b6e18733cfcd1f34a","mutation_count":7,"result":{"Total":7,"Killed":7,"Survived":0,"Errors":0},"tested_at":"2026-11-19T12:33:10.349518424Z"}]}
# acceptance-mutation-manifest-end

# Spec §5.2. Derived status of a recurring task in relative mode.
# U = most recent completedAt; V = U + interval (expiry).
# Times in the device's local time zone; "every N days" equals N × 24 hours.
# Progress is a fraction between 0 and 1: (now − U) / interval, compared
# exactly (only floating-point error is tolerated).
Feature: Relative recurring task status

  # Relative recurring task status 1
  # Never completed: pendiente, regardless of the interval or the moment.
  Scenario: Relative recurring task status 1
    Given a relative recurring task never completed
    When I query the status at any moment
    Then the status is pendiente

  # Relative recurring task status 2
  # now < V: en espera, with progress (now − U) / interval.
  Scenario Outline: Relative recurring task status 2
    Given a relative recurring task every <every> <unit>
    And the task was completed on <completed>
    When I query the status on <now>
    Then the status is en espera
    And the progress is <progress>

    Examples:
      | every | unit   | completed           | now                 | progress |
      | 4    | horas  | 2026-07-15T08:00:00 | 2026-07-15T09:00:00 | 0.25     |
      | 8    | horas  | 2026-07-31T22:00:00 | 2026-08-01T04:00:00 | 0.75     |
      | 1    | dias   | 2026-07-15T08:00:00 | 2026-07-15T14:00:00 | 0.25     |
      | 2    | dias   | 2026-07-15T08:00:00 | 2026-07-16T08:00:00 | 0.5      |
      | 4    | dias   | 2026-07-15T08:00:00 | 2026-07-18T08:00:00 | 0.75     |

  # Relative recurring task status 3
  # One second before the expiry it is still en espera.
  Scenario Outline: Relative recurring task status 3
    Given a relative recurring task every <every> <unit>
    And the task was completed on <completed>
    When I query the status on <now>
    Then the status is en espera

    Examples:
      | every | unit   | completed           | now                 |
      | 4    | horas  | 2026-07-15T08:00:00 | 2026-07-15T11:59:59 |
      | 3    | dias   | 2026-07-15T08:00:00 | 2026-07-18T07:59:59 |

  # Relative recurring task status 4
  # V ≤ now < V + interval: pendiente.
  Scenario Outline: Relative recurring task status 4
    Given a relative recurring task every <every> <unit>
    And the task was completed on <completed>
    When I query the status on <now>
    Then the status is pendiente

    Examples:
      | every | unit   | completed           | now                 |
      | 4    | horas  | 2026-07-15T08:00:00 | 2026-07-15T12:00:00 |
      | 4    | horas  | 2026-07-15T08:00:00 | 2026-07-15T15:59:59 |
      | 3    | dias   | 2026-07-15T08:00:00 | 2026-07-18T08:00:00 |
      | 3    | dias   | 2026-07-15T08:00:00 | 2026-07-21T07:59:59 |
      | 1    | dias   | 2026-07-31T20:00:00 | 2026-08-01T20:00:00 |

  # Relative recurring task status 5
  # now ≥ V + interval (a full cycle was missed): atrasada.
  Scenario Outline: Relative recurring task status 5
    Given a relative recurring task every <every> <unit>
    And the task was completed on <completed>
    When I query the status on <now>
    Then the status is atrasada

    Examples:
      | every | unit   | completed           | now                 |
      | 4    | horas  | 2026-07-15T08:00:00 | 2026-07-15T16:00:00 |
      | 12   | horas  | 2026-12-31T20:00:00 | 2027-01-01T20:00:00 |
      | 3    | dias   | 2026-07-15T08:00:00 | 2026-07-21T08:00:00 |
      | 1    | dias   | 2026-07-15T08:00:00 | 2026-09-01T08:00:00 |

  # Relative recurring task status 6
  # With several completions, U is the most recent, regardless of the recording order.
  # With only the earlier one, the task would be atrasada.
  Scenario Outline: Relative recurring task status 6
    Given a relative recurring task every <every> <unit>
    And the task was completed on <recent>
    And the task was completed on <previous>
    When I query the status on <now>
    Then the status is en espera
    And the progress is <progress>

    Examples:
      | every | unit   | recent              | previous            | now                 | progress |
      | 4    | horas  | 2026-07-15T08:00:00 | 2026-07-14T08:00:00 | 2026-07-15T10:00:00 | 0.5      |
      | 2    | dias   | 2026-07-20T08:00:00 | 2026-07-10T08:00:00 | 2026-07-20T20:00:00 | 0.25     |

  # Relative recurring task status 7
  # now < U (skewed clocks: a completion "from the future" was synced):
  # en espera with progress 0 until now reaches U.
  Scenario Outline: Relative recurring task status 7
    Given a relative recurring task every <every> <unit>
    And the task was completed on <completed>
    When I query the status on <now>
    Then the status is en espera
    And the progress is <progress>

    Examples:
      | every | unit   | completed           | now                 | progress |
      | 4    | horas  | 2026-07-15T08:00:00 | 2026-07-15T07:00:00 | 0        |
      | 2    | dias   | 2026-07-31T22:00:00 | 2026-07-30T10:00:00 | 0        |
