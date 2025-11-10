const { Deck, HandEvaluator } = require('./handEvaluator');

const BETTING_ROUNDS = {
  PRE_FLOP: 'pre-flop',
  FLOP: 'flop',
  TURN: 'turn',
  RIVER: 'river'
};

const PLAYER_ACTIONS = {
  FOLD: 'fold',
  CHECK: 'check',
  CALL: 'call',
  RAISE: 'raise',
  ALL_IN: 'all-in'
};

class Player {
  constructor(id, name, avatar, chips = 1000) {
    this.id = id;
    this.name = name;
    this.avatar = avatar;
    this.chips = chips;
    this.bet = 0;
    this.hand = [];
    this.folded = false;
    this.allIn = false;
    this.isActive = true;
    this.hasActed = false;
    this.ready = false; // Player readiness for starting hands
  }

  reset() {
    this.bet = 0;
    this.hand = [];
    this.folded = false;
    this.allIn = false;
    this.hasActed = false;
  }
}

class PokerGame {
  constructor(tableId, maxPlayers) {
    this.tableId = tableId;
    this.maxPlayers = maxPlayers;
    this.players = [];
    this.deck = new Deck();
    this.communityCards = [];
    this.pot = 0;
    this.pots = []; // Array of {amount, eligiblePlayers[]} for side pots
    this.currentBet = 0;
    this.bettingRound = null;
    this.dealerIndex = 0;
    this.currentPlayerIndex = 0;
    this.gameInProgress = false;
    this.smallBlind = 10;
    this.bigBlind = 20;
  }

  addPlayer(id, name, avatar) {
    if (this.players.length >= this.maxPlayers) {
      return null;
    }

    const player = new Player(id, name, avatar);
    this.players.push(player);
    return player;
  }

  removePlayer(id) {
    const index = this.players.findIndex(p => p.id === id);
    if (index !== -1) {
      this.players.splice(index, 1);
      
      // Adjust indices if needed
      if (this.players.length > 0) {
        if (this.gameInProgress && index <= this.currentPlayerIndex) {
          this.currentPlayerIndex = this.currentPlayerIndex % this.players.length;
        }
        if (index <= this.dealerIndex) {
          this.dealerIndex = this.dealerIndex % this.players.length;
        }
      }
    }
  }

  getPlayerCount() {
    return this.players.length;
  }

  // Player ready system methods
  setPlayerReady(playerId) {
    const player = this.players.find(p => p.id === playerId);
    if (player) {
      player.ready = true;
      return true;
    }
    return false;
  }

  resetReadyStates() {
    this.players.forEach(player => {
      player.ready = false;
    });
  }

  areAllPlayersReady() {
    if (this.players.length < 2) return false;
    return this.players.every(p => p.ready);
  }

  getReadinessState() {
    return this.players.map(p => ({
      id: p.id,
      name: p.name,
      ready: p.ready
    }));
  }

  startNewHand() {
    if (this.players.length < 2) {
      this.gameInProgress = false;
      return;
    }

    // Reset game state
    this.deck.reset();
    this.communityCards = [];
    this.pot = 0;
    this.pots = [];
    this.currentBet = 0;
    this.bettingRound = BETTING_ROUNDS.PRE_FLOP;
    this.gameInProgress = true;

    // Reset players
    this.players.forEach(player => player.reset());

    // Move dealer button
    this.dealerIndex = (this.dealerIndex + 1) % this.players.length;

    // Post blinds
    this.postBlinds();

    // Deal hole cards
    this.dealHoleCards();

    // Set current player (after big blind)
    // In heads-up (2 players), dealer acts first pre-flop
    this.currentPlayerIndex = (this.dealerIndex + (this.players.length === 2 ? 1 : 3)) % this.players.length;
  }

