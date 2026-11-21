# QA: cleanups retry and data that is no longer used

Verifies, through the interface only (except for the emulator reading that is indicated):

- that the cleanup of orphan completions (spec §7) is retried when the connection comes back and when the data changes, with no timers and with the app announcing and counting nothing;
- that one failing attempt does not stop the others from being cleaned;
- that the fields `etiquetas` and `esfuerzo` of a task, the `etiquetas` collection and the `anotaciones` collection, which may still be in the data, are not shown, not written and not deleted by the app (§7, **Datos que ya no se usan**), including after editing and deleting a task, and that the tab bar has only **Pendientes** and **Historial**.

Covers spec §6.2 (**Borrar tarea**) and §7 (**Borrado de tareas**, **Limpiezas y reintentos**, **Datos que ya no se usan**).

Out of scope: which items are attempted and which stay to be cleaned (each item separately), covered by `features/cleanups-retry.feature`; the redirects of `/etiquetas` and `/anotaciones`, covered by `qa/navigation.md`.

## Entorno

- Firebase Emulator Suite (Auth + Firestore) with clean data at the start of each flow; session with `qa@example.com`.
- Simulated browser clock (`page.clock`) installed **before** opening the app, in `America/Argentina/Buenos_Aires`; reference week: Wednesday 2026-07-15 (today). Steps that measure seconds use the paused clock (`page.clock.pauseAt`) and advance it with `page.clock.runFor`.
- **Two devices**: two independent browser contexts A and B with the same account; "B offline" is `browserContext.setOffline(true)`; "B has connection again" is putting it back online and waiting for the screens to update by themselves.
- **Cleanup failure**: the orphan cleanups confirm with the server before deleting, so they fail when there is no connection. "Cut the connection during the attempt" is: with B's network delayed (CDP `Network.emulateNetworkConditions` with a 3 s latency), wait for the orphan data to arrive and call `setOffline(true)` before the attempt finishes.
- **Auxiliary reading**: the interface does not show orphans, so their cleanup is only checked by reading the emulator (Firestore Emulator REST, `GET /v1/projects/<id>/databases/(default)/documents/users/<uid>/completados`, and the same with `tareas`, `etiquetas` and `anotaciones`).
- **Phone**: 390 x 844.

## Contrato observable

- **Silent cleanups**: during the retries no text, counter, mark or strip other than "Sin conexión" appears (the connection strip is the usual one).
- **Navigation bar**: a `navigation` region with two links, in this order: **Pendientes** and **Historial**.
- **History**: an orphan completion is never shown in **Historial**.

## Flujos

### Flujo 1: retry of an orphan on reconnect

1. A and B with the same account, with the task `Regar` (relative, every 1 day). B opens the app.
2. B offline. B completes `Regar` while offline; A deletes `Regar` (the task and its completions). When B has connection again, a completion whose task does not exist arrives.
3. Cut B's connection during the attempt to clean it (see Entorno). The orphan completion is not shown in **Historial** of B nor of A, and the emulator still has it (auxiliary reading).
4. B has connection again: without touching anything, the orphan completion disappears from the emulator (auxiliary reading). No text, counter or indicator is seen in B during the whole process, and **Historial** never showed it.
5. Repeat 2 and 3 without reconnecting B but causing a data change: with B still offline, B completes another task `Pagar` (its data changes); the orphan is not cleaned while there is no connection. B has connection again: it is cleaned.

### Flujo 2: one failure does not stop the others

1. With three orphan completions of three deleted tasks (by the path of Flujo 1) and B offline during the first attempt, B has connection again: the three are cleaned (auxiliary reading), also if the connection was cut during the attempt of the first or the second one.
2. At no moment do notices or pending counters appear, and **Historial** of B never showed any of them.

### Flujo 3: no timers

1. With an orphan completion that was left uncleaned because B was offline (Flujo 1, step 3), leave B with connection but without changing data, pause the clock and advance it 1 hour (`page.clock.runFor`): there is no retry by time (the emulator state does not change by the mere passing of simulated time).
2. Make the data change (A edits a task and B receives it): now it is retried and the orphan is cleaned (auxiliary reading).

### Flujo 4: data that is no longer used

Precondition: clock at `2026-07-15T08:00:00`, one device, session started. As in the auxiliary reading, the emulator is read and written through its REST (`PATCH` and `GET` on `/v1/projects/<id>/databases/(default)/documents/users/<uid>/...`); it is the only way to leave data from before this version.

1. Create `Regar` with **Intervalo** every `2` **días** and `Pagar` with **No se repite**. With the REST, add to the `Regar` document in `tareas` the fields `etiquetas` = `["x"]` and `esfuerzo` = `"media"`, create a document in the `etiquetas` collection (`nombre` = `Casa`, `color` = `rojo`) and two documents in the `anotaciones` collection: one with `tareaId` pointing to `Regar` and one with no task (`texto` = `quedó lindo`, `sentido` = `me sirvió`, `pantalla` = `Pendientes`). Reload.
2. The app looks the same as without that data: the `Regar` row shows no chips, effort level or annotation; Pendientes has no label filter, no **Solo rápidas** and no **Anotar** button; the bar has only **Pendientes** and **Historial**; and no notice appears.
3. Open `Regar`: the panel has no **Etiquetas** and no **Esfuerzo**. Change the title to `Regar plantas` and **Guardar**. Read the document (auxiliary reading): `titulo` is `Regar plantas` and `etiquetas` (`["x"]`) and `esfuerzo` (`"media"`) are untouched.
4. Open `Regar plantas`, change **Se repite** to **No se repite** and **Guardar**. Read the document: it no longer has the recurrence fields and still has `etiquetas` and `esfuerzo` untouched.
5. Read the `etiquetas` collection: the `Casa` document is still there, unchanged, and the two `anotaciones` documents are unchanged after the edits.
6. Complete `Regar plantas` (it has a completion), then delete it from its panel with the confirmation: the document disappears from `tareas` and its completion from `completados` (auxiliary reading); the `Casa` document in `etiquetas` is still there; both `anotaciones` documents are still there, byte for byte as seeded (including the one that points to the deleted task). Deleting a task does not touch them.
