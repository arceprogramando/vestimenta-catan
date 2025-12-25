import { Test, TestingModule } from '@nestjs/testing';
import { ProductosService } from './productos.service';
import { PrismaService } from '../prisma/prisma.service';

describe('ProductosService', () => {
  let service: ProductosService;

  // Mock de producto
  const mockProducto = {
    id: 1,
    nombre: 'Campera Térmica',
    genero: 'hombre',
    descripcion: 'Campera térmica para invierno',
    thumbnail: 'https://example.com/campera.jpg',
    is_active: true,
    created_at: new Date(),
    updated_at: new Date(),
    deleted_at: null,
    deleted_by: null,
    delete_reason: null,
  };

  const mockVariante = {
    id: BigInt(1),
    producto_id: 1,
    color_id: BigInt(1),
    talle_id: BigInt(1),
    cantidad: 10,
    is_active: true,
    color: { id: BigInt(1), nombre: 'Negro', codigo_hex: '#000000' },
    talle: { id: BigInt(1), nombre: 'M', orden: 2 },
  };

  const mockPrismaService = {
    productos: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    producto_variantes: {
      findMany: jest.fn(),
      updateMany: jest.fn(),
    },
    reservas: {
      updateMany: jest.fn(),
    },
    $queryRaw: jest.fn(),
    $transaction: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductosService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<ProductosService>(ProductosService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // =============================================
  // Tests para create()
  // =============================================
  describe('create', () => {
    const createDto = {
      nombre: 'Nueva Campera',
      genero: 'mujer',
      descripcion: 'Descripción',
      thumbnail: 'https://example.com/new.jpg',
    };

    it('should create a new product', async () => {
      mockPrismaService.productos.create.mockResolvedValue({
        id: 2,
        ...createDto,
        is_active: true,
      });

      const result = await service.create(createDto);

      expect(mockPrismaService.productos.create).toHaveBeenCalledWith({
        data: createDto,
      });
      expect(result.nombre).toBe(createDto.nombre);
    });
  });

  // =============================================
  // Tests para findAll()
  // =============================================
  describe('findAll', () => {
    it('should return only active products by default', async () => {
      mockPrismaService.productos.findMany.mockResolvedValue([mockProducto]);

      const result = await service.findAll();

      expect(mockPrismaService.productos.findMany).toHaveBeenCalledWith({
        where: { is_active: true },
        orderBy: { nombre: 'asc' },
      });
      expect(result).toHaveLength(1);
    });

    it('should include deleted products when includeDeleted is true', async () => {
      mockPrismaService.productos.findMany.mockResolvedValue([mockProducto]);

      await service.findAll(true);

      expect(mockPrismaService.productos.findMany).toHaveBeenCalledWith({
        where: undefined,
        orderBy: { nombre: 'asc' },
      });
    });
  });

  // =============================================
  // Tests para findDeleted()
  // =============================================
  describe('findDeleted', () => {
    it('should return only deleted products', async () => {
      const deletedProducto = { ...mockProducto, is_active: false };
      mockPrismaService.productos.findMany.mockResolvedValue([deletedProducto]);

      const result = await service.findDeleted();

      expect(mockPrismaService.productos.findMany).toHaveBeenCalledWith({
        where: { is_active: false },
        orderBy: { deleted_at: 'desc' },
      });
      expect(result[0].is_active).toBe(false);
    });
  });

  // =============================================
  // Tests para findStockResumen()
  // =============================================
  describe('findStockResumen', () => {
    it('should return stock summary with BigInt converted to Number', async () => {
      const rawResult = [
        {
          id: 1,
          nombre: 'Campera',
          genero: 'hombre',
          descripcion: 'Desc',
          thumbnail: 'url',
          stock_total: BigInt(100),
        },
      ];
      mockPrismaService.$queryRaw.mockResolvedValue(rawResult);

      const result = await service.findStockResumen();

      expect(result[0].stock_total).toBe(100);
      expect(typeof result[0].stock_total).toBe('number');
    });
  });

  // =============================================
  // Tests para findOne()
  // =============================================
  describe('findOne', () => {
    it('should return product with variants', async () => {
      mockPrismaService.productos.findUnique.mockResolvedValue({
        ...mockProducto,
        producto_variantes: [mockVariante],
      });

      const result = await service.findOne(1);

      expect(mockPrismaService.productos.findUnique).toHaveBeenCalledWith({
        where: { id: 1, is_active: true },
        include: expect.any(Object),
      });
      expect(result).toBeDefined();
      expect(result?.nombre).toBe(mockProducto.nombre);
    });

    it('should return null if product not found', async () => {
      mockPrismaService.productos.findUnique.mockResolvedValue(null);

      const result = await service.findOne(999);

      expect(result).toBeNull();
    });

    it('should include deleted products when includeDeleted is true', async () => {
      mockPrismaService.productos.findUnique.mockResolvedValue({
        ...mockProducto,
        producto_variantes: [],
      });

      await service.findOne(1, true);

      expect(mockPrismaService.productos.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
        include: expect.any(Object),
      });
    });
  });

  // =============================================
  // Tests para update()
  // =============================================
  describe('update', () => {
    const updateDto = { nombre: 'Campera Actualizada' };

    it('should update product successfully', async () => {
      mockPrismaService.productos.findUnique.mockResolvedValue({
        ...mockProducto,
        producto_variantes: [],
      });
      mockPrismaService.productos.update.mockResolvedValue({
        ...mockProducto,
        ...updateDto,
      });

      const result = await service.update(1, updateDto);

      expect(result.nombre).toBe(updateDto.nombre);
    });

    it('should throw error if product not found', async () => {
      mockPrismaService.productos.findUnique.mockResolvedValue(null);

      await expect(service.update(999, updateDto)).rejects.toThrow(
        'Producto no encontrado o fue eliminado',
      );
    });
  });

  // =============================================
  // Tests para remove() - Soft Delete
  // =============================================
  describe('remove', () => {
    it('should soft delete product and related entities', async () => {
      mockPrismaService.productos.findUnique.mockResolvedValue({
        ...mockProducto,
        producto_variantes: [],
      });

      const deletedProduct = { ...mockProducto, is_active: false };
      mockPrismaService.$transaction.mockImplementation(
        (
          callback: (tx: {
            productos: { update: jest.Mock };
            producto_variantes: { updateMany: jest.Mock; findMany: jest.Mock };
            reservas: { updateMany: jest.Mock };
          }) => Promise<typeof deletedProduct>,
        ) => {
          return callback({
            productos: { update: jest.fn().mockResolvedValue(deletedProduct) },
            producto_variantes: {
              updateMany: jest.fn().mockResolvedValue({ count: 2 }),
              findMany: jest.fn().mockResolvedValue([{ id: BigInt(1) }]),
            },
            reservas: { updateMany: jest.fn().mockResolvedValue({ count: 1 }) },
          });
        },
      );

      const result = await service.remove(1, {
        deleted_by: 'admin',
        delete_reason: 'Test',
      });

      expect(result.is_active).toBe(false);
    });

    it('should throw error if product not found', async () => {
      mockPrismaService.productos.findUnique.mockResolvedValue(null);

      await expect(service.remove(999)).rejects.toThrow(
        'Producto no encontrado o ya fue eliminado',
      );
    });
  });

  // =============================================
  // Tests para restore()
  // =============================================
  describe('restore', () => {
    it('should restore a deleted product', async () => {
      const deletedProduct = { ...mockProducto, is_active: false };
      mockPrismaService.productos.findUnique.mockResolvedValue(deletedProduct);
      mockPrismaService.productos.update.mockResolvedValue({
        ...mockProducto,
        is_active: true,
      });

      const result = await service.restore(1);

      expect(result.is_active).toBe(true);
      expect(mockPrismaService.productos.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: expect.objectContaining({
          is_active: true,
          deleted_at: null,
          deleted_by: null,
          delete_reason: null,
        }),
      });
    });

    it('should throw error if product not found', async () => {
      mockPrismaService.productos.findUnique.mockResolvedValue(null);

      await expect(service.restore(999)).rejects.toThrow(
        'Producto no encontrado',
      );
    });

    it('should throw error if product is already active', async () => {
      mockPrismaService.productos.findUnique.mockResolvedValue(mockProducto);

      await expect(service.restore(1)).rejects.toThrow(
        'El producto no está eliminado',
      );
    });
  });

  // =============================================
  // Tests para getAuditLog()
  // =============================================
  describe('getAuditLog', () => {
    it('should return audit information for product', async () => {
      const auditData = {
        id: 1,
        nombre: 'Campera',
        created_at: new Date(),
        updated_at: new Date(),
        deleted_at: null,
        is_active: true,
        deleted_by: null,
        delete_reason: null,
      };
      mockPrismaService.productos.findUnique.mockResolvedValue(auditData);

      const result = await service.getAuditLog(1);

      expect(result).toEqual(auditData);
      expect(mockPrismaService.productos.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
        select: expect.objectContaining({
          id: true,
          nombre: true,
          created_at: true,
        }),
      });
    });
  });
});
