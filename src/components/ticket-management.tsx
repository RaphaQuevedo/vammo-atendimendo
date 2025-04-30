
"use client";

import type * as React from "react";
import { ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CardDescription } from "@/components/ui/card"; // Keep description if needed, remove others

interface TicketManagementProps {
  onNextTicket: () => void;
  canCallNext: boolean;
}

export function TicketManagement({ onNextTicket, canCallNext }: TicketManagementProps) {
  return (
    // Card removed from here, handled by the parent layout in page.tsx
    <div className="w-full h-full flex flex-col items-center justify-center text-center p-4">
        <h3 className="text-lg font-semibold text-primary mb-2">Chamar Próximo Cliente</h3>
        <CardDescription className="mb-6">Clique no botão abaixo para chamar a próxima senha da fila.</CardDescription>
        <Button
          onClick={onNextTicket}
          disabled={!canCallNext}
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
