# mutation-stamp: sha256=2d5ab7e5a373f4dad50e334d8773def1c0e56147d635fc025a6c472179690e56
# acceptance-mutation-manifest-begin
# {"version":1,"tested_at":"2026-11-02T23:07:50.623231094Z","feature_name":"Mostrar completadas","feature_path":"features/mostrar-completadas.feature","background_hash":"74234e98afe7498fb5daf1f36ac2d78acc339464f950703b8c019892f982b90b","implementation_hash":"sha256:5a22883a4ef18e07c71213471aaac38eb65e7428cfb93a70cfd1447c0cc232cc","scenarios":[{"index":0,"name":"Mostrar completadas 1","scenario_hash":"d35ca2a6b85477766511a209053b2f8a47381f3cfaff9e605d334712fe762d71","mutation_count":20,"result":{"Total":20,"Killed":20,"Survived":0,"Errors":0},"tested_at":"2026-11-02T23:07:50.623231094Z"},{"index":1,"name":"Mostrar completadas 2","scenario_hash":"a4f564147db49eb954c0139951a9f3d81fa49cb088647709e9cc72cf035faa80","mutation_count":34,"result":{"Total":34,"Killed":34,"Survived":0,"Errors":0},"tested_at":"2026-11-02T23:07:50.623231094Z"},{"index":2,"name":"Mostrar completadas 3","scenario_hash":"6cf302900170cfa16f17433caa258af822e31dd05d0db2328f1952b701032238","mutation_count":8,"result":{"Total":8,"Killed":8,"Survived":0,"Errors":0},"tested_at":"2026-11-02T23:07:50.623231094Z"},{"index":3,"name":"Mostrar completadas 4","scenario_hash":"46121f1cb6e17b9d6b9ce7a32b3bd9dd8ce3e23d21fe5854ffba75cafdcf5766","mutation_count":25,"result":{"Total":25,"Killed":25,"Survived":0,"Errors":0},"tested_at":"2026-11-02T23:07:50.623231094Z"},{"index":4,"name":"Mostrar completadas 5","scenario_hash":"191ca24d91fef5437a5e150f393710fd8eed96e61c60f9095979cb167add4a62","mutation_count":24,"result":{"Total":24,"Killed":24,"Survived":0,"Errors":0},"tested_at":"2026-11-02T23:07:50.623231094Z"},{"index":5,"name":"Mostrar completadas 6","scenario_hash":"36fec9b64ba3ebd4932b52741915ed1495a199bb1456792b212dcd7ba014adb0","mutation_count":3,"result":{"Total":3,"Killed":3,"Survived":0,"Errors":0},"tested_at":"2026-11-02T23:07:50.623231094Z"},{"index":6,"name":"Mostrar completadas 7","scenario_hash":"7060b719419bdcdfa13dd04885f9f4abae53debe470e2f59ebfcf6b94533b2fc","mutation_count":4,"result":{"Total":4,"Killed":4,"Survived":0,"Errors":0},"tested_at":"2026-11-02T23:07:50.623231094Z"}]}
# acceptance-mutation-manifest-end

