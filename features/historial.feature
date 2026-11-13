# mutation-stamp: sha256=aa7f0c308576ff7fa1386998d28bf1887263edca082c4068e8ae934ba3f20e6e
# acceptance-mutation-manifest-begin
# {"version":1,"tested_at":"2026-11-13T22:13:16.821598895Z","feature_name":"Historial","feature_path":"features/historial.feature","background_hash":"74234e98afe7498fb5daf1f36ac2d78acc339464f950703b8c019892f982b90b","implementation_hash":"sha256:e3bd895aa5b78abdc8f5fd6445102376f8fb53997bd3f33b29a4a7445de2c0e2","scenarios":[{"index":0,"name":"Historial 1","scenario_hash":"cb6a7fb24ca0d03a0e2076c12c82e963d7ec05f51dda15f5a33fbb4d0f16a149","mutation_count":17,"result":{"Total":17,"Killed":17,"Survived":0,"Errors":0},"tested_at":"2026-11-13T22:13:16.821598895Z"},{"index":1,"name":"Historial 2","scenario_hash":"4f7d4647d7ad1611b0abc925e0c370f47249294679b4c2795af2bffb7e2e3f25","mutation_count":57,"result":{"Total":57,"Killed":57,"Survived":0,"Errors":0},"tested_at":"2026-11-13T22:13:16.821598895Z"},{"index":2,"name":"Historial 3","scenario_hash":"f39c32f56f8c5b5f2bdb1eaf403415280985177a3b142312a1f0f2274ce929af","mutation_count":17,"result":{"Total":17,"Killed":17,"Survived":0,"Errors":0},"tested_at":"2026-11-13T22:13:16.821598895Z"},{"index":3,"name":"Historial 4","scenario_hash":"a16d90ae17718a02ee9f4bcd95109d835dcdf0dbf92622e7192ba4f417e6f580","mutation_count":11,"result":{"Total":11,"Killed":11,"Survived":0,"Errors":0},"tested_at":"2026-11-13T22:13:16.821598895Z"},{"index":4,"name":"Historial 5","scenario_hash":"fc9a7b6431501f8eb9d054e21f605fbb37fa3859ac78f63e13280f154f12dd1e","mutation_count":11,"result":{"Total":11,"Killed":11,"Survived":0,"Errors":0},"tested_at":"2026-11-13T22:13:16.821598895Z"},{"index":5,"name":"Historial 6","scenario_hash":"fdc49ab95fa493162efcc7ec64ac60af262df142b1b205571fee8b87ee365097","mutation_count":7,"result":{"Total":7,"Killed":7,"Survived":0,"Errors":0},"tested_at":"2026-11-13T22:13:16.821598895Z"},{"index":6,"name":"Historial 7","scenario_hash":"4f0287d23fc0dc52fda897144925b37ddda3e97bc4c725a621b6e269e79837cc","mutation_count":8,"result":{"Total":8,"Killed":8,"Survived":0,"Errors":0},"tested_at":"2026-11-13T22:13:16.821598895Z"}]}
# acceptance-mutation-manifest-end

