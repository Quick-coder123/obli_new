// Глобальна змінна для сервісу даних
let dataService;

// Менеджер архіву - логіка для роботи з архівними картками
class ArchiveManager {
    constructor() {
        this.archivedCards = [];
        this.editingCardId = null;
        this.init();
    }

    async init() {
        try {
            // Ініціалізуємо сервіс даних
            if (!dataService) {
                dataService = new DataService();
                await dataService.initialize();
            }
            
            this.bindEvents();
            await this.loadTable();
            console.log('✅ ArchiveManager ініціалізовано успішно');
        } catch (error) {
            console.error('❌ Помилка ініціалізації ArchiveManager:', error);
        }
    }

    bindEvents() {
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
        const card = this.archivedCards.find(c => c.id === cardId);
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
        
        if (this.editingCardId) {
            await this.updateCard(this.editingCardId, formData);
        }
        
        this.hideModal();
        // loadTable вже викликається в updateCard, не потрібно дублювати
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

    async updateCard(cardId, cardData) {
        try {
            const cardIndex = this.archivedCards.findIndex(c => c.id === cardId);
            if (cardIndex === -1) {
                throw new Error('Картку не знайдено в архіві');
            }

            const updatedCard = {
                ...this.archivedCards[cardIndex],
                ...cardData,
                accountStatus: this.calculateAccountStatus(cardData.firstDepositDate),
                updatedAt: new Date().toISOString()
            };

            // Оновлюємо в базі даних
            await dataService.updateArchivedCard(cardId, updatedCard);
            
            // Оновлюємо локальний масив
            this.archivedCards[cardIndex] = updatedCard;
            
            // Оновлюємо інтерфейс
            await this.loadTable();
            this.showNotification('Картку оновлено успішно', 'success');

            // Перевірити, чи картка все ще має бути в архіві
            await this.checkArchiveStatus(updatedCard);
            
        } catch (error) {
            console.error('❌ Помилка оновлення архівної картки:', error);
            this.showNotification('Помилка оновлення картки', 'error');
        }
    }

    async deleteCard(cardId) {
        if (confirm('Ви впевнені, що хочете видалити цю картку з архіву?')) {
            try {
                // Видаляємо з бази даних
                await dataService.deleteArchivedCard(cardId);
                
                // Видаляємо з локального масиву
                this.archivedCards = this.archivedCards.filter(c => c.id !== cardId);
                
                // Оновлюємо інтерфейс
                await this.loadTable();
                this.showNotification('Картку видалено з архіву', 'success');
                
            } catch (error) {
                console.error('❌ Помилка видалення картки з архіву:', error);
                this.showNotification('Помилка видалення картки', 'error');
            }
        }
    }

    calculateAccountStatus(firstDepositDate) {
        return firstDepositDate ? 'Активний' : 'Очікує активацію';
    }

    updateAccountStatus() {
        // Візуальне оновлення статусу в формі, якщо потрібно
    }

    async checkArchiveStatus(card) {
        console.log('🔍 Перевірка статусу архівної картки:', card);
        
        // Картка повинна залишатися в архіві тільки якщо ВСІ умови виконані
        const shouldStayInArchive = 
            card.accountStatus === 'Активний' &&
            card.cardStatus === 'Видано' &&
            card.documents?.contract === true &&
            card.documents?.survey === true &&
            card.documents?.passport === true;

        console.log('📋 Умови архівування:', {
            accountStatus: card.accountStatus,
            cardStatus: card.cardStatus,
            hasContract: card.documents?.contract,
            hasSurvey: card.documents?.survey,
            hasPassport: card.documents?.passport,
            shouldStayInArchive
        });

        if (!shouldStayInArchive) {
            try {
                console.log('🔄 Картка не відповідає умовам архівування, переміщуємо назад...');
                
                // Переміщуємо назад в активні картки через Supabase
                await this.moveFromArchive(card);
                
                // Оновлюємо локальний список
                this.archivedCards = this.archivedCards.filter(c => c.id !== card.id);
                
                // Оновлюємо інтерфейс
                await this.loadTable();
                
                this.showNotification('Картку переміщено назад в активні картки', 'success');
            } catch (error) {
                console.error('❌ Помилка переміщення з архіву:', error);
                this.showNotification('Помилка переміщення картки', 'error');
            }
        } else {
            console.log('✅ Картка залишається в архіві (всі умови виконані)');
        }
    }

    async moveFromArchive(card) {
        if (!dataService.supabaseReady) {
            throw new Error('База даних недоступна');
        }

        console.log('🔄 Починаємо переміщення з архіву:', card);

        try {
            // Підготовляємо картку для активних (без ID, щоб створити нову)
            const activeCard = {
                fullName: card.fullName,
                ipn: card.ipn,
                organization: card.organization,
                accountOpenDate: card.accountOpenDate,
                firstDepositDate: card.firstDepositDate,
                cardStatus: card.cardStatus,
                comment: card.comment,
                documents: card.documents,
                accountStatus: card.accountStatus,
                createdAt: card.createdAt,
                updatedAt: new Date().toISOString()
            };

            console.log('📤 Підготовлена картка для активних:', activeCard);
            
            const supabaseCard = dataService.formatCardForSupabase(activeCard);
            console.log('📤 Форматована картка для Supabase:', supabaseCard);
            
            const { error: insertError } = await supabaseClient
                .from(SUPABASE_CONFIG.tables.cards)
                .insert([supabaseCard]);
            
            if (insertError) {
                console.error('❌ Помилка додавання в активні картки:', insertError);
                throw insertError;
            }

            console.log('✅ Картку додано в активні, видаляємо з архіву...');

            // Видаляємо з архіву
            const { error: deleteError } = await supabaseClient
                .from(SUPABASE_CONFIG.tables.archivedCards)
                .delete()
                .eq('id', card.id);
            
            if (deleteError) {
                console.error('❌ Помилка видалення з архіву:', deleteError);
                throw deleteError;
            }

            console.log('✅ Картку успішно переміщено з архіву в активні');
            return true;
        } catch (error) {
            console.error('❌ Помилка переміщення з архіву:', error);
            throw new Error(`Не вдалося перемістити картку з архіву: ${error.message}`);
        }
    }

    async loadTable() {
        try {
            this.archivedCards = await dataService.getArchivedCards();
            
            const tbody = document.getElementById('archiveTableBody');
            if (!tbody) return;

            const filteredCards = this.getFilteredCards();
            tbody.innerHTML = '';

            if (filteredCards.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="11" class="px-6 py-4 text-center text-gray-500">
                        Немає карток в архіві
                    </td>
                </tr>
            `;
            return;
        }

        filteredCards.forEach((card, index) => {
            const row = this.createTableRow(card, index + 1);
            tbody.appendChild(row);
        });
        } catch (error) {
            console.error('❌ Помилка завантаження архівних карток:', error);
        }
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
                <button onclick="archiveManager.showEditModal('${card.id}')" class="text-indigo-600 hover:text-indigo-900 mr-2">
                    Редагувати
                </button>
                <button onclick="archiveManager.deleteCard('${card.id}')" class="text-red-600 hover:text-red-900">
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
        let filtered = [...this.archivedCards];
        
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

        const organizations = [...new Set(this.archivedCards.map(card => card.organization))];
        
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

    // Показати повідомлення
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
        
        // Видалити повідомлення через 3 секунди
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 3000);
    }

    // Метод для отримання архівних карток для звітів
    getArchivedCards() {
        return this.archivedCards;
    }
}

// Ініціалізація менеджера архіву при завантаженні сторінки
let archiveManager;
document.addEventListener('DOMContentLoaded', () => {
    // Чекаємо трохи, щоб всі скрипти завантажились
    setTimeout(() => {
        console.log('📦 Ініціалізація ArchiveManager...');
        archiveManager = new ArchiveManager();
    }, 200);
});
