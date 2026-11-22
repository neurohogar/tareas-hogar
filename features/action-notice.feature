# mutation-stamp: sha256=f4a98436ea17282b696f08672cb2ddc4c72addcc02cf9fe647b039282b31dbbe
# acceptance-mutation-manifest-begin
# {"version":1,"tested_at":"2026-11-22T21:42:41.630547675Z","feature_name":"Action notice","feature_path":"features/action-notice.feature","background_hash":"74234e98afe7498fb5daf1f36ac2d78acc339464f950703b8c019892f982b90b","implementation_hash":"sha256:de225f4c745316df3d345c0a4c968b965228909338f9d4bbc2992be6f801d13a","scenarios":[{"index":0,"name":"Action notice 1","scenario_hash":"c0b97cdaa2a7c75f6afabfd02fd45d302b68c1463eec1570421508ecc40606a0","mutation_count":3,"result":{"Total":3,"Killed":3,"Survived":0,"Errors":0},"tested_at":"2026-11-22T21:42:41.630547675Z"},{"index":1,"name":"Action notice 2","scenario_hash":"a187774e6ff08d539a6d07421d0da1c1284e179188ea0679a4a1413bf07175cb","mutation_count":13,"result":{"Total":13,"Killed":13,"Survived":0,"Errors":0},"tested_at":"2026-11-22T21:42:41.630547675Z"},{"index":2,"name":"Action notice 3","scenario_hash":"2137aedf273d5da07a758c2ca887e7a30eeadb41be358ecc66402b73abbb2a23","mutation_count":22,"result":{"Total":22,"Killed":22,"Survived":0,"Errors":0},"tested_at":"2026-11-22T21:42:41.630547675Z"},{"index":3,"name":"Action notice 4","scenario_hash":"e546d318cc5afa7c8f71f384b6f502e63eff6b847c2bf6b79c12b4f6911f089e","mutation_count":4,"result":{"Total":4,"Killed":4,"Survived":0,"Errors":0},"tested_at":"2026-11-22T21:42:41.630547675Z"},{"index":4,"name":"Action notice 5","scenario_hash":"dd04baf42bf2ba69ce8e86a0bea988b80671041790d45af870e038fc1a1b5eec","mutation_count":8,"result":{"Total":8,"Killed":8,"Survived":0,"Errors":0},"tested_at":"2026-11-22T21:42:41.630547675Z"},{"index":5,"name":"Action notice 6","scenario_hash":"a70630b60d52f59e0762ff70920d160dde1504edb137552831447c36cda20d6c","mutation_count":4,"result":{"Total":4,"Killed":4,"Survived":0,"Errors":0},"tested_at":"2026-11-22T21:42:41.630547675Z"},{"index":6,"name":"Action notice 7","scenario_hash":"049955bdd1cdba1d4b07e6ab93eae70537da74d2e49b64effc83c474799054ac","mutation_count":12,"result":{"Total":12,"Killed":12,"Survived":0,"Errors":0},"tested_at":"2026-11-22T21:42:41.630547675Z"},{"index":7,"name":"Action notice 8","scenario_hash":"df5fda90b2480874d447f9fd0b5e1a7404e06420766b17d2c8b8e5163d4705c4","mutation_count":44,"result":{"Total":44,"Killed":44,"Survived":0,"Errors":0},"tested_at":"2026-11-22T21:42:41.630547675Z"},{"index":8,"name":"Action notice 9","scenario_hash":"025c26a157a04ab82b710e18e0791919bec0bf51049704649b65fb2affb79051","mutation_count":7,"result":{"Total":7,"Killed":7,"Survived":0,"Errors":0},"tested_at":"2026-11-22T21:42:41.630547675Z"},{"index":9,"name":"Action notice 10","scenario_hash":"873846284eb36acb6981fdbec7f258e16fab0023ea07433a83eba1e64b270a82","mutation_count":6,"result":{"Total":6,"Killed":6,"Survived":0,"Errors":0},"tested_at":"2026-11-22T21:42:41.630547675Z"},{"index":10,"name":"Action notice 11","scenario_hash":"6933df0fb53d9db44d45132203e5afa276d0412f3940fdff46c2f5a3558006c0","mutation_count":5,"result":{"Total":5,"Killed":5,"Survived":0,"Errors":0},"tested_at":"2026-11-22T21:42:41.630547675Z"},{"index":11,"name":"Action notice 12","scenario_hash":"dd5c811017cd9d5515472078cfc2938c0d4cbb1e81569b6d028f8cc839ad4632","mutation_count":5,"result":{"Total":5,"Killed":5,"Survived":0,"Errors":0},"tested_at":"2026-11-22T21:42:41.630547675Z"},{"index":12,"name":"Action notice 13","scenario_hash":"94f8d36c21942b38324ee3cb22865345febc714f91b5b61c1b65cc9d11399852","mutation_count":5,"result":{"Total":5,"Killed":5,"Survived":0,"Errors":0},"tested_at":"2026-11-22T21:42:41.630547675Z"},{"index":13,"name":"Action notice 14","scenario_hash":"8ed92d435433ff4015cdd062a05d486cb53198ef4af325520a6b4fc46ca09328","mutation_count":4,"result":{"Total":4,"Killed":4,"Survived":0,"Errors":0},"tested_at":"2026-11-22T21:42:41.630547675Z"},{"index":14,"name":"Action notice 15","scenario_hash":"9d29675697e46ccfe2e5ada93f274205e9422214131938cb4d2caf367166a76f","mutation_count":10,"result":{"Total":10,"Killed":10,"Survived":0,"Errors":0},"tested_at":"2026-11-22T21:42:41.630547675Z"},{"index":15,"name":"Action notice 16","scenario_hash":"ea91b30c91a35db2decf01060ed5f8eb5b0ff0012c6e93b87430ab476b14709b","mutation_count":4,"result":{"Total":4,"Killed":4,"Survived":0,"Errors":0},"tested_at":"2026-11-22T21:42:41.630547675Z"},{"index":16,"name":"Action notice 17","scenario_hash":"aa9455a0cc13a79e26841b3170452b2663ca29dd94a49bce81c3d3eebe2879a9","mutation_count":4,"result":{"Total":4,"Killed":4,"Survived":0,"Errors":0},"tested_at":"2026-11-22T21:42:41.630547675Z"}]}
# acceptance-mutation-manifest-end

