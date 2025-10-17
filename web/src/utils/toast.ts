// Toast notification utility to replace ArcoDesign Message component
// Uses TailwindCSS for styling

type ToastType = 'success' | 'error' | 'info' | 'warning'

interface ToastOptions {
  message: string
  type: ToastType
  duration?: number
}

class ToastManager {
  private container: HTMLDivElement | null = null
  private toasts: Set<HTMLDivElement> = new Set()

  private ensureContainer() {
    if (!this.container) {
      this.container = document.createElement('div')
      this.container.id = 'toast-container'
      this.container.style.cssText = `
        position: fixed;
        top: 1rem;
        right: 1rem;
        z-index: 99999;
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
        pointer-events: none;
      `
      document.body.appendChild(this.container)
    }
    return this.container
  }

  private getToastStyles(type: ToastType): { bg: string; border: string; icon: string } {
    const styles = {
      success: {
        bg: 'bg-green-50 dark:bg-green-900/20',
        border: 'border-green-500',
        icon: '✓'
      },
      error: {
        bg: 'bg-red-50 dark:bg-red-900/20',
        border: 'border-red-500',
        icon: '✕'
      },
      info: {
        bg: 'bg-blue-50 dark:bg-blue-900/20',
        border: 'border-blue-500',
        icon: 'ℹ'
      },
      warning: {
        bg: 'bg-yellow-50 dark:bg-yellow-900/20',
        border: 'border-yellow-500',
        icon: '⚠'
      }
    }
    return styles[type]
  }

  private show(options: ToastOptions) {
    const container = this.ensureContainer()
    const { message, type, duration = 3000 } = options
    const styles = this.getToastStyles(type)

    const toast = document.createElement('div')
    
    // Use inline styles for critical positioning and animation
    toast.style.cssText = `
      pointer-events: auto;
      min-width: 300px;
      max-width: 28rem;
      padding: 1rem;
      border-radius: 0.5rem;
      border-left: 4px solid;
      box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
      display: flex;
      align-items: flex-start;
      gap: 0.75rem;
      transform: translateX(400px);
      opacity: 0;
      transition: all 0.3s ease-out;
    `

    // Apply type-specific colors
    const isDark = document.documentElement.classList.contains('dark')
    const colorMap = {
      success: {
        bg: isDark ? 'rgba(6, 78, 59, 1)' : 'rgba(240, 253, 244, 1)',
        border: '#10b981',
        text: isDark ? '#34d399' : '#059669',
        iconBg: isDark ? '#34d399' : '#059669'
      },
      error: {
        bg: isDark ? 'rgba(127, 29, 29, 1)' : 'rgba(254, 242, 242, 1)',
        border: '#ef4444',
        text: isDark ? '#f87171' : '#dc2626',
        iconBg: isDark ? '#f87171' : '#dc2626'
      },
      info: {
        bg: isDark ? 'rgba(30, 58, 138, 1)' : 'rgba(239, 246, 255, 1)',
        border: '#3b82f6',
        text: isDark ? '#60a5fa' : '#2563eb',
        iconBg: isDark ? '#60a5fa' : '#2563eb'
      },
      warning: {
        bg: isDark ? 'rgba(120, 53, 15, 1)' : 'rgba(254, 252, 232, 1)',
        border: '#f59e0b',
        text: isDark ? '#fbbf24' : '#d97706',
        iconBg: isDark ? '#fbbf24' : '#d97706'
      }
    }

    const colors = colorMap[type]
    toast.style.backgroundColor = colors.bg
    toast.style.borderLeftColor = colors.border

    toast.innerHTML = `
      <div style="
        flex-shrink: 0;
        width: 1.25rem;
        height: 1.25rem;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: bold;
        color: ${colors.iconBg};
        font-size: 1rem;
      ">
        ${styles.icon}
      </div>
      <div style="
        flex: 1;
        font-size: 0.875rem;
        color: ${isDark ? '#e5e7eb' : '#1f2937'};
        word-break: break-word;
        line-height: 1.5;
      ">
        ${this.escapeHtml(message)}
      </div>
      <button style="
        flex-shrink: 0;
        color: ${isDark ? '#9ca3af' : '#6b7280'};
        background: none;
        border: none;
        cursor: pointer;
        padding: 0;
        margin-left: 0.5rem;
        font-size: 1rem;
        line-height: 1;
        transition: color 0.2s;
      " onmouseover="this.style.color='${isDark ? '#d1d5db' : '#374151'}'" onmouseout="this.style.color='${isDark ? '#9ca3af' : '#6b7280'}'">
        ✕
      </button>
    `

    const closeButton = toast.querySelector('button')
    const close = () => {
      toast.style.transform = 'translateX(400px)'
      toast.style.opacity = '0'
      setTimeout(() => {
        if (container.contains(toast)) {
          container.removeChild(toast)
          this.toasts.delete(toast)
        }
      }, 300)
    }

    closeButton?.addEventListener('click', close)

    container.appendChild(toast)
    this.toasts.add(toast)

    // Trigger animation
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        toast.style.transform = 'translateX(0)'
        toast.style.opacity = '1'
      })
    })

    // Auto close
    if (duration > 0) {
      setTimeout(close, duration)
    }
  }

  private escapeHtml(text: string): string {
    const div = document.createElement('div')
    div.textContent = text
    return div.innerHTML
  }

  success(message: string, duration?: number) {
    this.show({ message, type: 'success', duration })
  }

  error(message: string, duration?: number) {
    this.show({ message, type: 'error', duration })
  }

  info(message: string, duration?: number) {
    this.show({ message, type: 'info', duration })
  }

  warning(message: string, duration?: number) {
    this.show({ message, type: 'warning', duration })
  }

  clear() {
    this.toasts.forEach(toast => {
      toast.style.transform = 'translateX(400px)'
      toast.style.opacity = '0'
    })
    setTimeout(() => {
      if (this.container) {
        this.container.innerHTML = ''
        this.toasts.clear()
      }
    }, 300)
  }
}

// Export singleton instance
export const toast = new ToastManager()

// Export as default for compatibility
export default toast
