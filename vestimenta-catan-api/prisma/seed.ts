import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

// Configurar adapter para Prisma 7
const connectionString = process.env.DATABASE_URL || '';
const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

// Definición de permisos por módulo
const PERMISOS = [
  // Productos
  { codigo: 'productos.ver', nombre: 'Ver productos', modulo: 'productos', descripcion: 'Permite ver el listado y detalle de productos' },
  { codigo: 'productos.crear', nombre: 'Crear productos', modulo: 'productos', descripcion: 'Permite crear nuevos productos' },
  { codigo: 'productos.editar', nombre: 'Editar productos', modulo: 'productos', descripcion: 'Permite modificar productos existentes' },
  { codigo: 'productos.eliminar', nombre: 'Eliminar productos', modulo: 'productos', descripcion: 'Permite eliminar productos (soft delete)' },

  // Categorías (colores y talles)
  { codigo: 'categorias.ver', nombre: 'Ver categorías', modulo: 'categorias', descripcion: 'Permite ver colores y talles' },
  { codigo: 'categorias.crear', nombre: 'Crear categorías', modulo: 'categorias', descripcion: 'Permite crear nuevos colores y talles' },
  { codigo: 'categorias.editar', nombre: 'Editar categorías', modulo: 'categorias', descripcion: 'Permite modificar colores y talles' },
  { codigo: 'categorias.eliminar', nombre: 'Eliminar categorías', modulo: 'categorias', descripcion: 'Permite eliminar colores y talles' },

  // Stock (variantes)
  { codigo: 'stock.ver', nombre: 'Ver stock', modulo: 'stock', descripcion: 'Permite ver el stock de variantes' },
  { codigo: 'stock.editar', nombre: 'Editar stock', modulo: 'stock', descripcion: 'Permite modificar cantidades de stock' },

  // Usuarios
  { codigo: 'usuarios.ver', nombre: 'Ver usuarios', modulo: 'usuarios', descripcion: 'Permite ver el listado de usuarios' },
  { codigo: 'usuarios.editar_rol', nombre: 'Editar rol de usuarios', modulo: 'usuarios', descripcion: 'Permite cambiar el rol de usuarios' },
  { codigo: 'usuarios.activar_desactivar', nombre: 'Activar/Desactivar usuarios', modulo: 'usuarios', descripcion: 'Permite activar o desactivar cuentas de usuario' },

  // Reservas
  { codigo: 'reservas.ver', nombre: 'Ver reservas', modulo: 'reservas', descripcion: 'Permite ver el listado de reservas' },
  { codigo: 'reservas.confirmar', nombre: 'Confirmar reservas', modulo: 'reservas', descripcion: 'Permite confirmar reservas pendientes' },
  { codigo: 'reservas.cancelar', nombre: 'Cancelar reservas', modulo: 'reservas', descripcion: 'Permite cancelar reservas' },
  { codigo: 'reservas.completar', nombre: 'Completar reservas', modulo: 'reservas', descripcion: 'Permite marcar reservas como completadas' },

  // Auditoría
  { codigo: 'auditoria.ver', nombre: 'Ver auditoría', modulo: 'auditoria', descripcion: 'Permite ver el historial de cambios' },
  { codigo: 'auditoria.exportar', nombre: 'Exportar auditoría', modulo: 'auditoria', descripcion: 'Permite exportar logs de auditoría' },

  // Dashboard
  { codigo: 'dashboard.ver', nombre: 'Ver dashboard', modulo: 'dashboard', descripcion: 'Permite ver el panel de estadísticas' },

  // Sistema (solo superadmin)
  { codigo: 'sistema.gestionar_roles', nombre: 'Gestionar roles', modulo: 'sistema', descripcion: 'Permite crear, editar y eliminar roles' },
  { codigo: 'sistema.gestionar_permisos', nombre: 'Gestionar permisos', modulo: 'sistema', descripcion: 'Permite asignar permisos a roles' },
];

