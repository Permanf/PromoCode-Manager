import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ClickhouseSyncService } from '../clickhouse/clickhouse-sync.service';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly clickhouseSync: ClickhouseSyncService,
  ) {}

  @Post()
  async create(@Body() dto: CreateUserDto) {
    const passwordHash = await bcrypt.hash(dto.password, 10);
    const user = await this.usersService.create(dto, passwordHash);
    await this.clickhouseSync.syncUser(user).catch((e) => console.error('CH sync:', e));
    return this.usersService.findById(user._id.toString());
  }

  @Get()
  findAll() {
    return this.usersService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const user = await this.usersService.findById(id);
    if (!user) throw new NotFoundException(`User #${id} not found`);
    return user;
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.usersService.update(id, updateUserDto);
  }

  @Delete(':id')
  deactivate(@Param('id') id: string) {
    return this.usersService.deactivate(id);
  }
}
