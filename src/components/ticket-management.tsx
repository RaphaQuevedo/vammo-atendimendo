
"use client";

import * as React from "react";
import { ChevronRight, MonitorSmartphone, RefreshCw, Undo2 } from "lucide-react"; // Added icons
import { Button } from "@/components/ui/button";
import { CardDescription } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface TicketManagementProps {
  onNextTicket: (deskNumber: number) => void;
  onRecallTicket: (deskNumber: number) => void; // Handler for recall
  onCallPreviousTicket: (deskNumber: number) => void; // Handler for call previous
  canCallNext: boolean;
  canRecall: boolean; // Control recall button enable/disable
  canCallPrevious: boolean; // Control call previous button enable/disable
  selectedDesk: number | null;
  onSelectDesk: (desk: number | null) => void;
}

const DESK_NUMBERS = [1, 2, 3, 4];

export function TicketManagement({
  onNextTicket,
  onRecallTicket,
  onCallPreviousTicket,
  canCallNext,
  canRecall,
  canCallPrevious,
  selectedDesk,
  onSelectDesk
}: TicketManagementProps) {

  const handleCallNext = () => {
    if (selectedDesk !== null) {
      onNextTicket(selectedDesk);
    }
  };

  const handleRecall = () => {
      if (selectedDesk !== null) {
          onRecallTicket(selectedDesk);
      }
  };

  const handleCallPrevious = () => {
       if (selectedDesk !== null) {
          onCallPreviousTicket(selectedDesk);
       }
  };

  return (
    <div className="w-full h-full flex flex-col items-center justify-start text-center p-4 space-y-6">
        <div>
            <h3 className="text-lg font-semibold text-primary mb-2">Controle de Chamadas</h3>
            <CardDescription>Selecione seu guichê e utilize os botões para gerenciar o atendimento.</CardDescription>
        </div>

        {/* Desk Selection */}
        <div className="w-full">
            <Label className="mb-3 block font-medium text-left">Selecione o Guichê:</Label>
             <RadioGroup
                value={selectedDesk?.toString()}
                onValueChange={(value) => onSelectDesk(value ? parseInt(value, 10) : null)}
                className="grid grid-cols-4 gap-2"
             >
                {DESK_NUMBERS.map((desk) => (
                  <div key={desk} className="flex items-center space-x-0">
                    <RadioGroupItem value={desk.toString()} id={`desk-${desk}`} className="sr-only" />
                    <Label
                      htmlFor={`desk-${desk}`}
                      className={cn(
                        "flex flex-col items-center justify-center cursor-pointer rounded-md border-2 border-muted bg-popover p-3 text-center font-medium hover:bg-accent hover:text-accent-foreground transition-colors w-full aspect-square",
                        selectedDesk === desk && "border-primary bg-primary text-primary-foreground hover:bg-primary/90"
                      )}
                    >
                      <MonitorSmartphone className="mb-1 h-5 w-5"/>
                       {desk}
                    </Label>
                  </div>
                ))}
             </RadioGroup>
        </div>

        {/* Action Buttons */}
        <div className="w-full space-y-3">
             {/* Call Next Button */}
            <Button
              onClick={handleCallNext}
              disabled={!canCallNext || selectedDesk === null}
              className="bg-accent hover:bg-accent/90 text-accent-foreground w-full transform transition-transform duration-150 ease-in-out hover:scale-105 active:scale-95"
              aria-label="Chamar próxima senha"
              size="lg"
            >
              Próxima Senha
              <ChevronRight className="ml-2 h-5 w-5" />
            </Button>

             {/* Recall Button */}
             <Button
                onClick={handleRecall}
                disabled={!canRecall || selectedDesk === null}
                variant="outline"
                className="w-full"
                aria-label="Chamar novamente a senha atual"
                size="default" // Slightly smaller than main button
             >
                <RefreshCw className="mr-2 h-4 w-4" />
                Chamar Novamente
             </Button>

             {/* Call Previous Button */}
            <Button
                onClick={handleCallPrevious}
                disabled={!canCallPrevious || selectedDesk === null}
                variant="outline"
                className="w-full"
                aria-label="Chamar senha anterior"
                size="default" // Slightly smaller than main button
            >
                <Undo2 className="mr-2 h-4 w-4" />
                Chamar Anterior
            </Button>
        </div>
    </div>
  );
}
