# mutation-stamp: sha256=9389c50da392b86f3c3d62934db55713f90a94fe9437b8dd43a5ca4c18dec295
# acceptance-mutation-manifest-begin
# {"version":1,"tested_at":"2026-11-23T16:40:28.388283099Z","feature_name":"Minimal mode in Pendientes","feature_path":"features/minimal-mode-pending.feature","background_hash":"74234e98afe7498fb5daf1f36ac2d78acc339464f950703b8c019892f982b90b","implementation_hash":"sha256:9cbf84324842a2da95984b358836e3835a8e8d791e0ee94a816091a6daeff019","scenarios":[{"index":0,"name":"Minimal mode in Pendientes 1","scenario_hash":"6cb243211ac88aadbcd08c878ca0b2f05e33033df21053a82405c16ab860d1a8","mutation_count":3,"result":{"Total":3,"Killed":3,"Survived":0,"Errors":0},"tested_at":"2026-11-23T16:40:28.388283099Z"},{"index":1,"name":"Minimal mode in Pendientes 2","scenario_hash":"841c87239cb3e0eef5cf7e825d0a992647357ace4035913d3d0edfa966c43a21","mutation_count":2,"result":{"Total":2,"Killed":2,"Survived":0,"Errors":0},"tested_at":"2026-11-23T16:40:28.388283099Z"},{"index":2,"name":"Minimal mode in Pendientes 3","scenario_hash":"e80fd7082933698a6e53ae5c8f7577f13c22268202f26f6b2f6cadbfe3263f49","mutation_count":5,"result":{"Total":5,"Killed":5,"Survived":0,"Errors":0},"tested_at":"2026-11-23T16:40:28.388283099Z"},{"index":3,"name":"Minimal mode in Pendientes 4","scenario_hash":"f691ac12d13b977dadaff042d887412c1fd9fe7522d3fc85831cbd661f409f6c","mutation_count":2,"result":{"Total":2,"Killed":2,"Survived":0,"Errors":0},"tested_at":"2026-11-23T16:40:28.388283099Z"},{"index":5,"name":"Minimal mode in Pendientes 6","scenario_hash":"05bb0aebec87247fe88bc481a4956fa0466f0edb7ebf45897f65ee342bbf759b","mutation_count":4,"result":{"Total":4,"Killed":4,"Survived":0,"Errors":0},"tested_at":"2026-11-23T16:40:28.388283099Z"},{"index":6,"name":"Minimal mode in Pendientes 7","scenario_hash":"00e087452381c418a44ae3a61c2111280ea56f22e65f24dfce6b0f8bd9dc2366","mutation_count":5,"result":{"Total":5,"Killed":5,"Survived":0,"Errors":0},"tested_at":"2026-11-23T16:40:28.388283099Z"},{"index":7,"name":"Minimal mode in Pendientes 8","scenario_hash":"5fc6bca4e53817278b85762956368e528822f0699a6c19d38ab624133e503c08","mutation_count":2,"result":{"Total":2,"Killed":2,"Survived":0,"Errors":0},"tested_at":"2026-11-23T16:40:28.388283099Z"},{"index":8,"name":"Minimal mode in Pendientes 9","scenario_hash":"6eab4868d4dca7639ef2bdea970a47fa3b762769299736628e9f9b83fdfa0d84","mutation_count":2,"result":{"Total":2,"Killed":2,"Survived":0,"Errors":0},"tested_at":"2026-11-23T16:40:28.388283099Z"},{"index":9,"name":"Minimal mode in Pendientes 10","scenario_hash":"4ec4549d80bfd2368f8122c53ffcbe5d98376513285c78cded75ace3e8dab1e8","mutation_count":4,"result":{"Total":4,"Killed":4,"Survived":0,"Errors":0},"tested_at":"2026-11-23T16:40:28.388283099Z"},{"index":10,"name":"Minimal mode in Pendientes 11","scenario_hash":"699d013e26f869f64a627ebb1e367346797c73e6f234904b62eedcd07f060073","mutation_count":2,"result":{"Total":2,"Killed":2,"Survived":0,"Errors":0},"tested_at":"2026-11-23T16:40:28.388283099Z"},{"index":11,"name":"Minimal mode in Pendientes 12","scenario_hash":"277e6ad5096134936baf90e7247b4e5aff1bc1bf9502fdb0edea1344ccc07c0e","mutation_count":2,"result":{"Total":2,"Killed":2,"Survived":0,"Errors":0},"tested_at":"2026-11-23T16:40:28.388283099Z"},{"index":12,"name":"Minimal mode in Pendientes 13","scenario_hash":"05cf4e7b22e390fe3b5ca7da43267db75cbb2ad2fc47836fdcc0b67aea3be25e","mutation_count":14,"result":{"Total":14,"Killed":14,"Survived":0,"Errors":0},"tested_at":"2026-11-23T16:40:28.388283099Z"}]}
# acceptance-mutation-manifest-end

