
// FIX: Import jest globals to resolve test-related type errors.
import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { generateAppLayout } from './geminiService';
import { GoogleGenAI, mockGenerateContent } from '../../__mocks__/@google/genai';
import { AppDefinition, ComponentType } from '../types';

jest.mock('@google/genai', () => ({
  GoogleGenAI: jest.requireActual('../../__mocks__/@google/genai').GoogleGenAI,
  Type: jest.requireActual('../../__mocks__/@google/genai').Type,
}));

const mockCurrentApp: AppDefinition = {
  id: 'app1', name: 'Test App', createdAt: '', lastModifiedAt: '',
  pages: [{ id: 'page1', name: 'Main Page' }],
  mainPageId: 'page1',
  components: [],
  dataStore: {},
  dataSources: [{ id: 'usersDb', providerId: 'MOCK_DB', config: {} }],
  variables: [],
  theme: {} as any,
};

describe('geminiService', () => {
  beforeEach(() => {
    mockGenerateContent.mockClear();
    process.env.API_KEY = 'test-key';
  });

  it('should call the Gemini API with the correct system instruction and schema', async () => {
    const mockResponse = {
      text: JSON.stringify({
        components: [{
          id: 'LABEL_1',
          type: 'LABEL',
          props: { x: 10, y: 10, width: 100, height: 30, text: 'Hello' },
        }],
      }),
    };
    mockGenerateContent.mockResolvedValue(mockResponse);

    await generateAppLayout('a simple label', mockCurrentApp, 'page1');

    expect(mockGenerateContent).toHaveBeenCalledTimes(1);
    const callArg = mockGenerateContent.mock.calls[0][0];
    
    expect(callArg.model).toBe('gemini-2.5-flash');
    expect(callArg.contents).toBe('a simple label');
    expect(callArg.config.systemInstruction).toContain('The available data sources are: \'usersDb\' (type: MOCK_DB)');
    expect(callArg.config.responseMimeType).toBe('application/json');
    expect(callArg.config.responseSchema).toBeDefined();
  });

  it('should process the API response and return a new AppDefinition', async () => {
    const mockApiResponse = {
      components: [
        { id: 'INPUT_1', type: 'INPUT', props: { x: 10, y: 10, width: 150, height: 40, dataStoreKey: 'name' } },
        { id: 'PANEL_1', type: 'PANEL', props: { x: 100, y: 100, width: 200, height: 200 } },
        { id: 'BUTTON_1', type: 'BUTTON', parentId: 'PANEL_1', props: { x: 20, y: 20, width: 100, height: 40 } },
      ],
      variables: [
        { id: 'var1', name: 'isLoading', type: 'boolean', initialValue: 'false' },
      ]
    };
    mockGenerateContent.mockResolvedValue({ text: JSON.stringify(mockApiResponse) });

    const result = await generateAppLayout('a form', mockCurrentApp, 'page1');

    expect(result).not.toBeNull();
    expect(result?.components.length).toBe(3);
    expect(result?.variables.length).toBe(1);
    
    // Check that pageId was added
    expect(result?.components[0].pageId).toBe('page1');

    // Check that dataStore was populated
    expect(result?.dataStore.name).toBe('');
  });

  it('should perform post-processing to correctly nest components', async () => {
    const mockApiResponse = {
        components: [
            // AI returns absolute coordinates, post-processing should fix it
            { id: 'PANEL_1', type: 'PANEL', props: { x: 100, y: 100, width: 200, height: 200 } },
            { id: 'BUTTON_1', type: 'BUTTON', props: { x: 120, y: 120, width: 100, height: 40 } },
        ]
    };
    mockGenerateContent.mockResolvedValue({ text: JSON.stringify(mockApiResponse) });
    const result = await generateAppLayout('a panel with a button', mockCurrentApp, 'page1');

    const button = result?.components.find(c => c.id === 'BUTTON_1');
    expect(button?.parentId).toBe('PANEL_1');
    expect(button?.props.x).toBe(20); // 120 - 100
    expect(button?.props.y).toBe(20); // 120 - 100
  });

  it('should return null and alert on API error', async () => {
    const alertSpy = jest.spyOn(window, 'alert').mockImplementation(() => {});
    mockGenerateContent.mockRejectedValue(new Error('API failed'));

    const result = await generateAppLayout('a prompt', mockCurrentApp, 'page1');

    expect(result).toBeNull();
    expect(alertSpy).toHaveBeenCalledWith('Failed to call the Gemini API. Please try again.');
    alertSpy.mockRestore();
  });
});