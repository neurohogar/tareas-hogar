# mutation-stamp: sha256=ff4b237521c541c6c2bfea24e498d86685bf55e497fee100bd65bd9e19d5aad6
# acceptance-mutation-manifest-begin
# {"version":1,"tested_at":"2026-11-22T21:41:32.183350472Z","feature_name":"Minimal mode turning off","feature_path":"features/minimal-mode-turning-off.feature","background_hash":"74234e98afe7498fb5daf1f36ac2d78acc339464f950703b8c019892f982b90b","implementation_hash":"sha256:2a55b592edb5e461ef18a831a7c2ae4b36b026e975982249c8f063858ddf445f","scenarios":[{"index":11,"name":"Minimal mode turning off 12","scenario_hash":"bccdb3c8cadf1d1c20b37b84c989adacdeec543de7cf2300e2bff013f6a556e6","mutation_count":1,"result":{"Total":1,"Killed":1,"Survived":0,"Errors":0},"tested_at":"2026-11-22T21:36:04.872636138Z"},{"index":10,"name":"Minimal mode turning off 11","scenario_hash":"f57881945a7dd166b665e91295f5c1135927736805ce706186b9d58e8f6635e0","mutation_count":1,"result":{"Total":1,"Killed":1,"Survived":0,"Errors":0},"tested_at":"2026-11-22T21:35:29.959117715Z"},{"index":13,"name":"Minimal mode turning off 14","scenario_hash":"1ba84421df541c50212539419300ad59f53f765ec4c5f3fa9689c7ec4352fc70","mutation_count":2,"result":{"Total":2,"Killed":2,"Survived":0,"Errors":0},"tested_at":"2026-11-22T21:35:29.959117715Z"},{"index":14,"name":"Minimal mode turning off 15","scenario_hash":"58ca00fdb5a957987c32aeeaf4244605c0b3dff260bc913f321322b9b5f7f44e","mutation_count":1,"result":{"Total":1,"Killed":1,"Survived":0,"Errors":0},"tested_at":"2026-11-22T21:35:29.959117715Z"},{"index":2,"name":"Minimal mode turning off 3","scenario_hash":"3b0ac101d8920663ed33db0f601b2fa35f1a880e4ea2fe58f5a2853e9f204e3a","mutation_count":4,"result":{"Total":4,"Killed":4,"Survived":0,"Errors":0},"tested_at":"2026-11-22T21:33:01.308670797Z"},{"index":3,"name":"Minimal mode turning off 4","scenario_hash":"a640dc90eef305af6f157048bd1bcabbe6304ff5dd21c4b404c891dacc765fa2","mutation_count":1,"result":{"Total":1,"Killed":1,"Survived":0,"Errors":0},"tested_at":"2026-11-22T21:33:01.308670797Z"},{"index":6,"name":"Minimal mode turning off 7","scenario_hash":"be92582e679bf0f961b296f56cfd84e37a6cfae4fbaeed10535af027bb9c7f74","mutation_count":2,"result":{"Total":2,"Killed":2,"Survived":0,"Errors":0},"tested_at":"2026-11-22T21:33:01.308670797Z"},{"index":7,"name":"Minimal mode turning off 8","scenario_hash":"286b932e455c689942d3c2dd39cb3cb9e1ffe476d7feaaf6ae7875b6e7263096","mutation_count":1,"result":{"Total":1,"Killed":1,"Survived":0,"Errors":0},"tested_at":"2026-11-22T21:33:01.308670797Z"},{"index":8,"name":"Minimal mode turning off 9","scenario_hash":"0be17be1c21b5541d2dd59882c4eb402c7f5c65ef8db435d7db4eda834ab38fd","mutation_count":2,"result":{"Total":2,"Killed":2,"Survived":0,"Errors":0},"tested_at":"2026-11-22T21:33:01.308670797Z"},{"index":0,"name":"Minimal mode turning off 1","scenario_hash":"537a248b298dd3f5dcdb7c818083e0f37e59cd556bfc0bf9005a309e18d20f32","mutation_count":3,"result":{"Total":3,"Killed":3,"Survived":0,"Errors":0},"tested_at":"2026-11-22T21:31:40.113465885Z"},{"index":1,"name":"Minimal mode turning off 2","scenario_hash":"4751e0e4b45ce138dc44342d4e09e1c43b390804f61648e3017141122c22a6ef","mutation_count":8,"result":{"Total":8,"Killed":8,"Survived":0,"Errors":0},"tested_at":"2026-11-22T21:31:40.113465885Z"},{"index":4,"name":"Minimal mode turning off 5","scenario_hash":"d262ab434112a60f2df9666ef66172a126e232edcf90f5f6d34a360e7e4fe7ea","mutation_count":2,"result":{"Total":2,"Killed":2,"Survived":0,"Errors":0},"tested_at":"2026-11-22T21:31:40.113465885Z"},{"index":5,"name":"Minimal mode turning off 6","scenario_hash":"7e8c652466f453dd4b4b2292337b60f3b7b549efa8b4eb878929a73847c0f613","mutation_count":1,"result":{"Total":1,"Killed":1,"Survived":0,"Errors":0},"tested_at":"2026-11-22T21:31:40.113465885Z"},{"index":16,"name":"Minimal mode turning off 17","scenario_hash":"e92a497731d3822e567ff73679c8103b4c7c8f6dc7ca9eac5d674045e3a59b49","mutation_count":14,"result":{"Total":14,"Killed":14,"Survived":0,"Errors":0},"tested_at":"2026-11-22T21:31:40.113465885Z"}]}
# acceptance-mutation-manifest-end

