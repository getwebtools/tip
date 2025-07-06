/**
 * Tip.js - 轻量级交互组件库
 * 
 * 完全独立的用户交互组件，无需HTML设置，引入即可使用
 * 
 * @example
 * // 引入后直接使用
 * tip.success('操作成功！');
 * tip.error('出现错误！');
 * tip.info('这是一条信息');
 * tip.warning('请注意！');
 * 
 * // 确认对话框
 * tip.confirm('确定要删除吗？', function(confirmed) {
 *     if (confirmed) {
 *         tip.success('已删除！');
 *     }
 * });
 * 
 * // 输入对话框
 * tip.prompt('请输入姓名：', function(value) {
 *     if (value) {
 *         tip.success('欢迎，' + value + '！');
 *     }
 * });
 * 
 * // 加载遮罩
 * tip.showLoading('正在处理...');
 * setTimeout(function() { tip.closeLoading(); }, 2000);
 */

var tip = (function() {
    'use strict';
    
    // 私有变量
    var _modalCallbacks = {};
    var _isInitialized = false;
    var _activeToasts = {}; // 修复：追踪活跃的toast，防止重复移除
    var _loadingCount = 0; // 修复：支持loading的嵌套调用
    
    // 默认配置
    var _defaults = {
        animationDuration: 300,
        easing: 'cubic-bezier(0.68,-0.55,0.265,1.55)',
        toastMaxCount: 5
    };

    // Toast提示配置
    var _toastConfig = {
        success: {
            icon: '<svg fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/></svg>',
            color: '#10b981',
            bg: '#f0fdf4'
        },
        warning: {
            icon: '<svg fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd"/></svg>',
            color: '#f59e0b',
            bg: '#fffbeb'
        },
        info: {
            icon: '<svg fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd"/></svg>',
            color: '#3b82f6',
            bg: '#eff6ff'
        },
        error: {
            icon: '<svg fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"/></svg>',
            color: '#ef4444',
            bg: '#fef2f2'
        }
    };

    // 工具方法
    function _getElement(selector) {
        return document.querySelector(selector);
    }

    function _createElement(tag, className, innerHTML) {
        var element = document.createElement(tag);
        if (className) element.className = className;
        if (innerHTML) element.innerHTML = innerHTML;
        return element;
    }

    function _addEvent(element, event, handler) {
        if (element && typeof handler === 'function') {
            element.addEventListener(event, handler);
        }
    }

    function _removeEvent(element, event, handler) {
        if (element && typeof handler === 'function') {
            element.removeEventListener(event, handler);
        }
    }

    // 生成唯一ID
    function _generateId(prefix) {
        return prefix + '-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
    }

    // 参数验证
    function _validateParams(message, callback, methodName) {
        if (!message || typeof message !== 'string') {
            console.warn('tip.' + methodName + ': message参数无效');
            return false;
        }
        if (callback && typeof callback !== 'function') {
            console.warn('tip.' + methodName + ': callback参数无效');
            return false;
        }
        return true;
    }

    // 检查容器是否存在
    function _checkContainer(containerId, methodName) {
        var container = _getElement(containerId);
        if (!container) {
            console.error('tip.' + methodName + ': ' + containerId + '不存在');
            return null;
        }
        return container;
    }

    // 创建模态框基础样式
    function _createModalBase(modalId) {
        var modalElement = _createElement('div', '', '');
        modalElement.id = modalId;
        modalElement.style.cssText = 'background:white;border-radius:12px;box-shadow:0 20px 25px rgba(0,0,0,0.25);max-width:400px;width:90%;margin:20px;transform:scale(0.9);opacity:0;transition:all ' + _defaults.animationDuration + 'ms ' + _defaults.easing;
        return modalElement;
    }

    // 添加按钮悬停效果
    function _addButtonHoverEffects(cancelBtn, confirmBtn, confirmColor) {
        if (cancelBtn) {
            _addEvent(cancelBtn, 'mouseover', function() {
                this.style.background = '#f9fafb';
                this.style.borderColor = '#9ca3af';
            });
            
            _addEvent(cancelBtn, 'mouseout', function() {
                this.style.background = 'white';
                this.style.borderColor = '#d1d5db';
            });
        }
        
        if (confirmBtn) {
            _addEvent(confirmBtn, 'mouseover', function() {
                this.style.background = confirmColor === '#ef4444' ? '#dc2626' : '#2563eb';
            });
            
            _addEvent(confirmBtn, 'mouseout', function() {
                this.style.background = confirmColor;
            });
        }
    }

    // 显示模态框动画
    function _showModalAnimation(modalElement) {
        if (modalElement) {
            setTimeout(function() {
                modalElement.style.transform = 'scale(1)';
                modalElement.style.opacity = '1';
            }, 10);
        }
    }

    // 自动创建容器
    function _createContainers() {
        var containers = [
            { id: 'toast-container', style: 'position: fixed; top: 20px; right: 20px; z-index: 9999; pointer-events: none;' },
            { id: 'modal-container', style: 'position: fixed; top: 0; left: 0; width: 100%; height: 100%; z-index: 10000; display: none; background: rgba(0,0,0,0.5); align-items: center; justify-content: center;' },
            { id: 'loading-container', style: 'position: fixed; top: 0; left: 0; width: 100%; height: 100%; z-index: 10001; display: none; background: rgba(0,0,0,0.6); align-items: center; justify-content: center;' }
        ];
        
        for (var i = 0; i < containers.length; i++) {
            var container = containers[i];
            if (!_getElement('#' + container.id)) {
                var element = _createElement('div', '', '');
                element.id = container.id;
                element.style.cssText = container.style;
                document.body.appendChild(element);
            }
        }
    }

    // 自动添加CSS样式
    function _addStyles() {
        if (!_getElement('#tip-styles')) {
            var style = _createElement('style', '', '');
            style.id = 'tip-styles';
            style.textContent = '@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }';
            document.head.appendChild(style);
        }
    }

    // 初始化函数
    function _init() {
        if (_isInitialized) return;
        _createContainers();
        _addStyles();
        _isInitialized = true;
    }

    // 确保初始化
    function _ensureInit() {
        if (!_isInitialized) {
            _init();
        }
    }

    // 在DOM加载完成后自动初始化
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', _init);
    } else {
        _init();
    }

    // 修复：清理toast元素的函数
    function _removeToast(toastId) {
        var toastElement = _getElement('#' + toastId);
        if (toastElement && toastElement.parentNode) {
            toastElement.parentNode.removeChild(toastElement);
        }
        delete _activeToasts[toastId];
    }

    // 修复：安全的HTML转义函数
    function _escapeHtml(text) {
        var div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // 返回tip对象
    return {
        /**
         * 显示Toast提示
         * @param {string} message - 提示消息
         * @param {string} type - 提示类型：'success'|'error'|'info'|'warning'
         * @param {object} options - 配置选项
         * @param {number} options.time - 显示时间（秒），默认3秒
         */
        toast: function(message, type, options) {
            _ensureInit();
            
            if (!_validateParams(message, null, 'toast')) return;
            
            type = type || 'info'; // 修复：默认类型改为info更合理
            options = options || {};
            var displayTime = options.time || 3;
            
            // 修复：验证displayTime是否为正数
            if (displayTime <= 0) {
                console.warn('tip.toast: displayTime必须为正数');
                displayTime = 3;
            }
            
            var container = _checkContainer('#toast-container', 'toast');
            if (!container) return;
            
            var config = _toastConfig[type];
            if (!config) {
                console.warn('tip.toast: 无效的type类型:', type);
                type = 'info';
                config = _toastConfig[type];
            }
            
            var toastId = _generateId('toast');
            var style = 'background:' + config.bg + ';border-radius:8px;box-shadow:0 10px 25px rgba(0,0,0,0.15);padding:16px 20px;margin-bottom:10px;min-width:300px;max-width:400px;transform:translateX(100%);opacity:0;transition:all ' + _defaults.animationDuration + 'ms ' + _defaults.easing + ';pointer-events:auto;position:relative;overflow:hidden';
            
            var toastElement = _createElement('div', '', '');
            toastElement.id = toastId;
            toastElement.style.cssText = style;
            // 修复：对message进行HTML转义防止XSS
            var escapedMessage = _escapeHtml(message);
            toastElement.innerHTML = '<div style="display:flex;align-items:flex-start;gap:12px"><div style="flex-shrink:0;width:20px;height:20px;margin-top:2px;color:' + config.color + '">' + config.icon + '</div><p style="flex:1;font-size:14px;line-height:1.5;color:#1f2937;margin:0">' + escapedMessage + '</p></div>';
            
            // 限制Toast数量
            if (container.children.length >= _defaults.toastMaxCount) {
                var oldestToast = container.firstElementChild;
                if (oldestToast) {
                    var oldestId = oldestToast.id;
                    container.removeChild(oldestToast);
                    delete _activeToasts[oldestId];
                }
            }
            
            container.appendChild(toastElement);
            _activeToasts[toastId] = true;
            
            // 显示动画
            setTimeout(function() {
                if (_activeToasts[toastId]) { // 修复：检查toast是否仍然存在
                    toastElement.style.transform = 'translateX(0)';
                    toastElement.style.opacity = '1';
                }
            }, 10);
            
            // 隐藏动画
            setTimeout(function() {
                if (_activeToasts[toastId]) { // 修复：检查toast是否仍然存在
                    toastElement.style.transform = 'translateX(100%)';
                    toastElement.style.opacity = '0';
                    setTimeout(function() {
                        _removeToast(toastId);
                    }, _defaults.animationDuration);
                }
            }, displayTime * 1000);
            
            return toastId; // 修复：返回toastId以便手动控制
        },

        /**
         * 显示确认对话框
         * @param {string} message - 确认消息
         * @param {function} callback - 回调函数，参数为boolean（是否确认）
         * @param {object} options - 配置选项
         * @param {string} options.title - 对话框标题，默认'确认'
         * @param {string} options.confirmText - 确认按钮文字，默认'确定'
         * @param {string} options.cancelText - 取消按钮文字，默认'取消'
         */
        confirm: function(message, callback, options) {
            _ensureInit();
            
            if (!_validateParams(message, callback, 'confirm')) return;
            
            options = options || {};
            var title = options.title || '确认';
            var confirmText = options.confirmText || '确定';
            var cancelText = options.cancelText || '取消';
            
            var container = _checkContainer('#modal-container', 'confirm');
            if (!container) return;
            
            var modalId = _generateId('modal');
            var modalElement = _createModalBase(modalId);
            
            // 修复：对title和message进行HTML转义防止XSS
            var escapedTitle = _escapeHtml(title);
            var escapedMessage = _escapeHtml(message);
            var escapedConfirmText = _escapeHtml(confirmText);
            var escapedCancelText = _escapeHtml(cancelText);
            
            modalElement.innerHTML = '<div style="padding:24px 24px 0"><h3 style="margin:0 0 16px;font-size:18px;font-weight:600;color:#1f2937">' + escapedTitle + '</h3><p style="margin:0;font-size:14px;line-height:1.6;color:#6b7280">' + escapedMessage + '</p></div><div style="padding:16px 24px 24px;display:flex;gap:12px;justify-content:flex-end"><button id="cancel-' + modalId + '" style="padding:8px 16px;border:1px solid #d1d5db;background:white;border-radius:6px;color:#6b7280;cursor:pointer;font-size:14px;transition:all 0.2s">' + escapedCancelText + '</button><button id="confirm-' + modalId + '" style="padding:8px 16px;border:none;background:#ef4444;border-radius:6px;color:white;cursor:pointer;font-size:14px;transition:all 0.2s">' + escapedConfirmText + '</button></div>';
            
            container.innerHTML = '';
            container.appendChild(modalElement);
            container.style.display = 'flex';
            
            _modalCallbacks[modalId] = callback;
            
            var cancelBtn = _getElement('#cancel-' + modalId);
            var confirmBtn = _getElement('#confirm-' + modalId);
            
            _addEvent(cancelBtn, 'click', function() {
                tip.closeModal(modalId, false);
            });
            
            _addEvent(confirmBtn, 'click', function() {
                tip.closeModal(modalId, true);
            });
            
            // 修复：点击遮罩层关闭对话框
            _addEvent(container, 'click', function(e) {
                if (e.target === container) {
                    tip.closeModal(modalId, false);
                }
            });
            
            // 键盘事件
            var keydownHandler = function(e) {
                if (e.keyCode === 13) {
                    e.preventDefault();
                    tip.closeModal(modalId, true);
                } else if (e.keyCode === 27) {
                    e.preventDefault();
                    tip.closeModal(modalId, false);
                }
            };
            
            _addEvent(document, 'keydown', keydownHandler);
            _modalCallbacks[modalId + '_keydown'] = keydownHandler;
            
            _addButtonHoverEffects(cancelBtn, confirmBtn, '#ef4444');
            _showModalAnimation(modalElement);
            
            return modalId; // 修复：返回modalId以便手动控制
        },

        /**
         * 显示输入对话框
         * @param {string} message - 输入提示消息
         * @param {function} callback - 回调函数，参数为string（输入值）或null（取消）
         * @param {object} options - 配置选项
         * @param {string} options.title - 对话框标题，默认'请输入'
         * @param {string} options.placeholder - 输入框占位符
         * @param {string} options.defaultValue - 默认值
         * @param {string} options.confirmText - 确认按钮文字，默认'确定'
         * @param {string} options.cancelText - 取消按钮文字，默认'取消'
         */
        prompt: function(message, callback, options) {
            _ensureInit();
            
            if (!_validateParams(message, callback, 'prompt')) return;
            
            options = options || {};
            var title = options.title || '请输入';
            var placeholder = options.placeholder || '';
            var defaultValue = options.defaultValue || '';
            var confirmText = options.confirmText || '确定';
            var cancelText = options.cancelText || '取消';
            
            var container = _checkContainer('#modal-container', 'prompt');
            if (!container) return;
            
            var modalId = _generateId('modal');
            var modalElement = _createModalBase(modalId);
            
            // 修复：对所有文本内容进行HTML转义防止XSS
            var escapedTitle = _escapeHtml(title);
            var escapedMessage = _escapeHtml(message);
            var escapedPlaceholder = _escapeHtml(placeholder);
            var escapedDefaultValue = _escapeHtml(defaultValue);
            var escapedConfirmText = _escapeHtml(confirmText);
            var escapedCancelText = _escapeHtml(cancelText);
            
            modalElement.innerHTML = '<div style="padding:24px 24px 0"><h3 style="margin:0 0 16px;font-size:18px;font-weight:600;color:#1f2937">' + escapedTitle + '</h3><p style="margin:0 0 16px;font-size:14px;line-height:1.6;color:#6b7280">' + escapedMessage + '</p><input id="prompt-input-' + modalId + '" type="text" value="' + escapedDefaultValue + '" placeholder="' + escapedPlaceholder + '" style="width:100%;padding:10px 12px;border:1px solid #d1d5db;border-radius:6px;font-size:14px;box-sizing:border-box"></div><div style="padding:16px 24px 24px;display:flex;gap:12px;justify-content:flex-end"><button id="cancel-' + modalId + '" style="padding:8px 16px;border:1px solid #d1d5db;background:white;border-radius:6px;color:#6b7280;cursor:pointer;font-size:14px;transition:all 0.2s">' + escapedCancelText + '</button><button id="confirm-' + modalId + '" style="padding:8px 16px;border:none;background:#3b82f6;border-radius:6px;color:white;cursor:pointer;font-size:14px;transition:all 0.2s">' + escapedConfirmText + '</button></div>';
            
            container.innerHTML = '';
            container.appendChild(modalElement);
            container.style.display = 'flex';
            
            _modalCallbacks[modalId] = callback;
            
            var inputElement = _getElement('#prompt-input-' + modalId);
            var cancelBtn = _getElement('#cancel-' + modalId);
            var confirmBtn = _getElement('#confirm-' + modalId);
            
            _addEvent(cancelBtn, 'click', function() {
                tip.closeModal(modalId, false);
            });
            
            _addEvent(confirmBtn, 'click', function() {
                tip.closeModal(modalId, true);
            });
            
            // 修复：点击遮罩层关闭对话框
            _addEvent(container, 'click', function(e) {
                if (e.target === container) {
                    tip.closeModal(modalId, false);
                }
            });
            
            _addButtonHoverEffects(cancelBtn, confirmBtn, '#3b82f6');
            
            // 输入框焦点效果
            if (inputElement) {
                _addEvent(inputElement, 'focus', function() {
                    this.style.borderColor = '#3b82f6';
                    this.style.boxShadow = '0 0 0 3px rgba(59,130,246,0.1)';
                });
                
                _addEvent(inputElement, 'blur', function() {
                    this.style.borderColor = '#d1d5db';
                    this.style.boxShadow = 'none';
                });
            }
            
            // 键盘事件
            var keydownHandler = function(e) {
                if (e.keyCode === 13) {
                    e.preventDefault();
                    tip.closeModal(modalId, true);
                } else if (e.keyCode === 27) {
                    e.preventDefault();
                    tip.closeModal(modalId, false);
                }
            };
            
            _addEvent(document, 'keydown', keydownHandler);
            _modalCallbacks[modalId + '_keydown'] = keydownHandler;
            
            _showModalAnimation(modalElement);
            setTimeout(function() {
                if (inputElement) {
                    inputElement.focus();
                    inputElement.select(); // 修复：选中默认值便于替换
                }
            }, 10);
            
            return modalId; // 修复：返回modalId以便手动控制
        },

        /**
         * 关闭模态框
         * @param {string} modalId - 模态框ID
         * @param {boolean} confirmed - 是否确认操作
         */
        closeModal: function(modalId, confirmed) {
            var modal = _getElement('#' + modalId);
            if (!modal) return;
            
            // 在清理DOM之前先获取输入值
            var inputElement = _getElement('#prompt-input-' + modalId);
            var inputValue = inputElement ? inputElement.value : null;
            
            modal.style.transform = 'scale(0.9)';
            modal.style.opacity = '0';
            
            setTimeout(function() {
                var container = _getElement('#modal-container');
                if (container) {
                    container.style.display = 'none';
                    container.innerHTML = '';
                }
                
                // 清理键盘事件
                var keydownHandler = _modalCallbacks[modalId + '_keydown'];
                if (keydownHandler) {
                    _removeEvent(document, 'keydown', keydownHandler);
                    delete _modalCallbacks[modalId + '_keydown'];
                }
                
                // 执行回调函数
                var callback = _modalCallbacks[modalId];
                if (callback) {
                    try { // 修复：添加错误处理
                        if (inputElement) {
                            // 这是 prompt 对话框
                            if (confirmed) {
                                callback(inputValue);
                            } else {
                                callback(null);
                            }
                        } else {
                            // 这是 confirm 对话框
                            callback(confirmed);
                        }
                    } catch (e) {
                        console.error('tip.closeModal: 回调函数执行错误:', e);
                    }
                    delete _modalCallbacks[modalId];
                }
            }, _defaults.animationDuration);
        },

        /**
         * Loading遮罩对象
         */
        loading: {
            show: function(message) {
                _ensureInit();
                
                var text = message || '加载中...';
                var container = _checkContainer('#loading-container', 'loading.show');
                if (!container) return;
                
                // 修复：支持loading的嵌套调用
                _loadingCount++;
                
                var loadingElement = _createElement('div', '', '');
                loadingElement.style.cssText = 'background:white;border-radius:12px;box-shadow:0 20px 25px rgba(0,0,0,0.25);padding:24px;text-align:center;display:flex;flex-direction:column;align-items:center;justify-content:center;transform:scale(0.9);opacity:0;transition:all ' + _defaults.animationDuration + 'ms ' + _defaults.easing;
                // 修复：对message进行HTML转义防止XSS
                var escapedText = _escapeHtml(text);
                loadingElement.innerHTML = '<div style="width:30px;height:30px;border:2px solid #e5e7eb;border-top:2px solid #3b82f6;border-radius:50%;animation:spin 1s linear infinite;margin-bottom:12px"></div><p style="margin:0;font-size:14px;color:#6b7280">' + escapedText + '</p>';
                
                container.innerHTML = '';
                container.appendChild(loadingElement);
                container.style.display = 'flex';
                
                _showModalAnimation(loadingElement);
            },

            hide: function() {
                // 修复：支持loading的嵌套调用
                _loadingCount--;
                if (_loadingCount > 0) return;
                
                _loadingCount = 0; // 确保不会小于0
                
                var container = _getElement('#loading-container');
                if (!container) return;
                
                var loadingElement = container.firstElementChild;
                if (loadingElement) {
                    loadingElement.style.transform = 'scale(0.9)';
                    loadingElement.style.opacity = '0';
                }
                
                setTimeout(function() {
                    container.style.display = 'none';
                    container.innerHTML = '';
                }, _defaults.animationDuration);
            }
        },

        // 快捷方法
        success: function(message, options) {
            return this.toast(message, 'success', options);
        },
        
        error: function(message, options) {
            return this.toast(message, 'error', options);
        },
        
        info: function(message, options) {
            return this.toast(message, 'info', options);
        },
        
        warning: function(message, options) {
            return this.toast(message, 'warning', options);
        },

        showLoading: function(message) {
            return this.loading.show(message);
        },

        closeLoading: function() {
            return this.loading.hide();
        },

        // 修复：手动关闭指定toast
        closeToast: function(toastId) {
            if (toastId && _activeToasts[toastId]) {
                _removeToast(toastId);
            }
        },

        // 清理方法
        clearToasts: function() {
            var container = _getElement('#toast-container');
            if (container) {
                container.innerHTML = '';
            }
            _activeToasts = {}; // 修复：清空活跃toast记录
        },

        closeAllModals: function() {
            var container = _getElement('#modal-container');
            if (container) {
                container.style.display = 'none';
                container.innerHTML = '';
            }
            
            // 修复：清理所有模态框相关的事件监听器
            for (var callbackId in _modalCallbacks) {
                if (callbackId.indexOf('_keydown') !== -1) {
                    var handler = _modalCallbacks[callbackId];
                    if (handler) {
                        _removeEvent(document, 'keydown', handler);
                    }
                }
            }
            _modalCallbacks = {};
        },

        closeAllLoading: function() {
            var container = _getElement('#loading-container');
            if (container) {
                container.style.display = 'none';
                container.innerHTML = '';
            }
            _loadingCount = 0; // 修复：重置loading计数
        },

        clearAll: function() {
            this.clearToasts();
            this.closeAllModals();
            this.closeAllLoading();
        },

        // 修复：添加销毁方法，完全清理组件
        destroy: function() {
            this.clearAll();
            
            // 移除容器
            var containers = ['#toast-container', '#modal-container', '#loading-container'];
            for (var i = 0; i < containers.length; i++) {
                var container = _getElement(containers[i]);
                if (container && container.parentNode) {
                    container.parentNode.removeChild(container);
                }
            }
            
            // 移除样式
            var styles = _getElement('#tip-styles');
            if (styles && styles.parentNode) {
                styles.parentNode.removeChild(styles);
            }
            
            // 重置状态
            _isInitialized = false;
            _activeToasts = {};
            _modalCallbacks = {};
            _loadingCount = 0;
        },

        // 修复：添加配置方法
        config: function(options) {
            if (typeof options === 'object' && options !== null) {
                if (typeof options.animationDuration === 'number' && options.animationDuration > 0) {
                    _defaults.animationDuration = options.animationDuration;
                }
                if (typeof options.easing === 'string') {
                    _defaults.easing = options.easing;
                }
                if (typeof options.toastMaxCount === 'number' && options.toastMaxCount > 0) {
                    _defaults.toastMaxCount = options.toastMaxCount;
                }
            }
        },

        // 修复：添加获取当前配置的方法
        getConfig: function() {
            return {
                animationDuration: _defaults.animationDuration,
                easing: _defaults.easing,
                toastMaxCount: _defaults.toastMaxCount
            };
        },

        init: function() {
            _init();
        }
    };
})();