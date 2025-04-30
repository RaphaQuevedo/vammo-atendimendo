
"use client";

import type * as React from "react";
import { ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

interface TicketManagementProps {
  onNextTicket: () => void;
  canCallNext: boolean;
}

export function TicketManagement({ onNextTicket, canCallNext }: TicketManagementProps) {
  return (
    <Card className="w-full shadow-lg bg-card h-full flex flex-col"> {/* Ensure card takes full height */}
      <CardHeader className="text-center">
        <CardTitle className="text-primary">Chamar Próximo</CardTitle>
        <CardDescription>Clique para chamar a próxima senha da fila.</CardDescription>
      </CardHeader>
      {/* Make content area flexible to push button down */}
      <CardContent className="flex flex-grow items-center justify-center">
        <Button
          onClick={onNextTicket}
          disabled={!canCallNext}
          className="bg-accent hover:bg-accent/90 text-accent-foreground w-full md:w-auto transform transition-transform duration-150 ease-in-out hover:scale-105 active:scale-95" // Added button styles
          aria-label="Chamar próxima senha"
          size="lg" // Match generator button size
        >
          Próxima Senha
          <ChevronRight className="ml-2 h-5 w-5" />
        </Button>
      </CardContent>
    </Card>
  );
}
