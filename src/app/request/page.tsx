
"use client";

import * as React from "react";
import { TicketGenerator, type TicketFormData } from "@/components/ticket-generator";
import type { Ticket } from "@/types/ticket";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { addTicket, initializeTicketCounter } from "@/lib/firebase/firestore"; // Import Firestore functions
import { TicketIcon, Loader2 } from "lucide-react"; // Added Loader2

export default function RequestTicketPage() {
  const { toast } = useToast();
  const [isInitializing, setIsInitializing] = React.useState(true); // State to track initialization
  const [initError, setInitError] = React.useState<string | null>(null); // State for initialization error

  // Initialize counter on component mount
    React.useEffect(() => {
        console.log("Attempting to initialize ticket counter...");
        setIsInitializing(true); // Ensure initializing state is true at start
        setInitError(null); // Clear previous errors
        initializeTicketCounter(0) // Initialize counter starting from 0
            .then(() => {
                console.log("Ticket counter initialization successful.");
                setIsInitializing(false);
            })
            .catch(error => {
                console.error("Failed to initialize ticket counter:", error);
                const errorMsg = "Não foi possível inicializar o sistema de senhas. Por favor, recarregue a página ou contate o suporte.";
                setInitError(errorMsg);
                toast({
                    variant: "destructive",
                    title: "Erro Crítico de Inicialização",
                    description: errorMsg,
                    duration: Infinity, // Keep visible until user acts
                });
                setIsInitializing(false); // Stop showing initializing message
            });
    }, [toast]); // Add toast to dependencies

  const handleGenerateTicket = async (formData: TicketFormData): Promise<Ticket | null> => {
     if (isInitializing) {
        toast({
            variant: "destructive", // Use destructive or default based on preference
            title: "Aguarde...",
            description: "O sistema de senhas está sendo preparado.",
        });
        return null;
    }
    if (initError) {
         toast({
            variant: "destructive",
            title: "Erro de Sistema",
            description: initError, // Show the specific init error
            duration: 10000,
        });
        return null;
    }
    try {
        // Prepare data for Firestore, matching the expected Omit type
        const ticketData: Omit<Ticket, 'id' | 'number' | 'timestamp' | 'status' | 'callTimestamp' | 'deskNumber'> = {
            firstName: formData.firstName,
            lastName: formData.lastName,
            serviceType: formData.serviceType,
        };
        console.log("Attempting to add ticket with data:", ticketData);
        const newTicket = await addTicket(ticketData); // Add ticket to Firestore
        console.log("Ticket added successfully:", newTicket);

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
             console.error("Received incomplete ticket data after creation:", newTicket);
             throw new Error("Received incomplete ticket data after creation.");
        }
    } catch (error) {
        console.error("Error generating ticket:", error);
        let errorDesc = "Não foi possível gerar a senha.";
         if (error instanceof Error) {
            // Provide more specific feedback if it's the initialization error
            if (error.message.includes("counter is not initialized")) {
                errorDesc = "Erro ao obter número da senha. O sistema pode não ter inicializado corretamente. Tente recarregar."
            } else if (error.message.includes("transaction error")) {
                 errorDesc = "Ocorreu um erro de comunicação ao gerar a senha. Tente novamente."
            } else {
                errorDesc = `Detalhes: ${error.message}`;
            }
        } else {
             errorDesc = `Detalhes: ${String(error)}`;
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
   const isFormDisabled = isInitializing || !!initError;

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
             {/* Display loading indicator or error message */}
             {isInitializing && (
                 <div className="flex flex-col items-center justify-center text-center text-muted-foreground p-6 space-y-2">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <p>Preparando sistema de senhas...</p>
                </div>
            )}
            {initError && !isInitializing && (
                <div className="flex flex-col items-center justify-center text-center text-destructive p-6 space-y-2">
                    <p>{initError}</p>
                    {/* Optionally add a retry button */}
                    {/* <Button onClick={() => window.location.reload()}>Recarregar</Button> */}
                </div>
            )}

             {/* Render the form only when not initializing and no error */}
            {!isInitializing && !initError && (
                <TicketGenerator onGenerateTicket={handleGenerateTicket} disabled={isFormDisabled} />
             )}

          </CardContent>
        </Card>
      </div>
    </main>
  );
}
