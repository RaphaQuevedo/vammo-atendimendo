
"use client";

import type * as React from "react";
import type { Ticket } from "@/types/ticket"; // Import the Ticket type
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge"; // Import Badge
import { format } from 'date-fns'; // Import date-fns for formatting
import { ptBR } from 'date-fns/locale'; // Import pt-BR locale

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
    <Card className="w-full text-center shadow-lg bg-card min-h-[350px]"> {/* Added min-height */}
      <CardHeader>
        <CardTitle className="text-primary">Atendimento Atual</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col justify-between h-full">
        {/* Current Ticket Info */}
        <div className="mb-6 flex-grow flex flex-col items-center justify-center">
          <p className="text-sm text-muted-foreground mb-1">Senha Atual</p>
          <p
            className="text-7xl font-bold text-accent" // Increased size
            aria-live="polite"
            aria-atomic="true"
          >
            {currentTicket?.number ?? "-"}
          </p>
          {currentTicket && (
            <div className="mt-3 space-y-2 text-center">
              <p className="text-xl font-medium text-foreground">
                {currentTicket.firstName} {currentTicket.lastName}
              </p>
              <Badge variant={getBadgeVariant(currentTicket.serviceType)} className="text-sm">
                {currentTicket.serviceType}
              </Badge>
              {currentTicket.callTimestamp && (
                 <p className="text-xs text-muted-foreground mt-1">
                   Chamado às: {format(currentTicket.callTimestamp, "HH:mm:ss ' - ' dd/MM/yyyy", { locale: ptBR })}
                 </p>
              )}
            </div>
          )}
           {!currentTicket && <p className="mt-4 text-muted-foreground">Aguardando próximo chamado...</p>}
        </div>

        <Separator className="my-4" />

        {/* Upcoming Tickets */}
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
               {upcomingTickets.length < 3 && Array(3 - upcomingTickets.length).fill(0).map((_, index) => (
                  <span key={`placeholder-${index}`} className="p-2 text-secondary rounded-md min-w-[40px]"> - </span>
              ))}
            </div>
          ) : (
             <div className="flex justify-center space-x-4 text-xl font-medium text-muted-foreground">
                 <span className="p-2 min-w-[40px]"> - </span>
                 <span className="p-2 min-w-[40px]"> - </span>
                 <span className="p-2 min-w-[40px]"> - </span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
