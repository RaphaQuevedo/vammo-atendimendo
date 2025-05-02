
import {
  collection,
  addDoc,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  updateDoc,
  doc,
  Timestamp,
  onSnapshot,
  Unsubscribe,
  runTransaction,
  serverTimestamp,
  getDoc,
} from 'firebase/firestore';
import { db } from './config';
import type { Ticket, TicketStatus } from '@/types/ticket';

const TICKETS_COLLECTION = 'tickets';
const COUNTER_COLLECTION = 'counters';
const TICKET_COUNTER_DOC = 'ticketCounter';

// Helper to convert Firestore Timestamps to Dates in a ticket object
const convertTimestamps = (ticketData: any): Ticket => {
  const data = { ...ticketData };
  if (data.timestamp instanceof Timestamp) {
    data.timestamp = data.timestamp.toDate();
  }
  if (data.callTimestamp instanceof Timestamp) {
    data.callTimestamp = data.callTimestamp.toDate();
  }
  return data as Ticket;
};

// --- Counter Management ---

// Initialize the counter if it doesn't exist
export const initializeTicketCounter = async (startValue: number = 0): Promise<void> => {
    const counterRef = doc(db, COUNTER_COLLECTION, TICKET_COUNTER_DOC);
    try {
        await runTransaction(db, async (transaction) => {
            const counterSnap = await transaction.get(counterRef);
            if (!counterSnap.exists()) {
                transaction.set(counterRef, { currentNumber: startValue });
                console.log('Ticket counter initialized.');
            } else {
                console.log('Ticket counter already exists.');
            }
        });
    } catch (error) {
        console.error("Error initializing ticket counter: ", error);
        throw error; // Re-throw for handling upstream
    }
};


// Get the next ticket number using a transaction
const getNextTicketNumber = async (): Promise<number> => {
  const counterRef = doc(db, COUNTER_COLLECTION, TICKET_COUNTER_DOC);
  try {
    const newNumber = await runTransaction(db, async (transaction) => {
      const counterSnap = await transaction.get(counterRef);
      if (!counterSnap.exists()) {
        // Attempt to initialize if missing (consider calling initializeTicketCounter on app start instead)
        console.warn("Ticket counter document not found, attempting to initialize at 0.");
        transaction.set(counterRef, { currentNumber: 0 });
        return 1; // Start with 1 if just initialized
      }
      const currentNumber = counterSnap.data()?.currentNumber ?? 0;
      const nextNumber = currentNumber + 1;
      transaction.update(counterRef, { currentNumber: nextNumber });
      return nextNumber;
    });
    return newNumber;
  } catch (error) {
    console.error("Error getting next ticket number: ", error);
    throw new Error("Could not retrieve the next ticket number."); // Provide specific error
  }
};


// --- Ticket Management ---

// Add a new ticket to the queue
export const addTicket = async (ticketData: Omit<Ticket, 'number' | 'timestamp' | 'status' | 'id'>): Promise<Ticket> => {
  try {
    const nextNumber = await getNextTicketNumber();
    const newTicketData: Omit<Ticket, 'id'> = {
      ...ticketData,
      number: nextNumber,
      status: 'waiting',
      timestamp: serverTimestamp(), // Use server timestamp
      callTimestamp: null,
      deskNumber: null,
    };
    const docRef = await addDoc(collection(db, TICKETS_COLLECTION), newTicketData);

    // Fetch the added document to get the server timestamp correctly
    const newDocSnap = await getDoc(docRef);
    if (!newDocSnap.exists()) {
        throw new Error("Failed to fetch the newly created ticket.");
    }
    const addedTicket = { id: newDocSnap.id, ...newDocSnap.data() } as any;


    return convertTimestamps(addedTicket);
  } catch (error) {
    console.error("Error adding ticket: ", error);
    throw error; // Re-throw the error for handling in the component
  }
};

// Update the status and call info of a ticket
export const updateTicketStatus = async (
    ticketId: string,
    status: TicketStatus,
    deskNumber?: number | null,
    callTimestamp?: Date | Timestamp | null
): Promise<void> => {
    const ticketRef = doc(db, TICKETS_COLLECTION, ticketId);
    const updateData: Partial<Ticket> = { status };
    if (deskNumber !== undefined) {
        updateData.deskNumber = deskNumber;
    }
    // Only update callTimestamp if provided (use serverTimestamp for 'called', null otherwise or if explicitly passed)
    if (callTimestamp !== undefined) {
        updateData.callTimestamp = callTimestamp === null ? null : (callTimestamp instanceof Date ? Timestamp.fromDate(callTimestamp) : callTimestamp);
    } else if (status === 'called') {
         updateData.callTimestamp = serverTimestamp(); // Use server timestamp when called
    } else if (status !== 'called') {
        // Explicitly set to null if changing status away from 'called' unless a timestamp is provided
        updateData.callTimestamp = null;
        updateData.deskNumber = null; // Reset desk number too
    }


    try {
        await updateDoc(ticketRef, updateData);
    } catch (error) {
        console.error("Error updating ticket status: ", error);
        throw error;
    }
};


