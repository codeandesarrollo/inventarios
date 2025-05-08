// main.js

// ——— 1) Inicializa Firebase ———
const firebaseConfig = {
  apiKey:    "AIzaSyAhsavAS72wIk1X-q-aukHeyK-GpAWXVl4",
  authDomain:"appinventario-fab49.firebaseapp.com",
  projectId: "appinventario-fab49"
};
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
db.enablePersistence({ synchronizeTabs: true }).catch(()=>{});

// ——— 2) Indicador online/offline ———
const statusEl = document.getElementById('status');
function updateStatus() {
  const o = navigator.onLine;
  statusEl.textContent = o ? '🟢 Conectado' : '🔴 Sin conexión';
  statusEl.classList.toggle('text-success', o);
  statusEl.classList.toggle('text-danger',  !o);
}
window.addEventListener('online',  updateStatus);
window.addEventListener('offline', updateStatus);
updateStatus();

// ——— 3) Mensajes de login ———
const msgEl = document.getElementById('login-msg');
function showMsg(txt, type='error') {
  msgEl.textContent = txt;
  msgEl.className = type==='error' ? 'text-danger' : 'text-warning';
}
function clearMsg() {
  msgEl.textContent = '';
  msgEl.className = '';
}

// ——— 4) Maneja el submit ———
document.getElementById('login-form')
        .addEventListener('submit', async e => {
  e.preventDefault();
  clearMsg();

  const username = document.getElementById('username').value.trim();
  const password = document.getElementById('password').value.trim();

  // A) OFFLINE-FIRST: si hay cache y coincide, entrar sin tocar Firestore
  const cache = JSON.parse(localStorage.getItem('usuarioCache') || 'null');
  if (!navigator.onLine && cache) {
    if (cache.username===username && cache.password===password) {
      // restaura sesión
      localStorage.setItem('usuario',      JSON.stringify(cache.userData));
      localStorage.setItem('negocioId',    cache.negocioId);
      localStorage.setItem('nombreNegocio',cache.nombreNegocio);

      showMsg('⚠️ Offline: ingresando con credenciales guardadas','warning');
      return setTimeout(() => location.href='dashboard.html', 800);
    } else {
      return showMsg('🚫 Offline y credenciales no encontradas','error');
    }
  }

  // B) LOGIN ONLINE
  try {
    // iteramos tus negocios para encontrar al usuario
    const negociosSnap = await db.collection('negocios').get();
    for (const doc of negociosSnap.docs) {
      const idNeg = doc.id;
      const usSnap = await db
        .collection(`negocios/${idNeg}/usuarios`)
        .where('username','==', username)
        .where('password','==', password)
        .get();
      if (!usSnap.empty) {
        const data = usSnap.docs[0].data();
        const nombreNeg = doc.data().nombre || idNeg;

        // guarda sesión activa
        localStorage.setItem('usuario',       JSON.stringify(data));
        localStorage.setItem('negocioId',     idNeg);
        localStorage.setItem('nombreNegocio', nombreNeg);

        // guarda cache offline completo
        localStorage.setItem('usuarioCache', JSON.stringify({
          username,
          password,
          userData:     data,
          negocioId:    idNeg,
          nombreNegocio: nombreNeg
        }));

        showMsg('✅ Bienvenido','warning');
        return location.href='dashboard.html';
      }
    }
    showMsg('🚫 Credenciales incorrectas','error');
  } catch (err) {
    console.error('Login online falló:', err);
    showMsg('❌ Error de conexión, inténtalo de nuevo','error');
  }
});
