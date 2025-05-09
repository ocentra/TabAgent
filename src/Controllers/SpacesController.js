// src/Controllers/SpacesController.js

 import { eventBus } from '../eventBus.js'; 

let isInitialized = false;

function handleNavigationChange(event) {
    if (!isInitialized || event?.pageId !== 'page-spaces') {
        return; 
    }
    console.log("[SpacesController] Spaces page activated.");

}

export function initializeSpacesController(/* Pass necessary elements or functions if needed */) {
    if (isInitialized) {
        console.log("[SpacesController] Already initialized.");
        return;
    }
    console.log("[SpacesController] Initializing...");
    


    isInitialized = true;
    console.log("[SpacesController] Initialized successfully.");


    return {}; 
} 