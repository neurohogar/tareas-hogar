# mutation-stamp: sha256=06bf9c66f3204da08f57f1c57bb4d2e3b79eac828019f4c46dc00653abf17a43
# acceptance-mutation-manifest-begin
# {"version":1,"tested_at":"2026-11-03T14:57:12.751217204Z","feature_name":"Etiquetas concurrentes","feature_path":"features/etiquetas-concurrentes.feature","background_hash":"9521082c77c7288bf1e55566d31477cf37c6079bfa4c2229e585c93c1025c40e","implementation_hash":"sha256:27aef6454bbc8e7bbff55c6b28bc969114b559bf43502f5eea091813bfcf63c8","scenarios":[{"index":0,"name":"Etiquetas concurrentes 1","scenario_hash":"a076dc5b15751b496989016e08a914589af786ddd7f261f9693d548f067b12d3","mutation_count":2,"result":{"Total":2,"Killed":2,"Survived":0,"Errors":0},"tested_at":"2026-11-03T14:57:12.751217204Z"},{"index":1,"name":"Etiquetas concurrentes 2","scenario_hash":"15f3b6d6d172829e6e99c135b95e603a28fef08fb40befc8fadb46277d524ae9","mutation_count":2,"result":{"Total":2,"Killed":2,"Survived":0,"Errors":0},"tested_at":"2026-11-03T14:57:12.751217204Z"},{"index":2,"name":"Etiquetas concurrentes 3","scenario_hash":"e414f7a5b6e8829a7d604e788e50e6645804ca00e5035b6147f3a3febee37db8","mutation_count":5,"result":{"Total":5,"Killed":5,"Survived":0,"Errors":0},"tested_at":"2026-11-03T14:57:12.751217204Z"},{"index":3,"name":"Etiquetas concurrentes 4","scenario_hash":"b0f18cc1a4daa45dfa4cf862da07dc88205b5328ddb02cff4c43b01668408ec7","mutation_count":5,"result":{"Total":5,"Killed":5,"Survived":0,"Errors":0},"tested_at":"2026-11-03T14:57:12.751217204Z"},{"index":4,"name":"Etiquetas concurrentes 5","scenario_hash":"ed9bbcddc28d1e6e3029d0b3000a4530578b3fc580a9cb5224c1a065e6dd9dec","mutation_count":5,"result":{"Total":5,"Killed":5,"Survived":0,"Errors":0},"tested_at":"2026-11-03T14:57:12.751217204Z"},{"index":5,"name":"Etiquetas concurrentes 6","scenario_hash":"915be685d41f6f632b6d3a2982cc59cc04d0e7efe4299d1ffe24b5d6de965941","mutation_count":5,"result":{"Total":5,"Killed":5,"Survived":0,"Errors":0},"tested_at":"2026-11-03T14:57:12.751217204Z"},{"index":6,"name":"Etiquetas concurrentes 7","scenario_hash":"a1490e60df2b4563e875f7b958bd8fa8810251c15f877f2f01f6329eed8ee087","mutation_count":7,"result":{"Total":7,"Killed":7,"Survived":0,"Errors":0},"tested_at":"2026-11-03T14:57:12.751217204Z"},{"index":7,"name":"Etiquetas concurrentes 8","scenario_hash":"5b2b12c6deb8eb886cb970b3b649a6e6adb6df7f3e886ba101e21cde3d5073cf","mutation_count":7,"result":{"Total":7,"Killed":7,"Survived":0,"Errors":0},"tested_at":"2026-11-03T14:57:12.751217204Z"},{"index":8,"name":"Etiquetas concurrentes 9","scenario_hash":"faa2afd68ace36f8d848346a750d825a36c98648e83a7bc115c66e73f80a1fbb","mutation_count":12,"result":{"Total":12,"Killed":12,"Survived":0,"Errors":0},"tested_at":"2026-11-03T14:57:12.751217204Z"},{"index":9,"name":"Etiquetas concurrentes 10","scenario_hash":"6a979cb86e9cef818ec2235bd26e29c2aab904dafd8da9f216b5c3d07fb4c22a","mutation_count":18,"result":{"Total":18,"Killed":18,"Survived":0,"Errors":0},"tested_at":"2026-11-03T14:57:12.751217204Z"}]}
# acceptance-mutation-manifest-end

