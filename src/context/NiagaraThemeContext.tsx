import React, { createContext, useContext, useState, useEffect } from 'react';

export type NiagaraTheme = 'classic' | 'modern';
export type WireRoutingStyle = 'bezier' | 'manhattan';

interface NiagaraThemeContextType {
  theme: NiagaraTheme;
  setTheme: (theme: NiagaraTheme) => void;
  toggleTheme: () => void;
  wireRouting: WireRoutingStyle;
  setWireRouting: (routing: WireRoutingStyle) => void;
  animateSignalFlow: boolean;
  setAnimateSignalFlow: (anim: boolean) => void;
  snapToGrid: boolean;
  setSnapToGrid: (snap: boolean) => void;
  colorCodedWires: boolean;
  setColorCodedWires: (color: boolean) => void;
}

const NiagaraThemeContext = createContext<NiagaraThemeContextType>({
  theme: 'classic',
  setTheme: () => {},
  toggleTheme: () => {},
  wireRouting: 'bezier',
  setWireRouting: () => {},
  animateSignalFlow: true,
  setAnimateSignalFlow: () => {},
  snapToGrid: true,
  setSnapToGrid: () => {},
  colorCodedWires: true,
  setColorCodedWires: () => {},
});

export const NiagaraThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<NiagaraTheme>(() => {
    const saved = localStorage.getItem('niagara_theme');
    return (saved === 'modern' || saved === 'classic') ? saved : 'classic';
  });

  const [wireRouting, setWireRoutingState] = useState<WireRoutingStyle>(() => {
    const saved = localStorage.getItem('niagara_wire_routing');
    return (saved === 'manhattan' || saved === 'bezier') ? saved : 'bezier';
  });

  const [animateSignalFlow, setAnimateSignalFlowState] = useState<boolean>(() => {
    const saved = localStorage.getItem('niagara_animate_signal_flow');
    return saved !== 'false';
  });

  const [snapToGrid, setSnapToGridState] = useState<boolean>(() => {
    const saved = localStorage.getItem('niagara_snap_to_grid');
    return saved !== 'false';
  });

  const [colorCodedWires, setColorCodedWiresState] = useState<boolean>(() => {
    const saved = localStorage.getItem('niagara_color_coded_wires');
    return saved !== 'false';
  });

  const setWireRouting = (style: WireRoutingStyle) => {
    setWireRoutingState(style);
    localStorage.setItem('niagara_wire_routing', style);
  };

  const setAnimateSignalFlow = (anim: boolean) => {
    setAnimateSignalFlowState(anim);
    localStorage.setItem('niagara_animate_signal_flow', String(anim));
  };

  const setSnapToGrid = (snap: boolean) => {
    setSnapToGridState(snap);
    localStorage.setItem('niagara_snap_to_grid', String(snap));
  };

  const setColorCodedWires = (color: boolean) => {
    setColorCodedWiresState(color);
    localStorage.setItem('niagara_color_coded_wires', String(color));
  };

  useEffect(() => {
    localStorage.setItem('niagara_theme', theme);
    document.documentElement.setAttribute('data-niagara-theme', theme);
    
    if (theme === 'modern') {
      document.documentElement.classList.remove('classic-theme');
      document.documentElement.classList.add('modern-theme');
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.add('classic-theme');
      document.documentElement.classList.remove('modern-theme');
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'classic' ? 'modern' : 'classic'));
  };

  return (
    <NiagaraThemeContext.Provider
      value={{
        theme,
        setTheme,
        toggleTheme,
        wireRouting,
        setWireRouting,
        animateSignalFlow,
        setAnimateSignalFlow,
        snapToGrid,
        setSnapToGrid,
        colorCodedWires,
        setColorCodedWires,
      }}
    >
      {children}
    </NiagaraThemeContext.Provider>
  );
};

export const useNiagaraTheme = () => {
  const context = useContext(NiagaraThemeContext);
  return {
    ...context,
    isDark: context.theme === 'modern',
  };
};
