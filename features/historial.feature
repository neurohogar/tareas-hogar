# mutation-stamp: sha256=aa7f0c308576ff7fa1386998d28bf1887263edca082c4068e8ae934ba3f20e6e
# acceptance-mutation-manifest-begin
# {"version":1,"tested_at":"2026-11-17T20:58:11.997485346Z","feature_name":"Historial","feature_path":"features/historial.feature","background_hash":"74234e98afe7498fb5daf1f36ac2d78acc339464f950703b8c019892f982b90b","implementation_hash":"sha256:e3bd895aa5b78abdc8f5fd6445102376f8fb53997bd3f33b29a4a7445de2c0e2","scenarios":[{"index":0,"name":"Historial 1","scenario_hash":"cb6a7fb24ca0d03a0e2076c12c82e963d7ec05f51dda15f5a33fbb4d0f16a149","mutation_count":17,"result":{"Total":17,"Killed":17,"Survived":0,"Errors":0},"tested_at":"2026-11-17T20:58:11.997485346Z"},{"index":1,"name":"Historial 2","scenario_hash":"4f7d4647d7ad1611b0abc925e0c370f47249294679b4c2795af2bffb7e2e3f25","mutation_count":57,"result":{"Total":57,"Killed":57,"Survived":0,"Errors":0},"tested_at":"2026-11-17T20:58:11.997485346Z"},{"index":2,"name":"Historial 3","scenario_hash":"f39c32f56f8c5b5f2bdb1eaf403415280985177a3b142312a1f0f2274ce929af","mutation_count":17,"result":{"Total":17,"Killed":17,"Survived":0,"Errors":0},"tested_at":"2026-11-17T20:58:11.997485346Z"},{"index":3,"name":"Historial 4","scenario_hash":"a16d90ae17718a02ee9f4bcd95109d835dcdf0dbf92622e7192ba4f417e6f580","mutation_count":11,"result":{"Total":11,"Killed":11,"Survived":0,"Errors":0},"tested_at":"2026-11-17T20:58:11.997485346Z"},{"index":4,"name":"Historial 5","scenario_hash":"fc9a7b6431501f8eb9d054e21f605fbb37fa3859ac78f63e13280f154f12dd1e","mutation_count":11,"result":{"Total":11,"Killed":11,"Survived":0,"Errors":0},"tested_at":"2026-11-17T20:58:11.997485346Z"},{"index":5,"name":"Historial 6","scenario_hash":"fdc49ab95fa493162efcc7ec64ac60af262df142b1b205571fee8b87ee365097","mutation_count":7,"result":{"Total":7,"Killed":7,"Survived":0,"Errors":0},"tested_at":"2026-11-17T20:58:11.997485346Z"},{"index":6,"name":"Historial 7","scenario_hash":"4f0287d23fc0dc52fda897144925b37ddda3e97bc4c725a621b6e269e79837cc","mutation_count":8,"result":{"Total":8,"Killed":8,"Survived":0,"Errors":0},"tested_at":"2026-11-17T20:58:11.997485346Z"}]}
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
    Given a relative recurring task Regar every <every> <unit>
    And a weekly recurring task Basura on <days>
    And a one-off task Pagar with due date <due_date>
    And the task Regar was completed on <water_recent>
    And the task Pagar was completed on <pay>
    And the task Regar was completed on <water_old>
    And the task Basura was completed on <trash>
    When I query the Historial on <now>
    Then the Historial shows <history>

    Examples:
      | every | unit   | days           | due_date   | water_recent        | pay                 | water_old           | trash               | now                 | history                                                                           |
      | 2    | dias   | martes, jueves | 2026-07-20 | 2026-07-15T08:05:00 | 2026-07-15T10:00:00 | 2026-07-13T09:00:00 | 2026-07-14T21:30:00 | 2026-07-15T12:00:00 | Hoy: Pagar 10:00, Regar 08:05; Ayer: Basura 21:30; lunes 13 de julio: Regar 09:00 |

  # Historial 2
  # Encabezado del día y hora: bordes de las 00:00, "Ayer" a través del cambio
  # de año, el año cuando no es el de ahora, y completados "del futuro" (el
  # mismo día, más tarde, va en "Hoy"; otro día, con la fecha). La hora se
  # muestra sin segundos.
  Scenario Outline: Historial 2
    Given a relative recurring task Regar every <every> <unit>
    And the task Regar was completed on <completed>
    When I query the Historial on <now>
    Then the Historial shows <history>

    Examples:
      | every | unit   | completed           | now                 | history                                         |
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
    Given a relative recurring task Regar every <every> <unit>
    And a one-off task Pagar with due date <due_date>
    And the task Regar was completed on <moment> with id <id_water>
    And the task Pagar was completed on <moment> with id <id_pay>
    When I query the Historial on <now>
    Then the Historial shows <history>

    Examples:
      | every | unit   | due_date   | moment              | id_water | id_pay   | now                 | history                       |
      | 2    | dias   | 2026-07-20 | 2026-07-15T10:00:00 | c2       | c1       | 2026-07-15T12:00:00 | Hoy: Pagar 10:00, Regar 10:00 |
      | 2    | dias   | 2026-07-20 | 2026-07-15T10:00:00 | c1       | c2       | 2026-07-15T12:00:00 | Hoy: Regar 10:00, Pagar 10:00 |

  # Historial 4
  # Cada entrada muestra el título actual: renombrar la tarea cambia todas
  # sus entradas.
  Scenario Outline: Historial 4
    Given a relative recurring task <title> every <every> <unit>
    And the task was completed on <first>
    And the task was completed on <second>
    When I edit the title to <title_new>
    And I query the Historial on <now>
    Then the Historial shows <history>

    Examples:
      | title  | every | unit   | first               | second              | title_new    | now                 | history                                     |
      | Regar  | 2    | dias   | 2026-07-14T09:00:00 | 2026-07-15T08:00:00 | Plantas      | 2026-07-15T12:00:00 | Hoy: Plantas 08:00; Ayer: Plantas 09:00     |

  # Historial 5
  # Dos dispositivos completan la misma tarea sin conexión: quedan las dos
  # entradas.
  Scenario Outline: Historial 5
    Given a relative recurring task Regar every <every> <unit>
    When I complete the task on <mine>
    And another device, without seeing that change, completes the task Regar on <other>
    And I query the Historial on <now>
    Then the Historial shows <history>

    Examples:
      | every | unit   | mine                | other               | now                 | history                       |
      | 2    | dias   | 2026-07-15T08:00:00 | 2026-07-15T09:00:00 | 2026-07-15T12:00:00 | Hoy: Regar 09:00, Regar 08:00 |

  # Historial 6
  # Borrar una tarea saca del Historial todas sus entradas, y solo las suyas.
  Scenario Outline: Historial 6
    Given a relative recurring task Regar every <every> <unit>
    And a one-off task Pagar with due date <due_date>
    And the task Regar was completed on <water_1>
    And the task Regar was completed on <water_2>
    And the task Pagar was completed on <pay>
    When I delete the task Regar
    And I query the Historial on <now>
    Then the Historial shows <history>

    Examples:
      | every | unit   | due_date   | water_1             | water_2             | pay                 | now                 | history                         |
      | 2    | dias   | 2026-07-20 | 2026-07-14T09:00:00 | 2026-07-15T08:00:00 | 2026-07-14T10:00:00 | 2026-07-15T12:00:00 | Ayer: Pagar 10:00               |

  # Historial 7
  # Un completado huérfano (otro dispositivo, sin ver el borrado, completa la
  # tarea borrada) no aparece en el Historial.
  Scenario Outline: Historial 7
    Given a relative recurring task Regar every <every> <unit>
    And a one-off task Pagar with due date <due_date>
    And the task Pagar was completed on <pay>
    When I delete the task Regar
    And another device, without seeing that change, completes the task Regar on <orphan>
    And I query the Historial on <now>
    Then the Historial shows <history>

    Examples:
      | every | unit   | due_date   | pay                 | orphan              | now                 | history          |
      | 2    | dias   | 2026-07-20 | 2026-07-15T08:00:00 | 2026-07-15T09:00:00 | 2026-07-15T12:00:00 | Hoy: Pagar 08:00 |

  # Historial 8
  # Sin completados, el Historial está vacío.
  Scenario Outline: Historial 8
    Given a relative recurring task Regar never completed created on <created>
    When I query the Historial on <now>
    Then the Historial is empty

    Examples:
      | created             | now                 |
      | 2026-07-13T08:00:00 | 2026-07-15T12:00:00 |
