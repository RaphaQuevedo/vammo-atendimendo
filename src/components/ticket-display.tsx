
"use client";

import type * as React from "react";
import type { Ticket } from "@/types/ticket";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { MonitorSmartphone } from "lucide-react"; // Import desk icon
import type { Timestamp } from "firebase/firestore"; // Import Timestamp type

interface TicketDisplayProps {
  currentTicket: Ticket | null;
  upcomingTickets: Ticket[];
}

// Helper function to safely format date/timestamp
const formatTimestamp = (ts: Date | Timestamp | null | undefined): string => {
    if (!ts) return 'N/A';
    const date = ts instanceof Date ? ts : ts.toDate();
    return format(date, "HH:mm:ss ' - ' dd/MM/yyyy", { locale: ptBR });
};


export function TicketDisplay({ currentTicket, upcomingTickets }: TicketDisplayProps) {
  const getBadgeVariant = (serviceType: string | undefined): "default" | "secondary" | "destructive" | "outline" => {
    switch (serviceType) {
      case 'Manutenção': return 'secondary';
      case 'Vendas': return 'destructive';
      case 'Retirada de Moto': return 'default';
      case 'Outros': return 'outline';
      default: return 'outline';
    }
  };

  return (
    <div className="w-full text-center min-h-[350px] flex flex-col justify-between p-6 border rounded-lg bg-card shadow-sm">
      <div>
        <h3 className="text-xl font-semibold text-primary mb-4">Atendimento Atual</h3>
        <div className="mb-6 flex-grow flex flex-col items-center justify-center">
          <p className="text-sm text-muted-foreground mb-1">Senha Atual Sendo Atendida</p>
          <p
            className="text-7xl font-bold text-accent my-2 animate-pulse" // Added pulse animation
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
              <div className="flex flex-wrap justify-center items-center gap-2">
                 <Badge variant={getBadgeVariant(currentTicket.serviceType)} className="text-sm">
                   {currentTicket.serviceType}
                 </Badge>
                 {currentTicket.deskNumber && (
                    <Badge variant="secondary" className="text-sm">
                         <MonitorSmartphone className="mr-1.5 h-4 w-4"/>
                         Guichê {currentTicket.deskNumber}
                    </Badge>
                 )}
              </div>

              {currentTicket.callTimestamp && (
                 <p className="text-xs text-muted-foreground mt-1">
                   Chamado às: {formatTimestamp(currentTicket.callTimestamp)}
                 </p>
              )}
            </div>
          )}
           {!currentTicket && <p className="mt-4 text-muted-foreground">Aguardando próximo chamado...</p>}
        </div>
      </div>

      <Separator className="my-4" />

      <div>
        <p className="text-sm text-muted-foreground mb-2">Próximas Senhas na Fila</p>
        {upcomingTickets.length > 0 ? (
          <div className="flex justify-center space-x-4 text-xl font-medium text-foreground">
            {upcomingTickets.map((ticket) => (
              <span
                key={ticket.id || ticket.number} // Use ID if available
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
