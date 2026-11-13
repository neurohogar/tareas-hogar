# mutation-stamp: sha256=d5ed6ea8390a1e998f7e4fa82b1408ef403833810f0d812cdde727fcd1fbedc1
# acceptance-mutation-manifest-begin
# {"version":1,"tested_at":"2026-11-13T22:07:08.466131480Z","feature_name":"Esfuerzo de tarea","feature_path":"features/esfuerzo-de-tarea.feature","background_hash":"74234e98afe7498fb5daf1f36ac2d78acc339464f950703b8c019892f982b90b","implementation_hash":"sha256:4bfa96c4425e929f319e769cda04fc6b925fc3d05e051ecb989c6a3d831b4e9f","scenarios":[{"index":0,"name":"Esfuerzo de tarea 1","scenario_hash":"055c11bcb3b35292314dd6265cb97295f6c0a9e3c3b16700d28513e565ca3830","mutation_count":16,"result":{"Total":16,"Killed":16,"Survived":0,"Errors":0},"tested_at":"2026-11-13T22:07:08.466131480Z"},{"index":1,"name":"Esfuerzo de tarea 2","scenario_hash":"3d3ed3a06d179cabf8e4f681cd965c851dad645c09ac50bb2aaedbfc4641a558","mutation_count":3,"result":{"Total":3,"Killed":3,"Survived":0,"Errors":0},"tested_at":"2026-11-13T22:07:08.466131480Z"},{"index":2,"name":"Esfuerzo de tarea 3","scenario_hash":"7b5d78760b26a4cc5f96e139c4c38b31429dc706e463eec91abddb09fded400e","mutation_count":6,"result":{"Total":6,"Killed":6,"Survived":0,"Errors":0},"tested_at":"2026-11-13T22:07:08.466131480Z"},{"index":3,"name":"Esfuerzo de tarea 4","scenario_hash":"e13804826d72f1338d252140e76bd55503c2fdc25103e7fc0a43aa717daa5df8","mutation_count":5,"result":{"Total":5,"Killed":5,"Survived":0,"Errors":0},"tested_at":"2026-11-13T22:07:08.466131480Z"},{"index":4,"name":"Esfuerzo de tarea 5","scenario_hash":"cbe42fcc4831737394a6a7ff49abd3b6479d047f4a4eb89aabd7ce4e7526a46e","mutation_count":12,"result":{"Total":12,"Killed":12,"Survived":0,"Errors":0},"tested_at":"2026-11-13T22:07:08.466131480Z"},{"index":5,"name":"Esfuerzo de tarea 6","scenario_hash":"7dbe38dce39ae91a8ba721b03210cc38f849e814b0043422047f43830a957747","mutation_count":3,"result":{"Total":3,"Killed":3,"Survived":0,"Errors":0},"tested_at":"2026-11-13T22:07:08.466131480Z"},{"index":6,"name":"Esfuerzo de tarea 7","scenario_hash":"b1991c7c9f6e7f3052de48a1373c5e51ba4c2bb169aab50349335f6b0f7372c9","mutation_count":6,"result":{"Total":6,"Killed":6,"Survived":0,"Errors":0},"tested_at":"2026-11-13T22:07:08.466131480Z"},{"index":7,"name":"Esfuerzo de tarea 8","scenario_hash":"0150a445a735ae057f67b947b50f0f73c789ef9a73703144f85fbea8bc311afd","mutation_count":1,"result":{"Total":1,"Killed":1,"Survived":0,"Errors":0},"tested_at":"2026-11-13T22:07:08.466131480Z"},{"index":8,"name":"Esfuerzo de tarea 9","scenario_hash":"9785afc31a9ed4b6feff9de2424b28b3f5a3bb04b9785b981f5065b481df6f33","mutation_count":10,"result":{"Total":10,"Killed":10,"Survived":0,"Errors":0},"tested_at":"2026-11-13T22:07:08.466131480Z"},{"index":9,"name":"Esfuerzo de tarea 10","scenario_hash":"7e7b785e1bee1971d9255da1244949b2c536c5af6d6b670451d2c11c108c6ea2","mutation_count":5,"result":{"Total":5,"Killed":5,"Survived":0,"Errors":0},"tested_at":"2026-11-13T22:07:08.466131480Z"},{"index":10,"name":"Esfuerzo de tarea 11","scenario_hash":"f4180bb440f033a613c35be9ccc93b59856fe6b8c6f77b1977c171290a8acacd","mutation_count":12,"result":{"Total":12,"Killed":12,"Survived":0,"Errors":0},"tested_at":"2026-11-13T22:07:08.466131480Z"}]}
# acceptance-mutation-manifest-end

