// 自定义Toast服务
class ToastService {
  private static instance: ToastService
  private toasts: Array<{id: number, severity: string, summary?: string, detail?: string}> = []

  private constructor() {}

  static getInstance(): ToastService {
    if (!ToastService.instance) {
      ToastService.instance = new ToastService()
    }
    return ToastService.instance
  }

  add(severity: string, summary?: string, detail?: string, life?: number) {
    const id = Date.now() + Math.random()
    this.toasts.push({ id, severity, summary, detail })
    
    // 发送消息到App.vue
    window.postMessage({
      type: 'ADD_TOAST',
      severity,
      summary,
      detail
    }, '*')
    
    // 自动移除
    if (life !== undefined && life > 0) {
      setTimeout(() => {
        this.remove(id)
      }, life)
    }
  }

  remove(id: number) {
    window.postMessage({
      type: 'REMOVE_TOAST',
      id
    }, '*')
  }

  success(summary?: string, detail?: string, life?: number) {
    this.add('success', summary, detail, life || 3000)
  }

  error(summary?: string, detail?: string, life?: number) {
    this.add('error', summary, detail, life || 5000)
  }

  info(summary?: string, detail?: string, life?: number) {
    this.add('info', summary, detail, life || 3000)
  }

  warn(summary?: string, detail?: string, life?: number) {
    this.add('warn', summary, detail, life || 3000)
  }
}

export default ToastService.getInstance()