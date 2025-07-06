# Tip.js 轻量级交互组件库

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Version](https://img.shields.io/badge/version-1.0.0-green.svg)](https://github.com/getwebtools/tip)
[![Demo](https://img.shields.io/badge/demo-online-brightgreen.svg)](https://getwebtools.github.io/tip/)

一个完全独立的轻量级用户交互组件库，无需任何 HTML 设置，引入 JS 即可使用。支持 Toast 提示、确认对话框、输入对话框、加载遮罩等功能。

## 🚀 特性

- **完全独立** - 无需 HTML 设置，引入 JS 即可使用
- **自动创建** - 自动创建必要的 DOM 容器和 CSS 样式
- **轻量级** - 无外部依赖，兼容所有现代浏览器
- **ES5 语法** - 兼容旧版浏览器
- **类型丰富** - 支持 Toast、Confirm、Prompt、Loading 等多种交互
- **安全可靠** - 内置 XSS 防护和错误处理
- **配置灵活** - 丰富的配置选项和快捷方法

## 📦 安装

### 直接引入

```html
<script src="tip.min.js"></script>
```

## 🎯 快速开始

```html
<!DOCTYPE html>
<html>
<head>
    <title>Tip.js 示例</title>
</head>
<body>
    <button onclick="showDemo()">点击测试</button>
    
    <script src="tip.min.js"></script>
    <script>
        function showDemo() {
            // 显示成功提示
            tip.success('操作成功！');
            
            // 显示确认对话框
            tip.confirm('确定要删除吗？', function(confirmed) {
                if (confirmed) {
                    tip.success('已删除！');
                } else {
                    tip.info('已取消删除。');
                }
            });
        }
    </script>
</body>
</html>
```

## 📚 API 文档

### Toast 提示

显示不同类型的提示消息，支持自定义显示时间。

#### 基础用法

```javascript
// 成功提示
tip.success('操作成功！');

// 错误提示
tip.error('出现错误！');

// 信息提示
tip.info('这是一条信息');

// 警告提示
tip.warning('请注意！');
```

#### 高级用法

```javascript
// 自定义显示时间（秒）
tip.success('操作成功！', { time: 5 });

// 使用通用方法
tip.toast('自定义消息', 'success', { time: 3 });
```

#### 手动控制

```javascript
// 显示 Toast 并获取 ID
var toastId = tip.success('操作成功！');

// 手动关闭指定 Toast
tip.closeToast(toastId);

// 清除所有 Toast
tip.clearToasts();
```

### 确认对话框

显示确认对话框，支持自定义标题和按钮文字。

#### 基础用法

```javascript
tip.confirm('确定要删除吗？', function(confirmed) {
    if (confirmed) {
        tip.success('已删除！');
    } else {
        tip.info('已取消删除。');
    }
});
```

#### 高级用法

```javascript
tip.confirm('这个操作不可撤销，确定要继续吗？', function(confirmed) {
    if (confirmed) {
        tip.showLoading('正在执行...');
        setTimeout(function() {
            tip.closeLoading();
            tip.success('操作完成！');
        }, 2000);
    } else {
        tip.warning('操作已取消。');
    }
}, {
    title: '危险操作',
    confirmText: '确定执行',
    cancelText: '取消操作'
});
```

### 输入对话框

显示输入对话框，支持默认值和占位符。

#### 基础用法

```javascript
tip.prompt('请输入您的姓名：', function(value) {
    if (value) {
        tip.success('欢迎，' + value + '！');
    } else {
        tip.warning('您取消了输入。');
    }
});
```

#### 高级用法

```javascript
tip.prompt('请输入项目名称：', function(value) {
    if (value && value.trim()) {
        tip.success('项目 "' + value + '" 创建成功！');
    } else if (value === null) {
        tip.info('项目创建已取消。');
    } else {
        tip.error('项目名称不能为空！');
    }
}, {
    title: '创建项目',
    placeholder: '请输入项目名称',
    defaultValue: 'my-project',
    confirmText: '创建',
    cancelText: '取消'
});
```

### 加载遮罩

显示加载状态，支持自定义提示文字。

#### 基础用法

```javascript
// 显示加载
tip.showLoading();

// 隐藏加载
tip.closeLoading();
```

#### 高级用法

```javascript
// 显示自定义加载文字
tip.showLoading('正在处理数据...');

// 使用对象方法
tip.loading.show('正在上传文件...');
tip.loading.hide();
```

### 清理方法

```javascript
// 清除所有 Toast
tip.clearToasts();

// 关闭所有模态框
tip.closeAllModals();

// 隐藏所有加载
tip.closeAllLoading();

// 清理所有组件
tip.clearAll();

// 完全销毁组件
tip.destroy();
```

### 配置方法

```javascript
// 设置配置
tip.config({
    animationDuration: 300,    // 动画持续时间（毫秒）
    easing: 'cubic-bezier(0.68,-0.55,0.265,1.55)', // 缓动函数
    toastMaxCount: 5          // Toast 最大显示数量
});

// 获取当前配置
var config = tip.getConfig();
console.log(config);
```

## 🎨 自定义样式

Tip.js 使用内联样式，但你可以通过 CSS 覆盖默认样式：

```css
/* 自定义 Toast 样式 */
#toast-container {
    top: 10px !important;
    right: 10px !important;
}

/* 自定义模态框样式 */
#modal-container {
    background: rgba(0,0,0,0.7) !important;
}

/* 自定义加载样式 */
#loading-container {
    background: rgba(0,0,0,0.8) !important;
}
```

## 🔧 高级用法

### 复杂交互流程

```javascript
function createProject() {
    tip.confirm('是否要开始创建项目？', function(confirmed) {
        if (confirmed) {
            tip.prompt('请输入项目名称：', function(projectName) {
                if (projectName && projectName.trim()) {
                    tip.confirm('项目 "' + projectName + '" 创建成功！是否立即下载？', function(download) {
                        if (download) {
                            tip.showLoading('正在下载项目文件...');
                            setTimeout(function() {
                                tip.closeLoading();
                                tip.success('项目 "' + projectName + '" 下载完成！');
                            }, 2000);
                        } else {
                            tip.info('项目已创建，您可以稍后在项目中下载。');
                        }
                    }, {
                        title: '下载确认',
                        confirmText: '立即下载',
                        cancelText: '稍后下载'
                    });
                } else if (projectName === null) {
                    tip.warning('项目创建已取消。');
                } else {
                    tip.error('项目名称不能为空！');
                }
            }, {
                title: '创建项目',
                placeholder: '请输入项目名称',
                defaultValue: '',
                confirmText: '创建',
                cancelText: '取消'
            });
        } else {
            tip.info('操作已取消。');
        }
    }, {
        title: '项目创建向导',
        confirmText: '开始',
        cancelText: '取消'
    });
}
```

### 错误处理

```javascript
// 添加全局错误处理
window.addEventListener('error', function(e) {
    tip.error('发生错误：' + e.message);
});

// 在异步操作中使用
function asyncOperation() {
    tip.showLoading('正在处理...');
    
    fetch('/api/data')
        .then(function(response) {
            tip.closeLoading();
            if (response.ok) {
                tip.success('数据获取成功！');
            } else {
                tip.error('数据获取失败！');
            }
        })
        .catch(function(error) {
            tip.closeLoading();
            tip.error('网络错误：' + error.message);
        });
}
```

## 🌐 浏览器支持

- Chrome 60+
- Firefox 55+
- Safari 12+
- Edge 79+
- IE 11+ (ES5 语法)

## 📄 许可证

MIT License - 详见 [LICENSE](LICENSE) 文件

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 打开 Pull Request

## 📞 支持

- 📧 邮箱：support@getwebtools.com
- 🐛 问题反馈：[GitHub Issues](https://github.com/getwebtools/tip/issues)
- 📖 在线文档：[https://getwebtools.github.io/tip/](https://getwebtools.github.io/tip/)

## 🔄 更新日志

### v1.0.0
- ✨ 初始版本发布
- 🎯 支持 Toast、Confirm、Prompt、Loading 功能
- 🔒 内置 XSS 防护和错误处理
- 📱 响应式设计，支持移动端
- ⚡ 轻量级，无外部依赖

---

**Tip.js** - 让用户交互更简单！ 🚀
