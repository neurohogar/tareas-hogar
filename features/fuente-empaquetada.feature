# mutation-stamp: sha256=5e92e40dc651c9e9c189f192ae5daef9a8ab3166fe517d0679f3ddce4ffc4834
# acceptance-mutation-manifest-begin
# {"version":1,"tested_at":"2026-11-05T16:46:56.070075980Z","feature_name":"Fuente empaquetada","feature_path":"features/fuente-empaquetada.feature","background_hash":"74234e98afe7498fb5daf1f36ac2d78acc339464f950703b8c019892f982b90b","implementation_hash":"sha256:bc3a05523bf4dfce9f211f2b3195a1dd9d3905a4d1879588367021a2c06cc5a2","scenarios":[{"index":1,"name":"Fuente empaquetada 2","scenario_hash":"9b47db7fe610dd3325d83eb45b3be3948c33edaada8b5c3e7602c9862a0d3851","mutation_count":12,"result":{"Total":12,"Killed":12,"Survived":0,"Errors":0},"tested_at":"2026-11-05T16:46:56.070075980Z"},{"index":0,"name":"Fuente empaquetada 1","scenario_hash":"bf1792e644e34029e879d9c63422d6f2909459a758ad22309c4d8259e1eee4c4","mutation_count":31,"result":{"Total":31,"Killed":31,"Survived":0,"Errors":0},"tested_at":"2026-11-04T19:40:55.258016657Z"}]}
# acceptance-mutation-manifest-end

# Spec §6 (Fuente y emoji empaquetados, "Qué se dibuja con qué" y "El dato no
# cambia") y §4.1 (emoji). Qué fuente dibuja cada carácter: Atkinson
# Hyperlegible Next para el texto que tiene, Noto Color Emoji para todo emoji
# y para el carácter de texto y emoji sin marca que Atkinson no tiene, la
# fuente del sistema para el texto que ninguna de las dos tiene, y el emoji del
# dispositivo para un emoji que Noto no tiene. Un emoji que el juego no tiene
# o que el selector no ofrece (§6.2) se guarda igual, salvo un tono de piel
# suelto, que no es un emoji válido. Que la fuente y el juego
# rigen en todas las pantallas y en los dos temas, tamaños y pesos sin cambio,
# el Título del panel en 20px, horas con cifras de ancho fijo, sin conexión,
# sin servicios externos, la espera sin aviso, el reintento y la instalación
# que no depende de las fuentes se verifican en la suite QA
# (qa/fuente-empaquetada.md).
Feature: Fuente empaquetada

  # Fuente empaquetada 1
  # Una fila por fila de la tabla de la §6: Atkinson para el texto que tiene
  # (español, cifras y signos sin marca de emoji); la fuente del sistema para
  # el texto que Atkinson no tiene; Noto para el carácter de texto y emoji sin
  # marca que Atkinson no tiene y para todo emoji que Noto tiene (con o sin
  # marca, ZWJ, tono, bandera); el emoji del dispositivo para uno que Noto no
  # tiene (de una versión de Unicode más nueva).
  Scenario Outline: Fuente empaquetada 1
    Given el texto <texto>
    Then el texto se dibuja con <fuente>

    Examples:
      | texto                   | fuente                     |
      | Atención, camión y niño | Atkinson Hyperlegible Next |
      | 0123456789              | Atkinson Hyperlegible Next |
      | #                       | Atkinson Hyperlegible Next |
      | *                       | Atkinson Hyperlegible Next |
      | ©                       | Atkinson Hyperlegible Next |
      | ®                       | Atkinson Hyperlegible Next |
      | ™                       | Atkinson Hyperlegible Next |
      | 日本語                  | la fuente del sistema      |
      | ❤                       | Noto Color Emoji           |
      | ☀                       | Noto Color Emoji           |
      | ☎                       | Noto Color Emoji           |
      | ✈                       | Noto Color Emoji           |
      | 🌱                      | Noto Color Emoji           |
      | ❤️                      | Noto Color Emoji           |
      | #️⃣                      | Noto Color Emoji           |
      | 👨‍👩‍👧                    | Noto Color Emoji           |
      | 👍🏽                     | Noto Color Emoji           |
      | 🇦🇷                     | Noto Color Emoji           |
      | 🫿                      | el emoji del dispositivo   |

  # Fuente empaquetada 2
  # Un emoji que el juego no tiene se guarda igual, y también uno que el selector
  # no ofrece y llegó por otra vía: un cabello suelto o una variante de dos tonos.
  Scenario Outline: Fuente empaquetada 2
    Given una tarea puntual sin fecha límite
    When elijo el emoji <emoji>
    Then la tarea tiene emoji <emoji_guardado>

    Examples:
      | emoji | emoji_guardado |
      | 🫿    | 🫿             |
      | 🦰    | 🦰             |
      | 🦱    | 🦱             |
      | 🦳    | 🦳             |
      | 🦲    | 🦲             |
      | 🧑🏻‍🤝‍🧑🏿 | 🧑🏻‍🤝‍🧑🏿       |

  # Fuente empaquetada 3
  # Un tono de piel suelto tampoco lo ofrece el selector, pero no es un emoji
  # válido: llegado por otra vía, se rechaza (§4.1, §6.2).
  Scenario Outline: Fuente empaquetada 3
    When creo una tarea puntual con título <titulo>, emoji <emoji> y nota <nota>
    Then la creación se rechaza por emoji inválido
    And no se crea ninguna tarea

    Examples:
      | titulo | emoji | nota  |
      | Regar  | 🏻    | Cerca |
      | Regar  | 🏼    | Cerca |
      | Regar  | 🏽    | Cerca |
      | Regar  | 🏾    | Cerca |
      | Regar  | 🏿    | Cerca |