  postBlinds() {
    const smallBlindIndex = (this.dealerIndex + 1) % this.players.length;
    const bigBlindIndex = (this.dealerIndex + 2) % this.players.length;

    const smallBlindPlayer = this.players[smallBlindIndex];
    const bigBlindPlayer = this.players[bigBlindIndex];

    // Post small blind
    const smallBlindAmount = Math.min(this.smallBlind, smallBlindPlayer.chips);
    smallBlindPlayer.chips -= smallBlindAmount;
    smallBlindPlayer.bet = smallBlindAmount;
    this.pot += smallBlindAmount;

    // Post big blind
    const bigBlindAmount = Math.min(this.bigBlind, bigBlindPlayer.chips);
    bigBlindPlayer.chips -= bigBlindAmount;
    bigBlindPlayer.bet = bigBlindAmount;
    this.pot += bigBlindAmount;
    this.currentBet = bigBlindAmount;

    if (bigBlindPlayer.chips === 0) bigBlindPlayer.allIn = true;
    if (smallBlindPlayer.chips === 0) smallBlindPlayer.allIn = true;
  }

  dealHoleCards() {
    for (let i = 0; i < 2; i++) {
      this.players.forEach(player => {
        player.hand.push(this.deck.deal());
      });
    }
  }

  // Check if only one player remains (all others folded)
  // Returns true if hand should end immediately with single winner
  checkForSinglePlayerWin() {
    const activePlayers = this.players.filter(p => !p.folded);
    
    if (activePlayers.length === 1) {
      // Single player wins - create side pots and award to winner
      this.createSidePots();
      const winner = activePlayers[0];
      const totalPot = this.pots.reduce((sum, pot) => sum + pot.amount, 0) || this.pot;
      winner.chips += totalPot;
      
      return {
        singlePlayerWin: true,
        winner: {
          player: winner,
          hand: null,
          winAmount: totalPot
        }
      };
    }
    
    return { singlePlayerWin: false };
  }

  handlePlayerAction(playerId, action, amount = 0) {
    const player = this.players.find(p => p.id === playerId);
    
    if (!player || player.folded || player.allIn) {
      return { success: false, message: 'Invalid player or player cannot act' };
    }

    if (this.players[this.currentPlayerIndex].id !== playerId) {
      return { success: false, message: 'Not your turn' };
    }

    switch (action) {
      case PLAYER_ACTIONS.FOLD:
        player.folded = true;
        break;

      case PLAYER_ACTIONS.CHECK:
        if (player.bet < this.currentBet) {
          return { success: false, message: 'Cannot check, must call or raise' };
        }
        break;

      case PLAYER_ACTIONS.CALL:
        const callAmount = Math.min(this.currentBet - player.bet, player.chips);
        player.chips -= callAmount;
        player.bet += callAmount;
        this.pot += callAmount;
        if (player.chips === 0) player.allIn = true;
        break;

      case PLAYER_ACTIONS.RAISE:
        const raiseAmount = Math.min(amount, player.chips);
        if (raiseAmount < this.currentBet - player.bet) {
          return { success: false, message: 'Raise amount too small' };
        }
        player.chips -= raiseAmount;
        player.bet += raiseAmount;
        this.pot += raiseAmount;
        this.currentBet = player.bet;
        if (player.chips === 0) player.allIn = true;
        // When a player raises, reset hasActed for all other active players
        this.players.forEach(p => {
          if (p.id !== player.id && !p.folded && !p.allIn) {
            p.hasActed = false;
          }
        });
        break;

      case PLAYER_ACTIONS.ALL_IN:
        const allInAmount = player.chips;
        player.chips = 0;
        player.bet += allInAmount;
        this.pot += allInAmount;
        player.allIn = true;
        if (player.bet > this.currentBet) {
          this.currentBet = player.bet;
          // When a player raises via all-in, reset hasActed for all other active players
          this.players.forEach(p => {
            if (p.id !== player.id && !p.folded && !p.allIn) {
              p.hasActed = false;
            }
          });
        }
        break;

      default:
        return { success: false, message: 'Invalid action' };
    }

    // Mark this player as having acted
    player.hasActed = true;

    // Check for single player win (everyone else folded)
    const singleWinCheck = this.checkForSinglePlayerWin();
    if (singleWinCheck.singlePlayerWin) {
      return { success: true, handComplete: true, singlePlayerWin: true, winner: singleWinCheck.winner };
    }

    // Move to next player
    this.moveToNextPlayer();

    // Check if betting round is complete
    if (this.isBettingRoundComplete()) {
      return this.advanceBettingRound();
    }

    return { success: true, handComplete: false };
  }

