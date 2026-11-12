# mutation-stamp: sha256=ceeb8542d590e7003173f672c8f7c757f1756b877fe1e5040a43f6f12e422330
# acceptance-mutation-manifest-begin
# {"version":1,"tested_at":"2026-11-04T12:20:14.087412180Z","feature_name":"Pausar tarea","feature_path":"features/pausar-tarea.feature","background_hash":"74234e98afe7498fb5daf1f36ac2d78acc339464f950703b8c019892f982b90b","implementation_hash":"sha256:62e70b4711f9aee4f61ee379df69259461fbae0c61e886022b43eacd2006ffbd","scenarios":[{"index":0,"name":"Pausar tarea 1","scenario_hash":"ef72f322dc9d35a34cdd48984688d36e9417268fc3670a72b19a003b160da1c2","mutation_count":2,"result":{"Total":2,"Killed":2,"Survived":0,"Errors":0},"tested_at":"2026-11-04T12:20:14.087412180Z"},{"index":1,"name":"Pausar tarea 2","scenario_hash":"fb943038692fd8fe1522c1d80d46c9e3d00b29212dced7c964156903923c4432","mutation_count":2,"result":{"Total":2,"Killed":2,"Survived":0,"Errors":0},"tested_at":"2026-11-04T12:20:14.087412180Z"},{"index":3,"name":"Pausar tarea 4","scenario_hash":"74f1dfbd51303b301e2c186b062a6eef8c79531838471e70a2b9ee383d79a665","mutation_count":4,"result":{"Total":4,"Killed":4,"Survived":0,"Errors":0},"tested_at":"2026-11-04T12:20:14.087412180Z"},{"index":4,"name":"Pausar tarea 5","scenario_hash":"f5a658b1e5bbcbb23d875a74231188b7d340350400f52ed76999b08b03da931c","mutation_count":3,"result":{"Total":3,"Killed":3,"Survived":0,"Errors":0},"tested_at":"2026-11-04T12:20:14.087412180Z"},{"index":5,"name":"Pausar tarea 6","scenario_hash":"869c93294a5feb142cad4561e98ee8b9ac9abafe34481b54facea4ed4eff0b84","mutation_count":1,"result":{"Total":1,"Killed":1,"Survived":0,"Errors":0},"tested_at":"2026-11-04T12:20:14.087412180Z"},{"index":6,"name":"Pausar tarea 7","scenario_hash":"f21799ebd8b98cb7129181351f942809ee3f339adad8370abe7fad59245087ab","mutation_count":2,"result":{"Total":2,"Killed":2,"Survived":0,"Errors":0},"tested_at":"2026-11-04T12:20:14.087412180Z"},{"index":8,"name":"Pausar tarea 9","scenario_hash":"9da839a722724075f7c60fea1e1754e3ab47a72ab07b03add0dfa428b72c58b6","mutation_count":6,"result":{"Total":6,"Killed":6,"Survived":0,"Errors":0},"tested_at":"2026-11-04T12:20:14.087412180Z"},{"index":9,"name":"Pausar tarea 10","scenario_hash":"39692242584f177582f027e9135a822ca034ebd1bc6b88bbc41ff8edba8dc25e","mutation_count":9,"result":{"Total":9,"Killed":9,"Survived":0,"Errors":0},"tested_at":"2026-11-04T12:20:14.087412180Z"},{"index":10,"name":"Pausar tarea 11","scenario_hash":"2d80c38c2887844bf9a034a8a01e491b770766842292fba617a77cd84242c9cf","mutation_count":3,"result":{"Total":3,"Killed":3,"Survived":0,"Errors":0},"tested_at":"2026-11-04T12:20:14.087412180Z"},{"index":11,"name":"Pausar tarea 12","scenario_hash":"f94fae4ec1055d04902633ee7484c493942f54b67ebd58c3bb7d98da6cb19be4","mutation_count":1,"result":{"Total":1,"Killed":1,"Survived":0,"Errors":0},"tested_at":"2026-11-04T12:20:14.087412180Z"},{"index":12,"name":"Pausar tarea 13","scenario_hash":"eb3c3aac83b7794950583fca4b0354a88bd6d7b29b94f791358fbfaca5fe70d7","mutation_count":9,"result":{"Total":9,"Killed":9,"Survived":0,"Errors":0},"tested_at":"2026-11-04T12:20:14.087412180Z"}]}
# acceptance-mutation-manifest-end

