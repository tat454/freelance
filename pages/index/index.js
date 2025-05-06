const { api } = require('../../utils/request.js')

Page({
  data: {
    searchKeyword: '',
    featuredJobs: [],
    categories: [
      { id: 1, name: '全職', icon: '/images/full-time.png' },
      { id: 2, name: '兼職', icon: '/images/part-time.png' },
      { id: 3, name: '實習', icon: '/images/internship.png' },
      { id: 4, name: '臨時工', icon: '/images/temporary.png' }
    ]
  },

  onLoad() {
    this.loadFeaturedJobs()
  },

  // 加載熱門職位
  async loadFeaturedJobs() {
    try {
      const jobs = await api.getJobs({ featured: true, limit: 3 })
      this.setData({
        featuredJobs: jobs.map(job => ({
          ...job,
          tags: [job.type, job.category].filter(Boolean)
        }))
      })
    } catch (error) {
      wx.showToast({
        title: '加載失敗',
        icon: 'none'
      })
    }
  },

  // 搜索輸入
  onSearchInput(e) {
    this.setData({
      searchKeyword: e.detail.value
    })
  },

  // 搜索按鈕點擊
  onSearch() {
    const { searchKeyword } = this.data
    wx.navigateTo({
      url: `/pages/jobs/jobs?keyword=${searchKeyword}`
    })
  },

  // 職位類別點擊
  onCategoryTap(e) {
    const category = e.currentTarget.dataset.category
    wx.navigateTo({
      url: `/pages/jobs/jobs?category=${category}`
    })
  },

  // 跳轉到職位詳情
  goToJobDetail(e) {
    const id = e.currentTarget.dataset.id
    wx.navigateTo({
      url: `/pages/job-detail/job-detail?id=${id}`
    })
  },

  // web-view 加載成功
  bindload: function(e) {
    console.log('web-view 加載成功')
  },

  // web-view 加載失敗
  binderror: function(e) {
    console.error('web-view 加載失敗', e.detail)
    wx.showToast({
      title: '頁面加載失敗',
      icon: 'none'
    })
  }
}) 