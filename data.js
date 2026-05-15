function difficultyForSqlIndex(n) {
  if (n <= 55) return n % 10 < 3 ? "简单" : n % 10 < 7 ? "中等" : n % 2 === 0 ? "较难" : "困难";
  if (n <= 95) return n % 12 < 4 ? "简单" : n % 12 < 9 ? "中等" : n % 2 === 0 ? "较难" : "困难";
  return n % 14 < 4 ? "简单" : n % 14 < 10 ? "中等" : n % 2 === 0 ? "较难" : "困难";
}

export const catalog = {
  it: {
    title: "信息技术路线",
    desc: "先把 SQL 练扎实，再逐步深入 AI/大模型与工程化能力。",
    steps: [
      {
        id: "it-sql-01",
        title: "SQL 基础（可写出正确查询）",
        meta: "SELECT / WHERE / JOIN / GROUP BY｜目标：能做日常数据查询",
        tags: ["SQL", "基础"],
        body:
          "学习点：表/字段/行的概念、过滤、排序、JOIN 思维。\n练习：10~20 道基础题，保证每题都能解释为什么这么写。",
      },
      {
        id: "it-sql-02",
        title: "SQL 进阶（窗口函数与复杂分析）",
        meta: "窗口函数 / 子查询 / CTE｜目标：能写分析型 SQL",
        tags: ["SQL", "进阶"],
        body:
          "学习点：窗口函数的 partition/order/frame；CTE 组织复杂逻辑。\n练习：做 10 道窗口题，至少 3 道自己改题扩展。",
      },
      {
        id: "it-data-01",
        title: "数据建模与指标口径",
        meta: "星型模型 / 维度事实｜目标：知道“数据怎么组织才好用”",
        tags: ["数据", "建模"],
        body:
          "学习点：事实表/维表、粒度、指标口径一致性。\n输出：写一份你常用指标的口径说明（比如 DAU、转化率）。",
      },
      {
        id: "it-llm-01",
        title: "AI / 大模型入门（从会用到懂）",
        meta: "Prompt / RAG / 评估｜目标：能用 LLM 帮你学习与产出",
        tags: ["AI", "LLM"],
        body:
          "学习点：提示词结构、RAG 的检索与引用、如何做简单评估。\n输出：做一个“学习助手”页面：把你的笔记作为检索库。",
      },
      {
        id: "it-eng-01",
        title: "工程化基础（写得出来也跑得起来）",
        meta: "Git / API / 部署｜目标：把作品放到线上",
        tags: ["工程", "部署"],
        body:
          "学习点：Git 基本流、API 基础、静态站部署概念。\n输出：把你的学习站部署到任意静态托管（后续再做）。",
      },
    ],
  },
  finance: {
    title: "金融路线",
    desc: "围绕就业市场常见岗位，把概念变成可表达、可分析、可输出的能力。",
    steps: [
      {
        id: "fin-acc-01",
        title: "财务报表框架（金融语言起步）",
        meta: "三大报表 / 勾稽关系｜目标：看得懂一家公司",
        tags: ["财务", "基础"],
        body:
          "学习点：资产负债表、利润表、现金流的逻辑。\n输出：选一家上市公司做 1 页报表速读笔记。",
      },
      {
        id: "fin-mkt-01",
        title: "金融市场与产品（知道市场在交易什么）",
        meta: "股票/债券/基金/衍生品｜目标：理解常见产品与风险",
        tags: ["市场", "产品"],
        body:
          "学习点：收益来源、风险来源、常见术语。\n输出：做一张“产品地图”，写清每类产品适用场景。",
      },
      {
        id: "fin-val-01",
        title: "估值与基本面（能讲清楚贵与不贵）",
        meta: "相对估值 / DCF 思路｜目标：搭建分析框架",
        tags: ["估值", "投研"],
        body:
          "学习点：估值倍数含义、DCF 的关键假设。\n输出：做一个估值模板（先 Excel/Notion，后续可产品化）。",
      },
      {
        id: "fin-job-01",
        title: "就业与面试（把能力翻译成岗位语言）",
        meta: "JD 关键词 / 常见题｜目标：能自洽地表达",
        tags: ["求职", "面试"],
        body:
          "学习点：岗位能力拆解与项目化表达。\n输出：整理 20 个常见面试问题，写你的回答结构。",
      },
    ],
  },
  sqlExercises: [
    {
      id: "sql-001",
      title: "筛选与排序：找出最近注册用户",
      meta: "SELECT / WHERE / ORDER BY / LIMIT",
      desc: "从 users 表中找出最近注册的 5 个用户（按 created_at 倒序）。",
      schema: `users(user_id, name, created_at)`,
      answer: `SELECT user_id, name, created_at\nFROM users\nORDER BY created_at DESC\nLIMIT 5;`,
    },
    {
      id: "sql-002",
      title: "分组聚合：每个城市的用户数",
      meta: "GROUP BY / COUNT",
      desc: "统计每个 city 的用户数，并按用户数从高到低排序。",
      schema: `users(user_id, name, city)`,
      answer: `SELECT city, COUNT(*) AS user_cnt\nFROM users\nGROUP BY city\nORDER BY user_cnt DESC;`,
    },
    {
      id: "sql-003",
      title: "JOIN：找出下过单的用户",
      meta: "INNER JOIN / DISTINCT",
      desc: "给定 users 与 orders，找出至少下过 1 单的用户列表。",
      schema: `users(user_id, name)\norders(order_id, user_id, amount, created_at)`,
      answer: `SELECT DISTINCT u.user_id, u.name\nFROM users u\nINNER JOIN orders o ON o.user_id = u.user_id;`,
    },
    {
      id: "sql-004",
      title: "窗口函数：每个用户的最近一笔订单",
      meta: "ROW_NUMBER() OVER(PARTITION BY ... ORDER BY ...)",
      desc: "找出每个 user_id 的最近一笔订单（按 created_at）。",
      schema: `orders(order_id, user_id, amount, created_at)`,
      answer: `WITH ranked AS (\n  SELECT\n    *,\n    ROW_NUMBER() OVER(PARTITION BY user_id ORDER BY created_at DESC) AS rn\n  FROM orders\n)\nSELECT order_id, user_id, amount, created_at\nFROM ranked\nWHERE rn = 1;`,
    },
  ],
  sqlStagePlan: (() => {
    const items = [];
    const base = [
      { n: 40, title: "SQL40 每个月 Top3 的周杰伦歌曲", difficulty: "较难", url: "https://www.nowcoder.com/practice/4ab6d198ea8447fe9b6a1cad1f671503?tpId=375&tqId=10737572", note: "窗口函数与分组统计" },
      { n: 41, title: "SQL41 最长连续登录天数", difficulty: "困难", url: "https://www.nowcoder.com/practice/cb8bc687046e4d32ad38de62c48ad79b?tpId=375&tqId=10737573", note: "连续性问题" },
      { n: 42, title: "SQL42 分析客户逾期情况", difficulty: "中等", url: "https://www.nowcoder.com/practice/22633632da344e2492973ecf555e10c9?tpId=375&tqId=10497698", note: "条件聚合" },
      { n: 43, title: "SQL43 获取指定客户每月的消费额", difficulty: "中等", url: "https://www.nowcoder.com/practice/ed04f148b63e469e8f62e051d06a46f5?tpId=375&tqId=10858424", note: "月度统计" },
      { n: 44, title: "SQL44 查询连续入住多晚的客户信息", difficulty: "中等", url: "https://www.nowcoder.com/practice/5b4018c47dfd401d87a5afb5ebf35dfd?tpId=375&tqId=10858425", note: "连续区间" },
      { n: 45, title: "SQL45 统计所有课程参加培训人次", difficulty: "中等", url: "https://www.nowcoder.com/practice/98aad5807cf34a3b960cc8a70ce03f53?tpId=375&tqId=10858426", note: "聚合统计" },
      { n: 46, title: "SQL46 查询培训指定课程的员工信息", difficulty: "简单", url: "https://www.nowcoder.com/practice/a0ef4574056e4a219ee7d651ba82efef?tpId=375&tqId=10858427", note: "热身收尾" },
      { n: 47, title: "SQL47 推荐内容准确的用户平均评分", difficulty: "中等", url: "https://www.nowcoder.com/practice/2dcac73b647247f0aef0b261ed76b47e?tpId=375&tqId=10858428", note: "评分口径" },
      { n: 48, title: "SQL48 每个商品的销售总额", difficulty: "中等", url: "https://www.nowcoder.com/practice/6d796e885ee44a9cb599f47b16a02ea4?tpId=375&tqId=10824294", note: "GROUP BY" },
      { n: 49, title: "SQL49 统计各岗位员工平均工作时长", difficulty: "简单", url: "https://www.nowcoder.com/practice/b7220791a95a4cd092801069aefa1cae?tpId=375&tqId=2452517", note: "快速完成" },
      { n: 50, title: "SQL50 查询连续登陆的用户", difficulty: "较难", url: "https://www.nowcoder.com/practice/9944210610ec417e94140ac09512a3f5?tpId=375&tqId=2371138", note: "窗口技巧" },
      { n: 51, title: "SQL51 统计商家不同会员每日访问人次及访问人数", difficulty: "简单", url: "https://www.nowcoder.com/practice/0017dc22426b495889da3304dcf254d1?tpId=375&tqId=10222179", note: "日粒度" },
      { n: 52, title: "SQL52 统计各等级会员用户下订单总额", difficulty: "简单", url: "https://www.nowcoder.com/practice/48dd35a3dd8c4e1494db36b097a03300?tpId=375&tqId=10221977", note: "会员汇总" },
      { n: 53, title: "SQL53 查询下订单用户访问次数", difficulty: "中等", url: "https://www.nowcoder.com/practice/32bc1e0fce2343ad934b76a025e09fc5?tpId=375&tqId=10221975", note: "访问路径" },
      { n: 54, title: "SQL54 统计用户从访问到下单的转化率", difficulty: "较难", url: "https://www.nowcoder.com/practice/eaff8684aed74e208300f2737edbb083?tpId=375&tqId=10220087", note: "漏斗转化" },
      { n: 55, title: "SQL55 统计员工薪资扣除比例", difficulty: "简单", url: "https://www.nowcoder.com/practice/08db6f0135664ca598b579f8d53dc486?tpId=375&tqId=2480313", note: "规则统计" },
      { n: 56, title: "SQL56 统计用户获得积分", difficulty: "简单", url: "https://www.nowcoder.com/practice/22ed0cd240824bb597b3130fef389cea?tpId=375&tqId=10819551", note: "积分累加" },
      { n: 57, title: "SQL57 更新用户积分信息", difficulty: "中等", url: "https://www.nowcoder.com/practice/ef1f2fda4338460b948810f3f7e7a68e?tpId=375&tqId=10223707", note: "更新类题型" },
      { n: 58, title: "SQL58 查询单日多次下订单的用户信息", difficulty: "简单", url: "https://www.nowcoder.com/practice/9958aed1e74a49b795dfe2cb9d54ee12?tpId=375&tqId=10221993", note: "单日聚合" },
      { n: 59, title: "SQL59 统计各个部门平均薪资", difficulty: "简单", url: "https://www.nowcoder.com/practice/4722fdf89a4c43eebb58d61a19ccab31?tpId=375&tqId=2473552", note: "部门维度" },
      { n: 60, title: "SQL60 统计加班员工占比", difficulty: "中等", url: "https://www.nowcoder.com/practice/6c0a521c36e14c7599eaef858f6f8233?tpId=375&tqId=2455222", note: "比例计算" },
      { n: 61, title: "SQL61 每天登陆最早的用户的内容喜好", difficulty: "中等", url: "https://www.nowcoder.com/practice/24bb13a28267486ba86c1d21459fa90a?tpId=375&tqId=2440462", note: "每天第一名" },
      { n: 62, title: "SQL62 支付间隔平均值", difficulty: "中等", url: "https://www.nowcoder.com/practice/847431ad931e45348eb1ab5657144c28?tpId=375&tqId=2358395", note: "时间间隔统计" },
      { n: 63, title: "SQL63 网易云音乐推荐", difficulty: "较难", url: "https://www.nowcoder.com/practice/048ed413ac0e4cf4a774b906fc87e0e7?tpId=375&tqId=1262829", note: "综合分析题" },
      { n: 64, title: "SQL64 商品交易", difficulty: "简单", url: "https://www.nowcoder.com/practice/f257dfc1b55e42e19eec004aa3cb4174?tpId=375&tqId=1262828", note: "基础交易" },
      { n: 65, title: "SQL65 计算粉丝 CTR", difficulty: "中等", url: "https://www.nowcoder.com/practice/853a6567cf524f63bab0879b8d0bfe62?tpId=375&tqId=10858285", note: "CTR 计算" },
      { n: 66, title: "SQL66 查询成绩", difficulty: "简单", url: "https://www.nowcoder.com/practice/ef30689ae065434c89c129e9dfe1b4cd?tpId=375&tqId=10825311", note: "基础查询" },
      { n: 67, title: "SQL67 被重复观看次数最多的 3 个视频", difficulty: "中等", url: "https://www.nowcoder.com/practice/b75fa2412659422c96369976ee1f9504?tpId=375&tqId=10960094", note: "TopN 分析" },
      { n: 68, title: "SQL68 直播间晚上 11-12 点在线人数", difficulty: "中等", url: "https://www.nowcoder.com/practice/38f5febc9dac4e9e84ed5891a3e4ca05?tpId=375&tqId=10960121", note: "时间区间" },
      { n: 69, title: "SQL69 淘宝店铺的实际销售额与客单价", difficulty: "简单", url: "https://www.nowcoder.com/practice/ce116419a1f141568094b5eab70e5ce8?tpId=375&tqId=2349978", note: "销售与客单价" },
      { n: 70, title: "SQL70 完成员工考核试卷突出员工", difficulty: "较难", url: "https://www.nowcoder.com/practice/422dcd6ae72c49c9bbec1aff90d69806?tpId=375&tqId=2349979", note: "综合筛选" },
      { n: 71, title: "SQL71 查询产生理赔费用的快递信息", difficulty: "简单", url: "https://www.nowcoder.com/practice/d22eab8a0001443fba7c5757ecbcaea?tpId=375&tqId=11136039", note: "业务筛选" },
      { n: 72, title: "SQL72 统计快递运输时长", difficulty: "中等", url: "https://www.nowcoder.com/practice/bb4196936f15424dbabe76a501186d91?tpId=375&tqId=11136040", note: "时长计算" },
      { n: 73, title: "SQL73 统计快递从创建订单到发出间隔时长", difficulty: "简单", url: "https://www.nowcoder.com/practice/be3e56c950724b27aa79b79309147443?tpId=375&tqId=11136041", note: "创建到发出" },
      { n: 74, title: "SQL74 下单最多的商品", difficulty: "简单", url: "https://www.nowcoder.com/practice/d7c93e3a3d5b4087896539121d32d367?tpId=375&tqId=11136042", note: "每日小题" },
    ];
    for (const x of base) items.push({ id: `sql-${x.n}`, index: x.n, title: x.title, difficulty: x.difficulty, url: x.url, note: x.note, done: false });
    for (let n = 75; n <= 148; n++) items.push({ id: `sql-${n}`, index: n, title: `SQL${n} 牛客 SQL 题目 ${n}`, difficulty: difficultyForSqlIndex(n), url: `https://www.nowcoder.com/exam/oj?page=1&tab=SQL%E7%AF%87&topicId=375#SQL${n}`, note: "阶段总览题目", done: false });
    return items;
  })(),
  resources: [
    // 信息技术：SQL
    {
      id: "res-sqlzoo",
      category: "it",
      title: "SQLZOO（SQL 互动练习）",
      desc: "从最基础的 SELECT 开始，循序渐进练 SQL。",
      url: "https://sqlzoo.net/",
      tags: ["SQL", "练习"],
    },
    {
      id: "res-mode",
      category: "it",
      title: "Mode SQL Tutorial（SQL 教程与练习）",
      desc: "讲解清晰，适合补齐分析型 SQL 的思路。",
      url: "https://mode.com/sql-tutorial/",
      tags: ["SQL", "教程"],
    },
    {
      id: "res-postgres-doc",
      category: "it",
      title: "PostgreSQL 官方文档（SQL/函数/窗口）",
      desc: "遇到函数、窗口定义、边界问题时的权威来源。",
      url: "https://www.postgresql.org/docs/",
      tags: ["Postgres", "文档"],
    },
    // 信息技术：AI / 大模型
    {
      id: "res-llm-illustrated",
      category: "it",
      title: "The Illustrated Transformer（图解 Transformer）",
      desc: "用图讲清楚注意力与 Transformer 的核心直觉。",
      url: "https://jalammar.github.io/illustrated-transformer/",
      tags: ["LLM", "Transformer"],
    },
    {
      id: "res-llm-course",
      category: "it",
      title: "Hugging Face LLM Course（免费课程）",
      desc: "从 tokenization 到训练/推理概念，适合系统学习。",
      url: "https://huggingface.co/learn",
      tags: ["LLM", "课程"],
    },
    // 金融：基础
    {
      id: "res-investopedia",
      category: "finance",
      title: "Investopedia（金融术语百科）",
      desc: "遇到术语不懂就查：估值、债券、衍生品、指标等。",
      url: "https://www.investopedia.com/",
      tags: ["术语", "百科"],
    },
    {
      id: "res-damodaran",
      category: "finance",
      title: "Damodaran Online（估值与公司金融）",
      desc: "估值课程、讲义、案例都很全（偏英文）。",
      url: "https://pages.stern.nyu.edu/~adamodar/",
      tags: ["估值", "公司金融"],
    },
    {
      id: "res-cfa-ethics",
      category: "finance",
      title: "CFA Institute（职业能力与行业标准入口）",
      desc: "了解金融行业能力要求、伦理与职业标准。",
      url: "https://www.cfainstitute.org/",
      tags: ["职业", "标准"],
    },
  ],
};

