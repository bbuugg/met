.PHONY:all build web clean

all: web build

build:
	cd server && make

web:
	cd ./web && npm install && npm run build-only

clean:
	cd server && make clean;\
	rm -rf ./public/assets;\
	rm -rf ./public/index.html