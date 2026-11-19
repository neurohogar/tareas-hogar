# mutation-stamp: sha256=cba5815b82d649d20918cecb5629283aa2679483569dc8c329b13771e6329a28
# acceptance-mutation-manifest-begin
# {"version":1,"tested_at":"2026-11-16T02:03:20.358283691Z","feature_name":"Última vez","feature_path":"features/ultima-vez.feature","background_hash":"74234e98afe7498fb5daf1f36ac2d78acc339464f950703b8c019892f982b90b","implementation_hash":"sha256:02a3d3223aefeb3a9ec5296110e3343ae9a64a9d336e79b488b7ec16cbaddaac","scenarios":[{"index":0,"name":"Última vez 1","scenario_hash":"4657ef499925ee236cca9d228ca1ce3ba3c95b67690e43c59841eb86de98e202","mutation_count":26,"result":{"Total":26,"Killed":26,"Survived":0,"Errors":0},"tested_at":"2026-11-16T02:03:20.358283691Z"},{"index":1,"name":"Última vez 2","scenario_hash":"4a43a216c4fbe8507232a78621c1334ff4a2cb26782e0e0ff7733d78205dfc27","mutation_count":26,"result":{"Total":26,"Killed":26,"Survived":0,"Errors":0},"tested_at":"2026-11-16T02:03:20.358283691Z"},{"index":2,"name":"Última vez 3","scenario_hash":"6ad50497f05a2ee92ddb50533774a55cf0bf8897e08656239c8e5d2711155ed1","mutation_count":29,"result":{"Total":29,"Killed":29,"Survived":0,"Errors":0},"tested_at":"2026-11-16T02:03:20.358283691Z"},{"index":3,"name":"Última vez 4","scenario_hash":"8d1967ae0f160743b7610d339e534f49f77c627cf928ea4a908910c17162ef81","mutation_count":16,"result":{"Total":16,"Killed":16,"Survived":0,"Errors":0},"tested_at":"2026-11-16T02:03:20.358283691Z"},{"index":4,"name":"Última vez 5","scenario_hash":"939c0d9a09f243169a61a5ec8ca4f0b1f076253d980cc0cc3390887e962622c4","mutation_count":1,"result":{"Total":1,"Killed":1,"Survived":0,"Errors":0},"tested_at":"2026-11-16T02:03:20.358283691Z"},{"index":5,"name":"Última vez 6","scenario_hash":"b2a4071cecac81ca4fb3e12b301b4626e102e8021ede8e5bc383fd1501116b7d","mutation_count":13,"result":{"Total":13,"Killed":13,"Survived":0,"Errors":0},"tested_at":"2026-11-16T02:03:20.358283691Z"},{"index":6,"name":"Última vez 7","scenario_hash":"7b27a1330826ce05ad5ea203c8219afb68eec421eb1a0e4045fc59c429700066","mutation_count":6,"result":{"Total":6,"Killed":6,"Survived":0,"Errors":0},"tested_at":"2026-11-16T02:03:20.358283691Z"},{"index":7,"name":"Última vez 8","scenario_hash":"5a431080b49ffdd8159239e31727d9aacc7f7e3936a0cb30f062d336c3d67112","mutation_count":1,"result":{"Total":1,"Killed":1,"Survived":0,"Errors":0},"tested_at":"2026-11-16T02:03:20.358283691Z"},{"index":8,"name":"Última vez 9","scenario_hash":"2215fc04186b2dbf6e5c29795b6e2601f921b977234b76aef9eb79b952a9a77e","mutation_count":7,"result":{"Total":7,"Killed":7,"Survived":0,"Errors":0},"tested_at":"2026-11-16T02:03:20.358283691Z"},{"index":9,"name":"Última vez 10","scenario_hash":"a21acdef3cb4c9d8578f39e7c7d5f9bb3e3d738b71cb19a8680371a8395ca932","mutation_count":6,"result":{"Total":6,"Killed":6,"Survived":0,"Errors":0},"tested_at":"2026-11-16T02:03:20.358283691Z"}]}
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
