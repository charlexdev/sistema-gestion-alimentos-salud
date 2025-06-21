// server/src/controllers/plan.controller.ts (VERSIÓN FINAL CON VALIDACIÓN DE CENTRO MÉDICO)
import { Request, Response } from "express";
import Plan from "../models/plan.model";
import Food from "../models/food.model";
import MedicalCenter from "../models/medicalCenter.model"; // <-- Importar el modelo de MedicalCenter

// Función auxiliar para manejar errores de validación de Mongoose
const handleMongooseValidationError = (res: Response, error: any): void => {
  if (error.name === "ValidationError") {
    const messages = Object.values(error.errors).map((err: any) => err.message);
    res.status(400).json({ message: messages.join(", ") });
  } else {
    res.status(500).json({ message: "Error interno del servidor." });
  }
};

// Crear un nuevo plan (Solo administradores) - RF-10.4
export const createPlan = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    // CAMBIO CLAVE AQUÍ: Esperamos medicalCenterId en lugar de centerName
    const { name, date, medicalCenterId, foodItems } = req.body;

    if (
      !name ||
      !date ||
      !medicalCenterId ||
      !foodItems ||
      !Array.isArray(foodItems) ||
      foodItems.length === 0
    ) {
      res
        .status(400)
        .json({
          message:
            "Todos los campos requeridos (nombre, fecha, ID de centro médico, items de alimentos) son necesarios y foodItems debe ser un array no vacío.",
        });
      return;
    }

    // Validar que el medicalCenterId sea un ObjectId válido y que el centro médico exista
    const medicalCenterExists = await MedicalCenter.findById(medicalCenterId);
    if (!medicalCenterExists) {
      res
        .status(400)
        .json({
          message:
            "El ID del centro médico proporcionado no es válido o no existe.",
        });
      return;
    }

    // Validar que cada foodItem tenga un foodId válido y una cantidad
    for (const item of foodItems) {
      if (
        !item.food ||
        !item.quantity ||
        typeof item.quantity !== "number" ||
        item.quantity <= 0
      ) {
        res
          .status(400)
          .json({
            message:
              "Cada item de alimento debe tener un food ID válido y una cantidad positiva.",
          });
        return;
      }
      const foodExists = await Food.findById(item.food);
      if (!foodExists) {
        res
          .status(400)
          .json({ message: `El alimento con ID ${item.food} no existe.` });
        return;
      }
    }

    const newPlan = new Plan({
      name,
      date: new Date(date),
      medicalCenter: medicalCenterId, // <-- Asignar el ID del centro médico
      foodItems,
    });

    await newPlan.save();
    // Popular el centro médico y los alimentos para la respuesta
    await newPlan.populate([
      {
        path: "medicalCenter", // <-- Popular el centro médico
        select: "name address contactInfo",
      },
      {
        path: "foodItems.food",
        select: "name unitOfMeasurement description",
        populate: {
          path: "unitOfMeasurement",
          select: "name symbol",
        },
      },
    ]);
    res.status(201).json(newPlan);
  } catch (error: any) {
    console.error("Error al crear plan:", error.message);
    handleMongooseValidationError(res, error);
  }
};

// Obtener todos los planes (Usuarios autenticados)
export const getAllPlans = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const plans = await Plan.find({})
      .populate({
        path: "medicalCenter", // <-- Popular el centro médico
        select: "name address contactInfo",
      })
      .populate({
        path: "foodItems.food",
        select: "name unitOfMeasurement description",
        populate: {
          path: "unitOfMeasurement",
          select: "name symbol",
        },
      })
      .sort({ date: -1 });

    res.status(200).json(plans);
  } catch (error: any) {
    console.error("Error al obtener planes:", error.message);
    res
      .status(500)
      .json({ message: "Error interno del servidor al obtener planes." });
  }
};

// Obtener un plan por ID (Usuarios autenticados)
export const getPlanById = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const plan = await Plan.findById(req.params.id)
      .populate({
        path: "medicalCenter", // <-- Popular el centro médico
        select: "name address contactInfo",
      })
      .populate({
        path: "foodItems.food",
        select: "name unitOfMeasurement description",
        populate: {
          path: "unitOfMeasurement",
          select: "name symbol",
        },
      });

    if (!plan) {
      res.status(404).json({ message: "Plan no encontrado." });
      return;
    }
    res.status(200).json(plan);
  } catch (error: any) {
    console.error("Error al obtener plan por ID:", error.message);
    handleMongooseValidationError(res, error);
  }
};

// Actualizar un plan por ID (Solo administradores) - RF-10.5
export const updatePlan = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    // CAMBIO CLAVE AQUÍ: Esperamos medicalCenterId en lugar de centerName
    const { name, date, medicalCenterId, foodItems } = req.body;

    // Si se proporciona un medicalCenterId, validarlo
    if (medicalCenterId) {
      const medicalCenterExists = await MedicalCenter.findById(medicalCenterId);
      if (!medicalCenterExists) {
        res
          .status(400)
          .json({
            message:
              "El ID del centro médico proporcionado no es válido o no existe.",
          });
        return;
      }
    }

    // Validar foodItems si se proporcionan
    if (foodItems && Array.isArray(foodItems)) {
      for (const item of foodItems) {
        if (
          !item.food ||
          !item.quantity ||
          typeof item.quantity !== "number" ||
          item.quantity <= 0
        ) {
          res
            .status(400)
            .json({
              message:
                "Cada item de alimento debe tener un food ID válido y una cantidad positiva.",
            });
          return;
        }
        const foodExists = await Food.findById(item.food);
        if (!foodExists) {
          res
            .status(400)
            .json({ message: `El alimento con ID ${item.food} no existe.` });
          return;
        }
      }
    }

    const updatedPlan = await Plan.findByIdAndUpdate(
      req.params.id,
      // CAMBIO CLAVE AQUÍ: Actualizar medicalCenter
      {
        name,
        date: date ? new Date(date) : undefined,
        medicalCenter: medicalCenterId,
        foodItems,
      },
      { new: true, runValidators: true }
    );

    if (!updatedPlan) {
      res.status(404).json({ message: "Plan no encontrado para actualizar." });
      return;
    }
    // Popular el centro médico y los alimentos para la respuesta
    await updatedPlan.populate([
      {
        path: "medicalCenter",
        select: "name address contactInfo",
      },
      {
        path: "foodItems.food",
        select: "name unitOfMeasurement description",
        populate: {
          path: "unitOfMeasurement",
          select: "name symbol",
        },
      },
    ]);
    res.status(200).json(updatedPlan);
  } catch (error: any) {
    console.error("Error al actualizar plan:", error.message);
    handleMongooseValidationError(res, error);
  }
};

// Eliminar un plan por ID (no necesita cambios en la lógica)
export const deletePlan = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const deletedPlan = await Plan.findByIdAndDelete(req.params.id);

    if (!deletedPlan) {
      res.status(404).json({ message: "Plan no encontrado para eliminar." });
      return;
    }
    res.status(200).json({ message: "Plan eliminado exitosamente." });
  } catch (error: any) {
    console.error("Error al eliminar plan:", error.message);
    res
      .status(500)
      .json({ message: "Error interno del servidor al eliminar plan." });
  }
};
