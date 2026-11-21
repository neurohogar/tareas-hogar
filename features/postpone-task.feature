# mutation-stamp: sha256=587ed8fd7db0cd3ae8f2caea9175dcce29eb0ce066d7a6c4592bd8ab7953cfb6
# acceptance-mutation-manifest-begin
# {"version":1,"tested_at":"2026-11-19T12:52:05.336895708Z","feature_name":"Postpone task","feature_path":"features/postpone-task.feature","background_hash":"74234e98afe7498fb5daf1f36ac2d78acc339464f950703b8c019892f982b90b","implementation_hash":"sha256:c3617f50411af203ed4cd17408ca55bd21c4643f1906154bfbd04ef4c229b59f","scenarios":[{"index":0,"name":"Postpone task 1","scenario_hash":"57bc85905bc52b22ba743802b237aec2cda693f0bce4367b10722994917c1c6d","mutation_count":104,"result":{"Total":104,"Killed":104,"Survived":0,"Errors":0},"tested_at":"2026-11-19T12:52:05.336895708Z"},{"index":1,"name":"Postpone task 2","scenario_hash":"4b32cb3db5aec9bd5536cecc47a79831cea9b7495b8ab24992850711b1a71b44","mutation_count":13,"result":{"Total":13,"Killed":13,"Survived":0,"Errors":0},"tested_at":"2026-11-19T12:52:05.336895708Z"},{"index":2,"name":"Postpone task 3","scenario_hash":"81c4571d86ae0b698c46b408d6772d5f6feb6f77e895bf3bbccbf84b6f372de5","mutation_count":21,"result":{"Total":21,"Killed":21,"Survived":0,"Errors":0},"tested_at":"2026-11-19T12:52:05.336895708Z"},{"index":3,"name":"Postpone task 4","scenario_hash":"b24e18f31927547f17b8ee5300d8c49a68feaa394775abb10c23622921c99536","mutation_count":2,"result":{"Total":2,"Killed":2,"Survived":0,"Errors":0},"tested_at":"2026-11-19T12:52:05.336895708Z"},{"index":4,"name":"Postpone task 5","scenario_hash":"c83bb3038a939575c10142c36b2767a95734c092a799063945927fe19c3b5ac5","mutation_count":1,"result":{"Total":1,"Killed":1,"Survived":0,"Errors":0},"tested_at":"2026-11-19T12:52:05.336895708Z"},{"index":5,"name":"Postpone task 6","scenario_hash":"ce48cccb4795405fc62f347395102e097cb1e42d0227a057d380b3961d4c4420","mutation_count":2,"result":{"Total":2,"Killed":2,"Survived":0,"Errors":0},"tested_at":"2026-11-19T12:52:05.336895708Z"},{"index":6,"name":"Postpone task 7","scenario_hash":"753dad0767a2fbc49cba0aa5fcdccb890624c929f179e050c28c1584e4a36068","mutation_count":47,"result":{"Total":47,"Killed":47,"Survived":0,"Errors":0},"tested_at":"2026-11-19T12:52:05.336895708Z"},{"index":7,"name":"Postpone task 8","scenario_hash":"9b4ccba8f6fe134220a7681bcc6c3722d2253c2f50383281d89363dd5b471c19","mutation_count":10,"result":{"Total":10,"Killed":10,"Survived":0,"Errors":0},"tested_at":"2026-11-19T12:52:05.336895708Z"},{"index":8,"name":"Postpone task 9","scenario_hash":"194656b206b2adf80123f6ada372bc02889aa6dcc4a48ef018a2eec0fc541216","mutation_count":5,"result":{"Total":5,"Killed":5,"Survived":0,"Errors":0},"tested_at":"2026-11-19T12:52:05.336895708Z"},{"index":9,"name":"Postpone task 10","scenario_hash":"c30b6d5ba0308aa2aecc04f0be88330fd60845c87a072ce74ef6c1b56024c605","mutation_count":3,"result":{"Total":3,"Killed":3,"Survived":0,"Errors":0},"tested_at":"2026-11-19T12:52:05.336895708Z"},{"index":10,"name":"Postpone task 11","scenario_hash":"3512cc1584bb99ae1ccd9af12d5edd917143925a255d6f2b9c7280f5bb5f8c7a","mutation_count":15,"result":{"Total":15,"Killed":15,"Survived":0,"Errors":0},"tested_at":"2026-11-19T12:52:05.336895708Z"},{"index":11,"name":"Postpone task 12","scenario_hash":"c16afce79c8fe2a55fa8c0830a1eb417ee6aab0fb5f270743c82d6433508c194","mutation_count":15,"result":{"Total":15,"Killed":15,"Survived":0,"Errors":0},"tested_at":"2026-11-19T12:52:05.336895708Z"},{"index":12,"name":"Postpone task 13","scenario_hash":"0dafb2c72106700add58833a6ec1c20dba517d20d5694bfd59360bf0cc35e7ed","mutation_count":14,"result":{"Total":14,"Killed":14,"Survived":0,"Errors":0},"tested_at":"2026-11-19T12:52:05.336895708Z"}]}
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
