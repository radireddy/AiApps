
// FIX: Import jest from @jest/globals to make jest.fn() available.
import { jest } from '@jest/globals';

export const mockGenerateContent = jest.fn();

export class GoogleGenAI {
  constructor(config: any) {}

  public models = {
    generateContent: mockGenerateContent,
  };
}

export const Type = {
    OBJECT: 'OBJECT',
    ARRAY: 'ARRAY',
    STRING: 'STRING',
    NUMBER: 'NUMBER',
    BOOLEAN: 'BOOLEAN',
};