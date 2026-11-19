# mutation-stamp: sha256=6fe8cf93f493c5e446c3d40310bac0635e882f7fa311be4ad0d691c23e7a19c7
# acceptance-mutation-manifest-begin
# {"version":1,"tested_at":"2026-11-17T20:49:23.800989888Z","feature_name":"Aviso de cierre","feature_path":"features/aviso-de-cierre.feature","background_hash":"74234e98afe7498fb5daf1f36ac2d78acc339464f950703b8c019892f982b90b","implementation_hash":"sha256:da0363d79f823c9608e1f82148dcfae5754d85853061a83512618467acf1f579","scenarios":[{"index":0,"name":"Aviso de cierre 1","scenario_hash":"2c95f933e2bd4c15695c11251903fdba969c13ccf5ac340e0c8fff4efd566e83","mutation_count":4,"result":{"Total":4,"Killed":4,"Survived":0,"Errors":0},"tested_at":"2026-11-17T20:49:23.800989888Z"},{"index":1,"name":"Aviso de cierre 2","scenario_hash":"c850fbbc6641596939251b2297f422a2d85febe692af951e7ba7b4757b17d66b","mutation_count":3,"result":{"Total":3,"Killed":3,"Survived":0,"Errors":0},"tested_at":"2026-11-17T20:49:23.800989888Z"},{"index":2,"name":"Aviso de cierre 3","scenario_hash":"560478dcf16bcb1b1fd8cf2db24526e05b6fde376985b2b0d449446dcb899791","mutation_count":5,"result":{"Total":5,"Killed":5,"Survived":0,"Errors":0},"tested_at":"2026-11-17T20:49:23.800989888Z"},{"index":3,"name":"Aviso de cierre 4","scenario_hash":"479c7adf60f9c93521c5d7acc160639f45c52a365a500e2a9fa22513e3bbc9fe","mutation_count":10,"result":{"Total":10,"Killed":10,"Survived":0,"Errors":0},"tested_at":"2026-11-17T20:49:23.800989888Z"},{"index":4,"name":"Aviso de cierre 5","scenario_hash":"f683a2e4562d60112f3629e1085bcc68a23968c267a757ff181fcd635993c839","mutation_count":3,"result":{"Total":3,"Killed":3,"Survived":0,"Errors":0},"tested_at":"2026-11-17T20:49:23.800989888Z"},{"index":5,"name":"Aviso de cierre 6","scenario_hash":"c093cec33b3b155fc6029674f7cbda2918c8bbb914e249f7d23b5cf214814b23","mutation_count":3,"result":{"Total":3,"Killed":3,"Survived":0,"Errors":0},"tested_at":"2026-11-17T20:49:23.800989888Z"},{"index":6,"name":"Aviso de cierre 7","scenario_hash":"7038b3f841ef57b24c0f5af7316144af2cbc3c9d30133fd30aae431fbd8db8af","mutation_count":5,"result":{"Total":5,"Killed":5,"Survived":0,"Errors":0},"tested_at":"2026-11-17T20:49:23.800989888Z"},{"index":7,"name":"Aviso de cierre 9","scenario_hash":"fa79c2053c46373a4ccd379a3c710a0f7e3dd00ea15d730bf8ea8a6092d3accd","mutation_count":2,"result":{"Total":2,"Killed":2,"Survived":0,"Errors":0},"tested_at":"2026-11-17T20:49:23.800989888Z"},{"index":8,"name":"Aviso de cierre 10","scenario_hash":"53b17c1302a16b6708ee559907dc32ba4d4e82d76a93fb9514fcfda8f851a1ab","mutation_count":2,"result":{"Total":2,"Killed":2,"Survived":0,"Errors":0},"tested_at":"2026-11-17T20:49:23.800989888Z"},{"index":9,"name":"Aviso de cierre 11","scenario_hash":"c387cf12a46cb93a6c2b9a567d17ae46354a12b318c3b9cf3c2ef64f2a70742f","mutation_count":1,"result":{"Total":1,"Killed":1,"Survived":0,"Errors":0},"tested_at":"2026-11-17T20:49:23.800989888Z"}]}
# acceptance-mutation-manifest-end

