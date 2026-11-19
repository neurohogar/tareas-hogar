# mutation-stamp: sha256=e91d749b5ec96bec6473e20adcc93403215da24a47f33622b2ffc90e32e01844
# acceptance-mutation-manifest-begin
# {"version":1,"tested_at":"2026-11-14T01:41:37.166367912Z","feature_name":"Texto de regreso","feature_path":"features/texto-de-regreso.feature","background_hash":"74234e98afe7498fb5daf1f36ac2d78acc339464f950703b8c019892f982b90b","implementation_hash":"sha256:cb9af1b362207bc964ac585e7b2680e8456d4f2ac669d19d55fa90b35b36c6c6","scenarios":[{"index":0,"name":"Texto de regreso 1","scenario_hash":"2b083408c805357c5b87f5989e9f6cec7f385b6a254ba4ec92de4497a8a32b0e","mutation_count":96,"result":{"Total":96,"Killed":96,"Survived":0,"Errors":0},"tested_at":"2026-11-14T01:41:37.166367912Z"},{"index":1,"name":"Texto de regreso 2","scenario_hash":"04ccafcca1d56440f2537ee890c1a709bdaf632bf95257a4f43f0e4f9bd5e421","mutation_count":40,"result":{"Total":40,"Killed":40,"Survived":0,"Errors":0},"tested_at":"2026-11-14T01:41:37.166367912Z"},{"index":2,"name":"Texto de regreso 3","scenario_hash":"564d57e52ac520625abbe5e1fedf4bc10d49d2bdbe729342a9e953e4415ba0f4","mutation_count":27,"result":{"Total":27,"Killed":27,"Survived":0,"Errors":0},"tested_at":"2026-11-14T01:41:37.166367912Z"},{"index":3,"name":"Texto de regreso 4","scenario_hash":"161293a4ded894ee322046cecedb97feda3d4dae8e8ade8de793e2bffdd7c41f","mutation_count":8,"result":{"Total":8,"Killed":8,"Survived":0,"Errors":0},"tested_at":"2026-11-14T01:41:37.166367912Z"},{"index":4,"name":"Texto de regreso 5","scenario_hash":"590d0ab51399ef615efc7ea686567523cedfe4d43566383a929daf0b4043c6a6","mutation_count":17,"result":{"Total":17,"Killed":17,"Survived":0,"Errors":0},"tested_at":"2026-11-14T01:41:37.166367912Z"},{"index":5,"name":"Texto de regreso 6","scenario_hash":"7427a5a3d9e3649d07595d7cc1e9fccf023558448b6dfe97344555d737e3c78c","mutation_count":30,"result":{"Total":30,"Killed":30,"Survived":0,"Errors":0},"tested_at":"2026-11-14T01:41:37.166367912Z"},{"index":6,"name":"Texto de regreso 7","scenario_hash":"65f3fea9dd631806462ab801aaff7852e02b152ddd71d2a3da7541000425b648","mutation_count":14,"result":{"Total":14,"Killed":14,"Survived":0,"Errors":0},"tested_at":"2026-11-14T01:41:37.166367912Z"},{"index":7,"name":"Texto de regreso 8","scenario_hash":"a460ddf4a3ceb01059ffa41c74df5af3fb39dd8fae4f84287ab961dd75bfac4d","mutation_count":22,"result":{"Total":22,"Killed":22,"Survived":0,"Errors":0},"tested_at":"2026-11-14T01:41:37.166367912Z"},{"index":8,"name":"Texto de regreso 9","scenario_hash":"76020d266378f4e079ddb94f5af2b15de406052929b38b64e7dc59585d79b754","mutation_count":34,"result":{"Total":34,"Killed":34,"Survived":0,"Errors":0},"tested_at":"2026-11-14T01:41:37.166367912Z"},{"index":9,"name":"Texto de regreso 10","scenario_hash":"c54d55ac21ed1ae7f015c41e7b97973df8cc24bcc82b351eb391d34894732c13","mutation_count":16,"result":{"Total":16,"Killed":16,"Survived":0,"Errors":0},"tested_at":"2026-11-14T01:41:37.166367912Z"},{"index":10,"name":"Texto de regreso 11","scenario_hash":"bfb9d1e3b84ce72eacf602e920430441420e84a04800f28896a8555abd5b8f47","mutation_count":34,"result":{"Total":34,"Killed":34,"Survived":0,"Errors":0},"tested_at":"2026-11-14T01:41:37.166367912Z"}]}
# acceptance-mutation-manifest-end

