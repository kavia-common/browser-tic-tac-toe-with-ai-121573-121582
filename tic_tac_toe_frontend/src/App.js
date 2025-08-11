import React, { useState, useEffect } from 'react';
import './App.css';
import { generateTrashTalk } from './services/openai';

// Utility: check winner lines
function calculateWinner(squares) {
  const lines = [
    [0,1,2], [3,4,5], [6,7,8], // rows
    [0,3,6], [1,4,7], [2,5,8], // cols
    [0,4,8], [2,4,6],          // diagonals
  ];
  for (const [a, b, c] of lines) {
    if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
      return squares[a];
    }
  }
  return null;
}

// PUBLIC_INTERFACE
/**
 * Root application component. Renders the Tic Tac Toe board, status, controls,
 * and the AI trash-talking chat panel. Also manages the theme state.
 */
function App() {
  const [theme, setTheme] = useState('light');

  // Game state
  const [board, setBoard] = useState(Array(9).fill(null));
  const [xIsNext, setXIsNext] = useState(true);
  const [chat, setChat] = useState([]);

  // Effect to apply theme to document element
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  // Seed an initial friendly greeting
  useEffect(() => {
    setChat([
      { role: 'ai', content: '🤖 Welcome challenger! Drop your first move and brace for premium-grade banter.' }
    ]);
  }, []);

  const winner = calculateWinner(board);
  const isDraw = !winner && board.every(Boolean);
  const status = winner
    ? `Winner: ${winner} 🎉`
    : isDraw
      ? "It's a draw! 🤝"
      : `Next player: ${xIsNext ? 'X' : 'O'}`;

  // PUBLIC_INTERFACE
  /**
   * Toggle the UI theme between light and dark.
   */
  const toggleTheme = () => {
    setTheme(prevTheme => prevTheme === 'light' ? 'dark' : 'light');
  };

  // PUBLIC_INTERFACE
  /**
   * Handle a user clicking a square. Records the move, updates the game,
   * and fetches a trash-talking comment from the AI.
   * @param {number} index - Board index 0-8.
   */
  const handleClick = async (index) => {
    if (board[index] || winner) return; // ignore if occupied or game is over

    const player = xIsNext ? 'X' : 'O';
    const nextPlayer = xIsNext ? 'O' : 'X';

    const newBoard = board.slice();
    newBoard[index] = player;

    setBoard(newBoard);
    setXIsNext(!xIsNext);

    const newWinner = calculateWinner(newBoard);
    const newIsDraw = !newWinner && newBoard.every(Boolean);

    // Prepare context for AI
    const context = {
      board: newBoard,
      lastMove: { index, player },
      winner: newWinner,
      isDraw: newIsDraw,
      nextPlayer,
    };

    // Insert a placeholder "thinking" message immediately for responsiveness
    const placeholder = { role: 'ai', content: '🤖 Calculating elite-level sass...' };
    setChat(prev => [...prev, placeholder]);
    const msgIndex = chat.length; // position where placeholder will be inserted

    try {
      const reply = await generateTrashTalk(context);
      setChat(prev => {
        const updated = prev.slice();
        updated[msgIndex] = { role: 'ai', content: reply };
        return updated;
      });
    } catch (_err) {
      setChat(prev => {
        const updated = prev.slice();
        updated[msgIndex] = { role: 'ai', content: '⚠️ Could not fetch AI banter this time.' };
        return updated;
      });
    }
  };

  // PUBLIC_INTERFACE
  /**
   * Reset the game board and chat.
   */
  const resetGame = () => {
    setBoard(Array(9).fill(null));
    setXIsNext(true);
    setChat([
      { role: 'ai', content: '🔄 Fresh board! Let’s see if you can do better this time.' }
    ]);
  };

  // Square component
  const Square = ({ value, onClick, ariaLabel }) => (
    <button
      className="square"
      onClick={onClick}
      aria-label={ariaLabel}
    >
      {value}
    </button>
  );

  return (
    <div className="App">
      <header className="App-header">
        <button
          className="theme-toggle"
          onClick={toggleTheme}
          aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
        >
          {theme === 'light' ? '🌙 Dark' : '☀️ Light'}
        </button>

        <h1 className="title">Tic Tac Toe</h1>
        <p className="status" role="status" aria-live="polite">{status}</p>

        <div className="game">
          <div className="board" role="grid" aria-label="Tic Tac Toe Board">
            <div className="board-row" role="row">
              <Square value={board[0]} onClick={() => handleClick(0)} ariaLabel="Square 1" />
              <Square value={board[1]} onClick={() => handleClick(1)} ariaLabel="Square 2" />
              <Square value={board[2]} onClick={() => handleClick(2)} ariaLabel="Square 3" />
            </div>
            <div className="board-row" role="row">
              <Square value={board[3]} onClick={() => handleClick(3)} ariaLabel="Square 4" />
              <Square value={board[4]} onClick={() => handleClick(4)} ariaLabel="Square 5" />
              <Square value={board[5]} onClick={() => handleClick(5)} ariaLabel="Square 6" />
            </div>
            <div className="board-row" role="row">
              <Square value={board[6]} onClick={() => handleClick(6)} ariaLabel="Square 7" />
              <Square value={board[7]} onClick={() => handleClick(7)} ariaLabel="Square 8" />
              <Square value={board[8]} onClick={() => handleClick(8)} ariaLabel="Square 9" />
            </div>
          </div>

          <div className="actions">
            <button className="btn" onClick={resetGame} aria-label="Restart Game">Restart</button>
          </div>

          <div className="chat-panel" aria-live="polite" aria-label="AI Trash Talk">
            <div className="chat-header">Game Chat</div>
            <div className="chat-messages">
              {chat.map((m, i) => (
                <div key={i} className={`chat-message ${m.role}`}>
                  {m.content}
                </div>
              ))}
            </div>
            {!process.env.REACT_APP_OPENAI_API_KEY && (
              <div className="chat-note">
                Set REACT_APP_OPENAI_API_KEY in your environment to enable live AI trash talk.
              </div>
            )}
          </div>
        </div>

        <p className="current-theme">
          Current theme: <strong>{theme}</strong>
        </p>
      </header>
    </div>
  );
}

export default App;
