// Export all component property schemas
import { registerPropertySchema } from '../registry';
import { inputSchema } from './InputSchema';
import { panelSchema } from './PanelSchema';
import { labelSchema } from './LabelSchema';

// Register all schemas
registerPropertySchema(inputSchema);
registerPropertySchema(panelSchema);
registerPropertySchema(labelSchema);

// Export for convenience
export { inputSchema } from './InputSchema';
export { panelSchema } from './PanelSchema';
export { labelSchema } from './LabelSchema';

