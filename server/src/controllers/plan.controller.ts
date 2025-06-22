// server/src/controllers/plan.controller.ts

import { Request, Response } from "express";
import Plan, { IPlan, IPlanFoodItem, PlanType } from "../models/plan.model";
import Food from "../models/food.model";
import MedicalCenter from "../models/medicalCenter.model";
import Provider from "../models/provider.model";
import { isValidObjectId, Types } from "mongoose"; // Asegúrate de importar Types

// Función auxiliar para manejar errores de validación de Mongoose
const handleMongooseValidationError = (res: Response, error: any): void => {
  if (error.name === "ValidationError") {
    const messages = Object.values(error.errors).map((err: any) => err.message);
    res.status(400).json({ message: messages.join(", ") });
  } else {
    res.status(500).json({ message: "Error interno del servidor." });
  }
};

// HELPER: Función para sumar ítems de alimentos (útil para la agregación jerárquica)
const aggregateFoodItems = (
  foodItemsArrays: IPlanFoodItem[][]
): IPlanFoodItem[] => {
  const aggregatedMap = new Map<
    string,
    { quantity: number; food: any; provider: any }
  >();

  foodItemsArrays.forEach((itemsArray) => {
    itemsArray.forEach((item) => {
      // Asegurarse de que el 'food' y 'provider' están populados o son ObjectIds
      const foodId =
        (item.food instanceof Types.ObjectId
          ? item.food.toHexString()
          : (item.food as any)._id?.toHexString()) || "";
      const providerId =
        (item.provider instanceof Types.ObjectId
          ? item.provider.toHexString()
          : (item.provider as any)._id?.toHexString()) || "";

      // Usar una clave compuesta para diferenciar items de diferentes proveedores si el mismo alimento está en el plan
      const key = `${foodId}-${providerId}`;

      if (aggregatedMap.has(key)) {
        const existing = aggregatedMap.get(key)!;
        existing.quantity += item.quantity;
      } else {
        aggregatedMap.set(key, {
          quantity: item.quantity,
          food: item.food,
          provider: item.provider,
        });
      }
    });
  });

  return Array.from(aggregatedMap.values()).map((item) => ({
    food: item.food,
    quantity: item.quantity,
    provider: item.provider,
  })) as IPlanFoodItem[];
};

// Crear un nuevo plan (Solo administradores)
export const createPlan = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { name, medicalCenterId, startDate, endDate, planType, foodItems } =
      req.body;

    // Validar campos requeridos
    if (
      !name ||
      !medicalCenterId ||
      !startDate ||
      !endDate ||
      !planType ||
      !foodItems ||
      !Array.isArray(foodItems) ||
      foodItems.length === 0
    ) {
      res.status(400).json({
        message:
          "Todos los campos obligatorios (nombre, centro médico, fechas de inicio/fin, tipo de plan, ítems de alimentos) son requeridos.",
      });
      return;
    }

    // Validar ObjectIDs
    if (!isValidObjectId(medicalCenterId)) {
      res.status(400).json({ message: "ID de centro médico no válido." });
      return;
    }

    // Validar que el centro médico exista
    const medicalCenterExists = await MedicalCenter.findById(medicalCenterId);
    if (!medicalCenterExists) {
      res.status(404).json({ message: "Centro médico no encontrado." });
      return;
    }

    // Validar foodItems y sus referencias (food y provider)
    for (const item of foodItems) {
      if (!item.food || !isValidObjectId(item.food)) {
        res.status(400).json({
          message: "Cada ítem de alimento debe tener un ID de alimento válido.",
        });
        return;
      }
      if (!item.quantity || item.quantity <= 0) {
        res.status(400).json({
          message:
            "La cantidad de cada ítem de alimento debe ser un número positivo.",
        });
        return;
      }
      if (!item.provider || !isValidObjectId(item.provider)) {
        // Proveedor es requerido
        res.status(400).json({
          message:
            "Cada ítem de alimento debe tener un ID de proveedor válido.",
        });
        return;
      }

      // Opcional: validar que el alimento y el proveedor realmente existan en la DB
      const foodExists = await Food.findById(item.food);
      if (!foodExists) {
        res
          .status(404)
          .json({ message: `Alimento con ID ${item.food} no encontrado.` });
        return;
      }
      const providerExists = await Provider.findById(item.provider);
      if (!providerExists) {
        res.status(404).json({
          message: `Proveedor con ID ${item.provider} no encontrado.`,
        });
        return;
      }
    }

    // Validar que las fechas sean lógicas
    const start = new Date(startDate);
    const end = new Date(endDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Establecer la hora a medianoche para comparar solo la fecha

    // === NUEVA VALIDACIÓN: No permitir planes con fecha de inicio en el pasado ===
    if (start < today) {
      res.status(400).json({
        message: "La fecha de inicio del plan no puede ser en el pasado.",
      });
      return;
    }

    if (start >= end) {
      res.status(400).json({
        message: "La fecha de inicio debe ser anterior a la fecha de fin.",
      });
      return;
    }

    // Validar que el tipo de plan sea válido
    const validPlanTypes: PlanType[] = ["weekly", "monthly", "annual"];
    if (!validPlanTypes.includes(planType)) {
      res.status(400).json({
        message:
          "Tipo de plan no válido. Debe ser 'weekly', 'monthly' o 'annual'.",
      });
      return;
    }

    const newPlan = new Plan({
      name,
      medicalCenter: medicalCenterId,
      startDate: start,
      endDate: end,
      planType,
      foodItems,
    });

    await newPlan.save();

    // Popular el centro médico, los alimentos, las unidades de medida y los proveedores para la respuesta
    await newPlan.populate([
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
      {
        path: "foodItems.provider",
        select: "name contactInfo",
      },
    ]);

    res.status(201).json(newPlan);
  } catch (error: any) {
    console.error("Error al crear plan:", error.message);
    handleMongooseValidationError(res, error);
  }
};

