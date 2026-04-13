# Test Catalog Management - Range Requirements (Updated)

## Range Types Overview

OpenELIS Global supports four distinct range types, **all of which can vary by age and sex**:

| Range Type | Purpose | Age/Sex Specific | Behavior |
|------------|---------|------------------|----------|
| **Normal Range** | Clinical reference values | **Yes** - commonly varies | Results outside flagged H/L on reports |
| **Valid Range** | Expected human sample values | Sometimes | Entry outside prompts verification dialog |
| **Critical Range** | Panic values requiring immediate action | **Yes** - can vary by age | Triggers immediate alerts/notifications |
| **Reporting Range** | Instrument/method limits | Rarely | Results outside trigger warning about dilution/rerun |

### Evidence for Age-Specific Critical Values

Research confirms that critical (panic) values **do vary by age**, particularly for:
- **Neonatal Bilirubin**: Hour-by-hour thresholds (0-23 hrs: >7.9, 24-35 hrs: >10.9, etc.)
- **Potassium**: Pediatric thresholds differ from adult
- **TCO2/Bicarbonate**: Pediatric thresholds differ from adult
- **Glucose**: Neonatal hypoglycemia thresholds differ

Source: Beaumont Laboratory Critical Values; acutecaretesting.org pediatric considerations

---

## Detailed Range Requirements

### 6.3.1 Age/Sex-Specific Range Support

**All four range types** must support demographic-specific variations:

```
Range Entry Structure:
â”œâ”€â”€ Range Type (Normal | Valid | Critical | Reporting)
â”œâ”€â”€ Sex (Male | Female | All)
â”œâ”€â”€ Age From (value + unit)
â”œâ”€â”€ Age To (value + unit)
â”œâ”€â”€ Low Value (nullable for critical-high-only)
â”œâ”€â”€ High Value (nullable for critical-low-only)
â””â”€â”€ Notes (optional)
```

**Age Units Supported:**
- Hours (for neonatal critical values)
- Days
- Weeks
- Months
- Years

**Sex Options:**
- Male (M)
- Female (F)
- All (A) - applies to both sexes

### 6.3.2 Example: Bilirubin Ranges

**Normal Ranges (Sex-Specific):**
| Sex | Age From | Age To | Low | High | Unit |
|-----|----------|--------|-----|------|------|
| Male | 0 days | 5 days | 1 | 155 | Âµmol/L |
| Male | 6 days | 14 days | 1 | 140 | Âµmol/L |
| Male | 15 days | 1 month | 1 | 130 | Âµmol/L |
| Male | 1 month | 1 year | 1 | 115 | Âµmol/L |
| Male | 1 year | âˆž | 5 | 40 | Âµmol/L |
| Female | 0 days | 55 days | 1 | 175 | Âµmol/L |
| Female | 56 days | 1 year | 1 | 130 | Âµmol/L |
| Female | 1 year | âˆž | 5 | 35 | Âµmol/L |

**Critical Ranges (Age-Specific, Sex-Neutral):**
| Sex | Age From | Age To | Critical High | Unit |
|-----|----------|--------|---------------|------|
| All | 0 hours | 23 hours | >7.9 | mg/dL |
| All | 24 hours | 35 hours | >10.9 | mg/dL |
| All | 36 hours | 47 hours | >13.9 | mg/dL |
| All | 48 hours | 71 hours | >14.9 | mg/dL |
| All | 72 hours | 13 days | >17.9 | mg/dL |
| All | 14 days | âˆž | >15.0 | mg/dL |

### 6.3.3 Coverage Validation Requirements

The system **must validate complete age coverage** for each sex:

**Validation Rules:**
1. For each sex (Male, Female), age ranges must cover from birth (0) to maximum age (âˆž) without gaps
2. Overlapping age ranges for the same sex are not allowed
3. "All" sex ranges count as coverage for both Male and Female
4. Validation runs on save and displays clear error messages for any gaps

**Coverage Check Algorithm:**
```
For each sex in [Male, Female]:
  1. Collect all ranges for this sex + "All" ranges
  2. Normalize all age values to a common unit (days)
  3. Sort by age_from ascending
  4. Verify first range starts at 0
  5. Verify each range.age_to + 1 == next_range.age_from (no gaps)
  6. Verify last range extends to infinity (999 years or marked as "no upper limit")
```

**UI Feedback:**
- Green checkmark: "Male coverage: Complete"
- Amber warning: "Female coverage: Gap detected (56 days to 1 year)"
- List of specific gaps with suggested fix

### 6.3.4 Range Editor UI Requirements

**Structured View (Default):**
- Group ranges by type (Normal, Valid, Critical, Reporting)
- Within each type, sub-group by sex
- Show age range, low/high values, mini visual bar
- Expand/collapse each range type section

**Visual View:**
- Demographic selector (Sex dropdown, Age input with unit)
- Shows all 4 range types on stacked horizontal bars
- Updates dynamically as user changes demographics
- Useful for "what ranges apply to a 3-day-old male?"

**Table View:**
- Flat table of all ranges across all types
- Sortable by any column
- Bulk editing capability

**Add/Edit Range Modal:**
- Sex selector (All / Male Only / Female Only)
- Age From: number input + unit dropdown (hours/days/weeks/months/years)
- Age To: number input + unit dropdown (use 999 years for infinity)
- Low value (optional for critical-high-only scenarios)
- High value (optional for critical-low-only scenarios)
- Coverage warning banner showing impact of this range

