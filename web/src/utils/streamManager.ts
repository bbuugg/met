/**
 * Stream Manager Utility
 * Handles robust video stream assignment with error handling and retry logic
 */

import { videoLogger } from './videoLogger'

export interface StreamAssignmentOptions {
  maxRetries?: number
  retryDelay?: number
  timeout?: number
  enableLogging?: boolean
}

export interface StreamAssignmentResult {
  success: boolean
  error?: Error
  retryCount: number
  duration: number
}

export class StreamManager {
  private static readonly DEFAULT_OPTIONS: Required<StreamAssignmentOptions> = {
    maxRetries: 3,
    retryDelay: 1000,
    timeout: 5000,
    enableLogging: true
  }

  // @ts-ignore
  private retryTimeouts = new Map<string, NodeJS.Timeout>()
  private assignmentPromises = new Map<string, Promise<StreamAssignmentResult>>()

  /**
   * Assigns a MediaStream to a video element with robust error handling
   */
  async assignStreamToElement(
    element: HTMLVideoElement,
    stream: MediaStream,
    participantId: string,
    options: StreamAssignmentOptions = {}
  ): Promise<StreamAssignmentResult> {
    const opts = { ...StreamManager.DEFAULT_OPTIONS, ...options }
    const startTime = Date.now()
    
    // Cancel any existing assignment for this participant
    this.cancelAssignment(participantId)
    
    // Create assignment promise
    const assignmentPromise = this.performAssignment(element, stream, participantId, opts, startTime)
    this.assignmentPromises.set(participantId, assignmentPromise)
    
    try {
      const result = await assignmentPromise
      this.assignmentPromises.delete(participantId)
      return result
    } catch (error) {
      this.assignmentPromises.delete(participantId)
      throw error
    }
  }

  /**
   * Performs the actual stream assignment with retry logic
   */
  private async performAssignment(
    element: HTMLVideoElement,
    stream: MediaStream,
    participantId: string,
    options: Required<StreamAssignmentOptions>,
    startTime: number,
    retryCount = 0
  ): Promise<StreamAssignmentResult> {
    try {
      videoLogger.debug('STREAM_MANAGER', `Assigning stream to ${participantId} (attempt ${retryCount + 1})`, {
        streamId: stream.id,
        streamActive: stream.active,
        elementConnected: element.isConnected,
        timeout: options.timeout
      }, participantId)

      // Validate inputs
      if (!element || !stream) {
        throw new Error('Invalid element or stream provided')
      }

      // Check if element is still in DOM
      if (!element.isConnected) {
        throw new Error('Video element is not connected to DOM')
      }

      // Log stream and element state before assignment
      videoLogger.debug('STREAM_MANAGER', `Pre-assignment state for ${participantId}`, {
        streamInfo: this.getStreamInfo(stream),
        elementState: {
          readyState: element.readyState,
          networkState: element.networkState,
          currentSrc: element.currentSrc,
          srcObject: element.srcObject ? 'present' : 'null'
        }
      }, participantId)

      // Assign stream with timeout
      await this.assignWithTimeout(element, stream, options.timeout)

      const duration = Date.now() - startTime
      
      videoLogger.info('STREAM_MANAGER', `Successfully assigned stream to ${participantId}`, {
        duration: `${duration}ms`,
        retryCount,
        finalElementState: {
          readyState: element.readyState,
          videoWidth: element.videoWidth,
          videoHeight: element.videoHeight
        }
      }, participantId)

      return {
        success: true,
        retryCount,
        duration
      }

    } catch (error) {
      const currentError = error instanceof Error ? error : new Error(String(error))
      
      videoLogger.warn('STREAM_MANAGER', `Assignment failed for ${participantId}`, {
        error: currentError.message,
        retryCount,
        maxRetries: options.maxRetries,
        willRetry: retryCount < options.maxRetries
      }, participantId)

      // Check if we should retry
      if (retryCount < options.maxRetries) {
        const retryDelay = options.retryDelay * Math.pow(2, retryCount) // Exponential backoff
        
        videoLogger.info('STREAM_MANAGER', `Retrying assignment for ${participantId}`, {
          nextAttempt: retryCount + 2,
          retryDelay: `${retryDelay}ms`,
          totalAttempts: options.maxRetries + 1
        }, participantId)

        // Wait before retry
        await this.delay(retryDelay)

        // Retry assignment
        return this.performAssignment(element, stream, participantId, options, startTime, retryCount + 1)
      }

      // Max retries reached
      const duration = Date.now() - startTime
      
      videoLogger.error('STREAM_MANAGER', `Max retries reached for ${participantId}`, {
        totalDuration: `${duration}ms`,
        totalAttempts: retryCount + 1,
        finalError: currentError.message
      }, participantId)

      return {
        success: false,
        error: currentError,
        retryCount,
        duration
      }
    }
  }

