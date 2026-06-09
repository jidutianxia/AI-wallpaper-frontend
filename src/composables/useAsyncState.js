import { ref } from 'vue'
import { isStaleRequestError, useCancelableRequest } from './usePagedList'

const hasOwn = (object, key) => Object.prototype.hasOwnProperty.call(object, key)

export const useAsyncState = (taskOrOptions, maybeOptions = {}) => {
  const options = taskOrOptions && typeof taskOrOptions === 'object'
    ? taskOrOptions
    : maybeOptions
  const defaultTask = taskOrOptions && typeof taskOrOptions === 'object'
    ? options.task
    : taskOrOptions

  if (defaultTask !== undefined && typeof defaultTask !== 'function') {
    throw new TypeError('useAsyncState requires a task function')
  }

  const initialData = hasOwn(options, 'initialData') ? options.initialData : null
  const state = ref('idle')
  const data = ref(initialData)
  const error = ref(null)
  const { loading, run: runCancelable, cancel: cancelRequest } = useCancelableRequest()
  let lastTask = defaultTask
  let lastArgs = []

  const execute = async (task, args) => {
    if (typeof task !== 'function') {
      throw new TypeError('useAsyncState requires a task function')
    }

    state.value = 'loading'
    error.value = null
    if (options.resetOnRun) data.value = initialData

    try {
      const result = await runCancelable(() => task(...args))
      data.value = result
      state.value = 'success'
      options.onSuccess?.(result)
      return result
    } catch (runError) {
      if (!isStaleRequestError(runError)) {
        error.value = runError
        state.value = 'error'
        options.onError?.(runError)
      }
      throw runError
    }
  }

  const run = (...args) => {
    if (typeof args[0] === 'function') {
      lastTask = args[0]
      lastArgs = args.slice(1)
    } else {
      lastTask = defaultTask
      lastArgs = args
    }

    return execute(lastTask, lastArgs)
  }

  const retry = () => execute(lastTask, lastArgs)

  const reset = () => {
    cancelRequest()
    state.value = 'idle'
    data.value = initialData
    error.value = null
  }

  const cancel = () => {
    cancelRequest()
    state.value = 'idle'
  }

  return {
    state,
    data,
    loading,
    error,
    run,
    retry,
    reset,
    cancel
  }
}
