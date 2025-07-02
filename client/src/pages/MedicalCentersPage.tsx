// client/src/pages/MedicalCentersPage.tsx
import React, { useState, useEffect, useCallback } from "react";
import type {
  IMedicalCenter,
  MedicalCenterFormValues,
  MedicalCenterQueryParams,
} from "../types/medicalCenter"; // Asegúrate de que la ruta sea correcta
import medicalCenterService from "../api/services/medicalCenterService"; // Asegúrate de que la ruta sea correcta
import { toast } from "sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { DownloadIcon, FileTextIcon } from "lucide-react";

// Import useUser hook from auth store (as seen in FoodsPage.tsx)
import { useUser } from "@/stores/auth";

// === DEFINICIÓN LOCAL DE TIPO PARA ERRORES DE AXIOS CON RESPUESTA ===
interface ApiError extends Error {
  response?: {
    data?: {
      message?: string;
    };
    status?: number;
  };
}

const MedicalCentersPage: React.FC = () => {
  const [medicalCenters, setMedicalCenters] = useState<IMedicalCenter[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Paginación y búsqueda
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalItems, setTotalItems] = useState<number>(0); // Estado para el total de ítems
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [limit] = useState<number>(10); // Número de elementos por página

  // Diálogo de creación/edición
  const [isUpsertDialogOpen, setIsUpsertDialogOpen] = useState<boolean>(false);
  const [currentMedicalCenter, setCurrentMedicalCenter] =
    useState<IMedicalCenter | null>(null);
  const [formValues, setFormValues] = useState<MedicalCenterFormValues>({
    name: "",
    address: "",
    email: "",
    phoneNumber: "",
  });

  // Diálogo de confirmación de eliminación
  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] =
    useState<boolean>(false);

  // Rol del usuario para controlar permisos (tomado de FoodsPage.tsx)
  const user = useUser();
  const isAdmin = user?.role === "admin";

  const fetchMedicalCenters = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params: MedicalCenterQueryParams = {
        page: currentPage,
        limit: limit,
      };
      if (searchQuery) {
        params.search = searchQuery;
      }
      const response = await medicalCenterService.getMedicalCenters(params);
      setMedicalCenters(response.data); // Asume que 'data' es la clave para la lista de centros
      setTotalPages(response.totalPages);
      setCurrentPage(response.currentPage);
      setTotalItems(response.totalItems); // Actualizar totalItems
    } catch (err) {
      const apiError = err as ApiError;
      console.error("Error al obtener centros médicos:", apiError);
      setError(
        apiError.response?.data?.message || "Error al cargar centros médicos."
      );
      toast.error(
        apiError.response?.data?.message || "Error al cargar centros médicos."
      );
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, limit, searchQuery]);

  useEffect(() => {
    fetchMedicalCenters();
  }, [fetchMedicalCenters]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleSearch = () => {
    setCurrentPage(1); // Reset a la primera página en cada nueva búsqueda
    fetchMedicalCenters();
  };

  const openCreateDialog = () => {
    setCurrentMedicalCenter(null);
    setFormValues({ name: "", address: "", email: "", phoneNumber: "" });
    setIsUpsertDialogOpen(true);
  };

  const openEditDialog = (center: IMedicalCenter) => {
    setCurrentMedicalCenter(center);
    setFormValues({
      name: center.name,
      address: center.address,
      email: center.email || "", // Asegura que no sea undefined
      phoneNumber: center.phoneNumber || "", // Asegura que no sea undefined
    });
    setIsUpsertDialogOpen(true);
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setFormValues((prev) => ({ ...prev, [id]: value }));
  };

  const handleUpsertSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    const email = formValues.email?.trim() || "";
    const phoneNumber = formValues.phoneNumber?.trim() || "";

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
    const phoneRegex = /^\d{8}$/;

    let isValid = true;

    // Validation checks from ProvidersPage.tsx
    if (!email && !phoneNumber) {
      toast.error("Introduzca al menos un método de contacto.");
      isValid = false;
    }

    if (email) {
      if (!emailRegex.test(email)) {
        toast.error("El formato del correo electrónico es inválido.");
        isValid = false;
      }
      if (email.length > 50) {
        toast.error("El correo electrónico no debe exceder los 50 caracteres.");
        isValid = false;
      }
    }

    if (phoneNumber) {
      if (!phoneRegex.test(phoneNumber)) {
        toast.error(
          "El número de teléfono fijo debe tener exactamente 8 dígitos."
        );
        isValid = false;
      }
    }

    // Validaciones de longitud para name y address
    if (formValues.name.length < 6 || formValues.name.length > 40) {
      toast.error("El nombre debe tener entre 6 y 40 caracteres.");
      isValid = false;
    }

    if (formValues.address.length < 6 || formValues.address.length > 40) {
      toast.error("La dirección debe tener entre 6 y 40 caracteres.");
      isValid = false;
    }

    if (!isValid) {
      setIsLoading(false); // Stop loading if validation fails
      return;
    }

    // Limpiar campos vacíos antes de enviar para que el backend maneje opcionales
    const dataToSend: MedicalCenterFormValues = { ...formValues };
    if (!dataToSend.email) delete dataToSend.email;
    if (!dataToSend.phoneNumber) delete dataToSend.phoneNumber;

    try {
      if (currentMedicalCenter) {
        await medicalCenterService.updateMedicalCenter(
          currentMedicalCenter._id,
          dataToSend
        );
        toast.success("Centro médico actualizado exitosamente.");
      } else {
        await medicalCenterService.createMedicalCenter(dataToSend);
        toast.success("Centro médico creado exitosamente.");
      }
      setIsUpsertDialogOpen(false);
      fetchMedicalCenters(); // Recargar la lista
    } catch (err) {
      const apiError = err as ApiError;
      console.error("Error al guardar centro médico:", apiError);
      setError(
        apiError.response?.data?.message || "Error al guardar centro médico."
      );
      toast.error(
        apiError.response?.data?.message || "Error al guardar centro médico."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteClick = (center: IMedicalCenter) => {
    setCurrentMedicalCenter(center);
    setIsConfirmDeleteOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!currentMedicalCenter) return;

    setIsLoading(true);
    setError(null);
    try {
      await medicalCenterService.deleteMedicalCenter(currentMedicalCenter._id);
      toast.success("Centro médico eliminado exitosamente.");
      setIsConfirmDeleteOpen(false);

      const updatedTotalItems = totalItems - 1;

      if (
        medicalCenters.length === 1 &&
        currentPage > 1 &&
        updatedTotalItems > 0
      ) {
        setCurrentPage(currentPage - 1);
      } else if (updatedTotalItems === 0) {
        setCurrentPage(1);
      } else {
        fetchMedicalCenters();
      }
    } catch (err) {
      const apiError = err as ApiError;
      console.error("Error al eliminar centro médico:", apiError);
      setError(
        apiError.response?.data?.message || "Error al eliminar centro médico."
      );
      toast.error(
        apiError.response?.data?.message || "Error al eliminar centro médico."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportExcel = async () => {
    try {
      setIsLoading(true);
      const params: MedicalCenterQueryParams = {};
      if (searchQuery) {
        params.search = searchQuery;
      }
      const data = await medicalCenterService.exportMedicalCentersToExcel(
        params
      );
      const url = window.URL.createObjectURL(new Blob([data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "centros_medicos.xlsx");
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success("Centros médicos exportados a Excel exitosamente.");
    } catch (err) {
      const apiError = err as ApiError;
      console.error("Error al exportar a Excel:", apiError);
      toast.error(
        apiError.response?.data?.message ||
          "Error al exportar centros médicos a Excel."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportWord = async () => {
    try {
      setIsLoading(true);
      const params: MedicalCenterQueryParams = {};
      if (searchQuery) {
        params.search = searchQuery;
      }
      const data = await medicalCenterService.exportMedicalCentersToWord(
        params
      );
      const url = window.URL.createObjectURL(new Blob([data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "centros_medicos.docx");
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success("Centros médicos exportados a Word exitosamente.");
    } catch (err) {
      const apiError = err as ApiError;
      console.error("Error al exportar a Word:", apiError);
      toast.error(
        apiError.response?.data?.message ||
          "Error al exportar centros médicos a Word."
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold tracking-tight mb-8">
        Gestión de Centros Médicos
      </h1>

      {error && <div className="text-red-500 mb-4">{error}</div>}

      <div className="flex items-center justify-between mb-6">
        <Input
          type="text"
          placeholder="Buscar centro médico..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="max-w-sm"
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              handleSearch();
            }
          }}
        />
        <div className="flex space-x-2">
          {isAdmin && (
            <Button onClick={openCreateDialog}>Agregar Centro Médico</Button>
          )}
          <Button
            variant="excel"
            onClick={handleExportExcel}
            disabled={isLoading}
          >
            <DownloadIcon className="mr-2 h-4 w-4" /> Excel
          </Button>
          <Button
            variant="word"
            onClick={handleExportWord}
            disabled={isLoading}
          >
            <FileTextIcon className="mr-2 h-4 w-4" /> Word
          </Button>
        </div>
      </div>

      <p className="mb-2 text-sm text-yellow-600">
        Total de centros médicos: {totalItems}
      </p>

      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[200px]">Nombre</TableHead>
              <TableHead>Correo Electrónico</TableHead>
              <TableHead>Teléfono Fijo</TableHead>
              <TableHead>Dirección</TableHead>
              <TableHead className="w-[150px] text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8">
                  Cargando centros médicos...
                </TableCell>
              </TableRow>
            ) : medicalCenters.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8">
                  No se encontraron centros médicos.
                </TableCell>
              </TableRow>
            ) : (
              medicalCenters.map((center) => (
                <TableRow key={center._id}>
                  <TableCell className="font-medium">{center.name}</TableCell>
                  <TableCell>{center.email || "N/A"}</TableCell>
                  <TableCell>{center.phoneNumber || "N/A"}</TableCell>
                  <TableCell>{center.address}</TableCell>
                  <TableCell className="text-right">
                    {isAdmin && (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openEditDialog(center)}
                          className="mr-2"
                        >
                          Editar
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDeleteClick(center)}
                        >
                          Eliminar
                        </Button>
                      </>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Pagination className="mt-8">
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious
              onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
              className={
                currentPage === 1 ? "pointer-events-none opacity-50" : undefined
              }
            />
          </PaginationItem>
          {Array.from({ length: totalPages }, (_, i) => (
            <PaginationItem key={i}>
              <PaginationLink
                isActive={i + 1 === currentPage}
                onClick={() => handlePageChange(i + 1)}
              >
                {i + 1}
              </PaginationLink>
            </PaginationItem>
          ))}
          <PaginationItem>
            <PaginationNext
              onClick={() =>
                handlePageChange(Math.min(totalPages, currentPage + 1))
              }
              className={
                currentPage === totalPages
                  ? "pointer-events-none opacity-50"
                  : undefined
              }
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>

      <Dialog open={isUpsertDialogOpen} onOpenChange={setIsUpsertDialogOpen}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle>
              {currentMedicalCenter ? "Editar" : "Crear"} Centro Médico
            </DialogTitle>
            <DialogDescription>
              {currentMedicalCenter
                ? "Modifica los detalles del centro médico."
                : "Añade un nuevo centro médico a la base de datos."}
            </DialogDescription>
          </DialogHeader>
          <form
            onSubmit={handleUpsertSubmit}
            className="grid grid-cols-[auto_1fr] items-center gap-4 py-4"
          >
            <Label htmlFor="name" className="text-right">
              Nombre
            </Label>
            <Input
              id="name"
              value={formValues.name}
              onChange={handleFormChange}
              required
            />

            <h4 className="col-span-2 text-left text-sm font-semibold mt-2 mb-1">
              Información de Contacto:
            </h4>

            <Label htmlFor="email" className="text-right">
              Correo
            </Label>
            <Input
              id="email"
              type="email"
              value={formValues.email}
              onChange={handleFormChange}
              maxLength={50}
              placeholder="Correo"
            />
            <Label htmlFor="phoneNumber" className="text-right">
              Teléfono Fijo
            </Label>
            <Input
              id="phoneNumber"
              type="tel"
              value={formValues.phoneNumber}
              onChange={handleFormChange}
              maxLength={8}
              placeholder="Teléfono Fijo"
            />
            <Label htmlFor="address" className="text-right">
              Dirección
            </Label>
            <Input
              id="address"
              value={formValues.address}
              onChange={handleFormChange}
              required
            />
            <DialogFooter className="col-span-2">
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Guardando..." : "Guardar cambios"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isConfirmDeleteOpen} onOpenChange={setIsConfirmDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>¿Estás absolutamente seguro?</DialogTitle>
            <DialogDescription>
              Esta acción no se puede deshacer. Esto eliminará permanentemente
              el centro médico "{currentMedicalCenter?.name}" de la base de
              datos.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsConfirmDeleteOpen(false)}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmDelete}
              disabled={isLoading}
            >
              {isLoading ? "Eliminando..." : "Eliminar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MedicalCentersPage;
