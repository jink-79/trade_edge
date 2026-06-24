import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { User } from "./auth.model";
import { AppError } from "../../utils/api-error";
import { env } from "../../config/env";
import { SALT_ROUNDS } from "../../config/constants";
import type {
  RegisterInput,
  LoginInput,
  AuthTokenResponse,
  AuthUser,
} from "./auth.types";

function signToken(userId: string, email: string): string {
  return jwt.sign({ userId, email }, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN,
  } as jwt.SignOptions);
}

function formatUser(user: {
  _id: unknown;
  fullName: string;
  email: string;
  createdAt: Date;
}): AuthUser {
  return {
    id: String(user._id),
    fullName: user.fullName,
    email: user.email,
    createdAt: user.createdAt,
  };
}

export async function registerUser(
  input: RegisterInput,
): Promise<AuthTokenResponse> {
  const { fullName, email, password } = input;
  // confirmPassword is validated by Zod — not persisted

  const existing = await User.findOne({ email });
  if (existing) {
    throw AppError.conflict("An account with this email already exists");
  }

  const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

  const user = await User.create({ fullName, email, password: hashedPassword });

  const token = signToken(String(user._id), user.email);

  return { token, user: formatUser(user) };
}

export async function loginUser(input: LoginInput): Promise<AuthTokenResponse> {
  const { email, password } = input;

  // Explicitly select password since it's excluded by default in the schema
  const user = await User.findOne({ email }).select("+password");

  if (!user) {
    throw AppError.unauthorized("Invalid email or password");
  }

  const isPasswordValid = await bcrypt.compare(password, user.password);

  if (!isPasswordValid) {
    throw AppError.unauthorized("Invalid email or password");
  }

  const token = signToken(String(user._id), user.email);

  return { token, user: formatUser(user) };
}

export async function getMe(userId: string): Promise<AuthUser> {
  const user = await User.findById(userId);

  if (!user) {
    throw AppError.notFound("User not found");
  }

  return formatUser(user);
}
