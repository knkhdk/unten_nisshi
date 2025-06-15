// 運転日誌アプリ - スマートフォン最適化版
class DrivingLogApp {
    constructor() {
        this.records = [];
        this.nextId = 1;
        this.init();
    }

    init() {
        this.bindEvents();
        this.initializeMonthFilter();
        this.renderRecords();
        this.updateRecordCount();
    }

    bindEvents() {
        // フォーム送信イベント
        const form = document.getElementById('drivingForm');
        form.addEventListener('submit', (e) => this.handleFormSubmit(e));

        // 月別フィルターイベント
        const monthFilter = document.getElementById('monthFilter');
        monthFilter.addEventListener('change', () => this.handleFilterChange());

        // タッチイベントの最適化
        this.optimizeTouchEvents();
    }

    optimizeTouchEvents() {
        // iOS Safari での zoom 防止
        document.addEventListener('gesturestart', (e) => {
            e.preventDefault();
        });

        // ダブルタップズーム防止
        let lastTouchEnd = 0;
        document.addEventListener('touchend', (e) => {
            const now = new Date().getTime();
            if (now - lastTouchEnd <= 300) {
                e.preventDefault();
            }
            lastTouchEnd = now;
        }, false);
    }

    handleFormSubmit(e) {
        e.preventDefault();
        
        const mileageInput = document.getElementById('mileage');
        const destinationInput = document.getElementById('destination');
        
        const mileage = parseFloat(mileageInput.value);
        const destination = destinationInput.value.trim();

        // バリデーション
        if (!this.validateInput(mileage, destination)) {
            return;
        }

        // 新しい記録を作成
        const record = {
            id: this.nextId++,
            date: new Date(),
            mileage: mileage,
            destination: destination
        };

        // 記録を追加
        this.records.unshift(record); // 新しい記録を先頭に追加
        
        // フォームをリセット
        mileageInput.value = '';
        destinationInput.value = '';
        
        // UIを更新
        this.renderRecords();
        this.updateRecordCount();
        this.updateMonthFilter();
        
        // 成功メッセージを表示
        this.showToast('記録が保存されました', 'success');
        
        // フォームの最初のフィールドにフォーカス
        mileageInput.focus();
    }

    validateInput(mileage, destination) {
        if (isNaN(mileage) || mileage < 0) {
            this.showToast('正しい走行距離を入力してください', 'error');
            return false;
        }
        
        if (!destination) {
            this.showToast('移動先を入力してください', 'error');
            return false;
        }
        
        return true;
    }

    renderRecords() {
        const recordsList = document.getElementById('recordsList');
        const monthFilter = document.getElementById('monthFilter');
        const selectedMonth = monthFilter.value;
        
        // フィルタリング
        let filteredRecords = this.records;
        if (selectedMonth) {
            filteredRecords = this.records.filter(record => {
                const recordMonth = this.formatYearMonth(record.date);
                return recordMonth === selectedMonth;
            });
        }
        
        // 記録がない場合
        if (filteredRecords.length === 0) {
            recordsList.innerHTML = `
                <div class="empty-state">
                    <p>${selectedMonth ? 'この月の記録がありません。' : 'まだ記録がありません。'}<br>上のフォームから新しい記録を追加してください。</p>
                </div>
            `;
            return;
        }
        
        // 記録をレンダリング
        const recordsHTML = filteredRecords.map(record => this.createRecordHTML(record)).join('');
        recordsList.innerHTML = recordsHTML;
        
        // 削除ボタンのイベントリスナーを追加
        this.bindDeleteButtons();
    }

    createRecordHTML(record) {
        return `
            <div class="record-item" data-id="${record.id}">
                <div class="record-content">
                    <div class="record-header">
                        <span class="record-id">記録 #${record.id}</span>
                        <span class="record-date">${this.formatDateTime(record.date)}</span>
                    </div>
                    <div class="record-details">
                        <div class="record-detail">
                            <span class="record-label">走行距離:</span>
                            <span class="record-value mileage-value">${record.mileage.toLocaleString()} km</span>
                        </div>
                        <div class="record-detail">
                            <span class="record-label">移動先:</span>
                            <span class="record-value destination-value">${this.escapeHtml(record.destination)}</span>
                        </div>
                    </div>
                </div>
                <button class="delete-btn" data-id="${record.id}" aria-label="記録を削除">
                    削除
                </button>
            </div>
        `;
    }

