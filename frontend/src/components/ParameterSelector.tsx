import React, { useState, useRef, useEffect, useMemo } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { LuCalendar } from 'react-icons/lu';

// ホイールピッカーのスタイル (変更なし)
const pickerStyles = `
.wheel-picker-container {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 5px;
}
.wheel-picker {
  height: 36px;
  width: 85px;
  overflow-y: scroll;
  scroll-snap-type: y mandatory;
  border: 1px solid #718096;
  border-radius: 4px;
  color: #ecf0f1;
  background-color: #4a5568;

  &::-webkit-scrollbar { display: none; }
  scrollbar-width: none;
}
.wheel-picker-item {
  height: 36px;
  line-height: 36px;
  text-align: center;
  scroll-snap-align: center;
  font-size: 0.95em;
}
.wheel-picker-item.padding { display: none; }
.wheel-picker-wrapper { position: relative; height: 36px; }
.wheel-picker-wrapper::before,
.wheel-picker-wrapper::after { display: none; }
`;

// --- ホイールピッカーコンポーネント (変更なし) ---
interface ScrollPickerProps {
  items: string[];
  value: number;
  onChange: (newIndex: number) => void;
}
const itemHeight = 36;
const loopCount = 3;

const ScrollPicker: React.FC<ScrollPickerProps> = ({ items: originalItems, value, onChange }) => {
  // ... (コンポーネントの実装は変更なし) ...
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollTimeout = useRef<NodeJS.Timeout | null>(null);
  const isScrolling = useRef<boolean>(false);
  const n = originalItems.length;
  const loopedItems = useMemo(() => {
    const arr = [];
    for (let i = 0; i < loopCount; i++) {
      arr.push(...originalItems);
    }
    return arr;
  }, [originalItems]);
  const middleListStartIndex = n;
  const initialScrollTop = (middleListStartIndex + value) * itemHeight;
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = initialScrollTop;
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => {
    let timeoutId: NodeJS.Timeout | null = null;
    if (containerRef.current) {
      const targetScrollTop = (middleListStartIndex + value) * itemHeight;
      const currentRef = containerRef.current;
      if (currentRef.scrollTop !== targetScrollTop) {
        isScrolling.current = true;
        currentRef.scrollTo({ top: targetScrollTop, behavior: 'smooth' });
        const scrollAnimTime = 300;
        timeoutId = setTimeout(() => { isScrolling.current = false; }, scrollAnimTime);
      }
    }
    return () => { if (timeoutId) { clearTimeout(timeoutId); } };
  }, [value, middleListStartIndex]);
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    if (isScrolling.current) return;
    if (scrollTimeout.current) { clearTimeout(scrollTimeout.current); }
    scrollTimeout.current = setTimeout(() => {
      const currentContainer = containerRef.current;
      if (!currentContainer) return;
      const scrollTop = currentContainer.scrollTop;
      const selectedIndex = Math.round(scrollTop / itemHeight);
      const normalizedIndex = selectedIndex % n;
      const buffer = 0;
      if (selectedIndex < (middleListStartIndex - buffer) || selectedIndex >= (middleListStartIndex + n + buffer)) {
        const resetScrollTop = (middleListStartIndex + normalizedIndex) * itemHeight;
        currentContainer.scrollTo({ top: resetScrollTop, behavior: 'auto' });
      }
      if (normalizedIndex !== value) { onChange(normalizedIndex); }
    }, 150);
  };
  useEffect(() => {
    const currentScrollTimeout = scrollTimeout.current;
    return () => { if (currentScrollTimeout) { clearTimeout(currentScrollTimeout); } };
  }, []);
  return (
    <div className="wheel-picker-wrapper">
      <div
        ref={containerRef}
        className="wheel-picker"
        onScroll={handleScroll}
      >
        {loopedItems.map((item, index) => (
          <div key={index} className="wheel-picker-item">
            {item}
          </div>
        ))}
      </div>
    </div>
  );
};


// --- UIの修正 ---
type DayOfWeek = '月' | '火' | '水' | '木' | '金' | '土' | '日';
const allDaysOfWeek: DayOfWeek[] = ['月', '火', '水', '木', '金', '土', '日'];

