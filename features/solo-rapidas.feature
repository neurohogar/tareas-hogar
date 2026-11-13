# mutation-stamp: sha256=8e2342299d50fcaee5c4dfb7e0533da475978a710fceaeb12e5ac1d8fc2a9604
# acceptance-mutation-manifest-begin
# {"version":1,"tested_at":"2026-11-13T22:26:06.887083835Z","feature_name":"Solo rápidas","feature_path":"features/solo-rapidas.feature","background_hash":"74234e98afe7498fb5daf1f36ac2d78acc339464f950703b8c019892f982b90b","implementation_hash":"sha256:d8d129eaa5a098a11a81f73b63e5f484f4cc7c1591dae6d533f7a01d776fc21c","scenarios":[{"index":0,"name":"Solo rápidas 1","scenario_hash":"514c5bbb5b080b736bf397d0da14a2b318535b8af0de2d98f906cf4a6ccbadd5","mutation_count":38,"result":{"Total":38,"Killed":38,"Survived":0,"Errors":0},"tested_at":"2026-11-13T22:26:06.887083835Z"},{"index":1,"name":"Solo rápidas 2","scenario_hash":"0336700e6f806cca8e21d450a4a6f58e47dda2763685ed9592b16010104f5418","mutation_count":50,"result":{"Total":50,"Killed":50,"Survived":0,"Errors":0},"tested_at":"2026-11-13T22:26:06.887083835Z"},{"index":2,"name":"Solo rápidas 3","scenario_hash":"0a177ba820388de7ed3722abc2be55c852826036924eecd670a8d639246cd316","mutation_count":23,"result":{"Total":23,"Killed":23,"Survived":0,"Errors":0},"tested_at":"2026-11-13T22:26:06.887083835Z"},{"index":3,"name":"Solo rápidas 4","scenario_hash":"dc2d450c8a91cf261940cc89290b8f67f7475198ca9bfa2760619b0b91578561","mutation_count":15,"result":{"Total":15,"Killed":15,"Survived":0,"Errors":0},"tested_at":"2026-11-13T22:26:06.887083835Z"},{"index":4,"name":"Solo rápidas 5","scenario_hash":"473a953283681b95a735408ebef2a5db36a122bd3bc8ce663daa3c518fdcfaa0","mutation_count":15,"result":{"Total":15,"Killed":15,"Survived":0,"Errors":0},"tested_at":"2026-11-13T22:26:06.887083835Z"},{"index":5,"name":"Solo rápidas 6","scenario_hash":"f31b5c269c7587abfcc1e8d626e8412e40d943cae9c52afeff4b4064a5553c18","mutation_count":4,"result":{"Total":4,"Killed":4,"Survived":0,"Errors":0},"tested_at":"2026-11-13T22:26:06.887083835Z"}]}
# acceptance-mutation-manifest-end

