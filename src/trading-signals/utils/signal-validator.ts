import { Signal } from '../entities/signal.entity';
import { ComponentType } from '../entities/signal-component.entity';
import { COMPONENT_LIBRARY } from '../components/component-library';

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export class SignalValidator {
  static validate(signal: Signal): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check required component types
    const hasDataSource = signal.components.some(c => c.type === ComponentType.DATA_SOURCE);
    const hasCondition = signal.components.some(c => c.type === ComponentType.CONDITION);
    const hasAction = signal.components.some(c => c.type === ComponentType.ACTION);

    if (!hasDataSource) errors.push('Signal must have at least one data source');
    if (!hasCondition) errors.push('Signal must have at least one condition');
    if (!hasAction) errors.push('Signal must have at least one action');

    // Validate component configurations
    for (const component of signal.components) {
      const definition = COMPONENT_LIBRARY.find(def => def.id === component.name.toLowerCase().replace(/\s+/g, '-'));
      
      if (definition) {
        // Validate required configuration
        for (const configDef of definition.config) {
          if (configDef.defaultValue !== undefined && component.config[configDef.id] === undefined) {
            component.config[configDef.id] = configDef.defaultValue;
          }
        }

        // Validate numeric ranges
        for (const configDef of definition.config) {
          const value = component.config[configDef.id];
          if (configDef.type === 'number' && value !== undefined) {
            if (configDef.min !== undefined && value < configDef.min) {
              errors.push(`${component.name}: ${configDef.name} must be >= ${configDef.min}`);
            }
            if (configDef.max !== undefined && value > configDef.max) {
              errors.push(`${component.name}: ${configDef.name} must be <= ${configDef.max}`);
            }
          }
        }
      }
    }

    // Validate connections
    for (const component of signal.components) {
      if (component.connections) {
        for (const connectionId of component.connections) {
          const connectedComponent = signal.components.find(c => c.id === connectionId);
          if (!connectedComponent) {
            errors.push(`Invalid connection: Component ${connectionId} not found`);
          }
        }
      }
    }

    // Check for circular dependencies
    const circularDeps = this.findCircularDependencies(signal.components);
    if (circularDeps.length > 0) {
      errors.push(`Circular dependencies detected: ${circularDeps.join(', ')}`);
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  private static findCircularDependencies(components: any[]): string[] {
    const visited = new Set<string>();
    const recursionStack = new Set<string>();
    const cycles: string[] = [];

    const dfs = (componentId: string, path: string[]): void => {
      if (recursionStack.has(componentId)) {
        const cycleStart = path.indexOf(componentId);
        cycles.push(path.slice(cycleStart).join(' -> '));
        return;
      }

      if (visited.has(componentId)) return;

      visited.add(componentId);
      recursionStack.add(componentId);

      const component = components.find(c => c.id === componentId);
      if (component && component.connections) {
        for (const connId of component.connections) {
          dfs(connId, [...path, connId]);
        }
      }

      recursionStack.delete(componentId);
    };

    for (const component of components) {
      if (!visited.has(component.id)) {
        dfs(component.id, [component.id]);
      }
    }

    return cycles;
  }
}