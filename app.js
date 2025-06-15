// 運転日誌アプリケーション
class DrivingLogApp {
    constructor() {
        this.records = [];
        this.confirmCallback = null;
        this.init();
    }

    init() {
        this.bindEvents();
        this.loadData();
        this.updateUI();
    }

    bindEvents() {
        // フォーム送信
        document.getElementById('logForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.addRecord();
        });

        // データ管理ボタン
        document.getElementById('exportBtn').addEventListener('click', () => {
            this.exportData();
        });

        document.getElementById('importBtn').addEventListener('click', () => {
            document.getElementById('importFile').click();
        });

        document.getElementById('importFile').addEventListener('change', (e) => {
            if (e.target.files[0]) {
                this.importData(e.target.files[0]);
            }
        });

        document.getElementById('clearBtn').addEventListener('click', () => {
            this.showConfirmDialog('すべての記録を削除しますか？この操作は取り消せません。', () => {
                this.clearAllData();
            });
        });

        // 確認ダイアログ
        document.getElementById('confirmYes').addEventListener('click', () => {
            this.executeConfirmAction();
        });

        document.getElementById('confirmNo').addEventListener('click', () => {
            this.cancelConfirmAction();
        });

        // モーダル背景クリックで閉じる
        document.getElementById('confirmDialog').addEventListener('click', (e) => {
            if (e.target.id === 'confirmDialog') {
                this.cancelConfirmAction();
            }
        });

