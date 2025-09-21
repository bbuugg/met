.PHONY:all
all: web build

.PHONY:build
build:
	cd server && make

.PHONY:web
web:
	cd ./web && npm install && npm run build-only

.PHONY:clean
clean:
	cd server && make clean;\
	rm -rf ./public/assets;\
	rm -rf ./public/index.html

.PHONY:deploy
deploy:
	ssh root@codeemo.cn "su www && cd /www/wwwroot/api.codeemo.cn && git pull && make"