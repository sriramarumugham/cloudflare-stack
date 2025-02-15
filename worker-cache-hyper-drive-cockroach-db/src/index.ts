import postgres from 'postgres';

export interface Env {
	HYPERDRIVE: Hyperdrive;
}

export default {
	async fetch(request, env, ctx): Promise<Response> {
		const url = new URL(request.url);
		const path = url.pathname;
		const method = request.method;
		const sql = postgres(env.HYPERDRIVE.connectionString, { max: 5, fetch_types: false });
		const cache = caches.default;
		const cacheKey = new Request(url.toString(), request);
		let response;

		try {
			// 🏗️ 1. Initialize Database (Run only once!)
			if (path === '/migrate' && method === 'POST') {
				await sql`
					CREATE TABLE IF NOT EXISTS users (
						id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
						name TEXT NOT NULL,
						email TEXT UNIQUE NOT NULL,
						created_at TIMESTAMP DEFAULT now()
					);
				`;
				return new Response('Migration applied: Users table created!', { status: 200 });
			}

			// 📤 2. Fetch All Users (GET /users) - With Caching
			if (path === '/users' && method === 'GET') {
				response = await cache.match(cacheKey);

				if (!response) {
					console.log(`Cache MISS: Fetching users from DB`);
					const users = await sql`SELECT * FROM users;`;
					response = new Response(JSON.stringify({ users }), {
						headers: {
							'Content-Type': 'application/json',
							'Cache-Control': 's-maxage=60', // Cache for 60s
						},
					});
					ctx.waitUntil(cache.put(cacheKey, response.clone()));
				} else {
					console.log(`Cache HIT: Returning cached users`);
					response = new Response(response.body, response);
				}

				return response;
			}

			// 🔍 3. Fetch a User by ID (GET /users/:id) - With Caching
			const userIdMatch = path.match(/^\/users\/([a-f0-9-]+)$/);
			if (userIdMatch && method === 'GET') {
				const userId = userIdMatch[1];
				response = await cache.match(cacheKey);

				if (!response) {
					console.log(`Cache MISS: Fetching user ${userId} from DB`);
					const user = await sql`SELECT * FROM users WHERE id = ${userId};`;
					if (user.length === 0) return new Response('User not found', { status: 404 });

					response = new Response(JSON.stringify(user[0]), {
						headers: {
							'Content-Type': 'application/json',
							'Cache-Control': 's-maxage=60',
						},
					});
					ctx.waitUntil(cache.put(cacheKey, response.clone()));
				} else {
					console.log(`Cache HIT: Returning cached user ${userId}`);
					response = new Response(response.body, response);
				}

				return response;
			}

			// 📥 4. Insert a New User (POST /users) - Invalidates Cache
			if (path === '/users' && method === 'POST') {
				const { name, email } = (await request.json()) as any;
				const result = await sql`INSERT INTO users (name, email) VALUES (${name}, ${email}) RETURNING *;`;

				// Invalidate cache for GET /users
				ctx.waitUntil(cache.delete(new Request(url.origin + '/users')));

				return Response.json({ message: 'User created!', user: result[0] });
			}

			// 📝 5. Update User (PUT /users) - Invalidates Cache
			if (path === '/users' && method === 'PUT') {
				const { id, name, email } = (await request.json()) as any;
				const result = await sql`UPDATE users SET name = ${name}, email = ${email} WHERE id = ${id} RETURNING *;`;

				// Invalidate cache after update
				ctx.waitUntil(cache.delete(new Request(url.origin + `/users/${id}`)));
				ctx.waitUntil(cache.delete(new Request(url.origin + '/users')));

				return Response.json({ message: 'User updated!', user: result[0] });
			}

			// ❌ 6. Delete a User (DELETE /users/:id) - Invalidates Cache
			if (path.startsWith('/users/') && method === 'DELETE') {
				const userId = path.split('/').pop() as string;
				await sql`DELETE FROM users WHERE id = ${userId}`;

				// Invalidate cache after delete
				ctx.waitUntil(cache.delete(new Request(url.origin + `/users/${userId}`)));
				ctx.waitUntil(cache.delete(new Request(url.origin + '/users')));

				return new Response('User deleted', { status: 200 });
			}

			return new Response('Route not found', { status: 404 });
		} catch (e: any) {
			console.error(e);
			return Response.json({ error: e.message }, { status: 500 });
		}
	},
} satisfies ExportedHandler<Env>;
