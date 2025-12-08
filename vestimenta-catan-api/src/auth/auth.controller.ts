import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiTooManyRequestsResponse,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import type { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { CurrentUser } from './decorators/current-user.decorator';
import type { RequestUser } from './decorators/current-user.decorator';
import { Public } from './decorators/public.decorator';
import { AuthResponseDto, LoginDto, MessageResponseDto, RegisterDto } from './dto';

@ApiTags('Autenticación')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('register')
  @Throttle({ default: { limit: 3, ttl: 60000 } }) // 3 registros por minuto
  @ApiOperation({ summary: 'Registrar un nuevo usuario' })
  @ApiBody({ type: RegisterDto })
  @ApiResponse({
    status: 201,
    description: 'Usuario registrado exitosamente',
    type: AuthResponseDto,
  })
  @ApiResponse({ status: 409, description: 'El email ya está registrado' })
  @ApiTooManyRequestsResponse({ description: 'Demasiados intentos, espere un momento' })
  async register(
    @Body() registerDto: RegisterDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.register(registerDto);

    // Establecer refresh token en cookie httpOnly
    this.setRefreshTokenCookie(res, result.refreshToken);

    // No enviar el refresh token en el body
    const { refreshToken, ...responseData } = result;

    return responseData;
  }

  @Public()
  @Post('login')
  @Throttle({ default: { limit: 5, ttl: 60000 } }) // 5 intentos de login por minuto
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Iniciar sesión' })
  @ApiBody({ type: LoginDto })
  @ApiResponse({
    status: 200,
    description: 'Login exitoso',
    type: AuthResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Credenciales inválidas' })
  @ApiTooManyRequestsResponse({ description: 'Demasiados intentos de login, espere un momento' })
  async login(
    @Body() loginDto: LoginDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const userAgent = req.headers['user-agent'];
    const ipAddress =
      req.ip || req.headers['x-forwarded-for']?.toString() || 'unknown';

    const result = await this.authService.login(loginDto, userAgent, ipAddress);

    // Establecer refresh token en cookie httpOnly
    this.setRefreshTokenCookie(res, result.refreshToken);

    // No enviar el refresh token en el body
    const { refreshToken, ...responseData } = result;

    return responseData;
  }

  @Public()
  @UseGuards(AuthGuard('jwt-refresh'))
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refrescar tokens' })
  @ApiResponse({
    status: 200,
    description: 'Tokens refrescados exitosamente',
    type: AuthResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Refresh token inválido o expirado' })
  async refreshTokens(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const user = req.user as { payload: { sub: number }; refreshToken: string };
    const userAgent = req.headers['user-agent'];
    const ipAddress =
      req.ip || req.headers['x-forwarded-for']?.toString() || 'unknown';

    const result = await this.authService.refreshTokens(
      user.payload.sub,
      user.refreshToken,
      userAgent,
      ipAddress,
    );

    // Establecer nuevo refresh token en cookie httpOnly
    this.setRefreshTokenCookie(res, result.refreshToken);

    // No enviar el refresh token en el body
    const { refreshToken, ...responseData } = result;

    return responseData;
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Cerrar sesión actual' })
  @ApiResponse({
    status: 200,
    description: 'Sesión cerrada exitosamente',
    type: MessageResponseDto,
  })
  async logout(
    @CurrentUser() user: RequestUser,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const refreshToken = req.cookies?.refreshToken || '';

    if (refreshToken) {
      await this.authService.logout(user.userId, refreshToken);
    }

    // Limpiar cookie
    this.clearRefreshTokenCookie(res);

    return { message: 'Sesión cerrada exitosamente' };
  }

  @Post('logout-all')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Cerrar todas las sesiones' })
  @ApiResponse({
    status: 200,
    description: 'Todas las sesiones cerradas',
    type: MessageResponseDto,
  })
  async logoutAll(
    @CurrentUser() user: RequestUser,
    @Res({ passthrough: true }) res: Response,
  ) {
    await this.authService.logoutAll(user.userId);

    // Limpiar cookie
    this.clearRefreshTokenCookie(res);

    return { message: 'Todas las sesiones han sido cerradas' };
  }

  @Get('me')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obtener usuario actual' })
  @ApiResponse({ status: 200, description: 'Datos del usuario actual' })
  @ApiResponse({ status: 401, description: 'No autenticado' })
  getMe(@CurrentUser() user: RequestUser) {
    return user;
  }

  /**
   * Establecer cookie httpOnly con el refresh token
   */
  private setRefreshTokenCookie(res: Response, refreshToken: string) {
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 días
      path: '/api/auth',
    });
  }

  /**
   * Limpiar cookie del refresh token
   */
  private clearRefreshTokenCookie(res: Response) {
    res.clearCookie('refreshToken', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/api/auth',
    });
  }
}
