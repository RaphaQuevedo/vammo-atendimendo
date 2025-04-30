
"use client";

import type * as React from "react";
import { ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface TicketManagementProps {
  onNextTicket: () => void;
  canCallNext: boolean;
}

export function TicketManagement({ onNextTicket, canCallNext }: TicketManagementProps) {
  return (
    <Card className="w-full shadow-lg bg-card"> {/* Changed background */}
      <CardHeader>
        <CardTitle className="text-center text-primary">Gerenciar Fila</CardTitle>
      </CardHeader>
      <CardContent className="flex justify-center pt-6"> {/* Added padding-top */}
        <Button
          onClick={onNextTicket}
          disabled={!canCallNext}
          className="bg-accent hover:bg-accent/90 text-accent-foreground"
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
