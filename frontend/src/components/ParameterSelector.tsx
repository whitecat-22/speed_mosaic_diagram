import React, { useState, useRef, useEffect, useMemo } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

// ホイールピッカーのスタイル
const pickerStyles = `
.wheel-picker-container {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 5px; /* From/Toの間隔を狭く */
}
.wheel-picker {
  height: 180px; /* 36px * 5項目 */
  width: 100px;
  overflow-y: scroll;
  scroll-snap-type: y mandatory;
  border: 1px solid #ccc;
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
/* 上下の余白 (中央の項目が1番目に来るように) */
.wheel-picker-item.padding {
  height: 72px; /* (高さ 180px / 2) - (アイテムの高さ 36px / 2) = 72px */
}
/* 中央のハイライト (コンテナ側で実装) */
.wheel-picker-wrapper {
  position: relative;
}
/* 中央ハイライトの線 */
.wheel-picker-wrapper::before,
.wheel-picker-wrapper::after {
  content: '';
  position: absolute;
  left: 0;
  right: 0;
  width: 100%;
  height: 1px;
  background-color: #999;
  z-index: 1;
  pointer-events: none; /* スクロールを妨げない */
}
.wheel-picker-wrapper::before {
  top: 72px; /* (高さ 180px / 2) - (アイテムの高さ 36px / 2) */
}
.wheel-picker-wrapper::after {
  bottom: 72px; /* (高さ 180px / 2) - (アイテムの高さ 36px / 2) */
}
`;

// --- ホイールピッカーコンポーネント (★ループ・エラー修正対応) ---
interface ScrollPickerProps {
  items: string[]; // 元のリスト (00時〜23時)
  value: number; // 選択中のインデックス (0〜23)
  onChange: (newIndex: number) => void;
}

const itemHeight = 36; // 1項目の高さ (px)
const loopCount = 3; // リストの周回数 (3周)

