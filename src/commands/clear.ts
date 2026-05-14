import type { CommandDef } from './types';

const clearCommand: CommandDef = {
  description: 'Clear terminal output',
  handler: () => ({ type: 'clear' }),
};

export default clearCommand;
