import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import type { JwtPayload } from '../auth/types/jwt-payload.type';
import { AddBoardMembersDto } from './dto/add-board-members.dto';
import { BoardsService } from './boards.service';
import { CreateBoardDto } from './dto/create-board.dto';
import { UpdateBoardDto } from './dto/update-board.dto';

@Controller('api/v1/boards')
@UseGuards(JwtAuthGuard)
export class BoardsController {
  constructor(private readonly boardsService: BoardsService) {}

  @Get()
  list(@CurrentUser() user: JwtPayload) {
    return this.boardsService.list(user.sub);
  }

  @Get(':boardId')
  getById(@CurrentUser() user: JwtPayload, @Param('boardId') boardId: string) {
    return this.boardsService.getById(user.sub, boardId);
  }

  @Post()
  create(@CurrentUser() user: JwtPayload, @Body() dto: CreateBoardDto) {
    return this.boardsService.create(user.sub, dto);
  }

  @Post('open')
  open(@CurrentUser() user: JwtPayload, @Body() dto: CreateBoardDto) {
    return this.boardsService.open(user.sub, dto);
  }

  @Patch(':boardId')
  update(
    @CurrentUser() user: JwtPayload,
    @Param('boardId') boardId: string,
    @Body() dto: UpdateBoardDto,
  ) {
    return this.boardsService.update(user.sub, boardId, dto);
  }

  @Get(':boardId/members')
  listMembers(
    @CurrentUser() user: JwtPayload,
    @Param('boardId') boardId: string,
  ) {
    return this.boardsService.listMembers(user.sub, boardId);
  }

  @Post(':boardId/members')
  addMembers(
    @CurrentUser() user: JwtPayload,
    @Param('boardId') boardId: string,
    @Body() dto: AddBoardMembersDto,
  ) {
    return this.boardsService.addMembers(user.sub, boardId, dto);
  }

  @Post('invites/:inviteId/accept')
  acceptInvite(
    @CurrentUser() user: JwtPayload,
    @Param('inviteId') inviteId: string,
  ) {
    return this.boardsService.acceptInvite(user.sub, inviteId);
  }

  @Post('invites/:inviteId/decline')
  declineInvite(
    @CurrentUser() user: JwtPayload,
    @Param('inviteId') inviteId: string,
  ) {
    return this.boardsService.declineInvite(user.sub, inviteId);
  }

  @Delete(':boardId/members/:memberUserId')
  removeMember(
    @CurrentUser() user: JwtPayload,
    @Param('boardId') boardId: string,
    @Param('memberUserId') memberUserId: string,
  ) {
    return this.boardsService.removeMember(user.sub, boardId, memberUserId);
  }

  @Delete(':boardId')
  delete(@CurrentUser() user: JwtPayload, @Param('boardId') boardId: string) {
    return this.boardsService.delete(user.sub, boardId);
  }
}
