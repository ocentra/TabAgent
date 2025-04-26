# Tab Agent: Project Plan 

## Project Overview
Tab Agent is a Chrome browser extension that leverages the phi4 3.8 billion parameter model (in ONNX format, quantized) to perform advanced natural language processing tasks entirely client-side. The extension aims to:
- Summarize content from web pages, PDFs, and Google Drive files.
- Search and fetch articles from links or open tabs.
- Implement Retrieval-Augmented Generation (RAG) with RxDB as the browser-based vector database for accurate, reference-linked answers.
- Use an agentic workflow with LangChain.js to process queries intelligently, combining scraping, retrieval, and generation.
- Provide a modern, user-friendly UI with a resizable, detachable side panel featuring a chat interface.

All computation must occur in the browser (no external servers).  will develop this project by referencing files in the `example_sources` folder and following the steps below. The project uses open-source libraries and tools, ensuring offline functionality and data privacy.

## Project Goals
1. **Model Inference**:
   - Load and run the phi4 ONNX model in the browser for tasks like summarization and question-answering.
   - Optimize performance using WebAssembly or WebGPU.

2. **Content Scraping and Fetching**:
   - Scrape text from open tabs or URLs.
   - Extract text from PDFs using pdf.js.
   - Fetch files from Google Drive via API (with OAuth).

3. **Summarization**:
   - Generate concise summaries of web pages, articles, or PDFs using the phi4 model.

4. **RAG-Based Answering**:
   - Store document embeddings in RxDB.
   - Retrieve relevant documents for queries and generate answers with reference links.

5. **Agentic Workflow**:
   - Implement an intelligent agent using LangChain.js to orchestrate scraping, retrieval, and generation.

6. **User Interface**:
   - Build a resizable, detachable side panel with a modern chat interface, including chat history, settings, and input options.

7. **Performance and Privacy**:
   - Ensure offline functionality and data privacy (all processing client-side).
   - Optimize for low latency and memory usage in the browser.

## Development Approach
- **Tool**: Use  for coding, leveraging its ability to reference files and generate code.
- **File References**: Collect key files from GitHub repositories (listed below) and place them in an `example_sources` folder for  to analyze.
- **Modularity**: Structure the extension with separate modules for model inference, scraping, vector storage, RAG, agent logic, and UI.
- **Testing**: Test each component incrementally to ensure functionality.

## Folder Structure
The project is organized as follows:
```
/TabAgent
├── project_plan.md          # This file
├── example_sources/         # Reference files for 
│   ├── models.js           # From transformers.js
│   ├── model.js            # From transformers.js-chrome
│   ├── web_llm.js          # From web-llm
│   ├── summarizer.js       # From AI-PC-Samples
│   ├── rag.js              # From site-rag
│   ├── scraper.js          # From browser-use
│   ├── pdf.js              # From pdf.js
├── src/                    # Project source code
│   ├── background.js       # Background script for model and agent
│   ├── content.js         # Content script for scraping
│   ├── sidepanel.html     # Side panel UI
│   ├── sidepanel.js       # Side panel logic
│   ├── sidepanel.css      # Side panel styles
│   ├── manifest.json      # Extension manifest
└── README.md              # Project documentation
```

## Actionable Tasks for 
 will implement Tab Agent by following these tasks. Each task specifies the goal, steps, files to reference from `example_sources`, and how the task contributes to the project.

### Task 1: Set Up Chrome Extension Structure
**Goal**: Create the basic Chrome extension framework.
**Steps**:
1. Create `manifest.json` with the following permissions: `activeTab`, `tabs`, `storage`, `sidePanel`.
2. Specify `background.js` as the background script and `content.js` as the content script.
3. Enable the side panel with `"sidePanel": {"default_path": "sidepanel.html"}`.
4. Reference `example_sources/summarizer.js` (from AI-PC-Samples) to see its `manifest.json` for permissions and structure.
**How It Fits**: Establishes the extension's foundation for all functionalities.

