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

    showNotification(message, type = 'info') {
        // Створити елемент повідомлення
        const notification = document.createElement('div');
        notification.className = `alert alert-${type} fixed top-4 right-4 z-50 fade-in`;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        // Видалити повідомлення через 3 секунди
        setTimeout(() => {
            notification.remove();
        }, 3000);
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
