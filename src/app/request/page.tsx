
"use client";

import * as React from "react";
import { TicketGenerator, type TicketFormData } from "@/components/ticket-generator";
import type { Ticket } from "@/types/ticket";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { addTicket, initializeTicketCounter } from "@/lib/firebase/firestore"; // Import Firestore functions
import { TicketIcon } from "lucide-react";

export default function RequestTicketPage() {
  const { toast } = useToast();
  const [isInitializing, setIsInitializing] = React.useState(true); // State to track initialization

  // Initialize counter on component mount
    React.useEffect(() => {
        initializeTicketCounter(0) // Initialize counter starting from 0
            .then(() => setIsInitializing(false))
            .catch(error => {
                console.error("Failed to initialize ticket counter:", error);
                toast({
                    variant: "destructive",
                    title: "Erro de Inicialização",
                    description: "Não foi possível inicializar o contador de senhas. Tente recarregar a página.",
                });
                setIsInitializing(false); // Allow interaction even if init fails, maybe it exists
            });
    }, [toast]); // Add toast to dependencies

  const handleGenerateTicket = async (formData: TicketFormData): Promise<Ticket | null> => {
     if (isInitializing) {
        toast({
            variant: "destructive",
            title: "Aguarde",
            description: "O sistema está inicializando o contador de senhas.",
        });
        return null;
    }
    try {
        // Prepare data, omitting fields managed by Firestore
        const ticketData: Omit<Ticket, 'number' | 'timestamp' | 'status' | 'id' | 'callTimestamp' | 'deskNumber'> = {
            firstName: formData.firstName,
            lastName: formData.lastName,
            serviceType: formData.serviceType,
        };
        const newTicket = await addTicket(ticketData); // Add ticket to Firestore

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
        return newTicket; // Return the generated ticket (with ID and timestamp)
    } catch (error) {
        console.error("Error generating ticket:", error);
        toast({
          variant: "destructive",
          title: "Erro ao Gerar Senha",
          description: "Não foi possível gerar a senha. Tente novamente ou contate o suporte.",
        });
        return null;
    }
  };

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
            <TicketGenerator onGenerateTicket={handleGenerateTicket} disabled={isInitializing} />
             {isInitializing && (
                <p className="text-center text-muted-foreground mt-4">Inicializando sistema de senhas...</p>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
