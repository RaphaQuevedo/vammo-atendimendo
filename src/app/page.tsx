
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
  const [calledTickets, setCalledTickets] = React.useState<Ticket[]>([]);
  const [selectedDesk, setSelectedDesk] = React.useState<number | null>(null); // State for selected desk
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
    // Display toast confirmation for the generated ticket
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
    return newTicket; // Return the new ticket
  };


  const playNotificationSound = () => {
    if (audioRef.current) {
      // Ensure the audio is loaded before playing, reset playback position
      audioRef.current.load(); // Reload or ensure it's loaded
      audioRef.current.currentTime = 0; // Reset to start
      console.log("Attempting to play notification sound..."); // Log attempt

      audioRef.current.play()
        .then(() => {
            console.log("Notification sound played successfully."); // Log success
        })
        .catch(error => {
            console.error("Error playing notification sound:", error); // Log the actual error
            let description = "Não foi possível tocar o som de notificação. Verifique o console para detalhes.";
             // Check common error types for more specific user feedback
            if (error.name === 'NotAllowedError') {
                 console.error("Autoplay was prevented. Ensure this was triggered by user interaction.");
                 description = "O navegador impediu a reprodução automática do som. A interação do usuário pode ser necessária.";
            } else if (error.name === 'NotSupportedError') {
                 console.error("The audio format may not be supported or the source is invalid.");
                 description = "Formato de áudio não suportado ou arquivo '/sounds/notification.mp3' inválido/não encontrado na pasta 'public'.";
            }
             toast({
                variant: "destructive",
                title: "Erro de Áudio",
                description: description,
             });
      });
    } else {
        console.error("Audio ref is not available or audio element not mounted."); // Log if ref is null
        toast({
            variant: "destructive",
            title: "Erro de Áudio",
            description: "Referência de áudio não encontrada. O elemento de áudio pode não ter sido carregado.",
        });
    }
  };

  // Updated to accept deskNumber
  const handleNextTicket = (deskNumber: number) => {
    if (ticketQueue.length > 0) {
      setTicketQueue((prevQueue) => {
        const [nextTicketToCall, ...remainingQueue] = prevQueue;
        const calledTime = new Date();
        // Include deskNumber when updating the ticket
        const updatedTicket = {
            ...nextTicketToCall,
            callTimestamp: calledTime,
            deskNumber: deskNumber // Assign desk number
        };

        setCurrentTicket(updatedTicket);
        setCalledTickets((prevHistory) => [updatedTicket, ...prevHistory]);
        playNotificationSound(); // Call sound function
         // Display toast confirmation for the called ticket
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

  const upcomingTickets = ticketQueue.slice(0, 3);

  return (
    <main className="flex min-h-screen flex-col items-center justify-start p-4 md:p-8 lg:p-12 bg-secondary">
      {/* Hidden Audio Element - IMPORTANT: Ensure you have a valid sound file at '/sounds/notification.mp3' inside the 'public' directory */}
      <audio ref={audioRef} src="/sounds/notification.mp3" preload="auto" />

      <div className="w-full max-w-7xl space-y-10">
        <h1 className="text-4xl font-bold text-center text-primary mb-10">
          Vammo - Sistema de Atendimento por Senhas
        </h1>

        {/* --- Interface 1: Solicitar Senha --- */}
        <section aria-labelledby="request-ticket-heading">
           <Card className="w-full shadow-lg bg-card mb-8">
                <CardHeader>
                    <CardTitle id="request-ticket-heading" className="text-2xl font-semibold text-center text-primary">1. Solicitar Sua Senha</CardTitle>
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
                    <CardTitle id="manage-queue-heading" className="text-2xl font-semibold text-center text-primary">2. Gerenciar Fila (Visão do Gestor)</CardTitle>
               </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {/* Ticket Management Section (Call Next) */}
                    <div className="md:col-span-1">
                    <TicketManagement
                        onNextTicket={handleNextTicket} // Pass the updated handler
                        canCallNext={ticketQueue.length > 0}
                        selectedDesk={selectedDesk} // Pass selected desk state
                        onSelectDesk={setSelectedDesk} // Pass desk selection handler
                    />
                    </div>
                    {/* Call History Section (for manager) */}
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
                     <CardTitle id="public-display-heading" className="text-2xl font-semibold text-center text-primary">3. Painel de Atendimento (Visão Pública)</CardTitle>
                </CardHeader>
                 <CardContent className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Ticket Display Section */}
                    <TicketDisplay
                    currentTicket={currentTicket}
                    upcomingTickets={upcomingTickets}
                    />
                    {/* Call History (Simplified for public view, using the same component for now) */}
                    <CallHistoryDisplay calledTickets={calledTickets.slice(0, 5)} /> {/* Show only last 5 calls */}
                 </CardContent>
            </Card>
        </section>
      </div>
    </main>
  );
}
