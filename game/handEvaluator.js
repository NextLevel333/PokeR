// Card ranks and suits
const RANKS = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
const SUITS = ['hearts', 'diamonds', 'clubs', 'spades'];
const RANK_VALUES = {
  '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9,
  '10': 10, 'J': 11, 'Q': 12, 'K': 13, 'A': 14
};

// Reverse lookup for rank names
const VALUE_TO_RANK = {
  2: '2', 3: '3', 4: '4', 5: '5', 6: '6', 7: '7', 8: '8', 9: '9',
  10: '10', 11: 'J', 12: 'Q', 13: 'K', 14: 'A'
};

// Hand rankings
const HAND_RANKS = {
  HIGH_CARD: 1,
  PAIR: 2,
  TWO_PAIR: 3,
  THREE_OF_A_KIND: 4,
  STRAIGHT: 5,
  FLUSH: 6,
  FULL_HOUSE: 7,
  FOUR_OF_A_KIND: 8,
  STRAIGHT_FLUSH: 9,
  ROYAL_FLUSH: 10
};

class Card {
  constructor(rank, suit) {
    this.rank = rank;
    this.suit = suit;
    this.value = RANK_VALUES[rank];
  }

  toString() {
    return `${this.rank}${this.suit.charAt(0)}`;
  }
}

class Deck {
  constructor() {
    this.cards = [];
    this.reset();
  }

  reset() {
    this.cards = [];
    for (let suit of SUITS) {
      for (let rank of RANKS) {
        this.cards.push(new Card(rank, suit));
      }
    }
    this.shuffle();
  }

  shuffle() {
    for (let i = this.cards.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [this.cards[i], this.cards[j]] = [this.cards[j], this.cards[i]];
    }
  }

  deal() {
    return this.cards.pop();
  }
}

class HandEvaluator {
  static evaluateHand(cards) {
    if (cards.length < 5) {
      return { rank: HAND_RANKS.HIGH_CARD, value: 0, description: 'Not enough cards' };
    }

    // Get all possible 5-card combinations from 7 cards
    const combinations = this.getCombinations(cards, 5);
    let bestHand = null;

    for (let combo of combinations) {
      const hand = this.evaluate5Cards(combo);
      if (!bestHand || this.compareHands(hand, bestHand) > 0) {
        bestHand = hand;
      }
    }

    return bestHand;
  }

  static getCombinations(arr, k) {
    const result = [];
    
    function combine(start, chosen) {
      if (chosen.length === k) {
        result.push([...chosen]);
        return;
      }
      
      for (let i = start; i < arr.length; i++) {
        chosen.push(arr[i]);
        combine(i + 1, chosen);
        chosen.pop();
      }
    }
    
    combine(0, []);
    return result;
  }

  static evaluate5Cards(cards) {
    const sorted = cards.sort((a, b) => b.value - a.value);
    const ranks = sorted.map(c => c.value);
    const suits = sorted.map(c => c.suit);

    // Count ranks
    const rankCounts = {};
    ranks.forEach(rank => {
      rankCounts[rank] = (rankCounts[rank] || 0) + 1;
    });

    const counts = Object.values(rankCounts).sort((a, b) => b - a);
    const uniqueRanks = Object.keys(rankCounts).map(Number).sort((a, b) => b - a);

    // Check for flush
    const isFlush = suits.every(suit => suit === suits[0]);

    // Check for straight
    let isStraight = false;
    if (uniqueRanks.length === 5) {
      isStraight = uniqueRanks[0] - uniqueRanks[4] === 4;
      // Check for A-2-3-4-5 straight
      if (!isStraight && uniqueRanks[0] === 14 && uniqueRanks[1] === 5) {
        isStraight = true;
        uniqueRanks.push(uniqueRanks.shift()); // Move ace to end
      }
    }

    // Determine hand rank
    if (isStraight && isFlush && uniqueRanks[0] === 14) {
      return {
        rank: HAND_RANKS.ROYAL_FLUSH,
        value: uniqueRanks,
        description: 'Royal Flush'
      };
    }

    if (isStraight && isFlush) {
      return {
        rank: HAND_RANKS.STRAIGHT_FLUSH,
        value: uniqueRanks,
        description: `Straight Flush, ${VALUE_TO_RANK[uniqueRanks[0]]} high`
      };
    }

    if (counts[0] === 4) {
      return {
        rank: HAND_RANKS.FOUR_OF_A_KIND,
        value: uniqueRanks,
        description: `Four of a Kind, ${VALUE_TO_RANK[uniqueRanks[0]]}s`
      };
    }

    if (counts[0] === 3 && counts[1] === 2) {
      return {
        rank: HAND_RANKS.FULL_HOUSE,
        value: uniqueRanks,
        description: `Full House, ${VALUE_TO_RANK[uniqueRanks[0]]}s over ${VALUE_TO_RANK[uniqueRanks[1]]}s`
      };
    }

    if (isFlush) {
      return {
        rank: HAND_RANKS.FLUSH,
        value: uniqueRanks,
        description: `Flush, ${VALUE_TO_RANK[uniqueRanks[0]]} high`
      };
    }

    if (isStraight) {
      return {
        rank: HAND_RANKS.STRAIGHT,
        value: uniqueRanks,
        description: `Straight, ${VALUE_TO_RANK[uniqueRanks[0]]} high`
      };
    }

    if (counts[0] === 3) {
      return {
        rank: HAND_RANKS.THREE_OF_A_KIND,
        value: uniqueRanks,
        description: `Three of a Kind, ${VALUE_TO_RANK[uniqueRanks[0]]}s`
      };
    }

    if (counts[0] === 2 && counts[1] === 2) {
      return {
        rank: HAND_RANKS.TWO_PAIR,
        value: uniqueRanks,
        description: `Two Pair, ${VALUE_TO_RANK[uniqueRanks[0]]}s and ${VALUE_TO_RANK[uniqueRanks[1]]}s`
      };
    }

    if (counts[0] === 2) {
      return {
        rank: HAND_RANKS.PAIR,
        value: uniqueRanks,
        description: `Pair of ${VALUE_TO_RANK[uniqueRanks[0]]}s`
      };
    }

    return {
      rank: HAND_RANKS.HIGH_CARD,
      value: uniqueRanks,
      description: `High Card, ${VALUE_TO_RANK[uniqueRanks[0]]}`
    };
  }

  static compareHands(hand1, hand2) {
    if (hand1.rank !== hand2.rank) {
      return hand1.rank - hand2.rank;
    }

    // Compare by high cards
    for (let i = 0; i < hand1.value.length; i++) {
      if (hand1.value[i] !== hand2.value[i]) {
        return hand1.value[i] - hand2.value[i];
      }
    }

    return 0; // Hands are equal
  }
}

module.exports = { Card, Deck, HandEvaluator, HAND_RANKS };
