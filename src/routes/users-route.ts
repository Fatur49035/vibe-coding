import { Elysia, t } from "elysia";
import { registerUser, loginUser, getCurrentUser, logoutUser } from "../services/users-service";

export const usersRoute = new Elysia({ prefix: "/api" })
	.delete("/users/logout", async ({ headers: { authorization }, set }) => {
		if (!authorization.startsWith("Bearer ")) {
			set.status = 401;
			return { error: "Unauthorized" };
		}

		const token = authorization.slice(7);

		try {
			const result = await logoutUser(token);
			return result;
		} catch (error: any) {
			set.status = 500;
			return { error: "Internal Server Error" };
		}
	}, {
		headers: t.Object({
			authorization: t.String()
		}),
		response: {
			200: t.Object({
				data: t.String()
			}, { description: "User logged out successfully" }),
			401: t.Object({
				error: t.String()
			}, { description: "Unauthorized access" }),
			500: t.Object({
				error: t.String()
			}, { description: "Internal Server Error" })
		},
		detail: {
			summary: "Logout user",
			tags: ["Users"],
			description: "Mencabut token sesi pengguna saat ini."
		}
	})
	.get("/users/current", async ({ headers, set }) => {
		const auth = headers['authorization'];

		if (!auth || !auth.startsWith("Bearer ")) {
			set.status = 401;
			return { error: "Unauthorized" };
		}

		const token = auth.slice(7);

		try {
			const result = await getCurrentUser(token);
			return result;
		} catch (error: any) {
			if (error.message === "Unauthorized") {
				set.status = 401;
				return { error: "Unauthorized" };
			}
			set.status = 500;
			return { error: "Internal Server Error" };
		}
	}, {
		response: {
			200: t.Object({
				data: t.Object({
					id: t.Number(),
					name: t.String(),
					email: t.String(),
					createdAt: t.Nullable(t.Any())
				})
			}, { description: "Current user profile data" }),
			401: t.Object({
				error: t.String()
			}, { description: "Unauthorized access" }),
			500: t.Object({
				error: t.String()
			}, { description: "Internal Server Error" })
		},
		detail: {
			summary: "Get current user profile",
			tags: ["Users"],
			description: "Mendapatkan data profil pengguna yang sedang login berdasarkan token."
		}
	})
	.post("/users", async ({ body, set }) => {
		try {
			const result = await registerUser(body);
			set.status = 201;
			return result;
		} catch (error: any) {
			if (error.message === "Email sudah terdaftar") {
				set.status = 400;
				return { error: error.message };
			}
			set.status = 500;
			return { error: "Internal Server Error" };
		}
	}, {
		body: t.Object({
			name: t.String({ maxLength: 255 }),
			email: t.String({ format: 'email', maxLength: 255 }),
			password: t.String({ maxLength: 255 })
		}),
		response: {
			201: t.Object({
				data: t.String()
			}, { description: "User registered successfully" }),
			400: t.Object({
				error: t.String()
			}, { description: "Bad Request" }),
			500: t.Object({
				error: t.String()
			}, { description: "Internal Server Error" })
		},
		detail: {
			summary: "Register new user",
			tags: ["Users"],
			description: "Mendaftarkan pengguna baru dengan nama, email, dan password."
		}
	})
	.post("/users/login", async ({ body, set }) => {
		try {
			const result = await loginUser(body);
			set.status = 200;
			return result;
		} catch (error: any) {
			if (error.message === "Email atau password salah") {
				set.status = 401;
				return { error: error.message };
			}
			set.status = 500;
			return { error: "Internal Server Error" };
		}
	}, {
		body: t.Object({
			email: t.String({ format: 'email' }),
			password: t.String()
		}),
		response: {
			200: t.Object({
				data: t.String()
			}, { description: "Login successful, returns session token" }),
			401: t.Object({
				error: t.String()
			}, { description: "Invalid credentials" }),
			500: t.Object({
				error: t.String()
			}, { description: "Internal Server Error" })
		},
		detail: {
			summary: "Login user",
			tags: ["Users"],
			description: "Autentikasi pengguna dan mendapatkan token sesi."
		}
	});
