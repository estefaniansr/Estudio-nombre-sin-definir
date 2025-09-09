const express = require("express");
const mysql = require("mysql2");
const bcrypt = require("bcryptjs");
const bodyParser = require("body-parser");
const cors = require("cors");
const session = require("express-session");

const app = express();

// 1️⃣ Body parser
app.use(bodyParser.json());

// 2️⃣ CORS bien configurado
app.use(cors({
    origin: ["http://127.0.0.1:8100/", "http://localhost:8100/"],
    credentials: true // 🔹 permite enviar cookies
}));

// 3️⃣ Session antes de las rutas
app.use(session({
    secret: "luciano13",
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false, sameSite: "lax" }
}));

// Conexión a MySQL
const db = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "1306", // base de datos contraseña
    database: "tp" // nombre de base de datos
});
db.connect(err => {
    if (err) throw err;
    console.log("Conectado a MySQL ✅");
});

// Registro
app.post("/register", async (req, res) => {
    const { nombre, email, password, fecha } = req.body;

    if (!nombre  !email  !password) return res.status(400).json({ error: "Faltan datos" });

    const hashedPassword = await bcrypt.hash(password, 10);

    db.query(
        "INSERT INTO usuarios (nombre, email, password, fecha) VALUES (?, ?, ?, ?)",
        [nombre, email, hashedPassword, fecha], // 🔹 usar hashed password
        (err, result) => {
            if (err) {
                if (err.code === "ER_DUP_ENTRY") return res.status(400).json({ error: "El email ya está registrado" });
                return res.status(500).json({ error: "Error en el servidor" });
            }
            res.json({ message: "Usuario registrado con éxito ✅" });
        }
    );
});

// Login
app.post("/login", (req, res) => {
    const { email, password } = req.body;

    db.query(
        "SELECT * FROM usuarios WHERE email = ?",
        [email],
        async (err, results) => {
            if (err) return res.status(500).json({ error: "Error en el servidor" });
            if (results.length === 0) return res.status(401).json({ error: "Usuario no encontrado" });

            const user = results[0];
            const match = await bcrypt.compare(password, user.password);
            if (!match) return res.status(401).json({ error: "Contraseña incorrecta" });

            // Guardar id en la sesión
            req.session.userId = user.id;

            res.json({ message: "Login exitoso 🎉" });
        }
    );
});

// Logout
app.post("/logout", (req, res) => {
    if (!req.session) return res.status(400).json({ error: "No hay sesión activa" });

    req.session.destroy(err => {
        if (err) return res.status(500).json({ error: "Error al cerrar sesión" });
        res.json({ message: "Sesión cerrada con éxito" });
    });
});
app.listen(3000, () => {
    console.log("Servidor corriendo en http://127.0.0.1:3000/ 🚀");
});