# mutation-stamp: sha256=91471d3efe04df12cf65dfefa6284b4a7b19bccef3dcf2a8dd21686a61473f3b
# acceptance-mutation-manifest-begin
# {"version":1,"tested_at":"2026-11-19T12:03:21.342790124Z","feature_name":"Anotaciones","feature_path":"features/anotaciones.feature","background_hash":"74234e98afe7498fb5daf1f36ac2d78acc339464f950703b8c019892f982b90b","implementation_hash":"sha256:10df9e86994b44076e6685d937c3c1bc3de0ade98fd219433c580a13fdfc5410","scenarios":[{"index":0,"name":"Anotaciones 1","scenario_hash":"e3882aa60d75b9b33f36a4a561b608706819e3a91a60d6899de0ae30f540228d","mutation_count":25,"result":{"Total":25,"Killed":25,"Survived":0,"Errors":0},"tested_at":"2026-11-19T12:03:21.342790124Z"},{"index":1,"name":"Anotaciones 2","scenario_hash":"6709b19d17c33ff248e698384d1620ead19e99f7b0b2bc090b2f33f0e88db0ae","mutation_count":47,"result":{"Total":47,"Killed":47,"Survived":0,"Errors":0},"tested_at":"2026-11-19T12:03:21.342790124Z"},{"index":2,"name":"Anotaciones 3","scenario_hash":"f2ed8b1fac2873088cacaa3ecb1ca05490144f24fdc00ba8e14198a6a2918d8c","mutation_count":20,"result":{"Total":20,"Killed":20,"Survived":0,"Errors":0},"tested_at":"2026-11-19T12:03:21.342790124Z"},{"index":3,"name":"Anotaciones 4","scenario_hash":"c4bdbdf7d9ca1bdf5177329a3922f3f990742e1c8675d1097efbaac8edca1752","mutation_count":11,"result":{"Total":11,"Killed":11,"Survived":0,"Errors":0},"tested_at":"2026-11-19T12:03:21.342790124Z"},{"index":5,"name":"Anotaciones 6","scenario_hash":"6df5244947fa218a14f1b961be1638fb962cd85ecb7812109783d7e3d66e5462","mutation_count":10,"result":{"Total":10,"Killed":10,"Survived":0,"Errors":0},"tested_at":"2026-11-19T12:03:21.342790124Z"},{"index":6,"name":"Anotaciones 7","scenario_hash":"debcbc4ee8cd30b8ef889f8005cf3ba5133d890886a068c9fcb5a3cbb81a3977","mutation_count":13,"result":{"Total":13,"Killed":13,"Survived":0,"Errors":0},"tested_at":"2026-11-19T12:03:21.342790124Z"}]}
# acceptance-mutation-manifest-end

