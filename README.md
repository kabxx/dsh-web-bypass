# @kabxx/dsh-web-bypass

面向 DeepSeek Harness Web（`0.2.2-rc.5`）的启动参数扩展插件。

- `--allow-wildcard-host`：允许 `--host` 绑定 `0.0.0.0` 或 `::`。
- `--no-auth`：关闭页面、API 与 WebSocket 的身份认证（可达该端口的客户端均具备所有者权限，请仅在可信网络内开放）。

## 安装

```bash
git clone https://github.com/kabxx/dsh-web-bypass.git
cd dsh-web-bypass
npm run pack:local
```

通过 `dsh plugin --profile web add ./dist/kabxx-dsh-web-bypass-0.1.1.tgz` 安装，或在 DSH 插件管理器中选择「添加插件」并填入该 `.tgz`（或仓库目录）的绝对路径，重启 `dsh web` 后生效。

## 使用

本机免认证启动：

```bash
dsh web --no-auth
```

局域网开放（Host / Origin 校验仍开启，需通过 `--trusted-host` 放行浏览器访问地址）：

```bash
dsh web \
  --allow-wildcard-host \
  --host 0.0.0.0 \
  --no-auth \
  --trusted-host 192.168.1.20:3080 \
  --public-url http://192.168.1.20:3080/
```

## 开发

本包无外部依赖，基于 Node.js 原生 ESM 运行，启动时从宿主 DSH（`0.2.2-rc.5`）加载内部模块：

```bash
npm run check
npm pack --dry-run
npm run pack:local
```

## 项目结构

| 路径 | 内容 |
| --- | --- |
| [`src/startup.js`](src/startup.js) | 注册 CLI 启动参数、校验监听地址并解析运行配置 |
| [`src/server.js`](src/server.js) | 应用通配地址绑定、免认证中间件与安全告警 |
| [`src/runtime.js`](src/runtime.js) | 从宿主 DSH 安装目录动态加载运行时模块 |
| [`locale/`](locale/) | 主插件与 `server` 子插件的中英文元信息 |
| [`dist/`](dist/) | `npm run pack:local` 生成的本地安装包 |

插件入口与替换规则见 [package.json](package.json) 和 [cordis.patch.yml](cordis.patch.yml)。
