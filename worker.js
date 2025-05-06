addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request))
})

// 移除重复的处理函数
async function handleRequest(request) {
  const url = new URL(request.url)
  return fetch(`https://service-platform.pages.dev${url.pathname}${url.search}`);
}

// 定義 API 路由和處理函數
const apiRoutes = {
  // 基礎路由
  'GET /': handleWelcome,
  
  // 管理員登錄
  'POST /api/admin/login': handleAdminLogin,
  
  // 用戶相關 API
  'GET /api/users': handleGetUsers,
  'POST /api/users': handleCreateUser,
  'GET /api/users/:id': handleGetUser,
  
  // 職位相關 API
  'GET /api/jobs': handleGetJobs,
  'POST /api/jobs': handleCreateJob,
  'GET /api/jobs/:id': handleGetJob,
  'PUT /api/jobs/:id': handleUpdateJob,
  'DELETE /api/jobs/:id': handleDeleteJob,
  
  // 申請相關 API
  'GET /api/applications': handleGetApplications,
  'POST /api/applications': handleCreateApplication,
  
  // 統計數據 API
  'GET /api/stats': handleGetStats,
  
  // 活動記錄 API
  'GET /api/activities': handleGetActivities,
  'POST /api/activities': handleCreateActivity,
  
  // 服務相關 API
  'GET /api/services': handleGetServices,
  'POST /api/services': handleCreateService,
};

// 內存數據作為備用
const fallbackData = {
  jobs: [
    { id: 1, title: '前端工程師', salary: 30000, location: '台北', type: '全職', description: '负责开发和维护Web前端界面' },
    { id: 2, title: '後端工程師', salary: 35000, location: '台北', type: '全職', description: '负责开发服务器端API和业务逻辑' },
  ],
  applications: [
    { id: 1, job_id: 1, applicant_name: '張三', applicant_email: 'zhang@example.com', status: 'pending', applicant_phone: '1234567890' },
    { id: 2, job_id: 2, applicant_name: '李四', applicant_email: 'li@example.com', status: 'processed', applicant_phone: '0987654321' },
  ]
};

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;
    
    // 處理微信驗證文件請求
    if (path === '/MP_verify_6a379ab2c88a8d3908491ab3aa038d74.txt') {
      const content = '6a379ab2c88a8d3908491ab3aa038d74';
      return new Response(content, {
        headers: {
          'content-type': 'text/plain',
          'cache-control': 'no-store',
          'content-length': content.length.toString()
        }
      });
    }

    // 其他請求轉發到Pages
    return fetch(`https://service-platform.pages.dev${path}${url.search}`);
  }
};

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

// 身份驗證檢查
async function isAuthenticated(request, env) {
  const authHeader = request.headers.get('Authorization');
  console.log('[AUTH] Auth header:', authHeader);
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    console.log('[AUTH] No valid auth header found');
    return false;
  }
  
  const token = authHeader.split(' ')[1];
  console.log('[AUTH] Token received:', token);
  console.log('[AUTH] Expected token:', env.ADMIN_TOKEN);
  
  // 使用環境變數中的令牌進行驗證
  return token === env.ADMIN_TOKEN;
}

