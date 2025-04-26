// Apply dark mode class based on preference or saved setting
// This needs to run early to prevent flashing
const preferDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
const savedTheme = localStorage.getItem('theme');
console.log(`[ThemeLoader] savedTheme: ${savedTheme}, prefersDark: ${preferDark}`);

if (savedTheme === 'dark' || (savedTheme === null && preferDark)) {
    console.log('[ThemeLoader] Applying dark class');
    document.documentElement.classList.add('dark');
} else {
    console.log('[ThemeLoader] Removing dark class');
    document.documentElement.classList.remove('dark');
} 