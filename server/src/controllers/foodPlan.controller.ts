// server/src/controllers/foodPlan.controller.ts
import { Request, Response } from "express";
import FoodPlan from "../models/foodPlan.model";
import MedicalCenter from "../models/medicalCenter.model";
import Food from "../models/food.model";
import Provider from "../models/provider.model";
import FoodEntry from "../models/foodEntry.model"; // Necesario para calcular el "real" y ahora para eliminar
import { isValidObjectId } from "mongoose";
import ExcelJS from "exceljs";
import * as fs from "fs"; // Importar el módulo fs para leer archivos
import * as path from "path"; // Importar el módulo path para manejar rutas de archivos
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  WidthType,
  VerticalAlign,
  BorderStyle,
  AlignmentType, // Importado para alineación de texto y contenido
  ShadingType, // Importado para sombreado de celdas
  ImageRun, // Importado para insertar imágenes
} from "docx";
// Importaciones de date-fns
import {
  format,
  subWeeks,
  subMonths,
  subYears,
  startOfDay,
  endOfDay,
} from "date-fns";

// Función auxiliar para manejar errores de validación de Mongoose
const handleMongooseValidationError = (res: Response, error: any): void => {
  if (error.name === "ValidationError") {
    const messages = Object.values(error.errors).map((err: any) => err.message);
    res.status(400).json({ message: messages.join(", ") });
  } else {
    res.status(500).json({ message: "Error interno del servidor." });
  }
};

// Validar que los IDs de alimentos y proveedores dentro de plannedFoods sean válidos
const validatePlannedFoods = async (
  plannedFoods: any[]
): Promise<string | null> => {
  for (const item of plannedFoods) {
    if (!isValidObjectId(item.food)) {
      return `ID de alimento no válido: ${item.food}`;
    }
    if (!isValidObjectId(item.provider)) {
      return `ID de proveedor no válido: ${item.provider}`;
    }
    const foodExists = await Food.findById(item.food);
    if (!foodExists) {
      return `Alimento con ID ${item.food} no encontrado.`;
    }
    const providerExists = await Provider.findById(item.provider);
    if (!providerExists) {
      return `Proveedor con ID ${item.provider} no encontrado.`;
    }
  }
  return null; // Todo válido
};

// Crear un nuevo Plan de Alimentos (Solo administradores)
export const createFoodPlan = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    // Añade esta línea para depurar lo que el servidor recibe
    console.log("Request Body recibido en createFoodPlan:", req.body);

    const {
      name,
      medicalCenter, // CAMBIO: Aquí se corrige de 'medicalCenterId' a 'medicalCenter'
      type,
      startDate,
      endDate,
      plannedFoods,
      weeklyPlans,
      monthlyPlans,
    } = req.body;

    if (
      !name ||
      !medicalCenter || // CAMBIO: Usar 'medicalCenter'
      !type ||
      !startDate ||
      !endDate ||
      !plannedFoods
    ) {
      // Esta línea nos dirá qué campo específico es el que está "falsey"
      console.log(
        `Falla de validación inicial: 
        name: ${!!name}, 
        medicalCenter: ${!!medicalCenter}, // CAMBIO: Usar 'medicalCenter'
        type: ${!!type}, 
        startDate: ${!!startDate}, 
        endDate: ${!!endDate}, 
        plannedFoods: ${!!plannedFoods}`
      );
      res.status(400).json({
        message:
          "Todos los campos obligatorios (nombre, centro médico, tipo, fechas, alimentos planificados) son necesarios.",
      });
      return;
    }

    if (!isValidObjectId(medicalCenter)) {
      // CAMBIO: Usar 'medicalCenter'
      res.status(400).json({ message: "ID de centro médico no válido." });
      return;
    }
    const existingMedicalCenter = await MedicalCenter.findById(medicalCenter); // CAMBIO: Usar 'medicalCenter'
    if (!existingMedicalCenter) {
      res
        .status(404)
        .json({ message: "El centro médico especificado no existe." });
      return;
    }

    // Validar los IDs dentro de plannedFoods
    const plannedFoodsError = await validatePlannedFoods(plannedFoods);
    if (plannedFoodsError) {
      res.status(400).json({ message: plannedFoodsError });
      return;
    }

    // Validar y verificar la existencia de los planes referenciados (weeklyPlans, monthlyPlans)
    if (
      type === "monthly" &&
      (!weeklyPlans ||
        !Array.isArray(weeklyPlans) ||
        weeklyPlans.some((id) => !isValidObjectId(id)))
    ) {
      res.status(400).json({
        message:
          "Para un plan mensual, 'weeklyPlans' debe ser un array de IDs de planes válidos.",
      });
      return;
    }
    if (
      type === "annual" &&
      (!monthlyPlans ||
        !Array.isArray(monthlyPlans) ||
        monthlyPlans.some((id) => !isValidObjectId(id)))
    ) {
      res.status(400).json({
        message:
          "Para un plan anual, 'monthlyPlans' debe ser un array de IDs de planes válidos.",
      });
      return;
    }

    if (weeklyPlans) {
      for (const planId of weeklyPlans) {
        const plan = await FoodPlan.findById(planId);
        if (!plan || plan.type !== "weekly") {
          res.status(404).json({
            message: `Plan semanal con ID ${planId} no encontrado o no es de tipo semanal.`,
          });
          return;
        }
      }
    }
    if (monthlyPlans) {
      for (const planId of monthlyPlans) {
        const plan = await FoodPlan.findById(planId);
        if (!plan || plan.type !== "monthly") {
          res.status(404).json({
            message: `Plan mensual con ID ${planId} no encontrado o no es de tipo mensual.`,
          });
          return;
        }
      }
    }

    const newFoodPlan = new FoodPlan({
      name,
      medicalCenter: medicalCenter, // CAMBIO: Usar 'medicalCenter'
      type,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      plannedFoods,
      weeklyPlans: type === "monthly" ? weeklyPlans : undefined, // Solo si es mensual
      monthlyPlans: type === "annual" ? monthlyPlans : undefined, // Solo si es anual
    });

    await newFoodPlan.save();
    // Popular las referencias para la respuesta si es necesario
    await newFoodPlan.populate("medicalCenter", "name");
    await newFoodPlan.populate("plannedFoods.food", "name unitOfMeasurement");
    await newFoodPlan.populate("plannedFoods.provider", "name");
    res.status(201).json(newFoodPlan);
  } catch (error: any) {
    console.error("Error al crear plan de alimentos:", error.message);
    handleMongooseValidationError(res, error);
  }
};

