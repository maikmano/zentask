import { useState, useEffect } from 'react';
import { Download, X, Loader2, CheckCircle2 } from 'lucide-react';

interface UpdateInfo {
    version: string;
    releaseNotes?: string;
}

interface DownloadProgress {
    percent: number;
    transferred: number;
    total: number;
}

export default function UpdateNotification() {
    const [updateAvailable, setUpdateAvailable] = useState(false);
    const [updateInfo, setUpdateInfo] = useState<UpdateInfo | null>(null);
    const [downloading, setDownloading] = useState(false);
    const [downloadProgress, setDownloadProgress] = useState(0);
    const [updateReady, setUpdateReady] = useState(false);
    const [dismissed, setDismissed] = useState(false);

    useEffect(() => {
        // Check if running in Electron
        if (!window.electronAPI) return;

        // Listen for update events
        window.electronAPI.onUpdateStatus((status: { event: string; data: any }) => {
            console.log('Update status:', status);

            switch (status.event) {
                case 'update-available':
                    setUpdateAvailable(true);
                    setUpdateInfo(status.data);
                    setDismissed(false);
                    break;

                case 'update-not-available':
                    setUpdateAvailable(false);
                    break;

                case 'download-progress':
                    setDownloading(true);
                    setDownloadProgress(Math.round(status.data.percent));
                    break;

                case 'update-downloaded':
                    setDownloading(false);
                    setUpdateReady(true);
                    break;

                case 'update-error':
                    console.error('Update error:', status.data);
                    setDownloading(false);
                    break;
            }
        });

        return () => {
            window.electronAPI?.removeUpdateStatusListener();
        };
    }, []);

    const handleDownload = async () => {
        if (window.electronAPI) {
            setDownloading(true);
            await window.electronAPI.downloadUpdate();
        }
    };

    const handleInstall = () => {
        if (window.electronAPI) {
            window.electronAPI.installUpdate();
        }
    };

    const handleDismiss = () => {
        setDismissed(true);
    };

    if (!updateAvailable || dismissed) return null;

    return (
        <div className="fixed top-4 right-4 z-50 w-96 animate-slide-in">
            <div className="glass-panel p-4 border border-white/10 rounded-xl shadow-2xl">
                <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                        {updateReady ? (
                            <CheckCircle2 className="w-5 h-5 text-green-400" />
                        ) : (
                            <Download className="w-5 h-5 text-blue-400" />
                        )}
                        <h3 className="font-semibold text-white">
                            {updateReady ? 'Atualização Pronta!' : 'Nova Atualização Disponível'}
                        </h3>
                    </div>
                    <button
                        onClick={handleDismiss}
                        className="text-gray-400 hover:text-white transition-colors"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {updateInfo && (
                    <p className="text-sm text-gray-300 mb-3">
                        Versão {updateInfo.version} disponível
                    </p>
                )}

                {downloading && (
                    <div className="mb-3">
                        <div className="flex items-center justify-between text-xs text-gray-400 mb-1">
                            <span>Baixando...</span>
                            <span>{downloadProgress}%</span>
                        </div>
                        <div className="w-full bg-white/10 rounded-full h-2 overflow-hidden">
                            <div
                                className="bg-gradient-to-r from-blue-500 to-purple-500 h-full transition-all duration-300"
                                style={{ width: `${downloadProgress}%` }}
                            />
                        </div>
                    </div>
                )}

                <div className="flex gap-2">
                    {updateReady ? (
                        <button
                            onClick={handleInstall}
                            className="flex-1 px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white rounded-lg font-medium transition-all duration-200 flex items-center justify-center gap-2"
                        >
                            <CheckCircle2 className="w-4 h-4" />
                            Instalar e Reiniciar
                        </button>
                    ) : downloading ? (
                        <button
                            disabled
                            className="flex-1 px-4 py-2 bg-white/10 text-gray-400 rounded-lg font-medium flex items-center justify-center gap-2 cursor-not-allowed"
                        >
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Baixando...
                        </button>
                    ) : (
                        <>
                            <button
                                onClick={handleDismiss}
                                className="flex-1 px-4 py-2 bg-white/5 hover:bg-white/10 text-gray-300 rounded-lg font-medium transition-all duration-200"
                            >
                                Mais Tarde
                            </button>
                            <button
                                onClick={handleDownload}
                                className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white rounded-lg font-medium transition-all duration-200 flex items-center justify-center gap-2"
                            >
                                <Download className="w-4 h-4" />
                                Baixar
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
