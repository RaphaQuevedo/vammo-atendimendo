
import Link from 'next/link';
import { Button, buttonVariants } from '@/components/ui/button'; // Import buttonVariants
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TicketIcon, Settings, MonitorPlay } from 'lucide-react';
import { cn } from '@/lib/utils'; // Import cn

export default function LandingPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 md:p-8 lg:p-12 bg-secondary">
      <div className="w-full max-w-3xl space-y-10 text-center"> {/* Increased max-width */}
        <h1 className="text-4xl font-bold text-primary mb-10">
          Vammo - Sistema de Atendimento por Senhas
        </h1>

        <p className="text-lg text-foreground mb-12">
          Selecione o terminal que deseja acessar:
        </p>

        {/* Changed to 3 columns */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Link para Solicitar Senha */}
          <Card className="shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader>
              <CardTitle className="flex flex-col items-center gap-2 text-xl font-semibold text-primary">
                <TicketIcon className="h-10 w-10" />
                Solicitar Senha
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                Terminal para clientes solicitarem uma nova senha de atendimento.
              </p>
              {/* Use Link directly with button styles */}
              <Link
                href="/request"
                className={cn(buttonVariants({ size: "lg" }), "w-full")} // Apply button styles directly
              >
                Acessar Solicitação
              </Link>
            </CardContent>
          </Card>

          {/* Link para Gerenciar Fila */}
          <Card className="shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader>
              <CardTitle className="flex flex-col items-center gap-2 text-xl font-semibold text-primary">
                <Settings className="h-10 w-10" />
                Gerenciar Fila
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                Interface para atendentes gerenciarem a fila e chamarem senhas.
              </p>
               {/* Use Link directly with button styles */}
              <Link
                href="/manage"
                className={cn(buttonVariants({ size: "lg" }), "w-full")} // Apply button styles directly
              >
                Acessar Gerenciador
              </Link>
            </CardContent>
          </Card>

          {/* Link para Painel de Atendimento */}
          <Card className="shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader>
              <CardTitle className="flex flex-col items-center gap-2 text-xl font-semibold text-primary">
                 <MonitorPlay className="h-10 w-10" />
                Painel Público
              </CardTitle>
            </CardHeader>
            <CardContent>
               <p className="text-muted-foreground mb-4">
                Tela pública exibindo a senha atual e o histórico de chamadas.
               </p>
               {/* Use Link directly with button styles */}
              <Link
                href="/display"
                className={cn(buttonVariants({ size: "lg" }), "w-full")} // Apply button styles directly
              >
                Acessar Painel
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}

