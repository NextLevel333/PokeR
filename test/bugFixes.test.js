const { PokerGame, PLAYER_ACTIONS } = require('../game/pokerGame');

console.log('\n=== Bug Fix Tests ===\n');

// Test 1: Check action should not skip players
console.log('=== Test 1: Check Action Progression ===');
const game1 = new PokerGame('test', 10);
const p1 = game1.addPlayer('player1', 'Alice', 'avatar1');
const p2 = game1.addPlayer('player2', 'Bob', 'avatar2');
const p3 = game1.addPlayer('player3', 'Charlie', 'avatar3');

// Start a new hand
game1.startNewHand();

// Get to a state where everyone can check
// Skip the blinds by simulating pre-flop action to flop
// First, everyone needs to match the big blind
const bigBlindIndex = (game1.dealerIndex + 2) % game1.players.length;
const firstToActIndex = (game1.dealerIndex + 3) % game1.players.length;

// Note the current player before any actions
const initialCurrentIndex = game1.currentPlayerIndex;
const initialCurrentPlayer = game1.players[initialCurrentIndex];

console.log(`Initial state:`);
console.log(`  Current player index: ${game1.currentPlayerIndex}`);
console.log(`  Current player ID: ${initialCurrentPlayer.id}`);
console.log(`  Current bet: ${game1.currentBet}`);
console.log(`  Player bets: ${game1.players.map(p => `${p.name}:$${p.bet}`).join(', ')}`);

// Players call to match the big blind
let callCount = 0;
const playersNeedingToCall = game1.players.filter((p, idx) => {
  return idx !== (game1.dealerIndex + 1) % game1.players.length && 
         idx !== bigBlindIndex;
});

// Call for first player (after big blind)
if (game1.players[game1.currentPlayerIndex].bet < game1.currentBet) {
  const result1 = game1.handlePlayerAction(game1.players[game1.currentPlayerIndex].id, PLAYER_ACTIONS.CALL);
  console.log(`\n${game1.players[initialCurrentIndex].name} calls`);
  console.log(`  Result: ${result1.success ? 'success' : 'failed'}`);
  console.log(`  Next player index: ${game1.currentPlayerIndex}`);
  callCount++;
}

// Small blind calls to match
const sbIndex = (game1.dealerIndex + 1) % game1.players.length;
if (game1.players[game1.currentPlayerIndex].bet < game1.currentBet && game1.currentPlayerIndex === sbIndex) {
  const result2 = game1.handlePlayerAction(game1.players[game1.currentPlayerIndex].id, PLAYER_ACTIONS.CALL);
  console.log(`\nSmall blind calls`);
  console.log(`  Result: ${result2.success ? 'success' : 'failed'}`);
  console.log(`  Next player index: ${game1.currentPlayerIndex}`);
  callCount++;
}

// Big blind checks
if (game1.players[game1.currentPlayerIndex].bet === game1.currentBet) {
  const result3 = game1.handlePlayerAction(game1.players[game1.currentPlayerIndex].id, PLAYER_ACTIONS.CHECK);
  console.log(`\nBig blind checks`);
  console.log(`  Result: ${result3.success ? 'success' : 'failed'}`);
  console.log(`  Hand complete: ${result3.handComplete}`);
  console.log(`  Betting round: ${game1.bettingRound}`);
}

// Now we should be on the flop
console.log(`\n--- After Pre-Flop ---`);
console.log(`  Betting round: ${game1.bettingRound}`);
console.log(`  Current bet: ${game1.currentBet}`);
console.log(`  Community cards: ${game1.communityCards.length}`);
console.log(`  Current player index: ${game1.currentPlayerIndex}`);

// Reset hasActed flags for fresh testing
game1.players.forEach(p => p.hasActed = false);

// Now test the check scenario where player 1 checks
const currentPlayerBeforeCheck = game1.players[game1.currentPlayerIndex];
console.log(`\n--- Testing Check Progression ---`);
console.log(`Current player before check: ${currentPlayerBeforeCheck.name} (ID: ${currentPlayerBeforeCheck.id})`);

const checkResult = game1.handlePlayerAction(currentPlayerBeforeCheck.id, PLAYER_ACTIONS.CHECK);
console.log(`Check result: ${checkResult.success ? 'success' : 'failed'}`);

const nextPlayerAfterCheck = game1.players[game1.currentPlayerIndex];
console.log(`Next player after check: ${nextPlayerAfterCheck.name} (ID: ${nextPlayerAfterCheck.id})`);
console.log(`Did the turn advance? ${currentPlayerBeforeCheck.id !== nextPlayerAfterCheck.id ? 'YES ✓' : 'NO ✗'}`);
console.log(`Did betting round complete prematurely? ${checkResult.handComplete || game1.bettingRound !== 'flop' ? 'YES ✗' : 'NO ✓'}`);

if (currentPlayerBeforeCheck.id !== nextPlayerAfterCheck.id && !checkResult.handComplete) {
  console.log('\n✓ Test 1 PASSED - Check correctly advanced to next player');
} else {
  console.log('\n✗ Test 1 FAILED - Check did not properly advance turn');
}

// Test 2: Verify all players must act before round completes
console.log('\n=== Test 2: All Players Must Act ===');
const game2 = new PokerGame('test', 10);
const p4 = game2.addPlayer('player4', 'Dave', 'avatar1');
const p5 = game2.addPlayer('player5', 'Eve', 'avatar2');
const p6 = game2.addPlayer('player6', 'Frank', 'avatar3');

game2.startNewHand();

