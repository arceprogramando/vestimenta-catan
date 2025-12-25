import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { TallesService } from './talles.service';
import { PrismaService } from '../prisma/prisma.service';

describe('TallesService', () => {
  let service: TallesService;

  const mockTalle = {
    id: BigInt(1),
    nombre: 'M',
    orden: 2,
    is_active: true,
    created_at: new Date(),
    updated_at: new Date(),
    deleted_at: null,
    deleted_by: null,
    delete_reason: null,
  };

  const mockPrismaService = {
    talles: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TallesService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<TallesService>(TallesService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // =============================================
  // Tests para create()
  // =============================================
  describe('create', () => {
    it('should create a new talle', async () => {
      const createDto = { nombre: 'L', orden: 3 };
      mockPrismaService.talles.create.mockResolvedValue({
        ...mockTalle,
        ...createDto,
      });

      const result = await service.create(createDto);

      expect(result.nombre).toBe('L');
      expect(typeof result.id).toBe('number');
    });
  });

  // =============================================
  // Tests para findAll()
  // =============================================
  describe('findAll', () => {
    it('should return only active talles by default', async () => {
      mockPrismaService.talles.findMany.mockResolvedValue([mockTalle]);

      const result = await service.findAll();

      expect(mockPrismaService.talles.findMany).toHaveBeenCalledWith({
        where: { is_active: true },
        orderBy: [{ orden: 'asc' }, { nombre: 'asc' }],
      });
      expect(result).toHaveLength(1);
    });

    it('should include deleted when specified', async () => {
      mockPrismaService.talles.findMany.mockResolvedValue([]);

      await service.findAll(true);

      expect(mockPrismaService.talles.findMany).toHaveBeenCalledWith({
        where: undefined,
        orderBy: [{ orden: 'asc' }, { nombre: 'asc' }],
      });
    });
  });

  // =============================================
  // Tests para findOne()
  // =============================================
  describe('findOne', () => {
    it('should return a talle with variants', async () => {
      mockPrismaService.talles.findUnique.mockResolvedValue({
        ...mockTalle,
        producto_variantes: [],
      });

      const result = await service.findOne(1);

      expect(result).toBeDefined();
      expect(result?.nombre).toBe('M');
    });

    it('should return null if not found', async () => {
      mockPrismaService.talles.findUnique.mockResolvedValue(null);

      const result = await service.findOne(999);

      expect(result).toBeNull();
    });
  });

  // =============================================
  // Tests para update()
  // =============================================
  describe('update', () => {
    it('should update talle successfully', async () => {
      mockPrismaService.talles.findUnique.mockResolvedValue({
        ...mockTalle,
        producto_variantes: [],
      });
      mockPrismaService.talles.update.mockResolvedValue({
        ...mockTalle,
        nombre: 'XL',
      });

      const result = await service.update(1, { nombre: 'XL' });

      expect(result.nombre).toBe('XL');
    });

    it('should throw NotFoundException if talle not found', async () => {
      mockPrismaService.talles.findUnique.mockResolvedValue(null);

      await expect(service.update(999, { nombre: 'Test' })).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  // =============================================
  // Tests para remove()
  // =============================================
  describe('remove', () => {
    it('should soft delete talle', async () => {
      mockPrismaService.talles.findUnique.mockResolvedValue({
        ...mockTalle,
        producto_variantes: [],
      });
      mockPrismaService.talles.update.mockResolvedValue({
        ...mockTalle,
        is_active: false,
      });

      const result = await service.remove(1, {
        deleted_by: 'admin',
        delete_reason: 'Test',
      });

      expect(result.is_active).toBe(false);
    });

    it('should throw NotFoundException if talle not found', async () => {
      mockPrismaService.talles.findUnique.mockResolvedValue(null);

      await expect(service.remove(999)).rejects.toThrow(NotFoundException);
    });
  });

  // =============================================
  // Tests para restore()
  // =============================================
  describe('restore', () => {
    it('should restore a deleted talle', async () => {
      mockPrismaService.talles.findUnique.mockResolvedValue({
        ...mockTalle,
        is_active: false,
      });
      mockPrismaService.talles.update.mockResolvedValue({
        ...mockTalle,
        is_active: true,
      });

      const result = await service.restore(1);

      expect(result.is_active).toBe(true);
    });

    it('should throw NotFoundException if talle not found', async () => {
      mockPrismaService.talles.findUnique.mockResolvedValue(null);

      await expect(service.restore(999)).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if talle is already active', async () => {
      mockPrismaService.talles.findUnique.mockResolvedValue(mockTalle);

      await expect(service.restore(1)).rejects.toThrow(BadRequestException);
    });
  });
});
