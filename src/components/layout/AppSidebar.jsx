import { Fragment } from 'react';
import { NavLink } from 'react-router-dom';
import {
  Home,
  FolderOpen,
  CheckSquare,
  Clock,
  Users,
  Building,
  BarChart3,
  Settings,
  X
} from 'lucide-react';
import { cn } from '@/utils';
import { useAuth } from '@/hooks/useAuth';
import { useTranslation } from '@/hooks/useTranslation';
import { LanguageSelector } from '@/components/ui';
import { ROLES } from '@/constants';

const AppSidebar = ({ isOpen, onClose }) => {

  return (
    <Fragment>
      {isOpen && (
        <div className="relative z-50 lg:hidden">
          <div className="fixed inset-0 bg-gray-900/80" onClick={onClose} />

          <div className="fixed inset-0 flex">
            <div className="relative mr-16 flex w-full max-w-xs flex-1">
              <div className="absolute left-full top-0 flex w-16 justify-center pt-5">
                <button type="button" className="-m-2.5 p-2.5" onClick={onClose}>
                  <X className="h-6 w-6 text-white" />
                </button>
              </div>

              <SidebarContent />
            </div>
          </div>
        </div>
      )}

      <div className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-72 lg:flex-col">
        <SidebarContent />
      </div>
    </Fragment>
  );
};

const SidebarContent = () => {
  const { user } = useAuth();
  const { t } = useTranslation();
  const isAdmin = user?.role === ROLES.ADMIN || user?.role === ROLES.ADMINISTRADOR;

  const navigation = [
    { name: t('dashboard'), href: '/dashboard', icon: Home },
    { name: t('projects'), href: '/projects', icon: FolderOpen },
    { name: t('tasks'), href: '/tasks', icon: CheckSquare },
    { name: t('timesheet'), href: '/timesheet', icon: Clock },
    { name: t('reports'), href: '/reports', icon: BarChart3 },
  ];

  const adminNavigation = [
    { name: t('users'), href: '/users', icon: Users },
    { name: t('areas'), href: '/areas', icon: Building },
    { name: 'Configuración Sistema', href: '/admin/system-config', icon: Settings },
  ];

  return (
    <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-gray-900 px-6 pb-4">
      <div className="flex h-16 shrink-0 items-center">
        <img
          className="h-8 w-auto"
          src="/logo.svg"
          alt="TeamTime"
        />
        <span className="ml-2 text-xl font-bold text-white">TeamTime</span>
      </div>

      <nav className="flex flex-1 flex-col">
        <ul role="list" className="flex flex-1 flex-col gap-y-7">
          <li>
            <ul role="list" className="-mx-2 space-y-1">
              {navigation.map((item) => (
                <li key={item.name}>
                  <NavLink
                    to={item.href}
                    className={({ isActive }) =>
                      cn(
                        isActive
                          ? 'bg-gray-800 text-white'
                          : 'text-gray-400 hover:text-white hover:bg-gray-800',
                        'group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold'
                      )
                    }
                  >
                    <item.icon className="h-6 w-6 shrink-0" />
                    {item.name}
                  </NavLink>
                </li>
              ))}
            </ul>
          </li>

          {isAdmin && (
            <li>
              <div className="text-xs font-semibold leading-6 text-gray-400">
                {t('administration')}
              </div>
              <ul role="list" className="-mx-2 mt-2 space-y-1">
                {adminNavigation.map((item) => (
                  <li key={item.name}>
                    <NavLink
                      to={item.href}
                      className={({ isActive }) =>
                        cn(
                          isActive
                            ? 'bg-gray-800 text-white'
                            : 'text-gray-400 hover:text-white hover:bg-gray-800',
                          'group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold'
                        )
                      }
                    >
                      <item.icon className="h-6 w-6 shrink-0" />
                      {item.name}
                    </NavLink>
                  </li>
                ))}
              </ul>
            </li>
          )}
        </ul>
      </nav>

      {/* Language Selector */}
      <div className="mt-auto pb-4">
        <LanguageSelector />
      </div>
    </div>
  );
};

export default AppSidebar;