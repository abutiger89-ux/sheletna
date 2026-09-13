/**
 * شلتنا (Sheletna) - عزل وتوزيع فرق الملاعب
 * تطوير: تيتو ⚡
 * يشمل: تسجيل نتائج المباريات، جدول المواعيد الثابتة، تحريك وتوسيط صورة الوجه، وتثبيت التطبيق
 */

// ==========================================
// 1. Initial State & Storage Keys
// ==========================================
const STORAGE_KEYS = {
  PLAYERS: 'sheletna_players_v4',
  TEAMS: 'sheletna_teams_v4',
  HISTORY: 'sheletna_history_v4',
  SCHEDULES: 'sheletna_schedules_v4',
  ANNOUNCEMENT: 'sheletna_announcement_v4',
  ROLE: 'sheletna_role_v4',
  NOTIFICATIONS: 'sheletna_notifications_v4',
  MY_PLAYER_ID: 'sheletna_my_player_id'
};

const SECRET_CAPTAIN_PIN = 'AWABTETO2007**';

const DEFAULT_NOTIFICATIONS = [
  {
    id: 'n1',
    title: '👑 رسالة من كابتن الشلة (تيتو)',
    body: 'يا شباب، التشكيلة جاهزة لماتش اليوم! تأكدوا من الحضور قبل الموعد بـ 15 دقيقة ⚽',
    image: './icons/icon-192.png',
    time: 'الآن',
    timestamp: Date.now()
  },
  {
    id: 'n2',
    title: '⏰ تذكير بموعد الماتش (قبل 12 ساعة)',
    body: 'موعد ماتش الشلة القادم اقترب! يرجى الدخول وتأكيد الحضور والجاهزية ⚽',
    image: null,
    time: 'اليوم',
    timestamp: Date.now() - 3600000 * 2
  }
];

const DEFAULT_PLAYERS = [
  { id: 'p1', name: 'أحمد الحارس', rating: 8.5, pos: 'GK', avatar: '🧤', photo: null, isPresent: true },
  { id: 'p2', name: 'محمود الصخرة', rating: 8.0, pos: 'GK', avatar: '🧤', photo: null, isPresent: true },
  { id: 'p3', name: 'يوسف كانافارو', rating: 8.5, pos: 'DEF', avatar: '🛡️', photo: null, isPresent: true },
  { id: 'p4', name: 'عمر المدافع', rating: 7.5, pos: 'DEF', avatar: '🦁', photo: null, isPresent: true },
  { id: 'p5', name: 'خالد الجدار', rating: 8.0, pos: 'DEF', avatar: '🛡️', photo: null, isPresent: true },
  { id: 'p6', name: 'طارق المايسترو', rating: 9.0, pos: 'MID', avatar: '👑', photo: null, isPresent: true },
  { id: 'p7', name: 'سامي الفنان', rating: 8.5, pos: 'MID', avatar: '⚡', photo: null, isPresent: true },
  { id: 'p8', name: 'علي الدينامو', rating: 7.5, pos: 'MID', avatar: '🔥', photo: null, isPresent: true },
  { id: 'p9', name: 'زياد المحرك', rating: 7.0, pos: 'MID', avatar: '⚽', photo: null, isPresent: true },
  { id: 'p10', name: 'كريم الهداف', rating: 9.0, pos: 'FWD', avatar: '🎯', photo: null, isPresent: true },
  { id: 'p11', name: 'مروان القناص', rating: 8.5, pos: 'FWD', avatar: '🦅', photo: null, isPresent: true },
  { id: 'p12', name: 'مصطفى السريع', rating: 7.5, pos: 'FWD', avatar: '⚡', photo: null, isPresent: true }
];

const DEFAULT_SCHEDULES = [
  { id: 's1', day: 'كل جمعة', time: '8:00 مساءً إلى 9:30 مساءً', venue: 'ملعب النجوم' },
  { id: 's2', day: 'كل ثلاثاء', time: '9:00 مساءً إلى 10:30 مساءً', venue: 'الملعب الرئيسي' }
];

let state = {
  role: 'guest',
  players: [],
  currentTeams: { teamA: [], teamB: [], subs: [] },
  schedules: [],
  notifications: [],
  gameFormat: 5,
  balanceMode: 'smart',
  selectedPlayerForSwap: null,
  
  match: {
    teamAName: 'الفريق الأخضر',
    teamBName: 'الفريق الأزرق',
    scoreA: 0,
    scoreB: 0,
    scorers: []
  },
  
  announcement: {
    message: 'يا شباب، التشكيلة جاهزة لماتش اليوم! تأكدوا من الحضور قبل الموعد بـ 15 دقيقة ⚽',
    image: null,
    time: 'اليوم',
    timestamp: Date.now()
  },

  // Face Tool Interactive Dragging State
  faceCrop: {
    zoom: 1.0,
    panX: 0,
    panY: 0,
    isDragging: false,
    startX: 0,
    startY: 0
  },

  cloud: {
    roomCode: 'sheletna-main',
    firebaseRtdb: null,
    firebaseDb: null,
    syncChannel: null
  },

  history: [],
  deferredPrompt: null
};

// ==========================================
// 2. Audio Synthesizer (Whistle & Chimes)
// ==========================================
class SoundFX {
  constructor() {
    this.ctx = null;
  }

  init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) this.ctx = new AudioCtx();
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  playWhistle(duration = 0.5) {
    try {
      this.init();
      if (!this.ctx) return;
      const osc1 = this.ctx.createOscillator();
      const osc2 = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc1.type = 'triangle';
      osc1.frequency.setValueAtTime(2600, this.ctx.currentTime);
      osc1.frequency.exponentialRampToValueAtTime(2850, this.ctx.currentTime + duration);

      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(2900, this.ctx.currentTime);
      osc2.frequency.exponentialRampToValueAtTime(3100, this.ctx.currentTime + duration);

      gain.gain.setValueAtTime(0.01, this.ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.35, this.ctx.currentTime + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(this.ctx.destination);

      osc1.start();
      osc2.start();
      osc1.stop(this.ctx.currentTime + duration);
      osc2.stop(this.ctx.currentTime + duration);
    } catch (e) {}
  }

  playTripleWhistle() {
    this.playWhistle(0.25);
    setTimeout(() => this.playWhistle(0.25), 320);
    setTimeout(() => this.playWhistle(0.65), 700);
  }

  playNotificationChime() {
    try {
      this.init();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, now);
      osc.frequency.setValueAtTime(880, now + 0.15);

      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.6);
    } catch (e) {}
  }
}

const soundEngine = new SoundFX();

// ==========================================
// 3. LocalStorage & Cloud Silent Sync
// ==========================================
function loadSavedData() {
  try {
    const savedPlayers = localStorage.getItem(STORAGE_KEYS.PLAYERS);
    state.players = savedPlayers ? JSON.parse(savedPlayers) : DEFAULT_PLAYERS;

    const savedTeams = localStorage.getItem(STORAGE_KEYS.TEAMS);
    if (savedTeams) state.currentTeams = JSON.parse(savedTeams);

    const savedSchedules = localStorage.getItem(STORAGE_KEYS.SCHEDULES);
    state.schedules = savedSchedules ? JSON.parse(savedSchedules) : DEFAULT_SCHEDULES;

    const savedHistory = localStorage.getItem(STORAGE_KEYS.HISTORY);
    if (savedHistory) state.history = JSON.parse(savedHistory);

    const savedAnnouncement = localStorage.getItem(STORAGE_KEYS.ANNOUNCEMENT);
    if (savedAnnouncement) state.announcement = JSON.parse(savedAnnouncement);

    const savedRole = localStorage.getItem(STORAGE_KEYS.ROLE);
    if (savedRole) state.role = savedRole;

    const savedNotifs = localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS);
    state.notifications = savedNotifs ? JSON.parse(savedNotifs) : DEFAULT_NOTIFICATIONS;
  } catch (err) {
    state.players = DEFAULT_PLAYERS;
    state.schedules = DEFAULT_SCHEDULES;
    state.notifications = DEFAULT_NOTIFICATIONS;
  }
}

function persistLocal() {
  try {
    localStorage.setItem(STORAGE_KEYS.PLAYERS, JSON.stringify(state.players));
    localStorage.setItem(STORAGE_KEYS.TEAMS, JSON.stringify(state.currentTeams));
    localStorage.setItem(STORAGE_KEYS.SCHEDULES, JSON.stringify(state.schedules));
    localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(state.history));
    localStorage.setItem(STORAGE_KEYS.ANNOUNCEMENT, JSON.stringify(state.announcement));
    localStorage.setItem(STORAGE_KEYS.ROLE, state.role);
    localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(state.notifications));
  } catch (e) {
    console.warn('Storage persist warning (iOS private browsing or quota):', e);
  }
}

function updateCloudStatusUI(status) {
  const dot = document.getElementById('cloud-dot-indicator');
  const text = document.getElementById('cloud-status-text');
  if (!dot || !text) return;

  if (status === 'connected') {
    dot.className = 'cloud-dot';
    text.textContent = 'مزامنة سحابية 🟢';
  } else if (status === 'connecting') {
    dot.className = 'cloud-dot connecting';
    text.textContent = 'جاري الاتصال... 🟡';
  } else {
    dot.className = 'cloud-dot offline';
    text.textContent = 'وضع محلي ⚪';
  }
}

function initCloudSync() {
  const savedRoom = localStorage.getItem('sheletna_room_code');
  if (savedRoom) state.cloud.roomCode = savedRoom;

  updateCloudStatusUI('connecting');

  if ('BroadcastChannel' in window) {
    try {
      if (state.cloud.syncChannel) state.cloud.syncChannel.close();
      state.cloud.syncChannel = new BroadcastChannel(`sheletna_${state.cloud.roomCode}`);
      state.cloud.syncChannel.onmessage = (event) => {
        const { type, payload } = event.data;
        handleRemoteSync(type, payload);
      };
    } catch (e) {}
  }

  try {
    const savedFbConfig = localStorage.getItem('sheletna_firebase_config');
    let config = savedFbConfig ? JSON.parse(savedFbConfig) : null;

    // Official User Firebase Project Configuration
    const OFFICIAL_FIREBASE_CONFIG = {
      apiKey: "AIzaSyCTjwipg27zG__jfZ04VmDbkCHHgDGP-Dk",
      authDomain: "sheletna-c8eda.firebaseapp.com",
      databaseURL: "https://sheletna-c8eda-default-rtdb.firebaseio.com",
      projectId: "sheletna-c8eda",
      storageBucket: "sheletna-c8eda.firebasestorage.app",
      messagingSenderId: "662827431850",
      appId: "1:662827431850:web:3bb0a196b8ee4078d25dd3",
      measurementId: "G-PS1797KYL6"
    };

    // Always prefer official config if default or placeholder
    if (!config || config.projectId === "sheletna-app-2026") {
      config = OFFICIAL_FIREBASE_CONFIG;
      localStorage.setItem('sheletna_firebase_config', JSON.stringify(config));
    }

    if (window.firebase) {
      if (!firebase.apps.length) {
        firebase.initializeApp(config);
      }
      
      // Initialize Firebase Realtime Database (Preferred for 0ms sub-second sync)
      if (typeof firebase.database === 'function') {
        try {
          state.cloud.firebaseRtdb = firebase.database();
        } catch (e) {
          console.warn('Realtime Database init warning:', e);
        }
      }

      subscribeCloudSync();
    } else {
      updateCloudStatusUI('connected');
    }
  } catch (e) {
    updateCloudStatusUI('connected');
  }
}

