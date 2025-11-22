import { PropertyGroup } from './types';
import { basePropertyGroups } from './base-groups';

/**
 * Property Group Registry
 * Central registry for all property groups
 * Follows the Registry Pattern for centralized management
 */
class PropertyGroupRegistry {
  private groups: Map<string, PropertyGroup> = new Map();

  constructor() {
    // Register base property groups
    basePropertyGroups.forEach(group => {
      this.register(group);
    });
  }

  /**
   * Register a property group
   */
  register(group: PropertyGroup): void {
    if (this.groups.has(group.id)) {
      console.warn(`Property group with id "${group.id}" already exists. Overwriting.`);
    }
    this.groups.set(group.id, group);
  }

  /**
   * Get a property group by ID
   */
  get(id: string): PropertyGroup | undefined {
    return this.groups.get(id);
  }

  /**
   * Get multiple property groups by IDs
   */
  getMany(ids: string[]): PropertyGroup[] {
    return ids
      .map(id => this.get(id))
      .filter((group): group is PropertyGroup => group !== undefined);
  }

  /**
   * Get all registered property groups
   */
  getAll(): PropertyGroup[] {
    return Array.from(this.groups.values());
  }

  /**
   * Check if a property group exists
   */
  has(id: string): boolean {
    return this.groups.has(id);
  }

  /**
   * Unregister a property group
   */
  unregister(id: string): void {
    this.groups.delete(id);
  }

  /**
   * Clear all registered property groups (except base groups)
   */
  clear(): void {
    // Keep base groups
    basePropertyGroups.forEach(group => {
      this.groups.set(group.id, group);
    });
    // Remove all others
    const baseIds = new Set(basePropertyGroups.map(g => g.id));
    Array.from(this.groups.keys()).forEach(id => {
      if (!baseIds.has(id)) {
        this.groups.delete(id);
      }
    });
  }
}

// Export singleton instance
export const propertyGroupRegistry = new PropertyGroupRegistry();

