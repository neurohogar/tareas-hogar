# mutation-stamp: sha256=74836cf20d6bb47805ab508c181c8cd22dd8dfcc0ea9cbb6a804c027c0378c18
# acceptance-mutation-manifest-begin
# {"version":1,"tested_at":"2026-11-17T20:53:48.074941872Z","feature_name":"Editar anotación","feature_path":"features/editar-anotacion.feature","background_hash":"74234e98afe7498fb5daf1f36ac2d78acc339464f950703b8c019892f982b90b","implementation_hash":"sha256:e7287cb5802216e035d55d56c9e09848330d9e4aaf573980e65d817e7ba83b42","scenarios":[{"index":0,"name":"Editar anotación 1","scenario_hash":"73a5cc8f741f62b025503ccf750090daf02877e5939130cdf57323513f3fafde","mutation_count":6,"result":{"Total":6,"Killed":6,"Survived":0,"Errors":0},"tested_at":"2026-11-17T20:53:48.074941872Z"},{"index":1,"name":"Editar anotación 2","scenario_hash":"4a7a9281fc00c48cec8bcd7fa8550f99c1add9b1bc406dbc149bb0815c819cae","mutation_count":6,"result":{"Total":6,"Killed":6,"Survived":0,"Errors":0},"tested_at":"2026-11-17T20:53:48.074941872Z"},{"index":2,"name":"Editar anotación 3","scenario_hash":"6bf53a1fcb98ddcc78f5592266be6d0f6109ae1b4c6260c4332fd0ff8dcba389","mutation_count":10,"result":{"Total":10,"Killed":10,"Survived":0,"Errors":0},"tested_at":"2026-11-17T20:53:48.074941872Z"},{"index":3,"name":"Editar anotación 4","scenario_hash":"10785efe54a64bd0148b577467081a50968678d02e74ed04f1ae0f0fb626cb41","mutation_count":9,"result":{"Total":9,"Killed":9,"Survived":0,"Errors":0},"tested_at":"2026-11-17T20:53:48.074941872Z"},{"index":4,"name":"Editar anotación 5","scenario_hash":"b1e45d281d78ca0fa77e273eb9ab18ce18fa0b0ed0268f070d0806d40597c7c7","mutation_count":8,"result":{"Total":8,"Killed":8,"Survived":0,"Errors":0},"tested_at":"2026-11-17T20:53:48.074941872Z"},{"index":5,"name":"Editar anotación 6","scenario_hash":"c2d9a3ed2031f8c82cbaf3b0bd302e7701d3b50040237db49c81cea7751e99ae","mutation_count":6,"result":{"Total":6,"Killed":6,"Survived":0,"Errors":0},"tested_at":"2026-11-17T20:53:48.074941872Z"},{"index":6,"name":"Editar anotación 7","scenario_hash":"d7019e195b7e3d72d8255fda84994b57b506f6affca8a0571a4af81cf0d51b21","mutation_count":2,"result":{"Total":2,"Killed":2,"Survived":0,"Errors":0},"tested_at":"2026-11-17T20:53:48.074941872Z"},{"index":7,"name":"Editar anotación 8","scenario_hash":"a61fbb82abb78faa794ccfec07e8679d8233d168eaeb1aad6e399d4785d33453","mutation_count":2,"result":{"Total":2,"Killed":2,"Survived":0,"Errors":0},"tested_at":"2026-11-17T20:53:48.074941872Z"}]}
# acceptance-mutation-manifest-end

