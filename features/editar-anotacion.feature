# mutation-stamp: sha256=74836cf20d6bb47805ab508c181c8cd22dd8dfcc0ea9cbb6a804c027c0378c18
# acceptance-mutation-manifest-begin
# {"version":1,"tested_at":"2026-11-17T20:53:48.074941872Z","feature_name":"Editar anotación","feature_path":"features/editar-anotacion.feature","background_hash":"74234e98afe7498fb5daf1f36ac2d78acc339464f950703b8c019892f982b90b","implementation_hash":"sha256:e7287cb5802216e035d55d56c9e09848330d9e4aaf573980e65d817e7ba83b42","scenarios":[{"index":0,"name":"Editar anotación 1","scenario_hash":"73a5cc8f741f62b025503ccf750090daf02877e5939130cdf57323513f3fafde","mutation_count":6,"result":{"Total":6,"Killed":6,"Survived":0,"Errors":0},"tested_at":"2026-11-17T20:53:48.074941872Z"},{"index":1,"name":"Editar anotación 2","scenario_hash":"4a7a9281fc00c48cec8bcd7fa8550f99c1add9b1bc406dbc149bb0815c819cae","mutation_count":6,"result":{"Total":6,"Killed":6,"Survived":0,"Errors":0},"tested_at":"2026-11-17T20:53:48.074941872Z"},{"index":2,"name":"Editar anotación 3","scenario_hash":"6bf53a1fcb98ddcc78f5592266be6d0f6109ae1b4c6260c4332fd0ff8dcba389","mutation_count":10,"result":{"Total":10,"Killed":10,"Survived":0,"Errors":0},"tested_at":"2026-11-17T20:53:48.074941872Z"},{"index":3,"name":"Editar anotación 4","scenario_hash":"10785efe54a64bd0148b577467081a50968678d02e74ed04f1ae0f0fb626cb41","mutation_count":9,"result":{"Total":9,"Killed":9,"Survived":0,"Errors":0},"tested_at":"2026-11-17T20:53:48.074941872Z"},{"index":4,"name":"Editar anotación 5","scenario_hash":"b1e45d281d78ca0fa77e273eb9ab18ce18fa0b0ed0268f070d0806d40597c7c7","mutation_count":8,"result":{"Total":8,"Killed":8,"Survived":0,"Errors":0},"tested_at":"2026-11-17T20:53:48.074941872Z"},{"index":5,"name":"Editar anotación 6","scenario_hash":"c2d9a3ed2031f8c82cbaf3b0bd302e7701d3b50040237db49c81cea7751e99ae","mutation_count":6,"result":{"Total":6,"Killed":6,"Survived":0,"Errors":0},"tested_at":"2026-11-17T20:53:48.074941872Z"},{"index":6,"name":"Editar anotación 7","scenario_hash":"d7019e195b7e3d72d8255fda84994b57b506f6affca8a0571a4af81cf0d51b21","mutation_count":2,"result":{"Total":2,"Killed":2,"Survived":0,"Errors":0},"tested_at":"2026-11-17T20:53:48.074941872Z"},{"index":7,"name":"Editar anotación 8","scenario_hash":"a61fbb82abb78faa794ccfec07e8679d8233d168eaeb1aad6e399d4785d33453","mutation_count":2,"result":{"Total":2,"Killed":2,"Survived":0,"Errors":0},"tested_at":"2026-11-17T20:53:48.074941872Z"}]}
# acceptance-mutation-manifest-end

# Spec §6.7 (Editar texto), §4.5 and §7 (Conflictos). Editar texto changes only the
# text of an annotation, with the rules of §4.5: a single line, no maximum
# length, trimming of leading and trailing spaces; emptying it (or leaving only
# spaces) leaves it without text. The meaning, the instant, the screen and the task
# do not change.
# If two devices edit the text without seeing the other's change, the last one
# to arrive wins (the order of the steps: first mine, then the other
# device's). Deleting wins over editing: an edit of an already
# deleted annotation does not revive it.
# An annotation is named by the instant it was annotated (different for each
# annotation in a scenario). Each task is named by its title (one word).
Feature: Edit annotation

  # Edit annotation 1
  # Changing the text leaves everything else as it was.
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

  # Edit annotation 2
  # An annotation without text can receive one, and without a task it still has no task.
  Scenario Outline: Edit annotation 2
    Given an annotation <direction> in <screen> from <annotated>
    When I edit the text of the annotation from <annotated> to <text_new>
    Then the annotation from <annotated> says <text_stored>
    And the annotation from <annotated> is of no task
    And the annotation from <annotated> has direction <direction_stored> in <screen_stored>

    Examples:
      | direction | screen     | annotated           | text_new    | text_stored    | direction_stored | screen_stored     |
      | Me sirvió | Pendientes | 2026-07-15T08:05:00 | quedó lindo | quedó lindo    | Me sirvió        | Pendientes        |

  # Edit annotation 3
  # Leading and trailing spaces are trimmed and inner ones stay;
  # the text has no maximum length.
  Scenario Outline: Edit annotation 3
    Given an annotation <direction> in <screen> from <annotated>
    And the annotation says <text>
    When I edit the text of the annotation from <annotated> to <text_new> between <spaces> spaces
    Then the annotation from <annotated> says <text_stored>

    Examples:
      | direction | screen     | annotated           | text        | text_new    | spaces   | text_stored    |
      | Me sirvió | Pendientes | 2026-07-15T08:05:00 | quedó lindo | muy lindo   | 0        | muy lindo      |
      | Me sirvió | Pendientes | 2026-07-15T08:05:00 | quedó lindo | muy lindo   | 3        | muy lindo      |

  # Edit annotation 4
  # Emptying the text, or leaving only spaces, leaves it without text: it is never an
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

  # Edit annotation 5
  # Only the chosen annotation changes: the others are not touched.
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

  # Edit annotation 6
  # Two devices edit the text: the last one to arrive wins.
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

  # Edit annotation 7
  # Deleting wins over editing: if another device deletes the annotation that I
  # edited, the annotation is gone.
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

  # Edit annotation 8
  # An edit of an already deleted annotation does not revive it: I delete and then
  # the other device's edit arrives.
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
