import React, { useState, useEffect, useRef } from 'react';
import './App.css';

interface HistoryItem {
  id: number;
  command: string;
  output: React.ReactNode;
}

function App() {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [input, setInput] = useState('');
  const [cursorPos, setCursorPos] = useState(0);
  const [commandId, setCommandId] = useState(0);
  const [showWelcome, setShowWelcome] = useState(true);

  // Separate list of just the command strings for Up/Down history navigation
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [draftInput, setDraftInput] = useState('');

  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom whenever history or input changes
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'auto' });
  }, [history, input]);

  // If the user types while text is selected, clear selection and re-focus input
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      const selection = window.getSelection();
      if (selection && selection.toString().length > 0) {
        selection.removeAllRanges();
        inputRef.current?.focus();
      }
    };
    document.addEventListener('keydown', handleGlobalKeyDown);
    return () => document.removeEventListener('keydown', handleGlobalKeyDown);
  }, []);

  // Click anywhere in terminal to focus the hidden input,
  // but don't steal focus if the user is selecting text.
  const handleTerminalClick = () => {
    const selection = window.getSelection();
    if (selection && selection.toString().length > 0) return;
    inputRef.current?.focus();
  };

  const processCommand = (cmd: string) => {
    const trimmedCmd = cmd.trim();
    if (!trimmedCmd) return '';

    const args = trimmedCmd.split(' ');
    const baseCmd = args[0].toLowerCase();

    switch (baseCmd) {
      case 'help':
        return (
          <div className="command-output">
            <div>Available commands:</div>
            <div>help  - Show this message</div>
            <div>clear - Clear terminal output</div>
            <div>echo  - Print text to the terminal</div>
          </div>
        );
      case 'clear':
        return null; // Handled separately to actually clear state
      case 'echo':
        return <div className="command-output">{args.slice(1).join(' ')}</div>;
      default:
        return <div className="command-output">{baseCmd}: command not found</div>;
    }
  };

  const updateCursor = (e: React.SyntheticEvent<HTMLInputElement>) => {
    setCursorPos(e.currentTarget.selectionStart || 0);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      const trimmedOutput = processCommand(input);

      if (input.trim()) {
        setCommandHistory(prev => [...prev, input]);
      }
      setHistoryIndex(-1);
      setDraftInput('');

      if (input.trim().toLowerCase() === 'clear') {
        setHistory([]);
        setShowWelcome(false);
      } else {
        setHistory(prev => [
          ...prev,
          {
            id: commandId,
            command: input,
            output: trimmedOutput
          }
        ]);
        setCommandId(prev => prev + 1);
      }

      setInput('');
      setCursorPos(0);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (commandHistory.length === 0) return;
      const newIndex = historyIndex === -1
        ? commandHistory.length - 1
        : Math.max(0, historyIndex - 1);
      if (historyIndex === -1) setDraftInput(input);
      setHistoryIndex(newIndex);
      const cmd = commandHistory[newIndex];
      setInput(cmd);
      setCursorPos(cmd.length);
      // Move hidden input cursor to end after state update
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.selectionStart = cmd.length;
          inputRef.current.selectionEnd = cmd.length;
        }
      }, 0);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIndex === -1) return;
      const newIndex = historyIndex + 1;
      if (newIndex >= commandHistory.length) {
        // Back to the draft
        setHistoryIndex(-1);
        setInput(draftInput);
        setCursorPos(draftInput.length);
        setTimeout(() => {
          if (inputRef.current) {
            inputRef.current.selectionStart = draftInput.length;
            inputRef.current.selectionEnd = draftInput.length;
          }
        }, 0);
      } else {
        setHistoryIndex(newIndex);
        const cmd = commandHistory[newIndex];
        setInput(cmd);
        setCursorPos(cmd.length);
        setTimeout(() => {
          if (inputRef.current) {
            inputRef.current.selectionStart = cmd.length;
            inputRef.current.selectionEnd = cmd.length;
          }
        }, 0);
      }
    }
  };

  const prompt = (
    <span className="terminal-prompt">
      user@react-term:~$
    </span>
  );

  return (
    <div
      className="terminal-container"
      onClick={handleTerminalClick}
    >
      {showWelcome &&
        <div className="terminal-welcome">
          <div>
            &nbsp;&nbsp;&nbsp;&nbsp;___    __          ____  _____<br />
            &nbsp;&nbsp;&nbsp;/   |  / /__  _  __/ __ \/ ___/<br />
            &nbsp;&nbsp;/ /| | / / _ \| |/_/ / / /\__ \<br />
            &nbsp;/ ___ |/ /  __/&gt;  &lt;/ /_/ /___/ /<br />
            /_/  |_/_/\___/_/|_|\____//____/<br />
          </div>
          <div>Welcome to React Terminal.</div>
          <div>Theme: Black and White. Configured with an Ubuntu-style block cursor.</div>
          <div>Type 'help' to see a list of available commands.</div>
        </div>
      }
      <div>
        {history.map((item) => (
          <div key={item.id}>
            <div className="terminal-line">
              {prompt}
              <span>{item.command}</span>
            </div>
            {item.output}
          </div>
        ))}
      </div>

      <div className="input-container">
        {prompt}

        {/* Rendered Input Text + Appended Blink Cursor */}
        <div className="input-renderer">
          <span>{input.slice(0, cursorPos)}</span>
          <span className="blinking-cursor">{input.slice(cursorPos, cursorPos + 1) || ' '}</span>
          <span>{input.slice(cursorPos + 1)}</span>
        </div>

        {/* Hidden internal input to capture keystrokes on mobile/desktop */}
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => {
            setInput(e.target.value);
            setCursorPos(e.target.selectionStart || 0);
          }}
          onKeyDown={handleKeyDown}
          onKeyUp={updateCursor}
          onClick={updateCursor}
          autoFocus
          autoComplete="off"
          spellCheck="false"
          className="hidden-input"
        />
      </div>

      {/* Keeps the view scrolling slightly past the bottom for comfort */}
      <div ref={bottomRef} style={{ paddingBottom: '32px' }} />
    </div>
  );
}

export default App;
