export default {
  content: ['./src/**/*.{vue,js}'],
  darkMode: 'class', // 启用基于class的暗色模式
  theme: {
    extend: {
      // 亮色主题颜色
      colors: {
        // 亮色主题
        light: {
          primary: '#3b82f6',
          secondary: '#64748b',
          background: '#f8fafc',
          surface: '#ffffff',
          text: '#1e293b',
          border: '#e2e8f0'
        },
        // 暗色主题
        dark: {
          primary: '#3b82f6',
          secondary: '#94a3b8',
          background: '#0f172a',
          surface: '#1e293b',
          text: '#f1f5f9',
          border: '#334155'
        }
      }
    }
  },
  plugins: [
    import('@tailwindcss/forms'),
    import('@tailwindcss/aspect-ratio'),
    import('@tailwindcss/typography')
  ]
}
