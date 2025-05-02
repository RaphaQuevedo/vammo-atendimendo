
"use client";

import * as React from "react";
import { TicketGenerator, type TicketFormData } from "@/components/ticket-generator";
import type { Ticket } from "@/types/ticket";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { addTicket, initializeTicketCounter } from "@/lib/firebase/firestore"; // Import Firestore functions
import { TicketIcon, Loader2, AlertTriangle } from "lucide-react"; // Added Loader2 and AlertTriangle

// Define states for initialization
type InitState = "initializing" | "ready" | "error";

export default function RequestTicketPage() {
  const { toast } = useToast();
  const [initState, setInitState] = React.useState<InitState>("initializing");
  const [initError, setInitError] = React.useState<string | null>(null); // State for initialization error message

  // Initialize counter on component mount
  React.useEffect(() => {
    let isMounted = true; // Track component mount status

    const initialize = async () => {
        console.log("[RequestPage] Attempting to initialize ticket counter...");
        setInitState("initializing"); // Set state explicitly
        setInitError(null); // Clear previous errors
        try {
            await initializeTicketCounter(0); // Initialize counter starting from 0
            if (isMounted) {
                console.log("[RequestPage] Ticket counter initialization successful.");
                setInitState("ready"); // Set state to ready
            }
        } catch (error) {
            console.error("[RequestPage] CRITICAL: Failed to initialize ticket counter:", error);
            const errorMsg = `Não foi possível inicializar o sistema de senhas. Verifique a conexão com o banco de dados ou contate o suporte. Detalhes: ${error instanceof Error ? error.message : String(error)}`;
            if (isMounted) {
                setInitError(errorMsg);
                setInitState("error"); // Set state to error
                toast({
                    variant: "destructive",
                    title: "Erro Crítico de Inicialização",
                    description: errorMsg,
                    duration: Infinity, // Keep visible until user acts
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
  }, [toast]); // Add toast to dependencies

  const handleGenerateTicket = async (formData: TicketFormData): Promise<Ticket | null> => {
     // Check state before allowing generation
     if (initState === "initializing") {
        toast({
            variant: "default", // Use default or secondary for informational messages
            title: "Aguarde...",
            description: "O sistema de senhas ainda está sendo preparado.",
        });
        return null;
    }
    if (initState === "error") {
         toast({
            variant: "destructive",
            title: "Erro de Sistema",
            description: initError || "Ocorreu um erro durante a inicialização. Não é possível gerar senhas.", // Show the specific init error
            duration: 10000,
        });
        return null;
    }

    // Proceed if initState is 'ready'
    try {
        // Prepare data for Firestore, matching the expected Omit type
        const ticketData: Omit<Ticket, 'id' | 'number' | 'timestamp' | 'status' | 'callTimestamp' | 'deskNumber'> = {
            firstName: formData.firstName,
            lastName: formData.lastName,
            serviceType: formData.serviceType,
        };
        console.log("[RequestPage] Attempting to add ticket with data:", ticketData);
        const newTicket = await addTicket(ticketData); // Add ticket to Firestore
        console.log("[RequestPage] Ticket added successfully:", newTicket);

        // Check if newTicket and its properties are valid before showing toast
        if (newTicket && newTicket.number !== undefined && newTicket.firstName && newTicket.lastName && newTicket.serviceType) {
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
            return newTicket; // Return the generated ticket (with ID and server timestamp)
        } else {
             console.error("[RequestPage] Received incomplete ticket data after creation:", newTicket);
             throw new Error("Received incomplete ticket data after creation.");
        }
    } catch (error) {
        console.error("[RequestPage] Error generating ticket:", error);
        let errorDesc = "Não foi possível gerar a senha.";
         if (error instanceof Error) {
            // Provide more specific feedback if it's the initialization error from getNextTicketNumber
            if (error.message.includes("counter is not initialized")) {
                errorDesc = "Erro crítico ao obter número da senha. O sistema não inicializou corretamente. Recarregue a página ou contate o suporte."
            } else if (error.message.includes("transaction error")) {
                 errorDesc = "Ocorreu um erro de comunicação ao gerar a senha. Tente novamente."
            } else {
                // General error during addTicket process
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

  // Disable form if initializing or if there was an initialization error
   const isFormDisabled = initState !== "ready";

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 md:p-8 lg:p-12 bg-secondary">
      <div className="w-full max-w-2xl">
        <Card className="w-full shadow-lg bg-card">
          <CardHeader className="text-center">
            <div className="inline-flex justify-center items-center mb-4">
                 <TicketIcon className="h-10 w-10 text-primary" />
            </div>
            <CardTitle id="request-ticket-heading" className="text-3xl font-semibold text-primary">
              Solicitar Sua Senha
            </CardTitle>
             <p className="text-muted-foreground">Preencha seus dados e selecione o tipo de atendimento desejado.</p>
          </CardHeader>
          <CardContent>
             {/* Display loading indicator or error message based on state */}
             {initState === "initializing" && (
                 <div className="flex flex-col items-center justify-center text-center text-muted-foreground p-6 space-y-2">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <p>Preparando sistema de senhas...</p>
                     <p className="text-xs">(Isso pode levar alguns segundos na primeira vez)</p>
                </div>
            )}
            {initState === "error" && (
                <div className="flex flex-col items-center justify-center text-center text-destructive-foreground bg-destructive border border-destructive/50 rounded-md p-6 space-y-3">
                     <AlertTriangle className="h-10 w-10" />
                    <p className="font-semibold text-lg">Erro na Inicialização</p>
                    <p className="text-sm">{initError || "Não foi possível conectar ao sistema de senhas."}</p>
                    {/* Optionally add a retry button */}
                    {/* <Button variant="secondary" onClick={() => window.location.reload()}>Tentar Novamente</Button> */}
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
