# mutation-stamp: sha256=cba5815b82d649d20918cecb5629283aa2679483569dc8c329b13771e6329a28
# acceptance-mutation-manifest-begin
# {"version":1,"tested_at":"2026-11-13T22:32:29.335667398Z","feature_name":"Última vez","feature_path":"features/ultima-vez.feature","background_hash":"74234e98afe7498fb5daf1f36ac2d78acc339464f950703b8c019892f982b90b","implementation_hash":"sha256:02a3d3223aefeb3a9ec5296110e3343ae9a64a9d336e79b488b7ec16cbaddaac","scenarios":[{"index":0,"name":"Última vez 1","scenario_hash":"4657ef499925ee236cca9d228ca1ce3ba3c95b67690e43c59841eb86de98e202","mutation_count":26,"result":{"Total":26,"Killed":26,"Survived":0,"Errors":0},"tested_at":"2026-11-13T22:32:29.335667398Z"},{"index":1,"name":"Última vez 2","scenario_hash":"4a43a216c4fbe8507232a78621c1334ff4a2cb26782e0e0ff7733d78205dfc27","mutation_count":26,"result":{"Total":26,"Killed":26,"Survived":0,"Errors":0},"tested_at":"2026-11-13T22:32:29.335667398Z"},{"index":2,"name":"Última vez 3","scenario_hash":"6ad50497f05a2ee92ddb50533774a55cf0bf8897e08656239c8e5d2711155ed1","mutation_count":29,"result":{"Total":29,"Killed":29,"Survived":0,"Errors":0},"tested_at":"2026-11-13T22:32:29.335667398Z"},{"index":3,"name":"Última vez 4","scenario_hash":"8d1967ae0f160743b7610d339e534f49f77c627cf928ea4a908910c17162ef81","mutation_count":16,"result":{"Total":16,"Killed":16,"Survived":0,"Errors":0},"tested_at":"2026-11-13T22:32:29.335667398Z"},{"index":4,"name":"Última vez 5","scenario_hash":"939c0d9a09f243169a61a5ec8ca4f0b1f076253d980cc0cc3390887e962622c4","mutation_count":1,"result":{"Total":1,"Killed":1,"Survived":0,"Errors":0},"tested_at":"2026-11-13T22:32:29.335667398Z"},{"index":5,"name":"Última vez 6","scenario_hash":"b2a4071cecac81ca4fb3e12b301b4626e102e8021ede8e5bc383fd1501116b7d","mutation_count":13,"result":{"Total":13,"Killed":13,"Survived":0,"Errors":0},"tested_at":"2026-11-13T22:32:29.335667398Z"},{"index":6,"name":"Última vez 7","scenario_hash":"7b27a1330826ce05ad5ea203c8219afb68eec421eb1a0e4045fc59c429700066","mutation_count":6,"result":{"Total":6,"Killed":6,"Survived":0,"Errors":0},"tested_at":"2026-11-13T22:32:29.335667398Z"},{"index":7,"name":"Última vez 8","scenario_hash":"5a431080b49ffdd8159239e31727d9aacc7f7e3936a0cb30f062d336c3d67112","mutation_count":1,"result":{"Total":1,"Killed":1,"Survived":0,"Errors":0},"tested_at":"2026-11-13T22:32:29.335667398Z"},{"index":8,"name":"Última vez 9","scenario_hash":"2215fc04186b2dbf6e5c29795b6e2601f921b977234b76aef9eb79b952a9a77e","mutation_count":7,"result":{"Total":7,"Killed":7,"Survived":0,"Errors":0},"tested_at":"2026-11-13T22:32:29.335667398Z"},{"index":9,"name":"Última vez 10","scenario_hash":"a21acdef3cb4c9d8578f39e7c7d5f9bb3e3d738b71cb19a8680371a8395ca932","mutation_count":6,"result":{"Total":6,"Killed":6,"Survived":0,"Errors":0},"tested_at":"2026-11-13T22:32:29.335667398Z"}]}
# acceptance-mutation-manifest-end

