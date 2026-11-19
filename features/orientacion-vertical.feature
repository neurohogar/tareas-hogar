# mutation-stamp: sha256=271188b4b948fd507e6d7a4c7f7e5f4604cb8d54f897ee1dea7098287f1947af
# acceptance-mutation-manifest-begin
# {"version":1,"tested_at":"2026-11-19T12:44:57.402063006Z","feature_name":"Portrait orientation","feature_path":"features/orientacion-vertical.feature","background_hash":"74234e98afe7498fb5daf1f36ac2d78acc339464f950703b8c019892f982b90b","implementation_hash":"sha256:e7ec3965adf1fdfb7a513990a7585413c42879491ac71295f7f0dd06a842c49b","scenarios":[{"index":0,"name":"Portrait orientation 1","scenario_hash":"5e9d4b298a9088b720291dae0d5374924745219995ff37ff330d6331846fb3b4","mutation_count":8,"result":{"Total":8,"Killed":8,"Survived":0,"Errors":0},"tested_at":"2026-11-19T12:44:57.402063006Z"}]}
# acceptance-mutation-manifest-end

# Spec §6 (Orientation) and §8 (Manifest). The installed app is used in portrait
# because the manifest it publishes declares so, and that is the only thing that decides it: the
# orientation applies to the installed app, on all its screens, and not in a
# browser tab nor on the computer. `portrait` allows both vertical
# directions (`portrait-primary` or `portrait-secondary` would fix one), and
# `standalone` is what makes the orientation apply when opened from its
# icon. That in a browser tab it keeps rotating with the usual wide layout,
# that nothing changes on the computer, that no screen fixes the
# orientation on its own and that a new version applies it without reinstalling
# are verified in the QA suite (qa/orientacion-vertical.md).
Feature: Portrait orientation

  # Portrait orientation 1
  # What the published manifest declares: name, short name, opening
  # mode and orientation.
  Scenario Outline: Portrait orientation 1
    Given the manifest the app publishes
    Then the field <field> of the manifest is <value>

    Examples:
      | field       | value        |
      | name        | Tareas Hogar |
      | short_name  | Tareas       |
      | display     | standalone   |
      | orientation | portrait     |
