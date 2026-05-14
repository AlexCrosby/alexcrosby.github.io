import type { CommandDef } from './types';

/**
 * Factory so help can list all commands without a circular import.
 * Call this after building the rest of the registry and pass the registry in.
 */
export function createHelpCommand(commands: Record<string, CommandDef>): CommandDef {
  return {
    description: 'Show this message',
    handler: () => ({
      type: 'output',
      node: (
        <div className="command-output">
          <div>Available commands:</div>
          {Object.entries(commands)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([name, def]) => (
              <div key={name}>
                <span style={{ display: 'inline-block', minWidth: '7ch' }}>{name}</span>
                {' - '}{def.description}
              </div>
            ))}
        </div>
      ),
    }),
  };
}
