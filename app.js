// 運転日誌記録アプリケーション
class DrivingLogApp {
    constructor() {
        this.records = [];
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.updateFormState();
        this.populateMonthFilter();
        this.renderRecords();
    }

    setupEventListeners() {
        const form = document.getElementById('driving-form');
        const monthFilter = document.getElementById('month-filter');

        form.addEventListener('submit', (e) => this.handleFormSubmit(e));
        monthFilter.addEventListener('change', () => this.renderRecords());
    }

    // 今日の日付を取得（YYYY-MM-DD形式）
    getTodayDateString() {
        const today = new Date();
        return today.toISOString().split('T')[0];
    }

    // 指定日付の既存記録をチェック
    getRecordsForDate(dateString) {
        return this.records.filter(record => {
            const recordDate = new Date(record.datetime).toISOString().split('T')[0];
            return recordDate === dateString;
        });
    }

    // フォームの状態を更新（必須/任意の切り替え）
    updateFormState() {
        const todayRecords = this.getRecordsForDate(this.getTodayDateString());
        const mileageField = document.getElementById('mileage');
        const requiredIndicator = document.getElementById('required-indicator');
        const mileageHelp = document.getElementById('mileage-help');
        const isFirstEntry = todayRecords.length === 0;

        if (isFirstEntry) {
            // 初回記録の場合
            mileageField.required = true;
            mileageField.placeholder = '走行距離をキロメートルで入力';
            mileageField.classList.add('required');
            mileageField.classList.remove('optional');
            
            requiredIndicator.textContent = '(必須)';
            requiredIndicator.classList.remove('optional');
            
            mileageHelp.textContent = '今日初回の記録は走行距離の入力が必要です';
        } else {
            // 2回目以降の記録の場合
            mileageField.required = false;
            mileageField.placeholder = '任意：前回の続きなど';
            mileageField.classList.add('optional');
            mileageField.classList.remove('required');
            
            requiredIndicator.textContent = '(任意)';
            requiredIndicator.classList.add('optional');
            
            mileageHelp.textContent = '2回目以降の記録では走行距離は任意です';
        }
    }

    // フォーム送信処理
    handleFormSubmit(e) {
        e.preventDefault();
        
        const mileageInput = document.getElementById('mileage');
        const destinationInput = document.getElementById('destination');
        
        const mileage = mileageInput.value ? parseFloat(mileageInput.value) : null;
        const destination = destinationInput.value.trim();

        // 移動先は常に必須
        if (!destination) {
            alert('移動先を入力してください。');
            return;
        }

        // 初回記録の場合は走行距離も必須
        const todayRecords = this.getRecordsForDate(this.getTodayDateString());
        if (todayRecords.length === 0 && (mileage === null || mileage === undefined)) {
            alert('今日初回の記録では走行距離の入力が必要です。');
            return;
        }

        // 新しい記録を作成
        const newRecord = {
            id: this.generateId(),
            datetime: new Date(),
            mileage: mileage,
            destination: destination
        };

        // 記録を追加
        this.records.push(newRecord);

        // フォームをリセット
        mileageInput.value = '';
        destinationInput.value = '';

        // UIを更新
        this.updateFormState();
        this.populateMonthFilter();
        this.renderRecords();

        // 成功メッセージ（簡易的）
        const button = e.target.querySelector('button[type="submit"]');
        const originalText = button.textContent;
        button.textContent = '記録を追加しました！';
        button.disabled = true;
        
        setTimeout(() => {
            button.textContent = originalText;
            button.disabled = false;
        }, 1500);
    }

    // ユニークIDを生成
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    // 月別フィルターのオプションを生成
    populateMonthFilter() {
        const monthFilter = document.getElementById('month-filter');
        const currentValue = monthFilter.value;
        
        // 既存のオプション（「すべて」以外）をクリア
        const options = monthFilter.querySelectorAll('option:not([value=""])');
        options.forEach(option => option.remove());

        // 記録から月を抽出
        const months = new Set();
        this.records.forEach(record => {
            const date = new Date(record.datetime);
            const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            months.add(monthKey);
        });

        // 月をソートして追加
        const sortedMonths = Array.from(months).sort().reverse();
        sortedMonths.forEach(monthKey => {
            const [year, month] = monthKey.split('-');
            const option = document.createElement('option');
            option.value = monthKey;
            option.textContent = `${year}年${parseInt(month)}月`;
            monthFilter.appendChild(option);
        });

        // 前の選択値を復元
        monthFilter.value = currentValue;
    }

