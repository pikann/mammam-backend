import { Controller, Get, Query, UseGuards, Request } from '@nestjs/common';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { NotificationsService } from './notifications.service';

@Controller('notifications')
export class NotificationsController {
  constructor(private notificationsService: NotificationsService) {}

  @UseGuards(JwtAuthGuard)
  @Get()
  async getListNotification(
    @Request() req,
    @Query('page') page: number,
    @Query('perpage') perpage: number,
  ) {
    if (!page) page = 0;
    if (!perpage) perpage = 10;

    const total = await this.notificationsService.count({
      to: req.user.id,
    });

    const response = {
      total,
      totalPage: Math.ceil(total / perpage),
      page,
      perpage,
      data: await this.notificationsService.getList(page, perpage, req.user.id),
    };

    this.notificationsService.update(
      { to: req.user.id },
      { $addToSet: { seen: req.user.id } },
    );

    return response;
  }
}