// Manually set to flop state for easier testing
game2.bettingRound = 'flop';
game2.currentBet = 0;
game2.players.forEach(p => {
  p.bet = 0;
  p.hasActed = false;
});

console.log(`Starting flop with 3 players`);
console.log(`Current player: ${game2.players[game2.currentPlayerIndex].name}`);

// First player checks
const firstPlayer = game2.players[game2.currentPlayerIndex];
game2.handlePlayerAction(firstPlayer.id, PLAYER_ACTIONS.CHECK);
console.log(`\n${firstPlayer.name} checks`);
console.log(`  hasActed: ${firstPlayer.hasActed}`);
console.log(`  Betting round complete? ${game2.isBettingRoundComplete() ? 'YES ✗' : 'NO ✓'}`);

// Second player checks
const secondPlayer = game2.players[game2.currentPlayerIndex];
game2.handlePlayerAction(secondPlayer.id, PLAYER_ACTIONS.CHECK);
console.log(`\n${secondPlayer.name} checks`);
console.log(`  hasActed: ${secondPlayer.hasActed}`);
console.log(`  Betting round complete? ${game2.isBettingRoundComplete() ? 'YES ✗' : 'NO ✓'}`);

// Third player checks - now round should complete
const thirdPlayer = game2.players[game2.currentPlayerIndex];
const thirdPlayerName = thirdPlayer.name;
const finalCheckResult = game2.handlePlayerAction(thirdPlayer.id, PLAYER_ACTIONS.CHECK);
console.log(`\n${thirdPlayerName} checks`);
console.log(`  Result success: ${finalCheckResult.success}`);
console.log(`  Advanced to next round? ${finalCheckResult.success && game2.bettingRound !== 'flop' ? 'YES ✓' : 'NO ✗'}`);
console.log(`  New betting round: ${game2.bettingRound}`);

// After advancing, hasActed should be reset for all players
const hasActedResetForNewRound = game2.players.filter(p => !p.folded && !p.allIn).every(p => !p.hasActed);
console.log(`  hasActed reset for new round? ${hasActedResetForNewRound ? 'YES ✓' : 'NO ✗'}`);

if (finalCheckResult.success && game2.bettingRound !== 'flop' && hasActedResetForNewRound) {
  console.log('\n✓ Test 2 PASSED - All players acted before round completed');
} else {
  console.log('\n✗ Test 2 FAILED - Round did not advance properly');
}

// Test 3: Active player ID tracking
console.log('\n=== Test 3: Active Player ID Tracking ===');
const game3 = new PokerGame('test', 10);
const p7 = game3.addPlayer('player7', 'George', 'avatar1');
const p8 = game3.addPlayer('player8', 'Helen', 'avatar2');
const p9 = game3.addPlayer('player9', 'Ivan', 'avatar3');

game3.startNewHand();

const gameState = game3.getGameState();
console.log(`Game state includes currentPlayerId? ${gameState.currentPlayerId ? 'YES ✓' : 'NO ✗'}`);
console.log(`  currentPlayerId: ${gameState.currentPlayerId}`);
console.log(`  currentPlayerIndex: ${gameState.currentPlayerIndex}`);
console.log(`  Player at index ${gameState.currentPlayerIndex}: ${game3.players[gameState.currentPlayerIndex].id}`);

const idsMatch = gameState.currentPlayerId === game3.players[gameState.currentPlayerIndex].id;
console.log(`  IDs match? ${idsMatch ? 'YES ✓' : 'NO ✗'}`);

if (gameState.currentPlayerId && idsMatch) {
  console.log('\n✓ Test 3 PASSED - Game state correctly includes currentPlayerId');
} else {
  console.log('\n✗ Test 3 FAILED - Game state missing or incorrect currentPlayerId');
}

// Test 4: Raise resets hasActed for other players
console.log('\n=== Test 4: Raise Resets hasActed Flags ===');
const game4 = new PokerGame('test', 10);
const p10 = game4.addPlayer('player10', 'Jack', 'avatar1');
const p11 = game4.addPlayer('player11', 'Kelly', 'avatar2');
const p12 = game4.addPlayer('player12', 'Leo', 'avatar3');

game4.startNewHand();

// Get to flop
game4.bettingRound = 'flop';
game4.currentBet = 0;
game4.players.forEach(p => {
  p.bet = 0;
  p.hasActed = false;
});

// Player 1 checks
const player1 = game4.players[game4.currentPlayerIndex];
game4.handlePlayerAction(player1.id, PLAYER_ACTIONS.CHECK);
console.log(`${player1.name} checks - hasActed: ${player1.hasActed}`);

// Player 2 raises
const player2 = game4.players[game4.currentPlayerIndex];
const raiseAmount = 100;
game4.handlePlayerAction(player2.id, PLAYER_ACTIONS.RAISE, raiseAmount);
console.log(`${player2.name} raises to $${raiseAmount}`);
console.log(`  ${player2.name} hasActed: ${player2.hasActed}`);
console.log(`  ${player1.name} hasActed reset? ${!player1.hasActed ? 'YES ✓' : 'NO ✗'}`);

// Player 1 should need to act again
const roundComplete = game4.isBettingRoundComplete();
console.log(`  Betting round complete? ${!roundComplete ? 'NO ✓ (correct)' : 'YES ✗ (wrong)'}`);

if (!player1.hasActed && !roundComplete) {
  console.log('\n✓ Test 4 PASSED - Raise correctly resets hasActed for other players');
} else {
  console.log('\n✗ Test 4 FAILED - hasActed not properly reset after raise');
}

console.log('\n=== All Bug Fix Tests Complete ===\n');
