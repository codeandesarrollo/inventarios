const firebaseConfig = {
    apiKey: "AIzaSyAhsavAS72wIk1X-q-aukHeyK-GpAWXVl4",
    authDomain: "appinventario-fab49.firebaseapp.com",
    projectId: "appinventario-fab49",
    storageBucket: "appinventario-fab49.firebasestorage.app",
    messagingSenderId: "848771867191",
    appId: "1:848771867191:web:1274d33ee8a1a64e9b15b2"
  };
  
  firebase.initializeApp(firebaseConfig);
  const db = firebase.firestore();
  
  document.getElementById("login-form").addEventListener("submit", async (e) => {
    e.preventDefault();
  
    const username = document.getElementById("username").value.trim();
    const password = document.getElementById("password").value;
    const msg = document.getElementById("login-msg");
  
    msg.textContent = "Verificando...";
  
    try {
      const negociosSnap = await db.collection("negocios").get();
      let usuarioValido = null;
      let negocioIdValido = null;
      let datosNegocio = null;
  
      for (const doc of negociosSnap.docs) {
        const negocioId = doc.id;
        const usuariosSnap = await db.collection(`negocios/${negocioId}/usuarios`)
          .where("username", "==", username)
          .where("password", "==", password)
          .get();
  
        if (!usuariosSnap.empty) {
          usuarioValido = usuariosSnap.docs[0].data();
          negocioIdValido = negocioId;
          datosNegocio = doc.data();
          break;
        }
      }
  
      if (!usuarioValido) {
        msg.textContent = "Usuario o contraseña incorrectos.";
        msg.style.color = "red";
        return;
      }
  
      // Guardar datos
      localStorage.setItem("usuario", JSON.stringify(usuarioValido));
      localStorage.setItem("negocioId", negocioIdValido);
      localStorage.setItem("nombreNegocio", datosNegocio.nombre);
  
      msg.textContent = "Bienvenido, redirigiendo...";
      msg.style.color = "green";
      setTimeout(() => window.location.href = "dashboard.html", 1500);
  
    } catch (err) {
      console.error(err);
      msg.textContent = "Error al conectar con Firestore.";
      msg.style.color = "red";
    }
  });
  