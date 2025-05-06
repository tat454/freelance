/**
 * Welcome to Cloudflare Workers! This is your first worker.
 *
 * - Run `npm run dev` in your terminal to start a development server
 * - Open a browser tab at http://localhost:8787/ to see your worker in action
 * - Run `npm run deploy` to publish your worker
 *
 * Bind resources to your worker in `wrangler.jsonc`. After adding bindings, a type definition for the
 * `Env` object can be regenerated with `npm run cf-typegen`.
 *
 * Learn more at https://developers.cloudflare.com/workers/
 */

export default {
	async fetch(request: Request): Promise<Response> {
		// 強制清除緩存的請求頭
		const cacheHeaders = {
			'content-type': 'text/plain',
			'cache-control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
			'cdn-cache-control': 'no-cache',
			'cloudflare-cdn-cache-control': 'no-cache',
			'access-control-allow-origin': '*',
			'pragma': 'no-cache',
			'expires': '0',
			'surrogate-control': 'no-store',
			'cf-cache-status': 'BYPASS',
			'vary': '*',
			'age': '0',
			// 添加隨機數以防止緩存
			'etag': new Date().getTime().toString()
		};

		const url = new URL(request.url);
		
		// 處理微信驗證文件請求
		if (url.pathname === '/MP_verify_6a379ab2c88a8d3908491ab3aa038d74.txt') {
			return new Response('6a379ab2c88a8d3908491ab3aa038d74', {
				headers: cacheHeaders
			});
		}

		// 其他請求返回 404
		return new Response('Not Found', { 
			status: 404,
			headers: cacheHeaders
		});
	}
} satisfies ExportedHandler<Env>;
