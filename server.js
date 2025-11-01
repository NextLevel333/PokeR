const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');
const fs = require('fs');
const { PokerGame } = require('./game/pokerGame');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

const PORT = process.env.PORT || 3000;

// Simple rate limiting for API endpoints
const apiRateLimits = new Map();
const RATE_LIMIT_WINDOW = 60000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 30; // 30 requests per minute

function checkRateLimit(ip) {
  const now = Date.now();
  const clientData = apiRateLimits.get(ip);
  
  if (!clientData) {
    apiRateLimits.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return true;
  }
  
  if (now > clientData.resetTime) {
    apiRateLimits.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return true;
  }
  
  if (clientData.count >= RATE_LIMIT_MAX_REQUESTS) {
    return false;
  }
  
  clientData.count++;
  return true;
}

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// New API: list avatars in public/avatars
let avatarsCache = null;
let avatarsCacheTime = 0;
const CACHE_TTL = 60000; // Cache for 1 minute

app.get('/api/avatars', (req, res) => {
  // Rate limiting
  const clientIp = req.ip || req.connection.remoteAddress;
  if (!checkRateLimit(clientIp)) {
    return res.status(429).json({ error: 'Too many requests, please try again later' });
  }
  
  // Check cache
  const now = Date.now();
  if (avatarsCache && (now - avatarsCacheTime) < CACHE_TTL) {
    return res.json(avatarsCache);
  }
  
  const avatarsDir = path.join(__dirname, 'public', 'avatars');
  fs.readdir(avatarsDir, (err, files) => {
    if (err) {
      console.error('Error reading avatars directory:', err);
      // Return empty list if directory missing or unreadable
      return res.json({ avatars: [] });
    }
    const imageFiles = files
      .filter(f => /\.(png|jpe?g|gif|svg)$/i.test(f))
      .map(f => `/avatars/${f}`);
    
    const result = { avatars: imageFiles };
    avatarsCache = result;
    avatarsCacheTime = now;
    res.json(result);
  });
});

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

      // Start game if enough players
      if (table.getPlayerCount() >= 2 && !table.gameInProgress) {
        setTimeout(() => {
          table.startNewHand();
          io.to(tableId).emit('gameState', table.getGameState());
        }, 2000);
      }
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
          const winners = table.determineWinners();
          io.to(tableId).emit('handComplete', { winners });

          setTimeout(() => {
            table.startNewHand();
            io.to(tableId).emit('gameState', table.getGameState());
          }, 5000);
        }, 1000);
      }
    } else {
      socket.emit('error', { message: result.message });
    }
  });

  // Player leaves table
  socket.on('leaveTable', () => {
    if (!socket.tableId) return;
    const table = tables[socket.tableId];
    if (!table) return;

    table.removePlayer(socket.id);
    socket.leave(socket.tableId);

    io.to(socket.tableId).emit('playerLeft', { playerId: socket.id });

    socket.tableId = null;
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
    if (socket.tableId) {
      const table = tables[socket.tableId];
      if (table) {
        table.removePlayer(socket.id);
        io.to(socket.tableId).emit('playerLeft', { playerId: socket.id });
      }
    }
  });
});

server.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
