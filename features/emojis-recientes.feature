# mutation-stamp: sha256=cae7085dade1ea7977b647ae76e4efc7cc414a93e55eee715678650b143eda71
# acceptance-mutation-manifest-begin
# {"version":1,"tested_at":"2026-11-04T12:22:20.977736860Z","feature_name":"Emojis recientes","feature_path":"features/emojis-recientes.feature","background_hash":"74234e98afe7498fb5daf1f36ac2d78acc339464f950703b8c019892f982b90b","implementation_hash":"sha256:369b8a6ef7cf8addd8cc404b4cc295b7374c5593cefc1b8c2c8ca663d1aa6217","scenarios":[{"index":0,"name":"Emojis recientes 1","scenario_hash":"fa2a3fd452ef1a2f135f9dcd0ca5e71b4c3eb80a2f05e15a9b71ad49228e2b70","mutation_count":2,"result":{"Total":2,"Killed":2,"Survived":0,"Errors":0},"tested_at":"2026-11-04T12:22:20.977736860Z"},{"index":1,"name":"Emojis recientes 2","scenario_hash":"380d186c75ebf200660eca7e2d8e9445aeedc59573afed2c2dd40d6d031615f9","mutation_count":3,"result":{"Total":3,"Killed":3,"Survived":0,"Errors":0},"tested_at":"2026-11-04T12:22:20.977736860Z"},{"index":2,"name":"Emojis recientes 3","scenario_hash":"12714c7bc9864accface0c5e6e3d0246962781a4ff9f19cdc77e86c7a4f3d9f6","mutation_count":6,"result":{"Total":6,"Killed":6,"Survived":0,"Errors":0},"tested_at":"2026-11-04T12:22:20.977736860Z"},{"index":3,"name":"Emojis recientes 4","scenario_hash":"676e796e33dc86eb39c255a7bf050ab26889362e595fe7f7812f19ad8148dcc3","mutation_count":2,"result":{"Total":2,"Killed":2,"Survived":0,"Errors":0},"tested_at":"2026-11-04T12:22:20.977736860Z"},{"index":4,"name":"Emojis recientes 5","scenario_hash":"d9d83b4a9a559d23e7698a8e95bc800d66f944eb91149d005427654388b7dd69","mutation_count":2,"result":{"Total":2,"Killed":2,"Survived":0,"Errors":0},"tested_at":"2026-11-04T12:22:20.977736860Z"}]}
# acceptance-mutation-manifest-end

# Spec §6.2 (Emoji, Recientes). The picker's recents go from the most
# recent to the oldest. Choosing an emoji puts it first; if it was already there it is not
# repeated (it moves to the first place); the list keeps at most 16 and, when full,
# discards the oldest.
# "the recent emojis are" gives the list in order, separated by ", ".
Feature: Recent emojis

  # Recent emojis 1
  # Choosing an emoji with no previous recents: it ends up as the only recent.
  Scenario Outline: Recent emojis 1
    Given there are no recent emojis
    When I choose the emoji <emoji>
    Then the recent emojis are <recents_stored>

    Examples:
      | emoji | recents_stored      |
      | 🌱     | 🌱                   |

  # Recent emojis 2
  # The chosen emoji moves to the first place and the previous ones move down.
  Scenario Outline: Recent emojis 2
    Given the recent emojis are <recents>
    When I choose the emoji <emoji>
    Then the recent emojis are <recents_stored>

    Examples:
      | recents  | emoji | recents_stored    |
      | 🔥, 🌱     | 🧹     | 🧹, 🔥, 🌱           |

  # Recent emojis 3
  # Choosing one that was already there: it moves to the first place, without repeating.
  Scenario Outline: Recent emojis 3
    Given the recent emojis are <recents>
    When I choose the emoji <emoji>
    Then the recent emojis are <recents_stored>

    Examples:
      | recents     | emoji | recents_stored    |
      | 🔥, 🌱, 🧹     | 🧹     | 🧹, 🔥, 🌱           |
      | 🔥, 🌱, 🧹     | 🔥     | 🔥, 🌱, 🧹           |

  # Recent emojis 4
  # Up to 16 recents are all kept.
  Scenario Outline: Recent emojis 4
    Given there are <count> recent emojis
    When I choose an emoji that was not among the recent ones
    Then there are <count_stored> recent emojis
    And the first one is the one I chose

    Examples:
      | count    | count_stored      |
      | 15       | 16                |

  # Recent emojis 5
  # With 16 recents, a new one discards the oldest.
  Scenario Outline: Recent emojis 5
    Given there are <count> recent emojis
    When I choose an emoji that was not among the recent ones
    Then there are <count_stored> recent emojis
    And the first one is the one I chose
    And the oldest emoji from before is gone

    Examples:
      | count    | count_stored      |
      | 16       | 16                |
