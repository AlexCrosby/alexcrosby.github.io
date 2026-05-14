import type { CommandDef } from './types';

const welcomeCommand: CommandDef = {
  description: 'Show the welcome banner',
  handler: () => ({
    type: 'output',
    node: (
      <div className="terminal-welcome">
        <div>
          &nbsp;&nbsp;&nbsp;&nbsp;___    __          ____  _____<br />
          &nbsp;&nbsp;&nbsp;/   |  / /__  _  __/ __ \/ ___/<br />
          &nbsp;&nbsp;/ /| | / / _ \| |/_/ / / /\__ \<br />
          &nbsp;/ ___ |/ /  __/&gt;  &lt;/ /_/ /___/ /<br />
          /_/  |_/_/\___/_/|_|\____//____/<br />
        </div>
        <div>Welcome to AlexOS.</div>
        <div>Type 'help' to see a list of available commands.</div>
      </div>
    ),
  }),
};

export default welcomeCommand;
