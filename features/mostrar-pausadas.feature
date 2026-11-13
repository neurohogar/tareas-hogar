# mutation-stamp: sha256=ec98682b643dbe5e472c2b883a6c7398819bf27f748d14da2ba1619d1cdf4577
# acceptance-mutation-manifest-begin
# {"version":1,"tested_at":"2026-11-13T22:15:56.492041561Z","feature_name":"Mostrar pausadas","feature_path":"features/mostrar-pausadas.feature","background_hash":"74234e98afe7498fb5daf1f36ac2d78acc339464f950703b8c019892f982b90b","implementation_hash":"sha256:58598ef63df383c1746780e0a3bc9c217f64c0148a238a938b418f40c400a696","scenarios":[{"index":0,"name":"Mostrar pausadas 1","scenario_hash":"f815d48218aab240c420fe852dfcb77cc8ccffb4adb8680faec46264760dd185","mutation_count":3,"result":{"Total":3,"Killed":3,"Survived":0,"Errors":0},"tested_at":"2026-11-13T22:15:56.492041561Z"},{"index":1,"name":"Mostrar pausadas 2","scenario_hash":"dae650280283b75deb87596a31d5b398d609a48e15a14df4fe2234f5ee5b5ea1","mutation_count":4,"result":{"Total":4,"Killed":4,"Survived":0,"Errors":0},"tested_at":"2026-11-13T22:15:56.492041561Z"},{"index":2,"name":"Mostrar pausadas 3","scenario_hash":"dfe97aa6c417564265be5b47e10c7fef4046b8168f6abfd4dbf0252e554985df","mutation_count":4,"result":{"Total":4,"Killed":4,"Survived":0,"Errors":0},"tested_at":"2026-11-13T22:15:56.492041561Z"},{"index":3,"name":"Mostrar pausadas 4","scenario_hash":"17b69a445923baf43f5a7128f1a0ae4aaad6226166652c47dae90a33e17c39fd","mutation_count":4,"result":{"Total":4,"Killed":4,"Survived":0,"Errors":0},"tested_at":"2026-11-13T22:15:56.492041561Z"},{"index":4,"name":"Mostrar pausadas 5","scenario_hash":"39efc07da180485f6c3633bb467e57e9917c27bc4d837532b38b4462a92fdc82","mutation_count":12,"result":{"Total":12,"Killed":12,"Survived":0,"Errors":0},"tested_at":"2026-11-13T22:15:56.492041561Z"},{"index":5,"name":"Mostrar pausadas 6","scenario_hash":"7c36d00fbb1cf7e01a06d4f2bf3deb518e7a0b9692860bb72feb47fd65070c40","mutation_count":15,"result":{"Total":15,"Killed":15,"Survived":0,"Errors":0},"tested_at":"2026-11-13T22:15:56.492041561Z"},{"index":6,"name":"Mostrar pausadas 7","scenario_hash":"c9e77b173b85dac56846987ce70d9d512214614ac12aeb7c87f4e1c088ca2dd9","mutation_count":1,"result":{"Total":1,"Killed":1,"Survived":0,"Errors":0},"tested_at":"2026-11-13T22:15:56.492041561Z"},{"index":7,"name":"Mostrar pausadas 8","scenario_hash":"17f5f21cb08792359930b692a89a609a4c4dbe3f78ae169d914fe1c12927f409","mutation_count":2,"result":{"Total":2,"Killed":2,"Survived":0,"Errors":0},"tested_at":"2026-11-13T22:15:56.492041561Z"},{"index":8,"name":"Mostrar pausadas 9","scenario_hash":"e28993471f59ce5fad0f638fe58d2725b42dbccaf9b61350bc5a9aed0bbc10fe","mutation_count":1,"result":{"Total":1,"Killed":1,"Survived":0,"Errors":0},"tested_at":"2026-11-13T22:15:56.492041561Z"}]}
# acceptance-mutation-manifest-end

