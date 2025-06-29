# Agent Creation Guide: Adhering to the A2A Protocol

This guide outlines the architecture and steps required to make the TabAgent agent system compliant with the Agent2Agent (A2A) protocol. It serves as a blueprint for refactoring existing agents and building future A2A-compliant agents.

## 1. Core A2A Concepts Review

Before building, ensure a clear understanding of these A2A fundamentals:

*   **Agent Card (`/.well-known/agent.json`):** Public metadata defining the agent's identity, capabilities (skills), endpoint URL, and authentication. Essential for discovery.
*   **A2A Server:** The HTTP endpoint implementing the A2A JSON-RPC methods. It's the entry point for all client interactions.
*   **Task:** The central unit of work, identified by a unique `id`. Tracks the conversation state (`submitted`, `working`, `input-required`, `completed`, `failed`), message history, and results (artifacts).
*   **Message:** Represents a turn in the conversation (`role: "user"` or `role: "agent"`). Contains `Parts`.
*   **Part:** The content unit (e.g., `TextPart`, `FilePart`, `DataPart`).
*   **Artifact:** Output generated by the agent (e.g., final text response, scraped data, error details). Contains `Parts`.
*   **Methods:**
    *   `tasks/send`: For synchronous or single-turn requests. Returns the final Task object.
    *   `tasks/sendSubscribe`: For long-running tasks or streaming updates. Uses Server-Sent Events (SSE) to push `TaskStatusUpdateEvent` and `TaskArtifactUpdateEvent`.
    *   `tasks/pushNotification/set`: (Optional) For webhook-based updates.
*   **JSON Structure:** Strict adherence to the A2A JSON schema for requests and responses is critical.

## 2. Proposed A2A-Compliant Architecture (Refined)

We will introduce a dedicated A2A Server layer that wraps the existing agent logic, following patterns observed in A2A samples.

```
+-------------------+      +--------------------------+      +-----------------------------------+      +--------------------------------+
|    A2A Client     | ---> | A2A Server (FastAPI)     | ---> | Agent Task Manager                | ---->| Orchestrator Agent             |
| (e.g., TabAgent UI|      | (Handles /a2a, SSE)      |      | (Holds Agent Ref, Manages Tasks)  |      | (invoke/stream methods)        |
|  or another agent)|      |                          |      |                                   |      +----------------+---------------+
+-------------------+      +--------------------------+      +-----------------+-----------------+                     |
                               |                           |                                     +--> Scraper Agent Logic
                               |                           |                                     |
                               |                           +-------------------------------------+--> Model Loader Logic
                               |                                                                     |
                               +---------------------------------------------------------------------+--> (Future Agents)
```

**Components:**

1.  **A2A Server (`a2a_server.py` / `__main__.py`):**
    *   A FastAPI application (or similar, potentially using a common A2A server base class like `A2AServer` from samples).
    *   **Initialization:** Instantiates the specific `OrchestratorAgent` **and** the `AgentTaskManager`. **Passes the agent instance to the Task Manager**, and the Task Manager instance to the Server base/framework.
    *   Serves the Agent Card at `/.well-known/agent.json`.
    *   Implements the `/a2a` endpoint handling A2A JSON-RPC methods (`tasks/send`, `tasks/sendSubscribe`). Relies on the `AgentTaskManager` to handle the core logic for these methods.
    *   Manages SSE connections for `tasks/sendSubscribe`.

