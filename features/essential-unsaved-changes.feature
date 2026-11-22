# mutation-stamp: sha256=af148cbd58987859842f2dee91366f606674d07f294b319dfec1bf371c13f9a8
# acceptance-mutation-manifest-begin
# {"version":1,"tested_at":"2026-11-22T21:41:18.402334929Z","feature_name":"Essential and unsaved changes","feature_path":"features/essential-unsaved-changes.feature","background_hash":"74234e98afe7498fb5daf1f36ac2d78acc339464f950703b8c019892f982b90b","implementation_hash":"sha256:b7f406923218d2d7a17eb588b0b6c03b4d52b81e3bd65407f81a57cc5c5f0222","scenarios":[{"index":1,"name":"Essential and unsaved changes 2","scenario_hash":"acbc85323f6e77f12dc29d49d0709dece042cde5e2ea95d429dd085912457814","mutation_count":1,"result":{"Total":1,"Killed":1,"Survived":0,"Errors":0},"tested_at":"2026-11-22T21:40:12.374545714Z"},{"index":0,"name":"Essential and unsaved changes 1","scenario_hash":"5168f029d81a2e5aebda9c4f4031dd3883cdef1c4266823a9743d4dba11eec25","mutation_count":1,"result":{"Total":1,"Killed":1,"Survived":0,"Errors":0},"tested_at":"2026-11-22T21:39:55.841187897Z"},{"index":2,"name":"Essential and unsaved changes 3","scenario_hash":"8a43776155ca24e911aae3fcf2f3530254398cb2367edf780e2bbb50393423e4","mutation_count":1,"result":{"Total":1,"Killed":1,"Survived":0,"Errors":0},"tested_at":"2026-11-22T21:39:55.841187897Z"},{"index":3,"name":"Essential and unsaved changes 4","scenario_hash":"35a632a3359e75ecf920a411bc128003e55bffd9ece8a0cdf21a57ae310525b8","mutation_count":1,"result":{"Total":1,"Killed":1,"Survived":0,"Errors":0},"tested_at":"2026-11-22T21:36:49.440469769Z"},{"index":4,"name":"Essential and unsaved changes 5","scenario_hash":"b9cd55e7f78b2a660fd3e077f236dc38d0e27a3d7a00b9c93c3f7c7157413193","mutation_count":1,"result":{"Total":1,"Killed":1,"Survived":0,"Errors":0},"tested_at":"2026-11-22T21:36:49.440469769Z"},{"index":5,"name":"Essential and unsaved changes 6","scenario_hash":"afc4c83e9611a54c06a805d164b000ec224cc9b8b2705bf3476e3c2ace8406b3","mutation_count":1,"result":{"Total":1,"Killed":1,"Survived":0,"Errors":0},"tested_at":"2026-11-22T21:36:49.440469769Z"},{"index":6,"name":"Essential and unsaved changes 7","scenario_hash":"5d646337fad245cee4f68f6a3bbd2cf9a2311b58c1b15f52dea39de27e7eeeb8","mutation_count":1,"result":{"Total":1,"Killed":1,"Survived":0,"Errors":0},"tested_at":"2026-11-22T21:36:49.440469769Z"}]}
# acceptance-mutation-manifest-end

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
    When I tap the Esencial check
    And I tap the X of the panel
    Then what stays open is <open>
    And the Esencial check is unchecked

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

  # Essential and unsaved changes 8
  # When editing an essential task, the check starts checked.
  Scenario Outline: Essential and unsaved changes 8
    Given I open the panel to edit the essential task <title> with note <note>
    Then the Esencial check is checked

    Examples:
      | title | note |
      | Lavar | Luz  |
