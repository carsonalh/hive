all: hive.wasm hivetest.exe

clean:
	del hive.wasm
	del hivetest.exe
	rmdir /s /q build

hive.wasm: hive.c
	emcc -o $@ -s SIDE_MODULE=1 -s EXPORT_ALL=0 -Os -DHIVE_WASM $^

hivetest.exe: hive.c hive_test.c hive.h | build/libunity.a
	gcc -o $@ -Lbuild -IUnity/src -Wall -Wextra -Wpedantic -std=c99 -g $(filter %.c,$^) -lunity

build/libunity.a: | build
	cmake --build build

build:
	cmake -Bbuild -G"MinGW Makefiles" -DCMAKE_C_FLAGS="-DUNITY_OUTPUT_COLOR" Unity