// Obtener todos los planes con lógica de agregación jerárquica
export const getAllPlans = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const {
      page = 1,
      limit = 10,
      search,
      medicalCenterId, // Filtro por centro médico
      planType, // Filtro por tipo de plan (weekly, monthly, annual)
      startDate, // Rango de fecha de inicio para la consulta (o para la agregación)
      endDate, // Rango de fecha de fin para la consulta (o para la agregación)
      aggregateBy, // 'monthly' o 'annual' para agregar planes inferiores
    } = req.query;

    const query: any = {};
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);

    if (search) {
      query.name = { $regex: search, $options: "i" };
    }
    if (medicalCenterId && isValidObjectId(medicalCenterId)) {
      query.medicalCenter = medicalCenterId;
    }
    // Si se especifica un planType, se filtra por ese tipo, a menos que se pida agregación.
    if (
      planType &&
      ["weekly", "monthly", "annual"].includes(planType as string)
    ) {
      query.planType = planType;
    }

    // Filtrado por rango de fechas (el plan debe solaparse con el rango dado)
    // Esto se aplica tanto para la consulta normal como para la búsqueda de planes "padre" o "hijo"
    if (startDate || endDate) {
      query.$and = query.$and || [];
      if (startDate) {
        query.$and.push({ endDate: { $gte: new Date(startDate as string) } });
      }
      if (endDate) {
        query.$and.push({ startDate: { $lte: new Date(endDate as string) } });
      }
    }

    let plans: IPlan[] = [];
    let totalCount = 0;
    let medicalCenterObj: any; // Para guardar el objeto populado del centro médico si se encuentra

    if (medicalCenterId && isValidObjectId(medicalCenterId)) {
      medicalCenterObj = await MedicalCenter.findById(medicalCenterId);
      if (!medicalCenterObj) {
        res
          .status(404)
          .json({ message: "Centro médico especificado no encontrado." });
        return;
      }
    }

    // Lógica para obtener planes y, opcionalmente, agregar planes inferiores
    if (
      aggregateBy &&
      (aggregateBy === "monthly" || aggregateBy === "annual")
    ) {
      let childPlanType: PlanType;
      let grandChildPlanType: PlanType | undefined; // Para agregación anual de semanales a través de mensuales
      let targetDateRangeStart: Date;
      let targetDateRangeEnd: Date;

      if (!startDate || !endDate) {
        res.status(400).json({
          message:
            "Para agregación 'monthly' o 'annual', 'startDate' y 'endDate' son requeridos para definir el rango de agregación.",
        });
        return;
      }
      targetDateRangeStart = new Date(startDate as string);
      targetDateRangeEnd = new Date(endDate as string);

      if (aggregateBy === "monthly") {
        childPlanType = "weekly";
      } else {
        // aggregateBy === 'annual'
        childPlanType = "monthly";
        grandChildPlanType = "weekly"; // Para agregar semanas dentro de meses, que luego se agregan al año
      }

      // 1. Fetch relevant plans of the `aggregateBy` type (e.g., monthly plans for annual aggregation)
      const parentPlansQuery: any = {
        medicalCenter: medicalCenterId,
        planType: aggregateBy,
        startDate: { $lte: targetDateRangeEnd },
        endDate: { $gte: targetDateRangeStart },
      };
      if (search) {
        parentPlansQuery.name = query.name;
      }

      const parentPlans = await Plan.find(parentPlansQuery)
        .populate([
          { path: "medicalCenter", select: "name" },
          {
            path: "foodItems.food",
            select: "name unitOfMeasurement description",
            populate: { path: "unitOfMeasurement", select: "name symbol" },
          },
          { path: "foodItems.provider", select: "name contactInfo" },
        ])
        .lean();

      // 2. Fetch all relevant child plans (e.g., weekly plans for monthly, or monthly for annual)
      const childPlansQuery: any = {
        medicalCenter: medicalCenterId,
        planType: childPlanType,
        startDate: { $lte: targetDateRangeEnd },
        endDate: { $gte: targetDateRangeStart },
      };
      // No aplicar 'search' a los sub-planes a menos que se desee específicamente.
      // Si el search es para el nombre del plan agregado, no aplica a los sub-planes individuales.

      const childPlans = await Plan.find(childPlansQuery)
        .populate([
          { path: "medicalCenter", select: "name" },
          {
            path: "foodItems.food",
            select: "name unitOfMeasurement description",
            populate: { path: "unitOfMeasurement", select: "name symbol" },
          },
          { path: "foodItems.provider", select: "name contactInfo" },
        ])
        .lean();

      let grandChildPlans: IPlan[] = [];
      if (grandChildPlanType) {
        // If aggregating annually, also fetch weekly plans
        const grandChildPlansQuery: any = {
          medicalCenter: medicalCenterId,
          planType: grandChildPlanType,
          startDate: { $lte: targetDateRangeEnd },
          endDate: { $gte: targetDateRangeStart },
        };
        grandChildPlans = await Plan.find(grandChildPlansQuery)
          .populate([
            { path: "medicalCenter", select: "name" },
            {
              path: "foodItems.food",
              select: "name unitOfMeasurement description",
              populate: { path: "unitOfMeasurement", select: "name symbol" },
            },
            { path: "foodItems.provider", select: "name contactInfo" },
          ])
          .lean();
      }

      // Combine food items from parent plans, child plans, and grand-child plans
      let allRelevantFoodItems: IPlanFoodItem[] = [];
      let aggregatedPlanNames: string[] = [];

      parentPlans.forEach((plan) => {
        allRelevantFoodItems.push(...plan.foodItems);
        aggregatedPlanNames.push(plan.name);
      });

      childPlans.forEach((plan) => {
        allRelevantFoodItems.push(...plan.foodItems);
        if (!aggregatedPlanNames.includes(plan.name)) {
          aggregatedPlanNames.push(plan.name);
        }
      });

      grandChildPlans.forEach((plan) => {
        allRelevantFoodItems.push(...plan.foodItems);
        if (!aggregatedPlanNames.includes(plan.name)) {
          aggregatedPlanNames.push(plan.name);
        }
      });

      const finalAggregatedFoodItems = aggregateFoodItems([
        allRelevantFoodItems,
      ]);

      // Creamos un "plan agregado" virtual para la respuesta
      const aggregatedPlan: IPlan = {
        _id: new Types.ObjectId() as any, // ID dummy para el objeto JS
        name: `Plan ${aggregateBy} Agregado (${
          aggregatedPlanNames.join(", ") || "Sin planes específicos"
        })`,
        medicalCenter: medicalCenterObj, // Usar el objeto populado/encontrado
        startDate: targetDateRangeStart,
        endDate: targetDateRangeEnd,
        planType: aggregateBy,
        foodItems: finalAggregatedFoodItems,
      } as IPlan;

      plans = [aggregatedPlan]; // La respuesta es un solo plan agregado
      totalCount = 1; // Solo hay un plan agregado
    } else {
      // Si no se pide agregación, solo se buscan los planes normales
      totalCount = await Plan.countDocuments(query);
      plans = await Plan.find(query)
        .skip((pageNum - 1) * limitNum)
        .limit(limitNum)
        .populate([
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
          {
            path: "foodItems.provider",
            select: "name contactInfo",
          },
        ])
        .sort({ startDate: 1 }); // Ordenar por fecha de inicio
    }

    const totalPages = Math.ceil(totalCount / limitNum);

    res.status(200).json({
      plans,
      totalCount,
      currentPage: pageNum,
      totalPages,
    });
  } catch (error: any) {
    console.error("Error al obtener planes:", error.message);
    res.status(500).json({ message: "Error interno del servidor." });
  }
};