### Task 1.5: Set Up Build Process
**Goal**: Configure a build system (e.g., Vite, Webpack, esbuild) to bundle JavaScript modules, handle dependencies from `node_modules`, process CSS (if applicable), and output a production-ready extension directory.
**Steps**:
1. **Choose and Install Build Tool:** Select a suitable JavaScript bundler/build tool (e.g., Vite is often good for extensions, Webpack, Rollup, or esbuild are alternatives). Install it as a development dependency (e.g., `npm install -D vite`).
2. **Configure Build Tool:** Create the necessary configuration file (e.g., `vite.config.js`, `webpack.config.js`). Configure it to:
   - Define entry points for all extension scripts (`background.js`, `sidepanel.js`, etc.). **Note:** Scripts like `content.js` that are *not* bundled entry points but are loaded directly via the manifest might require different handling (see static asset copying below).
   - Correctly resolve and bundle dependencies installed via `npm` (like `@mozilla/readability`) *if they are imported by your bundled entry points*.
   - Handle CSS files (if using Tailwind via PostCSS or other CSS preprocessors).
   - **Copy Static Assets:** Configure the tool to copy all necessary static assets to the output directory (e.g., `/dist`). This **MUST** include:
     - `manifest.json`
     - HTML files (`sidepanel.html`)
     - Icons
     - **Crucially: Any JavaScript files listed directly in `manifest.json` under `content_scripts.js` or `background.service_worker` that are *not* the primary entry points being bundled.** For example, if you list `Readability.js` or a utility script like `webScraper.js` in the manifest, they need to be explicitly copied to the output directory (e.g., using `vite-plugin-static-copy` in Vite). Failure to copy these will result in "Could not load script" errors when the extension tries to load them.
   - Define the output directory (e.g., `/dist`).
3. **Update package.json Scripts:** Add or modify scripts in `package.json` for building the extension (e.g., `"build": "vite build"`, `"dev": "vite build --watch"`).
4. **Adjust Manifest:** Ensure `manifest.json` in the *output* directory correctly points to the bundled JS/CSS files *and* any copied static JS files. Check that the paths are relative to the output directory root. Some build tools might offer plugins to manage the manifest automatically.
**How It Fits**: Provides the essential mechanism to package the modular source code and `npm` dependencies into a loadable Chrome extension format, enabling the use of libraries like Readability.js. **Remember to update the build config's static copy list whenever adding new JS files directly to the manifest.**

### Task 2: Load and Run Phi4 Model
**Goal**: Load the phi4 ONNX model in the browser for inference.
**Steps**:
1. In `background.js`, use transformers.js to load the phi4 ONNX model with WebAssembly.
2. Implement model inference for text generation tasks (e.g., summarization, question-answering).
3. Optimize performance using techniques from `example_sources/web_llm.js` (from web-llm).
4. Adapt Chrome-specific model handling from `example_sources/model.js` (from transformers.js-chrome).
5. Reference `example_sources/models.js` (from transformers.js) for model loading logic.
**How It Fits**: Enables core NLP tasks using the phi4 model.

### Task 3: Implement Multi-Stage Web Scraping and Content Fetching
**Goal**: Reliably scrape readable content from the current tab and specific URLs (including SPAs), using a staged, progressively more robust approach for non-active tabs, minimizing user disruption where possible. Implement placeholders for future Sitemap, PDF, and Google Drive scraping.

**Scraping Strategy:**
*   **Active Tab:** If the requested URL matches the active tab, scraping is handled directly by the content script (`content.js`) in that tab. (Implemented)
*   **Non-Active Tab URLs:** When a URL is provided that is *not* the active tab, the background script attempts the following methods in order, prioritizing less disruptive methods:
    1.  **Stage 1: Offscreen Document (Direct Fetch):** Fetches initial HTML via `fetch`, sends it to an Offscreen Document, and uses `DOMParser` + `Readability`. *Works well for static/SSR pages.* (Implemented in `scrapeUrlWithOffscreen`, may need error handling refinement).
    2.  **Stage 2: Offscreen Document + iframe + Dynamic Script:** Loads URL in an iframe within the Offscreen Document, attempts to strip `X-Frame-Options` (via `declarativeNetRequest`), and dynamically injects a content script (via `scripting.registerContentScripts`) to run `Readability` within the iframe. *Theoretically handles SPAs without a visible tab.* (**High Complexity, Requires `declarativeNetRequest` + `scripting` permissions, Potentially Fragile - TO BE IMPLEMENTED**).
    3.  **Stage 3: Temporary Background Tab + `executeScript`:** Opens the URL in a background tab (`active: false`), waits for load (JS executes), injects script using `scripting.executeScript` to run `Readability`, gets the result, and closes the tab. *Handles SPAs reliably but involves a briefly visible background tab.* (**Medium-High Complexity, Requires `scripting` permission - TO BE IMPLEMENTED**).
    4.  **Stage 4: Temporary Background Tab + Content Script (Last Resort):** If all else fails, uses the currently implemented method: opens the URL in a background tab (`active: false`), waits for load, sends a message (`SCRAPE_PAGE`) to the standard `content.js` in that tab, receives the result, and closes the tab. *Reliable fallback but uses the standard content script and visible tab.* (Implemented in `scrapeUrlWithTempTab_ContentScript`).

