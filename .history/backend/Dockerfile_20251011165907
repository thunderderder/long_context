FROM python:3.9-slim

WORKDIR /app

# 安装依赖
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt gunicorn

# 复制应用代码
COPY . .

# 暴露端口
EXPOSE 8000

# 启动命令
CMD ["gunicorn", "-w", "4", "-b", "0.0.0.0:8000", "--timeout", "120", "app:app"]

