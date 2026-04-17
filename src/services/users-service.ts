import { db } from "../db";
import { users, sessions } from "../db/schema";
import { eq } from "drizzle-orm";

/**
 * Mendaftarkan pengguna (user) baru ke dalam sistem.
 * Fungsi ini akan mengecek apakah email sudah terdaftar, melakukan hashing pada password,
 * lalu menyimpan data user ke tabel database.
 * 
 * @param {any} payload - Objek yang berisi name, email, dan raw password
 * @returns {Promise<{data: string}>} Mengembalikan string "OK" jika berhasil
 * @throws {Error} Akan melempar error jika email sudah ada di database
 */
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

/**
 * Melakukan proses autentikasi login pengguna.
 * Fungsi ini mencocokkan email di database, memverifikasi password hash,
 * dan jika valid, akan mengenerate UUID Token Session untuk disimpan ke tabel sesi.
 * 
 * @param {any} credentials - Objek yang berisi email dan raw password
 * @returns {Promise<{data: string}>} Mengembalikan random UUID token yang aktif untuk sesi saat ini
 * @throws {Error} Akan melempar error jika email tak ditemukan atau password salah
 */
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

/**
 * Mengambil informasi profil pengguna yang sedang login berdasarkan token.
 * Fungsi ini mengambil data sesi beserta relasi *user* dari database,
 * lalu mengembalikan data pengguna dengan mengecualikan (omit) informasi sensitif seperti password.
 * 
 * @param {string} token - Token sesi pengguna dari request *Header/Authorization*
 * @returns {Promise<{data: any}>} Mengembalikan objek data profil pengguna tanpa field password
 * @throws {Error} Akan melempar "Unauthorized" jika token tidak terdaftar atau gagal diverifikasi
 */
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

/**
 * Menghapus (mencabut) token sesi pengguna dari database.
 * Fungsi ini membuat pengguna berstatus logout dan token miliknya di masa lalu otomatis invalid.
 * Bersifat *idempotent*; tidak akan *error* walaupun token sudah tidak tersisa di tabel.
 * 
 * @param {string} token - Token sesi dari pengguna yang akan *logout*
 * @returns {Promise<{data: string}>} Selalu mengembalikan "OK" bila query sudah dilalui
 */
export const logoutUser = async (token: string) => {
	await db.delete(sessions).where(eq(sessions.token, token));

	return { data: "OK" };
};