# Spec §6.2 (Action notice, If what is saved makes the action meaningless, The
# action notice stays up to date, If Guardar fails, Borrar tarea), §5.8
# (Pausar) and §5.9 (Posponer). Pausar, Reanudar, Posponer (1 hora, 3 horas,
# Hasta mañana) and Quitar posponer with unsaved changes open the notice
# "Tenés cambios sin guardar" with Seguir editando, Descartar y <action> and
# Guardar y <action>; without changes they act right away. "Now" in §5.8 and §5.9
# is the moment the notice button is tapped. If what is saved makes the action
# meaningless, the notice says "Con estos cambios la tarea ya no se puede <action>" and
# does not offer Guardar y <action>. Borrar tarea does not add this notice. What counts
# as "there are changes" is in cambios-sin-guardar.feature.
# The panel actions are Pausar, Reanudar, "Posponer 1 hora", "Posponer 3
# horas", "Posponer hasta mañana", Quitar posponer and Borrar tarea.
Feature: Action notice

  # Action notice 1
  # Without changes, the action acts right away and closes the panel.
  Scenario Outline: Action notice 1
    Given a relative recurring task Regar every <every> <unit>
    When I open the task in the edit panel on <now>
    And I choose the action <action> on <now>
    Then what stays open is <open>
    And the task is paused

    Examples:
      | every | unit   | now                 | action | open    |
      | 2    | dias   | 2026-07-15T08:00:00 | Pausar | nada    |

  # Action notice 2
  Scenario Outline: Action notice 2
    Given a one-off task without a due date
    When I open the task in the edit panel on <now>
    And I choose the action <action> on <now>
    Then what stays open is <open>
    And the task is postponed from <from> to <to>

    Examples:
      | now                 | action              | open    | from                | to                  |
      | 2026-07-15T08:00:00 | Posponer 1 hora     | nada    | 2026-07-15T08:00:00 | 2026-07-15T09:00:00 |

  # Action notice 3
  # With changes, each action opens the notice with the three buttons; for postponing,
  # the button names the option tapped.
  Scenario Outline: Action notice 3
    Given a relative recurring task Regar every <every> <unit>
    When I open the task in the edit panel on <now>
    And I type <value> in the field <field>
    And I choose the action <action> on <now>
    Then what stays open is <open>
    And the notice says <message>
    And the notice offers <buttons>

    Examples:
      | every | unit   | now                 | field  | value         | action                   | message                   | buttons                                                                      | open                            |
      | 2    | dias   | 2026-07-15T08:00:00 | Título | Regar plantas | Pausar                   | Tenés cambios sin guardar | Seguir editando, Descartar y pausar, Guardar y pausar                        | el panel con el aviso de acción |
      | 2    | dias   | 2026-07-15T08:00:00 | Título | Regar plantas | Posponer 1 hora          | Tenés cambios sin guardar | Seguir editando, Descartar y posponer 1 hora, Guardar y posponer 1 hora      | el panel con el aviso de acción |
      | 2    | dias   | 2026-07-15T08:00:00 | Título | Regar plantas | Posponer 3 horas         | Tenés cambios sin guardar | Seguir editando, Descartar y posponer 3 horas, Guardar y posponer 3 horas    | el panel con el aviso de acción |
      | 2    | dias   | 2026-07-15T08:00:00 | Título | Regar plantas | Posponer hasta mañana    | Tenés cambios sin guardar | Seguir editando, Descartar y posponer hasta mañana, Guardar y posponer hasta mañana | el panel con el aviso de acción |

  # Action notice 4
  Scenario Outline: Action notice 4
    Given a relative recurring task Regar every <every> <unit>
    And the task Regar was paused
    When I open the task in the edit panel on <now>
    And I type <value> in the field <field>
    And I choose the action <action> on <now>
    Then what stays open is <open>
    And the notice offers <buttons>

    Examples:
      | every | unit   | now                 | field  | value         | action   | buttons                                                   | open                            |
      | 2    | dias   | 2026-07-15T08:00:00 | Título | Regar plantas | Reanudar | Seguir editando, Descartar y reanudar, Guardar y reanudar | el panel con el aviso de acción |

  # Action notice 5
  Scenario Outline: Action notice 5
    Given a one-off task without a due date
    And the task was postponed with option <option> on <postponed>
    When I open the task in the edit panel on <now>
    And I type <value> in the field <field>
    And I choose the action <action> on <now>
    Then what stays open is <open>
    And the notice offers <buttons>

    Examples:
      | option  | postponed           | now                 | field | value | action           | buttons                                                                   | open                            |
      | 3 horas | 2026-07-15T08:00:00 | 2026-07-15T08:30:00 | Nota  | Luz   | Quitar posponer  | Seguir editando, Descartar y quitar posponer, Guardar y quitar posponer   | el panel con el aviso de acción |

  # Action notice 6
  # Seguir editando closes the notice without acting: the panel keeps what was written.
  Scenario Outline: Action notice 6
    Given a relative recurring task Regar every <every> <unit>
    When I open the task in the edit panel on <now>
    And I type <value> in the field <field>
    And I choose the action <action> on <now>
    And I tap <button> in the notice
    Then what stays open is <open>
    And the field <field> still has <value>
    And the task is not paused

    Examples:
      | every | unit   | now                 | field  | value         | action | button          | open     |
      | 2    | dias   | 2026-07-15T08:00:00 | Título | Regar plantas | Pausar | Seguir editando | el panel |

  # Action notice 7
  # Descartar y <action> discards what was written and acts on the task as it was
  # saved; Guardar y <action> saves and acts.
  Scenario Outline: Action notice 7
    Given a relative recurring task Regar every <every> <unit>
    When I open the task in the edit panel on <now>
    And I type <value> in the field <field>
    And I choose the action <action> on <now>
    And I tap <button> in the notice
    Then what stays open is <open>
    And the task is paused
    And the task has title <stored>

    Examples:
      | every | unit   | now                 | field  | value         | action | button              | open    | stored        |
      | 2    | dias   | 2026-07-15T08:00:00 | Título | Regar plantas | Pausar | Descartar y pausar  | nada    | Regar         |
      | 2    | dias   | 2026-07-15T08:00:00 | Título | Regar plantas | Pausar | Guardar y pausar    | nada    | Regar plantas |

  # Action notice 8
  # "Now" is the moment the notice button is tapped, not the one when the
  # action was chosen.
  Scenario Outline: Action notice 8
    Given a one-off task without a due date
    When I open the task in the edit panel on <chosen>
    And I type <value> in the field <field>
    And I choose the action <action> on <chosen>
    And I tap <button> in the notice on <tapped>
    Then the task is postponed from <from> to <to>

    Examples:
      | chosen              | field | value | action                | button                             | tapped              | from                | to                  |
      | 2026-07-15T08:00:00 | Nota  | Luz   | Posponer 1 hora       | Guardar y posponer 1 hora          | 2026-07-15T08:03:00 | 2026-07-15T08:03:00 | 2026-07-15T09:03:00 |
      | 2026-07-15T08:00:00 | Nota  | Luz   | Posponer 3 horas      | Descartar y posponer 3 horas       | 2026-07-15T08:03:00 | 2026-07-15T08:03:00 | 2026-07-15T11:03:00 |
      | 2026-07-15T23:58:00 | Nota  | Luz   | Posponer hasta mañana | Guardar y posponer hasta mañana    | 2026-07-16T00:01:00 | 2026-07-16T00:01:00 | 2026-07-17T07:00:00 |

  # Action notice 9
  # If what is saved makes the action meaningless, the notice says so and does not offer
  # Guardar y <action>: Pausar a task that was changed to No se repite, and
  # Reanudar a paused task that was changed to No se repite (saving already resumes it).
  Scenario Outline: Action notice 9
    Given a relative recurring task Regar every <every> <unit>
    When I open the task in the edit panel on <now>
    And I choose <value> in <selector>
    And I choose the action <action> on <now>
    Then what stays open is <open>
    And the notice says <message>
    And the notice offers <buttons>

    Examples:
      | every | unit   | now                 | selector  | value        | action | message                                             | buttons                              | open                            |
      | 2    | dias   | 2026-07-15T08:00:00 | Se repite | No se repite | Pausar | Con estos cambios la tarea ya no se puede pausar    | Seguir editando, Descartar y pausar  | el panel con el aviso de acción |

  # Action notice 10
  Scenario Outline: Action notice 10
    Given a relative recurring task Regar every <every> <unit>
    And the task Regar was paused
    When I open the task in the edit panel on <now>
    And I choose <value> in <selector>
    And I choose the action <action> on <now>
    Then what stays open is <open>
    And the notice says <message>
    And the notice offers <buttons>

    Examples:
      | every | unit   | now                 | selector  | value        | action   | message                                              | buttons                                | open                            |
      | 2    | dias   | 2026-07-15T08:00:00 | Se repite | No se repite | Reanudar | Con estos cambios la tarea ya no se puede reanudar   | Seguir editando, Descartar y reanudar  | el panel con el aviso de acción |

  # Action notice 11
  # With the action meaningless, Descartar y <action> acts on the
  # task as it was saved.
  Scenario Outline: Action notice 11
    Given a relative recurring task Regar every <every> <unit>
    When I open the task in the edit panel on <now>
    And I choose <value> in <selector>
    And I choose the action <action> on <now>
    And I tap <button> in the notice
    Then what stays open is <open>
    And the task is paused
    And the task is recurring

    Examples:
      | every | unit   | now                 | selector  | value        | action | button             | open    |
      | 2    | dias   | 2026-07-15T08:00:00 | Se repite | No se repite | Pausar | Descartar y pausar | nada    |

  # Action notice 12
  # If what was written is invalid there is no way to evaluate it: Guardar y
  # <action> is offered.
  Scenario Outline: Action notice 12
    Given a relative recurring task Regar every <every> <unit>
    When I open the task in the edit panel on <now>
    And I clear the field <field>
    And I choose the action <action> on <now>
    Then what stays open is <open>
    And the notice offers <buttons>

    Examples:
      | every | unit   | now                 | field  | action | buttons                                               | open                            |
      | 2    | dias   | 2026-07-15T08:00:00 | Título | Pausar | Seguir editando, Descartar y pausar, Guardar y pausar | el panel con el aviso de acción |

  # Action notice 13
  # If Guardar fails, nothing is executed: neither the action nor the close.
  Scenario Outline: Action notice 13
    Given a relative recurring task Regar every <every> <unit>
    When I open the task in the edit panel on <now>
    And I clear the field <field>
    And I choose the action <action> on <now>
    And I tap <button> in the notice
    Then what stays open is <open>
    And the task is not paused
    And the task has title <stored>

    Examples:
      | every | unit   | now                 | field  | action | button           | open     | stored   |
      | 2    | dias   | 2026-07-15T08:00:00 | Título | Pausar | Guardar y pausar | el panel | Regar    |

  # Action notice 14
  # The notice stays up to date: if another device makes the action no longer
  # apply, the notice closes and the panel is left with what was written.
  Scenario Outline: Action notice 14
    Given a relative recurring task Regar every <every> <unit>
    When I open the task in the edit panel on <now>
    And I type <value> in the field <field>
    And I choose the action <action> on <now>
    And another device, without seeing that change, pauses the task
    Then what stays open is <open>
    And the field <field> still has <value>

    Examples:
      | every | unit   | now                 | field  | value         | action | open     |
      | 2    | dias   | 2026-07-15T08:00:00 | Título | Regar plantas | Pausar | el panel |

  # Action notice 15
  # Also when time passes: a postponement that expires makes Quitar posponer
  # meaningless.
  Scenario Outline: Action notice 15
    Given a one-off task without a due date
    And the task was postponed with option <option> on <postponed>
    When I open the task in the edit panel on <now>
    And I type <value> in the field <field>
    And I choose the action <action> on <now>
    And time passes until <after>
    Then what stays open is <open>

    Examples:
      | option | postponed           | now                 | field | value | action          | after               | open     |
      | 1 hora | 2026-07-15T08:00:00 | 2026-07-15T08:30:00 | Nota  | Luz   | Quitar posponer | 2026-07-15T09:00:00 | el panel |

  # Action notice 16
  # If another device deletes the task while the notice is open, the
  # notice and the panel close without asking for anything.
  Scenario Outline: Action notice 16
    Given a relative recurring task Regar every <every> <unit>
    When I open the task in the edit panel on <now>
    And I type <value> in the field <field>
    And I choose the action <action> on <now>
    And another device, without seeing that change, deletes the task
    Then what stays open is <open>

    Examples:
      | every | unit   | now                 | field  | value         | action | open    |
      | 2    | dias   | 2026-07-15T08:00:00 | Título | Regar plantas | Pausar | nada    |

  # Action notice 17
  # Borrar tarea does not add the unsaved changes notice: with or without changes,
  # it only asks for its confirmation.
  Scenario Outline: Action notice 17
    Given a relative recurring task Regar every <every> <unit>
    When I open the task in the edit panel on <now>
    And I type <value> in the field <field>
    And I choose the action <action> on <now>
    Then what stays open is <open>

    Examples:
      | every | unit   | now                 | field  | value         | action       | open                                             |
      | 2    | dias   | 2026-07-15T08:00:00 | Título | Regar plantas | Borrar tarea | el panel con la confirmación de Borrar tarea     |