// Obtener un plan por ID
export const getPlanById = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    if (!isValidObjectId(req.params.id)) {
      res.status(400).json({ message: "ID de plan no válido." });
      return;
    }

    const plan = await Plan.findById(req.params.id).populate([
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
      {
        path: "foodItems.provider",
        select: "name contactInfo",
      },
    ]);

    if (!plan) {
      res.status(404).json({ message: "Plan no encontrado." });
      return;
    }
    res.status(200).json(plan);
  } catch (error: any) {
    console.error("Error al obtener plan por ID:", error.message);
    res.status(500).json({ message: "Error interno del servidor." });
  }
};

// Actualizar un plan por ID (Solo administradores)
export const updatePlan = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const { name, medicalCenterId, startDate, endDate, planType, foodItems } =
      req.body;

    if (!isValidObjectId(id)) {
      res.status(400).json({ message: "ID de plan no válido." });
      return;
    }

    // Validar campos requeridos (similar a createPlan)
    if (
      !name ||
      !medicalCenterId ||
      !startDate ||
      !endDate ||
      !planType ||
      !foodItems ||
      !Array.isArray(foodItems) ||
      foodItems.length === 0
    ) {
      res.status(400).json({
        message:
          "Todos los campos obligatorios (nombre, centro médico, fechas de inicio/fin, tipo de plan, ítems de alimentos) son requeridos.",
      });
      return;
    }

    if (!isValidObjectId(medicalCenterId)) {
      res.status(400).json({ message: "ID de centro médico no válido." });
      return;
    }
    const medicalCenterExists = await MedicalCenter.findById(medicalCenterId);
    if (!medicalCenterExists) {
      res.status(404).json({ message: "Centro médico no encontrado." });
      return;
    }

    for (const item of foodItems) {
      if (!item.food || !isValidObjectId(item.food)) {
        res.status(400).json({
          message: "Cada ítem de alimento debe tener un ID de alimento válido.",
        });
        return;
      }
      if (!item.quantity || item.quantity <= 0) {
        res.status(400).json({
          message:
            "La cantidad de cada ítem de alimento debe ser un número positivo.",
        });
        return;
      }
      if (!item.provider || !isValidObjectId(item.provider)) {
        // Proveedor es requerido
        res.status(400).json({
          message:
            "Cada ítem de alimento debe tener un ID de proveedor válido.",
        });
        return;
      }
      const foodExists = await Food.findById(item.food);
      if (!foodExists) {
        res
          .status(404)
          .json({ message: `Alimento con ID ${item.food} no encontrado.` });
        return;
      }
      const providerExists = await Provider.findById(item.provider);
      if (!providerExists) {
        res.status(404).json({
          message: `Proveedor con ID ${item.provider} no encontrado.`,
        });
        return;
      }
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Establecer la hora a medianoche para comparar solo la fecha

    // === NUEVA VALIDACIÓN: No permitir planes con fecha de inicio en el pasado ===
    if (start < today) {
      res.status(400).json({
        message: "La fecha de inicio del plan no puede ser en el pasado.",
      });
      return;
    }

    if (start >= end) {
      res.status(400).json({
        message: "La fecha de inicio debe ser anterior a la fecha de fin.",
      });
      return;
    }

    const validPlanTypes: PlanType[] = ["weekly", "monthly", "annual"];
    if (!validPlanTypes.includes(planType)) {
      res.status(400).json({
        message:
          "Tipo de plan no válido. Debe ser 'weekly', 'monthly' o 'annual'.",
      });
      return;
    }

    const updatedPlan = await Plan.findByIdAndUpdate(
      id,
      {
        name,
        medicalCenter: medicalCenterId,
        startDate: start,
        endDate: end,
        planType,
        foodItems,
      },
      { new: true, runValidators: true }
    );

    if (!updatedPlan) {
      res.status(404).json({ message: "Plan no encontrado para actualizar." });
      return;
    }

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
      {
        path: "foodItems.provider",
        select: "name contactInfo",
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
    if (!isValidObjectId(req.params.id)) {
      res.status(400).json({ message: "ID de plan no válido." });
      return;
    }
    const deletedPlan = await Plan.findByIdAndDelete(req.params.id);

    if (!deletedPlan) {
      res.status(404).json({ message: "Plan no encontrado para eliminar." });
      return;
    }
    res.status(200).json({ message: "Plan eliminado exitosamente." });
  } catch (error: any) {
    console.error("Error al eliminar plan:", error.message);
    res.status(500).json({ message: "Error interno del servidor." });
  }
};
