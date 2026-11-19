# mutation-stamp: sha256=9b1905192e08fe1555a12ee36fef98f45ea6dd360b2ccfd899aec1f300e8989e
# acceptance-mutation-manifest-begin
# {"version":1,"tested_at":"2026-11-17T20:47:40.966502376Z","feature_name":"Anotar","feature_path":"features/anotar.feature","background_hash":"74234e98afe7498fb5daf1f36ac2d78acc339464f950703b8c019892f982b90b","implementation_hash":"sha256:7ea95eac7609d39bc828454a6374d18ad62e64b2f80c83131fac5f36f9ed5051","scenarios":[{"index":0,"name":"Anotar 1","scenario_hash":"41e4a92ef5eba407b5c734f2a997956954c3a8ab9035992bb7b559ada6a81d78","mutation_count":12,"result":{"Total":12,"Killed":12,"Survived":0,"Errors":0},"tested_at":"2026-11-17T20:47:40.966502376Z"},{"index":1,"name":"Anotar 2","scenario_hash":"bc098619904be28ac7783651b13573036d185f9e683ab9dc7930366d98a8c79f","mutation_count":12,"result":{"Total":12,"Killed":12,"Survived":0,"Errors":0},"tested_at":"2026-11-17T20:47:40.966502376Z"},{"index":2,"name":"Anotar 3","scenario_hash":"b3025288359396e20f6ba352f6bc6f2bbd1349c28210370e4edae3eac7311dc3","mutation_count":8,"result":{"Total":8,"Killed":8,"Survived":0,"Errors":0},"tested_at":"2026-11-17T20:47:40.966502376Z"},{"index":3,"name":"Anotar 4","scenario_hash":"d3705a13337aa4a9764dd26aa048e10312d46d0bae492fb54e2ba0c4c116ed46","mutation_count":30,"result":{"Total":30,"Killed":30,"Survived":0,"Errors":0},"tested_at":"2026-11-17T20:47:40.966502376Z"},{"index":4,"name":"Anotar 5","scenario_hash":"b516b824d6fa0cee869b80477dc5fc3a334a66724f8aa95b9d5ffd54c7cd64c4","mutation_count":10,"result":{"Total":10,"Killed":10,"Survived":0,"Errors":0},"tested_at":"2026-11-17T20:47:40.966502376Z"},{"index":5,"name":"Anotar 6","scenario_hash":"f56a84f3628088a50e2011457c231006a19e2a3e4deed3f056909116f9272d35","mutation_count":4,"result":{"Total":4,"Killed":4,"Survived":0,"Errors":0},"tested_at":"2026-11-17T20:47:40.966502376Z"},{"index":6,"name":"Anotar 7","scenario_hash":"669302ed877baf657ef6aeb3aca0d470317fb615bd4f9b2ecb937e763232a85a","mutation_count":4,"result":{"Total":4,"Killed":4,"Survived":0,"Errors":0},"tested_at":"2026-11-17T20:47:40.966502376Z"},{"index":7,"name":"Anotar 8","scenario_hash":"f06ee4cb9c02d406a1baaff007c867636f4ae2cef51ce8221b7bd7341efdf69d","mutation_count":8,"result":{"Total":8,"Killed":8,"Survived":0,"Errors":0},"tested_at":"2026-11-17T20:47:40.966502376Z"},{"index":8,"name":"Anotar 9","scenario_hash":"56ae51206a6dcf525f3b2a0371535f1f232161d468988735c4bb5ce551f4206c","mutation_count":8,"result":{"Total":8,"Killed":8,"Survived":0,"Errors":0},"tested_at":"2026-11-17T20:47:40.966502376Z"},{"index":9,"name":"Anotar 10","scenario_hash":"3b80311888df3f2e573d03c8817d6d293762cd96acecf3374dbc10b074ed8bf6","mutation_count":8,"result":{"Total":8,"Killed":8,"Survived":0,"Errors":0},"tested_at":"2026-11-17T20:47:40.966502376Z"},{"index":10,"name":"Anotar 11","scenario_hash":"da333e33de1040e19cb67bdd09b33040638736e1e4bf38e2cc545a2e6d12b0db","mutation_count":2,"result":{"Total":2,"Killed":2,"Survived":0,"Errors":0},"tested_at":"2026-11-17T20:47:40.966502376Z"},{"index":11,"name":"Anotar 12","scenario_hash":"2f53577d2c8149b5af9680a47b1b6ac5b8e3c318f3a4a005abeff899ba8bdb1f","mutation_count":5,"result":{"Total":5,"Killed":5,"Survived":0,"Errors":0},"tested_at":"2026-11-17T20:47:40.966502376Z"}]}
# acceptance-mutation-manifest-end

