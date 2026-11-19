# mutation-stamp: sha256=16a67c436ea6d07badbaa414a2a371f1f34856f24daebdc36d2a444d31f37f60
# acceptance-mutation-manifest-begin
# {"version":1,"tested_at":"2026-11-17T20:51:38.817213865Z","feature_name":"Copiar anotaciones","feature_path":"features/copiar-anotaciones.feature","background_hash":"74234e98afe7498fb5daf1f36ac2d78acc339464f950703b8c019892f982b90b","implementation_hash":"sha256:b54df9a231bc1a2b8c8852812d9a00c0208e07fba47a8b5137f9a5241ca79fe4","scenarios":[{"index":0,"name":"Copiar anotaciones 1","scenario_hash":"5a73d278cb637373b7f5318918e7bf5c8d7e341b484bffb2fc5f085251cf2c7b","mutation_count":13,"result":{"Total":13,"Killed":13,"Survived":0,"Errors":0},"tested_at":"2026-11-17T20:51:38.817213865Z"},{"index":1,"name":"Copiar anotaciones 2","scenario_hash":"06605c1cfedb27b2c043ddb5b12d3f362b665387bac966723789142c315bfe45","mutation_count":18,"result":{"Total":18,"Killed":18,"Survived":0,"Errors":0},"tested_at":"2026-11-17T20:51:38.817213865Z"},{"index":2,"name":"Copiar anotaciones 3","scenario_hash":"184c90db1995926ac795873d277d7ab74d9e73215073e1fdc0a98a83312e22d7","mutation_count":13,"result":{"Total":13,"Killed":13,"Survived":0,"Errors":0},"tested_at":"2026-11-17T20:51:38.817213865Z"},{"index":3,"name":"Copiar anotaciones 4","scenario_hash":"749a3b198d99111192557bfd2a3cee4482686de6551ea1bb47588b1eaf8cbfa4","mutation_count":16,"result":{"Total":16,"Killed":16,"Survived":0,"Errors":0},"tested_at":"2026-11-17T20:51:38.817213865Z"},{"index":4,"name":"Copiar anotaciones 5","scenario_hash":"9580c391340bf7e37fdeeda67c501268ef6472f4f4cc6e8156a70d520d0fa9f2","mutation_count":6,"result":{"Total":6,"Killed":6,"Survived":0,"Errors":0},"tested_at":"2026-11-17T20:51:38.817213865Z"}]}
# acceptance-mutation-manifest-end

# Spec §6.7 (Copiar). Un único botón Copiar copia como texto todas las
# anotaciones que la pantalla Anotaciones muestra (no las huérfanas), sin
# conexión también. El texto tiene una línea por anotación, de la más antigua a
# la más reciente (si empatan, primero la de id menor), con fecha y hora
# (AAAA-MM-DD HH:MM, sin segundos), sentido, pantalla, nombre actual de la
# tarea y texto, separados por " · "; el nombre de la tarea y el texto solo si
# los hay. Sin anotaciones no hay nada para copiar.
# "el texto copiado tiene las líneas" da las líneas en orden, separadas por
# "; ", y el texto no tiene otras líneas. Los pasos "la anotación ..." de un
# Given describen la última anotación declarada. Cada tarea se nombra por su
# título (una palabra). El texto «Anotaciones copiadas» y que Copiar
# funciona sin conexión se verifican en la suite QA (qa/anotacion.md).
Feature: Copy annotations

  # Copiar anotaciones 1
  # Los dos ejemplos del spec, con y sin tarea y texto, de la más antigua a la
  # más reciente aunque se hayan anotado en otro orden.
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

  # Copiar anotaciones 2
  # Una sola anotación: fecha y hora sin segundos, con ceros a la izquierda, y
  # las partes opcionales (tarea y texto) solo si las hay.
  Scenario Outline: Copy annotations 2
    Given an annotation <direction> in <screen> from <annotated>
    When I copy the annotations
    Then the copied text has the lines <lines>

    Examples:
      | direction  | screen           | annotated           | lines                                                   |
      | Me molestó | Historial        | 2026-07-15T09:10:00 | 2026-07-15 09:10 · Me molestó · Historial               |
      | Me sirvió  | Panel de edición | 2026-07-05T00:09:59 | 2026-07-05 00:09 · Me sirvió · Panel de edición         |
      | Me sirvió  | Etiquetas        | 2025-12-31T23:59:59 | 2025-12-31 23:59 · Me sirvió · Etiquetas                |

  # Copiar anotaciones 3
  # Con tarea sin texto, y con texto sin tarea: cada parte aparece solo si la
  # hay.
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

  # Copiar anotaciones 4
  # Dos anotaciones en el mismo instante: va primero la de id menor, sin
  # importar en qué orden se registraron (al revés que en la pantalla).
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

  # Copiar anotaciones 5
  # El nombre de la tarea es el actual, con su emoji si lo tiene.
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

  # Copiar anotaciones 6
  # Sin anotaciones no hay nada para copiar.
  Scenario: Copy annotations 6
    Given a one-off task Regar without a due date
    When I copy the annotations
    Then there is nothing to copy