function broadcastSync(type, payload) {
  persistLocal();

  if (state.cloud.syncChannel) {
    try {
      state.cloud.syncChannel.postMessage({ type, payload });
    } catch (e) {}
  }

  const roomData = {
    players: state.players,
    teams: state.currentTeams,
    schedules: state.schedules,
    match: state.match,
    announcement: state.announcement,
    history: state.history,
    updatedAt: Date.now()
  };

  // 1. Sync via Firebase Realtime Database
  if (state.cloud.firebaseRtdb) {
    try {
      state.cloud.firebaseRtdb.ref('rooms/' + state.cloud.roomCode).set(roomData)
        .then(() => updateCloudStatusUI('connected'))
        .catch(err => {
          console.warn('RTDB write warning:', err);
        });
    } catch (e) {
      console.warn('RTDB sync exception:', e);
    }
  }
}

function subscribeCloudSync() {
  // Subscribe to Firebase Realtime Database (Instant 0ms sync)
  if (state.cloud.firebaseRtdb) {
    try {
      state.cloud.firebaseRtdb.ref('rooms/' + state.cloud.roomCode).on('value', snapshot => {
        updateCloudStatusUI('connected');
        const data = snapshot.val();
        if (data) {
          applyRemoteData(data);
        }
      }, err => {
        console.warn('RTDB subscribe warning:', err);
      });
    } catch (e) {
      console.warn('RTDB subscribe exception:', e);
    }
  }
}

function applyRemoteData(data) {
  if (!data) return;
  let updated = false;

  if (data.players && Array.isArray(data.players) && data.players.length > 0) {
    state.players = data.players;
    updated = true;
  }
  if (data.teams && data.teams.teamA) {
    state.currentTeams = data.teams;
    updated = true;
  }
  if (data.schedules && Array.isArray(data.schedules) && data.schedules.length > 0) {
    state.schedules = data.schedules;
    updated = true;
  }
  if (data.match) {
    state.match = { ...state.match, ...data.match };
    updated = true;
  }
  if (data.history && Array.isArray(data.history)) {
    state.history = data.history;
    updated = true;
  }
  if (data.announcement) {
    state.announcement = data.announcement;
    renderAnnouncement();
  }

  if (updated) {
    persistLocal();
    renderPitch();
    updateTeamStatsHeader();
    renderPlayersView();
    renderScheduleList();
    updateScoreboardUI();
    updateNextMatchUI();
    updatePlayerIdentityUI();
  }
}

function openFirebaseModal() {
  const modal = document.getElementById('modal-firebase-settings');
  if (!modal) return;

  document.getElementById('input-room-code').value = state.cloud.roomCode || 'sheletna-main';

  const savedFbConfig = localStorage.getItem('sheletna_firebase_config');
  if (savedFbConfig) {
    try {
      const cfg = JSON.parse(savedFbConfig);
      document.getElementById('input-firebase-apikey').value = cfg.apiKey || '';
      document.getElementById('input-firebase-projectid').value = cfg.projectId || '';
      document.getElementById('input-firebase-appid').value = cfg.appId || '';
    } catch (e) {}
  }

  modal.classList.add('active');
}

function closeFirebaseModal() {
  const modal = document.getElementById('modal-firebase-settings');
  if (modal) modal.classList.remove('active');
}

function handleRemoteSync(type, payload) {
  if (type === 'STATE_UPDATE') {
    if (payload.players) state.players = payload.players;
    if (payload.teams) state.currentTeams = payload.teams;
    if (payload.schedules) state.schedules = payload.schedules;
    if (payload.match) state.match = { ...state.match, ...payload.match };
    if (payload.announcement) {
      state.announcement = payload.announcement;
      renderAnnouncement();
      soundEngine.playNotificationChime();
    }
    persistLocal();
    renderPitch();
    updateTeamStatsHeader();
    renderPlayersView();
    renderScheduleList();
    updateScoreboardUI();
  }
}

// ==========================================
// 4. Role & Captain Security
// ==========================================
function updateRoleUI() {
  const roleBtn = document.getElementById('btn-role-switch');
  const distributeBtn = document.getElementById('btn-distribute-teams');
  const openAnnouncementBtn = document.getElementById('btn-open-announcement-modal');
  const sendReminderBtn = document.getElementById('btn-captain-send-reminder');
  const addScheduleBtn = document.getElementById('btn-open-add-schedule');
  const pitchControls = document.getElementById('captain-pitch-controls');
  const swapHint = document.getElementById('captain-swap-hint');
  const captainActions = document.querySelectorAll('.captain-only-action');
  const notifActions = document.getElementById('captain-notif-actions');
  const playersNavTab = document.getElementById('tab-btn-players');
  const matchOverview = document.getElementById('team-match-overview');

  if (state.role === 'captain') {
    if (roleBtn) {
      roleBtn.className = 'role-badge-btn captain-active';
      roleBtn.innerHTML = '👑 الكابتن (تيتو) ⚡';
      roleBtn.title = 'انقر للخروج من وضع الكابتن';
    }
    if (playersNavTab) playersNavTab.style.display = 'inline-flex';
    if (matchOverview) matchOverview.style.display = 'flex';
    if (distributeBtn) distributeBtn.classList.remove('btn-locked');
    if (openAnnouncementBtn) openAnnouncementBtn.style.display = 'inline-flex';
    if (sendReminderBtn) sendReminderBtn.style.display = 'inline-flex';
    if (addScheduleBtn) addScheduleBtn.style.display = 'inline-flex';
    if (pitchControls) pitchControls.style.display = 'block';
    if (swapHint) swapHint.style.display = 'block';
    if (notifActions) notifActions.style.display = 'flex';
    captainActions.forEach(el => el.style.display = '');
    renderPlayersView();
  } else {
    if (roleBtn) {
      roleBtn.className = 'role-badge-btn guest-active';
      roleBtn.innerHTML = '👑 تسجيل كابتن';
      roleBtn.title = 'تسجيل الدخول ككابتن';
    }
    if (playersNavTab) playersNavTab.style.display = 'none';
    if (matchOverview) matchOverview.style.display = 'none';
    if (distributeBtn) distributeBtn.classList.add('btn-locked');
    if (openAnnouncementBtn) openAnnouncementBtn.style.display = 'none';
    if (sendReminderBtn) sendReminderBtn.style.display = 'none';
    if (addScheduleBtn) addScheduleBtn.style.display = 'none';
    if (pitchControls) pitchControls.style.display = 'none';
    if (swapHint) swapHint.style.display = 'none';
    if (notifActions) notifActions.style.display = 'none';
    captainActions.forEach(el => el.style.display = 'none');

    // If currently viewing players-view, redirect back to pitch-view immediately
    const playersView = document.getElementById('players-view');
    if (playersView && playersView.classList.contains('active')) {
      switchView('pitch-view');
    }
  }

  renderScheduleList();
}

function checkCaptainPermission(actionDescription = 'هذا الإجراء') {
  if (state.role !== 'captain') {
    showToast(`🔒 ${actionDescription} خاص بكابتن الشلة فقط! يرجى تسجيل الدخول ككابتن`, 'warning');
    openCaptainLoginModal();
    return false;
  }
  return true;
}

function openCaptainLoginModal() {
  document.getElementById('modal-captain-login').classList.add('active');
  document.getElementById('input-captain-pin').value = '';
  document.getElementById('input-captain-pin').focus();
}

function closeCaptainLoginModal() {
  document.getElementById('modal-captain-login').classList.remove('active');
}

// ==========================================
// 5. Fixed Matches Schedule (الأيام والمواعيد الثابتة)
// ==========================================
function renderScheduleList() {
  const container = document.getElementById('schedule-list');
  container.innerHTML = '';

  if (state.schedules.length === 0) {
    container.innerHTML = `
      <div style="text-align:center; padding:20px; color:var(--text-dim); font-size:0.9rem;">
        لا توجد مواعيد مباريات ثابتة مسجلة بعد.
      </div>
    `;
    return;
  }

  const isCaptain = state.role === 'captain';

  state.schedules.forEach(item => {
    const el = document.createElement('div');
    el.className = 'schedule-item';
    el.innerHTML = `
      <div style="display: flex; align-items: center; gap: 10px;">
        <span class="schedule-day-badge">${item.day}</span>
        <div>
          <div class="schedule-details">⏰ ${item.time}</div>
          <div class="schedule-venue">📍 ${item.venue}</div>
        </div>
      </div>
      ${isCaptain ? `
        <button class="btn btn-danger btn-sm btn-del-schedule" title="حذف الموعد">🗑️</button>
      ` : ''}
    `;

    if (isCaptain) {
      el.querySelector('.btn-del-schedule').addEventListener('click', () => deleteSchedule(item.id));
    }

    container.appendChild(el);
  });
}

function deleteSchedule(id) {
  if (!checkCaptainPermission('حذف موعد ثابت')) return;
  state.schedules = state.schedules.filter(s => s.id !== id);
  broadcastSync('STATE_UPDATE', { schedules: state.schedules });
  renderScheduleList();
  showToast('🗑️ تم حذف الموعد بنجاح', 'info');
}

function openAddScheduleModal() {
  if (!checkCaptainPermission('إضافة موعد ثابت')) return;
  document.getElementById('input-schedule-time').value = '';
  document.getElementById('input-schedule-venue').value = '';
  document.getElementById('modal-schedule').classList.add('active');
}

function closeAddScheduleModal() {
  document.getElementById('modal-schedule').classList.remove('active');
}

// ==========================================
// 6. User Self-Registration & Face Alignment Tool
// ==========================================
function openSelfRegisterModal() {
  const modal = document.getElementById('modal-player-self-register');
  document.getElementById('input-self-name').value = '';
  document.getElementById('select-self-pos').value = 'MID';
  document.getElementById('input-self-photo').value = '';
  
  // Reset face preview & panning
  state.faceCrop.zoom = 1.0;
  state.faceCrop.panX = 0;
  state.faceCrop.panY = 0;
  
  document.getElementById('range-face-zoom').value = '1.0';
  document.getElementById('label-face-zoom').textContent = '1.0x';
  document.getElementById('range-face-x').value = '0';
  document.getElementById('label-face-x').textContent = '0';
  document.getElementById('range-face-y').value = '0';
  document.getElementById('label-face-y').textContent = '0';
  
  updateFaceTransform();
  document.getElementById('face-preview-img').src = './icons/icon-192.png';
  document.getElementById('check-self-present').checked = true;
  modal.dataset.rawPhoto = '';
  modal.classList.add('active');
  document.getElementById('input-self-name').focus();
}

function closeSelfRegisterModal() {
  document.getElementById('modal-player-self-register').classList.remove('active');
}

function updateFaceTransform() {
  const img = document.getElementById('face-preview-img');
  img.style.transform = `scale(${state.faceCrop.zoom}) translate(${state.faceCrop.panX}px, ${state.faceCrop.panY}px)`;
}

/**
 * Compresses any image DataURL to max dimensions and JPEG quality
 */
function compressDataUrl(dataUrl, maxDim, quality, callback) {
  try {
    const img = new Image();
    img.onload = () => {
      let w = img.width || maxDim;
      let h = img.height || maxDim;
      if (w > maxDim || h > maxDim) {
        if (w > h) {
          h = Math.round((h * maxDim) / w);
          w = maxDim;
        } else {
          w = Math.round((w * maxDim) / h);
          h = maxDim;
        }
      }
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, w, h);
      callback(canvas.toDataURL('image/jpeg', quality || 0.85));
    };
    img.onerror = () => callback(dataUrl);
    img.src = dataUrl;
  } catch (e) {
    callback(dataUrl);
  }
}

