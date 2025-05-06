const app = getApp()

// 請求封裝
const request = (options) => {
  return new Promise((resolve, reject) => {
    const token = wx.getStorageSync('token')
    
    wx.request({
      url: `${app.globalData.apiBaseUrl}${options.url}`,
      method: options.method || 'GET',
      data: options.data,
      header: {
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : ''
      },
      success: (res) => {
        if (res.statusCode === 200) {
          resolve(res.data)
        } else if (res.statusCode === 401) {
          // token 失效，跳轉登錄
          wx.removeStorageSync('token')
          wx.navigateTo({
            url: '/pages/login/login'
          })
          reject(new Error('未登錄或登錄已過期'))
        } else {
          reject(new Error(res.data.message || '請求失敗'))
        }
      },
      fail: (err) => {
        reject(new Error('網絡請求失敗'))
      }
    })
  })
}

// API 方法
const api = {
  // 獲取職位列表
  getJobs: (params) => {
    return request({
      url: '/api/jobs',
      method: 'GET',
      data: params
    })
  },

  // 獲取職位詳情
  getJobDetail: (id) => {
    return request({
      url: `/api/jobs/${id}`,
      method: 'GET'
    })
  },

  // 用戶登錄
  login: (data) => {
    return request({
      url: '/api/login',
      method: 'POST',
      data
    })
  },

  // 用戶註冊
  register: (data) => {
    return request({
      url: '/api/register',
      method: 'POST',
      data
    })
  },

  // 獲取用戶信息
  getUserInfo: () => {
    return request({
      url: '/api/user',
      method: 'GET'
    })
  }
}

module.exports = {
  request,
  api
} 