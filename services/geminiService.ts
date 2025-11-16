

import { GoogleGenAI, Type } from "@google/genai";
import { AppDefinition, ComponentType, DataStore, AppVariableType, AppComponent } from '../types';
import { componentRegistry } from '../components/component-registry/registry';

const componentEnum = ['LABEL', 'INPUT', 'BUTTON', 'IMAGE', 'PANEL', 'FORM', 'TEXTAREA', 'SELECT', 'CHECKBOX', 'DIVIDER', 'H_STACK', 'V_STACK', 'RADIO_GROUP', 'SWITCH', 'TABLE', 'MODAL'];
// FIX: Added 'navigate' to the buttonActionEnum to match the available actions defined in types.ts.
const buttonActionEnum = ['alert', 'updateData', 'none', 'createRecord', 'updateRecord', 'deleteRecord', 'updateVariable', 'executeCode', 'navigate'];
const variableTypeEnum = ['string', 'number', 'boolean', 'object', 'array'];

const appSchema = {
  type: Type.OBJECT,
  properties: {
    variables: {
      type: Type.ARRAY,
      description: "An array of app-level state variables.",
      items: {
          type: Type.OBJECT,
          properties: {
              id: { type: Type.STRING, description: "A unique identifier for the variable, e.g., 'var-123'." },
              name: { type: Type.STRING, description: "The name of the variable, used in expressions, e.g., 'isLoading'." },
              type: { type: Type.STRING, enum: variableTypeEnum, description: "The data type of the variable." },
              initialValue: { type: Type.STRING, description: "The initial value as a string. For objects/arrays, this should be a valid JSON string." },
          },
          required: ['id', 'name', 'type', 'initialValue']
      }
    },
    components: {
      type: Type.ARRAY,
      description: "An array of UI components that make up the app.",
      items: {
        type: Type.OBJECT,
        properties: {
          id: { type: Type.STRING, description: "A unique identifier for the component, e.g., 'LABEL_12345'." },
          type: { type: Type.STRING, enum: componentEnum, description: "The type of the component." },
          parentId: { type: Type.STRING, description: "The ID of the parent container component, if nested." },
          props: {
            type: Type.OBJECT,
            description: "Properties for the component, varies by type.",
            properties: {
               x: { type: Type.NUMBER, description: "The x-coordinate. If the component has a parentId, this MUST be relative to the parent. Otherwise, it is absolute to the canvas (0-1000)." },
               y: { type: Type.NUMBER, description: "The y-coordinate. If the component has a parentId, this MUST be relative to the parent. Otherwise, it is absolute to the canvas (0-600)." },
               width: { type: Type.NUMBER, description: "The width of the component." },
               height: { type: Type.NUMBER, description: "The height of the component." },
               hidden: { type: Type.STRING, description: "An expression to control visibility, e.g., '{{!showAlert}}' or '{{!variableName}}'. If it evaluates to true, the component is hidden." },
               disabled: { type: Type.STRING, description: "Can be a boolean (as string 'true'/'false') or an expression like '{{isLoading}}' or '{{Table1.selectedRecord == null}}'." },
               opacity: { type: Type.STRING, description: "Opacity from 0-1, can be an expression." },
               boxShadow: { type: Type.STRING, description: "CSS box-shadow value, e.g., '2px 2px 5px rgba(0,0,0,0.2)'." },
               borderRadius: { type: Type.STRING, description: "MUST be an expression referencing the theme, e.g. '{{theme.radius.default}}'." },
               borderWidth: { type: Type.STRING, description: "MUST be an expression referencing the theme, e.g. '{{theme.border.width}}'." },
               borderColor: { type: Type.STRING, description: "MUST be an expression referencing the app theme, e.g., '{{theme.colors.border}}'." },
               borderStyle: { type: Type.STRING, description: "MUST be an expression referencing the theme, e.g. '{{theme.border.style}}'." },
               text: { type: Type.STRING, description: "Text content for LABEL or BUTTON. Can be an expression like 'Hello, {{Input1.value}}'." },
               fontSize: { type: Type.NUMBER, description: "Font size for LABEL." },
               fontWeight: { type: Type.STRING, enum: ['normal', 'bold'], description: "Font weight for LABEL." },
               color: { type: Type.STRING, description: "Text color for LABEL or DIVIDER. MUST be an expression referencing the app theme, e.g., '{{theme.colors.text}}'." },
               textAlign: { type: Type.STRING, enum: ['left', 'center', 'right'], description: "Text alignment for LABEL." },
               fontFamily: { type: Type.STRING, description: "Font family for LABEL. MUST be an expression referencing the app theme, e.g., '{{theme.font.family}}'." },
               placeholder: { type: Type.STRING, description: "Placeholder for INPUT, TEXTAREA, or SELECT." },
               dataStoreKey: { type: Type.STRING, description: "The key in dataStore this form element is bound to. Can use dot notation for nesting, e.g., 'selectedRecord.name'." },
               backgroundColor: { type: Type.STRING, description: "Background color. MUST be an expression referencing the app theme, e.g., '{{theme.colors.background}}', '{{theme.colors.primary}}', or '{{theme.colors.surface}}'." },
               backgroundGradient: { type: Type.STRING, description: "CSS background gradient for PANEL, FORM, STACKS." },
               textColor: { type: Type.STRING, description: "Text color for BUTTON. MUST be an expression referencing the app theme, e.g., '{{theme.colors.onPrimary}}'." },
               actionType: { type: Type.STRING, enum: buttonActionEnum, description: "Action for BUTTON onClick."},
               actionAlertMessage: { type: Type.STRING, description: "Message for 'alert' action. Can use expressions like 'Hello {{name}}'." },
               actionVariableName: { type: Type.STRING, description: "For 'updateVariable', the name of the app variable to change." },
               actionVariableValue: { type: Type.STRING, description: "For 'updateVariable', the new value to set. Can be a literal or an expression like '{{!isLoading}}' or '{{counter + 1}}'." },
               actionCodeToExecute: { type: Type.STRING, description: "For 'executeCode', the JavaScript code to run. Can be a multi-line IIFE expression like '{{ (() => { console.log(\"hello\"); })() }}'." },
               dataSourceName: { type: Type.STRING, description: "For data actions or Tables, the name of the configured data source (e.g., 'usersDb')." },
               newRecordData: { type: Type.STRING, description: "For 'createRecord', a JSON string representing the new record, using expressions from other inputs e.g. '{\"name\": \"{{form_name.value}}\"}'." },
               src: { type: Type.STRING, description: "Image source URL for IMAGE. Use picsum.photos for placeholders."},
               alt: { type: Type.STRING, description: "Alt text for IMAGE." },
               objectFit: { type: Type.STRING, enum: ['cover', 'contain', 'fill', 'none', 'scale-down'], description: "Object fit for IMAGE." },
               options: { type: Type.STRING, description: "Comma-separated options for SELECT or RADIO_GROUP." },
               label: { type: Type.STRING, description: "The visual label for CHECKBOX or SWITCH." },
               accessibilityLabel: { type: Type.STRING, description: "An invisible label for screen readers for INPUT, TEXTAREA, and SELECT." },
               groupLabel: { type: Type.STRING, description: "An invisible group label for screen readers for RADIO_GROUP." },
               columns: { type: Type.STRING, description: "For TABLE, a comma-separated string defining columns, e.g., 'Name:name,Email:email'." },
               rowSelectAction: { type: Type.STRING, enum: ['none', 'updateDataStore'], description: "Action to perform when a table row is selected." },
               selectedRecordKey: { type: Type.STRING, description: "For TABLE, the dataStore key to update with the selected row's data (e.g., 'selectedRecord')." },
            },
            required: ['x', 'y', 'width', 'height']
          }
        },
        required: ['id', 'type', 'props']
      }
    }
  },
  required: ['components']
};