2.  **Agent Task Manager (`task_manager.py` - Specific Implementation):**
    *   Likely inherits from a base `InMemoryTaskManager` (or similar) providing core storage.
    *   **Holds a reference to the instantiated `OrchestratorAgent`**.
    *   Implements the primary logic for A2A methods (`on_send_task`, `on_send_task_subscribe`):
        *   Validates requests.
        *   Creates/updates Task objects in its store (in-memory dict initially).
        *   **For `on_send_task`:** Directly calls the `orchestrator_agent.invoke(...)` method, waits for the result, processes it, updates the Task state (`completed`/`failed`/`input-required`), and returns the final Task.
        *   **For `on_send_task_subscribe`:**
            *   Sets up an SSE event queue/callback mechanism for the `taskId`.
            *   **Starts a background async task (e.g., `_run_streaming_orchestrator`)**.
            *   The background task calls the `orchestrator_agent.stream(...)` method.
            *   Immediately returns the SSE response stream to the client.
    *   **`_run_streaming_orchestrator` (Background Async Method):**
        *   Calls and iterates through `async for update in orchestrator_agent.stream(...)`.
        *   For each `update` yielded by the agent:
            *   Determines the A2A `TaskState` and content based on the update structure.
            *   Calls internal methods (`update_store`) to modify the Task object (status, message, artifact).
            *   **Enqueues the corresponding A2A event (`TaskStatusUpdateEvent`, `TaskArtifactUpdateEvent`)** for the specific `taskId`'s SSE stream.
    *   Handles push notifications if required.

3.  **Orchestrator Agent (`orchestrator_agent.py` Refactored):**
    *   The core LangGraph workflow logic remains.
    *   Needs **two primary interaction methods:**
        *   **`invoke(self, query: str, session_id: str) -> Dict:`** (Synchronous)
            *   Runs the LangGraph workflow (`orchestrator_app.invoke`).
            *   **Returns a final dictionary** containing status indicators (e.g., `is_task_complete`, `require_user_input`, `error`) and the final content/message. This dictionary is processed by the `AgentTaskManager`.
        *   **`stream(self, query: str, session_id: str) -> AsyncIterable[Dict]:`** (Asynchronous Streaming)
            *   Needs to run the LangGraph workflow potentially using `orchestrator_app.astream_events` or similar async streaming methods if available, or by manually instrumenting the graph.
            *   **Must `yield` dictionaries at key points** (e.g., start of routing, invoking sub-agent, sub-agent progress, final formatting).
            *   These yielded dictionaries should contain status indicators (`is_task_complete`, `require_user_input`, `error`) and intermediate content/messages (e.g., "Routing request...", "Scraping page..."). **The structure of these dictionaries needs to be agreed upon between the Agent and the Task Manager.**
            *   Yields a final dictionary indicating completion/failure/input-required.
    *   LangGraph nodes (especially long-running ones like `run_scraper_agent_node`, `run_model_loader_node`) need modification to **yield progress updates** that the `stream` method can capture and relay. (This might require custom node wrappers or modifications to the LangGraph execution).
    *   Uses LangGraph's checkpointing (`MemorySaver` or similar) configured with the `sessionId` (as `thread_id`) for conversational state.

4.  **Sub-Agents/Logic (`scraper_agent.py`, `model_loader.py`):**
    *   If invoked within the `OrchestratorAgent`'s `stream` method, they need to be `async` and potentially `yield` progress updates back to the orchestrator's streaming loop, rather than directly interacting with the `TaskManager`.

## 3. Implementation Steps (Refined)

1.  **Setup Base (`__main__.py`, common libs):**
    *   Define/import common A2A Pydantic models (Task, Message, etc.) or include a common library.
    *   Setup FastAPI app.
    *   Define Agent Card JSON.
    *   Implement `/.well-known/agent.json` endpoint.
    *   Create the base `InMemoryTaskManager` if not using a pre-built one.

2.  **Implement `AgentTaskManager` (`task_manager.py`):**
    *   Create the class, inheriting if applicable.
    *   Add `__init__` to accept and store the `OrchestratorAgent` instance.
    *   Implement `on_send_task`: Calls `agent.invoke`, processes result, updates store.
    *   Implement `on_send_task_subscribe`: Sets up SSE queue, starts `_run_streaming_orchestrator` in background.
    *   Implement `_run_streaming_orchestrator`: Iterates `agent.stream`, updates store, enqueues SSE events.
    *   Implement store methods (`create_task`, `update_store`, `get_task`, etc.) and SSE queue logic.

