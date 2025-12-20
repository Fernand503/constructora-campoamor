import { auth } from "./firebase.js";
import { onAuthStateChanged  } from "https://www.gstatic.com/firebasejs/10.12.4/firebase-auth.js";

const navAdmin = document.getElementById("navAdmin")

// SI esta página no tiene ese link, no hacemos nada
if (navAdmin) {
    onAuthStateChanged(auth, (user) => {
        if (user) {
            navAdmin.classList.remove("hidden"); // Mi madre lo ve
        } else {
            navAdmin.classList.add("hidden"); //Clientes no lo ven
        }
    });
}