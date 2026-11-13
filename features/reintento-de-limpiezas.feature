# mutation-stamp: sha256=140b10e1dfb7e55a30523b76017612f5c913514ea9590f859aea3ba093a16508
# acceptance-mutation-manifest-begin
# {"version":1,"tested_at":"2026-11-13T03:45:24.570923345Z","feature_name":"Reintento de limpiezas","feature_path":"features/reintento-de-limpiezas.feature","background_hash":"74234e98afe7498fb5daf1f36ac2d78acc339464f950703b8c019892f982b90b","implementation_hash":"sha256:5ffb49ab58be1582ec91d697d75dabb0a14d84e58cfb1d025aa47bfe109ddd96","scenarios":[{"index":0,"name":"Reintento de limpiezas 1","scenario_hash":"62d00d203a57db920e6a0b3f314e62282bc4892f6a9c5f068ddab186210802dd","mutation_count":29,"result":{"Total":29,"Killed":29,"Survived":0,"Errors":0},"tested_at":"2026-11-13T03:45:24.570923345Z"},{"index":1,"name":"Reintento de limpiezas 2","scenario_hash":"b5b8bf3b4ea1d8368cf5954838416b28304de48ee6477405692c6a8f27618ba0","mutation_count":8,"result":{"Total":8,"Killed":8,"Survived":0,"Errors":0},"tested_at":"2026-11-13T03:45:24.570923345Z"},{"index":2,"name":"Reintento de limpiezas 3","scenario_hash":"5b7e9a7bfb51c469b8ba6ac8cec3d43c256c1aee9fc29a515730abb7464ec6f6","mutation_count":8,"result":{"Total":8,"Killed":8,"Survived":0,"Errors":0},"tested_at":"2026-11-13T03:45:24.570923345Z"}]}
# acceptance-mutation-manifest-end

# Spec §7 (Limpiezas y reintentos). Las cuatro limpiezas (completados
# huérfanos, anotaciones huérfanas, referencias a etiquetas borradas y
# etiquetas duplicadas) se reintentan si un intento falla o no hay conexión.
# Se reintenta al volver la conexión y cuando cambian los datos, sin
# temporizadores. Cada elemento se intenta por separado: que uno falle (o que no
# haya conexión) no impide intentar los demás del lote.
# Los elementos por limpiar se nombran con un id corto (a1, a2, a3); "ninguno"
# es la lista vacía; las listas van separadas por ", ". "no hay conexión" es que
# todos los intentos fallan.
# Los reintentos silenciosos (sin aviso, contador ni indicador de pendientes,
# §7) y el aviso «No se pudo copiar» de Copiar (§6.7) se verifican en la suite
# QA (qa/reintento-y-aviso-de-copia.md): QA-only S4, S5, S6, S7.
Feature: Reintento de limpiezas

  # Reintento de limpiezas 1
  # Cada elemento se intenta por separado: los que fallan no impiden limpiar los
  # demás, y quedan por limpiar solo los que fallaron. Vale para las cuatro
  # limpiezas, también sin conexión (fallan todos).
  Scenario Outline: Reintento de limpiezas 1
    Given hay por limpiar <elementos> de <limpieza>
    And falla el intento de limpiar <fallan>
    When la app intenta las limpiezas
    Then quedan limpios <limpios>
    And quedan por limpiar <pendientes>

    Examples:
      | limpieza                          | elementos      | fallan         | limpios        | pendientes     |
      | completados huérfanos             | a1, a2, a3     | a2             | a1, a3         | a2             |
      | anotaciones huérfanas             | a1, a2, a3     | a1             | a2, a3         | a1             |
      | referencias a etiquetas borradas  | a1, a2, a3     | a3             | a1, a2         | a3             |
      | etiquetas duplicadas              | a1, a2, a3     | a1, a3         | a2             | a1, a3         |
      | anotaciones huérfanas             | a1, a2, a3     | a1, a2, a3     | ninguno        | a1, a2, a3     |
      | completados huérfanos             | a1, a2, a3     | ninguno        | a1, a2, a3     | ninguno        |

  # Reintento de limpiezas 2
  # Lo que quedó sin limpiar se reintenta al volver la conexión y cuando
  # cambian los datos; al reintentar no se pierde lo ya limpiado.
  Scenario Outline: Reintento de limpiezas 2
    Given hay por limpiar <elementos> de <limpieza>
    And falla el intento de limpiar <fallan>
    And la app intentó las limpiezas
    And deja de fallar el intento de limpiar <fallan>
    When sucede que <suceso>
    Then quedan limpios <elementos>
    And quedan por limpiar ninguno

    Examples:
      | limpieza                         | elementos  | fallan | suceso             |
      | completados huérfanos            | a1, a2, a3 | a2     | vuelve la conexión |
      | anotaciones huérfanas            | a1, a2, a3 | a2     | cambian los datos  |
      | referencias a etiquetas borradas | a1, a2, a3 | a1, a3 | vuelve la conexión |
      | etiquetas duplicadas             | a1, a2, a3 | a2     | cambian los datos  |

  # Reintento de limpiezas 3
  # Sin temporizadores: por más que pase el tiempo, sin conexión nueva ni
  # cambio de datos no se reintenta.
  Scenario Outline: Reintento de limpiezas 3
    Given hay por limpiar <elementos> de <limpieza>
    And falla el intento de limpiar <fallan>
    And la app intentó las limpiezas
    And deja de fallar el intento de limpiar <fallan>
    When pasan <minutos> minutos sin que suceda nada más
    Then quedan limpios <limpios>
    And quedan por limpiar <fallan>

    Examples:
      | limpieza              | elementos  | fallan | limpios | minutos |
      | anotaciones huérfanas | a1, a2, a3 | a2     | a1, a3  | 5       |
      | completados huérfanos | a1, a2, a3 | a2     | a1, a3  | 60      |
