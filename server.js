const express = require('express');
const cors = require('cors');

const app = express();
// Vercel asigna el puerto dinámicamente usando process.env.PORT
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(cors());
app.use(express.json());

// ==========================================
// BASE DE DATOS EN MEMORIA (Caché Local)
// ==========================================
// Toda la info vivirá aquí. Se reseteará si el servidor se reinicia o se "duerme" en Vercel.
const db = {
    users: {}
};

// ==========================================
// ENDPOINTS (RUTAS)
// ==========================================

// 1. Obtener la lista de usuarios (Leaderboard / Ranked)
app.get('/api/usuarios', (req, res) => {
    // Convertimos el objeto a un arreglo y lo ordenamos por puntos (de mayor a menor)
    const usuariosArray = Object.keys(db.users).map(username => {
        return {
            username: username,
            racha: db.users[username].racha,
            puntos: db.users[username].puntos
        };
    }).sort((a, b) => b.puntos - a.puntos);

    res.json(usuariosArray);
});

// 2. Crear o actualizar un usuario manualmente
app.post('/api/usuarios', (req, res) => {
    const { username, racha, puntos } = req.body;

    if (!username) {
        return res.status(400).json({ error: 'Falta el nombre de usuario (username).' });
    }

    // Si no existe, lo inicializamos
    if (!db.users[username]) {
        db.users[username] = { racha: racha || 0, puntos: puntos || 0 };
    } else {
        // Si existe y mandan datos, los actualizamos
        if (racha !== undefined) db.users[username].racha = racha;
        if (puntos !== undefined) db.users[username].puntos = puntos;
    }

    res.json({ mensaje: 'Usuario guardado/actualizado en caché con éxito.', user: db.users[username] });
});

// 3. Registrar una victoria (Sube racha y da puntos)
app.post('/api/usuarios/win', (req, res) => {
    const { username } = req.body;
    if (!username) return res.status(400).json({ error: 'Falta el username.' });

    if (!db.users[username]) {
        db.users[username] = { racha: 0, puntos: 0 };
    }

    db.users[username].racha += 1;
    db.users[username].puntos += 25; // 25 puntos de ranked por ganar

    res.json({ mensaje: '¡Victoria registrada!', user: db.users[username] });
});

// 4. Registrar una derrota (Opcional por si en un futuro castigas a quien ponga mal los intervalos)
app.post('/api/usuarios/lose', (req, res) => {
    const { username } = req.body;
    if (!username) return res.status(400).json({ error: 'Falta el username.' });

    if (!db.users[username]) {
        db.users[username] = { racha: 0, puntos: 0 };
    }

    db.users[username].racha = 0; // Pierde la racha
    db.users[username].puntos = Math.max(0, db.users[username].puntos - 15); // Pierde 15 puntos, pero no baja de 0

    res.json({ mensaje: 'Derrota registrada. F en el chat.', user: db.users[username] });
});

// Ruta de prueba para saber si el backend está vivo
app.get('/', (req, res) => {
    res.send("🔥 Backend de Ranked de Bisección corriendo al 100%");
});

// Iniciar el servidor
app.listen(PORT, () => {
    console.log(`🔥 Servidor corriendo en el puerto ${PORT}`);
});