# mutation-stamp: sha256=9e465e5269ac2ed0aca06f23318e1e57d8c4e042b528f855b91dfb445095a945
# acceptance-mutation-manifest-begin
# {"version":1,"tested_at":"2026-11-17T21:01:45.938517909Z","feature_name":"Orden de Pendientes","feature_path":"features/orden-pendientes.feature","background_hash":"74234e98afe7498fb5daf1f36ac2d78acc339464f950703b8c019892f982b90b","implementation_hash":"sha256:5720495ceadfc94c3459d9eab68e4b959909b08456a81c18d7fffa2d218bb2d7","scenarios":[{"index":0,"name":"Orden de Pendientes 1","scenario_hash":"2b0779f4a4445675b56feb1a9247ac318275af4545b3e1da92b33dc1d193e8e1","mutation_count":28,"result":{"Total":28,"Killed":28,"Survived":0,"Errors":0},"tested_at":"2026-11-17T21:01:45.938517909Z"},{"index":1,"name":"Orden de Pendientes 2","scenario_hash":"9be50305d35e96097d7727eff93c088c41f394b40c35afd83a5dfd6ce2e15250","mutation_count":15,"result":{"Total":15,"Killed":15,"Survived":0,"Errors":0},"tested_at":"2026-11-17T21:01:45.938517909Z"},{"index":2,"name":"Orden de Pendientes 3","scenario_hash":"5b097ccf8b329a4ec2b060248fc8936340614a47776fbcca1e053d8f194fdd5a","mutation_count":16,"result":{"Total":16,"Killed":16,"Survived":0,"Errors":0},"tested_at":"2026-11-17T21:01:45.938517909Z"},{"index":3,"name":"Orden de Pendientes 4","scenario_hash":"bc9608112d54563a580b5de47a566ab41c99d0d7327716eb64bb62cbd8548777","mutation_count":20,"result":{"Total":20,"Killed":20,"Survived":0,"Errors":0},"tested_at":"2026-11-17T21:01:45.938517909Z"},{"index":4,"name":"Orden de Pendientes 5","scenario_hash":"e963f15b57169748e9a1d44866e68c6240fcb5116bc99d31260617b896930f98","mutation_count":11,"result":{"Total":11,"Killed":11,"Survived":0,"Errors":0},"tested_at":"2026-11-17T21:01:45.938517909Z"},{"index":5,"name":"Orden de Pendientes 6","scenario_hash":"24b14c9c003091dbf9c08dd11eb05ebba6f85c5708b00d9f24f65b400f2055d6","mutation_count":8,"result":{"Total":8,"Killed":8,"Survived":0,"Errors":0},"tested_at":"2026-11-17T21:01:45.938517909Z"},{"index":6,"name":"Orden de Pendientes 7","scenario_hash":"b563940469eeb0fd67a4fb4053bdd036f6b2da42c3f9ce8c24c722cb75c64771","mutation_count":7,"result":{"Total":7,"Killed":7,"Survived":0,"Errors":0},"tested_at":"2026-11-17T21:01:45.938517909Z"},{"index":7,"name":"Orden de Pendientes 8","scenario_hash":"c8a3e932d38f5617d7be6365fad8f097971bab3992514ac6f5f726987f8caa4d","mutation_count":12,"result":{"Total":12,"Killed":12,"Survived":0,"Errors":0},"tested_at":"2026-11-17T21:01:45.938517909Z"},{"index":8,"name":"Orden de Pendientes 9","scenario_hash":"03e61583d36fd0ea3bcf77189809cd7fc3729e797f4edd590ff6d6ae901e4f50","mutation_count":13,"result":{"Total":13,"Killed":13,"Survived":0,"Errors":0},"tested_at":"2026-11-17T21:01:45.938517909Z"},{"index":9,"name":"Orden de Pendientes 10","scenario_hash":"a62491e86e8af5a10cee4f93f77de789c370ffa8506114b00ce3129b4b0b6bc4","mutation_count":11,"result":{"Total":11,"Killed":11,"Survived":0,"Errors":0},"tested_at":"2026-11-17T21:01:45.938517909Z"},{"index":10,"name":"Orden de Pendientes 11","scenario_hash":"98e9b39c4efc07d3aac5307c805c6714b07a0720fca74850a9325e4983e2f4ed","mutation_count":28,"result":{"Total":28,"Killed":28,"Survived":0,"Errors":0},"tested_at":"2026-11-17T21:01:45.938517909Z"}]}
# acceptance-mutation-manifest-end

