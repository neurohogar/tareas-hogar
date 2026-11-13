# mutation-stamp: sha256=e0a71b043cd4c0a46ec8876407382c21ebe66a0e6cf975e90ac464d2c2c726ed
# acceptance-mutation-manifest-begin
# {"version":1,"tested_at":"2026-11-13T22:11:25.445844371Z","feature_name":"Filtro por etiqueta","feature_path":"features/filtro-por-etiqueta.feature","background_hash":"74234e98afe7498fb5daf1f36ac2d78acc339464f950703b8c019892f982b90b","implementation_hash":"sha256:d6a8ecc19596bbecd33ae677630c23fb27821ff389d1e879b3b30016b7a10eb3","scenarios":[{"index":0,"name":"Filtro por etiqueta 1","scenario_hash":"2b3f157451311f0379ef555842f86620e7350973f93557b445be42211fdb4e77","mutation_count":53,"result":{"Total":53,"Killed":53,"Survived":0,"Errors":0},"tested_at":"2026-11-13T22:11:25.445844371Z"},{"index":1,"name":"Filtro por etiqueta 2","scenario_hash":"b6cdb5e67f08fadc016feca7daae169de8a277d496317b47278e8ed346954cbf","mutation_count":5,"result":{"Total":5,"Killed":5,"Survived":0,"Errors":0},"tested_at":"2026-11-13T22:11:25.445844371Z"},{"index":2,"name":"Filtro por etiqueta 3","scenario_hash":"41bbefd40c1a304802c7d033883477ea217c9bf71ebec23a2c99b129041c8784","mutation_count":3,"result":{"Total":3,"Killed":3,"Survived":0,"Errors":0},"tested_at":"2026-11-13T22:11:25.445844371Z"},{"index":3,"name":"Filtro por etiqueta 4","scenario_hash":"1f476ac91179350367266ce142e52bbabb85c03b5c04421d5d9b063f4061d305","mutation_count":1,"result":{"Total":1,"Killed":1,"Survived":0,"Errors":0},"tested_at":"2026-11-13T22:11:25.445844371Z"},{"index":4,"name":"Filtro por etiqueta 5","scenario_hash":"9cf10203c2e8d02a5033a2c3d89eec1f41759571af498b997394d6d079733a7c","mutation_count":16,"result":{"Total":16,"Killed":16,"Survived":0,"Errors":0},"tested_at":"2026-11-13T22:11:25.445844371Z"},{"index":5,"name":"Filtro por etiqueta 6","scenario_hash":"5485054b97198033ae1d1fafc057db8be00fcd819631381e5fbfa8fb96d1c6f7","mutation_count":6,"result":{"Total":6,"Killed":6,"Survived":0,"Errors":0},"tested_at":"2026-11-13T22:11:25.445844371Z"}]}
# acceptance-mutation-manifest-end

