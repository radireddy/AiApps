/**
 * Property schemas for all components
 * Import and register all schemas here
 * 
 * NOTE: Schemas are registered but not actively used for rendering.
 * Components continue to use their legacy property renderers to preserve UX.
 * The metadata system is available for future use or gradual migration.
 */

import { registerPropertySchema } from '../registry';
// import { panelSchema } from './panel';
import { dividerSchema } from './divider';
import { inputSchema } from './input';
import { labelSchema } from './label';
import { buttonSchema } from './button';
import { textareaSchema } from './textarea';
import { selectSchema } from './select';
import { checkboxSchema } from './checkbox';
import { radioGroupSchema } from './radioGroup';
import { switchSchema } from './switch';

// Register all schemas
// Components using metadata-driven system will use SmartLayoutRenderer to preserve original UX with efficient layouts
export function registerAllPropertySchemas(): void {
  // Schemas are available - when registered, components use metadata backend with legacy UX
  // Uncomment to enable metadata-driven rendering for specific components:
  // registerPropertySchema(panelSchema);
  registerPropertySchema(dividerSchema); // ✅ Divider uses metadata backend
  registerPropertySchema(inputSchema); // ✅ Input uses metadata backend
  registerPropertySchema(labelSchema); // ✅ Label uses metadata backend
  registerPropertySchema(buttonSchema); // ✅ Button uses metadata backend
  registerPropertySchema(textareaSchema); // ✅ Textarea uses metadata backend
  registerPropertySchema(selectSchema); // ✅ Select uses metadata backend
  registerPropertySchema(checkboxSchema); // ✅ Checkbox uses metadata backend
  registerPropertySchema(radioGroupSchema); // ✅ RadioGroup uses metadata backend
  registerPropertySchema(switchSchema); // ✅ Switch uses metadata backend
}
