import React, { useState, useRef, useEffect, useMemo } from 'react';
import DatePicker, { registerLocale } from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { LuCirclePlus, LuCircleMinus } from 'react-icons/lu';
import { SketchPicker, ColorResult } from 'react-color';

import { ja } from 'date-fns/locale';

registerLocale('ja', ja);

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
.wheel-picker-wrapper {
  position: relative;
  height: 36px;
}
.wheel-picker-wrapper::before,
.wheel-picker-wrapper::after {
  content: '';
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  width: 0;
  height: 0;
  border-style: solid;
  opacity: 0; /* 通常は非表示 */
  transition: opacity 0.2s ease;
  pointer-events: none; /* クリックを妨げない */
  z-index: 1;
}
.wheel-picker-wrapper::before {
  top: 4px;
  border-width: 0 5px 6px 5px;
  border-color: transparent transparent #ecf0f1 transparent;
}
.wheel-picker-wrapper::after {
  bottom: 4px;
  border-width: 6px 5px 0 5px;
  border-color: #ecf0f1 transparent transparent transparent;
}
.wheel-picker-wrapper:hover::before,
.wheel-picker-wrapper:hover::after {
  opacity: 0.7;
}
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
  /* 1点目: カレンダーラッパーを中央揃え */
  .datepicker-wrapper {
    display: flex;
    justify-content: center;
  }

  /* (カレンダーのダークテーマ対応) */
  .react-datepicker {
    font-size: 0.95em;
    background-color: #2d3748;
    border: none;
    color: #ecf0f1;
  }
  .react-datepicker__header {
    background-color: #2d3748;
    border-bottom: 1px solid #4a5568;
  }
  .react-datepicker__current-month,
  .react-datepicker__day-name,
  .react-datepicker__day {
    color: #ecf0f1;
  }
  .react-datepicker__day-name {
    color: #a0aec0;
  }

  .react-datepicker__day:hover {
    background-color: #4a90e2;
    color: #ffffff;
    border-radius: 50%;
  }

  .react-datepicker__day--highlighted {
    background-color: #2e71cc;
    color: #ffffff;
    border-radius: 50%;
    font-weight: bold;
  }
  .react-datepicker__day--highlighted:hover {
    background-color: #2760ae;
    color: #ffffff;
  }

  .react-datepicker__day--selected,
  .react-datepicker__day--range-start,
  .react-datepicker__day--range-end,
  .react-datepicker__day--in-range {
    background-color: transparent;
    border-radius: 50%;
    color: #ecf0f1;
  }
  .react-datepicker__day--highlighted.react-datepicker__day--selected {
      background-color: #2e71cc;
      color: #ffffff;
  }

  .react-datepicker__day--disabled {
    color: #718096;
  }
  .react-datepicker__navigation-icon::before {
    border-color: #ecf0f1;
  }

  /* (曜日ボタン関連のスタイルは変更なし) */
  .day-toggle-button {
    padding: 5px 0px;
    font-size: 0.8em;
    border: 1px solid #718096;
    border-radius: 4px; cursor: pointer; background-color: #4a5568;
    color: #ecf0f1; flex-grow: 1; text-align: center; flex-basis: 0;
  }
  .day-toggle-button.selected {
    background-color: #2e71cc;
    color: white;
    border-color: #2e71cc;
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

  /* (集計時間ピッチボタンは変更なし) */
  .pitch-preset-buttons {
    display: flex;
    justify-content: space-between;
    gap: 4px;
  }
  .pitch-preset-buttons button {
    flex-grow: 1;
    font-size: 0.9em;
    padding: 6px 2px;
    background-color: #4a5568;
    color: #ecf0f1;
    border: 1px solid #718096;
    border-radius: 4px;
    cursor: pointer;
    flex-basis: 0;
  }
  .pitch-preset-buttons button.selected {
    background-color: #2e71cc;
    color: white;
    border-color: #2e71cc;
  }
  .pitch-preset-buttons button:hover:not(.selected) {
    background-color: #718096;
  }

  /* (凡例エディタのスタイルは変更なし) */
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
  .legend-color-picker-popover {
    z-index: 10;
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

// (CustomDateInput は削除)

// --- カラーピッカーコンポーネント (変更なし) ---
interface ColorPickerProps {
  color: string;
  onChange: (color: string) => void;
}
const PopoverColorPicker: React.FC<ColorPickerProps> = ({ color, onChange }) => {
  const [displayColorPicker, setDisplayColorPicker] = useState(false);
  const [pickerPosition, setPickerPosition] = useState({ top: 0, left: 0 });
  const swatchRef = useRef<HTMLDivElement>(null);

  const handleClick = (e: React.MouseEvent) => {
    if (displayColorPicker) { setDisplayColorPicker(false); return; }
    if (swatchRef.current) {
      const rect = swatchRef.current.getBoundingClientRect();
      const pickerHeight = 300, pickerWidth = 220;
      const viewportHeight = window.innerHeight, viewportWidth = window.innerWidth;
      let top = rect.top, left = rect.right + 10;
      if (rect.top + pickerHeight > viewportHeight) { top = viewportHeight - pickerHeight - 10; if (top < 10) top = 10; }
      if (left + pickerWidth > viewportWidth) { left = rect.left - pickerWidth - 10; }
      setPickerPosition({ top, left });
      setDisplayColorPicker(true);
    }
  };
  const handleClose = () => { setDisplayColorPicker(false); };
  const handleChange = (colorResult: ColorResult) => { onChange(colorResult.hex); };
  const stopPropagation = (e: React.SyntheticEvent) => { e.stopPropagation(); };
  return (
    <div>
      <div ref={swatchRef} className="legend-editor-color-swatch" style={{ backgroundColor: color }} onClick={handleClick} />
      {displayColorPicker ? (
        <>
          <div className="legend-color-picker-cover" onClick={handleClose} />
          <div
            className="legend-color-picker-popover"
            style={{ position: 'fixed', top: `${pickerPosition.top}px`, left: `${pickerPosition.left}px`, zIndex: 10 }}
            onClick={stopPropagation} onMouseDown={stopPropagation} onTouchStart={stopPropagation}
          >
            <SketchPicker color={color} onChange={handleChange} />
          </div>
        </>
      ) : null}
    </div>
  );
};


// --- ParameterSelector本体 ---
interface ParameterSelectorProps {
  params: {
    selectedDates: Date[];
    selectedDays: Set<DayOfWeek>;
    timePitch: string;
    timeFrom: number;
    timeTo: number;
    legend: LegendItem[];
  };
  setParams: React.Dispatch<React.SetStateAction<any>>;
}

const ParameterSelector: React.FC<ParameterSelectorProps> = ({ params, setParams }) => {

  const { selectedDates, selectedDays, timePitch, timeFrom, timeTo, legend } = params;

  // 複数日選択の onChange ハンドラ
  const handleDateChange = (date: Date | null) => {
    if (!date) return;

    setParams(prev => {
      const newDates = [...prev.selectedDates];
      const dateStr = date.toDateString();
      const index = newDates.findIndex(d => d.toDateString() === dateStr);

      if (index > -1) {
        newDates.splice(index, 1);
      } else {
        newDates.push(date);
      }

      newDates.sort((a, b) => a.getTime() - b.getTime());
      return { ...prev, selectedDates: newDates };
    });
  };

  // 日付オールクリア
  const clearAllDates = () => {
    setParams(prev => ({...prev, selectedDates: []}));
  };

  // (他のハンドラは変更なし)
  const setTimePitch = (pitch: string) => setParams(prev => ({...prev, timePitch: pitch}));
  const setTimeFrom = (from: number) => setParams(prev => ({...prev, timeFrom: from}));
  const setTimeTo = (to: number) => setParams(prev => ({...prev, timeTo: to}));
  const setSelectedDays = (updater: (prevDays: Set<DayOfWeek>) => Set<DayOfWeek>) => {
    setParams(prev => ({ ...prev, selectedDays: updater(prev.selectedDays) }));
  };
  const handleLegendChange = (id: string, field: 'value' | 'color', newValue: string | number) => {
    setParams(prev => {
      const newLegend = prev.legend.map(item =>
        item.id === id ? { ...item, [field]: newValue } : item
      );
      if (field === 'value' && newValue !== Infinity) {
        const thresholdItems = newLegend.filter(item => item.value !== Infinity)
                                      .sort((a, b) => a.value - b.value);
        const topItem = newLegend.find(item => item.value === Infinity);
        return { ...prev, legend: topItem ? [...thresholdItems, topItem] : thresholdItems };
      }
      return { ...prev, legend: newLegend };
    });
  };
  const addLegendItem = () => {
    setParams(prev => {
      const thresholdItems = prev.legend.filter(item => item.value !== Infinity);
      const topItem = prev.legend.find(item => item.value === Infinity);
      const sortedThresholds = [...thresholdItems].sort((a, b) => a.value - b.value);
      const lastThreshold = sortedThresholds.length > 0 ? sortedThresholds[sortedThresholds.length - 1] : { value: 0 };
      const newItem: LegendItem = {
        id: crypto.randomUUID(),
        value: (lastThreshold?.value || 0) + 20,
        color: topItem?.color || '#ffffff'
      };
      const newThresholdItems = [...thresholdItems, newItem].sort((a, b) => a.value - b.value);
      return { ...prev, legend: topItem ? [...newThresholdItems, topItem] : newThresholdItems };
    });
  };
  const removeLegendItem = (id: string) => {
    setParams(prev => {
      const thresholdItems = prev.legend.filter(item => item.value !== Infinity);
      if (thresholdItems.length <= 1) {
        return prev;
      }
      const topItem = prev.legend.find(item => item.value === Infinity);
      const newThresholdItems = thresholdItems.filter(item => item.id !== id);
      return { ...prev, legend: topItem ? [...newThresholdItems, topItem] : newThresholdItems };
    });
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
    Array.from({ length: 24 }, (_, i) => `${i.toString().padStart(2, '0')}`)
  , []);

  const thresholdItems = useMemo(() => legend.filter(item => item.value !== Infinity), [legend]);
  const topItem = useMemo(() => legend.find(item => item.value === Infinity), [legend]);

  // 曜日のフォーマット関数
  const formatWeekDay = (name: string) => {
    return name.substring(0, 1); // '月'
  };

  return (
    <div>
      {/* CSSをグローバルに挿入 */}
      <style>{pickerStyles}</style>
      <style>{datePickerStyles}</style>

      <h4>2. 対象とする日付・時間帯等の選択</h4>

      {/* 期間選択 (inlineカレンダーに変更) */}
      <div style={{ marginBottom: '15px' }}>
        <h5 style={{ marginBottom: '5px' }}>
          対象日 <span style={{fontSize: '0.9em', color: '#a0aec0'}}>(複数選択可)</span>
        </h5>

        {/* 1点目: 中央揃えラッパー */}
        <div className="datepicker-wrapper">
          <DatePicker
            onChange={handleDateChange}
            inline
            highlightDates={selectedDates}
            selected={selectedDates.length > 0 ? selectedDates[0] : new Date()}
            dayClassName={date =>
              selectedDates.find(d => d.toDateString() === date.toDateString())
                ? 'react-datepicker__day--highlighted'
                : undefined
            }

            // 2点目: 日本語化
            locale="ja"
            // ★ 修正: 年月ピッカー(showMonthYearPicker)をやめ、
            //          ヘッダーのフォーマット(dateFormat="yyyy年MM月")も削除
            formatWeekDay={formatWeekDay} // 曜日を「月」「火」...
          />
        </div>

        {/* フッター */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '5px' }}>
          <span style={{ fontSize: '0.9em', color: '#a0aec0' }}>
            【指定された日数】 {selectedDates.length} 日分
          </span>
          <button
            onClick={clearAllDates}
            style={{
              background: 'none',
              border: 'none',
              color: '#a0aec0',
              textDecoration: 'underline',
              fontSize: '0.9em',
              cursor: 'pointer'
            }}
          >
            日付オールクリア
          </button>
        </div>
      </div>

      {/* 曜日選択 (変更なし) */}
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

      {/* --- 時間帯選択 (「時」を外に出す) --- */}
      <div style={{ margin: '15px 0' }}>
        <h5>対象とする時間帯</h5>
        <div className="wheel-picker-container">
            <ScrollPicker
              items={hourOptions}
              value={timeFrom}
              onChange={setTimeFrom}
            />
            <span style={{ fontSize: '0.95em', marginLeft: '3px' }}>時</span>

            <span style={{ margin: '0 8px' }}> 〜 </span>

            <ScrollPicker
              items={hourOptions}
              value={timeTo}
              onChange={setTimeTo}
            />
            <span style={{ fontSize: '0.95em', marginLeft: '3px' }}>時</span>
        </div>
      </div>
      {/* --- ----------------------------- --- */}

      {/* --- 集計時間ピッチ (ボタンに変更) --- */}
      <div style={{ marginTop: '15px' }}>
        <h5>集計時間ピッチ</h5>
        <div className="pitch-preset-buttons">
          {['15', '30', '60'].map((pitch) => (
            <button
              key={pitch}
              className={timePitch === pitch ? 'selected' : ''}
              onClick={() => setTimePitch(pitch)}
            >
              {pitch}分
            </button>
          ))}
        </div>
      </div>
      {/* --- ------------------------- --- */}

      {/* --- 凡例定義 (ロジック分離) --- */}
      <div style={{ marginTop: '15px' }}>
        <h5>凡例定義</h5>

        {thresholdItems.map((item, index) => {
          const prevValue = index === 0 ? 0 : thresholdItems[index - 1].value;

          return (
            <div key={item.id} className="legend-editor-row">
              <span style={{width: '30px', textAlign: 'right', fontSize: '0.9em'}}>
                {prevValue} ~
              </span>

              <input
                type="number"
                value={item.value}
                onChange={(e) => handleLegendChange(item.id, 'value', Number(e.target.value))}
              />

              <span className="legend-editor-label">km/h</span>

              <PopoverColorPicker
                color={item.color}
                onChange={(color) => handleLegendChange(item.id, 'color', color)}
              />

              {thresholdItems.length > 1 ? (
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

        {topItem && (
          <div className="legend-editor-row">
            <span style={{width: '30px', textAlign: 'right', fontSize: '0.9em'}}>
              {thresholdItems.length > 0 ? thresholdItems[thresholdItems.length - 1].value : 0} ~
            </span>

            <div style={{width: '60px'}}></div>

            <span className="legend-editor-label">km/h</span>

            <PopoverColorPicker
              color={topItem.color}
              onChange={(color) => handleLegendChange(topItem.id, 'color', color)}
            />

            <div style={{width: '1.2em'}}></div>
          </div>
        )}

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
