
export interface ActionLog {
  id: string;
  timestamp: number;
  actionType: 'CLICK' | 'EDIT' | 'ADD' | 'DELETE' | 'NAVIGATION';
  details: string;
  context?: any;
}

const LOG_LIMIT = 50;
let actionLogs: ActionLog[] = [];

export const logAction = (type: ActionLog['actionType'], details: string, context?: any) => {
  const log: ActionLog = {
    id: Date.now().toString(),
    timestamp: Date.now(),
    actionType: type,
    details,
    context
  };
  
  actionLogs.unshift(log);
  if (actionLogs.length > LOG_LIMIT) actionLogs.pop();
  
  // console.log(`[WATCHDOG] ${type}: ${details}`);
};

export const getRecentActions = (): string => {
    return actionLogs.slice(0, 10).map(l => 
        `[${new Date(l.timestamp).toLocaleTimeString()}] ${l.actionType}: ${l.details}`
    ).join('\n');
};
