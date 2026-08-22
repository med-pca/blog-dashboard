import '@testing-library/jest-dom/vitest'
import { afterEach, vi } from 'vitest'
import { cleanup } from '@testing-library/react'

// Unmount between tests so a page that keeps polling cannot leak into the next.
afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
})
