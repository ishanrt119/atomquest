import { jwtVerify, SignJWT } from "jose";

export interface JWTPayload {
  userId: string;
  email: string;
  role: string;
}

const getJwtSecretKey = () => {
  const secret = process.env.JWT_SECRET || "fallback_super_secret_key_atomquest";
  return new TextEncoder().encode(secret);
};

export async function signJWT(payload: JWTPayload, expiresIn: string = "24h") {
  const token = await new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(expiresIn)
    .sign(getJwtSecretKey());
  return token;
}

export async function verifyJWT(token: string) {
  try {
    const { payload } = await jwtVerify(token, getJwtSecretKey());
    return payload as unknown as JWTPayload;
  } catch (error) {
    return null;
  }
}
