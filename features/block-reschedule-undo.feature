# mutation-stamp: sha256=7c5bf18db981c23a0ac4dcd2464b039934ca9454796dcf1bfc8c380e74824d10
# acceptance-mutation-manifest-begin
# {"version":1,"tested_at":"2026-11-23T16:39:28.192193513Z","feature_name":"Block reschedule undo","feature_path":"features/block-reschedule-undo.feature","background_hash":"74234e98afe7498fb5daf1f36ac2d78acc339464f950703b8c019892f982b90b","implementation_hash":"sha256:22f296153be092207adeef61df27391217be201d3485104d21571745697a9da2","scenarios":[{"index":0,"name":"Block reschedule undo 1","scenario_hash":"a5f3401563f3a50888368889d45943486bcb1b7e1a2dccff7f86c0a94dba4822","mutation_count":16,"result":{"Total":16,"Killed":16,"Survived":0,"Errors":0},"tested_at":"2026-11-23T16:39:28.192193513Z"},{"index":1,"name":"Block reschedule undo 2","scenario_hash":"641985bac82f9a0ba34fbbba2ec57d29191d6d846ea76f81aa5cc20aad520c68","mutation_count":5,"result":{"Total":5,"Killed":5,"Survived":0,"Errors":0},"tested_at":"2026-11-23T16:39:28.192193513Z"},{"index":2,"name":"Block reschedule undo 3","scenario_hash":"13cc00f60ef3a31c219859b10f14746c30b57c77c6b49ebd42760d00035df2e0","mutation_count":12,"result":{"Total":12,"Killed":12,"Survived":0,"Errors":0},"tested_at":"2026-11-23T16:39:28.192193513Z"},{"index":3,"name":"Block reschedule undo 4","scenario_hash":"d627f8c6c2c9aa6303eac448aabe8d4c395c6beabc4f36f7c81b6c2cbdf35109","mutation_count":6,"result":{"Total":6,"Killed":6,"Survived":0,"Errors":0},"tested_at":"2026-11-23T16:39:28.192193513Z"},{"index":4,"name":"Block reschedule undo 5","scenario_hash":"2100138877ca5f784a4a6941c3e3a374ae8cdbbbdf739bc0f5ca9f8d259b3ee0","mutation_count":14,"result":{"Total":14,"Killed":14,"Survived":0,"Errors":0},"tested_at":"2026-11-23T16:39:28.192193513Z"},{"index":5,"name":"Block reschedule undo 6","scenario_hash":"0a3641f3ff16376d7afeacd5967883d2b3504b2e81389f57ac618889e681b900","mutation_count":6,"result":{"Total":6,"Killed":6,"Survived":0,"Errors":0},"tested_at":"2026-11-23T16:39:28.192193513Z"},{"index":6,"name":"Block reschedule undo 7","scenario_hash":"05f559f265454a43fdffd018216d71a72cca85e93ee6ca4f3290f6dedc68da8a","mutation_count":8,"result":{"Total":8,"Killed":8,"Survived":0,"Errors":0},"tested_at":"2026-11-23T16:39:28.192193513Z"},{"index":7,"name":"Block reschedule undo 8","scenario_hash":"094a51696fd40fb105f6dc7f6e94a02425e1536ae00713be7c7c5e105c69347b","mutation_count":6,"result":{"Total":6,"Killed":6,"Survived":0,"Errors":0},"tested_at":"2026-11-23T16:39:28.192193513Z"},{"index":8,"name":"Block reschedule undo 9","scenario_hash":"2a7eb2b67d979cdf54f420c2fd5737f785862d95d605a53b2213ad29cf361b41","mutation_count":6,"result":{"Total":6,"Killed":6,"Survived":0,"Errors":0},"tested_at":"2026-11-23T16:39:28.192193513Z"},{"index":9,"name":"Block reschedule undo 10","scenario_hash":"e45c7249c4d1e898bc20413b5b900e5e05914f84e4662281d257c4ef2e0275ce","mutation_count":1,"result":{"Total":1,"Killed":1,"Survived":0,"Errors":0},"tested_at":"2026-11-23T16:39:28.192193513Z"}]}
# acceptance-mutation-manifest-end

