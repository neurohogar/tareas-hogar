# mutation-stamp: sha256=ec5d1f00b2321106e1d2147bb616a25564750d6349c47f1d40bbbcb66cd35050
# acceptance-mutation-manifest-begin
# {"version":1,"tested_at":"2026-11-19T12:45:31.650284505Z","feature_name":"Tabbed panel","feature_path":"features/panel-tabs.feature","background_hash":"74234e98afe7498fb5daf1f36ac2d78acc339464f950703b8c019892f982b90b","implementation_hash":"sha256:688b82814a1fae2291be67267f8d147ffc00735f71c5746b499d4e9c391feba1","scenarios":[{"index":0,"name":"Tabbed panel 1","scenario_hash":"853e5b7e2a9525ffab8d619757b33136d0fbd551fc08212bc8b5be6ca80a9af6","mutation_count":7,"result":{"Total":7,"Killed":7,"Survived":0,"Errors":0},"tested_at":"2026-11-19T12:45:31.650284505Z"},{"index":1,"name":"Tabbed panel 2","scenario_hash":"f0eac866b0182c56aa214f0cdf70ca9ddc145673c649cd34bc645620099996b7","mutation_count":6,"result":{"Total":6,"Killed":6,"Survived":0,"Errors":0},"tested_at":"2026-11-19T12:45:31.650284505Z"},{"index":2,"name":"Tabbed panel 3","scenario_hash":"7c2fc603e6d254e2224301a6e13e4adc6bfc2ce9494071f54bf58b42ef8c6aed","mutation_count":16,"result":{"Total":16,"Killed":16,"Survived":0,"Errors":0},"tested_at":"2026-11-19T12:45:31.650284505Z"},{"index":3,"name":"Tabbed panel 4","scenario_hash":"15cb1ac7e493128eae3491e21a573a72c2a798a132c6f93f1f40fa5379cd7d55","mutation_count":31,"result":{"Total":31,"Killed":31,"Survived":0,"Errors":0},"tested_at":"2026-11-19T12:45:31.650284505Z"},{"index":4,"name":"Tabbed panel 5","scenario_hash":"5e9a5aaf0ebc87127fa59577fd7ec4af8fd3b0f371c959a1c9013a77c77b2ed8","mutation_count":9,"result":{"Total":9,"Killed":9,"Survived":0,"Errors":0},"tested_at":"2026-11-19T12:45:31.650284505Z"}]}
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
