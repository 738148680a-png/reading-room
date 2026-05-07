# 共读书房 📚

一个温暖的AI共读伴侣。

## 部署教程（超详细版）

### 第一步：上传到GitHub

1. 打开 https://github.com → 登录你的账号
2. 点右上角的 **+** 号 → 选 **New repository**
3. Repository name 填：`reading-app`
4. 选 **Public**
5. 其他都不用勾，直接点 **Create repository**
6. 在新页面里找到 **uploading an existing file** 这个链接，点它
7. 把这个zip解压后的 **所有文件和文件夹** 拖进去
8. 拉到最下面，点 **Commit changes**

### 第二步：连接Vercel部署

1. 打开 https://vercel.com → 用GitHub登录
2. 点 **Add New** → **Project**
3. 找到你刚创建的 `reading-app`，点 **Import**
4. Framework Preset 选 **Vite**
5. 其他都不用改，直接点 **Deploy**
6. 等几分钟，看到 🎉 Congratulations! 就成功了
7. 它会给你一个网址，手机浏览器打开就能用！

### 第三步：添加到手机主屏幕

**iPhone**: 用Safari打开网址 → 点底部分享按钮 → 添加到主屏幕
**Android**: 用Chrome打开网址 → 点右上角菜单 → 添加到主屏幕

### 以后怎么更新？

去GitHub找到对应文件，点铅笔图标编辑，改完commit。Vercel会自动更新。
或者直接把新文件上传覆盖旧文件。

## 功能

- 📚 上传txt/html书籍，自动切章
- 📖 分章阅读，进度自动保存
- 🎙 AI讲故事（逐段大白话讲解）
- 📝 AI共读批注（AI自由评论感兴趣的段落）
- 💬 选段讨论（针对某段跟AI聊）
- 📝 章末感想
- 🎨 双主题切换（棠梨·薄荷 / 月霁·暖窗）
- 💬 5组气泡配色可选
- ⚙️ 每个AI功能独立开关
- 📦 导出/导入数据（换手机用）
