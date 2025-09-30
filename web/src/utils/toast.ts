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
      this.container.className = 'fixed top-4 right-4 z-[9999] flex flex-col gap-2 pointer-events-none'
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
    toast.className = `
      ${styles.bg} ${styles.border}
      border-l-4 rounded-lg shadow-lg p-4 min-w-[300px] max-w-md
      flex items-start gap-3
      pointer-events-auto
      transform transition-all duration-300 ease-out
      translate-x-[400px] opacity-0
    `.trim().replace(/\s+/g, ' ')

    const iconColor = type === 'success' ? 'text-green-600 dark:text-green-400' :
                      type === 'error' ? 'text-red-600 dark:text-red-400' :
                      type === 'info' ? 'text-blue-600 dark:text-blue-400' :
                      'text-yellow-600 dark:text-yellow-400'

    toast.innerHTML = `
      <div class="flex-shrink-0 w-5 h-5 flex items-center justify-center font-bold ${iconColor}">
        ${styles.icon}
      </div>
      <div class="flex-1 text-sm text-gray-800 dark:text-gray-200 break-words">
        ${this.escapeHtml(message)}
      </div>
      <button class="flex-shrink-0 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors ml-2">
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
