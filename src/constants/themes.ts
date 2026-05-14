export interface Theme {
  name: string;
  colors: {
    bg: string;
    text: string;
    prompt: string;
    folder: string;
    cursor: string;
    output: string;
  };
  typography: {
    fontFamily: string;
    fontSize: string;
    lineHeight: string;
  };
}

export const themes: Record<string, Theme> = {
  default: {
    name: 'Default',
    colors: {
      bg: '#000000',
      text: '#c0c0c0',
      prompt: '#c0c0c0',
      folder: '#61dafb',
      cursor: '#c0c0c0',
      output: '#cccccc',
    },
    typography: {
      fontFamily: 'Consolas, monaco, monospace',
      fontSize: '16px',
      lineHeight: '1',
    },
  },
  light: {
    name: 'Light Mode',
    colors: {
      bg: '#ffffff',
      text: '#000000',
      prompt: '#0000ff',
      folder: '#000080',
      cursor: '#000000',
      output: '#333333',
    },
    typography: {
      fontFamily: 'Consolas, monaco, monospace',
      fontSize: '16px',
      lineHeight: '1',
    },
  },
  ubuntu: {
    name: 'Ubuntu',
    colors: {
      bg: '#300a24',
      text: '#ffffff',
      prompt: '#87ff00',
      folder: '#3465a4',
      cursor: '#ffffff',
      output: '#eeeeec',
    },
    typography: {
      fontFamily: '"Ubuntu Mono", monospace',
      fontSize: '15px',
      lineHeight: '1.0',
    },
  },
  matrix: {
    name: 'Matrix',
    colors: {
      bg: '#000000',
      text: '#00ff41',
      prompt: '#00ff41',
      folder: '#00ff41',
      cursor: '#00ff41',
      output: '#008f11',
    },
    typography: {
      fontFamily: '"courier", monospace',
      fontSize: '16px',
      lineHeight: '1.0',
    },
  },
};
