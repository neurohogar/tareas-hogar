# mutation-stamp: sha256=e91d749b5ec96bec6473e20adcc93403215da24a47f33622b2ffc90e32e01844
# acceptance-mutation-manifest-begin
# {"version":1,"tested_at":"2026-11-13T17:58:31.699226985Z","feature_name":"Texto de regreso","feature_path":"features/texto-de-regreso.feature","background_hash":"74234e98afe7498fb5daf1f36ac2d78acc339464f950703b8c019892f982b90b","implementation_hash":"sha256:cb9af1b362207bc964ac585e7b2680e8456d4f2ac669d19d55fa90b35b36c6c6","scenarios":[{"index":0,"name":"Texto de regreso 1","scenario_hash":"2b083408c805357c5b87f5989e9f6cec7f385b6a254ba4ec92de4497a8a32b0e","mutation_count":96,"result":{"Total":96,"Killed":96,"Survived":0,"Errors":0},"tested_at":"2026-11-13T17:58:31.699226985Z"},{"index":1,"name":"Texto de regreso 2","scenario_hash":"04ccafcca1d56440f2537ee890c1a709bdaf632bf95257a4f43f0e4f9bd5e421","mutation_count":40,"result":{"Total":40,"Killed":40,"Survived":0,"Errors":0},"tested_at":"2026-11-13T17:58:31.699226985Z"},{"index":2,"name":"Texto de regreso 3","scenario_hash":"564d57e52ac520625abbe5e1fedf4bc10d49d2bdbe729342a9e953e4415ba0f4","mutation_count":27,"result":{"Total":27,"Killed":27,"Survived":0,"Errors":0},"tested_at":"2026-11-13T17:58:31.699226985Z"},{"index":3,"name":"Texto de regreso 4","scenario_hash":"161293a4ded894ee322046cecedb97feda3d4dae8e8ade8de793e2bffdd7c41f","mutation_count":8,"result":{"Total":8,"Killed":8,"Survived":0,"Errors":0},"tested_at":"2026-11-13T17:58:31.699226985Z"},{"index":4,"name":"Texto de regreso 5","scenario_hash":"590d0ab51399ef615efc7ea686567523cedfe4d43566383a929daf0b4043c6a6","mutation_count":17,"result":{"Total":17,"Killed":17,"Survived":0,"Errors":0},"tested_at":"2026-11-13T17:58:31.699226985Z"},{"index":5,"name":"Texto de regreso 6","scenario_hash":"7427a5a3d9e3649d07595d7cc1e9fccf023558448b6dfe97344555d737e3c78c","mutation_count":30,"result":{"Total":30,"Killed":30,"Survived":0,"Errors":0},"tested_at":"2026-11-13T17:58:31.699226985Z"},{"index":6,"name":"Texto de regreso 7","scenario_hash":"65f3fea9dd631806462ab801aaff7852e02b152ddd71d2a3da7541000425b648","mutation_count":14,"result":{"Total":14,"Killed":14,"Survived":0,"Errors":0},"tested_at":"2026-11-13T17:58:31.699226985Z"},{"index":7,"name":"Texto de regreso 8","scenario_hash":"a460ddf4a3ceb01059ffa41c74df5af3fb39dd8fae4f84287ab961dd75bfac4d","mutation_count":22,"result":{"Total":22,"Killed":22,"Survived":0,"Errors":0},"tested_at":"2026-11-13T17:58:31.699226985Z"},{"index":8,"name":"Texto de regreso 9","scenario_hash":"76020d266378f4e079ddb94f5af2b15de406052929b38b64e7dc59585d79b754","mutation_count":34,"result":{"Total":34,"Killed":34,"Survived":0,"Errors":0},"tested_at":"2026-11-13T17:58:31.699226985Z"},{"index":9,"name":"Texto de regreso 10","scenario_hash":"c54d55ac21ed1ae7f015c41e7b97973df8cc24bcc82b351eb391d34894732c13","mutation_count":16,"result":{"Total":16,"Killed":16,"Survived":0,"Errors":0},"tested_at":"2026-11-13T17:58:31.699226985Z"},{"index":10,"name":"Texto de regreso 11","scenario_hash":"bfb9d1e3b84ce72eacf602e920430441420e84a04800f28896a8555abd5b8f47","mutation_count":34,"result":{"Total":34,"Killed":34,"Survived":0,"Errors":0},"tested_at":"2026-11-13T17:58:31.699226985Z"}]}
# acceptance-mutation-manifest-end