# Spec §4.5 (Anotación) and §5.10 (Anotar). A two-tap gesture saves an
# annotation «Me sirvió» or «Me molestó» with the context taken automatically: the instant,
# the screen and, if there is one, the task. The person does not choose or correct the context.
# screen: the Panel de edición if the panel is open (when creating or editing),
# over any screen; otherwise, the screen the person is on (Pendientes, Historial
# or Anotaciones).
# tareaId: the panel's task if it is open when editing; otherwise, the one the
# undo notice names (§5.4) if it is visible; otherwise, none. With the panel open
# when creating there is no task, even if an undo notice is visible.
# Text: an optional line, with no maximum length; leading and trailing spaces
# are trimmed, and empty or only spaces means no text. It is never invalid.
# An annotation is named by the instant it was annotated. Each task is named
# by its title (one word). That the box has the field and the two buttons,
# that Atrás closes it without annotating, the confirmation and that the button is on all
# the screens with a session are verified in the QA suite (qa/anotacion.md).
Feature: Annotate

  # Annotate 1
  # Without a panel or notice: meaning, instant and the screen the person is on;
  # no task and no text.
  Scenario Outline: Annotate 1
    Given I am on <screen>
    When I annotate <direction> on <now>
    Then a single annotation remains
    And the annotation from <now> has direction <direction_stored> in <screen_stored>
    And the annotation from <now> is of no task
    And the annotation from <now> has no text

    Examples:
      | screen       | direction  | now                 | direction_stored | screen_stored     |
      | Pendientes   | Me sirvió  | 2026-07-15T08:05:00 | Me sirvió        | Pendientes        |
      | Historial    | Me molestó | 2026-07-15T09:10:30 | Me molestó       | Historial         |
      | Anotaciones  | Me molestó | 2026-07-16T00:00:00 | Me molestó       | Anotaciones       |

  # Annotate 2
  # With the panel open when editing a task, the screen is the Panel de
  # edición, over any screen, and the task is the panel's.
  Scenario Outline: Annotate 2
    Given a one-off task Regar without a due date
    And I am on <screen>
    And the edit panel is open when editing the task Regar
    When I annotate <direction> on <now>
    Then a single annotation remains
    And the annotation from <now> has direction <direction_stored> in <screen_stored>
    And the annotation from <now> is of the task Regar

    Examples:
      | screen      | direction  | now                 | direction_stored | screen_stored     |
      | Pendientes  | Me sirvió  | 2026-07-15T08:05:00 | Me sirvió        | Panel de edición  |
      | Historial   | Me molestó | 2026-07-15T08:05:00 | Me molestó       | Panel de edición  |
      | Anotaciones | Me molestó | 2026-07-15T08:05:00 | Me molestó       | Panel de edición  |

  # Annotate 3
  # With the panel open when creating there is no task, over any screen.
  Scenario Outline: Annotate 3
    Given I am on <screen>
    And the edit panel is open when creating a task
    When I annotate <direction> on <now>
    Then a single annotation remains
    And the annotation from <now> has direction <direction_stored> in <screen_stored>
    And the annotation from <now> is of no task

    Examples:
      | screen      | direction  | now                 | direction_stored | screen_stored     |
      | Pendientes  | Me sirvió  | 2026-07-15T08:05:00 | Me sirvió        | Panel de edición  |
      | Historial   | Me molestó | 2026-07-15T08:05:00 | Me molestó       | Panel de edición  |

  # Annotate 4
  # With the panel closed and the undo notice visible, the task is the one the
  # notice names: visible up to the last second before the 5 seconds.
  Scenario Outline: Annotate 4
    Given a one-off task Regar without a due date
    And I am on <screen>
    When I complete the task Regar on <completed>
    And I annotate <direction> on <now>
    Then a single annotation remains
    And the annotation from <now> has direction <direction_stored> in <screen_stored>
    And the annotation from <now> is of the task Regar

    Examples:
      | screen      | direction  | completed           | now                 | direction_stored | screen_stored     |
      | Pendientes  | Me sirvió  | 2026-07-15T08:00:00 | 2026-07-15T08:00:00 | Me sirvió        | Pendientes        |
      | Historial   | Me molestó | 2026-07-15T08:00:00 | 2026-07-15T08:00:04 | Me molestó       | Historial         |
      | Anotaciones | Me molestó | 2026-07-15T08:00:00 | 2026-07-15T08:00:04 | Me molestó       | Anotaciones       |

  # Annotate 5
  # With the undo notice already expired (5 seconds or more) there is no task.
  Scenario Outline: Annotate 5
    Given a one-off task Regar without a due date
    And I am on <screen>
    When I complete the task Regar on <completed>
    And I annotate <direction> on <now>
    Then a single annotation remains
    And the annotation from <now> has direction <direction_stored> in <screen_stored>
    And the annotation from <now> is of no task

    Examples:
      | screen     | direction | completed           | now                 | direction_stored | screen_stored     |
      | Pendientes | Me sirvió | 2026-07-15T08:00:00 | 2026-07-15T08:00:05 | Me sirvió        | Pendientes        |
      | Historial  | Me sirvió | 2026-07-15T08:00:00 | 2026-07-15T09:00:00 | Me sirvió        | Historial         |

  # Annotate 6
  # With the panel open when editing, the panel's task prevails even if there is an
  # undo notice visible for another task.
  Scenario Outline: Annotate 6
    Given a one-off task Regar without a due date
    And a one-off task Pagar without a due date
    And I am on <screen>
    When I complete the task Regar on <completed>
    And the edit panel is open when editing the task Pagar
    And I annotate <direction> on <now>
    Then a single annotation remains
    And the annotation from <now> has direction <direction_stored> in <screen_stored>
    And the annotation from <now> is of the task Pagar

    Examples:
      | screen     | direction | completed           | now                 | direction_stored | screen_stored     |
      | Pendientes | Me sirvió | 2026-07-15T08:00:00 | 2026-07-15T08:00:02 | Me sirvió        | Panel de edición  |

  # Annotate 7
  # With the panel open when creating there is no task even if there is an
  # undo notice visible.
  Scenario Outline: Annotate 7
    Given a one-off task Regar without a due date
    And I am on <screen>
    When I complete the task Regar on <completed>
    And the edit panel is open when creating a task
    And I annotate <direction> on <now>
    Then a single annotation remains
    And the annotation from <now> has direction <direction_stored> in <screen_stored>
    And the annotation from <now> is of no task

    Examples:
      | screen     | direction  | completed           | now                 | direction_stored | screen_stored     |
      | Pendientes | Me molestó | 2026-07-15T08:00:00 | 2026-07-15T08:00:02 | Me molestó       | Panel de edición  |

  # Annotate 8
  # The text written is saved as is; leading and trailing spaces
  # are trimmed and inner ones stay.
  Scenario Outline: Annotate 8
    Given I am on <screen>
    When I annotate <direction> on <now> with the text <text> between <spaces> spaces
    Then a single annotation remains
    And the annotation from <now> says <text_stored>

    Examples:
      | screen     | direction  | now                 | text        | spaces   | text_stored    |
      | Pendientes | Me sirvió  | 2026-07-15T08:05:00 | quedó lindo | 0        | quedó lindo    |
      | Historial  | Me molestó | 2026-07-15T08:05:00 | quedó lindo | 3        | quedó lindo    |

  # Annotate 9
  # Empty or only spaces means no text: the field is not saved and it is never an
  # error.
  Scenario Outline: Annotate 9
    Given I am on <screen>
    When I annotate <direction> on <now> with <spaces> spaces as text
    Then a single annotation remains
    And the annotation from <now> has no text

    Examples:
      | screen     | direction  | now                 | spaces   |
      | Pendientes | Me sirvió  | 2026-07-15T08:05:00 | 0        |
      | Historial  | Me molestó | 2026-07-15T08:05:00 | 1        |
      | Historial  | Me sirvió  | 2026-07-15T08:05:00 | 4        |

  # Annotate 10
  # The text has no maximum length.
  Scenario Outline: Annotate 10
    Given I am on <screen>
    When I annotate <direction> on <now> with a text of <length> characters
    Then a single annotation remains
    And the annotation from <now> says a text of <length_stored> characters

    Examples:
      | screen     | direction | now                 | length | length_stored  |
      | Pendientes | Me sirvió | 2026-07-15T08:05:00 | 1     | 1              |
      | Pendientes | Me sirvió | 2026-07-15T08:05:00 | 5000  | 5000           |

  # Annotate 11
  # Anotar is not a change to the panel: with the panel open and no changes it stays
  # open and without unsaved changes.
  Scenario Outline: Annotate 11
    Given a one-off task Regar without a due date
    And I am on <screen>
    And the edit panel is open when editing the task Regar
    When I annotate <direction> on <now> with the text <text>
    Then the panel stays open without unsaved changes

    Examples:
      | screen     | direction  | now                 | text        |
      | Pendientes | Me molestó | 2026-07-15T08:05:00 | quedó lindo |

  # Annotate 12
  # Two devices annotate offline: neither is lost, each
  # with its own context.
  Scenario Outline: Annotate 12
    Given I am on <screen>
    When I annotate <direction> on <now>
    And another device, without seeing that change, annotates <direction_other> in <screen_other> on <now_other>
    Then <count> annotations remain
    And the annotation from <now> has direction <direction> in <screen>
    And the annotation from <now_other> has direction <direction_other> in <screen_other>

    Examples:
      | screen     | direction | now                 | direction_other | screen_other  | now_other           | count    |
      | Pendientes | Me sirvió | 2026-07-15T08:05:00 | Me molestó   | Historial     | 2026-07-15T08:06:00 | 2        |
