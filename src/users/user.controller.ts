import { Controller } from '@nestjs/common';
import { Get, Query } from '@nestjs/common';
import { UsersService } from './user.service';
import { UserRole } from './users.entity';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  getUsersByRole(@Query('role') role: UserRole) {
    return this.usersService.getUsersByRole(role);
  }
}
