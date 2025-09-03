import { useState, useEffect, useRef } from 'react';
import { Search, X, ChevronDown, User } from 'lucide-react';

const UserSearchSelect = ({ 
  users = [], 
  value, 
  onChange, 
  placeholder = "Buscar usuario...",
  required = false,
  disabled = false 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredUsers, setFilteredUsers] = useState(users);
  const dropdownRef = useRef(null);
  const inputRef = useRef(null);

  const selectedUser = users.find(user => user.id === value);

  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredUsers(users);
    } else {
      const filtered = users.filter(user => {
        const fullName = `${user.firstName || ''} ${user.lastName || ''}`.trim();
        const searchableText = [
          fullName,
          user.name,
          user.email,
          user.role
        ].filter(Boolean).join(' ').toLowerCase();
        
        return searchableText.includes(searchTerm.toLowerCase());
      });
      setFilteredUsers(filtered);
    }
  }, [searchTerm, users]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
        setSearchTerm('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (user) => {
    onChange(user.id);
    setIsOpen(false);
    setSearchTerm('');
  };

  const handleClear = () => {
    onChange('');
    setSearchTerm('');
  };

  const handleInputClick = () => {
    if (!disabled) {
      setIsOpen(!isOpen);
      if (!isOpen) {
        setTimeout(() => inputRef.current?.focus(), 100);
      }
    }
  };

  const highlightMatch = (text, search) => {
    if (!search.trim() || !text) return text;
    
    const regex = new RegExp(`(${search})`, 'gi');
    const parts = text.split(regex);
    
    return parts.map((part, index) => 
      regex.test(part) ? (
        <mark key={index} className="bg-yellow-200 text-yellow-900">
          {part}
        </mark>
      ) : (
        part
      )
    );
  };

  const getUserDisplayName = (user) => {
    if (user.firstName && user.lastName) {
      return `${user.firstName} ${user.lastName}`;
    }
    return user.name || user.email || `User ${user.id}`;
  };

  const getUserInitial = (user) => {
    if (user.firstName) return user.firstName.charAt(0).toUpperCase();
    if (user.name) return user.name.charAt(0).toUpperCase();
    if (user.email) return user.email.charAt(0).toUpperCase();
    return '?';
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Selected user display / Search input */}
      <div
        className={`
          flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm 
          ring-offset-background placeholder:text-muted-foreground 
          focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2
          ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}
          ${required && !value ? 'border-red-300' : ''}
        `}
        onClick={handleInputClick}
      >
        {isOpen ? (
          <div className="flex items-center w-full">
            <Search className="h-4 w-4 text-gray-400 mr-2 flex-shrink-0" />
            <input
              ref={inputRef}
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={placeholder}
              className="flex-1 outline-none bg-transparent"
              disabled={disabled}
            />
            {searchTerm && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setSearchTerm('');
                }}
                className="ml-2 text-gray-400 hover:text-gray-600"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        ) : (
          <div className="flex items-center w-full">
            <User className="h-4 w-4 text-gray-400 mr-2 flex-shrink-0" />
            <span className={`flex-1 truncate ${selectedUser ? 'text-gray-900' : 'text-gray-500'}`}>
              {selectedUser ? getUserDisplayName(selectedUser) : placeholder}
            </span>
            <div className="flex items-center space-x-1 ml-2">
              {selectedUser && !disabled && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleClear();
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
              <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </div>
          </div>
        )}
      </div>

      {/* Dropdown */}
      {isOpen && !disabled && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto">
          {filteredUsers.length > 0 ? (
            <>
              {/* Clear option */}
              {!required && (
                <button
                  type="button"
                  className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 border-b border-gray-100"
                  onClick={() => handleSelect({ id: '', name: 'Sin asignar' })}
                >
                  <div className="flex items-center">
                    <div className="w-8 h-8 bg-gray-100 rounded-full mr-3 flex items-center justify-center">
                      <span className="text-gray-400 text-sm">—</span>
                    </div>
                    <div>
                      <div className="text-gray-500 text-sm font-medium">Sin asignar</div>
                      <div className="text-xs text-gray-400">La tarea no se asignará a ningún usuario</div>
                    </div>
                  </div>
                </button>
              )}
              
              {/* User options */}
              {filteredUsers.map((user) => {
                const displayName = getUserDisplayName(user);
                const initial = getUserInitial(user);
                
                return (
                  <button
                    key={user.id}
                    type="button"
                    className={`
                      w-full px-3 py-2 text-left text-sm hover:bg-gray-50 
                      ${value === user.id ? 'bg-blue-50 text-blue-700' : 'text-gray-900'}
                    `}
                    onClick={() => handleSelect(user)}
                  >
                    <div className="flex items-center">
                      <div className="w-8 h-8 bg-gray-200 rounded-full mr-3 flex items-center justify-center flex-shrink-0">
                        <span className="text-sm font-medium text-gray-600">
                          {initial}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">
                          {highlightMatch(displayName, searchTerm)}
                        </div>
                        {user.email && (
                          <div className="text-xs text-gray-500 truncate">
                            {highlightMatch(user.email, searchTerm)}
                          </div>
                        )}
                        {user.role && (
                          <div className="text-xs text-gray-400 capitalize">
                            {user.role.toLowerCase()}
                          </div>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
            </>
          ) : (
            <div className="px-3 py-4 text-sm text-gray-500 text-center">
              No se encontraron usuarios que coincidan con "{searchTerm}"
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default UserSearchSelect;