        // 移動先入力時の走行距離要件チェック
        document.getElementById('destination').addEventListener('input', () => {
            this.updateMileageRequirement();
        });
    }

    // 確認アクション実行
    executeConfirmAction() {
        this.hideConfirmDialog();
        if (this.confirmCallback) {
            try {
                this.confirmCallback();
            } catch (error) {
                console.error('確認アクション実行エラー:', error);
                this.showMessage('操作の実行中にエラーが発生しました', 'error');
            }
            this.confirmCallback = null;
        }
    }

    // 確認アクションキャンセル
    cancelConfirmAction() {
        this.hideConfirmDialog();
        this.confirmCallback = null;
    }

    // データ読み込み（メモリ上のデータを使用）
    loadData() {
        // サンドボックス環境のため、localStorageは使用できません
        // 代わりにメモリ内でデータを管理します
        this.records = [];
    }

    // データ保存（メモリ上のデータを更新）
    saveData() {
        // localStorageの代わりにメモリに保存
        // 実際の実装では localStorage.setItem('drivingLogRecords', JSON.stringify(this.records)) を使用
        console.log('データ保存:', this.records.length, '件');
    }

    // 記録追加
    addRecord() {
        const mileageInput = document.getElementById('mileage');
        const destinationInput = document.getElementById('destination');
        
        const mileage = mileageInput.value.trim();
        const destination = destinationInput.value.trim();

        // バリデーション
        if (!destination) {
            this.showMessage('移動先を入力してください', 'error');
            destinationInput.focus();
            return;
        }

        const today = this.formatDate(new Date());
        const isMileageRequired = this.isMileageRequiredForDate(today);

        if (isMileageRequired && !mileage) {
            this.showMessage('今日の初回記録では走行距離が必要です', 'error');
            mileageInput.focus();
            return;
        }

        // 記録作成
        const record = {
            id: this.generateId(),
            date: today,
            time: this.formatTime(new Date()),
            mileage: mileage || '',
            destination: destination
        };

        this.records.unshift(record); // 新しい記録を先頭に追加
        this.saveData();
        this.updateUI();
        this.clearForm();
        this.showMessage('記録を追加しました', 'success');
    }

    // 記録削除
    deleteRecord(id) {
        this.showConfirmDialog('この記録を削除しますか？', () => {
            this.records = this.records.filter(record => record.id !== id);
            this.saveData();
            this.updateUI();
            this.showMessage('記録を削除しました', 'success');
        });
    }

    // 走行距離の必須要件チェック
    isMileageRequiredForDate(date) {
        return !this.records.some(record => record.date === date);
    }

    // 走行距離要件UI更新
    updateMileageRequirement() {
        const today = this.formatDate(new Date());
        const isRequired = this.isMileageRequiredForDate(today);
        const mileageInput = document.getElementById('mileage');
        const indicator = document.getElementById('mileageRequiredIndicator');
        
        if (isRequired) {
            mileageInput.required = true;
            mileageInput.placeholder = '走行距離を入力してください（必須）';
            indicator.style.display = 'inline';
        } else {
            mileageInput.required = false;
            mileageInput.placeholder = '走行距離を入力してください（任意）';
            indicator.style.display = 'none';
        }
    }

    // データエクスポート
    exportData() {
        if (this.records.length === 0) {
            this.showMessage('エクスポートするデータがありません', 'info');
            return;
        }

        try {
            const dataStr = JSON.stringify(this.records, null, 2);
            const dataBlob = new Blob([dataStr], { type: 'application/json;charset=utf-8' });
            
            // ダウンロードリンクを作成
            const url = URL.createObjectURL(dataBlob);
            const link = document.createElement('a');
            link.style.display = 'none';
            link.href = url;
            link.download = `運転日誌_${this.formatDate(new Date())}.json`;
            
            // DOMに追加してクリック
            document.body.appendChild(link);
            link.click();
            
            // クリーンアップ
            setTimeout(() => {
                document.body.removeChild(link);
                URL.revokeObjectURL(url);
            }, 100);
            
            this.showMessage(`${this.records.length}件の記録をエクスポートしました`, 'success');
        } catch (error) {
            console.error('エクスポートエラー:', error);
            this.showMessage('エクスポート中にエラーが発生しました', 'error');
        }
    }

    // データインポート
    importData(file) {
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const importedData = JSON.parse(e.target.result);
                
                if (!Array.isArray(importedData)) {
                    throw new Error('無効なデータ形式です');
                }

                // データバリデーション
                const validRecords = importedData.filter(record => {
                    return record && 
                           typeof record.id === 'string' && 
                           typeof record.date === 'string' && 
                           typeof record.destination === 'string' &&
                           record.id.length > 0 &&
                           record.date.length > 0 &&
                           record.destination.length > 0;
                });

                if (validRecords.length === 0) {
                    throw new Error('有効な記録が見つかりませんでした');
                }

                // データマージ（重複除去）
                const existingIds = new Set(this.records.map(r => r.id));
                const newRecords = validRecords.filter(record => !existingIds.has(record.id));

                if (newRecords.length === 0) {
                    this.showMessage('新しい記録はありませんでした（重複除去済み）', 'info');
                    return;
                }

                this.records = [...this.records, ...newRecords];
                this.records.sort((a, b) => {
                    if (a.date !== b.date) {
                        return new Date(b.date) - new Date(a.date);
                    }
                    return b.time.localeCompare(a.time);
                });

                this.saveData();
                this.updateUI();
                this.showMessage(`${newRecords.length}件の記録をインポートしました`, 'success');
                
            } catch (error) {
                console.error('インポートエラー:', error);
                this.showMessage('ファイルの読み込みに失敗しました: ' + error.message, 'error');
            }
        };

        reader.onerror = () => {
            this.showMessage('ファイルの読み込みエラーが発生しました', 'error');
        };

        reader.readAsText(file);
        
        // ファイル入力をリセット
        document.getElementById('importFile').value = '';
    }

    // 全データクリア
    clearAllData() {
        this.records = [];
        this.saveData();
        this.updateUI();
        this.showMessage('すべてのデータを削除しました', 'success');
    }

    // UI更新
    updateUI() {
        this.updateRecordCount();
        this.updateRecordsList();
        this.updateMileageRequirement();
    }

    // 記録件数更新
    updateRecordCount() {
        document.getElementById('recordCount').textContent = this.records.length;
    }

    // 記録リスト更新
    updateRecordsList() {
        const recordsList = document.getElementById('recordsList');
        
        if (this.records.length === 0) {
            recordsList.innerHTML = '<div class="no-records">まだ記録がありません。上のフォームから記録を追加してください。</div>';
            return;
        }

        // 日付別にグループ化
        const groupedRecords = this.groupRecordsByDate();
        
        recordsList.innerHTML = '';
        
        Object.keys(groupedRecords).forEach(date => {
            const dayGroup = document.createElement('div');
            dayGroup.className = 'day-group';
            
            const records = groupedRecords[date];
            const totalMileage = records.reduce((sum, record) => {
                return sum + (parseFloat(record.mileage) || 0);
            }, 0);
            
            dayGroup.innerHTML = `
                <div class="day-header">
                    <div>${this.formatDateDisplay(date)}</div>
                    <div class="day-summary">
                        ${records.length}件の記録 / 合計走行距離: ${totalMileage.toFixed(1)}km
                    </div>
                </div>
                ${records.map(record => this.createRecordHTML(record)).join('')}
            `;
            
            recordsList.appendChild(dayGroup);
        });
    }

    // 日付別グループ化
    groupRecordsByDate() {
        const grouped = {};
        this.records.forEach(record => {
            if (!grouped[record.date]) {
                grouped[record.date] = [];
            }
            grouped[record.date].push(record);
        });
        
        // 各日付内で時間順にソート
        Object.keys(grouped).forEach(date => {
            grouped[date].sort((a, b) => b.time.localeCompare(a.time));
        });
        
        return grouped;
    }

    // 記録HTML作成
    createRecordHTML(record) {
        return `
            <div class="record-item">
                <div class="record-time">${record.time}</div>
                <div class="record-details">
                    <div class="record-destination">${this.escapeHtml(record.destination)}</div>
                    <div class="record-mileage">
                        ${record.mileage ? `走行距離: ${record.mileage}km` : '走行距離: 未記録'}
                    </div>
                </div>
                <div class="record-actions">
                    <button class="btn btn--outline btn--xs" onclick="app.deleteRecord('${record.id}')">
                        削除
                    </button>
                </div>
            </div>
        `;
    }

    // HTML エスケープ
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // フォームクリア
    clearForm() {
        document.getElementById('mileage').value = '';
        document.getElementById('destination').value = '';
    }

    // メッセージ表示
    showMessage(message, type = 'info') {
        const messageArea = document.getElementById('messageArea');
        messageArea.textContent = message;
        messageArea.className = `message-area ${type}`;
        messageArea.classList.remove('hidden');
        
        setTimeout(() => {
            messageArea.classList.add('hidden');
        }, 4000);
    }

    // 確認ダイアログ表示
    showConfirmDialog(message, callback) {
        document.getElementById('confirmMessage').textContent = message;
        document.getElementById('confirmDialog').classList.remove('hidden');
        this.confirmCallback = callback;
    }

    // 確認ダイアログ非表示
    hideConfirmDialog() {
        document.getElementById('confirmDialog').classList.add('hidden');
    }

    // ユーティリティ関数
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    formatDate(date) {
        return date.getFullYear() + '-' + 
               String(date.getMonth() + 1).padStart(2, '0') + '-' + 
               String(date.getDate()).padStart(2, '0');
    }

    formatTime(date) {
        return String(date.getHours()).padStart(2, '0') + ':' + 
               String(date.getMinutes()).padStart(2, '0') + ':' + 
               String(date.getSeconds()).padStart(2, '0');
    }

    formatDateDisplay(dateStr) {
        const date = new Date(dateStr);
        const days = ['日', '月', '火', '水', '木', '金', '土'];
        const dayOfWeek = days[date.getDay()];
        
        return `${dateStr} (${dayOfWeek})`;
    }
}

// アプリケーション初期化
const app = new DrivingLogApp();