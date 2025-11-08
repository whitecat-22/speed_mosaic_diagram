import React, { useState, useRef, useEffect, useMemo } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { LuCalendar, LuCirclePlus, LuCircleMinus } from 'react-icons/lu';
import { SketchPicker, ColorResult } from 'react-color';

// App.tsx から LegendItem 型をインポート
import type { LegendItem } from '../App';

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

// --- DatePicker + 凡例エディタ用のCSS ---
const datePickerStyles = `
  /* (DatePicker, 曜日ボタン関連のスタイルは変更なし) */
  .custom-datepicker-input input {
    background-color: #4a5568; color: #ecf0f1; border: 1px solid #718096;
    width: 100%; padding: 8px 30px 8px 10px; font-size: 0.95em;
    border-radius: 4px; box-sizing: border-box;
  }
  .custom-datepicker-icon {
    position: absolute; right: 8px; top: 50%; transform: translateY(-50%);
    color: #a0aec0; pointer-events: none;
  }
  .react-datepicker {
    font-size: 0.95em;
    background-color: #2d3748; border: 1px solid #4a5568;
    color: #ecf0f1;
  }
  .react-datepicker__header {
    background-color: #4a5568; border-bottom: 1px solid #718096;
  }
  .react-datepicker__current-month, .react-datepicker__day-name, .react-datepicker__day {
    color: #ecf0f1;
  }
  .react-datepicker__day:hover { background-color: #718096; }
  .react-datepicker__day--selected { background-color: #a0aec0; color: #2d3748; }
  .react-datepicker__day--keyboard-selected { background-color: #718096; }
  .react-datepicker__navigation-icon::before { border-color: #ecf0f1; }
  .day-picker-container {
    display: flex; gap: 5px;
    margin-bottom: 15px;
    justify-content: center;
    align-items: center;
  }
  .day-toggle-button {
    padding: 5px 0px;
    font-size: 0.8em;
    border: 1px solid #718096;
    border-radius: 4px; cursor: pointer; background-color: #4a5568;
    color: #ecf0f1; flex-grow: 1; text-align: center; flex-basis: 0;
  }
  .day-toggle-button.selected {
    background-color: #a0aec0; color: #2d3748; border-color: #a0aec0;
  }
  .day-toggle-button:hover:not(.selected) { background-color: #718096; }
  .day-preset-buttons {
    display: flex; justify-content: space-between; gap: 3px;
    margin-top: 5px;
  }
  .day-preset-buttons button {
    flex-grow: 1; font-size: 0.8em; padding: 4px 0px;
    background-color: #718096; color: #ecf0f1; border: none;
    border-radius: 4px; cursor: pointer; flex-basis: 0;
  }
  .day-preset-buttons button:hover {
    background-color: #a0aec0; color: #2d3748;
  }

  /* --- 凡例エディタのスタイル --- */
  .legend-editor-row {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 5px;
  }
  .legend-editor-row input[type="number"] {
    width: 60px;
    padding: 5px;
    font-size: 0.95em;
    background-color: #4a5568;
    color: #ecf0f1;
    border: 1px solid #718096;
    border-radius: 4px;
    box-sizing: border-box;
    text-align: right;
  }
  .legend-editor-color-swatch {
    width: 28px;
    height: 28px;
    border: 1px solid #a0aec0;
    border-radius: 4px;
    cursor: pointer;
  }
  .legend-editor-label {
    flex-grow: 1;
    font-size: 0.95em;
  }
  .legend-editor-button {
    color: #a0aec0;
    cursor: pointer;
    font-size: 1.2em;
  }
  .legend-editor-button:hover {
    color: #ecf0f1;
  }

  /* カラーピッカーのポップオーバースタイル */
  .legend-color-picker-popover {
    /* (position は style 属性で 'fixed' として設定) */
    z-index: 10;

    /* (SketchPickerのデフォルトスタイルをダークテーマ用に上書き) */
    .sketch-picker {
       background: #2d3748 !important;
       box-shadow: 0 4px 12px rgba(0,0,0,0.5) !important;
    }
    .sketch-picker input {
       background-color: #4a5568 !important;
       color: #ecf0f1 !important;
       box-shadow: none !important;
    }
    .sketch-picker span {
       color: #ecf0f1 !important;
    }
  }
  .legend-color-picker-cover {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 9;
  }
`;

