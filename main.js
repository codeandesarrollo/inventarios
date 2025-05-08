// main.js

// ——— 1) Inicializa Firebase ———
const firebaseConfig = {
  apiKey:    "AIzaSyAhsavAS72wIk1X-q-aukHeyK-GpAWXVl4",
  authDomain:"appinventario-fab49.firebaseapp.com",
  projectId: "appinventario-fab49"
};
firebase.initializeApp(firebaseConfig);

const db = firebase.firestore();
db.enablePersistence({ synchronizeTabs: true }).catch(() => {});

// ——— 2) Estado online/offline ———
const statusEl = document.getElementById('status');
function updateStatus() {
  const online = navigator.onLine;
  statusEl.textContent = online ? '🟢 Conectado' : '🔴 Sin conexión';
  statusEl.classList.toggle('text-success', online);
  statusEl.classList.toggle('text-danger',  !online);
}
window.addEventListener('online',  updateStatus);
window.addEventListener('offline', updateStatus);
updateStatus();

// ——— 3) Mensajes de error/warning ———
const msgEl = document.getElementById('login-msg');
function showMsg(text, type = 'error') {
  msgEl.textContent = text;
  msgEl.className = type === 'error' ? 'text-danger' : 'text-warning';
}
function clearMsg() {
  msgEl.textContent = '';
  msgEl.className = '';
}

// ——— 4) Login handler ———
document.getElementById('login-form')
        .addEventListener('submit', onLogin);

async function onLogin(e) {
  e.preventDefault();
  clearMsg();

  const username = document.getElementById('username').value.trim();
  const password = document.getElementById('password').value;

  // —— A) OFFLINE FALLBACK ——
  if (!navigator.onLine) {
    const cache = JSON.parse(localStorage.getItem('usuarioCache') || 'null');
    if (cache
        && cache.username === username
        && cache.password === password
    ) {
      // Restaurar datos de sesión
      localStorage.setItem('usuario',      JSON.stringify(cache.userData));
      localStorage.setItem('negocioId',    cache.negocioId);
      localStorage.setItem('nombreNegocio',cache.nombreNegocio);

      showMsg('⚠️ Offline: ingresando con credenciales guardadas','warning');
      return setTimeout(() => {
        window.location.href = 'dashboard.html';
      }, 800);
    } else {
      return showMsg('🚫 Offline y credenciales no encontradas','error');
    }
  }

  // —— B) AUTENTICACIÓN ONLINE ——
  try {
    // Busca usuario en cualquier subcolección "usuarios"
    const snap = await db.collectionGroup('usuarios')
                         .where('username','==', username)
                         .where('password','==', password)
                         .get();

    if (snap.empty) {
      return showMsg('🚫 Credenciales incorrectas','error');
    }

    // Tomamos el primer match
    const userDoc   = snap.docs[0];
    const userData  = userDoc.data();
    const negocioId = userDoc.ref.parent.parent.id;

    // Recupera nombre del negocio
    const negSnap = await db.collection('negocios').doc(negocioId).get();
    const nombreNegocio = negSnap.exists
      ? (negSnap.data().nombre || negocioId)
      : negocioId;

    // Guarda sesión para UI y para offline
    localStorage.setItem('usuario', JSON.stringify(userData));
    localStorage.setItem('negocioId', negocioId);
    localStorage.setItem('nombreNegocio', nombreNegocio);

    // Guarda también el cache offline de credenciales y datos
    localStorage.setItem('usuarioCache', JSON.stringify({
      username,
      password,
      userData,
      negocioId,
      nombreNegocio
    }));

    showMsg('✅ Bienvenido','warning');
    window.location.href = 'dashboard.html';

  } catch (err) {
    console.error('Error en login:', err);
    showMsg('❌ Error de conexión','error');
  }
}
