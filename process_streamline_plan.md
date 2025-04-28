# Process Streamlining Plan: Sidepanel Architecture Refactoring

## 1. Goal

To refactor the Tab Agent sidepanel's JavaScript architecture from its current state of relatively tight coupling between UI, message handling, and background communication logic towards a more decoupled, event-driven, and reactive model. This aims to improve modularity, maintainability, testability, and robustness by reducing direct dependencies and minimizing race conditions. The refactoring will draw inspiration from event bus patterns (like Kafka's producer/consumer model) and prioritize RxDB as the single source of truth for UI state.

## 2. { Where We Are } Current Flow Analysis

The existing flow for handling user input (both text queries and URL scrapes) involves several direct interactions between modules:

1.  **UI Input (`uiController`)**: Captures user input and triggers `messageHandler.handleSendMessage`.
2.  **Message Handling (`messageHandler`)**:
    *   Immediately calls `uiController.disableInput()`.
    *   Writes initial user message/session to DB.
    *   Writes a placeholder message ("Thinking...", "Scraping...") to DB.
    *   Directly calls `chatRenderer.displayMessage()` to show the placeholder.
    *   Triggers the background script (`chrome.runtime.sendMessage`).
    *   Calls `uiController.clearInput()`.
3.  **Background Script (`background.js`)**: Processes the request (scrape or placeholder response).
4.  **Background Response (`background.js`)**: Sends a result message (`STAGE_SCRAPE_RESULT` or `response`) back to the sidepanel.
5.  **Response Handling (`messageHandler`'s `onMessage` listener -> specific handlers):**
    *   Receives the background message.
    *   Updates/Deletes placeholder message in DB.
    *   Adds final/stage result message to DB.
    *   **Directly calls `chatRenderer.renderChatSession()`** to update the chat view based on the incoming message data.
    *   **Directly calls `uiController.enableInput()`** and `uiController.focusInput()` to update the input state.
    *   Resets internal state flags (`isSendingMessage`).

**Weaknesses:**

*   **Tight Coupling:** `messageHandler` has direct knowledge of and calls methods on `uiController` and `chatRenderer`. The background response listener directly orchestrates UI updates.
*   **Synchronization Issues:** Direct UI manipulation from asynchronous callbacks (background messages) led to race conditions where the UI state could become inconsistent or stuck (e.g., the `chatId === currentSessionId` check failing).
*   **Difficult Maintenance:** Changes in one module (e.g., UI state) often require modifications in unrelated modules (e.g., message handling response logic).
*   **Limited Testability:** Tightly coupled modules are harder to test in isolation.

## 3. { Where We Want To Be } Desired Flow (Reactive/Event-Driven)

The target architecture emphasizes decoupling using an Event Bus and relies on the Database (RxDB) as the primary source of state for the UI.

**Core Components & Responsibilities:**

1.  **Event Bus (`eventBus.js`):**
    *   A simple in-memory publish/subscribe system.
    *   Modules publish named events (e.g., `'ui:querySubmitted'`) with optional data payloads.
    *   Modules subscribe to events they need to react to.
    *   Provides the central communication channel, decoupling producers from consumers.

2.  **UI Layer (`uiController.js`, `chatRenderer.js`):**
    *   **Publishers:** Publish user interaction events (e.g., `eventBus.publish('ui:querySubmitted', { text })`).
    *   **Subscribers/Observers:** Primarily *react* to changes in the DB state (ideally via RxDB observables (`$`)).
        *   `uiController` observes relevant state (e.g., `activeSession.status`) to determine if the input should be enabled or disabled.
        *   `chatRenderer` observes the message list for the active session and automatically re-renders when it changes.
    *   **NO** direct calls received from orchestration or background response handlers.

3.  **Orchestration Layer (`orchestrator.js` - refactored from `messageHandler.js`):**
    *   **Subscribes** to relevant UI events (e.g., `'ui:querySubmitted'`).
    *   **Subscribes** to background communication events (e.g., `'background:responseReceived'`).
    *   **Responsibilities:** Manages the core business logic flow:
        *   Receives triggers.
        *   Updates state *in the DB* (e.g., sets `session.status = 'processing'`, adds user message, adds final AI/scrape response).
        *   Initiates background tasks (`chrome.runtime.sendMessage`).
    *   **NO** direct calls to UI modules.

4.  **Background Communication Layer (Listener in `sidepanel.js`):**
    *   The `chrome.runtime.onMessage.addListener`.
    *   **Sole Responsibility:** Receive messages from `background.js`.
    *   **Action:** Immediately `eventBus.publish` a corresponding event (e.g., `'background:responseReceived', messagePayload`) without interpreting the content.

5.  **Data Layer (`db.js`):**
    *   The single source of truth.
    *   Provides reactive streams (RxDB `$` observables) for different data points (active session, message lists, session status). UI and potentially Orchestrator layers subscribe to these.

**Example Flow ("hello" query):**

1.  `uiController` -> `eventBus.publish('ui:querySubmitted', { text: 'hello' })`.
2.  `Orchestrator` -> Subscribes to `'ui:querySubmitted'`, receives event.
3.  `Orchestrator` -> Creates session, adds user msg, sets `session.status = 'processing'` in DB.
4.  DB Observable -> Notifies subscribers (`uiController`, `chatRenderer`).
5.  `uiController` -> Sees `status='processing'`, disables input.
6.  `chatRenderer` -> Sees new user message, renders it.
7.  `Orchestrator` -> Sends trigger message to `background.js`.
8.  `background.js` -> Processes, sends `response` message back.
9.  `Sidepanel Listener` -> Receives `response`, `eventBus.publish('background:responseReceived', responsePayload)`.
10. `Orchestrator` -> Subscribes to `'background:responseReceived'`, receives event.
11. `Orchestrator` -> Writes AI response & sets `session.status = 'complete'` in DB.
12. DB Observable -> Notifies subscribers (`uiController`, `chatRenderer`).
13. `uiController` -> Sees `status='complete'`, enables input.
14. `chatRenderer` -> Sees new AI message, renders it.

## 4. Refactoring Steps

1.  **Implement Event Bus:**
    *   Create `src/eventBus.js`.
    *   Implement a simple `EventBus` class with `subscribe`, `unsubscribe`, `publish` methods using a `Map` for listeners.
    *   Export a singleton instance: `export const eventBus = new EventBus();`.

2.  **Decouple Background Listener:**
    *   Locate `chrome.runtime.onMessage.addListener` (likely in `sidepanel.js` or `messageHandler.js`).
    *   Modify it to *only* publish events onto the `eventBus` based on `message.type` (e.g., `'background:responseReceived'`, `'background:scrapeStageResult'`, `'background:errorReceived'`).
    *   Remove the calls to `handleBackgroundResponse`, `handleScrapeResponse`, etc., from within this listener.

3.  **Create/Refactor Orchestrator:**
    *   Rename `src/Home/messageHandler.js` to `src/Home/orchestrator.js` (or create new).
    *   Refactor its functions (`handleSendMessage`, `processQuery`, `processUrl`, etc.).
    *   Remove `initializeMessageHandler` and `setupBackgroundListeners` exports/calls.
    *   **Add Subscriptions:** Subscribe to necessary events:
        *   `eventBus.subscribe('ui:querySubmitted', handleQuerySubmit);`
        *   `eventBus.subscribe('background:responseReceived', handleBackgroundResponse);`
        *   `eventBus.subscribe('background:scrapeStageResult', handleScrapeResult);`
        *   `eventBus.subscribe('background:errorReceived', handleBackgroundError);`
    *   **Modify Handlers:** Ensure handlers now *only*:
        *   Read necessary data (from event payload or DB).
        *   Update the DB state (add messages, set session status flags like `isProcessing`).
        *   Trigger background tasks (`chrome.runtime.sendMessage`).
    *   **Remove UI Calls:** Delete *all* lines that directly call `uiController` or `chatRenderer` functions.

4.  **Refactor UI Layer (Reactive Binding):**
    *   **UI -> Event Bus:** Modify `uiController` (e.g., `handleSendButtonClick`) to `eventBus.publish('ui:querySubmitted', { text })` instead of calling `messageHandler`.
    *   **DB -> UI:** This requires using RxDB's reactive capabilities.
        *   In `sidepanel.js` (or potentially within `uiController`/`chatRenderer` initialization):
            *   Subscribe to an observable for the active session's status (`activeSessionDoc.status$.subscribe(...)`). When the status changes, call the *internal* enable/disable logic within `uiController`.
            *   Subscribe to an observable for the active session's messages (`activeSessionDoc.messages$.subscribe(...)`). When the messages array changes, trigger the *internal* rendering logic within `chatRenderer`.
        *   This replaces the need for direct calls like `ui.enableInput()` or `renderer.renderChatSession()` from the orchestrator/response handlers.

5.  **Define State Flags:** Introduce necessary state flags within the DB schema (e.g., add an `isProcessing` or `status` field to the chat session document) that the orchestrator can update and the UI can observe.

6.  **Testing:** Incrementally test each interaction:
    *   Does submitting a query publish the correct event?
    *   Does the orchestrator receive the event and update the DB status?
    *   Does the UI disable based on the DB status change?
    *   Does the background listener receive the response and publish the event?
    *   Does the orchestrator receive the background event and update the DB result/status?
    *   Does the UI enable and display the result based on the final DB state change?

## 5. Vite Build Considerations

*   **`eventBus.js` & `orchestrator.js`:** These new modules will be imported by `sidepanel.js` (or modules it imports). Vite's standard bundling should handle them correctly without needing additions to `viteStaticCopy`.
*   **`viteStaticCopy`:** This plugin remains necessary for assets *not* imported/processed by Vite's module graph: `manifest.json`, HTML files, CSS files, icons, and any standalone JS files loaded directly by the manifest (like `content.js`, `PageExtractor.js`, etc.). No changes should be needed here *for this specific refactoring*.
*   **Paths:** Ensure all import paths within the refactored modules are correct relative to each other within the `src` directory. Vite handles resolving these for the `dist` output.

## 6. Benefits of Refactoring

*   **Modularity:** Clear separation of concerns (UI, Logic, Data, Communication).
*   **Maintainability:** Changes to one part (e.g., UI rendering) are less likely to break unrelated logic (e.g., background communication).
*   **Testability:** Individual modules (Event Bus, Orchestrator, UI components) can be tested more easily in isolation.
*   **Reduced Bugs:** Eliminates direct cross-boundary calls, significantly reducing the potential for race conditions and state synchronization errors.
*   **Scalability:** Provides a solid foundation for adding more complex features like the planned Agent and RAG functionalities without making the core message flow overly complex. 