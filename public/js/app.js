// Socket.IO connection
const socket = io();

// Game state
let gameState = {
    playerId: null,
    tableId: null,
    playerName: '',
    avatar: '👤',
    selectedTable: null,
    // new fields
    lobbyBg: '',
    tableBg: ''
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

const chooseAvatarBtn = document.getElementById('chooseAvatarBtn');
const avatarModal = document.getElementById('avatarModal');
const avatarModalContent = document.getElementById('avatarModalContent');
const avatarModalLoading = document.getElementById('avatarModalLoading');
const closeAvatarModalBtn = document.getElementById('closeAvatarModalBtn');
const avatarPreview = document.getElementById('avatarPreview');

const lobbyBgInput = document.getElementById('lobbyBgInput');
const tableBgInput = document.getElementById('tableBgInput');

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    // Load saved preferences (avatar, backgrounds)
    const savedAvatar = localStorage.getItem('poker_avatar');
    if (savedAvatar) {
        gameState.avatar = savedAvatar;
        updateAvatarPreview(savedAvatar);
    }

    const savedLobbyBg = localStorage.getItem('poker_lobby_bg');
    if (savedLobbyBg) {
        gameState.lobbyBg = savedLobbyBg;
        lobbyBgInput.value = savedLobbyBg;
        lobbyScreen.style.backgroundImage = `url(${savedLobbyBg})`;
        lobbyScreen.style.backgroundSize = 'cover';
        lobbyScreen.style.backgroundPosition = 'center';
    }

    const savedTableBg = localStorage.getItem('poker_table_bg');
    if (savedTableBg) {
        gameState.tableBg = savedTableBg;
        tableBgInput.value = savedTableBg;
    }

    setupLobby();
    setupGameControls();
});

// Lobby Setup
function setupLobby() {
    // Avatar picker button
    chooseAvatarBtn.addEventListener('click', (e) => {
        e.preventDefault();
        openAvatarModal();
    });

    closeAvatarModalBtn.addEventListener('click', () => {
        closeAvatarModal();
    });

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
    playerNameInput.addEventListener('input', updateJoinButton);

    // Join table button
    joinTableBtn.addEventListener('click', joinTable);

    // Background inputs
    lobbyBgInput.addEventListener('input', (e) => {
        const url = e.target.value.trim();
        gameState.lobbyBg = url;
        if (url) {
            lobbyScreen.style.backgroundImage = `url(${url})`;
            lobbyScreen.style.backgroundSize = 'cover';
            lobbyScreen.style.backgroundPosition = 'center';
            localStorage.setItem('poker_lobby_bg', url);
        } else {
            lobbyScreen.style.backgroundImage = '';
            localStorage.removeItem('poker_lobby_bg');
        }
    });

    tableBgInput.addEventListener('input', (e) => {
        const url = e.target.value.trim();
        gameState.tableBg = url;
        if (url) {
            localStorage.setItem('poker_table_bg', url);
        } else {
            localStorage.removeItem('poker_table_bg');
        }
    });

    // Request lobby info
    socket.emit('joinLobby', {});
}

function updateJoinButton() {
    const hasName = playerNameInput.value.trim().length > 0;
    const hasTable = !!gameState.selectedTable;
    joinTableBtn.disabled = !(hasName && hasTable);
}