# Spec §6.1 (Solo rápidas), con el filtro por etiqueta, Mostrar completadas
# y Mostrar pausadas.
#   Apagado (valor inicial): la lista no se filtra por esfuerzo.
#   Encendido: la lista muestra solo las tareas con esfuerzo rapida, en el
#     mismo orden. Se combina con el filtro por etiqueta (las dos
#     condiciones a la vez) y aplica también a las completadas y a las
#     pausadas cuando se muestran.
#   Lista vacía: encendido y sin etiqueta elegida ("Todas"), se ve "No hay
#     tareas rápidas"; con una etiqueta elegida, "No hay tareas con esta
#     etiqueta" (encendido o apagado).
# Que el botón se vea aunque no haya etiquetas, que se mantenga al cambiar
# de pantalla y vuelva a apagado al recargar, y que una tarea entre o salga
# de la lista al cambiarle el esfuerzo, se verifican en la suite QA.
# Cada tarea se nombra por su título (una palabra). "la tarea X tiene
# esfuerzo E" da rapida, media, larga o "sin estimar" (sin el campo).
# "Pendientes muestra en orden" da los títulos de arriba hacia abajo y la
# lista no tiene otras filas. "Pendientes muestra como completadas" (o
# "como pausadas") da, en orden, los títulos de las filas que se ven así.
# "Pendientes muestra el texto T" es el texto de lista vacía. Las tareas se
# crearon todas en el mismo instante, antes de cualquier otra fecha del
# escenario: el empate de urgencia se resuelve por título. Sin el paso "Mostrar completadas está encendido" (o "Mostrar
# pausadas"), el check está en su valor inicial; sin "elegí el filtro", el
# filtro por etiqueta está en "Todas".
# Semana de referencia: lunes 2026-07-13 a domingo 2026-07-19.
Feature: Solo rápidas

  # Solo rápidas 1
  # Encendido, quedan solo las rápidas en el orden por urgencia de la lista
  # entera; apagado (fila 1), se ven todas. Pagar atrasada, Regar pendiente
  # desde las 11:00, Foco pendiente sin fecha límite (al final), sin
  # importar el orden en que se declaran.
  Scenario Outline: Solo rápidas 1
    Given Solo rápidas está <solo_rapidas>
    And una tarea puntual Foco sin fecha límite
    And una tarea periódica relativa Regar cada <cada> <unidad>
    And la tarea Regar fue completada el <completada>
    And una tarea puntual Pagar con fecha límite <limite>
    And la tarea Foco tiene esfuerzo <esfuerzo_foco>
    And la tarea Regar tiene esfuerzo <esfuerzo_regar>
    And la tarea Pagar tiene esfuerzo <esfuerzo_pagar>
    When consulto Pendientes el <ahora>
    Then Pendientes muestra en orden <orden>

    Examples:
      | solo_rapidas | cada | unidad | completada          | limite     | esfuerzo_foco | esfuerzo_regar | esfuerzo_pagar | ahora               | orden               |
      | apagado      | 4    | horas  | 2026-07-15T07:00:00 | 2026-07-14 | rapida        | media          | sin estimar    | 2026-07-15T12:00:00 | Pagar, Regar, Foco  |
      | encendido    | 4    | horas  | 2026-07-15T07:00:00 | 2026-07-14 | rapida        | media          | sin estimar    | 2026-07-15T12:00:00 | Foco                |
      | encendido    | 4    | horas  | 2026-07-15T07:00:00 | 2026-07-14 | rapida        | rapida         | rapida         | 2026-07-15T12:00:00 | Pagar, Regar, Foco  |
      | encendido    | 4    | horas  | 2026-07-15T07:00:00 | 2026-07-14 | larga         | rapida         | rapida         | 2026-07-15T12:00:00 | Pagar, Regar        |
      | encendido    | 4    | horas  | 2026-07-15T07:00:00 | 2026-07-14 | media         | larga          | rapida         | 2026-07-15T12:00:00 | Pagar               |

  # Solo rápidas 2
  # Se combina con el filtro por etiqueta: las dos condiciones a la vez.
  # Regar (relativa nunca completada) va antes que las puntuales sin fecha
  # límite; entre estas, que se crearon en el mismo instante, desempata el
  # título (Foco antes que Pagar).
  Scenario Outline: Solo rápidas 2
    Given Solo rápidas está <solo_rapidas>
    And una tarea puntual Pagar sin fecha límite
    And una tarea periódica relativa Regar nunca completada
    And una tarea puntual Foco sin fecha límite
    And existen las etiquetas <existentes>
    And la tarea Pagar tiene las etiquetas <etiquetas_pagar>
    And la tarea Regar tiene las etiquetas <etiquetas_regar>
    And la tarea Foco tiene las etiquetas <etiquetas_foco>
    And la tarea Pagar tiene esfuerzo <esfuerzo_pagar>
    And la tarea Regar tiene esfuerzo <esfuerzo_regar>
    And la tarea Foco tiene esfuerzo <esfuerzo_foco>
    And elegí el filtro <filtro>
    When consulto Pendientes en cualquier momento
    Then Pendientes muestra en orden <orden>

    Examples:
      | solo_rapidas | existentes             | etiquetas_pagar | etiquetas_regar | etiquetas_foco | esfuerzo_pagar | esfuerzo_regar | esfuerzo_foco | filtro | orden               |
      | encendido    | Cocina:rojo, Baño:gris | Cocina          | Cocina          | Baño           | rapida         | media          | rapida        | Cocina | Pagar               |
      | encendido    | Cocina:rojo, Baño:gris | Cocina          | Cocina          | Baño           | rapida         | media          | rapida        | Baño   | Foco                |
      | encendido    | Cocina:rojo, Baño:gris | Cocina          | Cocina          | Baño           | rapida         | media          | rapida        | Todas  | Foco, Pagar         |
      | apagado      | Cocina:rojo, Baño:gris | Cocina          | Cocina          | Baño           | rapida         | media          | rapida        | Cocina | Regar, Pagar        |
      | encendido    | Cocina:rojo, Baño:gris | Cocina          | Cocina          | Baño           | rapida         | rapida         | larga         | Cocina | Regar, Pagar        |

  # Solo rápidas 3
  # Lista vacía. Fila 1: encendido con "Todas" y ninguna rápida. Fila 2:
  # encendido con una etiqueta elegida, aunque hay rápidas con otra
  # etiqueta. Fila 3: apagado con una etiqueta sin tareas.
  Scenario Outline: Solo rápidas 3
    Given Solo rápidas está <solo_rapidas>
    And una tarea puntual Pagar sin fecha límite
    And una tarea periódica relativa Regar nunca completada
    And existen las etiquetas <existentes>
    And la tarea Pagar tiene las etiquetas <etiquetas_pagar>
    And la tarea Regar tiene las etiquetas <etiquetas_regar>
    And la tarea Pagar tiene esfuerzo <esfuerzo_pagar>
    And la tarea Regar tiene esfuerzo <esfuerzo_regar>
    And elegí el filtro <filtro>
    When consulto Pendientes en cualquier momento
    Then Pendientes no muestra ninguna tarea
    And Pendientes muestra el texto <texto>

    Examples:
      | solo_rapidas | existentes                          | etiquetas_pagar | etiquetas_regar | esfuerzo_pagar | esfuerzo_regar | filtro | texto                           |
      | encendido    | Cocina:rojo, Baño:gris, Patio:verde | Cocina          | Baño            | media          | sin estimar    | Todas  | No hay tareas rápidas           |
      | encendido    | Cocina:rojo, Baño:gris, Patio:verde | Cocina          | Baño            | media          | rapida         | Cocina | No hay tareas con esta etiqueta |
      | apagado      | Cocina:rojo, Baño:gris, Patio:verde | Cocina          | Baño            | media          | rapida         | Patio  | No hay tareas con esta etiqueta |

  # Solo rápidas 4
  # Aplica también a las completadas cuando se muestran.
  Scenario Outline: Solo rápidas 4
    Given Mostrar completadas está encendido
    And Solo rápidas está <solo_rapidas>
    And una tarea puntual Foco sin fecha límite
    And una tarea puntual Pagar sin fecha límite
    And la tarea Pagar fue completada el <completada>
    And la tarea Foco tiene esfuerzo <esfuerzo_foco>
    And la tarea Pagar tiene esfuerzo <esfuerzo_pagar>
    When consulto Pendientes el <ahora>
    Then Pendientes muestra en orden <orden>
    And Pendientes muestra como completadas <completadas>

    Examples:
      | solo_rapidas | completada          | esfuerzo_foco | esfuerzo_pagar | ahora               | orden       | completadas |
      | encendido    | 2026-07-15T09:00:00 | media         | rapida         | 2026-07-15T12:00:00 | Pagar       | Pagar       |
      | encendido    | 2026-07-15T09:00:00 | rapida        | rapida         | 2026-07-15T12:00:00 | Foco, Pagar | Pagar       |
      | apagado      | 2026-07-15T09:00:00 | media         | rapida         | 2026-07-15T12:00:00 | Foco, Pagar | Pagar       |

  # Solo rápidas 5
  # Aplica también a las pausadas cuando se muestran.
  Scenario Outline: Solo rápidas 5
    Given Mostrar pausadas está encendido
    And Solo rápidas está <solo_rapidas>
    And una tarea puntual Foco sin fecha límite
    And una tarea periódica relativa Regar nunca completada
    And la tarea Regar fue pausada
    And la tarea Foco tiene esfuerzo <esfuerzo_foco>
    And la tarea Regar tiene esfuerzo <esfuerzo_regar>
    When consulto Pendientes en cualquier momento
    Then Pendientes muestra en orden <orden>
    And Pendientes muestra como pausadas <pausadas>

    Examples:
      | solo_rapidas | esfuerzo_foco | esfuerzo_regar | orden       | pausadas |
      | encendido    | media         | rapida         | Regar       | Regar    |
      | encendido    | rapida        | rapida         | Foco, Regar | Regar    |
      | apagado      | media         | rapida         | Foco, Regar | Regar    |

  # Solo rápidas 6
  # Encendido, una pausada rápida sigue oculta si Mostrar pausadas está
  # apagado.
  Scenario Outline: Solo rápidas 6
    Given Solo rápidas está <solo_rapidas>
    And una tarea puntual Foco sin fecha límite
    And una tarea periódica relativa Regar nunca completada
    And la tarea Regar fue pausada
    And la tarea Foco tiene esfuerzo <esfuerzo_foco>
    And la tarea Regar tiene esfuerzo <esfuerzo_regar>
    When consulto Pendientes en cualquier momento
    Then Pendientes muestra en orden <orden>

    Examples:
      | solo_rapidas | esfuerzo_foco | esfuerzo_regar | orden |
      | encendido    | rapida        | rapida         | Foco  |
