
import { GoogleGenAI, Type } from "@google/genai";
import { AppDefinition, ComponentType, DataStore, AppVariableType, AppComponent, ComponentProps } from '../types';
import { componentRegistry } from '../components/component-registry/registry';

const componentEnum = ['LABEL', 'INPUT', 'BUTTON', 'IMAGE', 'PANEL', 'TEXTAREA', 'SELECT', 'CHECKBOX', 'DIVIDER', 'H_STACK', 'V_STACK', 'RADIO_GROUP', 'SWITCH', 'TABLE'];
const buttonActionEnum = ['alert', 'updateData', 'none', 'createRecord', 'updateRecord', 'deleteRecord', 'selectRecord', 'updateVariable', 'executeCode', 'navigate'];
const variableTypeEnum = ['string', 'number', 'boolean', 'object', 'array'];

// Defines the properties for a single component. This is re-used in the patch schema.
const componentPropertiesSchema = {
    type: Type.OBJECT,
    description: "Properties for the component, varies by type.",
    properties: {
       x: { type: Type.NUMBER },
       y: { type: Type.NUMBER },
       width: { type: Type.NUMBER },
       height: { type: Type.NUMBER },
       hidden: { type: Type.STRING },
       disabled: { type: Type.STRING },
       // Add other relevant props from the main app schema here as needed.
       // For a patch, we don't need to list every single possible property,
       // as the AI will only return the ones that are changing.
       text: { type: Type.STRING },
       backgroundColor: { type: Type.STRING },
       color: { type: Type.STRING },
       //... any other prop the AI might need to add or change
    },
};

const patchSchema = {
  type: Type.OBJECT,
  properties: {
    add: {
      type: Type.ARRAY,
      description: "An array of new UI components to add to the page.",
      items: {
        type: Type.OBJECT,
        properties: {
          id: { type: Type.STRING, description: "A NEW, unique identifier for the component, e.g., 'LABEL_12345'." },
          type: { type: Type.STRING, enum: componentEnum },
          parentId: { type: Type.STRING, description: "The ID of the parent container component, if nested." },
          props: componentPropertiesSchema,
        },
        required: ['id', 'type', 'props']
      }
    },
    update: {
      type: Type.ARRAY,
      description: "An array of updates to apply to existing components.",
      items: {
        type: Type.OBJECT,
        properties: {
          id: { type: Type.STRING, description: "The ID of the existing component to update." },
          props: componentPropertiesSchema
        },
        required: ['id', 'props']
      }
    },
    delete: {
      type: Type.ARRAY,
      description: "An array of component IDs to delete from the page.",
      items: { type: Type.STRING }
    },
    variables: {
      type: Type.ARRAY,
      description: "An array of new app-level state variables to add.",
      items: {
          type: Type.OBJECT,
          properties: {
              id: { type: Type.STRING },
              name: { type: Type.STRING },
              type: { type: Type.STRING, enum: variableTypeEnum },
              initialValue: { type: Type.STRING },
          },
          required: ['id', 'name', 'type', 'initialValue']
      }
    },
  },
};


/**
 * Generates or modifies the application layout using the Gemini AI model.
 * 
 * This function sends the current app state and user prompt to the LLM.
 * The LLM is instructed to return a "JSON Patch" object containing lists of
 * components to add, update, or delete.
 * 
 * It handles:
 * 1. Constructing the system prompt with current context.
 * 2. Calling the Gemini API with JSON schema enforcement.
 * 3. Parsing the response.
 * 4. Post-processing new components (auto-parenting logic based on coordinates).
 * 
 * @param prompt - The user's natural language request (e.g., "Add a login form").
 * @param currentApp - The current state of the application.
 * @param currentPageId - The ID of the currently active page.
 * @returns A Promise resolving to the new AppDefinition, or null on failure.
 */
