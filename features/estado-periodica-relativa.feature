# mutation-stamp: sha256=e0a9b23618212268f02bd50cfc7b0c5a7747598f9bb74b47f4f96ab96549603f
# acceptance-mutation-manifest-begin
# {"version":1,"tested_at":"2026-11-02T19:36:42.700086921Z","feature_name":"Estado de periódica relativa","feature_path":"features/estado-periodica-relativa.feature","background_hash":"74234e98afe7498fb5daf1f36ac2d78acc339464f950703b8c019892f982b90b","implementation_hash":"sha256:8c830f4616d947b40edb3ff46af4e3c349a53515ca9f579216016070dedffa26","scenarios":[{"index":1,"name":"Estado de periódica relativa 2","scenario_hash":"fe38377f008639801f8f6deec6e556d26ad7b7101435b896493d929ac0218686","mutation_count":55,"result":{"Total":55,"Killed":55,"Survived":0,"Errors":0},"tested_at":"2026-11-02T19:36:42.700086921Z"},{"index":2,"name":"Estado de periódica relativa 3","scenario_hash":"fe875e962540d44e38b643be749bc71b20bd6d6d0ae98b5d14b012aa647641be","mutation_count":12,"result":{"Total":12,"Killed":12,"Survived":0,"Errors":0},"tested_at":"2026-11-02T19:36:42.700086921Z"},{"index":3,"name":"Estado de periódica relativa 4","scenario_hash":"612b987e4f859d1e21b44f9e0a75c5ec48882db170c8d5a6b14a83ef05128bbe","mutation_count":36,"result":{"Total":36,"Killed":36,"Survived":0,"Errors":0},"tested_at":"2026-11-02T19:36:42.700086921Z"},{"index":4,"name":"Estado de periódica relativa 5","scenario_hash":"717b53ea590d5847cc9806a58ea03302990bff7f8c967dde286168833c85ddaa","mutation_count":18,"result":{"Total":18,"Killed":18,"Survived":0,"Errors":0},"tested_at":"2026-11-02T19:36:42.700086921Z"},{"index":5,"name":"Estado de periódica relativa 6","scenario_hash":"742ba99fc37894bd60c814babc1b606665d91b7d7cdd641e2de6f2075bc8328f","mutation_count":22,"result":{"Total":22,"Killed":22,"Survived":0,"Errors":0},"tested_at":"2026-11-02T19:36:42.700086921Z"},{"index":6,"name":"Estado de periódica relativa 7","scenario_hash":"30265ed7370718884303cf7f39f11043a5b6285627ec04b03cdb1bc0bdd34562","mutation_count":6,"result":{"Total":6,"Killed":6,"Survived":0,"Errors":0},"tested_at":"2026-11-02T19:36:42.700086921Z"}]}
# acceptance-mutation-manifest-end

