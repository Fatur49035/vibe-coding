import { db } from "../db";
import { users } from "../db/schema";
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
