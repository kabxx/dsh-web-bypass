# dsh-web-bypass

为 `dsh web` 增加两个可选启动参数。

- `--allow-wildcard-host` 允许使用 `0.0.0.0` 或 `::` 作为监听地址。
- `--no-auth` 关闭 Web 服务的身份认证。

两个参数默认关闭，原有启动行为保持不变。

当前支持 **DSH `0.2.2-rc.5`**。

## 安装

在 DSH 的 `web` profile 中安装 npm 包。

```sh
dsh plugin --profile web add @kabxx/dsh-web-bypass
```

也可以在 DSH Web 的「插件 → 添加插件」中输入 `@kabxx/dsh-web-bypass`。

安装完成后，运行 `dsh web --help`，确认两个参数已列出，然后重新启动 Web 服务。

如果使用自定义 Web profile，将安装命令中的 `web` 替换为对应名称，启动时通过 `dsh --profile <名称>` 指定。

## 使用

### 关闭身份认证

```sh
dsh web --no-auth
```

默认监听地址为 `127.0.0.1:3080`。启用后，页面、API 和 WebSocket 均可免认证访问，无需启动 token 或认证 cookie。

### 允许通配地址监听

以下示例保留身份认证。将 `192.168.1.20` 换成浏览器实际访问的 IP 或域名。

```sh
dsh web \
  --allow-wildcard-host \
  --host 0.0.0.0 \
  --trusted-host 192.168.1.20:3080 \
  --public-url http://192.168.1.20:3080/
```

- `0.0.0.0` 监听所有 IPv4 网络接口。
- `::` 监听所有 IPv6 网络接口。使用 IPv6 地址时，URL 和 `--trusted-host` 中的地址需要加方括号，例如 `[fd00::20]:3080`。

`--public-url` 设置启动时显示的访问地址。省略时，通配监听会显示本机回环地址。只传 `--allow-wildcard-host` 时，沿用原有的监听地址。

### 同时启用

```sh
dsh web \
  --allow-wildcard-host \
  --host 0.0.0.0 \
  --no-auth \
  --trusted-host 192.168.1.20:3080 \
  --public-url http://192.168.1.20:3080/
```

> **注意**　关闭身份认证后，能连接到 Web 端口的客户端可能以 DSH 所有者权限访问服务。请将端口访问限制在可信网络内。

## 常见问题

### 403 Forbidden

启用 `--no-auth` 后，Host 和 Origin 校验仍然生效。通配监听时，可用 `--trusted-host 192.168.1.20:3080` 添加浏览器地址栏里的 IP 或域名及端口。`127.0.0.1` 默认放行，同一个实例可以同时通过本机回环地址和已添加的可信地址访问。

## 从源码构建

```sh
git clone https://github.com/kabxx/dsh-web-bypass.git
cd dsh-web-bypass

npm run check
npm run pack:local
```

安装包生成在 `dist/`。在仓库目录执行以下命令，可以直接安装本地源码进行测试。

```sh
dsh plugin --profile web add .
```