---

## Data Model Updates

### TestRange Entity (Updated)

```sql
CREATE TABLE test_range (
    id SERIAL PRIMARY KEY,
    test_id INTEGER NOT NULL REFERENCES test(id),
    range_type VARCHAR(20) NOT NULL, -- 'NORMAL', 'VALID', 'CRITICAL', 'REPORTING'
    sex CHAR(1) NOT NULL DEFAULT 'A', -- 'M', 'F', 'A' (All)
    age_from_value DECIMAL(10,2) NOT NULL DEFAULT 0,
    age_from_unit VARCHAR(10) NOT NULL DEFAULT 'days', -- 'hours', 'days', 'weeks', 'months', 'years'
    age_to_value DECIMAL(10,2) NOT NULL DEFAULT 999,
    age_to_unit VARCHAR(10) NOT NULL DEFAULT 'years',
    low_value DECIMAL(15,6) NULL, -- NULL allowed for critical-high-only
    high_value DECIMAL(15,6) NULL, -- NULL allowed for critical-low-only
    notes TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT chk_range_type CHECK (range_type IN ('NORMAL', 'VALID', 'CRITICAL', 'REPORTING')),
    CONSTRAINT chk_sex CHECK (sex IN ('M', 'F', 'A')),
    CONSTRAINT chk_age_unit CHECK (age_from_unit IN ('hours', 'days', 'weeks', 'months', 'years')),
    CONSTRAINT chk_at_least_one_value CHECK (low_value IS NOT NULL OR high_value IS NOT NULL)
);

CREATE INDEX idx_test_range_test_id ON test_range(test_id);
CREATE INDEX idx_test_range_lookup ON test_range(test_id, range_type, sex);
```

### Helper Function: Normalize Age to Days

```sql
CREATE FUNCTION normalize_age_to_days(value DECIMAL, unit VARCHAR) 
RETURNS DECIMAL AS $$
BEGIN
    RETURN CASE unit
        WHEN 'hours' THEN value / 24.0
        WHEN 'days' THEN value
        WHEN 'weeks' THEN value * 7.0
        WHEN 'months' THEN value * 30.44  -- Average days per month
        WHEN 'years' THEN value * 365.25  -- Account for leap years
        ELSE value
    END;
END;
$$ LANGUAGE plpgsql IMMUTABLE;
```

---

## API Requirements

### Get Ranges for Test

```http
GET /api/v1/tests/{testId}/ranges
```

**Response:**
```json
{
  "testId": 123,
  "ranges": {
    "normal": [
      {
        "id": 1,
        "sex": "M",
        "ageFrom": { "value": 0, "unit": "days" },
        "ageTo": { "value": 5, "unit": "days" },
        "low": 1,
        "high": 155
      },
      // ... more ranges
    ],
    "valid": [...],
    "critical": [...],
    "reporting": [...]
  },
  "coverage": {
    "male": { "complete": true, "gaps": [] },
    "female": { "complete": false, "gaps": ["56 days to 1 year"] }
  }
}
```

### Validate Coverage

```http
POST /api/v1/tests/{testId}/ranges/validate
```

**Response:**
```json
{
  "valid": false,
  "coverage": {
    "male": { "complete": true, "gaps": [] },
    "female": { 
      "complete": false, 
      "gaps": [
        {
          "rangeType": "normal",
          "from": { "value": 56, "unit": "days" },
          "to": { "value": 1, "unit": "years" },
          "message": "No normal range defined for females aged 56 days to 1 year"
        }
      ]
    }
  }
}
```

### Get Applicable Range (for Result Entry)

```http
GET /api/v1/tests/{testId}/applicable-range?sex=M&ageValue=3&ageUnit=days
```

**Response:**
```json
{
  "testId": 123,
  "demographic": { "sex": "M", "age": { "value": 3, "unit": "days" } },
  "applicableRanges": {
    "normal": { "low": 1, "high": 155 },
    "valid": { "low": 0, "high": 600 },
    "critical": { "low": null, "high": 7.9 },
    "reporting": { "low": 0.1, "high": 30 }
  }
}
```

---

## Acceptance Criteria (Ranges)

### Range Editor

- [ ] All four range types (Normal, Valid, Critical, Reporting) support age/sex-specific variations
- [ ] Age can be specified in hours, days, weeks, months, or years
- [ ] Sex can be Male, Female, or All (applies to both)
- [ ] User can switch between Structured, Visual, and Table views
- [ ] Visual view updates dynamically when demographic selector changes

### Coverage Validation

- [ ] System validates that all ages from 0 to âˆž are covered for each sex
- [ ] Validation runs automatically on save
- [ ] Clear error messages identify specific gaps (e.g., "Female: 56 days to 1 year not covered")
- [ ] Validation considers "All" sex ranges as covering both Male and Female
- [ ] Overlapping ranges for the same sex/type are flagged as errors

### Critical Ranges

- [ ] Critical ranges support age-specific thresholds (e.g., neonatal bilirubin by hour)
- [ ] Critical low and critical high can be set independently
- [ ] Null values allowed (e.g., only critical high, no critical low)

### Result Entry Integration

- [ ] When entering results, system looks up applicable ranges based on patient sex and age
- [ ] Correct range applied even for complex cases (e.g., 3-day-old male)
- [ ] H/L flags use the applicable normal range for the patient's demographics
- [ ] Critical alerts use the applicable critical range for the patient's demographics
