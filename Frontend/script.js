const BACKEND_URL = 'http://localhost:5001';

document.addEventListener('DOMContentLoaded', () => {
    checkAuthUI();
    fetchAuthors();
    fetchPosts();
});

// CONTROLLO UI UTENTE E STATO TOKEN (Ottimizzato senza stili inline)
function checkAuthUI() {
    const token = localStorage.getItem('accessToken');
    const authStatus = document.getElementById('authStatus');
    const loginForm = document.getElementById('loginForm');
    const logoutBtn = document.getElementById('logoutBtn');

    if (token) {
        authStatus.innerText = "🟢 Stato: Autenticato! Modulo Blog Sbloccato.";
        authStatus.className = "auth-status-bar authenticated"; // Usa le classi CSS per il colore verde
        loginForm.style.display = 'none';
        logoutBtn.style.display = 'block'; // Mostra il pulsante usando la classe CSS
    } else {
        authStatus.innerText = "🔴 Stato: Non Autenticato. Fai il login per vedere o creare i Post.";
        authStatus.className = "auth-status-bar unauthenticated"; // Usa le classi CSS per il colore rosso
        loginForm.style.display = 'flex';
        logoutBtn.style.display = 'none'; // Nasconde il pulsante
    }
}

// 🔑 COMPITO: Esegue il login e memorizza il token nel localStorage
document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;

    try {
        const response = await fetch(`${BACKEND_URL}/authors/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();

        if (response.ok) {
            localStorage.setItem('accessToken', data.token); // Salva token locale
            alert('Login effettuato con successo!');
            checkAuthUI();
            fetchPosts(); // Aggiorna i post protetti
        } else {
            alert(`Errore Login: ${data.message}`);
        }
    } catch (error) {
        console.error("Errore login:", error);
    }
});

// LOGOUT UTENTE
document.getElementById('logoutBtn').addEventListener('click', () => {
    localStorage.removeItem('accessToken');
    alert('Disconnesso correttamente.');
    checkAuthUI();
    fetchPosts();
});

// GET AUTORI (Accessibile liberamente)
async function fetchAuthors() {
    try {
        const response = await fetch(`${BACKEND_URL}/authors`);
        const data = await response.json();
        const container = document.getElementById('authorsList');
        container.innerHTML = '';
        
        if (data.authors && data.authors.length > 0) {
            data.authors.forEach(author => {
                let nome = author.nome || 'Autore';
                let cognome = author.cognome || '';
                container.innerHTML += `
                    <div class="item-box">
                        <strong>👤 ${nome} ${cognome}</strong>
                        <p>Email: ${author.email}</p>
                    </div>
                `;
            });
        } else {
            container.innerHTML = '<p>Nessun autore trovato.</p>';
        }
    } catch (error) {
        console.error("Errore caricamento autori:", error);
    }
}

// POST REGISTRAZIONE AUTORE
document.getElementById('authorForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const payload = {
        nome: document.getElementById('authNome').value,
        cognome: document.getElementById('authCognome').value,
        email: document.getElementById('authEmail').value,
        password: document.getElementById('authPassword').value,
        dataDiNascita: document.getElementById('authData').value,
        avatar: document.getElementById('authAvatar').value
    };

    try {
        const response = await fetch(`${BACKEND_URL}/authors`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        if (response.ok) {
            alert('Autore registrato con successo! Ora effettua il login sopra.');
            fetchAuthors();
        } else {
            const errData = await response.json();
            alert(`Errore registrazione: ${errData.message}`);
        }
    } catch (error) {
        console.error("Errore registrazione autore:", error);
    }
});

// 🔒 GET POST (Usa il token nell'header)
async function fetchPosts() {
    const token = localStorage.getItem('accessToken');
    const container = document.getElementById('postsList');

    if (!token) {
        container.innerHTML = '<p style="color: grey; font-style: italic;">Sblocca questa sezione eseguendo il login in alto.</p>';
        return;
    }

    try {
        const response = await fetch(`${BACKEND_URL}/blogPosts`, {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${token}` } // Iniezione token
        });

        if (response.status === 401) {
            container.innerHTML = '<p style="color: red;">Sessione non valida. Riesegui il login.</p>';
            return;
        }

        const data = await response.json();
        container.innerHTML = '';

        if (data.blogPosts && data.blogPosts.length > 0) {
            data.blogPosts.forEach(post => {
                const readVal = post.readTime ? post.readTime.value : 5;
                const readUnit = post.readTime ? post.readTime.unit : 'min';
                container.innerHTML += `
                    <div class="item-box">
                        <strong>📝 ${post.title}</strong> (${post.category})
                        <p>Autore: ${post.author}</p>
                        <p><small>Lettura: ${readVal} ${readUnit}</small></p>
                    </div>
                `;
            });
        } else {
            container.innerHTML = '<p>Nessun post trovato.</p>';
        }
    } catch (error) {
        console.error("Errore caricamento post:", error);
    }
}

// 🔒 POST CREAZIONE BLOG POST (Usa il token nell'header)
document.getElementById('postForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('accessToken');

    if (!token) {
        alert("Devi effettuare il login per poter pubblicare un post!");
        return;
    }

    const payload = {
        category: document.getElementById('postCategory').value,
        title: document.getElementById('postTitle').value,
        cover: document.getElementById('postCover').value,
        author: document.getElementById('postAuthor').value,
        readTime: {
            value: Number(document.getElementById('postReadValue').value),
            unit: document.getElementById('postReadUnit').value
        },
        content: document.getElementById('postContent').value
    };

    try {
        const response = await fetch(`${BACKEND_URL}/blogPosts`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}` // Iniezione token
            },
            body: JSON.stringify(payload)
        });
        if (response.ok) {
            document.getElementById('postForm').reset();
            alert('Post pubblicato!');
            fetchPosts();
        } else {
            const errData = await response.json();
            alert(`Errore pubblicazione: ${errData.message}`);
        }
    } catch (error) {
        console.error("Errore salvataggio post:", error);
    }
});