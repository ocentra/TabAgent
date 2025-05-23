import { UIEventNames } from "../events/eventNames";
import { downloadModelAssets, handleUserFileRequestFromPopup, registerPopupCallbacks } from "../modelAssetDownloader";

let modalElement: HTMLElement | null = null;
let fileListElement: HTMLElement | null = null;
let modelTitleElement: HTMLElement | null = null;

let currentOnnxFiles: any[] = [];
let currentAllFiles: any[] = [];
let currentFileStates: { [fileName: string]: { status: string, progress: number } } = {};
let currentNonOnnxProgress: number = 0;
let currentNonOnnxStatus: string = 'unknown';

let activeOnnxDownloadName: string | null = null;

function formatFileSize(bytes: number): string {
  if (!bytes || bytes === 0) return 'N/A';
  const mb = bytes / 1024 / 1024;
  if (mb < 1) return (bytes / 1024).toFixed(1) + ' KB';
  return mb.toFixed(1) + ' MB';
}

function renderFileList() {
  if (!fileListElement || !modalElement) return;
  fileListElement.innerHTML = '';

  const nonOnnxFilesToDisplay = currentAllFiles.filter(f => !f.fileName.endsWith('.onnx'));

  if (nonOnnxFilesToDisplay.length) {
    const nonOnnxRow = document.createElement('div');
    nonOnnxRow.id = 'non-onnx-row';
    nonOnnxRow.className = 'mb-3 px-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow flex flex-col gap-1';
    
    const infoDiv = document.createElement('div');
    infoDiv.className = 'flex justify-between items-center text-xs';
    let statusText = currentNonOnnxStatus.charAt(0).toUpperCase() + currentNonOnnxStatus.slice(1);
    if (currentNonOnnxStatus === 'downloaded') statusText = 'Ready';
    if (currentNonOnnxStatus === 'present') statusText = 'Ready';

    infoDiv.innerHTML = `<span class="font-semibold text-xs text-gray-700 dark:text-gray-200">Supporting Files</span> <span class="text-xs px-2 py-1 rounded ${currentNonOnnxStatus === 'downloaded' || currentNonOnnxStatus === 'present' ? 'bg-green-100 text-green-700 dark:bg-green-700 dark:text-green-100' : 'bg-blue-100 text-blue-700 dark:bg-blue-700 dark:text-blue-100'}">${statusText}</span>`;
    nonOnnxRow.appendChild(infoDiv);

    if (currentNonOnnxStatus === 'downloading' || currentNonOnnxStatus === 'queued') {
      const progressBarContainer = document.createElement('div');
      progressBarContainer.className = 'w-full h-1 bg-gray-200 dark:bg-gray-700 rounded overflow-hidden mt-1';
      const progressBar = document.createElement('div');
      progressBar.className = `h-1 transition-all duration-300 rounded ${currentNonOnnxStatus === 'downloading' ? 'bg-blue-500' : 'bg-gray-400'}`;
      progressBar.id = 'progress-non-onnx';
      progressBar.style.width = `${currentNonOnnxProgress}%`;
      progressBarContainer.appendChild(progressBar);
      nonOnnxRow.appendChild(progressBarContainer);
    }
    fileListElement.appendChild(nonOnnxRow);
  }

  currentOnnxFiles.forEach(file => {
    const row = document.createElement('div');
    row.className = 'mb-2 px-3 py-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow flex flex-col gap-1';
    row.id = `file-row-${file.fileName.replace(/[/.]/g, '-')}`;
    
    const fileState = currentFileStates[file.fileName] || { status: 'unknown', progress: 0 };
    
    const infoDiv = document.createElement('div');
    infoDiv.className = 'flex justify-between items-center text-xs';
    infoDiv.innerHTML = `<span class="font-semibold text-xs text-gray-800 dark:text-gray-100">${file.fileName.split('/').pop()}</span> <span class="text-xs text-gray-500 dark:text-gray-400">${formatFileSize(file.fileSize)}</span>`;
    
    const loadBtn = document.createElement('button');
    loadBtn.className = 'onnx-load-btn px-2 py-0.5 text-xs font-semibold rounded shadow focus:outline-none focus:ring-1 focus:ring-blue-500 dark:focus:ring-offset-gray-800';

    let disableButton = false;
    if (activeOnnxDownloadName && activeOnnxDownloadName !== file.fileName) disableButton = true;
    if (currentNonOnnxStatus === 'downloading' || currentNonOnnxStatus === 'queued') disableButton = true;

    if (fileState.status === 'present' || fileState.status === 'downloaded') {
        loadBtn.textContent = 'Loaded';
        loadBtn.disabled = true;
        loadBtn.className += ' bg-green-500 text-white cursor-not-allowed';
    } else if (fileState.status === 'downloading') {
        loadBtn.textContent = `Loading... ${fileState.progress}%`;
        loadBtn.disabled = true;
        loadBtn.className += ' bg-yellow-500 text-white cursor-wait';
        activeOnnxDownloadName = file.fileName; 
    } else if (fileState.status === 'queued') {
        loadBtn.textContent = 'Queued';
        loadBtn.disabled = true;
        loadBtn.className += ' bg-gray-400 text-white cursor-wait dark:bg-gray-600';
    } else if (fileState.status === 'failed') {
        loadBtn.textContent = 'Failed - Retry';
        loadBtn.disabled = disableButton;
        loadBtn.className += ` ${disableButton ? 'bg-gray-300 text-gray-500 cursor-not-allowed dark:bg-gray-700 dark:text-gray-400' : 'bg-red-500 hover:bg-red-600 text-white focus:ring-red-400'}`;
        loadBtn.onclick = () => handleUserFileRequestFromPopup(file);
    } else {
        loadBtn.textContent = 'Load Model';
        loadBtn.disabled = disableButton;
        loadBtn.className += ` ${disableButton ? 'bg-gray-300 text-gray-500 cursor-not-allowed dark:bg-gray-700 dark:text-gray-400' : 'bg-blue-600 hover:bg-blue-700 text-white focus:ring-blue-500'}`;
        loadBtn.onclick = () => handleUserFileRequestFromPopup(file);
    }
    infoDiv.appendChild(loadBtn);
    row.appendChild(infoDiv);

    if (fileState.status === 'downloading' || fileState.status === 'queued') {
      const progressBarContainer = document.createElement('div');
      progressBarContainer.className = 'w-full h-1 bg-gray-200 dark:bg-gray-700 rounded overflow-hidden mt-1';
      const progressBar = document.createElement('div');
      let barColor = 'bg-blue-500';
      if (fileState.status === 'downloading') barColor = 'bg-yellow-500';
      else if (fileState.status === 'queued') barColor = 'bg-gray-400';
      progressBar.className = `h-1 ${barColor} transition-all duration-300 rounded`;
      progressBar.id = `progress-${file.fileName.replace(/[/.]/g, '-')}`;
      progressBar.style.width = `${fileState.progress}%`;
      progressBarContainer.appendChild(progressBar);
      row.appendChild(progressBarContainer);
    }
    if (fileListElement) fileListElement.appendChild(row);
  });
}

