# mutation-stamp: sha256=326358706d44917f5cb8515f0246f5bb8475e76bcc50543e767979bb28f65e0f
# acceptance-mutation-manifest-begin
# {"version":1,"tested_at":"2026-11-12T23:58:56.298747562Z","feature_name":"Anotaciones","feature_path":"features/anotaciones.feature","background_hash":"74234e98afe7498fb5daf1f36ac2d78acc339464f950703b8c019892f982b90b","implementation_hash":"sha256:10df9e86994b44076e6685d937c3c1bc3de0ade98fd219433c580a13fdfc5410","scenarios":[{"index":0,"name":"Anotaciones 1","scenario_hash":"f5fe013236543359319002500ff9b48472e182c4e9fca010697c03fbcb35ec3f","mutation_count":25,"result":{"Total":25,"Killed":25,"Survived":0,"Errors":0},"tested_at":"2026-11-12T23:54:49.003773385Z"},{"index":1,"name":"Anotaciones 2","scenario_hash":"8fc891859386ca4194b5e7eaaf643ea73474e8acac8abc8acb2aad371cf68ca9","mutation_count":47,"result":{"Total":47,"Killed":47,"Survived":0,"Errors":0},"tested_at":"2026-11-12T23:54:49.003773385Z"},{"index":2,"name":"Anotaciones 3","scenario_hash":"74d2a85650e38f71bf454e47c23d38e2a8a405d108a46f215f1990df10522611","mutation_count":20,"result":{"Total":20,"Killed":20,"Survived":0,"Errors":0},"tested_at":"2026-11-12T23:54:49.003773385Z"},{"index":3,"name":"Anotaciones 4","scenario_hash":"50188fc498f748c04ba694b98ea0155b793d29f9a3af01a5501f00c1a88f434e","mutation_count":11,"result":{"Total":11,"Killed":11,"Survived":0,"Errors":0},"tested_at":"2026-11-12T23:54:49.003773385Z"},{"index":5,"name":"Anotaciones 6","scenario_hash":"5e347326a258671068c982440b652be0c56c421851dd426c5da5ce983a220c21","mutation_count":10,"result":{"Total":10,"Killed":10,"Survived":0,"Errors":0},"tested_at":"2026-11-12T23:54:49.003773385Z"},{"index":6,"name":"Anotaciones 7","scenario_hash":"0fcc6c828955f407c255c5d66127ab1e2986b9ed4cf875c07ad77750fcf8b32a","mutation_count":13,"result":{"Total":13,"Killed":13,"Survived":0,"Errors":0},"tested_at":"2026-11-12T23:54:49.003773385Z"}]}
# acceptance-mutation-manifest-end

