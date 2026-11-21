# mutation-stamp: sha256=1bd352bf25f1e7198d2750028a070c46cf0b7bec03b967f9eee6ceac70152d41
# acceptance-mutation-manifest-begin
# {"version":1,"tested_at":"2026-11-19T12:05:42.280756996Z","feature_name":"Notice with return","feature_path":"features/notice-on-return.feature","background_hash":"74234e98afe7498fb5daf1f36ac2d78acc339464f950703b8c019892f982b90b","implementation_hash":"sha256:0ee2c2e75df9685b6c2f351c4f483ca8cc625115c066219cf37e814ccc6f913d","scenarios":[{"index":0,"name":"Notice with return 1","scenario_hash":"f90d2d15162619f8fb6d213a61dd89811217b84ccc5a0e928bd308b6ae12a6f4","mutation_count":49,"result":{"Total":49,"Killed":49,"Survived":0,"Errors":0},"tested_at":"2026-11-19T12:05:42.280756996Z"},{"index":1,"name":"Notice with return 2","scenario_hash":"2de9369c36a13c6198d0d3755cc42d7f049ad0ed7d3865e9ee0dd4e570b73e2a","mutation_count":25,"result":{"Total":25,"Killed":25,"Survived":0,"Errors":0},"tested_at":"2026-11-19T12:05:42.280756996Z"},{"index":2,"name":"Notice with return 3","scenario_hash":"605e45fe9ad25bf4e512f868e230136845b0549b78607c7a0a3758c5b6366822","mutation_count":22,"result":{"Total":22,"Killed":22,"Survived":0,"Errors":0},"tested_at":"2026-11-19T12:05:42.280756996Z"},{"index":3,"name":"Notice with return 4","scenario_hash":"bb80ac42f61fd0698f16b9d3358e5d3abec26c64a6c43dab4ad4be83ba2e4158","mutation_count":12,"result":{"Total":12,"Killed":12,"Survived":0,"Errors":0},"tested_at":"2026-11-19T12:05:42.280756996Z"},{"index":4,"name":"Notice with return 5","scenario_hash":"4a742eda7cd6f92cac9cf297993309ce52903263484d01868105d88507c4d568","mutation_count":6,"result":{"Total":6,"Killed":6,"Survived":0,"Errors":0},"tested_at":"2026-11-19T12:05:42.280756996Z"}]}
# acceptance-mutation-manifest-end

# Spec §5.4 (Undo, the notice) with §6.1 (Date and distance). When a recurring
# task is completed, below «Completaste …» the notice says when it comes back: «Vuelve <date>
# [ · <distance>]», with the return instant computed after the
# completion and the same format (and the same text) that its row will show
# while en espera. A one-off (which does not come back) shows only «Completaste …». There is no other
# close nor congratulations. Duration, Deshacer and replacement do not change
# (aviso-deshacer.feature).
# The notice is opened by an "I complete the task ..." on this device and is shown
# while completedAt <= now < completedAt + 5 seconds; the return is
# counted from now. "the completion notice shows the return T" asserts
# that the notice names the task and says T below. Each task is named by its
# title (one word). Reference week: Friday 2026-11-13.
Feature: Notice with return

  # Notice with return 1
  # Relative: V with a time. Row 2: now is 4 seconds after the completion
  # (7 hours, 59 minutes and 56 seconds is «en 8 horas»).
  Scenario Outline: Notice with return 1
    Given a relative recurring task Regar every <every> <unit>
    When I complete the task Regar on <completed>
    And I query the notice on <now>
    Then the completion notice shows the return <return>

    Examples:
      | every | unit   | completed           | now                 | return                                  |
      | 8    | horas  | 2026-11-13T10:00:00 | 2026-11-13T10:00:00 | Vuelve hoy 18:00 · en 8 horas           |
      | 8    | horas  | 2026-11-13T10:00:00 | 2026-11-13T10:00:04 | Vuelve hoy 18:00 · en 8 horas           |
      | 1    | horas  | 2026-11-13T10:00:00 | 2026-11-13T10:00:00 | Vuelve hoy 11:00 · en 1 hora            |
      | 1    | dias   | 2026-11-13T10:00:00 | 2026-11-13T10:00:00 | Vuelve mañana 10:00 · en 24 horas       |
      | 6    | dias   | 2026-11-13T10:00:00 | 2026-11-13T10:00:00 | Vuelve el jueves 19 10:00 · en 6 días   |

  # Notice with return 2
  # Calendar: 00:00 of the next occurrence, without a time. Row 1: it covers the most
  # recent uncovered one (the 12th) and comes back the following Thursday. Row 2: «mañana»
  # carries no distance. Row 3: completing early covers the next one (the
  # 19th), so it comes back the following week (the 26th).
  Scenario Outline: Notice with return 2
    Given a weekly recurring task Regar on <days> created on <created>
    When I complete the task Regar on <completed>
    And I query the notice on <now>
    Then the completion notice shows the return <return>

    Examples:
      | days   | created             | completed           | now                 | return                            |
      | jueves | 2026-11-01T08:00:00 | 2026-11-13T10:00:00 | 2026-11-13T10:00:00 | Vuelve el jueves 19 · en 6 días   |
      | sábado | 2026-11-01T08:00:00 | 2026-11-13T10:00:00 | 2026-11-13T10:00:00 | Vuelve mañana                     |
      | jueves | 2026-11-13T08:00:00 | 2026-11-13T10:00:00 | 2026-11-13T10:00:00 | Vuelve el jueves 26 · en 13 días  |

  # Notice with return 3
  # Relative with a schedule: A. Row 1: V (22:00) falls outside the window and it comes back
  # when it opens (tomorrow 08:00). Row 2: V falls inside the window.
  Scenario Outline: Notice with return 3
    Given a relative recurring task Regar every <every> <unit>
    And the task Regar can be completed from <from> to <to>
    When I complete the task Regar on <completed>
    And I query the notice on <now>
    Then the completion notice shows the return <return>

    Examples:
      | every | unit   | from  | to    | completed           | now                 | return                            |
      | 12   | horas  | 08:00 | 10:30 | 2026-11-13T10:00:00 | 2026-11-13T10:00:00 | Vuelve mañana 08:00 · en 22 horas |
      | 1    | dias   | 08:00 | 11:00 | 2026-11-13T10:00:00 | 2026-11-13T10:00:00 | Vuelve mañana 10:00 · en 24 horas |

  # Notice with return 4
  # One-off with a due date (pendiente in row 1, atrasada in row 2):
  # it does not come back, so the notice is only «Completaste …».
  Scenario Outline: Notice with return 4
    Given a one-off task Pagar with due date <due_date>
    When I complete the task Pagar on <completed>
    And I query the notice on <now>
    Then the completion notice shows no return

    Examples:
      | due_date   | completed           | now                 |
      | 2026-11-20 | 2026-11-13T10:00:00 | 2026-11-13T10:00:00 |
      | 2026-11-05 | 2026-11-13T10:00:00 | 2026-11-13T10:00:00 |

  # Notice with return 5
  # One-off without a due date: it does not carry a return either.
  Scenario Outline: Notice with return 5
    Given a one-off task Pagar without a due date
    When I complete the task Pagar on <completed>
    And I query the notice on <now>
    Then the completion notice shows no return

    Examples:
      | completed           | now                 |
      | 2026-11-13T10:00:00 | 2026-11-13T10:00:04 |
