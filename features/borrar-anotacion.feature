# mutation-stamp: sha256=afebd543a6cc16cb2f1b6f1c441cfce6f1bc9518b64cec38807628adeb63e58a
# acceptance-mutation-manifest-begin
# {"version":1,"tested_at":"2026-11-19T12:08:31.299437426Z","feature_name":"Delete annotation","feature_path":"features/borrar-anotacion.feature","background_hash":"74234e98afe7498fb5daf1f36ac2d78acc339464f950703b8c019892f982b90b","implementation_hash":"sha256:bb3fb8a2fc5f039310756324a5cfe2075aeadc00c3aff297690e400ead269a1f","scenarios":[{"index":0,"name":"Delete annotation 1","scenario_hash":"e475def4039405858071f4073669e4548f9e5334b35644e74fa5160bf4e27fe7","mutation_count":11,"result":{"Total":11,"Killed":11,"Survived":0,"Errors":0},"tested_at":"2026-11-19T12:08:31.299437426Z"},{"index":1,"name":"Delete annotation 2","scenario_hash":"b7c8658d2e9e6a3a2c88082d47a513e8e933b6663cf1816ce8654bd34da01c73","mutation_count":2,"result":{"Total":2,"Killed":2,"Survived":0,"Errors":0},"tested_at":"2026-11-19T12:08:31.299437426Z"},{"index":2,"name":"Delete annotation 3","scenario_hash":"9aa3a8f635fa253d54c18aacc636087a4745538528ba23b0b831992e38ba45a2","mutation_count":10,"result":{"Total":10,"Killed":10,"Survived":0,"Errors":0},"tested_at":"2026-11-19T12:08:31.299437426Z"}]}
# acceptance-mutation-manifest-end

# Spec §6.7 (Delete). Deleting an annotation removes it from the Anotaciones screen
# and from what Copiar copies, and only it. The confirmation (dialog with Borrar and
# Cancelar; Cancelar changes nothing) is verified in the QA suite
# (qa/anotacion.md).
# An annotation is named by the instant it was annotated (different for each
# annotation in a scenario). "Anotaciones shows" gives the groups in order,
# separated by "; ", each as "<heading>: <annotations>", and the
# annotations in order, separated by ", ", each as its parts separated
# by " · ".
Feature: Delete annotation

  # Delete annotation 1
  # Deleting an annotation removes it from the screen and leaves the others.
  Scenario Outline: Delete annotation 1
    Given an annotation <direction_a> in <screen_a> from <annotated_a>
    And an annotation <direction_b> in <screen_b> from <annotated_b>
    And the annotation says <text_b>
    When I delete the annotation from <annotated_a>
    And I query Anotaciones on <now>
    Then there is no annotation from <annotated_a>
    And Anotaciones shows <annotations>

    Examples:
      | direction_a | screen_a   | annotated_a         | direction_b | screen_b   | annotated_b         | text_b      | now                 | annotations                                          |
      | Me sirvió | Pendientes | 2026-07-15T08:05:00 | Me molestó | Historial  | 2026-07-15T09:10:00 | quedó lindo | 2026-07-15T12:00:00 | Hoy: 09:10 · Me molestó · Historial · quedó lindo    |

  # Delete annotation 2
  # Deleting the only annotation leaves the screen empty and nothing to copy.
  Scenario Outline: Delete annotation 2
    Given an annotation <direction> in <screen> from <annotated>
    When I delete the annotation from <annotated>
    And I query Anotaciones on <now>
    And I copy the annotations
    Then Anotaciones is empty
    And there is nothing to copy
    And no annotation remains

    Examples:
      | direction | screen     | annotated           | now                 |
      | Me sirvió | Pendientes | 2026-07-15T08:05:00 | 2026-07-15T12:00:00 |

  # Delete annotation 3
  # Deleting an annotation does not touch its task or its completions.
  Scenario Outline: Delete annotation 3
    Given a one-off task <title> with due date <due_date>
    And the task <title> was completed on <completed>
    And an annotation <direction> in <screen> from <annotated>
    And the annotation refers to the task <title>
    When I delete the annotation from <annotated>
    Then no annotation remains
    And the task <title> keeps a single completion, from <completed_stored>

    Examples:
      | title  | due_date   | completed           | direction | screen     | annotated           | completed_stored    |
      | Pagar  | 2026-07-20 | 2026-07-15T08:00:00 | Me sirvió | Pendientes | 2026-07-15T08:05:00 | 2026-07-15T08:00:00 |
