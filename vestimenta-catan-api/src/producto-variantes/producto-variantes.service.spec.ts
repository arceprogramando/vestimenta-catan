import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { ProductoVariantesService } from './producto-variantes.service';
import { PrismaService } from '../prisma/prisma.service';

describe('ProductoVariantesService', () => {
  let service: ProductoVariantesService;

  const mockVariante = {
    id: BigInt(1),
    producto_id: 1,
    color_id: BigInt(1),
    talle_id: BigInt(1),
    cantidad: 10,
    is_active: true,
    created_at: new Date(),
    updated_at: new Date(),
    producto: {
      id: 1,
      nombre: 'Campera',
      descripcion: 'Descripción',
      genero: 'hombre',
      thumbnail: 'url',
    },
    color: { id: BigInt(1), nombre: 'Negro' },
    talle: { id: BigInt(1), nombre: 'M', orden: 2 },
  };

  const mockPrismaService = {
    producto_variantes: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductoVariantesService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<ProductoVariantesService>(ProductoVariantesService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // =============================================
  // Tests para create()
  // =============================================
  describe('create', () => {
    it('should create a new variante', async () => {
      const createDto = {
        producto_id: 1,
        color_id: 1,
        talle_id: 1,
        cantidad: 5,
      };
      mockPrismaService.producto_variantes.create.mockResolvedValue(
        mockVariante,
      );

      const result = await service.create(createDto);

      expect(result.producto_id).toBe(1);
      expect(typeof result.id).toBe('number');
    });

    it('should create variante without talle', async () => {
      const createDto = {
        producto_id: 1,
        color_id: 1,
        cantidad: 5,
      };
      mockPrismaService.producto_variantes.create.mockResolvedValue({
        ...mockVariante,
        talle_id: null,
        talle: null,
      });

      const result = await service.create(createDto);

      expect(result.talle_id).toBeNull();
    });
  });

  // =============================================
  // Tests para findAll()
  // =============================================
  describe('findAll', () => {
    it('should return only active variantes by default', async () => {
      mockPrismaService.producto_variantes.findMany.mockResolvedValue([
        mockVariante,
      ]);

      const result = await service.findAll();

      expect(
        mockPrismaService.producto_variantes.findMany,
      ).toHaveBeenCalledWith({
        where: { is_active: true },
        include: expect.any(Object),
        orderBy: { created_at: 'desc' },
      });
      expect(result).toHaveLength(1);
    });

    it('should include deleted when specified', async () => {
      mockPrismaService.producto_variantes.findMany.mockResolvedValue([]);

      await service.findAll(true);

      expect(
        mockPrismaService.producto_variantes.findMany,
      ).toHaveBeenCalledWith({
        where: undefined,
        include: expect.any(Object),
        orderBy: { created_at: 'desc' },
      });
    });
  });

  // =============================================
  // Tests para findByProducto()
  // =============================================
  describe('findByProducto', () => {
    it('should return variantes for a specific product', async () => {
      mockPrismaService.producto_variantes.findMany.mockResolvedValue([
        mockVariante,
      ]);

      const result = await service.findByProducto(1);

      expect(
        mockPrismaService.producto_variantes.findMany,
      ).toHaveBeenCalledWith({
        where: { producto_id: 1, is_active: true },
        include: expect.any(Object),
        orderBy: expect.any(Array),
      });
      expect(result).toHaveLength(1);
    });
  });

  // =============================================
  // Tests para findOne()
  // =============================================
  describe('findOne', () => {
    it('should return a variante by id', async () => {
      mockPrismaService.producto_variantes.findUnique.mockResolvedValue(
        mockVariante,
      );

      const result = await service.findOne(1);

      expect(result).toBeDefined();
      expect(result?.id).toBe(1);
    });

    it('should return null if not found', async () => {
      mockPrismaService.producto_variantes.findUnique.mockResolvedValue(null);

      const result = await service.findOne(999);

      expect(result).toBeNull();
    });
  });

  // =============================================
  // Tests para update()
  // =============================================
  describe('update', () => {
    it('should update variante successfully', async () => {
      mockPrismaService.producto_variantes.findUnique.mockResolvedValue(
        mockVariante,
      );
      mockPrismaService.producto_variantes.update.mockResolvedValue({
        ...mockVariante,
        cantidad: 20,
      });

      const result = await service.update(1, { cantidad: 20 });

      expect(result.cantidad).toBe(20);
    });

    it('should throw NotFoundException if variante not found', async () => {
      mockPrismaService.producto_variantes.findUnique.mockResolvedValue(null);

      await expect(service.update(999, { cantidad: 5 })).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  // =============================================
  // Tests para updateStock()
  // =============================================
  describe('updateStock', () => {
    it('should update stock successfully', async () => {
      mockPrismaService.producto_variantes.findUnique.mockResolvedValue(
        mockVariante,
      );
      mockPrismaService.producto_variantes.update.mockResolvedValue({
        ...mockVariante,
        cantidad: 15,
      });

      const result = await service.updateStock(1, 15);

      expect(result.cantidad).toBe(15);
    });

    it('should throw NotFoundException if variante not found', async () => {
      mockPrismaService.producto_variantes.findUnique.mockResolvedValue(null);

      await expect(service.updateStock(999, 10)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  // =============================================
  // Tests para remove()
  // =============================================
  describe('remove', () => {
    it('should soft delete variante', async () => {
      mockPrismaService.producto_variantes.findUnique.mockResolvedValue(
        mockVariante,
      );
      mockPrismaService.producto_variantes.update.mockResolvedValue({
        ...mockVariante,
        is_active: false,
      });

      const result = await service.remove(1, {
        deleted_by: 'admin',
        delete_reason: 'Test',
      });

      expect(result.is_active).toBe(false);
    });

    it('should throw NotFoundException if variante not found', async () => {
      mockPrismaService.producto_variantes.findUnique.mockResolvedValue(null);

      await expect(service.remove(999)).rejects.toThrow(NotFoundException);
    });
  });

  // =============================================
  // Tests para restore()
  // =============================================
  describe('restore', () => {
    it('should restore a deleted variante', async () => {
      mockPrismaService.producto_variantes.findUnique.mockResolvedValue({
        ...mockVariante,
        is_active: false,
      });
      mockPrismaService.producto_variantes.update.mockResolvedValue(
        mockVariante,
      );

      const result = await service.restore(1);

      expect(result.is_active).toBe(true);
    });

    it('should throw NotFoundException if variante not found', async () => {
      mockPrismaService.producto_variantes.findUnique.mockResolvedValue(null);

      await expect(service.restore(999)).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if variante is already active', async () => {
      mockPrismaService.producto_variantes.findUnique.mockResolvedValue(
        mockVariante,
      );

      await expect(service.restore(1)).rejects.toThrow(BadRequestException);
    });
  });

  // =============================================
  // Tests para serialización
  // =============================================
  describe('serialization', () => {
    it('should convert BigInt to Number in response', async () => {
      mockPrismaService.producto_variantes.findUnique.mockResolvedValue(
        mockVariante,
      );

      const result = await service.findOne(1);

      expect(typeof result?.id).toBe('number');
      expect(typeof result?.color_id).toBe('number');
      expect(typeof result?.talle_id).toBe('number');
      expect(typeof result?.color?.id).toBe('number');
      expect(typeof result?.talle?.id).toBe('number');
    });
  });
});
