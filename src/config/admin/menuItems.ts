export const MENU_ITEMS = [
  { 
    key: 'inicio', 
    label: 'Inicio', // Título para el Sidebar
    pageTitle: 'Panel Principal', // Título para el Header (opcional, si quieres que sea distinto)
    href: '/admin/dashboard', 
    icon: 'fas fa-home', 
    allowedRoles: ['admin', 'recepcionista'] 
  },
  { 
    key: 'tienda', 
    label: 'Tienda', 
    href: '/admin/tienda', 
    icon: 'fas fa-store', 
    allowedRoles: ['admin'] 
  },
  { 
    key: 'clases', 
    label: 'Clases', 
    href: '/admin/clases', 
    icon: 'fas fa-graduation-cap', 
    allowedRoles: ['admin', 'recepcionista'] 
  },
  { 
    key: 'xv-anos', 
    label: 'XV Años', 
    pageTitle: 'Gestión de XV Años',
    href: '/admin/xv-anos', 
    icon: 'fas fa-crown', 
    allowedRoles: ['admin'] 
  },
  { 
    key: 'usuarios', 
    label: 'Usuarios', 
    pageTitle: 'Directorio de Usuarios',
    href: '/admin/usuarios', 
    icon: 'fas fa-users', 
    allowedRoles: ['admin', 'recepcionista'] 
  },
  { 
    key: 'cumpleanos', 
    label: 'Cumpleaños', 
    href: '/admin/cumpleanos', 
    icon: 'fas fa-birthday-cake', 
    allowedRoles: ['admin', 'recepcionista'] 
  },
  { 
    key: 'alta-usuario', 
    label: 'Alta Usuario', 
    href: '/admin/alta-usuario', 
    icon: 'fas fa-user-plus', 
    allowedRoles: ['admin', 'recepcionista'] 
  },
  { 
    key: 'paquetes', 
    label: 'Planes', 
    href: '/admin/paquetes', 
    icon: 'fas fa-box', 
    allowedRoles: ['admin'] 
  },
  { 
    key: 'insignias', 
    label: 'Insignias', 
    href: '/admin/insignias', 
    icon: 'fas fa-trophy', 
    allowedRoles: ['admin'] 
  },
  { 
    key: 'niveles', 
    label: 'Niveles', 
    href: '/admin/niveles', 
    icon: 'fas fa-layer-group', 
    allowedRoles: ['admin'],
    hidden: true
  },
  { 
    key: 'adeudos', 
    label: 'Adeudos', 
    href: '/admin/adeudos', 
    icon: 'fas fa-file-invoice-dollar', 
    allowedRoles: ['admin', 'recepcionista'] 
  },
  { 
    key: 'movimientos', 
    label: 'Movimientos', 
    href: '/admin/consultas', 
    icon: 'fas fa-wallet', 
    allowedRoles: ['admin', 'recepcionista'] 
  },
  { 
    key: 'estadisticas', 
    label: 'Estadísticas', 
    href: '/admin/estadisticas', 
    icon: 'fas fa-chart-line', 
    allowedRoles: ['admin'] 
  },
  { 
    key: 'comunidad', 
    label: 'Comunidad', 
    href: '/admin/comunidad', 
    icon: 'fas fa-users', 
    allowedRoles: ['admin', 'recepcionista'] 
  },
];