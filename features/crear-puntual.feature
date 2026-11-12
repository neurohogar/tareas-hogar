# mutation-stamp: sha256=fedec687e7c50438e0418a6cbd0d963b23dfc12c95854dc70b601ecea7325c26
# acceptance-mutation-manifest-begin
# {"version":1,"tested_at":"2026-10-29T03:31:07.199025475Z","feature_name":"Crear tarea puntual","feature_path":"features/crear-puntual.feature","background_hash":"74234e98afe7498fb5daf1f36ac2d78acc339464f950703b8c019892f982b90b","implementation_hash":"sha256:92ffd231fd0230fed88f3e02eaca42bc75f8196bd8edc29e46afe23541e77cb9","scenarios":[{"index":0,"name":"Crear tarea puntual 1","scenario_hash":"03872e56c46fc6ee802ab26d9272a858fba02352c238fb0d537189fabf077197","mutation_count":18,"result":{"Total":18,"Killed":18,"Survived":0,"Errors":0},"tested_at":"2026-10-28T10:07:28.400464732Z"},{"index":1,"name":"Crear tarea puntual 2","scenario_hash":"2a68ae3d1d50a9bf13076a14dc411840e734d732aadf47af374cee18db2d9b09","mutation_count":4,"result":{"Total":4,"Killed":4,"Survived":0,"Errors":0},"tested_at":"2026-10-28T10:07:28.400464732Z"},{"index":2,"name":"Crear tarea puntual 3","scenario_hash":"c3f030b5489c1c7ad45307aa03338c041ed07b71f61267c39fbaacd0a4cfc56c","mutation_count":5,"result":{"Total":5,"Killed":5,"Survived":0,"Errors":0},"tested_at":"2026-10-28T10:07:28.400464732Z"},{"index":3,"name":"Crear tarea puntual 4","scenario_hash":"0b87204fb56d9f06fe966fa4b76d61548b137d5c1bf1d91064d8ee3325d16900","mutation_count":1,"result":{"Total":1,"Killed":1,"Survived":0,"Errors":0},"tested_at":"2026-10-28T10:07:28.400464732Z"}]}
# acceptance-mutation-manifest-end

# Spec §4.1. Crear una tarea puntual con título y fecha límite opcional
# (fecha sin hora, ISO-8601 AAAA-MM-DD, en la zona local del dispositivo).
# Validación: título no vacío (un título de solo espacios cuenta como vacío)
# y, si hay fecha límite, que sea una fecha que existe en el calendario.
# Se acepta una fecha límite anterior al día de creación: la tarea queda
# atrasada de entrada.
Feature: Crear tarea puntual

  # Crear tarea puntual 1
  # Con fecha límite: se crea la tarea puntual con esa fecha y sin completados.
  Scenario Outline: Crear tarea puntual 1
    When creo una tarea puntual con título <titulo> y fecha límite <fecha_limite>
    Then se crea una tarea puntual con título <titulo_guardado>
    And su fecha límite es <fecha_limite_guardada>
    And la tarea no tiene completados

    Examples:
      | titulo          | fecha_limite | titulo_guardado | fecha_limite_guardada |
      | Pagar la luz    | 2026-07-20   | Pagar la luz    | 2026-07-20            |
      | Comprar regalo  | 2026-12-31   | Comprar regalo  | 2026-12-31            |
      | Renovar seguro  | 2028-02-29   | Renovar seguro  | 2028-02-29            |

  # Crear tarea puntual 2
  # Sin fecha límite: se crea la tarea puntual sin fecha límite y sin completados.
  Scenario Outline: Crear tarea puntual 2
    When creo una tarea puntual con título <titulo> y sin fecha límite
    Then se crea una tarea puntual con título <titulo_guardado>
    And la tarea no tiene fecha límite
    And la tarea no tiene completados

    Examples:
      | titulo         | titulo_guardado |
      | Cambiar foco   | Cambiar foco    |
      | Llamar plomero | Llamar plomero  |

  # Crear tarea puntual 3
  # Fecha límite anterior al día de creación: se acepta y queda atrasada de entrada.
  Scenario Outline: Crear tarea puntual 3
    When creo el <creada> una tarea puntual con un título válido y fecha límite <fecha_limite>
    And consulto el estado el <creada>
    Then se crea una tarea puntual
    And el estado es atrasada

    Examples:
      | creada              | fecha_limite |
      | 2026-07-15T08:00:00 | 2026-07-14   |
      | 2026-08-01T00:00:00 | 2026-07-31   |

  # Crear tarea puntual 4
  # Título vacío: se rechaza y no se crea nada.
  Scenario Outline: Crear tarea puntual 4
    When creo una tarea puntual con título <titulo> y sin fecha límite
    Then la creación se rechaza por título vacío
    And no se crea ninguna tarea

    Examples:
      | titulo |
      |        |

  # Crear tarea puntual 5
  # Título de solo espacios: cuenta como vacío.
  Scenario: Crear tarea puntual 5
    When creo una tarea puntual con un título de solo espacios y sin fecha límite
    Then la creación se rechaza por título vacío
    And no se crea ninguna tarea

  # Crear tarea puntual 6
  # Fecha límite que no existe en el calendario: se rechaza y no se crea nada.
  Scenario Outline: Crear tarea puntual 6
    When creo una tarea puntual con un título válido y fecha límite <fecha_limite>
    Then la creación se rechaza por fecha límite inválida
    And no se crea ninguna tarea

    Examples:
      | fecha_limite |
      | 2026-02-29   |
      | 2026-04-31   |
      | 2026-13-01   |
      | 2026-00-10   |
      | 2026-07-00   |
