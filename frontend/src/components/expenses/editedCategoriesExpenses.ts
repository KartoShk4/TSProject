import { HttpUtils } from "../../utils/http-utils";
import { AuthUtils } from "../../utils/auth-utils";

export class EditedCategoriesExpenses {
    private readonly inputEdited: HTMLInputElement | null | undefined;
    private readonly btnEdited: HTMLButtonElement | null | undefined;
    private readonly openNewRoute: (route: string) => void;

    constructor(openNewRoute: (route: string) => void) {
        this.openNewRoute = openNewRoute;

        // Выполняем проверку на наличии токена, если его нет
        if (!AuthUtils.getAuthInfo(AuthUtils.accessTokenKey) || !AuthUtils.getAuthInfo(AuthUtils.refreshTokenKey)) {
            // Переводим пользователя на главную страницу
            openNewRoute('/login');
            return;
        }

        this.inputEdited = document.getElementById('input-edited') as HTMLInputElement;
        this.btnEdited = document.getElementById('btn-edited') as HTMLButtonElement;

        // Проверяем на null перед добавлением события
        if (this.btnEdited) {
            this.btnEdited.addEventListener('click', (): Promise<void> => this.editedExpensesCategories());
        }

        // Сразу после загрузки страницы, загружаем название редактируемого расхода
        this.setInitialCategoryTitle();
    }

    // Метод для извлечения ID из URL
    private getCategoryIdFromUrl(): string | null {
        const urlParams = new URLSearchParams(window.location.search);
        // Извлекаем значение параметра id
        return urlParams.get('id');
    }

    // Устанавливаем название из ID в input
    private setInitialCategoryTitle(): void {
        const urlParams = new URLSearchParams(window.location.search);
        const categoryTitle: string | null = urlParams.get('title');
        if (categoryTitle && this.inputEdited) {
            this.inputEdited.value = decodeURIComponent(categoryTitle);
        }
    }

    // Редактирование категории расходов
    private async editedExpensesCategories(): Promise<void> {
        const categoryId: string | null = this.getCategoryIdFromUrl(); // Получаем ID из URL
        if (!categoryId) {
            alert('Не удалось получить ID категории.');
            return;
        }

        // Убираем лишние пробелы из названия
        const newCategoryTitle: string = this.inputEdited?.value.trim() || '';

        // Если поле ввода пустое, выводим предупреждение
        if (!newCategoryTitle) {
            alert('Пожалуйста, введите новое название категории!');
            return;
        }

        // Отправляем запрос на сервер с новым названием категории
        const result = await HttpUtils.request(`/categories/expense/${categoryId}`, 'PUT', true, { title: newCategoryTitle });

        // Проверка на ошибку запроса
        if (result.error) {
            console.error('Ошибка при попытке редактировать категорию расходов:', result);
            alert('Возникла ошибка при редактировании категорий расходов. Пожалуйста, обратитесь в поддержку!');
            return;
        }

        // Обработка редиректа, если он присутствует в ответе
        if (result.redirect) {
            return this.openNewRoute(result.redirect); // Используем переданную функцию для редиректа
        }

        // Если всё прошло успешно, переводим пользователя на страницу расходов
        this.openNewRoute('/expenses'); // Перенаправляем на страницу с расходами
    }
}
