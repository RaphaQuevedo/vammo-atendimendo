
"use client";

import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { TicketIcon, User } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { SERVICE_TYPES, type ServiceType, type Ticket } from "@/types/ticket";
import { cn } from "@/lib/utils"; // Import cn for conditional classes

// Define Zod schema for form validation
const ticketFormSchema = z.object({
  firstName: z.string().min(1, { message: "Nome é obrigatório." }),
  lastName: z.string().min(1, { message: "Sobrenome é obrigatório." }),
  serviceType: z.enum(SERVICE_TYPES, { required_error: "Selecione o tipo de atendimento." }),
});

export type TicketFormData = z.infer<typeof ticketFormSchema>;

interface TicketGeneratorProps {
  onGenerateTicket: (formData: TicketFormData) => Ticket; // Changed to return Ticket
}

export function TicketGenerator({ onGenerateTicket }: TicketGeneratorProps) {
  const form = useForm<TicketFormData>({
    resolver: zodResolver(ticketFormSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      serviceType: undefined // Start with no selection
    },
  });

  const onSubmit = (data: TicketFormData) => {
    onGenerateTicket(data); // Call the handler, which now handles the toast
    form.reset(); // Reset form after submission
  };

  return (
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
                <FormItem className="space-y-3">
                  <FormLabel>Tipo de Atendimento</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      value={field.value} // Use value instead of defaultValue for controlled component
                      // Adjust grid columns for 4 items: 2 cols on small screens, 4 on medium+
                      className="grid grid-cols-2 sm:grid-cols-4 gap-4"
                    >
                      {SERVICE_TYPES.map((type) => (
                        <FormItem key={type} className="flex items-center space-x-0">
                           {/* Hide the actual radio input */}
                           <FormControl>
                                <RadioGroupItem value={type} id={`service-${type}`} className="sr-only" />
                            </FormControl>
                            {/* Style the label as a button */}
                           <Label
                             htmlFor={`service-${type}`}
                             className={cn(
                               "flex-1 cursor-pointer rounded-md border-2 border-muted bg-popover p-4 text-center font-medium hover:bg-accent hover:text-accent-foreground transition-colors",
                               field.value === type && "border-primary bg-primary text-primary-foreground hover:bg-primary/90" // Style for selected item
                             )}
                           >
                             {type}
                           </Label>
                        </FormItem>
                      ))}
                    </RadioGroup>
                  </FormControl>
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
  );
}
