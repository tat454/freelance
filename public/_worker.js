export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;
    
    // 處理微信驗證文件請求
    if (path === '/MP_verify_6a379ab2c88a8d3908491ab3aa038d74.txt') {
      return new Response('6a379ab2c88a8d3908491ab3aa038d74', {
        headers: {
          'Content-Type': 'text/plain',
          'Cache-Control': 'no-cache'
        }
      });
    }

    // 其他請求使用默認的Pages處理
    return env.ASSETS.fetch(request);
  }
}; 