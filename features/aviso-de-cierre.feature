# mutation-stamp: sha256=e87c119ce733f2ef601f76e884e5fb35223e18b094e3933e8f350dc85caa5162
# acceptance-mutation-manifest-begin
# {"version":1,"tested_at":"2026-11-13T21:55:44.521699235Z","feature_name":"Aviso de cierre","feature_path":"features/aviso-de-cierre.feature","background_hash":"74234e98afe7498fb5daf1f36ac2d78acc339464f950703b8c019892f982b90b","implementation_hash":"sha256:42ba94d7407cb3a6a9d9fcc4452c5652e33155f43d330e1d550f6e606f52fbfb","scenarios":[{"index":0,"name":"Aviso de cierre 1","scenario_hash":"2c95f933e2bd4c15695c11251903fdba969c13ccf5ac340e0c8fff4efd566e83","mutation_count":4,"result":{"Total":4,"Killed":4,"Survived":0,"Errors":0},"tested_at":"2026-11-13T21:55:44.521699235Z"},{"index":1,"name":"Aviso de cierre 2","scenario_hash":"c850fbbc6641596939251b2297f422a2d85febe692af951e7ba7b4757b17d66b","mutation_count":3,"result":{"Total":3,"Killed":3,"Survived":0,"Errors":0},"tested_at":"2026-11-13T21:55:44.521699235Z"},{"index":2,"name":"Aviso de cierre 3","scenario_hash":"560478dcf16bcb1b1fd8cf2db24526e05b6fde376985b2b0d449446dcb899791","mutation_count":5,"result":{"Total":5,"Killed":5,"Survived":0,"Errors":0},"tested_at":"2026-11-13T21:55:44.521699235Z"},{"index":3,"name":"Aviso de cierre 4","scenario_hash":"479c7adf60f9c93521c5d7acc160639f45c52a365a500e2a9fa22513e3bbc9fe","mutation_count":10,"result":{"Total":10,"Killed":10,"Survived":0,"Errors":0},"tested_at":"2026-11-13T21:55:44.521699235Z"},{"index":4,"name":"Aviso de cierre 5","scenario_hash":"f683a2e4562d60112f3629e1085bcc68a23968c267a757ff181fcd635993c839","mutation_count":3,"result":{"Total":3,"Killed":3,"Survived":0,"Errors":0},"tested_at":"2026-11-13T21:55:44.521699235Z"},{"index":5,"name":"Aviso de cierre 6","scenario_hash":"c093cec33b3b155fc6029674f7cbda2918c8bbb914e249f7d23b5cf214814b23","mutation_count":3,"result":{"Total":3,"Killed":3,"Survived":0,"Errors":0},"tested_at":"2026-11-13T21:55:44.521699235Z"},{"index":6,"name":"Aviso de cierre 7","scenario_hash":"7038b3f841ef57b24c0f5af7316144af2cbc3c9d30133fd30aae431fbd8db8af","mutation_count":5,"result":{"Total":5,"Killed":5,"Survived":0,"Errors":0},"tested_at":"2026-11-13T21:55:44.521699235Z"},{"index":7,"name":"Aviso de cierre 8","scenario_hash":"2134260049e80680e9411a48420dff61c182a58414065535598550361384ce54","mutation_count":5,"result":{"Total":5,"Killed":5,"Survived":0,"Errors":0},"tested_at":"2026-11-13T21:55:44.521699235Z"},{"index":8,"name":"Aviso de cierre 9","scenario_hash":"fa79c2053c46373a4ccd379a3c710a0f7e3dd00ea15d730bf8ea8a6092d3accd","mutation_count":2,"result":{"Total":2,"Killed":2,"Survived":0,"Errors":0},"tested_at":"2026-11-13T21:55:44.521699235Z"},{"index":9,"name":"Aviso de cierre 10","scenario_hash":"53b17c1302a16b6708ee559907dc32ba4d4e82d76a93fb9514fcfda8f851a1ab","mutation_count":2,"result":{"Total":2,"Killed":2,"Survived":0,"Errors":0},"tested_at":"2026-11-13T21:55:44.521699235Z"},{"index":10,"name":"Aviso de cierre 11","scenario_hash":"c387cf12a46cb93a6c2b9a567d17ae46354a12b318c3b9cf3c2ef64f2a70742f","mutation_count":1,"result":{"Total":1,"Killed":1,"Survived":0,"Errors":0},"tested_at":"2026-11-13T21:55:44.521699235Z"}]}
# acceptance-mutation-manifest-end

