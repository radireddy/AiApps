// Defines the contract for all data source providers.

import { DataSourceInstance } from "../types";

export interface DataSourceProvider {
    // A unique identifier for the provider type.
    id: string; 
    
    // A user-friendly name displayed in the UI.
    name: string; 
    
    // A short description of what the provider does.
    description: string;
    
    // Defines the configuration fields needed for an instance of this provider.
    // This schema is used to auto-generate a form in the Data panel.
    configSchema: {
        [key: string]: {
            label: string;
            type: 'text' | 'number' | 'textarea';
            defaultValue: any;
            helpText?: string;
        }
    }
    
    // --- Core Data Methods ---

    /**
     * Fetches all records from the data source.
     * @param instance - The specific configured instance of this data source.
     * @returns A promise that resolves to an array of records.
     */
    getRecords: (instance: DataSourceInstance) => Promise<any[]>;
    
    /**
     * Creates a new record in the data source.
     * @param instance - The specific configured instance.
     * @param data - The new record to add.
     * @returns A promise that resolves to the newly created record.
     */
    createRecord: (instance: DataSourceInstance, data: any) => Promise<any>;
    
    /**
     * Updates an existing record.
     * @param instance - The specific configured instance.
     * @param recordId - The unique identifier of the record to update.
     * @param updates - An object containing the fields to update.
     * @returns A promise that resolves to the updated record.
     */
    updateRecord: (instance: DataSourceInstance, recordId: any, updates: any) => Promise<any>;
    
    /**
     * Deletes a record from the data source.
     * @param instance - The specific configured instance.
     * @param recordId - The unique identifier of the record to delete.
     * @returns A promise that resolves to true if deletion was successful, false otherwise.
     */
    deleteRecord: (instance: DataSourceInstance, recordId: any) => Promise<boolean>;
}