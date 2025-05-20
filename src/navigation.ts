// Add EXTENSION_CONTEXT to the Window interface


import { UIEventNames, Contexts } from './events/eventNames';
window.EXTENSION_CONTEXT = Contexts.OTHERS;

let pageContainers: NodeListOf<HTMLElement> = document.querySelectorAll('.page-container');
let navButtons: NodeListOf<HTMLElement> = document.querySelectorAll('.nav-button');
let mainHeaderTitle: HTMLElement | null = document.querySelector('#header h1');
const CONTEXT_PREFIX = '[Navigation]';
const pageTitles: { [key: string]: string } = {
    'page-home': 'Tab Agent', 
    'page-spaces': 'Spaces',
    'page-library': 'Library',
    'page-settings': 'Settings'
};

async function navigateTo(pageId: string) { 
    console.log(CONTEXT_PREFIX + `Navigating to ${pageId}`);
   
    pageContainers.forEach(container => {
        container.classList.add('hidden');
        container.classList.remove('active-page');
    });

    const targetPage = document.getElementById(pageId);
    if (targetPage) {
        targetPage.classList.remove('hidden');
        targetPage.classList.add('active-page');
    } else {
        console.error(CONTEXT_PREFIX + `Navigation error: Page with ID ${pageId} not found. Showing home.`);
        const homePage = document.getElementById('page-home');
        if (homePage) {
             homePage.classList.remove('hidden');
             homePage.classList.add('active-page');
        }
        pageId = 'page-home'; 
    }
    
    if (mainHeaderTitle && pageTitles[pageId]) {
         mainHeaderTitle.textContent = pageTitles[pageId];
    } else if (mainHeaderTitle) {
         mainHeaderTitle.textContent = 'Tab Agent'; 
    }

    navButtons.forEach(button => {
        if (button.dataset.page === pageId) {
            button.classList.add('active');
        } else {
            button.classList.remove('active');
        }
    });

    document.dispatchEvent(new CustomEvent(UIEventNames.NAVIGATION_PAGE_CHANGED, { detail: { pageId } }));
    console.log(CONTEXT_PREFIX + `Published navigation:pageChanged event for ${pageId}`);

    const queryInput = document.getElementById('query-input');
     if (pageId === 'page-home' && queryInput) {
         (queryInput as HTMLElement).focus(); 
     }
}

function initializeNavigation() {
    console.log(CONTEXT_PREFIX + "Initializing navigation...");

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
    console.log(CONTEXT_PREFIX + "Navigation initialized.");
}

export { initializeNavigation, navigateTo }; 