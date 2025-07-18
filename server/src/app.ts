import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import authRoutes from "./routes/auth.routes";
import foodRoutes from "./routes/food.routes";
import unitOfMeasurementRoutes from "./routes/unitOfMeasurement.routes";
import providerRoutes from "./routes/provider.routes";
import userRoutes from "./routes/user.routes";
import foodEntryRoutes from "./routes/foodEntry.routes";
import foodPlanRoutes from "./routes/foodPlan.routes";
import medicalCenterRoutes from "./routes/medicalCenter.routes";
import stockRoutes from "./routes/stock.routes";

dotenv.config();

const app = express();

app.use(express.json());
app.use(cors());

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

app.get("/", (req, res) => {
  res.send("API de Gestión de Alimentos funcionando!");
});

app.use("/api/auth", authRoutes);
app.use("/api/foods", foodRoutes);
app.use("/api/units", unitOfMeasurementRoutes);
app.use("/api/providers", providerRoutes);
app.use("/api/users", userRoutes);
app.use("/api/foodentries", foodEntryRoutes);
app.use("/api/foodplans", foodPlanRoutes);
app.use("/api/medicalcenters", medicalCenterRoutes);
app.use("/api/stock", stockRoutes);

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  await connectDB();
  app.listen(PORT, () => {
    console.log(`Servidor ejecutándose en el puerto ${PORT}`);
  });
};

startServer();
