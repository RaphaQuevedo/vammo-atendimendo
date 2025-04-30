
"use client";

import type * as React from "react";
import type { Ticket } from "@/types/ticket"; // Import the Ticket type
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge"; // Import Badge

interface TicketDisplayProps {
  currentTicket: Ticket | null;
  upcomingTickets: Ticket[];
}

export function TicketDisplay({ currentTicket, upcomingTickets }: TicketDisplayProps) {
  const getBadgeVariant = (serviceType: string | undefined): "default" | "secondary" | "destructive" | "outline" => {
    switch (serviceType) {
      case 'Agendamento': return 'default';
      case 'Manutenção': return 'secondary';
      case 'Vendas': return 'destructive'; // Example variant, adjust as needed
      default: return 'outline';
    }
  };

  return (
    <Card className="w-full text-center shadow-lg bg-card"> {/* Changed background */}
      <CardHeader>
        <CardTitle className="text-primary">Atendimento Atual</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="mb-6 min-h-[150px]"> {/* Added min-height */}
          <p className="text-sm text-muted-foreground mb-1">Senha Atual</p>
          <p
            className="text-6xl font-bold text-accent"
            aria-live="polite"
            aria-atomic="true"
          >
            {currentTicket?.number ?? "-"}
          </p>
          {currentTicket && (
            <div className="mt-2 space-y-1">
              <p className="text-lg text-foreground">
                {currentTicket.firstName} {currentTicket.lastName}
              </p>
              <Badge variant={getBadgeVariant(currentTicket.serviceType)}>
                {currentTicket.serviceType}
              </Badge>
            </div>
          )}
        </div>
        <Separator className="my-4" />
        <div>
          <p className="text-sm text-muted-foreground mb-2">Próximas Senhas</p>
          {upcomingTickets.length > 0 ? (
            <div className="flex justify-center space-x-4 text-xl font-medium text-foreground">
              {upcomingTickets.map((ticket) => (
                <span
                  key={ticket.number}
                  className="p-2 bg-secondary rounded-md shadow-sm min-w-[40px]" // Changed background
                >
                  {ticket.number}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground">Nenhuma senha na fila.</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
