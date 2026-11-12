# mutation-stamp: sha256=d4e870844b35eb8069ab62dda0687489f8bed2af7d6e1edb724aafe7bf8e5d75
# acceptance-mutation-manifest-begin
# {"version":1,"tested_at":"2026-11-02T19:33:46.962955093Z","feature_name":"Tocar el checkbox","feature_path":"features/tocar-checkbox.feature","background_hash":"74234e98afe7498fb5daf1f36ac2d78acc339464f950703b8c019892f982b90b","implementation_hash":"sha256:13e1009154c623033a9b8842565ffa76081fac6cf49d95832e6421024c77d2f1","scenarios":[{"index":0,"name":"Tocar el checkbox 1","scenario_hash":"a7e2cbf087d271844bbfce02fb8391f5a489a5b521ef615080ea0aaa0464302a","mutation_count":8,"result":{"Total":8,"Killed":8,"Survived":0,"Errors":0},"tested_at":"2026-11-02T19:33:46.962955093Z"},{"index":1,"name":"Tocar el checkbox 2","scenario_hash":"260eab56cd815e7ad9d8241c9229de2fe0518b5046413173d568b2eeefccbe99","mutation_count":24,"result":{"Total":24,"Killed":24,"Survived":0,"Errors":0},"tested_at":"2026-11-02T19:33:46.962955093Z"},{"index":2,"name":"Tocar el checkbox 3","scenario_hash":"435bb1a4bd7a6e01db91ef49d306fb2a8796701632e083af5ad9d4ec0dd129c3","mutation_count":3,"result":{"Total":3,"Killed":3,"Survived":0,"Errors":0},"tested_at":"2026-11-02T19:33:46.962955093Z"},{"index":3,"name":"Tocar el checkbox 4","scenario_hash":"eeeb7a966c8b094bb4d0e258dc067e9a1b7dca76a049daa0b48a7953bb4a4145","mutation_count":2,"result":{"Total":2,"Killed":2,"Survived":0,"Errors":0},"tested_at":"2026-11-02T19:33:46.962955093Z"},{"index":4,"name":"Tocar el checkbox 5","scenario_hash":"65034db33507782c0404c21a84c7cea6d3ad101284cc34fdad71e3bca28a0286","mutation_count":18,"result":{"Total":18,"Killed":18,"Survived":0,"Errors":0},"tested_at":"2026-11-02T19:33:46.962955093Z"},{"index":5,"name":"Tocar el checkbox 6","scenario_hash":"9cf6b5d8671bc39906913a0a8356f5d5a7b58fb39962fd5b4faad1e03c933234","mutation_count":26,"result":{"Total":26,"Killed":26,"Survived":0,"Errors":0},"tested_at":"2026-11-02T19:33:46.962955093Z"},{"index":6,"name":"Tocar el checkbox 7","scenario_hash":"03c07935ce00f6c23a4ad4a6fa4559ae8381a0f2e0ee2efdff01955c2423e5f7","mutation_count":11,"result":{"Total":11,"Killed":11,"Survived":0,"Errors":0},"tested_at":"2026-11-02T19:33:46.962955093Z"},{"index":7,"name":"Tocar el checkbox 8","scenario_hash":"2e588e9c2b90ec5650a5746fc7807982caa9e9c727d6be9e8782e578605c59eb","mutation_count":13,"result":{"Total":13,"Killed":13,"Survived":0,"Errors":0},"tested_at":"2026-11-02T19:33:46.962955093Z"},{"index":8,"name":"Tocar el checkbox 9","scenario_hash":"d401dab85af81d7522f9b252caa893c07ce66948fd0a61f5d946690717be0468","mutation_count":25,"result":{"Total":25,"Killed":25,"Survived":0,"Errors":0},"tested_at":"2026-11-02T19:33:46.962955093Z"},{"index":9,"name":"Tocar el checkbox 10","scenario_hash":"6375a9b7deeaca1e45206a18696128f5b2ca67cde29c4d00286cdbcf0aea0235","mutation_count":14,"result":{"Total":14,"Killed":14,"Survived":0,"Errors":0},"tested_at":"2026-11-02T19:33:46.962955093Z"}]}
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
Feature: Tocar el checkbox

  # Tocar el checkbox 1
  # Una puntual no completada: tocar el checkbox la completa y sale de
  # Pendientes.
  Scenario Outline: Tocar el checkbox 1
    Given una tarea puntual sin fecha límite
    When toco el checkbox de la tarea el <toque>
    And consulto el estado en cualquier momento
    Then se registró un completado sin ocurrencia cubierta
    And el completado registrado es del <toque_guardado>
    And la tarea no aparece en Pendientes

    Examples:
      | toque               | toque_guardado      |
      | 2026-07-15T08:00:00 | 2026-07-15T08:00:00 |

  # Tocar el checkbox 2
  # Una periódica con completados pero pendiente (fila 1) o atrasada (fila 2)
  # no está completada: tocar el checkbox agrega un completado nuevo, no
  # borra el anterior.
  Scenario Outline: Tocar el checkbox 2
    Given una tarea periódica relativa cada <cada> <unidad>
    And la tarea fue completada el <anterior>
    When toco el checkbox de la tarea el <toque>
    And consulto el estado el <ahora>
    Then el nuevo completado se agrega sin modificar los anteriores
    And el estado es en espera
    And el progreso es <progreso>

    Examples:
      | cada | unidad | anterior            | toque               | ahora               | progreso |
      | 4    | horas  | 2026-07-15T08:00:00 | 2026-07-15T13:00:00 | 2026-07-15T14:00:00 | 0.25     |
      | 4    | horas  | 2026-07-15T08:00:00 | 2026-07-15T16:00:00 | 2026-07-15T18:00:00 | 0.5      |

  # Tocar el checkbox 3
  # Una puntual completada: tocar el checkbox borra su completado y vuelve
  # pendiente hasta terminar el día límite.
  Scenario Outline: Tocar el checkbox 3
    Given Mostrar completadas está encendido
    And una tarea puntual con fecha límite <limite>
    And la tarea fue completada el <completada>
    When toco el checkbox de la tarea el <toque>
    And consulto el estado el <ahora>
    Then la tarea no tiene completados
    And el estado es pendiente

    Examples:
      | limite     | completada          | toque               | ahora               |
      | 2026-07-15 | 2026-07-14T10:00:00 | 2026-07-15T23:59:00 | 2026-07-15T23:59:59 |

  # Tocar el checkbox 4
  # Una puntual completada vuelve atrasada si ya pasó el día límite.
  Scenario Outline: Tocar el checkbox 4
    Given Mostrar completadas está encendido
    And una tarea puntual con fecha límite <limite>
    And la tarea fue completada el <completada>
    When toco el checkbox de la tarea el <toque>
    And consulto el estado el <ahora>
    Then la tarea no tiene completados
    And el estado es atrasada

    Examples:
      | limite     | completada          | toque               | ahora               |
      | 2026-07-15 | 2026-07-14T10:00:00 | 2026-07-16T00:00:00 | 2026-07-16T00:00:01 |

  # Tocar el checkbox 5
  # Una puntual con dos completados (dos dispositivos sin conexión): tocar el
  # checkbox borra solo el más reciente, sin importar el orden en que se
  # registraron (fila 2); con el otro, sigue completada.
  Scenario Outline: Tocar el checkbox 5
    Given Mostrar completadas está encendido
    And una tarea puntual sin fecha límite
    And la tarea fue completada el <primera>
    And la tarea fue completada el <segunda>
    When toco el checkbox de la tarea el <toque>
    And consulto el estado en cualquier momento
    Then la tarea conserva un solo completado, del <queda>
    And la tarea está completada

    Examples:
      | primera             | segunda             | toque               | queda               |
      | 2026-07-14T10:00:00 | 2026-07-14T10:05:00 | 2026-07-15T08:00:00 | 2026-07-14T10:00:00 |
      | 2026-07-14T10:05:00 | 2026-07-14T10:00:00 | 2026-07-15T08:00:00 | 2026-07-14T10:00:00 |

  # Tocar el checkbox 6
  # Una relativa en espera con dos completados: tocar el checkbox borra el
  # más reciente; U pasa al anterior, con el que ya venció, y queda pendiente
  # (no completada). Fila 2: el más reciente se registró primero.
  Scenario Outline: Tocar el checkbox 6
    Given Mostrar completadas está encendido
    And una tarea periódica relativa cada <cada> <unidad>
    And la tarea fue completada el <primera>
    And la tarea fue completada el <segunda>
    When toco el checkbox de la tarea el <toque>
    And consulto el estado el <ahora>
    Then la tarea conserva un solo completado, del <queda>
    And el estado es pendiente

    Examples:
      | cada | unidad | primera             | segunda             | toque               | ahora               | queda               |
      | 2    | dias   | 2026-07-13T09:00:00 | 2026-07-15T09:00:00 | 2026-07-15T10:00:00 | 2026-07-15T12:00:00 | 2026-07-13T09:00:00 |
      | 2    | dias   | 2026-07-15T09:00:00 | 2026-07-13T09:00:00 | 2026-07-15T10:00:00 | 2026-07-15T12:00:00 | 2026-07-13T09:00:00 |

  # Tocar el checkbox 7
  # Una relativa en espera con un solo completado de hoy: tocar el checkbox
  # lo borra y vuelve a "nunca completada" (pendiente). Fila 2: completado a
  # las 00:00 y toque a las 23:59:59, el mismo día. Fila 3: completado "del
  # futuro" (relojes desfasados), posterior a hoy: también se borra.
  Scenario Outline: Tocar el checkbox 7
    Given Mostrar completadas está encendido
    And una tarea periódica relativa cada <cada> <unidad>
    And la tarea fue completada el <completada>
    When toco el checkbox de la tarea el <toque>
    And consulto el estado el <ahora>
    Then la tarea no tiene completados
    And el estado es pendiente

    Examples:
      | cada | unidad | completada          | toque               | ahora               |
      | 2    | dias   | 2026-07-15T09:00:00 | 2026-07-15T10:00:00 | 2026-07-15T12:00:00 |
      | 2    | dias   | 2026-07-15T00:00:00 | 2026-07-15T23:59:59 | 2026-07-16T00:00:00 |
      | 2    | dias   | 2026-07-16T09:00:00 | 2026-07-15T12:00:00 | 2026-07-15T12:00:01 |

  # Tocar el checkbox 8
  # Una semanal en espera con dos completados, el más reciente de hoy: tocar
  # el checkbox lo borra; P pasa a la ocurrencia del que queda y, como N sigue en el
  # futuro, sigue en espera y completada.
  Scenario Outline: Tocar el checkbox 8
    Given Mostrar completadas está encendido
    And una tarea periódica semanal los <dias>
    And la tarea tiene un completado del <primera> que cubre el <cubierta_primera>
    And la tarea tiene un completado del <segunda> que cubre el <cubierta_segunda>
    When toco el checkbox de la tarea el <toque>
    And consulto el estado el <ahora>
    Then la tarea conserva un solo completado, del <queda>
    And el estado es en espera
    And la tarea está completada

    Examples:
      | dias           | primera             | cubierta_primera | segunda             | cubierta_segunda | toque               | ahora               | queda               |
      | martes, jueves | 2026-07-14T10:00:00 | 2026-07-14       | 2026-07-15T08:00:00 | 2026-07-16       | 2026-07-15T12:00:00 | 2026-07-15T12:00:01 | 2026-07-14T10:00:00 |

  # Tocar el checkbox 9
  # Una relativa en espera cuyo completado más reciente es de un día
  # anterior: tocar el checkbox la completa de nuevo y reinicia el intervalo
  # desde el toque. Fila 2: completado a las 23:59:59 de ayer y toque a las
  # 00:00 de hoy.
  Scenario Outline: Tocar el checkbox 9
    Given Mostrar completadas está encendido
    And una tarea periódica relativa cada <cada> <unidad>
    And la tarea fue completada el <anterior>
    When toco el checkbox de la tarea el <toque>
    And consulto el estado el <ahora>
    Then el nuevo completado se agrega sin modificar los anteriores
    And el estado es en espera
    And el progreso es <progreso>
    And la tarea está completada

    Examples:
      | cada | unidad | anterior            | toque               | ahora               | progreso |
      | 2    | dias   | 2026-07-14T20:00:00 | 2026-07-15T08:00:00 | 2026-07-16T08:00:00 | 0.5      |
      | 2    | dias   | 2026-07-14T23:59:59 | 2026-07-15T00:00:00 | 2026-07-15T12:00:00 | 0.25     |

  # Tocar el checkbox 10
  # Una semanal en espera cuyo completado más reciente es de un día
  # anterior: tocar el checkbox la completa de nuevo y cubre la próxima
  # ocurrencia (completar antes de tiempo). Fila 1: completado el lunes que
  # cubrió el martes; el martes temprano cubre el jueves. Fila 2: completado
  # a las 23:59:59 del lunes y toque a las 00:00 del martes.
  Scenario Outline: Tocar el checkbox 10
    Given Mostrar completadas está encendido
    And una tarea periódica semanal los <dias>
    And la tarea tiene un completado del <anterior> que cubre el <cubierta_anterior>
    When toco el checkbox de la tarea el <toque>
    And consulto el estado el <ahora>
    Then el nuevo completado se agrega sin modificar los anteriores
    And se registró un completado que cubre el <cubierta>
    And el estado es en espera
    And la tarea está completada

    Examples:
      | dias           | anterior            | cubierta_anterior | toque               | ahora               | cubierta   |
      | martes, jueves | 2026-07-13T10:00:00 | 2026-07-14        | 2026-07-14T08:00:00 | 2026-07-14T12:00:00 | 2026-07-16 |
      | martes, jueves | 2026-07-13T23:59:59 | 2026-07-14        | 2026-07-14T00:00:00 | 2026-07-14T12:00:00 | 2026-07-16 |
