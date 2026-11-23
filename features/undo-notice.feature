# mutation-stamp: sha256=76320cb9f12952afb9bbf28420607c4bd482564363386f161e5a8a74cfdd2435
# acceptance-mutation-manifest-begin
# {"version":1,"tested_at":"2026-11-23T16:40:23.828232689Z","feature_name":"Undo notice","feature_path":"features/undo-notice.feature","background_hash":"74234e98afe7498fb5daf1f36ac2d78acc339464f950703b8c019892f982b90b","implementation_hash":"sha256:e94edb28ce4d987072c41cc8b9eb34dd5b567d8856a6a72c4159a1dc66f71a47","scenarios":[{"index":0,"name":"Undo notice 1","scenario_hash":"911eae8244d978a5642314b0d7dccca84d7924fa137193bb078f3b6d0dab663f","mutation_count":25,"result":{"Total":25,"Killed":25,"Survived":0,"Errors":0},"tested_at":"2026-11-23T16:40:23.828232689Z"},{"index":1,"name":"Undo notice 2","scenario_hash":"fb61d6483f500661140eed027089ce3bf1658bec00d9c92e5dc323e093c967bf","mutation_count":5,"result":{"Total":5,"Killed":5,"Survived":0,"Errors":0},"tested_at":"2026-11-23T16:40:23.828232689Z"},{"index":2,"name":"Undo notice 3","scenario_hash":"d4a87df0bffb4a0576f5074cef37d0324e918cd7d63593e2551d0e6098429c07","mutation_count":24,"result":{"Total":24,"Killed":24,"Survived":0,"Errors":0},"tested_at":"2026-11-23T16:40:23.828232689Z"},{"index":3,"name":"Undo notice 4","scenario_hash":"e8f81362dce3a032553c1bf532b2a0e17152c880eba4912935532a74294965d8","mutation_count":11,"result":{"Total":11,"Killed":11,"Survived":0,"Errors":0},"tested_at":"2026-11-23T16:40:23.828232689Z"},{"index":4,"name":"Undo notice 5","scenario_hash":"bb7186d58b7729f72884c3cbca49770a1a18b8c334ee57ff635afae154e8e119","mutation_count":18,"result":{"Total":18,"Killed":18,"Survived":0,"Errors":0},"tested_at":"2026-11-23T16:40:23.828232689Z"},{"index":5,"name":"Undo notice 6","scenario_hash":"a337c8bf357f811361f002b8df095462d37d9bbe0f29560d4d6e89740ffd250c","mutation_count":5,"result":{"Total":5,"Killed":5,"Survived":0,"Errors":0},"tested_at":"2026-11-23T16:40:23.828232689Z"},{"index":6,"name":"Undo notice 7","scenario_hash":"2fd52b1380a587e5596a53756ccaed3e7fa196a02e5ccb3f337efb56f8a1a68a","mutation_count":14,"result":{"Total":14,"Killed":14,"Survived":0,"Errors":0},"tested_at":"2026-11-23T16:40:23.828232689Z"},{"index":7,"name":"Undo notice 8","scenario_hash":"953a5289ebed9dc06fa6c29d406c7a28a4d0520695682e55dea5cb6cc1218808","mutation_count":9,"result":{"Total":9,"Killed":9,"Survived":0,"Errors":0},"tested_at":"2026-11-23T16:40:23.828232689Z"},{"index":8,"name":"Undo notice 9","scenario_hash":"1c296b50134e7546f4d092d7ba9d0241645f72729a8d4f2c0871ff32525f5b16","mutation_count":6,"result":{"Total":6,"Killed":6,"Survived":0,"Errors":0},"tested_at":"2026-11-23T16:40:23.828232689Z"}]}
# acceptance-mutation-manifest-end

