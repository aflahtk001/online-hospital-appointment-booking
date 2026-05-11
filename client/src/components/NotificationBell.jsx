import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import axios from 'axios';
import { useSelector } from 'react-redux';
import { HiOutlineBell, HiX } from 'react-icons/hi';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';

function getRelativeTime(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);

    if (diffInSeconds < 60) return `${diffInSeconds}s ago`;
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;
    
    return date.toLocaleDateString();
}

function NotificationBell() {
    const { user } = useSelector((state) => state.auth);
    const [notifications, setNotifications] = useState([]);
    const [isOpen, setIsOpen] = useState(false);
    const [selectedNotification, setSelectedNotification] = useState(null);
    const dropdownRef = useRef(null);

    useEffect(() => {
        if (user) {
            fetchNotifications();
            // Optional: Set up polling
            const interval = setInterval(fetchNotifications, 60000); // 1 minute
            return () => clearInterval(interval);
        }
    }, [user]);

    const fetchNotifications = async () => {
        try {
            const config = { headers: { Authorization: `Bearer ${user.token}` } };
            const res = await axios.get(`${API_URL}/api/notifications`, config);
            setNotifications(res.data);
        } catch (error) {
            console.error('Failed to fetch notifications:', error);
        }
    };

    const markAsRead = async (id) => {
        try {
            const config = { headers: { Authorization: `Bearer ${user.token}` } };
            await axios.put(`${API_URL}/api/notifications/${id}/read`, {}, config);
            setNotifications(notifications.map(n => n._id === id ? { ...n, isRead: true } : n));
        } catch (error) {
            console.error('Failed to mark notification as read:', error);
        }
    };

    const handleNotificationClick = (notification) => {
        if (!notification.isRead) markAsRead(notification._id);
        setSelectedNotification(notification);
    };

    const unreadCount = notifications.filter(n => !n.isRead).length;

    return (
        <div className="relative" ref={dropdownRef}>
            <button 
                onClick={() => setIsOpen(!isOpen)}
                className="p-2 rounded-full hover:bg-gray-100 transition-colors relative"
            >
                <HiOutlineBell className="text-2xl text-gray-600" />
                {unreadCount > 0 && (
                    <span className="absolute top-0 right-0 h-4 min-w-[16px] flex items-center justify-center bg-red-500 text-white text-[10px] font-bold rounded-full px-1 border border-white shadow-sm">
                        {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                )}
            </button>

            {isOpen && createPortal(
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-0 sm:p-6">
                    {/* Backdrop */}
                    <div 
                        className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
                        onClick={() => setIsOpen(false)}
                    ></div>
                    
                    <div className="relative bg-white sm:rounded-3xl shadow-2xl w-full h-full sm:h-[80vh] max-w-2xl flex flex-col overflow-hidden animate-fadeIn">
                        <div className="p-4 sm:p-6 sm:px-8 border-b border-gray-100 flex justify-between items-center bg-gray-50/80 backdrop-blur-md">
                            <div className="flex items-center gap-3">
                                <h3 className="font-bold text-gray-900 text-xl sm:text-2xl tracking-tight">System Notifications</h3>
                                {unreadCount > 0 && (
                                    <span className="text-xs bg-apple-blue text-white px-3 py-1 rounded-full font-bold shadow-sm">
                                        {unreadCount} New
                                    </span>
                                )}
                            </div>
                            <button 
                                onClick={() => setIsOpen(false)} 
                                className="p-2 bg-gray-100 text-gray-500 hover:text-gray-900 hover:bg-gray-200 rounded-full transition-colors"
                            >
                                <HiX className="text-xl" />
                            </button>
                        </div>
                        
                        <div className="flex-1 overflow-y-auto custom-scrollbar bg-gray-50/30">
                            {notifications.length === 0 ? (
                                <div className="p-12 text-center text-gray-500 flex flex-col items-center">
                                    <span className="text-4xl text-gray-300 mb-3">📭</span>
                                    <p className="text-lg font-medium">No notifications yet</p>
                                    <p className="text-sm">You're all caught up!</p>
                                </div>
                            ) : (
                                <div className="divide-y divide-gray-100/50">
                                    {notifications.map((notification) => (
                                        <div 
                                            key={notification._id} 
                                            onClick={() => handleNotificationClick(notification)}
                                            className={`p-5 sm:px-8 hover:bg-white transition-colors cursor-pointer flex gap-4 ${!notification.isRead ? 'bg-blue-50/40' : ''}`}
                                        >
                                            {/* Avatar */}
                                            <div className="flex-shrink-0 w-12 h-12 rounded-full bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center text-blue-700 font-bold border border-blue-200 shadow-sm text-lg">
                                                {notification.sender?.name ? notification.sender.name.charAt(0).toUpperCase() : 'S'}
                                            </div>

                                            <div className="flex-1 min-w-0">
                                                <div className="flex justify-between items-baseline mb-1">
                                                    <p className={`text-base ${!notification.isRead ? 'font-bold text-gray-900' : 'font-semibold text-gray-700'} truncate`}>
                                                        {notification.sender?.role?.replace('_', ' ') === 'doctor' ? 'Dr. ' : ''}
                                                        {notification.sender?.name || 'System Administrator'}
                                                    </p>
                                                    <span className="text-xs text-apple-subtext font-medium whitespace-nowrap ml-2 bg-gray-100 px-2 py-0.5 rounded-full border border-gray-200">
                                                        {getRelativeTime(notification.createdAt)}
                                                    </span>
                                                </div>
                                                
                                                <p className={`text-sm ${!notification.isRead ? 'text-gray-800' : 'text-gray-500'} line-clamp-2 mt-1 leading-relaxed`}>
                                                    {notification.message}
                                                </p>
                                            </div>
                                            
                                            {!notification.isRead && (
                                                <div className="flex flex-col justify-center flex-shrink-0 pl-1">
                                                    <div className="h-2.5 w-2.5 rounded-full bg-apple-blue shadow-[0_0_8px_rgba(0,122,255,0.4)]"></div>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>, document.body
            )}

            {/* Full Message Modal */}
            {selectedNotification && createPortal(
                <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 sm:p-0">
                    {/* Backdrop */}
                    <div 
                        className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
                        onClick={() => setSelectedNotification(null)}
                    ></div>
                    
                    {/* Modal Content */}
                    <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden transform transition-all animate-fadeIn scale-100 m-4">
                        {/* Header */}
                        <div className="bg-gray-50/80 backdrop-blur-md border-b border-gray-100 px-6 py-4 flex justify-between items-center">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center text-blue-700 font-bold shadow-sm">
                                    {selectedNotification.sender?.name ? selectedNotification.sender.name.charAt(0).toUpperCase() : 'S'}
                                </div>
                                <div>
                                    <h3 className="font-bold text-gray-900 text-lg leading-tight">
                                        {selectedNotification.sender?.role?.replace('_', ' ') === 'doctor' ? 'Dr. ' : ''}
                                        {selectedNotification.sender?.name || 'System Administrator'}
                                    </h3>
                                    <p className="text-xs text-apple-subtext font-medium uppercase tracking-wider">
                                        {selectedNotification.sender?.role?.replace('_', ' ') || 'Admin'}
                                    </p>
                                </div>
                            </div>
                            <button 
                                onClick={() => {
                                    setSelectedNotification(null);
                                    setIsOpen(false);
                                }}
                                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-200/50 rounded-full transition-colors"
                            >
                                <HiX className="text-xl" />
                            </button>
                        </div>
                        
                        {/* Body */}
                        <div className="p-6 sm:p-8">
                            <div className="bg-blue-50/30 rounded-2xl p-6 border border-blue-50 whitespace-pre-wrap text-gray-800 text-[15px] leading-relaxed max-h-[50vh] overflow-y-auto custom-scrollbar">
                                {selectedNotification.message}
                            </div>
                            
                            <div className="mt-6 flex justify-between items-center">
                                <button
                                    onClick={() => setSelectedNotification(null)}
                                    className="text-sm font-medium text-apple-blue hover:text-blue-700 hover:underline px-4 py-2 bg-blue-50 rounded-full transition-colors"
                                >
                                    Dismiss Message
                                </button>
                                <span className="text-xs text-gray-400 font-medium bg-gray-50 px-3 py-1.5 rounded-full border border-gray-100">
                                    {new Date(selectedNotification.createdAt).toLocaleDateString()} at {new Date(selectedNotification.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>, document.body
            )}
        </div>
    );
}

export default NotificationBell;