    bindDeleteButtons() {
        const deleteButtons = document.querySelectorAll('.delete-btn');
        deleteButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                const recordId = parseInt(e.target.dataset.id);
                this.deleteRecord(recordId);
            });
        });
    }

    deleteRecord(recordId) {
        // 確認ダイアログ
        if (!confirm('この記録を削除しますか？')) {
            return;
        }
        
        // 記録を削除
        this.records = this.records.filter(record => record.id !== recordId);
        
        // UIを更新
        this.renderRecords();
        this.updateRecordCount();
        this.updateMonthFilter();
        
        // 削除メッセージを表示
        this.showToast('記録が削除されました', 'success');
    }

    initializeMonthFilter() {
        this.updateMonthFilter();
    }

    updateMonthFilter() {
        const monthFilter = document.getElementById('monthFilter');
        const currentValue = monthFilter.value;
        
        // 月のセットを取得
        const months = new Set();
        this.records.forEach(record => {
            months.add(this.formatYearMonth(record.date));
        });
        
        // ソートされた月のリスト
        const sortedMonths = Array.from(months).sort().reverse();
        
        // オプションを更新
        const optionsHTML = sortedMonths.map(month => {
            const [year, monthNum] = month.split('-');
            const monthName = this.getMonthName(parseInt(monthNum));
            return `<option value="${month}">${year}年${monthName}</option>`;
        }).join('');
        
        monthFilter.innerHTML = `
            <option value="">すべての月</option>
            ${optionsHTML}
        `;
        
        // 以前の選択を復元
        if (currentValue && sortedMonths.includes(currentValue)) {
            monthFilter.value = currentValue;
        }
    }

    handleFilterChange() {
        this.renderRecords();
        this.updateRecordCount();
    }

    updateRecordCount() {
        const monthFilter = document.getElementById('monthFilter');
        const selectedMonth = monthFilter.value;
        
        let count = this.records.length;
        if (selectedMonth) {
            count = this.records.filter(record => {
                const recordMonth = this.formatYearMonth(record.date);
                return recordMonth === selectedMonth;
            }).length;
        }
        
        const recordCount = document.getElementById('recordCount');
        recordCount.textContent = `${count}件`;
        recordCount.className = `status ${count > 0 ? 'status--success' : 'status--info'}`;
    }

    formatDateTime(date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        
        return `${year}/${month}/${day} ${hours}:${minutes}`;
    }

    formatYearMonth(date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        return `${year}-${month}`;
    }

    getMonthName(monthNum) {
        const months = [
            '1月', '2月', '3月', '4月', '5月', '6月',
            '7月', '8月', '9月', '10月', '11月', '12月'
        ];
        return months[monthNum - 1];
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    showToast(message, type = 'success') {
        const toast = document.getElementById('toast');
        toast.textContent = message;
        toast.className = `toast ${type}`;
        
        // トーストを表示
        setTimeout(() => {
            toast.classList.add('show');
        }, 10);
        
        // 3秒後に非表示
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => {
                toast.classList.add('hidden');
            }, 250);
        }, 3000);
    }

    // デモデータを追加するメソッド（開発用）
    addSampleData() {
        const sampleRecords = [
            {
                id: this.nextId++,
                date: new Date(2024, 11, 15, 9, 30), // 2024年12月15日
                mileage: 12345.5,
                destination: '東京駅'
            },
            {
                id: this.nextId++,
                date: new Date(2024, 11, 10, 14, 20),
                mileage: 12300.2,
                destination: '新宿駅'
            },
            {
                id: this.nextId++,
                date: new Date(2024, 10, 28, 16, 45), // 2024年11月28日
                mileage: 12250.8,
                destination: '渋谷センター'
            }
        ];

        this.records = sampleRecords;
        this.renderRecords();
        this.updateRecordCount();
        this.updateMonthFilter();
    }
}

// アプリケーションの初期化
document.addEventListener('DOMContentLoaded', () => {
    const app = new DrivingLogApp();
    
    // サンプルデータを追加（デモ用）
    app.addSampleData();
    
    // PWA対応
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('/sw.js').catch(err => {
            console.log('Service Worker registration failed:', err);
        });
    }
    
    // アプリをグローバルに参照可能にする（デバッグ用）
    window.drivingApp = app;
});

// PWA インストールプロンプト
let deferredPrompt;
window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    
    // インストールボタンを表示する場合はここで実装
    console.log('PWA インストール可能');
});

// オフライン対応の基本設定
window.addEventListener('online', () => {
    console.log('オンラインに戻りました');
});

window.addEventListener('offline', () => {
    console.log('オフラインになりました');
});

// バックグラウンド同期対応（将来の拡張用）
if ('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype) {
    console.log('バックグラウンド同期がサポートされています');
}