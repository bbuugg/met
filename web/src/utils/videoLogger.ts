/**
 * Video Logger Utility
 * Comprehensive logging system for video stream debugging and performance monitoring
 */

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3
}

export interface VideoLogEntry {
  timestamp: number
  level: LogLevel
  category: string
  participantId?: string
  message: string
  data?: any
  duration?: number
  stackTrace?: string
}

export interface PerformanceMetrics {
  streamAssignmentTime: number
  videoLoadTime: number
  retryCount: number
  errorCount: number
  successRate: number
}

export class VideoLogger {
  private logs: VideoLogEntry[] = []
  private maxLogs = 1000
  private currentLogLevel = LogLevel.DEBUG
  private performanceMetrics = new Map<string, PerformanceMetrics>()
  private startTimes = new Map<string, number>()

  constructor(logLevel: LogLevel = LogLevel.DEBUG) {
    this.currentLogLevel = logLevel
    this.setupGlobalErrorHandling()
  }

  /**
   * Set the minimum log level
   */
  setLogLevel(level: LogLevel): void {
    this.currentLogLevel = level
  }

  /**
   * Log debug information
   */
  debug(category: string, message: string, data?: any, participantId?: string): void {
    this.log(LogLevel.DEBUG, category, message, data, participantId)
  }

  /**
   * Log general information
   */
  info(category: string, message: string, data?: any, participantId?: string): void {
    this.log(LogLevel.INFO, category, message, data, participantId)
  }

  /**
   * Log warnings
   */
  warn(category: string, message: string, data?: any, participantId?: string): void {
    this.log(LogLevel.WARN, category, message, data, participantId)
  }

  /**
   * Log errors
   */
  error(category: string, message: string, error?: Error | any, participantId?: string): void {
    const stackTrace = error instanceof Error ? error.stack : undefined
    this.log(LogLevel.ERROR, category, message, error, participantId, stackTrace)
  }

  /**
   * Start performance timing
   */
  startTiming(key: string): void {
    this.startTimes.set(key, performance.now())
  }

  /**
   * End performance timing and log result
   */
  endTiming(key: string, category: string, message: string, participantId?: string): number {
    const startTime = this.startTimes.get(key)
    if (!startTime) {
      this.warn('TIMING', `No start time found for key: ${key}`)
      return 0
    }

    const duration = performance.now() - startTime
    this.startTimes.delete(key)

    this.log(LogLevel.INFO, category, message, { duration: `${duration.toFixed(2)}ms` }, participantId, undefined, duration)
    return duration
  }

  /**
   * Log stream information
   */
  logStreamInfo(participantId: string, stream: MediaStream, action: string): void {
    const streamInfo = {
      streamId: stream.id,
      active: stream.active,
      tracks: stream.getTracks().map(track => ({
        kind: track.kind,
        id: track.id,
        enabled: track.enabled,
        readyState: track.readyState,
        muted: track.muted,
        settings: track.kind === 'video' ? this.getVideoTrackSettings(track as MediaStreamTrack) : undefined
      }))
    }

    this.info('STREAM', `${action} for ${participantId}`, streamInfo, participantId)
  }

  /**
   * Log video element state
   */
  logVideoElementState(participantId: string, element: HTMLVideoElement, action: string): void {
    const elementInfo = {
      readyState: element.readyState,
      networkState: element.networkState,
      currentTime: element.currentTime,
      duration: element.duration,
      paused: element.paused,
      muted: element.muted,
      volume: element.volume,
      videoWidth: element.videoWidth,
      videoHeight: element.videoHeight,
      srcObject: element.srcObject ? 'MediaStream' : 'null'
    }

    this.debug('VIDEO_ELEMENT', `${action} for ${participantId}`, elementInfo, participantId)
  }

  /**
   * Log WebRTC connection state
   */
  logConnectionState(participantId: string, connection: RTCPeerConnection): void {
    const connectionInfo = {
      connectionState: connection.connectionState,
      iceConnectionState: connection.iceConnectionState,
      iceGatheringState: connection.iceGatheringState,
      signalingState: connection.signalingState,
      localDescription: connection.localDescription?.type || 'none',
      remoteDescription: connection.remoteDescription?.type || 'none'
    }

    this.info('WEBRTC', `Connection state for ${participantId}`, connectionInfo, participantId)
  }

  /**
   * Update performance metrics
   */
  updateMetrics(participantId: string, metrics: Partial<PerformanceMetrics>): void {
    const existing = this.performanceMetrics.get(participantId) || {
      streamAssignmentTime: 0,
      videoLoadTime: 0,
      retryCount: 0,
      errorCount: 0,
      successRate: 0
    }

    const updated = { ...existing, ...metrics }
    this.performanceMetrics.set(participantId, updated)

    this.debug('METRICS', `Updated metrics for ${participantId}`, updated, participantId)
  }

  /**
   * Get performance metrics for a participant
   */
  getMetrics(participantId: string): PerformanceMetrics | undefined {
    return this.performanceMetrics.get(participantId)
  }

  /**
   * Get all performance metrics
   */
  getAllMetrics(): Map<string, PerformanceMetrics> {
    return new Map(this.performanceMetrics)
  }

  /**
   * Export logs for debugging
   */
  exportLogs(filterLevel?: LogLevel, filterCategory?: string): VideoLogEntry[] {
    let filtered = this.logs

    if (filterLevel !== undefined) {
      filtered = filtered.filter(log => log.level >= filterLevel)
    }

    if (filterCategory) {
      filtered = filtered.filter(log => log.category === filterCategory)
    }

    return filtered.map(log => ({ ...log })) // Return copies
  }

