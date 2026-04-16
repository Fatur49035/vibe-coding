import { describe, it, expect, beforeEach } from "bun:test";
import { app } from "../src/index";
import { db } from "../src/db";
import { users, sessions } from "../src/db/schema";

describe("User API Unit Tests", () => {
	// Setup: Clear database before each test
	beforeEach(async () => {
		await db.delete(sessions);
		await db.delete(users);
	});

	describe("POST /api/users (Registration)", () => {
		it("should register a new user successfully", async () => {
			const response = await app.handle(
				new Request("http://localhost/api/users", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						name: "John Doe",
						email: "john@example.com",
						password: "password123",
					}),
				})
			);

			const body = await response.json();
			expect(response.status).toBe(201);
			expect(body).toEqual({ data: "OK" });
		});

		it("should return error for duplicate email", async () => {
			// Register first user
			await app.handle(
				new Request("http://localhost/api/users", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						name: "John Doe",
						email: "john@example.com",
						password: "password123",
					}),
				})
			);

			// Try to register again with same email
			const response = await app.handle(
				new Request("http://localhost/api/users", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						name: "Jane Doe",
						email: "john@example.com",
						password: "password456",
					}),
				})
			);

			const body = await response.json();
			expect(response.status).toBe(400);
			expect(body.error).toBe("Email sudah terdaftar");
		});

		it("should return validation error for name longer than 255 chars", async () => {
			const longName = "a".repeat(256);
			const response = await app.handle(
				new Request("http://localhost/api/users", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						name: longName,
						email: "long@example.com",
						password: "password123",
					}),
				})
			);

			expect(response.status).toBe(422);
		});
	});

	describe("POST /api/users/login", () => {
		beforeEach(async () => {
			// Pre-register user for login tests
			await app.handle(
				new Request("http://localhost/api/users", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						name: "John Doe",
						email: "john@example.com",
						password: "password123",
					}),
				})
			);
		});

		it("should login successfully and return a token", async () => {
			const response = await app.handle(
				new Request("http://localhost/api/users/login", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						email: "john@example.com",
						password: "password123",
					}),
				})
			);

			const body = await response.json();
			expect(response.status).toBe(200);
			expect(body.data).toBeDefined();
			expect(typeof body.data).toBe("string");
		});

		it("should return error for non-existent email", async () => {
			const response = await app.handle(
				new Request("http://localhost/api/users/login", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						email: "wrong@example.com",
						password: "password123",
					}),
				})
			);

			const body = await response.json();
			expect(response.status).toBe(401);
			expect(body.error).toBe("Email atau password salah");
		});

		it("should return error for wrong password", async () => {
			const response = await app.handle(
				new Request("http://localhost/api/users/login", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						email: "john@example.com",
						password: "wrongpassword",
					}),
				})
			);

			const body = await response.json();
			expect(response.status).toBe(401);
			expect(body.error).toBe("Email atau password salah");
		});
	});

	describe("GET /api/users/current", () => {
		let token: string;

		beforeEach(async () => {
			// 1. Register
			await app.handle(
				new Request("http://localhost/api/users", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						name: "John Doe",
						email: "john@example.com",
						password: "password123",
					}),
				})
			);

			// 2. Login to get token
			const loginRes = await app.handle(
				new Request("http://localhost/api/users/login", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						email: "john@example.com",
						password: "password123",
					}),
				})
			);
			const loginData = await loginRes.json();
			token = loginData.data;
		});

		it("should get current user profile successfully", async () => {
			const response = await app.handle(
				new Request("http://localhost/api/users/current", {
					method: "GET",
					headers: { Authorization: `Bearer ${token}` },
				})
			);

			const body = await response.json();
			expect(response.status).toBe(200);
			expect(body.data.email).toBe("john@example.com");
			expect(body.data.name).toBe("John Doe");
			expect(body.data.password).toBeUndefined(); // Should not return password
		});

		it("should return unauthorized for missing token", async () => {
			const response = await app.handle(
				new Request("http://localhost/api/users/current", {
					method: "GET",
				})
			);

			const body = await response.json();
			expect(response.status).toBe(401);
			expect(body.error).toBe("Unauthorized");
		});

		it("should return unauthorized for invalid token", async () => {
			const response = await app.handle(
				new Request("http://localhost/api/users/current", {
					method: "GET",
					headers: { Authorization: "Bearer wrong-token" },
				})
			);

			const body = await response.json();
			expect(response.status).toBe(401);
			expect(body.error).toBe("Unauthorized");
		});
	});

	describe("DELETE /api/users/logout", () => {
		let token: string;

		beforeEach(async () => {
			// Register & Login to get token
			await app.handle(
				new Request("http://localhost/api/users", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						name: "John Doe",
						email: "john@example.com",
						password: "password123",
					}),
				})
			);

			const loginRes = await app.handle(
				new Request("http://localhost/api/users/login", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						email: "john@example.com",
						password: "password123",
					}),
				})
			);
			const loginData = await loginRes.json();
			token = loginData.data;
		});

		it("should logout successfully", async () => {
			const response = await app.handle(
				new Request("http://localhost/api/users/logout", {
					method: "DELETE",
					headers: { Authorization: `Bearer ${token}` },
				})
			);

			const body = await response.json();
			expect(response.status).toBe(200);
			expect(body.data).toBe("OK");

			// Verify token is invalidated
			const profileResponse = await app.handle(
				new Request("http://localhost/api/users/current", {
					method: "GET",
					headers: { Authorization: `Bearer ${token}` },
				})
			);
			expect(profileResponse.status).toBe(401);
		});

		it("should be idempotent (multiple logouts return success)", async () => {
			// First logout
			await app.handle(
				new Request("http://localhost/api/users/logout", {
					method: "DELETE",
					headers: { Authorization: `Bearer ${token}` },
				})
			);

			// Second logout with same token
			const response = await app.handle(
				new Request("http://localhost/api/users/logout", {
					method: "DELETE",
					headers: { Authorization: `Bearer ${token}` },
				})
			);

			const body = await response.json();
			expect(response.status).toBe(200);
			expect(body.data).toBe("OK");
		});
	});

	describe("General APIs", () => {
		it("GET / should return ok status", async () => {
			const response = await app.handle(new Request("http://localhost/"));
			const body = await response.json();
			expect(response.status).toBe(200);
			expect(body.status).toBe("ok");
		});

		it("GET /users should return list of users", async () => {
			const response = await app.handle(new Request("http://localhost/users"));
			const body = await response.json();
			expect(response.status).toBe(200);
			expect(Array.isArray(body)).toBe(true);
		});
	});
});
