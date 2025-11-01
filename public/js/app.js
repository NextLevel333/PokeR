// Socket.IO connection
const socket = io();

// Game state
let gameState = {
    playerId: null,
    tableId: null,
    playerName: '',
    avatar: '👤',
    selectedTable: null
};

// DOM Elements
const lobbyScreen = document.getElementById('lobby');
const gameScreen = document.getElementById('game');
const playerNameInput = document.getElementById('playerName');
const joinTableBtn = document.getElementById('joinTableBtn');
const leaveTableBtn = document.getElementById('leaveTableBtn');
const foldBtn = document.getElementById('foldBtn');
const checkCallBtn = document.getElementById('checkCallBtn');
const raiseBtn = document.getElementById('raiseBtn');
const raiseSlider = document.getElementById('raiseSlider');
const raiseAmount = document.getElementById('raiseAmount');
const winnerDisplay = document.getElementById('winnerDisplay');

// Avatar chooser elements
const chooseAvatarBtn = document.getElementById('chooseAvatarBtn');
const avatarPreview = document.getElementById('avatarPreview');
const avatarModal = document.getElementById('avatarModal');
const avatarModalBackdrop = document.getElementById('avatarModalBackdrop');
const closeAvatarModal = document.getElementById('closeAvatarModal');
const avatarGallery = document.getElementById('avatarGallery');

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    setupLobby();
    setupGameControls();
});

// Lobby Setup
function setupLobby() {
    // Avatar chooser
    if (chooseAvatarBtn) {
        chooseAvatarBtn.addEventListener('click', openAvatarModal);
    }
    if (closeAvatarModal) {
        closeAvatarModal.addEventListener('click', closeAvatarModalHandler);
    }
    if (avatarModalBackdrop) {
        avatarModalBackdrop.addEventListener('click', closeAvatarModalHandler);
    }

    // Table selection
    document.querySelectorAll('.table-card').forEach(card => {
        card.addEventListener('click', () => {
            document.querySelectorAll('.table-card').forEach(c => c.classList.remove('selected'));
            card.classList.add('selected');
            gameState.selectedTable = card.dataset.table;
            updateJoinButton();
        });
    });

    // Player name input
    if (playerNameInput) {
        playerNameInput.addEventListener('input', updateJoinButton);
    }

    // Join table button
    if (joinTableBtn) {
        joinTableBtn.addEventListener('click', joinTable);
    }

    // Request lobby info
    socket.emit('joinLobby', {});
}

// Avatar modal functions
function openAvatarModal() {
    avatarModal.style.display = 'block';
    fetchAndDisplayAvatars();
}

function closeAvatarModalHandler() {
    avatarModal.style.display = 'none';
}

function fetchAndDisplayAvatars() {
    avatarGallery.innerHTML = '<div class="loading-message">Loading avatars...</div>';
    
    fetch('/api/avatars')
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to fetch avatars');
            }
            return response.json();
        })
        .then(data => {
            if (data.avatars.length === 0) {
                avatarGallery.innerHTML = '<div class="empty-message">No avatars found</div>';
                return;
            }
            
            avatarGallery.innerHTML = '';
            data.avatars.forEach(avatarPath => {
                const thumb = document.createElement('div');
                thumb.className = 'avatar-thumb';
                if (gameState.avatar === avatarPath) {
                    thumb.classList.add('selected');
                }
                
                const img = document.createElement('img');
                img.src = avatarPath;
                img.alt = 'Avatar';
                
                thumb.appendChild(img);
                
                // Attach event to thumb container for better reliability
                thumb.addEventListener('click', (e) => selectAvatar(avatarPath, e));
                
                avatarGallery.appendChild(thumb);
            });
        })
        .catch(error => {
            console.error('Error fetching avatars:', error);
            avatarGallery.innerHTML = '<div class="error-message">Error loading avatars</div>';
        });
}

