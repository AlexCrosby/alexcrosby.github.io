import type { CommandDef } from './types';
import echoCommand from './echo';
import clearCommand from './clear';
import welcomeCommand from './welcome';
import lsCommand from './ls';
import cdCommand from './cd';
import catCommand from './cat';
import { createHelpCommand } from './help';

const registry: Record<string, CommandDef> = {
  clear: clearCommand,
  echo: echoCommand,
  welcome: welcomeCommand,
  ls: lsCommand,
  cd: cdCommand,
  cat: catCommand,
};

// Help is added last so it can reference the fully-built registry
registry.help = createHelpCommand(registry);

export const commands = registry;

// Re-export types for convenience
export type { CommandDef, CommandContext, CommandResult } from './types';
