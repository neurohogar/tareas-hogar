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
