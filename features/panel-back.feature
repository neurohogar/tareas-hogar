# mutation-stamp: sha256=5f103d11f40e3e075c1b3e8a6938922109277669656ea6408fd6e0033ea96d7c
# acceptance-mutation-manifest-begin
# {"version":1,"tested_at":"2026-11-20T21:31:47.514723675Z","feature_name":"Panel back","feature_path":"features/panel-back.feature","background_hash":"74234e98afe7498fb5daf1f36ac2d78acc339464f950703b8c019892f982b90b","implementation_hash":"sha256:219e6550df411da71ffefec109810f7cea7016ab9370930ab001fca9d8248d22","scenarios":[{"index":0,"name":"Panel back 1","scenario_hash":"90663c890c8e0d2c3802bdb6c77866a61d66c8f181a96a4c2c3c0d5434aafded","mutation_count":18,"result":{"Total":18,"Killed":18,"Survived":0,"Errors":0},"tested_at":"2026-11-20T21:31:47.514723675Z"},{"index":1,"name":"Panel back 2","scenario_hash":"ad41729884f303e62d974f7c0a5b6f7035ea917f45bedaa5f2e4d509de665664","mutation_count":6,"result":{"Total":6,"Killed":6,"Survived":0,"Errors":0},"tested_at":"2026-11-20T21:31:47.514723675Z"},{"index":2,"name":"Panel back 3","scenario_hash":"d09f8b792225a56313304c96cc496727d255634f82b515dd5319a4da8fccfb47","mutation_count":4,"result":{"Total":4,"Killed":4,"Survived":0,"Errors":0},"tested_at":"2026-11-20T21:31:47.514723675Z"},{"index":3,"name":"Panel back 4","scenario_hash":"adeaef268f34b13db8cad9a509f9509ff8f1e0bb12efbc97bdc498b9ac884648","mutation_count":20,"result":{"Total":20,"Killed":20,"Survived":0,"Errors":0},"tested_at":"2026-11-20T21:31:47.514723675Z"},{"index":4,"name":"Panel back 5","scenario_hash":"a7cfc22fa846b2dbd2f5b6dac0912e96fe90f78445df18c6f5db835a534fdb9e","mutation_count":6,"result":{"Total":6,"Killed":6,"Survived":0,"Errors":0},"tested_at":"2026-11-20T21:31:47.514723675Z"},{"index":5,"name":"Panel back 6","scenario_hash":"ca0aa08b6b9717ab2908dc4677720d1d88c90cbccd30854e2aa00249b5417bc1","mutation_count":2,"result":{"Total":2,"Killed":2,"Survived":0,"Errors":0},"tested_at":"2026-11-20T21:31:47.514723675Z"}]}
# acceptance-mutation-manifest-end

# Spec §6.2 (Atrás). Atrás (Android button or equivalent gesture), with the panel
# open, closes only what is on top, as if its exit were tapped, and
# leaves the panel as it was: the close or action notice is equivalent to Seguir
# editando, the Borrar tarea confirmation to cancel, and the emoji picker
# closes without choosing. With the panel alone on top, Atrás closes it; with unsaved
# changes it opens the close notice. The undo notice does not count as
# something open. With the on-screen keyboard
# open, the first Atrás is closed by the system and the panel stays the same. Atrás
# does not show the browser confirmation. What stays open is given by "what stays
# open". That Atrás does not leave the screen (Pendientes or Historial) and what
# happens with the panel closed are verified in the QA suite (qa/unsaved-changes.md).
Feature: Panel back

  # Panel back 1
  # Atrás closes only what is on top of the panel, and the panel stays as
  # it was.
  Scenario Outline: Panel back 1
    Given the panel is open <changes>
    And on top of the panel there is <on_top>
    When I tap Atrás
    Then what stays open is <open>

    Examples:
      | changes                  | on_top                             | open     |
      | con cambios sin guardar  | el aviso de cierre                 | el panel |
      | con cambios sin guardar  | el aviso de acción                 | el panel |
      | con cambios sin guardar  | la confirmación de Borrar tarea    | el panel |
      | sin cambios              | la confirmación de Borrar tarea    | el panel |
      | con cambios sin guardar  | el selector de emoji               | el panel |
      | sin cambios              | el selector de emoji               | el panel |

  # Panel back 2
  # With the panel alone on top: without changes it closes it directly; with changes it opens
  # the close notice.
  Scenario Outline: Panel back 2
    Given the panel is open <changes>
    And on top of the panel there is <on_top>
    When I tap Atrás
    Then what stays open is <open>

    Examples:
      | changes                  | on_top                           | open                            |
      | sin cambios              | nada                             | nada                            |
      | con cambios sin guardar  | nada                             | el panel con el aviso de cierre |

  # Panel back 3
  # The undo notice does not count: Atrás ignores it and the notice stays.
  Scenario Outline: Panel back 3
    Given the panel is open <changes>
    And the undo notice is open
    When I tap Atrás
    Then what stays open is <open>
    And the undo notice is still open

    Examples:
      | changes                  | open                            |
      | sin cambios              | nada                            |
      | con cambios sin guardar  | el panel con el aviso de cierre |

  # Panel back 4
  # Another Atrás closes the panel (or opens the close notice if it has
  # changes), after having closed what was on top.
  Scenario Outline: Panel back 4
    Given the panel is open <changes>
    And on top of the panel there is <on_top>
    When I tap Atrás
    Then what stays open is <open_first>
    When I tap Atrás
    Then what stays open is <open>

    Examples:
      | changes                  | on_top                          | open                            | open_first |
      | con cambios sin guardar  | el selector de emoji            | el panel con el aviso de cierre | el panel |
      | sin cambios              | el selector de emoji            | nada                            | el panel |
      | con cambios sin guardar  | la confirmación de Borrar tarea | el panel con el aviso de cierre | el panel |
      | con cambios sin guardar  | el aviso de cierre              | el panel con el aviso de cierre | el panel |
      | con cambios sin guardar  | el aviso de acción              | el panel con el aviso de cierre | el panel |

  # Panel back 5
  # With the on-screen keyboard open, the first Atrás is closed by the system and
  # the panel stays the same; the next one applies the rules.
  Scenario Outline: Panel back 5
    Given the panel is open <changes>
    And the on-screen keyboard is open
    When I tap Atrás
    Then what stays open is <open_first>
    When I tap Atrás
    Then what stays open is <open>

    Examples:
      | changes                  | open                            | open_first |
      | sin cambios              | nada                            | el panel |
      | con cambios sin guardar  | el panel con el aviso de cierre | el panel |

  # Panel back 6
  # Atrás with the panel open never shows the browser confirmation.
  Scenario Outline: Panel back 6
    Given the panel is open <changes>
    When I tap Atrás
    Then the browser <response>

    Examples:
      | changes                  | response    |
      | con cambios sin guardar  | no pregunta |
