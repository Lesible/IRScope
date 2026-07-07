// Decompiled export sketch for YFCodec.dll
// Generated from PE export table; unknown pointer/struct types are preserved as void* comments.
#pragma once
#include <stdint.h>
#include <stdbool.h>

#ifdef __cplusplus
extern "C" {
#endif

// TODO: confirm calling convention and parameter types
__declspec(dllimport) int yf_dpcm_decode(void);

// TODO: confirm calling convention and parameter types
__declspec(dllimport) int yf_dpcm_encode(void);

// TODO: confirm calling convention and parameter types
__declspec(dllimport) int yf_dpcm_huff_decode(void);

// TODO: confirm calling convention and parameter types
__declspec(dllimport) int yf_dpcm_huff_encode(void);

// TODO: confirm calling convention and parameter types
__declspec(dllimport) int yf_half_inner_data_zoom(void);

// TODO: confirm calling convention and parameter types
__declspec(dllimport) int yf_huffman_decode(void);

// TODO: confirm calling convention and parameter types
__declspec(dllimport) int yf_huffman_encode(void);

// TODO: confirm calling convention and parameter types
__declspec(dllimport) int yf_lz77_compress(void);

// TODO: confirm calling convention and parameter types
__declspec(dllimport) int yf_lz77_uncompress(void);

// TODO: confirm calling convention and parameter types
__declspec(dllimport) int yf_own_decode(void);

// TODO: confirm calling convention and parameter types
__declspec(dllimport) int yf_own_encode(void);

// TODO: confirm calling convention and parameter types
__declspec(dllimport) int yf_quarter_inner_data_zoom(void);

#ifdef __cplusplus
}
#endif
