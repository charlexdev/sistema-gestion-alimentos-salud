// server/src/app.ts
import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import authRoutes from "./routes/auth.routes";
import foodRoutes from "./routes/food.routes";
import unitOfMeasurementRoutes from "./routes/unitOfMeasurement.routes";
import planRoutes from "./routes/plan.routes";
import medicalCenterRoutes from "./routes/medicalCenter.routes";
import providerRoutes from "./routes/provider.routes";
import foodEntryRoutes from "./routes/foodEntry.routes";
import userRoutes from "./routes/user.routes";

// Cargar variables de entorno desde .env
dotenv.config();

const app = express();

// Middleware
app.use(express.json());
app.use(cors());

// Conexión a la base de datos
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

app.use("/api/auth", authRoutes);
app.use("/api/foods", foodRoutes);
app.use("/api/units", unitOfMeasurementRoutes);
app.use("/api/plans", planRoutes);
app.use("/api/medical-centers", medicalCenterRoutes);
app.use("/api/providers", providerRoutes);
app.use("/api/food-entries", foodEntryRoutes);
app.use("/api/users", userRoutes);

// Definir el puerto
const PORT = process.env.PORT || 5000;

// Iniciar el servidor y conectar a la DB
const startServer = async () => {
  await connectDB();
  app.listen(PORT, () => {
    console.log(`Servidor corriendo en el puerto ${PORT}`);
  });
};

startServer();

export default app;