**Implementation Steps:**

1.  **Active Tab Scraping (Done):** Logic exists in `home.js` and `content.js`.

2.  **Stage 1: Offscreen Document (Direct Fetch - Implemented):**
    *   `background.js`: `scrapeUrlWithOffscreen` function exists.
    *   *Needs review for robust error handling (e.g., the `undefined` response issue).*

3.  **Stage 2: Offscreen + iframe + Dynamic Script (TODO):**
    *   Add `declarativeNetRequest` and `scripting` permissions to `manifest.json`.
    *   Configure `declarativeNetRequest` rules (e.g., in `background.js` or a separate rules file) to attempt removing `X-Frame-Options` for the target domains.
    *   In `background.js`: Create a function `scrapeUrlWithOffscreenIframe(url)`.
    *   Communicate with `offscreen.js` to create an iframe pointing to `url`.
    *   Use `chrome.scripting.registerContentScripts` to dynamically register a short-lived content script targeting the iframe's URL. This script should run `Readability` and send a message back to the background script with the result.
    *   Implement robust message handling and timeouts between background and the dynamic script.
    *   Clean up: Unregister the script, message `offscreen.js` to remove the iframe.
    *   Integrate this function into the `scrapeUrlMultiStage` orchestrator as the second attempt.

4.  **Stage 3: Temporary Background Tab + `executeScript` (TODO):**
    *   Ensure `scripting` permission is in `manifest.json`.
    *   In `background.js`: Create a function `scrapeUrlWithTempTabExecuteScript(url)`.
    *   Use `chrome.tabs.create({ url: url, active: false })`.
    *   Use `chrome.tabs.onUpdated` listener (carefully filtered for the specific tab ID and status 'complete') or potentially `chrome.webNavigation.onCompleted` to know when the tab is ready. Handle timeouts.
    *   Inject script using `chrome.scripting.executeScript`. The `target` will be the new tab ID. The `func` needs to instantiate `Readability` (potentially by making the Readability library code available to the function's execution context, or simplifying the function if `Readability` is already injected by the main content script *if* it matches the URL - needs careful consideration) and `return new Readability(document.cloneNode(true)).parse();`. Using `cloneNode` is safer within `executeScript`.
    *   Handle the results array returned by `executeScript`.
    *   Use `chrome.tabs.remove()` to close the temporary tab.
    *   Integrate this function into the `scrapeUrlMultiStage` orchestrator as the third attempt.

5.  **Stage 4: Temporary Background Tab + Content Script (Implemented - Last Resort):**
    *   `background.js`: `scrapeUrlWithTempTab_ContentScript` function exists.
    *   Ensure this is called *only* if Stages 1, 2, and 3 fail within `scrapeUrlMultiStage`.

6.  **Consolidated Handler Logic (Needs Update):**
    *   `background.js`: Update the `scrapeUrlMultiStage` function to orchestrate the full four-stage process with appropriate try-catch blocks or sequential checks.
        *   Try Stage 1. If success, return.
        *   Else, Try Stage 2. If success, return.
        *   Else, Try Stage 3. If success, return.
        *   Else, Try Stage 4. Return result or final error.
    *   Ensure the `loadingId` is passed correctly through all potential stages.

7.  **Sitemap Discovery and Scraping (Future):** Plan remains the same.

8.  **PDF Text Extraction (Future):** Plan remains the same.

9.  **Google Drive Integration (Future):** Plan remains the same.

**Required Permissions (Full Implementation):** `offscreen`, `tabs`, `activeTab`, `storage`, `scripting`, `declarativeNetRequest`, `host_permissions` (for content/dynamic scripts).

**How It Fits**: Provides a comprehensive strategy to acquire web content, prioritizing methods that avoid disrupting the user (Offscreen) before falling back to methods involving temporary tabs (`executeScript` then standard content script messaging as a last resort). This aims for better UX while maintaining robustness for SPAs.

### Task 4: Build Summarization Module
**Goal**: Summarize web pages, articles, and PDFs.
**Steps**:
1. In `background.js`, use the phi4 model (via transformers.js) to generate summaries of scraped content.
2. Pass scraped content from `content.js` to `background.js` via message passing.
3. Reference `example_sources/summarizer.js` (from AI-PC-Samples) for summarization logic and adapt it for phi4.
**How It Fits**: Enables concise summaries for users.

### Task 5: Set Up RxDB for Vector Storage and WASM for Search
**Goal**: Store document embeddings in RxDB and implement efficient vector search using a WASM library.
**Steps**:
1. In `background.js`, initialize RxDB with IndexedDB as the storage backend.
2. Use transformers.js (or similar) to generate embeddings for scraped documents (e.g., using Xenova/all-MiniLM-L6-v2).
3. Store embeddings *and* original text chunks in an RxDB collection with a schema including fields for `id`, `text_chunk`, `embedding_vector`, and any relevant metadata (e.g., `source_url`, `timestamp`).
4. **Select and Integrate a WASM Vector Search Library:** Choose a suitable library like `hnswlib-wasm` or `voy`. Integrate it into `background.js`.
5. **Build and Maintain In-Memory Index:** On extension startup or when new documents are added/updated:
   - Load the `id` and `embedding_vector` pairs from RxDB.
   - Build (or update) an in-memory index using the chosen WASM library's API. Keep this index resident in `background.js`.
6. **Implement Vector Search Function:** Create a function that:
   - Takes a query embedding as input.
   - Uses the WASM library's API (e.g., `searchKnn`) to perform an Approximate Nearest Neighbor (ANN) search against the in-memory index.
   - Returns the `ids` of the most relevant text chunks.
7. **Reference Documentation:** Consult the RxDB vector storage guide for schema/storage and the documentation for the chosen WASM library (e.g., `hnswlib-wasm`, `voy`) for indexing and search implementation.
**How It Fits**: RxDB provides persistent storage, while the WASM library enables fast, local vector retrieval for RAG.

### Task 6: Implement RAG-Based Answering
**Goal**: Retrieve relevant document chunks and generate answers with reference links.
**Steps**:
1. **Retrieve Relevant Chunks:**
   - Generate an embedding for the user's query.
   - Use the vector search function (from Task 5, leveraging the WASM library) to get the `ids` of the most relevant text chunks.
   - Fetch the corresponding full `text_chunk` data (and metadata like `source_url`) from RxDB using these `ids`.
2. **Generate Contextual Answer:** Use the phi4 model to generate an answer, providing the retrieved text chunks as context in the prompt.
3. **Include Reference Links:** Extract source information (e.g., `source_url`) from the metadata of the retrieved chunks and include them as reference links in the response presented to the user.
4. Reference `example_sources/rag.js` (from site-rag) for the overall RAG pipeline logic (prompting with context, generation), adapting the retrieval part to use the new two-step process (WASM search -> RxDB fetch).
**How It Fits**: Provides accurate, reference-linked answers by combining efficient local retrieval with LLM generation.

### Task 7: Implement Agentic Workflow with LangChain.js
**Goal**: Create an intelligent agent to process queries.
**Steps**:
1. In `background.js`, use LangChain.js to create an agent that orchestrates:
   - Scraping content (from `content.js`).
   - **Retrieving relevant document chunks (using the WASM vector search for IDs, then fetching content from RxDB).**
   - Generating answers (via phi4 model using retrieved context).
2. Define a "retrieval tool" for the LangChain agent that encapsulates the process described in Task 6, step 1.
3. Pass user queries from the side panel to the agent and return responses.
4. Reference `example_sources/rag.js` (from site-rag) for integrating RAG concepts into the agent.
5. Use LangChain.js documentation for agent setup and custom tool creation.
**How It Fits**: Orchestrates all components, including the refined retrieval mechanism, for intelligent query handling.

### Task 8: Develop Modern Chat UI in Side Panel
**Goal**: Build a resizable, detachable side panel with a modern chat interface.
**Steps**:
1. Create `sidepanel.html` with the following structure:
   - **Header**: Include a title ("Tab Agent"), settings icon, new chat button, and an "X" to close/minimize the panel.
   - **Chat History Sidebar**: On the left, display a list of previous chats (stored in `chrome.storage.local`) with a scroll bar.
   - **Main Chat Body**: In the center, show the current chat's message history with a scroll bar.
   - **Input Area**: At the bottom, include:
     - A dropdown to select the AI model (default: phi4).
     - A text box for user queries.
     - Buttons to upload PDFs, images, or Google Drive links.
     - A send button.
   - **Resize/Detach**: Add a button to detach the side panel into a popup window and reattach it.
2. Style with `sidepanel.css` using Tailwind CSS (via CDN: `https://cdn.tailwindcss.com`):
   - Use a dark theme with rounded corners and modern fonts.
   - Make the side panel resizable with CSS `resize` property.
   - Style chat messages with user messages on the right (blue) and AI responses on the left (gray).
3. In `sidepanel.js`:
   - Load chat history from `chrome.storage.local` and display it.
   - Handle new chat creation, saving chats to storage.
   - Send user queries to `background.js` and display responses in the chat body.
   - Implement detach/reattach functionality using `chrome.windows.create` and `chrome.sidePanel`.
4. Reference Chrome Side Panel API for implementation.
**How It Fits**: Provides a user-friendly interface for interacting with Tab Agent.

### Task 9: Optimize Performance and Ensure Privacy
**Goal**: Ensure fast, offline, and secure operation.
**Steps**:
1. In `background.js`, optimize model inference with WebAssembly (from transformers.js).
2. **Optimize Vector Search:** Tune parameters for the WASM vector search library's index (e.g., HNSW parameters in `hnswlib-wasm`) for a good balance between speed and accuracy. Monitor indexing time and search latency.
3. Use RxDB's IndexedDB backend efficiently. Consider WebWorkers for embedding generation or WASM indexing if they block the main background thread.
4. Ensure all data stays client-side (no network calls except optional Google Drive API).
5. Reference `example_sources/web_llm.js` (from web-llm) for general optimization techniques.
6. Use RxDB's guides and the chosen WASM library's documentation for performance tuning.
**How It Fits**: Guarantees usability and privacy through efficient local processing and search.

## File References in `example_sources`
 will reference the following files in the `example_sources` folder:
- `models.js` (from transformers.js): Model loading logic for phi4.
- `model.js` (from transformers.js-chrome): Chrome-specific model handling.
- `web_llm.js` (from web-llm): Performance optimizations for model inference.
- `summarizer.js` (from AI-PC-Samples): Summarization logic and extension structure.
- `rag.js` (from site-rag): RAG pipeline for retrieval and generation.
- `scraper.js` (from browser-use): Web scraping implementation.
- `pdf.js` (from pdf.js): PDF text extraction.

## File Collection Instructions
Collect the following files from the specified repositories and place them in the `example_sources` folder. These will guide ’s code generation:
1. **From [transformers.js](https://github.com/huggingface/transformers.js)**:
   - File: `src/models.js`
   - Purpose: Model loading and inference logic for phi4.
   - Location: Likely in `src/` or `lib/`.
2. **From [transformers.js-chrome](https://github.com/tantara/transformers.js-chrome)**:
   - File: `src/model.js`
   - Purpose: Chrome-specific model handling.
   - Location: Check `src/` or root.
3. **From [web-llm](https://github.com/mlc-ai/web-llm)**:
   - File: `src/web_llm.js`
   - Purpose: Performance optimizations for model inference.
   - Location: Likely in `src/` or `lib/`.
4. **From [AI-PC-Samples](https://github.com/intel/AI-PC-Samples/tree/main/Text-Summarizer-Browser-Plugin)**:
   - File: `src/summarizer.js`
   - Purpose: Summarization logic and extension structure.
   - Location: In `Text-Summarizer-Browser-Plugin/src/`.
5. **From [site-rag](https://github.com/bracesproul/site-rag)**:
   - File: `src/rag.js`
   - Purpose: RAG pipeline for retrieval and generation.
   - Location: Check `src/` or root.
6. **From [browser-use](https://github.com/browser-use/browser-use)**:
   - File: `src/scraper.js`
   - Purpose: Web scraping implementation.
   - Location: Likely in `src/` or `lib/`.
7. **From [pdf.js](https://github.com/mozilla/pdf.js)**:
   - File: `src/pdf.js`
   - Purpose: PDF text extraction.
   - Location: In `src/` or `build/`.

**Note**: If exact file names differ, search for similar files (e.g., `index.js` for RAG in `site-rag`) or check `examples/` directories. Download the latest versions from the repositories.

## Additional Resources for 
Use these resources for additional guidance:
- **Chrome Extensions**:
  - [Chrome Extensions Get Started](https://developer.chrome.com/docs/extensions/get-started)
  - [Chrome Side Panel API](https://developer.chrome.com/docs/extensions/reference/sidePanel)
  - [Chrome Storage API](https://developer.chrome.com/docs/extensions/reference/storage)
  - [Chrome Extensions AI](https://developer.chrome.com/docs/extensions/ai)
- **Vector Databases / Storage**:
  - [RxDB Vector Database Guide](https://rxdb.info/articles/javascript-vector-database.html) (Focus on storage aspects)
- **Local Vector Search (WASM)**:
  - [hnswlib-wasm](https://github.com/nmslib/hnswlib-wasm) (Example WASM library for HNSW search)
  - [Voy](https://github.com/tantaraio/voy) (Another WASM vector search library)
  - *(Search for others as needed)*
- **Model Inference / Embeddings**:
  - [transformers.js](https://github.com/huggingface/transformers.js)
  - [transformers.js-chrome](https://github.com/tantara/transformers.js-chrome)
  - [web-llm](https://github.com/mlc-ai/web-llm)
- **RAG and Agents**:
  - [site-rag](https://github.com/bracesproul/site-rag)
  - [LangChain.js](https://js.langchain.com/)
- **Scraping and Content**:
  - [browser-use](https://github.com/browser-use/browser-use)
  - [pdf.js](https://github.com/mozilla/pdf.js)
  - [Google Drive API](https://developers.google.com/drive/api/v3/about-sdk)
  - [DOMParser](https://developer.mozilla.org/en-US/docs/Web/API/DOMParser)
- **Summarization**:
  - [AI-PC-Samples](https://github.com/intel/AI-PC-Samples/tree/main/Text-Summarizer-Browser-Plugin)
- **UI**:
  - [Tailwind CSS](https://tailwindcss.com/)

## Performance Benchmarks (For Reference) we might add later
The following table from the RxDB vector database guide provides benchmarks for embedding models, which  can use to optimize performance:
| Model Name                          | Time (ms) | Vector Size | Model Size (MB) |
|-------------------------------------|-----------|-------------|-----------------|
| Xenova/all-MiniLM-L6-v2             | 173       | 384         | 23              |
| Supabase/gte-small                  | 341       | 384         | 34              |
| Xenova/paraphrase-multilingual-mpnet-base-v2 | 1000 | 768     | 279             |
| jinaai/jina-embeddings-v2-base-de   | 1291      | 768         | 162             |
| jinaai/jina-embeddings-v2-base-zh   | 1437      | 768         | 162             |
| jinaai/jina-embeddings-v2-base-code | 1769      | 768         | 162             |
| mixedbread-ai/mxbai-embed-large-v1  | 3359      | 1024        | 337             |
| WhereIsAI/UAE-Large-V1              | 3499      | 1024        | 337             |
| Xenova/multilingual-e5-large        | 4215      | 1024        | 562             |

**Recommendation**: Use Xenova/all-MiniLM-L6-v2 for its speed (173ms per embedding) and small size (23MB).

## Final Instructions  
1. Start by setting up the extension structure (Task 1).
2. Implement each task sequentially, referencing the specified files and resources.
3. Test each component (e.g., model loading, scraping, UI) before proceeding.
4. Ensure all functionality works offline except for Google Drive API calls.
5. Use Tailwind CSS for a modern, dark-themed UI as described in Task 8.
6. Save all state (e.g., chat history) in `chrome.storage.local`.
7. Iterate based on performance, using the benchmarks above for guidance.

