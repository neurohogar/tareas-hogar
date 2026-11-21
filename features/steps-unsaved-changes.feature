# mutation-stamp: sha256=05ad7144a3b5b15962e1435241013eae6a1dd5cfde75cee827b7bb3eef95d1a3
# acceptance-mutation-manifest-begin
# {"version":1,"tested_at":"2026-11-19T12:48:04.951967716Z","feature_name":"Steps and unsaved changes","feature_path":"features/steps-unsaved-changes.feature","background_hash":"74234e98afe7498fb5daf1f36ac2d78acc339464f950703b8c019892f982b90b","implementation_hash":"sha256:71ad0c8cd1a6980b9e16a50a2ce450fc8a86825f78dc16c65c54496bcf560dc7","scenarios":[{"index":0,"name":"Steps and unsaved changes 1","scenario_hash":"fa3be5ff354c63dbcd8fbce059716a1125bea8b5e40d08c6af66a557c08cebe7","mutation_count":6,"result":{"Total":6,"Killed":6,"Survived":0,"Errors":0},"tested_at":"2026-11-19T12:48:04.951967716Z"},{"index":1,"name":"Steps and unsaved changes 2","scenario_hash":"b9191456547e27f666f4e4bac7b84050f614880ea9043f120ec3ca88651a5f81","mutation_count":6,"result":{"Total":6,"Killed":6,"Survived":0,"Errors":0},"tested_at":"2026-11-19T12:48:04.951967716Z"},{"index":2,"name":"Steps and unsaved changes 3","scenario_hash":"f2bed19aa7f042f38757b23d5cb48fbf4808feeb7f3e56bd552c45b60ee4cbc8","mutation_count":5,"result":{"Total":5,"Killed":5,"Survived":0,"Errors":0},"tested_at":"2026-11-19T12:48:04.951967716Z"},{"index":3,"name":"Steps and unsaved changes 4","scenario_hash":"4c6cb04926ef437788b439c1a44150b6fa92c93994b182a01a85d9882a1bf61c","mutation_count":2,"result":{"Total":2,"Killed":2,"Survived":0,"Errors":0},"tested_at":"2026-11-19T12:48:04.951967716Z"},{"index":4,"name":"Steps and unsaved changes 5","scenario_hash":"b2d32869b8f670cb8b37bdfbf5da22b78a68824dafbb8135fa3bee237b121047","mutation_count":2,"result":{"Total":2,"Killed":2,"Survived":0,"Errors":0},"tested_at":"2026-11-19T12:48:04.951967716Z"},{"index":5,"name":"Steps and unsaved changes 6","scenario_hash":"dfd58b2478b2bd5b2aee0d0b050585efc79d77c2d13c9415611fcb6a5d5b5373","mutation_count":1,"result":{"Total":1,"Killed":1,"Survived":0,"Errors":0},"tested_at":"2026-11-19T12:48:04.951967716Z"},{"index":6,"name":"Steps and unsaved changes 7","scenario_hash":"068fd95b3979fa865020feabeaeea2881bd591e9e2977ef12c1dc47b7c087ac7","mutation_count":2,"result":{"Total":2,"Killed":2,"Survived":0,"Errors":0},"tested_at":"2026-11-19T12:48:04.951967716Z"},{"index":7,"name":"Steps and unsaved changes 8","scenario_hash":"8298a49aa8792cc61e238f01e42ae54f1f5a60f165bcaba61f75952a049e350d","mutation_count":2,"result":{"Total":2,"Killed":2,"Survived":0,"Errors":0},"tested_at":"2026-11-19T12:48:04.951967716Z"},{"index":8,"name":"Steps and unsaved changes 9","scenario_hash":"4450905fb1e8789f95b04d090cb6b72a2e492ea0c21103678a1807dfb26c5966","mutation_count":2,"result":{"Total":2,"Killed":2,"Survived":0,"Errors":0},"tested_at":"2026-11-19T12:48:04.951967716Z"},{"index":9,"name":"Steps and unsaved changes 10","scenario_hash":"42d8ee52a24af938c4d9548ea654293b2e57d5bf068f71786f5d86a86a239f23","mutation_count":2,"result":{"Total":2,"Killed":2,"Survived":0,"Errors":0},"tested_at":"2026-11-19T12:48:04.951967716Z"},{"index":10,"name":"Steps and unsaved changes 11","scenario_hash":"7950ca4d326dc5dc55100703afb957ac768af9e4046f36337f507533dc7e362b","mutation_count":2,"result":{"Total":2,"Killed":2,"Survived":0,"Errors":0},"tested_at":"2026-11-19T12:48:04.951967716Z"},{"index":11,"name":"Steps and unsaved changes 12","scenario_hash":"af02a0fc66ae7f6bbfa3407bcdedbbf997a7831701a0a10e092287c5bef3b12a","mutation_count":1,"result":{"Total":1,"Killed":1,"Survived":0,"Errors":0},"tested_at":"2026-11-19T12:48:04.951967716Z"}]}
# acceptance-mutation-manifest-end

