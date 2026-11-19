# mutation-stamp: sha256=eebb988ba5024a0df069dc4fa91df81e0d29887a57fa8bb9f31aa442ba9b030b
# acceptance-mutation-manifest-begin
# {"version":1,"tested_at":"2026-11-19T12:18:15.797081102Z","feature_name":"Edit annotation","feature_path":"features/editar-anotacion.feature","background_hash":"74234e98afe7498fb5daf1f36ac2d78acc339464f950703b8c019892f982b90b","implementation_hash":"sha256:23b075788e72f23eb9048789701743b8e8c43459de5876c901ec731888c17244","scenarios":[{"index":0,"name":"Edit annotation 1","scenario_hash":"7a80c4d56c9b062eb4178d3732eb5c235985125024d2b7e96e70aca0e00d6991","mutation_count":6,"result":{"Total":6,"Killed":6,"Survived":0,"Errors":0},"tested_at":"2026-11-19T12:18:15.797081102Z"},{"index":1,"name":"Edit annotation 2","scenario_hash":"8ba260e85415b97064b95672213ddccb0fe08429408e9657ad8f7db3d52451c1","mutation_count":6,"result":{"Total":6,"Killed":6,"Survived":0,"Errors":0},"tested_at":"2026-11-19T12:18:15.797081102Z"},{"index":2,"name":"Edit annotation 3","scenario_hash":"dec80f97670e197624c8a74d6fdd06a746c31febc7a6c710ee89ff6ac6f21991","mutation_count":10,"result":{"Total":10,"Killed":10,"Survived":0,"Errors":0},"tested_at":"2026-11-19T12:18:15.797081102Z"},{"index":3,"name":"Edit annotation 4","scenario_hash":"fdf140b98ed272a23d042eeb4921732843ba811fb49b5e32204bcb436d99f86f","mutation_count":9,"result":{"Total":9,"Killed":9,"Survived":0,"Errors":0},"tested_at":"2026-11-19T12:18:15.797081102Z"},{"index":4,"name":"Edit annotation 5","scenario_hash":"3551c61626208c6330cd8afc472f130ab6ee7d2fd13a6974ccccced541d2272c","mutation_count":8,"result":{"Total":8,"Killed":8,"Survived":0,"Errors":0},"tested_at":"2026-11-19T12:18:15.797081102Z"},{"index":5,"name":"Edit annotation 6","scenario_hash":"05c27be0d08a820a2242cb873c15ee4b50db3b60c24cd77fa01631a3ebc83928","mutation_count":6,"result":{"Total":6,"Killed":6,"Survived":0,"Errors":0},"tested_at":"2026-11-19T12:18:15.797081102Z"},{"index":6,"name":"Edit annotation 7","scenario_hash":"7aa45979d09b78daf746d4ea3b946de8de1d9942505ead155425b181c8be9c44","mutation_count":2,"result":{"Total":2,"Killed":2,"Survived":0,"Errors":0},"tested_at":"2026-11-19T12:18:15.797081102Z"},{"index":7,"name":"Edit annotation 8","scenario_hash":"f106cd2bcffd4b5d2ee3277867eed1e771208fd01ae633177c231e2716c07942","mutation_count":2,"result":{"Total":2,"Killed":2,"Survived":0,"Errors":0},"tested_at":"2026-11-19T12:18:15.797081102Z"}]}
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
