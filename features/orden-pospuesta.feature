# mutation-stamp: sha256=f5da34a28136b088670268d4a1cb9b3deadf3da9c2feeddd60acce97244cea53
# acceptance-mutation-manifest-begin
# {"version":1,"tested_at":"2026-11-13T22:19:32.118582935Z","feature_name":"Orden con tareas pospuestas","feature_path":"features/orden-pospuesta.feature","background_hash":"74234e98afe7498fb5daf1f36ac2d78acc339464f950703b8c019892f982b90b","implementation_hash":"sha256:e12f5f62f81915c1ee389c55e6a4402f505e9090d954d21536a668976f050856","scenarios":[{"index":0,"name":"Orden con tareas pospuestas 1","scenario_hash":"6e2b28a663cc0f0913298c12dc9fc18d121597cbde0f4479f3560ed399f86af0","mutation_count":31,"result":{"Total":31,"Killed":31,"Survived":0,"Errors":0},"tested_at":"2026-11-13T22:19:32.118582935Z"},{"index":1,"name":"Orden con tareas pospuestas 2","scenario_hash":"e722a29ccad5acf341ff51c48e40ff4298aeb56d38d8cb4ca7309c69c2aaa4da","mutation_count":10,"result":{"Total":10,"Killed":10,"Survived":0,"Errors":0},"tested_at":"2026-11-13T22:19:32.118582935Z"},{"index":2,"name":"Orden con tareas pospuestas 3","scenario_hash":"4db8e851f5e14bccc4a7cdbbe1e323cb3be309c692eec3431cd1d3a008e5c5bf","mutation_count":11,"result":{"Total":11,"Killed":11,"Survived":0,"Errors":0},"tested_at":"2026-11-13T22:19:32.118582935Z"}]}
# acceptance-mutation-manifest-end

