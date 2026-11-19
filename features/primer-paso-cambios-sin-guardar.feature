# mutation-stamp: sha256=6d081d0001b96f1b475011793722545363a9b775ad4a204a8be782b38fc1a26f
# acceptance-mutation-manifest-begin
# {"version":1,"tested_at":"2026-11-19T12:52:22.412186927Z","feature_name":"First step and unsaved changes","feature_path":"features/primer-paso-cambios-sin-guardar.feature","background_hash":"74234e98afe7498fb5daf1f36ac2d78acc339464f950703b8c019892f982b90b","implementation_hash":"sha256:787c802e94b8bc1ad24c3ba2d0405d08a532df85272c91a5cf6622bdaffc3b3d","scenarios":[{"index":0,"name":"First step and unsaved changes 1","scenario_hash":"fba62940c99ec9aa339edf6a667d9aee4c2725971b91bc98191c96246147cbbc","mutation_count":6,"result":{"Total":6,"Killed":6,"Survived":0,"Errors":0},"tested_at":"2026-11-19T12:52:22.412186927Z"},{"index":1,"name":"First step and unsaved changes 2","scenario_hash":"b78e97941697aec878a0576b70f9625b79e66ce960aa65a7b37c6931f242beb9","mutation_count":6,"result":{"Total":6,"Killed":6,"Survived":0,"Errors":0},"tested_at":"2026-11-19T12:52:22.412186927Z"},{"index":2,"name":"First step and unsaved changes 3","scenario_hash":"a8b378605550187935722b7ef4a3682e47193072e8675aa8c59a84e70d6a5ed4","mutation_count":6,"result":{"Total":6,"Killed":6,"Survived":0,"Errors":0},"tested_at":"2026-11-19T12:52:22.412186927Z"},{"index":3,"name":"First step and unsaved changes 4","scenario_hash":"5665b5fdf37811d49db597f20ce8ccb37bb95de3eef60cf9f0ab32a464a7afb5","mutation_count":2,"result":{"Total":2,"Killed":2,"Survived":0,"Errors":0},"tested_at":"2026-11-19T12:52:22.412186927Z"},{"index":4,"name":"First step and unsaved changes 5","scenario_hash":"dfc8a730a9520bc2689dc17e8e3fffd7ac2058bcbadce383b87579b63139189a","mutation_count":2,"result":{"Total":2,"Killed":2,"Survived":0,"Errors":0},"tested_at":"2026-11-19T12:52:22.412186927Z"},{"index":5,"name":"First step and unsaved changes 6","scenario_hash":"27438a34cc956c2eb7a3283a2547ebbd662c4edef9300edbb23cc67431b20954","mutation_count":2,"result":{"Total":2,"Killed":2,"Survived":0,"Errors":0},"tested_at":"2026-11-19T12:52:22.412186927Z"},{"index":6,"name":"First step and unsaved changes 7","scenario_hash":"de8e6de18563ae1833c21633de9a851d79f374cf3a7c8d5e7717f149d94d9436","mutation_count":2,"result":{"Total":2,"Killed":2,"Survived":0,"Errors":0},"tested_at":"2026-11-19T12:52:22.412186927Z"},{"index":7,"name":"First step and unsaved changes 8","scenario_hash":"f750e5d382ca840d432801e9734557f2918b13f33601df62ed41c594f7fc9ce1","mutation_count":2,"result":{"Total":2,"Killed":2,"Survived":0,"Errors":0},"tested_at":"2026-11-19T12:52:22.412186927Z"},{"index":8,"name":"First step and unsaved changes 9","scenario_hash":"f10deed16e55720cf6d3f798bde5182cf8cc8192e5ebcee016beface473f2f85","mutation_count":2,"result":{"Total":2,"Killed":2,"Survived":0,"Errors":0},"tested_at":"2026-11-19T12:52:22.412186927Z"}]}
# acceptance-mutation-manifest-end

