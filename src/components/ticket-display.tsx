"use client";

import type * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

interface TicketDisplayProps {
  currentTicket: number | null;
  upcomingTickets: number[];
}

export function TicketDisplay({ currentTicket, upcomingTickets }: TicketDisplayProps) {
  return (
    <Card className="w-full text-center shadow-lg bg-secondary">
      <CardHeader>
        <CardTitle className="text-primary">Atendimento Atual</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="mb-6">
          <p className="text-sm text-muted-foreground mb-1">Senha Atual</p>
          <p
            className="text-6xl font-bold text-accent"
            aria-live="polite"
            aria-atomic="true"
          >
            {currentTicket ?? "-"}
          </p>
        </div>
        <Separator className="my-4" />
        <div>
          <p className="text-sm text-muted-foreground mb-2">Próximas Senhas</p>
          {upcomingTickets.length > 0 ? (
            <div className="flex justify-center space-x-4 text-xl font-medium text-foreground">
              {upcomingTickets.map((ticket) => (
                <span
                  key={ticket}
                  className="p-2 bg-card rounded-md shadow-sm min-w-[40px]"
                >
                  {ticket}
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
