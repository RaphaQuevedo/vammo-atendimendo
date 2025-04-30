
"use client";

import * as React from "react";
import { ChevronRight, MonitorSmartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CardDescription } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils"; // Import cn

interface TicketManagementProps {
  onNextTicket: (deskNumber: number) => void; // Expects desk number
  canCallNext: boolean;
  selectedDesk: number | null;
  onSelectDesk: (desk: number | null) => void;
}

const DESK_NUMBERS = [1, 2, 3, 4];

export function TicketManagement({ onNextTicket, canCallNext, selectedDesk, onSelectDesk }: TicketManagementProps) {

  const handleCallNext = () => {
    if (selectedDesk !== null) {
      onNextTicket(selectedDesk);
    }
  };

  return (
    <div className="w-full h-full flex flex-col items-center justify-start text-center p-4 space-y-6">
        <div>
            <h3 className="text-lg font-semibold text-primary mb-2">Chamar Próximo Cliente</h3>
            <CardDescription>Selecione seu guichê e clique no botão para chamar a próxima senha.</CardDescription>
        </div>

        {/* Desk Selection */}
        <div className="w-full">
            <Label className="mb-3 block font-medium text-left">Selecione o Guichê:</Label>
             <RadioGroup
                value={selectedDesk?.toString()} // Controlled component value
                onValueChange={(value) => onSelectDesk(value ? parseInt(value, 10) : null)}
                className="grid grid-cols-4 gap-2" // Arrange desks in a row
             >
                {DESK_NUMBERS.map((desk) => (
                  <div key={desk} className="flex items-center space-x-0">
                    {/* Hide actual radio input */}
                    <RadioGroupItem value={desk.toString()} id={`desk-${desk}`} className="sr-only" />
                    {/* Style label as button */}
                    <Label
                      htmlFor={`desk-${desk}`}
                      className={cn(
                        "flex flex-col items-center justify-center cursor-pointer rounded-md border-2 border-muted bg-popover p-3 text-center font-medium hover:bg-accent hover:text-accent-foreground transition-colors w-full aspect-square", // Make it square
                        selectedDesk === desk && "border-primary bg-primary text-primary-foreground hover:bg-primary/90" // Selected style
                      )}
                    >
                      <MonitorSmartphone className="mb-1 h-5 w-5"/> {/* Icon */}
                       {desk}
                    </Label>
                  </div>
                ))}
             </RadioGroup>
        </div>

        {/* Call Next Button */}
        <Button
          onClick={handleCallNext}
          disabled={!canCallNext || selectedDesk === null} // Disable if no tickets or no desk selected
          className="bg-accent hover:bg-accent/90 text-accent-foreground w-full md:w-auto transform transition-transform duration-150 ease-in-out hover:scale-105 active:scale-95"
          aria-label="Chamar próxima senha"
          size="lg"
        >
          Próxima Senha
          <ChevronRight className="ml-2 h-5 w-5" />
        </Button>
    </div>
  );
}
