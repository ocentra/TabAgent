// Import initializers for other pages
import { initializeDiscoverPage } from './discover.js';
import { initializeLibraryPage } from './library.js';
import { initializeSettingsPage } from './settings.js';
import { initializeSpacesPage } from './spaces.js';

let pageContainers = [];
let navButtons = [];
let mainHeaderTitle = null;

// Keep track of initialized pages
const initializedPages = new Set(); 

const pageTitles = {
    'page-home': 'Tab Agent', 
    'page-discover': 'Discover',
    'page-spaces': 'Spaces',
    'page-library': 'Library',
    'page-settings': 'Settings'
};

// Mapping page IDs to their initialization functions
const pageInitializers = {
    'page-discover': initializeDiscoverPage,
    'page-library': initializeLibraryPage,
    'page-settings': initializeSettingsPage,
    'page-spaces': initializeSpacesPage
    // No initializer needed for page-home here, it's handled separately
};

// Function to handle navigation
async function navigateTo(pageId) { // Make async to await initializers
    console.log(`Navigating to ${pageId}`);
    // Hide all pages
    pageContainers.forEach(container => {
        container.classList.add('hidden');
        container.classList.remove('active-page');
    });

    // Show the target page
    const targetPage = document.getElementById(pageId);
    if (targetPage) {
        targetPage.classList.remove('hidden');
        targetPage.classList.add('active-page');
    } else {
        console.error(`Navigation error: Page with ID ${pageId} not found. Showing home.`);
        const homePage = document.getElementById('page-home');
        if (homePage) {
             homePage.classList.remove('hidden');
             homePage.classList.add('active-page');
        }
        pageId = 'page-home'; // Correct the pageId if falling back
    }
    
    // Update header title
    if (mainHeaderTitle && pageTitles[pageId]) {
         mainHeaderTitle.textContent = pageTitles[pageId];
    } else if (mainHeaderTitle) {
         mainHeaderTitle.textContent = 'Tab Agent'; // Default title
    }

    // Update active button state
    navButtons.forEach(button => {
        if (button.dataset.page === pageId) {
            button.classList.add('active');
        } else {
            button.classList.remove('active');
        }
    });

    // Initialize page if not already done
    if (pageInitializers[pageId] && !initializedPages.has(pageId)) {
        try {
            console.log(`Initializing ${pageId}...`);
            await pageInitializers[pageId](); // Await in case initializer is async (like Library)
            initializedPages.add(pageId); // Mark as initialized
             console.log(`${pageId} initialized.`);
        } catch (error) {
             console.error(`Error initializing ${pageId}:`, error);
             // Optionally show error to user?
        }
    } else if (pageId === 'page-library' && initializedPages.has(pageId)) {
        // Special case: Re-run library initialization each time it's visited
        // to refresh the starred list, in case items were starred/unstarred elsewhere.
         try {
            console.log(`Re-initializing ${pageId} to refresh content...`);
            await initializeLibraryPage(); 
        } catch (error) {
             console.error(`Error re-initializing ${pageId}:`, error);
        }
    }

    const queryInput = document.getElementById('query-input');
     if (pageId === 'page-home' && queryInput) {
         queryInput.focus(); // Focus input when returning home
     }
}

// Initialization function for navigation
function initializeNavigation() {
    console.log("Initializing navigation...");
    // Select elements once
    pageContainers = document.querySelectorAll('.page-container');
    navButtons = document.querySelectorAll('.nav-button');
    mainHeaderTitle = document.querySelector('#header h1');

    // Add click listeners to nav buttons
    navButtons.forEach(button => {
        button.addEventListener('click', () => {
            const pageId = button.dataset.page;
            if (pageId) {
                navigateTo(pageId);
            }
        });
    });

    // Set initial page (Home page initializes separately in sidepanel.js)
    navigateTo('page-home');
    console.log("Navigation initialized.");
}

export { initializeNavigation, navigateTo }; 