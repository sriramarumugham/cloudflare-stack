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

			// 📥 2. Insert a New User (POST /users)
			if (path === '/users' && method === 'POST') {
				const { name, email } = (await request.json()) as any;
				const result = await sql`INSERT INTO users (name, email) VALUES (${name}, ${email}) RETURNING *;`;
				return Response.json({ message: 'User created!', user: result[0] });
			}

			// 📤 3. Fetch All Users (GET /users)
			if (path === '/users' && method === 'GET') {
				const users = await sql`SELECT * FROM users;`;
				return Response.json({ users });
			}

			// 🔍 4. Fetch a User by ID (GET /users/:id)
			const userIdMatch = path.match(/^\/users\/([a-f0-9-]+)$/);
			if (userIdMatch && method === 'GET') {
				const userId = userIdMatch[1];
				const user = await sql`SELECT * FROM users WHERE id = ${userId};`;
				if (user.length === 0) return new Response('User not found', { status: 404 });
				return Response.json(user[0]);
			}

			return new Response('Route not found', { status: 404 });
		} catch (e: any) {
			console.error(e);
			return Response.json({ error: e.message }, { status: 500 });
		}
	},
} satisfies ExportedHandler<Env>;