# Spec §6.2 (Close notice, If Guardar fails, Notices open over the
# panel, If another device deletes the task, Descartar and Recientes) and §7
# (Deleting tasks: the deletion wins). Closing with the X (or Atrás, see
# atras-del-panel.feature) with changes opens the notice "Tenés cambios sin
# guardar" with three buttons: Seguir editando (leaves the panel as it was),
# Descartar (closes without saving) and Guardar (saves and, if it saves, closes).
# What counts as "there are changes" is in cambios-sin-guardar.feature. What
# stays open is given by "what stays open is": nothing, the panel, or the panel with the notice.
# That notices open over the panel, block what is below and, when closed, return
# to the same tab without losing anything (what is seen) is verified in the
# QA suite (qa/cambios-sin-guardar.md).
Feature: Close notice

  # Close notice 1
  # The notice says what happens and offers the three buttons, when editing and when creating.
  Scenario Outline: Close notice 1
    Given I open the panel to edit the task <title> with note <note>
    When I type <value> in the field <field>
    And I tap the X of the panel
    Then what stays open is <open>
    And the notice says <message>
    And the notice offers <buttons>

    Examples:
      | title  | note | field  | value     | message                   | buttons                             | open                            |
      | Pagar  | Luz  | Título | Pagar luz | Tenés cambios sin guardar | Seguir editando, Descartar, Guardar | el panel con el aviso de cierre |

  # Close notice 2
  Scenario Outline: Close notice 2
    Given I open the panel to create a task
    When I type <value> in the field <field>
    And I tap the X of the panel
    Then what stays open is <open>
    And the notice offers <buttons>

    Examples:
      | field  | value | buttons                             | open                            |
      | Título | Pagar | Seguir editando, Descartar, Guardar | el panel con el aviso de cierre |

  # Close notice 3
  # Seguir editando closes the notice and leaves the panel as it was, with what
  # was typed, unsaved.
  Scenario Outline: Close notice 3
    Given I open the panel to edit the task <title> with note <note>
    When I type <value> in the field <field>
    And I tap the X of the panel
    And I tap <button> in the notice
    Then what stays open is <open>
    And the field <field> still has <value>
    And the task has title <stored>

    Examples:
      | title  | note | field  | value     | button          | open      | stored   |
      | Pagar  | Luz  | Título | Pagar luz | Seguir editando | el panel  | Pagar    |

  # Close notice 4
  # Descartar closes the panel without saving; Guardar saves and closes.
  Scenario Outline: Close notice 4
    Given I open the panel to edit the task <title> with note <note>
    When I type <value> in the field <field>
    And I tap the X of the panel
    And I tap <button> in the notice
    Then what stays open is <open>
    And the task has title <stored>

    Examples:
      | title  | note | field  | value     | button    | open    | stored    |
      | Pagar  | Luz  | Título | Pagar luz | Descartar | nada    | Pagar     |
      | Pagar  | Luz  | Título | Pagar luz | Guardar   | nada    | Pagar luz |

  # Close notice 5
  # When creating, Descartar creates nothing.
  Scenario Outline: Close notice 5
    Given I open the panel to create a task
    When I type <value> in the field <field>
    And I tap the X of the panel
    And I tap <button> in the notice
    Then what stays open is <open>
    And no task remains

    Examples:
      | field  | value | button    | open    |
      | Título | Pagar | Descartar | nada    |

  # Close notice 6
  # When creating, Guardar creates the task and closes.
  Scenario Outline: Close notice 6
    Given I open the panel to create a task
    When I type <value> in the field <field>
    And I tap the X of the panel
    And I tap <button> in the notice
    Then what stays open is <open>
    And a one-off task is created with title <value>

    Examples:
      | field  | value | button  | open    |
      | Título | Pagar | Guardar | nada    |

  # Close notice 7
  # If Guardar fails validation, nothing is closed: the notice closes and
  # the panel stays open with what was typed; the task does not change. Empty title.
  Scenario Outline: Close notice 7
    Given I open the panel to edit the task <title> with note <note>
    When I clear the field <field>
    And I tap the X of the panel
    And I tap <button> in the notice
    Then what stays open is <open>
    And the task has title <stored>

    Examples:
      | title  | note | field  | button  | open     | stored   |
      | Pagar  | Luz  | Título | Guardar | el panel | Pagar    |

  # Close notice 9
  # If another device deletes the task with the notice open, the notice and
  # the panel close without asking anything (the deletion wins).
  Scenario Outline: Close notice 9
    Given I open the panel to edit the task <title> with note <note>
    When I type <value> in the field <field>
    And I tap the X of the panel
    And another device, without seeing that change, deletes the task
    Then what stays open is <open>
    And there is no task <title>

    Examples:
      | title  | note | field  | value     | open    |
      | Pagar  | Luz  | Título | Pagar luz | nada    |

  # Close notice 10
  # If another device deletes the task with the panel open and unsaved
  # changes, the panel closes without asking anything.
  Scenario Outline: Close notice 10
    Given I open the panel to edit the task <title> with note <note>
    When I type <value> in the field <field>
    And another device, without seeing that change, deletes the task
    Then what stays open is <open>

    Examples:
      | title  | note | field  | value     | open    |
      | Pagar  | Luz  | Título | Pagar luz | nada    |

  # Close notice 11
  # Descartar does not remove from Recientes an emoji chosen in the panel.
  Scenario Outline: Close notice 11
    Given there are no recent emojis
    And I open the panel to create a task
    When I choose an emoji that was not among the recent ones
    And I tap the X of the panel
    And I tap <button> in the notice
    Then the first one is the one I chose

    Examples:
      | button    |
      | Descartar |
