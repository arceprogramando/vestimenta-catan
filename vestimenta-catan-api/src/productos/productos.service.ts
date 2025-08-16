import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProductoDto } from './dto/create-producto.dto';
import { UpdateProductoDto } from './dto/update-producto.dto';

@Injectable()
export class ProductosService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createProductoDto: CreateProductoDto) {
    return this.prisma.productos.create({
      data: createProductoDto,
    });
  }

  async findAll() {
    const productos = await this.prisma.productos.findMany({
      orderBy: { nombre: 'asc' },
    });

    return productos;
  }

  async findOne(id: number) {
    const producto = await this.prisma.productos.findUnique({
      where: { id },
    });

    return producto;
  }

  async update(id: number, updateProductoDto: UpdateProductoDto) {
    return this.prisma.productos.update({
      where: { id },
      data: updateProductoDto,
    });
  }

  async remove(id: number) {
    return this.prisma.productos.delete({
      where: { id },
    });
  }
}
