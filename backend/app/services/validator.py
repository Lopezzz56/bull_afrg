import re
import math

def clean_float(val_str) -> float:
    """
    Parses a string representing a financial number (e.g., '1,234.56', '(100)', '-45.6%')
    into a clean float. Returns float('nan') or 0.0 if invalid.
    """
    if val_str is None:
        return float('nan')
    if isinstance(val_str, (int, float)):
        return float(val_str)
        
    s = str(val_str).strip()
    if not s or s == '-' or s == 'N/A' or s == 'n/a':
        return float('nan')
        
    # Remove percentage signs
    s = s.replace('%', '')
    # Remove commas
    s = s.replace(',', '')
    
    # Handle parentheses for negative numbers
    if s.startswith('(') and s.endswith(')'):
        s = '-' + s[1:-1]
        
    try:
        return float(s)
    except ValueError:
        return float('nan')

def validate_math_consistency(report_data: dict) -> dict:
    """
    Validates calculations within the report data and returns a dictionary of flags.
    """
    flags = {}
    
    # Helper to check margin of error > 1%
    def check_variance(reported_val, calculated_val, path, name):
        rep = clean_float(reported_val)
        calc = clean_float(calculated_val)
        
        if math.isnan(rep) or math.isnan(calc):
            return
            
        if rep == 0:
            if abs(calc) > 0.05:
                flags[path] = f"Calculated {name} is {calculated_val:.2f} but reported is {reported_val}"
            return
            
        diff_pct = abs((rep - calc) / rep) * 100
        if diff_pct > 1.0:
            flags[path] = f"Variance warning: Reported {reported_val} vs Calculated {calc:.2f} ({diff_pct:.1f}% discrepancy)"

    # 1. Validate Quarterly Financials (YoY and QoQ growth percentage calculation)
    qtr = report_data.get("quarterly_financials", {})
    cols = qtr.get("columns", [])
    rows = qtr.get("rows", [])
    
    yoy_idx = -1
    qoq_idx = -1
    q_curr_idx = -1
    q_prev_qtr_idx = -1
    q_prev_yr_idx = -1
    
    for idx, col in enumerate(cols):
        col_clean = col.lower()
        if "yoy" in col_clean:
            yoy_idx = idx
        elif "qoq" in col_clean:
            qoq_idx = idx
        elif q_curr_idx == -1:
            q_curr_idx = idx
        elif q_prev_qtr_idx == -1:
            q_prev_qtr_idx = idx
        elif q_prev_yr_idx == -1:
            q_prev_yr_idx = idx

    for row_idx, row in enumerate(rows):
        label = row.get("label", "")
        values = row.get("values", [])
        if not values or len(values) <= max(yoy_idx, qoq_idx, q_curr_idx, q_prev_qtr_idx, q_prev_yr_idx):
            continue
            
        curr_val = clean_float(values[q_curr_idx])
        
        # YoY calculation validation
        if yoy_idx != -1 and q_prev_yr_idx != -1:
            prev_yr_val = clean_float(values[q_prev_yr_idx])
            if not math.isnan(curr_val) and not math.isnan(prev_yr_val) and prev_yr_val != 0:
                calc_yoy = ((curr_val - prev_yr_val) / abs(prev_yr_val)) * 100
                check_variance(values[yoy_idx], calc_yoy, f"quarterly_financials.rows[{row_idx}].values[{yoy_idx}]", f"{label} YoY%")
                
        # QoQ calculation validation
        if qoq_idx != -1 and q_prev_qtr_idx != -1:
            prev_qtr_val = clean_float(values[q_prev_qtr_idx])
            if not math.isnan(curr_val) and not math.isnan(prev_qtr_val) and prev_qtr_val != 0:
                calc_qoq = ((curr_val - prev_qtr_val) / abs(prev_qtr_val)) * 100
                check_variance(values[qoq_idx], calc_qoq, f"quarterly_financials.rows[{row_idx}].values[{qoq_idx}]", f"{label} QoQ%")

    return flags
