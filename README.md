# Texas Hold'em Online Multiplayer Poker

A real-time multiplayer Texas Hold'em poker game built with Node.js, Express, and Socket.IO.

## Features

### Core Gameplay
- ✅ **Real-time Multiplayer**: Play with real players in real-time using WebSocket technology
- ✅ **2 Tables**: Community and Private tables, each supporting up to 10 players
- ✅ **Complete Texas Hold'em Logic**:
  - 7-card hand evaluation (2 hole cards + 5 community cards)
  - All betting rounds: Pre-flop, Flop, Turn, and River
  - Small blind and big blind system ($10/$20)
  - Full Pot + Side Pot management and winner determination
  - Support for fold, check, call, raise, and all-in actions

### UI Features
- ✅ **Clean Lobby Interface**:
  - Player name input
  - 8 avatar options to choose from
  - Table selection between Community and Private tables
  - Real-time player count display
  
- ✅ **Professional Poker Table**:
  - Beautiful green felt table with wooden border
  - 10 player positions arranged around the table
  - Community cards display area
  - Pot display
  - Dealer button indicator
  - Player information cards showing avatar, name, and chips
  - Current bet display for each player
  
- ✅ **Smooth Animations**:
  - Card dealing animations
  - Chip movement animations
  - Player action highlights
  - Winner celebration display

### Game Logic Features
- ✅ **Advanced Hand Evaluation**:
  - Royal Flush
  - Straight Flush
  - Four of a Kind
  - Full House
  - Flush
  - Straight
  - Three of a Kind
  - Two Pair
  - Pair
  - High Card
  
- ✅ **Complete Betting System**:
  - Automatic blind posting
  - Turn-based action system
  - Bet tracking and pot calculation
  - Multiple winner support (tie handling)

## Installation

```bash
# Clone the repository
git clone https://github.com/NextLevel333/PokeR.git
cd PokeR

# Install dependencies
npm install

# Start the server
npm start
```

The server will start on port 3000. Open your browser and navigate to `http://localhost:3000`

## How to Play

1. **Join the Lobby**:
   - Enter your player name
   - Choose an avatar
   - Select a table (Community or Private)
   - Click "Join Table"

2. **At the Table**:
   - Wait for at least 2 players to start the game
   - Game automatically starts 2 seconds after the second player joins
   - Players are dealt 2 hole cards each
   - Blinds are automatically posted

3. **Playing a Hand**:
   - When it's your turn, the action buttons are enabled
   - **Fold**: Give up your hand
   - **Check**: Pass the action (only if no bet to match)
   - **Call**: Match the current bet
   - **Raise**: Increase the bet amount
   - Use the slider to choose your raise amount

4. **Betting Rounds**:
   - **Pre-flop**: After hole cards are dealt
   - **Flop**: After 3 community cards are dealt
   - **Turn**: After the 4th community card
   - **River**: After the 5th community card
   - Showdown determines the winner(s)

5. **Winning**:
   - Best 5-card hand from your 2 hole cards + 5 community cards wins
   - Winners are displayed with their winning hand
   - Pot is distributed to winner(s)
   - New hand starts automatically after 5 seconds

## Technology Stack

- **Backend**: Node.js, Express
- **Real-time Communication**: Socket.IO
- **Frontend**: Vanilla JavaScript, HTML5, CSS3
- **Game Logic**: Custom poker hand evaluator

## Project Structure

```
PokeR/
├── server.js                 # Express server and Socket.IO setup
├── game/
│   ├── pokerGame.js         # Main game logic and state management
│   └── handEvaluator.js     # 7-card hand evaluation algorithm
├── public/
│   ├── index.html           # Main HTML file
│   ├── css/
│   │   └── styles.css       # All styling and animations
│   └── js/
│       └── app.js           # Client-side game logic
└── package.json             # Dependencies and scripts
```

## Game Rules

- Starting chips: $1,000 per player
- Small blind: $10
- Big blind: $20
- Minimum raise: Big blind amount
- Players can go all-in at any time

## Screenshots

### Lobby
![Lobby](https://github.com/user-attachments/assets/69e759b9-89bd-48e3-b9a6-dd5984b472ed)

### Game Table
![Game Table](https://github.com/user-attachments/assets/6a0bbff1-34c9-4932-a648-0a8a9694666e)

### Active Game
![Active Game](https://github.com/user-attachments/assets/6505f959-c267-47bf-a6eb-79470ab5fda6)

## Future Enhancements

- Player chat system
- Tournament mode
- Player statistics and leaderboards
- Sound effects
- Mobile responsive improvements
- Configurable blind levels
- Private table passwords
- Spectator mode

## License

MIT
