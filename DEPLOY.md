# 部署到 GitHub Pages（手机也能刷）

## 第一步：创建 GitHub 仓库

1. 打开 https://github.com ，登录你的账号
2. 点右上角 `+` → `New repository`
3. Repository name 填 `ky-brush`（或你喜欢的名字）
4. 选 **Public**（公开）
5. **不要**勾选 "Add a README file"
6. 点 `Create repository`

## 第二步：推送代码

打开 PowerShell，逐条执行：

```powershell
# 进入项目目录
cd E:\hanako\408-brush

# 初始化 git
git init
git add .
git commit -m "考研刷题网站 v1"

# 关联远程仓库（把下面 YOUR_NAME 换成你的 GitHub 用户名）
git branch -M main
git remote add origin https://github.com/YOUR_NAME/ky-brush.git
git push -u origin main
```

推送时会弹出 GitHub 登录窗口，用浏览器授权即可。

## 第三步：开启 Pages

1. 推送成功后，刷新 GitHub 仓库页面
2. 点 `Settings` → 左侧 `Pages`
3. Source 选 `Deploy from a branch`
4. Branch 选 `main`，文件夹选 `/ (root)`
5. 点 `Save`
6. 等 1-2 分钟，页面顶部会出现 `Your site is live at https://YOUR_NAME.github.io/ky-brush`

## 第四步：验证

手机浏览器打开 `https://YOUR_NAME.github.io/ky-brush`，应该就能看到刷题页面了。

---

## 以后更新题目

每次改了题库后：

```powershell
cd E:\hanako\408-brush
git add .
git commit -m "更新题目"
git push
```

推送完 GitHub Pages 会自动更新，等 1-2 分钟刷新即可。
