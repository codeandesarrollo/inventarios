// Inicializa Firebase
const firebaseConfig = {
  apiKey: "AIzaSyAhsavAS72wIk1X-q-aukHeyK-GpAWXVl4",
  authDomain: "appinventario-fab49.firebaseapp.com",
  projectId: "appinventario-fab49"
};
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// Habilitar persistencia offline con sincronización entre pestañas
db.enablePersistence({ synchronizeTabs: true })
  .catch(err => {
    if (err.code === 'failed-precondition') {
      console.warn('⚠️ Persistencia offline limitada: múltiples pestañas abiertas.');
    } else if (err.code === 'unimplemented') {
      console.warn('⚠️ Persistencia offline no soportada por este navegador.');
    }
  });

// Manejo del formulario de login con fallback offline
document.getElementById("login-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const username = document.getElementById("username").value.trim();
  const password = document.getElementById("password").value.trim();
  const msg      = document.getElementById("login-msg");

  // 1) Fallback si no hay conexión: valida contra credenciales cacheadas
  if (!navigator.onLine) {
    const cached = JSON.parse(localStorage.getItem("usuarioCache"));
    if (cached && cached.username === username && cached.password === password) {
      return window.location.href = "dashboard.html";
    }
    return msg.textContent = "⚠️ Sin conexión y credenciales no encontradas";
  }

  // 2) Login online: consulta Firestore
  try {
    const negociosSnap = await db.collection("negocios").get();
    for (const doc of negociosSnap.docs) {
      const negocioId = doc.id;
      const usuariosSnap = await db.collection(`negocios/${negocioId}/usuarios`)
        .where("username", "==", username)
        .where("password", "==", password)
        .get();

      if (!usuariosSnap.empty) {
        const user = usuariosSnap.docs[0].data();
        // Guarda password para validación offline
        user.password = password;
        
        // Almacena datos en localStorage
        localStorage.setItem("usuario", JSON.stringify(user));
        localStorage.setItem("usuarioCache", JSON.stringify(user));
        localStorage.setItem("negocioId", negocioId);
        localStorage.setItem("nombreNegocio", doc.data().nombre || negocioId);

        msg.textContent = "✅ Bienvenido";
        return window.location.href = "dashboard.html";
      }
    }
    msg.textContent = "🚫 Credenciales incorrectas";
  } catch (err) {
    console.error("Error en login:", err);
    msg.textContent = "❌ Error de conexión con Firestore";
  }
});