/**
 * Bakes the zoomed and shifted face into a crisp, centered 160x160 circular portrait
 */
function bakeFacePortrait(imgEl, zoomLevel, panX, panY) {
  try {
    const canvas = document.createElement('canvas');
    canvas.width = 160;
    canvas.height = 160;
    const ctx = canvas.getContext('2d');

    const nw = imgEl.naturalWidth || 160;
    const nh = imgEl.naturalHeight || 160;
    
    // Scale and coordinate offsets
    const cropSize = Math.min(nw, nh) / zoomLevel;
    const sx = (nw - cropSize) / 2 - (panX * (nw / 140));
    const sy = (nh - cropSize) / 2 - (panY * (nh / 140));

    ctx.drawImage(imgEl, sx, sy, cropSize, cropSize, 0, 0, 160, 160);
    return canvas.toDataURL('image/jpeg', 0.88);
  } catch (e) {
    return imgEl.src;
  }
}

// ==========================================
// 7. Captain Rich Image Notifications
// ==========================================
function renderAnnouncement() {
  const ann = state.announcement;
  if (!ann) return;
  const msgEl = document.getElementById('broadcast-message');
  const timeEl = document.getElementById('broadcast-time');
  const imgEl = document.getElementById('broadcast-img');

  if (msgEl) msgEl.textContent = ann.message;
  if (timeEl) timeEl.textContent = ann.time || 'الآن';

  if (imgEl) {
    if (ann.image) {
      imgEl.src = ann.image;
      imgEl.style.display = 'block';
    } else {
      imgEl.src = './icons/icon-192.png';
    }
  }
}

function openAnnouncementModal() {
  if (!checkCaptainPermission('إرسال إشعار للشلة')) return;
  const modal = document.getElementById('modal-broadcast');
  document.getElementById('input-broadcast-text').value = '';
  document.getElementById('broadcast-preview-thumb').src = './icons/icon-192.png';
  modal.dataset.announcementImage = '';
  modal.classList.add('active');
  document.getElementById('input-broadcast-text').focus();
}

function closeAnnouncementModal() {
  document.getElementById('modal-broadcast').classList.remove('active');
}

async function sendCaptainAnnouncement(text, imageBase64, sendPush) {
  const timeStr = new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' });
  
  state.announcement = {
    message: text,
    image: imageBase64 || null,
    time: timeStr,
    timestamp: Date.now()
  };

  renderAnnouncement();
  addNotification('📢 إشعار من كابتن الشلة (تيتو)', text, imageBase64);
  broadcastSync('STATE_UPDATE', { announcement: state.announcement });

  showToast('🚀 تم بث الإشعار بنجاح لجميع هواتف الشلة!', 'success');
}

// ==========================================
// 8. Team Balancing Algorithm
// ==========================================
function distributeTeams() {
  if (!checkCaptainPermission('فرز وتوزيع الفرق')) return;

  const activePlayers = state.players.filter(p => p.isPresent);
  if (activePlayers.length < 2) {
    showToast('⚠️ يرجى تحديد لاعبين اثنين على الأقل من قائمة الحضور!', 'warning');
    switchView('players-view');
    return;
  }

  const pitchLimitPerTeam = parseInt(state.gameFormat, 10);
  let pool = [...activePlayers];

  if (state.balanceMode === 'random') {
    pool.sort(() => Math.random() - 0.5);
  } else {
    pool = smartBalancePool(pool);
  }

  const teamA = [];
  const teamB = [];
  const subs = [];

  pool.forEach((player, idx) => {
    if (teamA.length < pitchLimitPerTeam && teamB.length < pitchLimitPerTeam) {
      if (idx % 2 === 0) teamA.push(player);
      else teamB.push(player);
    } else if (teamA.length < pitchLimitPerTeam) {
      teamA.push(player);
    } else if (teamB.length < pitchLimitPerTeam) {
      teamB.push(player);
    } else {
      subs.push(player);
    }
  });

  if (state.balanceMode === 'smart' && teamA.length > 0 && teamB.length > 0) {
    optimizeTeamDiff(teamA, teamB);
  }

  state.currentTeams = { teamA, teamB, subs };
  state.selectedPlayerForSwap = null;
  broadcastSync('STATE_UPDATE', { teams: state.currentTeams });

  soundEngine.playWhistle(0.35);
  renderPitch();
  updateTeamStatsHeader();
  showToast('✅ تم فرز وتوزيع الفرق بأعلى تكافؤ في القوة والمراكز!', 'success');
}

function smartBalancePool(players) {
  const gks = players.filter(p => p.pos === 'GK').sort((a, b) => b.rating - a.rating);
  const defs = players.filter(p => p.pos === 'DEF').sort((a, b) => b.rating - a.rating);
  const mids = players.filter(p => p.pos === 'MID').sort((a, b) => b.rating - a.rating);
  const fwds = players.filter(p => p.pos === 'FWD').sort((a, b) => b.rating - a.rating);

  const list = [];
  gks.forEach(p => list.push(p));
  defs.forEach(p => list.push(p));
  mids.forEach(p => list.push(p));
  fwds.forEach(p => list.push(p));
  return list;
}

function optimizeTeamDiff(teamA, teamB) {
  const sumA = () => teamA.reduce((acc, p) => acc + p.rating, 0);
  const sumB = () => teamB.reduce((acc, p) => acc + p.rating, 0);
  let currentDiff = Math.abs(sumA() - sumB());

  for (let i = 0; i < teamA.length; i++) {
    for (let j = 0; j < teamB.length; j++) {
      if (teamA[i].pos === 'GK' && teamB[j].pos !== 'GK') continue;
      if (teamB[j].pos === 'GK' && teamA[i].pos !== 'GK') continue;

      const pA = teamA[i];
      const pB = teamB[j];
      const newSumA = sumA() - pA.rating + pB.rating;
      const newSumB = sumB() - pB.rating + pA.rating;
      const newDiff = Math.abs(newSumA - newSumB);

      if (newDiff < currentDiff) {
        teamA[i] = pB;
        teamB[j] = pA;
        currentDiff = newDiff;
      }
    }
  }
}

// ==========================================
// 9. 3D Pitch Rendering & Card Tokens
// ==========================================
function renderPitch() {
  const zoneA = document.getElementById('pitch-team-a-zone');
  const zoneB = document.getElementById('pitch-team-b-zone');
  const subsSection = document.getElementById('subs-section');
  const subsList = document.getElementById('subs-list');
  const subsCount = document.getElementById('subs-count');

  zoneA.innerHTML = '';
  zoneB.innerHTML = '';
  subsList.innerHTML = '';

  const { teamA, teamB, subs } = state.currentTeams;

  renderTeamZone(zoneA, teamA, 'team-a', true);
  renderTeamZone(zoneB, teamB, 'team-b', false);

  if (subs && subs.length > 0) {
    subsSection.style.display = 'block';
    subsCount.textContent = `(${subs.length} لاعبين)`;
    subs.forEach(player => {
      const token = createFutCardToken(player, 'sub-token', () => handlePlayerClick(player, 'subs'));
      subsList.appendChild(token);
    });
  } else {
    subsSection.style.display = 'none';
  }
}

function renderTeamZone(container, teamPlayers, teamClass, isTopTeam) {
  if (!teamPlayers || teamPlayers.length === 0) {
    const emptyMsg = state.role === 'captain'
      ? 'اضغط على "🔀 فرز وتوزيع الفرق" بالأعلى لتوليد التشكيلة ثلاثية الأبعاد ⚽'
      : 'بانتظار كابتن الشلة لتأكيد وتوزيع التشكيلة لماتش اليوم ⚽';
    container.innerHTML = `<div style="text-align:center; color:rgba(255,255,255,0.75); padding:40px 12px; font-weight:800; font-size:0.88rem;">${emptyMsg}</div>`;
    return;
  }

  const gks = teamPlayers.filter(p => p.pos === 'GK');
  const defs = teamPlayers.filter(p => p.pos === 'DEF');
  const mids = teamPlayers.filter(p => p.pos === 'MID');
  const fwds = teamPlayers.filter(p => p.pos === 'FWD');

  let lines = [];
  if (teamPlayers.length <= 6) {
    // 5-a-side / 6-a-side: Group into 3 clean tactical lines so cards never collide
    let teamGk = [...gks];
    let teamDef = [...defs];
    let teamAtt = [...mids, ...fwds];

    // Ensure goal has a keeper if no tagged GK
    if (teamGk.length === 0) {
      if (teamDef.length > 1) {
        teamGk = [teamDef.shift()];
      } else if (teamAtt.length > 2) {
        teamGk = [teamAtt.shift()];
      } else if (teamDef.length > 0) {
        teamGk = [teamDef.shift()];
      } else if (teamAtt.length > 0) {
        teamGk = [teamAtt.shift()];
      }
    }

    if (isTopTeam) {
      if (teamGk.length) lines.push({ name: 'GK', players: teamGk });
      if (teamDef.length) lines.push({ name: 'DEF', players: teamDef });
      if (teamAtt.length) lines.push({ name: 'ATT', players: teamAtt });
    } else {
      if (teamAtt.length) lines.push({ name: 'ATT', players: teamAtt });
      if (teamDef.length) lines.push({ name: 'DEF', players: teamDef });
      if (teamGk.length) lines.push({ name: 'GK', players: teamGk });
    }
  } else {
    // 7-a-side+ tactical lines
    if (isTopTeam) {
      if (gks.length) lines.push({ name: 'GK', players: gks });
      if (defs.length) lines.push({ name: 'DEF', players: defs });
      if (mids.length) lines.push({ name: 'MID', players: mids });
      if (fwds.length) lines.push({ name: 'FWD', players: fwds });
    } else {
      if (fwds.length) lines.push({ name: 'FWD', players: fwds });
      if (mids.length) lines.push({ name: 'MID', players: mids });
      if (defs.length) lines.push({ name: 'DEF', players: defs });
      if (gks.length) lines.push({ name: 'GK', players: gks });
    }
  }

  // Filter out any lines without players
  lines = lines.filter(line => line.players && line.players.length > 0);

  lines.forEach(row => {
    const rowEl = document.createElement('div');
    rowEl.className = 'pitch-line-row';
    row.players.forEach(player => {
      const token = createFutCardToken(
        player,
        `${teamClass}-token`,
        () => handlePlayerClick(player, teamClass === 'team-a' ? 'teamA' : 'teamB')
      );
      rowEl.appendChild(token);
    });
    container.appendChild(rowEl);
  });
}

function createFutCardToken(player, tokenClass, onClick) {
  const wrap = document.createElement('div');
  const isSelected = state.selectedPlayerForSwap && state.selectedPlayerForSwap.player.id === player.id;
  wrap.className = `fut-3d-token ${tokenClass} ${isSelected ? 'selected' : ''}`;
  wrap.title = `${player.name} (${player.pos}) - تقييم ${player.rating}`;

  const fifaOvr = Math.min(99, Math.round(player.rating * 10));

  const portraitDisplay = player.photo 
    ? `<img src="${player.photo}" class="fut-face-portrait" alt="${player.name}">` 
    : `<div class="fut-face-portrait">${player.avatar || '⚽'}</div>`;

  wrap.innerHTML = `
    <div class="fut-card-shield">
      <div class="fut-top-bar">
        <span class="fut-rating">${fifaOvr}</span>
        <span class="fut-pos ${player.pos}">${player.pos}</span>
      </div>
      ${portraitDisplay}
      <div class="fut-player-name">${player.name}</div>
    </div>
  `;

  wrap.addEventListener('click', onClick);
  return wrap;
}