# Spec §5.8 (Minimal mode, Paused by the minimal mode, One-off tasks, Essential
# tasks), §5.9, §6.1 (Menu and minimal mode, Which rows are in view with the mode on,
# Mostrar pausadas) and §7 (Minimal mode). With the mode on, only the essential
# tasks are in view, in the same order and with the same rows as with the mode off.
#   A non-essential recurring task is paused by the mode: no status, it does not become
#   overdue, disabled checkbox, no row. The mode never writes `paused`.
#   A non-essential one-off task is hidden: its status does not change.
#   The state is a single value synced between devices: another device turning
#   the mode on turns it on here.
# The ⋮ menu, its check mark, that turning the mode on or off shows no message, that
# the mode survives a reload and has no timer, and that the Historial does not change
# are verified in the QA suite (qa/minimal-mode.md).
# Each task is named by its title (one word). "the minimal mode is S" (on or off) is
# the state already set before any other date in the scenario; "I turn the minimal
# mode on" is the tap of the menu item. "the task T was marked essential" and "the task
# T was paused" (by hand) are already done. "the task is paused by the minimal mode" /
# "the task is not paused by the minimal mode" assert the cause of pause that the mode
# puts on the task (it is not a stored field); "the task is not paused" asserts that
# the document has no `paused` field. "Pendientes shows in order", "as paused" and "as
# completed" give the titles of the rows from top to bottom; "the Modo mínimo line
# is S" (shown or not shown) asserts the line above the list. When a step does not give
# `created on`, the task was created before any other date in the scenario, in the
# declared order. Without the step "Mostrar pausadas is on" (or "Mostrar completadas is
# on"), the check is at its initial value.
# Reference week: Monday 2026-07-13 to Sunday 2026-07-19.
Feature: Minimal mode in Pendientes

  # Minimal mode in Pendientes 1
  # A non-essential relative recurring task is paused by the mode: without it, row 1
  # would be overdue and row 2 waiting. It has no status and its checkbox is disabled.
  Scenario Outline: Minimal mode in Pendientes 1
    Given a relative recurring task every <every> <unit>
    And the task was completed on <completed>
    And the minimal mode is on
    When I query the status on <now>
    Then the task is paused by the minimal mode
    And the task has no status
    And the task checkbox is disabled
    And the task is not paused

    Examples:
      | every | unit | completed           | now                 |
      | 2     | dias | 2026-07-01T09:00:00 | 2026-07-15T12:00:00 |
      | 2     | dias | 2026-07-15T09:00:00 | 2026-07-15T12:00:00 |

  # Minimal mode in Pendientes 2
  # The same for a non-essential calendar task, even as its occurrences pass
  # (without the mode, row 1 would be pending and row 2 overdue).
  Scenario Outline: Minimal mode in Pendientes 2
    Given a weekly recurring task on <days> created on <created>
    And the minimal mode is on
    When I query the status on <now>
    Then the task is paused by the minimal mode
    And the task has no status
    And the task checkbox is disabled

    Examples:
      | days           | created             | now                 |
      | martes, jueves | 2026-07-13T08:00:00 | 2026-07-14T10:00:00 |
      | martes, jueves | 2026-07-13T08:00:00 | 2026-08-20T10:00:00 |

  # Minimal mode in Pendientes 3
  # An essential recurring task is not paused by the mode and keeps its status: row 1
  # overdue, row 2 waiting.
  Scenario Outline: Minimal mode in Pendientes 3
    Given a relative recurring task every <every> <unit>
    And the task was completed on <completed>
    And the task was marked essential
    And the minimal mode is on
    When I query the status on <now>
    Then the task is not paused by the minimal mode
    And the status is <status>

    Examples:
      | every | unit | completed           | now                 | status    |
      | 2     | dias | 2026-07-01T09:00:00 | 2026-07-15T12:00:00 | atrasada  |
      | 2     | dias | 2026-07-15T09:00:00 | 2026-07-15T12:00:00 | en espera |

  # Minimal mode in Pendientes 4
  # A non-essential one-off task is not paused: its status does not change (it is
  # still overdue).
  Scenario Outline: Minimal mode in Pendientes 4
    Given a one-off task with due date <due_date>
    And the minimal mode is on
    When I query the status on <now>
    Then the task is not paused by the minimal mode
    And the status is atrasada

    Examples:
      | due_date   | now                 |
      | 2026-07-14 | 2026-07-15T10:00:00 |

  # Minimal mode in Pendientes 5
  # A non-essential one-off task is hidden: no row.
  Scenario Outline: Minimal mode in Pendientes 5
    Given a one-off task Pagar with due date <due_date>
    And the minimal mode is on
    When I query Pendientes on <now>
    Then Pendientes shows no task

    Examples:
      | due_date   | now                 |
      | 2026-07-14 | 2026-07-15T10:00:00 |

  # Minimal mode in Pendientes 6
  # Only the essential tasks are in view, in the same order as with the mode off. Row 1
  # (mode off): the three, Pagar (overdue) first and Cena before Foco by title.
  # Row 2 (mode on): Cena is not essential and leaves; Pagar and Foco keep their order.
  Scenario Outline: Minimal mode in Pendientes 6
    Given the minimal mode is <mode>
    And a one-off task Foco without a due date
    And a one-off task Cena without a due date
    And a one-off task Pagar with due date <due_date>
    And the task Foco was marked essential
    And the task Pagar was marked essential
    When I query Pendientes on <now>
    Then Pendientes shows in order <order>

    Examples:
      | mode | due_date   | now                 | order             |
      | off  | 2026-07-14 | 2026-07-15T12:00:00 | Pagar, Cena, Foco |
      | on   | 2026-07-14 | 2026-07-15T12:00:00 | Pagar, Foco       |

  # Minimal mode in Pendientes 7
  # With Mostrar completadas and Mostrar pausadas on, the non-essential ones are still
  # out of view, recurring (paused by the mode) and one-off (hidden), completed or not.
  # A task paused by hand is shown only if it is essential, and only with Mostrar
  # pausadas, at the end. Without the mode, Lavar, Pagar and Basura would be in view.
  Scenario Outline: Minimal mode in Pendientes 7
    Given the minimal mode is on
    And Mostrar completadas is on
    And Mostrar pausadas is on
    And a one-off task Foco without a due date
    And the task Foco was marked essential
    And a one-off task Pagar without a due date
    And the task Pagar was completed on <completed_pay>
    And a relative recurring task Barrer every <every> <unit>
    And the task Barrer was completed on <completed_sweep>
    And the task Barrer was marked essential
    And a relative recurring task Lavar every <every> <unit>
    And the task Lavar was completed on <completed_sweep>
    And a relative recurring task Regar every <every> <unit>
    And the task Regar was marked essential
    And the task Regar was paused
    And a relative recurring task Basura every <every> <unit>
    And the task Basura was paused
    When I query Pendientes on <now>
    Then Pendientes shows in order <order>
    And Pendientes shows as completed <completed_list>
    And Pendientes shows as paused <paused>

    Examples:
      | completed_pay       | every | unit | completed_sweep     | now                 | order               | completed_list | paused |
      | 2026-07-15T09:00:00 | 2     | dias | 2026-07-15T08:00:00 | 2026-07-15T12:00:00 | Foco, Barrer, Regar | Barrer         | Regar  |

  # Minimal mode in Pendientes 8
  # With Mostrar pausadas off (initial value), the essential task paused by hand is
  # not shown either.
  Scenario Outline: Minimal mode in Pendientes 8
    Given the minimal mode is on
    And a one-off task Foco without a due date
    And the task Foco was marked essential
    And a relative recurring task Regar every <every> <unit>
    And the task Regar was marked essential
    And the task Regar was paused
    When I query Pendientes on <now>
    Then Pendientes shows in order <order>

    Examples:
      | every | unit | now                 | order |
      | 2     | dias | 2026-07-15T12:00:00 | Foco  |

  # Minimal mode in Pendientes 9
  # The mode never writes `paused` and does not undo a manual pause: a task paused by
  # hand and by the mode is paused by both.
  Scenario Outline: Minimal mode in Pendientes 9
    Given a relative recurring task every <every> <unit>
    And the task was paused
    And the minimal mode is on
    When I query the status on <now>
    Then the task is paused
    And the task is paused by the minimal mode
    And the task has no status

    Examples:
      | every | unit | now                 |
      | 2     | dias | 2026-07-15T12:00:00 |

  # Minimal mode in Pendientes 10
  # The line «Modo mínimo» is shown only with the mode on, even if the list is empty
  # (it can be turned on with no essential task).
  Scenario Outline: Minimal mode in Pendientes 10
    Given the minimal mode is <mode>
    When I query Pendientes at any moment
    Then Pendientes shows no task
    And the Modo mínimo line is <line>

    Examples:
      | mode | line      |
      | on   | shown     |
      | off  | not shown |

  # Minimal mode in Pendientes 11
  # The line is shown above a list that has rows.
  Scenario Outline: Minimal mode in Pendientes 11
    Given the minimal mode is on
    And a one-off task Foco without a due date
    And the task Foco was marked essential
    When I query Pendientes at any moment
    Then Pendientes shows in order <order>
    And the Modo mínimo line is <line>

    Examples:
      | order | line  |
      | Foco  | shown |

  # Minimal mode in Pendientes 12
  # The state is one value synced between devices: another device turning the mode on
  # leaves here only the essential tasks.
  Scenario Outline: Minimal mode in Pendientes 12
    Given a one-off task Foco without a due date
    And the task Foco was marked essential
    And a relative recurring task Regar every <every> <unit>
    When another device turns the minimal mode on
    And I query Pendientes on <now>
    Then Pendientes shows in order <order>
    And the Modo mínimo line is <line>

    Examples:
      | every | unit | now                 | order | line  |
      | 2     | dias | 2026-07-15T12:00:00 | Foco  | shown |

  # Minimal mode in Pendientes 13
  # A postponed non-essential task keeps its postponement while the mode pauses it.
  Scenario Outline: Minimal mode in Pendientes 13
    Given a relative recurring task every <every> <unit>
    And the task was completed on <completed>
    And the task was postponed with option <option> on <postponed>
    When I turn the minimal mode on
    Then the task is paused by the minimal mode
    And the task is postponed from <from> to <to>

    Examples:
      | every | unit | completed           | option | postponed           | from                | to                  |
      | 2     | dias | 2026-07-01T09:00:00 | 1 hora | 2026-07-15T10:00:00 | 2026-07-15T10:00:00 | 2026-07-15T11:00:00 |