  moveToNextPlayer() {
    let count = 0;
    const startIndex = this.currentPlayerIndex;
    
    do {
      this.currentPlayerIndex = (this.currentPlayerIndex + 1) % this.players.length;
      count++;
      
      // Break if we've looped through all players
      if (count > this.players.length) {
        break;
      }
    } while (
      (this.players[this.currentPlayerIndex].folded || 
       this.players[this.currentPlayerIndex].allIn) &&
      count <= this.players.length
    );
  }

  isBettingRoundComplete() {
    const activePlayers = this.players.filter(p => !p.folded && !p.allIn);
    
    if (activePlayers.length === 0) return true;
    if (activePlayers.length === 1) return true;

    // All active players must have:
    // 1. Bet the same amount as currentBet
    // 2. Had their turn to act (hasActed = true)
    return activePlayers.every(p => p.bet === this.currentBet && p.hasActed);
  }

  advanceBettingRound() {
    // Reset bets and hasActed for next round
    this.players.forEach(player => {
      player.bet = 0;
      player.hasActed = false;
    });
    this.currentBet = 0;

    switch (this.bettingRound) {
      case BETTING_ROUNDS.PRE_FLOP:
        this.dealFlop();
        this.bettingRound = BETTING_ROUNDS.FLOP;
        break;

      case BETTING_ROUNDS.FLOP:
        this.dealTurn();
        this.bettingRound = BETTING_ROUNDS.TURN;
        break;

      case BETTING_ROUNDS.TURN:
        this.dealRiver();
        this.bettingRound = BETTING_ROUNDS.RIVER;
        break;

      case BETTING_ROUNDS.RIVER:
        return { success: true, handComplete: true };
    }

    // Set current player to first active player after dealer
    this.currentPlayerIndex = (this.dealerIndex + 1) % this.players.length;
    this.moveToNextPlayer();

    return { success: true, handComplete: false };
  }

  dealFlop() {
    this.deck.deal(); // Burn card
    for (let i = 0; i < 3; i++) {
      this.communityCards.push(this.deck.deal());
    }
  }

  dealTurn() {
    this.deck.deal(); // Burn card
    this.communityCards.push(this.deck.deal());
  }

  dealRiver() {
    this.deck.deal(); // Burn card
    this.communityCards.push(this.deck.deal());
  }

  createSidePots() {
    // Collect all players who have contributed to the pot
    const playerBets = this.players
      .filter(p => p.bet > 0)
      .map(p => ({ player: p, bet: p.bet }))
      .sort((a, b) => a.bet - b.bet);

    if (playerBets.length === 0) return;

    const pots = [];
    let remainingPlayers = [...this.players.filter(p => p.bet > 0)];
    let previousBetLevel = 0;

    // Process each unique bet level
    const uniqueBetLevels = [...new Set(playerBets.map(pb => pb.bet))].sort((a, b) => a - b);

    for (let betLevel of uniqueBetLevels) {
      const contributionPerPlayer = betLevel - previousBetLevel;
      const potAmount = contributionPerPlayer * remainingPlayers.length;

      if (potAmount > 0) {
        pots.push({
          amount: potAmount,
          eligiblePlayers: remainingPlayers.map(p => p.id)
        });
      }

      // Remove players who are all-in at this level from future pots
      remainingPlayers = remainingPlayers.filter(p => p.bet > betLevel);
      previousBetLevel = betLevel;
    }

    this.pots = pots;
  }