    // 記録を表示
    renderRecords() {
        const container = document.getElementById('records-container');
        const noRecordsDiv = document.getElementById('no-records');
        const monthFilter = document.getElementById('month-filter');
        
        // フィルタリング
        let filteredRecords = this.records;
        if (monthFilter.value) {
            const [filterYear, filterMonth] = monthFilter.value.split('-');
            filteredRecords = this.records.filter(record => {
                const date = new Date(record.datetime);
                const recordYear = date.getFullYear().toString();
                const recordMonth = String(date.getMonth() + 1).padStart(2, '0');
                return recordYear === filterYear && recordMonth === filterMonth;
            });
        }

        if (filteredRecords.length === 0) {
            container.innerHTML = '';
            noRecordsDiv.classList.remove('hidden');
            return;
        }

        noRecordsDiv.classList.add('hidden');

        // 日付別にグループ化
        const groupedRecords = this.groupRecordsByDate(filteredRecords);
        
        container.innerHTML = '';
        
        // 日付の降順でソート
        const sortedDates = Object.keys(groupedRecords).sort().reverse();
        
        sortedDates.forEach(dateKey => {
            const dateRecords = groupedRecords[dateKey];
            const dateCard = this.createDateCard(dateKey, dateRecords);
            container.appendChild(dateCard);
        });
    }

    // 記録を日付別にグループ化
    groupRecordsByDate(records) {
        const grouped = {};
        
        records.forEach(record => {
            const date = new Date(record.datetime);
            const dateKey = date.toISOString().split('T')[0];
            
            if (!grouped[dateKey]) {
                grouped[dateKey] = [];
            }
            grouped[dateKey].push(record);
        });

        // 各日付内で時刻順にソート
        Object.keys(grouped).forEach(dateKey => {
            grouped[dateKey].sort((a, b) => new Date(a.datetime) - new Date(b.datetime));
        });

        return grouped;
    }

    // 日付カードを作成
    createDateCard(dateKey, records) {
        const date = new Date(dateKey + 'T00:00:00');
        const dateCard = document.createElement('div');
        dateCard.className = 'date-card fade-in';

        // 日付のフォーマット
        const dateStr = this.formatDate(date);
        
        // その日の総走行距離を計算
        const totalMileage = records.reduce((sum, record) => {
            return sum + (record.mileage || 0);
        }, 0);

        dateCard.innerHTML = `
            <div class="date-card__header">
                <h3 class="date-header">${dateStr}</h3>
                ${totalMileage > 0 ? `<div class="total-mileage">総走行距離: ${totalMileage.toFixed(1)}km</div>` : ''}
            </div>
            <div class="date-card__body">
                ${records.map(record => this.createRecordItem(record)).join('')}
            </div>
        `;

        return dateCard;
    }

    // 個別記録アイテムを作成
    createRecordItem(record) {
        const time = new Date(record.datetime).toLocaleTimeString('ja-JP', {
            hour: '2-digit',
            minute: '2-digit'
        });

        const mileageDisplay = record.mileage !== null 
            ? `${record.mileage.toFixed(1)}km`
            : '記録なし';

        const mileageClass = record.mileage !== null ? 'has-value' : '';

        return `
            <div class="record-item">
                <div class="record-time">${time}</div>
                <div class="record-destination">${record.destination}</div>
                <div class="record-mileage ${mileageClass}">${mileageDisplay}</div>
            </div>
        `;
    }

    // 日付をフォーマット
    formatDate(date) {
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        const targetDate = new Date(date);
        
        if (targetDate.toDateString() === today.toDateString()) {
            return '今日';
        } else if (targetDate.toDateString() === yesterday.toDateString()) {
            return '昨日';
        } else {
            const year = targetDate.getFullYear();
            const month = targetDate.getMonth() + 1;
            const day = targetDate.getDate();
            const dayOfWeek = ['日', '月', '火', '水', '木', '金', '土'][targetDate.getDay()];
            
            return `${year}年${month}月${day}日(${dayOfWeek})`;
        }
    }
}

// アプリケーションを初期化
document.addEventListener('DOMContentLoaded', () => {
    new DrivingLogApp();
});