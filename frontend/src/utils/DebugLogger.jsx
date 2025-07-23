import { useEffect, useState } from 'react';

export default function DebugLogger() {
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    // Creamos una función global para debugLog
    window.debugLog = (...args) => {
      const message = args.map(arg => {
        try {
          return typeof arg === 'object' ? JSON.stringify(arg) : String(arg);
        } catch {
          return String(arg);
        }
      }).join(' ');

      console.log('[DEBUG]', ...args);
      setLogs(prev => [...prev.slice(-19), message]);
    };
  }, []);

  return (
    <div style={{
      position: 'fixed',
      bottom: 0,
      left: 0,
      width: '100%',
      maxHeight: '200px',
      backgroundColor: 'rgba(0, 0, 0, 0.85)',
      color: 'lime',
      fontSize: '11px',
      padding: '5px',
      zIndex: 9999,
      overflowY: 'auto',
      whiteSpace: 'pre-wrap'
    }}>
      {logs.map((log, index) => (
        <div key={index}>{log}</div>
      ))}
    </div>
  );
}