# Spec §6.1 (texto de regreso «Vuelve …» y Fecha y distancia), con §5.2, §5.3,
# §5.5–§5.7 y §5.9 (cuándo vuelve cada tarea). La fila de una tarea en espera
# dice cuándo vuelve: «Vuelve <fecha>[ · <distancia>]», con «el» solo delante de
# la fecha con día de la semana. Vale también para las periódicas completadas
# que se ven con Mostrar completadas y para las pospuestas, sin nombrar la
# posposición. No cambia los estados de §5 ni el orden de la lista.
# Instante de «Vuelve» (el mismo con el que §6.1 ordena las en espera):
# relativa, V; calendario, 00:00 de N (sin hora); con horario, A (una puntual
# fuera de ventana, el desde de la próxima); pospuesta, pospuesta.hasta. Si dos
# causas la tienen en espera, el instante en que deja de estarlo (el más tarde).
# Fecha y distancia como en texto-de-atraso.feature; lo futuro se redondea
# hacia arriba, nunca «en 0 minutos»: se cuenta desde ahora, aunque cruce la
# medianoche, y a la hora en punto en horas («en 1 hora», no 60 minutos).
# Sin hora, con «mañana», no hay distancia.
# "la fila de la tarea muestra el texto T" afirma que la lista tiene una sola
# fila y que dice T. Una periódica en espera con completados está completada y
# solo tiene fila con Mostrar completadas encendido. Cuando el paso no da
# creadaEn, la tarea se creó antes de cualquier otra fecha del escenario.
# Semana de referencia: viernes 2026-11-13 (jueves 19, sábado 14, domingo 15).
Feature: Texto de regreso

  # Texto de regreso 1
  # Relativa completada: V con hora. Fila 2: 7 horas y 59 minutos y medio es
  # «en 8 horas» (se redondea hacia arriba). Filas 3 a 5: menos de una hora, en
  # minutos (también 39 minutos y medio es «en 40» y 30 segundos es «en 1
  # minuto»). Fila 6: exactamente una hora. Fila 8: cruza la medianoche. Filas
  # 10 y 11: otro mes y otro año.
  Scenario Outline: Texto de regreso 1
    Given Mostrar completadas está encendido
    And una tarea periódica relativa cada <cada> <unidad>
    And la tarea fue completada el <completada>
    When consulto Pendientes el <ahora>
    Then la fila de la tarea muestra el texto <texto>

    Examples:
      | cada | unidad | completada          | ahora               | texto                                                      |
      | 8    | horas  | 2026-11-13T10:00:00 | 2026-11-13T10:00:00 | Vuelve hoy 18:00 · en 8 horas                              |
      | 8    | horas  | 2026-11-13T10:00:00 | 2026-11-13T10:00:30 | Vuelve hoy 18:00 · en 8 horas                              |
      | 4    | horas  | 2026-11-13T06:40:00 | 2026-11-13T10:00:00 | Vuelve hoy 10:40 · en 40 minutos                           |
      | 4    | horas  | 2026-11-13T06:40:00 | 2026-11-13T10:00:30 | Vuelve hoy 10:40 · en 40 minutos                           |
      | 4    | horas  | 2026-11-13T06:40:00 | 2026-11-13T10:39:30 | Vuelve hoy 10:40 · en 1 minuto                             |
      | 4    | horas  | 2026-11-13T07:00:00 | 2026-11-13T10:00:00 | Vuelve hoy 11:00 · en 1 hora                               |
      | 1    | dias   | 2026-11-13T08:00:00 | 2026-11-13T10:00:00 | Vuelve mañana 08:00 · en 22 horas                          |
      | 2    | horas  | 2026-11-12T23:00:00 | 2026-11-12T23:30:00 | Vuelve mañana 01:00 · en 2 horas                           |
      | 6    | dias   | 2026-11-13T08:00:00 | 2026-11-13T10:00:00 | Vuelve el jueves 19 08:00 · en 6 días                      |
      | 6    | dias   | 2026-11-27T08:00:00 | 2026-11-27T10:00:00 | Vuelve el jueves 3 de diciembre 08:00 · en 6 días          |
      | 6    | dias   | 2026-12-30T08:00:00 | 2026-12-30T10:00:00 | Vuelve el martes 5 de enero de 2027 08:00 · en 6 días      |

  # Texto de regreso 2
  # El texto avanza solo con el paso del tiempo: horas, minutos y, a las
  # 00:00, «mañana» pasa a «hoy».
  Scenario Outline: Texto de regreso 2
    Given Mostrar completadas está encendido
    And una tarea periódica relativa cada <cada> <unidad>
    And la tarea fue completada el <completada>
    When consulto Pendientes el <ahora>
    Then la fila de la tarea muestra el texto <texto>

    Examples:
      | cada | unidad | completada          | ahora               | texto                                |
      | 8    | horas  | 2026-11-13T22:00:00 | 2026-11-13T23:00:00 | Vuelve mañana 06:00 · en 7 horas     |
      | 8    | horas  | 2026-11-13T22:00:00 | 2026-11-14T00:00:00 | Vuelve hoy 06:00 · en 6 horas        |
      | 8    | horas  | 2026-11-13T22:00:00 | 2026-11-14T05:00:00 | Vuelve hoy 06:00 · en 1 hora         |
      | 8    | horas  | 2026-11-13T22:00:00 | 2026-11-14T05:01:00 | Vuelve hoy 06:00 · en 59 minutos     |

  # Texto de regreso 3
  # Calendario sin horario: 00:00 de N, sin hora. «Mañana» no lleva distancia
  # (fila 2: hasta un segundo antes de la medianoche); a 2 o más días,
  # «en N días» (filas 3 y 4); otro mes (fila 5) y otro año (fila 6).
  Scenario Outline: Texto de regreso 3
    Given una tarea periódica semanal los <dias> creada el <creada>
    When consulto Pendientes el <ahora>
    Then la fila de la tarea muestra el texto <texto>

    Examples:
      | dias    | creada              | ahora               | texto                                              |
      | sábado  | 2026-11-13T08:00:00 | 2026-11-13T10:00:00 | Vuelve mañana                                      |
      | sábado  | 2026-11-13T08:00:00 | 2026-11-13T23:59:59 | Vuelve mañana                                      |
      | domingo | 2026-11-13T08:00:00 | 2026-11-13T10:00:00 | Vuelve el domingo 15 · en 2 días                   |
      | jueves  | 2026-11-13T08:00:00 | 2026-11-13T10:00:00 | Vuelve el jueves 19 · en 6 días                    |
      | martes  | 2026-11-27T08:00:00 | 2026-11-27T10:00:00 | Vuelve el martes 1 de diciembre · en 4 días        |
      | lunes   | 2026-12-29T08:00:00 | 2026-12-30T10:00:00 | Vuelve el lunes 4 de enero de 2027 · en 5 días     |

  # Texto de regreso 4
  # Calendario mensual: 00:00 de N, sin hora.
  Scenario Outline: Texto de regreso 4
    Given una tarea periódica mensual los días <dias> creada el <creada>
    When consulto Pendientes el <ahora>
    Then la fila de la tarea muestra el texto <texto>

    Examples:
      | dias | creada              | ahora               | texto                              |
      | 14   | 2026-11-13T08:00:00 | 2026-11-13T10:00:00 | Vuelve mañana                      |
      | 20   | 2026-11-13T08:00:00 | 2026-11-13T10:00:00 | Vuelve el viernes 20 · en 7 días   |

  # Texto de regreso 5
  # Puntual con horario, fuera de la ventana: en espera hasta el desde de la
  # próxima; vuelve con hora. Fila 3: 22 horas y media es «en 23 horas».
  Scenario Outline: Texto de regreso 5
    Given una tarea puntual sin fecha límite creada el <creada>
    And la tarea se puede completar de <desde> a <hasta>
    When consulto Pendientes el <ahora>
    Then la fila de la tarea muestra el texto <texto>

    Examples:
      | creada              | desde | hasta | ahora               | texto                             |
      | 2026-11-13T12:00:00 | 08:00 | 11:00 | 2026-11-13T12:00:00 | Vuelve mañana 08:00 · en 20 horas |
      | 2026-11-13T06:00:00 | 08:00 | 11:00 | 2026-11-13T07:00:00 | Vuelve hoy 08:00 · en 1 hora      |
      | 2026-11-13T12:00:00 | 10:30 | 11:00 | 2026-11-13T12:00:00 | Vuelve mañana 10:30 · en 23 horas |

  # Texto de regreso 6
  # Relativa con horario completada: A, no V. Fila 1: V (el 14 a las 12:00)
  # cae fuera de la ventana y vuelve cuando abre (el 15 a las 08:00). Fila 3: V
  # cae dentro de la ventana y A = V.
  Scenario Outline: Texto de regreso 6
    Given Mostrar completadas está encendido
    And una tarea periódica relativa cada <cada> <unidad>
    And la tarea fue completada el <completada>
    And la tarea se puede completar de <desde> a <hasta>
    When consulto Pendientes el <ahora>
    Then la fila de la tarea muestra el texto <texto>

    Examples:
      | cada | unidad | completada          | desde | hasta | ahora               | texto                                  |
      | 1    | dias   | 2026-11-13T12:00:00 | 08:00 | 11:00 | 2026-11-13T12:00:00 | Vuelve el domingo 15 08:00 · en 2 días |
      | 12   | horas  | 2026-11-13T10:00:00 | 08:00 | 10:30 | 2026-11-13T10:00:00 | Vuelve mañana 08:00 · en 22 horas      |
      | 1    | dias   | 2026-11-13T10:00:00 | 08:00 | 11:00 | 2026-11-13T10:00:00 | Vuelve mañana 10:00 · en 24 horas      |

  # Texto de regreso 7
  # Calendario con horario: A (el inicio de N), con hora.
  Scenario Outline: Texto de regreso 7
    Given una tarea periódica semanal los <dias> creada el <creada>
    And la tarea se puede completar de <desde> a <hasta>
    When consulto Pendientes el <ahora>
    Then la fila de la tarea muestra el texto <texto>

    Examples:
      | dias   | creada              | desde | hasta | ahora               | texto                                 |
      | sábado | 2026-11-13T08:00:00 | 09:00 | 12:00 | 2026-11-13T10:00:00 | Vuelve mañana 09:00 · en 23 horas     |
      | jueves | 2026-11-13T08:00:00 | 09:00 | 12:00 | 2026-11-13T10:00:00 | Vuelve el jueves 19 09:00 · en 6 días |

  # Texto de regreso 8
  # Calendario con varios horarios completado: A, el inicio de N. Fila 1:
  # cubrió la ocurrencia de la mañana y vuelve a las 18:00. Fila 2: cubrió la de
  # la tarde y vuelve el viernes siguiente a las 07:00.
  Scenario Outline: Texto de regreso 8
    Given Mostrar completadas está encendido
    And una tarea periódica semanal los <dias>
    And la tarea tiene un completado del <completada> que cubre el <cubierta>
    And la tarea se puede completar de <desde> a <hasta> y de <desde2> a <hasta2>
    When consulto Pendientes el <ahora>
    Then la fila de la tarea muestra el texto <texto>

    Examples:
      | dias    | completada          | cubierta            | desde | hasta | desde2 | hasta2 | ahora               | texto                                  |
      | viernes | 2026-11-13T08:00:00 | 2026-11-13T07:00:00 | 07:00 | 10:00 | 18:00  | 21:00  | 2026-11-13T10:00:00 | Vuelve hoy 18:00 · en 8 horas          |
      | viernes | 2026-11-13T19:00:00 | 2026-11-13T18:00:00 | 07:00 | 10:00 | 18:00  | 21:00  | 2026-11-13T20:00:00 | Vuelve el viernes 20 07:00 · en 7 días |

  # Texto de regreso 9
  # Pospuesta: pospuesta.hasta, con hora, sin nombrar la posposición. «Hasta
  # mañana» es las 07:00 del día siguiente (fila 3).
  Scenario Outline: Texto de regreso 9
    Given una tarea puntual sin fecha límite
    And la tarea fue pospuesta con la opción <opcion> el <pospuesta>
    When consulto Pendientes el <ahora>
    Then la fila de la tarea muestra el texto <texto>

    Examples:
      | opcion       | pospuesta           | ahora               | texto                              |
      | 1 hora       | 2026-11-13T10:00:00 | 2026-11-13T10:00:00 | Vuelve hoy 11:00 · en 1 hora       |
      | 3 horas      | 2026-11-13T10:00:00 | 2026-11-13T10:00:00 | Vuelve hoy 13:00 · en 3 horas      |
      | hasta mañana | 2026-11-13T10:00:00 | 2026-11-13T10:00:00 | Vuelve mañana 07:00 · en 21 horas  |
      | 1 hora       | 2026-11-13T10:00:00 | 2026-11-13T10:20:00 | Vuelve hoy 11:00 · en 40 minutos   |

  # Texto de regreso 10
  # Una atrasada pospuesta está en espera: dice «Vuelve», no «Tocaba».
  Scenario Outline: Texto de regreso 10
    Given una tarea puntual con fecha límite <limite>
    And la tarea fue pospuesta con la opción <opcion> el <pospuesta>
    When consulto Pendientes el <ahora>
    Then la fila de la tarea muestra el texto <texto>

    Examples:
      | limite     | opcion       | pospuesta           | ahora               | texto                             |
      | 2026-11-10 | 3 horas      | 2026-11-13T10:00:00 | 2026-11-13T10:00:00 | Vuelve hoy 13:00 · en 3 horas     |
      | 2026-11-10 | hasta mañana | 2026-11-13T10:00:00 | 2026-11-13T10:00:00 | Vuelve mañana 07:00 · en 21 horas |

  # Texto de regreso 11
  # Dos causas: una relativa pospuesta a las 10:00 (hasta las 13:00) y
  # completada a las 10:30 está en espera por el intervalo y por la posposición;
  # vuelve cuando deja de estarlo, el más tarde de los dos. Fila 1: gana la
  # posposición (V = 11:30). Fila 2: lo mismo, ya vencido el intervalo y en
  # espera solo por la posposición. Fila 3: gana el intervalo (V = 18:30).
  Scenario Outline: Texto de regreso 11
    Given Mostrar completadas está encendido
    And una tarea periódica relativa cada <cada> <unidad>
    And la tarea fue pospuesta con la opción <opcion> el <pospuesta>
    And la tarea fue completada el <completada>
    When consulto Pendientes el <ahora>
    Then la fila de la tarea muestra el texto <texto>

    Examples:
      | cada | unidad | opcion  | pospuesta           | completada          | ahora               | texto                         |
      | 1    | horas  | 3 horas | 2026-11-13T10:00:00 | 2026-11-13T10:30:00 | 2026-11-13T10:30:00 | Vuelve hoy 13:00 · en 3 horas |
      | 1    | horas  | 3 horas | 2026-11-13T10:00:00 | 2026-11-13T10:30:00 | 2026-11-13T12:00:00 | Vuelve hoy 13:00 · en 1 hora  |
      | 8    | horas  | 3 horas | 2026-11-13T10:00:00 | 2026-11-13T10:30:00 | 2026-11-13T10:30:00 | Vuelve hoy 18:30 · en 8 horas |
