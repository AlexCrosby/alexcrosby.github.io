import React from 'react';
import type { CommandDef, CommandResult } from './types';
import { themes } from '../constants/themes';

/**
 * Command to switch between different terminal themes.
 */
const themeCommand: CommandDef = {
  description: 'Switch terminal themes',
  handler: (args, { setTheme }) => {
    const targetTheme = args[0]?.toLowerCase();

    if (!targetTheme) {
      // List available themes
      const themeList = Object.keys(themes);
      return {
        type: 'output',
        node: (
          <div className="command-output">
            Available themes:
            <br />
            {themeList.map((name, i) => (
              <React.Fragment key={name}>
                <span style={{ color: 'var(--folder-color)' }}>{name}</span>
                {i < themeList.length - 1 ? '  ' : ''}
              </React.Fragment>
            ))}
            <br />
            <br />
            Usage: theme &lt;name&gt;
          </div>
        )
      };
    }

    if (themes[targetTheme]) {
      setTheme(targetTheme);
      return {
        type: 'output',
        node: <div className="command-output">Theme switched to '{themes[targetTheme].name}'.</div>
      };
    }

    return {
      type: 'output',
      node: <div className="command-output">Error: Theme '{targetTheme}' not found. Type 'theme' to see available themes.</div>
    };
  }
};

export default themeCommand;
