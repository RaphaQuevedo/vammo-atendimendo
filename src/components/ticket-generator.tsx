
"use client";

import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { TicketIcon, User, List } from "lucide-react"; // Added User and List icons
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"; // Import Select components
import { useToast } from "@/hooks/use-toast";
import { SERVICE_TYPES, type ServiceType, type Ticket } from "@/types/ticket"; // Import types

// Define Zod schema for form validation
const ticketFormSchema = z.object({
  firstName: z.string().min(1, { message: "Nome é obrigatório." }),
  lastName: z.string().min(1, { message: "Sobrenome é obrigatório." }),
  serviceType: z.enum(SERVICE_TYPES, { required_error: "Selecione o tipo de atendimento." }),
});

export type TicketFormData = z.infer<typeof ticketFormSchema>;

interface TicketGeneratorProps {
  onGenerateTicket: (formData: TicketFormData) => Ticket;
}

export function TicketGenerator({ onGenerateTicket }: TicketGeneratorProps) {
  const { toast } = useToast();
  const form = useForm<TicketFormData>({
    resolver: zodResolver(ticketFormSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      // serviceType: undefined // Let placeholder handle initial state
    },
  });

  const onSubmit = (data: TicketFormData) => {
    const newTicket = onGenerateTicket(data);
    toast({
      title: "Senha Gerada com Sucesso!",
      description: (
        <div>
          <p>Senha: {newTicket.number}</p>
          <p>Nome: {newTicket.firstName} {newTicket.lastName}</p>
          <p>Atendimento: {newTicket.serviceType}</p>
        </div>
      ),
    });
    form.reset(); // Reset form after submission
  };

  return (
    <Card className="w-full shadow-lg col-span-1 lg:col-span-2 bg-card"> {/* Span across columns on large screens, changed bg */}
      <CardHeader className="text-center">
        <CardTitle className="text-primary">Gerar Nova Senha</CardTitle>
        <CardDescription>Preencha seus dados e selecione o tipo de atendimento.</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="firstName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <User className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input placeholder="Seu nome" {...field} className="pl-8"/>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="lastName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Sobrenome</FormLabel>
                    <FormControl>
                       <div className="relative">
                         <User className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                         <Input placeholder="Seu sobrenome" {...field} className="pl-8" />
                       </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="serviceType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo de Atendimento</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                       <div className="relative">
                        <List className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <SelectTrigger className="pl-8">
                           <SelectValue placeholder="Selecione o serviço" />
                        </SelectTrigger>
                      </div>
                    </FormControl>
                    <SelectContent>
                      {SERVICE_TYPES.map((type) => (
                        <SelectItem key={type} value={type}>
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex justify-center pt-4">
              <Button
                type="submit"
                size="lg"
                aria-label="Gerar nova senha de atendimento"
                disabled={form.formState.isSubmitting}
              >
                <TicketIcon className="mr-2 h-5 w-5" />
                Pegar Senha
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
