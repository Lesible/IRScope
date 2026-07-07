// Decompiled export sketch for YFTime.dll
// Generated from PE export table; unknown pointer/struct types are preserved as void* comments.
#pragma once
#include <stdint.h>
#include <stdbool.h>

#ifdef __cplusplus
extern "C" {
#endif

// TODO: confirm calling convention and parameter types
__declspec(dllimport) int yf_get_arr_from_cur_time(void);

// TODO: confirm calling convention and parameter types
__declspec(dllimport) int yf_get_arr_from_time(void);

// TODO: confirm calling convention and parameter types
__declspec(dllimport) int yf_get_str_from_cur_time(void);

// TODO: confirm calling convention and parameter types
__declspec(dllimport) int yf_get_str_from_time(void);

// TODO: confirm calling convention and parameter types
__declspec(dllimport) int yf_get_tick_count(void);

// TODO: confirm calling convention and parameter types
__declspec(dllimport) int yf_get_tick_count_init(void);

// TODO: confirm calling convention and parameter types
__declspec(dllimport) int yf_get_tick_count_uninit(void);

// TODO: confirm calling convention and parameter types
__declspec(dllimport) int yf_get_time_from_arr(void);

// TODO: confirm calling convention and parameter types
__declspec(dllimport) int yf_time_add(void);

// TODO: confirm calling convention and parameter types
__declspec(dllimport) int yf_time_add_ex(void);

// TODO: confirm calling convention and parameter types
__declspec(dllimport) int yf_time_sub(void);

// TODO: confirm calling convention and parameter types
__declspec(dllimport) int yf_time_sub_ex(void);

#ifdef __cplusplus
}
#endif
