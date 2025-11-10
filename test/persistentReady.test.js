const { PokerGame, PLAYER_ACTIONS } = require('../game/pokerGame');

console.log('\n=== Persistent Ready State Test ===\n');

// Test 1: Ready state persists across hands
console.log('Test 1: Ready state persists when not explicitly reset');
const game1 = new PokerGame('test-table-1', 10);
const alice = game1.addPlayer('alice-id', 'Alice', 'avatar1');
const bob = game1.addPlayer('bob-id', 'Bob', 'avatar2');

// Mark both players ready
game1.setPlayerReady('alice-id', true);
game1.setPlayerReady('bob-id', true);
console.log('  - Both players marked ready');
console.log('  - Ready states:', game1.players.map(p => ({ name: p.name, ready: p.ready })));

// Start a hand
game1.startNewHand();
console.log('  - Hand started');

// Fold to end the hand quickly
const currentPlayer = game1.players[game1.currentPlayerIndex];
game1.handlePlayerAction(currentPlayer.id, PLAYER_ACTIONS.FOLD);
console.log('  - Hand ended via fold');

// Check ready states - should still be true!
console.log('  - Ready states after hand:', game1.players.map(p => ({ name: p.name, ready: p.ready })));
const stillReady = game1.players.every(p => p.ready);
if (stillReady) {
    console.log('  ✓ Ready states persisted across hand!');
} else {
    console.log('  ✗ ERROR: Ready states were reset!');
}

// Test 2: Can still start next hand automatically
console.log('\nTest 2: Auto-start next hand when all players remain ready');
if (game1.areAllPlayersReady()) {
    console.log('  - All players still ready:', game1.areAllPlayersReady());
    game1.startNewHand();
    console.log('  - Next hand started successfully');
    console.log('  - Game in progress:', game1.gameInProgress);
    if (game1.gameInProgress) {
        console.log('  ✓ Next hand auto-started!');
    } else {
        console.log('  ✗ ERROR: Next hand did not start!');
    }
} else {
    console.log('  ✗ ERROR: Players not ready for next hand!');
}

// Test 3: Toggle ready state
console.log('\nTest 3: Toggle ready state on/off');
const game2 = new PokerGame('test-table-2', 10);
game2.addPlayer('charlie-id', 'Charlie', 'avatar1');

console.log('  - Charlie joins, initial ready:', game2.players[0].ready);
game2.togglePlayerReady('charlie-id');
console.log('  - After toggle on, ready:', game2.players[0].ready);
game2.togglePlayerReady('charlie-id');
console.log('  - After toggle off, ready:', game2.players[0].ready);

if (game2.players[0].ready === false) {
    console.log('  ✓ Toggle works correctly!');
} else {
    console.log('  ✗ ERROR: Toggle not working!');
}

// Test 4: Ready state resets when player leaves
console.log('\nTest 4: Ready state resets when player leaves table');
const game3 = new PokerGame('test-table-3', 10);
game3.addPlayer('dave-id', 'Dave', 'avatar1');
game3.setPlayerReady('dave-id', true);

console.log('  - Dave ready before leaving:', game3.players[0].ready);
game3.removePlayer('dave-id');
console.log('  - Players remaining:', game3.players.length);

if (game3.players.length === 0) {
    console.log('  ✓ Player removed successfully!');
} else {
    console.log('  ✗ ERROR: Player not removed!');
}

// Test 5: Multiple hands with persistent ready
console.log('\nTest 5: Play multiple consecutive hands with persistent ready');
const game4 = new PokerGame('test-table-4', 10);
game4.addPlayer('alice-id', 'Alice', 'avatar1');
game4.addPlayer('bob-id', 'Bob', 'avatar2');
game4.setPlayerReady('alice-id', true);
game4.setPlayerReady('bob-id', true);

let handsPlayed = 0;
const maxHands = 3;

for (let i = 0; i < maxHands; i++) {
    if (game4.areAllPlayersReady()) {
        game4.startNewHand();
        handsPlayed++;
        
        // Quick fold to end hand
        const player = game4.players[game4.currentPlayerIndex];
        game4.handlePlayerAction(player.id, PLAYER_ACTIONS.FOLD);
        
        console.log(`  - Hand ${i + 1} completed, ready states:`, 
            game4.players.map(p => ({ name: p.name, ready: p.ready })));
    }
}

if (handsPlayed === maxHands && game4.players.every(p => p.ready)) {
    console.log(`  ✓ Played ${handsPlayed} consecutive hands with persistent ready state!`);
} else {
    console.log(`  ✗ ERROR: Only played ${handsPlayed} hands or ready state not persistent!`);
}

console.log('\n=== All Persistent Ready Tests Complete ===\n');