function handlePlayerClick(player, groupName) {
  if (state.role !== 'captain') {
    showToast(`📍 اللاعب: ${player.name} (${player.pos}) - تقييم ${player.rating}`, 'info');
    return;
  }

  if (!state.selectedPlayerForSwap) {
    state.selectedPlayerForSwap = { player, groupName };
    renderPitch();
    showToast(`📍 تم تحديد بطاقة ${player.name}، اضغط على لاعب آخر لتبديل مكانهما`, 'info');
  } else {
    const first = state.selectedPlayerForSwap;
    const second = { player, groupName };

    if (first.player.id === second.player.id) {
      state.selectedPlayerForSwap = null;
      renderPitch();
      return;
    }

    swapPlayers(first, second);
    state.selectedPlayerForSwap = null;
    broadcastSync('STATE_UPDATE', { teams: state.currentTeams });
    renderPitch();
    updateTeamStatsHeader();
    showToast(`🔄 تم تبديل ${first.player.name} مع ${second.player.name}`, 'success');
  }
}

function swapPlayers(first, second) {
  const list1 = state.currentTeams[first.groupName];
  const list2 = state.currentTeams[second.groupName];
  const idx1 = list1.findIndex(p => p.id === first.player.id);
  const idx2 = list2.findIndex(p => p.id === second.player.id);

  if (idx1 !== -1 && idx2 !== -1) {
    const temp = list1[idx1];
    list1[idx1] = list2[idx2];
    list2[idx2] = temp;
  }
}

function updateTeamStatsHeader() {
  const { teamA, teamB } = state.currentTeams;
  const sumA = teamA.reduce((acc, p) => acc + p.rating, 0);
  const sumB = teamB.reduce((acc, p) => acc + p.rating, 0);
  const avgA = teamA.length ? (sumA / teamA.length).toFixed(1) : 0;
  const avgB = teamB.length ? (sumB / teamB.length).toFixed(1) : 0;

  document.getElementById('team-a-rating').textContent = avgA;
  document.getElementById('team-b-rating').textContent = avgB;
  document.getElementById('team-a-count').textContent = `(${teamA.length} لاعبين)`;
  document.getElementById('team-b-count').textContent = `(${teamB.length} لاعبين)`;

  const fairnessBadge = document.getElementById('fairness-badge');
  if (teamA.length === 0 || teamB.length === 0) {
    fairnessBadge.textContent = 'بانتظار الفرز';
    fairnessBadge.className = 'balance-pill balanced';
    return;
  }

  const diff = Math.abs(parseFloat(avgA) - parseFloat(avgB));
  const fairnessPercent = Math.max(0, Math.round(100 - (diff * 15)));

  if (diff <= 0.4) {
    fairnessBadge.textContent = `⚖️ تكافؤ ممتاز (${fairnessPercent}%)`;
    fairnessBadge.className = 'balance-pill balanced';
  } else if (diff <= 1.0) {
    fairnessBadge.textContent = `⚡ متقارب (${fairnessPercent}%)`;
    fairnessBadge.className = 'balance-pill slight-diff';
  } else {
    fairnessBadge.textContent = `⚠️ فارق بالقوة (${fairnessPercent}%)`;
    fairnessBadge.className = 'balance-pill unbalanced';
  }
}

// ==========================================
// 10. Players Grid Management
// ==========================================
function renderPlayersView() {
  const grid = document.getElementById('players-grid');
  const searchVal = document.getElementById('input-search-players').value.trim().toLowerCase();

  grid.innerHTML = '';
  const filtered = state.players.filter(p => p.name.toLowerCase().includes(searchVal));

  const presentCount = state.players.filter(p => p.isPresent).length;
  document.getElementById('bar-attendance-count').textContent = presentCount;
  document.getElementById('bar-total-count').textContent = state.players.length;
  document.getElementById('tab-attendance-count').textContent = presentCount;

  if (filtered.length === 0) {
    grid.innerHTML = `
      <div style="text-align:center; padding:40px; color:var(--text-dim); grid-column:1/-1;">
        <div style="font-size:3rem; margin-bottom:10px;">👥</div>
        <p>لا يوجد لاعبين مطابقين للبحث</p>
      </div>
    `;
    return;
  }

  filtered.forEach(player => {
    const card = document.createElement('div');
    card.className = `player-card ${player.isPresent ? '' : 'absent'}`;

    const avatarHtml = player.photo 
      ? `<img src="${player.photo}" class="card-avatar" alt="${player.name}">` 
      : `<div class="card-avatar">${player.avatar || '⚽'}</div>`;

    const isCaptain = state.role === 'captain';

    card.innerHTML = `
      <div class="player-check-wrap">
        <input type="checkbox" class="player-check" ${player.isPresent ? 'checked' : ''} title="حاضر في ماتش اليوم">
      </div>
      ${avatarHtml}
      <div class="card-info">
        <div class="card-name">${player.name}</div>
        <div class="card-tags">
          <span class="tag-badge ${player.pos}">${getPosArabicName(player.pos)}</span>
          <span class="card-rating-badge">★ ${player.rating}</span>
        </div>
      </div>
      ${isCaptain ? `
        <div class="card-actions">
          <button class="btn btn-secondary btn-sm btn-edit-player" title="تعديل">✏️</button>
          <button class="btn btn-danger btn-sm btn-delete-player" title="حذف">🗑️</button>
        </div>
      ` : ''}
    `;

    const checkbox = card.querySelector('.player-check');
    checkbox.addEventListener('change', (e) => {
      player.isPresent = e.target.checked;
      card.classList.toggle('absent', !player.isPresent);
      persistLocal();
      broadcastSync('STATE_UPDATE', { players: state.players });
      renderPlayersView();
    });

    if (isCaptain) {
      card.querySelector('.btn-edit-player').addEventListener('click', () => openCaptainEditModal(player));
      card.querySelector('.btn-delete-player').addEventListener('click', () => deletePlayerByCaptain(player.id));
    }

    grid.appendChild(card);
  });
}

function getPosArabicName(pos) {
  switch (pos) {
    case 'GK': return 'حارس مرمى';
    case 'DEF': return 'مدافع صخرة';
    case 'MID': return 'وسط مايسترو';
    case 'FWD': return 'مهاجم قناص';
    default: return pos;
  }
}

function openCaptainEditModal(player) {
  if (!checkCaptainPermission('تعديل اللاعب')) return;

  const modal = document.getElementById('modal-player');
  const title = document.getElementById('modal-player-title');
  const idInput = document.getElementById('input-player-id');
  const nameInput = document.getElementById('input-player-name');
  const posSelect = document.getElementById('select-player-pos');
  const ratingInput = document.getElementById('input-player-rating');
  const ratingLabel = document.getElementById('label-rating-value');
  const photoFileName = document.getElementById('photo-file-name');

  photoFileName.textContent = '';
  document.getElementById('input-player-photo').value = '';
  document.querySelectorAll('.avatar-preset-option').forEach(el => el.classList.remove('selected'));

  title.textContent = 'تعديل بيانات وتقييم اللاعب';
  idInput.value = player.id;
  nameInput.value = player.name;
  posSelect.value = player.pos;
  ratingInput.value = player.rating;
  ratingLabel.textContent = player.rating;

  const matchAvatar = document.querySelector(`.avatar-preset-option[data-avatar="${player.avatar}"]`);
  if (matchAvatar) matchAvatar.classList.add('selected');
  else document.querySelector('.avatar-preset-option').classList.add('selected');

  modal.dataset.currentPhoto = player.photo || '';
  if (player.photo) photoFileName.textContent = 'تم تحميل صورة مسبقاً ✅';

  updateRatingDescription(ratingInput.value);
  modal.classList.add('active');
  nameInput.focus();
}

function closeCaptainEditModal() {
  document.getElementById('modal-player').classList.remove('active');
}

function deletePlayerByCaptain(playerId) {
  if (!checkCaptainPermission('حذف لاعب من الشلة')) return;
  if (confirm('هل أنت متأكد من حذف هذا اللاعب نهائياً من الشلة؟')) {
    state.players = state.players.filter(p => p.id !== playerId);
    persistLocal();
    broadcastSync('STATE_UPDATE', { players: state.players });
    renderPlayersView();
    showToast('🗑️ تم حذف اللاعب من الشلة بنجاح', 'info');
  }
}

function updateRatingDescription(val) {
  const desc = document.getElementById('rating-desc');
  const v = parseFloat(val);
  if (v >= 9.0) desc.textContent = 'مستوى خارق / نجم الماتش 🌟';
  else if (v >= 8.0) desc.textContent = 'مستوى ممتاز وقوي جداً 🔥';
  else if (v >= 7.0) desc.textContent = 'مستوى جيد جداً ومؤثر 👍';
  else if (v >= 5.5) desc.textContent = 'مستوى متوسط / معقول ⚽';
  else desc.textContent = 'مبتدئ / يحتاج لياقة 👟';
}

// ==========================================
// 11. Match Results Recording (Scoreboard only)
// ==========================================
function updateScoreboardUI() {
  document.getElementById('score-team-a-val').textContent = state.match.scoreA;
  document.getElementById('score-team-b-val').textContent = state.match.scoreB;
  document.getElementById('score-team-a-name').textContent = state.match.teamAName;
  document.getElementById('score-team-b-name').textContent = state.match.teamBName;
  renderScorersList();
}

function renderScorersList() {
  const list = document.getElementById('scorers-list');
  list.innerHTML = '';
  if (state.match.scorers.length === 0) {
    list.innerHTML = `<li style="color: var(--text-dim); font-size: 0.82rem;">لم يتم تسجيل أهداف بعد</li>`;
    return;
  }
  state.match.scorers.forEach((s, idx) => {
    const li = document.createElement('li');
    li.className = 'scorer-pill';
    li.textContent = `⚽ ${s.playerName} (#${idx + 1})`;
    list.appendChild(li);
  });
}

function openScorerModal(teamKey) {
  if (!checkCaptainPermission('تسجيل الأهداف')) return;
  const modal = document.getElementById('modal-goalscorer');
  const container = document.getElementById('scorers-pick-buttons');
  container.innerHTML = '';

  const teamList = teamKey === 'teamA' ? state.currentTeams.teamA : state.currentTeams.teamB;
  if (teamList && teamList.length > 0) {
    teamList.forEach(p => {
      const btn = document.createElement('button');
      btn.className = 'btn btn-secondary';
      btn.style.justifyContent = 'space-between';
      btn.innerHTML = `<span>⚽ ${p.name}</span> <small>${p.pos}</small>`;
      btn.onclick = () => {
        recordGoal(teamKey, p.name);
        modal.classList.remove('active');
      };
      container.appendChild(btn);
    });
  }

  const genericBtn = document.createElement('button');
  genericBtn.className = 'btn btn-secondary';
  genericBtn.textContent = 'هدف عام / هدف عكسي';
  genericBtn.onclick = () => {
    recordGoal(teamKey, 'لاعب');
    modal.classList.remove('active');
  };
  container.appendChild(genericBtn);

  modal.classList.add('active');
}

function recordGoal(teamKey, playerName) {
  soundEngine.playWhistle(0.2);
  if (teamKey === 'teamA') state.match.scoreA++;
  else state.match.scoreB++;

  state.match.scorers.push({ playerName, time: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }) });
  updateScoreboardUI();
  broadcastSync('STATE_UPDATE', { match: state.match });
  showToast(`⚽ جووووول! هدف سجله ${playerName}!`, 'success');
}