# Spec §6.7 (Anotaciones), §4.5 and §5.10. The screen lists all the
# annotations, with an existing task or without a task, from the most recent to the oldest
# by anotadaEn (if tied, the one with the lower id first), grouped by local
# day with the same headings as Historial: "Hoy", "Ayer" or "<weekday>
# <number> de <month>", with " de <year>" if the year is not the current one.
# Each annotation shows the time HH:MM in 24 h, the direction, the screen, the
# current name of the task if there is one («emoji título», or just the title without
# emoji; the annotation does not store the name) and the text if there is one. It does not show
# orphan annotations (of a task that no longer exists).
# "Anotaciones shows" gives the groups in order, separated by "; ", each one
# as "<heading>: <annotations>", and the annotations in order, separated by
# ", ", each one as its parts separated by " · ". The screen has no other
# annotations. The "the annotation ..." steps of a Given describe the last
# declared annotation. Each task is named by its title (one word).
# The text "Todavía no hay anotaciones" is verified in the QA suite
# (qa/anotacion.md).
# Reference week: Monday 2026-07-13 to Sunday 2026-07-19.
Feature: Anotaciones

  # Anotaciones 1
  # With and without a task, with and without text, from the most recent to the oldest and
  # grouped by day, even if they were annotated in a different order.
  Scenario Outline: Anotaciones 1
    Given a one-off task Regar without a due date
    And an annotation <direction_a> in <screen_a> from <annotated_a>
    And the annotation refers to the task Regar
    And the annotation says <text_a>
    And an annotation <direction_b> in <screen_b> from <annotated_b>
    And an annotation <direction_c> in <screen_c> from <annotated_c>
    And the annotation says <text_c>
    And an annotation <direction_d> in <screen_d> from <annotated_d>
    When I query Anotaciones on <now>
    Then Anotaciones shows <annotations>

    Examples:
      | direction_a | screen_a   | annotated_a         | text_a      | direction_b | screen_b   | annotated_b         | direction_c | screen_c   | annotated_c         | text_c    | direction_d | screen_d    | annotated_d         | now                 | annotations                                                                                                                                                                                     |
      | Me sirvió | Pendientes | 2026-07-15T08:05:00 | quedó lindo | Me molestó | Historial  | 2026-07-15T09:10:00 | Me sirvió | Etiquetas  | 2026-07-14T21:30:00 | muy lento | Me molestó | Anotaciones | 2026-07-13T09:00:00 | 2026-07-15T12:00:00 | Hoy: 09:10 · Me molestó · Historial, 08:05 · Me sirvió · Pendientes · Regar · quedó lindo; Ayer: 21:30 · Me sirvió · Etiquetas · muy lento; lunes 13 de julio: 09:00 · Me molestó · Anotaciones |

  # Anotaciones 2
  # Day heading and time: edges of 00:00, "Ayer" across the year
  # change, the year when it is not the current one, and "future" annotations (the
  # same day, later, goes in "Hoy"; another day, with the date, never "Mañana").
  # The time is shown without seconds.
  Scenario Outline: Anotaciones 2
    Given an annotation Me sirvió in Pendientes from <annotated>
    When I query Anotaciones on <now>
    Then Anotaciones shows <annotations>

    Examples:
      | annotated           | now                 | annotations                                                 |
      | 2026-07-15T00:00:00 | 2026-07-15T12:00:00 | Hoy: 00:00 · Me sirvió · Pendientes                         |
      | 2026-07-14T23:59:59 | 2026-07-15T12:00:00 | Ayer: 23:59 · Me sirvió · Pendientes                        |
      | 2026-07-14T23:59:59 | 2026-07-16T00:00:00 | martes 14 de julio: 23:59 · Me sirvió · Pendientes          |
      | 2026-07-13T08:00:00 | 2026-07-14T23:59:59 | Ayer: 08:00 · Me sirvió · Pendientes                        |
      | 2025-12-31T22:00:00 | 2026-01-01T10:00:00 | Ayer: 22:00 · Me sirvió · Pendientes                        |
      | 2025-12-31T22:00:00 | 2026-01-02T10:00:00 | miércoles 31 de diciembre de 2025: 22:00 · Me sirvió · Pendientes |
      | 2026-07-15T13:00:00 | 2026-07-15T12:00:00 | Hoy: 13:00 · Me sirvió · Pendientes                         |
      | 2026-07-16T09:00:00 | 2026-07-15T12:00:00 | jueves 16 de julio: 09:00 · Me sirvió · Pendientes          |

  # Anotaciones 3
  # Two annotations at the same instant: the one with the lower id goes first, regardless of
  # the order in which they were recorded.
  Scenario Outline: Anotaciones 3
    Given an annotation <direction_a> in <screen> from <moment>
    And the annotation was recorded with id <id_a>
    And an annotation <direction_b> in <screen> from <moment>
    And the annotation was recorded with id <id_b>
    When I query Anotaciones on <now>
    Then Anotaciones shows <annotations>

    Examples:
      | direction_a | direction_b | screen     | moment              | id_a | id_b | now                 | annotations                                                              |
      | Me molestó | Me sirvió | Pendientes | 2026-07-15T10:00:00 | a2   | a1   | 2026-07-15T12:00:00 | Hoy: 10:00 · Me sirvió · Pendientes, 10:00 · Me molestó · Pendientes     |
      | Me molestó | Me sirvió | Pendientes | 2026-07-15T10:00:00 | a1   | a2   | 2026-07-15T12:00:00 | Hoy: 10:00 · Me molestó · Pendientes, 10:00 · Me sirvió · Pendientes     |

  # Anotaciones 4
  # The screen shows the current name of the task: renaming it changes all
  # its annotations, and with an emoji the name is «emoji título».
  Scenario Outline: Anotaciones 4
    Given a one-off task <title> without a due date with emoji <emoji>
    And an annotation Me sirvió in Pendientes from <first>
    And the annotation refers to the task <title>
    And an annotation Me molestó in Historial from <second>
    And the annotation refers to the task <title>
    When I edit the title to <title_new>
    And I query Anotaciones on <now>
    Then Anotaciones shows <annotations>

    Examples:
      | title  | emoji | first               | second              | title_new    | now                 | annotations                                                                                       |
      | Regar  | 🌱    | 2026-07-14T09:00:00 | 2026-07-15T08:00:00 | Plantas      | 2026-07-15T12:00:00 | Hoy: 08:00 · Me molestó · Historial · 🌱 Plantas; Ayer: 09:00 · Me sirvió · Pendientes · 🌱 Plantas |

  # Anotaciones 5
  # Without annotations, the screen is empty.
  Scenario Outline: Anotaciones 5
    Given a one-off task Regar without a due date
    When I query Anotaciones on <now>
    Then Anotaciones is empty

    Examples:
      | now                 |
      | 2026-07-15T12:00:00 |

  # Anotaciones 6
  # An annotation of a task without an emoji shows only the title, and the text
  # goes at the end.
  Scenario Outline: Anotaciones 6
    Given a one-off task <title> without a due date
    And an annotation <direction> in <screen> from <annotated>
    And the annotation refers to the task <title>
    And the annotation says <text>
    When I query Anotaciones on <now>
    Then Anotaciones shows <annotations>

    Examples:
      | title  | direction  | screen           | annotated           | text        | now                 | annotations                                                          |
      | Pagar  | Me molestó | Panel de edición | 2026-07-15T08:05:00 | quedó lindo | 2026-07-15T12:00:00 | Hoy: 08:05 · Me molestó · Panel de edición · Pagar · quedó lindo     |

  # Anotaciones 7
  # Two devices annotate offline: the screen shows both.
  Scenario Outline: Anotaciones 7
    Given I am on <screen>
    When I annotate <direction> on <now>
    And another device, without seeing that change, annotates <direction_other> in <screen_other> on <now_other>
    And I query Anotaciones on <query>
    Then Anotaciones shows <annotations>

    Examples:
      | screen     | direction | now                 | direction_other | screen_other  | now_other           | query               | annotations                                                          |
      | Pendientes | Me sirvió | 2026-07-15T08:05:00 | Me molestó   | Historial     | 2026-07-15T08:06:00 | 2026-07-15T12:00:00 | Hoy: 08:06 · Me molestó · Historial, 08:05 · Me sirvió · Pendientes  |
