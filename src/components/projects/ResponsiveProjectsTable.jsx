import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Edit,
    Trash2,
    Eye,
    MoreVertical,
    ChevronUp,
    ChevronDown,
    Users,
    Clock
} from 'lucide-react';
import { Badge, Button } from '@/components/ui';
import { useAuth } from '@/hooks/useAuth';
import { useTranslation } from '@/hooks/useTranslation';
import { ROLES, PROJECT_STATUS } from '@/constants';
import { formatDate, formatCurrency } from '@/utils';

const ResponsiveProjectsTable = ({
    projects,
    onEdit,
    onDelete,
    sortBy,
    sortOrder,
    onSort
}) => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const { t } = useTranslation();
    const [openDropdown, setOpenDropdown] = useState(null);

    const isAdmin = user?.role === ROLES.ADMIN;
    const isManager = user?.role === ROLES.MANAGER;
    const canEditProjects = isAdmin || isManager;

    const statusConfig = {
        [PROJECT_STATUS.ACTIVE]: { variant: 'success', label: t('active') },
        [PROJECT_STATUS.COMPLETED]: { variant: 'default', label: t('completed') },
        [PROJECT_STATUS.ON_HOLD]: { variant: 'warning', label: t('onHold') },
        [PROJECT_STATUS.CANCELLED]: { variant: 'danger', label: t('cancelled') },
        [PROJECT_STATUS.AWARDED]: { variant: 'info', label: 'Ganado' },
    };

    const priorityConfig = {
        LOW: { variant: 'secondary', label: t('low') },
        MEDIUM: { variant: 'default', label: t('medium') },
        HIGH: { variant: 'warning', label: t('high') },
        URGENT: { variant: 'danger', label: t('urgent') },
    };

    const handleSort = (column) => {
        if (sortBy === column) {
            onSort(column, sortOrder === 'asc' ? 'desc' : 'asc');
        } else {
            onSort(column, 'asc');
        }
    };

    const SortIcon = ({ column }) => {
        if (sortBy !== column) return null;
        return sortOrder === 'asc' ?
            <ChevronUp className="h-4 w-4" /> :
            <ChevronDown className="h-4 w-4" />;
    };

    const toggleDropdown = (projectId) => {
        setOpenDropdown(openDropdown === projectId ? null : projectId);
    };

    return (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            {/* Contenedor con scroll horizontal personalizado */}
            <div className="overflow-x-auto overflow-y-visible table-scroll">
                
                <table className="w-full divide-y divide-gray-200" style={{ minWidth: '1400px' }}>
                    <thead className="bg-gray-50">
                        <tr>
                            {/* Columna del proyecto - fija a la izquierda */}
                            <th
                                scope="col"
                                className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 sticky-column-left bg-gray-50 z-20"
                                onClick={() => handleSort('name')}
                                style={{ minWidth: '300px', maxWidth: '300px' }}
                            >
                                <div className="flex items-center space-x-1">
                                    <span>Proyecto</span>
                                    <SortIcon column="name" />
                                </div>
                            </th>
                            
                            {/* Resto de columnas */}
                            <th
                                scope="col"
                                className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                                onClick={() => handleSort('area')}
                                style={{ minWidth: '120px' }}
                            >
                                <div className="flex items-center space-x-1">
                                    <span>Área</span>
                                    <SortIcon column="area" />
                                </div>
                            </th>
                            
                            <th
                                scope="col"
                                className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                                onClick={() => handleSort('status')}
                                style={{ minWidth: '120px' }}
                            >
                                <div className="flex items-center space-x-1">
                                    <span>Estado</span>
                                    <SortIcon column="status" />
                                </div>
                            </th>
                            
                            <th
                                scope="col"
                                className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                                onClick={() => handleSort('priority')}
                                style={{ minWidth: '120px' }}
                            >
                                <div className="flex items-center space-x-1">
                                    <span>Prioridad</span>
                                    <SortIcon column="priority" />
                                </div>
                            </th>
                            
                            <th
                                scope="col"
                                className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                                onClick={() => handleSort('startDate')}
                                style={{ minWidth: '140px' }}
                            >
                                <div className="flex items-center space-x-1">
                                    <span>Fechas</span>
                                    <SortIcon column="startDate" />
                                </div>
                            </th>
                            
                            <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" style={{ minWidth: '100px' }}>
                                Asignados
                            </th>
                            
                            <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" style={{ minWidth: '250px' }}>
                                Detalles Excel
                            </th>
                            
                            <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" style={{ minWidth: '140px' }}>
                                Facturación
                            </th>
                            
                            {/* Columna de acciones - fija a la derecha */}
                            <th 
                                scope="col" 
                                className="relative px-4 py-3 sticky-column-right bg-gray-50 z-20" 
                                style={{ minWidth: '80px', maxWidth: '80px' }}
                            >
                                <span className="sr-only">Acciones</span>
                            </th>
                        </tr>
                    </thead>
                    
                    <tbody className="bg-white divide-y divide-gray-200">
                        {projects.map((project) => {
                            return (
                                <tr key={project.id} className="hover:bg-gray-50 table-row-hover">
                                    {/* Celda del proyecto - fija a la izquierda */}
                                    <td 
                                        className="px-4 py-4 sticky-column-left bg-white z-10"
                                        style={{ minWidth: '300px', maxWidth: '300px' }}
                                    >
                                        <div className="w-full">
                                            <div
                                                className="text-sm font-medium text-gray-900 cursor-pointer hover:text-blue-600 truncate block"
                                                onClick={() => navigate(`/projects/${project.id}`)}
                                                title={project.name}
                                            >
                                                {project.name}
                                            </div>
                                            {project.description && (
                                                <div
                                                    className="text-xs text-gray-500 mt-1 truncate block"
                                                    title={project.description}
                                                >
                                                    {project.description.slice(0, 80)}...
                                                </div>
                                            )}
                                        </div>
                                    </td>
                                    
                                    {/* Área */}
                                    <td className="px-4 py-4 whitespace-nowrap">
                                        <div className="flex items-center">
                                            <div
                                                className="w-3 h-3 rounded-full mr-2 flex-shrink-0"
                                                style={{ backgroundColor: project.area?.color || '#6B7280' }}
                                            />
                                            <span className="text-sm text-gray-900 truncate">
                                                {project.area?.name || 'Sin área'}
                                            </span>
                                        </div>
                                    </td>
                                    
                                    {/* Estado */}
                                    <td className="px-4 py-4 whitespace-nowrap">
                                        <Badge variant={statusConfig[project.status]?.variant}>
                                            {statusConfig[project.status]?.label}
                                        </Badge>
                                    </td>
                                    
                                    {/* Prioridad */}
                                    <td className="px-4 py-4 whitespace-nowrap">
                                        <Badge variant={priorityConfig[project.priority]?.variant}>
                                            {priorityConfig[project.priority]?.label}
                                        </Badge>
                                    </td>
                                    
                                    {/* Fechas */}
                                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                                        <div>
                                            <div className="text-xs">Inicio: {formatDate(project.startDate)}</div>
                                            <div className="text-xs text-gray-500">Fin: {formatDate(project.endDate)}</div>
                                        </div>
                                    </td>
                                    
                                    {/* Asignados */}
                                    <td className="px-4 py-4 whitespace-nowrap">
                                        <div className="flex items-center space-x-2">
                                            <div className="flex items-center text-sm text-gray-600">
                                                <Users className="h-4 w-4 mr-1" />
                                                {project.assignments?.length || 0}
                                            </div>
                                            <div className="flex items-center text-sm text-gray-600">
                                                <Clock className="h-4 w-4 mr-1" />
                                                {project._count?.tasks || 0}
                                            </div>
                                        </div>
                                    </td>
                                    
                                    {/* Detalles Excel */}
                                    <td className="px-4 py-4 text-sm">
                                        {project.excelDetails ? (
                                            <div className="space-y-1">
                                                {project.excelDetails.mentor && (
                                                    <div className="text-xs">
                                                        <span className="font-medium text-gray-600">Colaborador:</span>{' '}
                                                        <span className="text-gray-900">
                                                            {project.excelDetails.mentor.firstName} {project.excelDetails.mentor.lastName}
                                                        </span>
                                                    </div>
                                                )}
                                                {project.excelDetails.coordinator && (
                                                    <div className="text-xs">
                                                        <span className="font-medium text-gray-600">Coordinador:</span>{' '}
                                                        <span className="text-gray-900">
                                                            {project.excelDetails.coordinator.firstName} {project.excelDetails.coordinator.lastName}
                                                        </span>
                                                    </div>
                                                )}
                                                {project.excelDetails.salesManagement && (
                                                    <div className="text-xs">
                                                        <span className="font-medium text-gray-600">Gerencia:</span>{' '}
                                                        <span className="text-gray-900">{project.excelDetails.salesManagement.name}</span>
                                                    </div>
                                                )}
                                                {project.excelDetails.siebelOrderNumber && (
                                                    <div className="text-xs">
                                                        <span className="font-medium text-gray-600">Siebel:</span>{' '}
                                                        <span className="text-gray-900">{project.excelDetails.siebelOrderNumber}</span>
                                                    </div>
                                                )}
                                            </div>
                                        ) : (
                                            <span className="text-gray-400 text-xs">Sin detalles Excel</span>
                                        )}
                                    </td>
                                    
                                    {/* Facturación */}
                                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                                        <div>
                                            {project.excelDetails?.totalContractAmountMXN ? (
                                                <div className="text-green-600 font-medium text-xs">
                                                    {formatCurrency(parseFloat(project.excelDetails.totalContractAmountMXN))}
                                                </div>
                                            ) : null}
                                            {project.excelDetails?.monthlyBillingMXN && (
                                                <div className="text-blue-600 text-xs">
                                                    Mensual: {formatCurrency(parseFloat(project.excelDetails.monthlyBillingMXN))}
                                                </div>
                                            )}
                                            {!project.excelDetails?.totalContractAmountMXN && !project.excelDetails?.monthlyBillingMXN && (
                                                <span className="text-gray-400 text-xs">N/A</span>
                                            )}
                                        </div>
                                    </td>
                                    
                                    {/* Acciones - fija a la derecha */}
                                    <td 
                                        className="px-4 py-4 whitespace-nowrap text-right text-sm font-medium sticky-column-right bg-white z-10"
                                        style={{ minWidth: '80px', maxWidth: '80px' }}
                                    >
                                        <div className="relative">
                                            <button
                                                onClick={() => toggleDropdown(project.id)}
                                                className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100"
                                            >
                                                <MoreVertical className="h-4 w-4" />
                                            </button>

                                            {openDropdown === project.id && (
                                                <div className="absolute right-0 z-30 mt-1 w-48 bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5">
                                                    <button
                                                        onClick={() => {
                                                            navigate(`/projects/${project.id}`);
                                                            setOpenDropdown(null);
                                                        }}
                                                        className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                                    >
                                                        <Eye className="h-4 w-4 mr-2" />
                                                        Ver Detalles
                                                    </button>
                                                    {canEditProjects && (
                                                        <>
                                                            <button
                                                                onClick={() => {
                                                                    onEdit(project);
                                                                    setOpenDropdown(null);
                                                                }}
                                                                className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                                            >
                                                                <Edit className="h-4 w-4 mr-2" />
                                                                Editar
                                                            </button>
                                                            <button
                                                                onClick={() => {
                                                                    onDelete(project);
                                                                    setOpenDropdown(null);
                                                                }}
                                                                className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                                                            >
                                                                <Trash2 className="h-4 w-4 mr-2" />
                                                                Eliminar
                                                            </button>
                                                        </>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default ResponsiveProjectsTable;