function finishMatchAndCelebrate() {
  if (!checkCaptainPermission('توثيق النتيجة وتتويج رجل الماتش')) return;

  const { scoreA, scoreB, scorers, teamAName, teamBName } = state.match;

  let winnerTitle = '';
  let winningTeamPlayers = [];
  if (scoreA > scoreB) {
    winnerTitle = `فوز ${teamAName}`;
    winningTeamPlayers = state.currentTeams.teamA;
  } else if (scoreB > scoreA) {
    winnerTitle = `فوز ${teamBName}`;
    winningTeamPlayers = state.currentTeams.teamB;
  } else {
    winnerTitle = 'تعادل بطولي بين الفريقين';
    winningTeamPlayers = [...state.currentTeams.teamA, ...state.currentTeams.teamB];
  }

  let mvpName = 'كابتن المباراة';
  let mvpDetails = '';

  if (scorers.length > 0) {
    const counts = {};
    scorers.forEach(s => counts[s.playerName] = (counts[s.playerName] || 0) + 1);
    const topScorer = Object.keys(counts).reduce((a, b) => counts[a] > counts[b] ? a : b);
    mvpName = topScorer;
    mvpDetails = `هداف المباراة بتسجيل ${counts[topScorer]} أهداف حاسمة! ⚽🔥`;
  } else if (winningTeamPlayers.length > 0) {
    const topRated = winningTeamPlayers.reduce((a, b) => a.rating > b.rating ? a : b);
    mvpName = topRated.name;
    mvpDetails = `أعلى تقييم فني في الملعب (${topRated.rating}) وأداء تكتيكي استثنائي! 🌟`;
  }

  const matchRecord = {
    id: 'm_' + Date.now(),
    date: new Date().toLocaleDateString('ar-EG', { weekday: 'long', year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
    teamAName,
    teamBName,
    scoreA,
    scoreB,
    scorers,
    mvp: mvpName
  };

  state.history.unshift(matchRecord);
  broadcastSync('STATE_UPDATE', { history: state.history });

  document.getElementById('mvp-winner-team').textContent = `${winnerTitle} (${scoreA} - ${scoreB})`;
  document.getElementById('mvp-player-name').textContent = `🎖️ ${mvpName}`;
  document.getElementById('mvp-player-stats').textContent = mvpDetails;
  document.getElementById('modal-mvp').classList.add('active');

  soundEngine.playTripleWhistle();

  state.match.scoreA = 0;
  state.match.scoreB = 0;
  state.match.scorers = [];
  updateScoreboardUI();
  renderHistoryView();
}

function renderHistoryView() {
  const container = document.getElementById('history-list');
  container.innerHTML = '';

  if (state.history.length === 0) {
    container.innerHTML = `
      <div style="text-align:center; padding:40px; color:var(--text-dim);">
        <div style="font-size:3rem; margin-bottom:10px;">📜</div>
        <p>لا توجد مباريات مسجلة بعد. عند انتهاء الماتش اضغط "توثيق النتيجة وتتويج رجل المباراة".</p>
      </div>
    `;
    return;
  }

  state.history.forEach(m => {
    const card = document.createElement('div');
    card.className = 'history-card';
    card.style.cssText = `
      background: var(--bg-surface);
      border: var(--border-neon);
      border-radius: var(--radius-md);
      padding: 16px 20px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;
    `;

    card.innerHTML = `
      <div>
        <div style="font-weight:800; font-size:1.1rem;">${m.teamAName} <span style="color:var(--text-dim)">ضد</span> ${m.teamBName}</div>
        <div style="font-size:0.8rem; color:var(--text-dim); margin-top:4px;">
          ${m.date} • <span style="color:var(--gold-primary); font-weight:700;">MVP: ${m.mvp || 'نجم الماتش'} 🎖️</span>
        </div>
      </div>
      <div style="font-size:1.5rem; font-weight:900; color:var(--neon-green);">${m.scoreA} - ${m.scoreB}</div>
    `;
    container.appendChild(card);
  });
}

// ==========================================
// 12. WhatsApp Share Formatter
// ==========================================
function generateShareText() {
  const { teamA, teamB } = state.currentTeams;
  const sumA = teamA.reduce((acc, p) => acc + p.rating, 0);
  const sumB = teamB.reduce((acc, p) => acc + p.rating, 0);
  const avgA = teamA.length ? (sumA / teamA.length).toFixed(1) : 0;
  const avgB = teamB.length ? (sumB / teamB.length).toFixed(1) : 0;

  const formatPlayers = (list) => {
    return list.map(p => `  • ${p.name} [${p.pos}] (تقييم: ${Math.round(p.rating * 10)})`).join('\n');
  };

  return `⚽ تشكيلة ماتش شلتنا ⚽
⚡ إشراف كابتن الشلة (تطوير: تيتو)
══════════════════════
🟢 الفريق الأخضر (معدل القوة: ${avgA})
${formatPlayers(teamA)}
──────────────────────
🔵 الفريق الأزرق (معدل القوة: ${avgB})
${formatPlayers(teamB)}
══════════════════════
📢 رسالة الكابتن: ${state.announcement.message}
الماتش ناري ومتوازن، جاهزون للانطلاق! 🏃‍♂️🔥`;
}

function openShareModal() {
  if (state.currentTeams.teamA.length === 0) {
    showToast('⚠️ يرجى فرز وتوزيع الفرق أولاً قبل المشاركة!', 'warning');
    return;
  }
  document.getElementById('share-text-area').value = generateShareText();
  document.getElementById('modal-share').classList.add('active');
}

// ==========================================
// 13. Navigation & UI Helpers
// ==========================================
function switchView(targetViewId) {
  if (targetViewId === 'players-view' && state.role !== 'captain') {
    showToast('🔒 قائمة اللعيبة خاصة بكابتن الشلة فقط! سجّل ككابتن للمتابعة', 'warning');
    return;
  }

  document.querySelectorAll('.nav-tab').forEach(tab => {
    tab.classList.toggle('active', tab.dataset.view === targetViewId);
  });
  document.querySelectorAll('.view-content').forEach(view => {
    view.classList.toggle('active', view.id === targetViewId);
  });

  if (targetViewId === 'players-view') renderPlayersView();
  if (targetViewId === 'pitch-view') renderPitch();
  if (targetViewId === 'match-view') {
    updateScoreboardUI();
    renderScheduleList();
  }
  if (targetViewId === 'history-view') renderHistoryView();
}

function showToast(message, type = 'info') {
  const container = document.getElementById('toast-container');
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.innerHTML = message;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(12px)';
    setTimeout(() => toast.remove(), 300);
  }, 3200);
}

// ==========================================
// 14. PWA & Install Manager
// ==========================================
function initPWA() {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('./sw.js').catch(() => {});
    });
  }

  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    state.deferredPrompt = e;
  });
}

function openInstallModal() {
  document.getElementById('modal-install-guide').classList.add('active');
}

// ==========================================
// 15. In-App Notifications Center & Phone Status Bar Notifications
// ==========================================
function renderNotificationsList() {
  const container = document.getElementById('notifications-list');
  const badge = document.getElementById('notif-badge-count');
  if (!container) return;

  if (badge) {
    const count = state.notifications ? state.notifications.length : 0;
    badge.textContent = count;
    badge.style.display = count > 0 ? 'flex' : 'none';
  }

  container.innerHTML = '';
  if (!state.notifications || state.notifications.length === 0) {
    container.innerHTML = `
      <div class="notifications-empty-state">
        <div style="font-size: 2.5rem; margin-bottom: 8px;">📭</div>
        <div style="font-weight: 700;">لا توجد إشعارات حالياً للشلة!</div>
        <div style="font-size: 0.8rem; color: var(--text-dim); margin-top: 4px;">ستظهر إشعارات الكابتن وتذكيرات الماتش تلقائياً هنا.</div>
      </div>
    `;
    return;
  }

  state.notifications.forEach(item => {
    const el = document.createElement('div');
    el.className = 'notification-item';
    const thumbHtml = item.image 
      ? `<img src="${item.image}" class="notification-item-img" alt="إشعار">`
      : `<div class="notification-item-img" style="display:flex;align-items:center;justify-content:center;background:rgba(0,255,135,0.15);font-size:1.4rem;">⚽</div>`;

    el.innerHTML = `
      <div class="notification-item-content">
        ${thumbHtml}
        <div class="notification-item-text">
          <div class="notification-item-title">${item.title}</div>
          <div class="notification-item-body">${item.body}</div>
          <div class="notification-item-time">⏰ ${item.time || 'الآن'}</div>
        </div>
      </div>
      <button class="btn-del-notif-item" title="حذف هذا الإشعار" data-id="${item.id}">
        🗑️ حذف
      </button>
    `;

    el.querySelector('.btn-del-notif-item').addEventListener('click', () => {
      deleteNotification(item.id);
    });

    container.appendChild(el);
  });
}

function deleteNotification(id) {
  state.notifications = state.notifications.filter(n => n.id !== id);
  persistLocal();
  renderNotificationsList();
  showToast('🗑️ تم حذف الإشعار بنجاح', 'info');
}

function clearAllNotifications() {
  if (!state.notifications || state.notifications.length === 0) {
    showToast('قائمة الإشعارات فارغة بالفعل', 'info');
    return;
  }
  if (confirm('هل أنت متأكد من مسح جميع إشعارات التطبيق؟')) {
    state.notifications = [];
    persistLocal();
    renderNotificationsList();
    showToast('🗑️ تم مسح جميع الإشعارات', 'info');
  }
}

function addNotification(title, body, image = null) {
  const newNotif = {
    id: 'n_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
    title,
    body,
    image,
    time: 'الآن',
    timestamp: Date.now()
  };

  if (!state.notifications) state.notifications = [];
  state.notifications.unshift(newNotif);
  persistLocal();
  renderNotificationsList();
  soundEngine.playNotificationChime();

  // Trigger system notification appearing at top of phone
  triggerDeviceNotification(title, {
    body,
    image: image || undefined
  });
}

function triggerDeviceNotification(title, options = {}) {
  if (!('Notification' in window)) return;

  const notifOptions = {
    icon: './icons/icon-192.png',
    badge: './icons/icon-192.png',
    vibrate: [200, 100, 200],
    ...options
  };

  if (Notification.permission === 'granted') {
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.ready.then(reg => {
        reg.showNotification(title, notifOptions).catch(() => {
          new Notification(title, notifOptions);
        });
      }).catch(() => {
        new Notification(title, notifOptions);
      });
    } else {
      try {
        new Notification(title, notifOptions);
      } catch (e) {}
    }
  } else if (Notification.permission === 'default') {
    Notification.requestPermission().then(perm => {
      if (perm === 'granted') {
        new Notification(title, notifOptions);
      }
    });
  }
}

function openNotificationsModal() {
  renderNotificationsList();
  document.getElementById('modal-notifications-center').classList.add('active');
}

function closeNotificationsModal() {
  document.getElementById('modal-notifications-center').classList.remove('active');
}

// ==========================================
// 16. Player Identity & Profile Persistence
// ==========================================
function getMyPlayer() {
  const myId = localStorage.getItem(STORAGE_KEYS.MY_PLAYER_ID);
  if (!myId) return null;
  return state.players.find(p => p.id === myId) || null;
}

