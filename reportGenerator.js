// Глобальна змінна для сервісу даних
let dataService;

// Генератор звітів - логіка для створення звітів по картках
class ReportGenerator {
    constructor() {
        this.allCards = [];
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
            this.populateYearFilters();
            this.generateAllReports();
            console.log('✅ ReportGenerator ініціалізовано успішно');
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
        // Фільтри по роках
        const openedCardsYearFilter = document.getElementById('openedCardsYear');
        const activeAccountsYearFilter = document.getElementById('activeAccountsYear');
        
        if (openedCardsYearFilter) {
            openedCardsYearFilter.addEventListener('change', async () => {
                await this.loadData();
                this.generateOpenedCardsReport();
            });
        }
        
        if (activeAccountsYearFilter) {
            activeAccountsYearFilter.addEventListener('change', async () => {
                await this.loadData();
                this.generateActiveAccountsReport();
            });
        }
    }

    loadCards() {
        const saved = localStorage.getItem('cards');
        return saved ? JSON.parse(saved) : [];
    }

    loadArchivedCards() {
        const saved = localStorage.getItem('archivedCards');
        return saved ? JSON.parse(saved) : [];
    }

    populateYearFilters() {
        const years = this.getAvailableYears();
        const currentYear = new Date().getFullYear();
        
        // Заповнити фільтр для відкритих карток
        const openedCardsYearSelect = document.getElementById('openedCardsYear');
        if (openedCardsYearSelect) {
            this.populateYearSelect(openedCardsYearSelect, years, currentYear);
        }
        
        // Заповнити фільтр для активних рахунків
        const activeAccountsYearSelect = document.getElementById('activeAccountsYear');
        if (activeAccountsYearSelect) {
            this.populateYearSelect(activeAccountsYearSelect, years, currentYear);
        }
    }

    populateYearSelect(select, years, defaultYear) {
        select.innerHTML = '';
        
        years.forEach(year => {
            const option = document.createElement('option');
            option.value = year;
            option.textContent = year;
            if (year === defaultYear) {
                option.selected = true;
            }
            select.appendChild(option);
        });
    }

    getAvailableYears() {
        const years = new Set();
        
        this.allCards.forEach(card => {
            if (card.accountOpenDate) {
                const year = new Date(card.accountOpenDate).getFullYear();
                years.add(year);
            }
            if (card.firstDepositDate) {
                const year = new Date(card.firstDepositDate).getFullYear();
                years.add(year);
            }
        });
        
        // Додати поточний рік, якщо його немає
        years.add(new Date().getFullYear());
        
        return Array.from(years).sort((a, b) => b - a); // Сортування по спаданню
    }

    async generateAllReports() {
        await this.loadData();
        this.generateOpenedCardsReport();
        this.generateActiveAccountsReport();
        this.generateStatusReport();
    }

    generateOpenedCardsReport() {
        const selectedYear = parseInt(document.getElementById('openedCardsYear')?.value) || new Date().getFullYear();
        const tbody = document.getElementById('openedCardsTableBody');
        
        if (!tbody) return;

        const reportData = this.getOpenedCardsData(selectedYear);
        tbody.innerHTML = '';

        if (reportData.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="3" class="px-6 py-4 text-center text-gray-500">
                        Немає даних за ${selectedYear} рік
                    </td>
                </tr>
            `;
            return;
        }

        reportData.forEach(item => {
            const row = document.createElement('tr');
            row.className = 'hover:bg-gray-50';
            
            row.innerHTML = `
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${item.month}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${item.organization}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">${item.count}</td>
            `;
            
            tbody.appendChild(row);
        });
    }

    getOpenedCardsData(year) {
        const monthNames = [
            'Січень', 'Лютий', 'Березень', 'Квітень', 'Травень', 'Червень',
            'Липень', 'Серпень', 'Вересень', 'Жовтень', 'Листопад', 'Грудень'
        ];

        const data = {};
        
        this.allCards
            .filter(card => card.accountOpenDate && new Date(card.accountOpenDate).getFullYear() === year)
            .forEach(card => {
                const month = new Date(card.accountOpenDate).getMonth();
                const monthName = monthNames[month];
                const org = card.organization;
                
                const key = `${monthName}-${org}`;
                if (!data[key]) {
                    data[key] = {
                        month: monthName,
                        organization: org,
                        count: 0
                    };
                }
                data[key].count++;
            });

        return Object.values(data).sort((a, b) => {
            const monthA = monthNames.indexOf(a.month);
            const monthB = monthNames.indexOf(b.month);
            if (monthA !== monthB) return monthA - monthB;
            return a.organization.localeCompare(b.organization);
        });
    }

    generateActiveAccountsReport() {
        const selectedYear = parseInt(document.getElementById('activeAccountsYear')?.value) || new Date().getFullYear();
        const tbody = document.getElementById('activeAccountsTableBody');
        const tfoot = document.getElementById('activeAccountsTotal');
        
        if (!tbody) return;

        const reportData = this.getActiveAccountsData(selectedYear);
        tbody.innerHTML = '';

        if (reportData.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="3" class="px-6 py-4 text-center text-gray-500">
                        Немає активних рахунків за ${selectedYear} рік
                    </td>
                </tr>
            `;
            if (tfoot) tfoot.innerHTML = '';
            return;
        }

        // Створити рядки таблиці
        reportData.forEach(item => {
            const row = document.createElement('tr');
            row.className = 'hover:bg-gray-50';
            
            row.innerHTML = `
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${item.month}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${item.organization}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">${item.count}</td>
            `;
            
            tbody.appendChild(row);
        });

        // Створити підсумковий рядок
        if (tfoot) {
            const totalCount = reportData.reduce((sum, item) => sum + item.count, 0);
            tfoot.innerHTML = `
                <tr class="font-medium">
                    <td class="px-6 py-3 text-left text-sm font-medium text-gray-900" colspan="2">Всього:</td>
                    <td class="px-6 py-3 text-left text-sm font-medium text-gray-900">${totalCount}</td>
                </tr>
            `;
        }
    }

