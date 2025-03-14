import { HttpUtils } from "../../utils/http-utils";
import { AuthUtils } from "../../utils/auth-utils";

export class EditedOperations {
    private readonly operationId: string | null | undefined;
    private nameInput!: HTMLInputElement;
    private categorySelect!: HTMLSelectElement;
    private sumInput!: HTMLInputElement;
    private dateInput!: HTMLInputElement;
    private commentsInput!: HTMLInputElement;
    private createButton!: HTMLButtonElement;

    constructor(private openNewRoute: (path: string) => void) {
    // Проверка авторизации пользователя
    if (
!AuthUtils.getAuthInfo(AuthUtils.accessTokenKey) ||
!AuthUtils.getAuthInfo(AuthUtils.refreshTokenKey)
) {
    this.openNewRoute('/login');
    return;
}

this.operationId = this.getOperationIdFromUrl();
this.init().then();
}

private async init(): Promise<void> {
    if (!this.operationId) {
    this.openNewRoute('/operations');
    return;
}

this.nameInput = document.getElementById('input-name-edited') as HTMLInputElement;
this.categorySelect = document.getElementById('category-select') as HTMLSelectElement;
this.sumInput = document.getElementById('input-sum-edited') as HTMLInputElement;
this.dateInput = document.getElementById('date-input-edited') as HTMLInputElement;
this.commentsInput = document.getElementById('input-comments-edited') as HTMLInputElement;
this.createButton = document.getElementById('button-create') as HTMLButtonElement;

this.createButton.addEventListener('click', () => this.saveOperation());

// Загружаем категории и операцию
await this.loadCategories();
await this.loadOperation();
}

private getOperationIdFromUrl(): string | null {
    const params = new URLSearchParams(window.location.search);
    return params.get('id');
}

private async loadOperation(): Promise<void> {
    try {
        const result = await HttpUtils.request(`/operations/${this.operationId}`);

        if (result.error) {
    throw new Error(String(result.error));
}

this.fillForm(result.response);
} catch (error) {
    console.error('Ошибка загрузки операции:', error);
    this.openNewRoute('/operations');
}
}

private async loadCategories(): Promise<void> {
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

private populateCategorySelect(categories: { id: string; title: string }[], type: string): void {
    categories.forEach((category) => {
        const option = document.createElement('option');
        option.value = category.id;
        option.textContent = category.title;
        option.dataset.type = type;
        this.categorySelect.appendChild(option);
    });
}

private fillForm(operation: {
    type: 'income' | 'expense';
    category: string;
    amount: number;
    date: string;
    comment: string;
}): void {
    this.nameInput.value = operation.type === 'income' ? 'Доход' : 'Расход';

    // Проверяем, существует ли категория в списке
    const selectedCategory = Array.from(this.categorySelect.options).find(
        (option) => option.textContent === operation.category
    );

    if (selectedCategory) {
        this.categorySelect.value = selectedCategory.value;
    } else {
        console.warn(`Категория с названием "${operation.category}" не найдена в списке!`);
        this.categorySelect.value = ''; // Если категории нет в списке, оставляем пустым
    }

    this.sumInput.value = String(operation.amount ?? '');
    this.dateInput.value = operation.date ? new Date(operation.date).toISOString().split('T')[0] : '';
    this.commentsInput.value = operation.comment || '';
}

private saveOperation = (): void => {
    const categoryId = Number(this.categorySelect.value);

    // Формируем данные для обновления операции
    const updatedOperation = {
        amount: Number(this.sumInput.value),
        date: this.dateInput.value,
        comment: this.commentsInput.value,
        type: this.nameInput.value === 'Доход' ? 'income' : 'expense',
        category_id: categoryId,
    };

    // Проверяем, что все необходимые данные заполнены
    if (
        isNaN(updatedOperation.amount) ||
        !updatedOperation.date ||
        !updatedOperation.comment ||
        !updatedOperation.category_id
    ) {
        alert('Пожалуйста, заполните все обязательные поля.');
        return;
    }

    console.log('Отправляем обновленные данные:', updatedOperation);

    // Отправляем запрос на обновление
    HttpUtils.request(`/operations/${this.operationId}`, 'PUT', true, updatedOperation)
        .then((response) => {
            console.log('Операция обновлена:', response);
            this.openNewRoute('/operations');
        })
        .catch((error) => {
            console.error('Ошибка при сохранении операции:', error);
            if (error.response) {
                console.error('Ответ от сервера:', error.response);
                alert(`Ошибка: ${error.response.message}`);
            }
        });
};
}
