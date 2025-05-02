
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
  // Ensure timestamp exists and is a Firestore Timestamp before converting
  if (data.timestamp && typeof data.timestamp.toDate === 'function') {
    data.timestamp = data.timestamp.toDate();
  }
  // Ensure callTimestamp exists and is a Firestore Timestamp before converting
   if (data.callTimestamp && typeof data.callTimestamp.toDate === 'function') {
    data.callTimestamp = data.callTimestamp.toDate();
  }
  // Ensure id is present
  if (!data.id && ticketData.id) {
       data.id = ticketData.id;
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
export const addTicket = async (ticketData: Omit<Ticket, 'number' | 'timestamp' | 'status' | 'id' | 'callTimestamp' | 'deskNumber'>): Promise<Ticket> => {
  try {
    const nextNumber = await getNextTicketNumber();
    // Explicitly define the structure for Firestore, using serverTimestamp()
    const newTicketPayload = {
        firstName: ticketData.firstName,
        lastName: ticketData.lastName,
        serviceType: ticketData.serviceType,
        number: nextNumber,
        status: 'waiting' as TicketStatus,
        timestamp: serverTimestamp(), // Use server timestamp for creation
        callTimestamp: null,
        deskNumber: null,
    };
    const docRef = await addDoc(collection(db, TICKETS_COLLECTION), newTicketPayload);

    // Fetch the added document to get the server-generated timestamp correctly
    const newDocSnap = await getDoc(docRef);
    if (!newDocSnap.exists()) {
        throw new Error("Failed to fetch the newly created ticket.");
    }
     // Construct the final Ticket object, converting timestamps
     const addedTicketData = { id: newDocSnap.id, ...newDocSnap.data() };


    return convertTimestamps(addedTicketData);
  } catch (error) {
    console.error("Error adding ticket: ", error);
    throw error; // Re-throw the error for handling in the component
  }
};

// Update the status and call info of a ticket
export const updateTicketStatus = async (
    ticketId: string,
    status: TicketStatus,
    deskNumber?: number | null // Desk number is still optional
): Promise<void> => {
    const ticketRef = doc(db, TICKETS_COLLECTION, ticketId);
    // Use Partial<Ticket> for type safety with Firestore data structure
    const updateData: { [key: string]: any } = { status }; // Use a flexible type for Firestore update

    if (status === 'called') {
        // Always use serverTimestamp when calling/recalling
        updateData.callTimestamp = serverTimestamp();
        // Assign desk number only when calling
        if (deskNumber !== undefined) {
            updateData.deskNumber = deskNumber;
        } else {
            // Ensure deskNumber is explicitly set to null if not provided when status becomes 'called'
            // This might happen if recall doesn't specify a desk (though it should)
             updateData.deskNumber = null;
        }
    } else {
        // For 'completed', 'skipped', or 'waiting', clear call info
        updateData.callTimestamp = null;
        updateData.deskNumber = null;
    }

    try {
        await updateDoc(ticketRef, updateData);
    } catch (error) {
        console.error("Error updating ticket status: ", error);
        throw error; // Re-throw for handling upstream
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
      // Pass the document id explicitly to convertTimestamps
      tickets.push(convertTimestamps({ ...doc.data(), id: doc.id }));
    });
    callback(tickets);
  }, (error) => {
    console.error("Error listening to queue updates: ", error);
    // Handle error appropriately, maybe notify the user or clear the queue display
     callback([]); // Send empty array on error to clear display
  });

  return unsubscribe;
};

// Listen for the currently called ticket(s)
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
       // Pass the document id explicitly to convertTimestamps
      callback(convertTimestamps({ ...doc.data(), id: doc.id }));
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
       // Pass the document id explicitly to convertTimestamps
      tickets.push(convertTimestamps({ ...doc.data(), id: doc.id }));
    });
    callback(tickets);
  }, (error) => {
    console.error("Error listening to call history updates: ", error);
     callback([]); // Send empty array on error
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
             // Pass the document id explicitly to convertTimestamps
            tickets.push(convertTimestamps({ ...doc.data(), id: doc.id }));
        });
        return tickets;
    } catch (error) {
        console.error("Error peeking next tickets: ", error);
        return []; // Return empty array on error
    }
};


// Function to get the most recently called/completed/skipped ticket
export const getLatestCalledTicket = async (): Promise<Ticket | null> => {
     const q = query(
        collection(db, TICKETS_COLLECTION),
        where('status', 'in', ['called', 'completed', 'skipped']), // Look in history
        orderBy('callTimestamp', 'desc'), // Order by the server call timestamp
        limit(1)
    );
     try {
        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
            const doc = querySnapshot.docs[0];
            // Pass the document id explicitly to convertTimestamps
            return convertTimestamps({ ...doc.data(), id: doc.id });
        }
        return null; // No tickets found in history
    } catch (error) {
        console.error("Error getting latest called ticket: ", error);
        return null; // Return null on error
    }
}