# Spec §6.1 (Filtro por etiqueta). Arriba de Pendientes hay chips: "Todas" y
# uno por cada etiqueta (tenga o no tareas pendientes), en orden alfabético.
# Se elige uno solo a la vez. "Todas" muestra la lista entera; una etiqueta
# muestra solo las tareas que la tienen, en el mismo orden por urgencia.
# Sin etiquetas no se muestra la fila de chips. Si la etiqueta elegida se
# borra, el filtro vuelve a "Todas"; si se renombra, sigue elegida.
# Que el filtro se mantenga al cambiar de pantalla y vuelva a "Todas" al
# recargar se verifica en la suite QA.
# "existen las etiquetas" da "<nombre>:<color>" separados por ", ". "el
# filtro ofrece" da los chips en orden, separados por ", ". "Pendientes
# muestra en orden" da los títulos de arriba hacia abajo y la lista no tiene
# otras filas. Las tareas se crearon antes de cualquier otra fecha del
# escenario, en el orden declarado.
# Semana de referencia: lunes 2026-07-13 a domingo 2026-07-19.
Feature: Filtro por etiqueta

  # Filtro por etiqueta 1
  # Una etiqueta muestra solo sus tareas, en el orden por urgencia de la
  # lista entera; "Todas" muestra todas. Una tarea con dos etiquetas aparece
  # en los dos filtros. Filas 1–3: Pagar atrasada, Basura pendiente desde
  # las 00:00, Regar pendiente desde las 11:00. Filas 4–5: Basura atrasada,
  # Regar pendiente desde las 08:00, Pagar pendiente desde el 20.
  Scenario Outline: Filtro por etiqueta 1
    Given una tarea puntual Pagar con fecha límite <limite>
    And una tarea periódica semanal Basura los <dias>
    And la tarea Basura tiene un completado que cubre el <cubierta>
    And una tarea periódica relativa Regar cada <cada> <unidad>
    And la tarea Regar fue completada el <completada>
    And existen las etiquetas <existentes>
    And la tarea Pagar tiene las etiquetas <etiquetas_pagar>
    And la tarea Regar tiene las etiquetas <etiquetas_regar>
    And la tarea Basura tiene las etiquetas <etiquetas_basura>
    And elegí el filtro <filtro>
    When consulto Pendientes el <ahora>
    Then Pendientes muestra en orden <orden>

    Examples:
      | limite     | dias           | cubierta   | cada | unidad | completada          | existentes             | etiquetas_pagar | etiquetas_regar | etiquetas_basura | filtro | ahora               | orden                |
      | 2026-07-14 | miércoles      | 2026-07-08 | 4    | horas  | 2026-07-15T07:00:00 | Cocina:rojo, Baño:gris | Cocina, Baño    | Cocina          | Baño             | Todas  | 2026-07-15T12:00:00 | Pagar, Basura, Regar |
      | 2026-07-14 | miércoles      | 2026-07-08 | 4    | horas  | 2026-07-15T07:00:00 | Cocina:rojo, Baño:gris | Cocina, Baño    | Cocina          | Baño             | Cocina | 2026-07-15T12:00:00 | Pagar, Regar         |
      | 2026-07-14 | miércoles      | 2026-07-08 | 4    | horas  | 2026-07-15T07:00:00 | Cocina:rojo, Baño:gris | Cocina, Baño    | Cocina          | Baño             | Baño   | 2026-07-15T12:00:00 | Pagar, Basura        |
      | 2026-07-20 | lunes, jueves  | 2026-07-09 | 1    | dias   | 2026-07-14T08:00:00 | Cocina:rojo, Baño:gris | Cocina          | Baño            | Cocina, Baño     | Cocina | 2026-07-15T12:00:00 | Basura, Pagar        |
      | 2026-07-20 | lunes, jueves  | 2026-07-09 | 1    | dias   | 2026-07-14T08:00:00 | Cocina:rojo, Baño:gris | Cocina          | Baño            | Cocina, Baño     | Baño   | 2026-07-15T12:00:00 | Basura, Regar        |

  # Filtro por etiqueta 2
  # Una etiqueta sin tareas pendientes sigue en el filtro y, elegida, deja
  # la lista vacía. Pagar está completada y no aparece en Pendientes.
  Scenario Outline: Filtro por etiqueta 2
    Given una tarea puntual Pagar sin fecha límite
    And la tarea Pagar fue completada el <completada>
    And una tarea periódica relativa Regar nunca completada
    And existen las etiquetas <existentes>
    And la tarea Pagar tiene las etiquetas <etiquetas_pagar>
    And la tarea Regar tiene las etiquetas <etiquetas_regar>
    And elegí el filtro <filtro>
    When consulto Pendientes en cualquier momento
    Then el filtro ofrece <chips_filtro>
    And Pendientes no muestra ninguna tarea

    Examples:
      | completada          | existentes             | etiquetas_pagar | etiquetas_regar | filtro | chips_filtro        |
      | 2026-07-14T10:00:00 | Cocina:rojo, Baño:gris | Cocina          | Baño            | Cocina | Todas, Baño, Cocina |

  # Filtro por etiqueta 3
  # Una etiqueta que ninguna tarea usa también tiene su chip.
  Scenario Outline: Filtro por etiqueta 3
    Given una tarea puntual Pagar sin fecha límite
    And existen las etiquetas <existentes>
    When consulto Pendientes en cualquier momento
    Then el filtro ofrece <chips_filtro>
    And Pendientes muestra en orden <orden>

    Examples:
      | existentes  | chips_filtro  | orden |
      | Cocina:rojo | Todas, Cocina | Pagar |

  # Filtro por etiqueta 4
  # Sin etiquetas no se muestra la fila de chips del filtro.
  Scenario Outline: Filtro por etiqueta 4
    Given una tarea puntual Pagar sin fecha límite
    When consulto Pendientes en cualquier momento
    Then el filtro no se muestra
    And Pendientes muestra en orden <orden>

    Examples:
      | orden |
      | Pagar |

  # Filtro por etiqueta 5
  # Borrar la etiqueta elegida devuelve el filtro a "Todas" (fila 1). Borrar
  # otra etiqueta no cambia el filtro (fila 2).
  Scenario Outline: Filtro por etiqueta 5
    Given una tarea puntual Pagar sin fecha límite
    And una tarea periódica relativa Regar nunca completada
    And existen las etiquetas <existentes>
    And la tarea Pagar tiene las etiquetas <etiquetas_pagar>
    And la tarea Regar tiene las etiquetas <etiquetas_regar>
    And elegí el filtro <filtro>
    When borro la etiqueta <borrada>
    And consulto Pendientes en cualquier momento
    Then el filtro elegido es <filtro_elegido>
    And el filtro ofrece <chips_filtro>
    And Pendientes muestra en orden <orden>

    Examples:
      | existentes             | etiquetas_pagar | etiquetas_regar | filtro | borrada | filtro_elegido | chips_filtro  | orden        |
      | Cocina:rojo, Baño:gris | Cocina          | Baño            | Cocina | Cocina  | Todas          | Todas, Baño   | Regar, Pagar |
      | Cocina:rojo, Baño:gris | Cocina          | Baño            | Cocina | Baño    | Cocina         | Todas, Cocina | Pagar        |

  # Filtro por etiqueta 6
  # Renombrar la etiqueta elegida no cambia el filtro: sigue elegida con el
  # nombre nuevo.
  Scenario Outline: Filtro por etiqueta 6
    Given una tarea puntual Pagar sin fecha límite
    And una tarea periódica relativa Regar nunca completada
    And existen las etiquetas <existentes>
    And la tarea Pagar tiene las etiquetas <etiquetas_pagar>
    And elegí el filtro <filtro>
    When renombro la etiqueta <filtro> a <nombre_nuevo>
    And consulto Pendientes en cualquier momento
    Then el filtro elegido es <filtro_elegido>
    And Pendientes muestra en orden <orden>

    Examples:
      | existentes  | etiquetas_pagar | filtro | nombre_nuevo | filtro_elegido | orden |
      | Cocina:rojo | Cocina          | Cocina | Comida       | Comida         | Pagar |
