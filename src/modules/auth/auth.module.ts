import {
  Module,
  NestModule,
  MiddlewareConsumer,
  forwardRef
} from "@nestjs/common";
import {JwtModule} from "@nestjs/jwt";
import {ConfigModule, ConfigService} from "@nestjs/config";
import {TypeOrmModule} from "@nestjs/typeorm";

import {WebsocketsModule} from "@modules/websockets";
import {UserModule} from "@modules/user";
import {IsAuthorizedGuard} from "./guards";
import {RefreshSession} from "./entities";
import {RefreshSessionService, AuthService} from "./services";
import {AuthMiddleware} from "./middlewares";
import {AuthController} from "./auth.controller";

@Module({
  imports: [
    forwardRef(() => WebsocketsModule),
    UserModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>("jwt.secret"),
        signOptions: {
          expiresIn: configService.get<string>("jwt.accessToken.expiresIn")
        }
      })
    }),
    TypeOrmModule.forFeature([RefreshSession])
  ],
  providers: [
    AuthMiddleware,
    RefreshSessionService,
    AuthService,
    IsAuthorizedGuard
  ],
  controllers: [AuthController],
  exports: [
    IsAuthorizedGuard,
    AuthMiddleware,
    JwtModule,
    UserModule,
    AuthService
  ]
})
export class AuthModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(AuthMiddleware).forRoutes(AuthController);
  }
}
