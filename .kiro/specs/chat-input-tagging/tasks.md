# Implementation Plan

- [ ] 1. Create core tagging interfaces and types
  - Create `src/types/tagging.ts` with TaggedItem, MentionItem, and related interfaces
  - Define message enhancement types for AI context
  - Add proper TypeScript definitions for all tagging functionality
  - _Requirements: 4.1, 4.4, 6.4_

- [ ] 2. Implement mention detection and cursor tracking utilities
  - Create `src/utils/mentionUtils.ts` with @ detection logic
  - Implement cursor position tracking for textarea
  - Add text parsing utilities for mention insertion and removal
  - Create keyboard navigation helpers for dropdown interaction
  - _Requirements: 1.1, 1.2, 5.4, 5.5_

- [ ] 3. Create MentionItem component for dropdown items
  - Build `src/components/chat/MentionItem.tsx` using shadcn Button component
  - Implement proper icons for different item types (Table, BarChart3, Layers, Eye)
  - Add section grouping and filtering logic
  - Include hover states and keyboard navigation support
  - _Requirements: 6.1, 6.3, 5.4_

- [ ] 4. Implement MentionDropdown component
  - Create `src/components/chat/MentionDropdown.tsx` using shadcn Command and Popover
  - Integrate with data stores (useDataStore, useDashboardStore) to fetch available items
  - Implement grouped sections: Tables, Current Dashboard, Current Dashboard Widgets, Other Dashboards
  - Add real-time filtering based on user input after "@"
  - Handle keyboard navigation (arrow keys, enter, escape) and mouse interaction
  - _Requirements: 1.1, 1.2, 2.1, 2.2, 3.1, 3.2, 5.1, 5.2, 5.4, 6.1_

- [ ] 5. Create TagRenderer component for displaying tags
  - Build `src/components/chat/TagRenderer.tsx` using shadcn Badge component
  - Implement different badge variants and icons for each tag type
  - Add click-to-remove functionality and backspace removal support
  - Follow existing color scheme and design patterns
  - _Requirements: 1.5, 2.5, 3.4, 4.4, 6.2, 6.4_

- [ ] 6. Implement TaggingInputArea component
  - Create `src/components/chat/TaggingInputArea.tsx` as wrapper around existing InputArea
  - Integrate mention detection, dropdown display, and tag management
  - Handle @ symbol detection and cursor position tracking
  - Implement tag insertion at cursor position and tag removal logic
  - Maintain existing InputArea functionality and props compatibility
  - _Requirements: 1.1, 1.3, 1.4, 2.3, 2.4, 3.3, 4.1, 4.2_

- [ ] 7. Add data transformation utilities
  - Create `src/utils/tagDataUtils.ts` for transforming store data to MentionItem format
  - Implement functions to extract complete data for tables, dashboards, widgets, and views
  - Add message formatting utilities for AI context inclusion
  - Handle edge cases like empty states and missing data
  - _Requirements: 1.4, 2.3, 2.4, 3.3, 3.5_

- [ ] 8. Enhance message sending with tagged content
  - Update message sending logic to include tagged item data
  - Format messages with proper context for AI processing
  - Ensure tagged content is properly serialized and transmitted
  - Maintain backward compatibility with existing message format
  - _Requirements: 1.4, 2.3, 2.4, 3.3, 3.5, 4.3_

- [ ] 9. Integrate TaggingInputArea into ChatInterface
  - Replace existing InputArea usage with TaggingInputArea in ChatInterface component
  - Pass currentDashboard prop from HomePage to enable current dashboard tagging
  - Update message handling to process tagged content
  - Ensure existing chat functionality remains intact
  - _Requirements: 4.1, 4.2, 4.3_

- [ ] 10. Add keyboard navigation and accessibility features
  - Implement full keyboard support for dropdown navigation (arrow keys, enter, escape)
  - Add proper ARIA labels and roles for screen reader support
  - Implement auto-selection when user types complete item name
  - Add focus management and keyboard shortcuts
  - _Requirements: 5.4, 5.5, 6.5_

- [ ] 11. Implement performance optimizations
  - Add React.memo and useMemo for expensive computations
  - Implement debounced filtering for dropdown search
  - Add virtual scrolling for large item lists if needed
  - Optimize re-renders and memory usage
  - _Requirements: 5.1, 5.2, 5.3_

- [ ] 12. Add error handling and fallback support
  - Create error boundary for tagging functionality
  - Implement graceful fallback to original InputArea on errors
  - Add proper error messages and user feedback
  - Handle edge cases like store loading failures
  - _Requirements: 4.1, 4.2_

- [ ] 13. Style and polish the UI components
  - Ensure all components follow existing design system and color scheme
  - Add smooth animations and transitions for dropdown and tags
  - Implement responsive design for different screen sizes
  - Add loading states and visual feedback
  - _Requirements: 6.1, 6.2, 6.4, 6.5_

- [ ] 14. Add comprehensive testing
  - Write unit tests for all tagging components and utilities
  - Test integration with data stores and message sending
  - Add keyboard navigation and accessibility tests
  - Test performance with large datasets
  - _Requirements: 4.1, 4.2, 4.3, 5.1, 5.2, 5.3_