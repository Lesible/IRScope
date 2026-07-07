// Decompiled export sketch for YFFileIdentify.dll
// Generated from PE export table; unknown pointer/struct types are preserved as void* comments.
#pragma once
#include <stdint.h>
#include <stdbool.h>

#ifdef __cplusplus
extern "C" {
#endif

// TODO: confirm calling convention and parameter types
__declspec(dllimport) int yf_file_identify_init(void);

// TODO: confirm calling convention and parameter types
__declspec(dllimport) int yf_file_identify_uninit(void);

// TODO: confirm calling convention and parameter types
__declspec(dllimport) int yf_get_file_end_size(void);

// TODO: confirm calling convention and parameter types
__declspec(dllimport) int yf_get_file_header_size(void);

// TODO: confirm calling convention and parameter types
__declspec(dllimport) int yf_get_img_height(void);

// TODO: confirm calling convention and parameter types
__declspec(dllimport) int yf_get_img_size(void);

// TODO: confirm calling convention and parameter types
__declspec(dllimport) int yf_get_img_width(void);

// TODO: confirm calling convention and parameter types
__declspec(dllimport) int yf_get_record_time_end(void);

// TODO: confirm calling convention and parameter types
__declspec(dllimport) int yf_get_record_time_start(void);

// TODO: confirm calling convention and parameter types
__declspec(dllimport) int yf_get_total_frames(void);

// TODO: confirm calling convention and parameter types
__declspec(dllimport) int yf_get_version(void);

// TODO: confirm calling convention and parameter types
__declspec(dllimport) int yf_need_repair(void);

// TODO: confirm calling convention and parameter types
__declspec(dllimport) int yf_parse_file_end(void);

// TODO: confirm calling convention and parameter types
__declspec(dllimport) int yf_parse_file_header(void);

// TODO: confirm calling convention and parameter types
__declspec(dllimport) int yf_set_img_height(void);

// TODO: confirm calling convention and parameter types
__declspec(dllimport) int yf_set_img_size(void);

// TODO: confirm calling convention and parameter types
__declspec(dllimport) int yf_set_img_width(void);

// TODO: confirm calling convention and parameter types
__declspec(dllimport) int yf_set_record_time_end(void);

// TODO: confirm calling convention and parameter types
__declspec(dllimport) int yf_set_record_time_start(void);

// TODO: confirm calling convention and parameter types
__declspec(dllimport) int yf_set_total_frames(void);

// TODO: confirm calling convention and parameter types
__declspec(dllimport) int yf_set_version(void);

// TODO: confirm calling convention and parameter types
__declspec(dllimport) int yf_write_file_end(void);

// TODO: confirm calling convention and parameter types
__declspec(dllimport) int yf_write_file_header(void);

#ifdef __cplusplus
}
#endif