function selectAvatar(avatarPath, event) {
    gameState.avatar = avatarPath;
    
    // Update preview
    avatarPreview.innerHTML = '';
    const img = document.createElement('img');
    img.src = avatarPath;
    img.alt = 'Selected Avatar';
    img.className = 'avatar-preview-img';
    avatarPreview.appendChild(img);
    
    // Update selection in gallery
    document.querySelectorAll('.avatar-thumb').forEach(thumb => {
        thumb.classList.remove('selected');
    });
    if (event && event.target) {
        const thumb = event.target.closest('.avatar-thumb');
        if (thumb) {
            thumb.classList.add('selected');
        }
    }
    
    // Close modal
    closeAvatarModalHandler();
}

function updateJoinButton() {
    const nameValid = playerNameInput.value.trim().length > 0;
    const tableSelected = gameState.selectedTable !== null;
    joinTableBtn.disabled = !(nameValid && tableSelected);
}

function joinTable() {
    gameState.playerName = playerNameInput.value.trim();
    
    socket.emit('joinTable', {
        tableId: gameState.selectedTable,
        playerName: gameState.playerName,
        avatar: gameState.avatar
    });
}

// Setup Game Controls
function setupGameControls() {
    leaveTableBtn.addEventListener('click', () => {
        socket.emit('leaveTable');
        showLobby();
    });

    foldBtn.addEventListener('click', () => {
        socket.emit('playerAction', {
            tableId: gameState.tableId,
            action: 'fold'
        });
    });

    checkCallBtn.addEventListener('click', () => {
        const currentPlayer = getCurrentPlayer();
        if (!currentPlayer || !gameState.currentGameState) return;

        const action = currentPlayer.bet < gameState.currentGameState.currentBet ? 'call' : 'check';
        socket.emit('playerAction', {
            tableId: gameState.tableId,
            action: action
        });
    });

    raiseBtn.addEventListener('click', () => {
        const amount = parseInt(raiseAmount.value) || 0;
        socket.emit('playerAction', {
            tableId: gameState.tableId,
            action: 'raise',
            amount: amount
        });
    });

    // Raise slider sync
    raiseSlider.addEventListener('input', (e) => {
        raiseAmount.value = e.target.value;
    });

    raiseAmount.addEventListener('input', (e) => {
        raiseSlider.value = e.target.value;
    });
}

function getCurrentPlayer() {
    if (!gameState.currentGameState) return null;
    return gameState.currentGameState.players.find(p => p.id === gameState.playerId);
}

// Socket Event Handlers
socket.on('lobbyJoined', (data) => {
    updateLobbyTables(data.tables);
});

socket.on('tableJoined', (data) => {
    gameState.tableId = data.tableId;
    gameState.playerId = data.playerId;
    gameState.currentGameState = data.gameState;
    
    showGame();
    updateGameState(data.gameState);
});

socket.on('playerJoined', (data) => {
    console.log('Player joined:', data.player.name);
    if (gameState.currentGameState) {
        updateGameState(gameState.currentGameState);
    }
});

socket.on('gameState', (data) => {
    gameState.currentGameState = data;
    updateGameState(data);
});

socket.on('handComplete', (data) => {
    showWinners(data.winners);
    setTimeout(() => {
        hideWinners();
    }, 4500);
});

socket.on('playerLeft', (data) => {
    console.log('Player left');
    if (data.gameState) {
        gameState.currentGameState = data.gameState;
        updateGameState(data.gameState);
    }
});

socket.on('error', (data) => {
    alert(data.message);
});

// UI Update Functions
function updateLobbyTables(tables) {
    tables.forEach(table => {
        const tableCard = document.querySelector(`.table-card[data-table="${table.id}"]`);
        if (tableCard) {
            const playerCount = tableCard.querySelector('.player-count');
            playerCount.textContent = `${table.players}/${table.maxPlayers} Players`;
        }
    });
}

function showLobby() {
    lobbyScreen.classList.add('active');
    gameScreen.classList.remove('active');
    socket.emit('joinLobby', {});
}

function showGame() {
    lobbyScreen.classList.remove('active');
    gameScreen.classList.add('active');
    
    const tableName = document.querySelector('.table-name');
    tableName.textContent = gameState.selectedTable.charAt(0).toUpperCase() + 
                           gameState.selectedTable.slice(1) + ' Table';
}

