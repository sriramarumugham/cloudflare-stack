import { Hono } from 'hono';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';
import { HTTPException } from 'hono/http-exception';

const postSchema = z.object({
	name: z.string(),
	price: z.number(),
});

const app = new Hono<{ Bindings: Env }>();

app.get('/', (c) => {
	return c.json({ message: 'Hello Word!' });
});

app.post('/product', zValidator('json', postSchema), async (c) => {
	const body = await c.req.json();
	const name = body.name;
	const price = body.price;
	return c.json(`Created product ${name} with price ${price}`);
});

app.get('/product/:id', async (c) => {
	const productId = await c.req.param('id');

	const db = c.env.DB;

	const stmt = db.prepare('SELECT * FROM products WHERE id = ?').bind(productId);

	const product = await stmt.first();

	if (!product) {
		throw new HTTPException(404, { message: `Product with id ${productId} not found` });
	}

	return c.json(product);
});

app.get('/config', async (c) => {
	const cooldownTime = await c.env.APP_CONFIG.get('cool_down_time_seconds');
	const pollingInterval = await c.env.APP_CONFIG.get('polling_interval_seconds');

	return c.json({
		coolDownTime: cooldownTime,
		pollingInterval: pollingInterval,
	});
});

export default app;