# Spec §6.1 (Mostrar completadas), con §5.1–§5.3. Una tarea está completada
# si es puntual con al menos un completado, o periódica en espera con al
# menos un completado. Una periódica de calendario en espera sin completados
# (antes de su primera ocurrencia) no está completada; una periódica
# pendiente o atrasada tampoco, aunque tenga completados.
#   Apagado (valor inicial): Pendientes muestra solo las no completadas.
#   Encendido: después de las no completadas (en el orden por urgencia) van
#     las completadas, de completadoEn más reciente a más antiguo; si
#     empatan, creadaEn más antigua primero, después título en orden
#     alfabético en español, después id (no observable).
#   El filtro por etiqueta aplica también a las completadas.
# Que el valor se guarde en el dispositivo y sobreviva a recargar, y el
# contraste (negrita contra tachado y atenuado), se verifican en la suite QA.
# Cada tarea se nombra por su título (una palabra). "Pendientes muestra en
# orden" da los títulos de arriba hacia abajo y la lista no tiene otras
# filas. "Pendientes muestra como completadas" da, en orden, los títulos de
# las filas que se ven completadas; las demás filas se ven no completadas.
# Cuando el paso no da creadaEn, la tarea se creó antes de cualquier otra
# fecha del escenario; las que no dan creadaEn se crearon en el orden
# declarado. Sin el paso "Mostrar completadas está encendido", el check está
# en su valor inicial.
# Semana de referencia: lunes 2026-07-13 a domingo 2026-07-19.
Feature: Mostrar completadas

  # Mostrar completadas 1
  # Apagado (valor inicial): no se ven la puntual completada ni las
  # periódicas en espera con completados (fila 1, también con un completado
  # "del futuro" en la fila 3). Sí se ven las periódicas pendientes o
  # atrasadas con completados (filas 2 y 3) y la semanal en espera que
  # todavía no tuvo su primera ocurrencia (fila 1).
  Scenario Outline: Mostrar completadas 1
    Given una tarea puntual Pagar sin fecha límite
    And la tarea Pagar tiene un completado
    And una tarea periódica relativa Regar cada <cada> <unidad>
    And la tarea Regar fue completada el <completada>
    And una tarea periódica semanal Basura los <dias>
    And la tarea Basura tiene un completado que cubre el <cubierta>
    And una tarea periódica semanal Sábanas los <dias_sabanas> creada el <creada_sabanas>
    When consulto Pendientes el <ahora>
    Then Pendientes muestra en orden <orden>

    Examples:
      | cada | unidad | completada          | dias           | cubierta   | dias_sabanas | creada_sabanas      | ahora               | orden                  |
      | 1    | dias   | 2026-07-15T08:00:00 | martes, jueves | 2026-07-14 | sábado       | 2026-07-15T08:00:00 | 2026-07-15T12:00:00 | Sábanas                |
      | 4    | horas  | 2026-07-15T07:00:00 | miércoles      | 2026-07-08 | jueves       | 2026-07-15T08:00:00 | 2026-07-15T12:00:00 | Basura, Regar, Sábanas |
      | 4    | horas  | 2026-07-15T21:00:00 | lunes          | 2026-07-06 | miércoles    | 2026-07-15T08:00:00 | 2026-07-15T12:00:00 | Basura, Sábanas        |

  # Mostrar completadas 2
  # Encendido: primero las no completadas en su orden por urgencia; después
  # las completadas, de completadoEn más reciente a más antiguo, sin importar
  # el tipo. Fila 3: Regar tiene un completado pero está pendiente, así que
  # va con las no completadas. Fila 4: un completado "del futuro" (relojes
  # desfasados) es el más reciente.
  Scenario Outline: Mostrar completadas 2
    Given Mostrar completadas está encendido
    And una tarea puntual Foco sin fecha límite
    And una tarea puntual Pagar sin fecha límite
    And la tarea Pagar fue completada el <completada_pagar>
    And una tarea periódica relativa Regar cada <cada> <unidad>
    And la tarea Regar fue completada el <completada_regar>
    And una tarea periódica semanal Basura los <dias>
    And la tarea Basura tiene un completado del <completada_basura> que cubre el <cubierta>
    When consulto Pendientes el <ahora>
    Then Pendientes muestra en orden <orden>
    And Pendientes muestra como completadas <completadas>

    Examples:
      | completada_pagar    | cada | unidad | completada_regar    | dias           | completada_basura   | cubierta   | ahora               | orden                       | completadas                 |
      | 2026-07-15T09:00:00 | 1    | dias   | 2026-07-15T08:00:00 | martes, jueves | 2026-07-14T10:00:00 | 2026-07-14 | 2026-07-15T12:00:00 | Foco, Pagar, Regar, Basura  | Pagar, Regar, Basura        |
      | 2026-07-13T09:00:00 | 1    | dias   | 2026-07-15T10:00:00 | martes, jueves | 2026-07-15T11:00:00 | 2026-07-16 | 2026-07-15T12:00:00 | Foco, Basura, Regar, Pagar  | Basura, Regar, Pagar        |
      | 2026-07-14T09:00:00 | 4    | horas  | 2026-07-15T07:00:00 | martes, jueves | 2026-07-15T11:00:00 | 2026-07-16 | 2026-07-15T12:00:00 | Regar, Foco, Basura, Pagar  | Basura, Pagar               |
      | 2026-07-15T11:30:00 | 4    | horas  | 2026-07-15T21:00:00 | martes, jueves | 2026-07-15T11:00:00 | 2026-07-16 | 2026-07-15T12:00:00 | Foco, Regar, Pagar, Basura  | Regar, Pagar, Basura        |

  # Mostrar completadas 3
  # Encendido: una semanal en espera sin completados (antes de su primera
  # ocurrencia) no está completada; va con las no completadas, en el grupo en
  # espera, antes de las completadas (fila 1). Creada en un día de
  # ocurrencia, está pendiente (fila 2).
  Scenario Outline: Mostrar completadas 3
    Given Mostrar completadas está encendido
    And una tarea puntual Foco sin fecha límite
    And una tarea puntual Pagar sin fecha límite
    And la tarea Pagar tiene un completado
    And una tarea periódica semanal Sábanas los <dias_sabanas> creada el <creada_sabanas>
    When consulto Pendientes el <ahora>
    Then Pendientes muestra en orden <orden>
    And Pendientes muestra como completadas <completadas>

    Examples:
      | dias_sabanas | creada_sabanas      | ahora               | orden                | completadas |
      | sábado       | 2026-07-15T08:00:00 | 2026-07-15T12:00:00 | Foco, Sábanas, Pagar | Pagar       |
      | miércoles    | 2026-07-15T08:00:00 | 2026-07-15T12:00:00 | Sábanas, Foco, Pagar | Pagar       |

  # Mostrar completadas 4
  # Encendido, completadas con el mismo completadoEn: primero la de creadaEn
  # más antigua (filas 1 y 2); con la misma creadaEn, por título en orden
  # alfabético en español (fila 3).
  Scenario Outline: Mostrar completadas 4
    Given Mostrar completadas está encendido
    And una tarea puntual Planchar sin fecha límite creada el <creada_planchar>
    And la tarea Planchar fue completada el <completada_planchar>
    And una tarea puntual Barrer sin fecha límite creada el <creada_barrer>
    And la tarea Barrer fue completada el <completada_barrer>
    When consulto Pendientes en cualquier momento
    Then Pendientes muestra en orden <orden>

    Examples:
      | creada_planchar     | completada_planchar | creada_barrer       | completada_barrer   | orden            |
      | 2026-07-10T08:00:00 | 2026-07-15T08:00:00 | 2026-07-10T08:00:01 | 2026-07-15T08:00:00 | Planchar, Barrer |
      | 2026-07-10T08:00:01 | 2026-07-15T08:00:00 | 2026-07-10T08:00:00 | 2026-07-15T08:00:00 | Barrer, Planchar |
      | 2026-07-10T08:00:00 | 2026-07-15T08:00:00 | 2026-07-10T08:00:00 | 2026-07-15T08:00:00 | Barrer, Planchar |

  # Mostrar completadas 5
  # Encendido: el filtro por etiqueta aplica también a las completadas. Pagar
  # (completada) y Foco tienen Cocina; Regar (completada, en espera) tiene
  # Baño.
  Scenario Outline: Mostrar completadas 5
    Given Mostrar completadas está encendido
    And una tarea puntual Foco sin fecha límite
    And una tarea puntual Pagar sin fecha límite
    And la tarea Pagar fue completada el <completada_pagar>
    And una tarea periódica relativa Regar cada <cada> <unidad>
    And la tarea Regar fue completada el <completada_regar>
    And existen las etiquetas <existentes>
    And la tarea Pagar tiene las etiquetas <etiquetas_pagar>
    And la tarea Regar tiene las etiquetas <etiquetas_regar>
    And la tarea Foco tiene las etiquetas <etiquetas_foco>
    And elegí el filtro <filtro>
    When consulto Pendientes el <ahora>
    Then Pendientes muestra en orden <orden>

    Examples:
      | completada_pagar    | cada | unidad | completada_regar    | existentes             | etiquetas_pagar | etiquetas_regar | etiquetas_foco | filtro | ahora               | orden              |
      | 2026-07-15T09:00:00 | 2    | dias   | 2026-07-15T08:00:00 | Cocina:rojo, Baño:gris | Cocina          | Baño            | Cocina         | Todas  | 2026-07-15T12:00:00 | Foco, Pagar, Regar |
      | 2026-07-15T09:00:00 | 2    | dias   | 2026-07-15T08:00:00 | Cocina:rojo, Baño:gris | Cocina          | Baño            | Cocina         | Cocina | 2026-07-15T12:00:00 | Foco, Pagar        |
      | 2026-07-15T09:00:00 | 2    | dias   | 2026-07-15T08:00:00 | Cocina:rojo, Baño:gris | Cocina          | Baño            | Cocina         | Baño   | 2026-07-15T12:00:00 | Regar              |

  # Mostrar completadas 6
  # Apagado: al completar una tarea, su fila desaparece de Pendientes.
  Scenario Outline: Mostrar completadas 6
    Given una tarea puntual Foco sin fecha límite
    And una tarea periódica relativa Regar nunca completada
    When completo la tarea Regar el <completada>
    And consulto Pendientes el <ahora>
    Then Pendientes muestra en orden <orden>

    Examples:
      | completada          | ahora               | orden |
      | 2026-07-15T08:00:00 | 2026-07-15T08:00:01 | Foco  |

  # Mostrar completadas 7
  # Encendido: al completar una tarea, pasa a las completadas, al final.
  Scenario Outline: Mostrar completadas 7
    Given Mostrar completadas está encendido
    And una tarea puntual Foco sin fecha límite
    And una tarea periódica relativa Regar nunca completada
    When completo la tarea Regar el <completada>
    And consulto Pendientes el <ahora>
    Then Pendientes muestra en orden <orden>
    And Pendientes muestra como completadas <completadas>

    Examples:
      | completada          | ahora               | orden       | completadas |
      | 2026-07-15T08:00:00 | 2026-07-15T08:00:01 | Foco, Regar | Regar       |