// Definición de roles con sus permisos
const ROLES = [
  {
    codigo: 'superadmin',
    nombre: 'Super Administrador',
    descripcion: 'Acceso total al sistema. Puede gestionar roles, permisos y todos los módulos.',
    nivel: 100,
    permisos: PERMISOS.map(p => p.codigo), // Todos los permisos
  },
  {
    codigo: 'admin',
    nombre: 'Administrador',
    descripcion: 'Gestión completa de productos, stock, reservas y usuarios. Sin acceso a configuración de sistema.',
    nivel: 80,
    permisos: [
      'productos.ver', 'productos.crear', 'productos.editar', 'productos.eliminar',
      'categorias.ver', 'categorias.crear', 'categorias.editar', 'categorias.eliminar',
      'stock.ver', 'stock.editar',
      'usuarios.ver', 'usuarios.editar_rol', 'usuarios.activar_desactivar',
      'reservas.ver', 'reservas.confirmar', 'reservas.cancelar', 'reservas.completar',
      'auditoria.ver', 'auditoria.exportar',
      'dashboard.ver',
    ],
  },
  {
    codigo: 'empleado',
    nombre: 'Empleado',
    descripcion: 'Gestión de reservas y visualización de productos/stock. Sin acceso a usuarios ni auditoría.',
    nivel: 50,
    permisos: [
      'productos.ver',
      'categorias.ver',
      'stock.ver',
      'reservas.ver', 'reservas.confirmar', 'reservas.completar',
      'dashboard.ver',
    ],
  },
  {
    codigo: 'user',
    nombre: 'Usuario',
    descripcion: 'Usuario regular. Solo puede ver productos y crear reservas propias.',
    nivel: 10,
    permisos: [], // Sin acceso al panel admin
  },
];

async function main() {
  console.log('🌱 Iniciando seed de permisos y roles...\n');

  // 1. Crear permisos
  console.log('📝 Creando permisos...');
  for (const permiso of PERMISOS) {
    await prisma.permisos.upsert({
      where: { codigo: permiso.codigo },
      update: {
        nombre: permiso.nombre,
        modulo: permiso.modulo,
        descripcion: permiso.descripcion,
      },
      create: permiso,
    });
  }
  console.log(`   ✅ ${PERMISOS.length} permisos creados/actualizados\n`);

  // 2. Crear roles
  console.log('👥 Creando roles...');
  for (const rolData of ROLES) {
    const { permisos: permisoCodigos, ...rolInfo } = rolData;

    // Upsert del rol
    const rol = await prisma.roles.upsert({
      where: { codigo: rolInfo.codigo },
      update: {
        nombre: rolInfo.nombre,
        descripcion: rolInfo.descripcion,
        nivel: rolInfo.nivel,
      },
      create: rolInfo,
    });

    // Obtener IDs de permisos
    const permisosDB = await prisma.permisos.findMany({
      where: { codigo: { in: permisoCodigos } },
      select: { id: true },
    });

    // Eliminar permisos anteriores del rol
    await prisma.rol_permisos.deleteMany({
      where: { rol_id: rol.id },
    });

    // Crear nuevas asociaciones rol-permiso
    if (permisosDB.length > 0) {
      await prisma.rol_permisos.createMany({
        data: permisosDB.map(p => ({
          rol_id: rol.id,
          permiso_id: p.id,
          created_by: 'seed',
        })),
      });
    }

    console.log(`   ✅ Rol "${rol.nombre}" con ${permisosDB.length} permisos`);
  }

  // 3. Actualizar usuario superadmin
  console.log('\n🔑 Configurando superadmin...');
  const superadminRol = await prisma.roles.findUnique({
    where: { codigo: 'superadmin' },
  });

  if (superadminRol) {
    const updated = await prisma.usuarios.updateMany({
      where: { email: 'arceprogramando@gmail.com' },
      data: {
        rol: 'superadmin',
        rol_id: superadminRol.id,
        updated_by: 'seed',
      },
    });

    if (updated.count > 0) {
      console.log('   ✅ Usuario arceprogramando@gmail.com actualizado a superadmin');
    } else {
      console.log('   ⚠️  Usuario arceprogramando@gmail.com no encontrado (se actualizará al registrarse)');
    }
  }

  console.log('\n✨ Seed completado exitosamente!\n');
}

main()
  .catch((e) => {
    console.error('❌ Error en seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