3.  **Refactor `OrchestratorAgent` (`orchestrator_agent.py`):**
    *   Define the `invoke` method to run the graph synchronously and return the final status dictionary.
    *   Define the `stream` method (`async def stream(...) -> AsyncIterable[Dict]:`).
        *   Adapt LangGraph invocation to use an async streaming method (`astream_events`? Custom loop?).
        *   Modify relevant LangGraph nodes to `yield` progress dictionaries within their execution.
        *   The `stream` method should capture these yields and yield them further.
        *   Yield a final status dictionary.
    *   Ensure `sessionId` is correctly mapped to LangGraph's `thread_id` config for memory.

4.  **Refactor Sub-Agents/Logic:**
    *   Make relevant functions `async`.
    *   Modify them to `yield` progress updates if they are called within the orchestrator's `stream` path.

5.  **Connect Components (`__main__.py`):**
    *   Instantiate `OrchestratorAgent`.
    *   Instantiate `AgentTaskManager`, passing the agent instance.
    *   Instantiate `A2AServer` (or configure FastAPI routes), passing the task manager instance.
    *   Implement the `/a2a` route handler to delegate calls to the appropriate `task_manager.on_...` methods.

6.  **Create Agent Card (`/.well-known/agent.json` content):**
    *   Fill in details: name, description, URL, methods (`tasks/send`, `tasks/sendSubscribe`), skills (`skill_chat`, `skill_scrape`, `skill_load_model`), output modes (`text`).

## 4. Best Practices & Considerations (Refined)

*   **Schema Validation:** Use Pydantic models rigorously for A2A structures.
*   **Error Handling:** Map internal errors to A2A JSON-RPC errors; update Task to `failed`.
*   **Asynchronous Operations:** `asyncio` is key. Use `async def` and `await` correctly. Manage background tasks (`_run_streaming_orchestrator`).
*   **Task Persistence:** Plan for a persistent store (DB, Redis) beyond in-memory for production.
*   **Streaming Yield Structure:** **Clearly define the dictionary structure yielded by the agent's `stream` method** so the `TaskManager` can interpret it correctly (e.g., `{'status': 'working', 'message': '...', 'is_task_complete': False, ...}`).
*   **LangGraph Streaming:** Investigating how to effectively `yield` progress from *within* LangGraph nodes during `astream` execution is critical and may require custom graph construction or node wrappers.
*   **Agent/TaskManager Coupling:** The pattern observed involves coupling the Task Manager to a specific agent's interface (`invoke`/`stream`). This is effective but less generic.
*   **Security:** Implement authentication/authorization if needed.
*   **Modularity:** Keep A2A Server, Task Manager, and Agent Core logic reasonably separate.

Read these if needed
# https://github.com/google/A2A/tree/main/samples/python/agents/langgraph
# https://github.com/google/A2A?tab=readme-ov-file
# https://github.com/google/A2A/blob/main/demo/README.md

Key Features
Multi-turn Conversations: Agent can request additional information when needed 
Real-time Streaming: Provides status updates during processing 
Conversational Memory: Maintains context across interactions in the same session and across entire other chats when needed ( an agent extra might be required for this specific use case)
Cache System: Stores generated images,text for retrieval (in-memory or file-based) using our system
We will have multi agent workflow , our main agent is orchestrator agent , other agent will report to him . 


Examples
Synchronous request

Request:

POST http://localhost:10000
Content-Type: application/json

{
  "jsonrpc": "2.0",
  "id": 11,
  "method": "tasks/send",
  "params": {
    "id": "129",
    "sessionId": "8f01f3d172cd4396a0e535ae8aec6687",
    "acceptedOutputModes": [
      "text"
    ],
    "message": {
      "role": "user",
      "parts": [
        {
          "type": "text",
          "text": "How much is the exchange rate for 1 USD to INR?"
        }
      ]
    }
  }
}
Response:

