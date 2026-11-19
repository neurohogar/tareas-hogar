# mutation-stamp: sha256=a6d05361d36c13f272214f81661b35072b6d1b52b203d64c2db6501449180b5f
# acceptance-mutation-manifest-begin
# {"version":1,"tested_at":"2026-11-17T20:50:20.928996892Z","feature_name":"Borrar anotación","feature_path":"features/borrar-anotacion.feature","background_hash":"74234e98afe7498fb5daf1f36ac2d78acc339464f950703b8c019892f982b90b","implementation_hash":"sha256:ca96e2f42154eab89a0329747a8502c9d8ac1cf3aad81a17af0569571a59d70a","scenarios":[{"index":0,"name":"Borrar anotación 1","scenario_hash":"04209a16a97458f0620638ae5951a8b5dff19860335f8e18edd4ee30ca6a7045","mutation_count":11,"result":{"Total":11,"Killed":11,"Survived":0,"Errors":0},"tested_at":"2026-11-17T20:50:20.928996892Z"},{"index":1,"name":"Borrar anotación 2","scenario_hash":"1e098e552484b796eeb6369753a6abe55cc5765db69aff97b3d169a2a9222c69","mutation_count":2,"result":{"Total":2,"Killed":2,"Survived":0,"Errors":0},"tested_at":"2026-11-17T20:50:20.928996892Z"},{"index":2,"name":"Borrar anotación 3","scenario_hash":"c7b419cf250395128ec659131b803459fe80f7ffcd1363dc16894e2a836e45a1","mutation_count":10,"result":{"Total":10,"Killed":10,"Survived":0,"Errors":0},"tested_at":"2026-11-17T20:50:20.928996892Z"}]}
# acceptance-mutation-manifest-end

# Spec §6.7 (Borrar). Borrar una anotación la saca de la pantalla Anotaciones
# y de lo que copia Copiar, y solo a ella. La confirmación (diálogo con Borrar y
# Cancelar; Cancelar no cambia nada) se verifica en la suite QA
# (qa/anotacion.md).
# Una anotación se nombra por el instante en que se anotó (distinto en cada
# anotación de un escenario). "Anotaciones muestra" da los grupos en orden,
# separados por "; ", cada uno como "<encabezado>: <anotaciones>", y las
# anotaciones en orden, separadas por ", ", cada una como sus partes separadas
# por " · ".
Feature: Delete annotation

  # Borrar anotación 1
  # Borrar una anotación la saca de la pantalla y deja las otras.
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

  # Borrar anotación 2
  # Borrar la única anotación deja la pantalla vacía y nada para copiar.
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

  # Borrar anotación 3
  # Borrar una anotación no toca su tarea ni sus completados.
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
