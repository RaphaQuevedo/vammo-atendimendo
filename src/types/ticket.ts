
import type { Timestamp } from 'firebase/firestore'; // Import Timestamp type

// Updated service types based on user request
export const SERVICE_TYPES = ['Manutenção', 'Vendas', 'Retirada de Moto', 'Outros'] as const;
export type ServiceType = typeof SERVICE_TYPES[number];

export type TicketStatus = 'waiting' | 'called' | 'completed' | 'skipped'; // Added status

export interface Ticket {
  id: string; // Firestore document ID is now mandatory
  number: number;
  firstName: string;
  lastName: string;
  serviceType: ServiceType;
  status: TicketStatus; // Status of the ticket
  // Timestamps are optional as they are set by the server
  timestamp?: Date | Timestamp; // Allow both Date and Firestore Timestamp, mark as optional
  callTimestamp?: Date | Timestamp | null; // Optional: Time the ticket was called
  deskNumber?: number | null; // Optional: Desk number that called the ticket
}