# Spec §4.1 (campo esfuerzo), §6.1 (texto del nivel en la fila), §6.2
# (selector Esfuerzo) y §7 (Conflictos).
#   esfuerzo es opcional y vale rapida, media o larga; sin el campo, la tarea
#   está sin estimar. Cualquier tipo de tarea puede tenerlo.
#   El selector del panel empieza en "Sin estimar"; elegir "Sin estimar"
#   deja la tarea sin el campo.
#   La fila muestra el nivel en texto: "Rápida", "Media" o "Larga"; sin
#   esfuerzo, nada.
#   Conflictos: esfuerzo es un campo independiente, como titulo; gana el
#   último cambio, por campo. Cambiar el tipo no lo toca (no es un campo de
#   tipo).
# Los valores de esfuerzo en los pasos son rapida, media, larga o
# "sin estimar" (sin el campo). "con esfuerzo sin estimar" es una tarea sin
# el campo; "elijo el esfuerzo X" elige X en el selector del panel y guarda;
# "su esfuerzo es X" mira lo guardado. Que el selector ofrezca las cuatro
# opciones con sus textos ("Rápida (≤ 5 min)", ...) se verifica en la suite
# QA. Los cambios concurrentes llegan en el orden de los pasos: primero el
# mío, después el del otro dispositivo.
Feature: Esfuerzo de tarea

  # Esfuerzo de tarea 1
  # Crear una puntual con un esfuerzo lo guarda; con "Sin estimar", queda
  # sin el campo.
  Scenario Outline: Esfuerzo de tarea 1
    When creo una tarea puntual con título <titulo> y esfuerzo <esfuerzo>
    Then se crea una tarea puntual con título <titulo_guardado>
    And su esfuerzo es <esfuerzo_guardado>

    Examples:
      | titulo | esfuerzo    | titulo_guardado | esfuerzo_guardado |
      | Pagar  | rapida      | Pagar           | rapida            |
      | Pagar  | media       | Pagar           | media             |
      | Pagar  | larga       | Pagar           | larga             |
      | Pagar  | sin estimar | Pagar           | sin estimar       |

  # Esfuerzo de tarea 2
  # Sin tocar el selector (valor inicial "Sin estimar"), la tarea queda sin
  # estimar.
  Scenario Outline: Esfuerzo de tarea 2
    When creo una tarea puntual con título <titulo> y sin fecha límite
    Then se crea una tarea puntual con título <titulo_guardado>
    And su esfuerzo es <esfuerzo_guardado>

    Examples:
      | titulo | titulo_guardado | esfuerzo_guardado |
      | Pagar  | Pagar           | sin estimar       |

  # Esfuerzo de tarea 3
  # Una periódica relativa también puede tener esfuerzo.
  Scenario Outline: Esfuerzo de tarea 3
    When creo una tarea periódica relativa con título <titulo> cada <cada> <unidad> y esfuerzo <esfuerzo>
    Then se crea una tarea periódica con título <titulo_guardado>
    And su esfuerzo es <esfuerzo_guardado>

    Examples:
      | titulo | cada | unidad | esfuerzo | titulo_guardado | esfuerzo_guardado |
      | Regar  | 2    | dias   | rapida   | Regar           | rapida            |

  # Esfuerzo de tarea 4
  # Una periódica de calendario también puede tener esfuerzo.
  Scenario Outline: Esfuerzo de tarea 4
    When creo una tarea periódica semanal con título <titulo> los <dias> y esfuerzo <esfuerzo>
    Then se crea una tarea periódica con título <titulo_guardado>
    And su esfuerzo es <esfuerzo_guardado>

    Examples:
      | titulo | dias           | esfuerzo | titulo_guardado | esfuerzo_guardado |
      | Basura | martes, jueves | larga    | Basura          | larga             |

  # Esfuerzo de tarea 5
  # Editar el esfuerzo lo reemplaza. Fila 1: poner uno a una tarea sin
  # estimar. Fila 3: elegir "Sin estimar" quita el campo.
  Scenario Outline: Esfuerzo de tarea 5
    Given una tarea puntual sin fecha límite con esfuerzo <esfuerzo>
    When elijo el esfuerzo <esfuerzo_nuevo>
    Then su esfuerzo es <esfuerzo_guardado>

    Examples:
      | esfuerzo    | esfuerzo_nuevo | esfuerzo_guardado |
      | sin estimar | rapida         | rapida            |
      | rapida      | larga          | larga             |
      | media       | sin estimar    | sin estimar       |
      | larga       | media          | media             |

  # Esfuerzo de tarea 6
  # Cambiar el tipo de la tarea no toca el esfuerzo.
  Scenario Outline: Esfuerzo de tarea 6
    Given una tarea puntual sin fecha límite con esfuerzo <esfuerzo>
    When edito la tarea a periódica relativa cada <cada> <unidad>
    Then la tarea es periódica
    And su esfuerzo es <esfuerzo_guardado>

    Examples:
      | esfuerzo | cada | unidad | esfuerzo_guardado |
      | rapida   | 3    | dias   | rapida            |

  # Esfuerzo de tarea 7
  # La fila muestra el nivel en texto.
  Scenario Outline: Esfuerzo de tarea 7
    Given una tarea puntual sin fecha límite con esfuerzo <esfuerzo>
    When consulto Pendientes en cualquier momento
    Then la fila de la tarea muestra el esfuerzo <texto>

    Examples:
      | esfuerzo | texto  |
      | rapida   | Rápida |
      | media    | Media  |
      | larga    | Larga  |

  # Esfuerzo de tarea 8
  # Sin esfuerzo, la fila no muestra ningún nivel.
  Scenario Outline: Esfuerzo de tarea 8
    Given una tarea puntual sin fecha límite con esfuerzo <esfuerzo>
    When consulto Pendientes en cualquier momento
    Then la fila de la tarea no muestra esfuerzo

    Examples:
      | esfuerzo    |
      | sin estimar |

  # Esfuerzo de tarea 9
  # Esfuerzo y título son campos distintos: se combinan los dos cambios, en
  # los dos sentidos.
  Scenario Outline: Esfuerzo de tarea 9
    Given una tarea puntual sin fecha límite con esfuerzo <esfuerzo>
    When edito el título a <titulo_nuevo>
    And otro dispositivo, sin ver ese cambio, elige el esfuerzo <esfuerzo_otro>
    Then la tarea tiene título <titulo_guardado>
    And su esfuerzo es <esfuerzo_guardado>

    Examples:
      | esfuerzo    | titulo_nuevo | esfuerzo_otro | titulo_guardado | esfuerzo_guardado |
      | sin estimar | Pagar la luz | rapida        | Pagar la luz    | rapida            |
      | media       | Pagar la luz | sin estimar   | Pagar la luz    | sin estimar       |

  # Esfuerzo de tarea 10
  # Elegir el esfuerzo no pisa un título que otro dispositivo cambió.
  Scenario Outline: Esfuerzo de tarea 10
    Given una tarea puntual sin fecha límite con esfuerzo <esfuerzo>
    When elijo el esfuerzo <esfuerzo_nuevo>
    And otro dispositivo, sin ver ese cambio, edita el título a <titulo_otro>
    Then la tarea tiene título <titulo_guardado>
    And su esfuerzo es <esfuerzo_guardado>

    Examples:
      | esfuerzo | esfuerzo_nuevo | titulo_otro  | titulo_guardado | esfuerzo_guardado |
      | larga    | rapida         | Pagar el gas | Pagar el gas    | rapida            |

  # Esfuerzo de tarea 11
  # El mismo campo: gana el último cambio en llegar, también si es quitarlo
  # (fila 2) o ponerlo después de que yo lo quité (fila 3).
  Scenario Outline: Esfuerzo de tarea 11
    Given una tarea puntual sin fecha límite con esfuerzo <esfuerzo>
    When elijo el esfuerzo <esfuerzo_nuevo>
    And otro dispositivo, sin ver ese cambio, elige el esfuerzo <esfuerzo_otro>
    Then su esfuerzo es <esfuerzo_guardado>

    Examples:
      | esfuerzo | esfuerzo_nuevo | esfuerzo_otro | esfuerzo_guardado |
      | media    | rapida         | larga         | larga             |
      | media    | rapida         | sin estimar   | sin estimar       |
      | media    | sin estimar    | larga         | larga             |
