import { PartialType } from '@nestjs/swagger';
import { CreateProductoVarianteDto } from './create-producto-variante.dto';

export class UpdateProductoVarianteDto extends PartialType(
  CreateProductoVarianteDto,
) {}