function updateGameState(state) {
    if (!state) return;

    // Update pot display
    updatePotDisplay(state);

    // Update community cards
    updateCommunityCards(state.communityCards);

    // Update players
    updatePlayers(state);

    // Update action controls
    updateActionControls(state);

    // Update player hand
    updatePlayerHand(state);
}

function updatePotDisplay(state) {
    const potElement = document.querySelector('.pot-amount');
    
    // If there are side pots, display them
    if (state.pots && state.pots.length) {
        const totalPot = state.pots.reduce((sum, pot) => sum + pot.amount, 0);
        
        // Show total pot with side pot breakdown if multiple pots
        if (state.pots.length === 1) {
            potElement.textContent = '$' + totalPot;
        } else {
            let potText = '$' + totalPot;
            potText += ' (Main: $' + state.pots[0].amount;
            for (let i = 1; i < state.pots.length; i++) {
                potText += ', Side ' + i + ': $' + state.pots[i].amount;
            }
            potText += ')';
            potElement.textContent = potText;
        }
    } else {
        // Fallback to simple pot display
        potElement.textContent = '$' + state.pot;
    }
}

function updateCommunityCards(cards) {
    const cardSlots = document.querySelectorAll('.community-cards .card-slot');
    
    cardSlots.forEach((slot, index) => {
        slot.innerHTML = '';
        if (cards[index]) {
            const card = createCardElement(cards[index]);
            slot.appendChild(card);
        }
    });
}

function updatePlayers(state) {
    const playerSeats = document.querySelectorAll('.player-seat');
    
    // Clear all seats
    playerSeats.forEach(seat => {
        seat.innerHTML = '';
        seat.className = 'player-seat seat-' + seat.dataset.seat;
    });

    // Add players to seats
    state.players.forEach((player, index) => {
        const seat = playerSeats[index];
        if (!seat) return;

        seat.classList.remove('empty');
        
        // Add dealer button
        if (index === state.dealerIndex) {
            seat.classList.add('dealer');
        }

        // Highlight current player
        if (index === state.currentPlayerIndex && state.gameInProgress) {
            seat.classList.add('active');
        }

        // Create player info
        const playerInfo = document.createElement('div');
        playerInfo.className = 'player-info';
        
        const avatar = document.createElement('div');
        avatar.className = 'player-avatar';
        
        // Check if avatar is an image path or emoji
        if (player.avatar && player.avatar.startsWith('/')) {
            const img = document.createElement('img');
            img.src = player.avatar;
            img.alt = player.name;
            img.className = 'player-avatar-img';
            avatar.appendChild(img);
        } else {
            avatar.textContent = player.avatar || '👤';
        }
        
        const name = document.createElement('div');
        name.className = 'player-name';
        name.textContent = player.name;
        
        const chips = document.createElement('div');
        chips.className = 'player-chips';
        chips.textContent = '$' + player.chips;
        
        playerInfo.appendChild(avatar);
        playerInfo.appendChild(name);
        playerInfo.appendChild(chips);
        seat.appendChild(playerInfo);

        // Show bet
        if (player.bet > 0) {
            const betDiv = document.createElement('div');
            betDiv.className = 'player-bet';
            betDiv.textContent = '$' + player.bet;
            seat.appendChild(betDiv);
        }

        // Show player cards (only for other players, show card backs)
        if (state.gameInProgress && player.id !== gameState.playerId && player.hand.length > 0) {
            const cardsDiv = document.createElement('div');
            cardsDiv.className = 'player-cards';
            
            for (let i = 0; i < Math.min(2, player.hand.length); i++) {
                const cardSlot = document.createElement('div');
                cardSlot.style.width = '30px';
                cardSlot.style.height = '42px';
                
                const cardBack = document.createElement('div');
                cardBack.className = 'card-back';
                cardSlot.appendChild(cardBack);
                cardsDiv.appendChild(cardSlot);
            }
            seat.appendChild(cardsDiv);
        }

        // Show status
        if (player.folded) {
            const status = document.createElement('div');
            status.className = 'player-status';
            status.textContent = 'Folded';
            seat.appendChild(status);
        } else if (player.allIn) {
            const status = document.createElement('div');
            status.className = 'player-status';
            status.textContent = 'All In';
            seat.appendChild(status);
        }
    });
}

