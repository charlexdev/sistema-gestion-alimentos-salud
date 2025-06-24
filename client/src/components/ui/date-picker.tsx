// client/src/components/ui/date-picker.tsx
"use client"; // Marca como Client Component si estás usando Next.js App Router

import { format } from "date-fns";
import { es } from "date-fns/locale"; // Importar el locale español
import { Calendar as CalendarIcon } from "lucide-react";

import { cn } from "@/lib/classname"; // Utilidad para concatenar clases de Tailwind CSS
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface DatePickerProps {
  date: Date | undefined;
  setDate: (date: Date | undefined) => void;
  placeholder?: string;
  className?: string;
  disabled?: (date: Date) => boolean; // Propiedad para deshabilitar fechas
}

export function DatePicker({
  date,
  setDate,
  placeholder = "Selecciona una fecha",
  className,
  disabled,
}: DatePickerProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant={"outline"}
          className={cn(
            "w-[280px] justify-start text-left font-normal",
            !date && "text-muted-foreground",
            className
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {date ? (
            format(date, "PPP", { locale: es })
          ) : (
            <span>{placeholder}</span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0">
        <Calendar
          mode="single"
          selected={date}
          onSelect={setDate}
          initialFocus
          locale={es} // Usar el locale español para el calendario
          disabled={disabled}
        />
      </PopoverContent>
    </Popover>
  );
}
