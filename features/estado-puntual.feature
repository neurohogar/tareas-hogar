# mutation-stamp: sha256=7060d5510ce0c12b086e2d8489bc8b6ee1a933ace866ad035844d62425f56318
# acceptance-mutation-manifest-begin
# {"version":1,"tested_at":"2026-11-02T19:27:27.082886457Z","feature_name":"Estado de tarea puntual","feature_path":"features/estado-puntual.feature","background_hash":"74234e98afe7498fb5daf1f36ac2d78acc339464f950703b8c019892f982b90b","implementation_hash":"sha256:92f0750ecf22392b86225e8bf2f49be15ee72a827c7e74e08cf1fabe5b8cd800","scenarios":[{"index":1,"name":"Estado de tarea puntual 2","scenario_hash":"b86a30071684ac96337c4a3ba49eeb43d72464274eef107fa88fb3e258c233b9","mutation_count":7,"result":{"Total":7,"Killed":7,"Survived":0,"Errors":0},"tested_at":"2026-11-02T19:27:27.082886457Z"},{"index":2,"name":"Estado de tarea puntual 3","scenario_hash":"b83df210edceb3eebb92a1aa8b7f52478db5d93118e17334a46b8c8ff645e38c","mutation_count":9,"result":{"Total":9,"Killed":9,"Survived":0,"Errors":0},"tested_at":"2026-11-02T19:27:27.082886457Z"}]}
# acceptance-mutation-manifest-end

# Spec §5.1. Estado derivado de una tarea puntual.
# Fechas y horas en la zona local del dispositivo; el día empieza a las 00:00.
# "hoy" es la fecha local de "ahora". La fecha límite cuenta como el día
# completo: hasta las 23:59:59 de ese día la tarea sigue pendiente.
#   Con al menos un completado: no aparece en Pendientes.
#   Sin completado y sin fecha límite: pendiente.
#   Sin completado y hoy ≤ fechaLimite: pendiente.
#   Sin completado y hoy > fechaLimite: atrasada.
# Una puntual nunca está en espera. creadaEn no influye en su estado.
Feature: Estado de tarea puntual

  # Estado de tarea puntual 1
  # Sin completado y sin fecha límite: pendiente, en cualquier momento.
  Scenario: Estado de tarea puntual 1
    Given una tarea puntual sin fecha límite
    When consulto el estado en cualquier momento
    Then el estado es pendiente

  # Estado de tarea puntual 2
  # Sin completado y hoy ≤ fechaLimite: pendiente.
  # Bordes: el primer y el último segundo del día límite, y el día anterior.
  Scenario Outline: Estado de tarea puntual 2
    Given una tarea puntual con fecha límite <fecha_limite>
    When consulto el estado el <ahora>
    Then el estado es pendiente

    Examples:
      | fecha_limite | ahora               |
      | 2026-07-15   | 2026-07-15T00:00:00 |
      | 2026-07-15   | 2026-07-15T23:59:59 |
      | 2026-07-15   | 2026-07-14T23:59:59 |
      | 2026-12-31   | 2026-12-31T12:00:00 |

  # Estado de tarea puntual 3
  # Sin completado y hoy > fechaLimite: atrasada.
  # Bordes: el primer segundo del día siguiente, fin de mes y fin de año.
  Scenario Outline: Estado de tarea puntual 3
    Given una tarea puntual con fecha límite <fecha_limite>
    When consulto el estado el <ahora>
    Then el estado es atrasada

    Examples:
      | fecha_limite | ahora               |
      | 2026-07-15   | 2026-07-16T00:00:00 |
      | 2026-07-31   | 2026-08-01T00:00:00 |
      | 2026-12-31   | 2027-01-01T00:00:00 |
      | 2026-07-15   | 2026-09-01T08:00:00 |

  # Estado de tarea puntual 4
  # Con un completado: no aparece en Pendientes, en cualquier momento.
  Scenario: Estado de tarea puntual 4
    Given una tarea puntual sin fecha límite
    And la tarea tiene un completado
    When consulto el estado en cualquier momento
    Then la tarea no aparece en Pendientes

  # Estado de tarea puntual 5
  # Con fecha límite y dos completados (por ejemplo, de dos dispositivos):
  # no aparece en Pendientes, ni antes ni después de la fecha límite.
  Scenario: Estado de tarea puntual 5
    Given una tarea puntual con una fecha límite cualquiera
    And la tarea tiene dos completados
    When consulto el estado en cualquier momento
    Then la tarea no aparece en Pendientes
