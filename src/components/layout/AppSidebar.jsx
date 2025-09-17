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
  Calendar,
  GitBranch,
  Map,
  Database,
  ArrowRightLeft,
  FileText,
  Upload,
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

  const getRoleDisplayName = (role) => {
    switch (role) {
      case ROLES.ADMIN:
        return 'Administrador';
      case ROLES.MANAGER:
        return 'Coordinador';
      case ROLES.COLLABORATOR:
        return 'Colaborador';
      default:
        return role || 'Usuario';
    }
  };

  const navigation = [
    { name: t('dashboard'), href: '/dashboard', icon: Home },
    { name: t('projects'), href: '/projects', icon: FolderOpen },
    { name: t('timesheet'), href: '/timesheet', icon: Clock },
  ];

  const adminNavigation = [
    { name: t('users'), href: '/users', icon: Users },
    { name: t('areas'), href: '/areas', icon: Building },
    { name: 'Períodos de Tiempo', href: '/admin/time-periods', icon: Calendar },
    { name: 'Configuración Sistema', href: '/admin/system-config', icon: Settings },
    { name: 'Flujos de Áreas', href: '/admin/area-flows', icon: GitBranch },
    { name: 'Mapeo de Campos', href: '/admin/field-mappings', icon: Map },
    { name: 'Proyectos en Staging', href: '/admin/staging-projects', icon: Database },
    { name: 'Transferencias de Proyectos', href: '/admin/project-transfers', icon: ArrowRightLeft },
    { name: 'Generación de Documentos', href: '/admin/document-generation', icon: FileText },
    { name: 'Importación Excel V2', href: '/projects/import-v2', icon: Upload },
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

      {/* User Info Section */}
      <div className="mt-auto border-t border-gray-700 pt-4">
        <div className="flex items-center px-2 py-3">
          <img
            className="h-10 w-10 rounded-full bg-gray-50"
            src={user?.avatar || `https://ui-avatars.com/api/?name=${user?.firstName}+${user?.lastName}&background=3b82f6&color=fff`}
            alt={`${user?.firstName} ${user?.lastName}`}
          />
          <div className="ml-3 flex-1">
            <div className="text-sm font-medium text-white">
              {user?.firstName} {user?.lastName}
            </div>
            <div className="text-xs text-gray-400">
              {getRoleDisplayName(user?.role)}
            </div>
            <div className="text-xs text-gray-500">
              {user?.email}
            </div>
          </div>
        </div>

        {/* Language Selector */}
        <div className="pt-3">
          <LanguageSelector />
        </div>
      </div>
    </div>
  );
};

export default AppSidebar;