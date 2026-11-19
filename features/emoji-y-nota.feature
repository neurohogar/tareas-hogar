# mutation-stamp: sha256=85aa74a15375d2792feca75cb75d9c6b85c8743cba5c258b5a8e92c1328cab4b
# acceptance-mutation-manifest-begin
# {"version":1,"tested_at":"2026-11-19T12:23:01.428092539Z","feature_name":"Emoji and note","feature_path":"features/emoji-y-nota.feature","background_hash":"74234e98afe7498fb5daf1f36ac2d78acc339464f950703b8c019892f982b90b","implementation_hash":"sha256:d7c0f92289f29701baafbdad1a8bdc492aa5451fbd617b28983b27061d05f894","scenarios":[{"index":0,"name":"Emoji and note 1","scenario_hash":"7748e290f07377d7fb91eb13eb88cf938c26120e36a1537e4c6dbeab9e5f2899","mutation_count":10,"result":{"Total":10,"Killed":10,"Survived":0,"Errors":0},"tested_at":"2026-11-19T12:23:01.428092539Z"},{"index":1,"name":"Emoji and note 2","scenario_hash":"b7fa417396d1f6ac8f7a9c53647403d46f3f7fbe53acc07b6a265a9187ee1555","mutation_count":1,"result":{"Total":1,"Killed":1,"Survived":0,"Errors":0},"tested_at":"2026-11-19T12:23:01.428092539Z"},{"index":2,"name":"Emoji and note 5","scenario_hash":"6a847e2973c938d5d5fd32f58eed090ec0acc30ea1db6abdadfc80a4137e27b5","mutation_count":4,"result":{"Total":4,"Killed":4,"Survived":0,"Errors":0},"tested_at":"2026-11-19T12:23:01.428092539Z"},{"index":3,"name":"Emoji and note 6","scenario_hash":"7ac047359684da06ee528aacb90ac876fd2f2230ef66ffaa66397aedbf2a204c","mutation_count":4,"result":{"Total":4,"Killed":4,"Survived":0,"Errors":0},"tested_at":"2026-11-19T12:23:01.428092539Z"},{"index":5,"name":"Emoji and note 8","scenario_hash":"127fda23e860360ea3f1a7f7225d3dc5c913c910c52ff37c56e233175d0f07e0","mutation_count":2,"result":{"Total":2,"Killed":2,"Survived":0,"Errors":0},"tested_at":"2026-11-19T12:23:01.428092539Z"},{"index":6,"name":"Emoji and note 9","scenario_hash":"95c0ea61dcfdcfade4304b5fdf536ba311d19989505ea00ab11d67f02511572e","mutation_count":6,"result":{"Total":6,"Killed":6,"Survived":0,"Errors":0},"tested_at":"2026-11-19T12:23:01.428092539Z"},{"index":7,"name":"Emoji and note 11","scenario_hash":"de0626a0da35f2c8ce4775f8e12e5738bc022117694e60e6d62e673748244df4","mutation_count":3,"result":{"Total":3,"Killed":3,"Survived":0,"Errors":0},"tested_at":"2026-11-19T12:23:01.428092539Z"},{"index":8,"name":"Emoji and note 12","scenario_hash":"7487f3fa21a29b9ad72676686643d61bca36d171a17ed9ed17a4ffa6e8009bb4","mutation_count":2,"result":{"Total":2,"Killed":2,"Survived":0,"Errors":0},"tested_at":"2026-11-19T12:23:01.428092539Z"},{"index":9,"name":"Emoji and note 13","scenario_hash":"55de6ef8f2e26d344f5d700083b1178f269dd35e37c40a80a4edd75bb7f3c2c0","mutation_count":9,"result":{"Total":9,"Killed":9,"Survived":0,"Errors":0},"tested_at":"2026-11-19T12:23:01.428092539Z"},{"index":10,"name":"Emoji and note 14","scenario_hash":"12bfe700734e79c6edc340df5a5284a76ab7adf0fa509a668b87579f7209bf2c","mutation_count":4,"result":{"Total":4,"Killed":4,"Survived":0,"Errors":0},"tested_at":"2026-11-19T12:23:01.428092539Z"},{"index":11,"name":"Emoji and note 15","scenario_hash":"1f0ad148e12659bce6e24f7c3fc9214fb3c30fe3d88536a3c6a31a85d281e480","mutation_count":2,"result":{"Total":2,"Killed":2,"Survived":0,"Errors":0},"tested_at":"2026-11-19T12:23:01.428092539Z"},{"index":12,"name":"Emoji and note 16","scenario_hash":"169a0831ded45401e5b96af773e4ba2f1e835355c4b4b66a2702a3e6a08a0e0c","mutation_count":4,"result":{"Total":4,"Killed":4,"Survived":0,"Errors":0},"tested_at":"2026-11-19T12:23:01.428092539Z"},{"index":13,"name":"Emoji and note 17","scenario_hash":"c25974116f1d530076123707bc8c526546ea7a61702b0fd3126d62b67a6eb70a","mutation_count":3,"result":{"Total":3,"Killed":3,"Survived":0,"Errors":0},"tested_at":"2026-11-19T12:23:01.428092539Z"}]}
# acceptance-mutation-manifest-end