# Spec §6.1 (return text «Vuelve …» and Date and distance), with §5.2, §5.3,
# §5.5–§5.7 and §5.9 (when each task comes back). The row of a waiting task
# says when it comes back: «Vuelve <date>[ · <distance>]», with «el» only before
# the date with a weekday. It also applies to completed recurring tasks
# seen with Mostrar completadas and to postponed tasks, without naming the
# postponement. It does not change the statuses of §5 or the order of the list.
# Instant of «Vuelve» (the same one §6.1 uses to order the waiting ones):
# relative, V; calendar, 00:00 of N (no time); with a schedule, A (a one-off task
# outside the window, the from of the next one); postponed, pospuesta.hasta. If two
# causes keep it waiting, the instant it stops being so (the later one).
# Date and distance as in texto-de-atraso.feature; the future is rounded
# up, never «en 0 minutos»: counted from now, even across
# midnight, and on the hour in hours («en 1 hora», not 60 minutes).
# Without a time, with «mañana», there is no distance.
# "the task row shows the text <text>" asserts that the list has a single
# row and that it says the text. A waiting recurring task with completions is completed and
# only has a row with Mostrar completadas turned on. When the step gives no
# creadaEn, the task was created before any other date of the scenario.
# Reference week: Friday 2026-11-13 (Thursday 19, Saturday 14, Sunday 15).
Feature: Return text

  # Return text 1
  # Completed relative task: V with time. Row 2: 7 hours and 59 and a half minutes is
  # «en 8 horas» (rounded up). Rows 3 to 5: less than an hour, in
  # minutes (also 39 and a half minutes is «en 40» and 30 seconds is «en 1
  # minuto»). Row 6: exactly one hour. Row 8: crosses midnight. Rows
  # 10 and 11: another month and another year.
  Scenario Outline: Return text 1
    Given Mostrar completadas is on
    And a relative recurring task every <every> <unit>
    And the task was completed on <completed>
    When I query Pendientes on <now>
    Then the task row shows the text <text>

    Examples:
      | every | unit   | completed           | now                 | text                                                       |
      | 8    | horas  | 2026-11-13T10:00:00 | 2026-11-13T10:00:00 | Vuelve hoy 18:00 · en 8 horas                              |
      | 8    | horas  | 2026-11-13T10:00:00 | 2026-11-13T10:00:30 | Vuelve hoy 18:00 · en 8 horas                              |
      | 4    | horas  | 2026-11-13T06:40:00 | 2026-11-13T10:00:00 | Vuelve hoy 10:40 · en 40 minutos                           |
      | 4    | horas  | 2026-11-13T06:40:00 | 2026-11-13T10:00:30 | Vuelve hoy 10:40 · en 40 minutos                           |
      | 4    | horas  | 2026-11-13T06:40:00 | 2026-11-13T10:39:30 | Vuelve hoy 10:40 · en 1 minuto                             |
      | 4    | horas  | 2026-11-13T07:00:00 | 2026-11-13T10:00:00 | Vuelve hoy 11:00 · en 1 hora                               |
      | 1    | dias   | 2026-11-13T08:00:00 | 2026-11-13T10:00:00 | Vuelve mañana 08:00 · en 22 horas                          |
      | 2    | horas  | 2026-11-12T23:00:00 | 2026-11-12T23:30:00 | Vuelve mañana 01:00 · en 2 horas                           |
      | 6    | dias   | 2026-11-13T08:00:00 | 2026-11-13T10:00:00 | Vuelve el jueves 19 08:00 · en 6 días                      |
      | 6    | dias   | 2026-11-27T08:00:00 | 2026-11-27T10:00:00 | Vuelve el jueves 3 de diciembre 08:00 · en 6 días          |
      | 6    | dias   | 2026-12-30T08:00:00 | 2026-12-30T10:00:00 | Vuelve el martes 5 de enero de 2027 08:00 · en 6 días      |

  # Return text 2
  # The text advances on its own as time passes: hours, minutes and, at
  # 00:00, «mañana» becomes «hoy».
  Scenario Outline: Return text 2
    Given Mostrar completadas is on
    And a relative recurring task every <every> <unit>
    And the task was completed on <completed>
    When I query Pendientes on <now>
    Then the task row shows the text <text>

    Examples:
      | every | unit   | completed           | now                 | text                                 |
      | 8    | horas  | 2026-11-13T22:00:00 | 2026-11-13T23:00:00 | Vuelve mañana 06:00 · en 7 horas     |
      | 8    | horas  | 2026-11-13T22:00:00 | 2026-11-14T00:00:00 | Vuelve hoy 06:00 · en 6 horas        |
      | 8    | horas  | 2026-11-13T22:00:00 | 2026-11-14T05:00:00 | Vuelve hoy 06:00 · en 1 hora         |
      | 8    | horas  | 2026-11-13T22:00:00 | 2026-11-14T05:01:00 | Vuelve hoy 06:00 · en 59 minutos     |

  # Return text 3
  # Calendar task without a schedule: 00:00 of N, no time. «Mañana» carries no distance
  # (row 2: up to one second before midnight); at 2 or more days,
  # «en N días» (rows 3 and 4); another month (row 5) and another year (row 6).
  Scenario Outline: Return text 3
    Given a weekly recurring task on <days> created on <created>
    When I query Pendientes on <now>
    Then the task row shows the text <text>

    Examples:
      | days    | created             | now                 | text                                               |
      | sábado  | 2026-11-13T08:00:00 | 2026-11-13T10:00:00 | Vuelve mañana                                      |
      | sábado  | 2026-11-13T08:00:00 | 2026-11-13T23:59:59 | Vuelve mañana                                      |
      | domingo | 2026-11-13T08:00:00 | 2026-11-13T10:00:00 | Vuelve el domingo 15 · en 2 días                   |
      | jueves  | 2026-11-13T08:00:00 | 2026-11-13T10:00:00 | Vuelve el jueves 19 · en 6 días                    |
      | martes  | 2026-11-27T08:00:00 | 2026-11-27T10:00:00 | Vuelve el martes 1 de diciembre · en 4 días        |
      | lunes   | 2026-12-29T08:00:00 | 2026-12-30T10:00:00 | Vuelve el lunes 4 de enero de 2027 · en 5 días     |

  # Return text 4
  # Monthly calendar task: 00:00 of N, no time.
  Scenario Outline: Return text 4
    Given a monthly recurring task on days <days> created on <created>
    When I query Pendientes on <now>
    Then the task row shows the text <text>

    Examples:
      | days | created             | now                 | text                               |
      | 14   | 2026-11-13T08:00:00 | 2026-11-13T10:00:00 | Vuelve mañana                      |
      | 20   | 2026-11-13T08:00:00 | 2026-11-13T10:00:00 | Vuelve el viernes 20 · en 7 días   |

  # Return text 5
  # One-off task with a schedule, outside the window: waiting until the from of the
  # next one; it comes back with a time. Row 3: 22 and a half hours is «en 23 horas».
  Scenario Outline: Return text 5
    Given a one-off task without a due date created on <created>
    And the task can be completed from <from> to <to>
    When I query Pendientes on <now>
    Then the task row shows the text <text>

    Examples:
      | created             | from  | to    | now                 | text                              |
      | 2026-11-13T12:00:00 | 08:00 | 11:00 | 2026-11-13T12:00:00 | Vuelve mañana 08:00 · en 20 horas |
      | 2026-11-13T06:00:00 | 08:00 | 11:00 | 2026-11-13T07:00:00 | Vuelve hoy 08:00 · en 1 hora      |
      | 2026-11-13T12:00:00 | 10:30 | 11:00 | 2026-11-13T12:00:00 | Vuelve mañana 10:30 · en 23 horas |

  # Return text 6
  # Completed relative task with a schedule: A, not V. Row 1: V (the 14th at 12:00)
  # falls outside the window and it comes back when it opens (the 15th at 08:00). Row 3: V
  # falls inside the window and A = V.
  Scenario Outline: Return text 6
    Given Mostrar completadas is on
    And a relative recurring task every <every> <unit>
    And the task was completed on <completed>
    And the task can be completed from <from> to <to>
    When I query Pendientes on <now>
    Then the task row shows the text <text>

    Examples:
      | every | unit   | completed           | from  | to    | now                 | text                                   |
      | 1    | dias   | 2026-11-13T12:00:00 | 08:00 | 11:00 | 2026-11-13T12:00:00 | Vuelve el domingo 15 08:00 · en 2 días |
      | 12   | horas  | 2026-11-13T10:00:00 | 08:00 | 10:30 | 2026-11-13T10:00:00 | Vuelve mañana 08:00 · en 22 horas      |
      | 1    | dias   | 2026-11-13T10:00:00 | 08:00 | 11:00 | 2026-11-13T10:00:00 | Vuelve mañana 10:00 · en 24 horas      |

  # Return text 7
  # Calendar task with a schedule: A (the start of N), with a time.
  Scenario Outline: Return text 7
    Given a weekly recurring task on <days> created on <created>
    And the task can be completed from <from> to <to>
    When I query Pendientes on <now>
    Then the task row shows the text <text>

    Examples:
      | days   | created             | from  | to    | now                 | text                                  |
      | sábado | 2026-11-13T08:00:00 | 09:00 | 12:00 | 2026-11-13T10:00:00 | Vuelve mañana 09:00 · en 23 horas     |
      | jueves | 2026-11-13T08:00:00 | 09:00 | 12:00 | 2026-11-13T10:00:00 | Vuelve el jueves 19 09:00 · en 6 días |

  # Return text 8
  # Completed calendar task with several schedules: A, the start of N. Row 1:
  # it covered the morning occurrence and comes back at 18:00. Row 2: it covered the
  # afternoon one and comes back the following Friday at 07:00.
  Scenario Outline: Return text 8
    Given Mostrar completadas is on
    And a weekly recurring task on <days>
    And the task has a completion from <completed> that covers <covered>
    And the task can be completed from <from> to <to> and from <from2> to <to2>
    When I query Pendientes on <now>
    Then the task row shows the text <text>

    Examples:
      | days    | completed           | covered             | from  | to    | from2  | to2    | now                 | text                                   |
      | viernes | 2026-11-13T08:00:00 | 2026-11-13T07:00:00 | 07:00 | 10:00 | 18:00  | 21:00  | 2026-11-13T10:00:00 | Vuelve hoy 18:00 · en 8 horas          |
      | viernes | 2026-11-13T19:00:00 | 2026-11-13T18:00:00 | 07:00 | 10:00 | 18:00  | 21:00  | 2026-11-13T20:00:00 | Vuelve el viernes 20 07:00 · en 7 días |

  # Return text 9
  # Postponed: pospuesta.hasta, with a time, without naming the postponement. «Hasta
  # mañana» is 07:00 of the next day (row 3).
  Scenario Outline: Return text 9
    Given a one-off task without a due date
    And the task was postponed with option <option> on <postponed>
    When I query Pendientes on <now>
    Then the task row shows the text <text>

    Examples:
      | option       | postponed           | now                 | text                               |
      | 1 hora       | 2026-11-13T10:00:00 | 2026-11-13T10:00:00 | Vuelve hoy 11:00 · en 1 hora       |
      | 3 horas      | 2026-11-13T10:00:00 | 2026-11-13T10:00:00 | Vuelve hoy 13:00 · en 3 horas      |
      | hasta mañana | 2026-11-13T10:00:00 | 2026-11-13T10:00:00 | Vuelve mañana 07:00 · en 21 horas  |
      | 1 hora       | 2026-11-13T10:00:00 | 2026-11-13T10:20:00 | Vuelve hoy 11:00 · en 40 minutos   |

  # Return text 10
  # An overdue postponed task is waiting: it says «Vuelve», not «Tocaba».
  Scenario Outline: Return text 10
    Given a one-off task with due date <due_date>
    And the task was postponed with option <option> on <postponed>
    When I query Pendientes on <now>
    Then the task row shows the text <text>

    Examples:
      | due_date   | option       | postponed           | now                 | text                              |
      | 2026-11-10 | 3 horas      | 2026-11-13T10:00:00 | 2026-11-13T10:00:00 | Vuelve hoy 13:00 · en 3 horas     |
      | 2026-11-10 | hasta mañana | 2026-11-13T10:00:00 | 2026-11-13T10:00:00 | Vuelve mañana 07:00 · en 21 horas |

  # Return text 11
  # Two causes: a relative task postponed at 10:00 (until 13:00) and
  # completed at 10:30 is waiting because of the interval and the postponement;
  # it comes back when it stops being so, the later of the two. Row 1: the
  # postponement wins (V = 11:30). Row 2: the same, with the interval already expired and
  # waiting only because of the postponement. Row 3: the interval wins (V = 18:30).
  Scenario Outline: Return text 11
    Given Mostrar completadas is on
    And a relative recurring task every <every> <unit>
    And the task was postponed with option <option> on <postponed>
    And the task was completed on <completed>
    When I query Pendientes on <now>
    Then the task row shows the text <text>

    Examples:
      | every | unit   | option  | postponed           | completed           | now                 | text                          |
      | 1    | horas  | 3 horas | 2026-11-13T10:00:00 | 2026-11-13T10:30:00 | 2026-11-13T10:30:00 | Vuelve hoy 13:00 · en 3 horas |
      | 1    | horas  | 3 horas | 2026-11-13T10:00:00 | 2026-11-13T10:30:00 | 2026-11-13T12:00:00 | Vuelve hoy 13:00 · en 1 hora  |
      | 8    | horas  | 3 horas | 2026-11-13T10:00:00 | 2026-11-13T10:30:00 | 2026-11-13T10:30:00 | Vuelve hoy 18:30 · en 8 horas |
