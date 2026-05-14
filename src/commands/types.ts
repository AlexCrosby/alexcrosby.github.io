import React from 'react';

export interface CommandContext {
  ip: string;
  cwd: string;
}

export type CommandResult =
  | { type: 'output'; node: React.ReactNode }
  | { type: 'clear' }
  | { type: 'cd'; newCwd: string }
  | { type: 'theme'; themeName: string; node: React.ReactNode }
  | { type: 'interactive'; prompt: string; onInput: (input: string) => CommandResult };

export interface CommandDef {
  /** Short description shown in `help` output. */
  description: string;
  /** Receives positional args (everything after the command name) and shared context. */
  handler: (args: string[], ctx: CommandContext) => CommandResult;
}
