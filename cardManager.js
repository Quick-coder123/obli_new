// Глобальна змінна для сервісу даних
let dataService;

// Менеджер карток - основна логіка для роботи з картками
class CardManager {
    constructor() {
        this.cards = [];
        this.archivedCards = [];
        this.editingCardId = null;
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
            await this.loadTable();
            await this.populateFilters();
            console.log('✅ CardManager ініціалізовано успішно');
        } catch (error) {
            console.error('❌ Помилка ініціалізації CardManager:', error);
            this.showError('Помилка ініціалізації системи');
        }
    }

    showError(message) {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'fixed top-4 right-4 bg-red-500 text-white p-4 rounded-lg shadow-lg z-50';
        errorDiv.innerHTML = `
            <div class="flex items-center">
                <span class="mr-2">❌</span>
                <span>${message}</span>
            </div>
        `;
        document.body.appendChild(errorDiv);
        
        setTimeout(() => {
            if (errorDiv.parentNode) {
                errorDiv.parentNode.removeChild(errorDiv);
            }
        }, 5000);
    }

    showSuccess(message) {
        const successDiv = document.createElement('div');
        successDiv.className = 'fixed top-4 right-4 bg-green-500 text-white p-4 rounded-lg shadow-lg z-50';
        successDiv.innerHTML = `
            <div class="flex items-center">
                <span class="mr-2">✅</span>
                <span>${message}</span>
            </div>
        `;
        document.body.appendChild(successDiv);
        
        setTimeout(() => {
            if (successDiv.parentNode) {
                successDiv.parentNode.removeChild(successDiv);
            }
        }, 3000);
    }

    bindEvents() {
        // Кнопка додавання картки
        const addCardBtn = document.getElementById('addCardBtn');
        if (addCardBtn) {
            addCardBtn.addEventListener('click', () => this.showAddModal());
        }

        // Кнопка імпорту Excel
        const importExcelBtn = document.getElementById('importExcelBtn');
        if (importExcelBtn) {
            importExcelBtn.addEventListener('click', () => this.showImportModal());
        }

        // Форма картки
        const cardForm = document.getElementById('cardForm');
        if (cardForm) {
            cardForm.addEventListener('submit', (e) => this.handleFormSubmit(e));
        }

        // Кнопка скасування
        const cancelBtn = document.getElementById('cancelBtn');
        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => this.hideModal());
        }

        // Закриття модального вікна при кліку на backdrop
        const modal = document.getElementById('cardModal');
        if (modal) {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.hideModal();
                }
            });
        }

        // Модальне вікно імпорту
        const importModal = document.getElementById('importModal');
        if (importModal) {
            importModal.addEventListener('click', (e) => {
                if (e.target === importModal) {
                    this.hideImportModal();
                }
            });
        }

        // Кнопка скасування імпорту
        const cancelImportBtn = document.getElementById('cancelImportBtn');
        if (cancelImportBtn) {
            cancelImportBtn.addEventListener('click', () => this.hideImportModal());
        }

        // Кнопка обробки імпорту
        const processImportBtn = document.getElementById('processImportBtn');
        if (processImportBtn) {
            processImportBtn.addEventListener('click', () => this.processImport());
        }

        // Кнопка завантаження шаблону
        const downloadTemplateBtn = document.getElementById('downloadTemplateBtn');
        if (downloadTemplateBtn) {
            downloadTemplateBtn.addEventListener('click', () => this.downloadTemplate());
        }

        // Фільтри
        const filters = ['filterOrganization', 'filterMonth', 'filterAccountStatus'];
        filters.forEach(filterId => {
            const filter = document.getElementById(filterId);
            if (filter) {
                filter.addEventListener('change', () => this.applyFilters());
            }
        });

        // Автоматичне оновлення статусу рахунку при зміні дати
        const firstDepositDate = document.getElementById('firstDepositDate');
        if (firstDepositDate) {
            firstDepositDate.addEventListener('change', () => this.updateAccountStatus());
        }
    }

    async loadCards() {
        try {
            this.cards = await dataService.getCards();
            return this.cards;
        } catch (error) {
            console.error('❌ Помилка завантаження карток:', error);
            this.showError('Не вдалося завантажити картки');
            return [];
        }
    }

    async loadArchivedCards() {
        try {
            this.archivedCards = await dataService.getArchivedCards();
            return this.archivedCards;
        } catch (error) {
            console.error('❌ Помилка завантаження архівних карток:', error);
            this.showError('Не вдалося завантажити архівні картки');
            return [];
        }
    }

    generateId() {
        return Date.now().toString() + Math.random().toString(36).substr(2, 9);
    }

    showAddModal() {
        this.editingCardId = null;
        document.getElementById('modalTitle').textContent = 'Додати картку';
        this.clearForm();
        this.showModal();
    }

    showEditModal(cardId) {
        this.editingCardId = cardId;
        document.getElementById('modalTitle').textContent = 'Редагувати картку';
        this.populateForm(cardId);
        this.showModal();
    }

    showModal() {
        const modal = document.getElementById('cardModal');
        modal.classList.remove('hidden');
        modal.classList.add('modal-backdrop');
        document.body.style.overflow = 'hidden';
    }

    hideModal() {
        const modal = document.getElementById('cardModal');
        modal.classList.add('hidden');
        modal.classList.remove('modal-backdrop');
        document.body.style.overflow = 'auto';
        this.clearForm();
    }

    clearForm() {
        const form = document.getElementById('cardForm');
        form.reset();
    }

    populateForm(cardId) {
        const card = this.cards.find(c => c.id === cardId);
        if (!card) return;

        document.getElementById('fullName').value = card.fullName || '';
        document.getElementById('ipn').value = card.ipn || '';
        document.getElementById('organization').value = card.organization || '';
        document.getElementById('accountOpenDate').value = card.accountOpenDate || '';
        document.getElementById('firstDepositDate').value = card.firstDepositDate || '';
        document.getElementById('cardStatus').value = card.cardStatus || 'Виготовляється';
        document.getElementById('comment').value = card.comment || '';

        // Документи
        document.getElementById('docContract').checked = card.documents?.contract || false;
        document.getElementById('docSurvey').checked = card.documents?.survey || false;
        document.getElementById('docPassport').checked = card.documents?.passport || false;
    }

    async handleFormSubmit(e) {
        e.preventDefault();
        
        const formData = this.getFormData();
        
        try {
            if (this.editingCardId) {
                await this.updateCard(this.editingCardId, formData);
            } else {
                await this.addCard(formData);
            }
            
            this.hideModal();
            await this.loadTable();
            await this.populateFilters();
        } catch (error) {
            console.error('Помилка збереження картки:', error);
            this.showNotification('Помилка збереження картки', 'error');
        }
    }

    getFormData() {
        return {
            fullName: document.getElementById('fullName').value,
            ipn: document.getElementById('ipn').value,
            organization: document.getElementById('organization').value,
            accountOpenDate: document.getElementById('accountOpenDate').value,
            firstDepositDate: document.getElementById('firstDepositDate').value,
            cardStatus: document.getElementById('cardStatus').value,
            comment: document.getElementById('comment').value,
            documents: {
                contract: document.getElementById('docContract').checked,
                survey: document.getElementById('docSurvey').checked,
                passport: document.getElementById('docPassport').checked
            }
        };
    }

    async addCard(cardData) {
        try {
            console.log('🔄 Додавання картки:', cardData);
            const card = await dataService.addCard(cardData);
            this.cards.push(card);
            await this.loadTable(); // Перезавантажуємо таблицю
            await this.checkForAutoArchive(card);
            this.showSuccess('Картку додано успішно');
        } catch (error) {
            console.error('❌ Помилка додавання картки:', error);
            this.showError(`Помилка додавання картки: ${error.message}`);
        }
    }

    async updateCard(cardId, cardData) {
        try {
            const updatedCard = await dataService.updateCard(cardId, cardData);
            const cardIndex = this.cards.findIndex(c => c.id === cardId);
            if (cardIndex !== -1) {
                this.cards[cardIndex] = updatedCard;
            }
            await this.checkForAutoArchive(updatedCard);
            this.showNotification('Картку оновлено успішно', 'success');
        } catch (error) {
            console.error('Помилка оновлення картки:', error);
            this.showNotification('Помилка оновлення картки', 'error');
        }
    }

    async deleteCard(cardId) {
        if (confirm('Ви впевнені, що хочете видалити цю картку?')) {
            try {
                await dataService.deleteCard(cardId);
                this.cards = this.cards.filter(c => c.id !== cardId);
                await this.loadTable();
                await this.populateFilters();
                this.showNotification('Картку видалено успішно', 'success');
            } catch (error) {
                console.error('Помилка видалення картки:', error);
                this.showNotification('Помилка видалення картки', 'error');
            }
        }
    }

    calculateAccountStatus(firstDepositDate) {
        return firstDepositDate ? 'Активний' : 'Очікує активацію';
    }

    updateAccountStatus() {
        const firstDepositDate = document.getElementById('firstDepositDate').value;
        // Тут можна додати візуальне оновлення статусу в формі, якщо потрібно
    }

    async checkForAutoArchive(card) {
        const shouldArchive = 
            card.accountStatus === 'Активний' &&
            card.cardStatus === 'Видана' &&
            card.documents?.contract &&
            card.documents?.survey &&
            card.documents?.passport;

        if (shouldArchive) {
            try {
                await dataService.moveToArchive(card);
                this.cards = this.cards.filter(c => c.id !== card.id);
                this.showNotification('Картку автоматично переміщено в архів', 'success');
                await this.loadTable();
                await this.populateFilters();
            } catch (error) {
                console.error('Помилка автоматичного архівування:', error);
                this.showNotification('Помилка автоматичного архівування', 'error');
            }
        }
    }

    async loadTable() {
        await this.loadCards();
        const tbody = document.getElementById('cardsTableBody');
        if (!tbody) return;

        const filteredCards = this.getFilteredCards();
        tbody.innerHTML = '';

        if (filteredCards.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="11" class="px-6 py-4 text-center text-gray-500">
                        Немає карток для відображення
                    </td>
                </tr>
            `;
            return;
        }

        filteredCards.forEach((card, index) => {
            const row = this.createTableRow(card, index + 1);
            tbody.appendChild(row);
        });
    }

    createTableRow(card, number) {
        const row = document.createElement('tr');
        row.className = 'hover:bg-gray-50';
        
        row.innerHTML = `
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${number}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${card.fullName}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${card.ipn}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${card.organization}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${this.formatDate(card.accountOpenDate)}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${this.formatDate(card.firstDepositDate)}</td>
            <td class="px-6 py-4 whitespace-nowrap">
                <span class="status-badge ${card.accountStatus === 'Активний' ? 'status-active' : 'status-pending'}">
                    ${card.accountStatus}
                </span>
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
                <span class="card-status-badge ${this.getCardStatusClass(card.cardStatus)}">
                    ${card.cardStatus}
                </span>
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
                <div class="documents-list">
                    ${this.renderDocuments(card.documents)}
                </div>
            </td>
            <td class="px-6 py-4 text-sm text-gray-900">${card.comment || ''}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                <button onclick="cardManager.showEditModal('${card.id}')" class="text-indigo-600 hover:text-indigo-900 mr-2">
                    Редагувати
                </button>
                <button onclick="cardManager.deleteCard('${card.id}')" class="text-red-600 hover:text-red-900">
                    Видалити
                </button>
            </td>
        `;
        
        return row;
    }

    getCardStatusClass(status) {
        const statusClasses = {
            'Виготовляється': 'card-status-manufacturing',
            'На відділенні': 'card-status-office',
            'На організації': 'card-status-organization',
            'Видана': 'card-status-issued'
        };
        return statusClasses[status] || 'card-status-manufacturing';
    }

    renderDocuments(documents) {
        if (!documents) return '';
        
        const docs = [];
        if (documents.contract) docs.push('<span class="document-badge completed">Договір</span>');
        if (documents.survey) docs.push('<span class="document-badge completed">Опитувальник</span>');
        if (documents.passport) docs.push('<span class="document-badge completed">Паспорт</span>');
        
        return docs.join('');
    }

    formatDate(dateString) {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleDateString('uk-UA');
    }

    getFilteredCards() {
        let filtered = [...this.cards];
        
        const orgFilter = document.getElementById('filterOrganization')?.value;
        const monthFilter = document.getElementById('filterMonth')?.value;
        const statusFilter = document.getElementById('filterAccountStatus')?.value;
        
        if (orgFilter) {
            filtered = filtered.filter(card => card.organization === orgFilter);
        }
        
        if (monthFilter) {
            filtered = filtered.filter(card => {
                if (!card.accountOpenDate) return false;
                const cardMonth = new Date(card.accountOpenDate).getMonth() + 1;
                return cardMonth.toString().padStart(2, '0') === monthFilter;
            });
        }
        
        if (statusFilter) {
            filtered = filtered.filter(card => card.accountStatus === statusFilter);
        }
        
        return filtered;
    }

    async populateFilters() {
        await this.populateOrganizationFilter();
    }

    async populateOrganizationFilter() {
        const select = document.getElementById('filterOrganization');
        if (!select) return;

        await this.loadCards();
        const organizations = [...new Set(this.cards.map(card => card.organization))];
        
        // Очистити існуючі опції (крім першої)
        while (select.children.length > 1) {
            select.removeChild(select.lastChild);
        }
        
        organizations.forEach(org => {
            const option = document.createElement('option');
            option.value = org;
            option.textContent = org;
            select.appendChild(option);
        });
    }

    async applyFilters() {
        await this.loadTable();
    }

    // Метод для отримання всіх карток (активних + архівних) для звітів
    async getAllCards() {
        try {
            const activeCards = await dataService.getCards();
            const archivedCards = await dataService.getArchivedCards();
            return [...activeCards, ...archivedCards];
        } catch (error) {
            console.error('❌ Помилка отримання всіх карток:', error);
            return [];
        }
    }

    // Метод для отримання тільки архівних карток
    async getArchivedCards() {
        return await dataService.getArchivedCards();
    }

    // Показати модальне вікно імпорту
    showImportModal() {
        const modal = document.getElementById('importModal');
        if (modal) {
            modal.classList.remove('hidden');
            // Очистити попередній вибір файлу
            const fileInput = document.getElementById('importFileInput');
            if (fileInput) {
                fileInput.value = '';
            }
        }
    }

    // Приховати модальне вікно імпорту
    hideImportModal() {
        const modal = document.getElementById('importModal');
        if (modal) {
            modal.classList.add('hidden');
        }
    }

    // Обробка імпорту
    async processImport() {
        const fileInput = document.getElementById('importFileInput');
        if (!fileInput || !fileInput.files[0]) {
            this.showNotification('❌ Оберіть файл для імпорту', 'error');
            return;
        }

        const file = fileInput.files[0];
        
        try {
            this.showNotification('⏳ Обробка файлу...', 'info');
            
            // Читаємо файл
            const data = await this.readExcelFile(file);
            
            if (!data || data.length === 0) {
                this.showNotification('❌ Файл порожній або неправильний формат', 'error');
                return;
            }

            // Валідуємо та імпортуємо дані
            const results = await this.importCardsData(data);
            
            // Показуємо результати
            if (results.success > 0) {
                this.showNotification(`✅ Успішно імпортовано ${results.success} карток`, 'success');
                this.hideImportModal();
                await this.loadTable(); // Оновлюємо таблицю
            }
            
            if (results.errors > 0) {
                this.showNotification(`⚠️ ${results.errors} записів містили помилки`, 'warning');
            }

        } catch (error) {
            console.error('❌ Помилка імпорту:', error);
            this.showNotification('❌ Помилка при імпорті файлу', 'error');
        }
    }

    // Читання Excel файлу
    async readExcelFile(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = (e) => {
                try {
                    const data = new Uint8Array(e.target.result);
                    const workbook = XLSX.read(data, { type: 'array' });
                    
                    // Беремо перший аркуш
                    const firstSheetName = workbook.SheetNames[0];
                    const worksheet = workbook.Sheets[firstSheetName];
                    
                    // Конвертуємо в JSON
                    const jsonData = XLSX.utils.sheet_to_json(worksheet);
                    resolve(jsonData);
                } catch (error) {
                    reject(error);
                }
            };
            
            reader.onerror = () => reject(new Error('Помилка читання файлу'));
            reader.readAsArrayBuffer(file);
        });
    }

    // Імпорт даних карток
    async importCardsData(data) {
        let success = 0;
        let errors = 0;
        const errorDetails = [];

        for (const [index, row] of data.entries()) {
            try {
                // Мапування колонок (підтримка різних варіантів назв)
                const cardData = this.mapRowToCard(row);
                
                // Валідація обов'язкових полів
                if (!cardData.fullName || !cardData.ipn || !cardData.accountOpenDate) {
                    errors++;
                    errorDetails.push(`Рядок ${index + 1}: відсутні обов'язкові поля (ПІБ, ІПН, Дата відкриття)`);
                    continue;
                }

                // Додаткова валідація ІПН (має бути 10 цифр)
                if (cardData.ipn && !/^\d{10}$/.test(cardData.ipn.toString().replace(/\s/g, ''))) {
                    console.warn(`Рядок ${index + 1}: ІПН має неправильний формат: ${cardData.ipn}`);
                    // Не зупиняємо імпорт, але попереджаємо
                }

                console.log(`Імпорт рядка ${index + 1}:`, cardData);

                // Збереження в базу даних
                await dataService.addCard(cardData);
                success++;

            } catch (error) {
                console.error(`Помилка збереження рядка ${index + 1}:`, error);
                errors++;
                errorDetails.push(`Рядок ${index + 1}: ${error.message}`);
            }
        }

        // Показуємо детальні помилки якщо їх небагато
        if (errorDetails.length > 0 && errorDetails.length <= 5) {
            console.warn('Деталі помилок імпорту:', errorDetails);
        }

        return { success, errors, errorDetails };
    }

    // Мапування рядка Excel на об'єкт картки
    mapRowToCard(row) {
        // Функція для пошуку значення по різним варіантам назв колонок
        const findValue = (possibleNames) => {
            for (const name of possibleNames) {
                if (row[name] !== undefined && row[name] !== null && row[name] !== '') {
                    return row[name];
                }
            }
            return '';
        };

        // Функція для перевірки чи є значення "ТАК"
        const isYes = (value) => {
            if (!value) return false;
            const normalizedValue = value.toString().toUpperCase().trim();
            return normalizedValue === 'ТАК' || 
                   normalizedValue === 'YES' || 
                   normalizedValue === 'ДА' || 
                   normalizedValue === 'TRUE' || 
                   normalizedValue === '1' ||
                   normalizedValue === '+';
        };

        return {
            fullName: findValue(['ПІБ', 'PIB', 'Full Name', 'Name', 'Имя']),
            ipn: findValue(['ІПН', 'IPN', 'Tax ID', 'ИНН']),
            organization: findValue(['Організація', 'Organization', 'Организация', 'Company']) || '',
            accountOpenDate: this.parseDate(findValue(['Дата відкриття', 'Open Date', 'Дата открытия', 'Date'])),
            firstDepositDate: this.parseDate(findValue(['Дата 1-го зарахування', 'Дата 1-го зарах.', 'First Credit Date', 'Дата первого зач.', 'Credit Date'])),
            accountStatus: 'Очікує активацію', // За замовчуванням
            comment: findValue(['Коментар', 'Comment', 'Комментарий', 'Notes']) || '',
            hasPassport: isYes(findValue(['Паспорт', 'Passport', 'Паспорт'])),
            hasSurvey: isYes(findValue(['Опитувальник', 'Survey', 'Опросник', 'Анкета'])),
            hasContract: isYes(findValue(['Договір', 'Contract', 'Договор'])),
            cardStatus: 'Manufacturing'
        };
    }

    // Парсинг дати з різних форматів
    parseDate(dateValue) {
        if (!dateValue) return null;
        
        // Якщо це вже Date об'єкт
        if (dateValue instanceof Date) {
            return dateValue.toISOString().split('T')[0];
        }
        
        // Якщо це рядок
        if (typeof dateValue === 'string') {
            dateValue = dateValue.trim();
            if (!dateValue) return null;
            
            // Спроба парсити різні формати
            const formats = [
                /^\d{4}-\d{2}-\d{2}$/, // YYYY-MM-DD
                /^\d{2}\/\d{2}\/\d{4}$/, // DD/MM/YYYY
                /^\d{2}\.\d{2}\.\d{4}$/, // DD.MM.YYYY
            ];
            
            // Перевірка форматів
            if (formats[0].test(dateValue)) {
                // YYYY-MM-DD - використовуємо як є
                const date = new Date(dateValue + 'T00:00:00');
                if (!isNaN(date.getTime())) {
                    return dateValue;
                }
            } else if (formats[1].test(dateValue)) {
                // DD/MM/YYYY
                const parts = dateValue.split('/');
                const isoDate = `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
                const date = new Date(isoDate + 'T00:00:00');
                if (!isNaN(date.getTime())) {
                    return isoDate;
                }
            } else if (formats[2].test(dateValue)) {
                // DD.MM.YYYY
                const parts = dateValue.split('.');
                const isoDate = `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
                const date = new Date(isoDate + 'T00:00:00');
                if (!isNaN(date.getTime())) {
                    return isoDate;
                }
            }
            
            // Спроба через стандартний парсер
            const date = new Date(dateValue);
            if (!isNaN(date.getTime())) {
                return date.toISOString().split('T')[0];
            }
        }
        
        // Якщо це число (Excel serial date)
        if (typeof dateValue === 'number') {
            const date = new Date((dateValue - 25569) * 86400 * 1000);
            if (!isNaN(date.getTime())) {
                return date.toISOString().split('T')[0];
            }
        }
        
        console.warn('Не вдалося парсити дату:', dateValue);
        return null;
    }

    // Завантаження шаблону Excel
    downloadTemplate() {
        try {
            // Створюємо приклад даних для шаблону
            const templateData = [
                {
                    'ПІБ': 'Іванов Іван Іванович',
                    'ІПН': '1234567890',
                    'Організація': 'ТОВ "Приклад"',
                    'Дата відкриття': '2024-01-15',
                    'Дата 1-го зарахування': '2024-01-20',
                    'Паспорт': 'ТАК',
                    'Опитувальник': 'ТАК',
                    'Договір': 'НІ'
                },
                {
                    'ПІБ': 'Петренко Марія Олександрівна',
                    'ІПН': '0987654321',
                    'Організація': 'ФОП Петренко',
                    'Дата відкриття': '2024-01-16',
                    'Дата 1-го зарахування': '',
                    'Паспорт': 'ТАК',
                    'Опитувальник': 'НІ',
                    'Договір': 'ТАК'
                }
            ];

            // Створюємо Excel файл
            const workbook = XLSX.utils.book_new();
            const worksheet = XLSX.utils.json_to_sheet(templateData);
            
            // Додаємо стилі до заголовків (робимо їх жирними)
            const headerCells = ['A1', 'B1', 'C1', 'D1', 'E1', 'F1', 'G1', 'H1'];
            headerCells.forEach(cell => {
                if (worksheet[cell]) {
                    worksheet[cell].s = {
                        font: { bold: true },
                        fill: { bgColor: { indexed: 64 }, fgColor: { rgb: "FFCCCCCC" } }
                    };
                }
            });

            // Налаштовуємо ширину колонок
            worksheet['!cols'] = [
                { wch: 25 }, // ПІБ
                { wch: 12 }, // ІПН
                { wch: 20 }, // Organisation
                { wch: 15 }, // Дата відкриття
                { wch: 18 }, // Дата 1-го зарахування
                { wch: 10 }, // Паспорт
                { wch: 15 }, // Опитувальник
                { wch: 10 }  // Договір
            ];

            XLSX.utils.book_append_sheet(workbook, worksheet, "Шаблон імпорту");
            
            // Завантажуємо файл
            const filename = `Шаблон_імпорту_клієнтів.xlsx`;
            XLSX.writeFile(workbook, filename);
            
            this.showNotification('✅ Шаблон завантажено успішно!', 'success');
            
        } catch (error) {
            console.error('❌ Помилка створення шаблону:', error);
            this.showNotification('❌ Помилка при створенні шаблону', 'error');
        }
    }

    // Показати повідомлення з різними типами
    showNotification(message, type = 'info') {
        const colors = {
            'success': 'bg-green-500',
            'error': 'bg-red-500',
            'info': 'bg-blue-500',
            'warning': 'bg-yellow-500'
        };

        const icons = {
            'success': '✅',
            'error': '❌',
            'info': 'ℹ️',
            'warning': '⚠️'
        };

        const notification = document.createElement('div');
        notification.className = `fixed top-4 right-4 ${colors[type]} text-white p-4 rounded-lg shadow-lg z-50 max-w-sm`;
        notification.innerHTML = `
            <div class="flex items-center">
                <span class="mr-2">${icons[type]}</span>
                <span>${message}</span>
            </div>
        `;
        
        document.body.appendChild(notification);
        
        // Видалити повідомлення через 5 секунд
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 5000);
    }
}

// Ініціалізація менеджера карток при завантаженні сторінки
let cardManager;
document.addEventListener('DOMContentLoaded', () => {
    // Чекаємо трохи, щоб всі скрипти завантажились
    setTimeout(() => {
        console.log('🎯 Ініціалізація CardManager...');
        cardManager = new CardManager();
    }, 200);
});
