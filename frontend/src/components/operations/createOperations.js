import {HttpUtils} from "../../utils/http-utils";
import {AuthUtils} from "../../utils/auth-utils";

export class CreateOperations {
    constructor(openNewRoute) {
        this.openNewRoute = openNewRoute;

        // Проверка авторизации пользователя
        if (!AuthUtils.getAuthInfo(AuthUtils.accessTokenKey) || !AuthUtils.getAuthInfo(AuthUtils.refreshTokenKey)) {
            return openNewRoute('/login');
        }

        // Извлечение параметра type из URL
        const urlParams = new URLSearchParams(window.location.search);
        // В URL ожидается "Доход" или "Расход"
        this.operationType = urlParams.get("type") || "Неизвестный тип";

        // Установка значения типа операции в поле ввода (если такое есть)
        const nameInput = document.getElementById("name-input");
        if (nameInput) {
            nameInput.value = this.operationType;
        }

        // Инициализация кнопки создания операции
        const buttonCreate = document.getElementById('button-create');
        if (buttonCreate) {
            buttonCreate.addEventListener('click', this.createOperations.bind(this));
        }

        // Инициализация элементов формы
        this.sumInputElement = document.getElementById('sum-input');
        this.dateInputElement = document.getElementById('date-input');
        this.commentInputElement = document.getElementById('comments-input');
        this.categorySelectElement = document.getElementById('category-select');

        // Сохраняем выбранную категорию в localStorage
        this.categorySelectElement.addEventListener('change', (event) => {
            const selectedCategoryId = event.target.value;
            console.log("Выбранная категория:", selectedCategoryId);
            localStorage.setItem('selectedCategoryId', selectedCategoryId);
        });


        // Загрузка категорий в зависимости от типа операции
        if (this.operationType === 'Доход') {
            this.getIncomeCategories();
        } else if (this.operationType === 'Расход') {
            this.getExpensesCategories();
        }
    }

    // Метод для загрузки категорий доходов
    async getIncomeCategories() {
        const result = await HttpUtils.request('/categories/income');

        if (result.error) {
            console.warn('Ошибка при получении категорий доходов:', result);
            alert('Ошибка при запросе категорий доходов.');
            return;
        }

        this.populateCategories(result.response);
    }

    // Метод для загрузки категорий расходов
    async getExpensesCategories() {
        const result = await HttpUtils.request('/categories/expense');

        if (result.error) {
            console.warn('Ошибка при получении категорий расходов:', result);
            alert('Ошибка при запросе категорий расходов.');
            return;
        }

        this.populateCategories(result.response);
    }

    // Метод для заполнения выпадающего списка категорий
    populateCategories(categories) {
        if (!this.categorySelectElement) return;

        this.categorySelectElement.innerHTML = ''; // Очищаем перед заполнением

        categories.forEach(category => {
            const option = document.createElement('option');
            option.value = category.id;
            option.textContent = category.title;
            this.categorySelectElement.appendChild(option);

            // Логируем добавленные категории
            console.log("Добавлена категория:", option.value, option.textContent);
        });

        // Автоматически устанавливаем сохранённую категорию, если она есть
        const savedCategoryId = localStorage.getItem('selectedCategoryId');
        if (savedCategoryId) {
            this.categorySelectElement.value = savedCategoryId;
            console.log("Восстановлена категория:", savedCategoryId);
        }
    }

    // Метод для валидации формы
    validateForm() {
        let isValid = true;
        const requiredFields = [this.sumInputElement, this.dateInputElement, this.categorySelectElement];

        requiredFields.forEach(field => {
            if (!field.value) {
                field.classList.add('is-invalid');
                isValid = false;
            } else {
                field.classList.remove('is-invalid');
            }
        });

        return isValid;
    }

    // Метод для создания операции
    async createOperations(e) {
        e.preventDefault();

        if (this.validateForm()) {
            const amount = parseFloat(this.sumInputElement.value);
            const categoryId = parseInt(this.categorySelectElement.value, 10);

            let typeToSend = '';
            if (this.operationType === 'Расход') {
                typeToSend = 'expense';
            } else if (this.operationType === 'Доход') {
                typeToSend = 'income';
            } else {
                typeToSend = this.operationType;
            }

            const operationData = {
                type: typeToSend,
                amount: amount,
                date: this.dateInputElement.value,
                comment: this.commentInputElement.value,
                category_id: categoryId,
            };

            const result = await HttpUtils.request('/operations', 'POST', true, operationData);

            if (result.error || !result.response) {
                alert('Ошибка! Обратитесь в поддержку.');
            } else {
                document.dispatchEvent(new CustomEvent('operationCreated'));
                this.openNewRoute('/operations');
            }

            // Очистить localStorage после создания операции
            localStorage.removeItem('selectedCategoryId');
        }
    }

}

