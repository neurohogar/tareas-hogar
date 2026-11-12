import { cambiosSinGuardarSteps } from './cambios-sin-guardar';
import { checkboxSteps } from './checkbox';
import { crearSteps } from './crear';
import { deshacerSteps } from './deshacer';
import { edicionSteps } from './edicion';
import { emojiYNotaSteps } from './emoji-y-nota';
import { esfuerzoSteps } from './esfuerzo';
import { emojisRecientesSteps } from './emojis-recientes';
import { etiquetasSteps } from './etiquetas';
import { fuenteSteps } from './fuente';
import { historialSteps } from './historial';
import { horarioSteps } from './horario';
import { orientacionVerticalSteps } from './orientacion-vertical';
import { panelPestanasSteps } from './panel-pestanas';
import { pantallaDeCargaSteps } from './pantalla-de-carga';
import { pausarSteps } from './pausar';
import { pendientesSteps } from './pendientes';
import { periodicaCalendarioSteps } from './periodica-calendario';
import { periodicaRelativaSteps } from './periodica-relativa';
import { posponerSteps } from './posponer';
import { puntualSteps } from './puntual';
import { ultimaVezSteps } from './ultima-vez';
import type { StepDefinition } from './world';

export { createWorld, type StepDefinition, type World } from './world';

export const steps: StepDefinition[] = [...crearSteps, ...periodicaRelativaSteps, ...periodicaCalendarioSteps, ...puntualSteps, ...pendientesSteps, ...edicionSteps, ...historialSteps, ...deshacerSteps, ...etiquetasSteps, ...emojiYNotaSteps, ...emojisRecientesSteps, ...checkboxSteps, ...horarioSteps, ...ultimaVezSteps, ...pausarSteps, ...posponerSteps, ...esfuerzoSteps, ...panelPestanasSteps, ...cambiosSinGuardarSteps, ...fuenteSteps, ...pantallaDeCargaSteps, ...orientacionVerticalSteps];
