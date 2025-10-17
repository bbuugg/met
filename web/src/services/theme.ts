// 主题管理服务
class ThemeService {
  private static instance: ThemeService
  private currentTheme: 'light' | 'dark' = 'dark'
  private listeners: Array<(theme: 'light' | 'dark') => void> = []

  private constructor() {
    // 从localStorage恢复主题设置
    const savedTheme = localStorage.getItem('meeting-theme')
    if (savedTheme === 'light' || savedTheme === 'dark') {
      this.currentTheme = savedTheme
    }
    this.applyTheme()
  }

  static getInstance(): ThemeService {
    if (!ThemeService.instance) {
      ThemeService.instance = new ThemeService()
    }
    return ThemeService.instance
  }

  getCurrentTheme(): 'light' | 'dark' {
    return this.currentTheme
  }

  toggleTheme() {
    this.currentTheme = this.currentTheme === 'light' ? 'dark' : 'light'
    this.applyTheme()
    localStorage.setItem('meeting-theme', this.currentTheme)
    
    // 通知所有监听器
    this.listeners.forEach(listener => listener(this.currentTheme))
  }

  setTheme(theme: 'light' | 'dark') {
    this.currentTheme = theme
    this.applyTheme()
    localStorage.setItem('meeting-theme', this.currentTheme)
    
    // 通知所有监听器
    this.listeners.forEach(listener => listener(this.currentTheme))
  }

  private applyTheme() {
    if (this.currentTheme === 'light') {
      document.documentElement.classList.remove('dark')
      document.documentElement.classList.add('light')
    } else {
      document.documentElement.classList.remove('light')
      document.documentElement.classList.add('dark')
    }
  }

  // 添加主题变化监听器
  addListener(listener: (theme: 'light' | 'dark') => void) {
    this.listeners.push(listener)
  }

  // 移除主题变化监听器
  removeListener(listener: (theme: 'light' | 'dark') => void) {
    const index = this.listeners.indexOf(listener)
    if (index !== -1) {
      this.listeners.splice(index, 1)
    }
  }
}

export default ThemeService.getInstance()