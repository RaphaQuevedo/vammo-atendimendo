
"use client";

import * as React from "react";
import { TicketGenerator, type TicketFormData } from "@/components/ticket-generator";
import { TicketDisplay } from "@/components/ticket-display";
import { TicketManagement } from "@/components/ticket-management";
import type { Ticket } from "@/types/ticket"; // Import the Ticket type

export default function Home() {
  const [lastGeneratedTicket, setLastGeneratedTicket] = React.useState<number>(0);
  const [currentTicket, setCurrentTicket] = React.useState<Ticket | null>(null);
  const [ticketQueue, setTicketQueue] = React.useState<Ticket[]>([]);

  const handleGenerateTicket = (formData: TicketFormData): Ticket => {
    const newTicketNumber = lastGeneratedTicket + 1;
    const newTicket: Ticket = {
      number: newTicketNumber,
      firstName: formData.firstName,
      lastName: formData.lastName,
      serviceType: formData.serviceType,
      timestamp: new Date(),
    };
    setLastGeneratedTicket(newTicketNumber);
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
    <main className="flex min-h-screen flex-col items-center justify-start p-4 md:p-12 lg:p-24 bg-secondary">
      <div className="w-full max-w-5xl space-y-8"> {/* Increased max-width */}
        <h1 className="text-4xl font-bold text-center text-primary mb-12">
          Vammo - Sistema de Atendimento
        </h1>

        {/* Ticket Generation Section */}
        <TicketGenerator onGenerateTicket={handleGenerateTicket} />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
          {/* Ticket Display Section */}
          <TicketDisplay
            currentTicket={currentTicket}
            upcomingTickets={upcomingTickets}
          />

          {/* Ticket Management Section */}
          <TicketManagement
            onNextTicket={handleNextTicket}
            canCallNext={ticketQueue.length > 0}
          />
        </div>
      </div>
    </main>
  );
}
