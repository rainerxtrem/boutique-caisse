import { SignJWT, jwtVerify } from "jose";

const secret = new TextEncoder().encode(
  process.env.JWT_SECRET ?? "dev-secret-change-me"
);

export type StaffSessionPayload = {
  kind: "staff";
  userId: string;
  role: "ADMIN" | "VENDEUR";
  name: string;
};

export type CustomerSessionPayload = {
  kind: "customer";
  customerId: string;
};

export async function signSession(
  payload: StaffSessionPayload | CustomerSessionPayload,
  expiresIn: string
) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(expiresIn)
    .sign(secret);
}

export async function verifySession<T>(token: string): Promise<T | null> {
  try {
    const { payload } = await jwtVerify(token, secret);
    return payload as T;
  } catch {
    return null;
  }
}