# Spec §5.2. Estado derivado de una tarea periódica en modo relativo.
# U = completadoEn más reciente; V = U + intervalo (vencimiento).
# Horas en la zona local del dispositivo; "cada N dias" equivale a N × 24 horas.
# El progreso es una fracción entre 0 y 1: (ahora − U) / intervalo, comparada
# exactamente (solo se tolera el error de punto flotante).
Feature: Estado de periódica relativa

  # Estado de periódica relativa 1
  # Nunca completada: pendiente, sin importar el intervalo ni el momento.
  Scenario: Estado de periódica relativa 1
    Given una tarea periódica relativa nunca completada
    When consulto el estado en cualquier momento
    Then el estado es pendiente

  # Estado de periódica relativa 2
  # ahora < V: en espera, con progreso (ahora − U) / intervalo.
  Scenario Outline: Estado de periódica relativa 2
    Given una tarea periódica relativa cada <cada> <unidad>
    And la tarea fue completada el <completada>
    When consulto el estado el <ahora>
    Then el estado es en espera
    And el progreso es <progreso>

    Examples:
      | cada | unidad | completada          | ahora               | progreso |
      | 4    | horas  | 2026-07-15T08:00:00 | 2026-07-15T09:00:00 | 0.25     |
      | 8    | horas  | 2026-07-31T22:00:00 | 2026-08-01T04:00:00 | 0.75     |
      | 1    | dias   | 2026-07-15T08:00:00 | 2026-07-15T14:00:00 | 0.25     |
      | 2    | dias   | 2026-07-15T08:00:00 | 2026-07-16T08:00:00 | 0.5      |
      | 4    | dias   | 2026-07-15T08:00:00 | 2026-07-18T08:00:00 | 0.75     |

  # Estado de periódica relativa 3
  # Un segundo antes del vencimiento sigue en espera.
  Scenario Outline: Estado de periódica relativa 3
    Given una tarea periódica relativa cada <cada> <unidad>
    And la tarea fue completada el <completada>
    When consulto el estado el <ahora>
    Then el estado es en espera

    Examples:
      | cada | unidad | completada          | ahora               |
      | 4    | horas  | 2026-07-15T08:00:00 | 2026-07-15T11:59:59 |
      | 3    | dias   | 2026-07-15T08:00:00 | 2026-07-18T07:59:59 |

  # Estado de periódica relativa 4
  # V ≤ ahora < V + intervalo: pendiente.
  Scenario Outline: Estado de periódica relativa 4
    Given una tarea periódica relativa cada <cada> <unidad>
    And la tarea fue completada el <completada>
    When consulto el estado el <ahora>
    Then el estado es pendiente

    Examples:
      | cada | unidad | completada          | ahora               |
      | 4    | horas  | 2026-07-15T08:00:00 | 2026-07-15T12:00:00 |
      | 4    | horas  | 2026-07-15T08:00:00 | 2026-07-15T15:59:59 |
      | 3    | dias   | 2026-07-15T08:00:00 | 2026-07-18T08:00:00 |
      | 3    | dias   | 2026-07-15T08:00:00 | 2026-07-21T07:59:59 |
      | 1    | dias   | 2026-07-31T20:00:00 | 2026-08-01T20:00:00 |

  # Estado de periódica relativa 5
  # ahora ≥ V + intervalo (se perdió un ciclo completo): atrasada.
  Scenario Outline: Estado de periódica relativa 5
    Given una tarea periódica relativa cada <cada> <unidad>
    And la tarea fue completada el <completada>
    When consulto el estado el <ahora>
    Then el estado es atrasada

    Examples:
      | cada | unidad | completada          | ahora               |
      | 4    | horas  | 2026-07-15T08:00:00 | 2026-07-15T16:00:00 |
      | 12   | horas  | 2026-12-31T20:00:00 | 2027-01-01T20:00:00 |
      | 3    | dias   | 2026-07-15T08:00:00 | 2026-07-21T08:00:00 |
      | 1    | dias   | 2026-07-15T08:00:00 | 2026-09-01T08:00:00 |

  # Estado de periódica relativa 6
  # Con varios completados, U es el más reciente, sin importar el orden de registro.
  # Con solo el anterior, la tarea estaría atrasada.
  Scenario Outline: Estado de periódica relativa 6
    Given una tarea periódica relativa cada <cada> <unidad>
    And la tarea fue completada el <reciente>
    And la tarea fue completada el <anterior>
    When consulto el estado el <ahora>
    Then el estado es en espera
    And el progreso es <progreso>

    Examples:
      | cada | unidad | reciente            | anterior            | ahora               | progreso |
      | 4    | horas  | 2026-07-15T08:00:00 | 2026-07-14T08:00:00 | 2026-07-15T10:00:00 | 0.5      |
      | 2    | dias   | 2026-07-20T08:00:00 | 2026-07-10T08:00:00 | 2026-07-20T20:00:00 | 0.25     |

  # Estado de periódica relativa 7
  # ahora < U (relojes desfasados: se sincronizó un completado "del futuro"):
  # en espera con progreso 0 hasta que ahora alcance a U.
  Scenario Outline: Estado de periódica relativa 7
    Given una tarea periódica relativa cada <cada> <unidad>
    And la tarea fue completada el <completada>
    When consulto el estado el <ahora>
    Then el estado es en espera
    And el progreso es <progreso>

    Examples:
      | cada | unidad | completada          | ahora               | progreso |
      | 4    | horas  | 2026-07-15T08:00:00 | 2026-07-15T07:00:00 | 0        |
      | 2    | dias   | 2026-07-31T22:00:00 | 2026-07-30T10:00:00 | 0        |
