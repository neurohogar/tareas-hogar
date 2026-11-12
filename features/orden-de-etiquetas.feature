# mutation-stamp: sha256=2d937bfa1e3b5bb774e0ff242a5ce08dbb430c371f87150839bc48828fd98d00
# acceptance-mutation-manifest-begin
# {"version":1,"tested_at":"2026-11-03T14:57:49.301485906Z","feature_name":"Orden de etiquetas","feature_path":"features/orden-de-etiquetas.feature","background_hash":"4e25b3add2de21bf87027d7baad0fecf182c768f005788878252c777a860f33d","implementation_hash":"sha256:5e4d7c62102809533bed852df3369b854852536cfd6dc1e9418dabd7acf640ec","scenarios":[{"index":0,"name":"Orden de etiquetas 1","scenario_hash":"3bcb348f3eb0bac9c50474bdbe7f4f700fb0a5a1ab8015f3ed367dcf04591550","mutation_count":10,"result":{"Total":10,"Killed":10,"Survived":0,"Errors":0},"tested_at":"2026-11-03T14:57:49.301485906Z"},{"index":1,"name":"Orden de etiquetas 2","scenario_hash":"b4933e3748fef8b30cdf05e708604fafaa6dfd18f42d56ce43beb4988936b036","mutation_count":10,"result":{"Total":10,"Killed":10,"Survived":0,"Errors":0},"tested_at":"2026-11-03T14:57:49.301485906Z"}]}
# acceptance-mutation-manifest-end

# Spec §4.3 (Orden). En todos lados (chips de la fila, filtro, pantalla
# Etiquetas) las etiquetas van en orden alfabético en español, como el
# desempate de títulos de la §6.1: sin distinguir mayúsculas ni acentos, con
# la ñ después de la n. Si dos empatan, va primero la de id menor.
# Las etiquetas se declaran en un orden distinto del esperado: el orden de
# carga no decide nada, salvo en el empate, donde los ids crecen en el orden
# en que se declaran.
# "existen las etiquetas" da "<nombre>:<color>" separados por ", ". "la
# pantalla Etiquetas muestra" da todas, en orden, como "<nombre>:<color>". "el
# filtro ofrece" da los chips del filtro en orden. "la tarea X muestra las
# etiquetas" da los chips de su fila en orden. En los Given, cada nombre
# identifica la etiqueta con ese nombre exacto.
Feature: Orden de etiquetas

  Background:
    Given una tarea puntual Pagar sin fecha límite

  # Orden de etiquetas 1
  # Alfabético sin distinguir mayúsculas ni acentos, con la ñ después de la
  # n (Bano antes que baño), igual en la pantalla Etiquetas, en el filtro y
  # en la fila.
  Scenario Outline: Orden de etiquetas 1
    Given existen las etiquetas <existentes>
    And la tarea Pagar tiene las etiquetas <etiquetas_pagar>
    When consulto Pendientes en cualquier momento
    Then la pantalla Etiquetas muestra <etiquetas_guardadas>
    And el filtro ofrece <chips_filtro>
    And la tarea Pagar muestra las etiquetas <chips_pagar>

    Examples:
      | existentes                                                   | etiquetas_pagar                    | etiquetas_guardadas                                          | chips_filtro                              | chips_pagar                        |
      | zapatos:gris, Ñoquis:rojo, árbol:verde, Nube:azul, Baño:gris | zapatos, Ñoquis, árbol, Nube, Baño | árbol:verde, Baño:gris, Nube:azul, Ñoquis:rojo, zapatos:gris | Todas, árbol, Baño, Nube, Ñoquis, zapatos | árbol, Baño, Nube, Ñoquis, zapatos |
      | Cocina:gris, baño:rojo, Ábaco:azul, Bano:verde               | Cocina, baño, Ábaco, Bano          | Ábaco:azul, Bano:verde, baño:rojo, Cocina:gris               | Todas, Ábaco, Bano, baño, Cocina          | Ábaco, Bano, baño, Cocina          |

  # Orden de etiquetas 2
  # Empate (nombres que solo difieren en acentos): va primero la de id
  # menor, la declarada antes.
  Scenario Outline: Orden de etiquetas 2
    Given existen las etiquetas <existentes>
    And la tarea Pagar tiene las etiquetas <etiquetas_pagar>
    When consulto Pendientes en cualquier momento
    Then la pantalla Etiquetas muestra <etiquetas_guardadas>
    And el filtro ofrece <chips_filtro>
    And la tarea Pagar muestra las etiquetas <chips_pagar>

    Examples:
      | existentes             | etiquetas_pagar | etiquetas_guardadas    | chips_filtro        | chips_pagar  |
      | Árbol:gris, Arbol:rojo | Arbol, Árbol    | Árbol:gris, Arbol:rojo | Todas, Árbol, Arbol | Árbol, Arbol |
      | Arbol:rojo, Árbol:gris | Árbol, Arbol    | Arbol:rojo, Árbol:gris | Todas, Arbol, Árbol | Arbol, Árbol |