# Spec §6.1 (Mostrar pausadas), con §5.8 y Mostrar completadas.
#   Apagado (valor inicial): las pausadas no se ven en Pendientes.
#   Encendido: van al final de la lista (después de las completadas, si se
#     muestran), por título en orden alfabético en español (sin distinguir
#     mayúsculas ni acentos, ñ después de n), sin importar su urgencia ni
#     su creadaEn.
#   Una pausada no está completada: no va con las completadas.
#   El filtro por etiqueta aplica también a las pausadas.
# Que el valor se guarde en el dispositivo y sobreviva a recargar, y la
# fila atenuada con "Pausada" en lugar del indicador de estado, se
# verifican en la suite QA.
# Cada tarea se nombra por su título (una palabra). "Pendientes muestra en
# orden" da los títulos de arriba hacia abajo y la lista no tiene otras
# filas. "Pendientes muestra como pausadas" da, en orden, los títulos de las
# filas que se ven pausadas (checkbox deshabilitado, sin estado); las demás
# filas no se ven pausadas. "Pendientes muestra como completadas", igual con
# las completadas. Cuando el paso no da creadaEn, la tarea se creó antes de
# cualquier otra fecha del escenario, en el orden declarado. "la tarea X fue
# pausada" es una tarea ya pausada antes de cualquier otra fecha del
# escenario; "pauso la tarea X" toca Pausar en su panel. Sin el paso
# "Mostrar pausadas está encendido" (o "Mostrar completadas está
# encendido"), el check está en su valor inicial.
# Semana de referencia: lunes 2026-07-13 a domingo 2026-07-19.
Feature: Mostrar pausadas

  # Mostrar pausadas 1
  # Apagado (valor inicial): las pausadas no se ven, aunque sin pausa
  # estarían atrasadas.
  Scenario Outline: Mostrar pausadas 1
    Given una tarea puntual Foco sin fecha límite
    And una tarea periódica relativa Regar cada <cada> <unidad>
    And la tarea Regar fue completada el <completada>
    And la tarea Regar fue pausada
    And una tarea periódica semanal Basura los <dias> creada el <creada_basura>
    And la tarea Basura fue pausada
    When consulto Pendientes el <ahora>
    Then Pendientes muestra en orden <orden>

    Examples:
      | cada | unidad | completada          | dias   | creada_basura       | ahora               | orden |
      | 2    | dias   | 2026-07-01T09:00:00 | martes | 2026-07-01T08:00:00 | 2026-07-15T12:00:00 | Foco  |

  # Mostrar pausadas 2
  # Encendido: las pausadas van al final, por título y no por urgencia
  # (sin pausa, Regar iría primero: atrasada desde el 5, Basura desde el 8).
  Scenario Outline: Mostrar pausadas 2
    Given Mostrar pausadas está encendido
    And una tarea puntual Foco sin fecha límite
    And una tarea puntual Pagar con fecha límite <limite>
    And una tarea periódica relativa Regar cada <cada> <unidad>
    And la tarea Regar fue completada el <completada>
    And la tarea Regar fue pausada
    And una tarea periódica semanal Basura los <dias> creada el <creada_basura>
    And la tarea Basura fue pausada
    When consulto Pendientes el <ahora>
    Then Pendientes muestra en orden <orden>
    And Pendientes muestra como pausadas <pausadas>

    Examples:
      | limite     | cada | unidad | completada          | dias   | creada_basura       | ahora               | orden                      | pausadas      |
      | 2026-07-14 | 2    | dias   | 2026-07-01T09:00:00 | martes | 2026-07-01T08:00:00 | 2026-07-15T12:00:00 | Pagar, Foco, Basura, Regar | Basura, Regar |

  # Mostrar pausadas 3
  # Con Mostrar completadas encendido y Mostrar pausadas apagado: una
  # pausada con un completado reciente no se ve (no está completada).
  Scenario Outline: Mostrar pausadas 3
    Given Mostrar completadas está encendido
    And una tarea puntual Foco sin fecha límite
    And una tarea puntual Pagar sin fecha límite
    And la tarea Pagar fue completada el <completada_pagar>
    And una tarea periódica relativa Barrer cada <cada> <unidad>
    And la tarea Barrer fue completada el <completada_barrer>
    And la tarea Barrer fue pausada
    When consulto Pendientes el <ahora>
    Then Pendientes muestra en orden <orden>
    And Pendientes muestra como completadas <completadas>

    Examples:
      | completada_pagar    | cada | unidad | completada_barrer   | ahora               | orden       | completadas |
      | 2026-07-15T09:00:00 | 2    | dias   | 2026-07-15T08:00:00 | 2026-07-15T12:00:00 | Foco, Pagar | Pagar       |

  # Mostrar pausadas 4
  # Los dos encendidos: primero las no completadas, después las completadas
  # y al final las pausadas, aunque el título de la pausada vaya antes.
  Scenario Outline: Mostrar pausadas 4
    Given Mostrar completadas está encendido
    And Mostrar pausadas está encendido
    And una tarea puntual Foco sin fecha límite
    And una tarea puntual Pagar sin fecha límite
    And la tarea Pagar fue completada el <completada_pagar>
    And una tarea periódica relativa Barrer cada <cada> <unidad>
    And la tarea Barrer fue completada el <completada_barrer>
    And la tarea Barrer fue pausada
    When consulto Pendientes el <ahora>
    Then Pendientes muestra en orden <orden>
    And Pendientes muestra como completadas <completadas>
    And Pendientes muestra como pausadas <pausadas>

    Examples:
      | completada_pagar    | cada | unidad | completada_barrer   | ahora               | orden               | completadas | pausadas |
      | 2026-07-15T09:00:00 | 2    | dias   | 2026-07-15T08:00:00 | 2026-07-15T12:00:00 | Foco, Pagar, Barrer | Pagar       | Barrer   |

  # Mostrar pausadas 5
  # Las pausadas se ordenan por título en orden alfabético en español, no
  # por creadaEn. Fila 1: la ñ va después de la n. Fila 2: la Á va con la
  # A. Fila 3: sin distinguir mayúsculas. Fila 4: la creada primero también
  # puede ir primero.
  Scenario Outline: Mostrar pausadas 5
    Given Mostrar pausadas está encendido
    And una tarea periódica relativa <titulo_1> nunca completada
    And la tarea <titulo_1> fue pausada
    And una tarea periódica relativa <titulo_2> nunca completada
    And la tarea <titulo_2> fue pausada
    When consulto Pendientes en cualquier momento
    Then Pendientes muestra en orden <orden>
    And Pendientes muestra como pausadas <orden>

    Examples:
      | titulo_1 | titulo_2   | orden              |
      | Ñandú    | Nube       | Nube, Ñandú        |
      | Barrer   | Árbol      | Árbol, Barrer      |
      | Zapallo  | acelga     | acelga, Zapallo    |
      | Cocina   | Dormitorio | Cocina, Dormitorio |

  # Mostrar pausadas 6
  # Encendido: el filtro por etiqueta aplica también a las pausadas.
  Scenario Outline: Mostrar pausadas 6
    Given Mostrar pausadas está encendido
    And una tarea puntual Foco sin fecha límite
    And una tarea periódica relativa Regar nunca completada
    And la tarea Regar fue pausada
    And existen las etiquetas <existentes>
    And la tarea Foco tiene las etiquetas <etiquetas_foco>
    And la tarea Regar tiene las etiquetas <etiquetas_regar>
    And elegí el filtro <filtro>
    When consulto Pendientes en cualquier momento
    Then Pendientes muestra en orden <orden>

    Examples:
      | existentes             | etiquetas_foco | etiquetas_regar | filtro | orden       |
      | Cocina:rojo, Baño:gris | Cocina         | Baño            | Todas  | Foco, Regar |
      | Cocina:rojo, Baño:gris | Cocina         | Baño            | Cocina | Foco        |
      | Cocina:rojo, Baño:gris | Cocina         | Baño            | Baño   | Regar       |

  # Mostrar pausadas 7
  # Apagado: al pausar una tarea, su fila desaparece de Pendientes.
  Scenario Outline: Mostrar pausadas 7
    Given una tarea puntual Foco sin fecha límite
    And una tarea periódica relativa Regar nunca completada
    When pauso la tarea Regar
    And consulto Pendientes en cualquier momento
    Then Pendientes muestra en orden <orden>

    Examples:
      | orden |
      | Foco  |

  # Mostrar pausadas 8
  # Encendido: al pausar una tarea, pasa al final (sin pausa, Regar
  # pendiente va antes que la puntual sin fecha límite).
  Scenario Outline: Mostrar pausadas 8
    Given Mostrar pausadas está encendido
    And una tarea puntual Foco sin fecha límite
    And una tarea periódica relativa Regar nunca completada
    When pauso la tarea Regar
    And consulto Pendientes en cualquier momento
    Then Pendientes muestra en orden <orden>
    And Pendientes muestra como pausadas <pausadas>

    Examples:
      | orden       | pausadas |
      | Foco, Regar | Regar    |

  # Mostrar pausadas 9
  # Apagado: al reanudar una tarea, vuelve a su lugar por urgencia.
  Scenario Outline: Mostrar pausadas 9
    Given una tarea puntual Foco sin fecha límite
    And una tarea periódica relativa Regar nunca completada
    And la tarea Regar fue pausada
    When reanudo la tarea Regar el <reanudada>
    And consulto Pendientes el <ahora>
    Then Pendientes muestra en orden <orden>

    Examples:
      | reanudada           | ahora               | orden       |
      | 2026-07-15T10:00:00 | 2026-07-15T10:00:00 | Regar, Foco |
