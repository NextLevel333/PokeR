const { PokerGame, PLAYER_ACTIONS } = require('../game/pokerGame');

// Helper function to simulate a game scenario
function createTestGame() {
  const game = new PokerGame('test', 10);
  return game;
}

// Test 1: Single all-in scenario
console.log('\n=== Test 1: Single All-In with Two Other Players ===');
const game1 = createTestGame();
const p1 = game1.addPlayer('p1', 'Player1', 'avatar1');
const p2 = game1.addPlayer('p2', 'Player2', 'avatar2');
const p3 = game1.addPlayer('p3', 'Player3', 'avatar3');

// Set specific chip amounts
p1.chips = 100;
p2.chips = 500;
p3.chips = 500;

// Simulate betting where p1 goes all-in
p1.bet = 100;
p1.chips = 0;
p1.allIn = true;

p2.bet = 100;
p2.chips = 400;

p3.bet = 100;
p3.chips = 400;

game1.pot = 300;
game1.createSidePots();

console.log('Scenario: P1 all-in $100, P2 and P3 bet $100 each');
console.log('Expected: One pot of $300, all three players eligible');
console.log('Actual pots:', JSON.stringify(game1.pots, null, 2));

if (game1.pots.length === 1 && 
    game1.pots[0].amount === 300 && 
    game1.pots[0].eligiblePlayers.length === 3) {
  console.log('✓ Test 1 PASSED');
} else {
  console.log('✗ Test 1 FAILED');
}

// Test 2: Multiple all-ins at different levels
console.log('\n=== Test 2: Multiple All-Ins at Different Levels ===');
const game2 = createTestGame();
const p4 = game2.addPlayer('p4', 'Player4', 'avatar1');
const p5 = game2.addPlayer('p5', 'Player5', 'avatar2');
const p6 = game2.addPlayer('p6', 'Player6', 'avatar3');

// P4 goes all-in for $50
p4.bet = 50;
p4.chips = 0;
p4.allIn = true;

// P5 goes all-in for $200
p5.bet = 200;
p5.chips = 0;
p5.allIn = true;

// P6 bets $500
p6.bet = 500;
p6.chips = 0;

game2.pot = 750;
game2.createSidePots();

console.log('Scenario: P4 all-in $50, P5 all-in $200, P6 bets $500');
console.log('Expected: 3 pots:');
console.log('  - Main pot: $150 (50*3), all three eligible');
console.log('  - Side pot 1: $300 (150*2), P5 and P6 eligible');
console.log('  - Side pot 2: $300 (300*1), P6 only eligible');
console.log('Actual pots:', JSON.stringify(game2.pots, null, 2));

let test2Passed = false;
if (game2.pots.length === 3) {
  const mainPot = game2.pots[0];
  const sidePot1 = game2.pots[1];
  const sidePot2 = game2.pots[2];
  
  if (mainPot.amount === 150 && mainPot.eligiblePlayers.length === 3 &&
      sidePot1.amount === 300 && sidePot1.eligiblePlayers.length === 2 &&
      sidePot2.amount === 300 && sidePot2.eligiblePlayers.length === 1) {
    test2Passed = true;
  }
}

if (test2Passed) {
  console.log('✓ Test 2 PASSED');
} else {
  console.log('✗ Test 2 FAILED');
}

// Test 3: Two players all-in at same level
console.log('\n=== Test 3: Two Players All-In at Same Level ===');
const game3 = createTestGame();
const p7 = game3.addPlayer('p7', 'Player7', 'avatar1');
const p8 = game3.addPlayer('p8', 'Player8', 'avatar2');
const p9 = game3.addPlayer('p9', 'Player9', 'avatar3');

// P7 and P8 both all-in for $100
p7.bet = 100;
p7.chips = 0;
p7.allIn = true;

p8.bet = 100;
p8.chips = 0;
p8.allIn = true;

// P9 bets $300
p9.bet = 300;
p9.chips = 0;

game3.pot = 500;
game3.createSidePots();

console.log('Scenario: P7 all-in $100, P8 all-in $100, P9 bets $300');
console.log('Expected: 2 pots:');
console.log('  - Main pot: $300 (100*3), all three eligible');
console.log('  - Side pot: $200 (200*1), P9 only eligible');
console.log('Actual pots:', JSON.stringify(game3.pots, null, 2));

let test3Passed = false;
if (game3.pots.length === 2) {
  const mainPot = game3.pots[0];
  const sidePot = game3.pots[1];
  
  if (mainPot.amount === 300 && mainPot.eligiblePlayers.length === 3 &&
      sidePot.amount === 200 && sidePot.eligiblePlayers.length === 1) {
    test3Passed = true;
  }
}

if (test3Passed) {
  console.log('✓ Test 3 PASSED');
} else {
  console.log('✗ Test 3 FAILED');
}

// Test 4: No all-ins, everyone bets same amount
console.log('\n=== Test 4: No All-Ins (Equal Bets) ===');
const game4 = createTestGame();
const p10 = game4.addPlayer('p10', 'Player10', 'avatar1');
const p11 = game4.addPlayer('p11', 'Player11', 'avatar2');

p10.bet = 100;
p10.chips = 400;

p11.bet = 100;
p11.chips = 400;

game4.pot = 200;
game4.createSidePots();

console.log('Scenario: P10 bets $100, P11 bets $100 (no all-ins)');
console.log('Expected: 1 pot of $200, both players eligible');
console.log('Actual pots:', JSON.stringify(game4.pots, null, 2));

if (game4.pots.length === 1 && 
    game4.pots[0].amount === 200 && 
    game4.pots[0].eligiblePlayers.length === 2) {
  console.log('✓ Test 4 PASSED');
} else {
  console.log('✗ Test 4 FAILED');
}

console.log('\n=== All Tests Complete ===\n');
