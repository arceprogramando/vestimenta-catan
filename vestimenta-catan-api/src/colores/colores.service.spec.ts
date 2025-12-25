import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { ColoresService } from './colores.service';
import { PrismaService } from '../prisma/prisma.service';

describe('ColoresService', () => {
  let service: ColoresService;

  const mockColor = {
    id: BigInt(1),
    nombre: 'Negro',
    codigo_hex: '#000000',
    is_active: true,
    created_at: new Date(),
    updated_at: new Date(),
    deleted_at: null,
    deleted_by: null,
    delete_reason: null,
  };

  const mockPrismaService = {
    colores: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ColoresService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<ColoresService>(ColoresService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // =============================================
  // Tests para create()
  // =============================================
  describe('create', () => {
    it('should create a new color', async () => {
      const createDto = { nombre: 'Rojo', codigo_hex: '#FF0000' };
      mockPrismaService.colores.create.mockResolvedValue({
        ...mockColor,
        ...createDto,
      });

      const result = await service.create(createDto);

      expect(result.nombre).toBe('Rojo');
      expect(typeof result.id).toBe('number');
    });
  });

  // =============================================
  // Tests para findAll()
  // =============================================
  describe('findAll', () => {
    it('should return only active colors by default', async () => {
      mockPrismaService.colores.findMany.mockResolvedValue([mockColor]);

      const result = await service.findAll();

      expect(mockPrismaService.colores.findMany).toHaveBeenCalledWith({
        where: { is_active: true },
        orderBy: { nombre: 'asc' },
      });
      expect(result).toHaveLength(1);
      expect(typeof result[0].id).toBe('number');
    });

    it('should include deleted when specified', async () => {
      mockPrismaService.colores.findMany.mockResolvedValue([]);

      await service.findAll(true);

      expect(mockPrismaService.colores.findMany).toHaveBeenCalledWith({
        where: undefined,
        orderBy: { nombre: 'asc' },
      });
    });
  });

  // =============================================
  // Tests para findOne()
  // =============================================
  describe('findOne', () => {
    it('should return a color with variants', async () => {
      mockPrismaService.colores.findUnique.mockResolvedValue({
        ...mockColor,
        producto_variantes: [],
      });

      const result = await service.findOne(1);

      expect(result).toBeDefined();
      expect(result?.nombre).toBe('Negro');
    });

    it('should return null if not found', async () => {
      mockPrismaService.colores.findUnique.mockResolvedValue(null);

      const result = await service.findOne(999);

      expect(result).toBeNull();
    });
  });

  // =============================================
  // Tests para update()
  // =============================================
  describe('update', () => {
    it('should update color successfully', async () => {
      mockPrismaService.colores.findUnique.mockResolvedValue({
        ...mockColor,
        producto_variantes: [],
      });
      mockPrismaService.colores.update.mockResolvedValue({
        ...mockColor,
        nombre: 'Gris',
      });

      const result = await service.update(1, { nombre: 'Gris' });

      expect(result.nombre).toBe('Gris');
    });

    it('should throw NotFoundException if color not found', async () => {
      mockPrismaService.colores.findUnique.mockResolvedValue(null);

      await expect(service.update(999, { nombre: 'Test' })).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  // =============================================
  // Tests para remove()
  // =============================================
  describe('remove', () => {
    it('should soft delete color', async () => {
      mockPrismaService.colores.findUnique.mockResolvedValue({
        ...mockColor,
        producto_variantes: [],
      });
      mockPrismaService.colores.update.mockResolvedValue({
        ...mockColor,
        is_active: false,
      });

      const result = await service.remove(1, {
        deleted_by: 'admin',
        delete_reason: 'Test',
      });

      expect(result.is_active).toBe(false);
    });

    it('should throw NotFoundException if color not found', async () => {
      mockPrismaService.colores.findUnique.mockResolvedValue(null);

      await expect(service.remove(999)).rejects.toThrow(NotFoundException);
    });
  });

  // =============================================
  // Tests para restore()
  // =============================================
  describe('restore', () => {
    it('should restore a deleted color', async () => {
      mockPrismaService.colores.findUnique.mockResolvedValue({
        ...mockColor,
        is_active: false,
      });
      mockPrismaService.colores.update.mockResolvedValue({
        ...mockColor,
        is_active: true,
      });

      const result = await service.restore(1);

      expect(result.is_active).toBe(true);
    });

    it('should throw NotFoundException if color not found', async () => {
      mockPrismaService.colores.findUnique.mockResolvedValue(null);

      await expect(service.restore(999)).rejects.toThrow(NotFoundException);
    });

    it('should throw error if color is already active', async () => {
      mockPrismaService.colores.findUnique.mockResolvedValue(mockColor);

      await expect(service.restore(1)).rejects.toThrow(
        'El color no está eliminado',
      );
    });
  });
});