# Spec §6.1 (orden por urgencia), con los estados de §5.1–§5.3 y §10 criterio 3.
# Pendientes es una sola lista en tres grupos: atrasada, después pendiente,
# después en espera. Dentro de cada grupo se compara un instante (hora local),
# del más antiguo al más reciente:
#   atrasada (desde que está atrasada): puntual = 00:00 del día siguiente a
#     fechaLimite; relativa = V + intervalo; calendario = 00:00 del día
#     siguiente a N.
#   pendiente (desde que está pendiente): puntual = 00:00 de fechaLimite;
#     relativa = V, o creadaEn si nunca se completó; calendario = 00:00 de N.
#     Las puntuales sin fecha límite van al final del grupo, por creadaEn.
#   en espera (cuándo vuelve a pendiente): relativa = V; calendario = 00:00 de N.
# Con Mostrar completadas apagado (el valor inicial, §6.1) las completadas no
# se ven: la puntual con completados y la periódica en espera con completados.
# Así, el grupo en espera visible tiene solo periódicas de calendario sin
# completados, antes de su primera ocurrencia (Sábanas, con su creadaEn).
# Desempate: creadaEn más antigua primero; después título en orden alfabético
# en español (sin distinguir mayúsculas ni acentos, ñ después de n); después
# id (no observable, no se especifica con ejemplos).
# U, V, P y N como en §5.2 y §5.3. Semana de referencia: lunes 2026-07-13 a
# domingo 2026-07-19.
# Cada tarea se nombra por su título (una palabra). "Pendientes muestra en
# orden" da los títulos de arriba hacia abajo, separados por ", ", y la lista
# no tiene otras filas. Cuando el paso no da creadaEn, todas esas tareas se
# crearon en el mismo instante, anterior a cualquier otra fecha del escenario.
# "tiene un completado que cubre el ..." es un completado ya guardado con esa
# ocurrenciaCubierta; su momento no influye en el resultado mientras la
# tarea no esté en espera.
# Las tareas se declaran en un orden distinto del esperado: el orden de carga
# no decide nada.
Feature: Pendientes order

  # Orden de Pendientes 1
  # Los grupos van atrasada, pendiente, en espera, con cualquier tipo en
  # atrasada y en pendiente. Fila 2: Sábanas vuelve el 16, antes de que
  # Pagar esté pendiente (el 20), y va después igual. Fila 3: la relativa
  # atrasada recién desde ahora va antes que la puntual pendiente desde las
  # 00:00 de hoy (manda el grupo, no el instante).
  Scenario Outline: Pendientes order 1
    Given a weekly recurring task Sábanas on <days_sheets> created on <created_sheets>
    And a one-off task Pagar with due date <due_date>
    And a weekly recurring task Basura on <days>
    And the task Basura has a completion that covers <covered>
    And a relative recurring task Regar every <every> <unit>
    And the task Regar was completed on <completed>
    When I query Pendientes on <now>
    Then Pendientes shows in order <order>

    Examples:
      | due_date   | days      | covered    | every | unit   | completed           | days_sheets  | created_sheets      | now                 | order                         |
      | 2026-07-14 | miércoles | 2026-07-08 | 4    | horas  | 2026-07-15T07:00:00 | sábado       | 2026-07-15T08:00:00 | 2026-07-15T12:00:00 | Pagar, Basura, Regar, Sábanas |
      | 2026-07-20 | lunes     | 2026-07-06 | 1    | dias   | 2026-07-14T08:00:00 | jueves       | 2026-07-15T08:00:00 | 2026-07-15T12:00:00 | Basura, Regar, Pagar, Sábanas |
      | 2026-07-15 | lunes     | 2026-07-06 | 1    | horas  | 2026-07-15T10:00:00 | sábado       | 2026-07-15T08:00:00 | 2026-07-15T12:00:00 | Basura, Regar, Pagar, Sábanas |

  # Orden de Pendientes 2
  # Atrasadas: primero la que lleva más tiempo atrasada, contado desde que
  # entró en atrasada (no desde V). Fila 1: Basura desde el 10, Regar desde el
  # 14 a las 20:00, Pagar desde el 15. Fila 2: Regar con V el 14 a las 04:00
  # pero atrasada recién desde el 15 a las 04:00, después de Pagar (desde el
  # 9). Fila 3: relativa de horas atrasada desde el 8 a las 20:00.
  Scenario Outline: Pendientes order 2
    Given a one-off task Pagar with due date <due_date>
    And a weekly recurring task Basura on <days>
    And the task Basura has a completion that covers <covered>
    And a relative recurring task Regar every <every> <unit>
    And the task Regar was completed on <completed>
    When I query Pendientes on <now>
    Then Pendientes shows in order <order>

    Examples:
      | due_date   | days           | covered    | every | unit   | completed           | now                 | order                |
      | 2026-07-14 | martes, jueves | 2026-07-07 | 1    | dias   | 2026-07-12T20:00:00 | 2026-07-17T12:00:00 | Basura, Regar, Pagar |
      | 2026-07-08 | jueves         | 2026-07-02 | 1    | dias   | 2026-07-13T04:00:00 | 2026-07-17T12:00:00 | Pagar, Basura, Regar |
      | 2026-07-14 | viernes        | 2026-07-03 | 12   | horas  | 2026-07-07T20:00:00 | 2026-07-17T12:00:00 | Regar, Basura, Pagar |

  # Orden de Pendientes 3
  # Pendientes de los tres tipos: primero la que está pendiente desde antes.
  # Fila 1: Regar desde el 15 a las 20:00, Basura desde las 00:00 de hoy,
  # Pagar con fecha límite futura. Fila 2: Regar pendiente desde hoy a las
  # 09:00, después de Basura.
  Scenario Outline: Pendientes order 3
    Given a one-off task Pagar with due date <due_date>
    And a weekly recurring task Basura on <days>
    And the task Basura has a completion that covers <covered>
    And a relative recurring task Regar every <every> <unit>
    And the task Regar was completed on <completed>
    When I query Pendientes on <now>
    Then Pendientes shows in order <order>

    Examples:
      | due_date   | days           | covered    | every | unit   | completed           | now                 | order                |
      | 2026-07-20 | martes, jueves | 2026-07-14 | 1    | dias   | 2026-07-14T20:00:00 | 2026-07-16T12:00:00 | Regar, Basura, Pagar |
      | 2026-07-17 | jueves         | 2026-07-09 | 4    | horas  | 2026-07-16T05:00:00 | 2026-07-16T12:00:00 | Basura, Regar, Pagar |

  # Orden de Pendientes 4
  # Puntual con fecha límite contra relativa: la fecha límite cuenta desde
  # las 00:00 de ese día. Fila 1: fecha límite hoy (00:00) antes que V hoy a
  # las 09:00. Fila 2: fecha límite mañana, después. Fila 3: V ayer a las
  # 23:00, antes que la fecha límite de hoy.
  Scenario Outline: Pendientes order 4
    Given a one-off task Pagar with due date <due_date>
    And a relative recurring task Regar every <every> <unit>
    And the task Regar was completed on <completed>
    When I query Pendientes on <now>
    Then Pendientes shows in order <order>

    Examples:
      | due_date   | every | unit   | completed           | now                 | order        |
      | 2026-07-16 | 4    | horas  | 2026-07-16T05:00:00 | 2026-07-16T12:00:00 | Pagar, Regar |
      | 2026-07-17 | 4    | horas  | 2026-07-16T05:00:00 | 2026-07-16T12:00:00 | Regar, Pagar |
      | 2026-07-16 | 2    | dias   | 2026-07-13T23:00:00 | 2026-07-16T12:00:00 | Regar, Pagar |

  # Orden de Pendientes 5
  # Una relativa nunca completada está pendiente desde su creadaEn y compite
  # en el mismo eje. Fila 2: creada un segundo antes de las 00:00 de la
  # fecha límite de Pagar.
  Scenario Outline: Pendientes order 5
    Given a one-off task Pagar with due date <due_date>
    And a relative recurring task Regar never completed created on <created_water>
    When I query Pendientes on <now>
    Then Pendientes shows in order <order>

    Examples:
      | due_date   | created_water       | now                 | order        |
      | 2026-07-15 | 2026-07-15T10:00:00 | 2026-07-15T12:00:00 | Pagar, Regar |
      | 2026-07-15 | 2026-07-14T23:59:59 | 2026-07-15T12:00:00 | Regar, Pagar |
      | 2026-07-16 | 2026-07-15T10:00:00 | 2026-07-15T12:00:00 | Regar, Pagar |

  # Orden de Pendientes 6
  # Las puntuales sin fecha límite van al final del grupo pendiente, por
  # creadaEn (la más antigua primero), aunque se hayan creado antes que las
  # demás.
  Scenario Outline: Pendientes order 6
    Given a one-off task Foco without a due date created on <created_focus>
    And a one-off task Dentista without a due date created on <created_dentist>
    And a relative recurring task Regar never completed created on <created_water>
    And a one-off task Pagar with due date <due_date>
    When I query Pendientes on <now>
    Then Pendientes shows in order <order>

    Examples:
      | created_focus       | created_dentist     | created_water       | due_date   | now                 | order                         |
      | 2026-07-01T08:00:00 | 2026-07-01T08:00:01 | 2026-07-10T08:00:00 | 2026-12-31 | 2026-07-15T12:00:00 | Regar, Pagar, Foco, Dentista  |
      | 2026-07-01T08:00:01 | 2026-07-01T08:00:00 | 2026-07-10T08:00:00 | 2026-12-31 | 2026-07-15T12:00:00 | Regar, Pagar, Dentista, Foco  |

  # Orden de Pendientes 7
  # En espera: primero la que vuelve antes (00:00 de N), aunque se haya
  # creado después. Antes de su primera ocurrencia, P es el día anterior a
  # creadaEn. Fila 3: N de la mensual cae en el mes siguiente.
  Scenario Outline: Pendientes order 7
    Given a weekly recurring task Basura on <days_trash> created on <created_trash>
    And a monthly recurring task Sábanas on days <days_sheets> created on <created_sheets>
    When I query Pendientes on <now>
    Then Pendientes shows in order <order>

    Examples:
      | days_trash  | created_trash       | days_sheets  | created_sheets      | now                 | order           |
      | jueves      | 2026-07-15T08:00:00 | 17           | 2026-07-15T07:00:00 | 2026-07-15T12:00:00 | Basura, Sábanas |
      | sábado      | 2026-07-15T07:00:00 | 17           | 2026-07-15T08:00:00 | 2026-07-15T12:00:00 | Sábanas, Basura |
      | jueves      | 2026-07-15T08:00:00 | 1            | 2026-07-15T07:00:00 | 2026-07-15T12:00:00 | Basura, Sábanas |

  # Orden de Pendientes 8
  # Desempate en pendiente: con la misma fecha límite, primero la de
  # creadaEn más antigua (aunque su título vaya después).
  Scenario Outline: Pendientes order 8
    Given a one-off task Planchar with due date <due_date_iron> created on <created_iron>
    And a one-off task Barrer with due date <due_date_sweep> created on <created_sweep>
    When I query Pendientes on <now>
    Then Pendientes shows in order <order>

    Examples:
      | due_date_iron   | created_iron        | due_date_sweep | created_sweep       | now                 | order            |
      | 2026-07-20      | 2026-07-10T08:00:00 | 2026-07-20    | 2026-07-10T08:00:01 | 2026-07-15T12:00:00 | Planchar, Barrer |
      | 2026-07-20      | 2026-07-10T08:00:01 | 2026-07-20    | 2026-07-10T08:00:00 | 2026-07-15T12:00:00 | Barrer, Planchar |

  # Orden de Pendientes 9
  # Desempate en atrasada entre tipos: la puntual con fecha límite el 9 y la
  # semanal con N el 9 están atrasadas desde el 10 a las 00:00; primero la de
  # creadaEn más antigua.
  Scenario Outline: Pendientes order 9
    Given a one-off task Pagar with due date <due_date> created on <created_pay>
    And a weekly recurring task Basura on <days> created on <created_trash>
    And the task Basura has a completion that covers <covered>
    When I query Pendientes on <now>
    Then Pendientes shows in order <order>

    Examples:
      | due_date   | created_pay         | days           | created_trash       | covered    | now                 | order         |
      | 2026-07-09 | 2026-07-01T08:00:00 | martes, jueves | 2026-07-01T08:00:01 | 2026-07-07 | 2026-07-15T12:00:00 | Pagar, Basura |
      | 2026-07-09 | 2026-07-01T08:00:01 | martes, jueves | 2026-07-01T08:00:00 | 2026-07-07 | 2026-07-15T12:00:00 | Basura, Pagar |

  # Orden de Pendientes 10
  # Desempate en espera entre semanal y mensual: las dos vuelven el 16 a las
  # 00:00; primero la de creadaEn más antigua.
  Scenario Outline: Pendientes order 10
    Given a weekly recurring task Basura on <days_trash> created on <created_trash>
    And a monthly recurring task Sábanas on days <days_sheets> created on <created_sheets>
    When I query Pendientes on <now>
    Then Pendientes shows in order <order>

    Examples:
      | days_trash  | created_trash       | days_sheets  | created_sheets      | now                 | order           |
      | jueves      | 2026-07-15T08:00:00 | 16           | 2026-07-15T08:00:01 | 2026-07-15T12:00:00 | Basura, Sábanas |
      | jueves      | 2026-07-15T08:00:01 | 16           | 2026-07-15T08:00:00 | 2026-07-15T12:00:00 | Sábanas, Basura |

  # Orden de Pendientes 11
  # Desempate por título cuando también coincide creadaEn: orden alfabético
  # en español. Fila 1: la ñ va después de la n. Fila 2: la Á va con la A.
  # Fila 3: sin distinguir mayúsculas. Fila 4: el título que se declara
  # primero también puede ir primero.
  Scenario Outline: Pendientes order 11
    Given a one-off task <title_1> without a due date created on <created_1>
    And a one-off task <title_2> without a due date created on <created_2>
    When I query Pendientes at any moment
    Then Pendientes shows in order <order>

    Examples:
      | title_1  | created_1           | title_2    | created_2           | order               |
      | Ñandú    | 2026-07-10T08:00:00 | Nube       | 2026-07-10T08:00:00 | Nube, Ñandú         |
      | Barrer   | 2026-07-10T08:00:00 | Árbol      | 2026-07-10T08:00:00 | Árbol, Barrer       |
      | Zapallo  | 2026-07-10T08:00:00 | acelga     | 2026-07-10T08:00:00 | acelga, Zapallo     |
      | Cocina   | 2026-07-10T08:00:00 | Dormitorio | 2026-07-10T08:00:00 | Cocina, Dormitorio  |
