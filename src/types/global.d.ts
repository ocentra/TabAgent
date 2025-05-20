/* eslint-disable @typescript-eslint/no-unused-vars */
declare global {
    interface Window {
        originalUITooltipController?: { showTooltip: (el: HTMLElement, msg: string) => void };
        marked?: any;
        hljs?: any;
        EXTENSION_CONTEXT?: any;
        mapper?: {
            crawlSingle: (_doc: Document, _url: string) => any;
            mapSite: (_startUrl: string) => Promise<any>;
            version: string;
        };
        TabAgentPageExtractor?: any;
        sendChatMessage?: any;
        interruptGeneration?: any;
        resetWorker?: any;
        loadModel?: any;
        currentModelWorkerState?: any;
        currentModelIdForWorker?: any;
        modelWorker?: any;
    }
}

export {}; 