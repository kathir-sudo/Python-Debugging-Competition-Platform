
import { useState, useEffect } from 'react';

// Pyodide is loaded from a script tag in index.html, so we declare it globally
declare global {
  interface Window {
    loadPyodide: (config?: { indexURL: string }) => Promise<any>;
    pyodide: any;
  }
}

export const usePyodide = () => {
  const [pyodide, setPyodide] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        if (window.pyodide) { // Already loaded
          setPyodide(window.pyodide);
          setIsLoading(false);
          return;
        }
        
        console.log('Loading Pyodide...');
        const pyodideInstance = await window.loadPyodide({
          indexURL: "https://cdn.jsdelivr.net/pyodide/v0.25.1/full/"
        });
        window.pyodide = pyodideInstance; // Cache it globally
        setPyodide(pyodideInstance);
        console.log('Pyodide loaded successfully.');
      } catch (e) {
        console.error('Failed to load Pyodide', e);
        setError(e as Error);
      } finally {
        setIsLoading(false);
      }
    };

    load();
  }, []);

  return { pyodide, isLoading, error };
};
