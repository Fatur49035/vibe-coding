import { Elysia, t } from "elysia";
import { registerUser, loginUser, getCurrentUser, logoutUser } from "../services/users-service";

export const usersRoute = new Elysia({ prefix: "/api" })
	.delete("/users/logout", async ({ headers, set }) => {
		const auth = headers['authorization'];

		if (!auth || !auth.startsWith("Bearer ")) {
			set.status = 401;
			return { error: "Unauthorized" };
		}

		const token = auth.slice(7);

		try {
			const result = await logoutUser(token);
			return result;
		} catch (error: any) {
			if (error.message === "Unauthorized") {
				set.status = 401;
				return { error: "Unauthorized" };
			}
			set.status = 500;
			return { error: "Internal Server Error" };
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
			name: t.String(),
			email: t.String({ format: 'email' }),
			password: t.String()
		})
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
		})
	});
