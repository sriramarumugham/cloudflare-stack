export default {
	async fetch(request, env: any): Promise<Response> {
		const url = new URL(request.url);
		if (url.pathname.startsWith('/user/')) {
			return await env.USER_SERVICE.fetch(request);
		} else if (url.pathname.startsWith('/tenant/')) {
			return await env.TENANT_SERVICE.fetch(request);
		}
		return new Response(JSON.stringify({ message: 'API Gateway' }), { status: 200, headers: { 'Content-Type': 'application/json' } });
	},
} satisfies ExportedHandler<Env>;
