// src/styles/theme.ts
export type ThemeColors = {
  primary: string;
  secondary: string;
  background: string;
  surface: string;
  text: {
    primary: string;
    secondary: string;
  };
  border: string;
  focus: string;
};

export type Theme = {
  colors: ThemeColors;
  button: {
    primary: string;
    secondary: string;
    disabled: string;
  };
  input: {
    border: string;
    focus: string;
    background: string;
  };
};

export const mauveTheme: Theme = {
  colors: {
    primary: 'purple-600',
    secondary: 'purple-500',
    background: 'purple-50',
    surface: 'white',
    text: {
      primary: 'purple-900',
      secondary: 'purple-600',
    },
    border: 'purple-200',
    focus: 'purple-500',
  },
  button: {
    // Using a more muted purple for the primary button
    primary: 'bg-purple-500 hover:bg-purple-600 text-white',
    secondary: 'bg-purple-100 hover:bg-purple-200 text-purple-700',
    disabled: 'bg-purple-300 cursor-not-allowed',
  },
  input: {
    border: 'border-purple-300',
    focus: 'focus:ring-2 focus:ring-purple-500 focus:border-purple-500',
    background: 'bg-white',
  },
};