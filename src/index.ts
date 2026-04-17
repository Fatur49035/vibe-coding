import { Elysia } from "elysia";
import { swagger } from "@elysiajs/swagger";
import { db } from "./db";
import { usersRoute } from "./routes/users-route";

export const app = new Elysia()
	.use(swagger({
		path: "/docs",
		documentation: {
			info: {
				title: "Vibe Coding API Documentation",
				version: "1.0.0",
				description: "Dokumentasi REST API Server Backend"
			}
		}
	}))
	.use(usersRoute)
	.get("/", () => ({ status: "ok", message: "Elysia server is running" }))
	.get("/users", async () => {
		try {
			return await db.query.users.findMany();
		} catch (error) {
			return { error: "Database not connected or table not found" };
		}
	})
	.listen(process.env.PORT || 3000);

console.log(
	`🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`
);
