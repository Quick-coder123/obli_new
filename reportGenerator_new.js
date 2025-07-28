// Глобальна змінна для сервісу даних
let dataService;

// Генератор звітів - логіка для створення звітів по картках
class ReportGenerator {
    constructor() {
        this.allCards = [];
        this.months = [
            { name: 'січня', num: 1 },
            { name: 'лютого', num: 2 },
            { name: 'березня', num: 3 },
            { name: 'квітня', num: 4 },
            { name: 'травня', num: 5 },
            { name: 'червня', num: 6 },
            { name: 'липня', num: 7 },
            { name: 'серпня', num: 8 },
            { name: 'вересня', num: 9 },
            { name: 'жовтня', num: 10 },
            { name: 'листопада', num: 11 },
            { name: 'грудня', num: 12 }
        ];
        this.organizations = [
            'НЕК "УКРЕНЕРГО"',
            'ТОВ "ФУД ПАК"',
            'ТОВ "ЦУБ"',
            'ТОВ "ОМЕГА ТРИ"',
            'АК "СЛОБОЖАНСЬКИЙ"',
            'ТОВ "ГЕНЕСУС УКРАЇНА"',
            'Інше'
        ];
        this.init();
    }

    async init() {
        try {
            // Ініціалізуємо сервіс даних
            if (!dataService) {
                dataService = new DataService();
                await dataService.init();
            }
            
            this.bindEvents();
            await this.loadData();
            this.populateYearFilter();
            this.generateAllReports();
        } catch (error) {
            console.error('❌ Помилка ініціалізації ReportGenerator:', error);
        }
    }
    
    async loadData() {
        try {
            // Завантажуємо активні та архівні картки
            const activeCards = await dataService.getCards();
            const archivedCards = await dataService.getArchivedCards();
            
            // Об'єднуємо всі картки
            this.allCards = [...activeCards, ...archivedCards];
            console.log('✅ Дані для звітів завантажено:', this.allCards.length, 'карток');
        } catch (error) {
            console.error('❌ Помилка завантаження даних для звітів:', error);
            this.allCards = [];
        }
    }

    bindEvents() {
        // Фільтр по року
        const yearFilter = document.getElementById('yearFilter');
        if (yearFilter) {
            yearFilter.addEventListener('change', async () => {
                await this.loadData();
                this.generateAllReports();
            });
        }

        // Експорт в Excel
        const exportBtn = document.getElementById('exportBtn');
        if (exportBtn) {
            exportBtn.addEventListener('click', () => {
                this.exportToExcel();
            });
        }
    }

    populateYearFilter() {
        const years = this.getAvailableYears();
        const currentYear = new Date().getFullYear();
        
        const yearSelect = document.getElementById('yearFilter');
        if (yearSelect) {
            yearSelect.innerHTML = '';
            
            years.forEach(year => {
                const option = document.createElement('option');
                option.value = year;
                option.textContent = year;
                if (year === currentYear) {
                    option.selected = true;
                }
                yearSelect.appendChild(option);
            });
        }
    }

    getAvailableYears() {
        const years = new Set();
        this.allCards.forEach(card => {
            if (card.created_at) {
                const year = new Date(card.created_at).getFullYear();
                years.add(year);
            }
            if (card.activated_date) {
                const year = new Date(card.activated_date).getFullYear();
                years.add(year);
            }
        });

        const yearArray = Array.from(years).sort((a, b) => b - a);
        return yearArray.length > 0 ? yearArray : [new Date().getFullYear()];
    }

    generateAllReports() {
        this.generateOpenedCardsReport();
        this.generateActiveCardsReport();
        this.generateStatusReport();
    }

    generateOpenedCardsReport() {
        const selectedYear = document.getElementById('yearFilter')?.value || new Date().getFullYear();
        const tbody = document.getElementById('openedCardsTableBody');
        
        if (!tbody) return;

        // Підготовка даних по організаціях та місяцях
        const reportData = {};
        const monthTotals = Array(7).fill(0); // 7 місяців
        let grandTotal = 0;

        // Ініціалізація структури даних
        this.organizations.forEach(org => {
            reportData[org] = Array(7).fill(0);
        });

        // Обробка карток
        this.allCards.forEach(card => {
            if (!card.created_at) return;
            
            const cardDate = new Date(card.created_at);
            const cardYear = cardDate.getFullYear();
            const cardMonth = cardDate.getMonth() + 1;

            if (cardYear.toString() === selectedYear.toString() && cardMonth <= 7) {
                let organization = card.organization;
                if (!this.organizations.includes(organization)) {
                    organization = 'Інше';
                }
                
                reportData[organization][cardMonth - 1]++;
                monthTotals[cardMonth - 1]++;
                grandTotal++;
            }
        });

        // Генерація HTML
        tbody.innerHTML = '';
        
        this.organizations.forEach(org => {
            const row = document.createElement('tr');
            row.className = 'hover:bg-gray-50';
            
            let orgTotal = 0;
            let rowHTML = `<td class="border border-gray-300 px-3 py-2 text-sm font-medium">${org}</td>`;
            
            for (let i = 0; i < 7; i++) {
                const value = reportData[org][i];
                orgTotal += value;
                rowHTML += `<td class="border border-gray-300 px-3 py-2 text-sm text-center">${value || ''}</td>`;
            }
            
            rowHTML += `<td class="border border-gray-300 px-3 py-2 text-sm text-center bg-yellow-50 font-medium">${orgTotal}</td>`;
            row.innerHTML = rowHTML;
            tbody.appendChild(row);
        });

        // Оновлення підсумків
        for (let i = 1; i <= 7; i++) {
            const totalCell = document.getElementById(`openedTotal${i}`);
            if (totalCell) {
                totalCell.textContent = monthTotals[i - 1] || '';
            }
        }
        
        const grandTotalCell = document.getElementById('openedTotalAll');
        if (grandTotalCell) {
            grandTotalCell.textContent = grandTotal;
        }
    }