function joinTable() {
    const name = playerNameInput.value.trim();
    if (!name || !gameState.selectedTable) return alert('Provide name and select a table.');

    gameState.playerName = name;
    // Persist avatar choice
    localStorage.setItem('poker_avatar', gameState.avatar);

    // Emit join request (server should accept avatar property)
    socket.emit('joinTable', {
        tableId: gameState.selectedTable,
        name: gameState.playerName,
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
        // Prevent accidental action if disabled
        if (foldBtn.disabled) return;
        socket.emit('playerAction', {
            tableId: gameState.tableId,
            action: 'fold'
        });
    });

    checkCallBtn.addEventListener('click', () => {
        if (checkCallBtn.disabled) return;

        const currentPlayer = getCurrentPlayer();
        if (!currentPlayer || !gameState.currentGameState) return;

        const action = currentPlayer.bet < gameState.currentGameState.currentBet ? 'call' : 'check';
        socket.emit('playerAction', {
            tableId: gameState.tableId,
            action: action
        });
    });

    raiseBtn.addEventListener('click', () => {
        if (raiseBtn.disabled) return;
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

// Avatar modal functions
function openAvatarModal() {
    avatarModal.style.display = 'flex';
    avatarModal.setAttribute('aria-hidden', 'false');
    loadAvatars();
}

function closeAvatarModal() {
    avatarModal.style.display = 'none';
    avatarModal.setAttribute('aria-hidden', 'true');
}

// Fetch avatars list from /avatars/avatars.json and render
function loadAvatars() {
    avatarModalContent.innerHTML = '';
    avatarModalContent.appendChild(avatarModalLoading);
    avatarModalLoading.style.display = 'block';

    fetch('/avatars/avatars.json').then(res => {
        if (!res.ok) throw new Error('No avatar manifest');
        return res.json();
    }).then(list => {
        avatarModalLoading.style.display = 'none';
        if (!Array.isArray(list) || list.length === 0) {
            const msg = document.createElement('div');
            msg.className = 'avatar-empty';
            msg.textContent = 'No avatars found. Put images in public/avatars and run the generator or create avatars.json';
            avatarModalContent.appendChild(msg);
            return;
        }

        list.forEach((entry) => {
            // Normalize to path
            const src = entry.startsWith('/') || entry.startsWith('http') ? entry : `/avatars/${entry}`;
            const btn = document.createElement('button');
            btn.className = 'avatar-item';
            btn.type = 'button';

            const img = document.createElement('img');
            img.className = 'avatar-image';
            img.src = src;
            img.alt = 'avatar';

            btn.appendChild(img);

            btn.addEventListener('click', () => {
                // Single-click selects and closes modal (no confirm)
                gameState.avatar = src;
                localStorage.setItem('poker_avatar', src);
                updateAvatarPreview(src);
                closeAvatarModal();
            });

            avatarModalContent.appendChild(btn);
        });
    }).catch(err => {
        avatarModalLoading.style.display = 'none';
        avatarModalContent.innerHTML = '';
        const msg = document.createElement('div');
        msg.className = 'avatar-empty';
        msg.textContent = 'Could not load avatars. Ensure /public/avatars/avatars.json exists and is valid JSON.';
        avatarModalContent.appendChild(msg);
        console.error(err);
    });
}

function updateAvatarPreview(avatar) {
    // Clear preview
    avatarPreview.innerHTML = '';
    if (!avatar) {
        const placeholder = document.createElement('div');
        placeholder.className = 'avatar-placeholder';
        placeholder.textContent = '👤';
        avatarPreview.appendChild(placeholder);
        return;
    }

    // If avatar is an emoji (single char) show as text
    if (avatar.length <= 2 && !avatar.startsWith('/')) {
        const placeholder = document.createElement('div');
        placeholder.className = 'avatar-placeholder';
        placeholder.textContent = avatar;
        avatarPreview.appendChild(placeholder);
        return;
    }

    // Otherwise assume it's an image path
    const img = document.createElement('img');
    img.src = avatar;
    img.alt = 'avatar';
    img.className = 'avatar-preview-img';
    avatarPreview.appendChild(img);
}

// Socket Event Handlers
socket.on('lobbyJoined', (data) => {
    updateLobbyTables(data.tables);
});

socket.on('tableJoined', (data) => {
    gameState.tableId = data.tableId;
    gameState.playerId = data.playerId;
    gameState.currentGameState = data.gameState;

    // Apply table background if user set one
    if (gameState.tableBg) {
        gameScreen.style.backgroundImage = `url(${gameState.tableBg})`;
        gameScreen.style.backgroundSize = 'cover';
        gameScreen.style.backgroundPosition = 'center';
    } else {
        // default reset
        gameScreen.style.backgroundImage = '';
    }

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
    // restore lobby background from state
    if (gameState.lobbyBg) {
        lobbyScreen.style.backgroundImage = `url(${gameState.lobbyBg})`;
        lobbyScreen.style.backgroundSize = 'cover';
        lobbyScreen.style.backgroundPosition = 'center';
    } else {
        lobbyScreen.style.backgroundImage = '';
    }
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

    // Update action controls (enable/disable depending on turn)
    updateActionControls(state);

    // Update player hand
    updatePlayerHand(state);
}

// Minimal implementations or placeholders for functions referenced above.
// (Keep your existing implementations if present; these are safe hooks)
function updatePotDisplay(state) {
    // existing implementation should update pot UI
    // placeholder: no-op if not implemented
}

function updateCommunityCards(cards) {
    // existing implementation should update community card UI
}

function updatePlayers(state) {
    // existing implementation should update seats/player list
}

function updatePlayerHand(state) {
    // existing implementation should show the player's hole cards
}

// New: enable/disable action buttons based on active player's turn
function updateActionControls(state) {
    if (!state || !Array.isArray(state.players) || typeof state.currentPlayerIndex === 'undefined') {
        // default: disable controls
        foldBtn.disabled = true;
        checkCallBtn.disabled = true;
        raiseBtn.disabled = true;
        raiseAmount.disabled = true;
        raiseSlider.disabled = true;
        return;
    }

    const activePlayer = state.players[state.currentPlayerIndex];
    const isActive = activePlayer && activePlayer.id === gameState.playerId;

    foldBtn.disabled = !isActive;
    checkCallBtn.disabled = !isActive;
    raiseBtn.disabled = !isActive;
    raiseAmount.disabled = !isActive;
    raiseSlider.disabled = !isActive;

    // Update check/call label depending on whether the local player must call
    const localPlayer = state.players.find(p => p.id === gameState.playerId);
    if (localPlayer) {
        if (localPlayer.bet < state.currentBet) {
            checkCallBtn.textContent = 'Call';
        } else {
            checkCallBtn.textContent = 'Check';
        }
    } else {
        checkCallBtn.textContent = 'Check / Call';
    }
}

// Winner UI
function showWinners(winners) {
    winnerDisplay.textContent = 'Winner(s): ' + winners.map(w => w.name).join(', ');
    winnerDisplay.style.display = 'block';
}
function hideWinners() {
    winnerDisplay.style.display = 'none';
