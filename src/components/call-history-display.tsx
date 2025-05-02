
"use client";

import type * as React from "react";
import type { Ticket, TicketStatus } from "@/types/ticket"; // Import TicketStatus
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Badge } from "@/components/ui/badge";
import { MonitorSmartphone, CheckCircle, XCircle, Clock, AlertCircle } from "lucide-react"; // Import icons for status

interface CallHistoryDisplayProps {
  calledTickets: Ticket[];
}

export function CallHistoryDisplay({ calledTickets }: CallHistoryDisplayProps) {

   const getServiceBadgeVariant = (serviceType: string | undefined): "default" | "secondary" | "destructive" | "outline" => {
    switch (serviceType) {
      case 'Manutenção': return 'secondary';
      case 'Vendas': return 'destructive';
      case 'Retirada de Moto': return 'default';
      case 'Outros': return 'outline';
      default: return 'outline';
    }
  };

   // Helper function to get badge variant and icon based on status
   const getStatusBadge = (status: TicketStatus): { variant: "default" | "secondary" | "destructive" | "outline", icon: React.ElementType, text: string } => {
     switch (status) {
       case 'called':
         return { variant: 'default', icon: AlertCircle, text: 'Chamada' }; // Blue (default) for currently called
       case 'completed':
         return { variant: 'secondary', icon: CheckCircle, text: 'Concluída' }; // Green (using accent color via variant)
       case 'skipped':
         return { variant: 'destructive', icon: XCircle, text: 'Pulada' }; // Red (destructive) for skipped
        case 'waiting': // Should not appear in history, but handle just in case
            return { variant: 'outline', icon: Clock, text: 'Aguardando' };
       default:
         return { variant: 'outline', icon: Clock, text: status }; // Fallback
     }
   };


  return (
    <div className="w-full">
        <h3 className="text-lg font-semibold text-center text-primary mb-4">Histórico de Chamadas Recentes</h3>
        <ScrollArea className="h-[350px] max-h-[350px] w-full rounded-md border">
          <Table>
            <TableHeader className="sticky top-0 bg-card z-10">
              <TableRow>
                <TableHead className="w-[70px]">Senha</TableHead>
                <TableHead>Nome</TableHead>
                <TableHead>Atend.</TableHead>
                <TableHead className="w-[80px]">Guichê</TableHead>
                 <TableHead className="w-[100px]">Status</TableHead> {/* Added Status column */}
                <TableHead className="text-right w-[150px]">Hora da Chamada</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {calledTickets.length > 0 ? (
                calledTickets.map((ticket) => {
                  const statusInfo = getStatusBadge(ticket.status);
                  return (
                    <TableRow key={ticket.id || ticket.number}> {/* Use ID if available */}
                        <TableCell className="font-medium">{ticket.number}</TableCell>
                        <TableCell>{ticket.firstName} {ticket.lastName}</TableCell>
                        <TableCell>
                        <Badge variant={getServiceBadgeVariant(ticket.serviceType)} className="whitespace-nowrap text-xs px-1.5 py-0.5">
                                {ticket.serviceType}
                        </Badge>
                        </TableCell>
                        <TableCell className="text-center">
                        {ticket.deskNumber ? (
                            <Badge variant="secondary" className="text-xs p-1">
                                <MonitorSmartphone className="mr-1 h-3 w-3"/>
                                {ticket.deskNumber}
                            </Badge>
                        ) : '-'}
                        </TableCell>
                        <TableCell>
                            {/* Status Badge with Icon */}
                            <Badge variant={statusInfo.variant} className="text-xs px-1.5 py-0.5 whitespace-nowrap">
                                <statusInfo.icon className="mr-1 h-3 w-3" />
                                {statusInfo.text}
                            </Badge>
                        </TableCell>
                        <TableCell className="text-right text-xs">
                        {ticket.callTimestamp ? format(ticket.callTimestamp instanceof Date ? ticket.callTimestamp : ticket.callTimestamp.toDate(), "HH:mm:ss - dd/MM/yy", { locale: ptBR }) : 'N/A'}
                        </TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center text-muted-foreground"> {/* Updated colspan */}
                    Nenhuma senha foi chamada ainda.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
             {calledTickets.length > 0 && (
                 <TableCaption className="sticky bottom-0 bg-card z-10 py-2">
                    Histórico das últimas senhas chamadas.
                 </TableCaption>
             )}
          </Table>
        </ScrollArea>
    </div>
  );
}
