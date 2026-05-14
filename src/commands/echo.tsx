import type { CommandDef } from './types';

const echoCommand: CommandDef = {
  description: 'Print text to the terminal',
  handler: (args) => ({
    type: 'output',
    node: <div className="command-output">{args.join(' ')}</div>,
  }),
};

export default echoCommand;
