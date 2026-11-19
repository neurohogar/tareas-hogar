# mutation-stamp: sha256=a39c10e21ea3a80dea761f0bb604275e3fe9a03b4b9c7273a826ee4a872d73ec
# acceptance-mutation-manifest-begin
# {"version":1,"tested_at":"2026-11-17T21:07:18.045963662Z","feature_name":"Posponer tarea","feature_path":"features/posponer-tarea.feature","background_hash":"74234e98afe7498fb5daf1f36ac2d78acc339464f950703b8c019892f982b90b","implementation_hash":"sha256:de04e947ae46f373725d9bdd6bcfc281667430145e0bab2e523e0337b24c5923","scenarios":[{"index":0,"name":"Posponer tarea 1","scenario_hash":"c2967b3e9b90c6b9c45bd4788dc6cac504de264515ce9aa4c86ddec238e930a5","mutation_count":104,"result":{"Total":104,"Killed":104,"Survived":0,"Errors":0},"tested_at":"2026-11-17T21:07:18.045963662Z"},{"index":1,"name":"Posponer tarea 2","scenario_hash":"2372269cc1a8a972ef8d815ae57e70b9c7db597cdd4e57043d028c4a9fa8262f","mutation_count":13,"result":{"Total":13,"Killed":13,"Survived":0,"Errors":0},"tested_at":"2026-11-17T21:07:18.045963662Z"},{"index":2,"name":"Posponer tarea 3","scenario_hash":"33acad8b1d458b5ddfb2c26e508c30b4097b309d6c370dec02cf9b6f667c8561","mutation_count":20,"result":{"Total":20,"Killed":20,"Survived":0,"Errors":0},"tested_at":"2026-11-17T21:07:18.045963662Z"},{"index":3,"name":"Posponer tarea 4","scenario_hash":"13d19b8a62d5beeef93150494af30fcf2c4de5106829b39098c383fdbabb7bba","mutation_count":2,"result":{"Total":2,"Killed":2,"Survived":0,"Errors":0},"tested_at":"2026-11-17T21:07:18.045963662Z"},{"index":4,"name":"Posponer tarea 5","scenario_hash":"fc9a3f773ee87992036c8a07f5388f73c502e1953a3a8d7785dde48dcaee106c","mutation_count":1,"result":{"Total":1,"Killed":1,"Survived":0,"Errors":0},"tested_at":"2026-11-17T21:07:18.045963662Z"},{"index":5,"name":"Posponer tarea 6","scenario_hash":"fbfb748bcb075c53a4339ed3f048d521c93e651e2b80ef35adc11ae35ce02ccc","mutation_count":2,"result":{"Total":2,"Killed":2,"Survived":0,"Errors":0},"tested_at":"2026-11-17T21:07:18.045963662Z"},{"index":6,"name":"Posponer tarea 7","scenario_hash":"7d8f6c506d47a5d11ec3b5fb993dde71d86d4760f0b973ecfb9d6671a368dbf5","mutation_count":47,"result":{"Total":47,"Killed":47,"Survived":0,"Errors":0},"tested_at":"2026-11-17T21:07:18.045963662Z"},{"index":7,"name":"Posponer tarea 8","scenario_hash":"d1eb8576309d1c8a96434ee3313765df1bbcacf50288b3172686cbc54994893d","mutation_count":10,"result":{"Total":10,"Killed":10,"Survived":0,"Errors":0},"tested_at":"2026-11-17T21:07:18.045963662Z"},{"index":8,"name":"Posponer tarea 9","scenario_hash":"9615caec73c2ec9b8132e5cba82ad6d887671650752584c4ab01117bd6c97e80","mutation_count":6,"result":{"Total":6,"Killed":6,"Survived":0,"Errors":0},"tested_at":"2026-11-17T21:07:18.045963662Z"},{"index":9,"name":"Posponer tarea 10","scenario_hash":"2c68045062478cc64a620329c01654d1735f364a46720334403a122b76644260","mutation_count":3,"result":{"Total":3,"Killed":3,"Survived":0,"Errors":0},"tested_at":"2026-11-17T21:07:18.045963662Z"},{"index":10,"name":"Posponer tarea 11","scenario_hash":"c6cab7d2b02378a63b28f26e1ef1183c73c3dfd6401a1ce5139252dcd5524de6","mutation_count":15,"result":{"Total":15,"Killed":15,"Survived":0,"Errors":0},"tested_at":"2026-11-17T21:07:18.045963662Z"},{"index":11,"name":"Posponer tarea 12","scenario_hash":"11facd676048dcf4da004f530a5d9e738edae814abad3e515a91c455ffb0822a","mutation_count":15,"result":{"Total":15,"Killed":15,"Survived":0,"Errors":0},"tested_at":"2026-11-17T21:07:18.045963662Z"},{"index":12,"name":"Posponer tarea 13","scenario_hash":"8a20c51ed455b36e71deefe5564d8635c5ee2c7522df92d5c1dd26ad4f25256c","mutation_count":14,"result":{"Total":14,"Killed":14,"Survived":0,"Errors":0},"tested_at":"2026-11-17T21:07:18.045963662Z"}]}
# acceptance-mutation-manifest-end