# Spec §5.4 (the notice of a block rescheduling) and §5.11 (Undo, No summary), with §7.
# After confirming, the notice «Tareas reprogramadas» with Deshacer is shown while
# confirmation <= now < confirmation + 5 seconds. It shares the single slot of the
# completion notice: either one replaces the other, and the replaced one loses its
# Deshacer. Deshacer in it writes back, for each rescheduled task that still exists, the
# reanudadaEn that the rescheduling replaced (or removes the field if there was none),
# and nothing else: completions made after stay and a deleted task is not revived. It
# closes the notice.
#   That the notice says «Tareas reprogramadas», that it stays visible when changing screens
#   and that neither confirming nor undoing shows a count, a message about what piled up or
#   congratulations are verified in the QA suite (qa/block-reschedule.md). The single
#   writeBatch of the undo is verified in the core unit tests.
# "the notice offers to undo the rescheduling" asserts that the notice is the one of the
# rescheduling, with Deshacer. "the task was resumed earlier on M" is a reanudadaEn
# already stored before any other date; "the task resume moment is M" asserts the stored
# reanudadaEn. The titles name the tasks (one word). "another device ..." steps are changes
# of another device that this one has not seen.
# Reference week: Monday 2026-07-13 to Sunday 2026-07-19.
Feature: Block reschedule undo

  # Block reschedule undo 1
  # The notice is shown from the moment of confirming until the last second before the 5.
  Scenario Outline: Block reschedule undo 1
    Given a relative recurring task every <every> <unit>
    And the task was completed on <completed>
    When I reschedule the overdue tasks on <confirmed>
    And I query the notice on <now>
    Then the notice offers to undo the rescheduling

    Examples:
      | every | unit | completed           | confirmed           | now                 |
      | 2     | dias | 2026-07-10T09:00:00 | 2026-07-16T10:00:00 | 2026-07-16T10:00:00 |
      | 2     | dias | 2026-07-10T09:00:00 | 2026-07-16T10:00:00 | 2026-07-16T10:00:04 |

  # Block reschedule undo 2
  # At 5 seconds the notice disappears by itself.
  Scenario Outline: Block reschedule undo 2
    Given a relative recurring task every <every> <unit>
    And the task was completed on <completed>
    When I reschedule the overdue tasks on <confirmed>
    And I query the notice on <now>
    Then there is no notice

    Examples:
      | every | unit | completed           | confirmed           | now                 |
      | 2     | dias | 2026-07-10T09:00:00 | 2026-07-16T10:00:00 | 2026-07-16T10:00:05 |
      | 2     | dias | 2026-07-10T09:00:00 | 2026-07-16T10:00:00 | 2026-07-16T11:00:00 |

  # Block reschedule undo 3
  # Completing a task within the 5 seconds replaces the notice: it offers to undo the
  # completion and not the rescheduling.
  Scenario Outline: Block reschedule undo 3
    Given a relative recurring task Regar every <every> <unit>
    And the task Regar was completed on <completed>
    And a one-off task Pagar with due date <due_date>
    When I reschedule the overdue tasks on <confirmed>
    And I complete the task Pagar on <pay>
    And I query the notice on <now>
    Then the notice offers to undo the completion of Pagar from <pay_stored>

    Examples:
      | every | unit | completed           | due_date   | confirmed           | pay                 | now                 | pay_stored          |
      | 2     | dias | 2026-07-10T09:00:00 | 2026-07-20 | 2026-07-16T10:00:00 | 2026-07-16T10:00:02 | 2026-07-16T10:00:03 | 2026-07-16T10:00:02 |

  # Block reschedule undo 4
  # Deshacer on the notice that replaced it undoes only the completion: the rescheduling
  # stays.
  Scenario Outline: Block reschedule undo 4
    Given a relative recurring task Regar every <every> <unit>
    And the task Regar was completed on <completed>
    And a one-off task Pagar with due date <due_date>
    When I reschedule the overdue tasks on <confirmed>
    And I complete the task Pagar on <pay>
    And I tap Deshacer in the notice on <tap>
    Then no completion remains of Pagar
    And the task Regar was resumed at that moment

    Examples:
      | every | unit | completed           | due_date   | confirmed           | pay                 | tap                 |
      | 2     | dias | 2026-07-10T09:00:00 | 2026-07-20 | 2026-07-16T10:00:00 | 2026-07-16T10:00:02 | 2026-07-16T10:00:03 |

  # Block reschedule undo 5
  # The rescheduling notice replaces that of a completion: Deshacer undoes the
  # rescheduling and the completion of before stays.
  Scenario Outline: Block reschedule undo 5
    Given a relative recurring task Regar every <every> <unit>
    And the task Regar was completed on <completed>
    And a one-off task Pagar with due date <due_date>
    When I complete the task Pagar on <pay>
    And I reschedule the overdue tasks on <confirmed>
    And I tap Deshacer in the notice on <tap>
    Then the task Regar has no resume moment
    And the task Pagar keeps a single completion, from <pay_stored>

    Examples:
      | every | unit | completed           | due_date   | pay                 | confirmed           | tap                 | pay_stored          |
      | 2     | dias | 2026-07-10T09:00:00 | 2026-07-20 | 2026-07-16T09:59:58 | 2026-07-16T10:00:00 | 2026-07-16T10:00:02 | 2026-07-16T09:59:58 |

  # Block reschedule undo 6
  # Deshacer removes the reanudadaEn the task did not have before: it is overdue again
  # with its «Tocaba ...», and the notice closes.
  Scenario Outline: Block reschedule undo 6
    Given a relative recurring task every <every> <unit>
    And the task was completed on <completed>
    When I reschedule the overdue tasks on <confirmed>
    And I tap Deshacer in the notice on <tap>
    And I query the notice on <tap>
    And I query the status on <tap>
    Then there is no notice
    And the task has no resume moment
    And the status is atrasada

    Examples:
      | every | unit | completed           | confirmed           | tap                 |
      | 2     | dias | 2026-07-10T09:00:00 | 2026-07-16T10:00:00 | 2026-07-16T10:00:03 |

  # Block reschedule undo 7
  # Deshacer writes back the reanudadaEn that the rescheduling replaced, not a removal:
  # the task is overdue again from its earlier resume.
  Scenario Outline: Block reschedule undo 7
    Given a relative recurring task every <every> <unit>
    And the task was completed on <completed>
    And the task was resumed earlier on <earlier>
    When I reschedule the overdue tasks on <confirmed>
    And I tap Deshacer in the notice on <tap>
    And I query the status on <tap>
    Then the task resume moment is <earlier>
    And the status is atrasada

    Examples:
      | every | unit | completed           | earlier             | confirmed           | tap                 |
      | 2     | dias | 2026-07-06T09:00:00 | 2026-07-05T10:00:00 | 2026-07-16T10:00:00 | 2026-07-16T10:00:03 |

  # Block reschedule undo 8
  # Each rescheduled task gets back its own value: Regar had none and Basura its earlier one.
  Scenario Outline: Block reschedule undo 8
    Given a relative recurring task Regar every <every> <unit>
    And the task Regar was completed on <completed>
    And a weekly recurring task Basura on <days> created on <created>
    And the task Basura was resumed earlier on <earlier>
    When I reschedule the overdue tasks on <confirmed>
    And I tap Deshacer in the notice on <tap>
    Then the task Regar has no resume moment
    And the task Basura resume moment is <earlier>

    Examples:
      | every | unit | completed           | days           | created             | earlier             | confirmed           | tap                 |
      | 2     | dias | 2026-07-10T09:00:00 | martes, jueves | 2026-07-01T08:00:00 | 2026-07-05T10:00:00 | 2026-07-16T10:00:00 | 2026-07-16T10:00:03 |

  # Block reschedule undo 9
  # A completion made after the rescheduling stays when undoing: the task is waiting
  # because of it.
  Scenario Outline: Block reschedule undo 9
    Given a relative recurring task Regar every <every> <unit>
    And the task Regar was completed on <completed>
    When I reschedule the overdue tasks on <confirmed>
    And another device, without seeing that change, completes the task Regar on <other>
    And I tap Deshacer in the notice on <tap>
    And I query the status on <tap>
    Then the task Regar has no resume moment
    And the status is en espera

    Examples:
      | every | unit | completed           | confirmed           | other               | tap                 |
      | 2     | dias | 2026-07-10T09:00:00 | 2026-07-16T10:00:00 | 2026-07-16T10:00:02 | 2026-07-16T10:00:03 |

  # Block reschedule undo 10
  # A task that another device deleted after the rescheduling is not revived by Deshacer.
  Scenario Outline: Block reschedule undo 10
    Given a relative recurring task Regar every <every> <unit>
    And the task Regar was completed on <completed>
    When I reschedule the overdue tasks on <confirmed>
    And another device, without seeing that change, deletes the task
    And I tap Deshacer in the notice on <tap>
    And I query Pendientes at any moment
    Then no task remains

    Examples:
      | every | unit | completed           | confirmed           | tap                 |
      | 2     | dias | 2026-07-10T09:00:00 | 2026-07-16T10:00:00 | 2026-07-16T10:00:03 |
