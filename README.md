# Tareas Hogar

App web instalable (PWA) de tareas del hogar pensada para adultos con TDAH, TEA y altas capacidades, incluidos quienes comparten casa.

La idea es simple: que no se olviden las tareas recurrentes y que la lista muestre primero lo que hay que hacer ahora, sin ruido ni culpa.

## Qué hace hoy

- Tareas puntuales y periódicas: cada N días u horas, o ciertos días de la semana o del mes.
- Estados claros: pendiente, atrasada y en espera, con una barra que muestra cuánto falta para que vuelva.
- Horarios en los que una tarea tiene sentido, posponer, pausar, etiquetas con color y una estimación de esfuerzo con el filtro «Solo rápidas».
- Historial de todo lo completado, con deshacer.
- Funciona sin conexión y sincroniza entre dispositivos. Se entra con Google.
- Fuente Atkinson Hyperlegible y emoji empaquetados, para que se vea igual en todos lados.

Qué construye la app y por qué: [`docs/spec.md`](docs/spec.md).

## Diseño basado en evidencia

La versión 3 se diseña a partir de investigación publicada, no de intuiciones. La base está en [`docs/research/v3/`](docs/research/v3/): cuatro documentos sobre TDAH, TEA, altas capacidades y doble excepcionalidad, y hogares compartidos y apps existentes. Cada hallazgo indica la fuerza de su evidencia y sus fuentes. El [`README`](docs/research/v3/README.md) de esa carpeta explica el método y cómo ampliarla.

Algunos principios que salieron de ahí:

- **Bajar el costo de arrancar:** un primer paso concreto, una sola tarea por vez.
- **Cero culpa:** sin rachas que se rompen ni contadores de atrasadas que crecen.
- **Invitar, no ordenar:** la persona decide qué se le avisa y cuándo.
- **Tono adulto:** sin puntos, medallas ni mascotas.

## Correrla en tu compu

Requisitos: Node.js 26 y [Firebase CLI](https://firebase.google.com/docs/cli).

```sh
npm ci
npm run emulators   # Auth y Firestore locales, en otra terminal
npm run dev
```

La app de desarrollo usa los emuladores de Firebase, así que no hace falta ninguna cuenta.

## Publicar tu propia copia

1. Creá un proyecto en la [consola de Firebase](https://console.firebase.google.com/) con Authentication (Google), Firestore y Hosting.
2. Copiá `.env.production.example` a `.env.production` y completalo con la configuración web de tu proyecto.
3. Copiá `.firebaserc.example` a `.firebaserc` y poné el ID de tu proyecto en `prod`.
4. `npm run deploy` publica la app y las reglas de Firestore.

## Cómo se desarrolla

Cada funcionalidad pasa por un pipeline de diez roles (análisis, especificación, Gherkin, implementación, limpieza, arquitectura, endurecimiento y QA), con gates deterministas de cobertura, complejidad (CRAP), duplicación y mutación. El detalle está en [`CLAUDE.md`](CLAUDE.md) y [`docs/pipeline/`](docs/pipeline/).

| Comando | Qué hace |
|---|---|
| `npm test` | Tests unitarios y de aceptación generados desde `features/*.feature` |
| `npm run test:props` | Property tests |
| `npm run check:arch` | Reglas de dependencias entre capas |
| `npm run qa` | Suite Playwright contra los emuladores de Firebase |

Las herramientas de calidad vienen de [Acceptance Pipeline Specification](https://github.com/unclebob/Acceptance-Pipeline-Specification), [crapper](https://github.com/unclebob/crapper), [dryer](https://github.com/unclebob/dryer) y [mutator](https://github.com/unclebob/mutator). El orquestador del pipeline (`bdd-pipeline`) todavía no está publicado, así que por ahora los gates no se pueden correr fuera del entorno original. Los tests y la suite QA sí.

## Licencia

[AGPL-3.0](LICENSE). Podés usarla, modificarla y alojarla. Si publicás una versión modificada, también como servicio web, tenés que compartir su código con la misma licencia.
