# mutation-stamp: sha256=4ca8e740e4f7627dbe129a4eb94d13310c63060adb904c79980313e42454ad9c
# acceptance-mutation-manifest-begin
# {"version":1,"tested_at":"2026-11-17T21:02:36.371034088Z","feature_name":"Panel en pestañas","feature_path":"features/panel-pestanas.feature","background_hash":"74234e98afe7498fb5daf1f36ac2d78acc339464f950703b8c019892f982b90b","implementation_hash":"sha256:a264fdccd0241b2c9fa95a5a0f2e9ee7f18da63057f61587101c131e00718030","scenarios":[{"index":0,"name":"Panel en pestañas 1","scenario_hash":"bacb3a9826088ef481dffa145d5e0c10f136ecc2120fc246673a419d91746283","mutation_count":6,"result":{"Total":6,"Killed":6,"Survived":0,"Errors":0},"tested_at":"2026-11-17T21:02:36.371034088Z"},{"index":1,"name":"Panel en pestañas 2","scenario_hash":"ab42e8acfc20f486848f728a92a44da21de5fc16b59dd9f97cd72238dc95d1cb","mutation_count":6,"result":{"Total":6,"Killed":6,"Survived":0,"Errors":0},"tested_at":"2026-11-17T21:02:36.371034088Z"},{"index":2,"name":"Panel en pestañas 3","scenario_hash":"47215513d57ba264afdc3daaf03d9d9f462c6350fa364297bd55875b54f919f5","mutation_count":16,"result":{"Total":16,"Killed":16,"Survived":0,"Errors":0},"tested_at":"2026-11-17T21:02:36.371034088Z"},{"index":3,"name":"Panel en pestañas 4","scenario_hash":"468aba33853015058bd64cde9b835688dec76a6441e28498227e456a8f546061","mutation_count":31,"result":{"Total":31,"Killed":31,"Survived":0,"Errors":0},"tested_at":"2026-11-17T21:02:36.371034088Z"},{"index":4,"name":"Panel en pestañas 5","scenario_hash":"6b3b08c343bbf65b01c3cc8d9f5e947b79a380489b205e4ce5239b054faf88f3","mutation_count":9,"result":{"Total":9,"Killed":9,"Survived":0,"Errors":0},"tested_at":"2026-11-17T21:02:36.371034088Z"}]}
# acceptance-mutation-manifest-end

# Spec §6.2 (Panel presentation, Tabs, Errors, On-screen keyboard).
# Only the rules that decide what is shown go here; the layout, the
# icons, the fixed controls, scrolling, full screen and
# "nothing is lost" are verified in the QA suite (qa/panel-mobile.md).
# "Phone" is a screen up to 40 rem wide (inclusive): the panel
# is presented "in tabs" (with full screen); above that, "in stacked
# sections". "The panel offers the sections" gives the tabs of the bar, from
# left to right, and "the open tab" the one shown when opening.
# The field with an error in the Tarea section is Título; those in Cuándo are due date,
# Cada, days and schedule. When saving fails, the panel
# jumps to the first tab with an error (Tarea before Cuándo, only in
# tabs: "ninguna" if there are none) and scrolls to the first field with
# an error, in the order the fields are shown: Título, due
# date, Cada, days, schedule. "The marked sections" are the ones that, while
# the error lasts, are distinguished in the tab bar, "ninguna" if there are none.
# "ninguno" in a list of fields means there are no errors.
Feature: Tabbed panel

  # Tabbed panel 1
  # The cutoff is 40 rem inclusive: exactly at 40 and below there are tabs;
  # a little above, stacked sections.
  Scenario Outline: Tabbed panel 1
    Given a screen <width> rem wide
    Then the panel is presented <presentation>

    Examples:
      | width | presentation        |
      | 22.5  | en pestañas         |
      | 39.9  | en pestañas         |
      | 40    | en pestañas         |
      | 40.1  | en secciones seguidas |
      | 80    | en secciones seguidas |

  # Tabbed panel 2
  # Creating does not offer Acciones (there are no actions); editing always offers it
  # (Borrar tarea is in every edit). It always opens on Tarea.
  Scenario Outline: Tabbed panel 2
    Given the panel opens for <mode>
    Then the panel offers the sections <sections>
    And the open tab is <open>

    Examples:
      | mode   | sections                | open  |
      | crear  | Tarea, Cuándo           | Tarea |
      | editar | Tarea, Cuándo, Acciones | Tarea |

  # Tabbed panel 3
  # The tab is marked while any of its fields shows an error.
  Scenario Outline: Tabbed panel 3
    Given the panel shows errors in the fields <fields>
    Then the marked sections are <marked>

    Examples:
      | fields                | marked      |
      | ninguno               | ninguna     |
      | Título                | Tarea       |
      | fecha límite          | Cuándo      |
      | Cada                  | Cuándo      |
      | días                  | Cuándo      |
      | horario               | Cuándo      |
      | Título, horario       | Tarea, Cuándo |
      | Título, días          | Tarea, Cuándo |

  # Tabbed panel 4
  # Guardar fails: on the phone it jumps to the first tab with an error (Tarea
  # before Cuándo) and scrolls down to the first field with an error; on wide
  # screens there are no tabs and it only scrolls to that field.
  Scenario Outline: Tabbed panel 4
    Given a screen <width> rem wide
    And saving fails with errors in the fields <fields>
    Then the panel jumps to the tab <tab>
    And the content scrolls to the field <field>

    Examples:
      | width | fields            | tab     | field      |
      | 22.5  | horario           | Cuándo  | horario    |
      | 22.5  | Título            | Tarea   | Título     |
      | 22.5  | horario, Título   | Tarea   | Título     |
      | 22.5  | horario, días     | Cuándo  | días       |
      | 22.5  | fecha límite      | Cuándo  | fecha límite |
      | 22.5  | Cada, horario     | Cuándo  | Cada       |
      | 40    | horario, Título   | Tarea   | Título     |
      | 40.1  | horario, Título   | ninguna | Título     |
      | 80    | Título, días      | ninguna | Título     |
      | 80    | horario           | ninguna | horario    |

  # Tabbed panel 5
  # Guardar is hidden only while the on-screen keyboard is open; a
  # field focused without an on-screen keyboard (on the computer, or a date or time
  # picker) does not hide it.
  Scenario Outline: Tabbed panel 5
    Given the on-screen keyboard is <keyboard>
    And the focus is <focus>
    Then the Guardar bar is <bar>

    Examples:
      | keyboard | focus                     | bar     |
      | abierto | un campo está enfocado    | oculta  |
      | cerrado | un campo está enfocado    | visible |
      | cerrado | ningún campo está enfocado| visible |
