// Менеджер карток - основна логіка для роботи з картками
class CardManager {
    constructor() {
        this.cards = this.loadCards();
        this.archivedCards = this.loadArchivedCards();
        this.editingCardId = null;
        this.init();
    }

    init() {
        this.bindEvents();
        this.loadTable();
        this.populateFilters();
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

    loadCards() {
        const saved = localStorage.getItem('cards');
        return saved ? JSON.parse(saved) : [];
    }

    loadArchivedCards() {
        const saved = localStorage.getItem('archivedCards');
        return saved ? JSON.parse(saved) : [];
    }

    saveCards() {
        localStorage.setItem('cards', JSON.stringify(this.cards));
    }

    saveArchivedCards() {
        localStorage.setItem('archivedCards', JSON.stringify(this.archivedCards));
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

    handleFormSubmit(e) {
        e.preventDefault();
        
        const formData = this.getFormData();
        
        if (this.editingCardId) {
            this.updateCard(this.editingCardId, formData);
        } else {
            this.addCard(formData);
        }
        
        this.hideModal();
        this.loadTable();
        this.populateFilters();
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

    addCard(cardData) {
        const card = {
            id: this.generateId(),
            ...cardData,
            accountStatus: this.calculateAccountStatus(cardData.firstDepositDate),
            createdAt: new Date().toISOString()
        };
        
        this.cards.push(card);
        this.saveCards();
        this.checkForAutoArchive(card);
    }

    updateCard(cardId, cardData) {
        const cardIndex = this.cards.findIndex(c => c.id === cardId);
        if (cardIndex === -1) return;

        const updatedCard = {
            ...this.cards[cardIndex],
            ...cardData,
            accountStatus: this.calculateAccountStatus(cardData.firstDepositDate),
            updatedAt: new Date().toISOString()
        };

        this.cards[cardIndex] = updatedCard;
        this.saveCards();
        this.checkForAutoArchive(updatedCard);
    }

    deleteCard(cardId) {
        if (confirm('Ви впевнені, що хочете видалити цю картку?')) {
            this.cards = this.cards.filter(c => c.id !== cardId);
            this.saveCards();
            this.loadTable();
            this.populateFilters();
        }
    }

    calculateAccountStatus(firstDepositDate) {
        return firstDepositDate ? 'Активний' : 'Очікує активацію';
    }

    updateAccountStatus() {
        const firstDepositDate = document.getElementById('firstDepositDate').value;
        // Тут можна додати візуальне оновлення статусу в формі, якщо потрібно
    }

    checkForAutoArchive(card) {
        const shouldArchive = 
            card.accountStatus === 'Активний' &&
            card.cardStatus === 'Видана' &&
            card.documents?.contract &&
            card.documents?.survey &&
            card.documents?.passport;

        if (shouldArchive) {
            // Переміщення в архів
            this.archivedCards.push({
                ...card,
                archivedAt: new Date().toISOString()
            });
            this.cards = this.cards.filter(c => c.id !== card.id);
            
            this.saveCards();
            this.saveArchivedCards();
            
            // Показати повідомлення про автоматичне архівування
            this.showNotification('Картку автоматично переміщено в архів', 'success');
        }
    }

    loadTable() {
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

    populateFilters() {
        this.populateOrganizationFilter();
    }

    populateOrganizationFilter() {
        const select = document.getElementById('filterOrganization');
        if (!select) return;

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

    applyFilters() {
        this.loadTable();
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
    getAllCards() {
        return [...this.cards, ...this.archivedCards];
    }

    // Метод для отримання тільки архівних карток
    getArchivedCards() {
        return this.archivedCards;
    }
}

// Ініціалізація менеджера карток при завантаженні сторінки
let cardManager;
document.addEventListener('DOMContentLoaded', () => {
    cardManager = new CardManager();
});
