
"use client";

import * as React from "react";
import { TicketGenerator, type TicketFormData } from "@/components/ticket-generator";
import { TicketDisplay } from "@/components/ticket-display";
import { TicketManagement } from "@/components/ticket-management";
import { CallHistoryDisplay } from "@/components/call-history-display"; // Import new component
import type { Ticket } from "@/types/ticket"; // Import the Ticket type
import { useToast } from "@/hooks/use-toast"; // Import useToast
import { Separator } from "@/components/ui/separator"; // Import Separator

export default function Home() {
  const [lastGeneratedTicket, setLastGeneratedTicket] = React.useState<number>(0);
  const [currentTicket, setCurrentTicket] = React.useState<Ticket | null>(null);
  const [ticketQueue, setTicketQueue] = React.useState<Ticket[]>([]);
  const [calledTickets, setCalledTickets] = React.useState<Ticket[]>([]); // State for call history
  const audioRef = React.useRef<HTMLAudioElement>(null);
  const { toast } = useToast(); // Get toast function

  const handleGenerateTicket = (formData: TicketFormData): Ticket => {
    const newTicketNumber = lastGeneratedTicket + 1;
    const newTicket: Ticket = {
      number: newTicketNumber,
      firstName: formData.firstName,
      lastName: formData.lastName,
      serviceType: formData.serviceType,
      timestamp: new Date(),
      // callTimestamp will be added when called
    };
    setLastGeneratedTicket(newTicketNumber);
    setTicketQueue((prevQueue) => [...prevQueue, newTicket]);
    return newTicket;
  };

  const playNotificationSound = () => {
    if (audioRef.current) {
      audioRef.current.play().catch(error => {
        console.error("Error playing notification sound:", error);
        toast({
          variant: "destructive",
          title: "Erro de Áudio",
          description: "Não foi possível tocar o som de notificação.",
        });
      });
    }
  };

  const handleNextTicket = () => {
    if (ticketQueue.length > 0) {
      setTicketQueue((prevQueue) => {
        const [nextTicketToCall, ...remainingQueue] = prevQueue;
        const calledTime = new Date();
        const updatedTicket = { ...nextTicketToCall, callTimestamp: calledTime }; // Add call timestamp

        setCurrentTicket(updatedTicket); // Update the main display
        setCalledTickets((prevHistory) => [updatedTicket, ...prevHistory]); // Add to history (most recent first)
        playNotificationSound(); // Play sound when a ticket is called
        return remainingQueue; // Update the queue
      });
    } else {
      setCurrentTicket(null); // No more tickets in the queue
      toast({
          title: "Fila Vazia",
          description: "Não há mais senhas para chamar.",
      })
    }
  };

  // Determine the next few tickets to display (up to 3)
  const upcomingTickets = ticketQueue.slice(0, 3);

  return (
    <main className="flex min-h-screen flex-col items-center justify-start p-4 md:p-12 lg:p-24 bg-secondary">
      {/* Hidden Audio Element */}
      {/* Replace '/sounds/notification.mp3' with the actual path to your sound file */}
      <audio ref={audioRef} src="/sounds/notification.mp3" preload="auto" />

      <div className="w-full max-w-7xl space-y-12"> {/* Increased max-width */}
        <h1 className="text-4xl font-bold text-center text-primary mb-8">
          Vammo - Sistema de Atendimento
        </h1>

        {/* --- Public View Area --- */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Ticket Generation Section */}
            <TicketGenerator onGenerateTicket={handleGenerateTicket} />
            {/* Ticket Display Section */}
            <TicketDisplay
              currentTicket={currentTicket}
              upcomingTickets={upcomingTickets}
            />
        </div>

        <Separator className="my-12" />

        {/* --- Manager Area --- */}
        <div className="space-y-8">
          <h2 className="text-3xl font-semibold text-center text-primary mb-6">
            Gerenciamento da Fila
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Ticket Management Section (Call Next) */}
            <div className="md:col-span-1">
                <TicketManagement
                  onNextTicket={handleNextTicket}
                  canCallNext={ticketQueue.length > 0}
                />
            </div>
            {/* Call History Section */}
            <div className="md:col-span-2">
                <CallHistoryDisplay calledTickets={calledTickets} />
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
