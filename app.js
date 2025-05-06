App({
  globalData: {
    userInfo: null,
    apiBaseUrl: 'https://service-platform-api.170taxi.workers.dev'
  },
  onLaunch() {
    // 檢查登錄狀態
    wx.checkSession({
      fail: () => {
        // session失效，清除登錄信息
        wx.removeStorageSync('token')
      }
    })
  }
}) 