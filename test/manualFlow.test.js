const { PokerGame, PLAYER_ACTIONS } = require('../game/pokerGame');

console.log('\n=== Manual Scenario Test: Simulating Real Game Flow ===\n');

// Create a game with 3 players
const game = new PokerGame('test-table', 10);
const alice = game.addPlayer('alice-id', 'Alice', 'avatar1');
const bob = game.addPlayer('bob-id', 'Bob', 'avatar2');
const charlie = game.addPlayer('charlie-id', 'Charlie', 'avatar3');

console.log('Players joined:');
console.log(`  - Alice (${alice.id})`);
console.log(`  - Bob (${bob.id})`);
console.log(`  - Charlie (${charlie.id})`);

// Start the game
game.startNewHand();
console.log('\n--- Hand Started ---');
console.log(`Dealer: Player ${game.dealerIndex} (${game.players[game.dealerIndex].name})`);
console.log(`Small Blind: Player ${(game.dealerIndex + 1) % game.players.length} (${game.players[(game.dealerIndex + 1) % game.players.length].name})`);
console.log(`Big Blind: Player ${(game.dealerIndex + 2) % game.players.length} (${game.players[(game.dealerIndex + 2) % game.players.length].name})`);
console.log(`Current bet: $${game.currentBet}`);

let gameState = game.getGameState();
console.log(`\nCurrent player: ${game.players[game.currentPlayerIndex].name} (ID: ${gameState.currentPlayerId})`);
console.log(`Current player ID matches? ${gameState.currentPlayerId === game.players[game.currentPlayerIndex].id ? 'YES ✓' : 'NO ✗'}`);

// Pre-flop action
console.log('\n--- Pre-Flop Betting ---');
const firstPlayer = game.players[game.currentPlayerIndex];
console.log(`${firstPlayer.name} (bet: $${firstPlayer.bet}, needs to call: $${game.currentBet - firstPlayer.bet})`);
game.handlePlayerAction(firstPlayer.id, PLAYER_ACTIONS.CALL);
console.log(`  ${firstPlayer.name} calls -> Next player: ${game.players[game.currentPlayerIndex].name}`);

const secondPlayer = game.players[game.currentPlayerIndex];
console.log(`${secondPlayer.name} (bet: $${secondPlayer.bet}, needs to call: $${game.currentBet - secondPlayer.bet})`);
game.handlePlayerAction(secondPlayer.id, PLAYER_ACTIONS.CALL);
console.log(`  ${secondPlayer.name} calls -> Next player: ${game.players[game.currentPlayerIndex].name}`);

const thirdPlayer = game.players[game.currentPlayerIndex];
console.log(`${thirdPlayer.name} (bet: $${thirdPlayer.bet}, can check: ${thirdPlayer.bet === game.currentBet ? 'YES' : 'NO'})`);
const result = game.handlePlayerAction(thirdPlayer.id, PLAYER_ACTIONS.CHECK);
console.log(`  ${thirdPlayer.name} checks -> Round complete: ${result.handComplete ? 'NO, hand complete' : result.success ? 'YES' : 'NO'}`);
console.log(`  Betting round: ${game.bettingRound}`);
console.log(`  Community cards: ${game.communityCards.length}`);

// Flop action
console.log('\n--- Flop Betting ---');
console.log(`Current bet: $${game.currentBet}`);
console.log(`Current player: ${game.players[game.currentPlayerIndex].name}`);

const flopPlayer1 = game.players[game.currentPlayerIndex];
console.log(`${flopPlayer1.name} checks`);
const checkResult1 = game.handlePlayerAction(flopPlayer1.id, PLAYER_ACTIONS.CHECK);
console.log(`  Success: ${checkResult1.success}`);
console.log(`  Next player: ${game.players[game.currentPlayerIndex].name}`);
console.log(`  Round complete: ${checkResult1.handComplete || game.bettingRound !== 'flop' ? 'YES (WRONG!)' : 'NO ✓'}`);

const flopPlayer2 = game.players[game.currentPlayerIndex];
console.log(`${flopPlayer2.name} checks`);
const checkResult2 = game.handlePlayerAction(flopPlayer2.id, PLAYER_ACTIONS.CHECK);
console.log(`  Success: ${checkResult2.success}`);
console.log(`  Next player: ${game.players[game.currentPlayerIndex].name}`);
console.log(`  Round complete: ${checkResult2.handComplete || game.bettingRound !== 'flop' ? 'YES (WRONG!)' : 'NO ✓'}`);

const flopPlayer3 = game.players[game.currentPlayerIndex];
console.log(`${flopPlayer3.name} checks`);
const checkResult3 = game.handlePlayerAction(flopPlayer3.id, PLAYER_ACTIONS.CHECK);
console.log(`  Success: ${checkResult3.success}`);
console.log(`  Round complete: ${checkResult3.handComplete || game.bettingRound === 'flop' ? (checkResult3.handComplete ? 'YES (hand complete)' : 'NO (WRONG!)') : 'YES ✓'}`);
console.log(`  Betting round: ${game.bettingRound}`);

// Verify player ID tracking
console.log('\n--- Verify Player ID Tracking ---');
gameState = game.getGameState();
console.log(`Current player index: ${game.currentPlayerIndex}`);
console.log(`Current player name: ${game.players[game.currentPlayerIndex].name}`);
console.log(`Game state currentPlayerId: ${gameState.currentPlayerId}`);
console.log(`Actual player ID at index: ${game.players[game.currentPlayerIndex].id}`);
console.log(`IDs match? ${gameState.currentPlayerId === game.players[game.currentPlayerIndex].id ? 'YES ✓' : 'NO ✗'}`);

// Test scenario where a player leaves and joins
console.log('\n--- Test Player Leave/Join Scenario ---');
console.log('Before removal:');
game.players.forEach((p, i) => console.log(`  [${i}] ${p.name} (${p.id})`));

const currentPlayerIdBeforeRemoval = gameState.currentPlayerId;
const currentPlayerNameBeforeRemoval = game.players.find(p => p.id === currentPlayerIdBeforeRemoval)?.name;

// Remove the middle player
console.log(`\nRemoving middle player: ${game.players[1].name}`);
const removedPlayerId = game.players[1].id;
game.removePlayer(removedPlayerId);

console.log('After removal:');
game.players.forEach((p, i) => console.log(`  [${i}] ${p.name} (${p.id})`));

gameState = game.getGameState();
console.log(`\nCurrent player ID after removal: ${gameState.currentPlayerId}`);
console.log(`Current player name: ${game.players.find(p => p.id === gameState.currentPlayerId)?.name}`);
console.log(`Active player glow would be on: ${currentPlayerNameBeforeRemoval === game.players.find(p => p.id === gameState.currentPlayerId)?.name ? 'Same player ✓' : 'Different player ✗'}`);

console.log('\n=== Manual Test Complete ===\n');
