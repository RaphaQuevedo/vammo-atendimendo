
"use client";

import * as React from "react";
import { TicketGenerator, type TicketFormData } from "@/components/ticket-generator";
import type { Ticket } from "@/types/ticket";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TicketIcon, Loader2, AlertTriangle } from "lucide-react"; // Import icons
import {
    addTicket,
    initializeTicketCounter
} from "@/lib/firebase/firestore"; // Import Firestore functions

// Define states for initialization
type InitState = "initializing" | "ready" | "error";

export default function RequestTicketPage() {
  const { toast } = useToast();
  const [initState, setInitState] = React.useState<InitState>("initializing");
  const [initError, setInitError] = React.useState<string | null>(null);

  // Initialize the ticket counter on component mount
  React.useEffect(() => {
    let isMounted = true; // Flag to prevent state update on unmounted component

    const initialize = async () => {
        console.log("[RequestPage] Attempting to initialize ticket counter...");
        setInitState("initializing");
        setInitError(null);
        try {
            await initializeTicketCounter(0); // Ensure counter exists, start at 0 if new
            if (isMounted) {
                console.log("[RequestPage] Ticket counter initialization successful.");
                setInitState("ready");
            }
        } catch (error) {
             console.error("[RequestPage] CRITICAL: Failed to initialize ticket counter:", error);
             const errorMsg = `Não foi possível inicializar o sistema de senhas. Verifique a conexão ou contate o suporte. Detalhes: ${error instanceof Error ? error.message : String(error)}`;
             if (isMounted) {
                 setInitError(errorMsg);
                 setInitState("error");
                 // Show a persistent destructive toast for critical errors
                 toast({
                    variant: "destructive",
                    title: "Erro Crítico de Inicialização",
                    description: errorMsg,
                    duration: Infinity, // Keep the toast visible until dismissed
                 });
             }
        }
    };

    initialize();

    // Cleanup function
    return () => {
        isMounted = false;
        console.log("[RequestPage] Unmounting, initialization cancelled if pending.");
    };
  }, [toast]); // Add toast as dependency


  const handleGenerateTicket = async (formData: TicketFormData): Promise<Ticket | null> => {
     // Prevent generation if system is not ready
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
        console.log("[RequestPage] Attempting to add ticket with data:", ticketData);
        const newTicket = await addTicket(ticketData);
        console.log("[RequestPage] Ticket added successfully:", newTicket);

        if (newTicket?.number !== undefined) { // Check if ticket and number are valid
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
            duration: 10000, // Show for 10 seconds
            });
            return newTicket; // Return the new ticket
        } else {
            // This case should ideally not happen if addTicket works correctly
             console.error("[RequestPage] Received incomplete ticket data after creation:", newTicket);
             throw new Error("Received incomplete ticket data after creation.");
        }

    } catch (error: unknown) { // Catch unknown type for broader compatibility
        console.error("[RequestPage] Error generating ticket:", error);
        let errorDesc = "Não foi possível gerar a senha.";
         if (error instanceof Error) {
            // Check for specific error messages from Firestore layer
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
        return null; // Indicate failure
    }
  };

  // Disable form if initializing or error
  const isFormDisabled = initState !== "ready";

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 md:p-8 lg:p-12 bg-secondary">
      <div className="w-full max-w-lg">
        <Card className="shadow-lg bg-card">
          <CardHeader>
            <CardTitle id="request-ticket-heading" className="text-2xl font-semibold text-center text-primary flex justify-center items-center gap-2">
                <TicketIcon className="h-6 w-6"/> Solicitar Sua Senha
            </CardTitle>
             <p className="text-center text-muted-foreground">Preencha seus dados e selecione o tipo de atendimento.</p>
          </CardHeader>
          <CardContent>
            {/* Display loading/error state */}
             {initState === "initializing" && (
                <div className="flex flex-col items-center justify-center text-center text-muted-foreground p-10 space-y-2">
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
            {/* Render the form only when ready */}
             {initState === "ready" && (
                 <TicketGenerator onGenerateTicket={handleGenerateTicket} disabled={isFormDisabled} />
             )}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
