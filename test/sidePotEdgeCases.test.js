const { PokerGame } = require('../game/pokerGame');

// Test side pots when a player folds
console.log('\n=== Test: Side Pots with Folded Player ===\n');

const game = new PokerGame('test', 10);
const p1 = game.addPlayer('p1', 'Alice', 'avatar1');
const p2 = game.addPlayer('p2', 'Bob', 'avatar2');
const p3 = game.addPlayer('p3', 'Charlie', 'avatar3');

// Setup: Alice all-in $100, Bob calls $100, Charlie folds
p1.bet = 100;
p1.chips = 0;
p1.allIn = true;

p2.bet = 100;
p2.chips = 400;

p3.bet = 50;  // Charlie contributed to blinds before folding
p3.chips = 450;
p3.folded = true;

game.pot = 250;

// Give cards
p1.hand = [
  { rank: 'A', suit: 'hearts', value: 14 },
  { rank: 'A', suit: 'diamonds', value: 14 }
];

p2.hand = [
  { rank: 'K', suit: 'hearts', value: 13 },
  { rank: 'K', suit: 'diamonds', value: 13 }
];

p3.hand = [
  { rank: 'Q', suit: 'hearts', value: 12 },
  { rank: 'Q', suit: 'diamonds', value: 12 }
];

game.communityCards = [
  { rank: '2', suit: 'spades', value: 2 },
  { rank: '3', suit: 'spades', value: 3 },
  { rank: '7', suit: 'spades', value: 7 },
  { rank: '8', suit: 'clubs', value: 8 },
  { rank: '9', suit: 'clubs', value: 9 }
];

console.log('Scenario:');
console.log('  Alice: All-in $100 (AA)');
console.log('  Bob: Calls $100 (KK)');
console.log('  Charlie: Folded after betting $50 (QQ)\n');

const winners = game.determineWinners();

console.log('Side pots created:');
game.pots.forEach((pot, i) => {
  console.log(`  Pot ${i + 1}: $${pot.amount} - Eligible players: ${pot.eligiblePlayers.length}`);
});
console.log();

console.log('Winners:');
winners.forEach(w => {
  console.log(`  ${w.player.name} wins $${w.winAmount}`);
});
console.log();

console.log('Final chips:');
console.log(`  Alice: $${p1.chips} (expected $250 - she contributed $100, Bob $100, Charlie $50)`);
console.log(`  Bob: $${p2.chips} (expected $400)`);
console.log(`  Charlie: $${p3.chips} (expected $450 - keeps remaining chips)\n`);

const test1Passed = p1.chips === 250 && p2.chips === 400 && p3.chips === 450;
console.log(test1Passed ? '✓ Test PASSED\n' : '✗ Test FAILED\n');

// Test 2: Only one active player remains (everyone else folded)
console.log('=== Test 2: Everyone Folds Except One ===\n');

const game2 = new PokerGame('test2', 10);
const p4 = game2.addPlayer('p4', 'Dave', 'avatar1');
const p5 = game2.addPlayer('p5', 'Eve', 'avatar2');
const p6 = game2.addPlayer('p6', 'Frank', 'avatar3');

p4.bet = 50;
p4.chips = 450;
p4.folded = true;

p5.bet = 100;
p5.chips = 400;
p5.folded = true;

p6.bet = 200;
p6.chips = 300;

game2.pot = 350;

// Give cards (doesn't matter since everyone but Frank folded)
p4.hand = [{ rank: '2', suit: 'hearts', value: 2 }, { rank: '3', suit: 'hearts', value: 3 }];
p5.hand = [{ rank: '4', suit: 'hearts', value: 4 }, { rank: '5', suit: 'hearts', value: 5 }];
p6.hand = [{ rank: '6', suit: 'hearts', value: 6 }, { rank: '7', suit: 'hearts', value: 7 }];

game2.communityCards = [
  { rank: '8', suit: 'spades', value: 8 },
  { rank: '9', suit: 'spades', value: 9 },
  { rank: '10', suit: 'spades', value: 10 },
  { rank: 'J', suit: 'clubs', value: 11 },
  { rank: 'K', suit: 'clubs', value: 13 }
];

console.log('Scenario:');
console.log('  Dave: Folded after $50');
console.log('  Eve: Folded after $100');
console.log('  Frank: Bet $200, only active player\n');

const winners2 = game2.determineWinners();

console.log('Winners:');
winners2.forEach(w => {
  console.log(`  ${w.player.name} wins $${w.winAmount}`);
});
console.log();

console.log('Final chips:');
console.log(`  Dave: $${p4.chips} (expected $450)`);
console.log(`  Eve: $${p5.chips} (expected $400)`);
console.log(`  Frank: $${p6.chips} (expected $650 - wins entire pot)\n`);

const test2Passed = p4.chips === 450 && p5.chips === 400 && p6.chips === 650;
console.log(test2Passed ? '✓ Test 2 PASSED\n' : '✗ Test 2 FAILED\n');

console.log('=== All Edge Case Tests Complete ===\n');