// DatePickerのカスタム入力コンポーネント
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

// --- ★ 修正: カラーピッカーコンポーネント (イベント伝播停止) ---
interface ColorPickerProps {
  color: string;
  onChange: (color: string) => void;
}
const PopoverColorPicker: React.FC<ColorPickerProps> = ({ color, onChange }) => {
  const [displayColorPicker, setDisplayColorPicker] = useState(false);
  const [pickerPosition, setPickerPosition] = useState({ top: 0, left: 0 });
  const swatchRef = useRef<HTMLDivElement>(null);

  const handleClick = (e: React.MouseEvent) => {
    if (displayColorPicker) {
      setDisplayColorPicker(false);
      return;
    }

    if (swatchRef.current) {
      const rect = swatchRef.current.getBoundingClientRect();
      const pickerHeight = 300; // SketchPickerのおおよその高さ
      const pickerWidth = 220; // SketchPickerのおおよその幅
      const viewportHeight = window.innerHeight;
      const viewportWidth = window.innerWidth;

      let top = rect.top;
      let left = rect.right + 10;

      // 1点目: 下にはみ出すか？
      if (rect.top + pickerHeight > viewportHeight) {
        top = viewportHeight - pickerHeight - 10;
        if (top < 10) top = 10;
      }

      // 右にはみ出すか？
      if (left + pickerWidth > viewportWidth) {
        left = rect.left - pickerWidth - 10; // 左側に表示
      }

      setPickerPosition({ top, left });
      setDisplayColorPicker(true);
    }
  };

  const handleClose = () => {
    setDisplayColorPicker(false);
  };

  const handleChange = (colorResult: ColorResult) => {
    onChange(colorResult.hex);
  };

  // ★ 修正: イベントの伝播を止めるハンドラ
  const stopPropagation = (e: React.MouseEvent | React.TouchEvent | React.SyntheticEvent) => {
    e.stopPropagation();
  };

  return (
    <div>
      <div
        ref={swatchRef}
        className="legend-editor-color-swatch"
        style={{ backgroundColor: color }}
        onClick={handleClick}
      />
      {displayColorPicker ? (
        <>
          {/* Sibling 1: The cover (z-index: 9) */}
          <div className="legend-color-picker-cover" onClick={handleClose} />

          {/* Sibling 2: The popover (z-index: 10) */}
          <div
            className="legend-color-picker-popover"
            style={{
              position: 'fixed',
              top: `${pickerPosition.top}px`,
              left: `${pickerPosition.left}px`,
              zIndex: 10
            }}
            // ★ 修正: ポップオーバー自体でイベント伝播を停止
            onClick={stopPropagation}
            onMouseDown={stopPropagation}
            onTouchStart={stopPropagation}
          >
            <SketchPicker
              color={color}
              onChange={handleChange} // onChangeComplete から onChange に変更
            />
          </div>
        </>
      ) : null}
    </div>
  );
};


// --- (Props と State の受け渡しは変更なし) ---
interface ParameterSelectorProps {
  params: {
    startDate: Date | null;
    endDate: Date | null;
    selectedDays: Set<DayOfWeek>;
    timePitch: string;
    timeFrom: number;
    timeTo: number;
    legend: LegendItem[];
  };
  setParams: React.Dispatch<React.SetStateAction<any>>;
}

