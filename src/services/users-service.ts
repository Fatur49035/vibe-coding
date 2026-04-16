import { db } from "../db";
import { users, sessions } from "../db/schema";
import { eq } from "drizzle-orm";

export const registerUser = async ({ name, email, password }: any) => {
	// 1. Check if email already exists
	const [existingUser] = await db.select().from(users).where(eq(users.email, email));

	if (existingUser) {
		throw new Error("Email sudah terdaftar");
	}

	// 2. Hash password
	const hashedPassword = await Bun.password.hash(password);

	// 3. Insert user
	await db.insert(users).values({
		name,
		email,
		password: hashedPassword,
	});

	return { data: "OK" };
};

export const loginUser = async ({ email, password }: any) => {
	// 1. Find user by email
	const [user] = await db.select().from(users).where(eq(users.email, email));

	if (!user) {
		throw new Error("Email atau password salah");
	}

	// 2. Verify password
	const isPasswordMatch = await Bun.password.verify(password, user.password);

	if (!isPasswordMatch) {
		throw new Error("Email atau password salah");
	}

	// 3. Generate token
	const token = crypto.randomUUID();

	// 4. Insert session
	await db.insert(sessions).values({
		token,
		userId: user.id,
	});

	return { data: token };
};

export const getCurrentUser = async (token: string) => {
	// 1. Find session with user relation
	const session = await db.query.sessions.findFirst({
		where: eq(sessions.token, token),
		with: {
			user: true,
		},
	});

	if (!session || !session.user) {
		throw new Error("Unauthorized");
	}

	// 2. Remove sensitive data
	const { password, ...userWithoutPassword } = session.user;

	return { data: userWithoutPassword };
};

export const logoutUser = async (token: string) => {
	const result = await db.delete(sessions).where(eq(sessions.token, token));
	
	if (result[0].affectedRows === 0) {
		throw new Error("Unauthorized");
	}

	return { data: "OK" };
};
