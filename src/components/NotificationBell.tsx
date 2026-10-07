import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { Bell, Check, CheckCheck, Clock } from 'lucide-react';
import { useCurrentUser } from '../hooks/useCurrentUser';
import { useNavigate } from 'react-router-dom';

export default function NotificationBell() {
  const { profile } = useCurrentUser();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!profile?.id) return;
    
    fetchNotifications();
    
    const channel = supabase
      .channel('public:notifications')
      .on(
        'postgres_changes',
        { 
          event: '*', 
          schema: 'public', 
          table: 'notifications',
          filter: `recipient_user_id=eq.${profile.id}`
        },
        () => {
          fetchNotifications(); // Refresh on any change
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [profile?.id]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchNotifications = async () => {
    if (!profile?.id) return;
    
    // Fetch latest 10 notifications for dropdown
    const { data } = await supabase
      .from('notifications')
      .select('*')
      .eq('recipient_user_id', profile.id)
      .order('created_at', { ascending: false })
      .limit(10);
      
    if (data) {
      setNotifications(data);
      setUnreadCount(data.filter(n => !n.is_read).length);
    }
  };

  const markAsRead = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    
    await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', id);
      
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const markAllAsRead = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!profile?.id) return;
    
    await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('recipient_user_id', profile.id)
      .eq('is_read', false);
      
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    setUnreadCount(0);
  };

  const handleNotificationClick = (notification: any) => {
    if (!notification.is_read) {
      markAsRead(notification.id);
    }
    setIsOpen(false);
    
    // Role base path
    let basePath = '';
    if (profile?.role === 'ADMIN') basePath = '/admin';
    else if (profile?.role === 'SENIOR_TL') basePath = '/senior-team-leader';
    else if (profile?.role === 'TEAM_LEADER') basePath = '/team-leader';
    else if (profile?.role === 'ASSOCIATE') basePath = '/associate';
    
    if (!basePath) return;

    switch(notification.entity_type) {
      case 'APPLICATION':
        navigate(`${basePath}/applications`);
        break;
      case 'BUSINESS':
        navigate(`${basePath}/business`);
        break;
      case 'VISIT':
        navigate(`${basePath}/plot-visits`);
        break;
      case 'USER':
        if (profile?.role === 'ADMIN') {
          if (notification.type === 'TL_PROMOTED') navigate(`${basePath}/targets`);
          else navigate(`${basePath}/associates`); // Generic fallback
        }
        break;
      default:
        navigate(`${basePath}/notifications`);
    }
  };

  const timeAgo = (dateStr: string) => {
    const date = new Date(dateStr);
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    
    if (seconds < 60) return 'Just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes} min ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} hr ago`;
    const days = Math.floor(hours / 24);
    if (days < 30) return `${days} days ago`;
    
    return date.toLocaleDateString();
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)} 
        className="relative p-2 text-brand-charcoal hover:bg-brand-off-white rounded-full transition-colors focus:outline-none"
      >
        <Bell size={20} className={unreadCount > 0 ? "text-brand-architectural-blue" : ""} />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 w-4 h-4 bg-red-500 text-white text-[9px] font-bold flex items-center justify-center rounded-full border-2 border-white shadow-sm">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-lg shadow-2xl border border-gray-100 overflow-hidden z-50">
          <div className="flex items-center justify-between px-4 py-3 bg-brand-off-white border-b border-gray-100">
            <h3 className="font-serif font-medium text-brand-deep-navy">Notifications</h3>
            {unreadCount > 0 && (
              <button 
                onClick={markAllAsRead} 
                className="text-xs text-brand-architectural-blue font-medium hover:underline flex items-center gap-1"
              >
                <CheckCheck size={14} /> Mark all read
              </button>
            )}
          </div>
          
          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-gray-500 text-sm">
                No notifications yet.
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {notifications.map(notif => (
                  <div 
                    key={notif.id} 
                    onClick={() => handleNotificationClick(notif)}
                    className={`p-4 hover:bg-gray-50 cursor-pointer transition-colors relative group ${!notif.is_read ? 'bg-blue-50/30' : ''}`}
                  >
                    {!notif.is_read && (
                      <div className="absolute left-0 top-0 bottom-0 w-1 bg-brand-architectural-blue"></div>
                    )}
                    <div className="flex justify-between items-start mb-1 gap-2">
                      <h4 className={`text-sm font-medium ${!notif.is_read ? 'text-brand-deep-navy' : 'text-gray-700'}`}>
                        {notif.title}
                      </h4>
                      <span className="text-[10px] text-gray-400 whitespace-nowrap flex items-center gap-1">
                        <Clock size={10} /> {timeAgo(notif.created_at)}
                      </span>
                    </div>
                    <p className={`text-xs ${!notif.is_read ? 'text-gray-600' : 'text-gray-500'} line-clamp-2`}>
                      {notif.message}
                    </p>
                    
                    {!notif.is_read && (
                      <button 
                        onClick={(e) => markAsRead(notif.id, e)} 
                        className="absolute right-4 bottom-2 opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-brand-architectural-blue transition-all"
                        title="Mark as read"
                      >
                        <Check size={14} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
          
          <div className="p-2 border-t border-gray-100 text-center bg-gray-50">
            <button 
              onClick={() => {
                setIsOpen(false);
                if (profile?.role === 'ADMIN') navigate('/admin/notifications');
                else if (profile?.role === 'SENIOR_TL') navigate('/senior-team-leader/notifications');
                else if (profile?.role === 'TEAM_LEADER') navigate('/team-leader/notifications');
                else if (profile?.role === 'ASSOCIATE') navigate('/associate/notifications');
              }} 
              className="text-xs font-medium text-brand-charcoal hover:text-brand-architectural-blue transition-colors w-full p-2"
            >
              View All Notifications
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
