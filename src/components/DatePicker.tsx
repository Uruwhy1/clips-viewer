import React, { useCallback, useEffect, useState } from "react";
import { CalendarSearch, X } from "lucide-react";
import styles from "./DatePicker.module.css";
import { AnimatePresence } from "motion/react";
import Dropdown from "./Dropdown";
import { DayPicker, DateRange } from "react-day-picker";
import "react-day-picker/dist/style.css";

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

const toDate = (str: string | null): Date | undefined =>
  str ? new Date(str + "T00:00:00") : undefined;

const toISO = (date: Date): string =>
  [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");

const DatePicker: React.FC<DatePickerProps> = ({
  dateFilter,
  isOpen,
  onToggle,
  onDateChange,
  onClear,
}) => {
  const hasDateFilter = dateFilter.startDate || dateFilter.endDate;

  const handleSelect = useCallback((day: Date) => {
    const clickedISO = toISO(day);
    const { startDate, endDate } = dateFilter;

    // unset dates
    if (!startDate) {
      onDateChange("startDate", clickedISO);
      return;
    }
    if (!endDate) {
      onDateChange("endDate", clickedISO);
      return;
    }

    // clicking selected dates
    if (startDate === endDate && clickedISO === startDate) {
      onClear();
      return;
    }
    if (clickedISO === startDate) {
      onDateChange("endDate", clickedISO);
      return;
    }
    if (clickedISO === endDate) {
      onDateChange("startDate", clickedISO);
      return;
    }

    // clicking empty days
    onDateChange(
      clickedISO < startDate ? "startDate" : "endDate",
      clickedISO
    );
  }, [dateFilter, onDateChange, onClear]);

  return (
    <div
      className={styles.datePickerContainer}
      style={{ zIndex: isOpen ? "var(--gameFilterZ)" : "auto" }}
    >
      <button
        className={`${styles.dateButton} ${hasDateFilter ? styles.active : ""}`}
        onClick={onToggle}
        title="Filter by date range"
      >
        <CalendarSearch size={18} />
        <span>Date</span>
      </button>

      <AnimatePresence>
        <Dropdown isOpen={isOpen} onClose={onToggle}>
          <div className={styles.datePickerDropdown}>
            <div className={styles.datePickerHeader}>
              <span>Filter by Date Range</span>
              {hasDateFilter && (
                <button className={styles.clearButton} onClick={onClear}>
                  <X size={16} />
                </button>
              )}
            </div>
            <DayPicker
              mode="range"
              selected={{ from: toDate(dateFilter.startDate), to: toDate(dateFilter.endDate) }}
              onDayClick={handleSelect}
              classNames={{
                root: styles.rdpRoot,
                months: styles.rdpMonths,
                month_caption: styles.rdpCaption,
                month_grid: styles.rdpTable,
                weekday: styles.rdpHead,
                day: styles.rdpDay,
                day_button: styles.rdpDayButton,
                today: styles.rdpToday,
                selected: styles.rdpSelected,
                range_start: styles.rdpRangeStart,
                range_end: styles.rdpRangeEnd,
                range_middle: styles.rdpRangeMiddle,
                outside: styles.rdpOutside,
                disabled: styles.rdpDisabled,
              }}  disabled={{ after: new Date() }}
            />
            <div className={styles.selectedRange}>
              <span>
                {dateFilter.startDate ?? "START"} → {dateFilter.endDate ?? "END"}
              </span>
            </div>
          </div>
        </Dropdown>
      </AnimatePresence>
    </div>
  );
};

export default DatePicker;
