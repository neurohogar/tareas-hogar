# mutation-stamp: sha256=4b8f27688112e1c05e00f1ed79534afbfc5bc44ea788b997155a4b4d84bf68d0
# acceptance-mutation-manifest-begin
# {"version":1,"tested_at":"2026-11-03T14:56:21.933076343Z","feature_name":"Panel en pestañas","feature_path":"features/panel-pestanas.feature","background_hash":"74234e98afe7498fb5daf1f36ac2d78acc339464f950703b8c019892f982b90b","implementation_hash":"sha256:2bfa58569b7319ecc67e5e9c135d8840c7bc646d2323f4370de0b298a469413c","scenarios":[{"index":0,"name":"Panel en pestañas 1","scenario_hash":"bacb3a9826088ef481dffa145d5e0c10f136ecc2120fc246673a419d91746283","mutation_count":6,"result":{"Total":6,"Killed":6,"Survived":0,"Errors":0},"tested_at":"2026-11-03T14:56:21.933076343Z"},{"index":1,"name":"Panel en pestañas 2","scenario_hash":"ab42e8acfc20f486848f728a92a44da21de5fc16b59dd9f97cd72238dc95d1cb","mutation_count":6,"result":{"Total":6,"Killed":6,"Survived":0,"Errors":0},"tested_at":"2026-11-03T14:56:21.933076343Z"},{"index":2,"name":"Panel en pestañas 3","scenario_hash":"d2fa4f5357d0581b2a0bc31f29322f4c7a818f91d43c8119cae91b6264555a3e","mutation_count":20,"result":{"Total":20,"Killed":20,"Survived":0,"Errors":0},"tested_at":"2026-11-03T14:56:21.933076343Z"},{"index":3,"name":"Panel en pestañas 4","scenario_hash":"eb5bc5f4773c36b10e0163e59bbc2a1f1d2f57bb316fd43580fc47715729e9a2","mutation_count":34,"result":{"Total":34,"Killed":34,"Survived":0,"Errors":0},"tested_at":"2026-11-03T14:56:21.933076343Z"},{"index":4,"name":"Panel en pestañas 5","scenario_hash":"6b3b08c343bbf65b01c3cc8d9f5e947b79a380489b205e4ce5239b054faf88f3","mutation_count":9,"result":{"Total":9,"Killed":9,"Survived":0,"Errors":0},"tested_at":"2026-11-03T14:56:21.933076343Z"}]}
# acceptance-mutation-manifest-end

# Spec §6.2 (Presentación del panel, Pestañas, Errores, Teclado en pantalla).
# Solo van acá las reglas que deciden qué se muestra; la disposición, los
# iconos, los controles fijos, el desplazamiento, la pantalla completa y
# "nada se pierde" se verifican en la suite QA (qa/panel-mobile.md).
# "Celular" es una pantalla de hasta 40 rem de ancho (inclusive): el panel
# se presenta "en pestañas" (con pantalla completa); por encima, "en secciones
# seguidas". "El panel ofrece las secciones" da las pestañas de la barra, de
# izquierda a derecha, y "la pestaña abierta" la que se ve al abrir.
# Los campos con error son Título y Etiquetas (sección Tarea) y fecha límite,
# Cada, días y horario (sección Cuándo). Cuando el guardado falla, el panel
# salta a la primera pestaña con error (Tarea antes que Cuándo, solo en
# pestañas: "ninguna" si no las hay) y se desplaza hasta el primer campo con
# error, en el orden en que se ven los campos: Título, Etiquetas, fecha
# límite, Cada, días, horario. "Las secciones marcadas" son las que mientras
# dure el error se distinguen en la barra de pestañas, "ninguna" si no hay.
# "ninguno" en una lista de campos es que no hay errores.
Feature: Panel en pestañas

  # Panel en pestañas 1
  # El corte es 40 rem inclusive: justo en 40 y por debajo hay pestañas;
  # un poco por encima, secciones seguidas.
  Scenario Outline: Panel en pestañas 1
    Given una pantalla de <ancho> rem de ancho
    Then el panel se presenta <presentacion>

    Examples:
      | ancho | presentacion        |
      | 22.5  | en pestañas         |
      | 39.9  | en pestañas         |
      | 40    | en pestañas         |
      | 40.1  | en secciones seguidas |
      | 80    | en secciones seguidas |

  # Panel en pestañas 2
  # Crear no ofrece Acciones (no hay acciones); editar la ofrece siempre
  # (Borrar tarea está en toda edición). Siempre abre en Tarea.
  Scenario Outline: Panel en pestañas 2
    Given el panel se abre para <modo>
    Then el panel ofrece las secciones <secciones>
    And la pestaña abierta es <abierta>

    Examples:
      | modo   | secciones               | abierta |
      | crear  | Tarea, Cuándo           | Tarea |
      | editar | Tarea, Cuándo, Acciones | Tarea |

  # Panel en pestañas 3
  # La pestaña se marca mientras alguno de sus campos muestra un error.
  Scenario Outline: Panel en pestañas 3
    Given el panel muestra errores en los campos <campos>
    Then las secciones marcadas son <marcadas>

    Examples:
      | campos                | marcadas    |
      | ninguno               | ninguna     |
      | Título                | Tarea       |
      | Etiquetas             | Tarea       |
      | fecha límite          | Cuándo      |
      | Cada                  | Cuándo      |
      | días                  | Cuándo      |
      | horario               | Cuándo      |
      | Título, Etiquetas     | Tarea       |
      | Título, horario       | Tarea, Cuándo |
      | Etiquetas, días       | Tarea, Cuándo |

  # Panel en pestañas 4
  # Guardar falla: en el celular salta a la primera pestaña con error (Tarea
  # antes que Cuándo) y baja hasta el primer campo con error; en pantallas
  # anchas no hay pestañas y solo se desplaza hasta ese campo.
  Scenario Outline: Panel en pestañas 4
    Given una pantalla de <ancho> rem de ancho
    And el guardado falla con errores en los campos <campos>
    Then el panel salta a la pestaña <pestana>
    And el contenido se desplaza hasta el campo <campo>

    Examples:
      | ancho | campos            | pestana | campo      |
      | 22.5  | horario           | Cuándo  | horario    |
      | 22.5  | Título            | Tarea   | Título     |
      | 22.5  | Etiquetas, Título | Tarea   | Título     |
      | 22.5  | horario, Etiquetas| Tarea   | Etiquetas  |
      | 22.5  | horario, días     | Cuándo  | días       |
      | 22.5  | fecha límite      | Cuándo  | fecha límite |
      | 22.5  | Cada, horario     | Cuándo  | Cada       |
      | 40    | horario, Título   | Tarea   | Título     |
      | 40.1  | horario, Título   | ninguna | Título     |
      | 80    | Etiquetas, días   | ninguna | Etiquetas  |
      | 80    | horario           | ninguna | horario    |

  # Panel en pestañas 5
  # Guardar solo se oculta mientras el teclado en pantalla está abierto; un
  # campo enfocado sin teclado en pantalla (en la compu, o un selector de
  # fecha u hora) no la oculta.
  Scenario Outline: Panel en pestañas 5
    Given el teclado en pantalla está <teclado>
    And el foco está <foco>
    Then la barra de Guardar está <barra>

    Examples:
      | teclado | foco                      | barra |
      | abierto | un campo está enfocado    | oculta  |
      | cerrado | un campo está enfocado    | visible |
      | cerrado | ningún campo está enfocado| visible |
