import React, { useState, useRef, useEffect, useMemo } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { LuCalendar } from 'react-icons/lu';

// ホイールピッカーのスタイル
const pickerStyles = `
.wheel-picker-container {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 5px; /* From/Toの間隔を狭く */
}
.wheel-picker {
  height: 36px; /* 36px * 1項目 */
  width: 100px;
  overflow-y: scroll;
  scroll-snap-type: y mandatory;
  border: 1px solid #ccc; /* 枠線を wrapper からこちらに移動 */
  border-radius: 4px;

  /* スクロールバーを隠す (Chrome, Safari, Edge) */
  &::-webkit-scrollbar {
    display: none;
  }
  /* スクロールバーを隠す (Firefox) */
  scrollbar-width: none;
}
.wheel-picker-item {
  height: 36px; /* 1項目の高さ */
  line-height: 36px;
  text-align: center;
  scroll-snap-align: center;
  font-size: 1em;
}
.wheel-picker-item.padding {
  display: none; /* パディングを非表示 */
}
.wheel-picker-wrapper {
  position: relative;
  height: 36px; /* 1項目分の高さ */
}
.wheel-picker-wrapper::before,
.wheel-picker-wrapper::after {
  display: none;
}
`;

// --- ホイールピッカーコンポーネント ---
interface ScrollPickerProps {
  items: string[];
  value: number;
  onChange: (newIndex: number) => void;
}
const itemHeight = 36;
const loopCount = 3;

const ScrollPicker: React.FC<ScrollPickerProps> = ({ items: originalItems, value, onChange }) => {
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

// --- 曜日ボタンの型 ---
type DayOfWeek = '月' | '火' | '水' | '木' | '金' | '土' | '日';
const allDaysOfWeek: DayOfWeek[] = ['月', '火', '水', '木', '金', '土', '日'];

// --- DatePicker用のカスタムCSS ---
const datePickerStyles = `
  /* DatePickerの入力欄をカスタマイズ */
  .custom-datepicker-input {
    position: relative;
    width: 100%; /* 親の幅に合わせる */
  }
  .custom-datepicker-input input {
    width: 100%;
    padding: 8px 30px 8px 10px; /* アイコン分の右パディング */
    font-size: 1em;
    border: 1px solid #ccc;
    border-radius: 4px;
    box-sizing: border-box;
  }
  .custom-datepicker-icon {
    position: absolute;
    right: 8px;
    top: 50%;
    transform: translateY(-50%);
    color: #666;
    pointer-events: none; /* アイコンはクリック不可にする */
  }

  /* From/To のコンテナ */
  .day-picker-container {
    display: flex;
    gap: 10px;
    margin-bottom: 15px;

    /* 中央寄せ */
    justify-content: center;
  }

  /* 曜日トグルボタン (Mon, Tue...) */
  .day-toggle-button {
    padding: 8px 0px;
    font-size: 0.9em;
    border: 1px solid #ccc;
    border-radius: 4px;
    cursor: pointer;
    background-color: #f0f0f0;
    color: #333;
    flex-grow: 1;
    text-align: center;
    flex-basis: 0; /* 均等幅にする */
  }
  .day-toggle-button.selected {
    background-color: #007bff;
    color: white;
    border-color: #007bff;
  }

  /* プリセットボタン (Everyday...) */
  .day-preset-buttons {
    display: flex;
    justify-content: space-between;
    gap: 5px;
    margin-top: 5px;
  }
  .day-preset-buttons button {
    flex-grow: 1;
    font-size: 0.8em;
    padding: 5px;
    background-color: #e0e0e0;
    color: #444;
    border: none;
    border-radius: 4px;
    cursor: pointer;
  }
  .day-preset-buttons button:hover {
    background-color: #d0d0d0;
  }
`;

// DatePickerのカスタム入力コンポーネント (アイコン付き)
interface CustomInputProps {
  value?: string;
  onClick?: () => void;
}
const CustomDateInput = React.forwardRef<HTMLInputElement, CustomInputProps>(
  ({ value, onClick }, ref) => (
    <div className="custom-datepicker-input" onClick={onClick}>
      <input
        type="text"
        value={value}
        readOnly
        ref={ref}
      />
      <LuCalendar className="custom-datepicker-icon" />
    </div>
  )
);
CustomDateInput.displayName = 'CustomDateInput';


// --- ParameterSelector本体 ---
const ParameterSelector: React.FC = () => {
  const [startDate, setStartDate] = useState<Date | null>(new Date());
  const [endDate, setEndDate] = useState<Date | null>(null);

  const [selectedDays, setSelectedDays] = useState<Set<DayOfWeek>>(
    new Set(['月', '火', '水', '木', '金'])
  );

  const [timePitch, setTimePitch] = useState<string>('60');
  const [timeFrom, setTimeFrom] = useState<number>(7);
  const [timeTo, setTimeTo] = useState<number>(19);

  const toggleDay = (day: DayOfWeek) => {
    setSelectedDays(prevDays => {
      const newDays = new Set(prevDays);
      if (newDays.has(day)) { newDays.delete(day); }
      else { newDays.add(day); }
      return newDays;
    });
  };

  const selectDayPreset = (preset: 'weekdays' | 'weekend' | 'everyday') => {
    if (preset === 'weekdays') { setSelectedDays(new Set(['月', '火', '水', '木', '金'])); }
    else if (preset === 'weekend') { setSelectedDays(new Set(['土', '日'])); }
    else if (preset === 'everyday') { setSelectedDays(new Set(allDaysOfWeek)); }
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

      {/* 期間選択 (From / To) */}
      <div className="day-picker-container">

        {/* 横幅を 50% -> 160px (固定値) に変更 */}
        <div style={{width: '160px'}}>
          <label htmlFor="date-from" style={{fontSize: '0.9em', color: '#333'}}>From</label>
          <DatePicker
            id="date-from"
            selected={startDate}
            onChange={(date) => setStartDate(date)}
            selectsStart
            startDate={startDate}
            endDate={endDate}
            dateFormat="yyyy/MM/dd"
            customInput={<CustomDateInput />}

            // カレンダーがはみ出さないよう、右揃えで表示
            popperPlacement="bottom-end"
          />
        </div>

        {/* 横幅を 50% -> 160px (固定値) に変更 */}
        <div style={{width: '160px'}}>
          <label htmlFor="date-to" style={{fontSize: '0.9em', color: '#333'}}>To</label>
          <DatePicker
            id="date-to"
            selected={endDate}
            onChange={(date) => setEndDate(date)}
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
        <label style={{fontSize: '0.9em', color: '#333'}}>曜日</label>
        <div style={{ display: 'flex', gap: '5px' }}>
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
          <button onClick={() => selectDayPreset('weekend')}>週末（土・日）</button>
        </div>
      </div>


      {/* --- 時間帯選択 (ホイールピッカー) --- */}
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

      {/* --- 集計時間ピッチ (縦並び) --- */}
      <div style={{ marginTop: '15px' }}>
        <h5>集計時間ピッチ</h5>
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
      {/* --- ------------------------- --- */}

    </div>
  );
};

export default ParameterSelector;
