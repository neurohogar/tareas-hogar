# mutation-stamp: sha256=678f08300f9a19dc69f6ca88a1b11c56a72155db7862ffeb4963bac31d57ad5f
# acceptance-mutation-manifest-begin
# {"version":1,"tested_at":"2026-11-19T12:04:17.499033221Z","feature_name":"Annotate","feature_path":"features/anotar.feature","background_hash":"74234e98afe7498fb5daf1f36ac2d78acc339464f950703b8c019892f982b90b","implementation_hash":"sha256:56c3af3e403822fb51e1a8c84c2f634b5a954f0dcd07475d80d979f3d0f2f68f","scenarios":[{"index":0,"name":"Annotate 1","scenario_hash":"905483809a9c4e1060fbe95b54d270e989fce9e44e09f9ff3eb5993b59f61823","mutation_count":12,"result":{"Total":12,"Killed":12,"Survived":0,"Errors":0},"tested_at":"2026-11-19T12:04:17.499033221Z"},{"index":1,"name":"Annotate 2","scenario_hash":"1aca5a50796c5462ff1f79128918e379aea292b10696e4f4088fa8fb909610c4","mutation_count":12,"result":{"Total":12,"Killed":12,"Survived":0,"Errors":0},"tested_at":"2026-11-19T12:04:17.499033221Z"},{"index":2,"name":"Annotate 3","scenario_hash":"ae17453f1d7de7ac75873c1f3e19d60b9a6e0862e8bf19d322e6a2ed4d2e5d0b","mutation_count":8,"result":{"Total":8,"Killed":8,"Survived":0,"Errors":0},"tested_at":"2026-11-19T12:04:17.499033221Z"},{"index":3,"name":"Annotate 4","scenario_hash":"92f436400bb5e245430b8cb59c029f99a77fb78d6ba97cb9dc24a257eb875164","mutation_count":30,"result":{"Total":30,"Killed":30,"Survived":0,"Errors":0},"tested_at":"2026-11-19T12:04:17.499033221Z"},{"index":4,"name":"Annotate 5","scenario_hash":"087f33140bbc52920cf9d11b64dc2ced7839c23647bc49c2569d8117c886d393","mutation_count":10,"result":{"Total":10,"Killed":10,"Survived":0,"Errors":0},"tested_at":"2026-11-19T12:04:17.499033221Z"},{"index":5,"name":"Annotate 6","scenario_hash":"5ee4712706c3314922ce21487ae656cc21fb4138b6b7186c4af52df219166d17","mutation_count":4,"result":{"Total":4,"Killed":4,"Survived":0,"Errors":0},"tested_at":"2026-11-19T12:04:17.499033221Z"},{"index":6,"name":"Annotate 7","scenario_hash":"7f1d38e36027690692404c27553e3c35a5210e2cba6901e55c0bda1515cb68ed","mutation_count":4,"result":{"Total":4,"Killed":4,"Survived":0,"Errors":0},"tested_at":"2026-11-19T12:04:17.499033221Z"},{"index":7,"name":"Annotate 8","scenario_hash":"57a1c76a407ebf437777647e4ce6344601e422a6ed1d3267b9fbfeea300b0d32","mutation_count":8,"result":{"Total":8,"Killed":8,"Survived":0,"Errors":0},"tested_at":"2026-11-19T12:04:17.499033221Z"},{"index":8,"name":"Annotate 9","scenario_hash":"8dfd021fc5ef61607dac3d02bdc540b0db090ebbcb4c906f0e277e979f3f264f","mutation_count":8,"result":{"Total":8,"Killed":8,"Survived":0,"Errors":0},"tested_at":"2026-11-19T12:04:17.499033221Z"},{"index":9,"name":"Annotate 10","scenario_hash":"d7bc621929c1bd9463962d6e32a8aaf6637bc351203fb8cf56d498c33fed92de","mutation_count":8,"result":{"Total":8,"Killed":8,"Survived":0,"Errors":0},"tested_at":"2026-11-19T12:04:17.499033221Z"},{"index":10,"name":"Annotate 11","scenario_hash":"872d07e3b47bfd73169f2d5a6baa988003049def6f0c2a5bdb2d22e1d049faa0","mutation_count":2,"result":{"Total":2,"Killed":2,"Survived":0,"Errors":0},"tested_at":"2026-11-19T12:04:17.499033221Z"},{"index":11,"name":"Annotate 12","scenario_hash":"02873f8f8e4f147ad09b076eae4a4567e5394163549ce07615d88fa6cb6ddf3e","mutation_count":5,"result":{"Total":5,"Killed":5,"Survived":0,"Errors":0},"tested_at":"2026-11-19T12:04:17.499033221Z"}]}
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
