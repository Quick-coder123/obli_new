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
            consol                // Додаємо стовпці місяців
                for (let month = 0; month < 12; month++) {
                    const count = organizationData[org][month] || 0;
                    rowTotal += count;
                    
                    rowHTML += `<td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900" style="text-align: center;">
                        ${count > 0 ? count : ''}
                    </td>`;
                }
                
                // Стовпець "Всього"
                rowHTML += `<td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900" style="text-align: center; bg-blue-50">
                    ${rowTotal > 0 ? rowTotal : ''}
                </td>`;іціалізуємо ReportGenerator...');
            
            // Ініціалізуємо сервіс даних
            if (!dataService) {
                dataService = new DataService();
                await dataService.init();
            }
            
            this.bindEvents();
            await this.loadData();
            this.populateYearFilters();
            await this.generateAllReports();
            
            console.log('✅ ReportGenerator ініціалізовано');
        } catch (error) {
            console.error('❌ Помилка ініціалізації ReportGenerator:', error);
        }
    }
    
    async loadData() {
        try {
            console.log('📥 Завантажуємо дані з бази...');
            
            // Завантажуємо активні та архівні картки
            const activeCards = await dataService.getCards();
            const archivedCards = await dataService.getArchivedCards();
            
            console.log('📊 Активних карток:', activeCards?.length || 0);
            console.log('📊 Архівних карток:', archivedCards?.length || 0);
            
            // Об'єднуємо всі картки
            this.allCards = [...(activeCards || []), ...(archivedCards || [])];
            
            console.log('✅ Дані для звітів завантажено:', this.allCards.length, 'карток');
            
            if (this.allCards.length > 0) {
                console.log('📝 Приклад картки:', this.allCards[0]);
            }
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
                await this.generateOpenedCardsReport();
            });
        }
        
        if (activeAccountsYearFilter) {
            activeAccountsYearFilter.addEventListener('change', async () => {
                await this.generateActiveAccountsReport();
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
        console.log('🚀 Генеруємо всі звіти...');
        await this.generateOpenedCardsReport();
        await this.generateActiveAccountsReport();
        await this.generateStatusReport();
    }

    async generateOpenedCardsReport() {
        const selectedYear = parseInt(document.getElementById('openedCardsYear')?.value) || new Date().getFullYear();
        const tbody = document.getElementById('openedCardsTableBody');
        
        if (!tbody) {
            console.error('❌ Не знайдено tbody для відкритих карток');
            return;
        }

        console.log('🔄 Генеруємо звіт відкритих карток для року:', selectedYear);
        
        try {
            // Завантажуємо свіжі дані безпосередньо з бази
            console.log('📥 Завантажуємо свіжі дані...');
            const activeCards = await dataService.getCards();
            const archivedCards = await dataService.getArchivedCards();
            const allCards = [...(activeCards || []), ...(archivedCards || [])];
            
            console.log(`📊 Всього карток: ${allCards.length}`);
            
            // Обробляємо дані для відкритих карток
            const organizationData = {};
            const monthTotals = Array(12).fill(0);
            let grandTotal = 0;
            
            allCards.forEach((card, index) => {
                // Шукаємо дату відкриття
                let openDate = null;
                let usedField = null;
                
                if (card.accountOpenDate) {
                    openDate = new Date(card.accountOpenDate);
                    usedField = 'accountOpenDate';
                } else if (card.account_open_date) {
                    openDate = new Date(card.account_open_date);
                    usedField = 'account_open_date';
                } else if (card.dateOpened) {
                    openDate = new Date(card.dateOpened);
                    usedField = 'dateOpened';
                } else if (card.created_at) {
                    openDate = new Date(card.created_at);
                    usedField = 'created_at';
                }
                
                // Логування для перших 3 карток
                if (index < 3) {
                    console.log(`📋 Картка ${index + 1}:`, {
                        org: card.organization,
                        accountOpenDate: card.accountOpenDate,
                        account_open_date: card.account_open_date,
                        dateOpened: card.dateOpened,
                        created_at: card.created_at,
                        usedField,
                        parsedDate: openDate,
                        validDate: openDate && !isNaN(openDate.getTime()),
                        year: openDate ? openDate.getFullYear() : null
                    });
                }
                
                // Перевіряємо чи дата валідна та належить до року
                if (openDate && !isNaN(openDate.getTime()) && openDate.getFullYear() === selectedYear) {
                    const month = openDate.getMonth(); // 0-11
                    const org = card.organization || 'Невідома організація';
                    
                    // Ініціалізуємо організацію
                    if (!organizationData[org]) {
                        organizationData[org] = Array(12).fill(0);
                    }
                    
                    // Додаємо картку
                    organizationData[org][month]++;
                    monthTotals[month]++;
                    grandTotal++;
                    
                    console.log(`✅ Додано: ${org} - ${openDate.toLocaleDateString()} (місяць: ${month + 1})`);
                }
            });
            
            console.log('🎯 Підсумок обробки:', {
                organizationData,
                monthTotals,
                grandTotal
            });
            
            // Очищуємо таблицю
            tbody.innerHTML = '';
            
            // Перевіряємо чи є дані
            if (Object.keys(organizationData).length === 0) {
                tbody.innerHTML = `
                    <tr>
                        <td colspan="14" class="px-6 py-4 text-center text-yellow-600 bg-yellow-50">
                            Немає даних відкритих карток за ${selectedYear} рік.
                            <br>Перевірте, чи додані дати відкриття рахунку у картки.
                        </td>
                    </tr>
                `;
                return;
            }
            
            // Створюємо рядки для організацій
            Object.keys(organizationData).sort().forEach(org => {
                const row = document.createElement('tr');
                row.className = 'hover:bg-gray-50';
                
                let rowTotal = 0;
                let rowHTML = `<td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">${org}</td>`;
                
                // Додаємо стовпці місяців
                for (let month = 0; month < 12; month++) {
                    const count = organizationData[org][month] || 0;
                    rowTotal += count;
                    
                    rowHTML += `<td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900" style="text-align: center;">
                        ${count > 0 ? count : ''}
                    </td>`;
                }
                
                // Стовпець "Всього"
                rowHTML += `<td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900" style="text-align: center; bg-blue-50">
                    ${rowTotal > 0 ? rowTotal : ''}
                </td>`;
                
                row.innerHTML = rowHTML;
                tbody.appendChild(row);
            });
            
            // Оновлюємо підсумки
            for (let i = 1; i <= 12; i++) {
                const totalElement = document.getElementById(`monthTotal${i}`);
                if (totalElement) {
                    totalElement.textContent = monthTotals[i - 1] > 0 ? monthTotals[i - 1] : '';
                }
            }
            
            const grandTotalElement = document.getElementById('grandTotal');
            if (grandTotalElement) {
                grandTotalElement.textContent = grandTotal > 0 ? grandTotal : '';
            }
            
            console.log('✅ Звіт відкритих карток згенеровано успішно');
            
        } catch (error) {
            console.error('❌ Помилка генерації звіту відкритих карток:', error);
            tbody.innerHTML = `
                <tr>
                    <td colspan="14" class="px-6 py-4 text-center text-red-600 bg-red-50">
                        Помилка завантаження даних: ${error.message}
                    </td>
                </tr>
            `;
        }
    }

    async processOpenedCardsData(year) {
        const organizationData = {};
        
        try {
            console.log('📥 Завантажуємо свіжі дані з бази для відкритих карток...');
            
            // Завантажуємо свіжі дані з активних карток та архіву
            const activeCards = await dataService.getCards();
            const archivedCards = await dataService.getArchivedCards();
            
            console.log('📊 Активних карток:', activeCards?.length || 0);
            console.log('📊 Архівних карток:', archivedCards?.length || 0);
            
            // Об'єднуємо всі картки
            const allCards = [...(activeCards || []), ...(archivedCards || [])];
            
            console.log(`🔍 Обробляємо ${allCards.length} карток для відкритих карток у році ${year}`);
            
            if (allCards.length > 0) {
                console.log('📝 Приклад картки для відкритих карток:', allCards[0]);
            }
            
            allCards.forEach((card, index) => {
                // Перевіряємо різні можливі поля дат відкриття
                let openDate = null;
                let dateField = null;
                
                if (card.accountOpenDate) {
                    openDate = new Date(card.accountOpenDate);
                    dateField = 'accountOpenDate';
                } else if (card.account_open_date) {
                    openDate = new Date(card.account_open_date);
                    dateField = 'account_open_date';
                } else if (card.dateOpened) {
                    openDate = new Date(card.dateOpened);
                    dateField = 'dateOpened';
                } else if (card.created_at) {
                    openDate = new Date(card.created_at);
                    dateField = 'created_at';
                }
                
                if (index < 5) {
                    console.log(`📅 Картка ${index + 1} для відкритих карток:`, {
                        org: card.organization,
                        accountOpenDate: card.accountOpenDate,
                        account_open_date: card.account_open_date,
                        dateOpened: card.dateOpened,
                        created_at: card.created_at,
                        usedField: dateField,
                        parsedDate: openDate,
                        year: openDate ? openDate.getFullYear() : null,
                        month: openDate ? openDate.getMonth() + 1 : null
                    });
                }
                
                // Перевіряємо, чи дата належить до вибраного року
                if (openDate && !isNaN(openDate.getTime()) && openDate.getFullYear() === year) {
                    const month = openDate.getMonth(); // 0-11
                    const org = card.organization || 'Невідома організація';
                    
                    // Ініціалізуємо організацію, якщо її ще немає
                    if (!organizationData[org]) {
                        organizationData[org] = Array(12).fill(0);
                    }
                    
                    // Збільшуємо лічильник для цього місяця
                    organizationData[org][month]++;
                    
                    console.log(`✅ Додано відкриту картку: ${org} - ${openDate.toLocaleDateString()} (місяць ${month + 1}, індекс ${month})`);
                }
            });
            
            console.log('🎯 Результат обробки відкритих карток:', organizationData);
            
        } catch (error) {
            console.error('❌ Помилка при обробці даних відкритих карток:', error);
        }
        
        return organizationData;
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

    async generateActiveAccountsReport() {
        const selectedYear = parseInt(document.getElementById('activeAccountsYear')?.value) || new Date().getFullYear();
        const tbody = document.getElementById('activeAccountsTableBody');
        
        if (!tbody) {
            console.error('❌ Не знайдено tbody для активних рахунків');
            return;
        }

        console.log('🔄 Генеруємо звіт активних рахунків для року:', selectedYear);
        
        try {
            // Завантажуємо свіжі дані безпосередньо з бази
            console.log('📥 Завантажуємо свіжі дані...');
            const activeCards = await dataService.getCards();
            const archivedCards = await dataService.getArchivedCards();
            const allCards = [...(activeCards || []), ...(archivedCards || [])];
            
            console.log(`📊 Всього карток: ${allCards.length}`);
            
            // Обробляємо дані для активних рахунків
            const organizationData = {};
            const monthTotals = Array(12).fill(0);
            let grandTotal = 0;
            
            allCards.forEach((card, index) => {
                // Шукаємо дату першого зарахування
                let depositDate = null;
                let usedField = null;
                
                if (card.firstDepositDate) {
                    depositDate = new Date(card.firstDepositDate);
                    usedField = 'firstDepositDate';
                } else if (card.first_deposit_date) {
                    depositDate = new Date(card.first_deposit_date);
                    usedField = 'first_deposit_date';
                } else if (card.dateFirstDeposit) {
                    depositDate = new Date(card.dateFirstDeposit);
                    usedField = 'dateFirstDeposit';
                } else if (card.activationDate) {
                    depositDate = new Date(card.activationDate);
                    usedField = 'activationDate';
                }
                
                // Логування для перших 3 карток
                if (index < 3) {
                    console.log(`📋 Картка ${index + 1}:`, {
                        org: card.organization,
                        firstDepositDate: card.firstDepositDate,
                        first_deposit_date: card.first_deposit_date,
                        dateFirstDeposit: card.dateFirstDeposit,
                        activationDate: card.activationDate,
                        usedField,
                        parsedDate: depositDate,
                        validDate: depositDate && !isNaN(depositDate.getTime()),
                        year: depositDate ? depositDate.getFullYear() : null
                    });
                }
                
                // Перевіряємо чи дата валідна та належить до року
                if (depositDate && !isNaN(depositDate.getTime()) && depositDate.getFullYear() === selectedYear) {
                    const month = depositDate.getMonth(); // 0-11
                    const org = card.organization || 'Невідома організація';
                    
                    // Ініціалізуємо організацію
                    if (!organizationData[org]) {
                        organizationData[org] = Array(12).fill(0);
                    }
                    
                    // Додаємо картку
                    organizationData[org][month]++;
                    monthTotals[month]++;
                    grandTotal++;
                    
                    console.log(`✅ Додано: ${org} - ${depositDate.toLocaleDateString()} (місяць: ${month + 1})`);
                }
            });
            
            console.log('🎯 Підсумок обробки:', {
                organizationData,
                monthTotals,
                grandTotal
            });
            
            // Очищуємо таблицю
            tbody.innerHTML = '';
            
            // Перевіряємо чи є дані
            if (Object.keys(organizationData).length === 0) {
                tbody.innerHTML = `
                    <tr>
                        <td colspan="14" class="px-6 py-4 text-center text-yellow-600 bg-yellow-50">
                            Немає даних активних рахунків за ${selectedYear} рік.
                            <br>Перевірте, чи додані дати першого зарахування у картки.
                        </td>
                    </tr>
                `;
                return;
            }
            
            // Створюємо рядки для організацій
            Object.keys(organizationData).sort().forEach(org => {
                const row = document.createElement('tr');
                row.className = 'hover:bg-gray-50';
                
                let rowTotal = 0;
                let rowHTML = `<td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">${org}</td>`;
                
                // Додаємо стовпці місяців
                for (let month = 0; month < 12; month++) {
                    const count = organizationData[org][month] || 0;
                    rowTotal += count;
                    
                    rowHTML += `<td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900" style="text-align: center;">
                        ${count > 0 ? count : ''}
                    </td>`;
                }
                
                // Стовпець "Всього"
                rowHTML += `<td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900" style="text-align: center; bg-blue-50">
                    ${rowTotal > 0 ? rowTotal : ''}
                </td>`;
                
                row.innerHTML = rowHTML;
                tbody.appendChild(row);
            });
            
            // Оновлюємо підсумки
            for (let i = 1; i <= 12; i++) {
                const totalElement = document.getElementById(`activeMonth${i}`);
                if (totalElement) {
                    totalElement.textContent = monthTotals[i - 1] > 0 ? monthTotals[i - 1] : '';
                }
            }
            
            const grandTotalElement = document.getElementById('activeGrandTotal');
            if (grandTotalElement) {
                grandTotalElement.textContent = grandTotal > 0 ? grandTotal : '';
            }
            
            console.log('✅ Звіт активних рахунків згенеровано успішно');
            
        } catch (error) {
            console.error('❌ Помилка генерації звіту активних рахунків:', error);
            tbody.innerHTML = `
                <tr>
                    <td colspan="14" class="px-6 py-4 text-center text-red-600 bg-red-50">
                        Помилка завантаження даних: ${error.message}
                    </td>
                </tr>
            `;
        }
    }

    async processActiveAccountsData(year) {
        const organizationData = {};
        
        try {
            console.log('📥 Завантажуємо свіжі дані з бази для активних рахунків...');
            
            // Завантажуємо свіжі дані з активних карток та архіву
            const activeCards = await dataService.getCards();
            const archivedCards = await dataService.getArchivedCards();
            
            console.log('📊 Активних карток:', activeCards?.length || 0);
            console.log('📊 Архівних карток:', archivedCards?.length || 0);
            
            // Об'єднуємо всі картки
            const allCards = [...(activeCards || []), ...(archivedCards || [])];
            
            console.log(`🔍 Обробляємо ${allCards.length} карток для активних рахунків у році ${year}`);
            
            if (allCards.length > 0) {
                console.log('📝 Приклад картки для активних рахунків:', allCards[0]);
            }
            
            allCards.forEach((card, index) => {
                // Перевіряємо різні можливі поля дат першого зарахування
                let depositDate = null;
                let dateField = null;
                
                if (card.firstDepositDate) {
                    depositDate = new Date(card.firstDepositDate);
                    dateField = 'firstDepositDate';
                } else if (card.first_deposit_date) {
                    depositDate = new Date(card.first_deposit_date);
                    dateField = 'first_deposit_date';
                } else if (card.dateFirstDeposit) {
                    depositDate = new Date(card.dateFirstDeposit);
                    dateField = 'dateFirstDeposit';
                } else if (card.activationDate) {
                    depositDate = new Date(card.activationDate);
                    dateField = 'activationDate';
                }
                
                if (index < 5) {
                    console.log(`📅 Картка ${index + 1} для активних рахунків:`, {
                        org: card.organization,
                        firstDepositDate: card.firstDepositDate,
                        first_deposit_date: card.first_deposit_date,
                        dateFirstDeposit: card.dateFirstDeposit,
                        activationDate: card.activationDate,
                        usedField: dateField,
                        parsedDate: depositDate,
                        year: depositDate ? depositDate.getFullYear() : null,
                        month: depositDate ? depositDate.getMonth() + 1 : null
                    });
                }
                
                // Перевіряємо, чи дата належить до вибраного року
                if (depositDate && !isNaN(depositDate.getTime()) && depositDate.getFullYear() === year) {
                    const month = depositDate.getMonth(); // 0-11
                    const org = card.organization || 'Невідома організація';
                    
                    // Ініціалізуємо організацію, якщо її ще немає
                    if (!organizationData[org]) {
                        organizationData[org] = Array(12).fill(0);
                    }
                    
                    // Збільшуємо лічильник для цього місяця
                    organizationData[org][month]++;
                    
                    console.log(`✅ Додано активний рахунок: ${org} - ${depositDate.toLocaleDateString()} (місяць ${month + 1}, індекс ${month})`);
                }
            });
            
            console.log('🎯 Результат обробки активних рахунків:', organizationData);
            
        } catch (error) {
            console.error('❌ Помилка при обробці даних активних рахунків:', error);
        }
        
        return organizationData;
    }

    addTestActiveRow(tbody, testData) {
        const row = document.createElement('tr');
        row.className = 'hover:bg-gray-50 bg-yellow-50';
        
        let rowHTML = `<td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">${testData.org}</td>`;
        
        // Додаємо комірки для кожного місяця
        for (let month = 0; month < 12; month++) {
            const count = (month === testData.month) ? testData.count : 0;
            rowHTML += `<td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900" style="text-align: center;">
                ${count > 0 ? count : ''}
            </td>`;
        }
        
        // Додаємо колонку "Всього"
        rowHTML += `<td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900" style="text-align: center; bg-blue-50">
            ${testData.count}
        </td>`;
        
        row.innerHTML = rowHTML;
        tbody.appendChild(row);
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

    async generateStatusReport() {
        console.log('🔄 Генеруємо простий звіт статусу рахунків...');
        
        const tbody = document.getElementById('statusTableBody');
        if (!tbody) return;

        try {
            // Завантажуємо дані
            const activeCards = await dataService.getCards();
            const archivedCards = await dataService.getArchivedCards();
            const allCards = [...(activeCards || []), ...(archivedCards || [])];
            
            // Групуємо по організаціях
            const orgData = {};
            
            allCards.forEach(card => {
                const org = card.organization || 'Не вказано';
                
                if (!orgData[org]) {
                    orgData[org] = { active: 0, pending: 0, total: 0 };
                }
                
                if (card.accountStatus === 'Активний') {
                    orgData[org].active++;
                } else if (card.accountStatus === 'Очікує активацію') {
                    orgData[org].pending++;
                }
                
                orgData[org].total++;
            });
            
            // Очищуємо таблицю
            tbody.innerHTML = '';
            
            // Створюємо рядки
            let totalActive = 0;
            let totalPending = 0;
            let grandTotal = 0;
            
            Object.keys(orgData).sort().forEach(org => {
                const data = orgData[org];
                
                const row = document.createElement('tr');
                row.className = 'hover:bg-gray-50';
                
                row.innerHTML = `
                    <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">${org}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-green-600" style="text-align: center;">${data.active}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-yellow-600" style="text-align: center;">${data.pending}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 bg-blue-50" style="text-align: center;">${data.total}</td>
                `;
                
                tbody.appendChild(row);
                
                totalActive += data.active;
                totalPending += data.pending;
                grandTotal += data.total;
            });
            
            // Оновлюємо підсумки
            document.getElementById('statusTotalActive').textContent = totalActive;
            document.getElementById('statusTotalPending').textContent = totalPending;  
            document.getElementById('statusGrandTotal').textContent = grandTotal;
            
            console.log('✅ Простий звіт статусу згенеровано');
            
        } catch (error) {
            console.error('❌ Помилка:', error);
            tbody.innerHTML = `
                <tr>
                    <td colspan="4" class="px-6 py-4 text-center text-red-600">
                        Помилка завантаження: ${error.message}
                    </td>
                </tr>
            `;
        }
    }

}

// Ініціалізація генератора звітів при завантаженні сторінки
let reportGenerator;
document.addEventListener('DOMContentLoaded', () => {
    // Чекаємо трохи, щоб всі скрипти завантажились
    setTimeout(() => {
        reportGenerator = new ReportGenerator();
    }, 200);
});
