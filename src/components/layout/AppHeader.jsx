import { Fragment } from 'react';
import { Menu, Bell, Search, User, Settings, LogOut } from 'lucide-react';
import { Button } from '@/components/ui';
import { useAuth } from '@/hooks/useAuth';
import { ROLES } from '@/constants';

const AppHeader = ({ onMenuClick }) => {
  const { user, logout } = useAuth();

  const getRoleDisplayName = (role) => {
    switch (role) {
      case ROLES.ADMIN:
        return 'Administrador';
      case ROLES.MANAGER:
        return 'Gerente';
      case ROLES.COLLABORATOR:
        return 'Colaborador';
      default:
        return role || 'Usuario';
    }
  };

  return (
    <div className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b border-gray-200 bg-white px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-8">
      <Button
        variant="ghost"
        size="icon"
        className="lg:hidden"
        onClick={onMenuClick}
      >
        <Menu className="h-5 w-5" />
      </Button>

      <div className="h-6 w-px bg-gray-200 lg:hidden" />

      <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
        <div className="relative flex flex-1">
          <div className="absolute inset-y-0 left-0 flex items-center pl-3">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            className="block h-full w-full border-0 py-0 pl-10 pr-0 text-gray-900 placeholder:text-gray-400 focus:ring-0 sm:text-sm"
            placeholder="Search..."
            type="search"
          />
        </div>
        
        <div className="flex items-center gap-x-4 lg:gap-x-6">
          <Button variant="ghost" size="icon">
            <Bell className="h-5 w-5" />
          </Button>

          <div className="hidden lg:block lg:h-6 lg:w-px lg:bg-gray-200" />

          <div className="relative">
            <details className="relative">
              <summary className="flex items-center cursor-pointer">
                <div className="flex items-center gap-x-2">
                  <img
                    className="h-8 w-8 rounded-full bg-gray-50"
                    src={user?.avatar || `https://ui-avatars.com/api/?name=${user?.firstName}+${user?.lastName}&background=3b82f6&color=fff`}
                    alt={`${user?.firstName} ${user?.lastName}`}
                  />
                  <span className="hidden lg:flex lg:items-center lg:flex-col lg:items-start">
                    <span className="ml-2 text-sm font-semibold leading-6 text-gray-900">
                      {user?.firstName} {user?.lastName}
                    </span>
                    <span className="ml-2 text-xs text-gray-500">
                      {getRoleDisplayName(user?.role)}
                    </span>
                  </span>
                </div>
              </summary>
              
              <div className="absolute right-0 z-10 mt-2 w-48 origin-top-right rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                <a href="/profile" className="flex px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                  <User className="mr-3 h-4 w-4" />
                  Your Profile
                </a>
                <a href="/settings" className="flex px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                  <Settings className="mr-3 h-4 w-4" />
                  Settings
                </a>
                <button
                  onClick={logout}
                  className="flex w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  <LogOut className="mr-3 h-4 w-4" />
                  Sign out
                </button>
              </div>
            </details>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AppHeader;