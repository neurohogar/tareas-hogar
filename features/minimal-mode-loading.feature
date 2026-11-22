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
