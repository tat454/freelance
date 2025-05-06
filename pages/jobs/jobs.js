const { api } = require('../../utils/request.js')

Page({
  data: {
    keyword: '',
    jobs: [],
    loading: true,
    hasMore: true,
    page: 1,
    pageSize: 10,
    activeFilter: 'all'
  },

  onLoad(options) {
    // 如果有搜索關鍵字，設置到data中
    if (options.keyword) {
      this.setData({ keyword: options.keyword })
    }
    this.loadJobs()
  },

  // 加載職位列表
  async loadJobs(isRefresh = false) {
    if (isRefresh) {
      this.setData({ page: 1, jobs: [] })
    }

    try {
      this.setData({ loading: true })
      const { keyword, page, pageSize, activeFilter } = this.data
      
      // 構建查詢參數
      const params = {
        page,
        pageSize,
        keyword
      }
      
      // 根據篩選條件添加type參數
      if (activeFilter !== 'all') {
        params.type = activeFilter
      }

      const newJobs = await api.getJobs(params)
      
      // 更新數據
      this.setData({
        jobs: [...this.data.jobs, ...newJobs],
        loading: false,
        hasMore: newJobs.length === pageSize
      })
    } catch (error) {
      this.setData({ loading: false })
      wx.showToast({
        title: '加載失敗',
        icon: 'none'
      })
    }
  },

  // 搜索輸入
  onSearchInput(e) {
    this.setData({
      keyword: e.detail.value
    })
  },

  // 搜索按鈕點擊
  onSearch() {
    this.loadJobs(true)
  },

  // 篩選條件點擊
  onFilterTap(e) {
    const type = e.currentTarget.dataset.type
    this.setData({ activeFilter: type }, () => {
      this.loadJobs(true)
    })
  },

  // 跳轉到職位詳情
  goToJobDetail(e) {
    const id = e.currentTarget.dataset.id
    wx.navigateTo({
      url: `/pages/job-detail/job-detail?id=${id}`
    })
  },

  // 下拉刷新
  onPullDownRefresh() {
    this.loadJobs(true).then(() => {
      wx.stopPullDownRefresh()
    })
  },

  // 觸底加載更多
  onReachBottom() {
    if (this.data.hasMore && !this.data.loading) {
      this.setData({
        page: this.data.page + 1
      }, () => {
        this.loadJobs()
      })
    }
  }
}) 