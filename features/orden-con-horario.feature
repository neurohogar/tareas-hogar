# mutation-stamp: sha256=3eaa67e21d272a9c73e1c0aa9efe6a77ef162f23a4b1716d080cbd461f2f88f2
# acceptance-mutation-manifest-begin
# {"version":1,"tested_at":"2026-11-17T21:00:20.056442354Z","feature_name":"Orden con horario","feature_path":"features/orden-con-horario.feature","background_hash":"74234e98afe7498fb5daf1f36ac2d78acc339464f950703b8c019892f982b90b","implementation_hash":"sha256:5f22d9c112d51f38368be135fa61801af55896cfaec41cd4512e7ea9202b5c9c","scenarios":[{"index":0,"name":"Orden con horario 1","scenario_hash":"e5f0615662d2b5ab025302fe4dcad03bf628b27ca3c901a697ebc5fde224779e","mutation_count":26,"result":{"Total":26,"Killed":26,"Survived":0,"Errors":0},"tested_at":"2026-11-17T21:00:20.056442354Z"},{"index":1,"name":"Orden con horario 2","scenario_hash":"6bb44915217cd4ccc791a0a5bb920ffa790a7ae25c948c2752064eb5496671e3","mutation_count":19,"result":{"Total":19,"Killed":19,"Survived":0,"Errors":0},"tested_at":"2026-11-17T21:00:20.056442354Z"},{"index":2,"name":"Orden con horario 3","scenario_hash":"68355ba710ec4c0faa3c4a62249892d76163061887fe240bb3a89b5a6d727bfc","mutation_count":17,"result":{"Total":17,"Killed":17,"Survived":0,"Errors":0},"tested_at":"2026-11-17T21:00:20.056442354Z"},{"index":3,"name":"Orden con horario 4","scenario_hash":"95e5adb0e68c76d3f7a3ec325e9419be4fbd473162fdd4dc6fdef469129060fb","mutation_count":17,"result":{"Total":17,"Killed":17,"Survived":0,"Errors":0},"tested_at":"2026-11-17T21:00:20.056442354Z"}]}
# acceptance-mutation-manifest-end