const ScrollPicker: React.FC<ScrollPickerProps> = ({ items: originalItems, value, onChange }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollTimeout = useRef<NodeJS.Timeout | null>(null);
  const isScrolling = useRef<boolean>(false); // スクロールアニメーション中フラグ

  const n = originalItems.length; // 24

  // ループ用のリストを作成 (例: 3周分)
  const loopedItems = useMemo(() => {
    const arr = [];
    for (let i = 0; i < loopCount; i++) {
      arr.push(...originalItems);
    }
    return arr;
  }, [originalItems]);

  // 中央のリスト (2周目) の開始インデックス
  const middleListStartIndex = n;

  // 初期スクロール位置を中央のリスト (2周目) の該当インデックスに設定
  const initialScrollTop = (middleListStartIndex + value) * itemHeight;

  // 初期スクロール位置を設定 (マウント時)
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = initialScrollTop;
    }
  }, []); // マウント時に一度だけ実行

  // 外部からvalueが変わった場合にスクロール位置を同期
  useEffect(() => {
    let timeoutId: NodeJS.Timeout | null = null;

    // ★ エラー修正: ref.current が存在する場合のみ実行
    if (containerRef.current) {
      const targetScrollTop = (middleListStartIndex + value) * itemHeight;
      const currentRef = containerRef.current; // クロージャ用にコピー

      if (currentRef.scrollTop !== targetScrollTop) {
        isScrolling.current = true; // アニメーション開始
        currentRef.scrollTo({
          top: targetScrollTop,
          behavior: 'smooth' // スムーズスクロールで移動
        });

        const scrollAnimTime = 300; // 300ms
        timeoutId = setTimeout(() => {
          isScrolling.current = false;
        }, scrollAnimTime);
      }
    }

    // クリーンアップ
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [value, middleListStartIndex]); // 依存配列に middleListStartIndex を追加

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    // スクロールアニメーション中は、スクロールイベントによる値の更新を無視
    if (isScrolling.current) return;

    // スクロール中はタイマーをクリア
    if (scrollTimeout.current) {
      clearTimeout(scrollTimeout.current);
    }

    // スクロール停止を検知するタイマーを設定
    scrollTimeout.current = setTimeout(() => {
      // ★ エラー修正:
      // このコールバックが実行される時点（150ms後）で
      // コンポーネントがアンマウントされ、refがnullになる可能性があるため、
      // 厳格にチェックします。
      const currentContainer = containerRef.current;
      if (!currentContainer) return; // コンテナが存在しなければ処理を中断

      const scrollTop = currentContainer.scrollTop;
      // スクロール位置から最も近いインデックスを計算
      const selectedIndex = Math.round(scrollTop / itemHeight);

      // 0〜23 の範囲のインデックスに変換
      const normalizedIndex = selectedIndex % n;

      // 1周目または3周目にスナップした場合、瞬時に2周目の同じ位置に戻す
      const buffer = 0;
      if (selectedIndex < (middleListStartIndex - buffer) || selectedIndex >= (middleListStartIndex + n + buffer)) {
        const resetScrollTop = (middleListStartIndex + normalizedIndex) * itemHeight;

        // behavior: 'auto' (瞬時) に変更
        currentContainer.scrollTo({ top: resetScrollTop, behavior: 'auto' });
      }

      if (normalizedIndex !== value) {
        onChange(normalizedIndex);
      }
    }, 150); // 150msスクロールが停止したら確定
  };

  // ★ エラー修正: アンマウント時にスクロールタイマーをクリーンアップ
  useEffect(() => {
    const currentScrollTimeout = scrollTimeout.current;
    return () => {
      if (currentScrollTimeout) {
        clearTimeout(currentScrollTimeout);
      }
    };
  }, []); // マウント/アンマウント時に一度だけ実行

  return (
    <div className="wheel-picker-wrapper">
      <div
        ref={containerRef}
        className="wheel-picker"
        onScroll={handleScroll}
      >
        {/* 上のパディング */}
        <div className="wheel-picker-item padding"></div>

        {loopedItems.map((item, index) => (
          <div key={index} className="wheel-picker-item">
            {item}
          </div>
        ))}

        {/* 下のパディング */}
        <div className="wheel-picker-item padding"></div>
      </div>
    </div>
  );
};


// --- ParameterSelector本体 ---
const ParameterSelector: React.FC = () => {
  const [startDate, setStartDate] = useState<Date | null>(new Date());
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [timePitch, setTimePitch] = useState<string>('60');

  const [timeFrom, setTimeFrom] = useState<number>(7); // デフォルトを7時 (インデックス 0〜23)
  const [timeTo, setTimeTo] = useState<number>(19); // デフォルトを19時 (インデックス 0〜23)

  // 期間選択
  const handleDateChange = (dates: [Date | null, Date | null]) => {
    const [start, end] = dates;
    setStartDate(start);
    setEndDate(end);
  };

  // 0時から23時までのオプション (文字列の配列)
  const hourOptions = useMemo(() =>
    Array.from({ length: 24 }, (_, i) => `${i.toString().padStart(2, '0')} 時`)
  , []);

  return (
    <div>
      {/* CSSをグローバルに挿入 */}
      <style>{pickerStyles}</style>

      <h4>2. 対象とする日付・時間帯等の選択</h4>

      {/* 期間選択 */}
      <div>
        <DatePicker
          selected={startDate}
          onChange={handleDateChange}
          startDate={startDate}
          endDate={endDate}
          selectsRange
          inline
        />
      </div>

      {/* --- 時間帯選択 (ホイールピッカー) --- */}
      <div style={{ margin: '10px 0' }}>
        <h5>対象とする時間帯</h5>

        <div className="wheel-picker-container">
            {/* From */}
            <ScrollPicker
              items={hourOptions}
              value={timeFrom}
              onChange={setTimeFrom}
            />

            <span> 〜 </span>

            {/* To */}
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