// Obtener todos los Planes de Alimentos con filtros y paginación
export const getAllFoodPlans = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const search = (req.query.search as string) || "";
    const medicalCenterId = (req.query.medicalCenterId as string) || "";
    const providerId = (req.query.providerId as string) || "";
    const foodId = (req.query.foodId as string) || "";
    const planType = (req.query.type as string) || ""; // weekly, monthly, annual
    const status = (req.query.status as string) || ""; // active, concluded

    const query: any = {};

    if (search) {
      // Buscar por nombre del plan
      query.name = { $regex: search, $options: "i" };
    }
    if (medicalCenterId && isValidObjectId(medicalCenterId)) {
      query.medicalCenter = medicalCenterId;
    }
    if (planType) {
      query.type = planType;
    }
    if (status) {
      query.status = status;
    }

    // Filtrar por proveedor o alimento dentro de plannedFoods
    if (providerId && isValidObjectId(providerId)) {
      query["plannedFoods.provider"] = providerId;
    }
    if (foodId && isValidObjectId(foodId)) {
      query["plannedFoods.food"] = foodId;
    }

    // Filtrado por rango de fechas (ej. para "última semana", "último mes", "último año" para reportes)
    const period = req.query.period as string; // 'lastWeek', 'lastMonth', 'lastYear', 'all'
    let startDateFilter: Date | undefined;
    let endDateFilter: Date | undefined;

    if (period && period !== "all") {
      const now = new Date(); // Usar new Date() en lugar de moment()
      switch (period) {
        case "lastWeek":
          startDateFilter = startOfDay(subWeeks(now, 1));
          endDateFilter = endOfDay(now);
          break;
        case "lastMonth":
          startDateFilter = startOfDay(subMonths(now, 1));
          endDateFilter = endOfDay(now);
          break;
        case "lastYear":
          startDateFilter = startOfDay(subYears(now, 1));
          endDateFilter = endOfDay(now);
          break;
        default:
          // Si el periodo no es reconocido, ignorar el filtro de fecha
          break;
      }
    }

    if (startDateFilter && endDateFilter) {
      query.startDate = { $lte: endDateFilter };
      query.endDate = { $gte: startDateFilter };
    }

    const totalItems = await FoodPlan.countDocuments(query);
    const totalPages = Math.ceil(totalItems / limit);

    const foodPlans = await FoodPlan.find(query)
      .populate("medicalCenter", "name")
      .populate("plannedFoods.food", "name unitOfMeasurement")
      .populate("plannedFoods.provider", "name")
      .populate({
        path: "plannedFoods.food",
        populate: {
          path: "unitOfMeasurement",
          select: "name symbol",
        },
        select: "name description",
      })
      .populate("weeklyPlans", "name type startDate endDate") // Para ver los planes referenciados
      .populate("monthlyPlans", "name type startDate endDate") // Para ver los planes referenciados
      .skip((page - 1) * limit)
      .limit(limit);

    // Calcular el real y el porcentaje para cada plan
    const plansWithRealAndPercentage = await Promise.all(
      foodPlans.map(async (plan) => {
        const totalPlannedQuantity = plan.plannedFoods.reduce(
          (sum, item) => sum + item.quantity,
          0
        );

        // Sumar las cantidades de alimentos de las entradas vinculadas a este plan
        const entriesForPlan = await FoodEntry.find({ foodPlan: plan._id });

        let totalRealQuantity = 0;
        entriesForPlan.forEach((entry) => {
          entry.enteredFoods.forEach((item) => {
            // Asegurarse de que el alimento en la entrada sea el mismo que el planificado (si aplica)
            // Aquí sumamos todo lo que entró para el plan, independientemente del alimento específico
            // La comparación detallada por alimento se haría en el frontend o en un reporte más específico
            totalRealQuantity += item.quantity;
          });
        });

        const percentage =
          totalPlannedQuantity > 0
            ? (totalRealQuantity / totalPlannedQuantity) * 100
            : 0;

        return {
          ...plan.toObject(), // Convertir a objeto JS para añadir propiedades
          totalPlannedQuantity: totalPlannedQuantity, // Añadir la propiedad aquí
          realQuantity: totalRealQuantity,
          percentageCompleted: parseFloat(percentage.toFixed(2)),
        };
      })
    );

    res.status(200).json({
      data: plansWithRealAndPercentage,
      totalItems,
      totalPages,
      currentPage: page,
      itemsPerPage: limit,
    });
  } catch (error: any) {
    console.error("Error al obtener planes de alimentos:", error.message);
    res.status(500).json({
      message: "Error interno del servidor al obtener planes de alimentos.",
    });
  }
};

