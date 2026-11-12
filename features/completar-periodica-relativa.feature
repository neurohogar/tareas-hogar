# mutation-stamp: sha256=dba01e30298b83598162add9570b035ead2bf3fe1cdbb29d9cd0b43efaa6ba11
# acceptance-mutation-manifest-begin
# {"version":1,"tested_at":"2026-11-02T19:39:41.641368217Z","feature_name":"Completar periódica relativa","feature_path":"features/completar-periodica-relativa.feature","background_hash":"74234e98afe7498fb5daf1f36ac2d78acc339464f950703b8c019892f982b90b","implementation_hash":"sha256:f20b1b20a436ec6531521f318411151b9b43ba95b782e8090ab5a197a9da40e4","scenarios":[{"index":0,"name":"Completar periódica relativa 1","scenario_hash":"1562c8906f5e00f26b6685b022fe1c2df16773afde12dcdb4da871b6ff8ef646","mutation_count":11,"result":{"Total":11,"Killed":11,"Survived":0,"Errors":0},"tested_at":"2026-11-02T19:39:41.641368217Z"},{"index":1,"name":"Completar periódica relativa 2","scenario_hash":"656433c11bb6b9e80ed2dd8595f12f087e912aefa2d56169d55ac757ee121321","mutation_count":47,"result":{"Total":47,"Killed":47,"Survived":0,"Errors":0},"tested_at":"2026-11-02T19:39:41.641368217Z"},{"index":2,"name":"Completar periódica relativa 3","scenario_hash":"39c093aba3d56329ca388df03b09959c4ca5c3310446fa42ba6166f11b292381","mutation_count":17,"result":{"Total":17,"Killed":17,"Survived":0,"Errors":0},"tested_at":"2026-11-02T19:39:41.641368217Z"},{"index":3,"name":"Completar periódica relativa 4","scenario_hash":"1d990c4b8456c429567d793844629ecb26cb13b86d2104f14c12851baa3665c6","mutation_count":5,"result":{"Total":5,"Killed":5,"Survived":0,"Errors":0},"tested_at":"2026-11-02T19:39:41.641368217Z"}]}
# acceptance-mutation-manifest-end

# Spec §4.4 y §5.2. Completar una periódica relativa registra un Completado
# (sin ocurrenciaCubierta) y reinicia el intervalo desde ese momento,
# en cualquier estado. Los completados anteriores no se modifican.
# El progreso es una fracción entre 0 y 1, comparada exactamente.
Feature: Completar periódica relativa

  # Completar periódica relativa 1
  # Completar una tarea nunca completada la deja en espera desde ese momento.
  Scenario Outline: Completar periódica relativa 1
    Given una tarea periódica relativa cada <cada> <unidad>
    When completo la tarea el <completada>
    And consulto el estado el <ahora>
    Then se registró un completado sin ocurrencia cubierta
    And el estado es en espera
    And el progreso es <progreso>

    Examples:
      | cada | unidad | completada          | ahora               | progreso |
      | 2    | dias   | 2026-07-15T08:00:00 | 2026-07-16T08:00:00 | 0.5      |

  # Completar periódica relativa 2
  # Completar en espera, pendiente o atrasada reinicia el intervalo desde el nuevo completado.
  Scenario Outline: Completar periódica relativa 2
    Given una tarea periódica relativa cada <cada> <unidad>
    And la tarea fue completada el <anterior>
    When completo la tarea el <nuevo>
    And consulto el estado el <ahora>
    Then el nuevo completado se agrega sin modificar los anteriores
    And el estado es en espera
    And el progreso es <progreso>

    Examples:
      | cada | unidad | anterior            | nuevo               | ahora               | progreso |
      | 4    | horas  | 2026-07-15T08:00:00 | 2026-07-15T09:00:00 | 2026-07-15T10:00:00 | 0.25     |
      | 4    | horas  | 2026-07-15T08:00:00 | 2026-07-15T13:00:00 | 2026-07-15T15:00:00 | 0.5      |
      | 4    | horas  | 2026-07-15T08:00:00 | 2026-07-16T08:00:00 | 2026-07-16T11:00:00 | 0.75     |
      | 2    | dias   | 2026-07-15T08:00:00 | 2026-07-15T20:00:00 | 2026-07-16T08:00:00 | 0.25     |

  # Completar periódica relativa 3
  # Tras completar antes de tiempo, vuelve a pendiente al vencer el nuevo intervalo
  # (con el completado anterior, en esos momentos estaría atrasada).
  Scenario Outline: Completar periódica relativa 3
    Given una tarea periódica relativa cada <cada> <unidad>
    And la tarea fue completada el <anterior>
    When completo la tarea el <nuevo>
    And consulto el estado el <ahora>
    Then el estado es pendiente

    Examples:
      | cada | unidad | anterior            | nuevo               | ahora               |
      | 4    | horas  | 2026-07-15T08:00:00 | 2026-07-15T11:00:00 | 2026-07-15T15:00:00 |
      | 4    | horas  | 2026-07-15T08:00:00 | 2026-07-15T11:00:00 | 2026-07-15T16:00:00 |
      | 3    | dias   | 2026-07-15T08:00:00 | 2026-07-17T08:00:00 | 2026-07-21T08:00:00 |

  # Completar periódica relativa 4
  # Consultado en el mismo instante del completado: en espera, sin progreso.
  # El intervalo no influye en este borde, por eso no es parámetro.
  Scenario Outline: Completar periódica relativa 4
    Given una tarea periódica relativa nunca completada
    When completo la tarea el <completada>
    And consulto el estado el <ahora>
    Then se registró un completado sin ocurrencia cubierta
    And el estado es en espera
    And el progreso es <progreso>

    Examples:
      | completada          | ahora               | progreso |
      | 2026-07-15T08:00:00 | 2026-07-15T08:00:00 | 0        |
