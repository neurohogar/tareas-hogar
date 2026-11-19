# mutation-stamp: sha256=6a09f2e3bd89c13eb8e022b11f0f9a8d8fdd75da0b565fe088cc63d4b2d337c7
# acceptance-mutation-manifest-begin
# {"version":1,"tested_at":"2026-11-19T12:15:43.861850145Z","feature_name":"Copy annotations","feature_path":"features/copiar-anotaciones.feature","background_hash":"74234e98afe7498fb5daf1f36ac2d78acc339464f950703b8c019892f982b90b","implementation_hash":"sha256:e36456dded26ef021052298ae227bab042782cc81e6700d804dc9b2b72563dcf","scenarios":[{"index":0,"name":"Copy annotations 1","scenario_hash":"38119cccf0284edd5b3fb204a54620e4dbfc1c678edd7853ec3509989fa0475c","mutation_count":13,"result":{"Total":13,"Killed":13,"Survived":0,"Errors":0},"tested_at":"2026-11-19T12:15:43.861850145Z"},{"index":1,"name":"Copy annotations 2","scenario_hash":"e8e1ee73cf5d0d4f298fdd51d162acf1b877cabdc53c6018f51c8919f6cd0a35","mutation_count":18,"result":{"Total":18,"Killed":18,"Survived":0,"Errors":0},"tested_at":"2026-11-19T12:15:43.861850145Z"},{"index":2,"name":"Copy annotations 3","scenario_hash":"de2cf197142edf773a8dd5652a7cdf9fd48bfd7de87091a486c1b3de454e98f3","mutation_count":13,"result":{"Total":13,"Killed":13,"Survived":0,"Errors":0},"tested_at":"2026-11-19T12:15:43.861850145Z"},{"index":3,"name":"Copy annotations 4","scenario_hash":"8109bf697bde2762cf44ba9baa2f5f76be3795534b7d428730ec62e59be40449","mutation_count":16,"result":{"Total":16,"Killed":16,"Survived":0,"Errors":0},"tested_at":"2026-11-19T12:15:43.861850145Z"},{"index":4,"name":"Copy annotations 5","scenario_hash":"9e42512d9ad71302c6594c9f22309ce9e3864e94687d1a312b87b5345170869b","mutation_count":6,"result":{"Total":6,"Killed":6,"Survived":0,"Errors":0},"tested_at":"2026-11-19T12:15:43.861850145Z"}]}
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
