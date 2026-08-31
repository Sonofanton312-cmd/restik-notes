// Runs before paint (via next/script beforeInteractive-style inline script in
// the layout) to apply the right theme class immediately and avoid a
// light/dark flash on load.
export function themeInitScript() {
  return `
    (function () {
      try {
        var stored = localStorage.getItem('restik-notes-theme');
        var theme = stored || 'system';
        var isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
        document.documentElement.classList.toggle('dark', isDark);
      } catch (e) {}
    })();
  `;
}
