"use client";

import type * as React from "react";
import { Ticket } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

interface TicketGeneratorProps {
  onGenerateTicket: () => number;
}

export function TicketGenerator({ onGenerateTicket }: TicketGeneratorProps) {
  const { toast } = useToast();

  const handleGenerateClick = () => {
    const newTicketNumber = onGenerateTicket();
    toast({
      title: "Senha Gerada",
      description: `Sua senha é: ${newTicketNumber}`,
    });
  };

  return (
    <Card className="w-full md:w-auto shadow-lg">
      <CardHeader>
        <CardTitle className="text-center text-primary">
          Gerar Nova Senha
        </CardTitle>
      </CardHeader>
      <CardContent className="flex justify-center">
        <Button
          size="lg"
          onClick={handleGenerateClick}
          aria-label="Gerar nova senha de atendimento"
        >
          <Ticket className="mr-2 h-5 w-5" />
          Pegar Senha
        </Button>
      </CardContent>
    </Card>
  );
}
