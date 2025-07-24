// Тестові дані для демонстрації системи
const testData = [
    {
        id: "test_1",
        fullName: "Іванов Іван Іванович",
        ipn: "1234567890",
        organization: "ТОВ 'Прогрес'",
        accountOpenDate: "2024-01-15",
        firstDepositDate: "2024-01-20",
        cardStatus: "Видана",
        comment: "Все оформлено правильно",
        documents: {
            contract: true,
            survey: true,
            passport: true
        },
        accountStatus: "Активний",
        createdAt: "2024-01-15T10:00:00.000Z"
    },
    {
        id: "test_2",
        fullName: "Петренко Марія Олександрівна",
        ipn: "9876543210",
        organization: "ПП 'Інновація'",
        accountOpenDate: "2024-02-10",
        firstDepositDate: "",
        cardStatus: "На відділенні",
        comment: "Очікує активації",
        documents: {
            contract: true,
            survey: false,
            passport: true
        },
        accountStatus: "Очікує активацію",
        createdAt: "2024-02-10T14:30:00.000Z"
    },
    {
        id: "test_3",
        fullName: "Сидоренко Олексій Петрович",
        ipn: "5555666677",
        organization: "ТОВ 'Прогрес'",
        accountOpenDate: "2024-03-05",
        firstDepositDate: "2024-03-12",
        cardStatus: "На організації",
        comment: "Передано в організацію",
        documents: {
            contract: true,
            survey: true,
            passport: false
        },
        accountStatus: "Активний",
        createdAt: "2024-03-05T09:15:00.000Z"
    }
];

// Функція для ініціалізації тестових даних
function initTestData() {
    if (!localStorage.getItem('cards')) {
        localStorage.setItem('cards', JSON.stringify(testData));
    }
    
    if (!localStorage.getItem('archivedCards')) {
        localStorage.setItem('archivedCards', JSON.stringify([]));
    }
}

// Виклик при завантаженні сторінки
document.addEventListener('DOMContentLoaded', () => {
    initTestData();
});
