# dsh-web-bypass

`dsh-web-bypass` 为 **DSH `0.2.2-rc.5`** 的 Web 启动命令增加两个独立的开关，默认均关闭。

| 参数 | 行为 |
| --- | --- |
| `--allow-wildcard-host` | 允许通过 `--host 0.0.0.0` 监听所有 IPv4 接口，或通过 `--host ::` 监听所有 IPv6 接口。只传这个开关时仍使用原有的默认地址。IPv6 通配监听能否同时接受 IPv4 连接取决于系统。 |
| `--no-auth` | 允许匿名访问 Web 页面、API 和 WebSocket。启动链接省略 token，响应不签发登录 cookie，请求无需携带凭证。Host 和 Origin 检查继续生效。 |

## 安装

在 DSH Web 的「插件」页面选择「添加插件」，输入插件源码目录或安装包的绝对路径。该路径应能从运行 DSH 的系统访问。

也可以在仓库根目录从终端安装：

```sh
dsh plugin --profile web add .
```

用安装包装时，将 `.` 替换为安装包路径。使用其他 Web profile 时，将 `web` 换成对应名称。

安装后运行 `dsh web --help` 确认两个参数出现，然后重启 Web 服务。使用自定义 profile 时，将启动示例中的 `dsh web` 换成 `dsh --profile <名称>`。

## 启动示例

将示例 IP 换成服务器的实际地址。通配监听时，DSH 默认放行回环地址。要用局域网 IP 或域名访问，只需用 `--trusted-host` 添加地址栏中的那个主机名或 IP，可以附带端口。`--public-url` 用于设置启动时打印的链接。在 IPv6 URL 和 `--trusted-host` 中，IPv6 地址需要用方括号包起来。

```sh
# IPv4 通配监听，保留 DSH 登录。
dsh web --no-open --allow-wildcard-host --host 0.0.0.0 --trusted-host 192.168.1.20 --public-url http://192.168.1.20:3080/

# IPv6 通配监听，保留 DSH 登录。
dsh web --no-open --allow-wildcard-host --host :: --trusted-host '[fd00::20]' --public-url 'http://[fd00::20]:3080/'
```

启用 `--no-auth` 后，能连到端口的客户端可以使用 DSH 的所有者权限。`--trusted-host` 只校验浏览器使用的主机名或 IP。跨设备使用时，请用防火墙、私有网络或外部认证限制端口访问。

```sh
# 默认本机地址，关闭 DSH Web 登录。
dsh web --no-open --no-auth

# IPv4 通配监听与匿名访问同时开启。
dsh web --no-open --allow-wildcard-host --host 0.0.0.0 --trusted-host 192.168.1.20 --public-url http://192.168.1.20:3080/ --no-auth
```

通配监听时，如果省略 `--public-url`，启动时会打印本机回环地址。匿名模式直接使用页面、API 或 `/api/remote.mux`，`/connect` 返回 `204`。

## 开发与打包

- `src/` 包含 Web 参数解析、监听服务和 DSH 运行时加载逻辑。
- `package.json` 声明插件入口、兼容版本和打包文件。
- `cordis.patch.yml` 将插件接入 DSH Web profile。
- `locale/` 和 `icon.svg` 提供插件管理页的中英文信息和图标。

```sh
npm run check
npm run pack:local
```

检查命令验证 JavaScript 语法。打包命令生成 `dist/dsh-web-bypass-0.1.0.tgz`，`dist/` 由 Git 忽略。

## 版本兼容

插件复用 DSH 自带的 HTTP 服务与 Host/Origin 检查，并接入当前版本的内部浏览器认证入口。升级 DSH 后需要重新适配并验证。
