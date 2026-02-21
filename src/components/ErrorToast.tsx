'use client';

interface ErrorToastProps {
    isOpen: boolean;
    message: string;
    onClose: () => void;
}

export function ErrorToast({ isOpen, message, onClose }: ErrorToastProps) {
    if (!isOpen) return null;

    return (
        <div className="fixed top-4 right-4 z-50 animate-in slide-in-from-top-5">
            <div className="bg-red-50 border border-red-200 rounded-lg shadow-lg p-4 max-w-md">
                <div className="flex items-start gap-3">
                    <div className="flex-shrink-0">
                        <svg className="w-5 h-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                    <div className="flex-1">
                        <p className="text-sm font-medium text-red-900">Error</p>
                        <p className="text-sm text-red-700 mt-1">{message}</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="flex-shrink-0 text-red-400 hover:text-red-600 transition-colors"
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
            </div>
        </div>
    );
}
