// Сервіс для роботи з даними (Supabase + LocalStorage fallback)
class DataService {
    constructor() {
        this.useSupabase = false;
        this.init();
    }

    async init() {
        try {
            // Чекаємо поки Supabase ініціалізується
            await new Promise(resolve => setTimeout(resolve, 300));
            
            // Спробуємо ініціалізувати Supabase
            this.useSupabase = isSupabaseAvailable();
            
            if (this.useSupabase) {
                console.log('✅ DataService використовує Supabase');
                // Тестуємо підключення
                try {
                    await supabaseClient.from('cards').select('count');
                    console.log('✅ Підключення до Supabase працює');
                } catch (error) {
                    console.warn('⚠️ Помилка підключення до Supabase:', error.message);
                    this.useSupabase = false;
                }
            }
            
            if (!this.useSupabase) {
                console.log('📱 DataService використовує LocalStorage');
                this.initLocalStorageData();
            }
        } catch (error) {
            console.error('❌ Помилка ініціалізації DataService:', error);
            this.useSupabase = false;
            this.initLocalStorageData();
        }
    }

    initLocalStorageData() {
        if (!localStorage.getItem('cards')) {
            localStorage.setItem('cards', JSON.stringify([]));
        }
        if (!localStorage.getItem('archivedCards')) {
            localStorage.setItem('archivedCards', JSON.stringify([]));
        }
    }

    // Методи для роботи з активними картками
    async getCards() {
        if (this.useSupabase) {
            try {
                const { data, error } = await supabaseClient
                    .from(SUPABASE_CONFIG.tables.cards)
                    .select('*')
                    .order('created_at', { ascending: false });
                
                if (error) throw error;
                return this.formatCardsFromSupabase(data || []);
            } catch (error) {
                console.error('Помилка завантаження карток з Supabase:', error);
                return this.getCardsFromLocalStorage();
            }
        } else {
            return this.getCardsFromLocalStorage();
        }
    }

    async addCard(cardData) {
        const card = {
            ...cardData,
            id: this.generateId(),
            accountStatus: this.calculateAccountStatus(cardData.firstDepositDate),
            createdAt: new Date().toISOString()
        };

        if (this.useSupabase) {
            try {
                const supabaseCard = this.formatCardForSupabase(card);
                const { data, error } = await supabaseClient
                    .from(SUPABASE_CONFIG.tables.cards)
                    .insert([supabaseCard])
                    .select();
                
                if (error) throw error;
                return this.formatCardFromSupabase(data[0]);
            } catch (error) {
                console.error('Помилка додавання картки в Supabase:', error);
                return this.addCardToLocalStorage(card);
            }
        } else {
            return this.addCardToLocalStorage(card);
        }
    }

    async updateCard(cardId, cardData) {
        const updatedCard = {
            ...cardData,
            accountStatus: this.calculateAccountStatus(cardData.firstDepositDate),
            updatedAt: new Date().toISOString()
        };

        if (this.useSupabase) {
            try {
                const supabaseCard = this.formatCardForSupabase(updatedCard);
                const { data, error } = await supabaseClient
                    .from(SUPABASE_CONFIG.tables.cards)
                    .update(supabaseCard)
                    .eq('id', cardId)
                    .select();
                
                if (error) throw error;
                return this.formatCardFromSupabase(data[0]);
            } catch (error) {
                console.error('Помилка оновлення картки в Supabase:', error);
                return this.updateCardInLocalStorage(cardId, updatedCard);
            }
        } else {
            return this.updateCardInLocalStorage(cardId, updatedCard);
        }
    }

    async deleteCard(cardId) {
        if (this.useSupabase) {
            try {
                const { error } = await supabaseClient
                    .from(SUPABASE_CONFIG.tables.cards)
                    .delete()
                    .eq('id', cardId);
                
                if (error) throw error;
                return true;
            } catch (error) {
                console.error('Помилка видалення картки з Supabase:', error);
                return this.deleteCardFromLocalStorage(cardId);
            }
        } else {
            return this.deleteCardFromLocalStorage(cardId);
        }
    }

    // Методи для роботи з архівними картками
    async getArchivedCards() {
        if (this.useSupabase) {
            try {
                const { data, error } = await supabaseClient
                    .from(SUPABASE_CONFIG.tables.archived_cards)
                    .select('*')
                    .order('archived_at', { ascending: false });
                
                if (error) throw error;
                return this.formatCardsFromSupabase(data || []);
            } catch (error) {
                console.error('Помилка завантаження архівних карток з Supabase:', error);
                return this.getArchivedCardsFromLocalStorage();
            }
        } else {
            return this.getArchivedCardsFromLocalStorage();
        }
    }

    async moveToArchive(card) {
        const archivedCard = {
            ...card,
            archivedAt: new Date().toISOString()
        };

        if (this.useSupabase) {
            try {
                // Додаємо в архів
                const supabaseCard = this.formatCardForSupabase(archivedCard);
                const { error: insertError } = await supabaseClient
                    .from(SUPABASE_CONFIG.tables.archived_cards)
                    .insert([supabaseCard]);
                
                if (insertError) throw insertError;

                // Видаляємо з активних
                const { error: deleteError } = await supabaseClient
                    .from(SUPABASE_CONFIG.tables.cards)
                    .delete()
                    .eq('id', card.id);
                
                if (deleteError) throw deleteError;
                
                return true;
            } catch (error) {
                console.error('Помилка переміщення в архів в Supabase:', error);
                return this.moveToArchiveInLocalStorage(archivedCard);
            }
        } else {
            return this.moveToArchiveInLocalStorage(archivedCard);
        }
    }

