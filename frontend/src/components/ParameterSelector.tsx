import React, { useState } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

const ParameterSelector: React.FC = () => {
  const [startDate, setStartDate] = useState<Date | null>(new Date());
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [timePitch, setTimePitch] = useState<string>('60');
  
  // (TomTom風のUI: 期間選択)
  const handleDateChange = (dates: [Date | null, Date | null]) => {
    const [start, end] = dates;
    setStartDate(start);
    setEndDate(end);
  };

  // (凡例定義のUI ... 複雑になるためUIライブラリ(MUI等)の利用を推奨)

  return (
    <div>
      <h4>2. 対象とする日付・時間帯等の選択</h4>
      
      {/* 期間選択 */}
      <div>
        <DatePicker
          selected={startDate}
          onChange={handleDateChange}
          startDate={startDate}
          endDate={endDate}
          selectsRange
          inline // カレンダーを常時表示
        />
        {/* (ここに "Days of the week" の選択UIを追加) */}
      </div>

      {/* 集計時間ピッチ */}
      <div>
        <h5>集計時間ピッチ</h5>
        {['15', '30', '60'].map((pitch) => (
          <label key={pitch}>
            <input
              type="radio"
              name="pitch"
              value={pitch}
              checked={timePitch === pitch}
              onChange={(e) => setTimePitch(e.target.value)}
            />
            {pitch}分
          </label>
        ))}
      </div>
      
      {/* (ここに凡例定義UIを追加) */}
    </div>
  );
};

export default ParameterSelector;
