# 服務平台

這是一個使用 Cloudflare Pages 部署的服務平台網站。

## 項目結構

```
/
├── public/          # 靜態文件目錄
│   ├── index.html  # 前端頁面
│   └── admin.html  # 後台管理頁面
├── package.json    # 項目配置
└── README.md      # 項目說明
```

## 部署說明

1. 在 Cloudflare Pages 中創建新項目
2. 連接 Git 倉庫
3. 配置構建設置：
   - 構建命令：`npm run build`
   - 輸出目錄：`public`
   - 框架預設：None

## 開發說明

本地運行：
```bash
npm install
npm start
``` 