// --- ★ 修正: DatePicker用のダークテーマCSS (gap/padding調整) ---
const datePickerStyles = `
  /* DatePickerの入力欄 (変更なし) */
  .custom-datepicker-input input {
    background-color: #4a5568;
    color: #ecf0f1;
    border: 1px solid #718096;
    width: 100%;
    padding: 8px 30px 8px 10px;
    font-size: 0.95em;
    border-radius: 4px;
    box-sizing: border-box;
  }
  .custom-datepicker-icon {
    position: absolute;
    right: 8px;
    top: 50%;
    transform: translateY(-50%);
    color: #a0aec0;
    pointer-events: none;
  }

  /* カレンダーのポップアップ (変更なし) */
  .react-datepicker {
    font-size: 0.95em;
    background-color: #2d3748;
    border: 1px solid #4a5568;
    color: #ecf0f1;
  }
  .react-datepicker__header {
    background-color: #4a5568;
    border-bottom: 1px solid #718096;
  }
  .react-datepicker__current-month,
  .react-datepicker__day-name,
  .react-datepicker__day {
    color: #ecf0f1;
  }
  .react-datepicker__day:hover {
    background-color: #718096;
  }
  .react-datepicker__day--selected {
    background-color: #a0aec0;
    color: #2d3748;
  }
  .react-datepicker__day--keyboard-selected {
    background-color: #718096;
  }
  .react-datepicker__navigation-icon::before {
    border-color: #ecf0f1;
  }

  /* From/To のコンテナ (変更なし) */
  .day-picker-container {
    display: flex;
    gap: 5px;
    margin-bottom: 15px;
    justify-content: center;
    align-items: center;
  }

  /* 曜日トグルボタン */
  .day-toggle-button {
    padding: 5px 0px; /* ★ 修正: 5px 1px -> 5px 0px */
    font-size: 0.8em; /* ★ 修正: 0.85em -> 0.8em */
    border: 1px solid #718096;
    border-radius: 4px;
    cursor: pointer;
    background-color: #4a5568;
    color: #ecf0f1;
    flex-grow: 1;
    text-align: center;
    flex-basis: 0;
  }
  .day-toggle-button.selected {
    background-color: #a0aec0;
    color: #2d3748;
    border-color: #a0aec0;
  }
  .day-toggle-button:hover:not(.selected) {
     background-color: #718096;
  }

  /* プリセットボタン */
  .day-preset-buttons {
    display: flex;
    justify-content: space-between;
    gap: 3px;
    margin-top: 5px;
  }
  .day-preset-buttons button {
    flex-grow: 1;
    font-size: 0.8em; /* ★ 修正: 0.85em -> 0.8em */
    padding: 4px 0px; /* ★ 修正: 4px 1px -> 4px 0px */
    background-color: #718096;
    color: #ecf0f1;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    flex-basis: 0;
  }
  .day-preset-buttons button:hover {
    background-color: #a0aec0;
    color: #2d3748;
  }
`;

// DatePickerのカスタム入力コンポーネント (変更なし)
interface CustomInputProps { value?: string; onClick?: () => void; }
const CustomDateInput = React.forwardRef<HTMLInputElement, CustomInputProps>(
  ({ value, onClick }, ref) => (
    <div className="custom-datepicker-input" onClick={onClick}>
      <input type="text" value={value} readOnly ref={ref} />
      <LuCalendar className="custom-datepicker-icon" />
    </div>
  )
);
CustomDateInput.displayName = 'CustomDateInput';


// --- (Props と State の受け渡しは変更なし) ---
interface ParameterSelectorProps {
  params: {
    startDate: Date | null;
    endDate: Date | null;
    selectedDays: Set<DayOfWeek>;
    timePitch: string;
    timeFrom: number;
    timeTo: number;
  };
  setParams: React.Dispatch<React.SetStateAction<any>>;
}

