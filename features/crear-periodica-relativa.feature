# mutation-stamp: sha256=81a90e24ab5c40c668baa8b74556e6e9c29c9637549b7c725f667c9db134ff4f
# acceptance-mutation-manifest-begin
# {"version":1,"tested_at":"2026-10-29T03:31:05.178094605Z","feature_name":"Crear periódica relativa","feature_path":"features/crear-periodica-relativa.feature","background_hash":"74234e98afe7498fb5daf1f36ac2d78acc339464f950703b8c019892f982b90b","implementation_hash":"sha256:02f1bb2a722f883e807b173a5dc8ebf179061e4d3da9010e85e8f1add0a5e489","scenarios":[{"index":0,"name":"Crear periódica relativa 1","scenario_hash":"5b2b21f266b76ca351a127148c6134adfb94aa109509e1c8d45110f70ae09ed5","mutation_count":20,"result":{"Total":20,"Killed":20,"Survived":0,"Errors":0},"tested_at":"2026-10-28T10:07:17.241238649Z"},{"index":1,"name":"Crear periódica relativa 2","scenario_hash":"060cc329cff5570332e3dc342b95fd1b7632b625bf1908b43512c1009c902bd7","mutation_count":1,"result":{"Total":1,"Killed":1,"Survived":0,"Errors":0},"tested_at":"2026-10-28T10:07:17.241238649Z"},{"index":3,"name":"Crear periódica relativa 4","scenario_hash":"24f0154a4e19ee97a4720137866c8b0bbe6d828766df21bcdc1e02d22d337d58","mutation_count":1,"result":{"Total":1,"Killed":1,"Survived":0,"Errors":0},"tested_at":"2026-10-28T10:07:17.241238649Z"}]}
# acceptance-mutation-manifest-end

# Spec §4.1 y §4.2 (Relativa). Crear una periódica relativa con título y
# "cada N horas|dias". Validación: título no vacío (un título de solo espacios
# cuenta como vacío) y N entero ≥ 1.
Feature: Crear periódica relativa

  # Crear periódica relativa 1
  # Datos válidos: se crea la tarea periódica con su recurrencia relativa y sin completados.
  Scenario Outline: Crear periódica relativa 1
    When creo una tarea periódica relativa con título <titulo> cada <cada> <unidad>
    Then se crea una tarea periódica con título <titulo_guardado>
    And su recurrencia es relativa cada <cada_guardado> <unidad>
    And la tarea no tiene completados

    Examples:
      | titulo          | cada | unidad | titulo_guardado | cada_guardado |
      | Limpiar el baño | 1    | horas  | Limpiar el baño | 1             |
      | Regar plantas   | 3    | dias   | Regar plantas   | 3             |
      | Cambiar sábanas | 14   | dias   | Cambiar sábanas | 14            |
      | Ventilar        | 36   | horas  | Ventilar        | 36            |

  # Crear periódica relativa 2
  # Título vacío: se rechaza y no se crea nada.
  Scenario Outline: Crear periódica relativa 2
    When creo una tarea periódica relativa con título <titulo> y un intervalo válido
    Then la creación se rechaza por título vacío
    And no se crea ninguna tarea

    Examples:
      | titulo |
      |        |

  # Crear periódica relativa 3
  # Título de solo espacios: cuenta como vacío.
  Scenario: Crear periódica relativa 3
    When creo una tarea periódica relativa con un título de solo espacios y un intervalo válido
    Then la creación se rechaza por título vacío
    And no se crea ninguna tarea

  # Crear periódica relativa 4
  # N que no es entero ≥ 1: se rechaza y no se crea nada.
  Scenario Outline: Crear periódica relativa 4
    When creo una tarea periódica relativa con un título válido y <cada> como cantidad del intervalo
    Then la creación se rechaza por intervalo inválido
    And no se crea ninguna tarea

    Examples:
      | cada |
      | 0    |
      | 1.5  |
