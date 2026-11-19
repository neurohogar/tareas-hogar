# mutation-stamp: sha256=563cc1367f35353978111c3444efe821d6c9766238d090ccfb93c55de1c21bef
# acceptance-mutation-manifest-begin
# {"version":1,"tested_at":"2026-11-17T21:05:24.023672881Z","feature_name":"Pasos y cambios sin guardar","feature_path":"features/pasos-cambios-sin-guardar.feature","background_hash":"74234e98afe7498fb5daf1f36ac2d78acc339464f950703b8c019892f982b90b","implementation_hash":"sha256:d781550672059aae87b05c49409b28049448715ecfc1ef47bac790907f151dec","scenarios":[{"index":0,"name":"Pasos y cambios sin guardar 1","scenario_hash":"ef28e69edc51f4598b53eb161d22ec20103fd386525ad22af582d28722acc3b4","mutation_count":5,"result":{"Total":5,"Killed":5,"Survived":0,"Errors":0},"tested_at":"2026-11-17T21:05:24.023672881Z"},{"index":1,"name":"Pasos y cambios sin guardar 2","scenario_hash":"d4942c06669d3acdf090e5d5697e49cc47a05fa36d625e09dc26ca679c1705c8","mutation_count":5,"result":{"Total":5,"Killed":5,"Survived":0,"Errors":0},"tested_at":"2026-11-17T21:05:24.023672881Z"},{"index":2,"name":"Pasos y cambios sin guardar 3","scenario_hash":"41e9d82f8bae68bc0abb38e1b66533c31a8b308af63e42e295ded7735440fd1d","mutation_count":6,"result":{"Total":6,"Killed":6,"Survived":0,"Errors":0},"tested_at":"2026-11-17T21:05:24.023672881Z"},{"index":3,"name":"Pasos y cambios sin guardar 4","scenario_hash":"f7588024c23ed194dbdc032ef70158e97457b341a77ecea67c66cff74bbfac5d","mutation_count":2,"result":{"Total":2,"Killed":2,"Survived":0,"Errors":0},"tested_at":"2026-11-17T21:05:24.023672881Z"},{"index":4,"name":"Pasos y cambios sin guardar 5","scenario_hash":"cf1528bf2025421988b14f8c3ec62f00f0291d342b803cbc58a6b9a54cb5b35f","mutation_count":2,"result":{"Total":2,"Killed":2,"Survived":0,"Errors":0},"tested_at":"2026-11-17T21:05:24.023672881Z"},{"index":5,"name":"Pasos y cambios sin guardar 6","scenario_hash":"f3b85d1f44ed8c7aa324eebc0625fcb85b61a0d48f54b3a63df1ea72321ea4bd","mutation_count":1,"result":{"Total":1,"Killed":1,"Survived":0,"Errors":0},"tested_at":"2026-11-17T21:05:24.023672881Z"},{"index":6,"name":"Pasos y cambios sin guardar 7","scenario_hash":"574b2d9ef8a4bfef1e91f1e3d754139d06902f58a8d8751a48a3aaa18a0700a4","mutation_count":2,"result":{"Total":2,"Killed":2,"Survived":0,"Errors":0},"tested_at":"2026-11-17T21:05:24.023672881Z"},{"index":7,"name":"Pasos y cambios sin guardar 8","scenario_hash":"b87214a5638077f46e9645e3196480e3145c4087d23fee1e6541d6d6e801d410","mutation_count":2,"result":{"Total":2,"Killed":2,"Survived":0,"Errors":0},"tested_at":"2026-11-17T21:05:24.023672881Z"},{"index":8,"name":"Pasos y cambios sin guardar 9","scenario_hash":"db22a69217e51d40b026fecba714b5b2350065ade3eba719835e6971dbb0ece6","mutation_count":2,"result":{"Total":2,"Killed":2,"Survived":0,"Errors":0},"tested_at":"2026-11-17T21:05:24.023672881Z"},{"index":9,"name":"Pasos y cambios sin guardar 10","scenario_hash":"ffe192bb3844a22976d5c3f45f0205b97e905b1a2bb2d31689fefbc9a1f8e8b5","mutation_count":2,"result":{"Total":2,"Killed":2,"Survived":0,"Errors":0},"tested_at":"2026-11-17T21:05:24.023672881Z"},{"index":10,"name":"Pasos y cambios sin guardar 11","scenario_hash":"0579d2d47a6d9a9f4eb6e78cdca2d75b9980dc85de2f4dd85f9e0011b4276ca6","mutation_count":2,"result":{"Total":2,"Killed":2,"Survived":0,"Errors":0},"tested_at":"2026-11-17T21:05:24.023672881Z"},{"index":11,"name":"Pasos y cambios sin guardar 12","scenario_hash":"75a69311c5bbbbd8127b3e0b5915112af1e4be0a564fbfed61f4d13dbf6fc443","mutation_count":1,"result":{"Total":1,"Killed":1,"Survived":0,"Errors":0},"tested_at":"2026-11-17T21:05:24.023672881Z"}]}
# acceptance-mutation-manifest-end