{
  "jsonrpc": "2.0",
  "id": 11,
  "result": {
    "id": "129",
    "status": {
      "state": "completed",
      "timestamp": "2025-04-02T16:53:29.301828"
    },
    "artifacts": [
      {
        "parts": [
          {
            "type": "text",
            "text": "The exchange rate for 1 USD to INR is 85.49."
          }
        ],
        "index": 0
      }
    ],
    "history": []
  }
}
Multi-turn example

Request - Seq 1:

POST http://localhost:10000
Content-Type: application/json

{
  "jsonrpc": "2.0",
  "id": 10,
  "method": "tasks/send",
  "params": {
    "id": "130",
    "sessionId": "a9bb617f2cd94bd585da0f88ce2ddba2",
    "acceptedOutputModes": [
      "text"
    ],
    "message": {
      "role": "user",
      "parts": [
        {
          "type": "text",
          "text": "How much is the exchange rate for 1 USD?"
        }
      ]
    }
  }
}
Response - Seq 2:

{
  "jsonrpc": "2.0",
  "id": 10,
  "result": {
    "id": "130",
    "status": {
      "state": "input-required",
      "message": {
        "role": "agent",
        "parts": [
          {
            "type": "text",
            "text": "Which currency do you want to convert to? Also, do you want the latest exchange rate or a specific date?"
          }
        ]
      },
      "timestamp": "2025-04-02T16:57:02.336787"
    },
    "history": []
  }
}
Request - Seq 3:

POST http://localhost:10000
Content-Type: application/json

{
  "jsonrpc": "2.0",
  "id": 10,
  "method": "tasks/send",
  "params": {
    "id": "130",
    "sessionId": "a9bb617f2cd94bd585da0f88ce2ddba2",
    "acceptedOutputModes": [
      "text"
    ],
    "message": {
      "role": "user",
      "parts": [
        {
          "type": "text",
          "text": "CAD"
        }
      ]
    }
  }
}
Response - Seq 4:

{
  "jsonrpc": "2.0",
  "id": 10,
  "result": {
    "id": "130",
    "status": {
      "state": "completed",
      "timestamp": "2025-04-02T16:57:40.033328"
    },
    "artifacts": [
      {
        "parts": [
          {
            "type": "text",
            "text": "The current exchange rate is 1 USD = 1.4328 CAD."
          }
        ],
        "index": 0
      }
    ],
    "history": []
  }
}
Streaming example

Request:

{
  "jsonrpc": "2.0",
  "id": 12,
  "method": "tasks/sendSubscribe",
  "params": {
    "id": "131",
    "sessionId": "cebd704d0ddd4e8aa646aeb123d60614",
    "acceptedOutputModes": [
      "text"
    ],
    "message": {
      "role": "user",
      "parts": [
        {
          "type": "text",
          "text": "How much is 100 USD in GBP?"
        }
      ]
    }
  }
}
Response:

data: {"jsonrpc":"2.0","id":12,"result":{"id":"131","status":{"state":"working","message":{"role":"agent","parts":[{"type":"text","text":"Looking up the exchange rates..."}]},"timestamp":"2025-04-02T16:59:34.578939"},"final":false}}

data: {"jsonrpc":"2.0","id":12,"result":{"id":"131","status":{"state":"working","message":{"role":"agent","parts":[{"type":"text","text":"Processing the exchange rates.."}]},"timestamp":"2025-04-02T16:59:34.737052"},"final":false}}

data: {"jsonrpc":"2.0","id":12,"result":{"id":"131","artifact":{"parts":[{"type":"text","text":"Based on the current exchange rate, 1 USD is equivalent to 0.77252 GBP. Therefore, 100 USD would be approximately 77.252 GBP."}],"index":0,"append":false}}}

data: {"jsonrpc":"2.0","id":12,"result":{"id":"131","status":{"state":"completed","timestamp":"2025-04-02T16:59:35.331844"},"final":true}}
