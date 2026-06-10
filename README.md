# 美术馆导览预约系统

一套面向美术馆前台、讲解员和教育负责人的导览排班与预约管理页面。系统以展览日历为核心，围绕讲解场次组织观众预约，实现展厅限流、多语言场次管理、亲子/团体/无障碍场次跟踪，以及迟到记录与讲解反馈的全流程闭环。

## 原始需求

> 美术馆需要一套导览预约页面，Vue3 页面呈现展览日历、讲解场次、观众名单和展厅限流。业务内容包括展览主题、语言类型、讲解员、预约人数、儿童团队、无障碍需求、集合点、迟到记录和讲解反馈。前台安排观众进入合适场次，讲解员查看本场观众结构和重点作品，教育负责人关注亲子场、团体场和外语场占用情况。界面气质可以贴近美术馆服务台，但讲解排班、展厅容量和预约状态必须分区明确。

## 技术栈

- **前端框架**: Vue 3 + Composition API + TypeScript
- **构建工具**: Vite 5
- **样式方案**: TailwindCSS 3
- **状态管理**: Pinia
- **路由**: Vue Router 4
- **图表**: Chart.js + vue-chartjs
- **图标**: Lucide Vue Next
- **字体**: Noto Serif SC + Noto Sans SC (Google Fonts)

## 功能模块

| 页面 | 功能 |
|------|------|
| 导览总览 | 展览日历、当日场次看板、展厅限流状态、三角色切换 |
| 场次管理 | 场次列表筛选、场次详情、观众结构、重点展品、讲解反馈 |
| 观众管理 | 预约登记、观众名单搜索、迟到记录、儿童团队标记、无障碍需求 |
| 统计总览 | 亲子/团体/外语场占用统计、展厅容量趋势、讲解反馈汇总与评分分布 |

## 启动方式

### 前置要求

- Node.js 18+ (推荐 20+)
- npm 9+

### Docker 一键启动（推荐）

#### 前置要求

- Docker 20+
- Docker Compose 2+

#### 启动步骤

```bash
docker compose up --build
```

访问地址：http://localhost:3000

后台运行：

```bash
docker compose up --build -d
```

停止并清理：

```bash
docker compose down
```

### 本地开发启动

#### 1. 安装依赖

```bash
npm install
```

#### 2. 启动开发服务器

```bash
npm run dev
```

访问地址：http://localhost:5173

#### 3. 构建生产版本

```bash
npm run build
```

构建产物在 `dist/` 目录下。

## 项目结构

```
src/
  assets/          静态资源
  components/
    common/        通用组件 (CapacityBar, LanguageTag, SessionTypeTag, StatusTag)
    layout/        布局组件 (AppHeader, AppSidebar)
  views/           页面组件
    Dashboard.vue  导览总览页
    Sessions.vue   场次管理页
    Visitors.vue   观众管理页
    Statistics.vue 统计总览页
  stores/          Pinia 状态管理
    app.ts         应用全局状态（角色、日期）
    session.ts     场次数据
    visitor.ts     观众数据
    gallery.ts     展厅数据
    feedback.ts    反馈数据
  mock/            Mock 数据
    data.ts        模拟数据源
  router/          路由配置
  types/           TypeScript 类型定义
  lib/             工具函数
```

## 角色说明

| 角色 | 核心权限 |
|------|----------|
| 前台工作人员 | 查看展览日历、安排观众入场、管理预约名单、记录迟到 |
| 讲解员 | 查看本场观众结构与特殊需求、重点作品列表、提交讲解反馈 |
| 教育负责人 | 查看亲子场/团体场/外语场占用统计、展厅容量总览 |
