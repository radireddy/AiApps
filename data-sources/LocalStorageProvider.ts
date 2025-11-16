import { DataSourceProvider } from './provider';
import { DataSourceInstance } from '../types';

const getStorageKey = (instance: DataSourceInstance) => `ds_${instance.id}`;

export const LocalStorageProvider: DataSourceProvider = {
    id: 'LOCAL_STORAGE',
    name: 'Browser Local Storage',
    description: 'Stores data directly in your browser. Data persists between sessions.',
    configSchema: {
        initialData: {
            label: 'Initial Data (JSON)',
            type: 'textarea',
            defaultValue: '[]',
            helpText: 'A JSON array of objects to seed the data source on first load.'
        }
    },

    async getRecords(instance: DataSourceInstance): Promise<any[]> {
        const key = getStorageKey(instance);
        const rawData = localStorage.getItem(key);
        if (rawData) {
            return JSON.parse(rawData);
        }
        // If no data, seed with initial data from config
        try {
            const initialData = JSON.parse(instance.config.initialData || '[]');
            localStorage.setItem(key, JSON.stringify(initialData));
            return initialData;
        } catch (e) {
            console.error("Invalid initial data JSON:", e);
            return [];
        }
    },

    async createRecord(instance: DataSourceInstance, data: any): Promise<any> {
        const records = await this.getRecords(instance);
        const newRecord = { ...data, id: Date.now() }; // Simple unique ID
        records.push(newRecord);
        localStorage.setItem(getStorageKey(instance), JSON.stringify(records));
        return newRecord;
    },

    async updateRecord(instance: DataSourceInstance, recordId: any, updates: any): Promise<any> {
        let records = await this.getRecords(instance);
        const recordIndex = records.findIndex(r => r.id === recordId);
        if (recordIndex === -1) {
            throw new Error("Record not found");
        }
        records[recordIndex] = { ...records[recordIndex], ...updates };
        localStorage.setItem(getStorageKey(instance), JSON.stringify(records));
        return records[recordIndex];
    },
    
    async deleteRecord(instance: DataSourceInstance, recordId: any): Promise<boolean> {
        let records = await this.getRecords(instance);
        const initialLength = records.length;
        records = records.filter(r => r.id !== recordId);
        if (records.length < initialLength) {
            localStorage.setItem(getStorageKey(instance), JSON.stringify(records));
            return true;
        }
        return false;
    }
};