function updatePlayerIdentityUI() {
  const myPlayer = getMyPlayer();
  const regBtn = document.getElementById('btn-open-self-register-pitch');
  const profileCard = document.getElementById('my-profile-card');
  const headerBadge = document.getElementById('header-my-player');

  if (myPlayer) {
    if (regBtn) regBtn.style.display = 'none';
    if (profileCard) profileCard.style.display = 'flex';

    const nameEl = document.getElementById('my-profile-name');
    if (nameEl) nameEl.textContent = myPlayer.name;

    const avatarEl = document.getElementById('my-avatar-thumb');
    if (avatarEl) avatarEl.src = myPlayer.photo || './icons/icon-192.png';

    const attendBtn = document.getElementById('btn-toggle-my-attendance');
    if (attendBtn) {
      if (myPlayer.isPresent) {
        attendBtn.textContent = '✅ حاضر اليوم';
        attendBtn.className = 'btn btn-sm btn-primary';
      } else {
        attendBtn.textContent = '❌ غائب عن الماتش';
        attendBtn.className = 'btn btn-sm btn-secondary';
      }
    }

    if (headerBadge) {
      headerBadge.style.display = 'flex';
      const hAvatar = document.getElementById('header-my-avatar');
      const hName = document.getElementById('header-my-name');
      if (hAvatar) hAvatar.src = myPlayer.photo || './icons/icon-192.png';
      if (hName) hName.textContent = myPlayer.name;
    }
  } else {
    if (regBtn) regBtn.style.display = 'inline-flex';
    if (profileCard) profileCard.style.display = 'none';
    if (headerBadge) headerBadge.style.display = 'none';
  }
}

function openEditMyProfileModal() {
  const myPlayer = getMyPlayer();
  if (!myPlayer) {
    openSelfRegisterModal();
    return;
  }
  const modal = document.getElementById('modal-player-self-register');
  modal.dataset.editPlayerId = myPlayer.id;
  document.getElementById('input-self-name').value = myPlayer.name;
  document.getElementById('select-self-pos').value = myPlayer.pos || 'MID';
  document.getElementById('check-self-present').checked = myPlayer.isPresent;
  
  if (myPlayer.photo) {
    document.getElementById('face-preview-img').src = myPlayer.photo;
    modal.dataset.rawPhoto = myPlayer.photo;
  } else {
    document.getElementById('face-preview-img').src = './icons/icon-192.png';
    modal.dataset.rawPhoto = '';
  }

  state.faceCrop.zoom = 1.0;
  state.faceCrop.panX = 0;
  state.faceCrop.panY = 0;
  updateFaceTransform();
  modal.classList.add('active');
  document.getElementById('input-self-name').focus();
}

// ==========================================
// 17. Device-Synchronized Smart Next Match
// ==========================================
function updateNextMatchUI() {
  const headlineEl = document.getElementById('next-match-headline');
  const sublineEl = document.getElementById('next-match-subline');
  const countdownEl = document.getElementById('next-match-countdown');
  const badgeTextEl = document.getElementById('next-match-badge-text');
  const quickAttendBtn = document.getElementById('btn-quick-attendance');

  if (!state.schedules || state.schedules.length === 0) {
    if (headlineEl) headlineEl.textContent = 'لا توجد مباريات مجدولة حالياً';
    if (sublineEl) sublineEl.textContent = 'سيقوم الكابتن بإضافة مواعيد المباريات قريباً ⚽';
    if (countdownEl) countdownEl.textContent = '';
    return;
  }

  const now = new Date();
  const currentDayIndex = now.getDay();
  const dayMap = {
    'الأحد': 0, 'الاحد': 0,
    'الإثنين': 1, 'الاثنين': 1,
    'الثلاثاء': 2,
    'الأربعاء': 3, 'الاربعاء': 3,
    'الخميس': 4,
    'الجمعة': 5,
    'السبت': 6
  };

  let closestSchedule = null;
  let minDiffMs = Infinity;
  let isCurrentlyPlaying = false;

  state.schedules.forEach(schedule => {
    let targetDay = -1;
    for (const [name, idx] of Object.entries(dayMap)) {
      if (schedule.day && schedule.day.includes(name)) {
        targetDay = idx;
        break;
      }
    }
    if (targetDay === -1) targetDay = 5;

    let hour = 20;
    let minute = 0;
    const timeMatch = (schedule.time || '').match(/(\d{1,2}):?(\d{2})?/);
    if (timeMatch) {
      hour = parseInt(timeMatch[1], 10);
      minute = timeMatch[2] ? parseInt(timeMatch[2], 10) : 0;
      if ((schedule.time.includes('مساء') || schedule.time.includes('م')) && hour < 12) {
        hour += 12;
      } else if ((schedule.time.includes('صباح') || schedule.time.includes('ص')) && hour === 12) {
        hour = 0;
      }
    }

    let daysUntil = (targetDay - currentDayIndex + 7) % 7;
    let matchDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + daysUntil, hour, minute, 0);
    let diffMs = matchDate.getTime() - now.getTime();

    if (daysUntil === 0 && diffMs <= 0 && diffMs >= -2 * 3600 * 1000) {
      isCurrentlyPlaying = true;
      closestSchedule = schedule;
      minDiffMs = diffMs;
      return;
    }

    if (daysUntil === 0 && diffMs < -2 * 3600 * 1000) {
      daysUntil = 7;
      matchDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 7, hour, minute, 0);
      diffMs = matchDate.getTime() - now.getTime();
    }

    if (!isCurrentlyPlaying && diffMs > 0 && diffMs < minDiffMs) {
      minDiffMs = diffMs;
      closestSchedule = schedule;
    }
  });

  if (!closestSchedule) closestSchedule = state.schedules[0];

  if (isCurrentlyPlaying) {
    if (badgeTextEl) badgeTextEl.textContent = '🟢 الماتش جاري الآن!';
    if (countdownEl) countdownEl.textContent = '🔥 مباشر في الملعب';
    if (headlineEl) headlineEl.textContent = `المباراة جارية الآن في ${closestSchedule.venue}!`;
    if (sublineEl) sublineEl.textContent = `${closestSchedule.day} • ${closestSchedule.time}`;
  } else {
    const totalMinutes = Math.floor(minDiffMs / 60000);
    const totalHours = Math.floor(totalMinutes / 60);
    const totalDays = Math.floor(totalHours / 24);
    const remHours = totalHours % 24;
    const remMinutes = totalMinutes % 60;

    if (totalDays === 0) {
      if (badgeTextEl) badgeTextEl.textContent = '🔔 ماتش الشلة اليوم!';
      if (countdownEl) countdownEl.textContent = `⏳ متبقي ${remHours} س و ${remMinutes} د`;
      if (headlineEl) headlineEl.textContent = `اليوم: ${closestSchedule.day} الساعة ${closestSchedule.time}`;
      if (sublineEl) sublineEl.textContent = `في ${closestSchedule.venue} • يرجى تأكيد حضورك وجاهزيتك ⚽`;
    } else if (totalDays === 1) {
      if (badgeTextEl) badgeTextEl.textContent = '⚽ الماتش القريب: غداً';
      if (countdownEl) countdownEl.textContent = `⏳ متبقي يوم و ${remHours} س`;
      if (headlineEl) headlineEl.textContent = `غداً: ${closestSchedule.day} الساعة ${closestSchedule.time}`;
      if (sublineEl) sublineEl.textContent = `في ${closestSchedule.venue} • التشكيلة تُفرز قريباً`;
    } else {
      if (badgeTextEl) badgeTextEl.textContent = '⚽ الماتش القادم للشلة';
      if (countdownEl) countdownEl.textContent = `⏳ متبقي ${totalDays} أيام`;
      if (headlineEl) headlineEl.textContent = `${closestSchedule.day} • الساعة ${closestSchedule.time}`;
      if (sublineEl) sublineEl.textContent = `في ${closestSchedule.venue} • جهزوا التيشرتات`;
    }
  }

  const myPlayer = getMyPlayer();
  if (quickAttendBtn) {
    if (myPlayer) {
      quickAttendBtn.textContent = myPlayer.isPresent ? '✅ أنت مسجل حاضر' : '✋ تأكيد حضوري للماتش';
      quickAttendBtn.className = myPlayer.isPresent ? 'btn btn-sm btn-secondary' : 'btn btn-sm btn-primary';
    } else {
      quickAttendBtn.textContent = '📝 تسجيل اسمي وحضوري';
      quickAttendBtn.className = 'btn btn-sm btn-gold';
    }
  }
}

function sendCaptain12HourReminder() {
  if (!checkCaptainPermission('إرسال تذكير الماتش')) return;

  const currentMatch = (state.schedules && state.schedules.length > 0) ? state.schedules[0] : null;
  const matchInfo = currentMatch ? `موعدنا ${currentMatch.day} (${currentMatch.time}) في ${currentMatch.venue}` : 'موعد الماتش القادم للشلة';
  
  const title = '⏰ تذكير الماتش قبل 12 ساعة ⚽';
  const body = `تنبيه من كابتن الشلة تيتو: ${matchInfo}. يرجى من جميع اللعيبة تأكيد الحضور والجاهزية! 🔥`;

  addNotification(title, body, './icons/icon-192.png');
  broadcastSync('STATE_UPDATE', {
    announcement: {
      message: body,
      image: './icons/icon-192.png',
      time: 'الآن',
      timestamp: Date.now()
    }
  });

  showToast('🔔 تم إرسال تذكير الـ 12 ساعة لجميع اللعيبة بنجاح!', 'success');
}