// --- Realtime Listeners ---

// Listen for changes in the ticket queue (waiting tickets)
export const onQueueUpdate = (callback: (tickets: Ticket[]) => void): Unsubscribe => {
  const q = query(
    collection(db, TICKETS_COLLECTION),
    where('status', '==', 'waiting'),
    orderBy('timestamp', 'asc') // Get the oldest waiting tickets first
  );

  const unsubscribe = onSnapshot(q, (querySnapshot) => {
    const tickets: Ticket[] = [];
    querySnapshot.forEach((doc) => {
      tickets.push(convertTimestamps({ id: doc.id, ...doc.data() }));
    });
    callback(tickets);
  }, (error) => {
    console.error("Error listening to queue updates: ", error);
    // Handle error appropriately, maybe notify the user
  });

  return unsubscribe;
};

// Listen for the currently called ticket(s) - might be multiple if needed
// For this app, we likely only need the *latest* called ticket for the main display.
export const onCurrentTicketUpdate = (callback: (ticket: Ticket | null) => void): Unsubscribe => {
  const q = query(
    collection(db, TICKETS_COLLECTION),
    where('status', '==', 'called'),
    orderBy('callTimestamp', 'desc'), // Get the most recently called
    limit(1) // Only need the latest one
  );

  const unsubscribe = onSnapshot(q, (querySnapshot) => {
    if (!querySnapshot.empty) {
      const doc = querySnapshot.docs[0];
      callback(convertTimestamps({ id: doc.id, ...doc.data() }));
    } else {
      callback(null); // No ticket currently marked as 'called'
    }
  }, (error) => {
    console.error("Error listening to current ticket updates: ", error);
     callback(null); // Assume no current ticket on error
  });

  return unsubscribe;
};


// Listen for changes in the call history (called, completed, skipped tickets)
export const onCallHistoryUpdate = (
    limitCount: number = 50, // Default limit
    callback: (tickets: Ticket[]) => void
    ): Unsubscribe => {
  const q = query(
    collection(db, TICKETS_COLLECTION),
    where('status', 'in', ['called', 'completed', 'skipped']), // Include relevant statuses
    orderBy('callTimestamp', 'desc'), // Show the most recent calls first
    limit(limitCount) // Limit the number of history items
  );

  const unsubscribe = onSnapshot(q, (querySnapshot) => {
    const tickets: Ticket[] = [];
    querySnapshot.forEach((doc) => {
      tickets.push(convertTimestamps({ id: doc.id, ...doc.data() }));
    });
    callback(tickets);
  }, (error) => {
    console.error("Error listening to call history updates: ", error);
    // Handle error appropriately
  });

  return unsubscribe;
};


// Get the next waiting ticket without modifying it (for display purposes)
export const peekNextTickets = async (count: number = 3): Promise<Ticket[]> => {
    const q = query(
        collection(db, TICKETS_COLLECTION),
        where('status', '==', 'waiting'),
        orderBy('timestamp', 'asc'),
        limit(count)
    );
    try {
        const querySnapshot = await getDocs(q);
        const tickets: Ticket[] = [];
        querySnapshot.forEach((doc) => {
            tickets.push(convertTimestamps({ id: doc.id, ...doc.data() }));
        });
        return tickets;
    } catch (error) {
        console.error("Error peeking next tickets: ", error);
        return []; // Return empty array on error
    }
};


// Function to get the most recently called ticket (to recall or call previous)
export const getLatestCalledTicket = async (): Promise<Ticket | null> => {
     const q = query(
        collection(db, TICKETS_COLLECTION),
        where('status', 'in', ['called', 'completed', 'skipped']), // Look in history
        orderBy('callTimestamp', 'desc'),
        limit(1)
    );
     try {
        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
            const doc = querySnapshot.docs[0];
            return convertTimestamps({ id: doc.id, ...doc.data() });
        }
        return null; // No tickets found in history
    } catch (error) {
        console.error("Error getting latest called ticket: ", error);
        return null;
    }
}
