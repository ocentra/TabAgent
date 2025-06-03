export const llmChannel = new BroadcastChannel('tabagent-llm');
export const logChannel = new BroadcastChannel('tabagent-logs'); 

export function assertDbWorker(selfOrWorker: any, method: string, className?: string) {
    const stack = (new Error()).stack;
    let callerInfo = '';
    if (stack) {
      const stackLines = stack.split('\n');
      if (stackLines.length > 2) {
        callerInfo = stackLines[2].trim();
      }
    }
    const classInfo = className ? `[${className}]` : '';
    if (typeof Worker !== 'undefined' && selfOrWorker instanceof Worker) {
      if (!selfOrWorker) {
        throw new Error(`dbWorker is required for ${method} ${classInfo} at ${callerInfo}`);
      }
      return;
    }
    if (!selfOrWorker.dbWorker) {
      throw new Error(`dbWorker is required for ${method} ${classInfo} at ${callerInfo}`);
    }
}