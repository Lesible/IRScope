// Decompiled export sketch for YFCalibrate.dll
// Generated from PE export table; unknown pointer/struct types are preserved as void* comments.
#pragma once
#include <stdint.h>
#include <stdbool.h>

#ifdef __cplusplus
extern "C" {
#endif

// TODO: confirm calling convention and parameter types
__declspec(dllimport) int yf_calibrate_format_data(void);

// TODO: confirm calling convention and parameter types
__declspec(dllimport) int yf_calibrate_get_AD_range(void);

// TODO: confirm calling convention and parameter types
__declspec(dllimport) int yf_calibrate_get_auto_compensation_info(void);

// TODO: confirm calling convention and parameter types
__declspec(dllimport) int yf_calibrate_get_base_temp_compensation(void);

// TODO: confirm calling convention and parameter types
__declspec(dllimport) int yf_calibrate_get_calibrate_temp(void);

// TODO: confirm calling convention and parameter types
__declspec(dllimport) int yf_calibrate_get_calibrate_temp_of_ad(void);

// TODO: confirm calling convention and parameter types
__declspec(dllimport) int yf_calibrate_get_calibrate_temp_of_ad_ex(void);

// TODO: confirm calling convention and parameter types
__declspec(dllimport) int yf_calibrate_get_calibrate_temp_of_meas(void);

// TODO: confirm calling convention and parameter types
__declspec(dllimport) int yf_calibrate_get_data_no_compress(void);

// TODO: confirm calling convention and parameter types
__declspec(dllimport) int yf_calibrate_get_detector_serial(void);

// TODO: confirm calling convention and parameter types
__declspec(dllimport) int yf_calibrate_get_len(void);

// TODO: confirm calling convention and parameter types
__declspec(dllimport) int yf_calibrate_get_machine_serial(void);

// TODO: confirm calling convention and parameter types
__declspec(dllimport) int yf_calibrate_get_machine_type(void);

// TODO: confirm calling convention and parameter types
__declspec(dllimport) int yf_calibrate_get_measurement_grade(void);

// TODO: confirm calling convention and parameter types
__declspec(dllimport) int yf_calibrate_get_product_date(void);

// TODO: confirm calling convention and parameter types
__declspec(dllimport) int yf_calibrate_get_productor(void);

// TODO: confirm calling convention and parameter types
__declspec(dllimport) int yf_calibrate_get_real_AD_range(void);

// TODO: confirm calling convention and parameter types
__declspec(dllimport) int yf_calibrate_get_sample_AD_and_temp(void);

// TODO: confirm calling convention and parameter types
__declspec(dllimport) int yf_calibrate_get_sample_count(void);

// TODO: confirm calling convention and parameter types
__declspec(dllimport) int yf_calibrate_get_size(void);

// TODO: confirm calling convention and parameter types
__declspec(dllimport) int yf_calibrate_get_temp_lesser_interval_stable(void);

// TODO: confirm calling convention and parameter types
__declspec(dllimport) int yf_calibrate_get_temp_range(void);

// TODO: confirm calling convention and parameter types
__declspec(dllimport) int yf_calibrate_init(void);

// TODO: confirm calling convention and parameter types
__declspec(dllimport) int yf_calibrate_is_support_measurement_grade(void);

// TODO: confirm calling convention and parameter types
__declspec(dllimport) int yf_calibrate_is_valid_len(void);

// TODO: confirm calling convention and parameter types
__declspec(dllimport) int yf_calibrate_is_valid_measgrade(void);

// TODO: confirm calling convention and parameter types
__declspec(dllimport) int yf_calibrate_load_file(void);

// TODO: confirm calling convention and parameter types
__declspec(dllimport) int yf_calibrate_parse_data(void);

// TODO: confirm calling convention and parameter types
__declspec(dllimport) int yf_calibrate_save_calibrate(void);

// TODO: confirm calling convention and parameter types
__declspec(dllimport) int yf_calibrate_set_AD_range(void);

// TODO: confirm calling convention and parameter types
__declspec(dllimport) int yf_calibrate_set_auto_compensation_info(void);

// TODO: confirm calling convention and parameter types
__declspec(dllimport) int yf_calibrate_set_base_temp_compensation(void);

// TODO: confirm calling convention and parameter types
__declspec(dllimport) int yf_calibrate_set_calibrate_temp_of_meas(void);

// TODO: confirm calling convention and parameter types
__declspec(dllimport) int yf_calibrate_set_correct_temp(void);

// TODO: confirm calling convention and parameter types
__declspec(dllimport) int yf_calibrate_set_detector_serial(void);

// TODO: confirm calling convention and parameter types
__declspec(dllimport) int yf_calibrate_set_len(void);

// TODO: confirm calling convention and parameter types
__declspec(dllimport) int yf_calibrate_set_len_and_measurement_grade(void);

// TODO: confirm calling convention and parameter types
__declspec(dllimport) int yf_calibrate_set_machine_serial(void);

// TODO: confirm calling convention and parameter types
__declspec(dllimport) int yf_calibrate_set_machine_type(void);

// TODO: confirm calling convention and parameter types
__declspec(dllimport) int yf_calibrate_set_measurement_grade(void);

// TODO: confirm calling convention and parameter types
__declspec(dllimport) int yf_calibrate_set_product_date(void);

// TODO: confirm calling convention and parameter types
__declspec(dllimport) int yf_calibrate_set_productor(void);

// TODO: confirm calling convention and parameter types
__declspec(dllimport) int yf_calibrate_set_sample_AD_and_temp(void);

// TODO: confirm calling convention and parameter types
__declspec(dllimport) int yf_calibrate_set_sample_count(void);

// TODO: confirm calling convention and parameter types
__declspec(dllimport) int yf_calibrate_set_temp_lesser_interval_stable(void);

// TODO: confirm calling convention and parameter types
__declspec(dllimport) int yf_calibrate_set_temp_range(void);

// TODO: confirm calling convention and parameter types
__declspec(dllimport) int yf_calibrate_uninit(void);

#ifdef __cplusplus
}
#endif
