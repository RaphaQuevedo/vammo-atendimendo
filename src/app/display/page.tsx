
"use client";

import * as React from "react";
import { TicketDisplay } from "@/components/ticket-display";
import { CallHistoryDisplay } from "@/components/call-history-display";
import type { Ticket } from "@/types/ticket";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MonitorPlay } from "lucide-react";
import {
    onCurrentTicketUpdate,
    onCallHistoryUpdate,
    peekNextTickets
} from "@/lib/firebase/firestore"; // Import necessary Firestore functions

export default function DisplayPage() {
  const [currentTicket, setCurrentTicket] = React.useState<Ticket | null>(null);
  const [upcomingTickets, setUpcomingTickets] = React.useState<Ticket[]>([]);
  const [callHistory, setCallHistory] = React.useState<Ticket[]>([]);
  const audioRef = React.useRef<HTMLAudioElement>(null);

  // Function to fetch upcoming tickets (not real-time needed for display)
   const fetchUpcoming = async () => {
       try {
           const nextTickets = await peekNextTickets(3); // Get top 3 waiting
           setUpcomingTickets(nextTickets);
       } catch (error) {
           console.error("Error fetching upcoming tickets:", error);
       }
   };


  // Firestore Listeners
  React.useEffect(() => {
    const unsubscribeCurrent = onCurrentTicketUpdate((ticket) => {
         // Play sound only when the ticket *changes* to a new one or becomes non-null
         if (ticket && (!currentTicket || ticket.id !== currentTicket.id)) {
            if (audioRef.current) {
                audioRef.current.load();
                audioRef.current.currentTime = 0;
                audioRef.current.play().catch(error => console.error("Audio play error:", error));
            }
         }
         setCurrentTicket(ticket);
         fetchUpcoming(); // Re-fetch upcoming when current changes
    });

    // Fetch initial upcoming tickets
    fetchUpcoming();

    // Listener for call history (limited for display)
    const unsubscribeHistory = onCallHistoryUpdate(10, setCallHistory); // Show last 10 calls

    // Cleanup listeners on unmount
    return () => {
      unsubscribeCurrent();
      unsubscribeHistory();
    };
     // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentTicket]); // Rerun effect if currentTicket changes to handle sound correctly

  return (
    <main className="flex min-h-screen flex-col items-center justify-start p-4 md:p-8 lg:p-12 bg-secondary">
       <audio ref={audioRef} src="/sounds/notification.mp3" preload="auto" />
      <div className="w-full max-w-7xl space-y-8">
        <h1 className="text-3xl font-bold text-center text-primary mb-8">
          Vammo - Painel de Atendimento
        </h1>

        <Card className="w-full shadow-lg bg-card">
          <CardHeader>
            <CardTitle id="public-display-heading" className="text-2xl font-semibold text-center text-primary flex justify-center items-center gap-2">
                <MonitorPlay className="h-6 w-6"/> Painel de Atendimento
            </CardTitle>
            <p className="text-center text-muted-foreground">Acompanhe as chamadas de senha.</p>
          </CardHeader>
          <CardContent className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Ticket Display Section */}
            <TicketDisplay
              currentTicket={currentTicket}
              upcomingTickets={upcomingTickets}
            />
            {/* Call History (limited view) */}
            {/* Pass only the most recent 5 for this specific display instance */}
            <CallHistoryDisplay calledTickets={callHistory.slice(0, 5)} />
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
