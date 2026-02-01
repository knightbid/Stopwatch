import React from 'react';
import { Theme } from '../types';
import { THEMES } from '../constants';
import { Palette } from 'lucide-react';

interface ThemeSelectorProps {
  currentTheme: Theme;
  onSelect: (theme: Theme) => void;
  customTheme: Theme;
  onCustomThemeChange: (theme: Theme) => void;
}

const ThemeSelector: React.FC<ThemeSelectorProps> = ({ 
  currentTheme, 
  onSelect, 
  customTheme, 
  onCustomThemeChange 
}) => {
  
  const handleColorChange = (key: keyof Theme['colors'], value: string) => {
    const newCustomTheme = {
      ...customTheme,
      colors: {
        ...customTheme.colors,
        [key]: value,
      },
    };
    onCustomThemeChange(newCustomTheme);
  };

  return (
    <div className="flex flex-col items-center">
      <div className="flex flex-wrap gap-3 justify-center items-center p-4">
        {THEMES.map((theme) => (
          <button
            key={theme.id}
            onClick={() => onSelect(theme)}
            className={`
              w-10 h-10 rounded-full border-2 transition-transform hover:scale-110 focus:outline-none focus:ring-2 ring-offset-2
              ${currentTheme.id === theme.id ? 'scale-110 ring-2' : 'opacity-70 hover:opacity-100'}
            `}
            style={{
              backgroundColor: theme.colors.bg,
              borderColor: theme.colors.accent,
              boxShadow: currentTheme.id === theme.id ? `0 0 15px ${theme.colors.accent}` : 'none',
              '--tw-ring-color': theme.colors.text,
            } as React.CSSProperties}
            title={theme.name}
          >
            <div className="w-full h-full flex items-center justify-center rounded-full overflow-hidden relative">
              <div className="absolute inset-0 rotate-45 transform origin-center">
                  <div className="h-full w-1/2 absolute left-0" style={{backgroundColor: theme.colors.bg}}></div>
                  <div className="h-full w-1/2 absolute right-0" style={{backgroundColor: theme.colors.accent}}></div>
              </div>
              <div className="z-10 w-2 h-2 rounded-full" style={{backgroundColor: theme.colors.text}}></div>
            </div>
          </button>
        ))}

        {/* Custom Theme Button */}
        <button
          onClick={() => onSelect(customTheme)}
          className={`
            w-10 h-10 rounded-full border-2 transition-transform hover:scale-110 focus:outline-none focus:ring-2 ring-offset-2 flex items-center justify-center
            ${currentTheme.id === 'custom' ? 'scale-110 ring-2' : 'opacity-70 hover:opacity-100'}
          `}
          style={{
            backgroundColor: customTheme.colors.bg,
            borderColor: customTheme.colors.accent,
            color: customTheme.colors.text,
            boxShadow: currentTheme.id === 'custom' ? `0 0 15px ${customTheme.colors.accent}` : 'none',
            '--tw-ring-color': customTheme.colors.text,
          } as React.CSSProperties}
          title="Custom Theme"
        >
          <Palette size={18} />
        </button>
      </div>

      {/* Custom Theme Editors */}
      {currentTheme.id === 'custom' && (
        <div className="mt-2 flex gap-6 p-4 rounded-xl bg-white/5 border border-white/10 animate-fade-in-up">
           <div className="flex flex-col items-center gap-2">
              <label className="text-[10px] uppercase tracking-wider opacity-70">Background</label>
              <input 
                type="color" 
                value={customTheme.colors.bg}
                onChange={(e) => handleColorChange('bg', e.target.value)}
                className="w-8 h-8 rounded cursor-pointer bg-transparent border-none p-0"
              />
           </div>
           <div className="flex flex-col items-center gap-2">
              <label className="text-[10px] uppercase tracking-wider opacity-70">Text</label>
              <input 
                type="color" 
                value={customTheme.colors.text}
                onChange={(e) => handleColorChange('text', e.target.value)}
                className="w-8 h-8 rounded cursor-pointer bg-transparent border-none p-0"
              />
           </div>
           <div className="flex flex-col items-center gap-2">
              <label className="text-[10px] uppercase tracking-wider opacity-70">Accent</label>
              <input 
                type="color" 
                value={customTheme.colors.accent}
                onChange={(e) => handleColorChange('accent', e.target.value)}
                className="w-8 h-8 rounded cursor-pointer bg-transparent border-none p-0"
              />
           </div>
        </div>
      )}
    </div>
  );
};

export default ThemeSelector;