
"use client";

import * as React from "react";
import { TicketGenerator, type TicketFormData } from "@/components/ticket-generator";
import { TicketManagement } from "@/components/ticket-management";
import { CallHistoryDisplay } from "@/components/call-history-display";
import type { Ticket } from "@/types/ticket";
import { useToast } from "@/hooks/use-toast";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Settings, TicketIcon, Loader2, AlertTriangle, ClipboardList } from "lucide-react"; // Added icons for generator
import {
  onQueueUpdate,
  onCallHistoryUpdate,
  updateTicketStatus,
  getLatestCalledTicket,
  onCurrentTicketUpdate,
  addTicket, // Import addTicket
  initializeTicketCounter // Import initializeTicketCounter
} from "@/lib/firebase/firestore"; // Import Firestore functions

// Define states for initialization (moved from request page)
type InitState = "initializing" | "ready" | "error";

export default function ManageQueuePage() {
  const [ticketQueue, setTicketQueue] = React.useState<Ticket[]>([]);
  const [calledTickets, setCalledTickets] = React.useState<Ticket[]>([]); // Stores history of called tickets
  const [currentTicket, setCurrentTicket] = React.useState<Ticket | null>(null); // Track currently displayed ticket
  const [selectedDesk, setSelectedDesk] = React.useState<number | null>(null);
  const audioRef = React.useRef<HTMLAudioElement>(null);
  const { toast } = useToast();

  // Initialization state (moved from request page)
  const [initState, setInitState] = React.useState<InitState>("initializing");
  const [initError, setInitError] = React.useState<string | null>(null);

  // --- Counter Initialization (moved from request page) ---
  React.useEffect(() => {
    let isMounted = true;

    const initialize = async () => {
        console.log("[ManagePage] Attempting to initialize ticket counter...");
        setInitState("initializing");
        setInitError(null);
        try {
            await initializeTicketCounter(0);
            if (isMounted) {
                console.log("[ManagePage] Ticket counter initialization successful.");
                setInitState("ready");
            }
        } catch (error) {
            console.error("[ManagePage] CRITICAL: Failed to initialize ticket counter:", error);
            const errorMsg = `Não foi possível inicializar o sistema de senhas. Verifique a conexão ou contate o suporte. Detalhes: ${error instanceof Error ? error.message : String(error)}`;
            if (isMounted) {
                setInitError(errorMsg);
                setInitState("error");
                toast({
                    variant: "destructive",
                    title: "Erro Crítico de Inicialização",
                    description: errorMsg,
                    duration: Infinity,
                });
            }
        }
    };

    initialize();

    return () => {
        isMounted = false;
        console.log("[ManagePage] Unmounting, initialization cancelled if pending.");
    };
  }, [toast]);

  // --- Firestore Listeners (existing) ---
  React.useEffect(() => {
    const unsubscribeQueue = onQueueUpdate(setTicketQueue);
    const unsubscribeHistory = onCallHistoryUpdate(50, setCalledTickets);
    const unsubscribeCurrent = onCurrentTicketUpdate(setCurrentTicket);

    return () => {
      unsubscribeQueue();
      unsubscribeHistory();
      unsubscribeCurrent();
    };
  }, []);

  // --- Audio Playback (existing) ---
 const playNotificationSound = React.useCallback(() => {
    if (audioRef.current) {
        audioRef.current.load();
        audioRef.current.currentTime = 0;
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
 }, [toast]);


  // --- Ticket Generation Handler (moved from request page) ---
  const handleGenerateTicket = async (formData: TicketFormData): Promise<Ticket | null> => {
     if (initState === "initializing") {
        toast({ title: "Aguarde...", description: "O sistema de senhas ainda está sendo preparado." });
        return null;
    }
    if (initState === "error") {
         toast({ variant: "destructive", title: "Erro de Sistema", description: initError || "Ocorreu um erro durante a inicialização.", duration: 10000 });
        return null;
    }

    try {
        const ticketData: Omit<Ticket, 'id' | 'number' | 'timestamp' | 'status' | 'callTimestamp' | 'deskNumber'> = {
            firstName: formData.firstName,
            lastName: formData.lastName,
            serviceType: formData.serviceType,
        };
        console.log("[ManagePage] Attempting to add ticket with data:", ticketData);
        const newTicket = await addTicket(ticketData);
        console.log("[ManagePage] Ticket added successfully:", newTicket);

        if (newTicket?.number !== undefined) {
            toast({
            title: "Senha Gerada com Sucesso!",
            description: (
                <div>
                <p>Senha: <span className="font-bold">{newTicket.number}</span></p>
                <p>Nome: {newTicket.firstName} {newTicket.lastName}</p>
                <p>Atendimento: {newTicket.serviceType}</p>
                <p className="text-xs text-muted-foreground mt-2">Dirija-se à sala de espera.</p>
                </div>
            ),
            duration: 10000,
            });
            return newTicket;
        } else {
             console.error("[ManagePage] Received incomplete ticket data after creation:", newTicket);
             throw new Error("Received incomplete ticket data after creation.");
        }
    } catch (error: unknown) {
        console.error("[ManagePage] Error generating ticket:", error);
        let errorDesc = "Não foi possível gerar a senha.";
         if (error instanceof Error) {
            if (error.message.includes("counter is not initialized")) {
                errorDesc = "Erro crítico ao obter número da senha. O sistema não inicializou corretamente. Recarregue a página ou contate o suporte."
            } else if (error.message.includes("transaction error") || error.message.includes("Could not retrieve")) {
                 errorDesc = "Ocorreu um erro de comunicação ao gerar a senha. Tente novamente."
            } else {
                 errorDesc = `Ocorreu um erro: ${error.message}`;
            }
        } else {
             errorDesc = `Ocorreu um erro inesperado: ${String(error)}`;
        }

        toast({
          variant: "destructive",
          title: "Erro ao Gerar Senha",
          description: errorDesc,
          duration: 10000,
        });
        return null;
    }
  };

  // Disable generator form if initializing or error
  const isGeneratorDisabled = initState !== "ready";

  // --- Ticket Management Actions (existing) ---
  const handleNextTicket = async (deskNumber: number) => {
    if (ticketQueue.length > 0) {
      const nextTicketToCall = ticketQueue[0];
      if (nextTicketToCall.id) {
          try {
             if (currentTicket && currentTicket.status === 'called' && currentTicket.id) {
                 await updateTicketStatus(currentTicket.id, 'completed');
             }
            await updateTicketStatus(nextTicketToCall.id, 'called', deskNumber);
            playNotificationSound();
            toast({
              title: "Senha Chamada",
              description: `Senha ${nextTicketToCall.number} (${nextTicketToCall.firstName} ${nextTicketToCall.lastName}) chamada para o Guichê ${deskNumber}.`,
            });
          } catch (error) {
              console.error("Error calling next ticket:", error);
              toast({ variant: "destructive", title: "Erro ao Chamar", description: "Não foi possível chamar a próxima senha." });
          }
      }
    } else {
      toast({ title: "Fila Vazia", description: "Não há mais senhas para chamar." });
    }
  };

  const handleRecallTicket = async (deskNumber: number) => {
    if (currentTicket?.id && currentTicket.status === 'called') {
        try {
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

 const handleCallPreviousTicket = async (deskNumber: number) => {
     try {
        const latestCalled = await getLatestCalledTicket();

        if (latestCalled?.id) {
             if (currentTicket && currentTicket.status === 'called' && currentTicket.id && currentTicket.id !== latestCalled.id) {
                 await updateTicketStatus(currentTicket.id, 'skipped');
             }
            await updateTicketStatus(latestCalled.id, 'called', deskNumber);
            playNotificationSound();
            toast({ title: "Chamando Senha Anterior", description: `Chamando novamente a senha ${latestCalled.number} (${latestCalled.firstName} ${latestCalled.lastName}) para o Guichê ${deskNumber}.` });
        } else {
            toast({ title: "Histórico Vazio", description: "Nenhuma senha foi chamada anteriormente." });
        }
    } catch (error) {
        console.error("Error calling previous ticket:", error);
        toast({ variant: "destructive", title: "Erro ao Chamar Anterior", description: "Não foi possível chamar a senha anterior." });
    }
 };


  return (
    <main className="flex min-h-screen flex-col items-center justify-start p-4 md:p-8 lg:p-12 bg-background">
      <audio ref={audioRef} src="/sounds/notification.mp3" preload="auto" />

      <div className="w-full max-w-7xl space-y-8">
        <h1 className="text-3xl font-bold text-center text-primary mb-8">
          Vammo - Atendimento e Gerenciamento
        </h1>

        {/* Combined Card for Generator and Management */}
        <Card className="w-full shadow-lg bg-card">
           <CardHeader>
             <CardTitle id="manage-queue-heading" className="text-2xl font-semibold text-center text-primary flex justify-center items-center gap-2">
                  <ClipboardList className="h-6 w-6"/> Solicitar Senha & Gerenciar Fila
             </CardTitle>
              <p className="text-center text-muted-foreground">Gere novas senhas ou controle o fluxo de atendimento.</p>
           </CardHeader>
           <CardContent className="grid grid-cols-1 lg:grid-cols-3 gap-8">

             {/* Column 1: Ticket Generator */}
             <div className="lg:col-span-1 space-y-4">
                <h3 className="text-xl font-semibold text-center text-primary flex justify-center items-center gap-2">
                   <TicketIcon className="h-5 w-5" /> Solicitar Senha
                </h3>
                 {/* Display loading/error for generator */}
                 {initState === "initializing" && (
                     <div className="flex flex-col items-center justify-center text-center text-muted-foreground p-6 space-y-2">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        <p>Preparando sistema de senhas...</p>
                         <p className="text-xs">(Isso pode levar alguns segundos)</p>
                    </div>
                )}
                {initState === "error" && (
                    <div className="flex flex-col items-center justify-center text-center text-destructive-foreground bg-destructive border border-destructive/50 rounded-md p-6 space-y-3">
                         <AlertTriangle className="h-10 w-10" />
                        <p className="font-semibold text-lg">Erro na Inicialização</p>
                        <p className="text-sm">{initError || "Não foi possível conectar ao sistema de senhas."}</p>
                    </div>
                )}
                 {/* Render the generator form only when ready */}
                {initState === "ready" && (
                    <TicketGenerator onGenerateTicket={handleGenerateTicket} disabled={isGeneratorDisabled} />
                 )}
             </div>

             {/* Column 2: Ticket Management Controls */}
             <div className="lg:col-span-1">
                 <h3 className="text-xl font-semibold text-center text-primary flex justify-center items-center gap-2">
                    <Settings className="h-5 w-5"/> Gerenciar Fila
                 </h3>
               <TicketManagement
                 onNextTicket={handleNextTicket}
                 onRecallTicket={handleRecallTicket}
                 onCallPreviousTicket={handleCallPreviousTicket}
                 canCallNext={ticketQueue.length > 0}
                 canRecall={currentTicket !== null && currentTicket.status === 'called'}
                 canCallPrevious={calledTickets.length > 0}
                 selectedDesk={selectedDesk}
                 onSelectDesk={setSelectedDesk}
               />
             </div>

             {/* Column 3: Call History */}
             <div className="lg:col-span-1">
               <CallHistoryDisplay calledTickets={calledTickets} />
             </div>
           </CardContent>
         </Card>


         {/* Optional: Display upcoming tickets */}
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
