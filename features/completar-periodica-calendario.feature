# mutation-stamp: sha256=fba917f20a69a5ea4e7924d0bf07d537bdb3236bf6ce6eaa3584679a06a8549d
# acceptance-mutation-manifest-begin
# {"version":1,"tested_at":"2026-11-02T19:38:55.425278409Z","feature_name":"Completar periódica de calendario","feature_path":"features/completar-periodica-calendario.feature","background_hash":"74234e98afe7498fb5daf1f36ac2d78acc339464f950703b8c019892f982b90b","implementation_hash":"sha256:21de9c312c6ab972e5035b16008e499a7b58ff70a53a0005c9a3247b5f8af589","scenarios":[{"index":0,"name":"Completar periódica de calendario 1","scenario_hash":"eb5ba7b75efd92e9aaca106b48bf8a63ad92d0bafe53516b56a3c3ac5b9297e3","mutation_count":30,"result":{"Total":30,"Killed":30,"Survived":0,"Errors":0},"tested_at":"2026-11-02T19:38:55.425278409Z"},{"index":1,"name":"Completar periódica de calendario 2","scenario_hash":"394d5fc5953b6688f8d26a91a10a185b09fd2e0d47d0547732d9f74f6b2a9a02","mutation_count":38,"result":{"Total":38,"Killed":38,"Survived":0,"Errors":0},"tested_at":"2026-11-02T19:38:55.425278409Z"},{"index":2,"name":"Completar periódica de calendario 3","scenario_hash":"d19620968a93e56f3a0bc131a8573de82f24d337128a21fa0d96fbba00d8dbc2","mutation_count":46,"result":{"Total":46,"Killed":46,"Survived":0,"Errors":0},"tested_at":"2026-11-02T19:38:55.425278409Z"},{"index":3,"name":"Completar periódica de calendario 4","scenario_hash":"b9542ac7c1c0402aa1137414edd2c172dd1baac6bad8ab6dda8c1d08243336f9","mutation_count":16,"result":{"Total":16,"Killed":16,"Survived":0,"Errors":0},"tested_at":"2026-11-02T19:38:55.425278409Z"},{"index":4,"name":"Completar periódica de calendario 5","scenario_hash":"d5bf67005a1dafbb052d7e3f26697ba95c68dc026c1aa28c04456c9a23b29e63","mutation_count":36,"result":{"Total":36,"Killed":36,"Survived":0,"Errors":0},"tested_at":"2026-11-02T19:38:55.425278409Z"},{"index":5,"name":"Completar periódica de calendario 6","scenario_hash":"b6996731b4a8b18a6fa1646098c39d6ca7460c5e48888106e7d76244b9cebcd8","mutation_count":32,"result":{"Total":32,"Killed":32,"Survived":0,"Errors":0},"tested_at":"2026-11-02T19:38:55.425278409Z"},{"index":6,"name":"Completar periódica de calendario 7","scenario_hash":"418d308cd8bc20525253f1455d3f919e625b60801293310fbd16795531d9105d","mutation_count":17,"result":{"Total":17,"Killed":17,"Survived":0,"Errors":0},"tested_at":"2026-11-02T19:38:55.425278409Z"}]}
# acceptance-mutation-manifest-end

