/* ========================================================================= */
/*              c.c - feature-incomplete libc implementation                 */
/* ========================================================================= */

#include "hive.h"

#ifndef HIVE_WASM
#error "this libc implementation is for Wasm builds only"
#endif

void *memcpy(void *dst, const void *src, size_t count)
{
	char *cdst = dst;
	const char *csrc = src;
	while (count--) *cdst++ = *csrc++;
	return dst;
}

void *memset(void *s, int c, size_t n)
{
	char *cs = (char*)s;
	for (int i = 0; i < n; i++)
		cs[i] = (uint8_t)c;
	return s;
}
