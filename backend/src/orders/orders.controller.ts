import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { ApplyPromocodeDto } from './dto/apply-promocode.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { UserDocument } from '../users/schemas/user.schema';

@Controller('orders')
@UseGuards(JwtAuthGuard)
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  create(@CurrentUser() user: UserDocument, @Body() dto: CreateOrderDto) {
    return this.ordersService.create(user._id.toString(), dto);
  }

  @Get()
  findMyOrders(@CurrentUser() user: UserDocument) {
    return this.ordersService.findByUser(user._id.toString());
  }

  @Post(':id/apply-promocode')
  applyPromocode(
    @Param('id') orderId: string,
    @CurrentUser() user: UserDocument,
    @Body() dto: ApplyPromocodeDto,
  ) {
    return this.ordersService.applyPromocode(orderId, user._id.toString(), dto);
  }
}
