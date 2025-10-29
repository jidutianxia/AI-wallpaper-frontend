<template>
  <div class="home">
    <!-- Hero 区域 -->
    <section class="hero-section">
      <div class="hero-content">
        <div class="hero-text">
          <h1 class="hero-title">发现无限创意</h1>
          <p class="hero-subtitle">探索来自全球顶尖AI创作的作品，激发你的创作灵感</p>
          <div class="hero-buttons">
            <el-button type="primary" size="large" class="hero-btn">开始探索</el-button>
            <el-button size="large" class="hero-btn-outline">了解更多</el-button>
          </div>
        </div>
        <div class="hero-image">
          <div class="hero-placeholder">
            <div class="floating-cards">
              <div class="card card-1"></div>
              <div class="card card-2"></div>
              <div class="card card-3"></div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- 热门分类 -->
    <section class="categories-section">
      <div class="container">
        <h2 class="section-title">热门分类</h2>
        <div class="categories-grid">
          <div 
            v-for="category in categories" 
            :key="category.id"
            class="category-card"
            @click="goToCategory(category.id)"
          >
            <div class="category-icon">
              <component :is="category.icon" />
            </div>
            <span class="category-name">{{ category.name }}</span>
          </div>
        </div>
      </div>
    </section>

    <!-- 精选作品 -->
    <section class="featured-section">
      <div class="container">
        <div class="section-header">
          <h2 class="section-title">精选作品</h2>
          <div class="section-tabs">
            <el-button 
              v-for="tab in tabs" 
              :key="tab.key"
              :type="activeTab === tab.key ? 'primary' : ''"
              @click="activeTab = tab.key"
              size="small"
            >
              {{ tab.label }}
            </el-button>
          </div>
        </div>
        
        <div class="wallpapers-grid">
          <div 
            v-for="wallpaper in featuredWallpapers" 
            :key="wallpaper.id"
            class="wallpaper-item"
            @click="goToDetail(wallpaper.id)"
          >
            <div class="wallpaper-image">
              <img :src="wallpaper.thumbUrl" :alt="wallpaper.title" />
              <div class="wallpaper-overlay">
                <el-button :icon="Star" circle size="small" />
                <el-button :icon="Download" circle size="small" />
              </div>
            </div>
            <div class="wallpaper-info">
              <h4 class="wallpaper-title">{{ wallpaper.title }}</h4>
              <div class="wallpaper-meta">
                <span class="author">{{ wallpaper.author }}</span>
                <div class="stats">
                  <span><el-icon><Star /></el-icon> {{ wallpaper.likes }}</span>
                  <span><el-icon><Download /></el-icon> {{ wallpaper.downloads }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div class="load-more">
          <el-button size="large">查看更多作品</el-button>
        </div>
      </div>
    </section>

    <!-- 页脚 -->
    <footer class="footer">
      <div class="container">
        <div class="footer-content">
          <div class="footer-brand">
            <h3>PixFlow</h3>
            <p>发现、分享和创造美好的设计作品。我们致力于为创作者提供最优质的平台。</p>
          </div>
          
          <div class="footer-links">
            <div class="link-group">
              <h4>创作相关</h4>
              <ul>
                <li><a href="#">首页</a></li>
                <li><a href="#">分类</a></li>
                <li><a href="#">关于我们</a></li>
              </ul>
            </div>
            
            <div class="link-group">
              <h4>帮助支持</h4>
              <ul>
                <li><a href="#">帮助中心</a></li>
                <li><a href="#">联系我们</a></li>
                <li><a href="#">意见反馈</a></li>
                <li><a href="#">服务条款</a></li>
              </ul>
            </div>
            
            <div class="link-group">
              <h4>订阅邮件</h4>
              <p>订阅我们的邮件，获取最新的设计灵感和作品推荐。</p>
              <div class="newsletter">
                <el-input placeholder="输入邮箱地址..." />
                <el-button type="primary">订阅</el-button>
              </div>
            </div>
          </div>
        </div>
        
        <div class="footer-bottom">
          <p>© 2023 PixFlow. 保留所有权利。</p>
        </div>
      </div>
    </footer>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { Star, Download, Picture, Camera, Brush, Monitor, Phone } from '@element-plus/icons-vue'

const router = useRouter()

// 响应式数据
const activeTab = ref('latest')
const categories = ref([
  { id: 1, name: '手绘设计', icon: Brush },
  { id: 2, name: 'UI/UX', icon: Monitor },
  { id: 3, name: '摄影', icon: Camera },
  { id: 4, name: '插画', icon: Picture },
  { id: 5, name: '移动端', icon: Phone },
  { id: 6, name: '配色', icon: Star }
])

const tabs = ref([
  { key: 'latest', label: '最新' },
  { key: 'popular', label: '热门' },
  { key: 'featured', label: '精选' }
])

const featuredWallpapers = ref([
  {
    id: 1,
    title: '极简主义思维导图',
    author: '设计师A',
    thumbUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=300&h=400&fit=crop&crop=center',
    likes: 1245,
    downloads: 567
  },
  {
    id: 2,
    title: '未来科技UI界面',
    author: '创作者B',
    thumbUrl: 'https://images.unsplash.com/photo-1551650975-87deedd944c3?w=300&h=400&fit=crop&crop=center',
    likes: 2156,
    downloads: 1023
  },
  {
    id: 3,
    title: '自然风光摄影',
    author: '摄影师C',
    thumbUrl: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=300&h=400&fit=crop&crop=center',
    likes: 3421,
    downloads: 1876
  },
  {
    id: 4,
    title: '抽象艺术插画',
    author: '艺术家D',
    thumbUrl: 'https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=300&h=400&fit=crop&crop=center',
    likes: 987,
    downloads: 432
  },
  {
    id: 5,
    title: '环保包装设计',
    author: '设计团队',
    thumbUrl: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=300&h=400&fit=crop&crop=center',
    likes: 1567,
    downloads: 789
  },
  {
    id: 6,
    title: '现代建筑摄影',
    author: '建筑师E',
    thumbUrl: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=300&h=400&fit=crop&crop=center',
    likes: 2234,
    downloads: 1345
  },
  {
    id: 7,
    title: '时尚品牌视觉',
    author: '品牌设计师',
    thumbUrl: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=300&h=400&fit=crop&crop=center',
    likes: 1876,
    downloads: 923
  },
  {
    id: 8,
    title: '游戏角色艺术',
    author: '游戏美术',
    thumbUrl: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=300&h=400&fit=crop&crop=center',
    likes: 3456,
    downloads: 2134
  }
])

// 方法
const goToCategory = (categoryId) => {
  router.push(`/category/${categoryId}`)
}

const goToDetail = (wallpaperId) => {
  router.push(`/detail/${wallpaperId}`)
}

onMounted(() => {
  // 初始化数据加载
})
</script>

<style scoped>
.home {
  min-height: 100vh;
}

/* Hero 区域 */
.hero-section {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  min-height: 500px;
  display: flex;
  align-items: center;
  position: relative;
  overflow: hidden;
}

.hero-content {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 2rem;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 4rem;
  align-items: center;
}

.hero-text {
  color: white;
}

.hero-title {
  font-size: 3.5rem;
  font-weight: 700;
  margin-bottom: 1rem;
  line-height: 1.2;
}

.hero-subtitle {
  font-size: 1.2rem;
  margin-bottom: 2rem;
  opacity: 0.9;
  line-height: 1.6;
}

.hero-buttons {
  display: flex;
  gap: 1rem;
}

.hero-btn {
  padding: 12px 32px;
  font-size: 1rem;
  border-radius: 8px;
}

.hero-btn-outline {
  background: transparent;
  border: 2px solid white;
  color: white;
  padding: 10px 30px;
  font-size: 1rem;
  border-radius: 8px;
}

.hero-btn-outline:hover {
  background: white;
  color: #667eea;
}

.hero-image {
  display: flex;
  justify-content: center;
  align-items: center;
}

.hero-placeholder {
  width: 400px;
  height: 300px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 20px;
  backdrop-filter: blur(10px);
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}

.floating-cards {
  position: relative;
  width: 100%;
  height: 100%;
}

.card {
  position: absolute;
  background: white;
  border-radius: 12px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
}

.card-1 {
  width: 120px;
  height: 80px;
  top: 20px;
  left: 30px;
  animation: float 3s ease-in-out infinite;
}

.card-2 {
  width: 100px;
  height: 140px;
  top: 60px;
  right: 40px;
  animation: float 3s ease-in-out infinite 1s;
}

.card-3 {
  width: 140px;
  height: 100px;
  bottom: 30px;
  left: 50%;
  transform: translateX(-50%);
  animation: float 3s ease-in-out infinite 2s;
}

@keyframes float {
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-10px); }
}

