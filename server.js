const express = require('express');
const fs = require('fs');
const cors = require('cors');

const app = express();
const PORT = 3000;
const FILE_PATH = './database.json';

// Middlewares
app.use(cors());
app.use(express.json());

// Función auxiliar para leer el JSON local
const readDB = () => {
    // Si el archivo no existe, lo creamos con una estructura básica
    if (!fs.existsSync(FILE_PATH)) {
        fs.writeFileSync(FILE_PATH, JSON.stringify({ users: {} }));
    }
    const data = fs.readFileSync(FILE_PATH);
    return JSON.parse(data);
};

// Función auxiliar para guardar en el JSON local
const writeDB = (data) => {
    // El null, 2 es para que el JSON se guarde bonito y legible, no en una sola línea
    fs.writeFileSync(FILE_PATH, JSON.stringify(data, null, 2));
};

// ==========================================
// ENDPOINTS (RUTAS)
// ==========================================

// 1. Obtener la lista de usuarios (Leaderboard / Ranked)
app.get('/api/usuarios', (req, res) => {
    const db = readDB();

    // Convertimos el objeto de usuarios a un arreglo y lo ordenamos por puntos (de mayor a menor)
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

    const db = readDB();

    // Si no existe, lo creamos. Si existe, actualizamos lo que nos manden.
    if (!db.users[username]) {
        db.users[username] = { racha: racha || 0, puntos: puntos || 0 };
    } else {
        if (racha !== undefined) db.users[username].racha = racha;
        if (puntos !== undefined) db.users[username].puntos = puntos;
    }

    writeDB(db);
    res.json({ mensaje: 'Usuario guardado/actualizado con éxito.', user: db.users[username] });
});

// 3. Registrar una victoria (Sube racha y da puntos)
app.post('/api/usuarios/win', (req, res) => {
    const { username } = req.body;
    if (!username) return res.status(400).json({ error: 'Falta el username.' });

    const db = readDB();
    if (!db.users[username]) {
        db.users[username] = { racha: 0, puntos: 0 };
    }

    db.users[username].racha += 1;
    db.users[username].puntos += 25; // 25 puntos de ranked por ganar

    writeDB(db);
    res.json({ mensaje: '¡Victoria registrada!', user: db.users[username] });
});

// 4. Registrar una derrota (Pierde racha y baja puntos)
app.post('/api/usuarios/lose', (req, res) => {
    const { username } = req.body;
    if (!username) return res.status(400).json({ error: 'Falta el username.' });

    const db = readDB();
    if (!db.users[username]) {
        db.users[username] = { racha: 0, puntos: 0 };
    }

    db.users[username].racha = 0; // Pierde la racha
    db.users[username].puntos = Math.max(0, db.users[username].puntos - 15); // Pierde 15 puntos, pero no baja de 0

    writeDB(db);
    res.json({ mensaje: 'Derrota registrada. F en el chat.', user: db.users[username] });
});

// Iniciar el servidor
app.listen(PORT, () => {
    console.log(`🔥 Backend de Ranked corriendo en http://localhost:${PORT}`);
});