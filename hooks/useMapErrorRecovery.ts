import { useState, useCallback, useEffect } from 'react';

interface MapErrorState {
  hasError: boolean;
  error: Error | null;
  errorCount: number;
  lastErrorTime: number | null;
  isRecovering: boolean;
}

interface UseMapErrorRecoveryOptions {
  maxRetries?: number;
  retryDelay?: number;
  onError?: (error: Error) => void;
  onRecovery?: () => void;
  enableAutoRecovery?: boolean;
}

export function useMapErrorRecovery(options: UseMapErrorRecoveryOptions = {}) {
  const {
    maxRetries = 3,
    retryDelay = 1000,
    onError,
    onRecovery,
    enableAutoRecovery = true
  } = options;

  const [errorState, setErrorState] = useState<MapErrorState>({
    hasError: false,
    error: null,
    errorCount: 0,
    lastErrorTime: null,
    isRecovering: false
  });

  const handleMapError = useCallback((error: Error) => {
    console.error('Map error caught:', error);
    
    setErrorState(prev => ({
      ...prev,
      hasError: true,
      error,
      errorCount: prev.errorCount + 1,
      lastErrorTime: Date.now()
    }));

    onError?.(error);

    // Auto-recovery logic
    if (enableAutoRecovery && errorState.errorCount < maxRetries) {
      setTimeout(() => {
        recoverFromError();
      }, retryDelay * Math.pow(2, errorState.errorCount)); // Exponential backoff
    }
  }, [errorState.errorCount, maxRetries, retryDelay, enableAutoRecovery, onError]);

  const recoverFromError = useCallback(() => {
    setErrorState(prev => ({
      ...prev,
      isRecovering: true
    }));

    // Attempt recovery
    setTimeout(() => {
      setErrorState(prev => ({
        ...prev,
        hasError: false,
        error: null,
        isRecovering: false
      }));
      
      onRecovery?.();
    }, 500);
  }, [onRecovery]);

  const resetError = useCallback(() => {
    setErrorState({
      hasError: false,
      error: null,
      errorCount: 0,
      lastErrorTime: null,
      isRecovering: false
    });
  }, []);

  // Clear error count after successful period
  useEffect(() => {
    if (!errorState.hasError && errorState.lastErrorTime) {
      const clearTimer = setTimeout(() => {
        setErrorState(prev => ({
          ...prev,
          errorCount: 0,
          lastErrorTime: null
        }));
      }, 60000); // Reset after 1 minute of success

      return () => clearTimeout(clearTimer);
    }
  }, [errorState.hasError, errorState.lastErrorTime]);

  return {
    ...errorState,
    handleMapError,
    recoverFromError,
    resetError,
    canRetry: errorState.errorCount < maxRetries
  };
}