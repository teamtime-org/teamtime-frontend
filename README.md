# TeamTime Frontend

**TeamTime Frontend** es una aplicación web de gestión de tiempo y productividad para equipos, construida como una Single Page Application (SPA) moderna con React y Vite.

## 🚀 Descripción del Proyecto

TeamTime es una plataforma integral para la gestión de tiempo de trabajo y análisis de productividad de equipos. La aplicación permite:

- ⏰ **Seguimiento de Tiempo**: Registro y monitoreo de horas de trabajo en tiempo real
- 📊 **Visualización de Datos**: Dashboards interactivos con métricas de productividad
- 📈 **Reportes Avanzados**: Generación y exportación de reportes detallados
- 👥 **Gestión de Equipos**: Colaboración y seguimiento de proyectos grupales
- 📱 **Interfaz Responsiva**: Diseño moderno y adaptable a todos los dispositivos

## 🛠️ Stack Tecnológico

### Frontend Framework
- **React 19.1.1** - Framework principal de JavaScript para interfaces de usuario
- **Vite 7.1.3** - Herramienta de build moderna con Hot Module Replacement (HMR)

### Estilos y UI
- **Tailwind CSS 3.4.17** - Framework CSS utility-first
- **Headless UI 2.2.0** - Componentes UI accesibles
- **Heroicons 2.2.0** - Iconos SVG profesionales
- **Lucide React 0.468.0** - Biblioteca adicional de iconos

### Gestión de Estado y Formularios
- **React Hook Form 7.54.3** - Manejo performante de formularios
- **Yup 1.6.1** - Validación de esquemas
- **Hookform Resolvers 3.9.1** - Integración Yup + React Hook Form

### Navegación
- **React Router DOM 7.1.1** - Enrutamiento SPA

### Visualización de Datos
- **Chart.js 4.4.7** - Biblioteca de gráficos JavaScript
- **React Chart.js 2 5.2.0** - Wrapper React para Chart.js
- **Chartjs Plugin Datalabels 2.2.0** - Etiquetas de datos en gráficos

### Comunicación y Utilidades
- **Axios 1.7.9** - Cliente HTTP para APIs
- **Date-fns 4.1.0** - Manipulación moderna de fechas
- **CLSX 2.1.1** - Construcción condicional de clases CSS

### Exportación de Datos
- **jsPDF 3.0.2** - Generación de documentos PDF
- **html2canvas 1.4.1** - Captura de elementos HTML
- **XLSX 0.18.5** - Manejo de archivos Excel
- **File-saver 2.0.5** - Descarga de archivos

### Herramientas de Desarrollo
- **ESLint 9.18.0** - Linter para JavaScript/React
- **PostCSS 8.5.2** - Procesador CSS
- **Autoprefixer 10.4.20** - Prefijos CSS automáticos

## 🚀 Instalación y Configuración

### Prerrequisitos
- Node.js (versión 18 o superior)
- npm o yarn

### Pasos de instalación

1. **Clonar el repositorio**
```bash
git clone https://github.com/teamtime-org/teamtime-frontend.git
cd teamtime-frontend
```

2. **Instalar dependencias**
```bash
npm install
```

3. **Configurar variables de entorno**
```bash
# Crear archivo .env.local con las configuraciones necesarias
cp .env.example .env.local
```

4. **Ejecutar en modo desarrollo**
```bash
npm run dev
```

La aplicación estará disponible en `http://localhost:5173`

## 📜 Scripts Disponibles

- `npm run dev` - Inicia el servidor de desarrollo
- `npm run build` - Construye la aplicación para producción
- `npm run preview` - Vista previa de la build de producción
- `npm run lint` - Ejecuta ESLint para verificar el código

## 🏗️ Estructura del Proyecto

```
src/
├── components/          # Componentes reutilizables
├── pages/              # Páginas de la aplicación
├── hooks/              # Custom hooks
├── utils/              # Funciones utilitarias
├── services/           # Servicios API
├── assets/             # Recursos estáticos
└── styles/             # Estilos globales
```

## 🌐 Configuración de Despliegue

La aplicación está configurada para despliegue en GitHub Pages con las siguientes características:

- **Base URL**: `/teamtime-frontend/` en producción
- **Proxy API**: Configurado para comunicarse con el backend en `localhost:3000`
- **SPA Routing**: Soporte para rutas del lado del cliente

## 🔗 Enlaces Relacionados

- **Backend**: [TeamTime Backend](https://github.com/teamtime-org/teamtime-backend)
- **Organización**: [TeamTime Org](https://github.com/teamtime-org)

## 🤝 Contribución

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT - ver el archivo [LICENSE](LICENSE) para más detalles.

---

**TeamTime** - Optimizando la productividad de equipos, un proyecto a la vez. 🚀