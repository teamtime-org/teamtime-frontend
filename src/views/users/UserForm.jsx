import { useState, useEffect } from 'react';
import { Button, Input, Modal } from '@/components/ui';
import { ROLES } from '@/constants';
import { areaService } from '@/services/areaService';

const UserForm = ({ isOpen, onClose, onSubmit, user = null, loading = false }) => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    role: ROLES.EMPLOYEE,
    areaId: '',
    password: '',
    confirmPassword: ''
  });

  const [errors, setErrors] = useState({});
  const [areas, setAreas] = useState([]);
  const [loadingAreas, setLoadingAreas] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchAreas();
    } else {
      // Resetear áreas cuando se cierra el modal
      setAreas([]);
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && user) {
      console.log('Cargando datos del usuario:', user);
      console.log('AreaId del usuario:', user.areaId);
      setFormData({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || '',
        role: user.role || ROLES.EMPLOYEE,
        areaId: user.areaId || '',
        password: '',
        confirmPassword: ''
      });
    } else if (isOpen && !user) {
      // Resetear formulario para crear nuevo usuario
      setFormData({
        firstName: '',
        lastName: '',
        email: '',
        role: ROLES.EMPLOYEE,
        areaId: '',
        password: '',
        confirmPassword: ''
      });
    }
  }, [isOpen, user]);

  // Debug effect para validar cuando áreas y usuario estén cargados
  useEffect(() => {
    if (areas.length > 0 && user && formData.areaId) {
      console.log('=== VALIDACIÓN DE ÁREA ===');
      console.log('formData.areaId:', formData.areaId);
      console.log('Tipo de formData.areaId:', typeof formData.areaId);
      console.log('Áreas disponibles:');
      areas.forEach(area => {
        console.log(`  - ID: "${area.id}" (tipo: ${typeof area.id}) | Nombre: "${area.name}"`);
        console.log(`  - ¿Coincide? ${area.id === formData.areaId}`);
      });
      
      const matchingArea = areas.find(area => area.id === formData.areaId);
      console.log('Área que debería estar seleccionada:', matchingArea);
      console.log('=========================');
    }
  }, [areas, formData.areaId, user]);

  // Monitor de cambios en formData
  useEffect(() => {
    console.log('🔄 formData cambió:', formData);
  }, [formData]);

  const fetchAreas = async () => {
    setLoadingAreas(true);
    try {
      const response = await areaService.getAll();
      const areasData = response.data?.areas || response.data || [];
      const finalAreas = Array.isArray(areasData) ? areasData : [];
      console.log('Áreas cargadas:', finalAreas);
      setAreas(finalAreas);
    } catch (error) {
      console.error('Error al cargar áreas:', error);
      setAreas([]);
    } finally {
      setLoadingAreas(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    let newFormData = {
      ...formData,
      [name]: value
    };
    
    // Si cambia el rol a admin, limpiar el área
    if (name === 'role' && value === ROLES.ADMIN) {
      newFormData.areaId = '';
    }
    
    setFormData(newFormData);
    
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: null
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.firstName.trim()) {
      newErrors.firstName = 'El nombre es requerido';
    }

    if (!formData.lastName.trim()) {
      newErrors.lastName = 'El apellido es requerido';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'El email es requerido';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'El email no es válido';
    }

    if (!formData.role) {
      newErrors.role = 'El rol es requerido';
    }

    if ((formData.role === ROLES.MANAGER || formData.role === ROLES.EMPLOYEE) && !formData.areaId) {
      newErrors.areaId = 'El área es requerida para coordinadores y colaboradores';
    }

    if (!user && !formData.password) {
      newErrors.password = 'La contraseña es requerida';
    }

    if (!user && formData.password && formData.password.length < 6) {
      newErrors.password = 'La contraseña debe tener al menos 6 caracteres';
    }

    if (!user && formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Las contraseñas no coinciden';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    const submitData = { ...formData };
    delete submitData.confirmPassword;
    
    if (user && !submitData.password) {
      delete submitData.password;
    }

    onSubmit(submitData);
  };

  const resetForm = () => {
    setFormData({
      firstName: '',
      lastName: '',
      email: '',
      role: ROLES.EMPLOYEE,
      areaId: '',
      password: '',
      confirmPassword: ''
    });
    setErrors({});
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={user ? 'Editar Usuario' : 'Crear Usuario'}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            name="firstName"
            label="Nombre"
            value={formData.firstName}
            onChange={handleChange}
            error={errors.firstName}
            required
            placeholder="Juan"
          />

          <Input
            name="lastName"
            label="Apellido"
            value={formData.lastName}
            onChange={handleChange}
            error={errors.lastName}
            required
            placeholder="Pérez"
          />

          <Input
            name="email"
            label="Email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            error={errors.email}
            required
            placeholder="juan@ejemplo.com"
          />

          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700">
              Rol <span className="text-red-500 ml-1">*</span>
            </label>
            <select
              name="role"
              value={formData.role}
              onChange={handleChange}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <option value={ROLES.EMPLOYEE}>Colaborador</option>
              <option value={ROLES.MANAGER}>Coordinador</option>
              <option value={ROLES.ADMIN}>Administrador</option>
            </select>
            {errors.role && (
              <p className="text-sm text-red-600">{errors.role}</p>
            )}
          </div>

          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700">
              Área {formData.role !== ROLES.ADMIN && <span className="text-red-500 ml-1">*</span>}
            </label>
            <select
              name="areaId"
              value={formData.areaId}
              onChange={handleChange}
              disabled={loadingAreas}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {console.log('Renderizando select con formData.areaId:', formData.areaId)}
              {console.log('Áreas disponibles en render:', areas.map(a => ({ id: a.id, name: a.name })))}
              <option value="">
                {formData.role === ROLES.ADMIN ? 'Sin área asignada' : 'Seleccionar área'}
              </option>
              {Array.isArray(areas) && areas.length > 0 ? (
                areas.map((area) => {
                  const isSelected = area.id === formData.areaId;
                  console.log(`Opción ${area.name}: value="${area.id}", selected=${isSelected}`);
                  return (
                    <option key={area.id} value={area.id} selected={isSelected}>
                      {area.name}
                    </option>
                  );
                })
              ) : (
                !loadingAreas && (
                  <option value="" disabled>
                    No hay áreas disponibles
                  </option>
                )
              )}
            </select>
            {loadingAreas && (
              <p className="text-sm text-gray-500">Cargando áreas...</p>
            )}
            {errors.areaId && (
              <p className="text-sm text-red-600">{errors.areaId}</p>
            )}
          </div>
        </div>

        {!user && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              name="password"
              label="Contraseña"
              type="password"
              value={formData.password}
              onChange={handleChange}
              error={errors.password}
              required
              placeholder="••••••••"
            />

            <Input
              name="confirmPassword"
              label="Confirmar contraseña"
              type="password"
              value={formData.confirmPassword}
              onChange={handleChange}
              error={errors.confirmPassword}
              required
              placeholder="••••••••"
            />
          </div>
        )}

        <div className="flex justify-end space-x-2 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={loading}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            disabled={loading}
          >
            {loading ? 'Guardando...' : user ? 'Actualizar' : 'Crear'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default UserForm;