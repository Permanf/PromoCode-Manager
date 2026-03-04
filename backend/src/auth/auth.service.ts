import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { UserDocument } from '../users/schemas/user.schema';
import { ClickhouseSyncService } from '../clickhouse/clickhouse-sync.service';

export interface TokenPayload {
  sub: string;
  email: string;
  type: 'access' | 'refresh';
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private config: ConfigService,
    private clickhouseSync: ClickhouseSyncService,
  ) {}

  async register(dto: CreateUserDto): Promise<AuthTokens> {
    const existing = await this.usersService.findByEmail(dto.email);
    if (existing) throw new ConflictException('Email already registered');
    const passwordHash = await bcrypt.hash(dto.password, 10);
    const user = await this.usersService.create(dto, passwordHash);
    await this.clickhouseSync.syncUser(user).catch((err) => console.error('CH sync error:', err));
    return this.generateTokens(user);
  }

  async login(email: string, password: string): Promise<AuthTokens> {
    const user = await this.usersService.findByEmailWithPassword(email);
    if (!user) throw new UnauthorizedException('Invalid credentials');
    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) throw new UnauthorizedException('Invalid credentials');
    if (!user.isActive) throw new UnauthorizedException('Account is deactivated');
    return this.generateTokens(user);
  }

  async refresh(refreshToken: string): Promise<AuthTokens> {
    try {
      const payload = this.jwtService.verify<TokenPayload>(refreshToken, {
        secret: this.config.get('JWT_REFRESH_SECRET', 'refresh-secret'),
      });
      if (payload.type !== 'refresh') throw new UnauthorizedException('Invalid token');
      const user = await this.usersService.findById(payload.sub);
      if (!user || !user.isActive) throw new UnauthorizedException('User not found');
      return this.generateTokens(user);
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async validateUser(payload: TokenPayload): Promise<UserDocument | null> {
    if (payload.type !== 'access') return null;
    return this.usersService.findById(payload.sub);
  }

  private async generateTokens(user: UserDocument): Promise<AuthTokens> {
    const payload: TokenPayload = {
      sub: user._id.toString(),
      email: user.email,
      type: 'access',
    };
    const refreshPayload: TokenPayload = { ...payload, type: 'refresh' };
    const accessExpires = this.config.get('JWT_ACCESS_EXPIRES', '15m');
    const expiresIn = accessExpires.endsWith('m') ? parseInt(accessExpires, 10) * 60 : 900;
    const accessToken = this.jwtService.sign(payload);
    const refreshToken = this.jwtService.sign(refreshPayload, {
      secret: this.config.get('JWT_REFRESH_SECRET', 'refresh-secret'),
      expiresIn: this.config.get('JWT_REFRESH_EXPIRES', '7d'),
    });
    return { accessToken, refreshToken, expiresIn };
  }
}
