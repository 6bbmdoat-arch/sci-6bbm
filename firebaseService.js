/**
 * firebaseService.js — Camada de sincronização Firebase para SCI 6° BBM
 *
 * Responsabilidades:
 *  - Inicializar o Firebase com as chaves de firebase.js
 *  - Ouvir mudanças em tempo real em todos os nós do banco
 *  - Escrever dados do app no Firebase
 *  - Ao detectar mudança remota, atualizar o DB local e re-renderizar a UI
 */

// ── REFERÊNCIAS GLOBAIS ──────────────────────────────────────────────────────
let _db = null;       // Firebase Database instance
let _fbActive = false; // true quando Firebase está inicializado e ativo

// ── INICIALIZAÇÃO ────────────────────────────────────────────────────────────
function initFirebase() {
  try {
    firebase.initializeApp(FIREBASE_CONFIG);
    _db = firebase.database();
    _fbActive = true;
    console.log('[SCI Firebase] Conectado ao Realtime Database');

    // Sincronizar dados iniciais do app para o Firebase
    // (só faz o seed se o nó personnel estiver vazio)
    _db.ref('personnel').once('value', snap => {
      if (!snap.exists()) {
        console.log('[SCI Firebase] Primeiro acesso — carregando dados iniciais');
        seedFirebase();
      }
    });

    // Ouvir todos os nós em tempo real
    listenNode('incidents',  data => { DB.incidents  = data ? Object.values(data) : []; renderIncList(); metrics(); });
    listenNode('missions',   data => { DB.missions   = data ? Object.values(data) : []; renderMissions(); metrics(); });
    listenNode('assign',     data => { DB.assign     = data || {}; refreshAllSlots(); metrics(); });
    listenNode('vehicles',   data => { DB.vehicles   = data ? Object.values(data) : []; renderVehicles(); renderDashRes(); metrics(); });
    listenNode('aircraft',   data => { DB.aircraft   = data ? Object.values(data) : []; renderAircraft(); renderDashRes(); metrics(); });
    listenNode('vessels',    data => { DB.vessels    = data ? Object.values(data) : []; renderVessels(); renderDashRes(); metrics(); });
    listenNode('personnel',  data => { DB.personnel  = data ? Object.values(data) : []; renderPers(); metrics(); });
    listenNode('log',        data => {
      DB.log = data ? Object.values(data).sort((a,b) => b.ts - a.ts) : [];
      renderLog();
    });

    toast('Firebase conectado — sincronização ativa', 'success');
  } catch(e) {
    console.error('[SCI Firebase] Erro ao inicializar:', e);
    toast('Firebase não configurado — modo offline', 'info');
    _fbActive = false;
  }
}

// ── HELPER: OUVIR NÓ ────────────────────────────────────────────────────────
function listenNode(node, callback) {
  _db.ref(node).on('value', snap => {
    callback(snap.val());
  });
}

// ── HELPER: ESCREVER ────────────────────────────────────────────────────────
function fbSet(path, value) {
  if (!_fbActive) return;
  _db.ref(path).set(value).catch(e => console.error('[SCI Firebase] Erro ao escrever em', path, e));
}

function fbPush(path, value) {
  if (!_fbActive) return _localPushId();
  const ref = _db.ref(path).push();
  ref.set({ ...value, _key: ref.key });
  return ref.key;
}

function fbRemove(path) {
  if (!_fbActive) return;
  _db.ref(path).remove().catch(e => console.error('[SCI Firebase] Erro ao remover', path, e));
}

function _localPushId() {
  return 'local_' + Date.now() + '_' + Math.random().toString(36).substr(2,5);
}

// ── SEED: DADOS INICIAIS ─────────────────────────────────────────────────────
function seedFirebase() {
  if (!_fbActive) return;

  // Militares
  const persObj = {};
  PERSONNEL0.forEach(p => { persObj['p' + p.id] = p; });
  _db.ref('personnel').set(persObj);

  // Viaturas
  const vObj = {};
  VEHICLES0.forEach(v => { vObj[v.id] = v; });
  _db.ref('vehicles').set(vObj);

  // Embarcações
  const eObj = {};
  VESSELS0.forEach(e => { eObj[e.id] = e; });
  _db.ref('vessels').set(eObj);

  console.log('[SCI Firebase] Seed concluído');
}

// ── REFRESH ALL SCI SLOTS ────────────────────────────────────────────────────
function refreshAllSlots() {
  Object.keys(SLOTS).forEach(k => refreshSlot(k));
  // atualizar sidebar incidente
  const inc = DB.incidents.find(i => i.st === 'ATIVO');
  if (inc) {
    document.getElementById('sb-inc-name').textContent = inc.id + ' – ' + inc.desc;
    document.getElementById('sb-inc-time').textContent = inc.ts + ' · ' + inc.city;
    document.getElementById('sci-inc-lbl').textContent = inc.id + ' – ' + inc.desc + ' · ' + inc.city;
  }
}

// ── WRAPPERS DE ESCRITA (usados pelo app) ────────────────────────────────────

// Salvar incidente no Firebase
function fbSaveIncident(inc) {
  fbSet('incidents/' + inc.id, inc);
}

// Atualizar status incidente
function fbUpdateIncident(id, fields) {
  if (!_fbActive) return;
  _db.ref('incidents/' + id).update(fields);
}

// Salvar missão
function fbSaveMission(m) {
  fbSet('missions/' + m.id, m);
}

// Atualizar status missão
function fbUpdateMission(id, fields) {
  if (!_fbActive) return;
  _db.ref('missions/' + id).update(fields);
}

// Remover missão
function fbDeleteMission(id) {
  fbRemove('missions/' + id);
}

// Salvar designação SCI
function fbSaveAssign(key, person) {
  fbSet('assign/' + key, person || null);
}

// Remover designação SCI
function fbClearAssign(key) {
  fbRemove('assign/' + key);
}

// Salvar recurso (viatura / aeronave / embarcação)
function fbSaveResource(r) {
  const node = r.type === 'vehicle' ? 'vehicles' : r.type === 'aircraft' ? 'aircraft' : 'vessels';
  fbSet(node + '/' + r.id, r);
}

// Atualizar status recurso
function fbUpdateResourceStatus(id, type, st) {
  const node = type === 'vehicle' ? 'vehicles' : type === 'aircraft' ? 'aircraft' : 'vessels';
  if (!_fbActive) return;
  _db.ref(node + '/' + id + '/st').set(st);
}

// Salvar militar
function fbSavePersonnel(p) {
  fbSet('personnel/p' + p.id, p);
}

// Salvar entrada no log
function fbSaveLog(entry) {
  if (!_fbActive) return;
  _db.ref('log').push({ ...entry, ts: Date.now() });
}
