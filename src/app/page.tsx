
"use client";

import * as React from "react";
import { TicketGenerator, type TicketFormData } from "@/components/ticket-generator";
import { TicketDisplay } from "@/components/ticket-display";
import { TicketManagement } from "@/components/ticket-management";
import { CallHistoryDisplay } from "@/components/call-history-display";
import type { Ticket } from "@/types/ticket";
import { useToast } from "@/hooks/use-toast";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function Home() {
  const [lastGeneratedTicket, setLastGeneratedTicket] = React.useState<number>(0);
  const [currentTicket, setCurrentTicket] = React.useState<Ticket | null>(null);
  const [ticketQueue, setTicketQueue] = React.useState<Ticket[]>([]);
  const [calledTickets, setCalledTickets] = React.useState<Ticket[]>([]); // Stores history of called tickets, newest first
  const [selectedDesk, setSelectedDesk] = React.useState<number | null>(null);
  const audioRef = React.useRef<HTMLAudioElement>(null);
  const { toast } = useToast();

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
    toast({
      title: "Senha Gerada com Sucesso!",
      description: (
        <div>
          <p>Senha: <span className="font-bold">{newTicket.number}</span></p>
          <p>Nome: {newTicket.firstName} {newTicket.lastName}</p>
          <p>Atendimento: {newTicket.serviceType}</p>
        </div>
      ),
    });
    return newTicket;
  };


 const playNotificationSound = () => {
    if (audioRef.current) {
        audioRef.current.load();
        audioRef.current.currentTime = 0;
        const playPromise = audioRef.current.play();
        if (playPromise !== undefined) {
            playPromise.catch(error => {
                console.error("Error during audio play:", error);
                let description = "Erro ao reproduzir o som.";
                if (error.name === 'NotAllowedError') {
                    description = "Reprodução automática bloqueada. Interaja com a página para habilitar o som.";
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
};


  const handleNextTicket = (deskNumber: number) => {
    if (ticketQueue.length > 0) {
      setTicketQueue((prevQueue) => {
        const [nextTicketToCall, ...remainingQueue] = prevQueue;
        const calledTime = new Date();
        const updatedTicket = {
            ...nextTicketToCall,
            callTimestamp: calledTime,
            deskNumber: deskNumber
        };

        setCurrentTicket(updatedTicket);
        // Add to the beginning of calledTickets history
        setCalledTickets((prevHistory) => [updatedTicket, ...prevHistory]);
        playNotificationSound();
        toast({
          title: "Senha Chamada",
          description: `Senha ${updatedTicket.number} (${updatedTicket.firstName} ${updatedTicket.lastName}) chamada para o Guichê ${deskNumber}.`,
        });
        return remainingQueue;
      });
    } else {
      setCurrentTicket(null);
      toast({
          title: "Fila Vazia",
          description: "Não há mais senhas para chamar.",
      })
    }
  };

  const handleRecallTicket = (deskNumber: number) => {
    if (currentTicket) {
        // Update the call time and potentially the desk number if recalled from a different desk
        const recalledTicket = {
            ...currentTicket,
            callTimestamp: new Date(),
            deskNumber: deskNumber, // Desk initiating the recall
        };
        setCurrentTicket(recalledTicket); // Update the display
        playNotificationSound();
        toast({
            title: "Senha Rechamada",
            description: `Senha ${recalledTicket.number} (${recalledTicket.firstName} ${recalledTicket.lastName}) rechamada para o Guichê ${deskNumber}.`,
        });
        // Optional: Update the history as well? For now, just re-announces.
        // setCalledTickets(prev => prev.map(t => t.number === recalledTicket.number ? recalledTicket : t));
    } else {
         toast({
            title: "Nenhuma Senha Ativa",
            description: "Não há senha sendo exibida para rechamar.",
        });
    }
  };

  const handleCallPreviousTicket = (deskNumber: number) => {
      if (calledTickets.length > 0) {
          // Get the most recently called ticket (which is not the current one being displayed potentially)
          const previousTicket = calledTickets[0]; // Newest called is at index 0

          // Re-display the previous ticket, updating the call time and desk number
           const updatedPreviousTicket = {
               ...previousTicket,
               callTimestamp: new Date(),
               deskNumber: deskNumber, // Desk initiating the call
           };

          setCurrentTicket(updatedPreviousTicket); // Set the display to the previous ticket
          playNotificationSound();
          toast({
              title: "Chamando Senha Anterior",
              description: `Chamando novamente a senha ${previousTicket.number} (${previousTicket.firstName} ${previousTicket.lastName}) para o Guichê ${deskNumber}.`,
          });
           // Note: This does not change the queue or the primary order of the history.
           // It just brings a previously called ticket back to the main display.
      } else {
          toast({
            title: "Histórico Vazio",
            description: "Nenhuma senha foi chamada anteriormente.",
        });
      }
  };


  const upcomingTickets = ticketQueue.slice(0, 3);

  return (
    <main className="flex min-h-screen flex-col items-center justify-start p-4 md:p-8 lg:p-12 bg-secondary">
      {/* Ensure the sound file exists in the `public/sounds/` directory */}
      <audio ref={audioRef} src="/sounds/notification.mp3" preload="auto" />

      <div className="w-full max-w-7xl space-y-10">
        <h1 className="text-4xl font-bold text-center text-primary mb-10">
          Vammo - Sistema de Atendimento por Senhas
        </h1>

        {/* --- Interface 1: Solicitar Senha --- */}
        <section aria-labelledby="request-ticket-heading">
           <Card className="w-full shadow-lg bg-card mb-8">
                <CardHeader>
                    <CardTitle id="request-ticket-heading" className="text-2xl font-semibold text-center text-primary">Solicitar Sua Senha</CardTitle>
                </CardHeader>
                <CardContent>
                     <TicketGenerator onGenerateTicket={handleGenerateTicket} />
                </CardContent>
           </Card>
        </section>

        <Separator className="my-8" />

        {/* --- Interface 2: Gerenciar Senhas (Manager View) --- */}
        <section aria-labelledby="manage-queue-heading" className="space-y-8">
           <Card className="w-full shadow-lg bg-card">
               <CardHeader>
                    <CardTitle id="manage-queue-heading" className="text-2xl font-semibold text-center text-primary">Gerenciar Fila</CardTitle>
               </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {/* Ticket Management Section */}
                    <div className="md:col-span-1">
                    <TicketManagement
                        onNextTicket={handleNextTicket}
                        onRecallTicket={handleRecallTicket} // Pass recall handler
                        onCallPreviousTicket={handleCallPreviousTicket} // Pass previous handler
                        canCallNext={ticketQueue.length > 0}
                        canRecall={currentTicket !== null} // Enable recall if there's a current ticket
                        canCallPrevious={calledTickets.length > 0} // Enable previous if history exists
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
        </section>

        <Separator className="my-8" />

        {/* --- Interface 3: Tela de Atendimento Atual (Public Display) --- */}
        <section aria-labelledby="public-display-heading">
            <Card className="w-full shadow-lg bg-card">
                <CardHeader>
                     <CardTitle id="public-display-heading" className="text-2xl font-semibold text-center text-primary">Painel de Atendimento</CardTitle>
                </CardHeader>
                 <CardContent className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Ticket Display Section */}
                    <TicketDisplay
                    currentTicket={currentTicket}
                    upcomingTickets={upcomingTickets}
                    />
                    {/* Call History (Simplified for public view) */}
                    <CallHistoryDisplay calledTickets={calledTickets.slice(0, 5)} /> {/* Show only last 5 calls */}
                 </CardContent>
            </Card>
        </section>
      </div>
    </main>
  );
}
