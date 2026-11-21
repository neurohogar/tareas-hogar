# mutation-stamp: sha256=de11ebef2d27dcfc0e99d30d945416068c2a842f99dd6c4d5d218b50e962dcc0
# acceptance-mutation-manifest-begin
# {"version":1,"tested_at":"2026-11-19T12:22:30.382048212Z","feature_name":"Recent emojis","feature_path":"features/recent-emojis.feature","background_hash":"74234e98afe7498fb5daf1f36ac2d78acc339464f950703b8c019892f982b90b","implementation_hash":"sha256:0cf38dda58201f2765d78fc5c01b369978a2be6ffeb14eb968dd08773d8544fb","scenarios":[{"index":0,"name":"Recent emojis 1","scenario_hash":"22e7f0c498e1dd11f417190ca41e1b9ac2bb31ce766f62bbb704a58eda2daa3e","mutation_count":2,"result":{"Total":2,"Killed":2,"Survived":0,"Errors":0},"tested_at":"2026-11-19T12:22:30.382048212Z"},{"index":1,"name":"Recent emojis 2","scenario_hash":"7f05a4e37654b151e36489690c245414105d8bde2b575e7926756e52828eea2a","mutation_count":3,"result":{"Total":3,"Killed":3,"Survived":0,"Errors":0},"tested_at":"2026-11-19T12:22:30.382048212Z"},{"index":2,"name":"Recent emojis 3","scenario_hash":"fe370b02eee1fd87f7e254eb5311a93c6c76cf6807959d74250481418ea948d4","mutation_count":6,"result":{"Total":6,"Killed":6,"Survived":0,"Errors":0},"tested_at":"2026-11-19T12:22:30.382048212Z"},{"index":3,"name":"Recent emojis 4","scenario_hash":"fca3a6a6b196d88fe23e68865119daef86c5ecf34e6d1b176219e8435edfbe3c","mutation_count":3,"result":{"Total":3,"Killed":3,"Survived":0,"Errors":0},"tested_at":"2026-11-19T12:22:30.382048212Z"},{"index":4,"name":"Recent emojis 5","scenario_hash":"b06f9e31a920213e9c45e3ccd5cb98ffc0415332de6544a3d2bf9afec7a29c9f","mutation_count":3,"result":{"Total":3,"Killed":3,"Survived":0,"Errors":0},"tested_at":"2026-11-19T12:22:30.382048212Z"}]}
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
    And the number of emojis from before that are gone is <gone>

    Examples:
      | count    | count_stored      | gone |
      | 15       | 16                | 0    |

  # Recent emojis 5
  # With 16 recents, a new one discards the oldest.
  Scenario Outline: Recent emojis 5
    Given there are <count> recent emojis
    When I choose an emoji that was not among the recent ones
    Then there are <count_stored> recent emojis
    And the first one is the one I chose
    And the oldest emoji from before is gone
    And the number of emojis from before that are gone is <gone>

    Examples:
      | count    | count_stored      | gone |
      | 16       | 16                | 1    |