function updatePlayerHand(state) {
    const currentPlayer = state.players.find(p => p.id === gameState.playerId);
    if (!currentPlayer) return;

    const handSlots = document.querySelectorAll('.player-hand .card-slot');
    
    handSlots.forEach((slot, index) => {
        slot.innerHTML = '';
        if (currentPlayer.hand[index]) {
            const card = createCardElement(currentPlayer.hand[index]);
            slot.appendChild(card);
        }
    });
}

function updateActionControls(state) {
    const currentPlayer = state.players.find(p => p.id === gameState.playerId);
    if (!currentPlayer) return;

    const isMyTurn = state.players[state.currentPlayerIndex]?.id === gameState.playerId;
    const canAct = isMyTurn && !currentPlayer.folded && !currentPlayer.allIn && state.gameInProgress;

    // Enable/disable buttons
    foldBtn.disabled = !canAct;
    checkCallBtn.disabled = !canAct;
    raiseBtn.disabled = !canAct;

    // Update check/call button text
    if (currentPlayer.bet < state.currentBet) {
        const callAmount = state.currentBet - currentPlayer.bet;
        checkCallBtn.textContent = `Call $${callAmount}`;
    } else {
        checkCallBtn.textContent = 'Check';
    }

    // Update raise controls
    if (canAct) {
        const minRaise = state.currentBet - currentPlayer.bet + state.bigBlind;
        const maxRaise = currentPlayer.chips;
        
        raiseSlider.min = minRaise;
        raiseSlider.max = maxRaise;
        raiseSlider.value = minRaise;
        
        raiseAmount.min = minRaise;
        raiseAmount.max = maxRaise;
        raiseAmount.value = minRaise;
    }
}

function createCardElement(cardData) {
    const card = document.createElement('div');
    card.className = `card ${cardData.suit}`;
    
    const suitSymbols = {
        'hearts': '♥',
        'diamonds': '♦',
        'clubs': '♣',
        'spades': '♠'
    };
    
    card.textContent = cardData.rank + suitSymbols[cardData.suit];
    return card;
}

function showWinners(winners) {
    const winnersList = document.querySelector('.winners-list');
    winnersList.innerHTML = '';

    winners.forEach(winner => {
        const winnerDiv = document.createElement('div');
        winnerDiv.className = 'winner-item';
        
        const winnerContent = document.createElement('div');
        winnerContent.className = 'winner-info';
        
        // Create avatar element
        let avatarElement;
        if (winner.player.avatar && winner.player.avatar.startsWith('/')) {
            avatarElement = document.createElement('img');
            avatarElement.src = winner.player.avatar;
            avatarElement.alt = winner.player.name;
            avatarElement.className = 'winner-avatar-img';
        } else {
            avatarElement = document.createElement('span');
            avatarElement.className = 'winner-avatar-emoji';
            avatarElement.textContent = winner.player.avatar || '👤';
        }
        
        const nameSpan = document.createElement('span');
        nameSpan.textContent = winner.player.name;
        
        const playerDiv = document.createElement('div');
        playerDiv.className = 'winner-player';
        playerDiv.appendChild(avatarElement);
        playerDiv.appendChild(nameSpan);
        
        const handDiv = document.createElement('div');
        handDiv.className = 'winner-hand';
        handDiv.textContent = winner.hand?.description || 'Winner';
        
        const amountDiv = document.createElement('div');
        amountDiv.className = 'winner-amount';
        amountDiv.textContent = `Won $${winner.winAmount}`;
        
        winnerContent.appendChild(playerDiv);
        winnerContent.appendChild(handDiv);
        winnerContent.appendChild(amountDiv);
        winnerDiv.appendChild(winnerContent);
        winnersList.appendChild(winnerDiv);
    });

    winnerDisplay.style.display = 'flex';
}

function hideWinners() {
    winnerDisplay.style.display = 'none';
}