// Obtener un Plan de Alimentos por ID
export const getFoodPlanById = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    if (!isValidObjectId(req.params.id)) {
      res.status(400).json({ message: "ID de plan de alimento no válido." });
      return;
    }
    const foodPlan = await FoodPlan.findById(req.params.id)
      .populate("medicalCenter", "name")
      .populate("plannedFoods.food", "name unitOfMeasurement")
      .populate("plannedFoods.provider", "name")
      .populate({
        path: "plannedFoods.food",
        populate: {
          path: "unitOfMeasurement",
          select: "name symbol",
        },
        select: "name description",
      })
      .populate("weeklyPlans", "name type startDate endDate")
      .populate("monthlyPlans", "name type startDate endDate");

    if (!foodPlan) {
      res.status(404).json({ message: "Plan de alimento no encontrado." });
      return;
    }

    // Calcular el real y el porcentaje para el plan específico
    const totalPlannedQuantity = foodPlan.plannedFoods.reduce(
      (sum, item) => sum + item.quantity,
      0
    );
    const entriesForPlan = await FoodEntry.find({ foodPlan: foodPlan._id });

    let totalRealQuantity = 0;
    entriesForPlan.forEach((entry) => {
      entry.enteredFoods.forEach((item) => {
        totalRealQuantity += item.quantity;
      });
    });

    const percentage =
      totalPlannedQuantity > 0
        ? (totalRealQuantity / totalPlannedQuantity) * 100
        : 0;

    res.status(200).json({
      ...foodPlan.toObject(),
      totalPlannedQuantity: totalPlannedQuantity, // Añadir la propiedad aquí
      realQuantity: totalRealQuantity,
      percentageCompleted: parseFloat(percentage.toFixed(2)),
    });
  } catch (error: any) {
    console.error("Error al obtener plan de alimento por ID:", error.message);
    res.status(500).json({
      message: "Error interno del servidor al obtener plan de alimento.",
    });
  }
};

// Actualizar un Plan de Alimentos por ID (Solo administradores)
export const updateFoodPlan = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const {
      name,
      medicalCenterId,
      type,
      startDate,
      endDate,
      plannedFoods,
      status,
      weeklyPlans,
      monthlyPlans,
    } = req.body;

    if (!isValidObjectId(req.params.id)) {
      res.status(400).json({ message: "ID de plan de alimento no válido." });
      return;
    }

    if (medicalCenterId && !isValidObjectId(medicalCenterId)) {
      res.status(400).json({ message: "ID de centro médico no válido." });
      return;
    }
    if (medicalCenterId) {
      const existingMedicalCenter = await MedicalCenter.findById(
        medicalCenterId
      );
      if (!existingMedicalCenter) {
        res
          .status(404)
          .json({ message: "El centro médico especificado no existe." });
        return;
      }
    }

    if (plannedFoods) {
      const plannedFoodsError = await validatePlannedFoods(plannedFoods);
      if (plannedFoodsError) {
        res.status(400).json({ message: plannedFoodsError });
        return;
      }
    }

    // Validar y verificar la existencia de los planes referenciados (weeklyPlans, monthlyPlans) si se están actualizando
    if (weeklyPlans !== undefined) {
      if (
        !Array.isArray(weeklyPlans) ||
        weeklyPlans.some((id) => !isValidObjectId(id))
      ) {
        res.status(400).json({
          message: "'weeklyPlans' debe ser un array de IDs de planes válidos.",
        });
        return;
      }
      for (const planId of weeklyPlans) {
        const plan = await FoodPlan.findById(planId);
        if (!plan || plan.type !== "weekly") {
          res.status(404).json({
            message: `Plan semanal con ID ${planId} no encontrado o no es de tipo semanal.`,
          });
          return;
        }
      }
    }
    if (monthlyPlans !== undefined) {
      if (
        !Array.isArray(monthlyPlans) ||
        monthlyPlans.some((id) => !isValidObjectId(id))
      ) {
        res.status(400).json({
          message: "'monthlyPlans' debe ser un array de IDs de planes válidos.",
        });
        return;
      }
      for (const planId of monthlyPlans) {
        const plan = await FoodPlan.findById(planId);
        if (!plan || plan.type !== "monthly") {
          res.status(404).json({
            message: `Plan mensual con ID ${planId} no encontrado o no es de tipo mensual.`,
          });
          return;
        }
      }
    }

    const updateData: any = {
      name,
      type,
      startDate,
      endDate,
      plannedFoods,
      status,
    };
    if (medicalCenterId) updateData.medicalCenter = medicalCenterId;
    if (type === "monthly") updateData.weeklyPlans = weeklyPlans;
    if (type === "annual") updateData.monthlyPlans = monthlyPlans;

    const updatedFoodPlan = await FoodPlan.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!updatedFoodPlan) {
      res
        .status(404)
        .json({ message: "Plan de alimento no encontrado para actualizar." });
      return;
    }

    await updatedFoodPlan.populate("medicalCenter", "name");
    await updatedFoodPlan.populate(
      "plannedFoods.food",
      "name unitOfMeasurement"
    );
    await updatedFoodPlan.populate("plannedFoods.provider", "name");
    await updatedFoodPlan.populate({
      path: "plannedFoods.food",
      populate: {
        path: "unitOfMeasurement",
        select: "name symbol",
      },
      select: "name description",
    });
    await updatedFoodPlan.populate(
      "weeklyPlans",
      "name type startDate endDate"
    );
    await updatedFoodPlan.populate(
      "monthlyPlans",
      "name type startDate endDate"
    );

    res.status(200).json(updatedFoodPlan);
  } catch (error: any) {
    console.error("Error al actualizar plan de alimentos:", error.message);
    handleMongooseValidationError(res, error);
  }
};