# Spec §7 (Conflictos, etiquetas). Dos dispositivos cambian etiquetas sin ver
# el cambio del otro (por ejemplo, uno sin conexión). Los cambios llegan en
# el orden en que aparecen los pasos: primero el mío, después el del otro
# dispositivo.
#   El campo etiquetas de una tarea se reemplaza entero y gana el último
#   cambio (no se unen los agregados).
#   En una etiqueta, nombre y color son campos independientes.
#   Etiquetas duplicadas (mismo nombre sin distinguir mayúsculas): al
#   detectarlas, la app las fusiona. Sobrevive la de id menor, con su nombre
#   y su color; las tareas que tenían la otra pasan a tener la sobreviviente
#   (sin repetirla), y la otra se borra.
#   Una tarea que referencia una etiqueta borrada ignora esa referencia (no
#   muestra el chip ni aparece en ese filtro) y la app la quita al
#   detectarla. Edición contra borrado: gana el borrado.
# Los ids de etiqueta crecen en el orden en que se crean en el escenario: las
# de "existen las etiquetas", en el orden declarado; después, las que crean
# los pasos, en el orden de los pasos.
# "existen las etiquetas" da "<nombre>:<color>" separados por ", ". "la
# pantalla Etiquetas muestra" da todas las que existen, en orden alfabético,
# como "<nombre>:<color>", sin otras. "la tarea X muestra las etiquetas" da
# los chips de su fila en orden, sin otros. En los Given, cada nombre
# identifica la etiqueta con ese nombre exacto.
Feature: Etiquetas concurrentes

  Background:
    Given una tarea puntual Pagar sin fecha límite
    And una tarea periódica relativa Regar nunca completada

  # Etiquetas concurrentes 1
  # El campo etiquetas de una tarea se reemplaza entero: queda el último
  # cambio, sin unir los agregados de los dos dispositivos.
  Scenario Outline: Etiquetas concurrentes 1
    Given existen las etiquetas <existentes>
    And la tarea Pagar tiene las etiquetas <etiquetas_pagar>
    When edito las etiquetas de la tarea Pagar a <mias>
    And otro dispositivo, sin ver ese cambio, edita las etiquetas de la tarea Pagar a <del_otro>
    Then la tarea Pagar muestra las etiquetas <chips_pagar>

    Examples:
      | existentes                          | etiquetas_pagar | mias         | del_otro      | chips_pagar   |
      | Baño:gris, Cocina:rojo, Patio:verde | Cocina          | Cocina, Baño | Cocina, Patio | Cocina, Patio |

  # Etiquetas concurrentes 2
  # Cambiar las etiquetas en un dispositivo y otro campo en el otro: se
  # combinan los dos cambios.
  Scenario Outline: Etiquetas concurrentes 2
    Given existen las etiquetas <existentes>
    When edito las etiquetas de la tarea Pagar a <mias>
    And otro dispositivo, sin ver ese cambio, edita el título de la tarea Pagar a Luz
    Then la tarea Luz muestra las etiquetas <chips>

    Examples:
      | existentes  | mias   | chips  |
      | Cocina:rojo | Cocina | Cocina |

  # Etiquetas concurrentes 3
  # Renombrar en un dispositivo y recolorear en el otro: quedan los dos
  # cambios.
  Scenario Outline: Etiquetas concurrentes 3
    Given existen las etiquetas <existentes>
    When renombro la etiqueta <etiqueta> a <nombre_nuevo>
    And otro dispositivo, sin ver ese cambio, cambia el color de la etiqueta <etiqueta> a <color_nuevo>
    Then la pantalla Etiquetas muestra <etiquetas_guardadas>

    Examples:
      | existentes  | etiqueta | nombre_nuevo | color_nuevo | etiquetas_guardadas |
      | Cocina:rojo | Cocina   | Comida       | violeta     | Comida:violeta      |

  # Etiquetas concurrentes 4
  # El mismo campo de una etiqueta: gana el último cambio en llegar.
  Scenario Outline: Etiquetas concurrentes 4
    Given existen las etiquetas <existentes>
    When cambio el color de la etiqueta <etiqueta> a <mi_color>
    And otro dispositivo, sin ver ese cambio, cambia el color de la etiqueta <etiqueta> a <color_del_otro>
    Then la pantalla Etiquetas muestra <etiquetas_guardadas>

    Examples:
      | existentes  | etiqueta | mi_color | color_del_otro | etiquetas_guardadas |
      | Cocina:rojo | Cocina   | azul     | verde          | Cocina:verde        |

  # Etiquetas concurrentes 5
  # Edición contra borrado: gana el borrado, llegue la edición antes o
  # después. La etiqueta no revive y la tarea queda sin ella.
  Scenario Outline: Etiquetas concurrentes 5
    Given existen las etiquetas <existentes>
    And la tarea Pagar tiene las etiquetas <etiquetas_pagar>
    When borro la etiqueta <etiqueta>
    And otro dispositivo, sin ver ese cambio, renombra la etiqueta <etiqueta> a <nombre_nuevo>
    Then la pantalla Etiquetas muestra <etiquetas_guardadas>
    And la tarea Pagar muestra las etiquetas <chips_pagar>

    Examples:
      | existentes             | etiquetas_pagar | etiqueta | nombre_nuevo | etiquetas_guardadas | chips_pagar |
      | Cocina:rojo, Baño:gris | Cocina, Baño    | Cocina   | Comida       | Baño:gris           | Baño        |

  # Etiquetas concurrentes 6
  # Espejo: la edición llega antes que el borrado.
  Scenario Outline: Etiquetas concurrentes 6
    Given existen las etiquetas <existentes>
    And la tarea Pagar tiene las etiquetas <etiquetas_pagar>
    When renombro la etiqueta <etiqueta> a <nombre_nuevo>
    And otro dispositivo, sin ver ese cambio, borra la etiqueta <etiqueta>
    Then la pantalla Etiquetas muestra <etiquetas_guardadas>
    And la tarea Pagar muestra las etiquetas <chips_pagar>

    Examples:
      | existentes             | etiquetas_pagar | etiqueta | nombre_nuevo | etiquetas_guardadas | chips_pagar |
      | Cocina:rojo, Baño:gris | Cocina, Baño    | Cocina   | Comida       | Baño:gris           | Baño        |

  # Etiquetas concurrentes 7
  # Borro una etiqueta y el otro dispositivo, sin verlo, se la asigna a una
  # tarea: la tarea ignora la referencia (no muestra el chip ni aparece en
  # ese filtro, que ya no existe) y es la única referencia a limpiar.
  Scenario Outline: Etiquetas concurrentes 7
    Given existen las etiquetas <existentes>
    And la tarea Pagar tiene las etiquetas <etiquetas_pagar>
    When borro la etiqueta <etiqueta>
    And otro dispositivo, sin ver ese cambio, edita las etiquetas de la tarea Regar a <del_otro>
    And consulto Pendientes en cualquier momento
    Then la tarea Regar muestra las etiquetas <chips_regar>
    And la tarea Pagar muestra las etiquetas <chips_pagar>
    And el filtro ofrece <chips_filtro>
    And las tareas con etiquetas borradas a limpiar son solo <a_limpiar>

    Examples:
      | existentes             | etiquetas_pagar | etiqueta | del_otro     | chips_regar | chips_pagar | chips_filtro | a_limpiar |
      | Cocina:rojo, Baño:gris | Baño            | Cocina   | Cocina, Baño | Baño        | Baño        | Todas, Baño  | Regar     |

  # Etiquetas concurrentes 8
  # Los dos dispositivos crean sin conexión una etiqueta con el mismo nombre
  # (sin distinguir mayúsculas): al fusionarlas sobrevive la mía, creada
  # primero (id menor), con su nombre y su color, y las dos tareas la
  # tienen. El otro dispositivo, que tampoco ve la mía, recolorea Baño antes
  # de crear la suya, así la suya toma otro color (gris) que la mía (rojo).
  Scenario Outline: Etiquetas concurrentes 8
    Given existen las etiquetas <existentes>
    When edito las etiquetas de la tarea Pagar a <mias>
    And otro dispositivo, sin ver ese cambio, cambia el color de la etiqueta <otra> a <color_otra>
    And otro dispositivo, sin ver ese cambio, edita las etiquetas de la tarea Regar a <del_otro>
    And la app fusiona las etiquetas duplicadas
    Then la pantalla Etiquetas muestra <etiquetas_guardadas>
    And la tarea Pagar muestra las etiquetas <chips_pagar>
    And la tarea Regar muestra las etiquetas <chips_regar>

    Examples:
      | existentes | mias   | otra | color_otra | del_otro | etiquetas_guardadas    | chips_pagar | chips_regar |
      | Baño:gris  | Cocina | Baño | rojo       | cocina   | Baño:rojo, Cocina:rojo | Cocina      | Cocina      |

  # Etiquetas concurrentes 9
  # Fusión de duplicadas ya guardadas: sobrevive la de id menor (la
  # declarada antes) con su nombre y su color; las tareas de la otra pasan a
  # la sobreviviente, una tarea con las dos la tiene una sola vez, y la otra
  # se borra. Fila 2: el mismo par declarado al revés.
  Scenario Outline: Etiquetas concurrentes 9
    Given existen las etiquetas <existentes>
    And la tarea Pagar tiene las etiquetas <etiquetas_pagar>
    And la tarea Regar tiene las etiquetas <etiquetas_regar>
    When la app fusiona las etiquetas duplicadas
    Then la pantalla Etiquetas muestra <etiquetas_guardadas>
    And la tarea Pagar muestra las etiquetas <chips_pagar>
    And la tarea Regar muestra las etiquetas <chips_regar>

    Examples:
      | existentes                           | etiquetas_pagar      | etiquetas_regar | etiquetas_guardadas     | chips_pagar  | chips_regar |
      | Cocina:rojo, cocina:verde, Baño:gris | Cocina, cocina, Baño | cocina          | Baño:gris, Cocina:rojo  | Baño, Cocina | Cocina      |
      | cocina:verde, Cocina:rojo, Baño:gris | Cocina, cocina, Baño | Cocina          | Baño:gris, cocina:verde | Baño, cocina | cocina      |

  # Etiquetas concurrentes 10
  # Los dos dispositivos renombran sin conexión dos etiquetas distintas al
  # mismo nombre: al fusionarlas sobrevive la de id menor, con el nombre que
  # le puso su renombrado y su color.
  Scenario Outline: Etiquetas concurrentes 10
    Given existen las etiquetas <existentes>
    And la tarea Pagar tiene las etiquetas <etiquetas_pagar>
    And la tarea Regar tiene las etiquetas <etiquetas_regar>
    When renombro la etiqueta <mia> a <mi_nombre>
    And otro dispositivo, sin ver ese cambio, renombra la etiqueta <del_otro> a <nombre_del_otro>
    And la app fusiona las etiquetas duplicadas
    Then la pantalla Etiquetas muestra <etiquetas_guardadas>
    And la tarea Pagar muestra las etiquetas <chips_pagar>
    And la tarea Regar muestra las etiquetas <chips_regar>

    Examples:
      | existentes              | etiquetas_pagar | etiquetas_regar | mia    | mi_nombre | del_otro | nombre_del_otro | etiquetas_guardadas | chips_pagar | chips_regar |
      | Comida:rojo, Patio:azul | Comida          | Patio           | Comida | Cocina    | Patio    | cocina          | Cocina:rojo         | Cocina      | Cocina      |
      | Patio:azul, Comida:rojo | Comida          | Patio           | Comida | Cocina    | Patio    | cocina          | cocina:azul         | cocina      | cocina      |
