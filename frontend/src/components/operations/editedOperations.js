import { HttpUtils } from "../../utils/http-utils";
import { AuthUtils } from "../../utils/auth-utils";

export class EditedOperations {
    constructor(openNewRoute) {
        this.openNewRoute = openNewRoute;

        // Проверка авторизации пользователя
        if (!AuthUtils.getAuthInfo(AuthUtils.accessTokenKey) || !AuthUtils.getAuthInfo(AuthUtils.refreshTokenKey)) {
            return openNewRoute('/login');
        }

        this.operationId = this.getOperationIdFromUrl();
        this.init().then();
    }

    async init() {
        if (!this.operationId) {
            return this.openNewRoute('/operations');
        }

        this.nameInput = document.getElementById('input-name-edited');
        this.categorySelect = document.getElementById('category-select');
        this.sumInput = document.getElementById('input-sum-edited');
        this.dateInput = document.getElementById('date-input-edited');
        this.commentsInput = document.getElementById('input-comments-edited');
        this.createButton = document.getElementById('button-create');

        this.createButton.addEventListener('click', () => this.saveOperation());

        // Загружаем категории и операцию
        await this.loadCategories();
        await this.loadOperation();
    }

    getOperationIdFromUrl() {
        const params = new URLSearchParams(window.location.search);
        return params.get('id');
    }

    async loadOperation() {
        try {
            const result = await HttpUtils.request(`/operations/${this.operationId}`);
            if (result.error) {
                throw new Error(result.error);
            }
            this.fillForm(result.response);
        } catch (error) {
            console.error('Ошибка загрузки операции:', error);
            this.openNewRoute('/operations');
        }
    }

    async loadCategories() {
        try {
            const incomeCategories = await HttpUtils.request('/categories/income');
            const expenseCategories = await HttpUtils.request('/categories/expense');

            console.log('Категории доходов:', incomeCategories.response);
            console.log('Категории расходов:', expenseCategories.response);

            if (incomeCategories.response) {
                this.populateCategorySelect(incomeCategories.response, 'income');
            }
            if (expenseCategories.response) {
                this.populateCategorySelect(expenseCategories.response, 'expense');
            }
        } catch (error) {
            console.error('Ошибка загрузки категорий:', error);
        }
    }

    populateCategorySelect(categories, type) {
        categories.forEach(category => {
            const option = document.createElement('option');
            option.value = category.id;
            option.textContent = category.title;
            option.dataset.type = type;
            this.categorySelect.appendChild(option);
        });
    }

    fillForm(operation) {
        this.nameInput.value = operation.type === 'income' ? 'Доход' : 'Расход';

        // Проверяем, существует ли категория в списке
        const selectedCategory = [...this.categorySelect.options].find(option => option.textContent === operation.category);
        if (selectedCategory) {
            this.categorySelect.value = selectedCategory.value;
        } else {
            console.warn(`Категория с названием "${operation.category}" не найдена в списке!`);
            this.categorySelect.value = '';  // Если категории нет в списке, оставляем пустым
        }

        this.sumInput.value = operation.amount || '';
        this.dateInput.value = operation.date ? new Date(operation.date).toISOString().split('T')[0] : '';
        this.commentsInput.value = operation.comment || '';
    }

    saveOperation = () => {
        const categoryId = Number(this.categorySelect.value);

        // Формируем данные для обновления операции
        const updatedOperation = {
            amount: this.sumInput.value,
            date: this.dateInput.value,
            comment: this.commentsInput.value,
            type: this.nameInput.value === 'Доход' ? 'income' : 'expense',
            category_id: categoryId
        };

        // Проверяем, что все необходимые данные заполнены
        if (isNaN(updatedOperation.amount) || !updatedOperation.date || !updatedOperation.comment || !updatedOperation.category_id) {
            alert('Пожалуйста, заполните все обязательные поля.');
            return;
        }

        console.log("Отправляем обновленные данные:", updatedOperation);

        // Отправляем запрос на обновление
        HttpUtils.request(`/operations/${this.operationId}`, 'PUT', true, updatedOperation)
            .then(response => {
                console.log('Операция обновлена:', response);
                this.openNewRoute('/operations');
            })
            .catch(error => {
                console.error('Ошибка при сохранении операции:', error);
                if (error.response) {
                    console.error('Ответ от сервера:', error.response);
                    alert(`Ошибка: ${error.response.message}`);
                }
            });
    };
}