/* 通用容器 */
.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 2rem;
}

/* 分类区域 */
.categories-section {
  padding: 3.75rem 0;
  background: #f8fafc;
}

.section-title {
  text-align: center;
  font-size: 2.5rem;
  font-weight: 600;
  margin-bottom: 3rem;
  color: #2c3e50;
}

.categories-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: 1.25rem;
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 1.25rem;
}

.category-card {
  background: white;
  padding: 1.5rem 1rem;
  border-radius: 12px;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
}

.category-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.12);
}

.category-icon {
  font-size: 2rem;
  color: #667eea;
  margin-bottom: 0.75rem;
}

.category-name {
  font-size: 1rem;
  font-weight: 600;
  color: #2d3748;
}

/* 精选作品区域 */
.featured-section {
  padding: 4rem 0;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 3rem;
}

.section-tabs {
  display: flex;
  gap: 0.5rem;
}

.wallpapers-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 2rem;
  margin-bottom: 3rem;
}

.wallpaper-item {
  background: white;
  border-radius: 12px;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.wallpaper-item:hover {
  transform: translateY(-5px);
  box-shadow: 0 15px 40px rgba(0, 0, 0, 0.15);
}

.wallpaper-image {
  position: relative;
  height: 200px;
  overflow: hidden;
}

.wallpaper-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s ease;
}