# Spec §6.2 (Última vez), con §6.3 (formato de fecha del Historial), §5.2
# (relojes desfasados) y §5.4 (borrar completados). Al editar una tarea, el
# panel muestra cuándo se completó por última vez, según su completadoEn más
# reciente (de cualquier tipo de tarea, sin importar la ocurrencia que cubre
# ni el orden en que se registraron los completados) y el día local (el día
# empieza a las 00:00):
# - del día de ahora (aunque sea más tarde que ahora): "hoy HH:MM";
# - del día anterior: "ayer HH:MM";
# - de N >= 2 días antes: "hace N días" (diferencia en días locales, sin hora);
# - de un día posterior a hoy: "<día de la semana> <número> de <mes> HH:MM",
#   con " de <año>" después del mes si el año no es el de ahora;
# - sin completados: "nunca".
# La hora va en 24 h, sin segundos. "la última vez muestra <texto>" afirma que
# el panel dice "Última vez: <texto>".
# Semana de referencia: lunes 2026-07-13 a domingo 2026-07-19.
Feature: Última vez

  # Última vez 1
  # Completada el día de ahora: "hoy" con la hora. Bordes de las 00:00, hora
  # sin segundos, y un completado "del futuro" del mismo día también es "hoy".
  Scenario Outline: Última vez 1
    Given una tarea puntual sin fecha límite
    And la tarea fue completada el <completada>
    When consulto la última vez el <ahora>
    Then la última vez muestra <ultima_vez>

    Examples:
      | completada          | ahora               | ultima_vez |
      | 2026-07-15T08:05:00 | 2026-07-15T12:00:00 | hoy 08:05  |
      | 2026-07-15T00:00:00 | 2026-07-15T23:59:59 | hoy 00:00  |
      | 2026-07-15T23:59:59 | 2026-07-15T23:59:59 | hoy 23:59  |
      | 2026-07-15T13:00:00 | 2026-07-15T12:00:00 | hoy 13:00  |

  # Última vez 2
  # Completada el día anterior: "ayer" con la hora. Bordes de las 00:00 y el
  # cambio de año.
  Scenario Outline: Última vez 2
    Given una tarea puntual sin fecha límite
    And la tarea fue completada el <completada>
    When consulto la última vez el <ahora>
    Then la última vez muestra <ultima_vez>

    Examples:
      | completada          | ahora               | ultima_vez |
      | 2026-07-14T19:30:00 | 2026-07-15T12:00:00 | ayer 19:30 |
      | 2026-07-14T23:59:59 | 2026-07-15T00:00:00 | ayer 23:59 |
      | 2026-07-14T00:00:00 | 2026-07-15T23:59:59 | ayer 00:00 |
      | 2025-12-31T22:00:00 | 2026-01-01T10:00:00 | ayer 22:00 |

  # Última vez 3
  # Completada dos o más días antes: "hace N días", contando días locales y
  # no horas transcurridas. Bordes de las 00:00, cambio de mes y de año.
  Scenario Outline: Última vez 3
    Given una tarea puntual sin fecha límite
    And la tarea fue completada el <completada>
    When consulto la última vez el <ahora>
    Then la última vez muestra <ultima_vez>

    Examples:
      | completada          | ahora               | ultima_vez   |
      | 2026-07-13T23:59:59 | 2026-07-15T00:00:00 | hace 2 días  |
      | 2026-07-13T00:00:00 | 2026-07-15T23:59:59 | hace 2 días  |
      | 2026-07-05T10:00:00 | 2026-07-15T09:00:00 | hace 10 días |
      | 2026-06-15T08:00:00 | 2026-07-15T07:00:00 | hace 30 días |
      | 2025-12-30T22:00:00 | 2026-01-02T08:00:00 | hace 3 días  |

  # Última vez 4
  # Un completado "del futuro" de otro día (relojes desfasados) se muestra
  # con la fecha y la hora, como en el Historial, nunca como "mañana"; con el
  # año si no es el de ahora.
  Scenario Outline: Última vez 4
    Given una tarea puntual sin fecha límite
    And la tarea fue completada el <completada>
    When consulto la última vez el <ahora>
    Then la última vez muestra <ultima_vez>

    Examples:
      | completada          | ahora               | ultima_vez                         |
      | 2026-07-16T08:05:00 | 2026-07-15T12:00:00 | jueves 16 de julio 08:05           |
      | 2026-07-16T00:00:00 | 2026-07-15T23:59:59 | jueves 16 de julio 00:00           |
      | 2027-01-01T08:00:00 | 2026-12-31T20:00:00 | viernes 1 de enero de 2027 08:00   |

  # Última vez 5
  # Sin completados: "nunca".
  Scenario Outline: Última vez 5
    Given una tarea puntual sin fecha límite
    When consulto la última vez el <ahora>
    Then la última vez muestra <ultima_vez>

    Examples:
      | ahora               | ultima_vez |
      | 2026-07-15T12:00:00 | nunca      |

  # Última vez 6
  # Con varios completados (dos dispositivos sin conexión) cuenta el de
  # completadoEn más reciente, aunque se haya registrado antes; fila 2: uno
  # "del futuro" es el más reciente.
  Scenario Outline: Última vez 6
    Given una tarea puntual sin fecha límite
    And la tarea fue completada el <reciente>
    And la tarea fue completada el <antigua>
    When consulto la última vez el <ahora>
    Then la última vez muestra <ultima_vez>

    Examples:
      | reciente            | antigua             | ahora               | ultima_vez               |
      | 2026-07-15T09:00:00 | 2026-07-14T10:00:00 | 2026-07-15T12:00:00 | hoy 09:00                |
      | 2026-07-16T09:00:00 | 2026-07-15T10:00:00 | 2026-07-15T12:00:00 | jueves 16 de julio 09:00 |

  # Última vez 7
  # Borrar el completado más reciente (deshacer) vuelve al anterior.
  Scenario Outline: Última vez 7
    Given una tarea puntual sin fecha límite
    And la tarea fue completada el <antigua>
    And la tarea fue completada el <reciente>
    When borro el completado del <reciente>
    And consulto la última vez el <ahora>
    Then la última vez muestra <ultima_vez>

    Examples:
      | antigua             | reciente            | ahora               | ultima_vez |
      | 2026-07-14T10:00:00 | 2026-07-15T09:00:00 | 2026-07-15T12:00:00 | ayer 10:00 |

  # Última vez 8
  # Borrar el único completado deja "nunca".
  Scenario Outline: Última vez 8
    Given una tarea puntual sin fecha límite
    And la tarea fue completada el <completada>
    When borro el completado del <completada>
    And consulto la última vez el <ahora>
    Then la última vez muestra <ultima_vez>

    Examples:
      | completada          | ahora               | ultima_vez |
      | 2026-07-15T09:00:00 | 2026-07-15T12:00:00 | nunca      |

  # Última vez 9
  # En una periódica calendario cuenta el momento del completado, no la
  # ocurrencia que cubre.
  Scenario Outline: Última vez 9
    Given una tarea periódica semanal los <dias>
    And la tarea tiene un completado del <completada> que cubre el <cubierta>
    When consulto la última vez el <ahora>
    Then la última vez muestra <ultima_vez>

    Examples:
      | dias   | completada          | cubierta   | ahora               | ultima_vez |
      | martes | 2026-07-15T08:00:00 | 2026-07-14 | 2026-07-15T12:00:00 | hoy 08:00  |

  # Última vez 10
  # Cambiar el tipo de la tarea conserva sus completados y su última vez.
  Scenario Outline: Última vez 10
    Given una tarea puntual sin fecha límite
    And la tarea fue completada el <completada>
    When edito la tarea a periódica relativa cada <cada> <unidad>
    And consulto la última vez el <ahora>
    Then la última vez muestra <ultima_vez>

    Examples:
      | completada          | cada | unidad | ahora               | ultima_vez  |
      | 2026-07-13T09:00:00 | 4    | horas  | 2026-07-15T12:00:00 | hace 2 días |