// Eliminar un Plan de Alimentos por ID (Solo administradores)
export const deleteFoodPlan = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    if (!isValidObjectId(req.params.id)) {
      res.status(400).json({ message: "ID de plan de alimento no válido." });
      return;
    }

    const foodPlanId = req.params.id;

    // Primero, encontrar y eliminar todas las entradas de alimentos asociadas a este plan.
    const deleteEntriesResult = await FoodEntry.deleteMany({
      foodPlan: foodPlanId,
    });
    console.log(
      `Eliminadas ${deleteEntriesResult.deletedCount} entradas de alimentos asociadas al plan ${foodPlanId}.`
    );

    // Luego, eliminar el plan de alimentos.
    const deletedFoodPlan = await FoodPlan.findByIdAndDelete(foodPlanId);

    if (!deletedFoodPlan) {
      res
        .status(404)
        .json({ message: "Plan de alimento no encontrado para eliminar." });
      return;
    }

    res.status(200).json({
      message: `Plan de alimento '${deletedFoodPlan.name}' y sus ${deleteEntriesResult.deletedCount} entradas asociadas eliminados exitosamente.`,
    });
  } catch (error: any) {
    console.error("Error al eliminar plan de alimentos:", error.message);
    res.status(500).json({
      message: "Error interno del servidor al eliminar plan de alimentos.",
    });
  }
};

// Obtener Real vs Planificado para un Plan de Alimentos específico
export const getFoodPlanRealVsPlanned = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    if (!isValidObjectId(req.params.id)) {
      res.status(400).json({ message: "ID de plan de alimento no válido." });
      return;
    }
    const foodPlanId = req.params.id;
    const foodPlan = await FoodPlan.findById(foodPlanId);

    if (!foodPlan) {
      res.status(404).json({ message: "Plan de alimento no encontrado." });
      return;
    }

    // Calcular la cantidad total planificada
    const totalPlannedQuantity = foodPlan.plannedFoods.reduce(
      (sum, item) => sum + item.quantity,
      0
    );

    // Sumar las cantidades de alimentos de las entradas vinculadas a este plan
    const entriesForPlan = await FoodEntry.find({ foodPlan: foodPlanId });
    let totalRealQuantity = 0;
    entriesForPlan.forEach((entry) => {
      entry.enteredFoods.forEach((item) => {
        totalRealQuantity += item.quantity;
      });
    });

    const percentage =
      totalPlannedQuantity > 0
        ? (totalRealQuantity / totalPlannedQuantity) * 100
        : 0;

    res.status(200).json({
      planId: foodPlan._id,
      totalPlannedQuantity,
      totalRealQuantity,
      percentageCompleted: parseFloat(percentage.toFixed(2)),
      // Opcional: podrías devolver el detalle por alimento y proveedor si es necesario
    });
  } catch (error: any) {
    console.error(
      "Error al obtener real vs planificado del plan de alimentos:",
      error.message
    );
    res.status(500).json({
      message: "Error interno del servidor al obtener el real vs planificado.",
    });
  }
};

