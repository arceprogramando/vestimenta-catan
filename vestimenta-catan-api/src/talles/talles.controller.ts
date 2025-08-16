import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseIntPipe,
  NotFoundException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBody,
} from '@nestjs/swagger';
import { TallesService } from './talles.service';
import { CreateTalleDto } from './dto/create-talle.dto';
import { UpdateTalleDto } from './dto/update-talle.dto';

@ApiTags('talles')
@Controller('talles')
export class TallesController {
  constructor(private readonly tallesService: TallesService) {}

  @Post()
  @ApiOperation({ summary: 'Crear un nuevo talle' })
  @ApiBody({ type: CreateTalleDto })
  @ApiResponse({ status: 201, description: 'Talle creado exitosamente.' })
  @ApiResponse({ status: 400, description: 'Datos inválidos.' })
  create(@Body() createTalleDto: CreateTalleDto) {
    return this.tallesService.create(createTalleDto);
  }

  @Get()
  @ApiOperation({ summary: 'Obtener todos los talles' })
  @ApiResponse({ status: 200, description: 'Lista de talles.' })
  findAll() {
    return this.tallesService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener un talle por ID' })
  @ApiParam({ name: 'id', description: 'ID del talle', type: 'integer' })
  @ApiResponse({ status: 200, description: 'Talle encontrado.' })
  @ApiResponse({ status: 404, description: 'Talle no encontrado.' })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    const talle = await this.tallesService.findOne(id);
    if (!talle) {
      throw new NotFoundException(`Talle con ID ${id} no encontrado`);
    }
    return talle;
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar un talle' })
  @ApiParam({ name: 'id', description: 'ID del talle', type: 'integer' })
  @ApiBody({ type: UpdateTalleDto })
  @ApiResponse({ status: 200, description: 'Talle actualizado.' })
  @ApiResponse({ status: 404, description: 'Talle no encontrado.' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateTalleDto: UpdateTalleDto,
  ) {
    return this.tallesService.update(id, updateTalleDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar un talle' })
  @ApiParam({ name: 'id', description: 'ID del talle', type: 'integer' })
  @ApiResponse({ status: 200, description: 'Talle eliminado.' })
  @ApiResponse({ status: 404, description: 'Talle no encontrado.' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.tallesService.remove(id);
  }
}