# Spec §6.2 (Cambios sin guardar con los pasos). Los pasos más van como
# campos «Paso 2», «Paso 3»… debajo del primer paso. Agregar, quitar o cambiar
# un paso cuenta; escribir y volver al valor original no cuenta, ni los
# espacios que Guardar recorta ni un paso vacío que Guardar descarta.
Feature: Steps and unsaved changes

  # Pasos y cambios sin guardar 1
  # Cambiar un paso es un cambio; escribir el mismo valor, no.
  Scenario Outline: Steps and unsaved changes 1
    Given I open the panel to edit the task <title> with the steps <steps>
    When I type <value> in the field <field>
    And I tap the X of the panel
    Then what stays open is <open>

    Examples:
      | title  | steps                                       | field  | value               | open                            |
      | Lavar  | Separar la ropa blanca, Poner el lavarropas | Paso 2 | Juntar las llaves   | el panel con el aviso de cierre |
      | Lavar  | Separar la ropa blanca, Poner el lavarropas | Paso 2 | Poner el lavarropas | nada                            |

  # Pasos y cambios sin guardar 2
  # Escribir y volver al valor original no cuenta; volver a otro valor sí.
  Scenario Outline: Steps and unsaved changes 2
    Given I open the panel to edit the task <title> with the steps <steps>
    When I type <first> in the field <field>
    And I type <second> in the field <field>
    And I tap the X of the panel
    Then what stays open is <open>

    Examples:
      | title  | steps                                       | field  | first             | second               | open                            |
      | Lavar  | Separar la ropa blanca, Poner el lavarropas | Paso 2 | Juntar las llaves | Poner el lavarropas  | nada                            |
      | Lavar  | Separar la ropa blanca, Poner el lavarropas | Paso 2 | Juntar las llaves | Buscar el detergente | el panel con el aviso de cierre |

  # Pasos y cambios sin guardar 3
  # Los espacios que Guardar recorta no cuentan: el mismo valor con espacios
  # alrededor no es un cambio (fila 1); otro valor sí (fila 2).
  Scenario Outline: Steps and unsaved changes 3
    Given I open the panel to edit the task <title> with the steps <steps>
    When I type <value> with spaces around it in the field <field>
    And I tap the X of the panel
    Then what stays open is <open>

    Examples:
      | title  | steps                                       | field  | value               | open                            |
      | Lavar  | Separar la ropa blanca, Poner el lavarropas | Paso 2 | Poner el lavarropas | nada                            |
      | Lavar  | Separar la ropa blanca, Poner el lavarropas | Paso 2 | Juntar las llaves   | el panel con el aviso de cierre |

  # Pasos y cambios sin guardar 4
  # Vaciar un paso existente cuenta como cambio.
  Scenario Outline: Steps and unsaved changes 4
    Given I open the panel to edit the task <title> with the steps <steps>
    When I clear the field <field>
    And I tap the X of the panel
    Then what stays open is <open>

    Examples:
      | title  | steps                                       | field  | open                            |
      | Lavar  | Separar la ropa blanca, Poner el lavarropas | Paso 2 | el panel con el aviso de cierre |

  # Pasos y cambios sin guardar 5
  # Solo espacios en un paso existente es vaciarlo: cuenta como cambio.
  Scenario Outline: Steps and unsaved changes 5
    Given I open the panel to edit the task <title> with the steps <steps>
    When I type only spaces in the field <field>
    And I tap the X of the panel
    Then what stays open is <open>

    Examples:
      | title  | steps                                       | field  | open                            |
      | Lavar  | Separar la ropa blanca, Poner el lavarropas | Paso 2 | el panel con el aviso de cierre |

  # Pasos y cambios sin guardar 6
  # Agregar un paso y no escribirlo no cuenta: Guardar descarta el vacío.
  Scenario Outline: Steps and unsaved changes 6
    Given I open the panel to edit the task <title> with the steps <steps>
    When I tap Agregar paso
    And I tap the X of the panel
    Then what stays open is <open>

    Examples:
      | title  | steps                                       | open    |
      | Lavar  | Separar la ropa blanca, Poner el lavarropas | nada    |

  # Pasos y cambios sin guardar 7
  # Agregar un paso y escribirlo sí cuenta.
  Scenario Outline: Steps and unsaved changes 7
    Given I open the panel to edit the task <title> with the steps <steps>
    When I tap Agregar paso
    And I type <value> in the field <field>
    And I tap the X of the panel
    Then what stays open is <open>

    Examples:
      | title  | steps                                       | field  | value          | open                            |
      | Lavar  | Separar la ropa blanca, Poner el lavarropas | Paso 3 | Tender la ropa | el panel con el aviso de cierre |

  # Pasos y cambios sin guardar 8
  # Agregar un paso y escribir solo espacios no cuenta.
  Scenario Outline: Steps and unsaved changes 8
    Given I open the panel to edit the task <title> with the steps <steps>
    When I tap Agregar paso
    And I type only spaces in the field <field>
    And I tap the X of the panel
    Then what stays open is <open>

    Examples:
      | title  | steps                                       | field  | open    |
      | Lavar  | Separar la ropa blanca, Poner el lavarropas | Paso 3 | nada    |

  # Pasos y cambios sin guardar 9
  # Quitar un paso existente cuenta como cambio.
  Scenario Outline: Steps and unsaved changes 9
    Given I open the panel to edit the task <title> with the steps <steps>
    When I tap Quitar in the field <field>
    And I tap the X of the panel
    Then what stays open is <open>

    Examples:
      | title  | steps                                       | field  | open                            |
      | Lavar  | Separar la ropa blanca, Poner el lavarropas | Paso 2 | el panel con el aviso de cierre |

  # Pasos y cambios sin guardar 10
  # Agregar un paso y quitarlo de nuevo vuelve a lo original: no cuenta.
  Scenario Outline: Steps and unsaved changes 10
    Given I open the panel to edit the task <title> with the steps <steps>
    When I tap Agregar paso
    And I tap Quitar in the field <field>
    And I tap the X of the panel
    Then what stays open is <open>

    Examples:
      | title  | steps                                       | field  | open    |
      | Lavar  | Separar la ropa blanca, Poner el lavarropas | Paso 3 | nada    |

  # Pasos y cambios sin guardar 11
  # Al crear, agregar un paso y escribirlo es cargar algo.
  Scenario Outline: Steps and unsaved changes 11
    Given I open the panel to create a task
    When I tap Agregar paso
    And I type <value> in the field <field>
    And I tap the X of the panel
    Then what stays open is <open>

    Examples:
      | field  | value               | open                            |
      | Paso 2 | Poner el lavarropas | el panel con el aviso de cierre |

  # Pasos y cambios sin guardar 12
  # Al crear, agregar un paso y no escribirlo cierra directo.
  Scenario Outline: Steps and unsaved changes 12
    Given I open the panel to create a task
    When I tap Agregar paso
    And I tap the X of the panel
    Then what stays open is <open>

    Examples:
      | open    |
      | nada    |
