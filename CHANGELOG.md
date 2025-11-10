# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased]

### Added - Real-time Events and Persistent Ready State

#### Real-time Event System
- **New Socket.IO Events**: Enhanced real-time communication with additional events:
  - `table:player_joined` - Emitted when a player joins the table
  - `table:player_left` - Emitted when a player leaves the table
  - `table:ready_toggled` - Emitted when a player toggles their ready state
  - `table:hand_started` - Emitted when a new hand begins (includes timestamp and dealerIndex)
  - `table:hand_ended` - Emitted when a hand completes (includes timestamp)
  
- **Instant Updates**: All table changes now appear on all connected clients within 300ms without requiring manual refresh
- **Event Logging**: Client-side logging of real-time events for debugging and monitoring

#### Persistent Ready State
- **Stay Ready Across Hands**: Players who click "Ready" remain ready across consecutive hands
- **Toggle Functionality**: Ready button is now a toggle - click once to ready up, click again to unready
- **Smart Ready Management**: 
  - Ready state persists across hands while seated
  - Ready state only resets when a player leaves the table or disconnects
  - Server is the source of truth for all ready states
  
#### Auto-start Next Hand
- **Seamless Hand Progression**: After a hand completes, if all seated players remain ready, the next hand starts automatically after a brief delay
- **2-Player Fold Fix**: When one player folds in a 2-player hand, the winner is awarded the pot and the next hand starts automatically (if both players are ready)
- **Configurable Delays**: 
  - 5 seconds after hand completion for winner display
  - 1 second delay before next hand starts when all players are ready

#### Enhanced Game Flow
- **State Machine Improvements**: Proper hand completion flow:
  1. Hand ends (fold or showdown)
  2. Winner(s) determined and awarded pot
  3. Winner display (5 seconds)
  4. Check if all players ready
  5. Auto-start next hand if ready (1 second delay)
  
### Changed
- Ready button now shows "Ready ✓" when active and can be toggled on/off
- Removed automatic ready state reset after hand completion
- Enhanced UI to maintain ready state visibility across hands

### Technical Details
- **Backend (server.js)**:
  - Added `togglePlayerReady()` method to PokerGame class
  - Removed `resetReadyStates()` call after hand completion
  - Added real-time event emissions for all table state changes
  - Implemented auto-start logic with ready state checking
  
- **Backend (pokerGame.js)**:
  - Enhanced `setPlayerReady()` to accept ready parameter
  - Added `togglePlayerReady()` method
  - Modified `removePlayer()` to reset ready state on player departure
  
- **Frontend (app.js)**:
  - Updated ready button click handler to use toggle functionality
  - Removed ready state reset UI logic after hand completion
  - Enhanced `updateReadinessUI()` to handle toggle states
  - Added listeners for new real-time events

### Tests
- Added comprehensive test suite in `test/persistentReady.test.js`:
  - Test 1: Ready state persistence across hands
  - Test 2: Auto-start next hand when all players remain ready
  - Test 3: Toggle ready state on/off
  - Test 4: Ready state resets when player leaves
  - Test 5: Multiple consecutive hands with persistent ready
  
- All existing tests continue to pass with no regressions

## [1.0.0] - Previous Release

### Initial Features
- Real-time multiplayer Texas Hold'em poker
- 2 tables (Community and Private)
- Complete betting system with blinds
- Hand evaluation for all poker hands
- Side pot support
- Beautiful poker table UI with animations
