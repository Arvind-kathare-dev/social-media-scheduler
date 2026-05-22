/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        bg: 'var(--bg)',
        panel: 'var(--panel)',
        'panel-2': 'var(--panel-2)',
        text: 'var(--text)',
        muted: 'var(--muted)',
        line: 'var(--line)',
        'strong-line': 'var(--strong-line)',
        primary: 'var(--primary)',
        'primary-2': 'var(--primary-2)',
        danger: 'var(--danger)',
        'danger-bg': 'var(--danger-bg)',
        ok: 'var(--ok)',
        'ok-bg': 'var(--ok-bg)',
        warning: 'var(--warning)',
        'warning-bg': 'var(--warning-bg)',
        ig: 'var(--ig)',
        fb: 'var(--fb)',
        x: 'var(--x)',
        li: 'var(--li)',
        pin: 'var(--pin)',
        yt: 'var(--yt)',
      },
      boxShadow: {
        custom: 'var(--shadow)',
      },
      borderRadius: {
        custom: 'var(--radius)',
      }
    },
  },
  plugins: [],
}
