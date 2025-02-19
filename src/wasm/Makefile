all: hive.wasm hivetest.exe

clean:
	del hive.wasm
	del hivetest.exe
	rmdir /s /q build
	rmdir /s /q build_wasm

hive.wasm: hive.c
	emcc -s SIDE_MODULE=2 -o $@ -Os -std=c11 -DHIVE_WASM $(filter %.c,$^)

hivetest.html: hive.c hive_test.c hive.h build_wasm/libunity.a
	emcc -o hivetest.html -Lbuild_wasm -IUnity/src -Os -std=c11 -DHIVE_WASM $(filter %.c,$^) -lunity

hivetest.exe: hive.c hive_test.c hive.h build/libunity.a
	gcc -o $@ -Lbuild -IUnity/src -Wall -Wextra -Wpedantic -std=c11 -g $(filter %.c,$^) -lunity

build/libunity.a: | build
	cmake --build build

build_wasm/libunity.a: | build_wasm
	cmake --build build_wasm

build:
	cmake -B $@ -G"MinGW Makefiles" -DCMAKE_C_FLAGS="-DUNITY_OUTPUT_COLOR" Unity

build_wasm:
	cmake -B $@ -G"MinGW Makefiles" -DCMAKE_TOOLCHAIN_FILE=$(EMSDK_DIR)\upstream\emscripten\cmake\Modules\Platform\Emscripten.cmake -DCMAKE_C_FLAGS="-fPIC" Unity

