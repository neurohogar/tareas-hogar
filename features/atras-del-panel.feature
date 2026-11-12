# Spec §6.2 (Atrás). Atrás (botón de Android o gesto equivalente), con el panel
# abierto, cierra solo lo que esté más arriba, como si se tocara su salida, y
# deja el panel como estaba: el aviso de cierre o de acción equivale a Seguir
# editando, la confirmación de Borrar tarea a cancelar y el selector de emoji
# se cierra sin elegir. Con el panel solo arriba, Atrás lo cierra; con cambios
# sin guardar abre el aviso de cierre. El aviso de deshacer y las sugerencias
# de Etiquetas no cuentan como algo abierto. Con el teclado en pantalla
# abierto, el primer Atrás lo cierra el sistema y el panel sigue igual. Atrás
# no muestra la confirmación del navegador. Qué queda abierto lo da "queda
# abierto". Que Atrás no salga de la pantalla (Pendientes o Historial) y lo que
# pasa con el panel cerrado se verifican en la suite QA (qa/cambios-sin-guardar.md).
Feature: Atrás del panel

  # Atrás del panel 1
  # Atrás cierra solo lo que está arriba del panel, y el panel queda como
  # estaba.
  Scenario Outline: Atrás del panel 1
    Given el panel está abierto <cambios>
    And encima del panel hay <encima>
    When toco Atrás
    Then queda abierto <abierto>

    Examples:
      | cambios                  | encima                             | abierto  |
      | con cambios sin guardar  | el aviso de cierre                 | el panel |
      | con cambios sin guardar  | el aviso de acción                 | el panel |
      | con cambios sin guardar  | la confirmación de Borrar tarea    | el panel |
      | sin cambios              | la confirmación de Borrar tarea    | el panel |
      | con cambios sin guardar  | el selector de emoji               | el panel |
      | sin cambios              | el selector de emoji               | el panel |

  # Atrás del panel 2
  # Con el panel solo arriba: sin cambios lo cierra directo; con cambios abre
  # el aviso de cierre. Las sugerencias de Etiquetas no cuentan como algo
  # abierto.
  Scenario Outline: Atrás del panel 2
    Given el panel está abierto <cambios>
    And encima del panel hay <encima>
    When toco Atrás
    Then queda abierto <abierto>

    Examples:
      | cambios                  | encima                           | abierto                         |
      | sin cambios              | nada                             | nada                            |
      | con cambios sin guardar  | nada                             | el panel con el aviso de cierre |
      | con cambios sin guardar  | las sugerencias de Etiquetas     | el panel con el aviso de cierre |

  # Atrás del panel 3
  # El aviso de deshacer no cuenta: Atrás lo ignora y el aviso sigue.
  Scenario Outline: Atrás del panel 3
    Given el panel está abierto <cambios>
    And el aviso de deshacer está abierto
    When toco Atrás
    Then queda abierto <abierto>
    And el aviso de deshacer sigue abierto

    Examples:
      | cambios                  | abierto                         |
      | sin cambios              | nada                            |
      | con cambios sin guardar  | el panel con el aviso de cierre |

  # Atrás del panel 4
  # Un nuevo Atrás cierra el panel (o abre el aviso de cierre si queda con
  # cambios), después de haber cerrado lo de arriba.
  Scenario Outline: Atrás del panel 4
    Given el panel está abierto <cambios>
    And encima del panel hay <encima>
    When toco Atrás
    Then queda abierto <abierto_primero>
    When toco Atrás
    Then queda abierto <abierto>

    Examples:
      | cambios                  | encima                          | abierto                         | abierto_primero |
      | con cambios sin guardar  | el selector de emoji            | el panel con el aviso de cierre | el panel |
      | sin cambios              | el selector de emoji            | nada                            | el panel |
      | con cambios sin guardar  | la confirmación de Borrar tarea | el panel con el aviso de cierre | el panel |
      | con cambios sin guardar  | el aviso de cierre              | el panel con el aviso de cierre | el panel |
      | con cambios sin guardar  | el aviso de acción              | el panel con el aviso de cierre | el panel |

  # Atrás del panel 5
  # Con el teclado en pantalla abierto, el primer Atrás lo cierra el sistema y
  # el panel sigue igual; el siguiente aplica las reglas.
  Scenario Outline: Atrás del panel 5
    Given el panel está abierto <cambios>
    And el teclado en pantalla está abierto
    When toco Atrás
    Then queda abierto <abierto_primero>
    When toco Atrás
    Then queda abierto <abierto>

    Examples:
      | cambios                  | abierto                         | abierto_primero |
      | sin cambios              | nada                            | el panel |
      | con cambios sin guardar  | el panel con el aviso de cierre | el panel |

  # Atrás del panel 6
  # Atrás con el panel abierto nunca muestra la confirmación del navegador.
  Scenario Outline: Atrás del panel 6
    Given el panel está abierto <cambios>
    When toco Atrás
    Then el navegador <respuesta>

    Examples:
      | cambios                  | respuesta   |
      | con cambios sin guardar  | no pregunta |
