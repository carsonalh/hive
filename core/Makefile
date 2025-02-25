all: hive.wasm

test: hivetest
	./$<

clean:
	rm -f hive.wasm
	rm -f hivetest
	rm -rf build
	rm -rf build_wasm

hive.wasm: hive.c c.c hive.h
	clang --target=wasm32 -nostdlib -Wl,--no-entry -o $@ -Os -std=c11 -DHIVE_WASM $(filter %.c,$^)

# TODO
# hivetest.html: hive.c hive_test.c hive.h build_wasm/libunity.a
# 	emcc -o hivetest.html -Lbuild_wasm -IUnity/src -Os -std=c11 -DHIVE_WASM $(filter %.c,$^) -lunity

hivetest: hive.c hive_test.c hive.h build/libunity.a
	gcc -o $@ -Lbuild -IUnity/src -Wall -Wextra -Wpedantic -std=c11 -g $(filter %.c,$^) -lunity

build/libunity.a: | build
	cmake --build build

build_wasm/libunity.a: | build_wasm
	cmake --build build_wasm

build:
	cmake -B $@ -GNinja -DCMAKE_C_FLAGS="-DUNITY_OUTPUT_COLOR" Unity

build_wasm:
	cmake -B $@ -GNinja -DCMAKE_TOOLCHAIN_FILE=$(EMSDK_DIR)\upstream\emscripten\cmake\Modules\Platform\Emscripten.cmake -DCMAKE_C_FLAGS="-fPIC" Unity

