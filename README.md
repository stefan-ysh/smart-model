# Smart Model Generator | 智能 3D 模型生成器

A web-based 3D modeling tool designed for creating customizable, 3D-printable models directly in the browser. Supports text, relief maps, stencils, and QR codes.

这是一个基于 Web 的 3D 建模工具，旨在直接在浏览器中创建可定制的、可 3D 打印的模型。支持文字、浮雕、镂空模板和二维码生成。

![Screenshot](public/screenshot.png) _(Add a screenshot here if available /请在此处添加截图)_

## Features | 功能特性

### 1. Basic Shapes (基础模型)

- Create primitives: Cube, Sphere, Cylinder, Cone, Torus.
- Adjustable size and resolution.
- 创建基础几何体：立方体、球体、圆柱、圆锥、圆环。
- 可调节尺寸和精度。

### 2. 3D Text (3D 文字)

- Generate standalone 3D text.
- Custom fonts, sizing, and extrusion depth.
- 生成独立的 3D 文字。
- 自定义字体、大小和挤出深度。

### 3. Relief & Image Relief (浮雕与图片浮雕)

- Convert images to 3D height maps (Dark=Low, Light=High).
- **Independent Rotation**: Rotate the image pattern without rotating the base plate.
- **Smoothing**: Blur/Smooth details for better printing.
- 将图片转换为 3D 高度图（深色=低，浅色=高）。
- **独立旋转**：旋转图片图案而不旋转底板。
- **平滑处理**：模糊/平滑细节以获得更好的打印效果。

### 4. Stencil / Hollow (镂空/模板)

- Create plates with text or shapes cut out.
- **Decoupled Rotation**: Text currently stays fixed in World Space while the plate rotates underneath (useful for alignment).
- **Holes**: Add mounting holes at specific coordinates.
- 创建带有文字或形状镂空的底板。
- **解耦旋转**：文字目前固定在世界空间中，底板在下方旋转（便于对齐）。
- **开孔**：在指定坐标添加安装孔。

### 5. QR Code (二维码)

- Generate printable 3D QR codes.
- Modes: Embossed (Protruding) or Engraved (Recessed).
- 生成可打印的 3D 二维码。
- 模式：浮雕（凸起）或凹雕（凹陷）。

## Tech Stack | 技术栈

- **Framework**: [Next.js](https://nextjs.org/) (React 19)
- **3D Engine**: [Three.js](https://threejs.org/)
- **React 3D**: [React Three Fiber](https://docs.pmnd.rs/react-three-fiber) & [Drei](https://github.com/pmndrs/drei)
- **CSG (Boolean Ops)**: [three-bvh-csg](https://github.com/gkjohnson/three-bvh-csg) & [polygon-clipping](https://github.com/mfogel/polygon-clipping)
- **State Management**: [Zustand](https://github.com/pmndrs/zustand)
- **Styling**: [TailwindCSS](https://tailwindcss.com/) & [Shadcn UI](https://ui.shadcn.com/)

## Getting Started | 快速开始

First, run the development server:
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

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.
在浏览器中打开 [http://localhost:3000](http://localhost:3000) 查看结果。

## Key Controls | 主要操作

- **Rotate View / 旋转视图**: Left Click Drag / 左键拖动
- **Pan View / 平移视图**: Right Click Drag / 右键拖动
- **Zoom / 缩放**: Scroll / 滚轮
- **Select Layer / 选择图层**: Click on model / 点击模型
- **Transform / 变换**: Use Gizmos or Sidebar / 使用坐标轴或侧边栏

## License

[MIT](LICENSE)
