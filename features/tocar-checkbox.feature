# mutation-stamp: sha256=d4e870844b35eb8069ab62dda0687489f8bed2af7d6e1edb724aafe7bf8e5d75
# acceptance-mutation-manifest-begin
# {"version":1,"tested_at":"2026-11-16T02:02:22.245113394Z","feature_name":"Tocar el checkbox","feature_path":"features/tocar-checkbox.feature","background_hash":"74234e98afe7498fb5daf1f36ac2d78acc339464f950703b8c019892f982b90b","implementation_hash":"sha256:7635417019e618b216a035035028762048f83ef6289d4a93e6b0b710b6abfe0b","scenarios":[{"index":0,"name":"Tocar el checkbox 1","scenario_hash":"a7e2cbf087d271844bbfce02fb8391f5a489a5b521ef615080ea0aaa0464302a","mutation_count":8,"result":{"Total":8,"Killed":8,"Survived":0,"Errors":0},"tested_at":"2026-11-16T02:02:22.245113394Z"},{"index":1,"name":"Tocar el checkbox 2","scenario_hash":"260eab56cd815e7ad9d8241c9229de2fe0518b5046413173d568b2eeefccbe99","mutation_count":24,"result":{"Total":24,"Killed":24,"Survived":0,"Errors":0},"tested_at":"2026-11-16T02:02:22.245113394Z"},{"index":2,"name":"Tocar el checkbox 3","scenario_hash":"435bb1a4bd7a6e01db91ef49d306fb2a8796701632e083af5ad9d4ec0dd129c3","mutation_count":3,"result":{"Total":3,"Killed":3,"Survived":0,"Errors":0},"tested_at":"2026-11-16T02:02:22.245113394Z"},{"index":3,"name":"Tocar el checkbox 4","scenario_hash":"eeeb7a966c8b094bb4d0e258dc067e9a1b7dca76a049daa0b48a7953bb4a4145","mutation_count":2,"result":{"Total":2,"Killed":2,"Survived":0,"Errors":0},"tested_at":"2026-11-16T02:02:22.245113394Z"},{"index":4,"name":"Tocar el checkbox 5","scenario_hash":"65034db33507782c0404c21a84c7cea6d3ad101284cc34fdad71e3bca28a0286","mutation_count":18,"result":{"Total":18,"Killed":18,"Survived":0,"Errors":0},"tested_at":"2026-11-16T02:02:22.245113394Z"},{"index":5,"name":"Tocar el checkbox 6","scenario_hash":"9cf6b5d8671bc39906913a0a8356f5d5a7b58fb39962fd5b4faad1e03c933234","mutation_count":26,"result":{"Total":26,"Killed":26,"Survived":0,"Errors":0},"tested_at":"2026-11-16T02:02:22.245113394Z"},{"index":6,"name":"Tocar el checkbox 7","scenario_hash":"03c07935ce00f6c23a4ad4a6fa4559ae8381a0f2e0ee2efdff01955c2423e5f7","mutation_count":11,"result":{"Total":11,"Killed":11,"Survived":0,"Errors":0},"tested_at":"2026-11-16T02:02:22.245113394Z"},{"index":7,"name":"Tocar el checkbox 8","scenario_hash":"2e588e9c2b90ec5650a5746fc7807982caa9e9c727d6be9e8782e578605c59eb","mutation_count":13,"result":{"Total":13,"Killed":13,"Survived":0,"Errors":0},"tested_at":"2026-11-16T02:02:22.245113394Z"},{"index":8,"name":"Tocar el checkbox 9","scenario_hash":"d401dab85af81d7522f9b252caa893c07ce66948fd0a61f5d946690717be0468","mutation_count":25,"result":{"Total":25,"Killed":25,"Survived":0,"Errors":0},"tested_at":"2026-11-16T02:02:22.245113394Z"},{"index":9,"name":"Tocar el checkbox 10","scenario_hash":"6375a9b7deeaca1e45206a18696128f5b2ca67cde29c4d00286cdbcf0aea0235","mutation_count":14,"result":{"Total":14,"Killed":14,"Survived":0,"Errors":0},"tested_at":"2026-11-16T02:02:22.245113394Z"}]}
# acceptance-mutation-manifest-end

