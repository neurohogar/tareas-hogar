# mutation-stamp: sha256=eb7a3865ca8cc082c5ba24e469a9e0d74d3488bca72b1c5b2802a565ceddbc60
# acceptance-mutation-manifest-begin
# {"version":1,"tested_at":"2026-11-19T13:04:04.675231213Z","feature_name":"Minimal version and unsaved changes","feature_path":"features/version-minima-cambios-sin-guardar.feature","background_hash":"74234e98afe7498fb5daf1f36ac2d78acc339464f950703b8c019892f982b90b","implementation_hash":"sha256:5cb2174bc54b5790756483a878f0c86641c8004360f8860a99da0ce74e79676c","scenarios":[{"index":0,"name":"Minimal version and unsaved changes 1","scenario_hash":"ede0fffec66e7c250e903c41f0157d6ae578032cc3a36f5ce7c3fe74528d6916","mutation_count":6,"result":{"Total":6,"Killed":6,"Survived":0,"Errors":0},"tested_at":"2026-11-19T13:04:04.675231213Z"},{"index":1,"name":"Minimal version and unsaved changes 2","scenario_hash":"4f9fe401fdc80e30da84274704ceebff1fe8d25c5ed873ae91edf962660b4a09","mutation_count":6,"result":{"Total":6,"Killed":6,"Survived":0,"Errors":0},"tested_at":"2026-11-19T13:04:04.675231213Z"},{"index":2,"name":"Minimal version and unsaved changes 3","scenario_hash":"0c75b45498875a519296411a0454843e6104785fd5b75150cebf0075d7320c3d","mutation_count":6,"result":{"Total":6,"Killed":6,"Survived":0,"Errors":0},"tested_at":"2026-11-19T13:04:04.675231213Z"},{"index":3,"name":"Minimal version and unsaved changes 4","scenario_hash":"206fcbfdfe055847d266e99aa795ec2e8e697905a01b19156110c36ece5a3574","mutation_count":2,"result":{"Total":2,"Killed":2,"Survived":0,"Errors":0},"tested_at":"2026-11-19T13:04:04.675231213Z"},{"index":4,"name":"Minimal version and unsaved changes 5","scenario_hash":"8afd18813286be9e642a5a8d542258ab0d685870d979cfd31c1ada649debbbc8","mutation_count":2,"result":{"Total":2,"Killed":2,"Survived":0,"Errors":0},"tested_at":"2026-11-19T13:04:04.675231213Z"},{"index":5,"name":"Minimal version and unsaved changes 6","scenario_hash":"8aa59e63008056ec0343cdbea2c596843067e50858ae7f6682f68b70ba45d70b","mutation_count":2,"result":{"Total":2,"Killed":2,"Survived":0,"Errors":0},"tested_at":"2026-11-19T13:04:04.675231213Z"},{"index":6,"name":"Minimal version and unsaved changes 7","scenario_hash":"335d708ed3c72cfe76a0263feee6d448de8ae8c07ad87ac975b4718239d5db79","mutation_count":2,"result":{"Total":2,"Killed":2,"Survived":0,"Errors":0},"tested_at":"2026-11-19T13:04:04.675231213Z"},{"index":7,"name":"Minimal version and unsaved changes 8","scenario_hash":"8b5d8bf4c7f0d3815a1cb80a8e352f702c1a4dc11d5bf18078aa99f57e86713e","mutation_count":2,"result":{"Total":2,"Killed":2,"Survived":0,"Errors":0},"tested_at":"2026-11-19T13:04:04.675231213Z"},{"index":8,"name":"Minimal version and unsaved changes 9","scenario_hash":"10b0e26d1632f128ac3bbc43c2c05be500586a06066ed409f09a09d4d92f43be","mutation_count":2,"result":{"Total":2,"Killed":2,"Survived":0,"Errors":0},"tested_at":"2026-11-19T13:04:04.675231213Z"}]}
# acceptance-mutation-manifest-end