export const generateAppLayout = async (prompt: string, currentApp: AppDefinition, currentPageId: string): Promise<AppDefinition | null> => {
  const API_KEY = process.env.API_KEY;

  if (!API_KEY) {
    alert("Gemini API key is not configured. AI features will not work.");
    throw new Error("Gemini API key is not configured.");
  }

  const ai = new GoogleGenAI({ apiKey: API_KEY });
  
  const availableDataSources = currentApp.dataSources.map(ds => `'${ds.id}' (type: ${ds.providerId})`).join(', ') || 'No data sources configured.';
  const systemInstruction = `You are an expert application designer. Based on the user's prompt, generate a valid JSON object that represents a simple web application layout. The JSON must strictly adhere to the provided schema. 
  **CRITICAL RULE: ALL styling properties MUST use expressions to reference the app's theme object.**
  - For colors, use expressions like '{{theme.colors.primary}}', '{{theme.colors.secondary}}', '{{theme.colors.text}}', '{{theme.colors.surface}}'. For text on a primary button, use '{{theme.colors.onPrimary}}'.
  - For fonts, use '{{theme.font.family}}'.
  - For borders, use '{{theme.border.width}}', '{{theme.border.style}}', and '{{theme.colors.border}}'.
  - For corner radius, use '{{theme.radius.default}}'.
  - **DO NOT use hardcoded values like '#FFFFFF', '1px', '4px', or 'Inter'.**
  The canvas is 1000px wide and 600px tall. The available data sources are: ${availableDataSources}.
  **CRITICAL LAYOUT RULE:** All components that belong to a single feature (like a login form) MUST be grouped inside a container (e.g., a PANEL or FORM). For any component you place inside a container, you MUST:
  1. Set its \`parentId\` property to the ID of the container.
  2. Calculate its \`x\` and \`y\` coordinates to be **relative** to the top-left corner of its parent container. For example, if a Panel is at absolute x=300 and a Button inside it should appear at an absolute position of x=350, the Button's \`x\` property MUST be 50.
  **NEVER place components that belong together at the root level with overlapping coordinates.**
  When creating data-driven apps, use the most appropriate 'dataSourceName'. Bind form inputs to 'selectedRecord.[property]'. Use app variables for temporary state (like loading states). ALWAYS provide an 'accessibilityLabel' for inputs, textareas, and selects. Component IDs must follow the format 'TYPE_UNIQUEID' (e.g., 'INPUT_12345').`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: appSchema,
      },
    });

    const jsonText = response.text.trim();
    const generatedLayout = JSON.parse(jsonText);

    if (!generatedLayout || !Array.isArray(generatedLayout.components)) {
        console.error("AI response is missing 'components' array:", generatedLayout);
        return null;
    }

    // --- Post-processing to enforce nesting ---
    let componentsFromAI: Omit<AppComponent, 'pageId'>[] = generatedLayout.components || [];

    const processedComponents = componentsFromAI.map(potentialChild => {
        // If the component already has a parent assigned by the AI, trust it and skip.
        if (potentialChild.parentId) {
            return potentialChild;
        }
        
        // Find all containers that this component could be inside.
        const potentialParents = componentsFromAI.filter(potentialParent => {
            const plugin = componentRegistry[potentialParent.type];
            // Must be a container and must not be the component itself.
            return plugin?.isContainer && potentialParent.id !== potentialChild.id;
        });
    
        let bestParent: Omit<AppComponent, 'pageId'> | null = null;
        let smallestArea = Infinity;
        
        for (const parent of potentialParents) {
            // Assume AI-provided coordinates are absolute for this check.
            const childRect = { x: potentialChild.props.x, y: potentialChild.props.y, width: potentialChild.props.width, height: potentialChild.props.height };
            const parentRect = { x: parent.props.x, y: parent.props.y, width: parent.props.width, height: parent.props.height };
    
            const isInside = 
                childRect.x >= parentRect.x &&
                childRect.y >= parentRect.y &&
                (childRect.x + childRect.width) <= (parentRect.x + parentRect.width) &&
                (childRect.y + childRect.height) <= (parentRect.y + parentRect.height);
    
            if (isInside) {
                const area = parentRect.width * parentRect.height;
                if (area < smallestArea) {
                    smallestArea = area;
                    bestParent = parent;
                }
            }
        }
    
        // If we found a parent, update the child component.
        if (bestParent) {
            return {
                ...potentialChild,
                parentId: bestParent.id,
                props: {
                    ...potentialChild.props,
                    // Recalculate coordinates to be relative to the new parent.
                    x: potentialChild.props.x - bestParent.props.x,
                    y: potentialChild.props.y - bestParent.props.y,
                },
            };
        }
        
        // If no parent was found, return the original component.
        return potentialChild;
    });

    // Merge AI-generated props with default props to ensure consistency and add pageId
    const componentsWithDefaults: AppComponent[] = processedComponents.map((comp: any) => {
        const plugin = componentRegistry[comp.type as ComponentType];
        const finalComp = {
            ...comp,
            pageId: currentPageId, // Assign current page ID
        };
        if (plugin) {
            return {
                ...finalComp,
                props: {
                    ...plugin.paletteConfig.defaultProps, // Start with defaults
                    ...comp.props, // AI props override defaults
                }
            };
        }
        return finalComp;
    });

    const componentsForCurrentPage = componentsWithDefaults;
    const componentsForOtherPages = currentApp.components.filter(c => c.pageId !== currentPageId);
    
    const variables = generatedLayout.variables || [];
    const dataStore: DataStore = {};

    componentsForCurrentPage.forEach((component: any) => {
        const props = component.props as any;
        if (props.dataStoreKey && !props.dataStoreKey.includes('.')) { // Only initialize top-level keys
            if (!dataStore.hasOwnProperty(props.dataStoreKey)) {
                switch(component.type as ComponentType) {
                    case ComponentType.CHECKBOX:
                    case ComponentType.SWITCH:
                        dataStore[props.dataStoreKey] = false;
                        break;
                    default:
                        dataStore[props.dataStoreKey] = '';
                        break;
                }
            }
        }
    });
    
    // Return a new definition, preserving existing data sources
    const newAppDefinition: AppDefinition = {
        ...currentApp,
        components: [...componentsForOtherPages, ...componentsForCurrentPage],
        variables: [...currentApp.variables, ...variables], // Merge variables
        dataStore: {
            ...currentApp.dataStore,
            ...dataStore // Merge in new top-level keys
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