# Spec §6.3 (Historial), §6.2 y §7 (completados de tareas borradas y
# huérfanos). El Historial lista los completados de las tareas que existen,
# del más reciente al más antiguo por completadoEn (si empatan, primero el de
# id menor), agrupados por día local de completadoEn.
# Encabezado de cada día: "Hoy", "Ayer" o "<día de la semana> <número> de
# <mes>", con " de <año>" si el año no es el de ahora. Un día posterior a hoy
# (completado "del futuro") lleva la fecha, nunca "Mañana".
# Cada entrada: el título actual de la tarea y la hora HH:MM en 24 h.
# "el Historial muestra" da los grupos en orden, separados por "; ", cada uno
# como "<encabezado>: <entradas>", y las entradas en orden, separadas por
# ", ", como "<título> <HH:MM>". El Historial no tiene otras entradas.
# Cada tarea se nombra por su título (una palabra).
# Semana de referencia: lunes 2026-07-13 a domingo 2026-07-19.
Feature: Historial

  # Historial 1
  # Puntuales y periódicas juntas, del más reciente al más antiguo y
  # agrupadas por día, aunque se hayan completado en otro orden.
  Scenario Outline: Historial 1
    Given una tarea periódica relativa Regar cada <cada> <unidad>
    And una tarea periódica semanal Basura los <dias>
    And una tarea puntual Pagar con fecha límite <limite>
    And la tarea Regar fue completada el <regar_reciente>
    And la tarea Pagar fue completada el <pagar>
    And la tarea Regar fue completada el <regar_antiguo>
    And la tarea Basura fue completada el <basura>
    When consulto el Historial el <ahora>
    Then el Historial muestra <historial>

    Examples:
      | cada | unidad | dias           | limite     | regar_reciente      | pagar               | regar_antiguo       | basura              | ahora               | historial                                                              |
      | 2    | dias   | martes, jueves | 2026-07-20 | 2026-07-15T08:05:00 | 2026-07-15T10:00:00 | 2026-07-13T09:00:00 | 2026-07-14T21:30:00 | 2026-07-15T12:00:00 | Hoy: Pagar 10:00, Regar 08:05; Ayer: Basura 21:30; lunes 13 de julio: Regar 09:00 |

  # Historial 2
  # Encabezado del día y hora: bordes de las 00:00, "Ayer" a través del cambio
  # de año, el año cuando no es el de ahora, y completados "del futuro" (el
  # mismo día, más tarde, va en "Hoy"; otro día, con la fecha). La hora se
  # muestra sin segundos.
  Scenario Outline: Historial 2
    Given una tarea periódica relativa Regar cada <cada> <unidad>
    And la tarea Regar fue completada el <completada>
    When consulto el Historial el <ahora>
    Then el Historial muestra <historial>

    Examples:
      | cada | unidad | completada          | ahora               | historial                                       |
      | 2    | dias   | 2026-07-15T00:00:00 | 2026-07-15T12:00:00 | Hoy: Regar 00:00                                |
      | 2    | dias   | 2026-07-14T23:59:59 | 2026-07-15T12:00:00 | Ayer: Regar 23:59                               |
      | 2    | dias   | 2026-07-14T23:59:59 | 2026-07-16T00:00:00 | martes 14 de julio: Regar 23:59                 |
      | 2    | dias   | 2026-07-13T08:00:00 | 2026-07-14T23:59:59 | Ayer: Regar 08:00                               |
      | 2    | dias   | 2025-12-31T22:00:00 | 2026-01-01T10:00:00 | Ayer: Regar 22:00                               |
      | 2    | dias   | 2025-12-31T22:00:00 | 2026-01-02T10:00:00 | miércoles 31 de diciembre de 2025: Regar 22:00  |
      | 2    | dias   | 2026-07-15T13:00:00 | 2026-07-15T12:00:00 | Hoy: Regar 13:00                                |
      | 2    | dias   | 2026-07-16T09:00:00 | 2026-07-15T12:00:00 | jueves 16 de julio: Regar 09:00                 |

  # Historial 3
  # Dos completados en el mismo instante: va primero el de id menor, sin
  # importar en qué orden se registraron.
  Scenario Outline: Historial 3
    Given una tarea periódica relativa Regar cada <cada> <unidad>
    And una tarea puntual Pagar con fecha límite <limite>
    And la tarea Regar fue completada el <momento> con id <id_regar>
    And la tarea Pagar fue completada el <momento> con id <id_pagar>
    When consulto el Historial el <ahora>
    Then el Historial muestra <historial>

    Examples:
      | cada | unidad | limite     | momento             | id_regar | id_pagar | ahora               | historial                    |
      | 2    | dias   | 2026-07-20 | 2026-07-15T10:00:00 | c2       | c1       | 2026-07-15T12:00:00 | Hoy: Pagar 10:00, Regar 10:00 |
      | 2    | dias   | 2026-07-20 | 2026-07-15T10:00:00 | c1       | c2       | 2026-07-15T12:00:00 | Hoy: Regar 10:00, Pagar 10:00 |

  # Historial 4
  # Cada entrada muestra el título actual: renombrar la tarea cambia todas
  # sus entradas.
  Scenario Outline: Historial 4
    Given una tarea periódica relativa <titulo> cada <cada> <unidad>
    And la tarea fue completada el <primera>
    And la tarea fue completada el <segunda>
    When edito el título a <titulo_nuevo>
    And consulto el Historial el <ahora>
    Then el Historial muestra <historial>

    Examples:
      | titulo | cada | unidad | primera             | segunda             | titulo_nuevo | ahora               | historial                                   |
      | Regar  | 2    | dias   | 2026-07-14T09:00:00 | 2026-07-15T08:00:00 | Plantas      | 2026-07-15T12:00:00 | Hoy: Plantas 08:00; Ayer: Plantas 09:00     |

  # Historial 5
  # Dos dispositivos completan la misma tarea sin conexión: quedan las dos
  # entradas.
  Scenario Outline: Historial 5
    Given una tarea periódica relativa Regar cada <cada> <unidad>
    When completo la tarea el <mia>
    And otro dispositivo, sin ver ese cambio, completa la tarea Regar el <otra>
    And consulto el Historial el <ahora>
    Then el Historial muestra <historial>

    Examples:
      | cada | unidad | mia                 | otra                | ahora               | historial                     |
      | 2    | dias   | 2026-07-15T08:00:00 | 2026-07-15T09:00:00 | 2026-07-15T12:00:00 | Hoy: Regar 09:00, Regar 08:00 |

  # Historial 6
  # Borrar una tarea saca del Historial todas sus entradas, y solo las suyas.
  Scenario Outline: Historial 6
    Given una tarea periódica relativa Regar cada <cada> <unidad>
    And una tarea puntual Pagar con fecha límite <limite>
    And la tarea Regar fue completada el <regar_1>
    And la tarea Regar fue completada el <regar_2>
    And la tarea Pagar fue completada el <pagar>
    When borro la tarea Regar
    And consulto el Historial el <ahora>
    Then el Historial muestra <historial>

    Examples:
      | cada | unidad | limite     | regar_1             | regar_2             | pagar               | ahora               | historial                       |
      | 2    | dias   | 2026-07-20 | 2026-07-14T09:00:00 | 2026-07-15T08:00:00 | 2026-07-14T10:00:00 | 2026-07-15T12:00:00 | Ayer: Pagar 10:00               |

  # Historial 7
  # Un completado huérfano (otro dispositivo, sin ver el borrado, completa la
  # tarea borrada) no aparece en el Historial.
  Scenario Outline: Historial 7
    Given una tarea periódica relativa Regar cada <cada> <unidad>
    And una tarea puntual Pagar con fecha límite <limite>
    And la tarea Pagar fue completada el <pagar>
    When borro la tarea Regar
    And otro dispositivo, sin ver ese cambio, completa la tarea Regar el <huerfano>
    And consulto el Historial el <ahora>
    Then el Historial muestra <historial>

    Examples:
      | cada | unidad | limite     | pagar               | huerfano            | ahora               | historial        |
      | 2    | dias   | 2026-07-20 | 2026-07-15T08:00:00 | 2026-07-15T09:00:00 | 2026-07-15T12:00:00 | Hoy: Pagar 08:00 |

  # Historial 8
  # Sin completados, el Historial está vacío.
  Scenario Outline: Historial 8
    Given una tarea periódica relativa Regar nunca completada creada el <creada>
    When consulto el Historial el <ahora>
    Then el Historial está vacío

    Examples:
      | creada              | ahora               |
      | 2026-07-13T08:00:00 | 2026-07-15T12:00:00 |
