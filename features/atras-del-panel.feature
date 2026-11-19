# mutation-stamp: sha256=a67b3d7fa2e4aa9b23ed1754ad812bf49b4a5653777c1e9bb5fa9186624a55b7
# acceptance-mutation-manifest-begin
# {"version":1,"tested_at":"2026-11-17T20:48:04.488698969Z","feature_name":"Atrás del panel","feature_path":"features/atras-del-panel.feature","background_hash":"74234e98afe7498fb5daf1f36ac2d78acc339464f950703b8c019892f982b90b","implementation_hash":"sha256:f31e6b14a32933a1fd74a174600f1bfc00648731ee882b5ccbe5719c13185629","scenarios":[{"index":0,"name":"Atrás del panel 1","scenario_hash":"c39fa8b6a438fd4aa9bbfaebdffedd9901561ab1d0d5ed75a780a7317f17cd0c","mutation_count":18,"result":{"Total":18,"Killed":18,"Survived":0,"Errors":0},"tested_at":"2026-11-17T20:48:04.488698969Z"},{"index":1,"name":"Atrás del panel 2","scenario_hash":"faa7ef045254da5c165585cdc210039eb4a63311cac47c4ec0cf212e90af399f","mutation_count":6,"result":{"Total":6,"Killed":6,"Survived":0,"Errors":0},"tested_at":"2026-11-17T20:48:04.488698969Z"},{"index":2,"name":"Atrás del panel 3","scenario_hash":"037e20bf6695d6be6c86bd332a6667f6153b9cfbb5ae7fcbf0e8f2274027fb03","mutation_count":4,"result":{"Total":4,"Killed":4,"Survived":0,"Errors":0},"tested_at":"2026-11-17T20:48:04.488698969Z"},{"index":3,"name":"Atrás del panel 4","scenario_hash":"fd5ddea85e7326997c8b729cf5eda86236af57149c4a4faa54085eea3e3d5d74","mutation_count":20,"result":{"Total":20,"Killed":20,"Survived":0,"Errors":0},"tested_at":"2026-11-17T20:48:04.488698969Z"},{"index":4,"name":"Atrás del panel 5","scenario_hash":"6708fbc2ca8a45f7a34b4bba4abe7f8fdf1fabb7cac30edb2c508e9f5909b4be","mutation_count":6,"result":{"Total":6,"Killed":6,"Survived":0,"Errors":0},"tested_at":"2026-11-17T20:48:04.488698969Z"},{"index":5,"name":"Atrás del panel 6","scenario_hash":"6e269275fdfcf3b9933219388dc64afb491b783df687739e34ed3640ea46c43f","mutation_count":2,"result":{"Total":2,"Killed":2,"Survived":0,"Errors":0},"tested_at":"2026-11-17T20:48:04.488698969Z"}]}
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
# happens with the panel closed are verified in the QA suite (qa/cambios-sin-guardar.md).
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
