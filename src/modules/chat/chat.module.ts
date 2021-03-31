import {MiddlewareConsumer, Module, NestModule} from "@nestjs/common";
import {TypeOrmModule} from "@nestjs/typeorm";

import {UploadModule} from "@modules/upload";
import {UserModule} from "@modules/user";
import {AuthMiddleware, AuthModule} from "@modules/auth";
import {WebsocketsModule} from "@lib/websockets";
import {
  AttachmentService,
  OneToOneChatMemberService,
  OneToOneChatMessageService,
  OneToOneChatService,
  GroupChatService,
  GroupChatMessageService,
  GroupChatMemberService
} from "./services";
import {
  Attachment,
  GroupChat,
  GroupChatMember,
  GroupChatMessage,
  OneToOneChat,
  OneToOneChatMember,
  OneToOneChatMessage
} from "./entities";
import {GroupChatController, OneToOneChatController} from "./controllers";
import {GroupChatGateway, OneToOneChatGateway} from "./gateways";

@Module({
  imports: [
    AuthModule,
    UploadModule,
    UserModule,
    WebsocketsModule,
    TypeOrmModule.forFeature([
      OneToOneChat,
      GroupChat,
      OneToOneChatMember,
      OneToOneChatMessage,
      GroupChatMessage,
      GroupChatMember,
      Attachment
    ])
  ],
  providers: [
    OneToOneChatService,
    OneToOneChatMessageService,
    OneToOneChatMemberService,
    GroupChatService,
    GroupChatMemberService,
    GroupChatMessageService,
    AttachmentService,
    GroupChatGateway,
    OneToOneChatGateway
  ],
  controllers: [OneToOneChatController, GroupChatController]
})
export class ChatModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer
      .apply(AuthMiddleware)
      .forRoutes(OneToOneChatController, GroupChatController);
  }
}
