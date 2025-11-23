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

// Register all schemas
// Currently commented out to preserve original UX - components use legacy renderers
export function registerAllPropertySchemas(): void {
  // Schemas are available but not registered to preserve original UX
  // Uncomment to enable metadata-driven rendering for specific components:
  // registerPropertySchema(panelSchema);
  // registerPropertySchema(dividerSchema);
  
  // Add more schemas as they are created
  // registerPropertySchema(buttonSchema);
  // registerPropertySchema(labelSchema);
  // etc.
}
