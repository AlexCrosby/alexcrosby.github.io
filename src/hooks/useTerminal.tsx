import React, { useState, useEffect, useRef } from 'react';
import { commands } from '../commands';
import type { CommandResult } from '../commands';
import welcomeCommand from '../commands/welcome';
import { getAutocompleteOptions } from '../vfs';
import { themes } from '../constants/themes';

/**
 * Calculates the longest common prefix among an array of strings.
 * This is used for tab autocompletion. For example, if the user types `cd c`
 * and the available options are `company-a.txt` and `company-b.txt`, this
 * function will return `company-`, allowing the terminal to autocomplete up to that point.
 */
function getLongestCommonPrefix(strings: string[]): string {
  if (strings.length === 0) return '';
  let prefix = strings[0];
  for (let i = 1; i < strings.length; i++) {
    // Case-insensitive comparison for prefix finding
    while (strings[i].toLowerCase().indexOf(prefix.toLowerCase()) !== 0) {
      prefix = prefix.substring(0, prefix.length - 1);
      if (prefix === '') return '';
    }
  }
  return prefix;
}

// Represents a single completed command/output block in the terminal history
export interface HistoryItem {
  id: number;
  prompt: React.ReactNode;
  command: string;
  output: React.ReactNode;
}

// Represents an ongoing multi-step command (e.g. asking for a password or confirmation)
export interface Interaction {
  prompt: string;
  onInput: (input: string) => CommandResult;
}

// Generate the initial welcome banner output at startup
const welcomeNode = welcomeCommand.handler([], { cwd: '' });
const initialHistory: HistoryItem[] =
  welcomeNode.type === 'output'
    ? [{ id: 0, prompt: null, command: '', output: welcomeNode.node }]
    : [];

/**
 * Custom hook that manages all the internal state, logic, and history of the terminal.
 * By keeping this separate, App.tsx can remain a pure, "dumb" visual component.
 */