// Exportar Planes de Alimentos a Excel
export const exportFoodPlansToExcel = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const search = (req.query.search as string) || "";
    const medicalCenterId = (req.query.medicalCenterId as string) || "";
    const providerId = (req.query.providerId as string) || "";
    const foodId = (req.query.foodId as string) || "";
    const planType = (req.query.type as string) || "";
    const status = (req.query.status as string) || "";
    const period = req.query.period as string; // 'lastWeek', 'lastMonth', 'lastYear', 'all'

    const query: any = {};
    if (search) {
      query.name = { $regex: search, $options: "i" };
    }
    if (medicalCenterId && isValidObjectId(medicalCenterId)) {
      query.medicalCenter = medicalCenterId;
    }
    if (planType) {
      query.type = planType;
    }
    if (status) {
      query.status = status;
    }
    if (providerId && isValidObjectId(providerId)) {
      query["plannedFoods.provider"] = providerId;
    }
    if (foodId && isValidObjectId(foodId)) {
      query["plannedFoods.food"] = foodId;
    }

    let startDateFilter: Date | undefined;
    let endDateFilter: Date | undefined;

    if (period && period !== "all") {
      const now = new Date(); // Usar new Date() en lugar de moment()
      switch (period) {
        case "lastWeek":
          startDateFilter = startOfDay(subWeeks(now, 1));
          endDateFilter = endOfDay(now);
          break;
        case "lastMonth":
          startDateFilter = startOfDay(subMonths(now, 1));
          endDateFilter = endOfDay(now);
          break;
        case "lastYear":
          startDateFilter = startOfDay(subYears(now, 1));
          endDateFilter = endOfDay(now);
          break;
        default:
          break;
      }
    }

    if (startDateFilter && endDateFilter) {
      query.startDate = { $lte: endDateFilter };
      query.endDate = { $gte: startDateFilter };
    }

    const foodPlans = await FoodPlan.find(query)
      .populate("medicalCenter", "name")
      .populate("plannedFoods.food", "name unitOfMeasurement")
      .populate("plannedFoods.provider", "name");

    const plansWithRealAndPercentage = await Promise.all(
      foodPlans.map(async (plan) => {
        const totalPlannedQuantity = plan.plannedFoods.reduce(
          (sum, item) => sum + item.quantity,
          0
        );

        const entriesForPlan = await FoodEntry.find({ foodPlan: plan._id });
        let totalRealQuantity = 0;
        entriesForPlan.forEach((entry) => {
          entry.enteredFoods.forEach((item) => {
            totalRealQuantity += item.quantity;
          });
        });

        const percentage =
          totalPlannedQuantity > 0
            ? (totalRealQuantity / totalPlannedQuantity) * 100
            : 0;

        return {
          ...plan.toObject(),
          totalPlannedQuantity: totalPlannedQuantity,
          realQuantity: totalRealQuantity,
          percentageCompleted: parseFloat(percentage.toFixed(2)),
        };
      })
    );

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Planes de Alimentos");

    // --- Colores y Estilos para el informe Excel (similares a Word) ---
    const headerRowColor = "ADD8E6"; // Azul claro para el fondo de las cabeceras
    const textColor = "1F4E79"; // Azul oscuro para el texto
    const borderColor = "4682B4"; // Azul medio para los bordes

    // Definir columnas
    worksheet.columns = [
      { header: "Nombre del Plan", key: "name", width: 30 },
      { header: "Centro Médico", key: "medicalCenter", width: 30 },
      { header: "Tipo", key: "type", width: 15 },
      { header: "Fecha Inicio", key: "startDate", width: 15 },
      { header: "Fecha Fin", key: "endDate", width: 15 },
      {
        header: "Cant. Planificada Total",
        key: "totalPlannedQuantity",
        width: 25,
      },
      { header: "Cant. Real Total", key: "realQuantity", width: 20 },
      { header: "% Completado", key: "percentageCompleted", width: 18 },
      { header: "Estado", key: "status", width: 15 },
    ];

    // Aplicar estilos a la fila de cabecera
    const headerRow = worksheet.getRow(1);
    headerRow.eachCell((cell) => {
      cell.font = {
        bold: true,
        color: { argb: `FF${textColor}` }, // FF para opacidad total
      };
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: `FF${headerRowColor}` }, // FF para opacidad total
      };
      cell.border = {
        top: { style: "thin", color: { argb: `FF${borderColor}` } },
        left: { style: "thin", color: { argb: `FF${borderColor}` } },
        bottom: { style: "thin", color: { argb: `FF${borderColor}` } },
        right: { style: "thin", color: { argb: `FF${borderColor}` } },
      };
      cell.alignment = { vertical: "middle", horizontal: "center" };
    });

    // Añadir filas de datos
    plansWithRealAndPercentage.forEach((plan) => {
      const row = worksheet.addRow({
        name: plan.name,
        medicalCenter: (plan.medicalCenter as any)?.name || "N/A", // Si está populado, usa el nombre
        type: plan.type,
        startDate: format(new Date(plan.startDate), "yyyy-MM-dd"), // Usar date-fns
        endDate: format(new Date(plan.endDate), "yyyy-MM-dd"), // Usar date-fns
        totalPlannedQuantity: plan.totalPlannedQuantity,
        realQuantity: plan.realQuantity,
        percentageCompleted: `${plan.percentageCompleted}%`,
        status: plan.status,
      });

      // Aplicar estilos a las celdas de datos
      row.eachCell((cell) => {
        cell.font = {
          color: { argb: `FF${textColor}` },
        };
        cell.border = {
          top: { style: "thin", color: { argb: `FF${borderColor}` } },
          left: { style: "thin", color: { argb: `FF${borderColor}` } },
          bottom: { style: "thin", color: { argb: `FF${borderColor}` } },
          right: { style: "thin", color: { argb: `FF${borderColor}` } },
        };
        cell.alignment = { vertical: "middle", horizontal: "left" }; // Alineación por defecto a la izquierda
      });
    });

    // Configurar cabeceras de respuesta para descarga
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=" + `planes_alimentos_${Date.now()}.xlsx`
    );

    await workbook.xlsx.write(res);
    res.end();
  } catch (error: any) {
    console.error(
      "Error al exportar planes de alimentos a Excel:",
      error.message
    );
    res
      .status(500)
      .json({ message: "Error interno del servidor al exportar a Excel." });
  }
};

