# mutation-stamp: sha256=c1056e15a34f837a1d1364237abbb8307754a212edbd12e4c5be616c3e7284b0
# acceptance-mutation-manifest-begin
# {"version":1,"tested_at":"2026-11-17T20:46:56.554345003Z","feature_name":"Anotaciones de una tarea borrada","feature_path":"features/anotaciones-de-tarea-borrada.feature","background_hash":"74234e98afe7498fb5daf1f36ac2d78acc339464f950703b8c019892f982b90b","implementation_hash":"sha256:3adbf53193bdd218e53ef98af0cb84de5b1b326044401f613f3941760bc590e3","scenarios":[{"index":0,"name":"Anotaciones de tarea borrada 1","scenario_hash":"c608c20268a206e4e07b6b96216362d6dba52f51a6b47449a0038ee6ee2a43a5","mutation_count":18,"result":{"Total":18,"Killed":18,"Survived":0,"Errors":0},"tested_at":"2026-11-17T20:46:56.554345003Z"},{"index":1,"name":"Anotaciones de tarea borrada 2","scenario_hash":"6a4018e222b1c71daa24ce133a268f41fca12e635f2176f78458aa5f85763aeb","mutation_count":9,"result":{"Total":9,"Killed":9,"Survived":0,"Errors":0},"tested_at":"2026-11-17T20:46:56.554345003Z"},{"index":2,"name":"Anotaciones de tarea borrada 3","scenario_hash":"f0be2567d9ccd945ec01598a760ccfc4932a48184a4095ab5e019c8481f3ffac","mutation_count":16,"result":{"Total":16,"Killed":16,"Survived":0,"Errors":0},"tested_at":"2026-11-17T20:46:56.554345003Z"}]}
# acceptance-mutation-manifest-end

# Spec §5.10 (Borrar una tarea), §6.2 y §7. Borrar una tarea borra también todas
# sus anotaciones, y solo las suyas (en el mismo writeBatch que sus
# completados); las anotaciones sin tarea no se ven afectadas. Una anotación
# huérfana (otro dispositivo, sin conexión, anotó sobre una tarea que ya se
# borró) no se muestra en la pantalla Anotaciones ni se copia con Copiar, y se
# detecta para limpiarla, como un completado huérfano.
# Una anotación se nombra por el instante en que se anotó (distinto en cada
# anotación de un escenario). "Anotaciones muestra" da los grupos en orden,
# separados por "; ", cada uno como "<encabezado>: <anotaciones>", y las
# anotaciones en orden, separadas por ", ", cada una como sus partes separadas
# por " · ". Cada tarea se nombra por su título (una palabra).
Feature: Annotations of a deleted task

  # Anotaciones de tarea borrada 1
  # Borrar una tarea borra sus anotaciones y sus completados, y deja las de
  # otra tarea y las que no tienen tarea.
  Scenario Outline: Annotations of a deleted task 1
    Given a one-off task Regar with due date <due_date>
    And a one-off task Pagar with due date <due_date>
    And the task Regar was completed on <completed>
    And an annotation <direction_1> in <screen_1> from <annotated_1>
    And the annotation refers to the task Regar
    And an annotation <direction_2> in <screen_2> from <annotated_2>
    And the annotation refers to the task Regar
    And an annotation <direction_3> in <screen_3> from <annotated_3>
    And the annotation refers to the task Pagar
    And an annotation <direction_4> in <screen_4> from <annotated_4>
    When I delete the task Regar
    And I query Anotaciones on <now>
    Then there is no task Regar
    And no completion remains of Regar
    And <count> annotations remain
    And Anotaciones shows <annotations>

    Examples:
      | due_date   | completed           | direction_1 | screen_1   | annotated_1         | direction_2 | screen_2         | annotated_2         | direction_3 | screen_3   | annotated_3         | direction_4 | screen_4    | annotated_4         | now                 | count    | annotations                                                                  |
      | 2026-07-20 | 2026-07-15T07:00:00 | Me sirvió | Pendientes | 2026-07-14T09:00:00 | Me molestó | Panel de edición | 2026-07-15T08:00:00 | Me sirvió | Historial  | 2026-07-15T09:00:00 | Me molestó | Anotaciones | 2026-07-15T10:00:00 | 2026-07-15T12:00:00 | 2        | Hoy: 10:00 · Me molestó · Anotaciones, 09:00 · Me sirvió · Historial · Pagar |

  # Anotaciones de tarea borrada 2
  # Borrar una tarea sin anotaciones no toca las que no tienen tarea.
  Scenario Outline: Annotations of a deleted task 2
    Given a one-off task Regar with due date <due_date>
    And an annotation <direction> in <screen> from <annotated>
    When I delete the task Regar
    And I query Anotaciones on <now>
    Then <count> annotations remain
    And Anotaciones shows <annotations>

    Examples:
      | due_date   | direction | screen     | annotated           | now                 | count    | annotations                          |
      | 2026-07-20 | Me sirvió | Pendientes | 2026-07-15T08:00:00 | 2026-07-15T12:00:00 | 1        | Hoy: 08:00 · Me sirvió · Pendientes  |

  # Anotaciones de tarea borrada 3
  # Anotación huérfana: otro dispositivo, sin ver el borrado, anota sobre la
  # tarea borrada. La pantalla y Copiar la ignoran, y es la única que se
  # detecta para limpiar; las de las tareas que existen y las que no tienen
  # tarea no.
  Scenario Outline: Annotations of a deleted task 3
    Given a one-off task Regar with due date <due_date>
    And a one-off task Pagar with due date <due_date>
    And an annotation <direction_1> in <screen_1> from <annotated_1>
    And the annotation refers to the task Pagar
    And an annotation <direction_2> in <screen_2> from <annotated_2>
    When I delete the task Regar
    And another device, without seeing that change, annotates <direction_orphan> in <screen_orphan> on <annotated_orphan> about the task Regar
    And I query Anotaciones on <now>
    And I copy the annotations
    Then Anotaciones shows <annotations>
    And the copied text has the lines <lines>
    And the orphan annotations to clean are only the one from <annotated_orphan>

    Examples:
      | due_date   | direction_1 | screen_1   | annotated_1         | direction_2 | screen_2   | annotated_2         | direction_orphan | screen_orphan     | annotated_orphan    | now                 | annotations                                                                       | lines                                                                                        |
      | 2026-07-20 | Me sirvió | Historial  | 2026-07-15T08:00:00 | Me molestó | Pendientes | 2026-07-15T09:00:00 | Me sirvió        | Etiquetas         | 2026-07-15T10:00:00 | 2026-07-15T12:00:00 | Hoy: 09:00 · Me molestó · Pendientes, 08:00 · Me sirvió · Historial · Pagar       | 2026-07-15 08:00 · Me sirvió · Historial · Pagar; 2026-07-15 09:00 · Me molestó · Pendientes |
