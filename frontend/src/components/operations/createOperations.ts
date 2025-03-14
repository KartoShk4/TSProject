import {HttpUtils} from "../../utils/http-utils";
import {AuthUtils} from "../../utils/auth-utils";

export class CreateOperations {
    private readonly openNewRoute: (path: string) => void;
    private readonly operationType: string | undefined;
    private readonly sumInputElement: HTMLInputElement | null | undefined;
    private readonly dateInputElement: HTMLInputElement | null | undefined;
    private commentInputElement: HTMLInputElement | null | undefined;
    private readonly categorySelectElement: HTMLSelectElement | null | undefined;

    constructor(openNewRoute: (path: string) => void) {
        this.openNewRoute = openNewRoute;

        // Проверка авторизации пользователя
        if (
            !AuthUtils.getAuthInfo(AuthUtils.accessTokenKey) ||
            !AuthUtils.getAuthInfo(AuthUtils.refreshTokenKey)
        ) {
            openNewRoute('/login');
            return;
        }

        // Извлечение параметра type из URL
        const urlParams = new URLSearchParams(window.location.search);
        this.operationType = urlParams.get("type") || "Неизвестный тип";

        // Установка значения типа операции в поле ввода (если такое есть)
        const nameInput = document.getElementById("name-input") as HTMLInputElement | null;
        if (nameInput) {
            nameInput.value = this.operationType;
        }

        // Инициализация кнопки создания операции
        const buttonCreate = document.getElementById('button-create') as HTMLButtonElement | null;
        if (buttonCreate) {
            buttonCreate.addEventListener('click', this.createOperations.bind(this));
        }

        // Инициализация элементов формы
        this.sumInputElement = document.getElementById('sum-input') as HTMLInputElement | null;
        this.dateInputElement = document.getElementById('date-input') as HTMLInputElement | null;
        this.commentInputElement = document.getElementById('comments-input') as HTMLInputElement | null;
        this.categorySelectElement = document.getElementById('category-select') as HTMLSelectElement | null;

        // Добавление обработчика на select для сохранения выбранной категории
        if (this.categorySelectElement) {
            this.categorySelectElement.addEventListener('change', (event: Event) => {
                const target = event.target as HTMLSelectElement;
                const selectedCategoryId = target.value;
                console.log("Выбранная категория:", selectedCategoryId);
                localStorage.setItem('selectedCategoryId', selectedCategoryId);
            });
        }

        // Загрузка категорий в зависимости от типа операции
        if (this.operationType === 'Доход') {
            this.getIncomeCategories();
        } else if (this.operationType === 'Расход') {
            this.getExpensesCategories();
        }
    }

    // Метод для загрузки категорий доходов
    private async getIncomeCategories(): Promise<void> {
        const result = await HttpUtils.request('/categories/income');

        if (result.error) {
            console.warn('Ошибка при получении категорий доходов:', result);
            alert('Ошибка при запросе категорий доходов.');
            return;
        }

        this.populateCategories(result.response);
    }

    // Метод для загрузки категорий расходов
    private async getExpensesCategories(): Promise<void> {
        const result = await HttpUtils.request('/categories/expense');

        if (result.error) {
            console.warn('Ошибка при получении категорий расходов:', result);
            alert('Ошибка при запросе категорий расходов.');
            return;
        }

        this.populateCategories(result.response);
    }

    // Метод для заполнения выпадающего списка категорий
    private populateCategories(categories: { id: number; title: string }[]): void {
        if (!this.categorySelectElement) return;

        this.categorySelectElement.innerHTML = ''; // Очищаем перед заполнением

        categories.forEach(category => {
            const option = document.createElement('option');
            option.value = category.id.toString();
            option.textContent = category.title;
            this.categorySelectElement?.appendChild(option);

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
    private validateForm(): boolean {
        let isValid = true;
        const requiredFields = [this.sumInputElement, this.dateInputElement, this.categorySelectElement];

        requiredFields.forEach(field => {
            if (field && !field.value) {
                field.classList.add('is-invalid');
                isValid = false;
            } else {
                field?.classList.remove('is-invalid');
            }
        });

        return isValid;
    }

    // Метод для создания операции
    private async createOperations(e: Event): Promise<void> {
        e.preventDefault();

        if (this.validateForm() && this.sumInputElement && this.dateInputElement && this.categorySelectElement) {
            const amount = parseFloat(this.sumInputElement.value);
            const categoryId = parseInt(this.categorySelectElement.value, 10);

            let typeToSend: string | undefined;
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
                comment: this.commentInputElement?.value || '',
                category_id: categoryId,
            };

            try {
                const result = await HttpUtils.request('/operations', 'POST', true, operationData);

                if (result.error || !result.response) {
                    alert('Ошибка! Обратитесь в поддержку.');
                } else {
                    document.dispatchEvent(new CustomEvent('operationCreated'));
                    this.openNewRoute('/operations');
                }

                // Очистить localStorage после создания операции
                localStorage.removeItem('selectedCategoryId');
            } catch (error) {
                console.error("Ошибка при создании операции:", error);
                alert('Произошла ошибка. Попробуйте еще раз.');
            }
        }
    }
}
