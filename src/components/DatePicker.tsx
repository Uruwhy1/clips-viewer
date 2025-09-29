import React, { useCallback } from "react";
import { CalendarDays, CalendarSearch, X } from "lucide-react";
import styles from "./DatePicker.module.css";

interface DateFilter {
  startDate: string | null;
  endDate: string | null;
}

interface DatePickerProps {
  dateFilter: DateFilter;
  isOpen: boolean;
  onToggle: () => void;
  onDateChange: (field: "startDate" | "endDate", value: string) => void;
  onClear: () => void;
}

const DatePicker: React.FC<DatePickerProps> = ({
  dateFilter,
  isOpen,
  onToggle,
  onDateChange,
  onClear,
}) => {
  const hasDateFilter = dateFilter.startDate || dateFilter.endDate;

  const handleStartDateChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      onDateChange("startDate", e.target.value);
    },
    [onDateChange],
  );

  const handleEndDateChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      onDateChange("endDate", e.target.value);
    },
    [onDateChange],
  );

  return (
    <div className={styles.datePickerContainer} style={{ zIndex: isOpen ? 3 : "auto" }}>
      <button
        className={`${styles.dateButton} ${hasDateFilter ? styles.active : ""}`}
        onClick={onToggle}
        title="Filter by date range"
      >
        <CalendarSearch size={18} />
        <span>Date</span>
      </button>

      {isOpen && (
        <div className={styles.datePickerDropdown}>
          <div className={styles.datePickerHeader}>
            <span>Filter by Date Range</span>
            {hasDateFilter && (
              <button
                className={styles.clearButton}
                onClick={onClear}
                title="Clear date filter"
              >
                <X size={16} />
              </button>
            )}
          </div>

          <div className={styles.dateInputs}>
            <div className={styles.dateInputGroup}>
              <label htmlFor="startDate">From:</label>
              <input
                id="startDate"
                type="date"
                value={dateFilter.startDate || ""}
                onChange={handleStartDateChange}
                max={dateFilter.endDate || undefined}
                className={styles.dateInput}
              />
            </div>

            <div className={styles.dateInputGroup}>
              <label htmlFor="endDate">To:</label>
              <input
                id="endDate"
                type="date"
                value={dateFilter.endDate || ""}
                onChange={handleEndDateChange}
                min={dateFilter.startDate || undefined}
                className={styles.dateInput}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DatePicker;
