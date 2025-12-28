import {
  Controller,
  Get,
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
import { DashboardService } from './dashboard.service';

@ApiTags('Dashboard')
@ApiBearerAuth()
@Controller('dashboard')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('stats')
  @RequirePermission('dashboard.ver')
  @ApiOperation({ summary: 'Obtener estadísticas generales del dashboard' })
  async getStats() {
    return this.dashboardService.getStats();
  }

  @Get('charts/reservas')
  @RequirePermission('dashboard.ver')
  @ApiOperation({ summary: 'Obtener datos de reservas por día para gráficos' })
  @ApiQuery({
    name: 'dias',
    required: false,
    description: 'Cantidad de días hacia atrás',
    example: 30,
  })
  async getReservasPorDia(
    @Query('dias', new DefaultValuePipe(30), ParseIntPipe) dias: number,
  ) {
    return this.dashboardService.getReservasPorDia(dias);
  }

  @Get('charts/stock')
  @RequirePermission('dashboard.ver')
  @ApiOperation({
    summary: 'Obtener datos de stock por categoría para gráficos',
  })
  async getStockPorCategoria() {
    return this.dashboardService.getStockPorCategoria();
  }

  @Get('charts/productos-agregados')
  @RequirePermission('dashboard.ver')
  @ApiOperation({
    summary: 'Obtener datos de productos agregados por día para gráficos',
  })
  @ApiQuery({
    name: 'dias',
    required: false,
    description: 'Cantidad de días hacia atrás',
    example: 30,
  })
  async getProductosAgregadosPorDia(
    @Query('dias', new DefaultValuePipe(30), ParseIntPipe) dias: number,
  ) {
    return this.dashboardService.getProductosAgregadosPorDia(dias);
  }

  @Get('charts/stock-por-producto')
  @RequirePermission('dashboard.ver')
  @ApiOperation({
    summary:
      'Obtener stock agregado por día separado por producto (gráfico multilinea)',
  })
  @ApiQuery({
    name: 'dias',
    required: false,
    description: 'Cantidad de días hacia atrás',
    example: 30,
  })
  async getStockAgregadoPorProducto(
    @Query('dias', new DefaultValuePipe(30), ParseIntPipe) dias: number,
  ) {
    return this.dashboardService.getStockAgregadoPorProducto(dias);
  }

  @Get('ultimos-cambios')
  @RequirePermission('dashboard.ver', 'auditoria.ver')
  @ApiOperation({ summary: 'Obtener los últimos cambios de auditoría' })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Cantidad de registros',
    example: 10,
  })
  async getUltimosCambios(
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
  ) {
    return this.dashboardService.getUltimosCAmbios(limit);
  }

  @Get('alertas/stock-bajo')
  @RequirePermission('dashboard.ver', 'stock.ver')
  @ApiOperation({ summary: 'Obtener alertas de productos con stock bajo' })
  @ApiQuery({
    name: 'umbral',
    required: false,
    description: 'Umbral de stock bajo',
    example: 5,
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Cantidad de registros',
    example: 20,
  })
  async getStockBajoAlertas(
    @Query('umbral', new DefaultValuePipe(5), ParseIntPipe) umbral: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
  ) {
    return this.dashboardService.getStockBajoAlertas(umbral, limit);
  }
}
