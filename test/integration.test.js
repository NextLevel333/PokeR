const { PokerGame, PLAYER_ACTIONS } = require('../game/pokerGame');

console.log('\n=== Integration Test: Real-time Events & Persistent Ready ===\n');

// Simulate complete game flow with persistent ready state
console.log('Scenario: 2 players play 3 consecutive hands with persistent ready state\n');

const game = new PokerGame('integration-test', 10);
const alice = game.addPlayer('alice-id', 'Alice', 'avatar1');
const bob = game.addPlayer('bob-id', 'Bob', 'avatar2');

console.log('✓ Players joined: Alice and Bob');
console.log(`  Alice chips: $${alice.chips}, Bob chips: $${bob.chips}`);

// Both players ready up
game.togglePlayerReady('alice-id');
game.togglePlayerReady('bob-id');
console.log('\n✓ Both players clicked ready');
console.log(`  Ready states: ${game.players.map(p => p.name + '=' + p.ready).join(', ')}`);

let handsCompleted = 0;
const targetHands = 3;

console.log(`\n--- Playing ${targetHands} consecutive hands ---\n`);

for (let handNum = 1; handNum <= targetHands; handNum++) {
    // Check if ready to start
    if (!game.areAllPlayersReady()) {
        console.log(`✗ ERROR: Not all players ready for hand ${handNum}!`);
        break;
    }
    
    // Start hand
    game.startNewHand();
    console.log(`Hand ${handNum}: Started`);
    console.log(`  Dealer: ${game.players[game.dealerIndex].name}`);
    console.log(`  Current player: ${game.players[game.currentPlayerIndex].name}`);
    
    // Current player folds to quickly end the hand
    const currentPlayer = game.players[game.currentPlayerIndex];
    const otherPlayer = game.players.find(p => p.id !== currentPlayer.id);
    
    const result = game.handlePlayerAction(currentPlayer.id, PLAYER_ACTIONS.FOLD);
    
    if (result.success && result.handComplete && result.singlePlayerWin) {
        console.log(`  ${currentPlayer.name} folds`);
        console.log(`  Winner: ${result.winner.player.name} (won $${result.winner.winAmount})`);
        handsCompleted++;
    } else {
        console.log(`✗ ERROR: Hand did not complete correctly!`);
        break;
    }
    
    // Verify ready states persist
    const aliceReady = game.players.find(p => p.id === 'alice-id').ready;
    const bobReady = game.players.find(p => p.id === 'bob-id').ready;
    
    console.log(`  Ready states after hand: Alice=${aliceReady}, Bob=${bobReady}`);
    
    if (!aliceReady || !bobReady) {
        console.log(`✗ ERROR: Ready state was reset after hand!`);
        break;
    }
    
    console.log(`  ✓ Ready states persisted\n`);
}

// Final verification
console.log('--- Final Results ---');
console.log(`Hands completed: ${handsCompleted}/${targetHands}`);
console.log(`Alice final chips: $${alice.chips}`);
console.log(`Bob final chips: $${bob.chips}`);
console.log(`Both players still ready: ${game.areAllPlayersReady() ? 'YES' : 'NO'}`);

if (handsCompleted === targetHands && game.areAllPlayersReady()) {
    console.log('\n✅ INTEGRATION TEST PASSED!');
    console.log('   - Multiple hands played consecutively');
    console.log('   - Ready state persisted across all hands');
    console.log('   - Auto-progression worked correctly');
} else {
    console.log('\n✗ INTEGRATION TEST FAILED!');
}

// Test ready toggle functionality
console.log('\n--- Testing Ready Toggle ---');
console.log(`Alice ready before toggle: ${alice.ready}`);
game.togglePlayerReady('alice-id');
console.log(`Alice ready after toggle off: ${alice.ready}`);
game.togglePlayerReady('alice-id');
console.log(`Alice ready after toggle on: ${alice.ready}`);

if (alice.ready) {
    console.log('✓ Toggle functionality works correctly');
} else {
    console.log('✗ Toggle functionality failed');
}

// Test ready state reset on player leave
console.log('\n--- Testing Ready Reset on Leave ---');
const charlie = game.addPlayer('charlie-id', 'Charlie', 'avatar3');
game.togglePlayerReady('charlie-id');
console.log(`Charlie ready before leaving: ${charlie.ready}`);
const charlieChipsBefore = charlie.chips;
game.removePlayer('charlie-id');
console.log('Charlie left the table');

// Re-add Charlie and check ready state
const charlieRejoined = game.addPlayer('charlie-id', 'Charlie', 'avatar3');
console.log(`Charlie ready after rejoining: ${charlieRejoined.ready}`);

if (!charlieRejoined.ready) {
    console.log('✓ Ready state correctly reset to false for new players');
} else {
    console.log('✗ Ready state was not reset');
}

console.log('\n=== Integration Test Complete ===\n');
