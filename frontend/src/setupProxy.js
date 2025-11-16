const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
  console.log('===== setupProxy.js 已加载 =====');
  
  app.use(
    '/api',
    createProxyMiddleware({
      target: 'http://localhost:8000/api',  // 目标包含 /api
      changeOrigin: true,
      logLevel: 'debug',
      onProxyReq: (proxyReq, req, res) => {
        console.log('代理请求:', req.method, req.url, '-> http://localhost:8000/api' + req.url);
      },
      onProxyRes: (proxyRes, req, res) => {
        console.log('代理响应:', req.url, '状态码:', proxyRes.statusCode);
      },
      onError: (err, req, res) => {
        console.error('代理错误:', err.message);
      }
    })
  );
  
  console.log('===== /api 路径已配置代理到 http://localhost:8000/api =====');
};

