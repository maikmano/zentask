// Type definitions for Electron API
declare global {
    interface Window {
        electronAPI?: {
            checkForUpdates: () => Promise<any>;
            downloadUpdate: () => Promise<any>;
            installUpdate: () => void;
            onUpdateStatus: (callback: (status: { event: string; data: any }) => void) => void;
            removeUpdateStatusListener: () => void;
        };
    }
}

export { };