# Spec §5.9 (Posponer) con §6.1 (orden por urgencia y Mostrar completadas).
# Una pospuesta (ahora < pospuesta.hasta) que estaría pendiente o atrasada
# va en el grupo en espera, y su clave de orden es hasta: cuándo vuelve.
# Al vencer, vuelve a su grupo con su clave de siempre (la posposición no
# mueve vencimientos ni fechas límite).
# Una pospuesta no está completada: se ve con Mostrar completadas apagado,
# aunque sea una periódica con completados.
# Cada tarea se nombra por su título (una palabra). "Pendientes muestra en
# orden" da los títulos de arriba hacia abajo, separados por ", ", y la
# lista no tiene otras filas. "Pendientes muestra como completadas" da, en
# orden, los títulos de las filas que se ven completadas; las demás se ven
# no completadas. Cuando el paso no da creadaEn, la tarea se creó antes de
# cualquier otra fecha del escenario, en el orden declarado. "la tarea X fue
# pospuesta con la opción <opcion> el <momento>" es tocar Posponer en su
# panel en ese momento y elegir la opción. Sin el paso "Mostrar completadas
# está encendido", el check está en su valor inicial (apagado).
# Semana de referencia: lunes 2026-07-13 a domingo 2026-07-19.
Feature: Orden con tareas pospuestas

  # Orden con tareas pospuestas 1
  # Pagar (atrasada, pospuesta hasta las 13:00 del 15) y Regar (pendiente,
  # pospuesta hasta las 07:00 del 16) van en espera por hasta, entre las en
  # espera por su regla (Sábanas vuelve a las 00:00 del 16): fila 1. Al
  # vencer, Pagar vuelve a ser la primera atrasada (fila 2) y Regar vuelve
  # a pendiente con su clave, creadaEn (fila 3).
  Scenario Outline: Orden con tareas pospuestas 1
    Given una tarea puntual Foco sin fecha límite
    And una tarea puntual Pagar con fecha límite <limite>
    And la tarea Pagar fue pospuesta con la opción <opcion_pagar> el <pospuesta_pagar>
    And una tarea periódica relativa Regar cada <cada_regar> <unidad_regar>
    And la tarea Regar fue pospuesta con la opción <opcion_regar> el <pospuesta_regar>
    And una tarea periódica semanal Sábanas los <dias> creada el <creada_sabanas>
    When consulto Pendientes el <ahora>
    Then Pendientes muestra en orden <orden>

    Examples:
      | limite     | opcion_pagar | pospuesta_pagar     | cada_regar | unidad_regar | opcion_regar | pospuesta_regar     | dias   | creada_sabanas      | ahora               | orden                       |
      | 2026-07-14 | 3 horas      | 2026-07-15T10:00:00 | 2          | dias         | hasta mañana | 2026-07-15T10:00:00 | jueves | 2026-07-15T08:00:00 | 2026-07-15T11:00:00 | Foco, Pagar, Sábanas, Regar |
      | 2026-07-14 | 3 horas      | 2026-07-15T10:00:00 | 2          | dias         | hasta mañana | 2026-07-15T10:00:00 | jueves | 2026-07-15T08:00:00 | 2026-07-15T13:00:00 | Pagar, Foco, Sábanas, Regar |
      | 2026-07-14 | 3 horas      | 2026-07-15T10:00:00 | 2          | dias         | hasta mañana | 2026-07-15T10:00:00 | jueves | 2026-07-15T08:00:00 | 2026-07-16T07:00:00 | Pagar, Regar, Sábanas, Foco |

  # Orden con tareas pospuestas 2
  # Con Mostrar completadas apagado, Regar (pospuesta, con un completado de
  # hoy) se ve: no está completada. Basura, en espera por su regla con un
  # completado, no se ve.
  Scenario Outline: Orden con tareas pospuestas 2
    Given una tarea puntual Foco sin fecha límite
    And una tarea periódica relativa Regar cada <cada_regar> <unidad_regar>
    And la tarea Regar fue completada el <completada_regar>
    And la tarea Regar fue pospuesta con la opción <opcion_regar> el <pospuesta_regar>
    And una tarea periódica relativa Basura cada <cada_basura> <unidad_basura>
    And la tarea Basura fue completada el <completada_basura>
    When consulto Pendientes el <ahora>
    Then Pendientes muestra en orden <orden>

    Examples:
      | cada_regar | unidad_regar | completada_regar    | opcion_regar | pospuesta_regar     | cada_basura | unidad_basura | completada_basura   | ahora               | orden       |
      | 4          | horas        | 2026-07-15T08:00:00 | 3 horas      | 2026-07-15T12:30:00 | 1           | dias          | 2026-07-15T09:00:00 | 2026-07-15T13:00:00 | Foco, Regar |

  # Orden con tareas pospuestas 3
  # Con Mostrar completadas encendido, Regar va con las no completadas y
  # Basura con las completadas.
  Scenario Outline: Orden con tareas pospuestas 3
    Given Mostrar completadas está encendido
    And una tarea puntual Foco sin fecha límite
    And una tarea periódica relativa Regar cada <cada_regar> <unidad_regar>
    And la tarea Regar fue completada el <completada_regar>
    And la tarea Regar fue pospuesta con la opción <opcion_regar> el <pospuesta_regar>
    And una tarea periódica relativa Basura cada <cada_basura> <unidad_basura>
    And la tarea Basura fue completada el <completada_basura>
    When consulto Pendientes el <ahora>
    Then Pendientes muestra en orden <orden>
    And Pendientes muestra como completadas <completadas>

    Examples:
      | cada_regar | unidad_regar | completada_regar    | opcion_regar | pospuesta_regar     | cada_basura | unidad_basura | completada_basura   | ahora               | orden               | completadas |
      | 4          | horas        | 2026-07-15T08:00:00 | 3 horas      | 2026-07-15T12:30:00 | 1           | dias          | 2026-07-15T09:00:00 | 2026-07-15T13:00:00 | Foco, Regar, Basura | Basura      |
