// Сервіс для роботи з даними (виключно Supabase)
class DataService {
    constructor() {
        this.supabaseReady = false;
        this.init();
    }

    async init() {
        try {
            // Чекаємо поки Supabase ініціалізується
            await new Promise(resolve => setTimeout(resolve, 300));
            
            // Перевіряємо доступність Supabase
            if (!isSupabaseAvailable()) {
                throw new Error('Supabase не ініціалізований');
            }
            
            // Тестуємо підключення та наявність таблиць
            const { data, error } = await supabaseClient.from('cards').select('count').limit(1);
            
            if (error && error.code === 'PGRST116') {
                throw new Error('Таблиці не створені в Supabase. Виконайте SQL з файлу supabase_tables.sql');
            } else if (error) {
                throw new Error(`Помилка підключення: ${error.message}`);
            }
            
            this.supabaseReady = true;
            console.log('✅ DataService готовий з Supabase');
            
        } catch (error) {
            console.error('❌ Критична помилка: не вдалося підключитися до Supabase:', error.message);
            this.supabaseReady = false;
            this.showConnectionError(error.message);
        }
    }

    showConnectionError(errorMessage) {
        // Показуємо користувачу повідомлення про помилку
        const errorDiv = document.createElement('div');
        errorDiv.className = 'fixed top-4 left-1/2 transform -translate-x-1/2 bg-red-500 text-white p-6 rounded-lg shadow-lg z-50 max-w-lg';
        
        let message = 'Перевірте налаштування Supabase та підключення до інтернету';
        if (errorMessage.includes('Таблиці не створені')) {
            message = 'Потрібно створити таблиці в Supabase. Виконайте SQL з файлу supabase_tables.sql';
        }
        
        errorDiv.innerHTML = `
            <div class="text-center">
                <span class="text-2xl mb-2 block">❌</span>
                <div>
                    <strong class="block mb-2">Помилка бази даних</strong>
                    <small class="block">${message}</small>
                </div>
                <button onclick="this.parentElement.parentElement.remove()" class="mt-4 bg-white text-red-600 px-4 py-2 rounded font-semibold">
                    Закрити
                </button>
            </div>
        `;
        document.body.appendChild(errorDiv);
    }

    // Методи для роботи з активними картками
    async getCards() {
        if (!this.supabaseReady) {
            console.error('❌ Supabase не готовий');
            return [];
        }

        try {
            const { data, error } = await supabaseClient
                .from(SUPABASE_CONFIG.tables.cards)
                .select('*')
                .order('created_at', { ascending: false });
            
            if (error) throw error;
            return this.formatCardsFromSupabase(data || []);
        } catch (error) {
            console.error('❌ Помилка завантаження карток:', error);
            throw new Error('Не вдалося завантажити картки з бази даних');
        }
    }

    async addCard(cardData) {
        if (!this.supabaseReady) {
            throw new Error('База даних недоступна');
        }

        const card = {
            ...cardData,
            accountStatus: this.calculateAccountStatus(cardData.firstDepositDate),
            createdAt: new Date().toISOString()
        };

        try {
            const supabaseCard = this.formatCardForSupabase(card);
            const { data, error } = await supabaseClient
                .from(SUPABASE_CONFIG.tables.cards)
                .insert([supabaseCard])
                .select();
            
            if (error) throw error;
            console.log('✅ Картку додано успішно');
            return this.formatCardFromSupabase(data[0]);
        } catch (error) {
            console.error('❌ Помилка додавання картки:', error);
            throw new Error('Не вдалося додати картку до бази даних');
        }
    }

