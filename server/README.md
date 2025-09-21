# coturn server

https://github.com/coturn/coturn

/usr/bin/turnserver -c /etc/turnserver.conf
```
realm=turn.codeemo.cn 开放端口
```

coturn 服务器用于提供 TURN (Traversal Using Relays around NAT) 服务，主要帮助 WebRTC 等应用在 NAT 环境下实现媒体流的传输。coturn
服务器需要开放以下端口：

- 3478：默认的 STUN/TURN 协议端口，用于 UDP 和 TCP。
- 5349：用于 TLS/DTLS 连接的端口。
- 49152 - 65535：这是一个范围，用于分配给客户端的 UDP 转发端口。这个范围可以根据实际需求进行配置。

配置示例

在 turnserver.conf 配置文件中，可以指定这些端口：

```text
listening-port=3478
tls-listening-port=5349
min-port=49152
max-port=65535
```

nginx 代理 

```conf
location ^~ / {
  proxy_pass http://127.0.0.1:3478;
  proxy_set_header Host $http_host;
  proxy_set_header X-Real-IP $remote_addr;
  proxy_set_header X-Real-Port $remote_port;
  proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
  proxy_set_header X-Forwarded-Proto $scheme;
  proxy_set_header X-Forwarded-Host $host;
  proxy_set_header X-Forwarded-Port $server_port;
  proxy_set_header REMOTE-HOST $remote_addr;
  
  proxy_connect_timeout 60s;
  proxy_send_timeout 600s;
  proxy_read_timeout 600s;
  proxy_http_version 1.1;
  proxy_set_header Upgrade $http_upgrade;
  proxy_set_header Connection $connection_upgrade;
}
```

注意事项

- 防火墙设置：确保防火墙允许上述端口的流量通过。
- 安全性：建议使用 TLS/DTLS 加密连接，以提高安全性。
- 端口范围：根据实际需求调整 min-port 和 max-port 的值，确保有足够的端口供客户端使用。

# swagger

swag https://github.com/swaggo/swag/blob/master/README_zh-CN.md

```shell
go install github.com/swaggo/swag/cmd/swag@latest
```

swag https://github.com/swaggo/swag/blob/master/README_zh-CN.md

# proto

> Docs: https://grpc.org.cn/docs/languages/go/quickstart/

```shell
protoc --go_out=./pkg/protocol --go-grpc_out=./pkg/protocol ./pkg/protocol/proto/*.proto
```

# tracing

## 安装jaeger

参考：https://github.com/avtion/gormTracing

```shell
docker run -d --name jaeger -e COLLECTOR_ZIPKIN_HTTP_PORT=9411 -p 5775:5775/udp -p 6831:6831/udp -p 6832:6832/udp -p 5778:5778 -p 16686:16686 -p 14268:14268 -p 14250:14250 -p 9411:9411 jaegertracing/all-in-one:1.18
```

访问 `http://localhost:16686` 进入管理ui

# wire

```shell
go get github.com/google/wire/cmd/wire
wire gen .
```


