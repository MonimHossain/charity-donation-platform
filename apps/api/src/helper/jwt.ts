import jwt, { type Secret, type SignOptions } from "jsonwebtoken";

export function signJwt(
  payload: string | object | Buffer,
  secret: Secret,
  expiresIn: string,
): string {
  const options: SignOptions = { expiresIn: expiresIn as SignOptions["expiresIn"] };
  return jwt.sign(payload, secret, options);
}
