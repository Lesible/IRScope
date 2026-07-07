// Decompiled export sketch for YFSound.dll
// Generated from PE export table; unknown pointer/struct types are preserved as void* comments.
#pragma once
#include <stdint.h>
#include <stdbool.h>

#ifdef __cplusplus
extern "C" {
#endif

// TODO: confirm calling convention and parameter types
__declspec(dllimport) int yf_sound_get_data(void);

// TODO: confirm calling convention and parameter types
__declspec(dllimport) int yf_sound_get_data_len(void);

// TODO: confirm calling convention and parameter types
__declspec(dllimport) int yf_sound_get_data_ptr(void);

// TODO: confirm calling convention and parameter types
__declspec(dllimport) int yf_sound_init(void);

// TODO: confirm calling convention and parameter types
__declspec(dllimport) int yf_sound_is_recording(void);

// TODO: confirm calling convention and parameter types
__declspec(dllimport) int yf_sound_play(void);

// TODO: confirm calling convention and parameter types
__declspec(dllimport) int yf_sound_set_data(void);

// TODO: confirm calling convention and parameter types
__declspec(dllimport) int yf_sound_start_record(void);

// TODO: confirm calling convention and parameter types
__declspec(dllimport) int yf_sound_stop(void);

// TODO: confirm calling convention and parameter types
__declspec(dllimport) int yf_sound_stop_record(void);

// TODO: confirm calling convention and parameter types
__declspec(dllimport) int yf_sound_uninit(void);

#ifdef __cplusplus
}
#endif
