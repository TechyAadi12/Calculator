import { useCallback, useEffect, useState } from 'react';
import { ArrowDownLeft, Clock3, Command, Delete, History, Moon, Sun } from 'lucide-react';

const operators = ['÷', '×', '−', '+'];
const isOperator = (value) => operators.includes(value);

function formatResult(value) {
  if (!Number.isFinite(value)) return 'Error';
  const rounded = Number.parseFloat(value.toPrecision(12));
  return new Intl.NumberFormat('en-US', { maximumFractionDigits: 10 }).format(rounded);
}

function calculate(left, operator, right) {
  const a = Number(left);
  const b = Number(right);
  switch (operator) {
    case '+': return a + b;
    case '−': return a - b;
    case '×': return a * b;
    case '÷': return b === 0 ? Number.NaN : a / b;
    default: return b;
  }
}

function App() {
  const [display, setDisplay] = useState('0');
  const [storedValue, setStoredValue] = useState(null);
  const [operator, setOperator] = useState(null);
  const [waitingForOperand, setWaitingForOperand] = useState(false);
  const [expression, setExpression] = useState('');
  const [history, setHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [lightMode, setLightMode] = useState(false);
  const [justCalculated, setJustCalculated] = useState(false);

  const clear = useCallback(() => {
    setDisplay('0');
    setStoredValue(null);
    setOperator(null);
    setWaitingForOperand(false);
    setExpression('');
    setJustCalculated(false);
  }, []);

  const inputDigit = useCallback((digit) => {
    if (display === 'Error' || waitingForOperand || justCalculated) {
      setDisplay(digit);
      setWaitingForOperand(false);
      setExpression('');
      setJustCalculated(false);
      return;
    }
    setDisplay((current) => current === '0' ? digit : current.replace(/,/g, '') + digit);
  }, [display, justCalculated, waitingForOperand]);

  const inputDecimal = useCallback(() => {
    if (display === 'Error' || waitingForOperand || justCalculated) {
      setDisplay('0.');
      setWaitingForOperand(false);
      setExpression('');
      setJustCalculated(false);
      return;
    }
    if (!display.replace(/,/g, '').includes('.')) setDisplay((current) => current.replace(/,/g, '') + '.');
  }, [display, justCalculated, waitingForOperand]);

  const chooseOperator = useCallback((nextOperator) => {
    const current = Number(display.replace(/,/g, ''));
    if (!Number.isFinite(current)) {
      clear();
      return;
    }
    if (operator && !waitingForOperand) {
      const result = calculate(storedValue, operator, current);
      const formatted = formatResult(result);
      setDisplay(formatted);
      setStoredValue(result);
      setExpression(`${formatResult(result)} ${nextOperator}`);
    } else {
      setStoredValue(current);
      setExpression(`${formatResult(current)} ${nextOperator}`);
    }
    setOperator(nextOperator);
    setWaitingForOperand(true);
    setJustCalculated(false);
  }, [clear, display, operator, storedValue, waitingForOperand]);

  const equals = useCallback(() => {
    if (!operator || storedValue === null || waitingForOperand) return;
    const right = Number(display.replace(/,/g, ''));
    const result = calculate(storedValue, operator, right);
    const resultText = formatResult(result);
    setExpression(`${formatResult(storedValue)} ${operator} ${formatResult(right)} =`);
    setDisplay(resultText);
    setHistory((items) => [{ expression: `${formatResult(storedValue)} ${operator} ${formatResult(right)}`, result: resultText, id: Date.now() }, ...items].slice(0, 8));
    setStoredValue(null);
    setOperator(null);
    setWaitingForOperand(false);
    setJustCalculated(true);
  }, [display, operator, storedValue, waitingForOperand]);

  const performAction = useCallback((action) => {
    if (/^\d$/.test(action)) {
      inputDigit(action);
    } else if (action === '.') {
      inputDecimal();
    } else if (isOperator(action)) {
      chooseOperator(action);
    } else if (action === '=') {
      equals();
    } else if (action === 'AC') {
      clear();
    } else if (action === '±') {
      if (display !== '0' && display !== 'Error') {
        setDisplay((current) => current.startsWith('-') ? current.slice(1) : `-${current}`);
      }
    } else if (action === '%') {
      if (display !== 'Error') {
        setDisplay(formatResult(Number(display.replace(/,/g, '')) / 100));
        setWaitingForOperand(false);
      }
    } else if (action === 'backspace') {
      if (display !== 'Error' && !waitingForOperand && !justCalculated) {
        const next = display.replace(/,/g, '').slice(0, -1);
        setDisplay(next && next !== '-' ? next : '0');
      }
    }
  }, [chooseOperator, clear, display, equals, inputDecimal, inputDigit, justCalculated, waitingForOperand]);

  useEffect(() => {
    const onKeyDown = (event) => {
      if (/^\d$/.test(event.key)) performAction(event.key);
      else if (event.key === '.' || event.key === ',') performAction('.');
      else if (event.key === '+') performAction('+');
      else if (event.key === '-') performAction('−');
      else if (event.key === '*') performAction('×');
      else if (event.key === '/') { event.preventDefault(); performAction('÷'); }
      else if (event.key === 'Enter' || event.key === '=') { event.preventDefault(); performAction('='); }
      else if (event.key === 'Backspace') performAction('backspace');
      else if (event.key === 'Escape' || event.key === 'Delete') performAction('AC');
      else if (event.key === '%') performAction('%');
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [performAction]);

  const buttons = [
    { label: 'AC', type: 'utility', aria: 'All clear' },
    { label: '±', type: 'utility', aria: 'Change sign' },
    { label: '%', type: 'utility', aria: 'Percent' },
    { label: '÷', type: 'operator', aria: 'Divide' },
    { label: '7', type: 'number' },
    { label: '8', type: 'number' },
    { label: '9', type: 'number' },
    { label: '×', type: 'operator', aria: 'Multiply' },
    { label: '4', type: 'number' },
    { label: '5', type: 'number' },
    { label: '6', type: 'number' },
    { label: '−', type: 'operator', aria: 'Subtract' },
    { label: '1', type: 'number' },
    { label: '2', type: 'number' },
    { label: '3', type: 'number' },
    { label: '+', type: 'operator', aria: 'Add' },
    { label: '0', type: 'number', wide: true },
    { label: '.', type: 'number' },
    { label: '=', type: 'equals', aria: 'Equals' },
  ];

  return (
    <main className={`page${lightMode ? ' light-mode' : ''}`}>
      <div className="ambient ambient-one" />
      <div className="ambient ambient-two" />
      <header className="topbar">
        <a className="brand" href="#" aria-label="Calcu home">
          <span className="brand-mark"><span /><span /><span /><span /></span>
          <span>calcu<span className="brand-dot">.</span></span>
        </a>
        <div className="topbar-actions">
          <span className="keyboard-hint"><Command size={13} /> <span>your everyday calculator</span></span>
          <button className="icon-button theme-toggle" onClick={() => setLightMode((value) => !value)} aria-label={`Switch to ${lightMode ? 'dark' : 'light'} theme`}>
            {lightMode ? <Moon size={17} /> : <Sun size={17} />}
          </button>
        </div>
      </header>

      <section className="calculator-wrap" aria-label="Calculator">
        <div className="intro">
          <span className="eyebrow"><span className="status-dot" /> READY WHEN YOU ARE</span>
          <h1>A little <span>clarity.</span></h1>
          <p>Thoughtful math, minus the fuss.</p>
        </div>

        <div className="calculator">
          <div className="calc-topline">
            <div className="calc-label"><span className="calc-icon"><span /><span /><span /><span /></span> BASIC</div>
            <div className="calc-actions">
              <button className="icon-button" onClick={() => performAction('backspace')} aria-label="Backspace"><Delete size={16} strokeWidth={1.8} /></button>
              <button className={`icon-button history-toggle${showHistory ? ' selected' : ''}`} onClick={() => setShowHistory((value) => !value)} aria-label="Toggle calculation history" aria-pressed={showHistory}>
                {showHistory ? <ArrowDownLeft size={17} /> : <History size={17} />}
              </button>
            </div>
          </div>

          <div className="display" aria-live="polite" aria-atomic="true">
            <div className="expression">{expression || <span className="expression-placeholder">Let’s work it out</span>}</div>
            <div className={`display-value${display === 'Error' ? ' error' : ''}`} title={display}>{display}</div>
          </div>

          <div className="keypad" role="group" aria-label="Calculator keypad">
            {buttons.map(({ label, type, aria, wide, action }) => (
              <button
                key={label}
                className={`key key-${type}${wide ? ' key-wide' : ''}${type === 'operator' && operator === label ? ' key-active' : ''}`}
                onClick={() => performAction(action || label)}
                aria-label={aria || label}
                aria-pressed={type === 'operator' ? operator === label : undefined}
              >
                {label === '⌫' ? <Delete size={18} strokeWidth={1.8} /> : label}
              </button>
            ))}
          </div>

          <div className="calc-footer">
            <span><span className="footer-sparkle">✳</span> Made for the little things</span>
            <span className="keyboard-label">KEYBOARD READY</span>
          </div>

          {showHistory && (
            <div className="history-panel">
              <div className="history-heading"><span>RECENT</span><button onClick={() => setHistory([])} disabled={history.length === 0}>Clear</button></div>
              {history.length === 0 ? <p className="history-empty"><Clock3 size={15} /> Your calculations will show up here.</p> : (
                <ul className="history-list">
                  {history.map((item) => (
                    <li key={item.id}>
                      <span>{item.expression}</span>
                      <button onClick={() => { setDisplay(item.result); setExpression(item.expression + ' ='); setStoredValue(null); setOperator(null); setJustCalculated(true); }}>{item.result}</button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
        <p className="keyboard-note">TIP: USE YOUR KEYBOARD <span>·</span> ESC TO CLEAR <span>·</span> ENTER TO SOLVE</p>
      </section>
      <footer className="page-footer"><span>KEEP IT SIMPLE.</span><span>CALCU © 2025</span></footer>
    </main>
  );
}

export default App;
