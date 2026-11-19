# mutation-stamp: sha256=07eacd1d58e3e6ee107c6ee2b1bdac2e1120838313d3416a2db05ba2126342bc
# acceptance-mutation-manifest-begin
# {"version":1,"tested_at":"2026-11-16T01:39:32.163869912Z","feature_name":"Completar con horario","feature_path":"features/completar-con-horario.feature","background_hash":"74234e98afe7498fb5daf1f36ac2d78acc339464f950703b8c019892f982b90b","implementation_hash":"sha256:2b7009723e953ffe8a3d64fdb293c78d03a5d57aca6067f3c0d20c372133ac11","scenarios":[{"index":0,"name":"Completar con horario 1","scenario_hash":"a28cc5deaf366e9dbfd84eb0cebc5d5abe5c7a1c2d9e6af79a582a6d533ff0f2","mutation_count":6,"result":{"Total":6,"Killed":6,"Survived":0,"Errors":0},"tested_at":"2026-11-16T01:39:32.163869912Z"},{"index":1,"name":"Completar con horario 2","scenario_hash":"49f6925102075e4f7c0c3e368e8d4156bf29dda6fea1b44381fb591f58396017","mutation_count":8,"result":{"Total":8,"Killed":8,"Survived":0,"Errors":0},"tested_at":"2026-11-16T01:39:32.163869912Z"},{"index":2,"name":"Completar con horario 3","scenario_hash":"edca00f66047ff795e93ebfb48bb8cdba667ddeee0f7247bc5c66a315288b00a","mutation_count":12,"result":{"Total":12,"Killed":12,"Survived":0,"Errors":0},"tested_at":"2026-11-16T01:39:32.163869912Z"},{"index":3,"name":"Completar con horario 4","scenario_hash":"ffe099ddb70b89d7ff94368880900a7e4fda9b9bbcb9a1983b27479a826528d6","mutation_count":7,"result":{"Total":7,"Killed":7,"Survived":0,"Errors":0},"tested_at":"2026-11-16T01:39:32.163869912Z"},{"index":4,"name":"Completar con horario 5","scenario_hash":"11d89972db553a8bfb623455f22fdad0cca12a9defa46ab164da817402dd43ea","mutation_count":5,"result":{"Total":5,"Killed":5,"Survived":0,"Errors":0},"tested_at":"2026-11-16T01:39:32.163869912Z"},{"index":5,"name":"Completar con horario 6","scenario_hash":"ac87e5e34fbf76bfb348d3d5396936a03146b2fc86be6779eb957ccd977e50a1","mutation_count":10,"result":{"Total":10,"Killed":10,"Survived":0,"Errors":0},"tested_at":"2026-11-16T01:39:32.163869912Z"},{"index":6,"name":"Completar con horario 7","scenario_hash":"161648324a87ec5a3ab40b4b5ab28adfcb291ce0f5cf60eaff1e237310395585","mutation_count":13,"result":{"Total":13,"Killed":13,"Survived":0,"Errors":0},"tested_at":"2026-11-16T01:39:32.163869912Z"},{"index":7,"name":"Completar con horario 8","scenario_hash":"c1639680d589d4998b65e05f4d67751f305ed9384d1ea1fa0ba6f855719fc38b","mutation_count":7,"result":{"Total":7,"Killed":7,"Survived":0,"Errors":0},"tested_at":"2026-11-16T01:39:32.163869912Z"},{"index":8,"name":"Completar con horario 9","scenario_hash":"a12cde7ab013c92560f611fb0408f5b5fb852bc3ad34e9f28e6acb8c40f042e2","mutation_count":5,"result":{"Total":5,"Killed":5,"Survived":0,"Errors":0},"tested_at":"2026-11-16T01:39:32.163869912Z"},{"index":9,"name":"Completar con horario 10","scenario_hash":"d1a965533bbac47ca651991b5bfbf48e04124d475a83c5115d67c9cef11a8958","mutation_count":6,"result":{"Total":6,"Killed":6,"Survived":0,"Errors":0},"tested_at":"2026-11-16T01:39:32.163869912Z"},{"index":10,"name":"Completar con horario 11","scenario_hash":"54d655d979926c487f6974b305383203ce919fe84867b5cc306c772b6079a678","mutation_count":2,"result":{"Total":2,"Killed":2,"Survived":0,"Errors":0},"tested_at":"2026-11-16T01:39:32.163869912Z"},{"index":11,"name":"Completar con horario 12","scenario_hash":"f324fe61db17bfc32a4e4024a1a5bde685845935a09b6179253a62ca38eb831c","mutation_count":5,"result":{"Total":5,"Killed":5,"Survived":0,"Errors":0},"tested_at":"2026-11-16T01:39:32.163869912Z"},{"index":12,"name":"Completar con horario 13","scenario_hash":"284d9e01639e9e378100fdba3d221ef9ca5c527906feaab032fe1323db75c6ab","mutation_count":8,"result":{"Total":8,"Killed":8,"Survived":0,"Errors":0},"tested_at":"2026-11-16T01:39:32.163869912Z"},{"index":13,"name":"Completar con horario 14","scenario_hash":"24d325133ad3894ec02195820b9193c56dead01551c74c8a07b8de4b4a022fc7","mutation_count":12,"result":{"Total":12,"Killed":12,"Survived":0,"Errors":0},"tested_at":"2026-11-16T01:39:32.163869912Z"},{"index":14,"name":"Completar con horario 15","scenario_hash":"0a399abcfe691dfe96f29657204067859d041b630444615b3d4790311563f7af","mutation_count":7,"result":{"Total":7,"Killed":7,"Survived":0,"Errors":0},"tested_at":"2026-11-16T01:39:32.163869912Z"},{"index":15,"name":"Completar con horario 16","scenario_hash":"58d235dcefe256b7ec9450b61e974c75c5b2afac36c2aae24019606dcb13bb96","mutation_count":4,"result":{"Total":4,"Killed":4,"Survived":0,"Errors":0},"tested_at":"2026-11-16T01:39:32.163869912Z"}]}
# acceptance-mutation-manifest-end