# Spec §5.4 (Undo, the notice). When a task is completed a notice appears that
# names the task and has Deshacer. It is shown while
# completedAt <= now < completedAt + 5 seconds.
# There is a single notice: completing another task with the notice open replaces it
# with the one for the new completion. Deshacer in the notice deletes only the completion
# that the notice names and closes the notice; if that completion no longer exists, it does
# nothing.
# The notice is opened by an "I complete the task ..." on this device; the
# completions in the Givens are earlier and do not open a notice.
# Each task is named by its title (one word).
Feature: Undo notice

  # Undo notice 1
  # The notice is shown from the moment I complete until the last second before the 5.
  Scenario Outline: Undo notice 1
    Given a relative recurring task Regar every <every> <unit>
    When I complete the task Regar on <completed>
    And I query the notice on <now>
    Then the notice offers to undo the completion of Regar from <completed_stored>

    Examples:
      | every | unit   | completed           | now                 | completed_stored    |
      | 2    | dias   | 2026-07-15T08:00:00 | 2026-07-15T08:00:00 | 2026-07-15T08:00:00 |
      | 2    | dias   | 2026-07-15T08:00:00 | 2026-07-15T08:00:04 | 2026-07-15T08:00:00 |

  # Undo notice 2
  # At 5 seconds the notice disappears by itself.
  Scenario Outline: Undo notice 2
    Given a relative recurring task Regar every <every> <unit>
    When I complete the task Regar on <completed>
    And I query the notice on <now>
    Then there is no notice

    Examples:
      | every | unit   | completed           | now                 |
      | 2    | dias   | 2026-07-15T08:00:00 | 2026-07-15T08:00:05 |
      | 2    | dias   | 2026-07-15T08:00:00 | 2026-07-15T09:00:00 |

  # Undo notice 3
  # Completing another task with the notice open replaces it; the new notice
  # lasts 5 seconds from its own completion. Row 1: within the 5
  # seconds of both completions. Row 2: after the first one's have passed.
  Scenario Outline: Undo notice 3
    Given a relative recurring task Regar every <every> <unit>
    And a one-off task Pagar with due date <due_date>
    When I complete the task Regar on <water>
    And I complete the task Pagar on <pay>
    And I query the notice on <now>
    Then the notice offers to undo the completion of Pagar from <pay_stored>

    Examples:
      | every | unit   | due_date   | water               | pay                 | now                 | pay_stored          |
      | 2    | dias   | 2026-07-20 | 2026-07-15T08:00:00 | 2026-07-15T08:00:03 | 2026-07-15T08:00:04 | 2026-07-15T08:00:03 |
      | 2    | dias   | 2026-07-20 | 2026-07-15T08:00:00 | 2026-07-15T08:00:03 | 2026-07-15T08:00:07 | 2026-07-15T08:00:03 |

  # Undo notice 4
  # Completing the same task again with the notice open also
  # replaces it.
  Scenario Outline: Undo notice 4
    Given a relative recurring task Regar every <every> <unit>
    When I complete the task Regar on <first>
    And I complete the task Regar on <second>
    And I query the notice on <now>
    Then the notice offers to undo the completion of Regar from <second_stored>

    Examples:
      | every | unit   | first               | second              | now                 | second_stored       |
      | 2    | dias   | 2026-07-15T08:00:00 | 2026-07-15T08:00:02 | 2026-07-15T08:00:03 | 2026-07-15T08:00:02 |

  # Undo notice 5
  # Deshacer in the notice deletes that completion, recomputes the status with the ones
  # that remain (U goes back to the previous one, which has already expired) and closes the notice.
  Scenario Outline: Undo notice 5
    Given a relative recurring task Regar every <every> <unit>
    And the task Regar was completed on <previous>
    When I complete the task Regar on <completed>
    And I tap Deshacer in the notice on <tap>
    And I query the notice on <tap>
    And I query the status on <now>
    Then there is no notice
    And the task Regar keeps a single completion, from <previous_stored>
    And the status is pendiente

    Examples:
      | every | unit   | previous            | completed           | tap                 | now                 | previous_stored     |
      | 4    | horas  | 2026-07-15T06:00:00 | 2026-07-15T11:00:00 | 2026-07-15T11:00:04 | 2026-07-15T11:00:05 | 2026-07-15T06:00:00 |

  # Undo notice 6
  # Undoing a one-off from the notice returns it to Pendientes.
  Scenario Outline: Undo notice 6
    Given a one-off task Pagar with due date <due_date>
    When I complete the task Pagar on <completed>
    And I tap Deshacer in the notice on <tap>
    And I query Pendientes on <now>
    Then no completion remains of Pagar
    And Pendientes shows in order <order>

    Examples:
      | due_date   | completed           | tap                 | now                 | order |
      | 2026-07-20 | 2026-07-15T08:00:00 | 2026-07-15T08:00:02 | 2026-07-15T08:00:03 | Pagar |

  # Undo notice 7
  # After the notice is replaced, Deshacer deletes only the last completion;
  # the one of the other task remains.
  Scenario Outline: Undo notice 7
    Given a relative recurring task Regar every <every> <unit>
    And a one-off task Pagar with due date <due_date>
    When I complete the task Regar on <water>
    And I complete the task Pagar on <pay>
    And I tap Deshacer in the notice on <tap>
    Then no completion remains of Pagar
    And the task Regar keeps a single completion, from <water_stored>

    Examples:
      | every | unit   | due_date   | water               | pay                 | tap                 | water_stored        |
      | 2    | dias   | 2026-07-20 | 2026-07-15T08:00:00 | 2026-07-15T08:00:03 | 2026-07-15T08:00:04 | 2026-07-15T08:00:00 |

  # Undo notice 8
  # If another device already deleted that completion, Deshacer does nothing: the
  # previous completion remains.
  Scenario Outline: Undo notice 8
    Given a relative recurring task Regar every <every> <unit>
    And the task Regar was completed on <previous>
    When I complete the task Regar on <completed>
    And another device, without seeing that change, deletes the completion from <completed>
    And I tap Deshacer in the notice on <tap>
    Then the task Regar keeps a single completion, from <previous_stored>

    Examples:
      | every | unit   | previous            | completed           | tap                 | previous_stored     |
      | 2    | dias   | 2026-07-13T09:00:00 | 2026-07-15T08:00:00 | 2026-07-15T08:00:02 | 2026-07-13T09:00:00 |

  # Undo notice 9
  # If another device already deleted the task, Deshacer does not revive it.
  Scenario Outline: Undo notice 9
    Given a relative recurring task Regar every <every> <unit>
    When I complete the task Regar on <completed>
    And another device, without seeing that change, deletes the task
    And I tap Deshacer in the notice on <tap>
    And I query Pendientes at any moment
    Then no task remains
    And no completion remains of Regar

    Examples:
      | every | unit   | completed           | tap                 |
      | 2    | dias   | 2026-07-15T08:00:00 | 2026-07-15T08:00:02 |
