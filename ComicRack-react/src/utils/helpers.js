/**
 * 工具函数集合
 */

/**
 * 判断当前是否为移动设备
 * @returns {boolean} 是否为移动设备
 */
export const isMobile = () => {
  return window.innerWidth <= 768;
};

/**
 * 判断当前是否为平板设备
 * @returns {boolean} 是否为平板设备
 */
export const isTablet = () => {
  return window.innerWidth > 768 && window.innerWidth <= 1024;
};

/**
 * 判断当前是否为桌面设备
 * @returns {boolean} 是否为桌面设备
 */
export const isDesktop = () => {
  return window.innerWidth > 1024;
};

/**
 * 设置暗黑模式
 * @param {boolean} isDark - 是否为暗黑模式
 */
export const setDarkMode = (isDark) => {
  if (isDark) {
    document.documentElement.setAttribute('data-theme', 'dark');
    document.body.classList.add('dark-mode');
    document.body.classList.remove('light-mode');
    localStorage.setItem('theme', 'dark');
    
    // 设置CSS变量
    document.documentElement.style.setProperty('--primary-color', '#ff6b6b');
    document.documentElement.style.setProperty('--bg-color', '#121212');
    document.documentElement.style.setProperty('--text-color', '#ffffff');
  } else {
    document.documentElement.removeAttribute('data-theme');
    document.body.classList.add('light-mode');
    document.body.classList.remove('dark-mode');
    localStorage.setItem('theme', 'light');
    
    // 设置CSS变量
    document.documentElement.style.setProperty('--primary-color', '#ff6b6b');
    document.documentElement.style.setProperty('--bg-color', '#ffffff');
    document.documentElement.style.setProperty('--text-color', '#333333');
  }
};

/**
 * 获取当前主题模式
 * @returns {string} 当前主题模式 ('light' 或 'dark')
 */
export const getThemeMode = () => {
  return localStorage.getItem('theme') || 'light';
};

/**
 * 初始化主题模式
 * 从localStorage读取用户偏好，如果没有则使用系统偏好
 */
export const initThemeMode = () => {
  const savedTheme = localStorage.getItem('theme');
  if (savedTheme) {
    setDarkMode(savedTheme === 'dark');
  } else {
    // 使用系统偏好
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    setDarkMode(prefersDark);
  }
};

/**
 * 防抖函数
 * @param {Function} func - 要执行的函数
 * @param {number} wait - 等待时间(毫秒)
 * @returns {Function} 防抖后的函数
 */
export const debounce = (func, wait = 300) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

/**
 * 图片加载错误后的处理
 * @param {Event} event - 图片加载错误事件
 */
export const handleImageError = (event) => {
  event.target.src = '/placeholder.png'; // 设置为占位图
  event.target.style.background = '#f0f0f0';
}; 