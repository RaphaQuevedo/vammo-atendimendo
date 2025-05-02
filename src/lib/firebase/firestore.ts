
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
// Assumes the input object 'ticketDataWithId' already includes the Firestore document ID as 'id'.
const convertTimestamps = (ticketDataWithId: any): Ticket => {
  // Ensure the input has an ID, throw if not for better error tracing
  if (!ticketDataWithId || typeof ticketDataWithId.id !== 'string' || ticketDataWithId.id === '') {
      console.error("[Firestore Convert] Input data is missing a valid 'id' field:", ticketDataWithId);
      throw new Error("Internal error: Cannot process ticket data without a valid ID.");
  }

  const data = { ...ticketDataWithId }; // Clone to avoid modifying the original object directly

  // Convert Firestore Timestamp to JavaScript Date for 'timestamp'
  if (data.timestamp && typeof data.timestamp.toDate === 'function') {
    data.timestamp = data.timestamp.toDate();
  } else if (data.timestamp && !(data.timestamp instanceof Date)) {
      // If it exists but isn't a Timestamp or Date, log a warning and maybe nullify it or attempt conversion if possible
      console.warn(`[Firestore Convert] Ticket ${data.id}: 'timestamp' field is not a Firestore Timestamp or Date. Found:`, data.timestamp);
      // Decide on handling: nullify, attempt conversion, or leave as is based on expected data types.
      // For now, let's nullify it to prevent potential downstream errors.
      // data.timestamp = null; // Or handle differently as needed
  }


  // Convert Firestore Timestamp to JavaScript Date for 'callTimestamp'
   if (data.callTimestamp && typeof data.callTimestamp.toDate === 'function') {
    data.callTimestamp = data.callTimestamp.toDate();
  } else if (data.callTimestamp === undefined) {
       // Explicitly set to null if undefined, matching the Ticket type ( | null)
       data.callTimestamp = null;
   } else if (data.callTimestamp && !(data.callTimestamp instanceof Date)) {
      // If it exists but isn't a Timestamp, Date, or null, log a warning.
      console.warn(`[Firestore Convert] Ticket ${data.id}: 'callTimestamp' field is not a Firestore Timestamp, Date, or null. Found:`, data.callTimestamp);
      // data.callTimestamp = null; // Or handle differently
  }
    // Ensure deskNumber is null if undefined or not a number
  if (data.deskNumber === undefined) {
      data.deskNumber = null;
  } else if (typeof data.deskNumber !== 'number' && data.deskNumber !== null) {
       console.warn(`[Firestore Convert] Ticket ${data.id}: 'deskNumber' field is not a number or null. Found:`, data.deskNumber);
       data.deskNumber = null;
  }


  // The 'id' is already assumed to be present and correct in 'data' from the input 'ticketDataWithId'
  // No need for the previous check: if (!data.id && ticketDataWithId.id)

  // Cast to Ticket type. If data structure mismatches occur often, consider more robust validation (e.g., with Zod).
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
        // Attempt initialization again, just in case, though this indicates a deeper issue.
        // Consider if auto-initialization here is the right approach vs. failing hard.
        // For robustness, let's try initializing at 0.
        console.warn("[Firestore] Attempting to initialize counter within getNextTicketNumber...");
        transaction.set(counterRef, { currentNumber: 0 });
        console.log("[Firestore] Counter initialized to 0 within transaction. Returning 1 as the first number.");
        return 1; // The number for the *current* ticket being generated is 1
        // throw new Error("Ticket counter is not initialized. Please reload the page or contact support."); // More specific error
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
     // Construct the final Ticket object, including the ID before converting timestamps
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
        updateData.deskNumber = null; // Always clear desk number for these statuses

         // Decide how to handle callTimestamp based on the status
         if (status === 'waiting') {
             // If explicitly setting back to 'waiting', ensure callTimestamp is nulled
             updateData.callTimestamp = null;
         } else {
             // For 'completed' and 'skipped', we *keep* the last `callTimestamp` for history sorting.
             // Firestore `updateDoc` only modifies specified fields, so we *don't* include `callTimestamp`
             // in `updateData` for 'completed' or 'skipped' unless we explicitly want to null it.
             // In this case, we want to preserve it.
             // delete updateData.callTimestamp; // This line is effectively what happens by not adding it
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
        try {
            // Pass the document id explicitly to convertTimestamps
            tickets.push(convertTimestamps({ ...doc.data(), id: doc.id }));
        } catch (convertError) {
            console.error(`[Firestore] Error converting ticket data for ID ${doc.id} in queue listener:`, convertError);
            // Skip this ticket or handle the error as needed
        }
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
        try {
           // Pass the document id explicitly to convertTimestamps
          callback(convertTimestamps({ ...doc.data(), id: doc.id }));
        } catch (convertError) {
             console.error(`[Firestore] Error converting current ticket data for ID ${doc.id}:`, convertError);
             callback(null); // Indicate error by setting to null
        }
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
        try {
           // Pass the document id explicitly to convertTimestamps
          tickets.push(convertTimestamps({ ...doc.data(), id: doc.id }));
        } catch (convertError) {
            console.error(`[Firestore] Error converting ticket data for ID ${doc.id} in history listener:`, convertError);
            // Skip this ticket or handle the error as needed
        }
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
            try {
                // Pass the document id explicitly to convertTimestamps
                tickets.push(convertTimestamps({ ...doc.data(), id: doc.id }));
            } catch (convertError) {
                 console.error(`[Firestore] Error converting ticket data for ID ${doc.id} while peeking:`, convertError);
                 // Skip this ticket
            }
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
             try {
                // Pass the document id explicitly to convertTimestamps
                return convertTimestamps({ ...doc.data(), id: doc.id });
            } catch (convertError) {
                console.error(`[Firestore] Error converting latest called ticket data for ID ${doc.id}:`, convertError);
                return null; // Return null if conversion fails
            }
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