export function useTerminal() {
  // --- Core State ---
  // The list of all past inputs and outputs shown on screen
  const [history, setHistory] = useState<HistoryItem[]>(initialHistory);
  // The current text sitting in the hidden input box
  const [input, setInput] = useState('');
  // Where the blinking cursor is currently located inside the input string
  const [cursorPos, setCursorPos] = useState(0);
  // A unique ID counter for React keys in the history array
  const [commandId, setCommandId] = useState(1);
  // The user's real-world IP address, fetched on mount
  const [ip, setIp] = useState<string>('unknown');
  // Current working directory for the virtual file system
  const [cwd, setCwd] = useState<string>('~');
  // If not null, the terminal is currently hijacked by an interactive command
  const [activeInteraction, setActiveInteraction] = useState<Interaction | null>(null);

  // --- Theme State ---
  const [themeName, setThemeName] = useState<string>(() => {
    return localStorage.getItem('alexos-theme') || 'default';
  });

  const currentTheme = themes[themeName] || themes.default;

  // Persist theme choice
  useEffect(() => {
    localStorage.setItem('alexos-theme', themeName);
  }, [themeName]);

  // --- Keyboard Up/Down History State ---
  // A memory of just the strings the user has typed (for pressing Up/Down arrows)
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  // Where we currently are in the arrow-key history stack (-1 means we are on a blank new line)
  const [historyIndex, setHistoryIndex] = useState(-1);
  // Temporarily saves whatever the user had typed *before* they started pressing Up/Down arrows
  const [draftInput, setDraftInput] = useState('');

  // We keep a ref of the commandId so helper functions can access the latest value without causing stale closures
  const commandIdRef = useRef(commandId);
  commandIdRef.current = commandId;

  const [isCursorMoving, setIsCursorMoving] = useState(false);
  const cursorTimeoutRef = useRef<number | null>(null);

  // On first load, ping a free API to get the user's public IP address
  useEffect(() => {
    fetch('https://api.ipify.org?format=json')
      .then(res => res.json())
      .then(data => setIp(data.ip))
      .catch(() => setIp('unknown'));
  }, []);

  // Helper to standardise how the green prompt text is rendered
  const makePrompt = (label: string) => (
    <span className="terminal-prompt">{label}</span>
  );

  // The default prompt shown when no interactive command is active
  const standardPrompt = makePrompt(`user@${ip}:${cwd}$ `);

  /**
   * Processes the structured result returned by a command handler,
   * updating the terminal history and interaction state accordingly.
   */
  const handleResult = (result: CommandResult, cmd: string, promptNode: React.ReactNode) => {
    const id = commandIdRef.current;
    switch (result.type) {
      case 'clear':
        // Wipe the terminal history entirely
        setHistory([]);
        setActiveInteraction(null);
        break;

      case 'cd':
        // Change the current working directory (silently, no output)
        setCwd(result.newCwd);
        setHistory(prev => [...prev, { id, prompt: promptNode, command: cmd, output: null }]);
        setCommandId(prev => prev + 1);
        setActiveInteraction(null);
        break;

      case 'output':
        // Standard command finish: append the command and its output to the screen
        setHistory(prev => [...prev, { id, prompt: promptNode, command: cmd, output: result.node }]);
        setCommandId(prev => prev + 1);
        setActiveInteraction(null);
        break;

      case 'theme':
        // Change theme and show output
        setThemeName(result.themeName);
        setHistory(prev => [...prev, { id, prompt: promptNode, command: cmd, output: result.node }]);
        setCommandId(prev => prev + 1);
        setActiveInteraction(null);
        break;

      case 'interactive':
        // Multi-step command: append the input but no output yet, and hijack the prompt
        setHistory(prev => [...prev, { id, prompt: promptNode, command: cmd, output: null }]);
        setCommandId(prev => prev + 1);
        setActiveInteraction({ prompt: result.prompt, onInput: result.onInput });
        break;
    }
  };

  /**
   * Looks up a user's typed string in the command registry and executes it.
   */
  const processCommand = (cmd: string): CommandResult => {
    const args = cmd.split(' ');
    const baseCmd = args[0].toLowerCase();
    const commandDef = commands[baseCmd];

    // If the command doesn't exist, return a default "not found" output
    if (!commandDef) {
      return {
        type: 'output',
        node: <div className="command-output">{baseCmd}: command not found</div>,
      };
    }

    // Otherwise, run the command's handler function
    return commandDef.handler(args.slice(1), { cwd });
  };

  const handleAutocomplete = () => {
    if (!input) return;
    if (activeInteraction) return; // Don't autocomplete during interactions yet

    const spaceIndex = input.lastIndexOf(' ');

    if (spaceIndex === -1) {
      // 1. Autocompleting a command
      const cmdPrefix = input.toLowerCase();
      const matches = Object.keys(commands).filter(cmd => cmd.startsWith(cmdPrefix));

      if (matches.length === 1) {
        setInput(matches[0] + ' ');
        setCursorPos(matches[0].length + 1);
      } else if (matches.length > 1) {
        const prefix = getLongestCommonPrefix(matches);
        if (prefix) {
          setInput(prefix);
          setCursorPos(prefix.length);
        }
      }
    } else {
      // 2. Autocompleting an argument (path)
      const baseInput = input.substring(0, spaceIndex + 1);
      const partialPath = input.substring(spaceIndex + 1);

      const matches = getAutocompleteOptions(cwd, partialPath);

      if (matches.length === 1) {
        const match = matches[0];
        let completion = match.name;
        if (match.isDir) completion += '/';

        const lastSlash = partialPath.lastIndexOf('/');
        const dirPart = lastSlash !== -1 ? partialPath.substring(0, lastSlash + 1) : '';

        const newInput = baseInput + dirPart + completion;
        setInput(newInput);
        // Force the input element's selection to jump to the end immediately on next tick
        setTimeout(() => setCursorPos(newInput.length), 0);
      } else if (matches.length > 1) {
        const names = matches.map(m => m.name);
        const prefix = getLongestCommonPrefix(names);
        if (prefix) {
          const lastSlash = partialPath.lastIndexOf('/');
          const dirPart = lastSlash !== -1 ? partialPath.substring(0, lastSlash + 1) : '';
          const newInput = baseInput + dirPart + prefix;
          setInput(newInput);
          setTimeout(() => setCursorPos(newInput.length), 0);
        }
      }
    }
  };

  /**
   * Intercepts key presses on the hidden input element.
   * Handles Enter (submitting) and Up/Down arrows (history cycling).
   */
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Tab') {
      e.preventDefault(); // Prevent browser from moving focus
      handleAutocomplete();
    } else if (e.key === 'Enter') {
      // Save to Up/Down history if they actually typed something
      if (input.trim()) {
        setCommandHistory(prev => [...prev, input]);
      }
      // Reset the Up/Down history tracker
      setHistoryIndex(-1);
      setDraftInput('');

      if (activeInteraction) {
        // If an interactive command is running, route the input to it
        const promptNode = makePrompt(activeInteraction.prompt);
        const result = activeInteraction.onInput(input);
        handleResult(result, input, promptNode);
      } else {
        // Otherwise, process it as a normal top-level command
        const trimmedCmd = input.trim();
        if (trimmedCmd) {
          const result = processCommand(trimmedCmd);
          handleResult(result, input, standardPrompt);
        } else {
          // If they just hit Enter with an empty box, advance to a blank new line
          handleResult({ type: 'output', node: null }, input, standardPrompt);
        }
      }

      // Clear the input box and reset the cursor
      setInput('');
      setCursorPos(0);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (commandHistory.length === 0) return;

      // Calculate the previous history index
      const newIndex = historyIndex === -1
        ? commandHistory.length - 1
        : Math.max(0, historyIndex - 1);

      // Save current draft if this is the first time pressing Up
      if (historyIndex === -1) setDraftInput(input);
      setHistoryIndex(newIndex);

      const cmd = commandHistory[newIndex];
      setInput(cmd);
      setCursorPos(cmd.length);

      // We must push the cursor to the end of the text on the next event loop tick
      setTimeout(() => {
        const inputEl = e.currentTarget;
        if (inputEl) {
          inputEl.selectionStart = cmd.length;
          inputEl.selectionEnd = cmd.length;
        }
      }, 0);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIndex === -1) return;

      const newIndex = historyIndex + 1;
      if (newIndex >= commandHistory.length) {
        // Reached the bottom: restore the draft text they were typing before hitting Up
        setHistoryIndex(-1);
        setInput(draftInput);
        setCursorPos(draftInput.length);

        setTimeout(() => {
          const inputEl = e.currentTarget;
          if (inputEl) {
            inputEl.selectionStart = draftInput.length;
            inputEl.selectionEnd = draftInput.length;
          }
        }, 0);
      } else {
        // Still cycling downwards through history
        setHistoryIndex(newIndex);
        const cmd = commandHistory[newIndex];
        setInput(cmd);
        setCursorPos(cmd.length);

        setTimeout(() => {
          const inputEl = e.currentTarget;
          if (inputEl) {
            inputEl.selectionStart = cmd.length;
            inputEl.selectionEnd = cmd.length;
          }
        }, 0);
      }
    }
  };

  /**
   * Tracks where the user clicked inside the text box so the fake blinking cursor matches it
   */
  const updateCursor = (e: React.SyntheticEvent<HTMLInputElement>) => {
    setCursorPos(e.currentTarget.selectionStart || 0);

    setIsCursorMoving(true);
    if (cursorTimeoutRef.current) {
      clearTimeout(cursorTimeoutRef.current);
    }
    cursorTimeoutRef.current = window.setTimeout(() => {
      setIsCursorMoving(false);
    }, 500);
  };

  // Determine what the prompt string should be right now
  const activePrompt = activeInteraction
    ? makePrompt(activeInteraction.prompt)
    : standardPrompt;

  // Expose exactly what App.tsx needs to render the screen
  return {
    history,
    input,
    setInput,
    cursorPos,
    setCursorPos,
    activePrompt,
    handleKeyDown,
    updateCursor,
    isCursorMoving,
    theme: currentTheme,
    setTheme: setThemeName,
  };
}