# Spec §6.7 (Editar texto), §4.5 y §7 (Conflictos). Editar texto cambia solo el
# texto de una anotación, con las reglas de §4.5: una sola línea, sin largo
# máximo, recorte de los espacios del inicio y del final; vaciarlo (o dejar solo
# espacios) la deja sin texto. El sentido, el instante, la pantalla y la tarea
# no cambian.
# Si dos dispositivos editan el texto sin ver el cambio del otro, gana el último
# en llegar (el orden de los pasos: primero el mío, después el del otro
# dispositivo). Borrar gana sobre editar: una edición de una anotación ya
# borrada no la revive.
# Una anotación se nombra por el instante en que se anotó (distinto en cada
# anotación de un escenario). Cada tarea se nombra por su título (una palabra).
Feature: Edit annotation

  # Editar anotación 1
  # Cambiar el texto deja todo lo demás como estaba.
  Scenario Outline: Edit annotation 1
    Given a one-off task <title> without a due date
    And an annotation <direction> in <screen> from <annotated>
    And the annotation refers to the task <title>
    And the annotation says <text>
    When I edit the text of the annotation from <annotated> to <text_new>
    Then a single annotation remains
    And the annotation from <annotated> says <text_stored>
    And the annotation from <annotated> has direction <direction_stored> in <screen_stored>
    And the annotation from <annotated> is of the task <title>

    Examples:
      | title  | direction  | screen           | annotated           | text        | text_new     | text_stored    | direction_stored | screen_stored     |
      | Regar  | Me molestó | Panel de edición | 2026-07-15T08:05:00 | quedó lindo | quedó mal    | quedó mal      | Me molestó       | Panel de edición  |

  # Editar anotación 2
  # Una anotación sin texto puede recibir uno, y sin tarea sigue sin tarea.
  Scenario Outline: Edit annotation 2
    Given an annotation <direction> in <screen> from <annotated>
    When I edit the text of the annotation from <annotated> to <text_new>
    Then the annotation from <annotated> says <text_stored>
    And the annotation from <annotated> is of no task
    And the annotation from <annotated> has direction <direction_stored> in <screen_stored>

    Examples:
      | direction | screen     | annotated           | text_new    | text_stored    | direction_stored | screen_stored     |
      | Me sirvió | Pendientes | 2026-07-15T08:05:00 | quedó lindo | quedó lindo    | Me sirvió        | Pendientes        |

  # Editar anotación 3
  # Los espacios del inicio y del final se recortan y los de adentro quedan;
  # el texto no tiene largo máximo.
  Scenario Outline: Edit annotation 3
    Given an annotation <direction> in <screen> from <annotated>
    And the annotation says <text>
    When I edit the text of the annotation from <annotated> to <text_new> between <spaces> spaces
    Then the annotation from <annotated> says <text_stored>

    Examples:
      | direction | screen     | annotated           | text        | text_new    | spaces   | text_stored    |
      | Me sirvió | Pendientes | 2026-07-15T08:05:00 | quedó lindo | muy lindo   | 0        | muy lindo      |
      | Me sirvió | Pendientes | 2026-07-15T08:05:00 | quedó lindo | muy lindo   | 3        | muy lindo      |

  # Editar anotación 4
  # Vaciar el texto, o dejar solo espacios, la deja sin texto: nunca es un
  # error.
  Scenario Outline: Edit annotation 4
    Given an annotation <direction> in <screen> from <annotated>
    And the annotation says <text>
    When I edit the text of the annotation from <annotated> to <spaces> spaces
    Then the annotation from <annotated> has no text
    And the annotation from <annotated> has direction <direction_stored> in <screen_stored>

    Examples:
      | direction  | screen    | annotated           | text        | spaces   | direction_stored | screen_stored     |
      | Me molestó | Historial | 2026-07-15T08:05:00 | quedó lindo | 0        | Me molestó       | Historial         |
      | Me molestó | Historial | 2026-07-15T08:05:00 | quedó lindo | 2        | Me molestó       | Historial         |

  # Editar anotación 5
  # Solo cambia la anotación elegida: las otras no se tocan.
  Scenario Outline: Edit annotation 5
    Given an annotation <direction_a> in <screen_a> from <annotated_a>
    And the annotation says <text_a>
    And an annotation <direction_b> in <screen_b> from <annotated_b>
    And the annotation says <text_b>
    When I edit the text of the annotation from <annotated_a> to <text_new>
    Then the annotation from <annotated_a> says <text_new_stored>
    And the annotation from <annotated_b> says <text_b_stored>

    Examples:
      | direction_a | screen_a   | annotated_a         | text_a  | direction_b | screen_b   | annotated_b         | text_b  | text_new    | text_new_stored      | text_b_stored    |
      | Me sirvió | Pendientes | 2026-07-15T08:05:00 | uno     | Me molestó | Historial  | 2026-07-15T09:10:00 | dos     | tres        | tres                 | dos              |

  # Editar anotación 6
  # Dos dispositivos editan el texto: gana el último en llegar.
  Scenario Outline: Edit annotation 6
    Given an annotation <direction> in <screen> from <annotated>
    And the annotation says <text>
    When I edit the text of the annotation from <annotated> to <first>
    And another device, without seeing that change, edits the text of the annotation from <annotated> to <second>
    Then the annotation from <annotated> says <text_stored>
    And the annotation from <annotated> has direction <direction_stored> in <screen_stored>

    Examples:
      | direction | screen     | annotated           | text  | first   | second  | text_stored    | direction_stored | screen_stored     |
      | Me sirvió | Pendientes | 2026-07-15T08:05:00 | uno   | dos     | tres    | tres           | Me sirvió        | Pendientes        |

  # Editar anotación 7
  # Borrar gana sobre editar: si otro dispositivo borra la anotación que yo
  # edité, la anotación no queda.
  Scenario Outline: Edit annotation 7
    Given an annotation <direction> in <screen> from <annotated>
    And the annotation says <text>
    When I edit the text of the annotation from <annotated> to <new>
    And another device, without seeing that change, deletes the annotation from <annotated>
    Then there is no annotation from <annotated>
    And no annotation remains

    Examples:
      | direction | screen     | annotated           | text  | new   |
      | Me sirvió | Pendientes | 2026-07-15T08:05:00 | uno   | dos   |

  # Editar anotación 8
  # Una edición de una anotación ya borrada no la revive: borro yo y después
  # llega la edición del otro dispositivo.
  Scenario Outline: Edit annotation 8
    Given an annotation <direction> in <screen> from <annotated>
    And the annotation says <text>
    When I delete the annotation from <annotated>
    And another device, without seeing that change, edits the text of the annotation from <annotated> to <new>
    Then there is no annotation from <annotated>
    And no annotation remains

    Examples:
      | direction | screen     | annotated           | text  | new   |
      | Me sirvió | Pendientes | 2026-07-15T08:05:00 | uno   | dos   |