# Spec §6.1 (checkbox de la fila), con §5.1–§5.4. Tocar el checkbox de una
# tarea no completada la completa (como en §4.4). Tocar el checkbox de una
# completada:
#   puntual: borra su completado más reciente (el de completadoEn mayor),
#     como Deshacer;
#   periódica cuyo completado más reciente es de hoy o posterior (día local
#     de completadoEn; posterior con relojes desfasados): lo borra igual;
#   periódica cuyo completado más reciente es de un día anterior: la
#     completa de nuevo (relativa: reinicia el intervalo; calendario: cubre
#     la próxima ocurrencia).
# Al borrar, la tarea vuelve al estado que corresponda con los completados
# que quedan; puede seguir completada si le queda otro y sigue en espera.
# Una tarea está completada si es puntual con al menos un completado, o
# periódica en espera con al menos un completado. Las completadas solo
# tienen fila con Mostrar completadas encendido. El día empieza a las 00:00.
# "toco el checkbox de la tarea el <momento>" toca el checkbox de la única
# tarea del escenario en ese momento. Que no aparezca un aviso al borrar un
# completado con el checkbox se verifica en la suite QA.
# El progreso es una fracción entre 0 y 1, comparada exactamente.
# Semana de referencia: lunes 2026-07-13 a domingo 2026-07-19.
Feature: Tap the checkbox

  # Tocar el checkbox 1
  # Una puntual no completada: tocar el checkbox la completa y sale de
  # Pendientes.
  Scenario Outline: Tap the checkbox 1
    Given a one-off task without a due date
    When I tap the task checkbox on <tap>
    And I query the status at any moment
    Then a completion without a covered occurrence was recorded
    And the recorded completion is from <tap_stored>
    And the task does not appear in Pendientes

    Examples:
      | tap                 | tap_stored          |
      | 2026-07-15T08:00:00 | 2026-07-15T08:00:00 |

  # Tocar el checkbox 2
  # Una periódica con completados pero pendiente (fila 1) o atrasada (fila 2)
  # no está completada: tocar el checkbox agrega un completado nuevo, no
  # borra el anterior.
  Scenario Outline: Tap the checkbox 2
    Given a relative recurring task every <every> <unit>
    And the task was completed on <previous>
    When I tap the task checkbox on <tap>
    And I query the status on <now>
    Then the new completion is added without changing the previous ones
    And the status is en espera
    And the progress is <progress>

    Examples:
      | every | unit   | previous            | tap                 | now                 | progress |
      | 4    | horas  | 2026-07-15T08:00:00 | 2026-07-15T13:00:00 | 2026-07-15T14:00:00 | 0.25     |
      | 4    | horas  | 2026-07-15T08:00:00 | 2026-07-15T16:00:00 | 2026-07-15T18:00:00 | 0.5      |

  # Tocar el checkbox 3
  # Una puntual completada: tocar el checkbox borra su completado y vuelve
  # pendiente hasta terminar el día límite.
  Scenario Outline: Tap the checkbox 3
    Given Mostrar completadas is on
    And a one-off task with due date <due_date>
    And the task was completed on <completed>
    When I tap the task checkbox on <tap>
    And I query the status on <now>
    Then the task has no completions
    And the status is pendiente

    Examples:
      | due_date   | completed           | tap                 | now                 |
      | 2026-07-15 | 2026-07-14T10:00:00 | 2026-07-15T23:59:00 | 2026-07-15T23:59:59 |

  # Tocar el checkbox 4
  # Una puntual completada vuelve atrasada si ya pasó el día límite.
  Scenario Outline: Tap the checkbox 4
    Given Mostrar completadas is on
    And a one-off task with due date <due_date>
    And the task was completed on <completed>
    When I tap the task checkbox on <tap>
    And I query the status on <now>
    Then the task has no completions
    And the status is atrasada

    Examples:
      | due_date   | completed           | tap                 | now                 |
      | 2026-07-15 | 2026-07-14T10:00:00 | 2026-07-16T00:00:00 | 2026-07-16T00:00:01 |

  # Tocar el checkbox 5
  # Una puntual con dos completados (dos dispositivos sin conexión): tocar el
  # checkbox borra solo el más reciente, sin importar el orden en que se
  # registraron (fila 2); con el otro, sigue completada.
  Scenario Outline: Tap the checkbox 5
    Given Mostrar completadas is on
    And a one-off task without a due date
    And the task was completed on <first>
    And the task was completed on <second>
    When I tap the task checkbox on <tap>
    And I query the status at any moment
    Then the task keeps a single completion, from <remains>
    And the task is completed

    Examples:
      | first               | second              | tap                 | remains             |
      | 2026-07-14T10:00:00 | 2026-07-14T10:05:00 | 2026-07-15T08:00:00 | 2026-07-14T10:00:00 |
      | 2026-07-14T10:05:00 | 2026-07-14T10:00:00 | 2026-07-15T08:00:00 | 2026-07-14T10:00:00 |

  # Tocar el checkbox 6
  # Una relativa en espera con dos completados: tocar el checkbox borra el
  # más reciente; U pasa al anterior, con el que ya venció, y queda pendiente
  # (no completada). Fila 2: el más reciente se registró primero.
  Scenario Outline: Tap the checkbox 6
    Given Mostrar completadas is on
    And a relative recurring task every <every> <unit>
    And the task was completed on <first>
    And the task was completed on <second>
    When I tap the task checkbox on <tap>
    And I query the status on <now>
    Then the task keeps a single completion, from <remains>
    And the status is pendiente

    Examples:
      | every | unit   | first               | second              | tap                 | now                 | remains             |
      | 2    | dias   | 2026-07-13T09:00:00 | 2026-07-15T09:00:00 | 2026-07-15T10:00:00 | 2026-07-15T12:00:00 | 2026-07-13T09:00:00 |
      | 2    | dias   | 2026-07-15T09:00:00 | 2026-07-13T09:00:00 | 2026-07-15T10:00:00 | 2026-07-15T12:00:00 | 2026-07-13T09:00:00 |

  # Tocar el checkbox 7
  # Una relativa en espera con un solo completado de hoy: tocar el checkbox
  # lo borra y vuelve a "nunca completada" (pendiente). Fila 2: completado a
  # las 00:00 y toque a las 23:59:59, el mismo día. Fila 3: completado "del
  # futuro" (relojes desfasados), posterior a hoy: también se borra.
  Scenario Outline: Tap the checkbox 7
    Given Mostrar completadas is on
    And a relative recurring task every <every> <unit>
    And the task was completed on <completed>
    When I tap the task checkbox on <tap>
    And I query the status on <now>
    Then the task has no completions
    And the status is pendiente

    Examples:
      | every | unit   | completed           | tap                 | now                 |
      | 2    | dias   | 2026-07-15T09:00:00 | 2026-07-15T10:00:00 | 2026-07-15T12:00:00 |
      | 2    | dias   | 2026-07-15T00:00:00 | 2026-07-15T23:59:59 | 2026-07-16T00:00:00 |
      | 2    | dias   | 2026-07-16T09:00:00 | 2026-07-15T12:00:00 | 2026-07-15T12:00:01 |

  # Tocar el checkbox 8
  # Una semanal en espera con dos completados, el más reciente de hoy: tocar
  # el checkbox lo borra; P pasa a la ocurrencia del que queda y, como N sigue en el
  # futuro, sigue en espera y completada.
  Scenario Outline: Tap the checkbox 8
    Given Mostrar completadas is on
    And a weekly recurring task on <days>
    And the task has a completion from <first> that covers <covered_first>
    And the task has a completion from <second> that covers <covered_second>
    When I tap the task checkbox on <tap>
    And I query the status on <now>
    Then the task keeps a single completion, from <remains>
    And the status is en espera
    And the task is completed

    Examples:
      | days           | first               | covered_first    | second              | covered_second   | tap                 | now                 | remains             |
      | martes, jueves | 2026-07-14T10:00:00 | 2026-07-14       | 2026-07-15T08:00:00 | 2026-07-16       | 2026-07-15T12:00:00 | 2026-07-15T12:00:01 | 2026-07-14T10:00:00 |

  # Tocar el checkbox 9
  # Una relativa en espera cuyo completado más reciente es de un día
  # anterior: tocar el checkbox la completa de nuevo y reinicia el intervalo
  # desde el toque. Fila 2: completado a las 23:59:59 de ayer y toque a las
  # 00:00 de hoy.
  Scenario Outline: Tap the checkbox 9
    Given Mostrar completadas is on
    And a relative recurring task every <every> <unit>
    And the task was completed on <previous>
    When I tap the task checkbox on <tap>
    And I query the status on <now>
    Then the new completion is added without changing the previous ones
    And the status is en espera
    And the progress is <progress>
    And the task is completed

    Examples:
      | every | unit   | previous            | tap                 | now                 | progress |
      | 2    | dias   | 2026-07-14T20:00:00 | 2026-07-15T08:00:00 | 2026-07-16T08:00:00 | 0.5      |
      | 2    | dias   | 2026-07-14T23:59:59 | 2026-07-15T00:00:00 | 2026-07-15T12:00:00 | 0.25     |

  # Tocar el checkbox 10
  # Una semanal en espera cuyo completado más reciente es de un día
  # anterior: tocar el checkbox la completa de nuevo y cubre la próxima
  # ocurrencia (completar antes de tiempo). Fila 1: completado el lunes que
  # cubrió el martes; el martes temprano cubre el jueves. Fila 2: completado
  # a las 23:59:59 del lunes y toque a las 00:00 del martes.
  Scenario Outline: Tap the checkbox 10
    Given Mostrar completadas is on
    And a weekly recurring task on <days>
    And the task has a completion from <previous> that covers <covered_previous>
    When I tap the task checkbox on <tap>
    And I query the status on <now>
    Then the new completion is added without changing the previous ones
    And a completion was recorded that covers <covered>
    And the status is en espera
    And the task is completed

    Examples:
      | days           | previous            | covered_previous  | tap                 | now                 | covered    |
      | martes, jueves | 2026-07-13T10:00:00 | 2026-07-14        | 2026-07-14T08:00:00 | 2026-07-14T12:00:00 | 2026-07-16 |
      | martes, jueves | 2026-07-13T23:59:59 | 2026-07-14        | 2026-07-14T00:00:00 | 2026-07-14T12:00:00 | 2026-07-16 |
