# mutation-stamp: sha256=ab56a2d1a57b72a8aec21e8e7e09fee3ae491dd7a5b3c51e03da721dae8017fc
# acceptance-mutation-manifest-begin
# {"version":1,"tested_at":"2026-11-22T21:41:21.961532475Z","feature_name":"Minimal mode loading","feature_path":"features/minimal-mode-loading.feature","background_hash":"74234e98afe7498fb5daf1f36ac2d78acc339464f950703b8c019892f982b90b","implementation_hash":"sha256:f514122f208a1b49f4f2f930376426369593c40644433db00f7bfd59a42c3413","scenarios":[{"index":0,"name":"Minimal mode loading 1","scenario_hash":"847aa5456f11245ea0ef41de4750fbbf58b9e4f8a8fcd2f5ec530e175867fdbd","mutation_count":12,"result":{"Total":12,"Killed":12,"Survived":0,"Errors":0},"tested_at":"2026-11-22T20:34:23.434971403Z"},{"index":1,"name":"Minimal mode loading 2","scenario_hash":"0ad0562b525fb0b3fc4e89a78048fd1bc8be75f8890691ed14ba3041b9e29e2d","mutation_count":3,"result":{"Total":3,"Killed":3,"Survived":0,"Errors":0},"tested_at":"2026-11-22T20:34:23.434971403Z"}]}
# acceptance-mutation-manifest-end

# Spec §6.6 (Loading screen, What it waits for with a session) and §7 (Minimal mode).
# With a session, the loading screen also waits for the first response of the state of
# the minimal mode (from the local cache or from the network), so that the list never
# shows for an instant the tasks that the mode leaves out. Without a session it does not
# wait for it. The cap of 10 s applies to it like to the tasks and the completions. Times
# count in seconds since the app starts.
# "the minimal mode responds at S seconds" gives when the first response of the mode
# arrives; a value of 30 seconds is something that does not arrive before the cap. The
# scenarios of Loading screen that do not mention it have the mode respond immediately.
Feature: Minimal mode loading

  # Minimal mode loading 1
  # With a session it waits for the mode: row 1 is ready first (the minimum 0.5 s holds);
  # row 2 and 3 are the slowest thing; row 4 never arrives and the cap of 10 s releases it.
  Scenario Outline: Minimal mode loading 1
    Given the app starts with a session
    And Auth responds immediately
    And the tasks respond at <tasks> seconds
    And the completions respond at <completions> seconds
    And the minimal mode responds at <mode> seconds
    And Atkinson is ready at <atkinson> seconds
    And Noto is ready at <noto> seconds
    Then the loading screen goes away at <exit> seconds

    Examples:
      | tasks | completions | mode | atkinson | noto | exit |
      | 0.2   | 0.2         | 0.2  | 0.2      | 0.2  | 0.5  |
      | 0.2   | 0.2         | 3    | 0.2      | 0.2  | 3    |
      | 0.2   | 0.2         | 0.9  | 0.2      | 0.2  | 0.9  |
      | 0.2   | 0.2         | 30   | 0.2      | 0.2  | 10   |

  # Minimal mode loading 2
  # Without a session it does not wait for the mode.
  Scenario Outline: Minimal mode loading 2
    Given the app starts without a session
    And Auth responds at <auth> seconds
    And the minimal mode responds at <mode> seconds
    And Atkinson is ready at <atkinson> seconds
    And Noto is ready at <noto> seconds
    Then the loading screen goes away at <exit> seconds

    Examples:
      | auth | mode | atkinson | noto | exit |
      | 0.1  | 30   | 0.2      | 30   | 0.5  |