# Spec §5.8 (Pausar), §4.1 (pausada), §6.2 (Pausar / Reanudar) y §7
# (pausar y reanudar escriben pausada y reanudadaEn juntos).
# Solo las periódicas se pueden pausar. Una pausada no tiene estado (no es
# pendiente, atrasada ni en espera), no se atrasa, no está completada y su
# checkbox está deshabilitado. Pausar no toca los completados; se siguen
# pudiendo borrar con la tarea pausada. Editar una pausada (Guardar) no la
# reanuda.
# "pauso la tarea" toca Pausar en el panel de edición: actúa en el momento,
# sin Guardar. "la tarea fue pausada" es una tarea ya pausada antes de
# cualquier otra fecha del escenario que no la nombre. "la tarea está
# pausada" afirma que tiene pausada; "la tarea no tiene estado", que al
# consultar no es pendiente, atrasada ni en espera.
# "el panel de edición ofrece <accion>" da el botón de pausa que se ve al
# editar la tarea: Pausar o Reanudar (con Reanudar, el panel dice "Pausada").
# Que el botón guarde y cierre el panel, que no exista al crear una tarea y
# el texto "Pausada" se verifican en la suite QA.
# Semana de referencia: lunes 2026-07-13 a domingo 2026-07-19.
Feature: Pausar tarea

  # Pausar tarea 1
  # Una relativa pausada no tiene estado, no está completada y su checkbox
  # está deshabilitado. Fila 1: sin pausa estaría en espera y completada.
  # Fila 2: sin pausa estaría atrasada.
  Scenario Outline: Pausar tarea 1
    Given una tarea periódica relativa cada <cada> <unidad>
    And la tarea fue completada el <completada>
    When pauso la tarea
    And consulto el estado el <ahora>
    Then la tarea está pausada
    And la tarea no tiene estado
    And la tarea no está completada
    And el checkbox de la tarea está deshabilitado

    Examples:
      | cada | unidad | completada          | ahora               |
      | 2    | dias   | 2026-07-15T09:00:00 | 2026-07-15T12:00:00 |
      | 2    | dias   | 2026-07-01T09:00:00 | 2026-07-15T12:00:00 |

  # Pausar tarea 2
  # Una semanal pausada nunca completada no tiene estado ni se atrasa,
  # aunque pasen sus ocurrencias. Fila 1: sin pausa estaría pendiente.
  # Fila 2: sin pausa estaría atrasada.
  Scenario Outline: Pausar tarea 2
    Given una tarea periódica semanal los <dias> creada el <creada>
    And la tarea fue pausada
    When consulto el estado el <ahora>
    Then la tarea no tiene estado
    And el checkbox de la tarea está deshabilitado

    Examples:
      | dias           | creada              | ahora               |
      | martes, jueves | 2026-07-13T08:00:00 | 2026-07-14T10:00:00 |
      | martes, jueves | 2026-07-13T08:00:00 | 2026-08-20T10:00:00 |

  # Pausar tarea 3
  # Una mensual pausada con completados no tiene estado (sin pausa estaría
  # pendiente) y no está completada.
  Scenario Outline: Pausar tarea 3
    Given una tarea periódica mensual los días <dias>
    And la tarea tiene un completado que cubre el <cubierta>
    And la tarea fue pausada
    When consulto el estado el <ahora>
    Then la tarea no tiene estado
    And la tarea no está completada

    Examples:
      | dias | cubierta   | ahora               |
      | 15   | 2026-06-15 | 2026-07-15T10:00:00 |

  # Pausar tarea 4
  # Con horario, la pausada tampoco tiene estado y su checkbox sigue
  # deshabilitado dentro de la ventana.
  Scenario Outline: Pausar tarea 4
    Given una tarea periódica relativa cada <cada> <unidad>
    And la tarea fue completada el <completada>
    And la tarea se puede completar de <desde> a <hasta>
    And la tarea fue pausada
    When consulto el estado el <ahora>
    Then la tarea no tiene estado
    And el checkbox de la tarea está deshabilitado

    Examples:
      | cada | unidad | completada          | desde | hasta | ahora               |
      | 1    | dias   | 2026-07-14T09:00:00 | 08:00 | 11:00 | 2026-07-15T09:00:00 |

  # Pausar tarea 5
  # Al editar una relativa no pausada, el panel ofrece Pausar.
  Scenario Outline: Pausar tarea 5
    Given una tarea periódica relativa cada <cada> <unidad>
    When abro la tarea en el panel de edición
    Then el panel de edición ofrece <accion>

    Examples:
      | cada | unidad | accion |
      | 2    | dias   | Pausar |

  # Pausar tarea 6
  # Al editar una de calendario no pausada, el panel ofrece Pausar.
  Scenario Outline: Pausar tarea 6
    Given una tarea periódica mensual los días <dias>
    When abro la tarea en el panel de edición
    Then el panel de edición ofrece <accion>

    Examples:
      | dias | accion |
      | 10   | Pausar |

  # Pausar tarea 7
  # Al editar una pausada, el panel ofrece Reanudar.
  Scenario Outline: Pausar tarea 7
    Given una tarea periódica semanal los <dias>
    And la tarea fue pausada
    When abro la tarea en el panel de edición
    Then el panel de edición ofrece <accion>

    Examples:
      | dias           | accion   |
      | martes, jueves | Reanudar |

  # Pausar tarea 8
  # Una puntual no se puede pausar: el panel no ofrece Pausar.
  Scenario: Pausar tarea 8
    Given una tarea puntual sin fecha límite
    When abro la tarea en el panel de edición
    Then el panel de edición no ofrece pausar

  # Pausar tarea 9
  # Editar una pausada (título, modo) la deja pausada.
  Scenario Outline: Pausar tarea 9
    Given una tarea periódica relativa <titulo> cada <cada> <unidad>
    And la tarea fue pausada
    When edito el título a <titulo_nuevo>
    And edito la tarea a periódica semanal los <dias>
    Then la tarea tiene título <titulo_guardado>
    And su recurrencia es semanal los <dias_guardados>
    And la tarea está pausada

    Examples:
      | titulo | cada | unidad | titulo_nuevo  | dias   | titulo_guardado | dias_guardados |
      | Regar  | 2    | dias   | Regar plantas | jueves | Regar plantas   | jueves         |

  # Pausar tarea 10
  # Pausar no toca los completados, y con la tarea pausada se pueden borrar;
  # sigue pausada.
  Scenario Outline: Pausar tarea 10
    Given una tarea periódica relativa cada <cada> <unidad>
    And la tarea fue completada el <primera>
    And la tarea fue completada el <segunda>
    When pauso la tarea
    And borro el completado del <segunda>
    Then la tarea conserva un solo completado, del <queda>
    And la tarea está pausada

    Examples:
      | cada | unidad | primera             | segunda             | queda               |
      | 2    | dias   | 2026-07-13T09:00:00 | 2026-07-15T09:00:00 | 2026-07-13T09:00:00 |

  # Pausar tarea 11
  # Pausar en un dispositivo y cambiar el título en otro: se conservan los
  # dos cambios.
  Scenario Outline: Pausar tarea 11
    Given una tarea periódica relativa <titulo> cada <cada> <unidad>
    When pauso la tarea
    And otro dispositivo, sin ver ese cambio, edita el título a <titulo_nuevo>
    Then la tarea tiene título <titulo_guardado>
    And la tarea está pausada

    Examples:
      | titulo | cada | unidad | titulo_nuevo  | titulo_guardado |
      | Regar  | 2    | dias   | Regar plantas | Regar plantas   |

  # Pausar tarea 12
  # Reanudar en un dispositivo y, después, pausar en otro que no vio la
  # reanudación: gana el último cambio, queda pausada.
  Scenario Outline: Pausar tarea 12
    Given una tarea periódica relativa cada <cada> <unidad>
    And la tarea fue pausada
    When reanudo la tarea el <reanudada>
    And otro dispositivo, sin ver ese cambio, pausa la tarea
    And consulto el estado el <ahora>
    Then la tarea está pausada
    And la tarea no tiene estado

    Examples:
      | cada | unidad | reanudada           | ahora               |
      | 2    | dias   | 2026-07-15T10:00:00 | 2026-07-15T12:00:00 |

  # Pausar tarea 13
  # Otro dispositivo, sin ver la pausa, completa la tarea: el completado se
  # guarda y la tarea sigue pausada, sin estado.
  Scenario Outline: Pausar tarea 13
    Given una tarea periódica relativa Regar cada <cada> <unidad>
    When pauso la tarea
    And otro dispositivo, sin ver ese cambio, completa la tarea Regar el <completada>
    And consulto el estado el <ahora>
    Then la tarea conserva un solo completado, del <completada_guardada>
    And la tarea está pausada
    And la tarea no tiene estado

    Examples:
      | cada | unidad | completada          | ahora               | completada_guardada |
      | 2    | dias   | 2026-07-15T09:00:00 | 2026-07-15T12:00:00 | 2026-07-15T09:00:00 |
