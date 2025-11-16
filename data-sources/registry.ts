import { DataSourceProvider } from './provider';
import { MockDbProvider } from './MockDbProvider';
import { LocalStorageProvider } from './LocalStorageProvider';

export const dataSourceRegistry: Record<string, DataSourceProvider> = {
    [MockDbProvider.id]: MockDbProvider,
    [LocalStorageProvider.id]: LocalStorageProvider,
};