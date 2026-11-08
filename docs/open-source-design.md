# 前端设计参考与实际采用

2026-11-05。本轮将方案落实到正式路由：首页、搜索/分类、壁纸详情、社区图片详情、个人收藏与共享页面外壳。

| 项目 | 核实内容 | 本项目的采用方式 |
| --- | --- | --- |
| [PhotoSwipe](https://github.com/dimsemenov/PhotoSwipe) | MIT；框架无关的缩放、拖拽、触屏预览；v5 要求真实图片尺寸 | 实际安装 `photoswipe@5.4.4`，通过 `usePhotoViewer` 按需加载。接入快速预览和设备预览，中文按钮、减少动态效果、离页清理。许可证保留在依赖包中。 |
| [wallpaper-gallery](https://github.com/IT-NuanxinPro/wallpaper-gallery) | MIT；Vue 3；阅读 WallpaperGrid、DesktopImageStage、WallpaperCardActions 源码 | 借鉴媒体展示、操作按钮与设备模式分离的组织方式。重新实现本项目组件，未复制其源码、品牌或图片库。 |
| [Flying Bird Wallpaper](https://github.com/OXOYO/Flying-Bird-Wallpaper) | MIT；Vue 3/Electron；多图片来源和独立查看器 | 参考来源与查看器的产品组织；未引入桌面框架、音乐可视化或外部壁纸 API。 |
| [Immich](https://github.com/immich-app/immich) | AGPL-3.0；照片管理与图库浏览 | 参考照片优先的信息层级，不复制其代码或引入其服务。 |

PhotoSwipe 官方资料：[接入](https://photoswipe.com/getting-started/)、[选项](https://photoswipe.com/options/)、[方法](https://photoswipe.com/methods/)。完整 MIT 许可证亦随发布文件保留在 `public/THIRD-PARTY-NOTICES.txt`。

## 视觉规则

深色石墨与浅色银灰共用同一套语义变量，紫色仅用于选中和主要操作。首页使用宽幅选片、缩略图轨道与镜头推进，图库使用横向重点图与普通图片交替；搜索工具集中在上方。设备预览复用 WallpaperStage；放大交互统一交给 PhotoSwipe。保留原品牌标识，不增加宣传段落、伪造榜单或虚构计数。

所有正式列表、详情、点赞、收藏仍请求原后端。首页在列表没有可用作品时使用标为“视觉样片”的本地展示素材；样片不充当后端记录，也不提供正式作品的收藏/管理入口。素材来源见 `src/data/previewWallpapers.js`。原三个方案保留在 `/design-preview`，移除主导航中的设计预览入口。

## 关键变更与验证

- 正式壁纸详情新增收藏操作，个人空间补齐 `wallpaperFavorites` 标签页及导航入口。
- 同一详情页切换作品时使用请求序号阻止旧响应覆盖新作品。
- 默认深色；已有浅色选择继续保留。首次预览动态加载 PhotoSwipe，图片尺寸不足时读取真实尺寸，不猜测比例。
- Vue 单元测试与 Playwright 浏览器检查分开运行；浏览器的有内容场景通过网络拦截提供独立测试数据，未写入真实数据库。
- 构建继续使用独立 `dist-release-*` 目录，避免 Windows 挂载图片占用。

## 截图反馈后的修正

首屏已替换为视口高度约束的三图画廊，移除标签、序号、大标题、轮播缩略图和重复搜索。桌面使用主图加双副图，手机使用上方横图加下方双图。操作优先使用带辅助名称和悬停提示的图标；动效由悬停/聚焦触发，尊重减少动态效果设置。样片的示例身份仅保留在辅助名称中，不生成后端作品。

## 最终轮播方向（覆盖三图修正）

按用户第二张参考图恢复大幅轮播。2026-11-05 使用浏览器实际查看 https://haowallpaper.com/ 首页、卡片悬停和作品详情。参考其图片主导、玻璃悬浮工具和光影反馈；其当前首页是图片网格，本项目按用户偏好保留自有轮播形式，不宣称复刻它的布局。主轮播采用图片同源环境光、镜头推进、柔和切图、图标控制和玻璃缩略图栏；作品名是唯一可见展示文案。设备模式就地切换，全屏走 PhotoSwipe，不再叠加预览对话框。

## 动态媒体参考（2026-11-08）
再次实际访问哲风壁纸 https://haowallpaper.com/ 及动态作品页 https://haowallpaper.com/homeViewLook/17815999759895936 ，并查看用户提供的像素书架视频首帧。沿用本项目既有轮播，借鉴作品背景延伸、设备画框和轻量悬浮操作。
全屏视频使用 PhotoSwipe 官方自定义内容事件 https://photoswipe.com/custom-content/ ，在现有图库内扩展视频，避免另开一套互相冲突的弹窗。服务端使用 FFmpeg/FFprobe 校验原始媒体和生成封面 https://ffmpeg.org/ffprobe.html 。参考站素材没有批量抓取；本地新增样例来自用户指定的 MP4。