// 管理員登錄處理
async function handleAdminLogin(request, env) {
  try {
    const { username, password } = await request.json();
    console.log('[LOGIN] Login attempt:', username);
    console.log('[LOGIN] Expected username:', env.ADMIN_USERNAME);
    console.log('[LOGIN] Expected password:', env.ADMIN_PASSWORD);

    if (username === env.ADMIN_USERNAME && password === env.ADMIN_PASSWORD) {
      console.log('[LOGIN] Login successful');
      return new Response(JSON.stringify({
        success: true,
        token: env.ADMIN_TOKEN,
        message: '登錄成功'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log('[LOGIN] Login failed: invalid credentials');
    return new Response(JSON.stringify({
      success: false,
      message: '用戶名或密碼錯誤'
    }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('[LOGIN] Login error:', error);
    return new Response(JSON.stringify({
      success: false,
      message: '無效的請求格式',
      error: error.message
    }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}

// 職位相關處理函數 - 使用D1數據庫
async function handleGetJobs(request, env) {
  try {
    console.log('[JOBS] Fetching all jobs from database');
    
    // 从数据库获取所有职位
    const { results } = await env.DB.prepare(
      "SELECT * FROM jobs ORDER BY id DESC"
    ).all();
    
    if (!results || results.length === 0) {
      console.log('[JOBS] No jobs found in DB, returning fallback data');
      return new Response(JSON.stringify(fallbackData.jobs), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    console.log(`[JOBS] Found ${results.length} jobs in database`);
    return new Response(JSON.stringify(results), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('[JOBS] Error fetching jobs:', error);
    // 失败时回退到使用内存数据
    return new Response(JSON.stringify(fallbackData.jobs), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}

async function handleCreateJob(request, env) {
  try {
    const jobData = await request.json();
    console.log('[JOBS] Creating new job:', jobData);

    // 验证必要字段
    const requiredFields = ['title', 'salary', 'location', 'type'];
    for (const field of requiredFields) {
      if (!jobData[field]) {
        return new Response(JSON.stringify({
          success: false,
          message: `缺少必要字段: ${field}`
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
    }

    // 准备数据 - 确保字段与数据库表匹配
    const { title, description = '', salary, location, type, requirements = '' } = jobData;

    // 插入新职位
    const result = await env.DB.prepare(
      "INSERT INTO jobs (title, description, salary, location, type, requirements) VALUES (?, ?, ?, ?, ?, ?)"
    )
    .bind(title, description, salary, location, type, requirements)
    .run();

    if (result.success) {
      // 获取新插入的记录
      const { results } = await env.DB.prepare(
        "SELECT * FROM jobs WHERE id = ?"
      )
      .bind(result.meta.last_row_id)
      .all();

      const newJob = results[0];
      console.log('[JOBS] Job created successfully:', newJob);

      return new Response(JSON.stringify(newJob), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    } else {
      throw new Error('Failed to insert new job');
    }
  } catch (error) {
    console.error('[JOBS] Error creating job:', error);
    return new Response(JSON.stringify({
      success: false,
      message: '創建職位失敗',
      error: error.message
    }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}

async function handleUpdateJob(request, id, env) {
  try {
    const jobData = await request.json();
    const jobId = parseInt(id);
    console.log(`[JOBS] Updating job ${jobId}:`, jobData);

    // 首先检查职位是否存在
    const existingJob = await env.DB.prepare(
      "SELECT * FROM jobs WHERE id = ?"
    )
    .bind(jobId)
    .first();

    if (!existingJob) {
      console.log(`[JOBS] Job ${jobId} not found`);
      return new Response(JSON.stringify({
        success: false,
        message: '找不到指定職位'
      }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // 准备更新字段
    const { title, description, salary, location, type, requirements } = jobData;
    let updateSQL = "UPDATE jobs SET ";
    const params = [];
    const updateFields = [];

    if (title !== undefined) {
      updateFields.push("title = ?");
      params.push(title);
    }
    if (description !== undefined) {
      updateFields.push("description = ?");
      params.push(description);
    }
    if (salary !== undefined) {
      updateFields.push("salary = ?");
      params.push(salary);
    }
    if (location !== undefined) {
      updateFields.push("location = ?");
      params.push(location);
    }
    if (type !== undefined) {
      updateFields.push("type = ?");
      params.push(type);
    }
    if (requirements !== undefined) {
      updateFields.push("requirements = ?");
      params.push(requirements);
    }

    // 添加更新时间
    updateFields.push("updated_at = CURRENT_TIMESTAMP");
    
    // 如果没有字段更新，直接返回现有记录
    if (updateFields.length === 0) {
      return new Response(JSON.stringify(existingJob), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // 构建完整SQL
    updateSQL += updateFields.join(", ") + " WHERE id = ?";
    params.push(jobId);

    // 执行更新
    const result = await env.DB.prepare(updateSQL)
      .bind(...params)
      .run();

    if (result.success) {
      // 获取更新后的记录
      const updatedJob = await env.DB.prepare(
        "SELECT * FROM jobs WHERE id = ?"
      )
      .bind(jobId)
      .first();

      console.log(`[JOBS] Job ${jobId} updated successfully`);
      return new Response(JSON.stringify(updatedJob), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    } else {
      throw new Error('Failed to update job');
    }
  } catch (error) {
    console.error(`[JOBS] Error updating job:`, error);
    return new Response(JSON.stringify({
      success: false,
      message: '更新職位失敗',
      error: error.message
    }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}

async function handleDeleteJob(request, id, env) {
  try {
    const jobId = parseInt(id);
    console.log(`[JOBS] Deleting job ${jobId}`);

    // 首先检查职位是否存在
    const existingJob = await env.DB.prepare(
      "SELECT * FROM jobs WHERE id = ?"
    )
    .bind(jobId)
    .first();

    if (!existingJob) {
      console.log(`[JOBS] Job ${jobId} not found for deletion`);
      return new Response(JSON.stringify({
        success: false,
        message: '找不到指定職位'
      }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    // 删除职位
    const result = await env.DB.prepare(
      "DELETE FROM jobs WHERE id = ?"
    )
    .bind(jobId)
    .run();

    if (result.success) {
      console.log(`[JOBS] Job ${jobId} deleted successfully`);
      return new Response(JSON.stringify({
        success: true,
        message: '刪除成功',
        deletedJob: existingJob
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    } else {
      throw new Error('Failed to delete job');
    }
  } catch (error) {
    console.error(`[JOBS] Error deleting job ${id}:`, error);
    return new Response(JSON.stringify({
      success: false,
      message: '刪除職位失敗',
      error: error.message
    }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}

async function handleGetJob(request, id, env) {
  try {
    const jobId = parseInt(id);
    console.log(`[JOBS] Getting job details for ${jobId}`);

    // 从数据库获取职位
    const job = await env.DB.prepare(
      "SELECT * FROM jobs WHERE id = ?"
    )
    .bind(jobId)
    .first();

    if (!job) {
      console.log(`[JOBS] Job ${jobId} not found`);
      return new Response(JSON.stringify({
        success: false,
        message: '找不到指定職位'
      }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log(`[JOBS] Returning job details for ${jobId}`);
    return new Response(JSON.stringify(job), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error(`[JOBS] Error fetching job ${id}:`, error);
    
    // 尝试从内存数据获取
    const job = fallbackData.jobs.find(job => job.id === parseInt(id));
    if (job) {
      return new Response(JSON.stringify(job), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    return new Response(JSON.stringify({
      success: false,
      message: '获取职位详情失败',
      error: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}

// 申請相關處理函數 - 使用D1數據庫
async function handleGetApplications(request, env) {
  try {
    console.log('[APPLICATIONS] Fetching all applications');
    
    // 从数据库获取所有申请
    const { results } = await env.DB.prepare(
      "SELECT a.*, j.title as job_title FROM applications a " +
      "LEFT JOIN jobs j ON a.job_id = j.id " +
      "ORDER BY a.id DESC"
    ).all();
    
    if (!results || results.length === 0) {
      console.log('[APPLICATIONS] No applications found in DB, returning fallback data');
      return new Response(JSON.stringify(fallbackData.applications), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    console.log(`[APPLICATIONS] Found ${results.length} applications in database`);
    return new Response(JSON.stringify(results), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('[APPLICATIONS] Error fetching applications:', error);
    // 失败时回退到使用内存数据
    return new Response(JSON.stringify(fallbackData.applications), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}

async function handleCreateApplication(request, env) {
  try {
    const application = await request.json();
    console.log('[APPLICATIONS] Creating new application:', application);

    // 验证必要字段
    const requiredFields = ['job_id', 'applicant_name', 'applicant_email', 'applicant_phone'];
    for (const field of requiredFields) {
      if (!application[field]) {
        return new Response(JSON.stringify({
          success: false,
          message: `缺少必要字段: ${field}`
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
    }

    // 验证申请的职位是否存在
    const jobId = parseInt(application.job_id);
    const job = await env.DB.prepare(
      "SELECT * FROM jobs WHERE id = ?"
    )
    .bind(jobId)
    .first();

    if (!job) {
      return new Response(JSON.stringify({
        success: false,
        message: '申請的職位不存在'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // 准备数据
    const { 
      applicant_name, 
      applicant_email, 
      applicant_phone, 
      cover_letter = '' 
    } = application;

    // 插入新申请
    const result = await env.DB.prepare(
      "INSERT INTO applications (job_id, applicant_name, applicant_email, applicant_phone, cover_letter, status) " +
      "VALUES (?, ?, ?, ?, ?, 'pending')"
    )
    .bind(jobId, applicant_name, applicant_email, applicant_phone, cover_letter)
    .run();

    if (result.success) {
      // 获取新插入的记录
      const { results } = await env.DB.prepare(
        "SELECT a.*, j.title as job_title FROM applications a " +
        "LEFT JOIN jobs j ON a.job_id = j.id " +
        "WHERE a.id = ?"
      )
      .bind(result.meta.last_row_id)
      .all();

      const newApplication = results[0];
      console.log('[APPLICATIONS] Application created successfully:', newApplication);

      return new Response(JSON.stringify({
        success: true,
        message: '申請已提交',
        data: newApplication
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    } else {
      throw new Error('Failed to insert new application');
    }
  } catch (error) {
    console.error('[APPLICATIONS] Error creating application:', error);
    return new Response(JSON.stringify({
      success: false,
      message: '提交申請失敗',
      error: error.message
    }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
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

async function handleGetUser(request, id) {
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