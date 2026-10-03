import { useState, useRef, useEffect } from 'react';
import { Search, ChevronDown, Check } from 'lucide-react';
import { formatUser } from '../utils/formatUser';

type UserOption = {
  id: string;
  user_code: string;
  full_name: string;
  role: string;
};

interface UserSelectorProps {
  users: UserOption[];
  value: string;
  onChange: (id: string) => void;
  error?: boolean;
}

export default function UserSelector({ users, value, onChange, error }: UserSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedUser = users.find(u => u.id === value);

  const filteredUsers = users.filter(u => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      (u.full_name && u.full_name.toLowerCase().includes(term)) ||
      (u.user_code && u.user_code.toLowerCase().includes(term))
    );
  });

  return (
    <div ref={wrapperRef} className="relative w-full">
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full p-2 border ${error ? 'border-red-500' : 'border-brand-soft-grey'} bg-white rounded cursor-pointer flex justify-between items-center focus-within:ring-1 focus-within:ring-brand-primary`}
      >
        <div className="flex-1 truncate pr-2">
          {selectedUser ? (
            <div className="flex items-center gap-2">
              <span className="font-medium text-brand-deep-navy">{formatUser(selectedUser.user_code, selectedUser.full_name)}</span>
              <span className="text-[10px] bg-brand-soft-grey/50 px-1.5 py-0.5 rounded text-brand-charcoal/70 uppercase tracking-widest">
                {selectedUser.role.replace('_', ' ')}
              </span>
            </div>
          ) : (
            <span className="text-brand-charcoal/50">Select User...</span>
          )}
        </div>
        <ChevronDown size={16} className={`text-brand-charcoal/50 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </div>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-brand-soft-grey rounded-md shadow-xl max-h-72 flex flex-col">
          <div className="p-2 border-b border-brand-soft-grey sticky top-0 bg-white z-10">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-brand-charcoal/40" size={14} />
              <input
                type="text"
                autoFocus
                placeholder="Search by name or user code..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-sm border border-brand-soft-grey rounded focus:outline-none focus:ring-1 focus:ring-brand-primary bg-brand-off-white"
              />
            </div>
          </div>
          
          <div className="overflow-y-auto flex-1 p-1">
            {filteredUsers.length === 0 ? (
              <div className="p-4 text-center text-sm text-brand-charcoal/60">
                No users found.
              </div>
            ) : (
              filteredUsers.map(user => (
                <div
                  key={user.id}
                  onClick={() => {
                    onChange(user.id);
                    setIsOpen(false);
                    setSearchTerm('');
                  }}
                  className={`flex items-center justify-between p-2.5 hover:bg-brand-off-white cursor-pointer rounded mb-0.5 transition-colors ${
                    value === user.id ? 'bg-brand-primary/5' : ''
                  }`}
                >
                  <div>
                    <div className="font-medium text-brand-deep-navy text-sm">
                      {formatUser(user.user_code, user.full_name)}
                    </div>
                    <div className="text-[10px] uppercase tracking-widest text-brand-charcoal/60 mt-0.5">
                      {user.role.replace('_', ' ')}
                    </div>
                  </div>
                  {value === user.id && (
                    <Check size={16} className="text-brand-primary" />
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
