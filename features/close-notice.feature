# mutation-stamp: sha256=b367f1895e076295353a3ceb025a6598c02d43a0d0cbeca9eac42e332a07934c
# acceptance-mutation-manifest-begin
# {"version":1,"tested_at":"2026-11-22T21:43:00.850241815Z","feature_name":"Close notice","feature_path":"features/close-notice.feature","background_hash":"74234e98afe7498fb5daf1f36ac2d78acc339464f950703b8c019892f982b90b","implementation_hash":"sha256:7ad747c9cff901b5386a49b36a3db472730a4e60415e5d2e77f1f615c0439de0","scenarios":[{"index":0,"name":"Close notice 1","scenario_hash":"b89016a0c6d37c06e2680390d839b21a360d9a9cee651c73e9895bd9a2bad55b","mutation_count":4,"result":{"Total":4,"Killed":4,"Survived":0,"Errors":0},"tested_at":"2026-11-22T21:43:00.850241815Z"},{"index":1,"name":"Close notice 2","scenario_hash":"76718da64a9eb88bd8902a0a386c500abcd96b645f753b328bfc535cafd20b03","mutation_count":3,"result":{"Total":3,"Killed":3,"Survived":0,"Errors":0},"tested_at":"2026-11-22T21:43:00.850241815Z"},{"index":2,"name":"Close notice 3","scenario_hash":"167de32c0a927f2437380d2be9b5b9a428aa243f915b0674a6e85c7e3e06773b","mutation_count":5,"result":{"Total":5,"Killed":5,"Survived":0,"Errors":0},"tested_at":"2026-11-22T21:43:00.850241815Z"},{"index":3,"name":"Close notice 4","scenario_hash":"0f9983db002b02b9d166ea5024cd888128475f39c9d93befa4d7d7a172b15789","mutation_count":10,"result":{"Total":10,"Killed":10,"Survived":0,"Errors":0},"tested_at":"2026-11-22T21:43:00.850241815Z"},{"index":4,"name":"Close notice 5","scenario_hash":"ad8a3a8ae7d17dbc45dbde484d0cc01d2414ee4965686e966b2e8b76430c0891","mutation_count":3,"result":{"Total":3,"Killed":3,"Survived":0,"Errors":0},"tested_at":"2026-11-22T21:43:00.850241815Z"},{"index":5,"name":"Close notice 6","scenario_hash":"3a527a1d862122ae1850af50073347156f0543cc0d5ff128d958bea83bff28f3","mutation_count":3,"result":{"Total":3,"Killed":3,"Survived":0,"Errors":0},"tested_at":"2026-11-22T21:43:00.850241815Z"},{"index":6,"name":"Close notice 7","scenario_hash":"a6d1a116ba009938d7e2e7ee70cb57740eab106309dfa89685d0af6a7823de41","mutation_count":5,"result":{"Total":5,"Killed":5,"Survived":0,"Errors":0},"tested_at":"2026-11-22T21:43:00.850241815Z"},{"index":7,"name":"Close notice 9","scenario_hash":"cbd13165ce6c3031ae39f859282d6f4a0bc85d4f5ca7f83f26339447d993d3b4","mutation_count":2,"result":{"Total":2,"Killed":2,"Survived":0,"Errors":0},"tested_at":"2026-11-22T21:43:00.850241815Z"},{"index":8,"name":"Close notice 10","scenario_hash":"ea9acfaf1e3ebfacdaf38c857882cdd64028512332ba4bab12c853b2fcfd9233","mutation_count":2,"result":{"Total":2,"Killed":2,"Survived":0,"Errors":0},"tested_at":"2026-11-22T21:43:00.850241815Z"},{"index":9,"name":"Close notice 11","scenario_hash":"c8aa7f4dc88ee68f580f3599776d6ee9aee2dc0145ee8b37e6834fdc33f4020e","mutation_count":1,"result":{"Total":1,"Killed":1,"Survived":0,"Errors":0},"tested_at":"2026-11-22T21:43:00.850241815Z"}]}
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
# QA suite (qa/unsaved-changes.md).
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
