import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useCurrentUser } from '../../hooks/useCurrentUser';
import { useNavigate } from 'react-router-dom';
import { Bell, CheckCheck, Check, Clock, Search } from 'lucide-react';

export default function NotificationsCenter() {
  const { profile } = useCurrentUser();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('ALL');
  
  useEffect(() => {
    if (profile?.id) {
      fetchNotifications();
      
      const channel = supabase
        .channel('public:notifications:center')
        .on(
          'postgres_changes',
          { 
            event: '*', 
            schema: 'public', 
            table: 'notifications',
            filter: `recipient_user_id=eq.${profile.id}`
          },
          () => {
            fetchNotifications();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [profile?.id]);

  const fetchNotifications = async () => {
    if (!profile?.id) return;
    setLoading(true);
    const { data } = await supabase
      .from('notifications')
      .select('*')
      .eq('recipient_user_id', profile.id)
      .order('created_at', { ascending: false })
      .limit(200); // Reasonable page size
      
    if (data) setNotifications(data);
    setLoading(false);
  };

  const markAsRead = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    await supabase.from('notifications').update({ is_read: true }).eq('id', id);
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
  };

  const markAllAsRead = async () => {
    if (!profile?.id) return;
    await supabase.from('notifications').update({ is_read: true }).eq('recipient_user_id', profile.id).eq('is_read', false);
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
  };

  const handleNotificationClick = (notification: any) => {
    if (!notification.is_read) markAsRead(notification.id);
    
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
          else navigate(`${basePath}/associates`);
        }
        break;
      default:
        // Do nothing, just stay on page
    }
  };

  const filteredNotifications = notifications.filter(n => {
    let match = true;
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      match = match && (n.title.toLowerCase().includes(term) || n.message.toLowerCase().includes(term));
    }
    if (filterType === 'UNREAD') match = match && !n.is_read;
    else if (filterType !== 'ALL') {
      // Basic grouping mapping
      if (filterType === 'APPLICATIONS') match = match && n.entity_type === 'APPLICATION';
      else if (filterType === 'USERS') match = match && n.entity_type === 'USER';
      else if (filterType === 'BUSINESS') match = match && n.entity_type === 'BUSINESS';
      else if (filterType === 'VISITS') match = match && n.entity_type === 'VISIT';
    }
    return match;
  });

  return (
    <div className="p-6 max-w-5xl mx-auto pb-12">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-serif text-brand-deep-navy">Notification Center</h1>
          <p className="text-sm text-brand-charcoal/70">View and manage your system notifications</p>
        </div>
        <button 
          onClick={markAllAsRead} 
          className="flex items-center justify-center gap-2 px-4 py-2 bg-brand-off-white border border-brand-soft-grey text-brand-deep-navy text-sm font-medium rounded-md hover:bg-gray-100 transition-colors"
        >
          <CheckCheck size={16} /> Mark all as read
        </button>
      </div>

      <div className="bg-white p-4 rounded-lg shadow-sm border border-brand-soft-grey mb-8 flex flex-col sm:flex-row gap-4 items-end">
        <div className="flex-1 w-full">
          <label className="block text-xs text-gray-500 mb-1">Search Notifications</label>
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input 
              type="text" 
              value={searchTerm} 
              onChange={(e) => setSearchTerm(e.target.value)} 
              placeholder="Search by title or message..." 
              className="w-full pl-9 p-2 border border-brand-soft-grey rounded-md text-sm outline-none focus:border-brand-architectural-blue" 
            />
          </div>
        </div>
        <div className="w-full sm:w-64">
          <label className="block text-xs text-gray-500 mb-1">Filter</label>
          <select 
            value={filterType} 
            onChange={(e) => setFilterType(e.target.value)} 
            className="w-full p-2 border border-brand-soft-grey rounded-md text-sm bg-white outline-none focus:border-brand-architectural-blue"
          >
            <option value="ALL">All Notifications</option>
            <option value="UNREAD">Unread Only</option>
            <option value="APPLICATIONS">Applications</option>
            <option value="USERS">Users & Profiles</option>
            <option value="BUSINESS">Business Records</option>
            <option value="VISITS">Visits</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-brand-soft-grey overflow-hidden">
        {loading && notifications.length === 0 ? (
          <div className="p-8 text-center text-gray-500">Loading notifications...</div>
        ) : filteredNotifications.length === 0 ? (
          <div className="p-12 text-center flex flex-col items-center">
            <Bell size={48} className="text-gray-300 mb-4" />
            <h3 className="text-lg font-serif text-brand-deep-navy">No notifications found</h3>
            <p className="text-sm text-gray-500 mt-2">You're all caught up!</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {filteredNotifications.map(notif => (
              <div 
                key={notif.id} 
                onClick={() => handleNotificationClick(notif)}
                className={`p-5 hover:bg-gray-50 cursor-pointer transition-colors relative group flex gap-4 ${!notif.is_read ? 'bg-blue-50/20' : ''}`}
              >
                {!notif.is_read && (
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-brand-architectural-blue"></div>
                )}
                <div className={`p-3 rounded-full shrink-0 flex items-center justify-center ${!notif.is_read ? 'bg-blue-100 text-brand-architectural-blue' : 'bg-gray-100 text-gray-400'}`}>
                  <Bell size={20} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-1">
                    <h4 className={`text-base font-medium ${!notif.is_read ? 'text-brand-deep-navy' : 'text-gray-700'}`}>
                      {notif.title}
                    </h4>
                    <span className="text-xs text-gray-400 whitespace-nowrap flex items-center gap-1">
                      <Clock size={12} /> {new Date(notif.created_at).toLocaleString()}
                    </span>
                  </div>
                  <p className={`text-sm ${!notif.is_read ? 'text-gray-600' : 'text-gray-500'}`}>
                    {notif.message}
                  </p>
                </div>
                {!notif.is_read && (
                  <button 
                    onClick={(e) => markAsRead(notif.id, e)} 
                    className="shrink-0 p-2 text-brand-architectural-blue opacity-0 group-hover:opacity-100 transition-opacity bg-blue-50 rounded-full hover:bg-blue-100 self-center"
                    title="Mark as read"
                  >
                    <Check size={16} />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
