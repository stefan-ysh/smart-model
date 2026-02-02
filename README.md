# 智能 3D 模型生成器 (Smart Model Generator)

这是一个基于 Web 的 3D 建模工具，旨在直接在浏览器中创建可定制的、可 3D 打印的模型。支持文字、浮雕、镂空模板和二维码生成。

![Screenshot](public/screenshot.png) _(请在此处添加截图)_

## 功能特性

### 1. 基础模型

- 创建基础几何体：立方体、球体、圆柱、圆锥、圆环。
- 可调节尺寸和精度。

### 2. 3D 文字

- 生成独立的 3D 文字。
- 自定义字体、大小和挤出深度。

### 3. 浮雕与图片浮雕

- 将图片转换为 3D 高度图（深色=低，浅色=高）。
- **独立旋转**：旋转图片图案而不旋转底板。
- **平滑处理**：模糊/平滑细节以获得更好的打印效果。

### 4. 镂空/模板

- 创建带有文字或形状镂空的底板。
- **解耦旋转**：文字目前固定在世界空间中，底板在下方旋转（便于对齐）。
- **开孔**：在指定坐标添加安装孔。

### 5. 二维码

- 生成可打印的 3D 二维码。
- 模式：浮雕（凸起）或凹雕（凹陷）。

## 技术栈

- **框架**: [Next.js](https://nextjs.org/) (React 19)
- **3D 引擎**: [Three.js](https://threejs.org/)
- **React 3D**: [React Three Fiber](https://docs.pmnd.rs/react-three-fiber) & [Drei](https://github.com/pmndrs/drei)
- **CSG (布尔运算)**: [three-bvh-csg](https://github.com/gkjohnson/three-bvh-csg) & [polygon-clipping](https://github.com/mfogel/polygon-clipping)
- **状态管理**: [Zustand](https://github.com/pmndrs/zustand)
- **样式**: [TailwindCSS](https://tailwindcss.com/) & [Shadcn UI](https://ui.shadcn.com/)

## 快速开始

首先，运行开发服务器：

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

在浏览器中打开 [http://localhost:3000](http://localhost:3000) 查看结果。

## 主要操作

- **旋转视图**: 左键拖动
- **平移视图**: 右键拖动
- **缩放**: 滚轮
- **选择图层**: 点击模型或使用图层浮层
- **变换**: 使用坐标轴或侧边栏

## 项目结构

- `src/lib/store.ts`: 全局状态（Zustand）、模型参数、图层选择、导出触发器。
- `src/components/three/Scene.tsx`: 场景组装、相机控制、图层浮层、导出/截图处理。
- `src/components/three/generators/*`: 各模式几何生成。
- `src/components/controls/Panel.tsx`: 右侧参数面板。
- `src/components/three/ExportHandler.tsx`: 导出流程（STL/OBJ/GLTF/GLB）。
- `src/components/three/Draggable*`: 图层拖拽控制（孔位/文字/锚点）。

## 模块梳理

### 渲染与交互
- **Scene**: R3F Canvas、灯光、辅助、导出目标组、图层浮层。
- **图层浮层**: 画布内图层选择与聚焦。
- **Draggable* 坐标轴**: 在 XZ 平面移动孔位/文字/锚点；不参与导出。

### 生成器
- **BasicShape**: 基础几何体。
- **Text3D**: 独立 3D 文字。
- **Relief**: 底板 + 浮雕文字。
- **Stencil**: 镂空底板（polygon clipping）。
- **ImageRelief**: 图片高度图（支持旋转/偏移）。
- **QRCode**: 3D 二维码方块 + 底板 + 开孔。

### 导出
- **ExportHandler**: 收集 `export-target` 下的网格，过滤非导出网格，合并几何并导出。

## 可优化与可修复清单

### 1) 性能优化
- **CSG / polygon clipping 缓存**：引入 LRU 缓存，控制 `Stencil`/`Relief` 的内存增长。
- **二维码方块实例化**：预览用 InstancedMesh，导出再合并几何。
- **重建节流**：拖拽/输入时对几何构建做去抖。
- **减少无效渲染**：拆分大组件，降低 `useMemo` 失效范围。

### 2) 逻辑正确性
- **坐标系一致性**：统一各模式孔位/文字的本地/世界坐标变换规则。
- **导出缩放**：当前导出强制 scale=1，若引入缩放会不一致。
- **模式切换**：确保导出仅由用户触发（已有 guard）。

### 3) 模块合并
- **Draggable* 组件**：抽取公共逻辑（选择、变换、noExport）。
- **孔位变换工具**：抽离重复数学逻辑。
- **底板生成工具**：`Relief`/`ImageRelief`/`Stencil` 共享 shape/polygon 逻辑。

### 4) Lint 与工程化
- **Lint 噪声**：`.agent/skills/*` 产生大量错误，可考虑排除或仅 lint `src/`。
- **类型收敛**：核心模块减少 `any`，提高稳定性。

## License

[MIT](LICENSE)
