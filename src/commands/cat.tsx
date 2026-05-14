import type { CommandDef } from './types';
import { resolvePath, getNode } from '../vfs';

const catCommand: CommandDef = {
  description: 'Concatenate and print files',
  handler: (args, { cwd }) => {
    const target = args[0];

    if (!target) {
      return {
        type: 'output',
        node: <div className="command-output">cat: missing file operand</div>,
      };
    }

    const resolvedPath = resolvePath(cwd, target);
    const node = getNode(resolvedPath);

    if (!node) {
      return {
        type: 'output',
        node: <div className="command-output">cat: {target}: No such file or directory</div>,
      };
    }

    if (node.type === 'dir') {
      return {
        type: 'output',
        node: <div className="command-output">cat: {target}: Is a directory</div>,
      };
    }

    return {
      type: 'output',
      node: <div className="command-output">{node.content}</div>,
    };
  },
};

export default catCommand;
