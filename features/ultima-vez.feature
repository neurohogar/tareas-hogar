# mutation-stamp: sha256=d9247e6491fcd659c69aeebeecaffe4c8b743456abb0e9fcfc51f9ab3af28b74
# acceptance-mutation-manifest-begin
# {"version":1,"tested_at":"2026-11-19T13:02:47.165929797Z","feature_name":"Last time","feature_path":"features/ultima-vez.feature","background_hash":"74234e98afe7498fb5daf1f36ac2d78acc339464f950703b8c019892f982b90b","implementation_hash":"sha256:ecde67e66d559e03681b440280bc246d111f366750d94b3e08bedef9e518002c","scenarios":[{"index":0,"name":"Last time 1","scenario_hash":"fb1baa979ce5d6d53620c433bd1e622d2ded524830a4b91fc09ebbead60fd56d","mutation_count":26,"result":{"Total":26,"Killed":26,"Survived":0,"Errors":0},"tested_at":"2026-11-19T13:02:47.165929797Z"},{"index":1,"name":"Last time 2","scenario_hash":"955e6474544c900510a3dbc56829dcacc07ccde9dbcaca0a3ffd97d9d4b92ad7","mutation_count":26,"result":{"Total":26,"Killed":26,"Survived":0,"Errors":0},"tested_at":"2026-11-19T13:02:47.165929797Z"},{"index":2,"name":"Last time 3","scenario_hash":"4fd438a511265e7961065cdf892a299a5401020e97ee4a02000e4b2283539772","mutation_count":29,"result":{"Total":29,"Killed":29,"Survived":0,"Errors":0},"tested_at":"2026-11-19T13:02:47.165929797Z"},{"index":3,"name":"Last time 4","scenario_hash":"f9cc007955f6270f32d67004a95d3448e24bc6e929ffb23617dd632d66831d5c","mutation_count":16,"result":{"Total":16,"Killed":16,"Survived":0,"Errors":0},"tested_at":"2026-11-19T13:02:47.165929797Z"},{"index":4,"name":"Last time 5","scenario_hash":"d9d0c1ad9c7a065ff3c10c0ed56f05a1ea88ef5dbb2a26e1aa337d264681bdcb","mutation_count":1,"result":{"Total":1,"Killed":1,"Survived":0,"Errors":0},"tested_at":"2026-11-19T13:02:47.165929797Z"},{"index":5,"name":"Last time 6","scenario_hash":"31904bbe66c45ece9aaa53eaa501b6255703eb2b8879c5ff0d1c659ef2ed5c6e","mutation_count":13,"result":{"Total":13,"Killed":13,"Survived":0,"Errors":0},"tested_at":"2026-11-19T13:02:47.165929797Z"},{"index":6,"name":"Last time 7","scenario_hash":"894649f15d5f19352bb23c6ab63f3a8fff12c404240f0de6d878550a9110575d","mutation_count":6,"result":{"Total":6,"Killed":6,"Survived":0,"Errors":0},"tested_at":"2026-11-19T13:02:47.165929797Z"},{"index":7,"name":"Last time 8","scenario_hash":"f12d342593341c622045274b318cea7f59b149e261098c73b1fa45bb13e28666","mutation_count":1,"result":{"Total":1,"Killed":1,"Survived":0,"Errors":0},"tested_at":"2026-11-19T13:02:47.165929797Z"},{"index":8,"name":"Last time 9","scenario_hash":"99faac9e5b391e9b52a3deacc0269ddc857526a563a74602909819e11646231f","mutation_count":7,"result":{"Total":7,"Killed":7,"Survived":0,"Errors":0},"tested_at":"2026-11-19T13:02:47.165929797Z"},{"index":9,"name":"Last time 10","scenario_hash":"1e482df916f970697c9027bd279362e05fbbf1c6776825e2d3949aec1629aacf","mutation_count":6,"result":{"Total":6,"Killed":6,"Survived":0,"Errors":0},"tested_at":"2026-11-19T13:02:47.165929797Z"}]}
# acceptance-mutation-manifest-end

