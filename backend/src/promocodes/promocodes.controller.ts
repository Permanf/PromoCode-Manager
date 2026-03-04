import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { PromocodesService } from './promocodes.service';
import { CreatePromocodeDto } from './dto/create-promocode.dto';
import { UpdatePromocodeDto } from './dto/update-promocode.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('promocodes')
@UseGuards(JwtAuthGuard)
export class PromocodesController {
  constructor(private readonly promocodesService: PromocodesService) {}

  @Get()
  findAll() {
    return this.promocodesService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.promocodesService.findById(id);
  }

  @Post()
  create(@Body() dto: CreatePromocodeDto) {
    return this.promocodesService.create(dto);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() dto: UpdatePromocodeDto) {
    return this.promocodesService.update(id, dto);
  }

  @Delete(':id')
  deactivate(@Param('id') id: string) {
    return this.promocodesService.deactivate(id);
  }
}
