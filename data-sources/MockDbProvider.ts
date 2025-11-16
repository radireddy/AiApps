
import { DataSourceProvider } from './provider';
import { DataSourceInstance } from '../types';

interface User {
  id: number;
  name: string;
  email: string;
  role: 'Admin' | 'Editor' | 'Viewer';
  active: boolean;
}

// In-memory store for this provider
let users: User[] = [
  { id: 1, name: 'Alice Johnson', email: 'alice.j@example.com', role: 'Admin', active: true },
  { id: 2, name: 'Bob Williams', email: 'bob.w@example.com', role: 'Editor', active: true },
  { id: 3, name: 'Charlie Brown', email: 'charlie.b@example.com', role: 'Viewer', active: false },
  { id: 4, name: 'Diana Miller', email: 'diana.m@example.com', role: 'Editor', active: true },
];
let nextId = 5;

const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

export const MockDbProvider: DataSourceProvider = {
    id: 'MOCK_DB',
    name: 'Mock User Database',
    description: 'A pre-populated, in-memory database of users for demonstration purposes.',
    configSchema: {}, // No configuration needed for this simple provider

    async getRecords(instance: DataSourceInstance): Promise<User[]> {
        await delay(200);
        return [...users];
    },

    async createRecord(instance: DataSourceInstance, data: Omit<User, 'id'>): Promise<User> {
        await delay(200);
        const newUser = { ...data, id: nextId++ };
        users.push(newUser);
        return newUser;
    },

    async updateRecord(instance: DataSourceInstance, recordId: number, updates: Partial<User>): Promise<User> {
        await delay(200);
        const userIndex = users.findIndex(u => u.id === recordId);
        if (userIndex === -1) {
            throw new Error("User not found");
        }
        users[userIndex] = { ...users[userIndex], ...updates };
        return users[userIndex];
    },
    
    async deleteRecord(instance: DataSourceInstance, recordId: number): Promise<boolean> {
        await delay(200);
        const initialLength = users.length;
        users = users.filter(u => u.id !== recordId);
        return users.length < initialLength;
    }
};