  /**
   * Assigns stream to element with timeout protection
   */
  private async assignWithTimeout(
    element: HTMLVideoElement,
    stream: MediaStream,
    timeout: number
  ): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        cleanup()
        reject(new Error(`Stream assignment timeout after ${timeout}ms`))
      }, timeout)

      let resolved = false

      const cleanup = () => {
        if (resolved) return
        resolved = true
        clearTimeout(timeoutId)
        element.removeEventListener('loadedmetadata', onLoadedMetadata)
        element.removeEventListener('error', onError)
        element.removeEventListener('loadstart', onLoadStart)
      }

      const onLoadedMetadata = () => {
        cleanup()
        resolve()
      }

      const onError = (event: Event) => {
        cleanup()
        const errorMsg = event instanceof ErrorEvent ? event.message : 'Video load error'
        reject(new Error(errorMsg))
      }

      const onLoadStart = () => {
        // Stream assignment started successfully
      }

      // Add event listeners
      element.addEventListener('loadedmetadata', onLoadedMetadata, { once: true })
      element.addEventListener('error', onError, { once: true })
      element.addEventListener('loadstart', onLoadStart, { once: true })

      try {
        // Assign the stream
        element.srcObject = stream
      } catch (error) {
        cleanup()
        reject(error)
      }
    })
  }

  /**
   * Cancels any ongoing assignment for a participant
   */
  cancelAssignment(participantId: string): void {
    // Cancel retry timeout
    const timeout = this.retryTimeouts.get(participantId)
    if (timeout) {
      clearTimeout(timeout)
      this.retryTimeouts.delete(participantId)
    }

    // Note: We can't cancel the promise itself, but we can ignore its result
    if (this.assignmentPromises.has(participantId)) {
      console.log(`[StreamManager] Cancelling assignment for ${participantId}`)
    }
  }

  /**
   * Cleans up a video element
   */
  cleanupElement(element: HTMLVideoElement, participantId?: string): void {
    try {
      if (participantId) {
        videoLogger.debug('STREAM_MANAGER', `Starting cleanup for ${participantId}`, {
          elementConnected: element.isConnected,
          hasSrcObject: !!element.srcObject
        }, participantId)
        
        this.cancelAssignment(participantId)
      }

      // Log current stream info before cleanup
      if (element.srcObject instanceof MediaStream) {
        const stream = element.srcObject
        videoLogger.debug('STREAM_MANAGER', `Cleaning up stream for ${participantId || 'unknown'}`, {
          streamInfo: this.getStreamInfo(stream),
          trackCount: stream.getTracks().length
        }, participantId)
        
        // Don't stop tracks that might be used elsewhere
        // Just log the tracks for debugging
        stream.getTracks().forEach(track => {
          videoLogger.debug('STREAM_MANAGER', `Track in cleanup: ${track.kind}`, {
            trackId: track.id,
            enabled: track.enabled,
            readyState: track.readyState
          }, participantId)
        })
      }

      // Clear the source
      element.srcObject = null
      element.load() // Reset the element

      videoLogger.info('STREAM_MANAGER', `Cleaned up element for ${participantId || 'unknown'}`, {
        elementReset: true
      }, participantId)
      
    } catch (error) {
      videoLogger.error('STREAM_MANAGER', `Error during cleanup for ${participantId || 'unknown'}`, error, participantId)
    }
  }

  /**
   * Validates if a stream is active and has tracks
   */
  validateStream(stream: MediaStream): boolean {
    if (!stream) return false
    
    const tracks = stream.getTracks()
    if (tracks.length === 0) return false
    
    // Check if at least one track is active
    return tracks.some(track => track.readyState === 'live')
  }

  /**
   * Gets stream information for debugging
   */
  getStreamInfo(stream: MediaStream): object {
    if (!stream) return { error: 'No stream provided' }
    
    const tracks = stream.getTracks()
    return {
      id: stream.id,
      active: stream.active,
      trackCount: tracks.length,
      tracks: tracks.map(track => ({
        kind: track.kind,
        id: track.id,
        enabled: track.enabled,
        readyState: track.readyState,
        muted: track.muted
      }))
    }
  }

  /**
   * Utility method for delays
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  /**
   * Cleanup all resources
   */
  destroy(): void {
    // Cancel all timeouts
    this.retryTimeouts.forEach(timeout => clearTimeout(timeout))
    this.retryTimeouts.clear()
    
    // Clear assignment promises
    this.assignmentPromises.clear()
    
    console.log('[StreamManager] Destroyed')
  }
}

// Export singleton instance
export const streamManager = new StreamManager()