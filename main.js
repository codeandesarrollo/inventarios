// main.js

// ——— 1) Inicializa Firebase ———
const firebaseConfig = {
  apiKey:    "AIzaSyAhsavAS72wIk1X-q-aukHeyK-GpAWXVl4",
  authDomain:"appinventario-fab49.firebaseapp.com",
  projectId: "appinventario-fab49"
};
firebase.initializeApp(firebaseConfig);

const db   = firebase.firestore();
db.enablePersistence({ synchronizeTabs: true })
  .catch(err => {
    if (err.code === 'failed-precondition') {
      console.warn('⚠️ Persistencia limitada: múltiples pestañas abiertas.');
    } else if (err.code === 'unimplemented') {
      console.warn('⚠️ Persistencia no soportada por este navegador.');
    }
  });

// ——— 2) Indicador online/offline ———
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

// ——— 3) Helpers para mensajes ———
const msgEl = document.getElementById('login-msg');
function showMsg(text, type = 'error') {
  msgEl.textContent = text;
  msgEl.className = type === 'error' ? 'text-danger' : 'text-warning';
}
function clearMsg() {
  msgEl.textContent = '';
  msgEl.className = '';
}

// ——— 4) Manejar submit del login ———
document.getElementById('login-form')
  .addEventListener('submit', onLogin);

async function onLogin(e) {
  e.preventDefault();
  clearMsg();

  const username = document.getElementById('username').value.trim();
  const password = document.getElementById('password').value;

  // —— OFFLINE FALLBACK ——
  if (!navigator.onLine) {
    const negocioId = localStorage.getItem('negocioId');
    if (!negocioId) {
      return showMsg('⚠️ Sin datos de sesión cacheados', 'error');
    }
    try {
      const snap = await db
        .collection(`negocios/${negocioId}/usuarios`)
        .where('username','==', username)
        .where('password','==', password)
        .get({ source: 'cache' });

      if (snap.empty) {
        showMsg('🚫 Credenciales offline incorrectas', 'error');
      } else {
        showMsg('⚠️ Offline: autenticado con cache', 'warning');
        setTimeout(() => window.location.href = 'dashboard.html', 800);
      }
    } catch (err) {
      console.error(err);
      showMsg('❌ Error offline: datos no disponibles', 'error');
    }
    return;
  }

  // —— ONLINE AUTHENTICATION ——
  try {
    // Busca al usuario en cualquier subcolección "usuarios"
    const snap = await db
      .collectionGroup('usuarios')
      .where('username','==', username)
      .where('password','==', password)
      .get();

    if (snap.empty) {
      return showMsg('🚫 Credenciales incorrectas', 'error');
    }

    const userDoc  = snap.docs[0];
    const userData = userDoc.data();
    const negocioId = userDoc.ref.parent.parent.id;

    // Opcional: obtener nombreNegocio
    const negSnap = await db.collection('negocios').doc(negocioId).get();
    const nombreNegocio = negSnap.exists
      ? (negSnap.data().nombre || negocioId)
      : negocioId;

    // Guarda en localStorage para futuras sesiones/offline
    localStorage.setItem('usuario',     JSON.stringify(userData));
    localStorage.setItem('negocioId',   negocioId);
    localStorage.setItem('nombreNegocio', nombreNegocio);

    showMsg('✅ Bienvenido', 'warning');
    window.location.href = 'dashboard.html';

  } catch (err) {
    console.error('Error en login:', err);
    showMsg('❌ Error de conexión', 'error');
  }
}
