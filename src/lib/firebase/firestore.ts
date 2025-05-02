
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
  FirestoreError, // Import FirestoreError for type checking
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
            console.log(`[Firestore] Attempting to get counter document: ${COUNTER_COLLECTION}/${TICKET_COUNTER_DOC}`);
            const counterSnap = await transaction.get(counterRef);
            if (!counterSnap.exists()) {
                console.log(`[Firestore] Counter document does not exist. Initializing with value: ${startValue}`);
                transaction.set(counterRef, { currentNumber: startValue });
                console.log(`[Firestore] Ticket counter initialized successfully at ${startValue}.`);
            } else {
                const current = counterSnap.data()?.currentNumber;
                console.log(`[Firestore] Ticket counter already exists with value: ${current}. No initialization needed.`);
            }
        });
    } catch (error: unknown) { // Catch unknown type
        console.error("[Firestore] Error during initializeTicketCounter transaction: ", error);
        // Provide more context if it's a FirestoreError
        if (error instanceof FirestoreError) {
             console.error(`[Firestore] Firestore Error Code: ${error.code}`);
             console.error(`[Firestore] Firestore Error Message: ${error.message}`);
        }
        // Re-throw a user-friendly error
        throw new Error(`Failed to initialize ticket counter. Details: ${error instanceof Error ? error.message : String(error)}`);
    }
};


// Get the next ticket number using a transaction
const getNextTicketNumber = async (): Promise<number> => {
  const counterRef = doc(db, COUNTER_COLLECTION, TICKET_COUNTER_DOC);
  try {
    const newNumber = await runTransaction(db, async (transaction) => {
      console.log(`[Firestore] Attempting to get counter for next number: ${COUNTER_COLLECTION}/${TICKET_COUNTER_DOC}`);
      const counterSnap = await transaction.get(counterRef);
      if (!counterSnap.exists()) {
        // If the counter doesn't exist here, initialization failed or hasn't run properly.
        console.error("[Firestore] CRITICAL: Ticket counter document not found during getNextTicketNumber. Initialization might have failed or is incomplete.");
        throw new Error("Ticket counter is not initialized. Please reload the page or contact support."); // More specific error
      }

      const currentNumber = counterSnap.data()?.currentNumber;
       console.log(`[Firestore] Current counter value read: ${currentNumber}`);

      // Validate currentNumber
      if (typeof currentNumber !== 'number' || !Number.isInteger(currentNumber) || currentNumber < 0) {
          console.warn(`[Firestore] Invalid counter value found: ${currentNumber}. Resetting sequence to 1.`);
          // Reset to 1 if the value is invalid
          transaction.update(counterRef, { currentNumber: 1 });
           console.log(`[Firestore] Counter reset to 1.`);
          return 1;
      }

      const nextNumber = currentNumber + 1;
       console.log(`[Firestore] Calculated next number: ${nextNumber}. Updating counter...`);
      transaction.update(counterRef, { currentNumber: nextNumber });
       console.log(`[Firestore] Counter updated successfully to ${nextNumber}.`);
      return nextNumber;
    });
    return newNumber;
  } catch (error: unknown) { // Catch unknown type
    console.error("[Firestore] Error in getNextTicketNumber transaction: ", error);
     if (error instanceof FirestoreError) {
             console.error(`[Firestore] Firestore Error Code: ${error.code}`);
             console.error(`[Firestore] Firestore Error Message: ${error.message}`);
     }

    // Re-throw a more specific error if it's the initialization one, otherwise the generic one
    if (error instanceof Error && error.message.startsWith("Ticket counter is not initialized")) {
        throw error; // Throw the specific initialization error
    }
    // Throw a generic error for other transaction failures (e.g., conflicts, network issues)
    throw new Error(`Could not retrieve the next ticket number due to a transaction error. Details: ${error instanceof Error ? error.message : String(error)}`);
  }
};


// --- Ticket Management ---

