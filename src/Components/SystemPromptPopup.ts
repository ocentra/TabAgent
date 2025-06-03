export function showSystemPromptPopup(currentPrompt: string, onSave: (newPrompt: string) => void) {
  // Create backdrop
  const backdrop = document.createElement('div');
  backdrop.className = 'fixed inset-0 z-50 bg-black bg-opacity-40 flex items-center justify-center';
  backdrop.style.position = 'fixed';
  backdrop.style.top = '0';
  backdrop.style.left = '0';
  backdrop.style.width = '100vw';
  backdrop.style.height = '100vh';
  backdrop.style.display = 'flex';
  backdrop.style.alignItems = 'center';
  backdrop.style.justifyContent = 'center';

  // Create modal (full size, flex column)
  const modal = document.createElement('div');
  modal.className = 'bg-gray-50 dark:bg-gray-800 rounded-lg shadow-lg border border-gray-300 dark:border-gray-700 flex flex-col';
  modal.style.width = '100%';
  modal.style.height = '100%';
  modal.style.maxWidth = '100%';
  modal.style.maxHeight = '100%';
  modal.style.padding = '0';
  modal.style.display = 'flex';
  modal.style.flexDirection = 'column';

  // Header (minimal)
  const header = document.createElement('div');
  header.className = 'flex items-center justify-between px-4 py-2 border-b border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-900';
  header.style.flex = '0 0 auto';
  header.innerHTML = `
    <span class="text-base font-semibold text-gray-800 dark:text-gray-100">Edit System Prompt</span>
    <button class="text-gray-500 hover:text-gray-800 dark:hover:text-gray-200 text-xl font-bold px-2" title="Close">&times;</button>
  `;
  const closeBtn = header.querySelector('button')!;

  // Textarea (main focus, fills space)
  const textarea = document.createElement('textarea');
  textarea.value = currentPrompt;
  textarea.className = 'flex-1 w-full px-4 py-3 bg-transparent text-gray-900 dark:text-gray-100 text-base resize-vertical border-0 outline-none';
  textarea.style.height = '100%';
  textarea.style.minHeight = '0';
  textarea.style.maxHeight = 'none';
  textarea.style.resize = 'none';
  textarea.style.boxSizing = 'border-box';
  textarea.style.background = 'transparent';
  textarea.style.fontFamily = 'inherit';
  textarea.style.fontSize = '1rem';
  textarea.style.margin = '0';
  textarea.style.flex = '1 1 auto';
  textarea.style.overflowY = 'auto';

  // Footer (minimal)
  const footer = document.createElement('div');
  footer.className = 'flex justify-end gap-2 px-4 py-2 border-t border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-900';
  footer.style.flex = '0 0 auto';
  const cancelBtn = document.createElement('button');
  cancelBtn.textContent = 'Cancel';
  cancelBtn.className = 'px-4 py-1 rounded bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600 text-sm';
  const okBtn = document.createElement('button');
  okBtn.textContent = 'OK';
  okBtn.className = 'px-4 py-1 rounded bg-blue-600 text-white hover:bg-blue-700 text-sm';
  footer.appendChild(cancelBtn);
  footer.appendChild(okBtn);

  // Assemble modal
  modal.appendChild(header);
  modal.appendChild(textarea);
  modal.appendChild(footer);
  backdrop.appendChild(modal);
  document.body.appendChild(backdrop);

  // Make modal fill parent (side panel)
  backdrop.style.alignItems = 'stretch';
  backdrop.style.justifyContent = 'stretch';
  modal.style.margin = '0';

  // Focus textarea
  setTimeout(() => textarea.focus(), 50);

  // Close logic
  function close() {
    document.body.removeChild(backdrop);
  }

  closeBtn.onclick = cancelBtn.onclick = () => close();
  backdrop.onclick = (e) => {
    if (e.target === backdrop) close();
  };
  okBtn.onclick = () => {
    onSave(textarea.value);
    close();
  };
  textarea.onkeydown = (e) => {
    if (e.key === 'Escape') close();
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      onSave(textarea.value);
      close();
    }
  };
} 