# Spec §6.2 (Última vez), with §6.3 (date format of the Historial), §5.2
# (skewed clocks) and §5.4 (deleting completions). When editing a task, the
# panel shows when it was last completed, according to its most recent
# completadoEn (of any kind of task, regardless of the occurrence it covers
# or the order in which the completions were recorded) and the local day (the day
# starts at 00:00):
# - on the day of now (even if later than now): "hoy HH:MM";
# - on the previous day: "ayer HH:MM";
# - N >= 2 days before: "hace N días" (difference in local days, without time);
# - on a day after today: "<día de la semana> <número> de <mes> HH:MM",
#   with " de <año>" after the month if the year is not the current one;
# - without completions: "nunca".
# The time is in 24 h, without seconds. "the last time shows <text>" asserts that
# the panel says "Última vez: <text>".
# Reference week: Monday 2026-07-13 to Sunday 2026-07-19.
Feature: Last time

  # Last time 1
  # Completed on the day of now: "hoy" with the time. Edges at 00:00, time
  # without seconds, and a completion "from the future" of the same day is also "hoy".
  Scenario Outline: Last time 1
    Given a one-off task without a due date
    And the task was completed on <completed>
    When I query the last time on <now>
    Then the last time shows <last_time>

    Examples:
      | completed           | now                 | last_time  |
      | 2026-07-15T08:05:00 | 2026-07-15T12:00:00 | hoy 08:05  |
      | 2026-07-15T00:00:00 | 2026-07-15T23:59:59 | hoy 00:00  |
      | 2026-07-15T23:59:59 | 2026-07-15T23:59:59 | hoy 23:59  |
      | 2026-07-15T13:00:00 | 2026-07-15T12:00:00 | hoy 13:00  |

  # Last time 2
  # Completed on the previous day: "ayer" with the time. Edges at 00:00 and the
  # change of year.
  Scenario Outline: Last time 2
    Given a one-off task without a due date
    And the task was completed on <completed>
    When I query the last time on <now>
    Then the last time shows <last_time>

    Examples:
      | completed           | now                 | last_time  |
      | 2026-07-14T19:30:00 | 2026-07-15T12:00:00 | ayer 19:30 |
      | 2026-07-14T23:59:59 | 2026-07-15T00:00:00 | ayer 23:59 |
      | 2026-07-14T00:00:00 | 2026-07-15T23:59:59 | ayer 00:00 |
      | 2025-12-31T22:00:00 | 2026-01-01T10:00:00 | ayer 22:00 |

  # Last time 3
  # Completed two or more days before: "hace N días", counting local days and
  # not elapsed hours. Edges at 00:00, change of month and of year.
  Scenario Outline: Last time 3
    Given a one-off task without a due date
    And the task was completed on <completed>
    When I query the last time on <now>
    Then the last time shows <last_time>

    Examples:
      | completed           | now                 | last_time    |
      | 2026-07-13T23:59:59 | 2026-07-15T00:00:00 | hace 2 días  |
      | 2026-07-13T00:00:00 | 2026-07-15T23:59:59 | hace 2 días  |
      | 2026-07-05T10:00:00 | 2026-07-15T09:00:00 | hace 10 días |
      | 2026-06-15T08:00:00 | 2026-07-15T07:00:00 | hace 30 días |
      | 2025-12-30T22:00:00 | 2026-01-02T08:00:00 | hace 3 días  |

  # Last time 4
  # A completion "from the future" of another day (skewed clocks) is shown
  # with the date and time, as in the Historial, never as "mañana"; with the
  # year if it is not the current one.
  Scenario Outline: Last time 4
    Given a one-off task without a due date
    And the task was completed on <completed>
    When I query the last time on <now>
    Then the last time shows <last_time>

    Examples:
      | completed           | now                 | last_time                          |
      | 2026-07-16T08:05:00 | 2026-07-15T12:00:00 | jueves 16 de julio 08:05           |
      | 2026-07-16T00:00:00 | 2026-07-15T23:59:59 | jueves 16 de julio 00:00           |
      | 2027-01-01T08:00:00 | 2026-12-31T20:00:00 | viernes 1 de enero de 2027 08:00   |

  # Last time 5
  # Without completions: "nunca".
  Scenario Outline: Last time 5
    Given a one-off task without a due date
    When I query the last time on <now>
    Then the last time shows <last_time>

    Examples:
      | now                 | last_time  |
      | 2026-07-15T12:00:00 | nunca      |

  # Last time 6
  # With several completions (two devices offline) the one with the most recent
  # completadoEn counts, even if it was recorded earlier; row 2: one
  # "from the future" is the most recent.
  Scenario Outline: Last time 6
    Given a one-off task without a due date
    And the task was completed on <recent>
    And the task was completed on <old>
    When I query the last time on <now>
    Then the last time shows <last_time>

    Examples:
      | recent              | old                 | now                 | last_time                |
      | 2026-07-15T09:00:00 | 2026-07-14T10:00:00 | 2026-07-15T12:00:00 | hoy 09:00                |
      | 2026-07-16T09:00:00 | 2026-07-15T10:00:00 | 2026-07-15T12:00:00 | jueves 16 de julio 09:00 |

  # Last time 7
  # Deleting the most recent completion (undo) goes back to the previous one.
  Scenario Outline: Last time 7
    Given a one-off task without a due date
    And the task was completed on <old>
    And the task was completed on <recent>
    When I delete the completion from <recent>
    And I query the last time on <now>
    Then the last time shows <last_time>

    Examples:
      | old                 | recent              | now                 | last_time  |
      | 2026-07-14T10:00:00 | 2026-07-15T09:00:00 | 2026-07-15T12:00:00 | ayer 10:00 |

  # Last time 8
  # Deleting the only completion leaves "nunca".
  Scenario Outline: Last time 8
    Given a one-off task without a due date
    And the task was completed on <completed>
    When I delete the completion from <completed>
    And I query the last time on <now>
    Then the last time shows <last_time>

    Examples:
      | completed           | now                 | last_time  |
      | 2026-07-15T09:00:00 | 2026-07-15T12:00:00 | nunca      |

  # Last time 9
  # On a recurring calendar task the moment of the completion counts, not the
  # occurrence it covers.
  Scenario Outline: Last time 9
    Given a weekly recurring task on <days>
    And the task has a completion from <completed> that covers <covered>
    When I query the last time on <now>
    Then the last time shows <last_time>

    Examples:
      | days   | completed           | covered    | now                 | last_time  |
      | martes | 2026-07-15T08:00:00 | 2026-07-14 | 2026-07-15T12:00:00 | hoy 08:00  |

  # Last time 10
  # Changing the kind of the task keeps its completions and its last time.
  Scenario Outline: Last time 10
    Given a one-off task without a due date
    And the task was completed on <completed>
    When I edit the task to relative recurring every <every> <unit>
    And I query the last time on <now>
    Then the last time shows <last_time>

    Examples:
      | completed           | every | unit   | now                 | last_time   |
      | 2026-07-13T09:00:00 | 4    | horas  | 2026-07-15T12:00:00 | hace 2 días |
