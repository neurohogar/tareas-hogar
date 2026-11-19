# mutation-stamp: sha256=16a67c436ea6d07badbaa414a2a371f1f34856f24daebdc36d2a444d31f37f60
# acceptance-mutation-manifest-begin
# {"version":1,"tested_at":"2026-11-17T20:51:38.817213865Z","feature_name":"Copiar anotaciones","feature_path":"features/copiar-anotaciones.feature","background_hash":"74234e98afe7498fb5daf1f36ac2d78acc339464f950703b8c019892f982b90b","implementation_hash":"sha256:b54df9a231bc1a2b8c8852812d9a00c0208e07fba47a8b5137f9a5241ca79fe4","scenarios":[{"index":0,"name":"Copiar anotaciones 1","scenario_hash":"5a73d278cb637373b7f5318918e7bf5c8d7e341b484bffb2fc5f085251cf2c7b","mutation_count":13,"result":{"Total":13,"Killed":13,"Survived":0,"Errors":0},"tested_at":"2026-11-17T20:51:38.817213865Z"},{"index":1,"name":"Copiar anotaciones 2","scenario_hash":"06605c1cfedb27b2c043ddb5b12d3f362b665387bac966723789142c315bfe45","mutation_count":18,"result":{"Total":18,"Killed":18,"Survived":0,"Errors":0},"tested_at":"2026-11-17T20:51:38.817213865Z"},{"index":2,"name":"Copiar anotaciones 3","scenario_hash":"184c90db1995926ac795873d277d7ab74d9e73215073e1fdc0a98a83312e22d7","mutation_count":13,"result":{"Total":13,"Killed":13,"Survived":0,"Errors":0},"tested_at":"2026-11-17T20:51:38.817213865Z"},{"index":3,"name":"Copiar anotaciones 4","scenario_hash":"749a3b198d99111192557bfd2a3cee4482686de6551ea1bb47588b1eaf8cbfa4","mutation_count":16,"result":{"Total":16,"Killed":16,"Survived":0,"Errors":0},"tested_at":"2026-11-17T20:51:38.817213865Z"},{"index":4,"name":"Copiar anotaciones 5","scenario_hash":"9580c391340bf7e37fdeeda67c501268ef6472f4f4cc6e8156a70d520d0fa9f2","mutation_count":6,"result":{"Total":6,"Killed":6,"Survived":0,"Errors":0},"tested_at":"2026-11-17T20:51:38.817213865Z"}]}
# acceptance-mutation-manifest-end

