import {GetUser, IsAuthorizedGuard} from "@modules/auth";
import {User, UserPublicData, UserService} from "@modules/user";
import {
  BadRequestException,
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  ParseIntPipe,
  Post,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors
} from "@nestjs/common";
import {In} from "typeorm";
import {FileInterceptor} from "@nestjs/platform-express";
import * as mime from "mime";

import {maxFileSize} from "@lib/constants";
import {BufferedFile, ID} from "@lib/typings";
import {FileService, UploadService} from "@modules/upload";
import {cleanObject} from "@lib/functions";
import {isExtensionValid} from "@lib/extensions";
import {minimalNumberOfMembersToCreateGroupChat} from "../lib/constants";
import {CreateGroupChatDto, CreateMessageDto} from "../dtos";
import {
  GroupChatMemberService,
  GroupChatService,
  GroupChatMessageService
} from "../services";
import {ChatMessagePublicData, GroupChatPublicData} from "../lib/typings";

@UseGuards(IsAuthorizedGuard)
@Controller("group-chats")
export class GroupChatController {
  constructor(
    private readonly chatService: GroupChatService,
    private readonly uploadService: UploadService,
    private readonly userService: UserService,
    private readonly memberService: GroupChatMemberService,
    private readonly messageService: GroupChatMessageService,
    private readonly fileService: FileService
  ) {}

  @UseInterceptors(
    FileInterceptor("avatar", {
      limits: {fileSize: maxFileSize},
      fileFilter: (_, file, callback) => {
        const ext = `.${mime.getExtension(file.mimetype)}`;

        if (!isExtensionValid(ext, "image")) {
          return callback(
            new BadRequestException("Invalid avatar extension"),
            false
          );
        }

        return callback(null, true);
      }
    })
  )
  @Post()
  async create(
    @GetUser() user: User,
    @Body() dto: CreateGroupChatDto,
    @UploadedFile() avatar: BufferedFile
  ): Promise<{chat: GroupChatPublicData; members: UserPublicData[]}> {
    const users = await this.userService.find({
      where: {id: In(dto.members)}
    });

    if (users.length < minimalNumberOfMembersToCreateGroupChat)
      throw new BadRequestException("Small amount of members");

    const title =
      dto.title ||
      `${user.login}, ${users
        .filter((_, idx) => idx <= 5)
        .map(({login}) => login)
        .join(", ")}`;

    const url =
      avatar &&
      (await this.uploadService.upload(avatar.buffer, avatar.mimetype))
        .Location;

    const partial = {title, avatar: url};

    cleanObject(partial);

    const chat = await this.chatService.create(partial);

    await this.memberService.create({user, chat});

    for (let i = 0; i < users.length; i++) {
      await this.memberService.create({user: users[i], chat});
    }

    return {
      chat: chat.public,
      members: users.map(user => user.public)
    };
  }

  @Get()
  async get(
    @GetUser() user: User
  ): Promise<{
    chats: ({lastMessage: ChatMessagePublicData} & GroupChatPublicData)[];
  }> {
    const members = await this.memberService.find({where: {user}});

    const messages = await this.messageService.find({
      where: {
        chat: {
          id: In(members.map(({chat}) => chat.id))
        }
      },
      order: {
        createdAt: "DESC"
      },
      take: 1
    });

    return {
      chats: members.map(({chat}) => {
        const msg = messages.find(msg => msg.chat.id === chat.id);

        return {
          ...chat.public,
          lastMessage: (msg && msg.public) || null
        };
      })
    };
  }

  @Post(":id/messages")
  async createMessage(
    @GetUser() user: User,
    @Param("id") id: ID,
    @Body() createMessageDto: CreateMessageDto
  ): Promise<{message: ChatMessagePublicData}> {
    const member = await this.memberService.findOne({
      where: {
        chat: {id},
        user
      }
    });

    if (!member) throw new NotFoundException("Chat is not found");

    const files = await this.fileService.find({
      user,
      id: In([
        ...createMessageDto.files,
        ...createMessageDto.images,
        createMessageDto.audio
      ])
    });

    const message = await this.messageService.create({
      chat: member.chat,
      sender: {
        type: "user",
        member
      },
      text: createMessageDto.text
    });

    return {
      message: message.public
    };
  }

  @Get(":id/messages")
  async getMessages(
    @GetUser() user: User,
    @Param("id") id: ID,
    @Query("offset", ParseIntPipe) offset: number
  ): Promise<{messages: ChatMessagePublicData[]}> {
    const chat = await this.chatService.findOne({
      where: {id}
    });

    if (!chat) throw new NotFoundException("Chat is not found");

    const messages = await this.messageService.find({
      where: {chat},
      skip: offset,
      order: {
        createdAt: "DESC"
      },
      take: 15
    });

    return {
      messages: messages.map(msg => msg.public)
    };
  }
}
