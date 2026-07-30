import React, { useState, useEffect, useRef, useLayoutEffect } from "react";
import { createPortal } from "react-dom";

const MONTHS = [
  "Janvier",
  "Février",
  "Mars",
  "Avril",
  "Mai",
  "Juin",
  "Juillet",
  "Août",
  "Septembre",
  "Octobre",
  "Novembre",
  "Décembre",
];
const DAYS = ["Lu", "Ma", "Me", "Je", "Ve", "Sa", "Di"];

function pad(n) {
  return String(n).padStart(2, "0");
}
function isoToDate(iso) {
  if (!iso) return null;
  const [y, m, d] = iso.split("-").map(Number);
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d);
}
function dateToISO(date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}
function formatDisplay(iso) {
  if (!iso) return "";
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}
function daysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate();
}
function firstWeekdayMonday(year, month) {
  const day = new Date(year, month, 1).getDay();
  return (day + 6) % 7;
}

function ChevronLeft() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4">
      <path
        d="M15 6l-6 6 6 6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
function ChevronRight() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4">
      <path
        d="M9 6l6 6-6 6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function DatePicker({ value, onChange, placeholder = "jj/mm/aaaa", minDate }) {
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0, width: 0 });
  const triggerRef = useRef(null);
  const popupRef = useRef(null);
  const selectedDate = isoToDate(value);
  const today = new Date();
  const [viewYear, setViewYear] = useState(
    selectedDate ? selectedDate.getFullYear() : today.getFullYear()
  );
  const [viewMonth, setViewMonth] = useState(
    selectedDate ? selectedDate.getMonth() : today.getMonth()
  );

  useLayoutEffect(() => {
    if (!open || !triggerRef.current) return;
    function updatePosition() {
      const rect = triggerRef.current.getBoundingClientRect();
      setCoords({
        top: rect.bottom + window.scrollY + 8,
        left: rect.left + window.scrollX,
        width: rect.width,
      });
    }
    updatePosition();
    window.addEventListener("scroll", updatePosition, true);
    window.addEventListener("resize", updatePosition);
    return () => {
      window.removeEventListener("scroll", updatePosition, true);
      window.removeEventListener("resize", updatePosition);
    };
  }, [open]);

  useEffect(() => {
    function handleClickOutside(e) {
      if (
        triggerRef.current &&
        !triggerRef.current.contains(e.target) &&
        popupRef.current &&
        !popupRef.current.contains(e.target)
      )
        setOpen(false);
    }
    function handleEscape(e) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  function goPrevMonth() {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else setViewMonth((m) => m - 1);
  }
  function goNextMonth() {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else setViewMonth((m) => m + 1);
  }
  function selectDay(day) {
    onChange(dateToISO(new Date(viewYear, viewMonth, day)));
    setOpen(false);
  }

  const totalDays = daysInMonth(viewYear, viewMonth);
  const startOffset = firstWeekdayMonday(viewYear, viewMonth);
  const cells = [
    ...Array(startOffset).fill(null),
    ...Array.from({ length: totalDays }, (_, i) => i + 1),
  ];
  const min = minDate ? isoToDate(minDate) : null;

  return (
    <div className="relative">
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full rounded-lg border-0 px-1 py-2 text-left text-base text-navy-deep focus:outline-none"
      >
        <span className={value ? "" : "text-slate-400"}>
          {value ? formatDisplay(value) : placeholder}
        </span>
      </button>
      {open &&
        createPortal(
          <div
            ref={popupRef}
            style={{ position: "absolute", top: coords.top, left: coords.left }}
            className="z-50 w-72 rounded-2xl border border-neutral-200 bg-white p-4 shadow-2xl"
          >
            <div className="mb-3 flex items-center justify-between">
              <button
                type="button"
                onClick={goPrevMonth}
                className="rounded-full p-1.5 text-navy-deep hover:bg-cream"
              >
                <ChevronLeft />
              </button>
              <span className="text-sm font-semibold text-navy-deep">
                {MONTHS[viewMonth]} {viewYear}
              </span>
              <button
                type="button"
                onClick={goNextMonth}
                className="rounded-full p-1.5 text-navy-deep hover:bg-cream"
              >
                <ChevronRight />
              </button>
            </div>
            <div className="mb-1 grid grid-cols-7 gap-1 text-center text-xs font-semibold text-slate-400">
              {DAYS.map((d) => (
                <span key={d}>{d}</span>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {cells.map((day, i) => {
                if (!day) return <span key={`empty-${i}`} />;
                const cellDate = new Date(viewYear, viewMonth, day);
                const isSelected =
                  selectedDate &&
                  selectedDate.getFullYear() === viewYear &&
                  selectedDate.getMonth() === viewMonth &&
                  selectedDate.getDate() === day;
                const isToday =
                  today.getFullYear() === viewYear &&
                  today.getMonth() === viewMonth &&
                  today.getDate() === day;
                const isDisabled = min && cellDate < min;
                return (
                  <button
                    key={day}
                    type="button"
                    disabled={isDisabled}
                    onClick={() => selectDay(day)}
                    className={`flex h-8 w-8 items-center justify-center rounded-full text-sm transition ${
                      isDisabled
                        ? "cursor-not-allowed text-slate-300"
                        : isSelected
                        ? "bg-gold font-bold text-navy-deep"
                        : isToday
                        ? "border border-gold text-navy-deep"
                        : "text-slate-600 hover:bg-cream"
                    }`}
                  >
                    {day}
                  </button>
                );
              })}
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}

export default DatePicker;
