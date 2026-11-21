# mutation-stamp: sha256=54e1510c3cc46e883f318065213f4dd3f42152263d26cb50c38a7dd49ef1acb4
# acceptance-mutation-manifest-begin
# {"version":1,"tested_at":"2026-11-19T12:37:43.653921141Z","feature_name":"Bundled font","feature_path":"features/bundled-font.feature","background_hash":"74234e98afe7498fb5daf1f36ac2d78acc339464f950703b8c019892f982b90b","implementation_hash":"sha256:7a83298dfaed00b3f68e0a12a7b0374b669c3aad33b2a0558fefd0350e413109","scenarios":[{"index":0,"name":"Bundled font 1","scenario_hash":"8b013f53a7d4a33536a1b8793d598b1a000f6639f747579cec4d0c1d6c895dd6","mutation_count":31,"result":{"Total":31,"Killed":31,"Survived":0,"Errors":0},"tested_at":"2026-11-19T12:37:43.653921141Z"},{"index":1,"name":"Bundled font 2","scenario_hash":"0663a08d2a9952691444e62e5fdd710eb37012e3029edf365ed77b516e749fbb","mutation_count":12,"result":{"Total":12,"Killed":12,"Survived":0,"Errors":0},"tested_at":"2026-11-19T12:37:43.653921141Z"}]}
# acceptance-mutation-manifest-end

# Spec §6 (Bundled font and emoji, "What is drawn with what" and "The data does not
# change") and §4.1 (emoji). Which font draws each character: Atkinson
# Hyperlegible Next for the text it has, Noto Color Emoji for every emoji
# and for the text-and-emoji character without a mark that Atkinson does not have, the
# system font for the text that neither of the two has, and the device emoji for an emoji
# that Noto does not have. An emoji that the font set does not have
# or that the picker does not offer (§6.2) is stored anyway, except a loose skin
# tone, which is not a valid emoji. That the font and the font set
# apply on all screens and in both themes, sizes and weights unchanged,
# the panel Título at 20px, fixed-width digits for times, offline,
# without external services, the wait without a notice, the retry and the installation
# that does not depend on the fonts are verified in the QA suite
# (qa/bundled-font.md).
Feature: Bundled font

  # Bundled font 1
  # One row per row of the §6 table: Atkinson for the text it has
  # (Spanish, digits and signs without an emoji mark); the system font for
  # the text that Atkinson does not have; Noto for the text-and-emoji character without a
  # mark that Atkinson does not have and for every emoji that Noto has (with or without
  # a mark, ZWJ, tone, flag); the device emoji for one that Noto does not
  # have (from a newer Unicode version).
  Scenario Outline: Bundled font 1
    Given the text <text>
    Then the text is drawn with <font>

    Examples:
      | text                    | font                       |
      | Atención, camión y niño | Atkinson Hyperlegible Next |
      | 0123456789              | Atkinson Hyperlegible Next |
      | #                       | Atkinson Hyperlegible Next |
      | *                       | Atkinson Hyperlegible Next |
      | ©                       | Atkinson Hyperlegible Next |
      | ®                       | Atkinson Hyperlegible Next |
      | ™                       | Atkinson Hyperlegible Next |
      | 日本語                  | la fuente del sistema      |
      | ❤                       | Noto Color Emoji           |
      | ☀                       | Noto Color Emoji           |
      | ☎                       | Noto Color Emoji           |
      | ✈                       | Noto Color Emoji           |
      | 🌱                      | Noto Color Emoji           |
      | ❤️                      | Noto Color Emoji           |
      | #️⃣                      | Noto Color Emoji           |
      | 👨‍👩‍👧                    | Noto Color Emoji           |
      | 👍🏽                     | Noto Color Emoji           |
      | 🇦🇷                     | Noto Color Emoji           |
      | 🫿                      | el emoji del dispositivo   |

  # Bundled font 2
  # An emoji that the font set does not have is stored anyway, and so is one that the picker
  # does not offer and that arrived another way: a loose hair component or a two-tone variant.
  Scenario Outline: Bundled font 2
    Given a one-off task without a due date
    When I choose the emoji <emoji>
    Then the task has emoji <emoji_stored>

    Examples:
      | emoji | emoji_stored  |
      | 🫿    | 🫿             |
      | 🦰    | 🦰             |
      | 🦱    | 🦱             |
      | 🦳    | 🦳             |
      | 🦲    | 🦲             |
      | 🧑🏻‍🤝‍🧑🏿 | 🧑🏻‍🤝‍🧑🏿       |

  # Bundled font 3
  # A loose skin tone is not offered by the picker either, but it is not a valid
  # emoji: arriving another way, it is rejected (§4.1, §6.2).
  Scenario Outline: Bundled font 3
    When I create a one-off task with title <title>, emoji <emoji> and note <note>
    Then creation is rejected for invalid emoji
    And no task is created

    Examples:
      | title  | emoji | note  |
      | Regar  | 🏻    | Cerca |
      | Regar  | 🏼    | Cerca |
      | Regar  | 🏽    | Cerca |
      | Regar  | 🏾    | Cerca |
      | Regar  | 🏿    | Cerca |
