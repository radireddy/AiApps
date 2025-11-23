/**
 * Property schemas for all components
 * Import and register all schemas here
 * 
 * NOTE: Schemas are registered but not actively used for rendering.
 * Components continue to use their legacy property renderers to preserve UX.
 * The metadata system is available for future use or gradual migration.
 */

import { registerPropertySchema } from '../registry';
import { panelSchema } from './panel';
import { hStackSchema } from './hStack';
import { vStackSchema } from './vStack';
import { dividerSchema } from './divider';
import { inputSchema } from './input';
import { labelSchema } from './label';
import { buttonSchema } from './button';
import { textareaSchema } from './textarea';
import { selectSchema } from './select';
import { checkboxSchema } from './checkbox';
import { radioGroupSchema } from './radioGroup';
import { switchSchema } from './switch';
import { imageSchema } from './image';
import { tableSchema } from './table';

// Register all schemas
// Components using metadata-driven system will use PropertyTabs with smart layout to preserve original UX with efficient layouts
export function registerAllPropertySchemas(): void {
  // Schemas are available - when registered, components use metadata backend with tabs and smart layouts
  registerPropertySchema(panelSchema); // ✅ Panel uses metadata backend with Container Layout icons
  registerPropertySchema(hStackSchema); // ✅ H-Stack uses metadata backend with Container Layout icons
  registerPropertySchema(vStackSchema); // ✅ V-Stack uses metadata backend with Container Layout icons
  registerPropertySchema(dividerSchema); // ✅ Divider uses metadata backend
  registerPropertySchema(inputSchema); // ✅ Input uses metadata backend
  registerPropertySchema(labelSchema); // ✅ Label uses metadata backend
  registerPropertySchema(buttonSchema); // ✅ Button uses metadata backend
  registerPropertySchema(textareaSchema); // ✅ Textarea uses metadata backend
  registerPropertySchema(selectSchema); // ✅ Select uses metadata backend
  registerPropertySchema(checkboxSchema); // ✅ Checkbox uses metadata backend
  registerPropertySchema(radioGroupSchema); // ✅ RadioGroup uses metadata backend
  registerPropertySchema(switchSchema); // ✅ Switch uses metadata backend
  registerPropertySchema(imageSchema); // ✅ Image uses metadata backend
  registerPropertySchema(tableSchema); // ✅ Table uses metadata backend
}
