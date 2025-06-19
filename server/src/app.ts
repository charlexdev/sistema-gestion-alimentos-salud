import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import authRoutes from "./routes/auth.routes"; // <-- Importar rutas de autenticación

// Cargar variables de entorno desde .env
dotenv.config();

const app = express();

// Middleware
app.use(express.json()); // Para parsear JSON en las peticiones
app.use(cors()); // Habilitar CORS para permitir peticiones desde el frontend

// Conexión a la base de datos (ya existente)
const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGO_URI;
    if (!mongoUri) {
      throw new Error(
        "MONGO_URI no está definida en las variables de entorno."
      );
    }
    await mongoose.connect(mongoUri);
    console.log("MongoDB conectado exitosamente");
  } catch (error: any) {
    console.error("Error al conectar a MongoDB:", error.message);
    process.exit(1);
  }
};

// Rutas
app.get("/", (req, res) => {
  res.send("API de Gestión de Alimentos funcionando!");
});

app.use("/api/auth", authRoutes); // <-- Usar las rutas de autenticación con prefijo /api/auth

// Definir el puerto (ya existente)
const PORT = process.env.PORT || 5000;

// Iniciar el servidor y conectar a la DB (ya existente)
const startServer = async () => {
  await connectDB();
  app.listen(PORT, () => {
    console.log(`Servidor corriendo en el puerto ${PORT}`);
  });
};

startServer();

export default app;