    getActiveAccountsData(year) {
        const monthNames = [
            'Січень', 'Лютий', 'Березень', 'Квітень', 'Травень', 'Червень',
            'Липень', 'Серпень', 'Вересень', 'Жовтень', 'Листопад', 'Грудень'
        ];

        const data = {};
        
        this.allCards
            .filter(card => 
                card.firstDepositDate && 
                new Date(card.firstDepositDate).getFullYear() === year
            )
            .forEach(card => {
                const month = new Date(card.firstDepositDate).getMonth();
                const monthName = monthNames[month];
                const org = card.organization;
                
                const key = `${monthName}-${org}`;
                if (!data[key]) {
                    data[key] = {
                        month: monthName,
                        organization: org,
                        count: 0
                    };
                }
                data[key].count++;
            });

        return Object.values(data).sort((a, b) => {
            const monthA = monthNames.indexOf(a.month);
            const monthB = monthNames.indexOf(b.month);
            if (monthA !== monthB) return monthA - monthB;
            return a.organization.localeCompare(b.organization);
        });
    }

    generateStatusReport() {
        const tbody = document.getElementById('statusTableBody');
        const tfoot = document.getElementById('statusTotal');
        
        if (!tbody) return;

        const reportData = this.getStatusReportData();
        tbody.innerHTML = '';

        if (reportData.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="4" class="px-6 py-4 text-center text-gray-500">
                        Немає даних для відображення
                    </td>
                </tr>
            `;
            if (tfoot) tfoot.innerHTML = '';
            return;
        }

        // Створити рядки таблиці
        reportData.forEach(item => {
            const row = document.createElement('tr');
            row.className = 'hover:bg-gray-50';
            
            row.innerHTML = `
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${item.organization}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600">${item.active}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-yellow-600">${item.pending}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">${item.total}</td>
            `;
            
            tbody.appendChild(row);
        });

        // Створити підсумковий рядок
        if (tfoot) {
            const totalActive = reportData.reduce((sum, item) => sum + item.active, 0);
            const totalPending = reportData.reduce((sum, item) => sum + item.pending, 0);
            const grandTotal = totalActive + totalPending;
            
            tfoot.innerHTML = `
                <tr class="font-medium">
                    <td class="px-6 py-3 text-left text-sm font-medium text-gray-900">Всього:</td>
                    <td class="px-6 py-3 text-left text-sm font-medium text-green-600">${totalActive}</td>
                    <td class="px-6 py-3 text-left text-sm font-medium text-yellow-600">${totalPending}</td>
                    <td class="px-6 py-3 text-left text-sm font-medium text-gray-900">${grandTotal}</td>
                </tr>
            `;
        }
    }

    getStatusReportData() {
        const data = {};
        
        this.allCards.forEach(card => {
            const org = card.organization;
            
            if (!data[org]) {
                data[org] = {
                    organization: org,
                    active: 0,
                    pending: 0,
                    total: 0
                };
            }
            
            if (card.accountStatus === 'Активний') {
                data[org].active++;
            } else if (card.accountStatus === 'Очікує активацію') {
                data[org].pending++;
            }
            
            data[org].total++;
        });

        return Object.values(data).sort((a, b) => a.organization.localeCompare(b.organization));
    }

    // Метод для експорту звітів (майбутня функціональність)
    exportReport(reportType) {
        // Тут можна реалізувати експорт в CSV, Excel або PDF
        console.log(`Експорт звіту: ${reportType}`);
    }
}

// Ініціалізація генератора звітів при завантаженні сторінки
let reportGenerator;
document.addEventListener('DOMContentLoaded', () => {
    // Чекаємо трохи, щоб всі скрипти завантажились
    setTimeout(() => {
        console.log('📊 Ініціалізація ReportGenerator...');
        reportGenerator = new ReportGenerator();
    }, 200);
});
