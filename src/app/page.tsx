
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TicketIcon, Settings, MonitorPlay, ClipboardList } from 'lucide-react'; // Added ClipboardList

export default function LandingPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 md:p-8 lg:p-12 bg-secondary">
      <div className="w-full max-w-2xl space-y-10 text-center">
        <h1 className="text-4xl font-bold text-primary mb-10">
          Vammo - Sistema de Atendimento por Senhas
        </h1>

        <p className="text-lg text-foreground mb-12">
          Selecione o terminal que deseja acessar:
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6"> {/* Changed to 2 columns */}
          {/* Link para Solicitar Senha & Gerenciar Fila */}
          <Card className="shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader>
              <CardTitle className="flex flex-col items-center gap-2 text-xl font-semibold text-primary">
                <ClipboardList className="h-10 w-10" /> {/* Updated Icon */}
                Atendimento & Gerenciamento {/* Updated Title */}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                Terminal para solicitar senhas e gerenciar a fila de atendimento. {/* Updated Description */}
              </p>
              <Button asChild size="lg" className="w-full">
                <Link href="/manage">Acessar Atendimento</Link>{/* Link points to /manage */}
              </Button>
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
              <Button asChild size="lg" className="w-full">
                <Link href="/display">Acessar Painel</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}