# Spec §5.5 y §6.1 (checkbox de la fila y Mostrar completadas), con §5.2–§5.4.
# Completar solo es posible dentro de la ventana [desde, hasta): si tocar el
# checkbox completaría la tarea y ahora está fuera de su ventana, el checkbox
# está deshabilitado y tocarlo no hace nada. Si tocarlo borraría un completado
# (puntual completada, o periódica completada cuyo completado más reciente es
# de hoy o posterior), siempre está habilitado. Deshacer en el aviso también
# se puede a cualquier hora.
# Una vez atrasada, sigue atrasada fuera de las ventanas, pero solo se puede
# completar dentro de una. El completado se rige por §5.2/§5.3 como siempre.
# Una en espera por horario que tiene completados está completada: con
# Mostrar completadas apagado no se ve hasta que abre la ventana. Una en
# espera sin completados no está completada y se ve.
# "la tarea se puede completar de X a Y" es el horario de la tarea.
# "consulto Pendientes el <ahora>" mira la fila de la única tarea del
# escenario en ese momento.
# El progreso es una fracción entre 0 y 1, comparada exactamente.
# Semana de referencia: lunes 2026-07-13 a domingo 2026-07-19.
Feature: Complete with schedule

  # Completar con horario 1
  # Dentro de la ventana, el checkbox de una no completada está habilitado.
  # Fila 1: el desde es inclusive.
  Scenario Outline: Complete with schedule 1
    Given a one-off task without a due date created on <created>
    And the task can be completed from <from> to <to>
    When I query Pendientes on <now>
    Then the task checkbox is enabled

    Examples:
      | created             | from  | to    | now                 |
      | 2026-07-15T06:00:00 | 08:00 | 11:00 | 2026-07-15T08:00:00 |
      | 2026-07-15T06:00:00 | 08:00 | 11:00 | 2026-07-15T10:59:59 |

  # Completar con horario 2
  # Fuera de la ventana, el checkbox de una no completada está
  # deshabilitado. Fila 2: el hasta es exclusive.
  Scenario Outline: Complete with schedule 2
    Given a one-off task without a due date created on <created>
    And the task can be completed from <from> to <to>
    When I query Pendientes on <now>
    Then the task checkbox is disabled

    Examples:
      | created             | from  | to    | now                 |
      | 2026-07-15T06:00:00 | 08:00 | 11:00 | 2026-07-15T07:59:59 |
      | 2026-07-15T06:00:00 | 08:00 | 11:00 | 2026-07-15T11:00:00 |
      | 2026-07-15T06:00:00 | 08:00 | 11:00 | 2026-07-16T03:00:00 |

  # Completar con horario 3
  # Una atrasada fuera de la ventana tiene el checkbox deshabilitado. Fila
  # 1: atrasada antes de que abra la ventana (V + intervalo a las 18:00).
  Scenario Outline: Complete with schedule 3
    Given a relative recurring task every <every> <unit>
    And the task was completed on <completed>
    And the task can be completed from <from> to <to>
    When I query Pendientes on <now>
    Then the task checkbox is disabled

    Examples:
      | every | unit   | completed           | from  | to    | now                 |
      | 4    | horas  | 2026-07-15T10:00:00 | 08:00 | 11:00 | 2026-07-15T20:00:00 |
      | 1    | dias   | 2026-07-15T09:00:00 | 08:00 | 11:00 | 2026-07-16T11:00:00 |

  # Completar con horario 4
  # Una atrasada dentro de la próxima ventana tiene el checkbox habilitado.
  Scenario Outline: Complete with schedule 4
    Given a relative recurring task every <every> <unit>
    And the task was completed on <completed>
    And the task can be completed from <from> to <to>
    When I query Pendientes on <now>
    Then the task checkbox is enabled

    Examples:
      | every | unit   | completed           | from  | to    | now                 |
      | 4    | horas  | 2026-07-15T10:00:00 | 08:00 | 11:00 | 2026-07-16T08:00:00 |
      | 1    | dias   | 2026-07-15T09:00:00 | 08:00 | 11:00 | 2026-07-17T09:00:00 |

  # Completar con horario 5
  # Tocar el checkbox deshabilitado no registra ningún completado.
  Scenario Outline: Complete with schedule 5
    Given a one-off task without a due date created on <created>
    And the task can be completed from <from> to <to>
    When I tap the task checkbox on <tap>
    Then the task has no completions

    Examples:
      | created             | from  | to    | tap                 |
      | 2026-07-15T06:00:00 | 08:00 | 11:00 | 2026-07-15T07:00:00 |
      | 2026-07-15T06:00:00 | 08:00 | 11:00 | 2026-07-15T11:00:00 |

  # Completar con horario 6
  # Tocar el checkbox dentro de la ventana completa la tarea y sale de
  # Pendientes.
  Scenario Outline: Complete with schedule 6
    Given a one-off task without a due date created on <created>
    And the task can be completed from <from> to <to>
    When I tap the task checkbox on <tap>
    And I query the status at any moment
    Then a completion without a covered occurrence was recorded
    And the recorded completion is from <tap_stored>
    And the task does not appear in Pendientes

    Examples:
      | created             | from  | to    | tap                 | tap_stored          |
      | 2026-07-15T06:00:00 | 08:00 | 11:00 | 2026-07-15T10:59:59 | 2026-07-15T10:59:59 |

  # Completar con horario 7
  # Una relativa atrasada se completa en la próxima ventana: reinicia el
  # intervalo desde el toque (V = 18 a las 08:00, dentro de la ventana).
  Scenario Outline: Complete with schedule 7
    Given a relative recurring task every <every> <unit>
    And the task was completed on <previous>
    And the task can be completed from <from> to <to>
    When I tap the task checkbox on <tap>
    And I query the status on <now>
    Then the new completion is added without changing the previous ones
    And the status is en espera
    And the progress is <progress>

    Examples:
      | every | unit   | previous            | from  | to    | tap                 | now                 | progress |
      | 1    | dias   | 2026-07-15T09:00:00 | 08:00 | 11:00 | 2026-07-17T08:00:00 | 2026-07-17T20:00:00 | 0.5      |

  # Completar con horario 8
  # Una de calendario atrasada desde el cierre del jueves se completa el
  # viernes dentro de la ventana: cubre el jueves, como en §5.3. Con horario,
  # la ocurrencia cubierta se guarda con la hora desde de su ventana (§4.4).
  Scenario Outline: Complete with schedule 8
    Given a weekly recurring task on <days>
    And the task has a completion from <previous> that covers <covered_previous>
    And the task can be completed from <from> to <to>
    When I tap the task checkbox on <tap>
    Then the new completion is added without changing the previous ones
    And a completion was recorded that covers <covered>

    Examples:
      | days           | previous            | covered_previous  | from  | to    | tap                 | covered             |
      | martes, jueves | 2026-07-14T08:00:00 | 2026-07-14        | 08:00 | 11:00 | 2026-07-17T09:00:00 | 2026-07-16T08:00:00 |

  # Completar con horario 9
  # Una periódica completada cuyo completado más reciente es de un día
  # anterior: tocar el checkbox la completaría de nuevo, así que fuera de la
  # ventana está deshabilitado.
  Scenario Outline: Complete with schedule 9
    Given Mostrar completadas is on
    And a relative recurring task every <every> <unit>
    And the task was completed on <completed>
    And the task can be completed from <from> to <to>
    When I query Pendientes on <now>
    Then the task is completed
    And the task checkbox is disabled

    Examples:
      | every | unit   | completed           | from  | to    | now                 |
      | 3    | dias   | 2026-07-14T09:00:00 | 08:00 | 11:00 | 2026-07-15T12:00:00 |

  # Completar con horario 10
  # La misma periódica completada, dentro de la ventana: tocar el checkbox
  # la completa de nuevo.
  Scenario Outline: Complete with schedule 10
    Given Mostrar completadas is on
    And a relative recurring task every <every> <unit>
    And the task was completed on <completed>
    And the task can be completed from <from> to <to>
    When I tap the task checkbox on <tap>
    Then the new completion is added without changing the previous ones

    Examples:
      | every | unit   | completed           | from  | to    | tap                 |
      | 3    | dias   | 2026-07-14T09:00:00 | 08:00 | 11:00 | 2026-07-15T09:00:00 |

  # Completar con horario 11
  # Una puntual completada, fuera de la ventana: el checkbox borraría su
  # completado, así que está habilitado: tocarlo lo borra y la tarea vuelve
  # en espera hasta la próxima ventana.
  Scenario Outline: Complete with schedule 11
    Given Mostrar completadas is on
    And a one-off task without a due date created on <created>
    And the task was completed on <completed>
    And the task can be completed from <from> to <to>
    When I tap the task checkbox on <tap>
    And I query the status on <now>
    Then the task has no completions
    And the status is en espera

    Examples:
      | created             | completed           | from  | to    | tap                 | now                 |
      | 2026-07-15T06:00:00 | 2026-07-15T09:00:00 | 08:00 | 11:00 | 2026-07-15T20:00:00 | 2026-07-15T20:00:01 |

  # Completar con horario 12
  # Una periódica completada hoy, fuera de la ventana: el checkbox borraría
  # su completado, así que está habilitado: tocarlo lo borra.
  Scenario Outline: Complete with schedule 12
    Given Mostrar completadas is on
    And a relative recurring task every <every> <unit>
    And the task was completed on <completed>
    And the task can be completed from <from> to <to>
    When I tap the task checkbox on <tap>
    Then the task has no completions

    Examples:
      | every | unit   | completed           | from  | to    | tap                 |
      | 3    | dias   | 2026-07-15T09:00:00 | 08:00 | 11:00 | 2026-07-15T20:00:00 |

  # Completar con horario 13
  # Deshacer en el aviso se puede aunque la ventana ya cerró.
  Scenario Outline: Complete with schedule 13
    Given a one-off task without a due date created on <created>
    And the task can be completed from <from> to <to>
    When I tap the task checkbox on <tap>
    And I tap Deshacer in the notice on <undo>
    Then the task has no completions

    Examples:
      | created             | from  | to    | tap                 | undo                |
      | 2026-07-15T06:00:00 | 08:00 | 11:00 | 2026-07-15T10:59:58 | 2026-07-15T11:00:02 |

  # Completar con horario 14
  # Con Mostrar completadas apagado, una periódica en espera por horario con
  # completados está completada y no se ve: ya pasó V (sin horario estaría
  # pendiente) pero la ventana todavía no abrió.
  Scenario Outline: Complete with schedule 14
    Given a relative recurring task every <every> <unit>
    And the task was completed on <completed>
    And the task can be completed from <from> to <to>
    When I query Pendientes on <now>
    Then the task does not appear in Pendientes

    Examples:
      | every | unit   | completed           | from  | to    | now                 |
      | 1    | dias   | 2026-07-15T12:00:00 | 08:00 | 11:00 | 2026-07-16T14:00:00 |
      | 1    | dias   | 2026-07-15T12:00:00 | 08:00 | 11:00 | 2026-07-17T07:59:59 |

  # Completar con horario 15
  # La misma periódica aparece cuando abre la ventana, pendiente.
  Scenario Outline: Complete with schedule 15
    Given a relative recurring task every <every> <unit>
    And the task was completed on <completed>
    And the task can be completed from <from> to <to>
    When I query Pendientes on <now>
    Then the task appears in Pendientes

    Examples:
      | every | unit   | completed           | from  | to    | now                 |
      | 1    | dias   | 2026-07-15T12:00:00 | 08:00 | 11:00 | 2026-07-17T08:00:00 |

  # Completar con horario 16
  # Una puntual en espera por horario no tiene completados: no está
  # completada y se ve con Mostrar completadas apagado.
  Scenario Outline: Complete with schedule 16
    Given a one-off task without a due date created on <created>
    And the task can be completed from <from> to <to>
    When I query Pendientes on <now>
    Then the task appears in Pendientes

    Examples:
      | created             | from  | to    | now                 |
      | 2026-07-15T06:00:00 | 08:00 | 11:00 | 2026-07-15T07:00:00 |
      | 2026-07-15T06:00:00 | 08:00 | 11:00 | 2026-07-15T20:00:00 |