  /**
   * Export logs as JSON string
   */
  exportLogsAsJSON(filterLevel?: LogLevel, filterCategory?: string): string {
    const logs = this.exportLogs(filterLevel, filterCategory)
    return JSON.stringify(logs, null, 2)
  }

  /**
   * Clear all logs
   */
  clearLogs(): void {
    this.logs = []
    this.performanceMetrics.clear()
    this.startTimes.clear()
    this.info('LOGGER', 'Logs cleared')
  }

  /**
   * Get summary statistics
   */
  getSummary(): object {
    const totalLogs = this.logs.length
    const errorLogs = this.logs.filter(log => log.level === LogLevel.ERROR).length
    const warnLogs = this.logs.filter(log => log.level === LogLevel.WARN).length
    
    const categories = new Set(this.logs.map(log => log.category))
    const participants = new Set(this.logs.filter(log => log.participantId).map(log => log.participantId))

    const avgMetrics = this.calculateAverageMetrics()

    return {
      totalLogs,
      errorLogs,
      warnLogs,
      errorRate: totalLogs > 0 ? (errorLogs / totalLogs * 100).toFixed(2) + '%' : '0%',
      categories: Array.from(categories),
      participantCount: participants.size,
      averageMetrics: avgMetrics,
      timeRange: this.logs.length > 0 ? {
        start: new Date(this.logs[0].timestamp).toISOString(),
        end: new Date(this.logs[this.logs.length - 1].timestamp).toISOString()
      } : null
    }
  }

  /**
   * Private method to add log entry
   */
  private log(
    level: LogLevel, 
    category: string, 
    message: string, 
    data?: any, 
    participantId?: string, 
    stackTrace?: string,
    duration?: number
  ): void {
    if (level < this.currentLogLevel) {
      return
    }

    const entry: VideoLogEntry = {
      timestamp: Date.now(),
      level,
      category,
      message,
      participantId,
      data,
      stackTrace,
      duration
    }

    this.logs.push(entry)

    // Maintain max logs limit
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs)
    }

    // Console output with formatting
    this.outputToConsole(entry)
  }

  /**
   * Output formatted log to console
   */
  private outputToConsole(entry: VideoLogEntry): void {
    const timestamp = new Date(entry.timestamp).toISOString().substr(11, 12)
    const levelStr = LogLevel[entry.level].padEnd(5)
    const participantStr = entry.participantId ? `[${entry.participantId.slice(0, 8)}]` : '[GLOBAL]'
    const categoryStr = `[${entry.category}]`
    
    const prefix = `${timestamp} ${levelStr} ${participantStr} ${categoryStr}`
    const message = `${prefix} ${entry.message}`

    switch (entry.level) {
      case LogLevel.DEBUG:
        console.debug(message, entry.data || '')
        break
      case LogLevel.INFO:
        console.info(message, entry.data || '')
        break
      case LogLevel.WARN:
        console.warn(message, entry.data || '')
        break
      case LogLevel.ERROR:
        console.error(message, entry.data || '', entry.stackTrace || '')
        break
    }
  }

  /**
   * Get video track settings
   */
  private getVideoTrackSettings(track: MediaStreamTrack): any {
    try {
      return track.getSettings ? track.getSettings() : {}
    } catch {
      return {}
    }
  }

  /**
   * Calculate average metrics across all participants
   */
  private calculateAverageMetrics(): PerformanceMetrics | null {
    const metrics = Array.from(this.performanceMetrics.values())
    if (metrics.length === 0) return null

    return {
      streamAssignmentTime: metrics.reduce((sum, m) => sum + m.streamAssignmentTime, 0) / metrics.length,
      videoLoadTime: metrics.reduce((sum, m) => sum + m.videoLoadTime, 0) / metrics.length,
      retryCount: metrics.reduce((sum, m) => sum + m.retryCount, 0) / metrics.length,
      errorCount: metrics.reduce((sum, m) => sum + m.errorCount, 0) / metrics.length,
      successRate: metrics.reduce((sum, m) => sum + m.successRate, 0) / metrics.length
    }
  }

  /**
   * Setup global error handling for unhandled video errors
   */
  private setupGlobalErrorHandling(): void {
    // Capture unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      if (event.reason && event.reason.toString().includes('video')) {
        this.error('GLOBAL', 'Unhandled video-related promise rejection', event.reason)
      }
    })

    // Capture global errors
    window.addEventListener('error', (event) => {
      if (event.message && event.message.toLowerCase().includes('video')) {
        this.error('GLOBAL', 'Global video-related error', {
          message: event.message,
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno
        })
      }
    })
  }
}

// Export singleton instance
export const videoLogger = new VideoLogger(LogLevel.DEBUG)

// Export utility functions
export function logVideoEvent(category: string, message: string, data?: any, participantId?: string): void {
  videoLogger.info(category, message, data, participantId)
}

export function logVideoError(category: string, message: string, error?: Error, participantId?: string): void {
  videoLogger.error(category, message, error, participantId)
}

export function startVideoTiming(key: string): void {
  videoLogger.startTiming(key)
}

export function endVideoTiming(key: string, category: string, message: string, participantId?: string): number {
  return videoLogger.endTiming(key, category, message, participantId)
}