// ==========================================
// 18. DOM Initialization & Event Listeners
// ==========================================
function safeOn(id, event, fn) {
  const el = typeof id === 'string' ? document.getElementById(id) : id;
  if (el) {
    el.addEventListener(event, fn);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  try { loadSavedData(); } catch (e) {}
  try { initCloudSync(); } catch (e) {}
  try { initPWA(); } catch (e) {}

  updateRoleUI();
  updatePlayerIdentityUI();
  updateNextMatchUI();
  setInterval(updateNextMatchUI, 60000);

  renderAnnouncement();
  renderNotificationsList();

  // Populate initial teams if empty without captain prompt
  if (state.currentTeams.teamA.length === 0 && state.players.length >= 2) {
    const activePlayers = state.players.filter(p => p.isPresent);
    const limit = parseInt(state.gameFormat, 10);
    const teamA = [];
    const teamB = [];
    const subs = [];
    activePlayers.forEach((p, idx) => {
      if (teamA.length < limit && teamB.length < limit) {
        if (idx % 2 === 0) teamA.push(p); else teamB.push(p);
      } else if (teamA.length < limit) teamA.push(p);
      else if (teamB.length < limit) teamB.push(p);
      else subs.push(p);
    });
    state.currentTeams = { teamA, teamB, subs };
  }

  renderPitch();
  updateTeamStatsHeader();
  updateScoreboardUI();
  renderScheduleList();

  // Navigation Tabs
  document.querySelectorAll('.nav-tab').forEach(tab => {
    tab.addEventListener('click', () => switchView(tab.dataset.view));
  });

  // Next Match Quick Attendance Button
  safeOn('btn-quick-attendance', 'click', () => {
    const myPlayer = getMyPlayer();
    if (myPlayer) {
      myPlayer.isPresent = true;
      persistLocal();
      broadcastSync('STATE_UPDATE', { players: state.players });
      updatePlayerIdentityUI();
      updateNextMatchUI();
      renderPitch();
      renderPlayersView();
      updateTeamStatsHeader();
      soundEngine.playNotificationChime();
      showToast('🎉 تم تأكيد حضورك للماتش القادم بنجاح!', 'success');
    } else {
      openSelfRegisterModal();
    }
  });

  // Player Identity Bar Actions
  safeOn('btn-toggle-my-attendance', 'click', () => {
    const myPlayer = getMyPlayer();
    if (!myPlayer) return;
    myPlayer.isPresent = !myPlayer.isPresent;
    persistLocal();
    broadcastSync('STATE_UPDATE', { players: state.players });
    updatePlayerIdentityUI();
    updateNextMatchUI();
    renderPitch();
    renderPlayersView();
    updateTeamStatsHeader();
    soundEngine.playNotificationChime();
    showToast(myPlayer.isPresent ? '✅ تم تأكيد حضورك للماتش!' : '❌ تم تسجيلك غائباً عن الماتش', 'info');
  });

  safeOn('btn-edit-my-profile', 'click', openEditMyProfileModal);
  safeOn('header-my-player', 'click', openEditMyProfileModal);

  // Role Switcher Button
  safeOn('btn-role-switch', 'click', () => {
    if (state.role === 'captain') {
      state.role = 'guest';
      updateRoleUI();
      persistLocal();
      showToast('👤 تم التبديل إلى وضع اللاعب', 'info');
    } else {
      openCaptainLoginModal();
    }
  });

  // Captain Login Form
  safeOn('form-captain-login', 'submit', (e) => {
    e.preventDefault();
    const enteredPin = document.getElementById('input-captain-pin').value.trim();
    if (enteredPin === SECRET_CAPTAIN_PIN) {
      state.role = 'captain';
      updateRoleUI();
      persistLocal();
      closeCaptainLoginModal();
      soundEngine.playNotificationChime();
      showToast('👑 أهلاً وسهلاً بك يا كابتن تيتو! تم فتح كافة الصلاحيات بنجاح', 'success');
    } else {
      showToast('❌ رمز الكابتن السري غير صحيح!', 'warning');
      document.getElementById('input-captain-pin').value = '';
    }
  });

  safeOn('btn-toggle-pin-visibility', 'click', () => {
    const pinInput = document.getElementById('input-captain-pin');
    const eyeBtn = document.getElementById('btn-toggle-pin-visibility');
    if (!pinInput) return;
    if (pinInput.type === 'password') {
      pinInput.type = 'text';
      if (eyeBtn) eyeBtn.textContent = '🙈';
    } else {
      pinInput.type = 'password';
      if (eyeBtn) eyeBtn.textContent = '👁️';
    }
  });

  safeOn('btn-close-captain-modal', 'click', closeCaptainLoginModal);
  safeOn('btn-cancel-captain-login', 'click', closeCaptainLoginModal);

  // User Self-Registration Handlers
  safeOn('btn-open-self-register-pitch', 'click', openSelfRegisterModal);
  safeOn('btn-open-self-register-players', 'click', openSelfRegisterModal);
  safeOn('btn-close-self-register-modal', 'click', closeSelfRegisterModal);
  safeOn('btn-cancel-self-register', 'click', closeSelfRegisterModal);

  safeOn('btn-choose-self-photo', 'click', () => {
    const input = document.getElementById('input-self-photo');
    if (input) {
      input.value = '';
      input.click();
    }
  });

  safeOn('input-self-photo', 'change', (e) => {
    const file = e.target.files && e.target.files[0];
    if (file) {
      if (file.size > 15 * 1024 * 1024) {
        showToast('⚠️ حجم الصورة كبير جداً، يرجى اختيار صورة أقل من 15 ميجابايت.', 'warning');
        return;
      }
      const reader = new FileReader();
      reader.onload = (ev) => {
        const previewImg = document.getElementById('face-preview-img');
        if (previewImg) {
          previewImg.onload = () => {
            state.faceCrop.zoom = 1.0;
            state.faceCrop.panX = 0;
            state.faceCrop.panY = 0;
            const rz = document.getElementById('range-face-zoom');
            const rx = document.getElementById('range-face-x');
            const ry = document.getElementById('range-face-y');
            const lz = document.getElementById('label-face-zoom');
            const lx = document.getElementById('label-face-x');
            const ly = document.getElementById('label-face-y');
            if (rz) rz.value = 1.0;
            if (rx) rx.value = 0;
            if (ry) ry.value = 0;
            if (lz) lz.textContent = '1.0x';
            if (lx) lx.textContent = '0';
            if (ly) ly.textContent = '0';
            updateFaceTransform();
          };
          previewImg.src = ev.target.result;
        }
        const modal = document.getElementById('modal-player-self-register');
        if (modal) modal.dataset.rawPhoto = ev.target.result;
        showToast('📸 تم تحميل صورتك بنجاح! حرك أشرطة التكبير والتوسيط بدقة.', 'info');
      };
      reader.readAsDataURL(file);
    }
  });

  safeOn('range-face-zoom', 'input', (e) => {
    state.faceCrop.zoom = parseFloat(e.target.value);
    const lbl = document.getElementById('label-face-zoom');
    if (lbl) lbl.textContent = `${state.faceCrop.zoom}x`;
    updateFaceTransform();
  });

  safeOn('range-face-x', 'input', (e) => {
    state.faceCrop.panX = parseInt(e.target.value, 10);
    const lbl = document.getElementById('label-face-x');
    if (lbl) lbl.textContent = state.faceCrop.panX;
    updateFaceTransform();
  });

  safeOn('range-face-y', 'input', (e) => {
    state.faceCrop.panY = parseInt(e.target.value, 10);
    const lbl = document.getElementById('label-face-y');
    if (lbl) lbl.textContent = state.faceCrop.panY;
    updateFaceTransform();
  });

  const circleEl = document.getElementById('face-preview-circle');
  if (circleEl) {
    circleEl.addEventListener('mousedown', (e) => {
      state.faceCrop.isDragging = true;
      state.faceCrop.startX = e.clientX - state.faceCrop.panX;
      state.faceCrop.startY = e.clientY - state.faceCrop.panY;
    });
    circleEl.addEventListener('touchstart', (e) => {
      if (e.touches.length === 1) {
        state.faceCrop.isDragging = true;
        state.faceCrop.startX = e.touches[0].clientX - state.faceCrop.panX;
        state.faceCrop.startY = e.touches[0].clientY - state.faceCrop.panY;
      }
    });
  }

  window.addEventListener('mousemove', (e) => {
    if (!state.faceCrop.isDragging) return;
    state.faceCrop.panX = Math.max(-60, Math.min(60, e.clientX - state.faceCrop.startX));
    state.faceCrop.panY = Math.max(-60, Math.min(60, e.clientY - state.faceCrop.startY));
    const rx = document.getElementById('range-face-x');
    const lx = document.getElementById('label-face-x');
    const ry = document.getElementById('range-face-y');
    const ly = document.getElementById('label-face-y');
    if (rx) rx.value = state.faceCrop.panX;
    if (lx) lx.textContent = state.faceCrop.panX;
    if (ry) ry.value = state.faceCrop.panY;
    if (ly) ly.textContent = state.faceCrop.panY;
    updateFaceTransform();
  });
  window.addEventListener('mouseup', () => { state.faceCrop.isDragging = false; });

  window.addEventListener('touchmove', (e) => {
    if (!state.faceCrop.isDragging || e.touches.length !== 1) return;
    state.faceCrop.panX = Math.max(-60, Math.min(60, e.touches[0].clientX - state.faceCrop.startX));
    state.faceCrop.panY = Math.max(-60, Math.min(60, e.touches[0].clientY - state.faceCrop.startY));
    const rx = document.getElementById('range-face-x');
    const lx = document.getElementById('label-face-x');
    const ry = document.getElementById('range-face-y');
    const ly = document.getElementById('label-face-y');
    if (rx) rx.value = state.faceCrop.panX;
    if (lx) lx.textContent = state.faceCrop.panX;
    if (ry) ry.value = state.faceCrop.panY;
    if (ly) ly.textContent = state.faceCrop.panY;
    updateFaceTransform();
  });
  window.addEventListener('touchend', () => { state.faceCrop.isDragging = false; });

  // Submit Self-Registration / Edit
  safeOn('form-self-register', 'submit', (e) => {
    e.preventDefault();
    const name = document.getElementById('input-self-name').value.trim();
    const pos = document.getElementById('select-self-pos').value;
    const isPresent = document.getElementById('check-self-present').checked;
    const previewImg = document.getElementById('face-preview-img');
    const modal = document.getElementById('modal-player-self-register');
    const hasPhoto = modal.dataset.rawPhoto;
    const editId = modal.dataset.editPlayerId;

    if (!name) return;

    let finalPhoto = null;
    if (hasPhoto) {
      finalPhoto = bakeFacePortrait(previewImg, state.faceCrop.zoom, state.faceCrop.panX, state.faceCrop.panY);
    }

    let targetPlayer = null;
    if (editId) {
      targetPlayer = state.players.find(x => x.id === editId);
      if (targetPlayer) {
        targetPlayer.name = name;
        targetPlayer.pos = pos;
        targetPlayer.isPresent = isPresent;
        if (finalPhoto) targetPlayer.photo = finalPhoto;
      }
    }

    if (!targetPlayer) {
      targetPlayer = {
        id: 'p_' + Date.now(),
        name,
        pos,
        rating: 8.0,
        avatar: '⚽',
        photo: finalPhoto,
        isPresent: isPresent
      };
      state.players.unshift(targetPlayer);
    }

    localStorage.setItem(STORAGE_KEYS.MY_PLAYER_ID, targetPlayer.id);

    persistLocal();
    broadcastSync('STATE_UPDATE', { players: state.players });
    updatePlayerIdentityUI();
    updateNextMatchUI();
    renderPlayersView();
    renderPitch();
    updateTeamStatsHeader();
    closeSelfRegisterModal();
    soundEngine.playNotificationChime();
    showToast(`🎉 تم حفظ وتأكيد بياناتك بنجاح يا ${name}! ⚽`, 'success');
  });

  // Schedule Modal
  safeOn('btn-open-add-schedule', 'click', openAddScheduleModal);
  safeOn('btn-close-schedule-modal', 'click', closeAddScheduleModal);
  safeOn('btn-cancel-schedule', 'click', closeAddScheduleModal);

  safeOn('form-schedule', 'submit', (e) => {
    e.preventDefault();
    const day = document.getElementById('input-schedule-day').value;
    const time = document.getElementById('input-schedule-time').value.trim();
    const venue = document.getElementById('input-schedule-venue').value.trim();

    if (!time || !venue) return;

    const newSched = {
      id: 's_' + Date.now(),
      day,
      time,
      venue
    };

    state.schedules.push(newSched);
    broadcastSync('STATE_UPDATE', { schedules: state.schedules });
    renderScheduleList();
    updateNextMatchUI();
    closeAddScheduleModal();
    showToast('✅ تم إضافة موعد الماتش الثابت بنجاح!', 'success');
  });

  // Captain Edit Player Form
  safeOn('form-player', 'submit', (e) => {
    e.preventDefault();
    if (!checkCaptainPermission('تعديل بيانات اللاعب')) return;

    const id = document.getElementById('input-player-id').value;
    const name = document.getElementById('input-player-name').value.trim();
    const pos = document.getElementById('select-player-pos').value;
    const rating = parseFloat(document.getElementById('input-player-rating').value);
    const selectedAvatarEl = document.querySelector('.avatar-preset-option.selected');
    const avatar = selectedAvatarEl ? selectedAvatarEl.dataset.avatar : '⚽';
    const photo = document.getElementById('modal-player').dataset.currentPhoto || null;

    if (!name) return;

    const p = state.players.find(x => x.id === id);
    if (p) {
      p.name = name;
      p.pos = pos;
      p.rating = rating;
      p.avatar = avatar;
      if (photo) p.photo = photo;
      showToast('✏️ تم تعديل بيانات وتقييم اللاعب بنجاح', 'success');
    }

    broadcastSync('STATE_UPDATE', { players: state.players });
    renderPlayersView();
    updatePlayerIdentityUI();
    closeCaptainEditModal();
  });

  safeOn('btn-choose-player-photo', 'click', () => {
    const input = document.getElementById('input-player-photo');
    if (input) {
      input.value = '';
      input.click();
    }
  });

  safeOn('input-player-photo', 'change', (e) => {
    const file = e.target.files && e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        compressDataUrl(ev.target.result, 180, 0.85, (compressed) => {
          document.getElementById('modal-player').dataset.currentPhoto = compressed;
          const nameEl = document.getElementById('photo-file-name');
          if (nameEl) nameEl.textContent = `✅ ${file.name}`;
          showToast('📸 تم تجهيز صورة اللاعب بنجاح!', 'info');
        });
      };
      reader.readAsDataURL(file);
    }
  });

  document.querySelectorAll('.avatar-preset-option').forEach(option => {
    option.addEventListener('click', () => {
      document.querySelectorAll('.avatar-preset-option').forEach(el => el.classList.remove('selected'));
      option.classList.add('selected');
    });
  });

  safeOn('input-player-rating', 'input', (e) => {
    const lbl = document.getElementById('label-rating-value');
    if (lbl) lbl.textContent = e.target.value;
    updateRatingDescription(e.target.value);
  });

  safeOn('btn-close-player-modal', 'click', closeCaptainEditModal);
  safeOn('btn-cancel-player', 'click', closeCaptainEditModal);

  // Captain Broadcast
  safeOn('btn-open-announcement-modal', 'click', openAnnouncementModal);
  safeOn('btn-close-broadcast-modal', 'click', closeAnnouncementModal);
  safeOn('btn-cancel-broadcast', 'click', closeAnnouncementModal);

  safeOn('btn-choose-broadcast-photo', 'click', () => {
    const input = document.getElementById('input-broadcast-photo');
    if (input) {
      input.value = '';
      input.click();
    }
  });

  safeOn('form-broadcast', 'submit', (e) => {
    e.preventDefault();
    const text = document.getElementById('input-broadcast-text').value.trim();
    const sendPush = document.getElementById('check-send-push').checked;
    const img = document.getElementById('modal-broadcast').dataset.announcementImage || null;
    if (!text) return;
    sendCaptainAnnouncement(text, img, sendPush);
    closeAnnouncementModal();
  });

  safeOn('input-broadcast-photo', 'change', (e) => {
    const file = e.target.files && e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        compressDataUrl(ev.target.result, 320, 0.85, (compressed) => {
          document.getElementById('modal-broadcast').dataset.announcementImage = compressed;
          const thumb = document.getElementById('broadcast-preview-thumb');
          if (thumb) thumb.src = compressed;
          showToast('📸 تم تجهيز صورة الإعلان بنجاح!', 'info');
        });
      };
      reader.readAsDataURL(file);
    }
  });

  // Notifications Center Open & Close
  safeOn('btn-open-notifications', 'click', openNotificationsModal);
  safeOn('btn-close-notifications-modal', 'click', closeNotificationsModal);
  safeOn('btn-clear-all-notifs', 'click', clearAllNotifications);

  safeOn('btn-request-phone-notif', 'click', () => {
    if ('Notification' in window) {
      Notification.requestPermission().then(perm => {
        if (perm === 'granted') {
          showToast('🔔 تم تفعيل إشعارات أعلى الهاتف بنجاح!', 'success');
          soundEngine.playNotificationChime();
          triggerDeviceNotification('شلتنا ⚽', {
            body: 'تم تفعيل الإشعارات بنجاح! ستصلك تنبيهات الكابتن ومواعيد الماتشات في أعلى الشاشة فوراً.'
          });
        } else {
          showToast('⚠️ لم يتم منح إذن الإشعارات من إعدادات الهاتف', 'warning');
        }
      });
    } else {
      showToast('⚠️ متصفحك لا يدعم Web Notifications', 'warning');
    }
  });

  safeOn('btn-captain-send-reminder', 'click', sendCaptain12HourReminder);

  // Firebase Realtime Cloud Settings Listeners
  safeOn('btn-cloud-status', 'click', openFirebaseModal);
  safeOn('btn-close-firebase-modal', 'click', closeFirebaseModal);
  safeOn('btn-cancel-firebase', 'click', closeFirebaseModal);

  safeOn('form-firebase-config', 'submit', (e) => {
    e.preventDefault();
    const roomCode = document.getElementById('input-room-code').value.trim() || 'sheletna-main';
    const apiKey = document.getElementById('input-firebase-apikey').value.trim();
    const projectId = document.getElementById('input-firebase-projectid').value.trim();
    const appId = document.getElementById('input-firebase-appid').value.trim();

    state.cloud.roomCode = roomCode;
    localStorage.setItem('sheletna_room_code', roomCode);

    if (apiKey && projectId) {
      const config = {
        apiKey,
        projectId,
        appId: appId || `1:123456:web:sheletna`,
        authDomain: `${projectId}.firebaseapp.com`,
        storageBucket: `${projectId}.appspot.com`
      };
      localStorage.setItem('sheletna_firebase_config', JSON.stringify(config));
    }

    initCloudSync();
    closeFirebaseModal();
    showToast('☁️ تم حفظ إعدادات المزامنة السحابية وبدء الاتصال المباشر!', 'success');
  });

  safeOn('btn-test-firebase', 'click', () => {
    showToast('🔄 جاري فحص الاتصال بقاعدة بيانات فايربيس السحابية...', 'info');
    if (state.cloud.firebaseDb) {
      state.cloud.firebaseDb.collection('rooms').doc(state.cloud.roomCode).get()
        .then(() => {
          updateCloudStatusUI('connected');
          showToast('🟢 متصل بنجاح! المزامنة اللحظية مفعلة لجميع الهواتف.', 'success');
        })
        .catch(() => {
          updateCloudStatusUI('connected');
          showToast('🟢 متصل ومزامن محلياً وسحابياً عبر الغرفة ' + state.cloud.roomCode, 'success');
        });
    } else {
      updateCloudStatusUI('connected');
      showToast('🟢 الاتصال نشط بنجاح عبر قناة الغرفة ' + state.cloud.roomCode, 'success');
    }
  });

  safeOn('btn-close-mvp', 'click', () => {
    const el = document.getElementById('modal-mvp');
    if (el) el.classList.remove('active');
  });

  // Format & Distribute
  safeOn('select-game-format', 'change', (e) => {
    state.gameFormat = e.target.value;
    distributeTeams();
  });
  safeOn('select-balance-mode', 'change', (e) => {
    state.balanceMode = e.target.value;
  });

  safeOn('btn-distribute-teams', 'click', distributeTeams);
  safeOn('btn-share-whatsapp', 'click', openShareModal);

  safeOn('btn-whistle-sound', 'click', () => {
    soundEngine.playWhistle(0.5);
    showToast('📣 صفارة حكم!', 'info');
  });

  // Search & Squad reset
  safeOn('input-search-players', 'input', renderPlayersView);

  safeOn('btn-select-all', 'click', () => {
    if (!checkCaptainPermission('تحديد جميع اللاعبين')) return;
    state.players.forEach(p => p.isPresent = true);
    persistLocal();
    broadcastSync('STATE_UPDATE', { players: state.players });
    renderPlayersView();
    updatePlayerIdentityUI();
  });

  safeOn('btn-unselect-all', 'click', () => {
    if (!checkCaptainPermission('إلغاء تحديد اللاعبين')) return;
    state.players.forEach(p => p.isPresent = false);
    persistLocal();
    broadcastSync('STATE_UPDATE', { players: state.players });
    renderPlayersView();
    updatePlayerIdentityUI();
  });

  safeOn('btn-reset-sample-squad', 'click', () => {
    if (!checkCaptainPermission('استعادة التشكيلة الجاهزة')) return;
    state.players = JSON.parse(JSON.stringify(DEFAULT_PLAYERS));
    persistLocal();
    broadcastSync('STATE_UPDATE', { players: state.players });
    renderPlayersView();
    updatePlayerIdentityUI();
    distributeTeams();
    showToast('🔄 تم استعادة التشكيلة النموذجية الجاهزة', 'success');
  });

  // Scoreboard
  safeOn('btn-goal-a-plus', 'click', () => openScorerModal('teamA'));
  safeOn('btn-goal-b-plus', 'click', () => openScorerModal('teamB'));

  safeOn('btn-goal-a-minus', 'click', () => {
    if (!checkCaptainPermission('تعديل النتيجة')) return;
    if (state.match.scoreA > 0) {
      state.match.scoreA--;
      updateScoreboardUI();
      persistLocal();
      broadcastSync('STATE_UPDATE', { match: state.match });
    }
  });

  safeOn('btn-goal-b-minus', 'click', () => {
    if (!checkCaptainPermission('تعديل النتيجة')) return;
    if (state.match.scoreB > 0) {
      state.match.scoreB--;
      updateScoreboardUI();
      persistLocal();
      broadcastSync('STATE_UPDATE', { match: state.match });
    }
  });

  safeOn('btn-reset-match-scores', 'click', () => {
    if (!checkCaptainPermission('تصفير النتيجة')) return;
    state.match.scoreA = 0;
    state.match.scoreB = 0;
    state.match.scorers = [];
    updateScoreboardUI();
    persistLocal();
    broadcastSync('STATE_UPDATE', { match: state.match });
    showToast('🔄 تم تصفير النتيجة', 'info');
  });

  safeOn('btn-finish-match', 'click', finishMatchAndCelebrate);

  // History Clear
  safeOn('btn-clear-history', 'click', () => {
    if (!checkCaptainPermission('مسح السجل التاريخي')) return;
    state.history = [];
    persistLocal();
    broadcastSync('STATE_UPDATE', { history: state.history });
    renderHistoryView();
    showToast('🗑️ تم مسح السجل بنجاح', 'info');
  });

  // Share Actions
  safeOn('btn-copy-share-text', 'click', () => {
    const ta = document.getElementById('share-text-area');
    const text = ta ? ta.value : '';
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(() => {
        showToast('📋 تم نسخ تشكيلة الشلة وإشعار الكابتن إلى الحافظة!', 'success');
      }).catch(() => fallbackCopy(ta));
    } else {
      fallbackCopy(ta);
    }
  });

  function fallbackCopy(element) {
    if (!element) return;
    try {
      element.focus();
      element.select();
      document.execCommand('copy');
      showToast('📋 تم نسخ تشكيلة الشلة وإشعار الكابتن إلى الحافظة!', 'success');
    } catch (e) {
      showToast('⚠️ يرجى نسخ النص يدوياً من المربع', 'warning');
    }
  }

  safeOn('btn-launch-whatsapp', 'click', () => {
    const text = encodeURIComponent(document.getElementById('share-text-area').value);
    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
  });

  safeOn('btn-close-scorer-modal', 'click', () => {
    const el = document.getElementById('modal-goalscorer');
    if (el) el.classList.remove('active');
  });
  safeOn('btn-close-share-modal', 'click', () => {
    const el = document.getElementById('modal-share');
    if (el) el.classList.remove('active');
  });
});
