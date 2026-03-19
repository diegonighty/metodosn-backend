const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

const app = express();
const PORT = process.env.PORT || 3000;
 //xd
// Middlewares
app.use(cors());
app.use(express.json());

// ==========================================
// CONEXIÓN A MONGODB
// ==========================================
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('✅ Conectado a MongoDB'))
    .catch(err => console.error('❌ Error al conectar a MongoDB:', err));

// ==========================================
// MODELO DE DATOS (Schema)
// ==========================================
const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    racha: { type: Number, default: 0 },
    puntos: { type: Number, default: 0 }
}, { timestamps: true });

const User = mongoose.model('User', userSchema);

// ==========================================
// ENDPOINTS (RUTAS)
// ==========================================

// 1. Obtener la lista de usuarios (Leaderboard)
app.get('/api/usuarios', async (req, res) => {
    try {
        // Buscamos todos, ordenamos por puntos desc (-1) y racha desc
        const usuarios = await User.find().sort({ puntos: -1, racha: -1 });
        res.json(usuarios);
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener el ranking' });
    }
});

// 2. Crear o actualizar un usuario manualmente
app.post('/api/usuarios', async (req, res) => {
    const { username, racha, puntos } = req.body;

    if (!username) return res.status(400).json({ error: 'Falta el username.' });

    try {
        // upsert: true crea el documento si no existe
        const user = await User.findOneAndUpdate(
            { username },
            { racha, puntos },
            { new: true, upsert: true }
        );
        res.json({ mensaje: 'Usuario guardado/actualizado con éxito.', user });
    } catch (error) {
        res.status(500).json({ error: 'Error al procesar el usuario' });
    }
});

// 3. Registrar una victoria
app.post('/api/usuarios/win', async (req, res) => {
    const { username } = req.body;
    if (!username) return res.status(400).json({ error: 'Falta el username.' });

    try {
        const user = await User.findOneAndUpdate(
            { username },
            { $inc: { racha: 1, puntos: 25 } }, // Incrementa racha en 1 y puntos en 25
            { new: true, upsert: true, setDefaultsOnInsert: true }
        );
        res.json({ mensaje: '¡Victoria registrada!', user });
    } catch (error) {
        res.status(500).json({ error: 'Error al registrar victoria' });
    }
});

// 4. Registrar una derrota
app.post('/api/usuarios/lose', async (req, res) => {
    const { username } = req.body;
    if (!username) return res.status(400).json({ error: 'Falta el username.' });

    try {
        const user = await User.findOne({ username });
        
        if (user) {
            user.racha = 0;
            user.puntos = Math.max(0, user.puntos - 15);
            await user.save();
        }

        res.json({ mensaje: 'Derrota registrada.', user });
    } catch (error) {
        res.status(500).json({ error: 'Error al registrar derrota' });
    }
});

app.get('/', (req, res) => {
    res.send("🔥 Backend con MongoDB corriendo al 100%");
});

app.listen(PORT, () => {
    console.log(`🔥 Servidor corriendo en el puerto ${PORT}`);
});
