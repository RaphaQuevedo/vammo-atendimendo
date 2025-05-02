
# Vammo - Sistema de Atendimento por Senhas

This is a Next.js application for managing customer queues using tickets.

## Project Structure

- `/src/app/`: Contains the main application pages using Next.js App Router.
  - `page.tsx`: Landing page directing users to different terminals.
  - `/request/page.tsx`: Interface for customers to request a new ticket.
  - `/manage/page.tsx`: Interface for staff to manage the queue and call tickets.
  - `/display/page.tsx`: Public display screen showing the current ticket and call history.
- `/src/components/`: Reusable React components.
  - `/ui/`: Components from shadcn/ui library.
  - `ticket-generator.tsx`: Form for generating new tickets.
  - `ticket-management.tsx`: Controls for staff to manage the queue.
  - `ticket-display.tsx`: Component for the public display screen.
  - `call-history-display.tsx`: Component to show the list of recently called tickets.
- `/src/lib/`: Utility functions and libraries.
  - `/firebase/`: Firebase configuration and Firestore service functions.
  - `utils.ts`: General utility functions (like `cn`).
- `/src/hooks/`: Custom React hooks (e.g., `use-toast`).
- `/src/types/`: TypeScript type definitions (e.g., `ticket.ts`).
- `/public/`: Static assets.
  - `/sounds/`: Notification sound files.

## Getting Started

1.  **Clone the repository:**
    ```bash
    git clone <repository-url>
    cd <repository-directory>
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    # or
    yarn install
    # or
    pnpm install
    ```

3.  **Set up Firebase:**
    *   Create a Firebase project at [https://console.firebase.google.com/](https://console.firebase.google.com/).
    *   Add a Web App to your project.
    *   Enable Firestore Database in your project settings.
    *   Copy your Firebase configuration credentials.

4.  **Configure Environment Variables:**
    *   Rename the `.env.example` file (if provided) or create a new file named `.env` in the project root.
    *   Add your Firebase configuration details to the `.env` file:
        ```env
        # Firebase Configuration - Replace with your actual values
        NEXT_PUBLIC_FIREBASE_API_KEY=YOUR_API_KEY
        NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=YOUR_AUTH_DOMAIN
        NEXT_PUBLIC_FIREBASE_PROJECT_ID=YOUR_PROJECT_ID
        NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=YOUR_STORAGE_BUCKET
        NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=YOUR_MESSAGING_SENDER_ID
        NEXT_PUBLIC_FIREBASE_APP_ID=YOUR_APP_ID
        NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=YOUR_MEASUREMENT_ID # Optional
        ```
    *   **Important:** Replace `YOUR_...` placeholders with your actual Firebase credentials.

5.  **Run the development server:**
    ```bash
    npm run dev
    # or
    yarn dev
    # or
    pnpm dev
    ```

6.  Open [http://localhost:9002](http://localhost:9002) (or your configured port) with your browser to see the application.

## Available Interfaces

*   **Landing Page (`/`)**: Provides links to the different terminal interfaces.
*   **Request Ticket (`/request`)**: Allows customers to generate a new ticket.
*   **Manage Queue (`/manage`)**: Enables staff to view the queue, call next/previous/recall tickets, and see call history. Requires selecting a desk number.
*   **Public Display (`/display`)**: Shows the currently called ticket, upcoming tickets, and recent call history. Includes a notification sound when a new ticket is called.

## Firestore Data Structure

*   **`tickets` collection**: Stores individual ticket documents.
    *   Fields: `number`, `firstName`, `lastName`, `serviceType`, `status` ('waiting', 'called', 'completed', 'skipped'), `timestamp` (server timestamp), `callTimestamp` (server timestamp or null), `deskNumber` (number or null).
*   **`counters` collection**: Stores counter documents.
    *   **`ticketCounter` document**: Contains the `currentNumber` field used for generating sequential ticket numbers atomically using Firestore transactions.

## Key Features

*   **Real-time Updates:** Uses Firestore listeners for live updates to the queue, current ticket display, and call history across all interfaces.
*   **Atomic Counter:** Ensures unique and sequential ticket numbers even with concurrent requests.
*   **Separate Interfaces:** Dedicated views for customers, staff, and public display.
*   **Desk Assignment:** Staff select a desk number (1-4) when calling tickets.
*   **Ticket Statuses:** Tracks tickets through 'waiting', 'called', 'completed', and 'skipped' states.
*   **Call Actions:** Staff can call the next ticket, recall the current ticket, or call the previously handled ticket.
*   **Notification Sound:** Plays an audio alert on the display screen when a new ticket is called.
*   **Responsive Design:** Uses shadcn/ui and Tailwind CSS for a modern, responsive layout.
