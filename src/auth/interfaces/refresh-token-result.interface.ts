export interface IRefreshTokenResult {
  readonly access_token: string;
  readonly refresh_token: string;
  readonly access_token_exp_time: number;
  readonly refresh_token_exp_time: number;
}