# Spec §6.2 (Unsaved changes with the steps). The additional steps go as
# fields «Paso 2», «Paso 3»… below the first step. Adding, removing or changing
# a step counts; typing and going back to the original value does not count, nor do the
# spaces that Guardar trims nor an empty step that Guardar discards.
Feature: Steps and unsaved changes

  # Steps and unsaved changes 1
  # Changing a step is a change; typing the same value is not.
  Scenario Outline: Steps and unsaved changes 1
    Given I open the panel to edit the task <title> with the steps <steps>
    When I type <value> in the field <field>
    And I tap the X of the panel
    Then what stays open is <open>

    Examples:
      | title  | steps                                       | field  | value               | open                            |
      | Lavar  | Separar la ropa blanca, Poner el lavarropas | Paso 2 | Juntar las llaves   | el panel con el aviso de cierre |
      | Lavar  | Separar la ropa blanca, Poner el lavarropas | Paso 2 | Poner el lavarropas | nada                            |

  # Steps and unsaved changes 2
  # Typing and going back to the original value does not count; going back to another value does.
  Scenario Outline: Steps and unsaved changes 2
    Given I open the panel to edit the task <title> with the steps <steps>
    When I type <first> in the field <field>
    And I type <second> in the field <field>
    And I tap the X of the panel
    Then what stays open is <open>

    Examples:
      | title  | steps                                       | field  | first             | second               | open                            |
      | Lavar  | Separar la ropa blanca, Poner el lavarropas | Paso 2 | Juntar las llaves | Poner el lavarropas  | nada                            |
      | Lavar  | Separar la ropa blanca, Poner el lavarropas | Paso 2 | Juntar las llaves | Buscar el detergente | el panel con el aviso de cierre |

  # Steps and unsaved changes 3
  # The spaces that Guardar trims do not count: the same value with spaces
  # around it is not a change (row 1); another value is (row 2).
  Scenario Outline: Steps and unsaved changes 3
    Given I open the panel to edit the task <title> with the steps <steps>
    When I type <value> with spaces around it in the field <field>
    And I tap the X of the panel
    Then what stays open is <open>

    Examples:
      | title  | steps                                       | field  | value               | open                            |
      | Lavar  | Separar la ropa blanca, Poner el lavarropas | Paso 2 | Poner el lavarropas | nada                            |
      | Lavar  | Separar la ropa blanca, Poner el lavarropas | Paso 2 | Juntar las llaves   | el panel con el aviso de cierre |

  # Steps and unsaved changes 4
  # Emptying an existing step counts as a change.
  Scenario Outline: Steps and unsaved changes 4
    Given I open the panel to edit the task <title> with the steps <steps>
    When I clear the field <field>
    And I tap the X of the panel
    Then what stays open is <open>

    Examples:
      | title  | steps                                       | field  | open                            |
      | Lavar  | Separar la ropa blanca, Poner el lavarropas | Paso 2 | el panel con el aviso de cierre |

  # Steps and unsaved changes 5
  # Only spaces in an existing step is emptying it: it counts as a change.
  Scenario Outline: Steps and unsaved changes 5
    Given I open the panel to edit the task <title> with the steps <steps>
    When I type only spaces in the field <field>
    And I tap the X of the panel
    Then what stays open is <open>

    Examples:
      | title  | steps                                       | field  | open                            |
      | Lavar  | Separar la ropa blanca, Poner el lavarropas | Paso 2 | el panel con el aviso de cierre |

  # Steps and unsaved changes 6
  # Adding a step and not typing it does not count: Guardar discards the empty one.
  Scenario Outline: Steps and unsaved changes 6
    Given I open the panel to edit the task <title> with the steps <steps>
    When I tap Agregar paso
    And I tap the X of the panel
    Then what stays open is <open>

    Examples:
      | title  | steps                                       | open    |
      | Lavar  | Separar la ropa blanca, Poner el lavarropas | nada    |

  # Steps and unsaved changes 7
  # Adding a step and typing it does count.
  Scenario Outline: Steps and unsaved changes 7
    Given I open the panel to edit the task <title> with the steps <steps>
    When I tap Agregar paso
    And I type <value> in the field <field>
    And I tap the X of the panel
    Then what stays open is <open>

    Examples:
      | title  | steps                                       | field  | value          | open                            |
      | Lavar  | Separar la ropa blanca, Poner el lavarropas | Paso 3 | Tender la ropa | el panel con el aviso de cierre |

  # Steps and unsaved changes 8
  # Adding a step and typing only spaces does not count.
  Scenario Outline: Steps and unsaved changes 8
    Given I open the panel to edit the task <title> with the steps <steps>
    When I tap Agregar paso
    And I type only spaces in the field <field>
    And I tap the X of the panel
    Then what stays open is <open>

    Examples:
      | title  | steps                                       | field  | open    |
      | Lavar  | Separar la ropa blanca, Poner el lavarropas | Paso 3 | nada    |

  # Steps and unsaved changes 9
  # Removing an existing step counts as a change.
  Scenario Outline: Steps and unsaved changes 9
    Given I open the panel to edit the task <title> with the steps <steps>
    When I tap Quitar in the field <field>
    And I tap the X of the panel
    Then what stays open is <open>

    Examples:
      | title  | steps                                       | field  | open                            |
      | Lavar  | Separar la ropa blanca, Poner el lavarropas | Paso 2 | el panel con el aviso de cierre |

  # Steps and unsaved changes 10
  # Adding a step and removing it again goes back to the original: it does not count.
  Scenario Outline: Steps and unsaved changes 10
    Given I open the panel to edit the task <title> with the steps <steps>
    When I tap Agregar paso
    And I tap Quitar in the field <field>
    And I tap the X of the panel
    Then what stays open is <open>

    Examples:
      | title  | steps                                       | field  | open    |
      | Lavar  | Separar la ropa blanca, Poner el lavarropas | Paso 3 | nada    |

  # Steps and unsaved changes 11
  # When creating, adding a step and typing it is loading something.
  Scenario Outline: Steps and unsaved changes 11
    Given I open the panel to create a task
    When I tap Agregar paso
    And I type <value> in the field <field>
    And I tap the X of the panel
    Then what stays open is <open>

    Examples:
      | field  | value               | open                            |
      | Paso 2 | Poner el lavarropas | el panel con el aviso de cierre |

  # Steps and unsaved changes 12
  # When creating, adding a step and not typing it closes directly.
  Scenario Outline: Steps and unsaved changes 12
    Given I open the panel to create a task
    When I tap Agregar paso
    And I tap the X of the panel
    Then what stays open is <open>

    Examples:
      | open    |
      | nada    |