// Add a new ticket to the queue
export const addTicket = async (ticketData: Omit<Ticket, 'number' | 'timestamp' | 'status' | 'id' | 'callTimestamp' | 'deskNumber'>): Promise<Ticket> => {
  try {
    console.log("[Firestore] Attempting to get next ticket number...");
    const nextNumber = await getNextTicketNumber(); // This now relies on the counter existing
    console.log(`[Firestore] Next ticket number obtained: ${nextNumber}`);
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
    console.log("[Firestore] Adding ticket document with payload:", newTicketPayload);
    const docRef = await addDoc(collection(db, TICKETS_COLLECTION), newTicketPayload);
     console.log(`[Firestore] Ticket document added with ID: ${docRef.id}`);

    // Fetch the added document to get the server-generated timestamp correctly
    console.log(`[Firestore] Fetching newly created ticket document: ${docRef.id}`);
    const newDocSnap = await getDoc(docRef);
    if (!newDocSnap.exists()) {
         console.error(`[Firestore] Failed to fetch the newly created ticket document with ID: ${docRef.id}`);
        throw new Error("Failed to fetch the newly created ticket after adding.");
    }
     console.log("[Firestore] Successfully fetched new ticket document.");
     // Construct the final Ticket object, converting timestamps
     const addedTicketData = { id: newDocSnap.id, ...newDocSnap.data() };


    return convertTimestamps(addedTicketData);
  } catch (error: unknown) { // Catch unknown type
    console.error("[Firestore] Error adding ticket: ", error);
     if (error instanceof FirestoreError) {
        console.error(`[Firestore] Firestore Error Code: ${error.code}`);
        console.error(`[Firestore] Firestore Error Message: ${error.message}`);
    }
    // Re-throw the error for handling in the component
    // Ensure it's an Error object for consistent handling upstream
    if (error instanceof Error) {
        throw error;
    } else {
        throw new Error(`An unexpected error occurred while adding the ticket: ${String(error)}`);
    }
  }
};

// Update the status and call info of a ticket
export const updateTicketStatus = async (
    ticketId: string,
    status: TicketStatus,
    deskNumber?: number | null // Desk number is still optional
): Promise<void> => {
    const ticketRef = doc(db, TICKETS_COLLECTION, ticketId);
    console.log(`[Firestore] Updating ticket ${ticketId} to status: ${status}` + (deskNumber !== undefined ? ` for desk ${deskNumber}` : ''));
    // Use Partial<Ticket> for type safety with Firestore data structure
    const updateData: { [key: string]: any } = { status }; // Use a flexible type for Firestore update

    if (status === 'called') {
        // Always use serverTimestamp when calling/recalling
        updateData.callTimestamp = serverTimestamp();
        // Assign desk number only when calling
        if (deskNumber !== undefined && deskNumber !== null) {
            updateData.deskNumber = deskNumber;
        } else {
            // If calling without a specific desk (e.g., recall maybe?), set desk to null.
             updateData.deskNumber = null;
        }
    } else if (status === 'completed' || status === 'skipped' || status === 'waiting') {
        // For 'completed', 'skipped', or resetting to 'waiting', clear call info
        // Note: We typically don't set back to 'waiting' via this function, but handle defensively.
        updateData.callTimestamp = null;
        updateData.deskNumber = null;
         // If completing/skipping, we keep the last callTimestamp for history sorting,
         // so only clear deskNumber unless explicitly setting back to 'waiting'.
         if (status !== 'waiting') {
            // Keep callTimestamp for completed/skipped for accurate sorting in history
            delete updateData.callTimestamp;
         } else {
             // If explicitly setting back to 'waiting', ensure callTimestamp is nulled
             updateData.callTimestamp = null;
         }
    }


    try {
        await updateDoc(ticketRef, updateData);
         console.log(`[Firestore] Ticket ${ticketId} updated successfully.`);
    } catch (error: unknown) { // Catch unknown type
        console.error(`[Firestore] Error updating ticket status for ${ticketId}: `, error);
        if (error instanceof FirestoreError) {
            console.error(`[Firestore] Firestore Error Code: ${error.code}`);
            console.error(`[Firestore] Firestore Error Message: ${error.message}`);
        }
        // Re-throw for handling upstream
        if (error instanceof Error) {
            throw error;
        } else {
            throw new Error(`An unexpected error occurred while updating ticket status: ${String(error)}`);
        }
    }
};


// --- Realtime Listeners ---

// Listen for changes in the ticket queue (waiting tickets)
export const onQueueUpdate = (callback: (tickets: Ticket[]) => void): Unsubscribe => {
  console.log("[Firestore] Setting up listener for waiting queue...");
  const q = query(
    collection(db, TICKETS_COLLECTION),
    where('status', '==', 'waiting'),
    orderBy('timestamp', 'asc') // Get the oldest waiting tickets first
  );

  const unsubscribe = onSnapshot(q, (querySnapshot) => {
     console.log(`[Firestore] Queue update received. Found ${querySnapshot.size} waiting tickets.`);
    const tickets: Ticket[] = [];
    querySnapshot.forEach((doc) => {
      // Pass the document id explicitly to convertTimestamps
      tickets.push(convertTimestamps({ ...doc.data(), id: doc.id }));
    });
    callback(tickets);
  }, (error) => {
    console.error("[Firestore] Error listening to queue updates: ", error);
     if (error instanceof FirestoreError) {
        console.error(`[Firestore] Error Code: ${error.code}`);
    }
    // Handle error appropriately, maybe notify the user or clear the queue display
     callback([]); // Send empty array on error to clear display
  });

  return unsubscribe;
};

