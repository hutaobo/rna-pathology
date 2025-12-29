# Cloudflare 接入与统计（rna-pathology.com）

## 目的
- 让 rna-pathology.com 的流量经过 Cloudflare（CDN/安全/缓存）
- 使用 Cloudflare 的 HTTP Traffic 统计（Requests/Bandwidth/Unique Visitors）
- 为后续 WAF、Bot 管理、页面规则等打基础

## 当前架构
- 站点托管：GitHub Pages（repo: hutaobo/rna-pathology）
- 域名注册/管理：AWS Route 53（Registered domain）
- DNS/CDN/安全：Cloudflare（Free plan）

## 关键变更（必须记住）
### 1) Route 53 域名 Nameservers 改为 Cloudflare
在 Route 53 -> Registered domains -> rna-pathology.com：
- Nameservers 改为：
  - angela.ns.cloudflare.com
  - dilbert.ns.cloudflare.com
- DNSSEC：未配置（保持关闭；如需启用，后续在 Cloudflare 侧启用）

（旧的 awsdns nameservers 已移除）

### 2) Cloudflare DNS Records（GitHub Pages）
在 Cloudflare -> DNS -> Records：
- A 记录（根域）：
  - @ -> 185.199.108.153 (Proxied)
  - @ -> 185.199.109.153 (Proxied)
  - @ -> 185.199.110.153 (Proxied)
  - @ -> 185.199.111.153 (Proxied)
- CNAME：
  - www -> hutaobo.github.io (Proxied)
- MX / TXT（邮箱相关）：
  - MX: mx1.improvmx.com / mx2.improvmx.com (DNS only)
  - TXT: _dmarc.mail ... (DNS only)

注意：Cloudflare 侧不应保留旧的 awsdns NS 记录（如出现，删除）。

## 验证方法（排障必备）
### Cloudflare 是否接管
- Cloudflare Dashboard 顶部显示：Cloudflare is now protecting your site
- 访问以下 URL 应返回文本（若 404 或 GitHub Pages 404，通常是未走 Cloudflare 或 DNS 缓存未刷新）：
  - https://www.rna-pathology.com/cdn-cgi/trace
  - https://rna-pathology.com/cdn-cgi/trace

### 统计在哪里看
- Cloudflare -> Analytics & logs -> HTTP Traffic
  - Requests / Bandwidth / Unique Visitors
  - 时间范围下拉（例如 Previous 24 hours）

## 常见坑
- DNS 刚切换时本地/运营商缓存会导致访问不走 Cloudflare
- www 与根域配置不一致（GitHub Pages 自定义域配置也要匹配）
- 浏览器 Secure DNS（DoH）可能导致你“以为改了 NS，但你机器还在用旧解析”

## 变更记录
- 2025-12-29：接入 Cloudflare，切换 NS 到 Cloudflare，开启 Proxied DNS 以统计 HTTP Traffic