Feature: First step and unsaved changes

  # First step and unsaved changes 1
  # When editing, the Primer paso field with another value is a change; with the same
  # value, it is not.
  Scenario Outline: First step and unsaved changes 1
    Given I open the panel to edit the task <title> with first step <first_step>
    When I type <value> in the field <field>
    And I tap the X of the panel
    Then what stays open is <open>

    Examples:
      | title  | first_step             | field       | value                  | open                            |
      | Lavar  | Separar la ropa blanca | Primer paso | Juntar las llaves      | el panel con el aviso de cierre |
      | Lavar  | Separar la ropa blanca | Primer paso | Separar la ropa blanca | nada                            |

  # First step and unsaved changes 2
  # Typing and going back to the original value does not count as a change; going back to another
  # value does.
  Scenario Outline: First step and unsaved changes 2
    Given I open the panel to edit the task <title> with first step <first_step>
    When I type <first> in the field <field>
    And I type <second> in the field <field>
    And I tap the X of the panel
    Then what stays open is <open>

    Examples:
      | title  | first_step             | field       | first             | second                 | open                            |
      | Lavar  | Separar la ropa blanca | Primer paso | Juntar las llaves | Separar la ropa blanca | nada                            |
      | Lavar  | Separar la ropa blanca | Primer paso | Juntar las llaves | Buscar el detergente   | el panel con el aviso de cierre |

  # First step and unsaved changes 3
  # The spaces that Guardar trims do not count: the same value with spaces
  # around it is not a change (row 1); another value is (row 2).
  Scenario Outline: First step and unsaved changes 3
    Given I open the panel to edit the task <title> with first step <first_step>
    When I type <value> with spaces around it in the field <field>
    And I tap the X of the panel
    Then what stays open is <open>

    Examples:
      | title  | first_step             | field       | value                  | open                            |
      | Lavar  | Separar la ropa blanca | Primer paso | Separar la ropa blanca | nada                            |
      | Lavar  | Separar la ropa blanca | Primer paso | Juntar las llaves      | el panel con el aviso de cierre |

  # First step and unsaved changes 4
  # Emptying an existing first step counts as a change.
  Scenario Outline: First step and unsaved changes 4
    Given I open the panel to edit the task <title> with first step <first_step>
    When I clear the field <field>
    And I tap the X of the panel
    Then what stays open is <open>

    Examples:
      | title  | first_step             | field       | open                            |
      | Lavar  | Separar la ropa blanca | Primer paso | el panel con el aviso de cierre |

  # First step and unsaved changes 5
  # Only spaces in an existing first step is emptying it: it counts as a change.
  Scenario Outline: First step and unsaved changes 5
    Given I open the panel to edit the task <title> with first step <first_step>
    When I type only spaces in the field <field>
    And I tap the X of the panel
    Then what stays open is <open>

    Examples:
      | title  | first_step             | field       | open                            |
      | Lavar  | Separar la ropa blanca | Primer paso | el panel con el aviso de cierre |

  # First step and unsaved changes 6
  # On a task without a first step, typing one is a change.
  Scenario Outline: First step and unsaved changes 6
    Given I open the panel to edit the task <title> with note <note>
    When I type <value> in the field <field>
    And I tap the X of the panel
    Then what stays open is <open>

    Examples:
      | title  | note | field       | value                  | open                            |
      | Lavar  | Luz  | Primer paso | Separar la ropa blanca | el panel con el aviso de cierre |

  # First step and unsaved changes 7
  # Without a first step, only spaces does not count.
  Scenario Outline: First step and unsaved changes 7
    Given I open the panel to edit the task <title> with note <note>
    When I type only spaces in the field <field>
    And I tap the X of the panel
    Then what stays open is <open>

    Examples:
      | title  | note | field       | open    |
      | Lavar  | Luz  | Primer paso | nada    |

  # First step and unsaved changes 8
  # When creating, the field starts empty: typing something is loading something.
  Scenario Outline: First step and unsaved changes 8
    Given I open the panel to create a task
    When I type <value> in the field <field>
    And I tap the X of the panel
    Then what stays open is <open>

    Examples:
      | field       | value                  | open                            |
      | Primer paso | Separar la ropa blanca | el panel con el aviso de cierre |

  # First step and unsaved changes 9
  # When creating, only spaces closes directly.
  Scenario Outline: First step and unsaved changes 9
    Given I open the panel to create a task
    When I type only spaces in the field <field>
    And I tap the X of the panel
    Then what stays open is <open>

    Examples:
      | field       | open    |
      | Primer paso | nada    |
