
"use client";

import * as React from "react";
import { TicketManagement } from "@/components/ticket-management";
import { CallHistoryDisplay } from "@/components/call-history-display";
import type { Ticket } from "@/types/ticket";
import { useToast } from "@/hooks/use-toast";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Settings } from "lucide-react";
import {
  onQueueUpdate,
  onCallHistoryUpdate,
  updateTicketStatus,
  getLatestCalledTicket,
  onCurrentTicketUpdate // Import listener for current ticket
} from "@/lib/firebase/firestore"; // Import Firestore functions

export default function ManageQueuePage() {
  const [ticketQueue, setTicketQueue] = React.useState<Ticket[]>([]);
  const [calledTickets, setCalledTickets] = React.useState<Ticket[]>([]); // Stores history of called tickets
  const [currentTicket, setCurrentTicket] = React.useState<Ticket | null>(null); // Track currently displayed ticket
  const [selectedDesk, setSelectedDesk] = React.useState<number | null>(null);
  const audioRef = React.useRef<HTMLAudioElement>(null);
  const { toast } = useToast();

  // --- Firestore Listeners ---
  React.useEffect(() => {
    const unsubscribeQueue = onQueueUpdate(setTicketQueue);
    const unsubscribeHistory = onCallHistoryUpdate(50, setCalledTickets); // Listen for history (limit 50)
     const unsubscribeCurrent = onCurrentTicketUpdate(setCurrentTicket); // Listen for current ticket

    // Cleanup listeners on unmount
    return () => {
      unsubscribeQueue();
      unsubscribeHistory();
      unsubscribeCurrent();
    };
  }, []);

  // --- Audio Playback ---
 const playNotificationSound = React.useCallback(() => {
    if (audioRef.current) {
        audioRef.current.load(); // Ensure the latest version is loaded
        audioRef.current.currentTime = 0; // Rewind to start
        const playPromise = audioRef.current.play();
        if (playPromise !== undefined) {
            playPromise.catch(error => {
                console.error("Error during audio play:", error);
                let description = "Erro ao reproduzir o som.";
                if (error.name === 'NotAllowedError') {
                    description = "Reprodução automática bloqueada. Clique na página para habilitar o som.";
                } else if (error.name === 'NotSupportedError') {
                    description = "Formato de áudio não suportado ou arquivo '/sounds/notification.mp3' não encontrado.";
                }
                toast({
                    variant: "destructive",
                    title: "Erro de Áudio",
                    description: description,
                });
            });
        }
    } else {
        console.error("Audio ref not available.");
         toast({
            variant: "destructive",
            title: "Erro de Áudio",
            description: "Elemento de áudio não está pronto.",
        });
    }
 }, [toast]); // Include toast in dependencies


  // --- Ticket Management Actions ---
  const handleNextTicket = async (deskNumber: number) => {
    if (ticketQueue.length > 0) {
      const nextTicketToCall = ticketQueue[0]; // Get the first waiting ticket
      if (nextTicketToCall.id) {
          try {
            // If there's a currently 'called' ticket, mark it as 'completed' first
             if (currentTicket && currentTicket.status === 'called' && currentTicket.id) {
                 await updateTicketStatus(currentTicket.id, 'completed'); // No desk number needed for completion
             }

            // Call the next ticket, providing only the desk number.
            // updateTicketStatus will handle setting status to 'called' and the server timestamp.
            await updateTicketStatus(nextTicketToCall.id, 'called', deskNumber);
            playNotificationSound();
            toast({
              title: "Senha Chamada",
              description: `Senha ${nextTicketToCall.number} (${nextTicketToCall.firstName} ${nextTicketToCall.lastName}) chamada para o Guichê ${deskNumber}.`,
            });
            // Firestore listeners handle state updates automatically
          } catch (error) {
              console.error("Error calling next ticket:", error);
              toast({
                  variant: "destructive",
                  title: "Erro ao Chamar",
                  description: "Não foi possível chamar a próxima senha.",
              });
          }
      }
    } else {
      toast({
          title: "Fila Vazia",
          description: "Não há mais senhas para chamar.",
      })
    }
  };

  const handleRecallTicket = async (deskNumber: number) => {
    if (currentTicket && currentTicket.id && currentTicket.status === 'called') {
        try {
            // Recall the current ticket by setting status to 'called' again, providing desk number.
            // updateTicketStatus handles the server timestamp update.
            await updateTicketStatus(currentTicket.id, 'called', deskNumber);
            playNotificationSound();
            toast({
                title: "Senha Rechamada",
                description: `Senha ${currentTicket.number} (${currentTicket.firstName} ${currentTicket.lastName}) rechamada para o Guichê ${deskNumber}.`,
            });
        } catch (error) {
             console.error("Error recalling ticket:", error);
              toast({
                  variant: "destructive",
                  title: "Erro ao Rechammar",
                  description: "Não foi possível rechamar a senha atual.",
              });
        }
    } else {
         toast({
            title: "Nenhuma Senha Ativa",
            description: "Não há senha ativa (status 'Chamada') para rechamar.",
            variant: "destructive",
        });
    }
  };

 const handleCallPreviousTicket = async (deskNumber: number) => {
     try {
        // Find the most recent ticket in history (could be 'called', 'completed', or 'skipped')
        const latestCalled = await getLatestCalledTicket(); // Fetches the absolute latest called/completed/skipped

        if (latestCalled?.id) {
             // If there's a currently 'called' ticket (different from the one we are about to call),
             // mark it as 'skipped' before calling the previous one.
             if (currentTicket && currentTicket.status === 'called' && currentTicket.id && currentTicket.id !== latestCalled.id) {
                 await updateTicketStatus(currentTicket.id, 'skipped'); // No desk number needed for skipping
             }

            // Re-call the previous ticket by setting its status to 'called', providing desk number.
            // updateTicketStatus handles the server timestamp update.
            await updateTicketStatus(latestCalled.id, 'called', deskNumber);
            playNotificationSound();
            toast({
                title: "Chamando Senha Anterior",
                description: `Chamando novamente a senha ${latestCalled.number} (${latestCalled.firstName} ${latestCalled.lastName}) para o Guichê ${deskNumber}.`,
            });
        } else {
            toast({
                title: "Histórico Vazio",
                description: "Nenhuma senha foi chamada anteriormente.",
            });
        }
    } catch (error) {
        console.error("Error calling previous ticket:", error);
        toast({
            variant: "destructive",
            title: "Erro ao Chamar Anterior",
            description: "Não foi possível chamar a senha anterior.",
        });
    }
 };


  return (
    <main className="flex min-h-screen flex-col items-center justify-start p-4 md:p-8 lg:p-12 bg-background">
      <audio ref={audioRef} src="/sounds/notification.mp3" preload="auto" />

      <div className="w-full max-w-7xl space-y-8">
        <h1 className="text-3xl font-bold text-center text-primary mb-8">
          Vammo - Gerenciamento de Fila
        </h1>

        <Card className="w-full shadow-lg bg-card">
          <CardHeader>
            <CardTitle id="manage-queue-heading" className="text-2xl font-semibold text-center text-primary flex justify-center items-center gap-2">
                 <Settings className="h-6 w-6"/> Gerenciar Fila
            </CardTitle>
             <p className="text-center text-muted-foreground">Controle o fluxo de atendimento.</p>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Ticket Management Section */}
            <div className="md:col-span-1">
              <TicketManagement
                onNextTicket={handleNextTicket}
                onRecallTicket={handleRecallTicket}
                onCallPreviousTicket={handleCallPreviousTicket}
                canCallNext={ticketQueue.length > 0}
                canRecall={currentTicket !== null && currentTicket.status === 'called'} // Can recall only if a ticket is currently 'called'
                canCallPrevious={calledTickets.length > 0} // Can call previous if history exists
                selectedDesk={selectedDesk}
                onSelectDesk={setSelectedDesk}
              />
            </div>
            {/* Call History Section */}
            <div className="md:col-span-2">
              <CallHistoryDisplay calledTickets={calledTickets} />
            </div>
          </CardContent>
        </Card>

         {/* Optional: Display upcoming tickets for the manager */}
         <Separator />
         <Card className="w-full shadow-sm bg-card">
             <CardHeader>
                 <CardTitle className="text-xl font-medium text-center text-primary">Próximas Senhas na Fila</CardTitle>
             </CardHeader>
             <CardContent>
                 {ticketQueue.length > 0 ? (
                     <ul className="space-y-2 text-center">
                         {ticketQueue.slice(0, 5).map(ticket => (
                             <li key={ticket.id} className="p-2 bg-secondary rounded-md">
                                 <span className="font-bold">{ticket.number}</span> - {ticket.firstName} {ticket.lastName} ({ticket.serviceType})
                             </li>
                         ))}
                     </ul>
                 ) : (
                     <p className="text-center text-muted-foreground">A fila de espera está vazia.</p>
                 )}
             </CardContent>
         </Card>

      </div>
    </main>
  );
}
