export interface ILoginResult {
  readonly access_token: string;
  readonly refresh_token: string;
  readonly id_user: string;
  readonly email: string;
  readonly username: string;
  readonly role: string;
  readonly access_token_exp_time: number;
  readonly refresh_token_exp_time: number;
}
