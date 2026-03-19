import mongoose from "mongoose";

// ===============================
// CACHE GLOBAL (CLAVE 🔥)
// ===============================
let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

async function connectDB() {
  if (cached.conn) return cached.conn;

  if (!cached.promise) {
    cached.promise = mongoose.connect(process.env.MONGO_URI, {
      bufferCommands: false,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      family: 4
    });
  }

  cached.conn = await cached.promise;
  return cached.conn;
}

// ===============================
// SCHEMA
// ===============================
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  racha: { type: Number, default: 0 },
  puntos: { type: Number, default: 0 }
}, { timestamps: true });

// Evita recompilar modelo en hot reload/serverless
const User = mongoose.models.User || mongoose.model("User", userSchema);

// ===============================
// HANDLER (SIN EXPRESS)
// ===============================
export default async function handler(req, res) {
  await connectDB();

  try {
    // ===========================
    // GET /api/usuarios
    // ===========================
    if (req.method === "GET" && req.url.includes("/api/usuarios")) {
      const usuarios = await User.find().sort({ puntos: -1, racha: -1 });
      return res.status(200).json(usuarios);
    }

    // ===========================
    // POST /api/usuarios
    // ===========================
    if (req.method === "POST" && req.url.includes("/api/usuarios") && !req.url.includes("win") && !req.url.includes("lose")) {
      const { username, racha, puntos } = req.body;

      if (!username) {
        return res.status(400).json({ error: "Falta el username." });
      }

      const user = await User.findOneAndUpdate(
        { username },
        { racha, puntos },
        { new: true, upsert: true }
      );

      return res.json({ mensaje: "Usuario guardado.", user });
    }

    // ===========================
    // POST /api/usuarios/win
    // ===========================
    if (req.method === "POST" && req.url.includes("/win")) {
      const { username } = req.body;

      if (!username) {
        return res.status(400).json({ error: "Falta el username." });
      }

      const user = await User.findOneAndUpdate(
        { username },
        { $inc: { racha: 1, puntos: 25 } },
        { new: true, upsert: true, setDefaultsOnInsert: true }
      );

      return res.json({ mensaje: "¡Victoria!", user });
    }

    // ===========================
    // POST /api/usuarios/lose
    // ===========================
    if (req.method === "POST" && req.url.includes("/lose")) {
      const { username } = req.body;

      if (!username) {
        return res.status(400).json({ error: "Falta el username." });
      }

      const user = await User.findOne({ username });

      if (user) {
        user.racha = 0;
        user.puntos = Math.max(0, user.puntos - 15);
        await user.save();
      }

      return res.json({ mensaje: "Derrota.", user });
    }

    // fallback
    return res.status(404).json({ error: "Ruta no encontrada" });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Error interno" });
  }
}
