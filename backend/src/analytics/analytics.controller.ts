import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { AnalyticsQueryDto } from './dto/analytics-query.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('analytics')
@UseGuards(JwtAuthGuard)
export class AnalyticsController {
  constructor(private readonly analytics: AnalyticsService) {}

  @Get('users')
  getUsers(@Query() params: AnalyticsQueryDto) {
    return this.analytics.getUsers(params);
  }

  @Get('promocodes')
  getPromocodes(@Query() params: AnalyticsQueryDto) {
    return this.analytics.getPromocodes(params);
  }

  @Get('promo-usages')
  getPromoUsages(@Query() params: AnalyticsQueryDto) {
    return this.analytics.getPromoUsages(params);
  }
}
