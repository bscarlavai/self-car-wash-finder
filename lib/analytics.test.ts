import { trackGAEvent } from './analytics'

// Mock window and gtag function
const mockGtag = jest.fn()
Object.defineProperty(global, 'window', {
  value: {
    gtag: mockGtag
  },
  writable: true
})

describe('Analytics', () => {
  beforeEach(() => {
    mockGtag.mockClear()
  })

  describe('trackGAEvent', () => {
    it('should call gtag with correct parameters', () => {
      trackGAEvent('button_click', 'cafe_actions', 'Get Directions - Test Cafe', 1, {
        button_type: 'get_directions',
        cafe_name: 'Test Cafe'
      })

      expect(mockGtag).toHaveBeenCalledWith('event', 'button_click', {
        event_category: 'cafe_actions',
        event_label: 'Get Directions - Test Cafe',
        value: 1,
        button_type: 'get_directions',
        cafe_name: 'Test Cafe'
      })
    })

    it('should handle missing optional parameters', () => {
      trackGAEvent('button_click', 'cafe_actions')

      expect(mockGtag).toHaveBeenCalledWith('event', 'button_click', {
        event_category: 'cafe_actions',
        event_label: undefined,
        value: undefined
      })
    })
  })
}) 