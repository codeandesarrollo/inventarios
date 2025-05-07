const firebaseConfig = {
  apiKey: "AIzaSyAhsavAS72wIk1X-q-aukHeyK-GpAWXVl4",
  authDomain: "appinventario-fab49.firebaseapp.com",
  projectId: "appinventario-fab49"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

firebase.firestore().enablePersistence()
  .catch(err => console.warn("Offline Firestore no disponible:", err));

document.getElementById("login-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const username = document.getElementById("username").value.trim();
  const password = document.getElementById("password").value.trim();
  const msg = document.getElementById("login-msg");

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
        localStorage.setItem("usuario", JSON.stringify(user));
        localStorage.setItem("negocioId", negocioId);
        localStorage.setItem("nombreNegocio", doc.data().nombre);
        msg.textContent = "Bienvenido";
        return window.location.href = "dashboard.html";
      }
    }
    msg.textContent = "Credenciales incorrectas";
  } catch (err) {
    console.error(err);
    msg.textContent = "Error de conexión";
  }
});