// Exportar Planes de Alimentos a Word
export const exportFoodPlansToWord = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const search = (req.query.search as string) || "";
    const medicalCenterId = (req.query.medicalCenterId as string) || "";
    const providerId = (req.query.providerId as string) || "";
    const foodId = (req.query.foodId as string) || "";
    const planType = (req.query.type as string) || "";
    const status = (req.query.status as string) || "";
    const period = req.query.period as string;

    const query: any = {};
    if (search) {
      query.name = { $regex: search, $options: "i" };
    }
    if (medicalCenterId && isValidObjectId(medicalCenterId)) {
      query.medicalCenter = medicalCenterId;
    }
    if (planType) {
      query.type = planType;
    }
    if (status) {
      query.status = status;
    }
    if (providerId && isValidObjectId(providerId)) {
      query["plannedFoods.provider"] = providerId;
    }
    if (foodId && isValidObjectId(foodId)) {
      query["plannedFoods.food"] = foodId;
    }

    let startDateFilter: Date | undefined;
    let endDateFilter: Date | undefined;

    if (period && period !== "all") {
      const now = new Date(); // Usar new Date() en lugar de moment()
      switch (period) {
        case "lastWeek":
          startDateFilter = startOfDay(subWeeks(now, 1));
          endDateFilter = endOfDay(now);
          break;
        case "lastMonth":
          startDateFilter = startOfDay(subMonths(now, 1));
          endDateFilter = endOfDay(now);
          break;
        case "lastYear":
          startDateFilter = startOfDay(subYears(now, 1));
          endDateFilter = endOfDay(now);
          break;
        default:
          break;
      }
    }

    if (startDateFilter && endDateFilter) {
      query.startDate = { $lte: endDateFilter };
      query.endDate = { $gte: startDateFilter };
    }

    const foodPlans = await FoodPlan.find(query)
      .populate("medicalCenter", "name")
      .populate("plannedFoods.food", "name unitOfMeasurement")
      .populate("plannedFoods.provider", "name");

    const plansWithRealAndPercentage = await Promise.all(
      foodPlans.map(async (plan) => {
        const totalPlannedQuantity = plan.plannedFoods.reduce(
          (sum, item) => sum + item.quantity,
          0
        );

        const entriesForPlan = await FoodEntry.find({ foodPlan: plan._id });
        let totalRealQuantity = 0;
        entriesForPlan.forEach((entry) => {
          entry.enteredFoods.forEach((item) => {
            totalRealQuantity += item.quantity;
          });
        });

        const percentage =
          totalPlannedQuantity > 0
            ? (totalRealQuantity / totalPlannedQuantity) * 100
            : 0;

        return {
          ...plan.toObject(),
          totalPlannedQuantity: totalPlannedQuantity,
          realQuantity: totalRealQuantity,
          percentageCompleted: parseFloat(percentage.toFixed(2)),
        };
      })
    );

    // --- Colores Azulados para el informe ---
    const textColor = "1F4E79"; // Azul oscuro para el texto
    const borderColor = "4682B4"; // Azul medio para los bordes

    // Ruta al logo (ajusta esta ruta según donde tengas tu imagen, por ejemplo: server/src/assets/Imagen1.png)
    const logoPath = path.join(__dirname, "../assets/Imagen1.png");
    let logoBuffer: Buffer | undefined;
    let logoUint8Array: Uint8Array | undefined;

    try {
      logoBuffer = fs.readFileSync(logoPath);
      logoUint8Array = new Uint8Array(logoBuffer);
    } catch (logoError) {
      console.warn(
        "Advertencia: No se pudo cargar el logo. Asegúrate de que la ruta sea correcta:",
        logoPath
      );
    }

    const tableHeaderCells = [
      "Nombre del Plan",
      "Centro Médico",
      "Tipo",
      "Fecha Inicio",
      "Fecha Fin",
      "Cant. Planificada Total",
      "Cant. Real Total",
      "% Completado",
      "Estado",
    ].map(
      (headerText) =>
        new TableCell({
          children: [
            new Paragraph({
              children: [
                new TextRun({
                  text: headerText,
                  bold: true,
                  color: textColor,
                }),
              ],
              alignment: AlignmentType.CENTER,
            }),
          ],
          verticalAlign: VerticalAlign.CENTER,
          borders: {
            top: { style: BorderStyle.SINGLE, size: 8, color: borderColor },
            bottom: { style: BorderStyle.SINGLE, size: 8, color: borderColor },
            left: { style: BorderStyle.SINGLE, size: 8, color: borderColor },
            right: { style: BorderStyle.SINGLE, size: 8, color: borderColor },
          },
        })
    );

    const tableRows = [
      new TableRow({
        children: tableHeaderCells,
      }),
    ];

    plansWithRealAndPercentage.forEach((plan) => {
      tableRows.push(
        new TableRow({
          children: [
            new TableCell({
              children: [
                new Paragraph({
                  children: [
                    new TextRun({ text: plan.name, color: textColor }),
                  ],
                }),
              ],
              verticalAlign: VerticalAlign.CENTER,
              borders: {
                top: { style: BorderStyle.SINGLE, size: 4, color: borderColor },
                bottom: {
                  style: BorderStyle.SINGLE,
                  size: 4,
                  color: borderColor,
                },
                left: {
                  style: BorderStyle.SINGLE,
                  size: 4,
                  color: borderColor,
                },
                right: {
                  style: BorderStyle.SINGLE,
                  size: 4,
                  color: borderColor,
                },
              },
            }),
            new TableCell({
              children: [
                new Paragraph({
                  children: [
                    new TextRun({
                      text: (plan.medicalCenter as any)?.name || "N/A",
                      color: textColor,
                    }),
                  ],
                }),
              ],
              verticalAlign: VerticalAlign.CENTER,
              borders: {
                top: { style: BorderStyle.SINGLE, size: 4, color: borderColor },
                bottom: {
                  style: BorderStyle.SINGLE,
                  size: 4,
                  color: borderColor,
                },
                left: {
                  style: BorderStyle.SINGLE,
                  size: 4,
                  color: borderColor,
                },
                right: {
                  style: BorderStyle.SINGLE,
                  size: 4,
                  color: borderColor,
                },
              },
            }),
            new TableCell({
              children: [
                new Paragraph({
                  children: [
                    new TextRun({ text: plan.type, color: textColor }),
                  ],
                }),
              ],
              verticalAlign: VerticalAlign.CENTER,
              borders: {
                top: { style: BorderStyle.SINGLE, size: 4, color: borderColor },
                bottom: {
                  style: BorderStyle.SINGLE,
                  size: 4,
                  color: borderColor,
                },
                left: {
                  style: BorderStyle.SINGLE,
                  size: 4,
                  color: borderColor,
                },
                right: {
                  style: BorderStyle.SINGLE,
                  size: 4,
                  color: borderColor,
                },
              },
            }),
            new TableCell({
              children: [
                new Paragraph({
                  children: [
                    new TextRun({
                      text: format(new Date(plan.startDate), "yyyy-MM-dd"),
                      color: textColor,
                    }),
                  ],
                }),
              ],
              verticalAlign: VerticalAlign.CENTER,
              borders: {
                top: { style: BorderStyle.SINGLE, size: 4, color: borderColor },
                bottom: {
                  style: BorderStyle.SINGLE,
                  size: 4,
                  color: borderColor,
                },
                left: {
                  style: BorderStyle.SINGLE,
                  size: 4,
                  color: borderColor,
                },
                right: {
                  style: BorderStyle.SINGLE,
                  size: 4,
                  color: borderColor,
                },
              },
            }),
            new TableCell({
              children: [
                new Paragraph({
                  children: [
                    new TextRun({
                      text: format(new Date(plan.endDate), "yyyy-MM-dd"),
                      color: textColor,
                    }),
                  ],
                }),
              ],
              verticalAlign: VerticalAlign.CENTER,
              borders: {
                top: { style: BorderStyle.SINGLE, size: 4, color: borderColor },
                bottom: {
                  style: BorderStyle.SINGLE,
                  size: 4,
                  color: borderColor,
                },
                left: {
                  style: BorderStyle.SINGLE,
                  size: 4,
                  color: borderColor,
                },
                right: {
                  style: BorderStyle.SINGLE,
                  size: 4,
                  color: borderColor,
                },
              },
            }),
            new TableCell({
              children: [
                new Paragraph({
                  children: [
                    new TextRun({
                      text: plan.totalPlannedQuantity.toString(),
                      color: textColor,
                    }),
                  ],
                }),
              ],
              verticalAlign: VerticalAlign.CENTER,
              borders: {
                top: { style: BorderStyle.SINGLE, size: 4, color: borderColor },
                bottom: {
                  style: BorderStyle.SINGLE,
                  size: 4,
                  color: borderColor,
                },
                left: {
                  style: BorderStyle.SINGLE,
                  size: 4,
                  color: borderColor,
                },
                right: {
                  style: BorderStyle.SINGLE,
                  size: 4,
                  color: borderColor,
                },
              },
            }),
            new TableCell({
              children: [
                new Paragraph({
                  children: [
                    new TextRun({
                      text: plan.realQuantity.toString(),
                      color: textColor,
                    }),
                  ],
                }),
              ],
              verticalAlign: VerticalAlign.CENTER,
              borders: {
                top: { style: BorderStyle.SINGLE, size: 4, color: borderColor },
                bottom: {
                  style: BorderStyle.SINGLE,
                  size: 4,
                  color: borderColor,
                },
                left: {
                  style: BorderStyle.SINGLE,
                  size: 4,
                  color: borderColor,
                },
                right: {
                  style: BorderStyle.SINGLE,
                  size: 4,
                  color: borderColor,
                },
              },
            }),
            new TableCell({
              children: [
                new Paragraph({
                  children: [
                    new TextRun({
                      text: `${plan.percentageCompleted}%`,
                      color: textColor,
                    }),
                  ],
                }),
              ],
              verticalAlign: VerticalAlign.CENTER,
              borders: {
                top: { style: BorderStyle.SINGLE, size: 4, color: borderColor },
                bottom: {
                  style: BorderStyle.SINGLE,
                  size: 4,
                  color: borderColor,
                },
                left: {
                  style: BorderStyle.SINGLE,
                  size: 4,
                  color: borderColor,
                },
                right: {
                  style: BorderStyle.SINGLE,
                  size: 4,
                  color: borderColor,
                },
              },
            }),
            new TableCell({
              children: [
                new Paragraph({
                  children: [
                    new TextRun({ text: plan.status, color: textColor }),
                  ],
                }),
              ],
              verticalAlign: VerticalAlign.CENTER,
              borders: {
                top: { style: BorderStyle.SINGLE, size: 4, color: borderColor },
                bottom: {
                  style: BorderStyle.SINGLE,
                  size: 4,
                  color: borderColor,
                },
                left: {
                  style: BorderStyle.SINGLE,
                  size: 4,
                  color: borderColor,
                },
                right: {
                  style: BorderStyle.SINGLE,
                  size: 4,
                  color: borderColor,
                },
              },
            }),
          ],
        })
      );
    });

    const doc = new Document({
      sections: [
        {
          children: [
            // Añadir el logo al principio del documento si está disponible
            ...(logoUint8Array
              ? [
                  new Paragraph({
                    children: [
                      new ImageRun({
                        data: logoUint8Array,
                        type: "png",
                        transformation: {
                          width: 100,
                          height: 100,
                        },
                      }),
                    ],
                    alignment: AlignmentType.CENTER,
                    spacing: { after: 200 },
                  }),
                ]
              : []),
            // Título del informe
            new Paragraph({
              children: [
                new TextRun({
                  text: "Informe de Planes de Alimentos",
                  bold: true,
                  size: 48, // Tamaño de fuente en half-points (24pt * 2)
                  color: textColor,
                }),
              ],
              alignment: AlignmentType.CENTER,
              spacing: { after: 400 },
            }),
            // Título para la tabla
            new Paragraph({
              children: [
                new TextRun({
                  text: "Detalles de Planes de Alimentos",
                  bold: true,
                  size: 28, // Tamaño de fuente en half-points (14pt * 2)
                  color: textColor,
                }),
              ],
              spacing: { before: 200, after: 100 },
              alignment: AlignmentType.CENTER,
            }),
            // Tabla de alimentos
            new Table({
              rows: tableRows,
              width: { size: 100, type: WidthType.PERCENTAGE },
            }),

            // Sección del analista
            new Paragraph({
              alignment: AlignmentType.RIGHT,
              children: [
                new TextRun({
                  text: "_____________________________",
                  break: 1,
                  color: textColor,
                }),
                new TextRun({
                  text: "Firma del Responsable",
                  break: 1,
                  bold: true,
                  color: textColor,
                }),
                new TextRun({
                  text: "",
                  break: 1,
                  italics: true,
                  color: textColor,
                }),
              ],
              spacing: { before: 400 },
            }),

            // Fin del informe
            new Paragraph({
              children: [
                new TextRun({
                  text: "",
                  bold: true,
                  color: textColor,
                }),
              ],
              alignment: AlignmentType.CENTER,
              spacing: { before: 400 },
            }),
          ],
        },
      ],
    });

    const buffer = await Packer.toBuffer(doc);

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    );
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=" + `planes_alimentos_${Date.now()}.docx`
    );
    res.send(buffer);
  } catch (error: any) {
    console.error(
      "Error al exportar planes de alimentos a Word:",
      error.message
    );
    res
      .status(500)
      .json({ message: "Error interno del servidor al exportar a Word." });
  }
};
