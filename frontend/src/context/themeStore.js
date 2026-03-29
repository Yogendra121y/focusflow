import { create } from 'zustand';

const useThemeStore = create((set) => ({
  isDark: localStorage.getItem('focusflow_theme') === 'dark' || 
    (!localStorage.getItem('focusflow_theme') && window.matchMedia('(prefers-color-scheme: dark)').matches),

  toggleTheme: () => set((state) => {
    const newDark = !state.isDark;
    localStorage.setItem('focusflow_theme', newDark ? 'dark' : 'light');
    if (newDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    return { isDark: newDark };
  }),

  initTheme: () => {
    const isDark = localStorage.getItem('focusflow_theme') === 'dark' ||
      (!localStorage.getItem('focusflow_theme') && window.matchMedia('(prefers-color-scheme: dark)').matches);
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    return { isDark };
  },
}));

export default useThemeStore;