# Spec §5.9 (Posponer), §4.1 (pospuesta), §6.2 (Posponer / Quitar
# posponer) y §7 (pospuesta es un solo campo).
# Posponer guarda pospuesta = { desde: ahora, hasta }, con hasta = ahora +
# 1 hora, ahora + 3 horas, o las 07:00 del día local siguiente a ahora
# ("hasta mañana"). Solo se puede posponer una tarea pendiente o atrasada
# (según §5.1–§5.8) que no está pausada ni pospuesta. Quitar posponer borra
# pospuesta; completar, deshacer o editar no la borran.
# "pospongo la tarea con la opción <opcion> el <momento>" toca Posponer en
# el panel de edición en ese momento y elige la opción: actúa en el momento,
# sin Guardar. "la tarea fue pospuesta con la opción <opcion> el <momento>"
# es la misma acción, ya hecha. "quito la posposición" toca Quitar posponer.
# "la tarea está pospuesta desde <desde> hasta <hasta>" afirma el valor
# guardado de pospuesta.
# "abro la tarea en el panel de edición el <ahora>" abre el panel en ese
# momento. "el botón de posponer del panel es <boton>": Posponer, Quitar
# posponer o ninguno. Una tarea está pospuesta mientras ahora < hasta; desde
# hasta, el panel la trata como no pospuesta. "el panel de edición muestra
# <texto>" da el texto de la posposición: "Pospuesta hasta HH:MM" si hasta
# es del día de ahora, "Pospuesta hasta mañana HH:MM" si es del día
# siguiente (24 h, sin segundos).
# Que el botón ofrezca las tres opciones, que cierre el panel y que no
# exista al crear una tarea se verifican en la suite QA.
# Cuando el paso no da creadaEn, la tarea se creó antes de cualquier otra
# fecha del escenario.
# Semana de referencia: lunes 2026-07-13 a domingo 2026-07-19.
Feature: Postpone task

  # Posponer tarea 1
  # Las tres opciones: 1 hora y 3 horas suman al momento (con los segundos,
  # y pasando la medianoche, el fin de mes y el de año); Hasta mañana es a
  # las 07:00 del día siguiente, aunque sea de madrugada (fila 6: no es a
  # las 07:00 de hoy).
  Scenario Outline: Postpone task 1
    Given a one-off task without a due date
    When I postpone the task with option <option> on <postponed>
    Then the task is postponed from <from> to <to>

    Examples:
      | option       | postponed           | from                | to                  |
      | 1 hora       | 2026-07-15T10:00:00 | 2026-07-15T10:00:00 | 2026-07-15T11:00:00 |
      | 1 hora       | 2026-07-15T23:30:00 | 2026-07-15T23:30:00 | 2026-07-16T00:30:00 |
      | 3 horas      | 2026-07-15T10:15:30 | 2026-07-15T10:15:30 | 2026-07-15T13:15:30 |
      | 3 horas      | 2026-07-31T22:30:00 | 2026-07-31T22:30:00 | 2026-08-01T01:30:00 |
      | hasta mañana | 2026-07-15T10:00:00 | 2026-07-15T10:00:00 | 2026-07-16T07:00:00 |
      | hasta mañana | 2026-07-15T00:30:00 | 2026-07-15T00:30:00 | 2026-07-16T07:00:00 |
      | hasta mañana | 2026-07-15T23:59:59 | 2026-07-15T23:59:59 | 2026-07-16T07:00:00 |
      | hasta mañana | 2026-12-31T08:00:00 | 2026-12-31T08:00:00 | 2027-01-01T07:00:00 |

  # Posponer tarea 2
  # Una atrasada también se puede posponer.
  Scenario Outline: Postpone task 2
    Given a one-off task with due date <due_date>
    When I postpone the task with option <option> on <postponed>
    Then the task is postponed from <from> to <to>

    Examples:
      | due_date   | option | postponed           | from                | to                  |
      | 2026-07-14 | 1 hora | 2026-07-15T10:00:00 | 2026-07-15T10:00:00 | 2026-07-15T11:00:00 |

  # Posponer tarea 3
  # El panel ofrece Posponer solo si la relativa está pendiente o atrasada:
  # en espera (filas 1 y 2, hasta el borde del vencimiento) no lo ofrece.
  Scenario Outline: Postpone task 3
    Given a relative recurring task every <every> <unit>
    And the task was completed on <completed>
    When I open the task in the edit panel on <now>
    Then the postpone button of the panel is <button>

    Examples:
      | every | unit   | completed           | now                 | button   |
      | 2    | dias   | 2026-07-14T09:00:00 | 2026-07-15T09:00:00 | ninguno  |
      | 2    | dias   | 2026-07-14T09:00:00 | 2026-07-16T08:59:59 | ninguno  |
      | 2    | dias   | 2026-07-14T09:00:00 | 2026-07-16T09:00:00 | Posponer |
      | 2    | dias   | 2026-07-14T09:00:00 | 2026-07-18T09:00:00 | Posponer |

  # Posponer tarea 4
  # Una puntual pendiente (fila 1) o atrasada (fila 2) ofrece Posponer.
  Scenario Outline: Postpone task 4
    Given a one-off task with due date <due_date>
    When I open the task in the edit panel on <now>
    Then the postpone button of the panel is <button>

    Examples:
      | due_date   | now                 | button   |
      | 2026-07-15 | 2026-07-15T23:00:00 | Posponer |
      | 2026-07-14 | 2026-07-15T10:00:00 | Posponer |

  # Posponer tarea 5
  # Una puntual completada no se puede posponer.
  Scenario Outline: Postpone task 5
    Given a one-off task without a due date
    And the task was completed on <completed>
    When I open the task in the edit panel on <now>
    Then the postpone button of the panel is <button>

    Examples:
      | completed           | now                 | button  |
      | 2026-07-15T09:00:00 | 2026-07-15T10:00:00 | ninguno |

  # Posponer tarea 6
  # Una pausada no se puede posponer, aunque sin pausa estaría atrasada.
  Scenario Outline: Postpone task 6
    Given a relative recurring task every <every> <unit>
    And the task was completed on <completed>
    And the task was paused
    When I open the task in the edit panel on <now>
    Then the postpone button of the panel is <button>

    Examples:
      | every | unit   | completed           | now                 | button  |
      | 2    | dias   | 2026-07-01T09:00:00 | 2026-07-15T10:00:00 | ninguno |

  # Posponer tarea 7
  # Pospuesta: el panel ofrece Quitar posponer y dice hasta cuándo, con
  # "mañana" si hasta es del día siguiente a ahora (filas 2, 4, 5 y 6) y
  # sin "mañana" si ya es del día de ahora (fila 3). La hora va sin
  # segundos (fila 1).
  Scenario Outline: Postpone task 7
    Given a one-off task without a due date
    And the task was postponed with option <option> on <postponed>
    When I open the task in the edit panel on <now>
    Then the postpone button of the panel is <button>
    And the edit panel shows <text>

    Examples:
      | option       | postponed           | now                 | button          | text                         |
      | 1 hora       | 2026-07-15T10:15:30 | 2026-07-15T10:30:00 | Quitar posponer | Pospuesta hasta 11:15        |
      | 3 horas      | 2026-07-15T22:30:00 | 2026-07-15T23:00:00 | Quitar posponer | Pospuesta hasta mañana 01:30 |
      | 3 horas      | 2026-07-15T22:30:00 | 2026-07-16T00:00:00 | Quitar posponer | Pospuesta hasta 01:30        |
      | 1 hora       | 2026-07-15T23:30:00 | 2026-07-15T23:59:59 | Quitar posponer | Pospuesta hasta mañana 00:30 |
      | hasta mañana | 2026-07-15T00:30:00 | 2026-07-15T00:30:00 | Quitar posponer | Pospuesta hasta mañana 07:00 |
      | hasta mañana | 2026-07-31T20:00:00 | 2026-07-31T20:00:00 | Quitar posponer | Pospuesta hasta mañana 07:00 |

  # Posponer tarea 8
  # Desde hasta (inclusive), la posposición venció: el panel no dice que
  # está pospuesta y vuelve a ofrecer Posponer.
  Scenario Outline: Postpone task 8
    Given a one-off task without a due date
    And the task was postponed with option <option> on <postponed>
    When I open the task in the edit panel on <now>
    Then the postpone button of the panel is <button>
    And the edit panel does not say it is postponed

    Examples:
      | option       | postponed           | now                 | button   |
      | 1 hora       | 2026-07-15T10:00:00 | 2026-07-15T11:00:00 | Posponer |
      | hasta mañana | 2026-07-15T10:00:00 | 2026-07-16T10:00:00 | Posponer |

  # Posponer tarea 9
  # Una periódica pospuesta y después completada está en espera por su
  # propia regla, pero sigue pospuesta: el panel ofrece Quitar posponer.
  Scenario Outline: Postpone task 9
    Given a relative recurring task every <every> <unit>
    And the task was postponed with option <option> on <postponed>
    And the task was completed on <completed>
    When I open the task in the edit panel on <now>
    Then the postpone button of the panel is <button>

    Examples:
      | every | unit   | option  | postponed           | completed           | now                 | button          |
      | 4    | horas  | 3 horas | 2026-07-15T10:00:00 | 2026-07-15T11:00:00 | 2026-07-15T12:00:00 | Quitar posponer |

  # Posponer tarea 10
  # Quitar posponer borra pospuesta: una atrasada vuelve a estar atrasada
  # en el acto.
  Scenario Outline: Postpone task 10
    Given a one-off task with due date <due_date>
    And the task was postponed with option <option> on <postponed>
    When I remove the postponement
    And I query the status on <now>
    Then the task is not postponed
    And the status is atrasada

    Examples:
      | due_date   | option  | postponed           | now                 |
      | 2026-07-14 | 3 horas | 2026-07-15T10:00:00 | 2026-07-15T11:00:00 |

  # Posponer tarea 11
  # Editar una pospuesta no borra la posposición.
  Scenario Outline: Postpone task 11
    Given a one-off task <title> without a due date
    And the task was postponed with option <option> on <postponed>
    When I edit the title to <title_new>
    Then the task has title <title_stored>
    And the task is postponed from <from> to <to>

    Examples:
      | title  | option  | postponed           | title_new    | title_stored    | from                | to                  |
      | Pagar  | 3 horas | 2026-07-15T10:00:00 | Pagar luz    | Pagar luz       | 2026-07-15T10:00:00 | 2026-07-15T13:00:00 |

  # Posponer tarea 12
  # Posponer en un dispositivo y cambiar el título en otro: se conservan los
  # dos cambios.
  Scenario Outline: Postpone task 12
    Given a one-off task <title> without a due date
    When I postpone the task with option <option> on <postponed>
    And another device, without seeing that change, edits the title to <title_new>
    Then the task has title <title_stored>
    And the task is postponed from <from> to <to>

    Examples:
      | title  | option  | postponed           | title_new    | title_stored    | from                | to                  |
      | Pagar  | 3 horas | 2026-07-15T10:00:00 | Pagar luz    | Pagar luz       | 2026-07-15T10:00:00 | 2026-07-15T13:00:00 |

  # Posponer tarea 13
  # pospuesta es un solo campo: si otro dispositivo, sin ver la primera
  # posposición, pospone después, queda entera la suya (desde y hasta), sin
  # mezclar con la primera.
  Scenario Outline: Postpone task 13
    Given a one-off task without a due date
    When I postpone the task with option <option> on <postponed>
    And another device, without seeing that change, postpones the task with option <option_other> on <postponed_other>
    Then the task is postponed from <from> to <to>

    Examples:
      | option  | postponed           | option_other | postponed_other     | from                | to                  |
      | 3 horas | 2026-07-15T10:00:00 | 1 hora      | 2026-07-15T10:05:00 | 2026-07-15T10:05:00 | 2026-07-15T11:05:00 |