    generateActiveCardsReport() {
        const selectedYear = document.getElementById('yearFilter')?.value || new Date().getFullYear();
        const tbody = document.getElementById('activeCardsTableBody');
        
        if (!tbody) return;

        // Підготовка даних по організаціях та місяцях
        const reportData = {};
        const monthTotals = Array(7).fill(0);
        let grandTotal = 0;

        // Ініціалізація структури даних
        this.organizations.forEach(org => {
            reportData[org] = Array(7).fill(0);
        });

        // Обробка карток
        this.allCards.forEach(card => {
            if (!card.activated_date || card.status !== 'active') return;
            
            const activatedDate = new Date(card.activated_date);
            const activatedYear = activatedDate.getFullYear();
            const activatedMonth = activatedDate.getMonth() + 1;

            if (activatedYear.toString() === selectedYear.toString() && activatedMonth <= 7) {
                let organization = card.organization;
                if (!this.organizations.includes(organization)) {
                    organization = 'Інше';
                }
                
                reportData[organization][activatedMonth - 1]++;
                monthTotals[activatedMonth - 1]++;
                grandTotal++;
            }
        });

        // Генерація HTML
        tbody.innerHTML = '';
        
        this.organizations.forEach(org => {
            const row = document.createElement('tr');
            row.className = 'hover:bg-gray-50';
            
            let orgTotal = 0;
            let rowHTML = `<td class="border border-gray-300 px-3 py-2 text-sm font-medium">${org}</td>`;
            
            for (let i = 0; i < 7; i++) {
                const value = reportData[org][i];
                orgTotal += value;
                rowHTML += `<td class="border border-gray-300 px-3 py-2 text-sm text-center">${value || ''}</td>`;
            }
            
            rowHTML += `<td class="border border-gray-300 px-3 py-2 text-sm text-center bg-yellow-50 font-medium">${orgTotal}</td>`;
            row.innerHTML = rowHTML;
            tbody.appendChild(row);
        });

        // Оновлення підсумків
        for (let i = 1; i <= 7; i++) {
            const totalCell = document.getElementById(`activeTotal${i}`);
            if (totalCell) {
                totalCell.textContent = monthTotals[i - 1] || '';
            }
        }
        
        const grandTotalCell = document.getElementById('activeTotalAll');
        if (grandTotalCell) {
            grandTotalCell.textContent = grandTotal;
        }
    }

    generateStatusReport() {
        const tbody = document.getElementById('statusTableBody');
        
        if (!tbody) return;

        // Підготовка даних по організаціях
        const reportData = {};
        let totalActive = 0;
        let totalPending = 0;
        let grandTotal = 0;

        // Ініціалізація структури даних
        this.organizations.forEach(org => {
            reportData[org] = { active: 0, pending: 0, total: 0 };
        });

        // Обробка карток
        this.allCards.forEach(card => {
            let organization = card.organization;
            if (!this.organizations.includes(organization)) {
                organization = 'Інше';
            }

            if (card.status === 'active') {
                reportData[organization].active++;
                totalActive++;
            } else if (card.status === 'pending') {
                reportData[organization].pending++;
                totalPending++;
            }
            reportData[organization].total++;
            grandTotal++;
        });

        // Генерація HTML
        tbody.innerHTML = '';
        
        this.organizations.forEach(org => {
            const data = reportData[org];
            const row = document.createElement('tr');
            row.className = 'hover:bg-gray-50';
            
            row.innerHTML = `
                <td class="border border-gray-300 px-3 py-2 text-sm font-medium">${org}</td>
                <td class="border border-gray-300 px-3 py-2 text-sm text-center">${data.active || ''}</td>
                <td class="border border-gray-300 px-3 py-2 text-sm text-center">${data.pending || ''}</td>
                <td class="border border-gray-300 px-3 py-2 text-sm text-center bg-yellow-50 font-medium">${data.total}</td>
            `;
            
            tbody.appendChild(row);
        });

        // Оновлення підсумків
        const totalActiveCell = document.getElementById('statusTotalActive');
        if (totalActiveCell) {
            totalActiveCell.textContent = totalActive;
        }
        
        const totalPendingCell = document.getElementById('statusTotalPending');
        if (totalPendingCell) {
            totalPendingCell.textContent = totalPending;
        }
        
        const grandTotalCell = document.getElementById('statusTotalAll');
        if (grandTotalCell) {
            grandTotalCell.textContent = grandTotal;
        }
    }

    exportToExcel() {
        // Простий експорт у CSV формат
        const selectedYear = document.getElementById('yearFilter')?.value || new Date().getFullYear();
        let csvContent = "data:text/csv;charset=utf-8,";
        
        // Експорт відкритих рахунків
        csvContent += `Відкриті рахунки ${selectedYear}\n`;
        csvContent += "Організація,Січень,Лютий,Березень,Квітень,Травень,Червень,Липень,Загалом\n";
        
        // Тут можна додати логіку експорту даних
        alert('Функція експорту буде реалізована пізніше');
    }
}

// Ініціалізація генератора звітів при завантаженні сторінки
document.addEventListener('DOMContentLoaded', () => {
    new ReportGenerator();
});
