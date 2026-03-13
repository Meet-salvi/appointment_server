import { Controller, UseGuards } from '@nestjs/common';
import { Get, Query } from '@nestjs/common';
import { UsersService } from './user.service';
import { UserRole } from './users.entity';
import { JwtAuthGuard } from '../auth/guards/auth.guard';
import { GetUser } from '../auth/decorators/get-user.decorator';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) { }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  getMe(@GetUser('sub') userId: number) {
    return this.usersService.findById(userId);
  }

  @Get()
  getUsersByRole(@Query('role') role: UserRole) {
    return this.usersService.getUsersByRole(role);
  }
}
