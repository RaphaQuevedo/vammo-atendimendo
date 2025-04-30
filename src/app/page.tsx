"use client";

import * as React from "react";
import { TicketGenerator } from "@/components/ticket-generator";
import { TicketDisplay } from "@/components/ticket-display";
import { TicketManagement } from "@/components/ticket-management";

export default function Home() {
  const [lastGeneratedTicket, setLastGeneratedTicket] = React.useState<number>(0);
  const [currentTicket, setCurrentTicket] = React.useState<number | null>(null);
  const [ticketQueue, setTicketQueue] = React.useState<number[]>([]);

  const handleGenerateTicket = (): number => {
    const newTicket = lastGeneratedTicket + 1;
    setLastGeneratedTicket(newTicket);
    setTicketQueue((prevQueue) => [...prevQueue, newTicket]);
    return newTicket;
  };

  const handleNextTicket = () => {
    if (ticketQueue.length > 0) {
      setTicketQueue((prevQueue) => {
        const [nextTicket, ...remainingQueue] = prevQueue;
        setCurrentTicket(nextTicket);
        return remainingQueue;
      });
    } else {
      setCurrentTicket(null); // No more tickets in the queue
    }
  };

  // Determine the next few tickets to display (up to 3)
  const upcomingTickets = ticketQueue.slice(0, 3);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 md:p-12 lg:p-24 bg-secondary">
      <div className="w-full max-w-4xl space-y-8">
        <h1 className="text-4xl font-bold text-center text-primary mb-12">
          Vammo - Sistema de Atendimento
        </h1>

        {/* Ticket Display Section */}
        <TicketDisplay
          currentTicket={currentTicket}
          upcomingTickets={upcomingTickets}
        />

        {/* Ticket Generation and Management Sections */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <TicketGenerator onGenerateTicket={handleGenerateTicket} />
          <TicketManagement
            onNextTicket={handleNextTicket}
            canCallNext={ticketQueue.length > 0}
          />
        </div>
      </div>
    </main>
  );
}
