# mutation-stamp: sha256=d412c30db0598eaec3e7038b020349cd0a0819dfeed2a03846e9710476ea1a4c
# acceptance-mutation-manifest-begin
# {"version":1,"tested_at":"2026-11-13T21:57:16.019132492Z","feature_name":"Borrar tarea","feature_path":"features/borrar-tarea.feature","background_hash":"74234e98afe7498fb5daf1f36ac2d78acc339464f950703b8c019892f982b90b","implementation_hash":"sha256:91f0975fbef86739246719c2117f7b7f936523169bd49cf40f9272b7008e15d4","scenarios":[{"index":0,"name":"Borrar tarea 1","scenario_hash":"0335eb487498f00f4fc5d221032ddca9659b356c262538683326499d771f52bd","mutation_count":9,"result":{"Total":9,"Killed":9,"Survived":0,"Errors":0},"tested_at":"2026-11-13T21:57:16.019132492Z"},{"index":1,"name":"Borrar tarea 2","scenario_hash":"5a28bddeabb0e2e947a17b727ce164d49af1a8d3122fb185b6d45d63ea925d42","mutation_count":6,"result":{"Total":6,"Killed":6,"Survived":0,"Errors":0},"tested_at":"2026-11-13T21:57:16.019132492Z"},{"index":2,"name":"Borrar tarea 3","scenario_hash":"0c5160be1f06e716fa0228120994720e787e761e6c847e11ee51ce70f99ab137","mutation_count":1,"result":{"Total":1,"Killed":1,"Survived":0,"Errors":0},"tested_at":"2026-11-13T21:57:16.019132492Z"},{"index":3,"name":"Borrar tarea 4","scenario_hash":"de8b9fa79bdf0991c7663ea79d1a0ea3c4285ec8872ee8abb5919d50c706a0d3","mutation_count":11,"result":{"Total":11,"Killed":11,"Survived":0,"Errors":0},"tested_at":"2026-11-13T21:57:16.019132492Z"}]}
# acceptance-mutation-manifest-end

# Spec §6.2 (Borrar tarea) y §7 (Borrado de tareas). Borrar una tarea borra
# también todos sus completados, y solo los suyos (en un solo writeBatch).
# Un completado cuya tarea ya no existe (huérfano: otro dispositivo, sin
# conexión, completó una tarea que ya se borró) no cuenta para nada y se
# detecta para limpiarlo. La confirmación se verifica en la suite QA.
# Cada tarea se nombra por su título (una palabra). "Pendientes muestra en
# orden" da los títulos de arriba hacia abajo y la lista no tiene otras filas.
Feature: Borrar tarea

  # Borrar tarea 1
  # Borrar una relativa borra sus completados y deja los de otra tarea.
  Scenario Outline: Borrar tarea 1
    Given una tarea periódica relativa Regar cada <cada> <unidad>
    And la tarea Regar fue completada el <completada_regar>
    And la tarea Regar fue completada el <otra_regar>
    And una tarea puntual Pagar con fecha límite <limite>
    And la tarea Pagar fue completada el <completada_pagar>
    When borro la tarea Regar
    Then no existe la tarea Regar
    And no queda ningún completado de Regar
    And la tarea Pagar conserva un solo completado, del <completada_pagar_guardada>

    Examples:
      | cada | unidad | completada_regar    | otra_regar          | limite     | completada_pagar    | completada_pagar_guardada |
      | 2    | dias   | 2026-07-13T08:00:00 | 2026-07-15T08:00:00 | 2026-07-20 | 2026-07-14T10:00:00 | 2026-07-14T10:00:00       |

  # Borrar tarea 2
  # Borrar una semanal borra sus completados; la otra tarea sigue en
  # Pendientes con el mismo estado.
  Scenario Outline: Borrar tarea 2
    Given una tarea periódica semanal Basura los <dias>
    And la tarea Basura tiene un completado que cubre el <cubierta>
    And una tarea periódica relativa Regar cada <cada> <unidad>
    And la tarea Regar fue completada el <completada>
    When borro la tarea Basura
    And consulto Pendientes el <ahora>
    Then no existe la tarea Basura
    And no queda ningún completado de Basura
    And Pendientes muestra en orden <orden>

    Examples:
      | dias           | cubierta   | cada | unidad | completada          | ahora               | orden |
      | martes, jueves | 2026-07-14 | 4    | horas  | 2026-07-15T06:00:00 | 2026-07-15T12:00:00 | Regar |

  # Borrar tarea 3
  # Borrar una tarea nunca completada: deja de aparecer en Pendientes.
  Scenario Outline: Borrar tarea 3
    Given una tarea puntual Pagar con fecha límite <limite>
    And una tarea periódica relativa Regar nunca completada creada el <creada_regar>
    When borro la tarea Pagar
    And consulto Pendientes el <ahora>
    Then no existe la tarea Pagar
    And Pendientes muestra en orden <orden>

    Examples:
      | limite     | creada_regar        | ahora               | orden |
      | 2026-07-14 | 2026-07-13T08:00:00 | 2026-07-15T12:00:00 | Regar |

  # Borrar tarea 4
  # Completado huérfano: otro dispositivo, sin ver el borrado, completa la
  # tarea borrada. Se ignora en Pendientes y es el único que se detecta para
  # limpiar; los completados de las tareas que existen no.
  Scenario Outline: Borrar tarea 4
    Given una tarea periódica relativa Regar cada <cada> <unidad>
    And una tarea periódica semanal Basura los <dias>
    And la tarea Basura tiene un completado que cubre el <cubierta>
    When borro la tarea Regar
    And otro dispositivo, sin ver ese cambio, completa la tarea Regar el <completada>
    And consulto Pendientes el <ahora>
    Then no existe la tarea Regar
    And Pendientes muestra en orden <orden>
    And los completados huérfanos a limpiar son solo el de Regar del <completada_guardada>

    Examples:
      | cada | unidad | dias           | cubierta   | completada          | ahora               | orden  | completada_guardada |
      | 2    | dias   | martes, jueves | 2026-07-09 | 2026-07-15T09:00:00 | 2026-07-15T12:00:00 | Basura | 2026-07-15T09:00:00 |