# Spec §6.7 (Anotaciones), §4.5 y §5.10. La pantalla lista todas las
# anotaciones, con tarea existente o sin tarea, de la más reciente a la más
# antigua por anotadaEn (si empatan, primero la de id menor), agrupadas por día
# local con los mismos encabezados del Historial: "Hoy", "Ayer" o "<día de la
# semana> <número> de <mes>", con " de <año>" si el año no es el de ahora.
# Cada anotación muestra la hora HH:MM en 24 h, el sentido, la pantalla, el
# nombre actual de la tarea si la hay («emoji título», o solo el título sin
# emoji; la anotación no guarda el nombre) y el texto si lo hay. No muestra las
# anotaciones huérfanas (de una tarea que ya no existe).
# "Anotaciones muestra" da los grupos en orden, separados por "; ", cada uno
# como "<encabezado>: <anotaciones>", y las anotaciones en orden, separadas por
# ", ", cada una como sus partes separadas por " · ". La pantalla no tiene otras
# anotaciones. Los pasos "la anotación ..." de un Given describen la última
# anotación declarada. Cada tarea se nombra por su título (una palabra).
# El texto "Todavía no hay anotaciones" se verifica en la suite QA
# (qa/anotacion.md).
# Semana de referencia: lunes 2026-07-13 a domingo 2026-07-19.
Feature: Anotaciones

  # Anotaciones 1
  # Con y sin tarea, con y sin texto, del más reciente al más antiguo y
  # agrupadas por día, aunque se hayan anotado en otro orden.
  Scenario Outline: Anotaciones 1
    Given una tarea puntual Regar sin fecha límite
    And una anotación <sentido_a> en <pantalla_a> del <anotada_a>
    And la anotación se refiere a la tarea Regar
    And la anotación dice <texto_a>
    And una anotación <sentido_b> en <pantalla_b> del <anotada_b>
    And una anotación <sentido_c> en <pantalla_c> del <anotada_c>
    And la anotación dice <texto_c>
    And una anotación <sentido_d> en <pantalla_d> del <anotada_d>
    When consulto Anotaciones el <ahora>
    Then Anotaciones muestra <anotaciones>

    Examples:
      | sentido_a | pantalla_a | anotada_a           | texto_a     | sentido_b  | pantalla_b | anotada_b           | sentido_c | pantalla_c | anotada_c           | texto_c  | sentido_d  | pantalla_d  | anotada_d           | ahora               | anotaciones                                                                                                                                                       |
      | Me sirvió | Pendientes | 2026-07-15T08:05:00 | quedó lindo | Me molestó | Historial  | 2026-07-15T09:10:00 | Me sirvió | Etiquetas  | 2026-07-14T21:30:00 | muy lento | Me molestó | Anotaciones | 2026-07-13T09:00:00 | 2026-07-15T12:00:00 | Hoy: 09:10 · Me molestó · Historial, 08:05 · Me sirvió · Pendientes · Regar · quedó lindo; Ayer: 21:30 · Me sirvió · Etiquetas · muy lento; lunes 13 de julio: 09:00 · Me molestó · Anotaciones |

  # Anotaciones 2
  # Encabezado del día y hora: bordes de las 00:00, "Ayer" a través del cambio
  # de año, el año cuando no es el de ahora, y anotaciones "del futuro" (el
  # mismo día, más tarde, va en "Hoy"; otro día, con la fecha, nunca "Mañana").
  # La hora se muestra sin segundos.
  Scenario Outline: Anotaciones 2
    Given una anotación Me sirvió en Pendientes del <anotada>
    When consulto Anotaciones el <ahora>
    Then Anotaciones muestra <anotaciones>

    Examples:
      | anotada             | ahora               | anotaciones                                                 |
      | 2026-07-15T00:00:00 | 2026-07-15T12:00:00 | Hoy: 00:00 · Me sirvió · Pendientes                         |
      | 2026-07-14T23:59:59 | 2026-07-15T12:00:00 | Ayer: 23:59 · Me sirvió · Pendientes                        |
      | 2026-07-14T23:59:59 | 2026-07-16T00:00:00 | martes 14 de julio: 23:59 · Me sirvió · Pendientes          |
      | 2026-07-13T08:00:00 | 2026-07-14T23:59:59 | Ayer: 08:00 · Me sirvió · Pendientes                        |
      | 2025-12-31T22:00:00 | 2026-01-01T10:00:00 | Ayer: 22:00 · Me sirvió · Pendientes                        |
      | 2025-12-31T22:00:00 | 2026-01-02T10:00:00 | miércoles 31 de diciembre de 2025: 22:00 · Me sirvió · Pendientes |
      | 2026-07-15T13:00:00 | 2026-07-15T12:00:00 | Hoy: 13:00 · Me sirvió · Pendientes                         |
      | 2026-07-16T09:00:00 | 2026-07-15T12:00:00 | jueves 16 de julio: 09:00 · Me sirvió · Pendientes          |

  # Anotaciones 3
  # Dos anotaciones en el mismo instante: va primero la de id menor, sin
  # importar en qué orden se registraron.
  Scenario Outline: Anotaciones 3
    Given una anotación <sentido_a> en <pantalla> del <momento>
    And la anotación se registró con id <id_a>
    And una anotación <sentido_b> en <pantalla> del <momento>
    And la anotación se registró con id <id_b>
    When consulto Anotaciones el <ahora>
    Then Anotaciones muestra <anotaciones>

    Examples:
      | sentido_a  | sentido_b | pantalla   | momento             | id_a | id_b | ahora               | anotaciones                                                              |
      | Me molestó | Me sirvió | Pendientes | 2026-07-15T10:00:00 | a2   | a1   | 2026-07-15T12:00:00 | Hoy: 10:00 · Me sirvió · Pendientes, 10:00 · Me molestó · Pendientes     |
      | Me molestó | Me sirvió | Pendientes | 2026-07-15T10:00:00 | a1   | a2   | 2026-07-15T12:00:00 | Hoy: 10:00 · Me molestó · Pendientes, 10:00 · Me sirvió · Pendientes     |

  # Anotaciones 4
  # La pantalla muestra el nombre actual de la tarea: renombrarla cambia todas
  # sus anotaciones, y con emoji el nombre es «emoji título».
  Scenario Outline: Anotaciones 4
    Given una tarea puntual <titulo> sin fecha límite con emoji <emoji>
    And una anotación Me sirvió en Pendientes del <primera>
    And la anotación se refiere a la tarea <titulo>
    And una anotación Me molestó en Historial del <segunda>
    And la anotación se refiere a la tarea <titulo>
    When edito el título a <titulo_nuevo>
    And consulto Anotaciones el <ahora>
    Then Anotaciones muestra <anotaciones>

    Examples:
      | titulo | emoji | primera             | segunda             | titulo_nuevo | ahora               | anotaciones                                                                                               |
      | Regar  | 🌱    | 2026-07-14T09:00:00 | 2026-07-15T08:00:00 | Plantas      | 2026-07-15T12:00:00 | Hoy: 08:00 · Me molestó · Historial · 🌱 Plantas; Ayer: 09:00 · Me sirvió · Pendientes · 🌱 Plantas |

  # Anotaciones 5
  # Sin anotaciones, la pantalla está vacía.
  Scenario Outline: Anotaciones 5
    Given una tarea puntual Regar sin fecha límite
    When consulto Anotaciones el <ahora>
    Then Anotaciones está vacía

    Examples:
      | ahora               |
      | 2026-07-15T12:00:00 |

  # Anotaciones 6
  # Una anotación de una tarea sin emoji muestra solo el título, y el texto
  # va al final.
  Scenario Outline: Anotaciones 6
    Given una tarea puntual <titulo> sin fecha límite
    And una anotación <sentido> en <pantalla> del <anotada>
    And la anotación se refiere a la tarea <titulo>
    And la anotación dice <texto>
    When consulto Anotaciones el <ahora>
    Then Anotaciones muestra <anotaciones>

    Examples:
      | titulo | sentido    | pantalla         | anotada             | texto       | ahora               | anotaciones                                                          |
      | Pagar  | Me molestó | Panel de edición | 2026-07-15T08:05:00 | quedó lindo | 2026-07-15T12:00:00 | Hoy: 08:05 · Me molestó · Panel de edición · Pagar · quedó lindo     |

  # Anotaciones 7
  # Dos dispositivos anotan sin conexión: la pantalla muestra las dos.
  Scenario Outline: Anotaciones 7
    Given estoy en <pantalla>
    When anoto <sentido> el <ahora>
    And otro dispositivo, sin ver ese cambio, anota <sentido_otro> en <pantalla_otro> el <ahora_otro>
    And consulto Anotaciones el <consulta>
    Then Anotaciones muestra <anotaciones>

    Examples:
      | pantalla   | sentido   | ahora               | sentido_otro | pantalla_otro | ahora_otro          | consulta            | anotaciones                                                          |
      | Pendientes | Me sirvió | 2026-07-15T08:05:00 | Me molestó   | Historial     | 2026-07-15T08:06:00 | 2026-07-15T12:00:00 | Hoy: 08:06 · Me molestó · Historial, 08:05 · Me sirvió · Pendientes  |
