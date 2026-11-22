# Spec §6.2 (Esencial, Unsaved changes), with §4.1 and §5.8. The check «Esencial»
# counts for unsaved changes with the single definition of «there are changes»:
# going back to the starting value does not count. When editing, it starts with the
# current value of the task. When creating, it starts unchecked with the minimal mode
# off and checked with it on (the mode as of the moment the panel opens); that
# starting value is the one the form is measured against, so it is not a change, and
# unchecking it is. If the mode changes with the panel open, the check is not
# changed. The place of the check (in Tarea, after the note, text only) and Enter
# saving are covered only by the QA suite (qa/minimal-mode.md).
# "I open the panel to edit the essential task T with note N" opens the panel with the
# task already essential. "I tap the Esencial check" toggles it; "the Esencial check is
# S" asserts it (checked or unchecked). "what stays open is X" asserts what was left
# open after tapping the X of the panel. "the minimal mode is on" is the mode already
# on before the panel opens; "another device turns the minimal mode on" is a change
# of the mode that arrives with the panel already open.
Feature: Essential and unsaved changes

  # Essential and unsaved changes 1
  # When editing a non-essential task, checking Esencial is a change.
  Scenario Outline: Essential and unsaved changes 1
    Given I open the panel to edit the task <title> with note <note>
    When I tap the Esencial check
    And I tap the X of the panel
    Then what stays open is <open>

    Examples:
      | title | note | open                            |
      | Lavar | Luz  | el panel con el aviso de cierre |

  # Essential and unsaved changes 2
  # When editing an essential task, it starts checked; unchecking it is a change.
  Scenario Outline: Essential and unsaved changes 2
    Given I open the panel to edit the essential task <title> with note <note>
    Then the Esencial check is checked
    When I tap the Esencial check
    And I tap the X of the panel
    Then what stays open is <open>

    Examples:
      | title | note | open                            |
      | Lavar | Luz  | el panel con el aviso de cierre |

  # Essential and unsaved changes 3
  # Tapping it twice goes back to the original value: it does not count as a change.
  Scenario Outline: Essential and unsaved changes 3
    Given I open the panel to edit the task <title> with note <note>
    When I tap the Esencial check
    And I tap the Esencial check
    And I tap the X of the panel
    Then what stays open is <open>

    Examples:
      | title | note | open  |
      | Lavar | Luz  | nada  |

  # Essential and unsaved changes 4
  # When creating with the minimal mode off, the check starts unchecked and is not a
  # change; checking it is.
  Scenario Outline: Essential and unsaved changes 4
    Given I open the panel to create a task
    Then the Esencial check is unchecked
    When I tap the Esencial check
    And I tap the X of the panel
    Then what stays open is <open>

    Examples:
      | open                            |
      | el panel con el aviso de cierre |

  # Essential and unsaved changes 5
  # When creating with the minimal mode on, the check starts checked and that is not
  # a change: the panel closes directly.
  Scenario Outline: Essential and unsaved changes 5
    Given the minimal mode is on
    And I open the panel to create a task
    Then the Esencial check is checked
    When I tap the X of the panel
    Then what stays open is <open>

    Examples:
      | open  |
      | nada  |

  # Essential and unsaved changes 6
  # With the minimal mode on, unchecking the check that started checked is a change.
  Scenario Outline: Essential and unsaved changes 6
    Given the minimal mode is on
    And I open the panel to create a task
    When I tap the Esencial check
    And I tap the X of the panel
    Then what stays open is <open>

    Examples:
      | open                            |
      | el panel con el aviso de cierre |

  # Essential and unsaved changes 7
  # If the mode changes with the panel open, the check is not changed and the panel
  # is still as it was opened.
  Scenario Outline: Essential and unsaved changes 7
    Given I open the panel to create a task
    When another device turns the minimal mode on
    Then the Esencial check is unchecked
    When I tap the X of the panel
    Then what stays open is <open>

    Examples:
      | open  |
      | nada  |
