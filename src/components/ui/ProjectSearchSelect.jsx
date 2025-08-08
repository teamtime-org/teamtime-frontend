import { useState, useEffect, useRef } from 'react';
import { Search, X, ChevronDown } from 'lucide-react';

const ProjectSearchSelect = ({ 
  projects = [], 
  value, 
  onChange, 
  placeholder = "Buscar proyecto...",
  required = false,
  disabled = false 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredProjects, setFilteredProjects] = useState(projects);
  const dropdownRef = useRef(null);
  const inputRef = useRef(null);

  const selectedProject = projects.find(project => project.id === value);

  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredProjects(projects);
    } else {
      const filtered = projects.filter(project =>
        project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (project.description && project.description.toLowerCase().includes(searchTerm.toLowerCase()))
      );
      setFilteredProjects(filtered);
    }
  }, [searchTerm, projects]);

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

  const handleSelect = (project) => {
    onChange(project.id);
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
    if (!search.trim()) return text;
    
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

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Selected project display / Search input */}
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
            <Search className="h-4 w-4 text-gray-400 mr-2 flex-shrink-0" />
            <span className={`flex-1 truncate ${selectedProject ? 'text-gray-900' : 'text-gray-500'}`}>
              {selectedProject ? selectedProject.name : placeholder}
            </span>
            <div className="flex items-center space-x-1 ml-2">
              {selectedProject && !disabled && (
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
          {filteredProjects.length > 0 ? (
            <>
              {/* Clear option */}
              {!required && (
                <button
                  type="button"
                  className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 border-b border-gray-100"
                  onClick={() => handleSelect({ id: '', name: 'Sin proyecto' })}
                >
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-gray-300 rounded-full mr-3"></div>
                    <span className="text-gray-500 italic">Sin proyecto asignado</span>
                  </div>
                </button>
              )}
              
              {/* Project options */}
              {filteredProjects.map((project) => (
                <button
                  key={project.id}
                  type="button"
                  className={`
                    w-full px-3 py-2 text-left text-sm hover:bg-gray-50 
                    ${value === project.id ? 'bg-blue-50 text-blue-700' : 'text-gray-900'}
                  `}
                  onClick={() => handleSelect(project)}
                >
                  <div className="flex items-start">
                    <div 
                      className="w-2 h-2 rounded-full mr-3 mt-2 flex-shrink-0"
                      style={{ backgroundColor: project.area?.color || '#6B7280' }}
                    ></div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">
                        {highlightMatch(project.name, searchTerm)}
                      </div>
                      {project.area && (
                        <div className="text-xs text-gray-500 mt-1">
                          {project.area.name}
                        </div>
                      )}
                      {project.status && (
                        <div className="flex items-center mt-1">
                          <span className={`
                            inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium
                            ${project.status === 'ACTIVE' ? 'bg-green-100 text-green-800' :
                              project.status === 'COMPLETED' ? 'bg-gray-100 text-gray-800' :
                              project.status === 'ON_HOLD' ? 'bg-yellow-100 text-yellow-800' :
                              project.status === 'CANCELLED' ? 'bg-red-100 text-red-800' :
                              project.status === 'AWARDED' ? 'bg-blue-100 text-blue-800' :
                              'bg-gray-100 text-gray-800'}
                          `}>
                            {project.status === 'ACTIVE' ? 'Activo' :
                             project.status === 'COMPLETED' ? 'Completado' :
                             project.status === 'ON_HOLD' ? 'En pausa' :
                             project.status === 'CANCELLED' ? 'Cancelado' :
                             project.status === 'AWARDED' ? 'Ganado' :
                             project.status}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </>
          ) : (
            <div className="px-3 py-4 text-sm text-gray-500 text-center">
              No se encontraron proyectos que coincidan con "{searchTerm}"
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ProjectSearchSelect;