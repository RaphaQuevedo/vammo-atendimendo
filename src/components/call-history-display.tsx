
"use client";

import type * as React from "react";
import type { Ticket } from "@/types/ticket";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Badge } from "@/components/ui/badge";
import { MonitorSmartphone } from "lucide-react"; // Import desk icon

interface CallHistoryDisplayProps {
  calledTickets: Ticket[];
}

export function CallHistoryDisplay({ calledTickets }: CallHistoryDisplayProps) {

   const getBadgeVariant = (serviceType: string | undefined): "default" | "secondary" | "destructive" | "outline" => {
    // Adjusted variants for new types
    switch (serviceType) {
      case 'Manutenção': return 'secondary'; // Keep Manutenção as secondary
      case 'Vendas': return 'destructive'; // Keep Vendas as destructive
      case 'Retirada de Moto': return 'default'; // Use default (primary) for Retirada
      case 'Outros': return 'outline'; // Use outline for Outros
      default: return 'outline'; // Default fallback
    }
  };


  return (
    // Card removed from here, will be part of the parent layout
    <div className="w-full">
        <h3 className="text-lg font-semibold text-center text-primary mb-4">Histórico de Chamadas Recentes</h3>
        {/* Set a max-height and make it scrollable */}
        <ScrollArea className="h-[350px] max-h-[350px] w-full rounded-md border"> {/* Adjusted height */}
          <Table>
            <TableHeader className="sticky top-0 bg-card z-10">
              <TableRow>
                <TableHead className="w-[80px]">Senha</TableHead>
                <TableHead>Nome</TableHead>
                <TableHead>Tipo Atend.</TableHead>
                <TableHead className="w-[80px]">Guichê</TableHead> {/* Added Guichê column */}
                <TableHead className="text-right">Hora da Chamada</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {calledTickets.length > 0 ? (
                calledTickets.map((ticket) => (
                  <TableRow key={ticket.number}>
                    <TableCell className="font-medium">{ticket.number}</TableCell>
                    <TableCell>{ticket.firstName} {ticket.lastName}</TableCell>
                    <TableCell>
                       <Badge variant={getBadgeVariant(ticket.serviceType)} className="whitespace-nowrap">
                            {ticket.serviceType}
                       </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                       {/* Display Desk Number */}
                       {ticket.deskNumber ? (
                          <Badge variant="secondary" className="text-xs p-1">
                              <MonitorSmartphone className="mr-1 h-3 w-3"/>
                              {ticket.deskNumber}
                          </Badge>
                       ) : '-'}
                    </TableCell>
                    <TableCell className="text-right">
                      {ticket.callTimestamp ? format(ticket.callTimestamp, "HH:mm:ss - dd/MM/yy", { locale: ptBR }) : 'N/A'}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center text-muted-foreground"> {/* Updated colspan */}
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
