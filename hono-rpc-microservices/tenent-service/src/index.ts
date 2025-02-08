// tenant-service/index.ts
import { OpenAPIHono, createRoute } from '@hono/zod-openapi';
import { swaggerUI } from '@hono/swagger-ui';
import { z } from 'zod';
import { HTTPException } from 'hono/http-exception';

const app = new OpenAPIHono();

// OpenAPI Documentation Setup
app.doc('/doc', {
	openapi: '3.0.0',
	info: {
		title: 'Tenant Service API',
		version: '1.0.0',
	},
	servers: [{ url: '/' }],
});

app.get('/ui', swaggerUI({ url: '/doc' }));

const tenants: any = {
	'1': { id: '1', name: 'Tenant A' },
	'2': { id: '2', name: 'Tenant B' },
};

const tenantRoute = createRoute({
	method: 'get',
	path: '/tenant/{id}',
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
			description: 'Tenant details',
		},
		404: {
			content: {
				'application/json': {
					schema: z.object({ error: z.string() }),
				},
			},
			description: 'Tenant not found',
		},
	},
});

app.openapi(tenantRoute, (c) => {
	const { id } = c.req.valid('param');
	const tenant = tenants[id];
	if (!tenant) throw new HTTPException(404, { message: 'Tenant not found' });
	return c.json(tenant);
});

const allTenantsRoute = createRoute({
	method: 'get',
	path: '/tenants',
	responses: {
		200: {
			content: {
				'application/json': {
					schema: z.array(z.object({ id: z.string(), name: z.string() })),
				},
			},
			description: 'List of all tenants',
		},
	},
});

app.openapi(allTenantsRoute, (c) => c.json(Object.values(tenants)));

export type TenantAppType = typeof app;
export default {
	fetch: app.fetch,
} satisfies ExportedHandler<Env>;
