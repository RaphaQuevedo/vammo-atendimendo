
"use client";

import type * as React from "react";
import type { Ticket } from "@/types/ticket";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"; // Keep if needed internally, otherwise remove
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface TicketDisplayProps {
  currentTicket: Ticket | null;
  upcomingTickets: Ticket[];
}

export function TicketDisplay({ currentTicket, upcomingTickets }: TicketDisplayProps) {
  const getBadgeVariant = (serviceType: string | undefined): "default" | "secondary" | "destructive" | "outline" => {
    switch (serviceType) {
      case 'Agendamento': return 'default';
      case 'Manutenção': return 'secondary';
      case 'Vendas': return 'destructive';
      default: return 'outline';
    }
  };

  return (
    // Card removed from here, handled by parent layout
    <div className="w-full text-center min-h-[350px] flex flex-col justify-between p-6 border rounded-lg bg-card shadow-sm">
      <div>
        <h3 className="text-xl font-semibold text-primary mb-4">Atendimento Atual</h3>
        {/* Current Ticket Info */}
        <div className="mb-6 flex-grow flex flex-col items-center justify-center">
          <p className="text-sm text-muted-foreground mb-1">Senha Atual Sendo Atendida</p>
          <p
            className="text-7xl font-bold text-accent my-2" // Added margin
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
      </div>

      <Separator className="my-4" />

      {/* Upcoming Tickets */}
      <div>
        <p className="text-sm text-muted-foreground mb-2">Próximas Senhas na Fila</p>
        {upcomingTickets.length > 0 ? (
          <div className="flex justify-center space-x-4 text-xl font-medium text-foreground">
            {upcomingTickets.map((ticket) => (
              <span
                key={ticket.number}
                className="p-2 bg-secondary rounded-md shadow-sm min-w-[40px]"
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
    </div>
  );
}