.wallpaper-item:hover .wallpaper-image img {
  transform: scale(1.05);
}

.wallpaper-overlay {
  position: absolute;
  top: 10px;
  right: 10px;
  display: flex;
  gap: 0.5rem;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.wallpaper-item:hover .wallpaper-overlay {
  opacity: 1;
}

.wallpaper-info {
  padding: 1.5rem;
}

.wallpaper-title {
  font-size: 1.1rem;
  font-weight: 600;
  margin-bottom: 0.5rem;
  color: #2c3e50;
}

.wallpaper-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.9rem;
  color: #666;
}

.stats {
  display: flex;
  gap: 1rem;
}

.stats span {
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.load-more {
  text-align: center;
}

/* 页脚区域 */
.footer {
  background: #2c3e50;
  color: white;
  padding: 3rem 0 1rem;
}

.footer-content {
  display: grid;
  grid-template-columns: 1fr 2fr;
  gap: 3rem;
  margin-bottom: 2rem;
}

.footer-brand h3 {
  font-size: 1.8rem;
  font-weight: 700;
  margin-bottom: 1rem;
  color: #667eea;
}

.footer-brand p {
  line-height: 1.6;
  opacity: 0.8;
}

.footer-links {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 2rem;
}

.link-group h4 {
  font-size: 1.1rem;
  font-weight: 600;
  margin-bottom: 1rem;
  color: #667eea;
}

.link-group ul {
  list-style: none;
  padding: 0;
}

.link-group li {
  margin-bottom: 0.5rem;
}

.link-group a {
  color: rgba(255, 255, 255, 0.7);
  text-decoration: none;
  transition: color 0.3s ease;
}

.link-group a:hover {
  color: #667eea;
}

.link-group p {
  font-size: 0.9rem;
  line-height: 1.5;
  opacity: 0.8;
  margin-bottom: 1rem;
}

.newsletter {
  display: flex;
  gap: 0.5rem;
}

.newsletter .el-input {
  flex: 1;
}

.footer-bottom {
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  padding-top: 1rem;
  text-align: center;
  opacity: 0.6;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .hero-content {
    grid-template-columns: 1fr;
    text-align: center;
    gap: 2rem;
  }
  
  .hero-title {
    font-size: 2.5rem;
  }
  
  .hero-buttons {
    justify-content: center;
    gap: 12px;
  }
  
  .section-header {
    flex-direction: column;
    gap: 1rem;
  }
  
  .categories-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 16px;
    padding: 0 16px;
  }
  
  .category-card {
    padding: 20px 12px;
  }
  
  .category-icon {
    font-size: 28px;
    margin-bottom: 8px;
  }
  
  .category-name {
    font-size: 14px;
  }
  
  .wallpapers-grid {
    grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
    gap: 12px;
    padding: 0 16px;
  }
  
  .wallpaper-item {
    border-radius: 8px;
  }
  
  .wallpaper-title {
    font-size: 14px;
  }
  
  .wallpaper-meta {
    font-size: 12px;
  }
  
  .footer-content {
    grid-template-columns: 1fr;
    gap: 2rem;
  }
  
  .footer-links {
    grid-template-columns: 1fr;
    gap: 1.5rem;
  }
  
  .newsletter {
    flex-direction: column;
  }
}

@media (max-width: 480px) {
  .hero-title {
    font-size: 2rem;
  }
  
  .hero-buttons {
    flex-direction: column;
    width: 100%;
  }
  
  .hero-buttons .el-button {
    width: 100%;
  }
  
  .categories-grid {
    grid-template-columns: 1fr;
    gap: 12px;
  }
  
  .category-card {
    padding: 16px 12px;
  }
  
  .category-icon {
    font-size: 24px;
  }
  
  .wallpapers-grid {
    grid-template-columns: 1fr;
    gap: 16px;
  }
  
  .section-title {
    font-size: 1.5rem;
  }
  
  .newsletter {
    flex-direction: column;
    gap: 12px;
  }
  
  .newsletter .el-input {
    width: 100%;
  }
  
  .footer-links {
    text-align: center;
  }
}
</style>