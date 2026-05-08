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

