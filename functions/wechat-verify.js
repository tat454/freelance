export async function onRequest(context) {
  const url = new URL(context.request.url);
  
  // 检查是否是微信验证文件的请求
  if (url.pathname === '/MP_verify_6a379ab2c88a8d3908491ab3aa038d74.txt') {
    return new Response('6a379ab2c88a8d3908491ab3aa038d74', {
      headers: {
        'content-type': 'text/plain',
      },
    });
  }

  // 如果不是验证文件的请求，返回404
  return new Response('Not Found', { status: 404 });
} 