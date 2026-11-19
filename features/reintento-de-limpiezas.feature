# mutation-stamp: sha256=3503840823aa8a53f4018e16192b4f9cd9050ff9abea2060ad053e152106a4e5
# acceptance-mutation-manifest-begin
# {"version":1,"tested_at":"2026-11-19T12:56:02.164210362Z","feature_name":"Cleanups retry","feature_path":"features/reintento-de-limpiezas.feature","background_hash":"74234e98afe7498fb5daf1f36ac2d78acc339464f950703b8c019892f982b90b","implementation_hash":"sha256:d7ea7e04a0849fe069d7672920ca11c7c72045409b151c53af8cfbe99b029add","scenarios":[{"index":0,"name":"Cleanups retry 1","scenario_hash":"6d057d0c66949d551d6019358ae69d6341c6e0a4b7aa959e01473976394b2814","mutation_count":19,"result":{"Total":19,"Killed":19,"Survived":0,"Errors":0},"tested_at":"2026-11-19T12:56:02.164210362Z"},{"index":1,"name":"Cleanups retry 2","scenario_hash":"8700a63fd8440a68dc2acbcc3a0a50ab27cf822aced8000d28fa02884be275ee","mutation_count":4,"result":{"Total":4,"Killed":4,"Survived":0,"Errors":0},"tested_at":"2026-11-19T12:56:02.164210362Z"},{"index":2,"name":"Cleanups retry 3","scenario_hash":"92b38e6232a406f8e80664db7943abe44b52a1b08a1752a044274660512510e6","mutation_count":8,"result":{"Total":8,"Killed":8,"Survived":0,"Errors":0},"tested_at":"2026-11-19T12:56:02.164210362Z"}]}
# acceptance-mutation-manifest-end

# Spec §7 (Cleanups and retries). The two cleanups (orphan completions
# and orphan annotations) are retried if an attempt fails or there is no connection.
# They are retried when the connection comes back and when the data changes, without
# timers. Each item is attempted separately: one failing (or there being no
# connection) does not prevent attempting the others in the batch.
# The items to clean are named with a short id (a1, a2, a3); "ninguno"
# is the empty list; lists are separated by ", ". "there is no connection" means that
# all the attempts fail.
# The silent retries (without a notice, counter or pending indicator,
# §7) and the «No se pudo copiar» notice of Copiar (§6.7) are verified in the QA
# suite (qa/reintento-y-aviso-de-copia.md): QA-only S4, S5, S6, S7.
Feature: Cleanups retry

  # Cleanups retry 1
  # Each item is attempted separately: the ones that fail do not prevent cleaning the
  # others, and only the ones that failed remain to be cleaned. It applies to both
  # cleanups, also offline (all of them fail).
  Scenario Outline: Cleanups retry 1
    Given <items> of <cleanup> are left to clean
    And the attempt to clean fails: <failing>
    When the app attempts the cleanups
    Then the items left clean are <clean>
    And the items left to clean are <pending>

    Examples:
      | cleanup                           | items          | failing        | clean          | pending        |
      | completados huérfanos             | a1, a2, a3     | a2             | a1, a3         | a2             |
      | anotaciones huérfanas             | a1, a2, a3     | a1             | a2, a3         | a1             |
      | anotaciones huérfanas             | a1, a2, a3     | a1, a2, a3     | ninguno        | a1, a2, a3     |
      | completados huérfanos             | a1, a2, a3     | ninguno        | a1, a2, a3     | ninguno        |

  # Cleanups retry 2
  # What was left uncleaned is retried when the connection comes back and when
  # the data changes; retrying does not lose what was already cleaned.
  Scenario Outline: Cleanups retry 2
    Given <items> of <cleanup> are left to clean
    And the attempt to clean fails: <failing>
    And the app attempted the cleanups
    And the attempt to clean stops failing: <failing>
    When this happens: <event>
    Then the items left clean are <items>
    And the items left to clean are none

    Examples:
      | cleanup                          | items      | failing | event              |
      | completados huérfanos            | a1, a2, a3 | a2     | vuelve la conexión |
      | anotaciones huérfanas            | a1, a2, a3 | a2     | cambian los datos  |

  # Cleanups retry 3
  # Without timers: no matter how much time passes, without a new connection or a
  # data change there is no retry.
  Scenario Outline: Cleanups retry 3
    Given <items> of <cleanup> are left to clean
    And the attempt to clean fails: <failing>
    And the app attempted the cleanups
    And the attempt to clean stops failing: <failing>
    When <minutes> minutes pass with nothing else happening
    Then the items left clean are <clean>
    And the items left to clean are <failing>

    Examples:
      | cleanup               | items      | failing | clean   | minutes |
      | anotaciones huérfanas | a1, a2, a3 | a2     | a1, a3  | 5       |
      | completados huérfanos | a1, a2, a3 | a2     | a1, a3  | 60      |
