const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');
const { PokerGame } = require('./game/pokerGame');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

const PORT = process.env.PORT || 3000;

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Game state
const tables = {
  'community': new PokerGame('community', 10),
  'private': new PokerGame('private', 10)
};

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('New client connected:', socket.id);

  // Player joins lobby
  socket.on('joinLobby', (data) => {
    socket.emit('lobbyJoined', {
      tables: Object.keys(tables).map(tableId => ({
        id: tableId,
        name: tableId.charAt(0).toUpperCase() + tableId.slice(1),
        players: tables[tableId].getPlayerCount(),
        maxPlayers: 10
      }))
    });
  });

  // Player joins a table
  socket.on('joinTable', (data) => {
    const { tableId, playerName, avatar } = data;
    const table = tables[tableId];

    if (!table) {
      socket.emit('error', { message: 'Table not found' });
      return;
    }

    if (table.getPlayerCount() >= 10) {
      socket.emit('error', { message: 'Table is full' });
      return;
    }

    // Add player to table
    const player = table.addPlayer(socket.id, playerName, avatar);
    if (player) {
      socket.join(tableId);
      socket.tableId = tableId;

      // Send current game state to the player
      socket.emit('tableJoined', {
        tableId,
        playerId: socket.id,
        gameState: table.getGameState()
      });

      // Broadcast to all players in the table
      io.to(tableId).emit('playerJoined', {
        player: {
          id: socket.id,
          name: playerName,
          avatar,
          chips: player.chips
        }
      });

      // Broadcast readiness update to all players in table
      io.to(tableId).emit('readinessUpdate', {
        readiness: table.getReadinessState()
      });

      // Don't auto-start - wait for all players to be ready
      // Game will start when all players click ready
    }
  });

  // Player ready event
  socket.on('playerReady', (data) => {
    const { tableId } = data;
    const table = tables[tableId];

    if (!table) {
      socket.emit('error', { message: 'Table not found' });
      return;
    }

    // Mark player as ready
    table.setPlayerReady(socket.id);

    // Broadcast readiness update to all players
    io.to(tableId).emit('readinessUpdate', {
      readiness: table.getReadinessState()
    });

    // Check if all players are ready and can start
    if (table.areAllPlayersReady() && !table.gameInProgress) {
      setTimeout(() => {
        table.startNewHand();
        io.to(tableId).emit('gameState', table.getGameState());
      }, 1000);
    }
  });

  // Player action (fold, call, raise)
  socket.on('playerAction', (data) => {
    const { tableId, action, amount } = data;
    const table = tables[tableId];

    if (!table) return;

    const result = table.handlePlayerAction(socket.id, action, amount);
    
    if (result.success) {
      // Broadcast game state to all players
      io.to(tableId).emit('gameState', table.getGameState());

      // Check if hand is complete
      if (result.handComplete) {
        setTimeout(() => {
          // Handle single player win (everyone else folded)
          let winners;
          if (result.singlePlayerWin) {
            winners = [result.winner];
          } else {
            winners = table.determineWinners();
          }
          
          io.to(tableId).emit('handComplete', { winners });

          setTimeout(() => {
            // Reset ready states for next hand
            table.resetReadyStates();
            
            // Broadcast readiness update
            io.to(tableId).emit('readinessUpdate', {
              readiness: table.getReadinessState()
            });
            
            // Wait for players to ready up for next hand
          }, 5000);
        }, 1000);
      }
    } else {
      socket.emit('error', { message: result.message });
    }
  });

  // Player leaves table
  socket.on('leaveTable', () => {
    if (socket.tableId) {
      const table = tables[socket.tableId];
      table.removePlayer(socket.id);
      
      io.to(socket.tableId).emit('playerLeft', {
        playerId: socket.id,
        gameState: table.getGameState()
      });

      socket.leave(socket.tableId);
      socket.tableId = null;
    }
  });

  // Disconnect
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
    
    if (socket.tableId) {
      const table = tables[socket.tableId];
      if (table) {
        table.removePlayer(socket.id);
        
        io.to(socket.tableId).emit('playerLeft', {
          playerId: socket.id,
          gameState: table.getGameState()
        });
      }
    }
  });
});

server.listen(PORT, () => {
  console.log(`Poker server running on port ${PORT}`);
});