### 各层核心职责总结
| 层级         | 核心职责                                                                 | 典型内容示例                          | 作用价值                                                                 |
|--------------|--------------------------------------------------------------------------|---------------------------------------|--------------------------------------------------------------------------|
| **cmd/**     | 程序入口层，负责服务初始化与启动                                         | `main.go`（初始化配置、路由、服务）   | 统一入口，隔离启动逻辑与业务逻辑                                         |
| **api/**     | 接口交互层，处理HTTP请求/响应、路由与中间件                              | - `handler/`：接口处理器（如登录、查询）<br>- `router/`：路由注册<br>- `middleware/`：认证、日志等中间件<br>- `dto/`：接口输入输出结构体（请求/响应DTO） | 对外暴露接口，隔离外部请求与内部业务；通过DTO定义接口契约，避免内部结构暴露 |
| **internal/entity/** | 数据实体层，映射数据库表结构的"纯数据载体"                               | 与`admin`表对应的`admin.go`、`agency.go` | 直接对应存储层结构，为数据访问层提供操作对象                             |
| **internal/domain/** | 领域模型层，定义核心业务对象与业务规则（含业务属性/行为）                 | 基于`entity`扩展的用户业务模型、机构业务模型 | 封装业务逻辑，与存储结构解耦，聚焦业务本质                               |
| **internal/repository/** | 数据访问层，负责与数据库交互（CRUD），操作`entity`                       | `admin_repo.go`（查询/保存管理员数据） | 隔离数据存储细节（如数据库类型），为服务层提供数据访问接口               |
| **internal/service/** | 业务逻辑层，协调领域模型与数据访问，实现核心业务流程                     | `admin_service.go`（登录校验、权限判断） | 封装业务逻辑，串联数据访问与接口层，避免业务逻辑分散                     |
| **pkg/**     | 公共工具层，存放可复用的通用组件                                         | `config/`（配置读取）、`db/`（数据库连接）、`util/`（工具函数） | 沉淀通用能力，减少代码重复，便于跨模块复用                               |
| **configs/** | 配置文件层，存放环境配置、数据库配置等                                  | `app.yaml`、`db.yaml`                 | 集中管理配置，支持环境差异化配置（如开发/生产环境）                     |
| **migrations/** | 数据库迁移层，存放数据库表结构变更脚本                                   | 表创建/修改SQL脚本                     | 版本化管理数据库结构，便于团队协作与环境同步                             |


### 完整项目结构（含各层）
```
project-name/
├── cmd/                     # 程序入口
│   └── api/                 # API服务入口
│       └── main.go          # 初始化并启动服务（配置、路由、依赖）
├── api/                     # 接口交互层
│   ├── handler/             # 接口处理器（接收请求、调用服务、返回响应）
│   │   ├── admin_handler.go # 管理员相关接口（登录、权限管理等）
│   │   └── agency_handler.go # 企业机构相关接口
│   ├── middleware/          # HTTP中间件
│   │   ├── auth.go          # 认证中间件（校验登录状态、权限）
│   │   └── logger.go        # 日志中间件（记录请求日志）
│   ├── router/              # 路由注册
│   │   └── router.go        # 定义接口路由（关联URL与handler）
│   └── dto/                 # 数据传输对象（接口输入输出结构）
│       ├── admin_dto.go     # 管理员相关DTO（登录请求、信息响应等）
│       └── agency_dto.go    # 企业机构相关DTO
├── internal/                # 内部业务层（私有代码，不对外暴露）
│   ├── entity/              # 数据实体层（映射数据库表）
│   │   ├── admin.go         # 对应`admin`表的实体（字段与表一一对应）
│   │   └── agency.go        # 对应`agency`表的实体
│   ├── domain/              # 领域模型层（业务对象）
│   │   ├── user.go          # 基于`admin`实体的业务模型（含权限等业务属性）
│   │   └── organization.go  # 基于`agency`实体的业务模型
│   ├── repository/          # 数据访问层（操作数据库）
│   │   ├── admin_repo.go    # 管理员数据访问（查询/保存`admin`实体）
│   │   └── agency_repo.go   # 企业机构数据访问
│   └── service/             # 业务逻辑层（实现核心业务）
│       ├── admin_service.go # 管理员业务（登录校验、子账户管理等）
│       └── agency_service.go # 企业机构业务
├── pkg/                     # 公共工具层
│   ├── config/              # 配置读取工具（解析`configs/`下的文件）
│   ├── db/                  # 数据库连接工具（初始化GORM等）
│   ├── logger/              # 日志工具（封装Zap/Logrus）
│   └── util/                # 通用工具（加密、时间处理等）
├── configs/                 # 配置文件
│   ├── app.yaml             # 应用基础配置（端口、环境等）
│   └── db.yaml              # 数据库配置（地址、账号等）
├── migrations/              # 数据库迁移脚本
│   ├── 20240101_create_admin_table.sql
│   └── 20240102_create_agency_table.sql
├── go.mod                   # 依赖管理
└── README.md                # 项目说明
```


### 层间依赖关系说明
- **调用方向**：上层依赖下层，禁止反向依赖（如`handler`→`service`→`repository`→`entity`，不可反向）。
- **数据流转**：
  1. 请求：`HTTP请求`→`router`→`middleware`→`handler`（绑定DTO）→`service`（业务处理）→`repository`（数据查询）→`entity`（数据库交互）；
  2. 响应：`entity`→`repository`→`service`→`handler`（转换为响应DTO）→`HTTP响应`。
- **隔离性**：通过DTO隔离接口与内部模型，通过`repository`隔离业务与数据库，通过`domain`封装业务规则，降低耦合。