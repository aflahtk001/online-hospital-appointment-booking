import React, { useEffect, useState } from 'react';
import { useAlert } from '../context/AlertContext';

const AlertPopup = () => {
    const { alert, hideAlert } = useAlert();
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        if (alert.isOpen) {
            setIsVisible(true);
        } else {
            // Delay unmounting to allow exit animation
            const timer = setTimeout(() => setIsVisible(false), 300);
            return () => clearTimeout(timer);
        }
    }, [alert.isOpen]);

    if (!isVisible && !alert.isOpen) return null;

    const getBgColor = () => {
        switch (alert.type) {
            case 'success':
                return 'bg-emerald-500';
            case 'error':
                return 'bg-rose-500';
            case 'warning':
                return 'bg-amber-500';
            default:
                return 'bg-blue-600';
        }
    };

    return (
        <div className="fixed top-5 left-1/2 transform -translate-x-1/2 z-[9999]">
            <div
                className={`flex items-center justify-between min-w-[320px] max-w-md px-6 py-4 rounded-xl shadow-2xl text-white ${getBgColor()} transition-all duration-300 ease-in-out ${
                    alert.isOpen ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 -translate-y-5 scale-95'
                }`}
            >
                <div className="flex items-center mr-4">
                    {/* Optional default icon based on type could go here */}
                    <p className="font-semibold text-sm tracking-wide">{alert.message}</p>
                </div>
                <button
                    onClick={hideAlert}
                    className="text-white/80 hover:text-white hover:bg-white/20 p-1.5 rounded-full focus:outline-none transition-colors"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>
        </div>
    );
};

export default AlertPopup;