function updateFileState(fileName: string, status: string, progress: number) {
    if (!currentFileStates[fileName]) currentFileStates[fileName] = { status: 'unknown', progress: 0 };
    currentFileStates[fileName].status = status;
    currentFileStates[fileName].progress = progress;

    if (status === 'downloading' && currentOnnxFiles.some(f => f.fileName === fileName)) {
        activeOnnxDownloadName = fileName;
    } else if ((status === 'downloaded' || status === 'failed' || status === 'present') && activeOnnxDownloadName === fileName) {
        activeOnnxDownloadName = null;
    }
    renderFileList();
}

function updateNonOnnxState(status: string, progress: number) {
    currentNonOnnxStatus = status;
    currentNonOnnxProgress = progress;
    if (status === 'downloaded' || status === 'present' || status === 'failed'){
       // Potentially re-enable ONNX buttons if non-ONNX is done or failed
       if (activeOnnxDownloadName === null) renderFileList();
    } else {
       renderFileList();
    }
}


function handleDownloaderUpdate(update: any) {
    if (update.type === 'file_update') {
        updateFileState(update.fileName, update.status, update.progress);
    } else if (update.type === 'non_onnx_update') {
        updateNonOnnxState(update.status, update.progress);
    } else if (update.type === 'all_non_onnx_complete') {
        currentNonOnnxStatus = 'downloaded';
        currentNonOnnxProgress = 100;
        activeOnnxDownloadName = null; 
        renderFileList();
    } else if (update.type === 'all_downloads_complete') {
        activeOnnxDownloadName = null;
        renderFileList();
        if (update.success) {
           setTimeout(hide, 1500); // Auto-close on full success
        }
    }
}

function show(
    onnxFilesArg: any[],
    allFilesArg: any[],
    initialFileStatesArg: { [fileName: string]: { status: string, progress: number } },
    nonOnnxInitialProgressArg: number,
    nonOnnxInitialStatusArg: string,
    requestFileDownloadCb: (filePlan: any) => void 
) {
    currentOnnxFiles = onnxFilesArg;
    currentAllFiles = allFilesArg;
    currentFileStates = JSON.parse(JSON.stringify(initialFileStatesArg)); 
    currentNonOnnxProgress = nonOnnxInitialProgressArg;
    currentNonOnnxStatus = nonOnnxInitialStatusArg;
    activeOnnxDownloadName = null;

    const activeOnnx = currentOnnxFiles.find(f => currentFileStates[f.fileName]?.status === 'downloading');
    if (activeOnnx) {
        activeOnnxDownloadName = activeOnnx.fileName;
    }
    
    const modelId = allFilesArg.length > 0 ? allFilesArg[0].modelId || "Unknown Model" : "Unknown Model";
    if (modelTitleElement) modelTitleElement.textContent = `Select ONNX Model for: ${modelId.split('/').pop()}`;


    renderFileList();
    modalElement?.classList.remove('hidden');
    modalElement?.classList.add('flex');
}

function hide() {
    modalElement?.classList.add('hidden');
    modalElement?.classList.remove('flex');
}

export function initializeONNXSelectionPopup(elements: { modal: HTMLElement, fileList: HTMLElement, modelTitle: HTMLElement }): any {
    modalElement = elements.modal;
    fileListElement = elements.fileList;
    modelTitleElement = elements.modelTitle;

    if (!modalElement || !fileListElement || !modelTitleElement) {
        console.error('[ONNXSelectionPopupController] Initialization failed: missing elements');
        return null;
    }

    registerPopupCallbacks(handleDownloaderUpdate);

    (window as any).showOnnxSelectionPopup = show;
    (window as any).hideOnnxSelectionPopup = hide;
    
    return { show, hide };
}