# Spec §4.4 y §5.3. Completar una periódica de calendario registra un
# Completado con la ocurrencia que cubre (ocurrenciaCubierta, una fecha),
# calculada al completar con P = la mayor ocurrencia cubierta hasta ese
# momento (o el día anterior a creadaEn si nunca se completó) y hoy = la fecha
# local del completado:
#   - si hay ocurrencias en (P, hoy], cubre la más reciente; las anteriores se
#     descartan;
#   - si no hay ninguna, cubre N, la primera ocurrencia posterior a P (la
#     próxima todavía no cubierta): cada completado extra avanza una ocurrencia.
# Después, el estado sigue la §5.3 con el nuevo P. Los completados anteriores
# no se modifican. El progreso es una fracción entre 0 y 1, comparada exactamente.
# Semana de referencia: lunes 2026-07-13 a domingo 2026-07-19.
Feature: Completar periódica de calendario

  # Completar periódica de calendario 1
  # Qué ocurrencia cubre el primer completado. Filas 1 a 4: la tabla
  # "martes y jueves" del spec (martes, lunes antes de tiempo, miércoles con
  # el martes atrasado, viernes con martes y jueves perdidos). Filas 5 y 6:
  # el borde de las 00:00 del jueves.
  Scenario Outline: Completar periódica de calendario 1
    Given una tarea periódica semanal los <dias> creada el <creada>
    When completo la tarea el <completada>
    Then se registró un completado que cubre el <cubierta>

    Examples:
      | dias           | creada              | completada          | cubierta   |
      | martes, jueves | 2026-07-13T08:00:00 | 2026-07-14T10:00:00 | 2026-07-14 |
      | martes, jueves | 2026-07-13T08:00:00 | 2026-07-13T10:00:00 | 2026-07-14 |
      | martes, jueves | 2026-07-13T08:00:00 | 2026-07-15T10:00:00 | 2026-07-14 |
      | martes, jueves | 2026-07-13T08:00:00 | 2026-07-17T10:00:00 | 2026-07-16 |
      | martes, jueves | 2026-07-13T08:00:00 | 2026-07-15T23:59:59 | 2026-07-14 |
      | martes, jueves | 2026-07-13T08:00:00 | 2026-07-16T00:00:00 | 2026-07-16 |
      | domingo        | 2026-07-13T08:00:00 | 2026-07-18T10:00:00 | 2026-07-19 |
      | domingo        | 2026-07-13T08:00:00 | 2026-08-04T10:00:00 | 2026-08-02 |

  # Completar periódica de calendario 2
  # Después de completar, vuelve a pendiente el día de la próxima ocurrencia
  # sin cubrir (columna "Vuelve a pendiente" de la tabla del spec).
  Scenario Outline: Completar periódica de calendario 2
    Given una tarea periódica semanal los <dias> creada el <creada>
    When completo la tarea el <completada>
    And consulto el estado el <vuelve>
    Then el estado es pendiente

    Examples:
      | dias           | creada              | completada          | vuelve              |
      | martes, jueves | 2026-07-13T08:00:00 | 2026-07-14T10:00:00 | 2026-07-16T00:00:00 |
      | martes, jueves | 2026-07-13T08:00:00 | 2026-07-13T10:00:00 | 2026-07-16T00:00:00 |
      | martes, jueves | 2026-07-13T08:00:00 | 2026-07-15T10:00:00 | 2026-07-16T00:00:00 |
      | martes, jueves | 2026-07-13T08:00:00 | 2026-07-17T10:00:00 | 2026-07-21T00:00:00 |
      | martes, jueves | 2026-07-13T08:00:00 | 2026-07-15T23:59:59 | 2026-07-16T00:00:00 |
      | martes, jueves | 2026-07-13T08:00:00 | 2026-07-16T00:00:00 | 2026-07-21T00:00:00 |
      | domingo        | 2026-07-13T08:00:00 | 2026-07-18T10:00:00 | 2026-07-26T00:00:00 |
      | domingo        | 2026-07-13T08:00:00 | 2026-08-04T10:00:00 | 2026-08-09T00:00:00 |

  # Completar periódica de calendario 3
  # Hasta que vuelve, queda en espera con progreso desde el completado, en
  # cualquier estado que estuviera. Fila 2: completada el lunes, el martes ya
  # no está pendiente. Fila 5: en el mismo instante del completado, progreso 0.
  Scenario Outline: Completar periódica de calendario 3
    Given una tarea periódica semanal los <dias> creada el <creada>
    When completo la tarea el <completada>
    And consulto el estado el <ahora>
    Then el estado es en espera
    And el progreso es <progreso>

    Examples:
      | dias           | creada              | completada          | ahora               | progreso |
      | martes, jueves | 2026-07-13T08:00:00 | 2026-07-14T10:00:00 | 2026-07-14T19:30:00 | 0.25     |
      | martes, jueves | 2026-07-13T08:00:00 | 2026-07-13T10:00:00 | 2026-07-14T17:00:00 | 0.5      |
      | martes, jueves | 2026-07-13T08:00:00 | 2026-07-15T10:00:00 | 2026-07-15T20:30:00 | 0.75     |
      | martes, jueves | 2026-07-13T08:00:00 | 2026-07-17T10:00:00 | 2026-07-19T05:00:00 | 0.5      |
      | martes, jueves | 2026-07-13T08:00:00 | 2026-07-14T10:00:00 | 2026-07-14T10:00:00 | 0        |

  # Completar periódica de calendario 4
  # Con un completado anterior, P es lo que ese completado cubrió.
  # Fila 1: secuencia normal. Fila 2: completar dos veces el martes cubre el
  # jueves (no hay ocurrencias sin cubrir en (P, hoy], cubre N). Fila 3:
  # completar dos veces el lunes cubre el martes y después el jueves (fila
  # "lunes, otra vez el lunes" del spec). Fila 4: se perdieron jueves y martes;
  # cubre el martes. Fila 5: completada el lunes (cubre el martes) y otra vez
  # el martes: cubre el jueves.
  Scenario Outline: Completar periódica de calendario 4
    Given una tarea periódica semanal los <dias> creada el <creada>
    And la tarea fue completada el <anterior>
    When completo la tarea el <nuevo>
    Then se registró un completado que cubre el <cubierta>
    And el nuevo completado se agrega sin modificar los anteriores

    Examples:
      | dias           | creada              | anterior            | nuevo               | cubierta   |
      | martes, jueves | 2026-07-13T08:00:00 | 2026-07-14T08:00:00 | 2026-07-16T09:00:00 | 2026-07-16 |
      | martes, jueves | 2026-07-13T08:00:00 | 2026-07-14T08:00:00 | 2026-07-14T20:00:00 | 2026-07-16 |
      | martes, jueves | 2026-07-13T08:00:00 | 2026-07-13T09:00:00 | 2026-07-13T20:00:00 | 2026-07-16 |
      | martes, jueves | 2026-07-13T08:00:00 | 2026-07-14T08:00:00 | 2026-07-22T09:00:00 | 2026-07-21 |
      | martes, jueves | 2026-07-13T08:00:00 | 2026-07-13T09:00:00 | 2026-07-14T09:00:00 | 2026-07-16 |

  # Completar periódica de calendario 5
  # Mensual: qué ocurrencia cubre el primer completado, incluidos los días que
  # no existen en un mes más corto (caen en el último día de ese mes).
  Scenario Outline: Completar periódica de calendario 5
    Given una tarea periódica mensual los días <dias> creada el <creada>
    When completo la tarea el <completada>
    Then se registró un completado que cubre el <cubierta>

    Examples:
      | dias   | creada              | completada          | cubierta   |
      | 15     | 2026-07-01T08:00:00 | 2026-07-15T10:00:00 | 2026-07-15 |
      | 15     | 2026-07-01T08:00:00 | 2026-07-10T10:00:00 | 2026-07-15 |
      | 1, 15  | 2026-07-02T08:00:00 | 2026-07-20T10:00:00 | 2026-07-15 |
      | 1, 15  | 2026-06-02T08:00:00 | 2026-07-10T10:00:00 | 2026-07-01 |
      | 31     | 2026-06-01T08:00:00 | 2026-06-30T10:00:00 | 2026-06-30 |
      | 31     | 2026-06-01T08:00:00 | 2026-06-20T10:00:00 | 2026-06-30 |
      | 31     | 2026-06-01T08:00:00 | 2026-07-01T10:00:00 | 2026-06-30 |
      | 30, 31 | 2026-06-01T08:00:00 | 2026-06-30T10:00:00 | 2026-06-30 |
      | 31     | 2026-02-01T08:00:00 | 2026-02-28T10:00:00 | 2026-02-28 |
      | 29     | 2026-02-01T08:00:00 | 2026-02-20T10:00:00 | 2026-02-28 |
      | 29     | 2028-02-01T08:00:00 | 2028-02-29T10:00:00 | 2028-02-29 |
      | 31     | 2026-07-01T08:00:00 | 2026-08-02T10:00:00 | 2026-07-31 |

  # Completar periódica de calendario 6
  # Mensual: después de completar, vuelve a pendiente el día de la próxima
  # ocurrencia sin cubrir.
  Scenario Outline: Completar periódica de calendario 6
    Given una tarea periódica mensual los días <dias> creada el <creada>
    When completo la tarea el <completada>
    And consulto el estado el <vuelve>
    Then el estado es pendiente

    Examples:
      | dias   | creada              | completada          | vuelve              |
      | 15     | 2026-07-01T08:00:00 | 2026-07-15T10:00:00 | 2026-08-15T00:00:00 |
      | 15     | 2026-07-01T08:00:00 | 2026-07-10T10:00:00 | 2026-08-15T00:00:00 |
      | 1, 15  | 2026-07-02T08:00:00 | 2026-07-20T10:00:00 | 2026-08-01T00:00:00 |
      | 31     | 2026-06-01T08:00:00 | 2026-06-30T10:00:00 | 2026-07-31T00:00:00 |
      | 30, 31 | 2026-06-01T08:00:00 | 2026-06-30T10:00:00 | 2026-07-30T00:00:00 |
      | 31     | 2026-02-01T08:00:00 | 2026-02-28T10:00:00 | 2026-03-31T00:00:00 |
      | 29     | 2028-02-01T08:00:00 | 2028-02-29T10:00:00 | 2028-03-29T00:00:00 |
      | 31     | 2026-07-01T08:00:00 | 2026-08-02T10:00:00 | 2026-08-31T00:00:00 |

  # Completar periódica de calendario 7
  # Con un completado anterior, vuelve a pendiente el día de la primera
  # ocurrencia sin cubrir. Filas 2 y 3: completar dos veces el lunes o dos
  # veces el martes cubre martes y jueves; vuelve el martes siguiente.
  Scenario Outline: Completar periódica de calendario 7
    Given una tarea periódica semanal los <dias> creada el <creada>
    And la tarea fue completada el <anterior>
    When completo la tarea el <nuevo>
    And consulto el estado el <vuelve>
    Then el estado es pendiente

    Examples:
      | dias           | creada              | anterior            | nuevo               | vuelve              |
      | martes, jueves | 2026-07-13T08:00:00 | 2026-07-14T08:00:00 | 2026-07-16T09:00:00 | 2026-07-21T00:00:00 |
      | martes, jueves | 2026-07-13T08:00:00 | 2026-07-13T09:00:00 | 2026-07-13T20:00:00 | 2026-07-21T00:00:00 |
      | martes, jueves | 2026-07-13T08:00:00 | 2026-07-14T08:00:00 | 2026-07-14T20:00:00 | 2026-07-21T00:00:00 |
      | martes, jueves | 2026-07-13T08:00:00 | 2026-07-14T08:00:00 | 2026-07-22T09:00:00 | 2026-07-23T00:00:00 |
