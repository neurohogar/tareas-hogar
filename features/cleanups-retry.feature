# mutation-stamp: sha256=a4de564fd1b47360b08592726e1fa792fe0554da883c335a385c416b05a16f4d
# acceptance-mutation-manifest-begin
# {"version":1,"tested_at":"2026-11-20T21:31:02.340160907Z","feature_name":"Cleanups retry","feature_path":"features/cleanups-retry.feature","background_hash":"74234e98afe7498fb5daf1f36ac2d78acc339464f950703b8c019892f982b90b","implementation_hash":"sha256:d7ea7e04a0849fe069d7672920ca11c7c72045409b151c53af8cfbe99b029add","scenarios":[{"index":0,"name":"Cleanups retry 1","scenario_hash":"71caa91e5651e5c088b31dd4539c55449cbb250cc614780ec49c6190baddb460","mutation_count":11,"result":{"Total":11,"Killed":11,"Survived":0,"Errors":0},"tested_at":"2026-11-20T21:31:02.340160907Z"},{"index":1,"name":"Cleanups retry 2","scenario_hash":"674a58d1e4bbd2887d9d740cd1d9093d4005f0c5ac069e504927f69064d966f2","mutation_count":2,"result":{"Total":2,"Killed":2,"Survived":0,"Errors":0},"tested_at":"2026-11-20T21:31:02.340160907Z"},{"index":2,"name":"Cleanups retry 3","scenario_hash":"e8d626e5ecc85de539038031e23a3a57409424f17a06aaeb5171e96fe4e49095","mutation_count":6,"result":{"Total":6,"Killed":6,"Survived":0,"Errors":0},"tested_at":"2026-11-20T21:31:02.340160907Z"}]}
# acceptance-mutation-manifest-end

# Spec §7 (Cleanups and retries). The cleanup of orphan completions is retried
# if an attempt fails or there is no connection. It is retried when the connection
# comes back and when the data changes, without timers. Each item is attempted
# separately: one failing (or there being no connection) does not prevent
# attempting the others in the batch.
# The items to clean are named with a short id (a1, a2, a3); "ninguno"
# is the empty list; lists are separated by ", ". "there is no connection" means that
# all the attempts fail.
# The silent retries (without a notice, counter or pending indicator, §7) are
# verified in the QA suite (qa/retry-and-copy-notice.md), together with the
# stored data that is no longer used (§7): QA-only S15, S17.
Feature: Cleanups retry

  # Cleanups retry 1
  # Each item is attempted separately: the ones that fail do not prevent cleaning the
  # others, and only the ones that failed remain to be cleaned. It also applies
  # offline (all of them fail).
  Scenario Outline: Cleanups retry 1
    Given <items> of orphan completions are left to clean
    And the attempt to clean fails: <failing>
    When the app attempts the cleanups
    Then the items left clean are <clean>
    And the items left to clean are <pending>

    Examples:
      | items          | failing        | clean          | pending        |
      | a1, a2, a3     | a2             | a1, a3         | a2             |
      | a1, a2, a3     | a1, a2, a3     | ninguno        | a1, a2, a3     |
      | a1, a2, a3     | ninguno        | a1, a2, a3     | ninguno        |

  # Cleanups retry 2
  # What was left uncleaned is retried when the connection comes back and when
  # the data changes; retrying does not lose what was already cleaned.
  Scenario Outline: Cleanups retry 2
    Given <items> of orphan completions are left to clean
    And the attempt to clean fails: <failing>
    And the app attempted the cleanups
    And the attempt to clean stops failing: <failing>
    When this happens: <event>
    Then the items left clean are <items>
    And the items left to clean are none

    Examples:
      | items      | failing | event              |
      | a1, a2, a3 | a2      | vuelve la conexión |
      | a1, a2, a3 | a2      | cambian los datos  |

  # Cleanups retry 3
  # Without timers: no matter how much time passes, without a new connection or a
  # data change there is no retry.
  Scenario Outline: Cleanups retry 3
    Given <items> of orphan completions are left to clean
    And the attempt to clean fails: <failing>
    And the app attempted the cleanups
    And the attempt to clean stops failing: <failing>
    When <minutes> minutes pass with nothing else happening
    Then the items left clean are <clean>
    And the items left to clean are <failing>

    Examples:
      | items      | failing | clean  | minutes |
      | a1, a2, a3 | a2      | a1, a3 | 5       |
      | a1, a2, a3 | a2      | a1, a3 | 60      |