// Listen for the currently called ticket(s)
export const onCurrentTicketUpdate = (callback: (ticket: Ticket | null) => void): Unsubscribe => {
   console.log("[Firestore] Setting up listener for current ticket...");
  const q = query(
    collection(db, TICKETS_COLLECTION),
    where('status', '==', 'called'),
    orderBy('callTimestamp', 'desc'), // Get the most recently called
    limit(1) // Only need the latest one
  );

  const unsubscribe = onSnapshot(q, (querySnapshot) => {
    if (!querySnapshot.empty) {
      const doc = querySnapshot.docs[0];
       console.log(`[Firestore] Current ticket update received: ${doc.id}`);
       // Pass the document id explicitly to convertTimestamps
      callback(convertTimestamps({ ...doc.data(), id: doc.id }));
    } else {
       console.log("[Firestore] No currently 'called' ticket found.");
      callback(null); // No ticket currently marked as 'called'
    }
  }, (error) => {
    console.error("[Firestore] Error listening to current ticket updates: ", error);
    if (error instanceof FirestoreError) {
        console.error(`[Firestore] Error Code: ${error.code}`);
    }
     callback(null); // Assume no current ticket on error
  });

  return unsubscribe;
};


// Listen for changes in the call history (called, completed, skipped tickets)
export const onCallHistoryUpdate = (
    limitCount: number = 50, // Default limit
    callback: (tickets: Ticket[]) => void
    ): Unsubscribe => {
    console.log(`[Firestore] Setting up listener for call history (limit ${limitCount})...`);
  const q = query(
    collection(db, TICKETS_COLLECTION),
    where('status', 'in', ['called', 'completed', 'skipped']), // Include relevant statuses
    orderBy('callTimestamp', 'desc'), // Show the most recent calls first
    limit(limitCount) // Limit the number of history items
  );

  const unsubscribe = onSnapshot(q, (querySnapshot) => {
     console.log(`[Firestore] Call history update received. Found ${querySnapshot.size} relevant tickets.`);
    const tickets: Ticket[] = [];
    querySnapshot.forEach((doc) => {
       // Pass the document id explicitly to convertTimestamps
      tickets.push(convertTimestamps({ ...doc.data(), id: doc.id }));
    });
    callback(tickets);
  }, (error) => {
    console.error("[Firestore] Error listening to call history updates: ", error);
     if (error instanceof FirestoreError) {
        console.error(`[Firestore] Error Code: ${error.code}`);
    }
     callback([]); // Send empty array on error
  });

  return unsubscribe;
};


// Get the next waiting ticket without modifying it (for display purposes)
export const peekNextTickets = async (count: number = 3): Promise<Ticket[]> => {
     console.log(`[Firestore] Peeking next ${count} waiting tickets...`);
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
         console.log(`[Firestore] Found ${tickets.length} tickets to peek.`);
        return tickets;
    } catch (error: unknown) { // Catch unknown type
        console.error("[Firestore] Error peeking next tickets: ", error);
         if (error instanceof FirestoreError) {
            console.error(`[Firestore] Firestore Error Code: ${error.code}`);
            console.error(`[Firestore] Firestore Error Message: ${error.message}`);
        }
        return []; // Return empty array on error
    }
};


// Function to get the most recently called/completed/skipped ticket
export const getLatestCalledTicket = async (): Promise<Ticket | null> => {
    console.log("[Firestore] Getting latest called/completed/skipped ticket...");
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
            console.log(`[Firestore] Found latest ticket in history: ${doc.id}`);
            // Pass the document id explicitly to convertTimestamps
            return convertTimestamps({ ...doc.data(), id: doc.id });
        }
         console.log("[Firestore] No tickets found in call history.");
        return null; // No tickets found in history
    } catch (error: unknown) { // Catch unknown type
        console.error("[Firestore] Error getting latest called ticket: ", error);
         if (error instanceof FirestoreError) {
            console.error(`[Firestore] Firestore Error Code: ${error.code}`);
            console.error(`[Firestore] Firestore Error Message: ${error.message}`);
        }
        return null; // Return null on error
    }
}