# Spec §6.7 (Copiar). A single Copiar button copies as text all the
# annotations that the Anotaciones screen shows (not the orphan ones), also offline.
# The text has one line per annotation, from the oldest to
# the most recent (if tied, the one with the lower id first), with date and time
# (YYYY-MM-DD HH:MM, without seconds), direction, screen, current name of the
# task and text, separated by " · "; the task name and the text only if
# there are any. Without annotations there is nothing to copy.
# "the copied text has the lines" gives the lines in order, separated by
# "; ", and the text has no other lines. The "the annotation ..." steps of a
# Given describe the last declared annotation. Each task is named by its
# title (one word). The text «Anotaciones copiadas» and that Copiar
# works offline are verified in the QA suite (qa/anotacion.md).
Feature: Copy annotations

  # Copy annotations 1
  # The two examples of the spec, with and without task and text, from the oldest to the
  # most recent even if they were annotated in another order.
  Scenario Outline: Copy annotations 1
    Given a one-off task Regar without a due date with emoji <emoji>
    And an annotation <direction_a> in <screen_a> from <annotated_a>
    And an annotation <direction_b> in <screen_b> from <annotated_b>
    And the annotation refers to the task Regar
    And the annotation says <text_b>
    When I copy the annotations
    Then the copied text has the lines <lines>

    Examples:
      | emoji | direction_a | screen_a   | annotated_a         | direction_b | screen_b   | annotated_b         | text_b      | lines                                                                                                        |
      | 🌱    | Me molestó | Historial  | 2026-07-15T09:10:00 | Me sirvió | Pendientes | 2026-07-15T08:05:00 | quedó lindo | 2026-07-15 08:05 · Me sirvió · Pendientes · 🌱 Regar · quedó lindo; 2026-07-15 09:10 · Me molestó · Historial |

  # Copy annotations 2
  # A single annotation: date and time without seconds, with leading zeros, and
  # the optional parts (task and text) only if present.
  Scenario Outline: Copy annotations 2
    Given an annotation <direction> in <screen> from <annotated>
    When I copy the annotations
    Then the copied text has the lines <lines>

    Examples:
      | direction  | screen           | annotated           | lines                                                   |
      | Me molestó | Historial        | 2026-07-15T09:10:00 | 2026-07-15 09:10 · Me molestó · Historial               |
      | Me sirvió  | Panel de edición | 2026-07-05T00:09:59 | 2026-07-05 00:09 · Me sirvió · Panel de edición         |
      | Me sirvió  | Etiquetas        | 2025-12-31T23:59:59 | 2025-12-31 23:59 · Me sirvió · Etiquetas                |

  # Copy annotations 3
  # With task without text, and with text without task: each part appears only if
  # present.
  Scenario Outline: Copy annotations 3
    Given a one-off task <title> without a due date
    And an annotation <direction_a> in <screen_a> from <annotated_a>
    And the annotation refers to the task <title>
    And an annotation <direction_b> in <screen_b> from <annotated_b>
    And the annotation says <text_b>
    When I copy the annotations
    Then the copied text has the lines <lines>

    Examples:
      | title  | direction_a | screen_a   | annotated_a         | direction_b | screen_b    | annotated_b         | text_b      | lines                                                                                                       |
      | Pagar  | Me molestó | Historial  | 2026-07-15T08:00:00 | Me sirvió | Anotaciones | 2026-07-15T09:00:00 | quedó lindo | 2026-07-15 08:00 · Me molestó · Historial · Pagar; 2026-07-15 09:00 · Me sirvió · Anotaciones · quedó lindo |

  # Copy annotations 4
  # Two annotations at the same instant: the one with the lower id goes first, regardless of
  # the order in which they were registered (the opposite of the screen).
  Scenario Outline: Copy annotations 4
    Given an annotation <direction_a> in <screen> from <moment>
    And the annotation was recorded with id <id_a>
    And an annotation <direction_b> in <screen> from <moment>
    And the annotation was recorded with id <id_b>
    When I copy the annotations
    Then the copied text has the lines <lines>

    Examples:
      | direction_a | direction_b | screen     | moment              | id_a | id_b | lines                                                                                 |
      | Me molestó | Me sirvió | Pendientes | 2026-07-15T10:00:00 | a2   | a1   | 2026-07-15 10:00 · Me sirvió · Pendientes; 2026-07-15 10:00 · Me molestó · Pendientes |
      | Me molestó | Me sirvió | Pendientes | 2026-07-15T10:00:00 | a1   | a2   | 2026-07-15 10:00 · Me molestó · Pendientes; 2026-07-15 10:00 · Me sirvió · Pendientes |

  # Copy annotations 5
  # The task name is the current one, with its emoji if it has one.
  Scenario Outline: Copy annotations 5
    Given a one-off task <title> without a due date with emoji <emoji>
    And an annotation Me sirvió in Pendientes from <annotated>
    And the annotation refers to the task <title>
    When I edit the title to <title_new>
    And I copy the annotations
    Then the copied text has the lines <lines>

    Examples:
      | title  | emoji | annotated           | title_new    | lines                                                 |
      | Regar  | 🌱    | 2026-07-15T08:05:00 | Plantas      | 2026-07-15 08:05 · Me sirvió · Pendientes · 🌱 Plantas |

  # Copy annotations 6
  # Without annotations there is nothing to copy.
  Scenario: Copy annotations 6
    Given a one-off task Regar without a due date
    When I copy the annotations
    Then there is nothing to copy
