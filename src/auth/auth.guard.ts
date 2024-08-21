import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthGuard implements CanActivate {
  private readonly jwtAccessSecret: string = process.env.JWT_ACCESS_SECRET;
  constructor(private jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const accessToken = request.cookies.accessToken;

    if (!accessToken) {
      throw new UnauthorizedException('Unauthorized.');
    }
    try {
      const payload = await this.jwtService.verify(accessToken, {
        secret: this.jwtAccessSecret,
      });

      request['userId'] = payload.id;
    } catch {
      throw new UnauthorizedException('Unauthorized.');
    }
    return true;
  }
}