export const generateAppLayout = async (prompt: string, currentApp: AppDefinition, currentPageId: string): Promise<AppDefinition | null> => {
  const API_KEY = process.env.API_KEY;

  if (!API_KEY) {
    alert("Gemini API key is not configured. AI features will not work.");
    throw new Error("Gemini API key is not configured.");
  }

  const ai = new GoogleGenAI({ apiKey: API_KEY });
  const currentPageComponents = currentApp.components.filter(c => c.pageId === currentPageId);

  // FIX: To improve performance and prevent timeouts, the large application context is separated
  // from the user's prompt. The context is passed as a `systemInstruction`, which is the
  // recommended approach for providing background information to the model.
  const systemInstruction = `You are an expert application designer acting as a PATCH editor.
Your task is to modify an existing application layout based on a user's request by providing a JSON "patch" object containing ONLY the requested changes.

**RESPONSE RULES:**
1.  **JSON Patch Format**: Your response MUST be a JSON object conforming to the provided schema, containing 'add', 'update', 'delete', and 'variables' arrays. Only include arrays for the operations you are performing.
2.  **Use Context**: Use the provided context to inform your response.
    -   To **update** a component, you MUST find its \`id\` from the context and use it in the \`update\` array.
    -   To **delete** a component, you MUST use its \`id\` from the context.
3.  **Styling**: ALL styling properties MUST use expressions to reference the \`theme\` object from the context.
    -   Example: \`{{theme.colors.primary}}\`.
    -   DO NOT use hardcoded hex values (e.g., "#FFFFFF").
4.  **Layout & Nesting**:
    -   When adding new components, provide their \`x\`, \`y\`, \`width\`, and \`height\` properties as absolute coordinates from the top-left of the canvas.
    -   The canvas is 1000px wide and 600px tall.
    -   If a new component is visually inside another, you SHOULD set its \`parentId\` property to the container's ID.
5.  **IDs**: When adding a new component, you MUST generate a new, unique ID for it in the format 'TYPE_UNIQUEID' (e.g., 'INPUT_12345').

---
**APPLICATION CONTEXT:**
Here is the full JSON context of the application's current state. Use this to inform your response.

**Current Page Components:**
${JSON.stringify(currentPageComponents)}

**App Theme:**
${JSON.stringify(currentApp.theme)}

**App Variables:**
${JSON.stringify(currentApp.variables)}

**Data Sources:**
The available data sources are: ${currentApp.dataSources.map(ds => `'${ds.id}' (type: ${ds.providerId})`).join(', ') || 'none'}. Use these names for data source actions.
`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        systemInstruction: systemInstruction,
        responseMimeType: "application/json",
        responseSchema: patchSchema,
      },
    });

    const jsonText = response.text.trim();
    let patch = JSON.parse(jsonText);

    // FIX: The Gemini model, even with a JSON schema, sometimes returns a
    // string that contains another stringified JSON object. This checks if the
    // initial parse resulted in a string and, if so, parses it again to get
    // the actual patch object. This resolves the bug where generated layouts
    // were not appearing on the canvas.
    if (typeof patch === 'string') {
        try {
            patch = JSON.parse(patch);
        } catch (e) {
            console.error("Failed to double-parse AI response:", e, "Original text:", jsonText);
            alert("The AI returned a malformed layout. Please try again.");
            return null;
        }
    }


    if (!patch) return null;

    if (Array.isArray(patch.components)) {
        if (!Array.isArray(patch.add)) {
            patch.add = [];
        }
        patch.add.push(...patch.components);
        delete patch.components;
    }


    let currentComponents = [...currentApp.components];
    const dataStoreUpdates: DataStore = {};

    if (patch.delete?.length) {
        const idsToDelete = new Set<string>(patch.delete);
        let changed = true;
        while (changed) {
            changed = false;
            const childrenToDelete = currentComponents.filter(c => c.parentId && idsToDelete.has(c.parentId));
            if (childrenToDelete.length > 0) {
                childrenToDelete.forEach(c => idsToDelete.add(c.id));
                changed = true;
            }
        }
        currentComponents = currentComponents.filter(c => !idsToDelete.has(c.id));
    }
    
    if (patch.update?.length) {
        const updatesMap = new Map(patch.update.map((u: { id: string, props: any }) => [u.id, u.props]));
        currentComponents = currentComponents.map(c => {
            if (updatesMap.has(c.id)) {
                const newProps = updatesMap.get(c.id);
                return { ...c, props: { ...c.props, ...(typeof newProps === 'object' && newProps ? newProps : {}) } };
            }
            return c;
        });
    }

    // FIX: The entire auto-parenting logic has been rewritten with a robust two-pass system.
    // This prevents race conditions and ensures nested components are grouped correctly,
    // which also fixes the "nothing shown on UI" bug caused by invalid coordinates.
    if (patch.add?.length) {
        const getAbsolutePosition = (cId: string, allComps: AppComponent[]): { x: number; y: number } => {
            const component = allComps.find(c => c.id === cId);
            if (!component) return { x: 0, y: 0 };
    
            let absX = component.props.x;
            let absY = component.props.y;
            let currentParentId = component.parentId;
            while (currentParentId) {
                const parent = allComps.find(p => p.id === currentParentId);
                if (parent) {
                    absX += parent.props.x;
                    absY += parent.props.y;
                    currentParentId = parent.parentId;
                } else {
                    break;
                }
            }
            return { x: absX, y: absY };
        };

        // 1. Create component objects from the patch, but don't add to main list yet.
        const newComponents = patch.add.map((comp: any) => {
            if (!comp || typeof comp !== 'object' || !comp.id || !comp.type) {
                console.warn('Skipping invalid component from AI patch:', comp);
                return null;
            }
            const plugin = componentRegistry[comp.type as ComponentType];
            const finalComp: AppComponent = {
                id: comp.id, type: comp.type, parentId: comp.parentId || null, pageId: currentPageId,
                props: { ...(plugin?.paletteConfig.defaultProps || {}), ...(comp.props || {}), } as ComponentProps
            };
            const props = finalComp.props as any;
            if (props.dataStoreKey && !props.dataStoreKey.includes('.')) {
                if (!currentApp.dataStore.hasOwnProperty(props.dataStoreKey)) {
                    dataStoreUpdates[props.dataStoreKey] = (comp.type === ComponentType.CHECKBOX || comp.type === ComponentType.SWITCH) ? false : '';
                }
            }
            return finalComp;
        }).filter((c): c is AppComponent => c !== null);

        if (newComponents.length > 0) {
            // 2. Create a complete list of all components (old + new) for parenting checks.
            const allPotentialComponents = [...currentComponents, ...newComponents];
            const allContainersOnPage = allPotentialComponents.filter(c => c.pageId === currentPageId && componentRegistry[c.type]?.isContainer);

            // 3. PASS 1: Establish parent-child relationships for new components based on absolute coordinates.
            newComponents.forEach(component => {
                if (component.parentId) return; // Respect AI's pre-assigned parent.

                const centerX = component.props.x + component.props.width / 2;
                const centerY = component.props.y + component.props.height / 2;
                let bestParent: AppComponent | null = null;
                let smallestArea = Infinity;

                allContainersOnPage.forEach(parent => {
                    if (parent.id === component.id) return;
                    const parentAbsPos = getAbsolutePosition(parent.id, allPotentialComponents);
                    if (centerX >= parentAbsPos.x && centerX <= parentAbsPos.x + parent.props.width &&
                        centerY >= parentAbsPos.y && centerY <= parentAbsPos.y + parent.props.height) {
                        const area = parent.props.width * parent.props.height;
                        if (area < smallestArea) {
                            smallestArea = area;
                            bestParent = parent;
                        }
                    }
                });

                if (bestParent) {
                    component.parentId = bestParent.id;
                }
            });

            // 4. Merge the new components into the main list.
            currentComponents.push(...newComponents);

            // 5. PASS 2: Convert coordinates to be relative for any new component that was assigned a parent.
            newComponents.forEach(component => {
                if (component.parentId) {
                    const parentAbsPos = getAbsolutePosition(component.parentId, currentComponents);
                    (component.props as any).x -= parentAbsPos.x;
                    (component.props as any).y -= parentAbsPos.y;
                }
            });
        }
    }

    const newVariables = Array.isArray(patch.variables) ? patch.variables : [];

    const newAppDefinition: AppDefinition = {
        ...currentApp,
        components: currentComponents,
        variables: (currentApp.variables || []).concat(newVariables),
        dataStore: {
            ...currentApp.dataStore,
            ...dataStoreUpdates
        },
    };

    return newAppDefinition;

  } catch (error) {
    console.error("Error calling Gemini API:", error);
    if (error instanceof Error && error.message.toLowerCase().includes('timeout')) {
        alert("AI generation timed out. The request is taking too long to process. Please try again, perhaps with a simpler prompt.");
    } else {
        alert("Failed to call the Gemini API. Please try again.");
    }
    return null;
  }
};