# Spec §5.5 (último punto) y §6.1 (orden por urgencia).
# Con horario, el orden de §6.1 usa:
#   atrasada: el atraso, el primero entre C y el atraso sin horario
#     (relativa: V + intervalo; puntual con fecha límite: el hasta de la
#     ventana del día fechaLimite).
#   pendiente: en una periódica, A, el instante en que quedó disponible.
#     Una puntual conserva la clave de §6.1: 00:00 de fechaLimite; sin
#     fecha límite, al final del grupo por creadaEn.
#   en espera: A, el momento en que vuelve a pendiente.
# Las tareas sin horario siguen con los instantes de §6.1. A, C, U, V y N como
# en §5.2, §5.3 y §5.5. Semana de referencia: lunes 2026-07-13 a domingo
# 2026-07-19.
# Cada tarea se nombra por su título (una palabra). "Pendientes muestra en
# orden" da los títulos de arriba hacia abajo, separados por ", ", y la lista
# no tiene otras filas. Cuando el paso no da creadaEn, todas esas tareas se
# crearon en el mismo instante, anterior a cualquier otra fecha del escenario.
# "la tarea X se puede completar de D a H" es el horario de la tarea X.
# Las tareas se declaran en un orden distinto del esperado: el orden de carga
# no decide nada.
Feature: Order with schedule

  # Orden con horario 1
  # Atrasadas: Pagar (horario) está atrasada desde el cierre de la ventana
  # de su día límite (el 15 a las 11:00), antes que Barrer, sin horario,
  # desde las 00:00 del 16 (sin horario empatarían y Barrer iría primero
  # por título). Basura, sin horario, desde V + intervalo (el 16 a las
  # 10:45). Fila 1: Regar desde C (el 16 a las 11:00). Fila 2: Regar desde
  # V + intervalo (10:30), anterior a C.
  Scenario Outline: Order with schedule 1
    Given a relative recurring task Regar every <every> <unit>
    And the task Regar was completed on <completed_water>
    And the task Regar can be completed from <from> to <to>
    And a relative recurring task Basura every <every_trash> <unit_trash>
    And the task Basura was completed on <completed_trash>
    And a one-off task Barrer with due date <due_date>
    And a one-off task Pagar with due date <due_date>
    And the task Pagar can be completed from <from> to <to>
    When I query Pendientes on <now>
    Then Pendientes shows in order <order>

    Examples:
      | every | unit   | completed_water     | from  | to    | every_trash | unit_trash    | completed_trash     | due_date   | now                 | order                        |
      | 1    | dias   | 2026-07-15T09:00:00 | 08:00 | 11:00 | 4           | horas         | 2026-07-16T02:45:00 | 2026-07-15 | 2026-07-16T12:00:00 | Pagar, Barrer, Basura, Regar |
      | 1    | horas  | 2026-07-16T08:30:00 | 08:00 | 11:00 | 4           | horas         | 2026-07-16T02:45:00 | 2026-07-15 | 2026-07-16T12:00:00 | Pagar, Barrer, Regar, Basura |

  # Orden con horario 2
  # Pendientes: Regar (horario) está pendiente desde A, el desde del 16
  # (08:00), no desde V (el 15 a las 12:00, fuera de la ventana). Fila 1:
  # Basura, sin horario, desde V el 15 a las 20:00, va primero. Fila 2:
  # Basura desde V el 16 a las 08:30, va después.
  Scenario Outline: Order with schedule 2
    Given a relative recurring task Regar every <every> <unit>
    And the task Regar was completed on <completed_water>
    And the task Regar can be completed from <from> to <to>
    And a relative recurring task Basura every <every> <unit>
    And the task Basura was completed on <completed_trash>
    When I query Pendientes on <now>
    Then Pendientes shows in order <order>

    Examples:
      | every | unit   | completed_water     | from  | to    | completed_trash     | now                 | order         |
      | 1    | dias   | 2026-07-14T12:00:00 | 08:00 | 11:00 | 2026-07-14T20:00:00 | 2026-07-16T09:00:00 | Basura, Regar |
      | 1    | dias   | 2026-07-14T12:00:00 | 08:00 | 11:00 | 2026-07-15T08:30:00 | 2026-07-16T09:00:00 | Regar, Basura |

  # Orden con horario 3
  # En espera (sin completados, así que se ven con Mostrar completadas
  # apagado): las que vuelven antes, primero. Sábanas, sin horario, vuelve
  # el jueves a las 00:00; Basura, el jueves al abrir su ventana (09:00);
  # Foco, puntual creada después de su ventana, al abrir la del jueves.
  # Fila 1: Foco a las 08:00. Fila 2: Foco a las 10:00.
  Scenario Outline: Order with schedule 3
    Given a one-off task Foco without a due date created on <created_focus>
    And the task Foco can be completed from <from_bulb> to <to_bulb>
    And a weekly recurring task Basura on <days> created on <created_trash>
    And the task Basura can be completed from <from_trash> to <to_trash>
    And a weekly recurring task Sábanas on <days_sheets> created on <created_sheets>
    When I query Pendientes on <now>
    Then Pendientes shows in order <order>

    Examples:
      | created_focus       | from_bulb  | to_bulb    | days   | created_trash       | from_trash   | to_trash     | days_sheets  | created_sheets      | now                 | order                 |
      | 2026-07-15T12:00:00 | 08:00      | 11:00      | jueves | 2026-07-15T08:00:00 | 09:00        | 10:00        | jueves       | 2026-07-15T08:00:00 | 2026-07-15T14:00:00 | Sábanas, Foco, Basura |
      | 2026-07-15T12:00:00 | 10:00      | 11:00      | jueves | 2026-07-15T08:00:00 | 09:00        | 10:00        | jueves       | 2026-07-15T08:00:00 | 2026-07-15T14:00:00 | Sábanas, Basura, Foco |

  # Orden con horario 4
  # Pendientes: una puntual con horario conserva la clave de §6.1, no A
  # (que, por su creadaEn, sería anterior a todo). Pagar va por las 00:00
  # de su fecha límite: fila 1, el 16, antes de Basura (V el 16 a las
  # 08:30); fila 2, el 17, después. Foco, sin fecha límite, va al final.
  Scenario Outline: Order with schedule 4
    Given a one-off task Foco without a due date
    And the task Foco can be completed from <from> to <to>
    And a relative recurring task Basura every <every> <unit>
    And the task Basura was completed on <completed_trash>
    And a one-off task Pagar with due date <due_date>
    And the task Pagar can be completed from <from> to <to>
    When I query Pendientes on <now>
    Then Pendientes shows in order <order>

    Examples:
      | from  | to    | every | unit   | completed_trash     | due_date   | now                 | order               |
      | 08:00 | 11:00 | 1    | dias   | 2026-07-15T08:30:00 | 2026-07-16 | 2026-07-16T09:00:00 | Pagar, Basura, Foco |
      | 08:00 | 11:00 | 1    | dias   | 2026-07-15T08:30:00 | 2026-07-17 | 2026-07-16T09:00:00 | Basura, Pagar, Foco |
