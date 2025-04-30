export const SERVICE_TYPES = ['Agendamento', 'Manutenção', 'Vendas'] as const;
export type ServiceType = typeof SERVICE_TYPES[number];

export interface Ticket {
  number: number;
  firstName: string;
  lastName: string;
  serviceType: ServiceType;
  timestamp: Date;
}
