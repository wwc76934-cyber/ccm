# 个人学习网站（MVP）

这是一个**零依赖**的个人学习网站 MVP，面向“信息技术 + 金融”双主线学习。

## 启动

任意一种方式均可：

### 方式 A：Python

```bash
python3 -m http.server 5173
```

然后打开 `http://localhost:5173`

### 方式 B：Node（如果你有）

```bash
node -e "require('http').createServer((req,res)=>require('fs').createReadStream('.'+(req.url==='/'?'/index.html':req.url)).on('error',()=>{res.statusCode=404;res.end('Not Found')}).pipe(res)).listen(5173)"
```

## 登录说明（MVP）

- 首次登录会让你设置一个本地密码（仅保存在浏览器的 localStorage 中，不上传任何服务器）
- 之后用同一密码解锁

## 进度说明（MVP）

- 每节课可“标记完成/取消完成”
- 进度保存在浏览器 localStorage

## 内容与配置在哪里改

- 路线与练习题数据：`data.js`
- 页面与交互逻辑：`app.js`
- 样式：`styles.css`

## 迁移到“正式版”（Next.js + 数据库）的建议路线

当你的环境有 `npm/pnpm` 后，建议按这个顺序升级（可逐步替换，不必推倒重来）：

1. **框架化**：用 Next.js（App Router）把页面组件化，保留现有信息架构与数据结构
2. **登录升级**：NextAuth（或任意认证方案）替换本地密码
3. **进度入库**：Prisma + SQLite/Postgres，把 `progress.completed` 从 localStorage 迁移到服务端
4. **内容管理**：路线/笔记改用 MDX，支持全文搜索与标签聚合
5. **SQL 练习增强**：先加“我的答案区（可粘贴 SQL）+ 解析与自评”，再考虑沙箱执行与自动判题


