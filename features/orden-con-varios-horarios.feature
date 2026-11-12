# mutation-stamp: sha256=f1dba72792e8a142a458d3c5e2caf7bd49616999dc9bacef0ddbb5e9a1336a96
# acceptance-mutation-manifest-begin
# {"version":1,"tested_at":"2026-11-02T23:10:38.885182679Z","feature_name":"Orden con varios horarios","feature_path":"features/orden-con-varios-horarios.feature","background_hash":"74234e98afe7498fb5daf1f36ac2d78acc339464f950703b8c019892f982b90b","implementation_hash":"sha256:5702bab0708f3db89a85cf653a4e407c970f954a2e70298676b2ebd41d0bc6b7","scenarios":[{"index":0,"name":"Orden con varios horarios 1","scenario_hash":"652ebe97dcb5792e79cfa7eba3bac2bc7240cf0f1ed540ad76a1c0cdb6a0ef22","mutation_count":21,"result":{"Total":21,"Killed":21,"Survived":0,"Errors":0},"tested_at":"2026-11-02T23:10:38.885182679Z"},{"index":1,"name":"Orden con varios horarios 2","scenario_hash":"5992a6193aba5d26324caa0d510abf08ac331f67c875eb7bb85baf186e5c09ae","mutation_count":26,"result":{"Total":26,"Killed":26,"Survived":0,"Errors":0},"tested_at":"2026-11-02T23:10:38.885182679Z"}]}
# acceptance-mutation-manifest-end

# Spec §5.5, §5.6 y §6.1. El orden por urgencia de una tarea con varias
# ventanas usa la ocurrencia N: C (el hasta de su ventana) como inicio de
# atrasada y A (su desde) como inicio de pendiente. Una relativa sin
# horario usa V + intervalo y V. Semana de referencia: martes 2026-07-14,
# miércoles 15.
Feature: Orden con varios horarios

  # Orden con varios horarios 1
  # Atrasadas: Basura (calendario, creada el martes) perdió la mañana del
  # miércoles y está atrasada desde su cierre (10:00). Regar, relativa sin
  # horario, desde V + intervalo: fila 1, a las 11:00, después; fila 2, a
  # las 09:00, antes.
  Scenario Outline: Orden con varios horarios 1
    Given una tarea periódica semanal Basura los <dias> creada el <creada_basura>
    And la tarea Basura se puede completar de <desde> a <hasta> y de <desde2> a <hasta2>
    And una tarea periódica relativa Regar cada <cada> <unidad>
    And la tarea Regar fue completada el <completada_regar>
    When consulto Pendientes el <ahora>
    Then Pendientes muestra en orden <orden>

    Examples:
      | dias      | creada_basura       | desde | hasta | desde2 | hasta2 | cada | unidad | completada_regar    | ahora               | orden         |
      | miércoles | 2026-07-14T12:00:00 | 07:00 | 10:00 | 18:00  | 21:00  | 4    | horas  | 2026-07-15T03:00:00 | 2026-07-15T12:00:00 | Basura, Regar |
      | miércoles | 2026-07-14T12:00:00 | 07:00 | 10:00 | 18:00  | 21:00  | 4    | horas  | 2026-07-15T01:00:00 | 2026-07-15T12:00:00 | Regar, Basura |

  # Orden con varios horarios 2
  # Pendientes: Basura, con la mañana cubierta, está pendiente desde el
  # desde de la tarde (18:00), no desde las 00:00 del día. Regar, relativa
  # sin horario, desde V: fila 1, a las 18:30, después; fila 2, a las 17:30,
  # antes.
  Scenario Outline: Orden con varios horarios 2
    Given una tarea periódica semanal Basura los <dias>
    And la tarea Basura tiene un completado del <completada_basura> que cubre el <cubierta_basura>
    And la tarea Basura se puede completar de <desde> a <hasta> y de <desde2> a <hasta2>
    And una tarea periódica relativa Regar cada <cada> <unidad>
    And la tarea Regar fue completada el <completada_regar>
    When consulto Pendientes el <ahora>
    Then Pendientes muestra en orden <orden>

    Examples:
      | dias      | completada_basura   | cubierta_basura     | desde | hasta | desde2 | hasta2 | cada | unidad | completada_regar    | ahora               | orden         |
      | miércoles | 2026-07-15T08:00:00 | 2026-07-15T07:00:00 | 07:00 | 10:00 | 18:00  | 21:00  | 1    | dias   | 2026-07-14T18:30:00 | 2026-07-15T19:00:00 | Basura, Regar |
      | miércoles | 2026-07-15T08:00:00 | 2026-07-15T07:00:00 | 07:00 | 10:00 | 18:00  | 21:00  | 1    | dias   | 2026-07-14T17:30:00 | 2026-07-15T19:00:00 | Regar, Basura |
