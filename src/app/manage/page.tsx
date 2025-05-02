
"use client";

import * as React from "react";
import { TicketManagement } from "@/components/ticket-management";
import { CallHistoryDisplay } from "@/components/call-history-display";
import type { Ticket } from "@/types/ticket";
import { useToast } from "@/hooks/use-toast";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Settings } from "lucide-react"; // Only need Settings icon now
import {
  onQueueUpdate,
  onCallHistoryUpdate,
  updateTicketStatus,
  getLatestCalledTicket,
  onCurrentTicketUpdate,
  // Remove ticket generation related imports:
  // addTicket,
  // initializeTicketCounter
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
    console.log("[ManagePage] Setting up Firestore listeners...");
    const unsubscribeQueue = onQueueUpdate(setTicketQueue);
    const unsubscribeHistory = onCallHistoryUpdate(50, setCalledTickets); // Get up to 50 history items
    const unsubscribeCurrent = onCurrentTicketUpdate(setCurrentTicket);

    // Cleanup listeners on unmount
    return () => {
      console.log("[ManagePage] Unmounting, cleaning up Firestore listeners.");
      unsubscribeQueue();
      unsubscribeHistory();
      unsubscribeCurrent();
    };
  }, []);

  // --- Audio Playback ---
 const playNotificationSound = React.useCallback(() => {
    if (audioRef.current) {
        // Ensure the audio element is ready and reset playback position
        audioRef.current.load(); // Reset the audio element
        audioRef.current.currentTime = 0; // Ensure playback starts from the beginning
        const playPromise = audioRef.current.play();

        if (playPromise !== undefined) {
            playPromise.catch(error => {
                console.error("Error during audio play:", error);
                 let description = "Erro ao reproduzir o som.";
                 // Provide more specific feedback based on the error type
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
 }, [toast]); // Add toast as a dependency


  // --- Ticket Management Actions ---
  const handleNextTicket = async (deskNumber: number) => {
    if (!selectedDesk) {
        toast({ variant: "destructive", title: "Erro", description: "Selecione um guichê antes de chamar." });
        return;
    }
    if (ticketQueue.length > 0) {
      const nextTicketToCall = ticketQueue[0]; // Get the first ticket in the waiting queue
      if (nextTicketToCall.id) {
          try {
             // Mark the *currently* displayed 'called' ticket as 'completed' before calling the next one
             if (currentTicket && currentTicket.status === 'called' && currentTicket.id) {
                 console.log(`[ManagePage] Marking current ticket ${currentTicket.id} as completed.`);
                 await updateTicketStatus(currentTicket.id, 'completed');
             }
              console.log(`[ManagePage] Calling next ticket ${nextTicketToCall.id} for desk ${deskNumber}.`);
              await updateTicketStatus(nextTicketToCall.id, 'called', deskNumber); // Pass desk number
              playNotificationSound();
              toast({
                title: "Senha Chamada",
                description: `Senha ${nextTicketToCall.number} (${nextTicketToCall.firstName} ${nextTicketToCall.lastName}) chamada para o Guichê ${deskNumber}.`,
              });
          } catch (error) {
              console.error("Error calling next ticket:", error);
              toast({ variant: "destructive", title: "Erro ao Chamar", description: "Não foi possível chamar a próxima senha." });
          }
      } else {
            console.error("[ManagePage] Next ticket in queue is missing an ID:", nextTicketToCall);
             toast({ variant: "destructive", title: "Erro Interno", description: "A próxima senha na fila está inválida." });
      }
    } else {
      toast({ title: "Fila Vazia", description: "Não há mais senhas para chamar." });
    }
  };

  const handleRecallTicket = async (deskNumber: number) => {
     if (!selectedDesk) {
        toast({ variant: "destructive", title: "Erro", description: "Selecione um guichê antes de rechamar." });
        return;
    }
    if (currentTicket?.id && currentTicket.status === 'called') { // Ensure there's a ticket currently marked as 'called'
        try {
            console.log(`[ManagePage] Recalling ticket ${currentTicket.id} for desk ${deskNumber}.`);
            // Just update status to 'called' again with the desk number, triggering timestamp update and listener
            await updateTicketStatus(currentTicket.id, 'called', deskNumber);
            playNotificationSound();
            toast({ title: "Senha Rechamada", description: `Senha ${currentTicket.number} (${currentTicket.firstName} ${currentTicket.lastName}) rechamada para o Guichê ${deskNumber}.` });
        } catch (error) {
             console.error("Error recalling ticket:", error);
              toast({ variant: "destructive", title: "Erro ao Rechammar", description: "Não foi possível rechamar a senha atual." });
        }
    } else {
         toast({ title: "Nenhuma Senha Ativa", description: "Não há senha ativa (status 'Chamada') para rechamar.", variant: "destructive" });
    }
  };

 // Handler to call the previously completed/skipped ticket
 const handleCallPreviousTicket = async (deskNumber: number) => {
     if (!selectedDesk) {
        toast({ variant: "destructive", title: "Erro", description: "Selecione um guichê antes de chamar anterior." });
        return;
    }
     try {
        console.log(`[ManagePage] Attempting to fetch the latest historical ticket.`);
        // Fetch the most recently called/completed/skipped ticket
        const latestCalled = await getLatestCalledTicket();

        if (latestCalled?.id) {
             console.log(`[ManagePage] Found latest historical ticket: ${latestCalled.id}.`);
             // Mark the *currently* displayed 'called' ticket as 'skipped' before calling the previous one, *if* it's different
             if (currentTicket && currentTicket.status === 'called' && currentTicket.id && currentTicket.id !== latestCalled.id) {
                 console.log(`[ManagePage] Marking current ticket ${currentTicket.id} as skipped before calling previous.`);
                 await updateTicketStatus(currentTicket.id, 'skipped');
             }
            console.log(`[ManagePage] Calling previous ticket ${latestCalled.id} for desk ${deskNumber}.`);
            await updateTicketStatus(latestCalled.id, 'called', deskNumber); // Mark the found ticket as 'called' for the selected desk
            playNotificationSound();
            toast({ title: "Chamando Senha Anterior", description: `Chamando novamente a senha ${latestCalled.number} (${latestCalled.firstName} ${latestCalled.lastName}) para o Guichê ${deskNumber}.` });
        } else {
            console.log(`[ManagePage] No historical tickets found to call previous.`);
            toast({ title: "Histórico Vazio", description: "Nenhuma senha foi chamada anteriormente." });
        }
    } catch (error) {
        console.error("Error calling previous ticket:", error);
        toast({ variant: "destructive", title: "Erro ao Chamar Anterior", description: "Não foi possível chamar a senha anterior." });
    }
 };


  return (
    <main className="flex min-h-screen flex-col items-center justify-start p-4 md:p-8 lg:p-12 bg-background">
      {/* Audio element for notification sound */}
      <audio ref={audioRef} src="/sounds/notification.mp3" preload="auto" />

      <div className="w-full max-w-5xl space-y-8">
        <h1 className="text-3xl font-bold text-center text-primary mb-8">
          Vammo - Gerenciar Fila
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Column 1: Ticket Management Controls */}
          <Card className="md:col-span-1 shadow-lg bg-card h-fit"> {/* Use h-fit */}
            <CardHeader>
              <CardTitle id="manage-queue-heading" className="text-xl font-semibold text-center text-primary flex justify-center items-center gap-2">
                <Settings className="h-5 w-5"/> Controle de Chamadas
              </CardTitle>
              <p className="text-center text-muted-foreground text-sm">Selecione o guichê e gerencie a fila.</p>
            </CardHeader>
            <CardContent>
              <TicketManagement
                onNextTicket={handleNextTicket}
                onRecallTicket={handleRecallTicket}
                onCallPreviousTicket={handleCallPreviousTicket}
                canCallNext={ticketQueue.length > 0}
                canRecall={currentTicket !== null && currentTicket.status === 'called'} // Enable recall only if a ticket is 'called'
                canCallPrevious={calledTickets.length > 0} // Enable if there's any history
                selectedDesk={selectedDesk}
                onSelectDesk={setSelectedDesk}
              />
            </CardContent>
          </Card>

          {/* Column 2: Call History */}
          <Card className="md:col-span-2 shadow-lg bg-card">
            <CardHeader>
                <CardTitle className="text-xl font-medium text-center text-primary">Histórico de Chamadas</CardTitle>
            </CardHeader>
            <CardContent>
                <CallHistoryDisplay calledTickets={calledTickets} />
            </CardContent>
          </Card>
        </div>

         {/* Section to display upcoming tickets */}
         <Separator />
         <Card className="w-full shadow-sm bg-card">
             <CardHeader>
                 <CardTitle className="text-xl font-medium text-center text-primary">Próximas Senhas na Fila</CardTitle>
             </CardHeader>
             <CardContent>
                 {ticketQueue.length > 0 ? (
                     <ul className="space-y-2 text-center max-h-60 overflow-y-auto p-2 border rounded-md bg-secondary/50"> {/* Added scroll */}
                         {ticketQueue.map(ticket => (
                             <li key={ticket.id} className="p-2 bg-background rounded-md shadow-sm">
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
