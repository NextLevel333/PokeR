const { PokerGame, PLAYER_ACTIONS } = require('../game/pokerGame');

// Test winner determination with side pots
console.log('\n=== Integration Test: Winner Determination with Side Pots ===\n');

// Scenario: Three players with different chip amounts
const game = new PokerGame('test', 10);
const p1 = game.addPlayer('p1', 'Alice', 'avatar1');
const p2 = game.addPlayer('p2', 'Bob', 'avatar2');
const p3 = game.addPlayer('p3', 'Charlie', 'avatar3');

// Give them specific starting chips
p1.chips = 100;
p2.chips = 300;
p3.chips = 500;

console.log('Starting chips:');
console.log('  Alice: $100');
console.log('  Bob: $300');
console.log('  Charlie: $500\n');

// Simulate a betting scenario:
// Alice goes all-in for $100
// Bob goes all-in for $300
// Charlie calls $300
console.log('Betting action:');
console.log('  Alice: All-in $100');
console.log('  Bob: All-in $300');
console.log('  Charlie: Calls $300\n');

p1.bet = 100;
p1.chips = 0;
p1.allIn = true;

p2.bet = 300;
p2.chips = 0;
p2.allIn = true;

p3.bet = 300;
p3.chips = 200;

game.pot = 700;

// Give them hole cards (we'll use specific cards for testing)
// Alice gets a pair of Aces (best hand)
p1.hand = [
  { rank: 'A', suit: 'hearts', value: 14 },
  { rank: 'A', suit: 'diamonds', value: 14 }
];

// Bob gets a pair of Kings
p2.hand = [
  { rank: 'K', suit: 'hearts', value: 13 },
  { rank: 'K', suit: 'diamonds', value: 13 }
];

// Charlie gets a pair of Queens
p3.hand = [
  { rank: 'Q', suit: 'hearts', value: 12 },
  { rank: 'Q', suit: 'diamonds', value: 12 }
];

// Community cards: 2, 3, 7, 8, 9 (no help to anyone, hands stay as pairs)
game.communityCards = [
  { rank: '2', suit: 'spades', value: 2 },
  { rank: '3', suit: 'spades', value: 3 },
  { rank: '7', suit: 'spades', value: 7 },
  { rank: '8', suit: 'clubs', value: 8 },
  { rank: '9', suit: 'clubs', value: 9 }
];

console.log('Hole cards:');
console.log('  Alice: AA (Pair of Aces)');
console.log('  Bob: KK (Pair of Kings)');
console.log('  Charlie: QQ (Pair of Queens)\n');

console.log('Community cards: 2♠ 3♠ 7♠ 8♣ 9♣\n');

// Determine winners
const winners = game.determineWinners();

console.log('Side pots created:');
game.pots.forEach((pot, i) => {
  console.log(`  Pot ${i + 1}: $${pot.amount} - Eligible: ${pot.eligiblePlayers.length} players`);
});
console.log();

console.log('Expected result:');
console.log('  - Main pot ($300): Alice wins with AA');
console.log('  - Side pot ($400): Bob wins with KK\n');

console.log('Actual winners:');
winners.forEach(w => {
  console.log(`  ${w.player.name} wins $${w.winAmount} with ${w.hand ? w.hand.description : 'N/A'}`);
});
console.log();

// Verify results
console.log('Final chip counts:');
console.log(`  Alice: $${p1.chips} (started with $100, should have $300)`);
console.log(`  Bob: $${p2.chips} (started with $300, should have $400)`);
console.log(`  Charlie: $${p3.chips} (started with $500, should have $200)`);
console.log();

// Check if results are correct
let testPassed = true;
let errors = [];

if (p1.chips !== 300) {
  errors.push(`Alice should have $300 but has $${p1.chips}`);
  testPassed = false;
}

if (p2.chips !== 400) {
  errors.push(`Bob should have $400 but has $${p2.chips}`);
  testPassed = false;
}

if (p3.chips !== 200) {
  errors.push(`Charlie should have $200 but has $${p3.chips}`);
  testPassed = false;
}

if (testPassed) {
  console.log('✓ Integration Test PASSED - Side pots work correctly!\n');
} else {
  console.log('✗ Integration Test FAILED:');
  errors.forEach(err => console.log(`  - ${err}`));
  console.log();
}

// Test 2: Side pot winner loses main pot
console.log('=== Test 2: Different Winners for Main and Side Pots ===\n');

const game2 = new PokerGame('test2', 10);
const p4 = game2.addPlayer('p4', 'Dave', 'avatar1');
const p5 = game2.addPlayer('p5', 'Eve', 'avatar2');
const p6 = game2.addPlayer('p6', 'Frank', 'avatar3');

p4.chips = 0;
p5.chips = 0;
p6.chips = 0;

// Dave all-in $50, Eve all-in $200, Frank bets $500
p4.bet = 50;
p4.allIn = true;

p5.bet = 200;
p5.allIn = true;

p6.bet = 500;

game2.pot = 750;

// Dave has best hand (Aces)
p4.hand = [
  { rank: 'A', suit: 'hearts', value: 14 },
  { rank: 'A', suit: 'diamonds', value: 14 }
];

// Eve has middle hand (Kings)
p5.hand = [
  { rank: 'K', suit: 'hearts', value: 13 },
  { rank: 'K', suit: 'diamonds', value: 13 }
];

// Frank has worst hand (Queens)
p6.hand = [
  { rank: 'Q', suit: 'hearts', value: 12 },
  { rank: 'Q', suit: 'diamonds', value: 12 }
];

game2.communityCards = [
  { rank: '2', suit: 'spades', value: 2 },
  { rank: '3', suit: 'spades', value: 3 },
  { rank: '4', suit: 'spades', value: 4 },
  { rank: '5', suit: 'clubs', value: 5 },
  { rank: '7', suit: 'clubs', value: 7 }
];

console.log('Scenario: Dave $50 (AA), Eve $200 (KK), Frank $500 (QQ)');
console.log('Expected:');
console.log('  - Main pot ($150): Dave wins');
console.log('  - Side pot 1 ($300): Eve wins');
console.log('  - Side pot 2 ($300): Frank keeps (no one else eligible)\n');

const winners2 = game2.determineWinners();

console.log('Side pots:');
game2.pots.forEach((pot, i) => {
  console.log(`  Pot ${i + 1}: $${pot.amount} - Eligible: ${pot.eligiblePlayers.length} players`);
});
console.log();

console.log('Winners:');
winners2.forEach(w => {
  console.log(`  ${w.player.name} wins $${w.winAmount}`);
});
console.log();

console.log(`Dave: $${p4.chips} (expected $150)`);
console.log(`Eve: $${p5.chips} (expected $300)`);
console.log(`Frank: $${p6.chips} (expected $300)\n`);

let test2Passed = true;
if (p4.chips !== 150) test2Passed = false;
if (p5.chips !== 300) test2Passed = false;
if (p6.chips !== 300) test2Passed = false;

if (test2Passed) {
  console.log('✓ Test 2 PASSED\n');
} else {
  console.log('✗ Test 2 FAILED\n');
}

console.log('=== All Integration Tests Complete ===\n');