const ParameterSelector: React.FC<ParameterSelectorProps> = ({ params, setParams }) => {

  const { startDate, endDate, selectedDays, timePitch, timeFrom, timeTo, legend } = params;

  const setStartDate = (date: Date | null) => setParams(prev => ({...prev, startDate: date}));
  const setEndDate = (date: Date | null) => setParams(prev => ({...prev, endDate: date}));
  const setTimePitch = (pitch: string) => setParams(prev => ({...prev, timePitch: pitch}));
  const setTimeFrom = (from: number) => setParams(prev => ({...prev, timeFrom: from}));
  const setTimeTo = (to: number) => setParams(prev => ({...prev, timeTo: to}));

  const setSelectedDays = (updater: (prevDays: Set<DayOfWeek>) => Set<DayOfWeek>) => {
    setParams(prev => ({ ...prev, selectedDays: updater(prev.selectedDays) }));
  };

  // --- 凡例ハンドラ ---
  const handleLegendChange = (id: string, field: 'value' | 'color', newValue: string | number) => {
    setParams(prev => {
      const newLegend = prev.legend.map(item =>
        item.id === id ? { ...item, [field]: newValue } : item
      );
      if (field === 'value') {
        newLegend.sort((a, b) => a.value - b.value);
      }
      return { ...prev, legend: newLegend };
    });
  };

  const addLegendItem = () => {
    setParams(prev => {
      const lastItem = prev.legend[prev.legend.length - 1];
      const newItem: LegendItem = {
        id: crypto.randomUUID(),
        value: (lastItem?.value || 0) + 20, // 最後の値 + 20
        color: '#ffffff' // デフォルト色
      };
      const newLegend = [...prev.legend, newItem];
      newLegend.sort((a, b) => a.value - b.value);
      return { ...prev, legend: newLegend };
    });
  };

  const removeLegendItem = (id: string) => {
    setParams(prev => ({
      ...prev,
      legend: prev.legend.filter(item => item.id !== id)
    }));
  };
  // --- ------------------- ---


  const toggleDay = (day: DayOfWeek) => {
    setSelectedDays(prevDays => {
      const newDays = new Set(prevDays);
      if (newDays.has(day)) { newDays.delete(day); }
      else { newDays.add(day); }
      return newDays;
    });
  };

  const selectDayPreset = (preset: 'weekdays' | 'weekend' | 'everyday')
: void => {
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

      {/* 期間選択 (From / To) */}
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

      {/* --- 集計時間ピッチ (中央揃え) --- */}
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

      {/* --- 凡例定義 --- */}
      <div style={{ marginTop: '15px' }}>
        <h5>凡例定義</h5>

        {legend.map((item, index) => {
          const prevValue = index === 0 ? 0 : legend[index - 1].value;

          return (
            <div key={item.id} className="legend-editor-row">
              <span style={{width: '30px', textAlign: 'right', fontSize: '0.9em'}}>
                {index === 0 ? 0 : prevValue} ~
              </span>

              <input
                type="number"
                value={item.value}
                onChange={(e) => handleLegendChange(item.id, 'value', Number(e.target.value))}
              />

              <span className="legend-editor-label">Km/h</span>

              <PopoverColorPicker
                color={item.color}
                onChange={(color) => handleLegendChange(item.id, 'color', color)}
              />

              {legend.length > 1 ? (
                <LuCircleMinus
                  className="legend-editor-button"
                  onClick={() => removeLegendItem(item.id)}
                />
              ) : (
                <div style={{width: '1.2em'}}></div> // スペーサー
              )}
            </div>
          );
        })}

        {/* 添付画像の「XX ~」の行 (最後の値を使う) */}
        <div className="legend-editor-row">
          <span style={{width: '30px', textAlign: 'right', fontSize: '0.9em'}}>
            {legend.length > 0 ? legend[legend.length - 1].value : 0} ~
          </span>
          <div style={{width: '60px'}}></div> {/* スペーサー */}
          <span className="legend-editor-label">Km/h</span>

          {legend.length > 0 ? (
            <PopoverColorPicker
              color={legend[legend.length - 1].color}
              onChange={(color) => handleLegendChange(legend[legend.length - 1].id, 'color', color)}
            />
          ) : (
            <div
              className="legend-editor-color-swatch"
              style={{ backgroundColor: '#ccc', cursor: 'default', opacity: 0.6 }}
            />
          )}

          <div style={{width: '1.2em'}}></div> {/* スペーサー */}
        </div>

        {/* 追加ボタン */}
        <div style={{ ...styles.flexCenter, marginTop: '10px' }}>
          <button onClick={addLegendItem} style={styles.addButton}>
            <LuCirclePlus style={{ marginRight: '5px' }} /> 凡例を追加
          </button>
        </div>
      </div>
      {/* --- ------------------- --- */}

    </div>
  );
};

// スタイルをJSオブジェクトとして定義 (CSS in JS)
const styles = {
  flexCenter: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  } as React.CSSProperties,
  addButton: {
    display: 'flex',
    alignItems: 'center',
    fontSize: '0.9em',
    padding: '4px 8px',
    backgroundColor: '#4a5568',
    color: '#ecf0f1',
    border: '1px solid #718096',
  } as React.CSSProperties,
};

export default ParameterSelector;
