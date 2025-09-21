wrk.method = "GET"
wrk.headers["Connection"] = "Upgrade"
wrk.headers["Upgrade"] = "websocket"
wrk.headers["Sec-WebSocket-Key"] = "dGhlIHNhbXBsZSBub25jZQ=="
wrk.headers["Sec-WebSocket-Version"] = "13"

function request()
   return wrk.format(nil, nil, nil, "")
end

-- wrk -t4 -c100 -d10s -s websocket.lua ws://localhost:8080