# Spec §5.8 (Turning it off, Changing the mark with the mode on, Manual pause with the
# mode on, New task with the mode on, Resume), with §5.2, §5.3, §4.1 and §7 (Minimal
# mode). Turning the mode off is a Reanudar (reanudadaEn = the moment of turning it off)
# of every recurring task that is not essential and is not paused by hand. Each one
# comes back as if newly created at that moment, even one completed the day before the
# mode was turned on: interval tasks are pending at once; calendar tasks are pending if
# today is one of their days and waiting otherwise. What happened during the mode does
# not count as overdue. The essential tasks and the ones paused by hand are not touched.
# Marking or unmarking Esencial with the mode on, changing the kind and creating a task
# apply the same rule from the moment of saving.
#   Turning it off writes `active` = false and the reanudadaEn of every task it
#   brings back in a single writeBatch: that is verified in the core unit tests.
# That no summary, count or congratulation is shown on turning it on or off is
# verified in the QA suite (qa/minimal-mode.md).
# "the minimal mode is on" is the mode already on before any other date in the scenario.
# "I turn the minimal mode off on M" turns it off at that moment (the "now" of the
# resumes). "I mark the task essential on M" and "I unmark the task as essential" are the
# edit of the Esencial check, saved at that moment. "the task was resumed on M" asserts
# the stored reanudadaEn; "the task has no resume moment" asserts there is none.
# "I resume the task on M" taps Reanudar in the panel. "the task was marked essential" and
# "the task was paused" (by hand) are already done before any other date.
# Reference week: Monday 2026-07-13 to Sunday 2026-07-19.
Feature: Minimal mode turning off

  # Minimal mode turning off 1
  # A relative task comes back pending at the moment of turning the mode off, as if newly
  # created (row 1: the example of the spec, without the rule it would be overdue; row 2:
  # completed the day before, without the rule it would be waiting), not overdue.
  Scenario Outline: Minimal mode turning off 1
    Given a relative recurring task every <every> <unit>
    And the task was completed on <completed>
    And the minimal mode is on
    When I turn the minimal mode off on <off>
    And I query the status on <off>
    Then the task is not paused by the minimal mode
    And the task was resumed at that moment
    And the status is pendiente

    Examples:
      | every | unit | completed           | off                 |
      | 2     | dias | 2026-07-10T09:00:00 | 2026-07-20T10:00:00 |
      | 2     | dias | 2026-07-19T09:00:00 | 2026-07-20T10:00:00 |

  # Minimal mode turning off 2
  # A calendar task comes back pending if the moment of turning the mode off is one of its
  # days (row 1: Thursday) and waiting otherwise (row 2: Wednesday), not overdue.
  Scenario Outline: Minimal mode turning off 2
    Given a weekly recurring task on <days> created on <created>
    And the minimal mode is on
    When I turn the minimal mode off on <off>
    And I query the status on <off>
    Then the task was resumed at that moment
    And the status is <status>

    Examples:
      | days           | created             | off                 | status    |
      | martes, jueves | 2026-07-01T08:00:00 | 2026-07-16T10:00:00 | pendiente |
      | martes, jueves | 2026-07-01T08:00:00 | 2026-07-15T10:00:00 | en espera |

  # Minimal mode turning off 3
  # An essential task is not touched by turning the mode off: it keeps its status (still
  # waiting here) and it is not resumed.
  Scenario Outline: Minimal mode turning off 3
    Given a relative recurring task every <every> <unit>
    And the task was completed on <completed>
    And the task was marked essential
    And the minimal mode is on
    When I turn the minimal mode off on <off>
    And I query the status on <off>
    Then the task has no resume moment
    And the status is en espera

    Examples:
      | every | unit | completed           | off                 |
      | 2     | dias | 2026-07-19T09:00:00 | 2026-07-20T10:00:00 |

  # Minimal mode turning off 4
  # A task paused by hand stays paused when the mode is turned off, and it is not resumed.
  Scenario Outline: Minimal mode turning off 4
    Given a relative recurring task every <every> <unit>
    And the task was paused
    And the minimal mode is on
    When I turn the minimal mode off on <off>
    And I query the status on <off>
    Then the task is paused
    And the task is not paused by the minimal mode
    And the task has no resume moment
    And the task has no status

    Examples:
      | every | unit | off                 |
      | 2     | dias | 2026-07-20T10:00:00 |

  # Minimal mode turning off 5
  # Reanudar on a task paused by hand with the mode on removes the manual pause, and the
  # task stays paused by the mode.
  Scenario Outline: Minimal mode turning off 5
    Given a relative recurring task every <every> <unit>
    And the task was paused
    And the minimal mode is on
    When I resume the task on <resumed>
    And I query the status on <resumed>
    Then the task is not paused
    And the task is paused by the minimal mode
    And the task has no status

    Examples:
      | every | unit | resumed             |
      | 2     | dias | 2026-07-15T10:00:00 |

  # Minimal mode turning off 6
  # After that Reanudar, turning the mode off brings the task back.
  Scenario Outline: Minimal mode turning off 6
    Given a relative recurring task every <every> <unit>
    And the task was paused
    And the minimal mode is on
    When I resume the task on <resumed>
    And I turn the minimal mode off on <off>
    And I query the status on <off>
    Then the task is not paused by the minimal mode
    And the task was resumed at that moment
    And the status is pendiente

    Examples:
      | every | unit | resumed             | off                 |
      | 2     | dias | 2026-07-15T10:00:00 | 2026-07-20T10:00:00 |

  # Minimal mode turning off 7
  # Marking a non-essential recurring task essential with the mode on brings it back
  # right away, like turning the mode off for that task (row 1: without the rule it would
  # be overdue).
  Scenario Outline: Minimal mode turning off 7
    Given a relative recurring task every <every> <unit>
    And the task was completed on <completed>
    And the minimal mode is on
    When I mark the task essential on <now>
    And I query the status on <now>
    Then the task is not paused by the minimal mode
    And the task was resumed at that moment
    And the status is pendiente

    Examples:
      | every | unit | completed           | now                 |
      | 2     | dias | 2026-07-10T09:00:00 | 2026-07-20T10:00:00 |

  # Minimal mode turning off 8
  # If it is also paused by hand, marking it essential leaves it paused, without a resume
  # moment.
  Scenario Outline: Minimal mode turning off 8
    Given a relative recurring task every <every> <unit>
    And the task was paused
    And the minimal mode is on
    When I mark the task essential on <now>
    And I query the status on <now>
    Then the task is paused
    And the task has no resume moment
    And the task has no status

    Examples:
      | every | unit | now                 |
      | 2     | dias | 2026-07-20T10:00:00 |

  # Minimal mode turning off 9
  # Unchecking Esencial on an essential recurring task with the mode on pauses it by the
  # mode from the moment of saving.
  Scenario Outline: Minimal mode turning off 9
    Given a relative recurring task every <every> <unit>
    And the task was marked essential
    And the minimal mode is on
    When I unmark the task as essential
    And I query the status on <now>
    Then the task is paused by the minimal mode
    And the task has no status

    Examples:
      | every | unit | now                 |
      | 2     | dias | 2026-07-15T12:00:00 |

  # Minimal mode turning off 10
  # Unchecking Esencial on an essential one-off task with the mode on hides it.
  Scenario Outline: Minimal mode turning off 10
    Given a one-off task Pagar with due date <due_date>
    And the task Pagar was marked essential
    And the minimal mode is on
    When I unmark the task as essential
    And I query Pendientes on <now>
    Then Pendientes shows no task

    Examples:
      | due_date   | now                 |
      | 2026-07-14 | 2026-07-15T10:00:00 |

  # Minimal mode turning off 11
  # Marking a non-essential one-off task essential with the mode on brings it back as it
  # was: it is still overdue.
  Scenario Outline: Minimal mode turning off 11
    Given a one-off task Pagar with due date <due_date>
    And the minimal mode is on
    When I mark the task essential on <now>
    And I query Pendientes on <now>
    Then Pendientes shows in order <order>

    Examples:
      | due_date   | now                 | order |
      | 2026-07-14 | 2026-07-15T10:00:00 | Pagar |

  # Minimal mode turning off 12
  # With the mode on, a non-essential one-off task that becomes recurring is paused by
  # the mode.
  Scenario Outline: Minimal mode turning off 12
    Given a one-off task without a due date
    And the minimal mode is on
    When I edit the task to weekly recurring on <days>
    And I query the status at any moment
    Then the task is paused by the minimal mode
    And the task has no status

    Examples:
      | days           |
      | martes, jueves |

  # Minimal mode turning off 13
  # With the mode on, a non-essential recurring task that becomes one-off is hidden.
  Scenario: Minimal mode turning off 13
    Given a relative recurring task Regar never completed
    And the minimal mode is on
    When I edit the task to one-off without a due date
    And I query Pendientes at any moment
    Then Pendientes shows no task

  # Minimal mode turning off 14
  # A task saved with Esencial unchecked while the mode is on is paused by the mode from
  # the moment of saving (relative and calendar creators).
  Scenario Outline: Minimal mode turning off 14
    Given the minimal mode is on
    When I create a relative recurring task with title <title> every <every> <unit> and Esencial unchecked
    And I query the status at any moment
    Then the task is paused by the minimal mode

    Examples:
      | title | every | unit |
      | Regar | 2     | dias |

  # Minimal mode turning off 15
  # The same with a calendar task.
  Scenario Outline: Minimal mode turning off 15
    Given the minimal mode is on
    When I create a weekly recurring task with title <title> on <days> and Esencial unchecked
    And I query the status at any moment
    Then the task is paused by the minimal mode

    Examples:
      | title  | days           |
      | Basura | martes, jueves |

  # Minimal mode turning off 16
  # A task saved with Esencial checked while the mode is on stays in view.
  Scenario Outline: Minimal mode turning off 16
    Given the minimal mode is on
    When I create a relative recurring task with title <title> every <every> <unit> and Esencial checked
    And I query the status on <now>
    Then the task is not paused by the minimal mode
    And the status is pendiente

    Examples:
      | title | every | unit | now                 |
      | Regar | 2     | dias | 2026-07-15T12:00:00 |

  # Minimal mode turning off 17
  # Turning the mode off does not change a postponed task that it brings back: it keeps its
  # postponement, which expires by itself.
  Scenario Outline: Minimal mode turning off 17
    Given a relative recurring task every <every> <unit>
    And the task was completed on <completed>
    And the task was postponed with option <option> on <postponed>
    And the minimal mode is on
    When I turn the minimal mode off on <off>
    Then the task is postponed from <from> to <to>

    Examples:
      | every | unit | completed           | option | postponed           | off                 | from                | to                  |
      | 2     | dias | 2026-07-01T09:00:00 | 1 hora | 2026-07-15T10:00:00 | 2026-07-20T10:00:00 | 2026-07-15T10:00:00 | 2026-07-15T11:00:00 |
