import React from 'react';
import type { CommandDef } from './types';
import { resolvePath, getNode } from '../vfs';

const cdCommand: CommandDef = {
  description: 'Change working directory',
  handler: (args, { cwd }) => {
    const target = args[0];

    if (!target) {
      // cd without args goes to home ~
      return { type: 'cd', newCwd: '~' };
    }

    const resolvedPath = resolvePath(cwd, target);
    const node = getNode(resolvedPath);

    if (!node) {
      return {
        type: 'output',
        node: <div className="command-output">cd: {target}: No such file or directory</div>,
      };
    }

    if (node.type === 'file') {
      return {
        type: 'output',
        node: <div className="command-output">cd: {target}: Not a directory</div>,
      };
    }

    return { type: 'cd', newCwd: resolvedPath };
  },
};

export default cdCommand;
