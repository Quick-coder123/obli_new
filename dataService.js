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
            
            // Тестуємо підключення
            await supabaseClient.from('cards').select('count');
            this.supabaseReady = true;
            console.log('✅ DataService готовий з Supabase');
            
        } catch (error) {
            console.error('❌ Критична помилка: не вдалося підключитися до Supabase:', error.message);
            this.supabaseReady = false;
            this.showConnectionError();
        }
    }

    showConnectionError() {
        // Показуємо користувачу повідомлення про помилку
        const errorDiv = document.createElement('div');
        errorDiv.className = 'fixed top-4 left-1/2 transform -translate-x-1/2 bg-red-500 text-white p-4 rounded-lg shadow-lg z-50';
        errorDiv.innerHTML = `
            <div class="flex items-center">
                <span class="mr-2">❌</span>
                <div>
                    <strong>Помилка підключення до бази даних</strong><br>
                    <small>Перевірте налаштування Supabase та підключення до інтернету</small>
                </div>
            </div>
        `;
        document.body.appendChild(errorDiv);
        
        // Автоматично приховуємо через 10 секунд
        setTimeout(() => {
            if (errorDiv.parentNode) {
                errorDiv.parentNode.removeChild(errorDiv);
            }
        }, 10000);
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
