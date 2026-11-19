# mutation-stamp: sha256=c477c9e21fab82476f01657c6b8d98823a8a3460c416a3559d3a2dbd28499866
# acceptance-mutation-manifest-begin
# {"version":1,"tested_at":"2026-11-17T21:10:04.382212215Z","feature_name":"Reintento de limpiezas","feature_path":"features/reintento-de-limpiezas.feature","background_hash":"74234e98afe7498fb5daf1f36ac2d78acc339464f950703b8c019892f982b90b","implementation_hash":"sha256:5ffb49ab58be1582ec91d697d75dabb0a14d84e58cfb1d025aa47bfe109ddd96","scenarios":[{"index":0,"name":"Reintento de limpiezas 1","scenario_hash":"1c5a363f023de89607d97710481dc32c38cd98c1eeef18c8aab130b1a5a929a7","mutation_count":19,"result":{"Total":19,"Killed":19,"Survived":0,"Errors":0},"tested_at":"2026-11-17T21:10:04.382212215Z"},{"index":1,"name":"Reintento de limpiezas 2","scenario_hash":"193c88bb4b24bf76cbe732424581eb4868062ffb824b2c8a6f14b79a5ed2a48b","mutation_count":4,"result":{"Total":4,"Killed":4,"Survived":0,"Errors":0},"tested_at":"2026-11-17T21:10:04.382212215Z"},{"index":2,"name":"Reintento de limpiezas 3","scenario_hash":"5b7e9a7bfb51c469b8ba6ac8cec3d43c256c1aee9fc29a515730abb7464ec6f6","mutation_count":8,"result":{"Total":8,"Killed":8,"Survived":0,"Errors":0},"tested_at":"2026-11-17T21:10:04.382212215Z"}]}
# acceptance-mutation-manifest-end

# Spec §7 (Limpiezas y reintentos). Las dos limpiezas (completados
# huérfanos y anotaciones huérfanas) se reintentan si un intento falla o no hay conexión.
# Se reintenta al volver la conexión y cuando cambian los datos, sin
# temporizadores. Cada elemento se intenta por separado: que uno falle (o que no
# haya conexión) no impide intentar los demás del lote.
# Los elementos por limpiar se nombran con un id corto (a1, a2, a3); "ninguno"
# es la lista vacía; las listas van separadas por ", ". "no hay conexión" es que
# todos los intentos fallan.
# Los reintentos silenciosos (sin aviso, contador ni indicador de pendientes,
# §7) y el aviso «No se pudo copiar» de Copiar (§6.7) se verifican en la suite
# QA (qa/reintento-y-aviso-de-copia.md): QA-only S4, S5, S6, S7.
Feature: Cleanups retry

  # Reintento de limpiezas 1
  # Cada elemento se intenta por separado: los que fallan no impiden limpiar los
  # demás, y quedan por limpiar solo los que fallaron. Vale para las dos
  # limpiezas, también sin conexión (fallan todos).
  Scenario Outline: Cleanups retry 1
    Given <items> of <cleanup> are left to clean
    And the attempt to clean fails: <failing>
    When the app attempts the cleanups
    Then the items left clean are <clean>
    And the items left to clean are <pending>

    Examples:
      | cleanup                           | items          | failing        | clean          | pending        |
      | completados huérfanos             | a1, a2, a3     | a2             | a1, a3         | a2             |
      | anotaciones huérfanas             | a1, a2, a3     | a1             | a2, a3         | a1             |
      | anotaciones huérfanas             | a1, a2, a3     | a1, a2, a3     | ninguno        | a1, a2, a3     |
      | completados huérfanos             | a1, a2, a3     | ninguno        | a1, a2, a3     | ninguno        |

  # Reintento de limpiezas 2
  # Lo que quedó sin limpiar se reintenta al volver la conexión y cuando
  # cambian los datos; al reintentar no se pierde lo ya limpiado.
  Scenario Outline: Cleanups retry 2
    Given <items> of <cleanup> are left to clean
    And the attempt to clean fails: <failing>
    And the app attempted the cleanups
    And the attempt to clean stops failing: <failing>
    When this happens: <event>
    Then the items left clean are <items>
    And the items left to clean are none

    Examples:
      | cleanup                          | items      | failing | event              |
      | completados huérfanos            | a1, a2, a3 | a2     | vuelve la conexión |
      | anotaciones huérfanas            | a1, a2, a3 | a2     | cambian los datos  |

  # Reintento de limpiezas 3
  # Sin temporizadores: por más que pase el tiempo, sin conexión nueva ni
  # cambio de datos no se reintenta.
  Scenario Outline: Cleanups retry 3
    Given <items> of <cleanup> are left to clean
    And the attempt to clean fails: <failing>
    And the app attempted the cleanups
    And the attempt to clean stops failing: <failing>
    When <minutes> minutes pass with nothing else happening
    Then the items left clean are <clean>
    And the items left to clean are <failing>

    Examples:
      | cleanup               | items      | failing | clean   | minutes |
      | anotaciones huérfanas | a1, a2, a3 | a2     | a1, a3  | 5       |
      | completados huérfanos | a1, a2, a3 | a2     | a1, a3  | 60      |
