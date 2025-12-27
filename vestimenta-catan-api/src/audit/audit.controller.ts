import {
  Controller,
  Get,
  Param,
  Query,
  UseGuards,
  ParseIntPipe,
  DefaultValuePipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiQuery,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { JwtAuthGuard, PermissionsGuard } from '../auth/guards';
import { RequirePermission } from '../auth/decorators';
import { AuditService } from './audit.service';

@ApiTags('Auditoría')
@ApiBearerAuth()
@Controller('audit')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get('logs')
  @RequirePermission('auditoria.ver')
  @ApiOperation({ summary: 'Listar logs de auditoría con filtros' })
  @ApiQuery({
    name: 'tabla',
    required: false,
    description: 'Filtrar por tabla',
  })
  @ApiQuery({
    name: 'registro_id',
    required: false,
    description: 'Filtrar por ID de registro',
  })
  @ApiQuery({
    name: 'accion',
    required: false,
    description: 'Filtrar por acción (CREATE, UPDATE, DELETE)',
  })
  @ApiQuery({
    name: 'usuario_id',
    required: false,
    description: 'Filtrar por ID de usuario',
  })
  @ApiQuery({
    name: 'desde',
    required: false,
    description: 'Fecha desde (ISO 8601)',
  })
  @ApiQuery({
    name: 'hasta',
    required: false,
    description: 'Fecha hasta (ISO 8601)',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Límite de resultados',
    example: 50,
  })
  @ApiQuery({
    name: 'offset',
    required: false,
    description: 'Offset para paginación',
    example: 0,
  })
  async getLogs(
    @Query('tabla') tabla?: string,
    @Query('registro_id') registro_id?: string,
    @Query('accion') accion?: string,
    @Query('usuario_id') usuario_id?: string,
    @Query('desde') desde?: string,
    @Query('hasta') hasta?: string,
    @Query('limit', new DefaultValuePipe(50), ParseIntPipe) limit?: number,
    @Query('offset', new DefaultValuePipe(0), ParseIntPipe) offset?: number,
  ) {
    const result = await this.auditService.queryLogs({
      tabla,
      registro_id,
      accion,
      usuario_id: usuario_id ? BigInt(usuario_id) : undefined,
      desde: desde ? new Date(desde) : undefined,
      hasta: hasta ? new Date(hasta) : undefined,
      limit,
      offset,
    });

    // Convertir BigInt a string para serialización JSON
    return result.logs.map((log) => ({
      ...log,
      id: log.id.toString(),
      usuario_id: log.usuario_id?.toString() || null,
    }));
  }

  @Get(':tabla/:id/history')
  @RequirePermission('auditoria.ver')
  @ApiOperation({ summary: 'Obtener historial de cambios de un registro' })
  async getRecordHistory(
    @Param('tabla') tabla: string,
    @Param('id') id: string,
  ) {
    const logs = await this.auditService.getRecordHistory(tabla, id);

    // Convertir BigInt a string para serialización JSON
    return logs.map((log) => ({
      ...log,
      id: log.id.toString(),
      usuario_id: log.usuario_id?.toString() || null,
    }));
  }

  @Get('stats')
  @RequirePermission('auditoria.ver')
  @ApiOperation({ summary: 'Obtener estadísticas del servicio de auditoría' })
  getStats() {
    return this.auditService.getStats();
  }
}