# Spec §6.2 (Aviso de cierre, Si Guardar falla, Los avisos se abren sobre el
# panel, Si otro dispositivo borra la tarea, Descartar y Recientes) y §7
# (Borrado de tareas: gana el borrado). Cerrar con la X (o Atrás, ver
# atras-del-panel.feature) con cambios abre el aviso "Tenés cambios sin
# guardar" con tres botones: Seguir editando (deja el panel como estaba),
# Descartar (cierra sin guardar) y Guardar (guarda y, si guarda, cierra).
# Qué cuenta como "hay cambios" está en cambios-sin-guardar.feature. Lo que
# queda abierto lo da "queda abierto": nada, el panel, o el panel con el aviso.
# Que los avisos se abren sobre el panel, bloquean lo de abajo y al cerrarlos
# se vuelve a la misma pestaña sin perder nada (qué se ve) se verifica en la
# suite QA (qa/cambios-sin-guardar.md).
Feature: Aviso de cierre

  # Aviso de cierre 1
  # El aviso dice qué pasa y ofrece los tres botones, al editar y al crear.
  Scenario Outline: Aviso de cierre 1
    Given abro el panel para editar la tarea <titulo> con nota <nota>
    When escribo <valor> en el campo <campo>
    And toco la X del panel
    Then queda abierto <abierto>
    And el aviso dice <mensaje>
    And el aviso ofrece <botones>

    Examples:
      | titulo | nota | campo  | valor     | mensaje                    | botones                            | abierto |
      | Pagar  | Luz  | Título | Pagar luz | Tenés cambios sin guardar | Seguir editando, Descartar, Guardar | el panel con el aviso de cierre |

  # Aviso de cierre 2
  Scenario Outline: Aviso de cierre 2
    Given abro el panel para crear una tarea
    When escribo <valor> en el campo <campo>
    And toco la X del panel
    Then queda abierto <abierto>
    And el aviso ofrece <botones>

    Examples:
      | campo  | valor | botones                            | abierto |
      | Título | Pagar | Seguir editando, Descartar, Guardar | el panel con el aviso de cierre |

  # Aviso de cierre 3
  # Seguir editando cierra el aviso y deja el panel como estaba, con lo
  # escrito, sin guardar.
  Scenario Outline: Aviso de cierre 3
    Given abro el panel para editar la tarea <titulo> con nota <nota>
    When escribo <valor> en el campo <campo>
    And toco la X del panel
    And toco <boton> en el aviso
    Then queda abierto <abierto>
    And el campo <campo> sigue con <valor>
    And la tarea tiene título <guardado>

    Examples:
      | titulo | nota | campo  | valor     | boton           | abierto   | guardado |
      | Pagar  | Luz  | Título | Pagar luz | Seguir editando | el panel  | Pagar    |

  # Aviso de cierre 4
  # Descartar cierra el panel sin guardar; Guardar guarda y cierra.
  Scenario Outline: Aviso de cierre 4
    Given abro el panel para editar la tarea <titulo> con nota <nota>
    When escribo <valor> en el campo <campo>
    And toco la X del panel
    And toco <boton> en el aviso
    Then queda abierto <abierto>
    And la tarea tiene título <guardado>

    Examples:
      | titulo | nota | campo  | valor     | boton     | abierto | guardado  |
      | Pagar  | Luz  | Título | Pagar luz | Descartar | nada    | Pagar     |
      | Pagar  | Luz  | Título | Pagar luz | Guardar   | nada    | Pagar luz |

  # Aviso de cierre 5
  # Al crear, Descartar no crea nada.
  Scenario Outline: Aviso de cierre 5
    Given abro el panel para crear una tarea
    When escribo <valor> en el campo <campo>
    And toco la X del panel
    And toco <boton> en el aviso
    Then queda abierto <abierto>
    And no queda ninguna tarea

    Examples:
      | campo  | valor | boton     | abierto |
      | Título | Pagar | Descartar | nada    |

  # Aviso de cierre 6
  # Al crear, Guardar crea la tarea y cierra.
  Scenario Outline: Aviso de cierre 6
    Given abro el panel para crear una tarea
    When escribo <valor> en el campo <campo>
    And toco la X del panel
    And toco <boton> en el aviso
    Then queda abierto <abierto>
    And se crea una tarea puntual con título <valor>

    Examples:
      | campo  | valor | boton   | abierto |
      | Título | Pagar | Guardar | nada    |

  # Aviso de cierre 7
  # Si Guardar falla por validación, no se cierra nada: el aviso se cierra y
  # el panel sigue abierto con lo escrito; la tarea no cambia. Título vacío (y,
  # en el escenario siguiente, un texto de Etiquetas de más de 30 caracteres).
  Scenario Outline: Aviso de cierre 7
    Given abro el panel para editar la tarea <titulo> con nota <nota>
    When vacío el campo <campo>
    And toco la X del panel
    And toco <boton> en el aviso
    Then queda abierto <abierto>
    And la tarea tiene título <guardado>

    Examples:
      | titulo | nota | campo  | boton   | abierto  | guardado |
      | Pagar  | Luz  | Título | Guardar | el panel | Pagar    |

  # Aviso de cierre 8
  Scenario Outline: Aviso de cierre 8
    Given abro el panel para editar la tarea <titulo> con nota <nota>
    When escribo <valor> en el campo <campo>
    And toco la X del panel
    And toco <boton> en el aviso
    Then queda abierto <abierto>
    And la tarea tiene título <guardado>

    Examples:
      | titulo | nota | campo                   | valor                           | boton   | abierto  | guardado |
      | Pagar  | Luz  | Etiquetas sin confirmar | abcdefghijklmnopqrstuvwxyz12345 | Guardar | el panel | Pagar    |

  # Aviso de cierre 9
  # Si otro dispositivo borra la tarea con el aviso abierto, se cierran el
  # aviso y el panel sin pedir nada (gana el borrado).
  Scenario Outline: Aviso de cierre 9
    Given abro el panel para editar la tarea <titulo> con nota <nota>
    When escribo <valor> en el campo <campo>
    And toco la X del panel
    And otro dispositivo, sin ver ese cambio, borra la tarea
    Then queda abierto <abierto>
    And no existe la tarea <titulo>

    Examples:
      | titulo | nota | campo  | valor     | abierto |
      | Pagar  | Luz  | Título | Pagar luz | nada    |

  # Aviso de cierre 10
  # Si otro dispositivo borra la tarea con el panel abierto y cambios sin
  # guardar, el panel se cierra sin pedir nada.
  Scenario Outline: Aviso de cierre 10
    Given abro el panel para editar la tarea <titulo> con nota <nota>
    When escribo <valor> en el campo <campo>
    And otro dispositivo, sin ver ese cambio, borra la tarea
    Then queda abierto <abierto>

    Examples:
      | titulo | nota | campo  | valor     | abierto |
      | Pagar  | Luz  | Título | Pagar luz | nada    |

  # Aviso de cierre 11
  # Descartar no quita de Recientes un emoji elegido en el panel.
  Scenario Outline: Aviso de cierre 11
    Given que no hay emojis recientes
    And abro el panel para crear una tarea
    When elijo un emoji que no estaba entre los recientes
    And toco la X del panel
    And toco <boton> en el aviso
    Then el primero es el que elegí

    Examples:
      | boton     |
      | Descartar |
