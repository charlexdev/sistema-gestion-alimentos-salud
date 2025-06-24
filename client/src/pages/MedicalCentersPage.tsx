// client/src/pages/MedicalCentersPage.tsx
import React, { useState, useEffect, useCallback } from "react";
import type {
  IMedicalCenter,
  MedicalCenterFormValues,
  MedicalCenterQueryParams,
  MedicalCenterListResponse,
} from "../types/medicalCenter";
import medicalCenterService from "../api/services/medical-center";
import type { AxiosRequestConfig } from "axios";
import { toast } from "sonner";

// Importaciones de componentes Shadcn UI
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
// Importa íconos de lucide-react para exportar
import { DownloadIcon, FileTextIcon } from "lucide-react";

// === DEFINICIÓN LOCAL DE TIPO PARA ERRORES DE AXIOS CON RESPUESTA ===
// Esto permite acceder a `error.response.data` de forma segura.
interface AxiosErrorWithResponse<T = unknown> extends Error {
  isAxiosError: boolean;
  response?: {
    data: {
      message: string;
      errors?: T;
    };
    status: number;
    headers: AxiosRequestConfig["headers"];
  };
  config: AxiosRequestConfig;
}

const MedicalCentersPage: React.FC = () => {
  const [medicalCenters, setMedicalCenters] = useState<IMedicalCenter[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [totalItems, setTotalItems] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);
  const [currentMedicalCenter, setCurrentMedicalCenter] =
    useState<IMedicalCenter | null>(null);
  const [formValues, setFormValues] = useState<MedicalCenterFormValues>({
    name: "",
    address: "",
    contactInfo: "",
  });

  const limit = 10; // Items por página

  const fetchMedicalCenters = useCallback(async () => {
    try {
      const params: MedicalCenterQueryParams = {
        page: currentPage,
        limit: limit,
        search: searchQuery,
      };
      const response: MedicalCenterListResponse =
        await medicalCenterService.getMedicalCenters(params);
      setMedicalCenters(response.medicalCenters);
      setTotalItems(response.totalCount);
      setTotalPages(response.totalPages);
      setTotalCount(response.totalCount); // Asegúrate de actualizar totalCount
    } catch (error) {
      console.error("Error al obtener centros médicos:", error);
      const axiosError = error as AxiosErrorWithResponse;
      toast.error(
        axiosError.response?.data?.message ||
          "Error al cargar los centros médicos. Inténtalo de nuevo."
      );
    }
  }, [currentPage, searchQuery]);

  useEffect(() => {
    fetchMedicalCenters();
  }, [fetchMedicalCenters]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1); // Resetear a la primera página en cada búsqueda
  };

  const handleCreateClick = () => {
    setCurrentMedicalCenter(null);
    setFormValues({ name: "", address: "", contactInfo: "" });
    setIsFormOpen(true);
  };

  const handleEditClick = (medicalCenter: IMedicalCenter) => {
    setCurrentMedicalCenter(medicalCenter);
    setFormValues({
      name: medicalCenter.name,
      address: medicalCenter.address || "",
      contactInfo: medicalCenter.contactInfo || "",
    });
    setIsFormOpen(true);
  };

  const handleDeleteClick = (medicalCenter: IMedicalCenter) => {
    setCurrentMedicalCenter(medicalCenter);
    setIsConfirmDeleteOpen(true);
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setFormValues((prev) => ({ ...prev, [id]: value }));
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (currentMedicalCenter) {
        await medicalCenterService.updateMedicalCenter(
          currentMedicalCenter._id,
          formValues
        );
        toast.success("Centro médico actualizado exitosamente.");
      } else {
        await medicalCenterService.createMedicalCenter(formValues);
        toast.success("Centro médico creado exitosamente.");
      }
      setIsFormOpen(false);
      fetchMedicalCenters();
    } catch (error) {
      console.error("Error al guardar centro médico:", error);
      const axiosError = error as AxiosErrorWithResponse;
      const errorMessage =
        axiosError.response?.data?.message ||
        "Error al guardar el centro médico. Inténtalo de nuevo.";
      toast.error(errorMessage);
    }
  };

  const handleConfirmDelete = async () => {
    if (currentMedicalCenter) {
      try {
        await medicalCenterService.deleteMedicalCenter(
          currentMedicalCenter._id
        );
        toast.success("Centro médico eliminado exitosamente.");
        setIsConfirmDeleteOpen(false);
        fetchMedicalCenters();
      } catch (error) {
        console.error("Error al eliminar centro médico:", error);
        const axiosError = error as AxiosErrorWithResponse;
        toast.error(
          axiosError.response?.data?.message ||
            "Error al eliminar el centro médico. Inténtalo de nuevo."
        );
      }
    }
  };

  const handleExportExcel = async () => {
    try {
      const params: MedicalCenterQueryParams = {
        search: searchQuery,
        limit: totalCount, // Para exportar todos los resultados de la búsqueda actual
      };
      const blob = await medicalCenterService.exportMedicalCentersToExcel(
        params
      );
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `centros_medicos_${Date.now()}.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      toast.success("Exportado a Excel exitosamente.");
    } catch (error) {
      console.error("Error al exportar a Excel:", error);
      const axiosError = error as AxiosErrorWithResponse;
      toast.error(
        axiosError.response?.data?.message ||
          "Error al exportar a Excel. Inténtalo de nuevo."
      );
    }
  };

  const handleExportWord = async () => {
    try {
      const params: MedicalCenterQueryParams = {
        search: searchQuery,
        limit: totalCount, // Para exportar todos los resultados de la búsqueda actual
      };
      const blob = await medicalCenterService.exportMedicalCentersToWord(
        params
      );
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `centros_medicos_${Date.now()}.docx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      toast.success("Exportado a Word exitosamente.");
    } catch (error) {
      console.error("Error al exportar a Word:", error);
      const axiosError = error as AxiosErrorWithResponse;
      toast.error(
        axiosError.response?.data?.message ||
          "Error al exportar a Word. Inténtalo de nuevo."
      );
    }
  };

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Gestión de Centros Médicos</h1>
      </div>

      <div className="flex flex-col md:flex-row justify-between items-center mb-4 gap-2">
        <Input
          placeholder="Buscar centros médicos..."
          value={searchQuery}
          onChange={handleSearchChange}
          className="max-w-sm"
        />
        <div className="flex w-full md:w-auto gap-2">
          <Button onClick={handleCreateClick}>Agregar Centro Médico</Button>
          <Button variant="outline" onClick={handleExportExcel}>
            <DownloadIcon className="mr-2 h-4 w-4" /> Exportar a Excel
          </Button>
          <Button variant="outline" onClick={handleExportWord}>
            <FileTextIcon className="mr-2 h-4 w-4" /> Exportar a Word
          </Button>
        </div>
      </div>

      <div className="mb-2 text-sm text-gray-600">
        Total de centros médicos: {totalItems}
      </div>

      {medicalCenters.length === 0 && searchQuery === "" && (
        <p className="text-center text-muted-foreground py-10">
          No hay centros médicos registrados. ¡Comienza agregando uno!
        </p>
      )}

      {medicalCenters.length === 0 && searchQuery !== "" && (
        <p className="text-center text-muted-foreground py-10">
          No se encontraron centros médicos para la búsqueda "{searchQuery}".
        </p>
      )}

      {medicalCenters.length > 0 && (
        <>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[200px]">Nombre</TableHead>
                  <TableHead>Dirección</TableHead>
                  <TableHead>Información de Contacto</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {medicalCenters.map((medicalCenter) => (
                  <TableRow key={medicalCenter._id}>
                    <TableCell className="font-medium">
                      {medicalCenter.name}
                    </TableCell>
                    <TableCell>{medicalCenter.address || "N/A"}</TableCell>
                    <TableCell>{medicalCenter.contactInfo || "N/A"}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        className="mr-2"
                        onClick={() => handleEditClick(medicalCenter)}
                      >
                        Editar
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDeleteClick(medicalCenter)}
                      >
                        Eliminar
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {totalPages > 1 && (
            <Pagination className="mt-4">
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    onClick={() =>
                      handlePageChange(currentPage > 1 ? currentPage - 1 : 1)
                    }
                    className={
                      currentPage === 1
                        ? "pointer-events-none opacity-50"
                        : undefined
                    }
                  />
                </PaginationItem>
                {Array.from({ length: totalPages }, (_, i) => (
                  <PaginationItem key={i}>
                    <PaginationLink
                      onClick={() => handlePageChange(i + 1)}
                      isActive={i + 1 === currentPage}
                    >
                      {i + 1}
                    </PaginationLink>
                  </PaginationItem>
                ))}
                <PaginationItem>
                  <PaginationNext
                    onClick={() =>
                      handlePageChange(
                        currentPage < totalPages ? currentPage + 1 : totalPages
                      )
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
          )}
        </>
      )}

      {/* Modal de Creación/Edición */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>
              {currentMedicalCenter
                ? "Editar Centro Médico"
                : "Crear Centro Médico"}
            </DialogTitle>
            <DialogDescription>
              {currentMedicalCenter
                ? "Modifica los detalles del centro médico existente."
                : "Añade un nuevo centro médico a tu registro."}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleFormSubmit} className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Nombre
              </Label>
              <Input
                id="name"
                value={formValues.name}
                onChange={handleFormChange}
                className="col-span-3"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="address" className="text-right">
                Dirección
              </Label>
              <Input
                id="address"
                value={formValues.address}
                onChange={handleFormChange}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="contactInfo" className="text-right">
                Contacto
              </Label>
              <Input
                id="contactInfo"
                value={formValues.contactInfo}
                onChange={handleFormChange}
                className="col-span-3"
              />
            </div>
            <DialogFooter>
              <Button type="submit">Guardar cambios</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal de Confirmación de Eliminación */}
      <Dialog open={isConfirmDeleteOpen} onOpenChange={setIsConfirmDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>¿Estás absolutamente seguro?</DialogTitle>
            <DialogDescription>
              Esta acción no se puede deshacer. Esto eliminará permanentemente
              el centro médico "
              <span className="font-semibold">
                {currentMedicalCenter?.name}
              </span>
              " de la base de datos.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsConfirmDeleteOpen(false)}
            >
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleConfirmDelete}>
              Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MedicalCentersPage;
