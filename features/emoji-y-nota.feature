# mutation-stamp: sha256=5f7cc9275a2e4155fe8ef571769d1014e34b7ac5c46d6c3ca3fc65b78fe2da5b
# acceptance-mutation-manifest-begin
# {"version":1,"tested_at":"2026-11-17T20:54:55.396814672Z","feature_name":"Emoji y nota","feature_path":"features/emoji-y-nota.feature","background_hash":"74234e98afe7498fb5daf1f36ac2d78acc339464f950703b8c019892f982b90b","implementation_hash":"sha256:cb98958d099445c4f8fb4685402da36dd3565201abf6834cfb9e0e0c9099bb81","scenarios":[{"index":0,"name":"Emoji y nota 1","scenario_hash":"0545e75a7a6aebb1f4f7f62360ae1f3e1589fa633250ef6cfa241f637a81ac83","mutation_count":10,"result":{"Total":10,"Killed":10,"Survived":0,"Errors":0},"tested_at":"2026-11-17T20:54:55.396814672Z"},{"index":1,"name":"Emoji y nota 2","scenario_hash":"a65678f25dff0c97628c5d6810fc84993733fdd5981f6850a53990972d0c829a","mutation_count":1,"result":{"Total":1,"Killed":1,"Survived":0,"Errors":0},"tested_at":"2026-11-17T20:54:55.396814672Z"},{"index":2,"name":"Emoji y nota 5","scenario_hash":"0fb5eb2d991986259ef47eca03420a08194da35757876d383c71767de9aaa278","mutation_count":4,"result":{"Total":4,"Killed":4,"Survived":0,"Errors":0},"tested_at":"2026-11-17T20:54:55.396814672Z"},{"index":3,"name":"Emoji y nota 6","scenario_hash":"57af6f287bea00261b3070a8d7636fbba9b89ef0a18c58314b0c891c0e63e193","mutation_count":4,"result":{"Total":4,"Killed":4,"Survived":0,"Errors":0},"tested_at":"2026-11-17T20:54:55.396814672Z"},{"index":5,"name":"Emoji y nota 8","scenario_hash":"08bb72843b18d22b0a118f357779a790fbca39d9f696232411c8cfb798313ac9","mutation_count":2,"result":{"Total":2,"Killed":2,"Survived":0,"Errors":0},"tested_at":"2026-11-17T20:54:55.396814672Z"},{"index":6,"name":"Emoji y nota 9","scenario_hash":"1e1a0037ed72569a6f51fdc0b39271569adc323fdffd0783566c18746a614618","mutation_count":6,"result":{"Total":6,"Killed":6,"Survived":0,"Errors":0},"tested_at":"2026-11-17T20:54:55.396814672Z"},{"index":7,"name":"Emoji y nota 11","scenario_hash":"e52861572c704cf66eb74f73a156232129a59e5abbe04a197db6e55bd8c42262","mutation_count":3,"result":{"Total":3,"Killed":3,"Survived":0,"Errors":0},"tested_at":"2026-11-17T20:54:55.396814672Z"},{"index":8,"name":"Emoji y nota 12","scenario_hash":"7802344ad352fddcea265734d879674578c3def47bb0e04c09c04dc547e7e04e","mutation_count":2,"result":{"Total":2,"Killed":2,"Survived":0,"Errors":0},"tested_at":"2026-11-17T20:54:55.396814672Z"},{"index":9,"name":"Emoji y nota 13","scenario_hash":"a442f2ae58acc8855b273a0c8997d64cee3326f6c04e9008bba02d781c0d0e78","mutation_count":9,"result":{"Total":9,"Killed":9,"Survived":0,"Errors":0},"tested_at":"2026-11-17T20:54:55.396814672Z"},{"index":10,"name":"Emoji y nota 14","scenario_hash":"6bad6656e0320dee79c1e78ab1ecdf590ca20b1ed03dbb7d3d87abf2f97636ff","mutation_count":4,"result":{"Total":4,"Killed":4,"Survived":0,"Errors":0},"tested_at":"2026-11-17T20:54:55.396814672Z"},{"index":11,"name":"Emoji y nota 15","scenario_hash":"8935232cf345f8daa0e1c01ff3b08bab900029f2665214efd66a45dc63a661e0","mutation_count":2,"result":{"Total":2,"Killed":2,"Survived":0,"Errors":0},"tested_at":"2026-11-17T20:54:55.396814672Z"},{"index":12,"name":"Emoji y nota 16","scenario_hash":"fb245360186c5ba761a789fd7510a3bdcd2ca4ce1879a70f9cf82cc3dabf8b74","mutation_count":4,"result":{"Total":4,"Killed":4,"Survived":0,"Errors":0},"tested_at":"2026-11-17T20:54:55.396814672Z"},{"index":13,"name":"Emoji y nota 17","scenario_hash":"e67e0316dc6452739e3c8b49889774475580241924e97f21375132d20af9d3f1","mutation_count":3,"result":{"Total":3,"Killed":3,"Survived":0,"Errors":0},"tested_at":"2026-11-17T20:54:55.396814672Z"}]}
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
