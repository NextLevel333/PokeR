const { PokerGame, PLAYER_ACTIONS } = require('../game/pokerGame');

console.log('\n=== Ready System and Early Fold Test ===\n');

// Test 1: Ready system gating
console.log('Test 1: Ready system prevents game start until all players ready');
const game1 = new PokerGame('test-table-1', 10);
game1.addPlayer('alice-id', 'Alice', 'avatar1');
game1.addPlayer('bob-id', 'Bob', 'avatar2');

console.log('  - 2 players joined');
console.log('  - Players ready:', game1.players.map(p => ({ name: p.name, ready: p.ready })));
console.log('  - Can start game?', game1.areAllPlayersReady() ? 'YES' : 'NO', '(Expected: NO)');

// Mark one player ready
game1.setPlayerReady('alice-id');
console.log('  - Alice marked as ready');
console.log('  - Can start game?', game1.areAllPlayersReady() ? 'YES' : 'NO', '(Expected: NO)');

// Mark second player ready
game1.setPlayerReady('bob-id');
console.log('  - Bob marked as ready');
console.log('  - Can start game?', game1.areAllPlayersReady() ? 'YES ✓' : 'NO', '(Expected: YES)');

// Test 2: Early hand termination on fold
console.log('\nTest 2: 2-player fold scenario - immediate hand end');
const game2 = new PokerGame('test-table-2', 10);
const alice = game2.addPlayer('alice-id', 'Alice', 'avatar1');
const bob = game2.addPlayer('bob-id', 'Bob', 'avatar2');

// Mark both players ready and start
game2.setPlayerReady('alice-id');
game2.setPlayerReady('bob-id');
game2.startNewHand();

const aliceChipsBefore = alice.chips;
const bobChipsBefore = bob.chips;

console.log('  - Initial chips:');
console.log('    Alice:', aliceChipsBefore);
console.log('    Bob:', bobChipsBefore);
console.log('  - Current player:', game2.players[game2.currentPlayerIndex].name);

// Current player folds
const currentPlayer = game2.players[game2.currentPlayerIndex];
const otherPlayer = game2.players.find(p => p.id !== currentPlayer.id);

console.log(`  - ${currentPlayer.name} folds...`);
const result = game2.handlePlayerAction(currentPlayer.id, PLAYER_ACTIONS.FOLD);

console.log('  - Result:', {
    success: result.success,
    handComplete: result.handComplete,
    singlePlayerWin: result.singlePlayerWin
});

if (result.singlePlayerWin) {
    console.log('  ✓ Single player win detected!');
    console.log('  - Winner:', result.winner.player.name);
    console.log('  - Win amount:', result.winner.winAmount);
    console.log('  - Winner new chips:', result.winner.player.chips);
    
    // Verify chips increased
    if (result.winner.player.chips > (result.winner.player.id === alice.id ? aliceChipsBefore : bobChipsBefore)) {
        console.log('  ✓ Winner chips increased correctly!');
    } else {
        console.log('  ✗ ERROR: Winner chips did not increase!');
    }
} else {
    console.log('  ✗ ERROR: Single player win NOT detected!');
}

// Test 3: Reset ready states after hand
console.log('\nTest 3: Ready states reset after hand completes');
const game3 = new PokerGame('test-table-3', 10);
game3.addPlayer('alice-id', 'Alice', 'avatar1');
game3.addPlayer('bob-id', 'Bob', 'avatar2');

game3.setPlayerReady('alice-id');
game3.setPlayerReady('bob-id');
console.log('  - All players ready:', game3.areAllPlayersReady() ? 'YES' : 'NO');

game3.resetReadyStates();
console.log('  - After reset, all players ready:', game3.areAllPlayersReady() ? 'YES' : 'NO', '(Expected: NO)');
console.log('  - Ready states:', game3.players.map(p => ({ name: p.name, ready: p.ready })));

if (!game3.areAllPlayersReady() && game3.players.every(p => !p.ready)) {
    console.log('  ✓ Ready states reset correctly!');
} else {
    console.log('  ✗ ERROR: Ready states not reset correctly!');
}

// Test 4: 3-player fold to one scenario
console.log('\nTest 4: 3-player fold scenario - last player wins');
const game4 = new PokerGame('test-table-4', 10);
game4.addPlayer('alice-id', 'Alice', 'avatar1');
game4.addPlayer('bob-id', 'Bob', 'avatar2');
game4.addPlayer('charlie-id', 'Charlie', 'avatar3');

// Mark all players ready and start
game4.setPlayerReady('alice-id');
game4.setPlayerReady('bob-id');
game4.setPlayerReady('charlie-id');
game4.startNewHand();

console.log('  - 3 players in hand');
console.log('  - Current player:', game4.players[game4.currentPlayerIndex].name);

// First player folds
const firstPlayer = game4.players[game4.currentPlayerIndex];
console.log(`  - ${firstPlayer.name} folds...`);
let result4 = game4.handlePlayerAction(firstPlayer.id, PLAYER_ACTIONS.FOLD);
console.log('  - Hand complete?', result4.handComplete ? 'YES' : 'NO', '(Expected: NO)');

// Second player folds
const secondPlayer = game4.players[game4.currentPlayerIndex];
console.log(`  - ${secondPlayer.name} folds...`);
result4 = game4.handlePlayerAction(secondPlayer.id, PLAYER_ACTIONS.FOLD);
console.log('  - Hand complete?', result4.handComplete ? 'YES' : 'NO', '(Expected: YES)');
console.log('  - Single player win?', result4.singlePlayerWin ? 'YES ✓' : 'NO');

if (result4.singlePlayerWin) {
    console.log('  - Winner:', result4.winner.player.name);
    console.log('  ✓ Test passed!');
} else {
    console.log('  ✗ ERROR: Single player win not detected!');
}

console.log('\n=== All Tests Complete ===\n');
