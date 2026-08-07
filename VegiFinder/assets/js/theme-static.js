(() => {
  try {
    const stored = localStorage.getItem('vegifinder:theme:v2');
    const preferred = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    document.documentElement.dataset.theme = stored === 'dark' || stored === 'light' ? stored : preferred;
  } catch {
    document.documentElement.dataset.theme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
})();
