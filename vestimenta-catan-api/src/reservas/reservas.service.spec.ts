import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { ReservasService } from './reservas.service';
import { PrismaService } from '../prisma/prisma.service';

describe('ReservasService', () => {
  let service: ReservasService;

  // Mock de Decimal (Prisma usa Decimal para precios)
  const createDecimal = (value: number) => ({
    toNumber: () => value,
    toString: () => value.toString(),
  });

  // Mock de variante con producto
  const mockVariante = {
    id: BigInt(1),
    producto_id: 1,
    color_id: BigInt(1),
    talle_id: BigInt(1),
    cantidad: 10,
    is_active: true,
    producto: {
      id: 1,
      nombre: 'Campera',
      descripcion: 'Descripción',
      genero: 'hombre',
      thumbnail: 'url',
      precio: createDecimal(1500),
    },
    talle: { id: BigInt(1), nombre: 'M', orden: 2 },
    color: { id: BigInt(1), nombre: 'Negro' },
  };

  // Mock de reserva
  const mockReserva = {
    id: BigInt(1),
    variante_id: BigInt(1),
    usuario_id: BigInt(1),
    cantidad: 2,
    estado: 'pendiente',
    fecha_reserva: new Date(),
    notas: 'Nota de prueba',
    telefono_contacto: '1234567890',
    precio_unitario: createDecimal(1500),
    precio_total: createDecimal(3000),
    fecha_confirmacion: null,
    confirmado_por: null,
    fecha_cancelacion: null,
    cancelado_por: null,
    motivo_cancelacion: null,
    created_at: new Date(),
    updated_at: new Date(),
    is_active: true,
    variante: mockVariante,
    usuario: {
      id: BigInt(1),
      email: 'test@example.com',
      nombre: 'Test',
      apellido: 'User',
    },
  };

  const mockPrismaService = {
    producto_variantes: {
      findUnique: jest.fn(),
    },
    reservas: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReservasService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<ReservasService>(ReservasService);
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
      variante_id: 1,
      usuario_id: 1,
      cantidad: 2,
      notas: 'Nota de prueba',
      telefono_contacto: '1234567890',
    };

    it('should create a reservation successfully', async () => {
      mockPrismaService.producto_variantes.findUnique.mockResolvedValue(
        mockVariante,
      );
      mockPrismaService.reservas.create.mockResolvedValue(mockReserva);

      const result = await service.create(createDto);

      expect(result.id).toBe(1);
      expect(result.cantidad).toBe(2);
      expect(result.precio_total).toBe(3000);
    });

    it('should throw NotFoundException if variant not found', async () => {
      mockPrismaService.producto_variantes.findUnique.mockResolvedValue(null);

      await expect(service.create(createDto)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw BadRequestException if insufficient stock', async () => {
      mockPrismaService.producto_variantes.findUnique.mockResolvedValue({
        ...mockVariante,
        cantidad: 1, // Solo 1 disponible
      });

      await expect(
        service.create({ ...createDto, cantidad: 5 }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  // =============================================
  // Tests para findAll()
  // =============================================
  describe('findAll', () => {
    it('should return all active reservations', async () => {
      mockPrismaService.reservas.findMany.mockResolvedValue([mockReserva]);

      const result = await service.findAll();

      expect(mockPrismaService.reservas.findMany).toHaveBeenCalledWith({
        where: { is_active: true },
        include: expect.any(Object),
        orderBy: { fecha_reserva: 'desc' },
      });
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe(1);
    });

    it('should include deleted when specified', async () => {
      mockPrismaService.reservas.findMany.mockResolvedValue([]);

      await service.findAll(true);

      expect(mockPrismaService.reservas.findMany).toHaveBeenCalledWith({
        where: undefined,
        include: expect.any(Object),
        orderBy: { fecha_reserva: 'desc' },
      });
    });
  });

  // =============================================
  // Tests para findByUsuario()
  // =============================================
  describe('findByUsuario', () => {
    it('should return reservations for a specific user', async () => {
      mockPrismaService.reservas.findMany.mockResolvedValue([mockReserva]);

      const result = await service.findByUsuario(1);

      expect(mockPrismaService.reservas.findMany).toHaveBeenCalledWith({
        where: {
          usuario_id: BigInt(1),
          is_active: true,
        },
        include: expect.any(Object),
        orderBy: { fecha_reserva: 'desc' },
      });
      expect(result).toHaveLength(1);
    });
  });

  // =============================================
  // Tests para findOne()
  // =============================================
  describe('findOne', () => {
    it('should return a reservation by id', async () => {
      mockPrismaService.reservas.findUnique.mockResolvedValue(mockReserva);

      const result = await service.findOne(1);

      expect(result).toBeDefined();
      expect(result?.id).toBe(1);
    });

    it('should return null if not found', async () => {
      mockPrismaService.reservas.findUnique.mockResolvedValue(null);

      const result = await service.findOne(999);

      expect(result).toBeNull();
    });
  });

  // =============================================
  // Tests para update()
  // =============================================
  describe('update', () => {
    it('should update reservation successfully', async () => {
      mockPrismaService.reservas.findUnique.mockResolvedValue(mockReserva);
      mockPrismaService.reservas.update.mockResolvedValue({
        ...mockReserva,
        notas: 'Nota actualizada',
      });

      const result = await service.update(1, { notas: 'Nota actualizada' });

      expect(result.notas).toBe('Nota actualizada');
    });

    it('should throw NotFoundException if reservation not found', async () => {
      mockPrismaService.reservas.findUnique.mockResolvedValue(null);

      await expect(service.update(999, { notas: 'Test' })).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should set confirmation data when confirming', async () => {
      mockPrismaService.reservas.findUnique.mockResolvedValue(mockReserva);
      mockPrismaService.reservas.update.mockResolvedValue({
        ...mockReserva,
        estado: 'confirmado',
        fecha_confirmacion: new Date(),
        confirmado_por: 'admin',
      });

      const result = await service.update(1, { estado: 'confirmado' }, 'admin');

      expect(result.estado).toBe('confirmado');
    });

    it('should set cancellation data when cancelling', async () => {
      mockPrismaService.reservas.findUnique.mockResolvedValue(mockReserva);
      mockPrismaService.reservas.update.mockResolvedValue({
        ...mockReserva,
        estado: 'cancelado',
        fecha_cancelacion: new Date(),
        cancelado_por: 'admin',
        motivo_cancelacion: 'Cliente no disponible',
      });

      const result = await service.update(
        1,
        { estado: 'cancelado', motivo_cancelacion: 'Cliente no disponible' },
        'admin',
      );

      expect(result.estado).toBe('cancelado');
    });
  });

  // =============================================
  // Tests para remove() - Soft Delete
  // =============================================
  describe('remove', () => {
    it('should soft delete reservation', async () => {
      mockPrismaService.reservas.findUnique.mockResolvedValue(mockReserva);
      mockPrismaService.reservas.update.mockResolvedValue({
        ...mockReserva,
        is_active: false,
        deleted_at: new Date(),
      });

      const result = await service.remove(1, {
        deleted_by: 'admin',
        delete_reason: 'Test',
      });

      expect(result.is_active).toBe(false);
    });

    it('should throw NotFoundException if reservation not found', async () => {
      mockPrismaService.reservas.findUnique.mockResolvedValue(null);

      await expect(service.remove(999)).rejects.toThrow(NotFoundException);
    });
  });

  // =============================================
  // Tests para restore()
  // =============================================
  describe('restore', () => {
    it('should restore a deleted reservation', async () => {
      const deletedReserva = { ...mockReserva, is_active: false };
      mockPrismaService.reservas.findUnique.mockResolvedValue(deletedReserva);
      mockPrismaService.reservas.update.mockResolvedValue({
        ...mockReserva,
        is_active: true,
      });

      const result = await service.restore(1);

      expect(result.is_active).toBe(true);
    });

    it('should throw NotFoundException if reservation not found', async () => {
      mockPrismaService.reservas.findUnique.mockResolvedValue(null);

      await expect(service.restore(999)).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if reservation is already active', async () => {
      mockPrismaService.reservas.findUnique.mockResolvedValue(mockReserva);

      await expect(service.restore(1)).rejects.toThrow(BadRequestException);
    });
  });

  // =============================================
  // Tests para serialización
  // =============================================
  describe('serialization', () => {
    it('should convert BigInt to Number in response', async () => {
      mockPrismaService.reservas.findUnique.mockResolvedValue(mockReserva);

      const result = await service.findOne(1);

      expect(typeof result?.id).toBe('number');
      expect(typeof result?.variante_id).toBe('number');
      expect(typeof result?.precio_unitario).toBe('number');
      expect(typeof result?.precio_total).toBe('number');
    });
  });
});
