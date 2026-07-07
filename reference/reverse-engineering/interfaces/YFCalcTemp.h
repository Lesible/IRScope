// Decompiled export sketch for YFCalcTemp.dll
// Generated from PE export table; unknown pointer/struct types are preserved as void* comments.
#pragma once
#include <stdint.h>
#include <stdbool.h>

#ifdef __cplusplus
extern "C" {
#endif

// TODO: confirm calling convention and parameter types
__declspec(dllimport) int yf_calc_temp(void);

// TODO: confirm calling convention and parameter types
__declspec(dllimport) int yf_calc_temp_ex(void);

// TODO: confirm calling convention and parameter types
__declspec(dllimport) int yf_temp_get_evn_temp(void);

// TODO: confirm calling convention and parameter types
__declspec(dllimport) int yf_temp_get_mdf(void);

// TODO: confirm calling convention and parameter types
__declspec(dllimport) int yf_temp_get_rel_hum(void);

// TODO: confirm calling convention and parameter types
__declspec(dllimport) int yf_temp_init(void);

// TODO: confirm calling convention and parameter types
__declspec(dllimport) int yf_temp_is_fahrenheit(void);

// TODO: confirm calling convention and parameter types
__declspec(dllimport) int yf_temp_set_env_temp(void);

// TODO: confirm calling convention and parameter types
__declspec(dllimport) int yf_temp_set_fahrenheit(void);

// TODO: confirm calling convention and parameter types
__declspec(dllimport) int yf_temp_set_mdf(void);

// TODO: confirm calling convention and parameter types
__declspec(dllimport) int yf_temp_set_rel_hum(void);

// TODO: confirm calling convention and parameter types
__declspec(dllimport) int yf_temp_uninit(void);

#ifdef __cplusplus
}
#endif
