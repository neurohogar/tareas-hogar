# mutation-stamp: sha256=63bbc3e4572856e4a946839b5611bd0e034895299074e0de92d2c1f0c3869713
# acceptance-mutation-manifest-begin
# {"version":1,"tested_at":"2026-11-05T22:45:35.649018756Z","feature_name":"Orientación vertical","feature_path":"features/orientacion-vertical.feature","background_hash":"74234e98afe7498fb5daf1f36ac2d78acc339464f950703b8c019892f982b90b","implementation_hash":"sha256:b59665f37cf3966a4e1a7f5387636f87da05946c007c399670fb445e3b0e63b1","scenarios":[{"index":0,"name":"Orientación vertical 1","scenario_hash":"36fd1d9798d58177eb990a567732eb6035017b7592661ed28b2f7815ca349fe0","mutation_count":8,"result":{"Total":8,"Killed":8,"Survived":0,"Errors":0},"tested_at":"2026-11-05T22:45:17.203995897Z"}]}
# acceptance-mutation-manifest-end

# Spec §6 (Orientación) y §8 (Manifest). La app instalada se usa en vertical
# porque el manifest que publica lo declara, y es lo único que lo decide: la
# orientación rige en la app instalada, en todas sus pantallas, y no en una
# pestaña del navegador ni en la compu. `portrait` admite los dos sentidos
# verticales (`portrait-primary` o `portrait-secondary` fijarían uno), y
# `standalone` es lo que hace que la orientación se aplique al abrirla desde su
# ícono. Que en una pestaña del navegador siga girando con el diseño ancho de
# siempre, que en la compu no cambie nada, que ninguna pantalla fije la
# orientación por su cuenta y que una versión nueva la aplique sin reinstalar
# se verifican en la suite QA (qa/orientacion-vertical.md).
Feature: Orientación vertical

  # Orientación vertical 1
  # Lo que el manifest publicado declara: nombre, nombre corto, modo de
  # apertura y orientación.
  Scenario Outline: Orientación vertical 1
    Given el manifest que publica la app
    Then el campo <campo> del manifest es <valor>

    Examples:
      | campo       | valor        |
      | name        | Tareas Hogar |
      | short_name  | Tareas       |
      | display     | standalone   |
      | orientation | portrait     |