# Spec §6.2 (Minimal version, Unsaved changes), with §4.1. The field
# «Versión mínima» counts for unsaved changes with the single definition of
# «there are changes»: typing and going back to the original value does not count, nor do the
# spaces that Guardar trims; emptying an existing minimal version does. When
# creating, the field starts empty. The place of the field in the panel (below the
# steps and before the note), the label, the lack of example text and Enter
# saving are covered only by the QA suite.
# "I open the panel to edit the task T with minimal version V" opens the panel with
# that value already stored; "what stays open is X" asserts what was left open after
# tapping the X of the panel.
Feature: Minimal version and unsaved changes

  # Minimal version and unsaved changes 1
  # When editing, the Versión mínima field with another value is a change; with the
  # same value, it is not.
  Scenario Outline: Minimal version and unsaved changes 1
    Given I open the panel to edit the task <title> with minimal version <minimal>
    When I type <value> in the field <field>
    And I tap the X of the panel
    Then what stays open is <open>

    Examples:
      | title  | minimal         | field          | value           | open                            |
      | Lavar  | Solo el inodoro | Versión mínima | Solo el lavabo  | el panel con el aviso de cierre |
      | Lavar  | Solo el inodoro | Versión mínima | Solo el inodoro | nada                            |

  # Minimal version and unsaved changes 2
  # Typing and going back to the original value does not count as a change; going back to another
  # value does.
  Scenario Outline: Minimal version and unsaved changes 2
    Given I open the panel to edit the task <title> with minimal version <minimal>
    When I type <first> in the field <field>
    And I type <second> in the field <field>
    And I tap the X of the panel
    Then what stays open is <open>

    Examples:
      | title  | minimal         | field          | first          | second          | open                            |
      | Lavar  | Solo el inodoro | Versión mínima | Solo el lavabo | Solo el inodoro | nada                            |
      | Lavar  | Solo el inodoro | Versión mínima | Solo el lavabo | Solo la ducha   | el panel con el aviso de cierre |

  # Minimal version and unsaved changes 3
  # The spaces that Guardar trims do not count: the same value with spaces
  # around it is not a change (row 1); another value is (row 2).
  Scenario Outline: Minimal version and unsaved changes 3
    Given I open the panel to edit the task <title> with minimal version <minimal>
    When I type <value> with spaces around it in the field <field>
    And I tap the X of the panel
    Then what stays open is <open>

    Examples:
      | title  | minimal         | field          | value           | open                            |
      | Lavar  | Solo el inodoro | Versión mínima | Solo el inodoro | nada                            |
      | Lavar  | Solo el inodoro | Versión mínima | Solo el lavabo  | el panel con el aviso de cierre |

  # Minimal version and unsaved changes 4
  # Emptying an existing minimal version counts as a change.
  Scenario Outline: Minimal version and unsaved changes 4
    Given I open the panel to edit the task <title> with minimal version <minimal>
    When I clear the field <field>
    And I tap the X of the panel
    Then what stays open is <open>

    Examples:
      | title  | minimal         | field          | open                            |
      | Lavar  | Solo el inodoro | Versión mínima | el panel con el aviso de cierre |

  # Minimal version and unsaved changes 5
  # Only spaces in an existing minimal version is emptying it: it counts as a
  # change.
  Scenario Outline: Minimal version and unsaved changes 5
    Given I open the panel to edit the task <title> with minimal version <minimal>
    When I type only spaces in the field <field>
    And I tap the X of the panel
    Then what stays open is <open>

    Examples:
      | title  | minimal         | field          | open                            |
      | Lavar  | Solo el inodoro | Versión mínima | el panel con el aviso de cierre |

  # Minimal version and unsaved changes 6
  # On a task without a minimal version, typing one is a change.
  Scenario Outline: Minimal version and unsaved changes 6
    Given I open the panel to edit the task <title> with note <note>
    When I type <value> in the field <field>
    And I tap the X of the panel
    Then what stays open is <open>

    Examples:
      | title  | note | field          | value           | open                            |
      | Lavar  | Luz  | Versión mínima | Solo el inodoro | el panel con el aviso de cierre |

  # Minimal version and unsaved changes 7
  # Without a minimal version, only spaces does not count.
  Scenario Outline: Minimal version and unsaved changes 7
    Given I open the panel to edit the task <title> with note <note>
    When I type only spaces in the field <field>
    And I tap the X of the panel
    Then what stays open is <open>

    Examples:
      | title  | note | field          | open    |
      | Lavar  | Luz  | Versión mínima | nada    |

  # Minimal version and unsaved changes 8
  # When creating, the field starts empty: typing something is loading something.
  Scenario Outline: Minimal version and unsaved changes 8
    Given I open the panel to create a task
    When I type <value> in the field <field>
    And I tap the X of the panel
    Then what stays open is <open>

    Examples:
      | field          | value           | open                            |
      | Versión mínima | Solo el inodoro | el panel con el aviso de cierre |

  # Minimal version and unsaved changes 9
  # When creating, only spaces closes directly.
  Scenario Outline: Minimal version and unsaved changes 9
    Given I open the panel to create a task
    When I type only spaces in the field <field>
    And I tap the X of the panel
    Then what stays open is <open>

    Examples:
      | field          | open    |
      | Versión mínima | nada    |