  determineWinners() {
    // Create side pots before determining winners
    this.createSidePots();

    const activePlayers = this.players.filter(p => !p.folded);
    
    // If only one player left (everyone else folded)
    if (activePlayers.length === 1) {
      const winner = activePlayers[0];
      const totalPot = this.pots.reduce((sum, pot) => sum + pot.amount, 0) || this.pot;
      winner.chips += totalPot;
      return [{ player: winner, hand: null, winAmount: totalPot }];
    }

    // If no side pots were created (shouldn't happen, but fallback to simple pot)
    if (this.pots.length === 0) {
      return this.determineWinnersSimple();
    }

    // Evaluate all active players' hands
    const playerHands = activePlayers.map(player => {
      const allCards = [...player.hand, ...this.communityCards];
      const handResult = HandEvaluator.evaluateHand(allCards);
      return { player, handResult };
    });

    const allWinners = [];

    // Process each pot from side pots to main pot
    for (let i = this.pots.length - 1; i >= 0; i--) {
      const pot = this.pots[i];
      
      // Find eligible players for this pot
      const eligibleHands = playerHands.filter(ph => 
        pot.eligiblePlayers.includes(ph.player.id)
      );

      if (eligibleHands.length === 0) continue;

      // Sort eligible players by hand strength
      eligibleHands.sort((a, b) => 
        HandEvaluator.compareHands(b.handResult, a.handResult)
      );

      // Find winners for this pot (handle ties)
      const potWinners = [eligibleHands[0]];
      for (let j = 1; j < eligibleHands.length; j++) {
        if (HandEvaluator.compareHands(eligibleHands[j].handResult, potWinners[0].handResult) === 0) {
          potWinners.push(eligibleHands[j]);
        } else {
          break;
        }
      }

      // Distribute this pot
      const winAmount = Math.floor(pot.amount / potWinners.length);
      potWinners.forEach(({ player, handResult }) => {
        player.chips += winAmount;
        
        // Check if this player is already in winners list
        const existingWinner = allWinners.find(w => w.player.id === player.id);
        if (existingWinner) {
          existingWinner.winAmount += winAmount;
        } else {
          allWinners.push({
            player,
            hand: handResult,
            winAmount
          });
        }
      });
    }

    return allWinners;
  }

  // Fallback method for simple pot distribution (no side pots)
  determineWinnersSimple() {
    const activePlayers = this.players.filter(p => !p.folded);
    
    if (activePlayers.length === 1) {
      const winner = activePlayers[0];
      winner.chips += this.pot;
      return [{ player: winner, hand: null, winAmount: this.pot }];
    }

    // Evaluate hands
    const playerHands = activePlayers.map(player => {
      const allCards = [...player.hand, ...this.communityCards];
      const handResult = HandEvaluator.evaluateHand(allCards);
      return { player, handResult };
    });

    // Sort by hand strength
    playerHands.sort((a, b) => 
      HandEvaluator.compareHands(b.handResult, a.handResult)
    );

    // Find winners (handle ties)
    const winners = [playerHands[0]];
    for (let i = 1; i < playerHands.length; i++) {
      if (HandEvaluator.compareHands(playerHands[i].handResult, winners[0].handResult) === 0) {
        winners.push(playerHands[i]);
      } else {
        break;
      }
    }

    // Distribute pot
    const winAmount = Math.floor(this.pot / winners.length);
    winners.forEach(({ player }) => {
      player.chips += winAmount;
    });

    return winners.map(({ player, handResult }) => ({
      player,
      hand: handResult,
      winAmount
    }));
  }

  getGameState() {
    return {
      tableId: this.tableId,
      players: this.players.map(p => ({
        id: p.id,
        name: p.name,
        avatar: p.avatar,
        chips: p.chips,
        bet: p.bet,
        hand: p.hand.map(card => ({ rank: card.rank, suit: card.suit })),
        folded: p.folded,
        allIn: p.allIn
      })),
      communityCards: this.communityCards.map(card => ({ 
        rank: card.rank, 
        suit: card.suit 
      })),
      pot: this.pot,
      pots: this.pots,
      currentBet: this.currentBet,
      bettingRound: this.bettingRound,
      dealerIndex: this.dealerIndex,
      currentPlayerIndex: this.currentPlayerIndex,
      currentPlayerId: this.players[this.currentPlayerIndex]?.id || null,
      gameInProgress: this.gameInProgress,
      smallBlind: this.smallBlind,
      bigBlind: this.bigBlind
    };
  }
}

module.exports = { PokerGame, BETTING_ROUNDS, PLAYER_ACTIONS };
