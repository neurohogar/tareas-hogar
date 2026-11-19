# mutation-stamp: sha256=a39c10e21ea3a80dea761f0bb604275e3fe9a03b4b9c7273a826ee4a872d73ec
# acceptance-mutation-manifest-begin
# {"version":1,"tested_at":"2026-11-17T21:07:18.045963662Z","feature_name":"Posponer tarea","feature_path":"features/posponer-tarea.feature","background_hash":"74234e98afe7498fb5daf1f36ac2d78acc339464f950703b8c019892f982b90b","implementation_hash":"sha256:de04e947ae46f373725d9bdd6bcfc281667430145e0bab2e523e0337b24c5923","scenarios":[{"index":0,"name":"Posponer tarea 1","scenario_hash":"c2967b3e9b90c6b9c45bd4788dc6cac504de264515ce9aa4c86ddec238e930a5","mutation_count":104,"result":{"Total":104,"Killed":104,"Survived":0,"Errors":0},"tested_at":"2026-11-17T21:07:18.045963662Z"},{"index":1,"name":"Posponer tarea 2","scenario_hash":"2372269cc1a8a972ef8d815ae57e70b9c7db597cdd4e57043d028c4a9fa8262f","mutation_count":13,"result":{"Total":13,"Killed":13,"Survived":0,"Errors":0},"tested_at":"2026-11-17T21:07:18.045963662Z"},{"index":2,"name":"Posponer tarea 3","scenario_hash":"33acad8b1d458b5ddfb2c26e508c30b4097b309d6c370dec02cf9b6f667c8561","mutation_count":20,"result":{"Total":20,"Killed":20,"Survived":0,"Errors":0},"tested_at":"2026-11-17T21:07:18.045963662Z"},{"index":3,"name":"Posponer tarea 4","scenario_hash":"13d19b8a62d5beeef93150494af30fcf2c4de5106829b39098c383fdbabb7bba","mutation_count":2,"result":{"Total":2,"Killed":2,"Survived":0,"Errors":0},"tested_at":"2026-11-17T21:07:18.045963662Z"},{"index":4,"name":"Posponer tarea 5","scenario_hash":"fc9a3f773ee87992036c8a07f5388f73c502e1953a3a8d7785dde48dcaee106c","mutation_count":1,"result":{"Total":1,"Killed":1,"Survived":0,"Errors":0},"tested_at":"2026-11-17T21:07:18.045963662Z"},{"index":5,"name":"Posponer tarea 6","scenario_hash":"fbfb748bcb075c53a4339ed3f048d521c93e651e2b80ef35adc11ae35ce02ccc","mutation_count":2,"result":{"Total":2,"Killed":2,"Survived":0,"Errors":0},"tested_at":"2026-11-17T21:07:18.045963662Z"},{"index":6,"name":"Posponer tarea 7","scenario_hash":"7d8f6c506d47a5d11ec3b5fb993dde71d86d4760f0b973ecfb9d6671a368dbf5","mutation_count":47,"result":{"Total":47,"Killed":47,"Survived":0,"Errors":0},"tested_at":"2026-11-17T21:07:18.045963662Z"},{"index":7,"name":"Posponer tarea 8","scenario_hash":"d1eb8576309d1c8a96434ee3313765df1bbcacf50288b3172686cbc54994893d","mutation_count":10,"result":{"Total":10,"Killed":10,"Survived":0,"Errors":0},"tested_at":"2026-11-17T21:07:18.045963662Z"},{"index":8,"name":"Posponer tarea 9","scenario_hash":"9615caec73c2ec9b8132e5cba82ad6d887671650752584c4ab01117bd6c97e80","mutation_count":6,"result":{"Total":6,"Killed":6,"Survived":0,"Errors":0},"tested_at":"2026-11-17T21:07:18.045963662Z"},{"index":9,"name":"Posponer tarea 10","scenario_hash":"2c68045062478cc64a620329c01654d1735f364a46720334403a122b76644260","mutation_count":3,"result":{"Total":3,"Killed":3,"Survived":0,"Errors":0},"tested_at":"2026-11-17T21:07:18.045963662Z"},{"index":10,"name":"Posponer tarea 11","scenario_hash":"c6cab7d2b02378a63b28f26e1ef1183c73c3dfd6401a1ce5139252dcd5524de6","mutation_count":15,"result":{"Total":15,"Killed":15,"Survived":0,"Errors":0},"tested_at":"2026-11-17T21:07:18.045963662Z"},{"index":11,"name":"Posponer tarea 12","scenario_hash":"11facd676048dcf4da004f530a5d9e738edae814abad3e515a91c455ffb0822a","mutation_count":15,"result":{"Total":15,"Killed":15,"Survived":0,"Errors":0},"tested_at":"2026-11-17T21:07:18.045963662Z"},{"index":12,"name":"Posponer tarea 13","scenario_hash":"8a20c51ed455b36e71deefe5564d8635c5ee2c7522df92d5c1dd26ad4f25256c","mutation_count":14,"result":{"Total":14,"Killed":14,"Survived":0,"Errors":0},"tested_at":"2026-11-17T21:07:18.045963662Z"}]}
# acceptance-mutation-manifest-end

