// 定義 API 路由和處理函數
const apiRoutes = {
  // 基礎路由
  'GET /': handleWelcome,
  
  // 用戶相關 API
  'GET /api/users': handleGetUsers,
  'POST /api/users': handleCreateUser,
  'GET /api/users/:id': handleGetUser,
  
  // 統計數據 API
  'GET /api/stats': handleGetStats,
  
  // 活動記錄 API
  'GET /api/activities': handleGetActivities,
  'POST /api/activities': handleCreateActivity,
  
  // 服務相關 API
  'GET /api/services': handleGetServices,
  'POST /api/services': handleCreateService,
};

// 主要的請求處理函數
addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request));
});

async function handleRequest(request) {
  try {
    // 處理 CORS
    if (request.method === 'OPTIONS') {
      return handleOptions(request);
    }

    // 構建路由鍵
    const url = new URL(request.url);
    const pathname = url.pathname;
    const routeKey = `${request.method} ${pathname}`;

    // 檢查是否需要身份驗證
    if (pathname.startsWith('/api/') && !await isAuthenticated(request)) {
      return new Response(JSON.stringify({
        message: '需要登入',
        status: '未授權',
        timestamp: new Date().toISOString()
      }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // 查找對應的處理函數
    const handler = findHandler(routeKey, apiRoutes);
    if (handler) {
      return await handler(request);
    }

    return new Response(JSON.stringify({
      message: '找不到請求的資源',
      status: '未找到',
      timestamp: new Date().toISOString()
    }), {
      status: 404,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (err) {
    return new Response(JSON.stringify({
      message: '服務器內部錯誤',
      status: '錯誤',
      timestamp: new Date().toISOString(),
      error: err.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}

// CORS 設置
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Max-Age': '86400',
};

function handleOptions(request) {
  return new Response(null, { headers: corsHeaders });
}

// 路由處理器
function findHandler(routeKey, routes) {
  // 直接匹配
  if (routes[routeKey]) {
    return routes[routeKey];
  }
  
  // 參數化路由匹配
  for (const [pattern, handler] of Object.entries(routes)) {
    if (isPatternMatch(routeKey, pattern)) {
      return handler;
    }
  }
  
  return null;
}

function isPatternMatch(routeKey, pattern) {
  const routeParts = routeKey.split('/');
  const patternParts = pattern.split('/');
  
  if (routeParts.length !== patternParts.length) {
    return false;
  }
  
  return patternParts.every((part, i) => 
    part === routeParts[i] || part.startsWith(':')
  );
}

// 身份驗證檢查
async function isAuthenticated(request) {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader) {
    return false;
  }
  // 這裡應該實現真實的身份驗證邏輯
  return true;
}

// 基礎路由處理
async function handleWelcome(request) {
  return new Response(JSON.stringify({
    message: '歡迎使用服務管理系統',
    status: '運行中',
    timestamp: new Date().toISOString()
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}

// API 處理函數
async function handleGetUsers(request) {
  const users = [
    { id: 1, name: '張三', email: 'zhang@example.com', role: 'user' },
    { id: 2, name: '李四', email: 'li@example.com', role: 'admin' }
  ];
  return new Response(JSON.stringify(users), { headers: corsHeaders });
}

async function handleGetUser(request) {
  const url = new URL(request.url);
  const id = url.pathname.split('/').pop();
  const user = { id: parseInt(id), name: '張三', email: 'zhang@example.com' };
  return new Response(JSON.stringify(user), { headers: corsHeaders });
}

async function handleGetStats(request) {
  const stats = {
    totalUsers: 1234,
    activeUsers: 856,
    orders: 432,
    revenue: 12345,
    growth: {
      users: '12%',
      orders: '15%',
      revenue: '20%'
    }
  };
  return new Response(JSON.stringify(stats), { headers: corsHeaders });
}

async function handleGetActivities(request) {
  const activities = [
    { id: 1, time: '2024-03-20 10:30', user: '張三', action: '購買服務', status: 'completed' },
    { id: 2, time: '2024-03-20 09:15', user: '李四', action: '註冊帳號', status: 'completed' },
    { id: 3, time: '2024-03-19 16:45', user: '王五', action: '更新資料', status: 'pending' }
  ];
  return new Response(JSON.stringify(activities), { headers: corsHeaders });
}

async function handleCreateActivity(request) {
  const data = await request.json();
  // 這裡應該有數據驗證和數據庫操作
  return new Response(JSON.stringify({
    success: true,
    message: '活動記錄已創建',
    data: { id: Date.now(), ...data }
  }), { headers: corsHeaders });
}

async function handleGetServices(request) {
  const services = [
    { id: 1, name: '快速服務', description: '提供快速高效的服務', price: 100 },
    { id: 2, name: '安全可靠', description: '確保數據安全和隱私保護', price: 200 },
    { id: 3, name: '專業支持', description: '24/7專業技術支持團隊', price: 300 }
  ];
  return new Response(JSON.stringify(services), { headers: corsHeaders });
}

async function handleCreateService(request) {
  const data = await request.json();
  // 這裡應該有數據驗證和數據庫操作
  return new Response(JSON.stringify({
    success: true,
    message: '服務已創建',
    data: { id: Date.now(), ...data }
  }), { headers: corsHeaders });
}

async function handleCreateUser(request) {
  const data = await request.json();
  // 這裡應該有數據驗證和數據庫操作
  return new Response(JSON.stringify({
    success: true,
    message: '用戶已創建',
    data: { id: Date.now(), ...data }
  }), { headers: corsHeaders });
} 