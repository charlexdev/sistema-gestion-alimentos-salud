// server/src/controllers/foodEntry.controller.ts
import { Request, Response } from "express";
import FoodEntry from "../models/foodEntry.model";
import Food from "../models/food.model";
import MedicalCenter from "../models/medicalCenter.model";
import Provider from "../models/provider.model"; // <-- Importar el modelo Provider

const handleMongooseValidationError = (res: Response, error: any): void => {
  if (error.name === "ValidationError") {
    const messages = Object.values(error.errors).map((err: any) => err.message);
    res.status(400).json({ message: messages.join(", ") });
  } else {
    res.status(500).json({ message: "Error interno del servidor." });
  }
};

// Crear un nuevo registro de entrada (RF-10.1 - Solo administradores por ahora)
export const createFoodEntry = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { name, date, medicalCenterId, providerId, entryItems } = req.body;

    if (
      !name ||
      !date ||
      !medicalCenterId ||
      !providerId ||
      !entryItems ||
      !Array.isArray(entryItems) ||
      entryItems.length === 0
    ) {
      res
        .status(400)
        .json({
          message:
            "Todos los campos requeridos (nombre, fecha, ID de centro médico, ID de proveedor, ítems de entrada) son necesarios y entryItems debe ser un array no vacío.",
        });
      return;
    }

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

    const providerExists = await Provider.findById(providerId); // <-- Validar Proveedor
    if (!providerExists) {
      res
        .status(400)
        .json({
          message:
            "El ID del proveedor proporcionado no es válido o no existe.",
        });
      return;
    }

    for (const item of entryItems) {
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
              "Cada ítem de entrada debe tener un food ID válido y una cantidad positiva.",
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

    const newFoodEntry = new FoodEntry({
      name,
      date: new Date(date),
      medicalCenter: medicalCenterId,
      provider: providerId, // Asignar el ID del proveedor
      entryItems,
    });

    await newFoodEntry.save();
    // Popular el centro médico, proveedor y los alimentos para la respuesta
    await newFoodEntry.populate([
      {
        path: "medicalCenter",
        select: "name address contactInfo",
      },
      {
        path: "provider", // <-- Popular el proveedor
        select: "name contactInfo",
      },
      {
        path: "entryItems.food",
        select: "name unitOfMeasurement description",
        populate: {
          path: "unitOfMeasurement",
          select: "name symbol",
        },
      },
    ]);
    res.status(201).json(newFoodEntry);
  } catch (error: any) {
    console.error("Error al crear registro de entrada:", error.message);
    handleMongooseValidationError(res, error);
  }
};

// Obtener todos los registros de entrada (Usuarios autenticados)
export const getAllFoodEntries = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const foodEntries = await FoodEntry.find({})
      .populate({
        path: "medicalCenter",
        select: "name address contactInfo",
      })
      .populate({
        path: "provider", // <-- Popular el proveedor
        select: "name contactInfo",
      })
      .populate({
        path: "entryItems.food",
        select: "name unitOfMeasurement description",
        populate: {
          path: "unitOfMeasurement",
          select: "name symbol",
        },
      })
      .sort({ date: -1 });

    res.status(200).json(foodEntries);
  } catch (error: any) {
    console.error("Error al obtener registros de entrada:", error.message);
    res
      .status(500)
      .json({
        message: "Error interno del servidor al obtener registros de entrada.",
      });
  }
};

// Obtener un registro de entrada por ID (Usuarios autenticados)
export const getFoodEntryById = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const foodEntry = await FoodEntry.findById(req.params.id)
      .populate({
        path: "medicalCenter",
        select: "name address contactInfo",
      })
      .populate({
        path: "provider", // <-- Popular el proveedor
        select: "name contactInfo",
      })
      .populate({
        path: "entryItems.food",
        select: "name unitOfMeasurement description",
        populate: {
          path: "unitOfMeasurement",
          select: "name symbol",
        },
      });

    if (!foodEntry) {
      res.status(404).json({ message: "Registro de entrada no encontrado." });
      return;
    }
    res.status(200).json(foodEntry);
  } catch (error: any) {
    console.error(
      "Error al obtener registro de entrada por ID:",
      error.message
    );
    handleMongooseValidationError(res, error);
  }
};

// Actualizar un registro de entrada por ID (RF-10.2 - Solo administradores por ahora)
export const updateFoodEntry = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { name, date, medicalCenterId, providerId, entryItems } = req.body;

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

    if (providerId) {
      // <-- Validar Proveedor si se actualiza
      const providerExists = await Provider.findById(providerId);
      if (!providerExists) {
        res
          .status(400)
          .json({
            message:
              "El ID del proveedor proporcionado no es válido o no existe.",
          });
        return;
      }
    }

    if (entryItems && Array.isArray(entryItems)) {
      for (const item of entryItems) {
        if (
          item.quantity !== undefined &&
          (typeof item.quantity !== "number" || item.quantity < 0)
        ) {
          res
            .status(400)
            .json({
              message: "Cada ítem de entrada debe tener una cantidad positiva.",
            });
          return;
        }
        if (item.food) {
          const foodExists = await Food.findById(item.food);
          if (!foodExists) {
            res
              .status(400)
              .json({ message: `El alimento con ID ${item.food} no existe.` });
            return;
          }
        }
      }
    }

    const updatedFoodEntry = await FoodEntry.findByIdAndUpdate(
      req.params.id,
      {
        name,
        date: date ? new Date(date) : undefined,
        medicalCenter: medicalCenterId,
        provider: providerId, // Actualizar proveedor
        entryItems,
      },
      { new: true, runValidators: true }
    );

    if (!updatedFoodEntry) {
      res
        .status(404)
        .json({
          message: "Registro de entrada no encontrado para actualizar.",
        });
      return;
    }
    await updatedFoodEntry.populate([
      {
        path: "medicalCenter",
        select: "name address contactInfo",
      },
      {
        path: "provider", // <-- Popular proveedor
        select: "name contactInfo",
      },
      {
        path: "entryItems.food",
        select: "name unitOfMeasurement description",
        populate: {
          path: "unitOfMeasurement",
          select: "name symbol",
        },
      },
    ]);
    res.status(200).json(updatedFoodEntry);
  } catch (error: any) {
    console.error("Error al actualizar registro de entrada:", error.message);
    handleMongooseValidationError(res, error);
  }
};

// Eliminar un registro de entrada por ID (RF-10.3 - Solo administradores por ahora)
export const deleteFoodEntry = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const deletedFoodEntry = await FoodEntry.findByIdAndDelete(req.params.id);

    if (!deletedFoodEntry) {
      res
        .status(404)
        .json({ message: "Registro de entrada no encontrado para eliminar." });
      return;
    }
    res
      .status(200)
      .json({ message: "Registro de entrada eliminado exitosamente." });
  } catch (error: any) {
    console.error("Error al eliminar registro de entrada:", error.message);
    res
      .status(500)
      .json({
        message: "Error interno del servidor al eliminar registro de entrada.",
      });
  }
};
