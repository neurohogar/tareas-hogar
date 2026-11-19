# mutation-stamp: sha256=dba01e30298b83598162add9570b035ead2bf3fe1cdbb29d9cd0b43efaa6ba11
# acceptance-mutation-manifest-begin
# {"version":1,"tested_at":"2026-11-16T01:43:41.225167421Z","feature_name":"Completar periódica relativa","feature_path":"features/completar-periodica-relativa.feature","background_hash":"74234e98afe7498fb5daf1f36ac2d78acc339464f950703b8c019892f982b90b","implementation_hash":"sha256:c5557490b05b0f1d1e45a59d2c2b0f295ebb8f068ce069d866f360eb32ca3668","scenarios":[{"index":0,"name":"Completar periódica relativa 1","scenario_hash":"1562c8906f5e00f26b6685b022fe1c2df16773afde12dcdb4da871b6ff8ef646","mutation_count":11,"result":{"Total":11,"Killed":11,"Survived":0,"Errors":0},"tested_at":"2026-11-16T01:43:41.225167421Z"},{"index":1,"name":"Completar periódica relativa 2","scenario_hash":"656433c11bb6b9e80ed2dd8595f12f087e912aefa2d56169d55ac757ee121321","mutation_count":47,"result":{"Total":47,"Killed":47,"Survived":0,"Errors":0},"tested_at":"2026-11-16T01:43:41.225167421Z"},{"index":2,"name":"Completar periódica relativa 3","scenario_hash":"39c093aba3d56329ca388df03b09959c4ca5c3310446fa42ba6166f11b292381","mutation_count":17,"result":{"Total":17,"Killed":17,"Survived":0,"Errors":0},"tested_at":"2026-11-16T01:43:41.225167421Z"},{"index":3,"name":"Completar periódica relativa 4","scenario_hash":"1d990c4b8456c429567d793844629ecb26cb13b86d2104f14c12851baa3665c6","mutation_count":5,"result":{"Total":5,"Killed":5,"Survived":0,"Errors":0},"tested_at":"2026-11-16T01:43:41.225167421Z"}]}
# acceptance-mutation-manifest-end

# Spec §4.4 y §5.2. Completar una periódica relativa registra un Completado
# (sin ocurrenciaCubierta) y reinicia el intervalo desde ese momento,
# en cualquier estado. Los completados anteriores no se modifican.
# El progreso es una fracción entre 0 y 1, comparada exactamente.
Feature: Complete relative recurring task

  # Completar periódica relativa 1
  # Completar una tarea nunca completada la deja en espera desde ese momento.
  Scenario Outline: Complete relative recurring task 1
    Given a relative recurring task every <every> <unit>
    When I complete the task on <completed>
    And I query the status on <now>
    Then a completion without a covered occurrence was recorded
    And the status is en espera
    And the progress is <progress>

    Examples:
      | every | unit   | completed           | now                 | progress |
      | 2    | dias   | 2026-07-15T08:00:00 | 2026-07-16T08:00:00 | 0.5      |

  # Completar periódica relativa 2
  # Completar en espera, pendiente o atrasada reinicia el intervalo desde el nuevo completado.
  Scenario Outline: Complete relative recurring task 2
    Given a relative recurring task every <every> <unit>
    And the task was completed on <previous>
    When I complete the task on <new>
    And I query the status on <now>
    Then the new completion is added without changing the previous ones
    And the status is en espera
    And the progress is <progress>

    Examples:
      | every | unit   | previous            | new                 | now                 | progress |
      | 4    | horas  | 2026-07-15T08:00:00 | 2026-07-15T09:00:00 | 2026-07-15T10:00:00 | 0.25     |
      | 4    | horas  | 2026-07-15T08:00:00 | 2026-07-15T13:00:00 | 2026-07-15T15:00:00 | 0.5      |
      | 4    | horas  | 2026-07-15T08:00:00 | 2026-07-16T08:00:00 | 2026-07-16T11:00:00 | 0.75     |
      | 2    | dias   | 2026-07-15T08:00:00 | 2026-07-15T20:00:00 | 2026-07-16T08:00:00 | 0.25     |

  # Completar periódica relativa 3
  # Tras completar antes de tiempo, vuelve a pendiente al vencer el nuevo intervalo
  # (con el completado anterior, en esos momentos estaría atrasada).
  Scenario Outline: Complete relative recurring task 3
    Given a relative recurring task every <every> <unit>
    And the task was completed on <previous>
    When I complete the task on <new>
    And I query the status on <now>
    Then the status is pendiente

    Examples:
      | every | unit   | previous            | new                 | now                 |
      | 4    | horas  | 2026-07-15T08:00:00 | 2026-07-15T11:00:00 | 2026-07-15T15:00:00 |
      | 4    | horas  | 2026-07-15T08:00:00 | 2026-07-15T11:00:00 | 2026-07-15T16:00:00 |
      | 3    | dias   | 2026-07-15T08:00:00 | 2026-07-17T08:00:00 | 2026-07-21T08:00:00 |

  # Completar periódica relativa 4
  # Consultado en el mismo instante del completado: en espera, sin progreso.
  # El intervalo no influye en este borde, por eso no es parámetro.
  Scenario Outline: Complete relative recurring task 4
    Given a relative recurring task never completed
    When I complete the task on <completed>
    And I query the status on <now>
    Then a completion without a covered occurrence was recorded
    And the status is en espera
    And the progress is <progress>

    Examples:
      | completed           | now                 | progress |
      | 2026-07-15T08:00:00 | 2026-07-15T08:00:00 | 0        |