# Spec §5.9 (Posponer), §4.1 (pospuesta), §6.2 (Posponer / Quitar
# posponer) and §7 (pospuesta is a single field).
# Posponer stores pospuesta = { desde: now, hasta }, with hasta = now +
# 1 hour, now + 3 hours, or 07:00 of the local day after now
# ("hasta mañana"). Only a pending or overdue task can be postponed
# (per §5.1–§5.8) that is neither paused nor postponed. Quitar posponer deletes
# pospuesta; completing, undoing or editing do not delete it.
# "I postpone the task with option <option> on <moment>" taps Posponer in
# the edit panel at that moment and chooses the option: it acts at that moment,
# without Guardar. "the task was postponed with option <option> on <moment>"
# is the same action, already done. "I remove the postponement" taps Quitar posponer.
# "the task is postponed from <from> to <to>" asserts the stored value
# of pospuesta.
# "I open the task in the edit panel on <now>" opens the panel at that
# moment. "the postpone button of the panel is <button>": Posponer, Quitar
# posponer or none. A task is postponed while now < hasta; from
# hasta on, the panel treats it as not postponed. "the edit panel shows
# <text>" gives the postponement text: "Pospuesta hasta HH:MM" if hasta
# is on the day of now, "Pospuesta hasta mañana HH:MM" if it is on the next
# day (24 h, without seconds).
# That the button offers the three options, that it closes the panel and that it does not
# exist when creating a task are verified in the QA suite.
# When the step does not give creadaEn, the task was created before any other
# date of the scenario.
# Reference week: Monday 2026-07-13 to Sunday 2026-07-19.
Feature: Postpone task

  # Postpone task 1
  # The three options: 1 hour and 3 hours add to the moment (with the seconds,
  # and across midnight, the end of the month and the end of the year); Hasta mañana is at
  # 07:00 of the next day, even in the small hours (row 6: it is not at
  # 07:00 today).
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

  # Postpone task 2
  # An overdue task can also be postponed.
  Scenario Outline: Postpone task 2
    Given a one-off task with due date <due_date>
    When I postpone the task with option <option> on <postponed>
    Then the task is postponed from <from> to <to>

    Examples:
      | due_date   | option | postponed           | from                | to                  |
      | 2026-07-14 | 1 hora | 2026-07-15T10:00:00 | 2026-07-15T10:00:00 | 2026-07-15T11:00:00 |

  # Postpone task 3
  # The panel offers Posponer only if the relative one is pending or overdue:
  # waiting (rows 1 and 2, up to the edge of the deadline) it does not offer it.
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

  # Postpone task 4
  # A pending (row 1) or overdue (row 2) one-off offers Posponer.
  Scenario Outline: Postpone task 4
    Given a one-off task with due date <due_date>
    When I open the task in the edit panel on <now>
    Then the postpone button of the panel is <button>

    Examples:
      | due_date   | now                 | button   |
      | 2026-07-15 | 2026-07-15T23:00:00 | Posponer |
      | 2026-07-14 | 2026-07-15T10:00:00 | Posponer |

  # Postpone task 5
  # A completed one-off cannot be postponed.
  Scenario Outline: Postpone task 5
    Given a one-off task without a due date
    And the task was completed on <completed>
    When I open the task in the edit panel on <now>
    Then the postpone button of the panel is <button>

    Examples:
      | completed           | now                 | button  |
      | 2026-07-15T09:00:00 | 2026-07-15T10:00:00 | ninguno |

  # Postpone task 6
  # A paused one cannot be postponed, even though without the pause it would be overdue.
  Scenario Outline: Postpone task 6
    Given a relative recurring task every <every> <unit>
    And the task was completed on <completed>
    And the task was paused
    When I open the task in the edit panel on <now>
    Then the postpone button of the panel is <button>

    Examples:
      | every | unit   | completed           | now                 | button  |
      | 2    | dias   | 2026-07-01T09:00:00 | 2026-07-15T10:00:00 | ninguno |

  # Postpone task 7
  # Postponed: the panel offers Quitar posponer and says until when, with
  # "mañana" if hasta is on the day after now (rows 2, 4, 5 and 6) and
  # without "mañana" if it is on the day of now (row 3). The time goes without
  # seconds (row 1).
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

  # Postpone task 8
  # From hasta on (inclusive), the postponement has expired: the panel does not say that
  # it is postponed and offers Posponer again.
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

  # Postpone task 9
  # A recurring task postponed and then completed is waiting by its
  # own rule, but is still postponed: the panel offers Quitar posponer.
  Scenario Outline: Postpone task 9
    Given a relative recurring task every <every> <unit>
    And the task was postponed with option <option> on <postponed>
    And the task was completed on <completed>
    When I open the task in the edit panel on <now>
    Then the postpone button of the panel is <button>

    Examples:
      | every | unit   | option  | postponed           | completed           | now                 | button          |
      | 4    | horas  | 3 horas | 2026-07-15T10:00:00 | 2026-07-15T11:00:00 | 2026-07-15T12:00:00 | Quitar posponer |

  # Postpone task 10
  # Quitar posponer deletes pospuesta: an overdue task is overdue again
  # right away.
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

  # Postpone task 11
  # Editing a postponed task does not delete the postponement.
  Scenario Outline: Postpone task 11
    Given a one-off task <title> without a due date
    And the task was postponed with option <option> on <postponed>
    When I edit the title to <title_new>
    Then the task has title <title_stored>
    And the task is postponed from <from> to <to>

    Examples:
      | title  | option  | postponed           | title_new    | title_stored    | from                | to                  |
      | Pagar  | 3 horas | 2026-07-15T10:00:00 | Pagar luz    | Pagar luz       | 2026-07-15T10:00:00 | 2026-07-15T13:00:00 |

  # Postpone task 12
  # Postponing on one device and changing the title on another: both
  # changes are kept.
  Scenario Outline: Postpone task 12
    Given a one-off task <title> without a due date
    When I postpone the task with option <option> on <postponed>
    And another device, without seeing that change, edits the title to <title_new>
    Then the task has title <title_stored>
    And the task is postponed from <from> to <to>

    Examples:
      | title  | option  | postponed           | title_new    | title_stored    | from                | to                  |
      | Pagar  | 3 horas | 2026-07-15T10:00:00 | Pagar luz    | Pagar luz       | 2026-07-15T10:00:00 | 2026-07-15T13:00:00 |

  # Postpone task 13
  # pospuesta is a single field: if another device, without seeing the first
  # postponement, postpones afterwards, its own is kept whole (desde and hasta), without
  # mixing with the first one.
  Scenario Outline: Postpone task 13
    Given a one-off task without a due date
    When I postpone the task with option <option> on <postponed>
    And another device, without seeing that change, postpones the task with option <option_other> on <postponed_other>
    Then the task is postponed from <from> to <to>

    Examples:
      | option  | postponed           | option_other | postponed_other     | from                | to                  |
      | 3 horas | 2026-07-15T10:00:00 | 1 hora      | 2026-07-15T10:05:00 | 2026-07-15T10:05:00 | 2026-07-15T11:05:00 |
