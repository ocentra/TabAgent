let pageContainers = [];
let navButtons = [];
let mainHeaderTitle = null;

const pageTitles = {
    'page-home': 'Tab Agent', 
    'page-spaces': 'Spaces',
    'page-library': 'Library',
    'page-settings': 'Settings'
};


// Function to handle navigation
async function navigateTo(pageId) { 
    console.log(`Navigating to ${pageId}`);
   
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
        pageId = 'page-home'; 
    }
    
    // Update header title
    if (mainHeaderTitle && pageTitles[pageId]) {
         mainHeaderTitle.textContent = pageTitles[pageId];
    } else if (mainHeaderTitle) {
         mainHeaderTitle.textContent = 'Tab Agent'; 
    }

    // Update active button state
    navButtons.forEach(button => {
        if (button.dataset.page === pageId) {
            button.classList.add('active');
        } else {
            button.classList.remove('active');
        }
    });

    // *** Publish page change event ***
    const { eventBus } = await import('./eventBus.js'); 
    eventBus.publish('navigation:pageChanged', { pageId: pageId });
    console.log(`[Navigation] Published navigation:pageChanged event for ${pageId}`);

    const queryInput = document.getElementById('query-input');
     if (pageId === 'page-home' && queryInput) {
         queryInput.focus(); 
     }
}

// Initialization function for navigation
function initializeNavigation() {
    console.log("Initializing navigation...");

    pageContainers = document.querySelectorAll('.page-container');
    navButtons = document.querySelectorAll('.nav-button');
    mainHeaderTitle = document.querySelector('#header h1');


    navButtons.forEach(button => {
        button.addEventListener('click', () => {
            const pageId = button.dataset.page;
            if (pageId) {
                navigateTo(pageId);
            }
        });
    });

    navigateTo('page-home');
    console.log("Navigation initialized.");
}

export { initializeNavigation, navigateTo }; 