# Spec §4.1 (emoji and note), §6.2 (Edit) and §7 (Conflicts).
# Emoji: chosen with the picker (§6.2), so the UI never produces an invalid
# value. It is a single emoji grapheme (ZWJ, skin tone, variation
# selector and flags count as one). Removing the emoji leaves the task without
# an emoji. The rule for rejecting an invalid emoji (§4.1) remains in the core as
# validation on save, but it is no longer observable behavior through the UI: it is
# covered by the unit tests, not by these scenarios.
# Note: free text with no maximum length. Leading and trailing spaces and line
# breaks are trimmed; internal line breaks are kept.
# Empty or only spaces means no note. A note is never invalid.
# Name of the task: «emoji title» with an emoji, only the title without an emoji.
# It is the name used by Pendientes, Historial and the undo notice.
# Conflicts: emoji and note are independent fields; the last change wins,
# per field.
Feature: Emoji and note

  # Emoji and note 1
  # A single emoji, of any form, is saved as is.
  Scenario Outline: Emoji and note 1
    Given a one-off task without a due date
    When I choose the emoji <emoji>
    Then the task has emoji <emoji_stored>

    Examples:
      | emoji | emoji_stored   |
      | 🌱     | 🌱              |
      | 👨‍👩‍👧   | 👨‍👩‍👧            |
      | 👍🏽    | 👍🏽             |
      | ❤️    | ❤️             |
      | 🇦🇷    | 🇦🇷             |

  # Emoji and note 2
  # Removing the emoji leaves the task without an emoji.
  Scenario Outline: Emoji and note 2
    Given a one-off task without a due date with emoji <emoji>
    When I remove the emoji
    Then the task has no emoji

    Examples:
      | emoji |
      | 🌱     |

  # Emoji and note 5
  # The note is trimmed at the start and at the end.
  Scenario Outline: Emoji and note 5
    Given a one-off task without a due date
    When I edit the note to <note> with spaces at the start and end
    Then the task has note <note_stored>

    Examples:
      | note                  | note_stored           |
      | Usar guantes          | Usar guantes          |
      | Comprar detergente    | Comprar detergente    |

  # Emoji and note 6
  # Internal line breaks are kept.
  Scenario Outline: Emoji and note 6
    Given a one-off task without a due date
    When I edit the note to <first> and <second> on separate lines
    Then the task note has two lines: <first_stored> and <second_stored>

    Examples:
      | first          | second      | first_stored     | second_stored    |
      | Usar guantes   | Ventilar    | Usar guantes     | Ventilar         |

  # Emoji and note 7
  # A note of only spaces removes the note.
  Scenario Outline: Emoji and note 7
    Given a one-off task without a due date with note <note>
    When I edit the note to one of only spaces
    Then the task has no note

    Examples:
      | note         |
      | Usar guantes |

  # Emoji and note 8
  # The note has no maximum length.
  Scenario Outline: Emoji and note 8
    Given a one-off task without a due date
    When I edit the note to one of <length> characters
    Then the task has a note of <length_stored> characters

    Examples:
      | length | length_stored  |
      | 5000  | 5000           |

  # Emoji and note 9
  # Creating with emoji and note: they are saved with the task.
  Scenario Outline: Emoji and note 9
    When I create a one-off task with title <title>, emoji <emoji> and note <note>
    Then a one-off task is created with title <title_stored>
    And the task has emoji <emoji_stored>
    And the task has note <note_stored>

    Examples:
      | title  | emoji | note         | title_stored    | emoji_stored   | note_stored   |
      | Regar  | 🌱     | Usar guantes | Regar           | 🌱              | Usar guantes  |

  # Emoji and note 11
  # Name of the task: with an emoji, «emoji title»; without an emoji, only the title.
  Scenario Outline: Emoji and note 11
    Given a one-off task <title> without a due date with emoji <emoji>
    Then the task name is <name>

    Examples:
      | title  | emoji | name    |
      | Regar  | 🌱     | 🌱 Regar |

  # Emoji and note 12
  # Without an emoji, the name is only the title.
  Scenario Outline: Emoji and note 12
    Given a one-off task <title> without a due date
    Then the task name is <name>

    Examples:
      | title  | name   |
      | Regar  | Regar  |

  # Emoji and note 13
  # Editing emoji and note does not change the id nor touch the completions.
  Scenario Outline: Emoji and note 13
    Given a relative recurring task every <every> <unit>
    And the task was completed on <completed>
    When I choose the emoji <emoji> and edit the note to <note>
    Then the task keeps its id
    And the task keeps a single completion, from <completed_stored>

    Examples:
      | every | unit   | completed           | emoji | note         | completed_stored    |
      | 2    | dias   | 2026-07-15T08:00:00 | 🌱     | Usar guantes | 2026-07-15T08:00:00 |

  # Emoji and note 14
  # Emoji and note are different fields: both changes are combined.
  Scenario Outline: Emoji and note 14
    Given a one-off task without a due date
    When I choose the emoji <emoji>
    And another device, without seeing that change, edits the note to <note>
    Then the task has emoji <emoji_stored>
    And the task has note <note_stored>

    Examples:
      | emoji | note         | emoji_stored   | note_stored   |
      | 🌱     | Usar guantes | 🌱              | Usar guantes  |

  # Emoji and note 15
  # The same emoji: the last change to arrive wins.
  Scenario Outline: Emoji and note 15
    Given a one-off task without a due date
    When I choose the emoji <first>
    And another device, without seeing that change, chooses the emoji <second>
    Then the task has emoji <emoji_stored>

    Examples:
      | first   | second  | emoji_stored   |
      | 🌱       | 🔥       | 🔥              |

  # Emoji and note 16
  # The same note: the last change to arrive wins and the emoji is not touched.
  Scenario Outline: Emoji and note 16
    Given a one-off task without a due date with emoji <emoji>
    When I edit the note to <first> with spaces at the start and end
    And another device, without seeing that change, edits the note to <second>
    Then the task has note <note_stored>
    And the task has emoji <emoji_stored>

    Examples:
      | emoji | first        | second   | note_stored   | emoji_stored   |
      | 🌱     | Usar guantes | Ventilar | Ventilar      | 🌱              |

  # Emoji and note 17
  # Removing the emoji on one device and editing the note on the other: they are combined.
  Scenario Outline: Emoji and note 17
    Given a one-off task without a due date with emoji <emoji>
    When I remove the emoji
    And another device, without seeing that change, edits the note to <note>
    Then the task has no emoji
    And the task has note <note_stored>

    Examples:
      | emoji | note         | note_stored   |
      | 🌱     | Usar guantes | Usar guantes  |