const ParameterSelector: React.FC<ParameterSelectorProps> = ({ params, setParams }) => {

  const { startDate, endDate, selectedDays, timePitch, timeFrom, timeTo } = params;

  const setStartDate = (date: Date | null) => setParams(prev => ({...prev, startDate: date}));
  const setEndDate = (date: Date | null) => setParams(prev => ({...prev, endDate: date}));
  const setTimePitch = (pitch: string) => setParams(prev => ({...prev, timePitch: pitch}));
  const setTimeFrom = (from: number) => setParams(prev => ({...prev, timeFrom: from}));
  const setTimeTo = (to: number) => setParams(prev => ({...prev, timeTo: to}));

  const setSelectedDays = (updater: (prevDays: Set<DayOfWeek>) => Set<DayOfWeek>) => {
    setParams(prev => ({ ...prev, selectedDays: updater(prev.selectedDays) }));
  };

  const toggleDay = (day: DayOfWeek) => {
    setSelectedDays(prevDays => {
      const newDays = new Set(prevDays);
      if (newDays.has(day)) { newDays.delete(day); }
      else { newDays.add(day); }
      return newDays;
    });
  };

  const selectDayPreset = (preset: 'weekdays' | 'weekend' | 'everyday') => {
    if (preset === 'weekdays') { setSelectedDays(() => new Set(['月', '火', '水', '木', '金'])); }
    else if (preset === 'weekend') { setSelectedDays(() => new Set(['土', '日'])); }
    else if (preset === 'everyday') { setSelectedDays(() => new Set(allDaysOfWeek)); }
  };

  const hourOptions = useMemo(() =>
    Array.from({ length: 24 }, (_, i) => `${i.toString().padStart(2, '0')} 時`)
  , []);

  return (
    <div>
      {/* CSSをグローバルに挿入 */}
      <style>{pickerStyles}</style>
      <style>{datePickerStyles}</style>

      <h4>2. 対象とする日付・時間帯等の選択</h4>

      {/* 期間選択 (From / To) (変更なし) */}
      <div className="day-picker-container">

        <div style={{width: '120px'}}>
          <DatePicker
            id="date-from"
            selected={startDate}
            onChange={setStartDate}
            selectsStart
            startDate={startDate}
            endDate={endDate}
            dateFormat="yyyy/MM/dd"
            customInput={<CustomDateInput />}
            popperPlacement="bottom-end"
          />
        </div>

        <span>～</span>

        <div style={{width: '120px'}}>
          <DatePicker
            id="date-to"
            selected={endDate}
            onChange={setEndDate}
            selectsEnd
            startDate={startDate}
            endDate={endDate}
            minDate={startDate}
            dateFormat="yyyy/MM/dd"
            customInput={<CustomDateInput />}
            popperPlacement="bottom-end"
          />
        </div>
      </div>

      {/* 曜日選択 */}
      <div style={{ marginBottom: '15px' }}>
        <label style={{fontSize: '1em'}}>曜日:</label>

        {/* ★ 修正: gap を 2px -> 1px に */}
        <div style={{ display: 'flex', gap: '1px' }}>
          {allDaysOfWeek.map(day => (
            <button
              key={day}
              className={`day-toggle-button ${selectedDays.has(day) ? 'selected' : ''}`}
              onClick={() => toggleDay(day)}
            >
              {day}
            </button>
          ))}
        </div>
        <div className="day-preset-buttons">
          <button onClick={() => selectDayPreset('everyday')}>毎日</button>
          <button onClick={() => selectDayPreset('weekdays')}>平日</button>
          <button onClick={() => selectDayPreset('weekend')}>休日 (土・日)</button>
        </div>
      </div>

      {/* --- 時間帯選択 (ホイールピッカー) (変更なし) --- */}
      <div style={{ margin: '15px 0' }}>
        <h5>対象とする時間帯</h5>
        <div className="wheel-picker-container">
            <ScrollPicker
              items={hourOptions}
              value={timeFrom}
              onChange={setTimeFrom}
            />
            <span> 〜 </span>
            <ScrollPicker
              items={hourOptions}
              value={timeTo}
              onChange={setTimeTo}
            />
        </div>
      </div>
      {/* --- ----------------------------- --- */}

      {/* --- 集計時間ピッチ (中央揃え) (変更なし) --- */}
      <div style={{ marginTop: '15px' }}>
        <h5>集計時間ピッチ</h5>
        <div style={{ textAlign: 'center' }}>
          <div style={{ display: 'inline-block', textAlign: 'left' }}>
            {['15', '30', '60'].map((pitch) => (
              <div key={pitch} style={{ padding: '2px 0' }}>
                <label>
                  <input
                    type="radio"
                    name="pitch"
                    value={pitch}
                    checked={timePitch === pitch}
                    onChange={(e) => setTimePitch(e.target.value)}
                  />
                  {pitch}分
                </label>
              </div>
            ))}
          </div>
        </div>
      </div>
      {/* --- ------------------------- --- */}

    </div>
  );
};

export default ParameterSelector;
