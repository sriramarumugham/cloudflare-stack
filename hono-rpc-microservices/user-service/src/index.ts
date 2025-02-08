// user-service/index.ts
import { OpenAPIHono, createRoute } from '@hono/zod-openapi';
import { swaggerUI } from '@hono/swagger-ui';
import { z } from 'zod';
import { HTTPException } from 'hono/http-exception';

const app = new OpenAPIHono();

// OpenAPI Documentation Setup
app.doc('/doc', {
	openapi: '3.0.0',
	info: {
		title: 'User Service API',
		version: '1.0.0',
	},
	servers: [{ url: '/' }],
});

app.get('/ui', swaggerUI({ url: '/doc' }));

const users: any = {
	'1': { id: '1', name: 'Alice' },
	'2': { id: '2', name: 'Bob' },
};

const userRoute = createRoute({
	method: 'get',
	path: '/user/{id}',
	request: {
		params: z.object({
			id: z.string().openapi({ param: { name: 'id', in: 'path' }, example: '1' }),
		}),
	},
	responses: {
		200: {
			content: {
				'application/json': {
					schema: z.object({ id: z.string(), name: z.string() }),
				},
			},
			description: 'User details',
		},
		404: {
			content: {
				'application/json': {
					schema: z.object({ error: z.string() }),
				},
			},
			description: 'User not found',
		},
	},
});

app.openapi(userRoute, (c) => {
	const { id } = c.req.valid('param');
	const user = users[id];
	if (!user) throw new HTTPException(404, { message: 'User not found' });
	return c.json(user);
});

export type UserAppType = typeof app;
export default {
	fetch: app.fetch,
} satisfies ExportedHandler<Env>;
