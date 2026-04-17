import { Elysia, t } from "elysia";
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
	.get("/", () => ({ status: "ok", message: "Elysia server is running" }), {
		response: {
			200: t.Object({
				status: t.String(),
				message: t.String()
			}, { description: "Health check success" })
		},
		detail: {
			summary: "Server health check",
			tags: ["General"]
		}
	})
	.get("/users", async () => {
		try {
			return await db.query.users.findMany();
		} catch (error) {
			return { error: "Database not connected or table not found" };
		}
	}, {
		response: {
			200: t.Array(t.Object({
				id: t.Number(),
				name: t.String(),
				email: t.String(),
				createdAt: t.Nullable(t.Any())
			}), { description: "List of users" }),
			500: t.Object({
				error: t.String()
			}, { description: "Internal Server Error" })
		},
		detail: {
			summary: "Get all users (Admin/Debug)",
			tags: ["General"]
		}
	})
	.listen(process.env.PORT || 3000);

console.log(
	`🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`
);