    // Допоміжні методи для форматування даних
    formatCardForSupabase(card) {
        return {
            id: card.id,
            full_name: card.fullName,
            ipn: card.ipn,
            organization: card.organization,
            account_open_date: card.accountOpenDate,
            first_deposit_date: card.firstDepositDate || null,
            card_status: this.translateCardStatusToEnglish(card.cardStatus),
            comment: card.comment || null,
            documents: card.documents,
            account_status: this.translateAccountStatusToEnglish(card.accountStatus),
            created_at: card.createdAt,
            updated_at: card.updatedAt || card.createdAt,
            archived_at: card.archivedAt || null
        };
    }

    formatCardFromSupabase(supabaseCard) {
        return {
            id: supabaseCard.id,
            fullName: supabaseCard.full_name,
            ipn: supabaseCard.ipn,
            organization: supabaseCard.organization,
            accountOpenDate: supabaseCard.account_open_date,
            firstDepositDate: supabaseCard.first_deposit_date,
            cardStatus: this.translateCardStatusToUkrainian(supabaseCard.card_status),
            comment: supabaseCard.comment,
            documents: supabaseCard.documents,
            accountStatus: this.translateAccountStatusToUkrainian(supabaseCard.account_status),
            createdAt: supabaseCard.created_at,
            updatedAt: supabaseCard.updated_at,
            archivedAt: supabaseCard.archived_at
        };
    }

    // Переклад статусів
    translateCardStatusToEnglish(status) {
        const statusMap = {
            'Виготовляється': 'Manufacturing',
            'На відділенні': 'At_Office',
            'На організації': 'At_Organization',
            'Видана': 'Issued'
        };
        return statusMap[status] || 'Manufacturing';
    }

    translateCardStatusToUkrainian(status) {
        const statusMap = {
            'Manufacturing': 'Виготовляється',
            'At_Office': 'На відділенні',
            'At_Organization': 'На організації',
            'Issued': 'Видана'
        };
        return statusMap[status] || 'Виготовляється';
    }

    translateAccountStatusToEnglish(status) {
        const statusMap = {
            'Активний': 'Active',
            'Очікує активацію': 'Pending'
        };
        return statusMap[status] || 'Pending';
    }

    translateAccountStatusToUkrainian(status) {
        const statusMap = {
            'Active': 'Активний',
            'Pending': 'Очікує активацію'
        };
        return statusMap[status] || 'Очікує активацію';
    }

    formatCardsFromSupabase(supabaseCards) {
        return supabaseCards.map(card => this.formatCardFromSupabase(card));
    }

    // LocalStorage методи (fallback)
    getCardsFromLocalStorage() {
        const saved = localStorage.getItem('cards');
        return saved ? JSON.parse(saved) : [];
    }

    addCardToLocalStorage(card) {
        const cards = this.getCardsFromLocalStorage();
        cards.push(card);
        localStorage.setItem('cards', JSON.stringify(cards));
        return card;
    }

    updateCardInLocalStorage(cardId, updatedData) {
        const cards = this.getCardsFromLocalStorage();
        const cardIndex = cards.findIndex(c => c.id === cardId);
        if (cardIndex !== -1) {
            cards[cardIndex] = { ...cards[cardIndex], ...updatedData };
            localStorage.setItem('cards', JSON.stringify(cards));
            return cards[cardIndex];
        }
        return null;
    }

    deleteCardFromLocalStorage(cardId) {
        const cards = this.getCardsFromLocalStorage();
        const filteredCards = cards.filter(c => c.id !== cardId);
        localStorage.setItem('cards', JSON.stringify(filteredCards));
        return true;
    }

    getArchivedCardsFromLocalStorage() {
        const saved = localStorage.getItem('archivedCards');
        return saved ? JSON.parse(saved) : [];
    }

    moveToArchiveInLocalStorage(archivedCard) {
        // Додаємо в архів
        const archivedCards = this.getArchivedCardsFromLocalStorage();
        archivedCards.push(archivedCard);
        localStorage.setItem('archivedCards', JSON.stringify(archivedCards));

        // Видаляємо з активних
        this.deleteCardFromLocalStorage(archivedCard.id);
        return true;
    }

    // Загальні допоміжні методи
    generateId() {
        return Date.now().toString() + Math.random().toString(36).substr(2, 9);
    }

    calculateAccountStatus(firstDepositDate) {
        return firstDepositDate ? 'Активний' : 'Очікує активацію';
    }

    // Метод для отримання всіх карток (активних + архівних) для звітів
    async getAllCards() {
        const [activeCards, archivedCards] = await Promise.all([
            this.getCards(),
            this.getArchivedCards()
        ]);
        return [...activeCards, ...archivedCards];
    }
}

// Глобальний екземпляр сервісу
let dataService;
