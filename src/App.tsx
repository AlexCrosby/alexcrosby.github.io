import { useEffect, useRef } from 'react';
import './App.css';
import { useTerminal } from './hooks/useTerminal';

function App() {
  const {
    history,
    input,
    setInput,
    cursorPos,
    setCursorPos,
    activePrompt,
    handleKeyDown,
    updateCursor,
    isCursorMoving,
    theme,
  } = useTerminal();

  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Apply theme variables directly to the container
  const themeStyles = {
    '--bg-color': theme.colors.bg,
    '--text-color': theme.colors.text,
    '--prompt-color': theme.colors.prompt,
    '--folder-color': theme.colors.folder,
    '--cursor-color': theme.colors.cursor,
    '--output-color': theme.colors.output,
    '--font-family': theme.typography.fontFamily,
    '--font-size': theme.typography.fontSize,
    '--line-height': theme.typography.lineHeight,
  } as React.CSSProperties;

  // Auto-scroll to bottom whenever history or input changes
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'auto' });
  }, [history, input]);

  // If the user types while text is selected, clear selection and re-focus input
  useEffect(() => {
    const handleGlobalKeyDown = (_: KeyboardEvent) => {
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

  return (
    <div
      className="terminal-container"
      onClick={handleTerminalClick}
      style={themeStyles}
    >
      <div>
        {history.map((item) => (
          <div key={item.id}>
            {item.prompt && (
              <div className="terminal-line">
                {item.prompt}
                <span>{item.command}</span>
              </div>
            )}
            {item.output}
          </div>
        ))}
      </div>

      <div className="input-container">
        {activePrompt}

        {/* Rendered Input Text + Appended Blink Cursor */}
        <div className="input-renderer">
          <span>{input.slice(0, cursorPos)}</span>
          <span className={`blinking-cursor ${isCursorMoving ? 'solid' : ''}`}>{input.slice(cursorPos, cursorPos + 1) || ' '}</span>
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
          onSelect={updateCursor}
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
