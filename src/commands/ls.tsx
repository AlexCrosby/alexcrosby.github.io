import type { CommandDef } from './types';
import { resolvePath, getNode } from '../vfs';

const lsCommand: CommandDef = {
  description: 'List directory contents',
  handler: (args, { cwd }) => {
    const target = args[0] || '';
    const resolvedPath = resolvePath(cwd, target);
    const node = getNode(resolvedPath);

    if (!node) {
      return {
        type: 'output',
        node: <div className="command-output">ls: cannot access '{target}': No such file or directory</div>,
      };
    }

    if (node.type === 'file') {
      return {
        type: 'output',
        node: <div className="command-output">{target || resolvedPath.split('/').pop()}</div>,
      };
    }

    // It's a directory
    const childrenNames = Object.entries(node.children).map(([name, childNode]) => {
      // Add trailing slash for directories to make them distinct
      return childNode.type === 'dir' ? <span key={name} style={{ color: 'var(--folder-color)' }}>{name}/</span> : <span key={name}>{name}</span>;
    });

    return {
      type: 'output',
      node: (
        <div className="command-output" style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
          {childrenNames}
        </div>
      ),
    };
  },
};

export default lsCommand;
