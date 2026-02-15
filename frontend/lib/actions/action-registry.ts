// lib/actions/action-registry.ts

import type { ActionDefinition, ActionRegistry } from "@/types/agent-bridge";

/**
 * Global action registry
 * Define all possible UI actions here that can be triggered by agent or UI
 */
class ActionRegistryManager {
  private actions: ActionRegistry = {};

  /**
   * Register a new action
   */
  register(action: ActionDefinition) {
    if (this.actions[action.id]) {
      console.warn(`[ActionRegistry] Action "${action.id}" already registered, overwriting`);
    }
    this.actions[action.id] = action;
    console.log(`[ActionRegistry] Registered action: ${action.id}`);
  }

  /**
   * Register multiple actions at once
   */
  registerMany(actions: ActionDefinition[]) {
    actions.forEach((action) => this.register(action));
  }

  /**
   * Unregister an action
   */
  unregister(actionId: string) {
    delete this.actions[actionId];
  }

  /**
   * Execute an action by ID
   */
  async execute(actionId: string, params?: any): Promise<boolean> {
    const action = this.actions[actionId];
    if (!action) {
      console.error(`[ActionRegistry] Action "${actionId}" not found`);
      return false;
    }

    try {
      console.log(`[ActionRegistry] Executing action: ${actionId}`, params);
      await action.handler(params);
      return true;
    } catch (error) {
      console.error(`[ActionRegistry] Error executing action "${actionId}":`, error);
      return false;
    }
  }

  /**
   * Get action definition
   */
  get(actionId: string): ActionDefinition | undefined {
    return this.actions[actionId];
  }

  /**
   * Get all registered actions
   */
  getAll(): ActionRegistry {
    return { ...this.actions };
  }

  /**
   * Get actions for a specific context
   */
  getByContext(context: string): ActionDefinition[] {
    return Object.values(this.actions).filter(
      (action) => !action.context || action.context.includes(context)
    );
  }

  /**
   * Check if action exists
   */
  has(actionId: string): boolean {
    return !!this.actions[actionId];
  }

  /**
   * Clear all actions
   */
  clear() {
    this.actions = {};
  }
}

// Singleton instance
export const actionRegistry = new ActionRegistryManager();

// Export for use in components
export default actionRegistry;
