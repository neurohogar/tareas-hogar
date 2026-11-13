# mutation-stamp: sha256=912a129b08d117024ff416b3648b1a57082ae6b56b8f5c4c5008a64329cf5357
# acceptance-mutation-manifest-begin
# {"version":1,"tested_at":"2026-11-13T00:03:24.279760832Z","feature_name":"Atrás del panel","feature_path":"features/atras-del-panel.feature","background_hash":"74234e98afe7498fb5daf1f36ac2d78acc339464f950703b8c019892f982b90b","implementation_hash":"sha256:f31e6b14a32933a1fd74a174600f1bfc00648731ee882b5ccbe5719c13185629","scenarios":[{"index":0,"name":"Atrás del panel 1","scenario_hash":"c39fa8b6a438fd4aa9bbfaebdffedd9901561ab1d0d5ed75a780a7317f17cd0c","mutation_count":18,"result":{"Total":18,"Killed":18,"Survived":0,"Errors":0},"tested_at":"2026-11-13T00:03:24.279760832Z"},{"index":1,"name":"Atrás del panel 2","scenario_hash":"5c34fb9014f40a09f071559f55d299681343ec9940a8e07b9845b5c283acacab","mutation_count":9,"result":{"Total":9,"Killed":9,"Survived":0,"Errors":0},"tested_at":"2026-11-13T00:03:24.279760832Z"},{"index":2,"name":"Atrás del panel 3","scenario_hash":"037e20bf6695d6be6c86bd332a6667f6153b9cfbb5ae7fcbf0e8f2274027fb03","mutation_count":4,"result":{"Total":4,"Killed":4,"Survived":0,"Errors":0},"tested_at":"2026-11-13T00:03:24.279760832Z"},{"index":3,"name":"Atrás del panel 4","scenario_hash":"fd5ddea85e7326997c8b729cf5eda86236af57149c4a4faa54085eea3e3d5d74","mutation_count":20,"result":{"Total":20,"Killed":20,"Survived":0,"Errors":0},"tested_at":"2026-11-13T00:03:24.279760832Z"},{"index":4,"name":"Atrás del panel 5","scenario_hash":"6708fbc2ca8a45f7a34b4bba4abe7f8fdf1fabb7cac30edb2c508e9f5909b4be","mutation_count":6,"result":{"Total":6,"Killed":6,"Survived":0,"Errors":0},"tested_at":"2026-11-13T00:03:24.279760832Z"},{"index":5,"name":"Atrás del panel 6","scenario_hash":"6e269275fdfcf3b9933219388dc64afb491b783df687739e34ed3640ea46c43f","mutation_count":2,"result":{"Total":2,"Killed":2,"Survived":0,"Errors":0},"tested_at":"2026-11-13T00:03:24.279760832Z"}]}
# acceptance-mutation-manifest-end

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