    async updateCard(cardId, cardData) {
        if (!this.supabaseReady) {
            throw new Error('База даних недоступна');
        }

        const updatedCard = {
            ...cardData,
            accountStatus: this.calculateAccountStatus(cardData.firstDepositDate),
            updatedAt: new Date().toISOString()
        };

        try {
            const supabaseCard = this.formatCardForSupabase(updatedCard);
            const { data, error } = await supabaseClient
                .from(SUPABASE_CONFIG.tables.cards)
                .update(supabaseCard)
                .eq('id', cardId)
                .select();
            
            if (error) throw error;
            console.log('✅ Картку оновлено успішно');
            return this.formatCardFromSupabase(data[0]);
        } catch (error) {
            console.error('❌ Помилка оновлення картки:', error);
            throw new Error('Не вдалося оновити картку в базі даних');
        }
    }

    async deleteCard(cardId) {
        if (!this.supabaseReady) {
            throw new Error('База даних недоступна');
        }

        try {
            const { error } = await supabaseClient
                .from(SUPABASE_CONFIG.tables.cards)
                .delete()
                .eq('id', cardId);
            
            if (error) throw error;
            console.log('✅ Картку видалено успішно');
            return true;
        } catch (error) {
            console.error('❌ Помилка видалення картки:', error);
            throw new Error('Не вдалося видалити картку з бази даних');
        }
    }

    // Методи для роботи з архівними картками
    async getArchivedCards() {
        if (!this.supabaseReady) {
            console.error('❌ Supabase не готовий');
            return [];
        }

        try {
            const { data, error } = await supabaseClient
                .from(SUPABASE_CONFIG.tables.archived_cards)
                .select('*')
                .order('archived_at', { ascending: false });
            
            if (error) throw error;
            return this.formatCardsFromSupabase(data || []);
        } catch (error) {
            console.error('❌ Помилка завантаження архівних карток:', error);
            throw new Error('Не вдалося завантажити архівні картки з бази даних');
        }
    }

    async moveToArchive(card) {
        if (!this.supabaseReady) {
            throw new Error('База даних недоступна');
        }

        try {
            // Додаємо в архів
            const archivedCard = {
                ...card,
                archivedAt: new Date().toISOString()
            };
            const supabaseArchivedCard = this.formatCardForSupabase(archivedCard);
            
            const { error: insertError } = await supabaseClient
                .from(SUPABASE_CONFIG.tables.archived_cards)
                .insert([supabaseArchivedCard]);
            
            if (insertError) throw insertError;

            // Видаляємо з активних
            const { error: deleteError } = await supabaseClient
                .from(SUPABASE_CONFIG.tables.cards)
                .delete()
                .eq('id', card.id);
            
            if (deleteError) throw deleteError;
            
            console.log('✅ Картку переміщено в архів');
            return true;
        } catch (error) {
            console.error('❌ Помилка переміщення в архів:', error);
            throw new Error('Не вдалося перемістити картку в архів');
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
            comment: card.comment || '',
            documents: card.documents || {"contract": false, "survey": false, "passport": false},
            account_status: this.translateAccountStatusToEnglish(card.accountStatus),
            created_at: card.createdAt,
            updated_at: card.updatedAt || new Date().toISOString(),
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

    translateCardStatusToEnglish(status) {
        const translations = {
            'Виготовляється': 'Manufacturing',
            'Відділ': 'Department', 
            'Організація': 'Organization',
            'Видано': 'Issued'
        };
        return translations[status] || status;
    }

    translateCardStatusToUkrainian(status) {
        const translations = {
            'Manufacturing': 'Виготовляється',
            'Department': 'Відділ',
            'Organization': 'Організація', 
            'Issued': 'Видано'
        };
        return translations[status] || status;
    }

    translateAccountStatusToEnglish(status) {
        const translations = {
            'Очікує активацію': 'Pending',
            'Активний': 'Active'
        };
        return translations[status] || status;
    }

    translateAccountStatusToUkrainian(status) {
        const translations = {
            'Pending': 'Очікує активацію',
            'Active': 'Активний'
        };
        return translations[status] || status;
    }

    formatCardsFromSupabase(supabaseCards) {
        return supabaseCards.map(card => this.formatCardFromSupabase(card));
    }

    calculateAccountStatus(firstDepositDate) {
        return firstDepositDate ? 'Активний' : 'Очікує активацію';
    }
}
