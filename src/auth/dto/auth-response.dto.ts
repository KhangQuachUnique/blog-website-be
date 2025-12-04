export class AuthResponseDto {
  accessToken: string;
  user: {
    id: number;
    username: string;
    email: string;
    role?: string;
  };
}
