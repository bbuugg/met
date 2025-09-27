export default {
  content: ['./src/**/*.{vue,js}'],
  darkMode: 'class', // 启用基于class的暗色模式
  theme: {
    extend: {
      // 黑白主题颜色
      colors: {
        // 亮色主题 - 纯黑白
        light: {
          primary: '#000000',
          secondary: '#666666',
          background: '#ffffff',
          surface: '#ffffff',
          text: '#000000',
          border: '#e5e5e5'
        },
        // 暗色主题 - 纯黑白
        dark: {
          primary: '#ffffff',
          secondary: '#999999',
          background: '#000000',
          surface: '#000000',
          text: '#ffffff',
          border: '#333333'
        }
      },
      // 添加黑白渐变
      backgroundImage: {
        'gradient-light': 'linear-gradient(135deg, #ffffff 0%, #f5f5f5 100%)',
        'gradient-dark': 'linear-gradient(135deg, #000000 0%, #1a1a1a 100%)'
      },
      // 添加自定义阴影
      boxShadow: {
        'light': '0 2px 8px rgba(0, 0, 0, 0.1)',
        'dark': '0 2px 8px rgba(255, 255, 255, 0.05)'
      }
    }
  },
  plugins: [
    import('@tailwindcss/forms'),
    import('@tailwindcss/aspect-ratio'),
    import('@tailwindcss/typography')
  ]
}
