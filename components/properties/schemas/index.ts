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
// import { dividerSchema } from './divider';
import { inputSchema } from './input';

// Register all schemas
// Components using metadata-driven system will use LegacyUXRenderer to preserve original UX
export function registerAllPropertySchemas(): void {
  // Schemas are available - when registered, components use metadata backend with legacy UX
  // Uncomment to enable metadata-driven rendering for specific components:
  // registerPropertySchema(panelSchema);
  // registerPropertySchema(dividerSchema);
  registerPropertySchema(inputSchema); // ✅ Input uses metadata backend with legacy UX
  
  // Add more schemas as they are created
  // registerPropertySchema(buttonSchema);
  // registerPropertySchema(labelSchema);
  // etc.
}
